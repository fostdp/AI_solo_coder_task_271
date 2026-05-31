class AdvancedChemistryLab {
    constructor() {
        this.isRunning = false;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.progress = 0;
        this.chart = null;
        this.chartData = { labels: [], datasets: [] };
        this.currentChartType = 'conversion';
        this.lastChartUpdate = 0;
        this.chartUpdateInterval = 100;
        this.maxDataPoints = 100;
        
        this.currentReactionType = 'thiosulfate';
        this.reactions = this.initializeReactions();
        
        this.experimentSteps = [];
        this.currentStepIndex = -1;
        this.isDesignMode = false;
        
        this.titrationState = {
            isRunning: false,
            volumeAdded: 0,
            concentration: 0.1,
            speed: 'medium',
            endpointReached: false
        };
        
        this.separationState = {
            currentStep: 1,
            solidMass: 0,
            liquidVolume: 0,
            purity: 0,
            yield: 0,
            isAuto: false
        };
        
        this.initElements();
        this.initChart();
        this.bindEvents();
        this.updateReactionInfo();
    }

    initializeReactions() {
        return {
            thiosulfate: {
                name: '硫代硫酸钠与酸反应',
                equation: 'Na₂S₂O₃ + H₂SO₄ → Na₂SO₄ + S↓ + SO₂↑ + H₂O',
                phenomenon: '溶液逐渐变浑浊，产生淡黄色沉淀，有刺激性气味气体生成',
                colorStart: [200, 230, 255],
                colorEnd: [180, 160, 100],
                baseRate: 0.001,
                activationEnergy: 50,
                hasGas: true,
                hasPrecipitate: true
            },
            iodineClock: {
                name: '碘钟反应',
                equation: '2IO₃⁻ + 5HSO₃⁻ → I₂ + 5SO₄²⁻ + 3H⁺ + H₂O',
                phenomenon: '溶液突然由无色变为深蓝色，反应时间可精确控制',
                colorStart: [255, 255, 255],
                colorEnd: [30, 60, 120],
                baseRate: 0.0008,
                activationEnergy: 60,
                isClockReaction: true,
                delayTime: 5
            },
            enzyme: {
                name: '酶催化反应',
                equation: 'H₂O₂ --(过氧化氢酶)--→ 2H₂O + O₂↑',
                phenomenon: '产生大量气泡，反应速率受温度和pH影响显著',
                colorStart: [220, 240, 250],
                colorEnd: [200, 220, 230],
                baseRate: 0.002,
                activationEnergy: 30,
                optimalPH: 7.0,
                optimalTemp: 37,
                hasGas: true
            },
            precipitation: {
                name: '沉淀反应',
                equation: 'AgNO₃ + NaCl → AgCl↓ + NaNO₃',
                phenomenon: '立即产生白色沉淀，pH对沉淀溶解度有影响',
                colorStart: [255, 255, 255],
                colorEnd: [230, 230, 230],
                baseRate: 0.005,
                activationEnergy: 20,
                hasPrecipitate: true,
                isInstant: true
            }
        };
    }

    initElements() {
        this.concASlider = document.getElementById('concA');
        this.concBSlider = document.getElementById('concB');
        this.temperatureSlider = document.getElementById('temperature');
        this.catalystSlider = document.getElementById('catalyst');
        this.phSlider = document.getElementById('ph');
        this.reactionTypeSelect = document.getElementById('reaction-type');
        
        this.concAValue = document.getElementById('concA-value');
        this.concBValue = document.getElementById('concB-value');
        this.temperatureValue = document.getElementById('temperature-value');
        this.catalystValue = document.getElementById('catalyst-value');
        this.phValue = document.getElementById('ph-value');
        
        this.startBtn = document.getElementById('start-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.titrationBtn = document.getElementById('titration-btn');
        this.separationBtn = document.getElementById('separation-btn');
        
        this.reactionTimeDisplay = document.getElementById('reaction-time');
        this.reactionRateDisplay = document.getElementById('reaction-rate');
        this.conversionDisplay = document.getElementById('conversion');
        this.productAmountDisplay = document.getElementById('product-amount');
        
        this.liquid = document.getElementById('reaction-liquid');
        this.bubblesContainer = document.getElementById('bubbles');
        this.thermometerLiquid = document.getElementById('thermometer-liquid');
        this.tempLabel = document.getElementById('temp-label');
        this.phPointer = document.getElementById('ph-pointer');
        this.progressFill = document.getElementById('progress-fill');
        this.filterResidue = document.getElementById('filter-residue');
        
        this.reactionNameEl = document.getElementById('reaction-name');
        this.reactionEquationEl = document.getElementById('reaction-equation');
        this.phenomenonTextEl = document.getElementById('phenomenon-text');
        
        this.recordsBody = document.getElementById('records-body');
        this.loadRecordsBtn = document.getElementById('load-records-btn');
        
        this.titrationModal = document.getElementById('titration-modal');
        this.separationModal = document.getElementById('separation-modal');
        
        this.basicModePanel = document.getElementById('basic-mode');
        this.designModePanel = document.getElementById('design-mode');
        this.modeBtns = document.querySelectorAll('.mode-btn');
        
        this.stepsList = document.getElementById('steps-list');
        this.stepConfig = document.getElementById('step-config');
        this.stepTypeSelect = document.getElementById('step-type');
        this.addStepBtn = document.getElementById('add-step-btn');
        this.runDesignBtn = document.getElementById('run-design-btn');
        this.clearDesignBtn = document.getElementById('clear-design-btn');
        
        this.chartTabs = document.querySelectorAll('.chart-tab');
    }

    initChart() {
        const ctx = document.getElementById('main-chart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '转化率 (%)',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { title: { display: true, text: '时间 (s)' } },
                    y: { min: 0, max: 100, title: { display: true, text: '数值' } }
                },
                animation: { duration: 0 }
            }
        });
    }

    bindEvents() {
        this.concASlider.addEventListener('input', () => this.updateSliderDisplay('concA'));
        this.concBSlider.addEventListener('input', () => this.updateSliderDisplay('concB'));
        this.temperatureSlider.addEventListener('input', () => {
            let value = parseFloat(this.temperatureSlider.value);
            const validatedValue = this.validateTemperature(value);
            if (validatedValue !== value) {
                this.temperatureSlider.value = validatedValue;
            }
            this.updateSliderDisplay('temperature');
        });
        this.catalystSlider.addEventListener('input', () => this.updateSliderDisplay('catalyst'));
        this.phSlider.addEventListener('input', () => this.updateSliderDisplay('ph'));
        
        this.reactionTypeSelect.addEventListener('change', () => {
            this.currentReactionType = this.reactionTypeSelect.value;
            this.updateReactionInfo();
            this.resetReaction();
        });
        
        this.startBtn.addEventListener('click', () => this.startReaction());
        this.resetBtn.addEventListener('click', () => this.resetReaction());
        this.titrationBtn.addEventListener('click', () => this.openTitration());
        this.separationBtn.addEventListener('click', () => this.openSeparation());
        
        this.loadRecordsBtn.addEventListener('click', () => this.loadRecords());
        
        this.modeBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchMode(btn.dataset.mode));
        });
        
        this.addStepBtn.addEventListener('click', () => this.addStep());
        this.runDesignBtn.addEventListener('click', () => this.runDesign());
        this.clearDesignBtn.addEventListener('click', () => this.clearDesign());
        
        this.chartTabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchChart(tab.dataset.chart));
        });
        
        this.setupTitrationEvents();
        this.setupSeparationEvents();
    }

    updateSliderDisplay(type) {
        const slider = this[`${type}Slider`];
        const display = this[`${type}Value`];
        let value = parseFloat(slider.value);
        
        if (type === 'ph') {
            this.phPointer.style.left = ((value - 1) / 13 * 100) + '%';
        }
        if (type === 'temperature') {
            this.thermometerLiquid.style.height = (value / 100 * 100) + '%';
            this.tempLabel.textContent = value + '°C';
        }
        
        display.textContent = value.toFixed(type === 'ph' || type === 'temperature' ? 1 : 2);
    }

    validateTemperature(temp) {
        const boilingPoint = 100;
        const freezingPoint = 0;
        
        if (temp > boilingPoint) {
            this.showWarning(`温度 ${temp}°C 超过溶剂沸点 (${boilingPoint}°C)，已自动调整`);
            return boilingPoint;
        }
        if (temp < freezingPoint) {
            this.showWarning(`温度 ${temp}°C 低于溶剂凝固点 (${freezingPoint}°C)，已自动调整`);
            return freezingPoint;
        }
        return temp;
    }

    showWarning(message) {
        const warning = document.createElement('div');
        warning.className = 'warning-toast';
        warning.textContent = '⚠️ ' + message;
        document.body.appendChild(warning);
        
        setTimeout(() => {
            warning.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            warning.classList.remove('show');
            setTimeout(() => warning.remove(), 300);
        }, 3000);
    }

    updateReactionInfo() {
        const reaction = this.reactions[this.currentReactionType];
        this.reactionNameEl.textContent = reaction.name;
        this.reactionEquationEl.textContent = reaction.equation;
        this.phenomenonTextEl.textContent = reaction.phenomenon;
    }

    getReactionParameters() {
        return {
            concA: parseFloat(this.concASlider.value),
            concB: parseFloat(this.concBSlider.value),
            temperature: parseFloat(this.temperatureSlider.value),
            catalyst: parseInt(this.catalystSlider.value),
            ph: parseFloat(this.phSlider.value)
        };
    }

    calculateReactionRate(params) {
        const reaction = this.reactions[this.currentReactionType];
        let rate = reaction.baseRate;
        
        rate *= (params.concA + params.concB) / 0.2;
        
        const tempFactor = Math.pow(2, (params.temperature - 25) / 10);
        rate *= tempFactor;
        
        if (this.currentReactionType === 'enzyme') {
            const phDiff = Math.abs(params.ph - reaction.optimalPH);
            const phFactor = Math.max(0.1, 1 - phDiff * 0.3);
            rate *= phFactor;
            
            const tempDiff = Math.abs(params.temperature - reaction.optimalTemp);
            const tempOptFactor = Math.max(0.1, 1 - tempDiff * 0.05);
            rate *= tempOptFactor;
        }
        
        const catalystFactor = 1 + (params.catalyst * 0.25);
        rate *= catalystFactor;
        
        return rate;
    }

    startReaction() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.startTime = performance.now();
        this.progress = 0;
        
        this.chart.data.labels = [];
        this.chart.data.datasets[0].data = [];
        this.chart.update();
        
        this.startBtn.disabled = true;
        this.disableSliders(true);
        
        this.animate();
    }

    animate() {
        const params = this.getReactionParameters();
        const currentTime = performance.now();
        this.elapsedTime = (currentTime - this.startTime) / 1000;
        
        const rate = this.calculateReactionRate(params);
        this.progress = Math.min(this.progress + rate * 0.1, 1);
        
        this.updateDisplay();
        this.updateChart();
        this.updateLiquidAppearance();
        
        if (this.progress >= 1) {
            this.finishReaction();
        } else if (this.isRunning) {
            requestAnimationFrame(() => this.animate());
        }
    }

    updateDisplay() {
        const params = this.getReactionParameters();
        const rate = this.calculateReactionRate(params);
        
        this.reactionTimeDisplay.textContent = this.elapsedTime.toFixed(2) + ' s';
        this.reactionRateDisplay.textContent = rate.toFixed(5);
        this.conversionDisplay.textContent = Math.round(this.progress * 100) + '%';
        this.productAmountDisplay.textContent = (this.progress * Math.min(params.concA, params.concB) * 0.1).toFixed(4) + ' mol';
        this.progressFill.style.width = (this.progress * 100) + '%';
    }

    updateChart() {
        const now = performance.now();
        if (now - this.lastChartUpdate < this.chartUpdateInterval) {
            return;
        }
        this.lastChartUpdate = now;
        
        const timeLabel = this.elapsedTime.toFixed(1);
        const lastLabel = this.chart.data.labels[this.chart.data.labels.length - 1];
        
        if (lastLabel !== timeLabel) {
            if (this.chart.data.labels.length >= this.maxDataPoints) {
                this.chart.data.labels.shift();
                this.chart.data.datasets[0].data.shift();
            }
            
            this.chart.data.labels.push(timeLabel);
            
            let dataValue;
            switch (this.currentChartType) {
                case 'conversion':
                    dataValue = this.progress * 100;
                    break;
                case 'rate':
                    dataValue = this.calculateReactionRate(this.getReactionParameters()) * 1000;
                    break;
                case 'temperature':
                    dataValue = parseFloat(this.temperatureSlider.value);
                    break;
                case 'ph':
                    dataValue = parseFloat(this.phSlider.value);
                    break;
                default:
                    dataValue = this.progress * 100;
            }
            
            this.chart.data.datasets[0].data.push(dataValue);
            
            if (this.currentChartType === 'temperature' || this.currentChartType === 'ph') {
                this.chart.options.scales.y.max = this.currentChartType === 'ph' ? 14 : 100;
                this.chart.options.scales.y.min = this.currentChartType === 'ph' ? 0 : 0;
            } else {
                this.chart.options.scales.y.max = 100;
            }
            
            this.chart.update('none');
        }
    }

    updateLiquidAppearance() {
        const reaction = this.reactions[this.currentReactionType];
        const p = this.progress;
        
        const r = Math.round(reaction.colorStart[0] + (reaction.colorEnd[0] - reaction.colorStart[0]) * p);
        const g = Math.round(reaction.colorStart[1] + (reaction.colorEnd[1] - reaction.colorStart[1]) * p);
        const b = Math.round(reaction.colorStart[2] + (reaction.colorEnd[2] - reaction.colorStart[2]) * p);
        
        this.liquid.style.background = `rgba(${r}, ${g}, ${b}, ${0.7 + p * 0.2})`;
        
        if (reaction.hasGas && p > 0.1 && Math.random() > 0.7) {
            this.addBubble();
        }
        
        if (reaction.hasPrecipitate && p > 0.3) {
            this.filterResidue.style.opacity = Math.min((p - 0.3) * 2, 1);
        }
    }

    addBubble() {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        const size = 5 + Math.random() * 10;
        bubble.style.width = size + 'px';
        bubble.style.height = size + 'px';
        bubble.style.left = (10 + Math.random() * 80) + '%';
        bubble.style.bottom = '0';
        
        this.bubblesContainer.appendChild(bubble);
        
        setTimeout(() => bubble.remove(), 2000);
    }

    finishReaction() {
        this.isRunning = false;
        this.startBtn.disabled = false;
        this.disableSliders(false);
    }

    resetReaction() {
        this.isRunning = false;
        this.elapsedTime = 0;
        this.progress = 0;
        
        this.updateDisplay();
        
        this.chart.data.labels = [];
        this.chart.data.datasets[0].data = [];
        this.chart.update();
        
        const reaction = this.reactions[this.currentReactionType];
        this.liquid.style.background = `rgba(${reaction.colorStart[0]}, ${reaction.colorStart[1]}, ${reaction.colorStart[2]}, 0.7)`;
        
        this.bubblesContainer.innerHTML = '';
        this.filterResidue.style.opacity = 0;
        
        this.startBtn.disabled = false;
        this.disableSliders(false);
    }

    disableSliders(disabled) {
        this.concASlider.disabled = disabled;
        this.concBSlider.disabled = disabled;
        this.temperatureSlider.disabled = disabled;
        this.catalystSlider.disabled = disabled;
        this.phSlider.disabled = disabled;
    }

    switchChart(chartType) {
        this.currentChartType = chartType;
        
        this.chartTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.chart === chartType);
        });
        
        const labels = {
            conversion: '转化率 (%)',
            rate: '反应速率 (×10⁻³)',
            temperature: '温度 (°C)',
            ph: 'pH值'
        };
        
        this.chart.data.datasets[0].label = labels[chartType];
        this.chart.data.labels = [];
        this.chart.data.datasets[0].data = [];
        this.chart.update();
    }

    switchMode(mode) {
        this.isDesignMode = mode === 'design';
        
        this.modeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        this.basicModePanel.classList.toggle('hidden', mode !== 'basic');
        this.designModePanel.classList.toggle('hidden', mode !== 'design');
    }

    addStep() {
        const type = this.stepTypeSelect.value;
        const typeNames = {
            reaction: '化学反应',
            heating: '加热',
            cooling: '冷却',
            titration: '滴定',
            filtration: '过滤',
            centrifugation: '离心'
        };
        
        const step = {
            id: Date.now(),
            type: type,
            name: typeNames[type],
            params: this.getDefaultParams(type)
        };
        
        this.experimentSteps.push(step);
        this.renderStepsList();
    }

    getDefaultParams(type) {
        switch (type) {
            case 'reaction':
                return { reactionType: 'thiosulfate', duration: 10, temp: 25 };
            case 'heating':
                return { targetTemp: 80, duration: 5 };
            case 'cooling':
                return { targetTemp: 5, duration: 5 };
            case 'titration':
                return { concentration: 0.1, volume: 25 };
            case 'filtration':
                return { filterType: 'qualitative', duration: 3 };
            case 'centrifugation':
                return { speed: 3000, duration: 5 };
            default:
                return {};
        }
    }

    renderStepsList() {
        this.stepsList.innerHTML = this.experimentSteps.map((step, index) => `
            <div class="step-item ${index === this.currentStepIndex ? 'active' : ''}" 
                 onclick="lab.selectStep(${index})">
                <div class="step-info">
                    <strong>${index + 1}.</strong> ${step.name}
                </div>
                <div class="step-actions">
                    <button onclick="event.stopPropagation(); lab.moveStep(${index}, -1)">↑</button>
                    <button onclick="event.stopPropagation(); lab.moveStep(${index}, 1)">↓</button>
                    <button onclick="event.stopPropagation(); lab.removeStep(${index})">×</button>
                </div>
            </div>
        `).join('');
    }

    selectStep(index) {
        this.currentStepIndex = index;
        this.renderStepsList();
        this.renderStepConfig();
    }

    renderStepConfig() {
        if (this.currentStepIndex < 0 || !this.experimentSteps[this.currentStepIndex]) {
            this.stepConfig.innerHTML = '<p class="hint">选择一个步骤进行配置</p>';
            return;
        }
        
        const step = this.experimentSteps[this.currentStepIndex];
        let configHTML = `<h4>配置: ${step.name}</h4>`;
        
        switch (step.type) {
            case 'reaction':
                configHTML += `
                    <div class="config-group">
                        <label>反应类型:</label>
                        <select onchange="lab.updateStepParam('reactionType', this.value)" class="form-select">
                            <option value="thiosulfate" ${step.params.reactionType === 'thiosulfate' ? 'selected' : ''}>硫代硫酸钠与酸</option>
                            <option value="iodineClock" ${step.params.reactionType === 'iodineClock' ? 'selected' : ''}>碘钟反应</option>
                            <option value="enzyme" ${step.params.reactionType === 'enzyme' ? 'selected' : ''}>酶催化</option>
                        </select>
                    </div>
                    <div class="config-group">
                        <label>持续时间: ${step.params.duration}s</label>
                        <input type="range" min="1" max="60" value="${step.params.duration}" 
                               onchange="lab.updateStepParam('duration', parseInt(this.value))">
                    </div>
                `;
                break;
            case 'heating':
            case 'cooling':
                configHTML += `
                    <div class="config-group">
                        <label>目标温度: ${step.params.targetTemp}°C</label>
                        <input type="range" min="0" max="100" value="${step.params.targetTemp}" 
                               onchange="lab.updateStepParam('targetTemp', parseInt(this.value))">
                    </div>
                `;
                break;
            case 'titration':
                configHTML += `
                    <div class="config-group">
                        <label>滴定剂浓度: ${step.params.concentration} mol/L</label>
                        <input type="range" min="0.01" max="1" step="0.01" value="${step.params.concentration}" 
                               onchange="lab.updateStepParam('concentration', parseFloat(this.value))">
                    </div>
                `;
                break;
            case 'centrifugation':
                configHTML += `
                    <div class="config-group">
                        <label>转速: ${step.params.speed} rpm</label>
                        <input type="range" min="1000" max="10000" step="500" value="${step.params.speed}" 
                               onchange="lab.updateStepParam('speed', parseInt(this.value))">
                    </div>
                `;
                break;
        }
        
        this.stepConfig.innerHTML = configHTML;
    }

    updateStepParam(param, value) {
        if (this.currentStepIndex >= 0 && this.experimentSteps[this.currentStepIndex]) {
            if (param === 'targetTemp' || param === 'temp') {
                const validatedValue = this.validateTemperature(value);
                if (validatedValue !== value) {
                    this.experimentSteps[this.currentStepIndex].params[param] = validatedValue;
                    this.renderStepConfig();
                    return;
                }
            }
            this.experimentSteps[this.currentStepIndex].params[param] = value;
            this.renderStepConfig();
        }
    }

    moveStep(index, direction) {
        const newIndex = index + direction;
        if (newIndex >= 0 && newIndex < this.experimentSteps.length) {
            [this.experimentSteps[index], this.experimentSteps[newIndex]] = 
            [this.experimentSteps[newIndex], this.experimentSteps[index]];
            this.renderStepsList();
        }
    }

    removeStep(index) {
        this.experimentSteps.splice(index, 1);
        if (this.currentStepIndex >= this.experimentSteps.length) {
            this.currentStepIndex = this.experimentSteps.length - 1;
        }
        this.renderStepsList();
        this.renderStepConfig();
    }

    clearDesign() {
        this.experimentSteps = [];
        this.currentStepIndex = -1;
        this.renderStepsList();
        this.renderStepConfig();
    }

    async runDesign() {
        if (this.experimentSteps.length === 0) {
            alert('请先添加实验步骤！');
            return;
        }
        
        this.runDesignBtn.disabled = true;
        
        for (let i = 0; i < this.experimentSteps.length; i++) {
            this.currentStepIndex = i;
            this.renderStepsList();
            await this.executeStep(this.experimentSteps[i]);
        }
        
        this.currentStepIndex = -1;
        this.renderStepsList();
        this.runDesignBtn.disabled = false;
        alert('实验流程执行完成！');
    }

    executeStep(step) {
        return new Promise(resolve => {
            const duration = (step.params.duration || 3) * 1000;
            const startTime = Date.now();
            
            if (step.type === 'heating' || step.type === 'cooling') {
                step.params.targetTemp = this.validateTemperature(step.params.targetTemp || 25);
            }
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                if (step.type === 'heating') {
                    const targetTemp = step.params.targetTemp || 80;
                    const currentTemp = 25 + (targetTemp - 25) * progress;
                    this.temperatureSlider.value = currentTemp;
                    this.updateSliderDisplay('temperature');
                } else if (step.type === 'cooling') {
                    const targetTemp = step.params.targetTemp || 5;
                    const currentTemp = 25 - (25 - targetTemp) * progress;
                    this.temperatureSlider.value = currentTemp;
                    this.updateSliderDisplay('temperature');
                }
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            
            animate();
        });
    }

    setupTitrationEvents() {
        document.getElementById('close-titration').addEventListener('click', () => {
            this.titrationModal.classList.remove('active');
            this.stopTitration();
        });
        
        document.getElementById('titrant-conc').addEventListener('input', (e) => {
            this.titrationState.concentration = parseFloat(e.target.value);
            document.getElementById('titrant-conc-display').textContent = e.target.value;
        });
        
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.titrationState.speed = btn.dataset.speed;
            });
        });
        
        document.getElementById('start-titration-btn').addEventListener('click', () => this.startTitration());
        document.getElementById('stop-titration-btn').addEventListener('click', () => this.stopTitration());
        document.getElementById('reset-titration-btn').addEventListener('click', () => this.resetTitration());
    }

    openTitration() {
        this.titrationModal.classList.add('active');
        this.resetTitration();
    }

    startTitration() {
        if (this.titrationState.isRunning) return;
        this.titrationState.isRunning = true;
        document.querySelector('.magnetic-stirrer').style.animationPlayState = 'running';
        this.titrate();
    }

    titrate() {
        if (!this.titrationState.isRunning) return;
        
        const speedFactors = { slow: 0.05, medium: 0.15, fast: 0.3 };
        this.titrationState.volumeAdded += speedFactors[this.titrationState.speed];
        
        document.getElementById('titrated-volume').textContent = this.titrationState.volumeAdded.toFixed(2);
        
        const buretteLiquid = document.getElementById('burette-liquid-large');
        buretteLiquid.style.height = Math.max(10, 90 - this.titrationState.volumeAdded * 2) + '%';
        
        const flaskLiquid = document.getElementById('flask-liquid');
        flaskLiquid.style.height = Math.min(70, 60 + this.titrationState.volumeAdded * 0.3) + '%';
        
        if (this.titrationState.volumeAdded > 20) {
            const colorIntensity = Math.min((this.titrationState.volumeAdded - 20) * 10, 255);
            flaskLiquid.style.background = `rgba(${180 + colorIntensity * 0.3}, ${180 - colorIntensity * 0.5}, ${180 - colorIntensity * 0.7}, 0.6)`;
        }
        
        const calculatedConc = (this.titrationState.volumeAdded * this.titrationState.concentration) / 25;
        document.getElementById('calculated-conc').textContent = calculatedConc.toFixed(4);
        
        if (this.titrationState.volumeAdded < 50) {
            setTimeout(() => this.titrate(), 50);
        } else {
            this.stopTitration();
        }
    }

    stopTitration() {
        this.titrationState.isRunning = false;
        document.querySelector('.magnetic-stirrer').style.animationPlayState = 'paused';
    }

    resetTitration() {
        this.stopTitration();
        this.titrationState.volumeAdded = 0;
        this.titrationState.endpointReached = false;
        
        document.getElementById('titrated-volume').textContent = '0.00';
        document.getElementById('calculated-conc').textContent = '0.00';
        document.getElementById('burette-liquid-large').style.height = '90%';
        document.getElementById('flask-liquid').style.height = '60%';
        document.getElementById('flask-liquid').style.background = 'rgba(241, 196, 15, 0.4)';
    }

    setupSeparationEvents() {
        document.getElementById('close-separation').addEventListener('click', () => {
            this.separationModal.classList.remove('active');
            this.resetSeparation();
        });
        
        document.getElementById('next-separation-btn').addEventListener('click', () => this.nextSeparationStep());
        document.getElementById('auto-separation-btn').addEventListener('click', () => this.autoSeparation());
        document.getElementById('reset-separation-btn').addEventListener('click', () => this.resetSeparation());
    }

    openSeparation() {
        this.separationModal.classList.add('active');
        this.resetSeparation();
    }

    nextSeparationStep() {
        if (this.separationState.currentStep < 5) {
            this.executeSeparationStep(this.separationState.currentStep + 1);
            this.separationState.currentStep++;
            this.updateSeparationSteps();
        }
    }

    executeSeparationStep(step) {
        switch (step) {
            case 2:
                document.getElementById('separation-residue').style.opacity = 0.7;
                document.getElementById('filtrate-liquid').style.height = '60%';
                break;
            case 3:
                document.getElementById('filter-view').classList.add('hidden');
                document.getElementById('centrifuge-view').classList.remove('hidden');
                document.getElementById('centrifuge-rotor').style.animationPlayState = 'running';
                setTimeout(() => {
                    document.getElementById('centrifuge-rotor').style.animationPlayState = 'paused';
                }, 2000);
                break;
            case 4:
                document.getElementById('centrifuge-view').classList.add('hidden');
                document.getElementById('dry-view').classList.remove('hidden');
                document.getElementById('oven-heat').style.opacity = 1;
                break;
            case 5:
                document.getElementById('oven-heat').style.opacity = 0;
                this.calculateSeparationResults();
                break;
        }
    }

    calculateSeparationResults() {
        const reactionProgress = this.progress || 0.8;
        this.separationState.solidMass = (0.5 + Math.random() * 0.5) * reactionProgress;
        this.separationState.liquidVolume = 20 + Math.random() * 5;
        this.separationState.purity = 85 + Math.random() * 10;
        this.separationState.yield = 75 + Math.random() * 15;
        
        document.getElementById('solid-mass').textContent = this.separationState.solidMass.toFixed(3) + ' g';
        document.getElementById('liquid-volume').textContent = this.separationState.liquidVolume.toFixed(1) + ' mL';
        document.getElementById('separation-purity').textContent = Math.round(this.separationState.purity) + '%';
        document.getElementById('separation-yield').textContent = Math.round(this.separationState.yield) + '%';
    }

    async autoSeparation() {
        this.separationState.isAuto = true;
        document.getElementById('auto-separation-btn').disabled = true;
        
        for (let i = this.separationState.currentStep; i <= 5; i++) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            this.nextSeparationStep();
        }
        
        this.separationState.isAuto = false;
        document.getElementById('auto-separation-btn').disabled = false;
    }

    resetSeparation() {
        this.separationState.currentStep = 1;
        this.separationState.isAuto = false;
        
        document.getElementById('filter-view').classList.remove('hidden');
        document.getElementById('centrifuge-view').classList.add('hidden');
        document.getElementById('dry-view').classList.add('hidden');
        
        document.getElementById('separation-residue').style.opacity = 0;
        document.getElementById('filtrate-liquid').style.height = '0%';
        document.getElementById('oven-heat').style.opacity = 0;
        
        document.getElementById('solid-mass').textContent = '0.00 g';
        document.getElementById('liquid-volume').textContent = '0.00 mL';
        document.getElementById('separation-purity').textContent = '0%';
        document.getElementById('separation-yield').textContent = '0%';
        
        this.updateSeparationSteps();
    }

    updateSeparationSteps() {
        document.querySelectorAll('.separation-step').forEach((stepEl, index) => {
            const stepNum = index + 1;
            stepEl.classList.remove('active', 'completed');
            
            if (stepNum < this.separationState.currentStep) {
                stepEl.classList.add('completed');
            } else if (stepNum === this.separationState.currentStep) {
                stepEl.classList.add('active');
            }
        });
    }

    async saveRecord() {
        if (this.elapsedTime === 0 && this.progress === 0) {
            alert('请先进行实验！');
            return;
        }

        const params = this.getReactionParameters();
        const record = {
            reactionType: this.currentReactionType,
            concentrationA: params.concA,
            concentrationB: params.concB,
            temperature: params.temperature,
            ph: params.ph,
            catalyst: params.catalyst,
            reactionTime: parseFloat(this.elapsedTime.toFixed(2)),
            reactionRate: parseFloat(this.calculateReactionRate(params).toFixed(5)),
            conversion: Math.round(this.progress * 100)
        };

        try {
            const response = await fetch('/api/records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(record)
            });
            
            const result = await response.json();
            if (result.success) {
                alert('记录保存成功！');
                this.loadRecords();
            }
        } catch (error) {
            console.error('保存记录失败:', error);
            alert('保存失败！');
        }
    }

    async loadRecords() {
        try {
            const response = await fetch('/api/records');
            const result = await response.json();
            if (result.success) {
                this.renderRecords(result.records);
            }
        } catch (error) {
            console.error('加载记录失败:', error);
        }
    }

    renderRecords(records) {
        const typeNames = {
            thiosulfate: '硫代硫酸钠',
            iodineClock: '碘钟反应',
            enzyme: '酶催化',
            precipitation: '沉淀反应'
        };
        
        this.recordsBody.innerHTML = records.map((record, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${typeNames[record.reactionType] || record.reactionType}</td>
                <td>${record.concentrationA || record.concentration || '-'}</td>
                <td>${record.concentrationB || '-'}</td>
                <td>${record.temperature}°C</td>
                <td>${record.ph || '-'}</td>
                <td>${record.catalyst}</td>
                <td>${record.reactionTime}s</td>
                <td>${record.conversion || '-'}%</td>
                <td><button class="btn btn-danger" style="padding:3px 8px;font-size:11px" 
                            onclick="lab.deleteRecord(${record.id})">删除</button></td>
            </tr>
        `).join('');
    }

    async deleteRecord(id) {
        if (!confirm('确定删除？')) return;
        try {
            await fetch(`/api/records/${id}`, { method: 'DELETE' });
            this.loadRecords();
        } catch (error) {
            console.error('删除失败:', error);
        }
    }
}

const lab = new AdvancedChemistryLab();
