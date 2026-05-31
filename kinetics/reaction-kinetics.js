class ReactionKinetics {
    constructor() {
        this.R = 8.314;
    }

    calculateRate(reactionType, params) {
        const { concentrationA, concentrationB, temperature, catalyst = 0, ph = 7 } = params;
        
        const baseRates = {
            thiosulfate: 0.001,
            iodineClock: 0.0008,
            enzyme: 0.002,
            precipitation: 0.005
        };
        
        let rate = baseRates[reactionType] || 0.001;
        rate *= (concentrationA + concentrationB) / 0.2;
        const tempFactor = Math.pow(2, (temperature - 25) / 10);
        rate *= tempFactor;
        
        if (reactionType === 'enzyme') {
            const optimalPH = 7.0;
            const optimalTemp = 37;
            const phFactor = Math.max(0.1, 1 - Math.abs(ph - optimalPH) * 0.3);
            const tempOptFactor = Math.max(0.1, 1 - Math.abs(temperature - optimalTemp) * 0.05);
            rate *= phFactor * tempOptFactor;
        }
        
        const catalystFactor = 1 + (catalyst * 0.25);
        rate *= catalystFactor;
        
        return rate;
    }

    arrheniusEquation(A, Ea, T) {
        return A * Math.exp(-Ea / (this.R * T));
    }

    calculateActivationEnergy(rates, temperatures) {
        if (rates.length !== temperatures.length || rates.length < 2) {
            throw new Error('需要至少2组数据');
        }
        
        const lnRates = rates.map(r => Math.log(r));
        const invTemps = temperatures.map(t => 1 / t);
        
        const n = lnRates.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        
        for (let i = 0; i < n; i++) {
            sumX += invTemps[i];
            sumY += lnRates[i];
            sumXY += invTemps[i] * lnRates[i];
            sumX2 += invTemps[i] * invTemps[i];
        }
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const Ea = -slope * this.R;
        
        const intercept = (sumY - slope * sumX) / n;
        const A = Math.exp(intercept);
        
        let r2 = 0;
        const yMean = sumY / n;
        let ssTot = 0, ssRes = 0;
        for (let i = 0; i < n; i++) {
            const yPred = slope * invTemps[i] + intercept;
            ssTot += Math.pow(lnRates[i] - yMean, 2);
            ssRes += Math.pow(lnRates[i] - yPred, 2);
        }
        r2 = 1 - (ssRes / ssTot);
        
        return {
            Ea: Ea,
            Ea_kJmol: Ea / 1000,
            A: A,
            slope: slope,
            intercept: intercept,
            r2: r2,
            lnRates: lnRates,
            invTemps: invTemps
        };
    }

    zeroOrderRate(k, t, c0) {
        return c0 - k * t;
    }

    firstOrderRate(k, t, c0) {
        return c0 * Math.exp(-k * t);
    }

    secondOrderRate(k, t, c0) {
        return c0 / (1 + k * c0 * t);
    }

    nthOrderRate(k, t, c0, n) {
        if (n === 1) {
            return this.firstOrderRate(k, t, c0);
        }
        const power = 1 - n;
        return Math.pow(Math.pow(c0, power) - (n - 1) * k * t, 1 / power);
    }

    determineReactionOrder(timePoints, concentrations) {
        if (timePoints.length !== concentrations.length || timePoints.length < 3) {
            throw new Error('需要至少3组数据');
        }
        
        const c0 = concentrations[0];
        const results = [];
        
        const zeroOrderData = concentrations.map(c => c);
        const zeroResult = this.linearRegression(timePoints, zeroOrderData);
        results.push({ order: 0, r2: zeroResult.r2, k: -zeroResult.slope });
        
        const firstOrderData = concentrations.map(c => Math.log(c));
        const firstResult = this.linearRegression(timePoints, firstOrderData);
        results.push({ order: 1, r2: firstResult.r2, k: -firstResult.slope });
        
        const secondOrderData = concentrations.map(c => 1 / c);
        const secondResult = this.linearRegression(timePoints, secondOrderData);
        results.push({ order: 2, r2: secondResult.r2, k: secondResult.slope });
        
        results.sort((a, b) => b.r2 - a.r2);
        
        return {
            bestFit: results[0],
            allFits: results,
            details: {
                zeroOrder: zeroResult,
                firstOrder: firstResult,
                secondOrder: secondResult
            }
        };
    }

    linearRegression(x, y) {
        const n = x.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
        
        for (let i = 0; i < n; i++) {
            sumX += x[i];
            sumY += y[i];
            sumXY += x[i] * y[i];
            sumX2 += x[i] * x[i];
            sumY2 += y[i] * y[i];
        }
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        const yMean = sumY / n;
        let ssTot = 0, ssRes = 0;
        for (let i = 0; i < n; i++) {
            const yPred = slope * x[i] + intercept;
            ssTot += Math.pow(y[i] - yMean, 2);
            ssRes += Math.pow(y[i] - yPred, 2);
        }
        const r2 = 1 - (ssRes / ssTot);
        
        return {
            slope: slope,
            intercept: intercept,
            r2: r2,
            ssTot: ssTot,
            ssRes: ssRes
        };
    }

    polynomialRegression(x, y, degree = 2) {
        const n = x.length;
        const m = degree + 1;
        const X = [];
        
        for (let i = 0; i < n; i++) {
            const row = [];
            for (let j = 0; j < m; j++) {
                row.push(Math.pow(x[i], j));
            }
            X.push(row);
        }
        
        const Xt = this.transposeMatrix(X);
        const XtX = this.multiplyMatrices(Xt, X);
        const XtY = this.multiplyMatrices(Xt, y.map(v => [v]));
        
        const coefficients = this.solveLinearSystem(XtX, XtY);
        
        let yPred = [];
        for (let i = 0; i < n; i++) {
            let pred = 0;
            for (let j = 0; j < m; j++) {
                pred += coefficients[j] * Math.pow(x[i], j);
            }
            yPred.push(pred);
        }
        
        const yMean = y.reduce((a, b) => a + b, 0) / n;
        let ssTot = 0, ssRes = 0;
        for (let i = 0; i < n; i++) {
            ssTot += Math.pow(y[i] - yMean, 2);
            ssRes += Math.pow(y[i] - yPred[i], 2);
        }
        const r2 = 1 - (ssRes / ssTot);
        
        return {
            coefficients: coefficients,
            r2: r2,
            predicted: yPred
        };
    }

    transposeMatrix(m) {
        return m[0].map((_, i) => m.map(row => row[i]));
    }

    multiplyMatrices(a, b) {
        const result = [];
        for (let i = 0; i < a.length; i++) {
            result[i] = [];
            for (let j = 0; j < b[0].length; j++) {
                let sum = 0;
                for (let k = 0; k < a[0].length; k++) {
                    sum += a[i][k] * b[k][j];
                }
                result[i][j] = sum;
            }
        }
        return result;
    }

    solveLinearSystem(A, b) {
        const n = A.length;
        const aug = A.map((row, i) => [...row, b[i][0]]);
        
        for (let i = 0; i < n; i++) {
            let maxRow = i;
            for (let j = i + 1; j < n; j++) {
                if (Math.abs(aug[j][i]) > Math.abs(aug[maxRow][i])) {
                    maxRow = j;
                }
            }
            [aug[i], aug[maxRow]] = [aug[maxRow], aug[i]];
            
            for (let j = i + 1; j < n; j++) {
                const factor = aug[j][i] / aug[i][i];
                for (let k = i; k <= n; k++) {
                    aug[j][k] -= factor * aug[i][k];
                }
            }
        }
        
        const x = new Array(n).fill(0);
        for (let i = n - 1; i >= 0; i--) {
            x[i] = aug[i][n];
            for (let j = i + 1; j < n; j++) {
                x[i] -= aug[i][j] * x[j];
            }
            x[i] /= aug[i][i];
        }
        
        return x;
    }

    exponentialFit(x, y) {
        const lnY = y.map(v => Math.log(v));
        const linearFit = this.linearRegression(x, lnY);
        
        const a = Math.exp(linearFit.intercept);
        const b = linearFit.slope;
        
        const predicted = x.map(v => a * Math.exp(b * v));
        
        const yMean = y.reduce((a, b) => a + b, 0) / y.length;
        let ssTot = 0, ssRes = 0;
        for (let i = 0; i < x.length; i++) {
            ssTot += Math.pow(y[i] - yMean, 2);
            ssRes += Math.pow(y[i] - predicted[i], 2);
        }
        const r2 = 1 - (ssRes / ssTot);
        
        return {
            a: a,
            b: b,
            r2: r2,
            equation: `y = ${a.toFixed(4)} * e^(${b.toFixed(6)} * x)`,
            predicted: predicted
        };
    }

    generateReactionData(reactionType, params, duration = 100, interval = 1) {
        const data = { time: [], concentration: [], rate: [] };
        const k = this.calculateRate(reactionType, params);
        const c0 = (params.concentrationA + params.concentrationB) / 2;
        
        for (let t = 0; t <= duration; t += interval) {
            data.time.push(t);
            
            let conc;
            if (reactionType === 'precipitation') {
                conc = this.secondOrderRate(k, t, c0);
            } else if (reactionType === 'enzyme') {
                conc = this.firstOrderRate(k, t, c0);
            } else {
                conc = c0 * Math.exp(-k * t);
            }
            
            data.concentration.push(Math.max(0, conc));
            data.rate.push(k * conc);
        }
        
        return data;
    }

    calculateRateConstant(order, timePoints, concentrations) {
        const c0 = concentrations[0];
        const n = timePoints.length;
        
        switch (order) {
            case 0:
                const zeroData = concentrations.map(c => c);
                const zeroFit = this.linearRegression(timePoints, zeroData);
                return -zeroFit.slope;
            case 1:
                const firstData = concentrations.map(c => Math.log(c));
                const firstFit = this.linearRegression(timePoints, firstData);
                return -firstFit.slope;
            case 2:
                const secondData = concentrations.map(c => 1 / c);
                const secondFit = this.linearRegression(timePoints, secondData);
                return secondFit.slope;
            default:
                throw new Error('不支持的反应级数');
        }
    }

    calculateHalfLife(order, k, c0) {
        switch (order) {
            case 0:
                return c0 / (2 * k);
            case 1:
                return Math.log(2) / k;
            case 2:
                return 1 / (k * c0);
            default:
                throw new Error('不支持的反应级数');
        }
    }

    validateRateEquation(order, timePoints, concentrations, tolerance = 0.1) {
        const k = this.calculateRateConstant(order, timePoints, concentrations);
        const c0 = concentrations[0];
        
        const predicted = timePoints.map(t => {
            switch (order) {
                case 0: return this.zeroOrderRate(k, t, c0);
                case 1: return this.firstOrderRate(k, t, c0);
                case 2: return this.secondOrderRate(k, t, c0);
                default: return null;
            }
        });
        
        const errors = concentrations.map((c, i) => {
            if (c === 0) return 0;
            return Math.abs(c - predicted[i]) / c;
        });
        const maxError = Math.max(...errors);
        const avgError = errors.reduce((a, b) => a + b, 0) / errors.length;
        
        let r2;
        const yMean = concentrations.reduce((a, b) => a + b, 0) / concentrations.length;
        let ssTot = 0, ssRes = 0;
        for (let i = 0; i < concentrations.length; i++) {
            ssTot += Math.pow(concentrations[i] - yMean, 2);
            ssRes += Math.pow(concentrations[i] - predicted[i], 2);
        }
        r2 = 1 - (ssRes / ssTot);
        
        return {
            isValid: maxError < tolerance,
            k: k,
            maxError: maxError,
            avgError: avgError,
            r2: r2,
            predicted: predicted,
            actual: concentrations
        };
    }
}

module.exports = ReactionKinetics;
