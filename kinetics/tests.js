const ReactionKinetics = require('./reaction-kinetics');
const kinetics = new ReactionKinetics();

const results = {
    passed: 0,
    failed: 0,
    tests: []
};

function test(name, testFn) {
    try {
        const result = testFn();
        if (result.passed) {
            results.passed++;
            console.log(`✅ ${name}`);
        } else {
            results.failed++;
            console.log(`❌ ${name}`);
            console.log(`   错误: ${result.error}`);
        }
        results.tests.push({ name, passed: result.passed, details: result.details });
    } catch (e) {
        results.failed++;
        console.log(`❌ ${name}`);
        console.log(`   异常: ${e.message}`);
        results.tests.push({ name, passed: false, error: e.message });
    }
}

function assertAlmostEqual(a, b, tolerance = 0.01, message = '') {
    if (Math.abs(a - b) > tolerance) {
        throw new Error(`${message} 期望 ${a} ≈ ${b}`);
    }
}

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║               反应动力学模型与曲线拟合测试套件                  ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log('═══════════════════════════════════════════════════');
console.log('测试组 1: 速率方程验证测试');
console.log('═══════════════════════════════════════════════════\n');

test('零级反应速率方程验证', () => {
    const k = 0.05;
    const c0 = 1.0;
    const timePoints = [0, 5, 10, 15, 20];
    const concentrations = timePoints.map(t => kinetics.zeroOrderRate(k, t, c0));
    
    const validation = kinetics.validateRateEquation(0, timePoints, concentrations, 0.001);
    
    return {
        passed: validation.isValid && validation.r2 > 0.99,
        details: { k: validation.k, maxError: validation.maxError, r2: validation.r2 }
    };
});

test('一级反应速率方程验证', () => {
    const k = 0.02;
    const c0 = 1.0;
    const timePoints = [0, 10, 20, 30, 40, 50];
    const concentrations = timePoints.map(t => kinetics.firstOrderRate(k, t, c0));
    
    const validation = kinetics.validateRateEquation(1, timePoints, concentrations, 0.001);
    
    return {
        passed: validation.isValid && validation.r2 > 0.99,
        details: { k: validation.k, maxError: validation.maxError, r2: validation.r2 }
    };
});

test('二级反应速率方程验证', () => {
    const k = 0.01;
    const c0 = 1.0;
    const timePoints = [0, 10, 20, 30, 40, 50];
    const concentrations = timePoints.map(t => kinetics.secondOrderRate(k, t, c0));
    
    const validation = kinetics.validateRateEquation(2, timePoints, concentrations, 0.001);
    
    return {
        passed: validation.isValid && validation.r2 > 0.99,
        details: { k: validation.k, maxError: validation.maxError, r2: validation.r2 }
    };
});

test('硫代硫酸钠反应速率计算', () => {
    const params = {
        concentrationA: 0.1,
        concentrationB: 0.1,
        temperature: 25,
        catalyst: 0
    };
    
    const rate = kinetics.calculateRate('thiosulfate', params);
    
    return {
        passed: rate > 0 && rate < 0.01,
        details: { rate: rate }
    };
});

test('碘钟反应速率计算', () => {
    const params = {
        concentrationA: 0.05,
        concentrationB: 0.05,
        temperature: 25,
        catalyst: 1
    };
    
    const rate = kinetics.calculateRate('iodineClock', params);
    
    return {
        passed: rate > 0 && rate < 0.01,
        details: { rate: rate }
    };
});

test('酶催化反应pH影响', () => {
    const params = {
        concentrationA: 0.1,
        concentrationB: 0.1,
        temperature: 37,
        catalyst: 5,
        ph: 7.0
    };
    
    const rateOptimal = kinetics.calculateRate('enzyme', params);
    
    params.ph = 3.0;
    const rateLowPh = kinetics.calculateRate('enzyme', params);
    
    return {
        passed: rateOptimal > rateLowPh,
        details: { optimalRate: rateOptimal, lowPhRate: rateLowPh }
    };
});

console.log('\n═══════════════════════════════════════════════════');
console.log('测试组 2: 阿伦尼乌斯公式与活化能计算');
console.log('═══════════════════════════════════════════════════\n');

test('阿伦尼乌斯方程计算', () => {
    const A = 1e10;
    const Ea = 50000;
    const T = 298;
    
    const k = kinetics.arrheniusEquation(A, Ea, T);
    
    return {
        passed: k > 0,
        details: { k: k }
    };
});

test('温度升高反应速率增加', () => {
    const A = 1e10;
    const Ea = 50000;
    
    const k1 = kinetics.arrheniusEquation(A, Ea, 283);
    const k2 = kinetics.arrheniusEquation(A, Ea, 298);
    const k3 = kinetics.arrheniusEquation(A, Ea, 313);
    
    return {
        passed: k1 < k2 && k2 < k3,
        details: { k283: k1, k298: k2, k313: k3 }
    };
});

test('活化能计算准确性', () => {
    const A = 1e10;
    const Ea_true = 50000;
    const temperatures = [283, 293, 303, 313, 323];
    const rates = temperatures.map(T => kinetics.arrheniusEquation(A, Ea_true, T));
    
    const result = kinetics.calculateActivationEnergy(rates, temperatures);
    
    const errorPercent = Math.abs(result.Ea - Ea_true) / Ea_true * 100;
    
    return {
        passed: errorPercent < 5 && result.r2 > 0.99,
        details: { 
            Ea_calculated: result.Ea_kJmol.toFixed(2),
            Ea_true: Ea_true / 1000,
            errorPercent: errorPercent.toFixed(2),
            r2: result.r2.toFixed(4)
        }
    };
});

test('温度每升高10度速率约翻倍', () => {
    const A = 1e10;
    const Ea = 50000;
    
    const k298 = kinetics.arrheniusEquation(A, Ea, 298);
    const k308 = kinetics.arrheniusEquation(A, Ea, 308);
    const ratio = k308 / k298;
    
    return {
        passed: ratio > 1.5 && ratio < 2.5,
        details: { ratio: ratio.toFixed(2) }
    };
});

test('活化能线性拟合R²验证', () => {
    const A = 1e12;
    const Ea = 60000;
    const temperatures = [273, 283, 293, 303, 313, 323, 333];
    const rates = temperatures.map(T => kinetics.arrheniusEquation(A, Ea, T));
    
    const result = kinetics.calculateActivationEnergy(rates, temperatures);
    
    return {
        passed: result.r2 > 0.999,
        details: { r2: result.r2.toFixed(6) }
    };
});

console.log('\n═══════════════════════════════════════════════════');
console.log('测试组 3: 反应级数判断');
console.log('═══════════════════════════════════════════════════\n');

test('零级反应级数判断', () => {
    const k = 0.05;
    const c0 = 1.0;
    const timePoints = [0, 2, 4, 6, 8, 10];
    const concentrations = timePoints.map(t => kinetics.zeroOrderRate(k, t, c0));
    
    const result = kinetics.determineReactionOrder(timePoints, concentrations);
    
    return {
        passed: result.bestFit.order === 0 && result.bestFit.r2 > 0.99,
        details: { 
            bestFitOrder: result.bestFit.order,
            r2_zero: result.details.zeroOrder.r2.toFixed(4),
            r2_first: result.details.firstOrder.r2.toFixed(4),
            r2_second: result.details.secondOrder.r2.toFixed(4)
        }
    };
});

test('一级反应级数判断', () => {
    const k = 0.1;
    const c0 = 1.0;
    const timePoints = [0, 2, 4, 6, 8, 10, 15, 20];
    const concentrations = timePoints.map(t => kinetics.firstOrderRate(k, t, c0));
    
    const result = kinetics.determineReactionOrder(timePoints, concentrations);
    
    return {
        passed: result.bestFit.order === 1 && result.bestFit.r2 > 0.99,
        details: { 
            bestFitOrder: result.bestFit.order,
            r2_zero: result.details.zeroOrder.r2.toFixed(4),
            r2_first: result.details.firstOrder.r2.toFixed(4),
            r2_second: result.details.secondOrder.r2.toFixed(4)
        }
    };
});

test('二级反应级数判断', () => {
    const k = 0.1;
    const c0 = 1.0;
    const timePoints = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const concentrations = timePoints.map(t => kinetics.secondOrderRate(k, t, c0));
    
    const result = kinetics.determineReactionOrder(timePoints, concentrations);
    
    return {
        passed: result.bestFit.order === 2 && result.bestFit.r2 > 0.99,
        details: { 
            bestFitOrder: result.bestFit.order,
            r2_zero: result.details.zeroOrder.r2.toFixed(4),
            r2_first: result.details.firstOrder.r2.toFixed(4),
            r2_second: result.details.secondOrder.r2.toFixed(4)
        }
    };
});

test('沉淀反应(二级)级数判断', () => {
    const params = {
        concentrationA: 0.1,
        concentrationB: 0.1,
        temperature: 25
    };
    
    const data = kinetics.generateReactionData('precipitation', params, 50, 5);
    const result = kinetics.determineReactionOrder(data.time, data.concentration);
    
    return {
        passed: result.bestFit.order === 2,
        details: { 
            bestFitOrder: result.bestFit.order,
            r2: result.bestFit.r2.toFixed(4)
        }
    };
});

console.log('\n═══════════════════════════════════════════════════');
console.log('测试组 4: 曲线拟合功能');
console.log('═══════════════════════════════════════════════════\n');

test('线性回归拟合', () => {
    const x = [0, 1, 2, 3, 4, 5];
    const y = x.map(v => 2 * v + 3);
    
    const result = kinetics.linearRegression(x, y);
    
    return {
        passed: Math.abs(result.slope - 2) < 0.001 && 
                Math.abs(result.intercept - 3) < 0.001 && 
                result.r2 > 0.999,
        details: { 
            slope: result.slope.toFixed(4),
            intercept: result.intercept.toFixed(4),
            r2: result.r2.toFixed(6)
        }
    };
});

test('多项式回归(二次)', () => {
    const x = [0, 1, 2, 3, 4, 5];
    const y = x.map(v => v * v + 2 * v + 1);
    
    const result = kinetics.polynomialRegression(x, y, 2);
    
    return {
        passed: result.r2 > 0.99,
        details: { 
            coefficients: result.coefficients.map(c => c.toFixed(4)),
            r2: result.r2.toFixed(6)
        }
    };
});

test('指数拟合功能', () => {
    const x = [0, 1, 2, 3, 4, 5];
    const a = 5;
    const b = -0.5;
    const y = x.map(v => a * Math.exp(b * v));
    
    const result = kinetics.exponentialFit(x, y);
    
    return {
        passed: Math.abs(result.a - a) < 0.1 && 
                Math.abs(result.b - b) < 0.01 && 
                result.r2 > 0.99,
        details: { 
            a: result.a.toFixed(4),
            b: result.b.toFixed(4),
            r2: result.r2.toFixed(6),
            equation: result.equation
        }
    };
});

test('实验数据指数衰减拟合', () => {
    const k = 0.05;
    const c0 = 2.0;
    const timePoints = [0, 5, 10, 15, 20, 25, 30];
    const concentrations = timePoints.map(t => kinetics.firstOrderRate(k, t, c0));
    
    const result = kinetics.exponentialFit(timePoints, concentrations);
    
    return {
        passed: result.r2 > 0.99,
        details: { 
            a: result.a.toFixed(4),
            b: result.b.toFixed(6),
            r2: result.r2.toFixed(6)
        }
    };
});

console.log('\n═══════════════════════════════════════════════════');
console.log('测试组 5: 半衰期计算');
console.log('═══════════════════════════════════════════════════\n');

test('零级反应半衰期', () => {
    const k = 0.02;
    const c0 = 1.0;
    const tHalf = kinetics.calculateHalfLife(0, k, c0);
    
    const cAtHalf = kinetics.zeroOrderRate(k, tHalf, c0);
    
    return {
        passed: Math.abs(cAtHalf - c0 / 2) < 0.001,
        details: { tHalf: tHalf.toFixed(2), cAtHalf: cAtHalf.toFixed(4) }
    };
});

test('一级反应半衰期与浓度无关', () => {
    const k = 0.1;
    
    const tHalf1 = kinetics.calculateHalfLife(1, k, 1.0);
    const tHalf2 = kinetics.calculateHalfLife(1, k, 2.0);
    
    return {
        passed: Math.abs(tHalf1 - tHalf2) < 0.001,
        details: { tHalf: tHalf1.toFixed(2) }
    };
});

test('一级反应半衰期验证', () => {
    const k = 0.05;
    const c0 = 1.0;
    const tHalf = kinetics.calculateHalfLife(1, k, c0);
    
    const cAtHalf = kinetics.firstOrderRate(k, tHalf, c0);
    
    return {
        passed: Math.abs(cAtHalf - c0 / 2) < 0.001,
        details: { tHalf: tHalf.toFixed(2), cAtHalf: cAtHalf.toFixed(4) }
    };
});

test('二级反应半衰期验证', () => {
    const k = 0.02;
    const c0 = 1.0;
    const tHalf = kinetics.calculateHalfLife(2, k, c0);
    
    const cAtHalf = kinetics.secondOrderRate(k, tHalf, c0);
    
    return {
        passed: Math.abs(cAtHalf - c0 / 2) < 0.001,
        details: { tHalf: tHalf.toFixed(2), cAtHalf: cAtHalf.toFixed(4) }
    };
});

console.log('\n═══════════════════════════════════════════════════');
console.log('测试组 6: 反应数据生成与一致性');
console.log('═══════════════════════════════════════════════════\n');

test('反应数据生成结构正确', () => {
    const params = {
        concentrationA: 0.1,
        concentrationB: 0.1,
        temperature: 25
    };
    
    const data = kinetics.generateReactionData('thiosulfate', params, 50, 5);
    
    return {
        passed: data.time.length === data.concentration.length && 
                data.time.length === data.rate.length &&
                data.time.length > 0,
        details: { 
            dataPoints: data.time.length,
            timeRange: `0 - ${data.time[data.time.length - 1]}s`
        }
    };
});

test('酶催化反应最优温度', () => {
    const params = {
        concentrationA: 0.1,
        concentrationB: 0.1,
        catalyst: 5,
        ph: 7.0
    };
    
    let maxRate = 0;
    let optimalTemp = 0;
    
    for (let T = 20; T <= 60; T++) {
        params.temperature = T;
        const rate = kinetics.calculateRate('enzyme', params);
        if (rate > maxRate) {
            maxRate = rate;
            optimalTemp = T;
        }
    }
    
    return {
        passed: optimalTemp >= 35 && optimalTemp <= 45,
        details: { optimalTemperature: optimalTemp + '°C' }
    };
});

test('催化剂浓度对速率的影响', () => {
    const params = {
        concentrationA: 0.1,
        concentrationB: 0.1,
        temperature: 25
    };
    
    const rates = [];
    for (let cat = 0; cat <= 10; cat++) {
        params.catalyst = cat;
        rates.push(kinetics.calculateRate('thiosulfate', params));
    }
    
    const isIncreasing = rates.every((rate, i) => i === 0 || rate >= rates[i - 1]);
    
    return {
        passed: isIncreasing && rates[rates.length - 1] > rates[0] * 2,
        details: { rateIncrease: (rates[rates.length - 1] / rates[0]).toFixed(2) + 'x' }
    };
});

console.log('\n═══════════════════════════════════════════════════');
console.log('测试组 7: 矩阵运算与数值计算');
console.log('═══════════════════════════════════════════════════\n');

test('矩阵转置正确', () => {
    const matrix = [[1, 2], [3, 4], [5, 6]];
    const transposed = kinetics.transposeMatrix(matrix);
    
    return {
        passed: transposed[0][0] === 1 && 
                transposed[0][1] === 3 && 
                transposed[0][2] === 5 &&
                transposed[1][0] === 2 && 
                transposed[1][1] === 4 && 
                transposed[1][2] === 6,
        details: {}
    };
});

test('线性方程组求解正确', () => {
    const A = [[2, 1], [1, 3]];
    const b = [[5], [10]];
    
    const x = kinetics.solveLinearSystem(A, b);
    
    return {
        passed: Math.abs(x[0] - 1) < 0.001 && Math.abs(x[1] - 3) < 0.001,
        details: { x1: x[0].toFixed(4), x2: x[1].toFixed(4) }
    };
});

console.log('\n═══════════════════════════════════════════════════');
console.log('测试组 8: 浓度阶数判断');
console.log('═══════════════════════════════════════════════════\n');

test('浓度对反应速率的一阶依赖', () => {
    const params = {
        concentrationB: 0.1,
        temperature: 25,
        catalyst: 0
    };
    
    const rates = [];
    const concentrations = [0.05, 0.1, 0.15, 0.2];
    
    concentrations.forEach(conc => {
        params.concentrationA = conc;
        rates.push(kinetics.calculateRate('thiosulfate', params));
    });
    
    const result = kinetics.linearRegression(concentrations, rates);
    
    return {
        passed: result.r2 > 0.99,
        details: { r2: result.r2.toFixed(6), slope: result.slope.toFixed(6) }
    };
});

test('总浓度与速率的线性关系', () => {
    const params = {
        temperature: 25,
        catalyst: 0
    };
    
    const totalConcentrations = [0.1, 0.2, 0.3, 0.4, 0.5];
    const rates = [];
    
    totalConcentrations.forEach(totalConc => {
        params.concentrationA = totalConc / 2;
        params.concentrationB = totalConc / 2;
        rates.push(kinetics.calculateRate('thiosulfate', params));
    });
    
    const result = kinetics.linearRegression(totalConcentrations, rates);
    
    return {
        passed: result.r2 > 0.99,
        details: { r2: result.r2.toFixed(6), slope: result.slope.toFixed(6) }
    };
});

console.log('\n═══════════════════════════════════════════════════');
console.log('测试组 9: 边界条件与错误处理');
console.log('═══════════════════════════════════════════════════\n');

test('级数判断数据不足抛出错误', () => {
    try {
        kinetics.determineReactionOrder([0, 1], [1.0, 0.9]);
        return { passed: false, error: '应该抛出错误但没有' };
    } catch (e) {
        return { passed: true, details: { error: e.message } };
    }
});

test('活化能计算数据不足抛出错误', () => {
    try {
        kinetics.calculateActivationEnergy([0.1], [298]);
        return { passed: false, error: '应该抛出错误但没有' };
    } catch (e) {
        return { passed: true, details: { error: e.message } };
    }
});

test('不支持的反应级数抛出错误', () => {
    try {
        kinetics.calculateRateConstant(3, [0, 1, 2], [1.0, 0.9, 0.8]);
        return { passed: false, error: '应该抛出错误但没有' };
    } catch (e) {
        return { passed: true, details: { error: e.message } };
    }
});

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║                         测试结果汇总                            ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log(`总测试数: ${results.passed + results.failed}`);
console.log(`✅ 通过: ${results.passed}`);
console.log(`❌ 失败: ${results.failed}`);
console.log(`📊 通过率: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%\n`);

if (results.failed > 0) {
    console.log('失败的测试:');
    results.tests.filter(t => !t.passed).forEach(t => {
        console.log(`  - ${t.name}`);
        if (t.error) console.log(`    ${t.error}`);
    });
    console.log('');
}

const detailedResults = JSON.stringify(results, null, 2);

module.exports = { results, detailedResults };
