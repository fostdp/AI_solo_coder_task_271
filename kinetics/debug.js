const ReactionKinetics = require('./reaction-kinetics');
const kinetics = new ReactionKinetics();

console.log('调试零级反应速率方程验证:\n');
const k = 0.05;
const c0 = 1.0;
const timePoints = [0, 5, 10, 15, 20];
const concentrations = timePoints.map(t => kinetics.zeroOrderRate(k, t, c0));

console.log('时间点:', timePoints);
console.log('浓度值:', concentrations);

const validation = kinetics.validateRateEquation(0, timePoints, concentrations, 0.001);
console.log('验证结果:', validation);

console.log('\n\n调试酶催化反应最优温度:\n');

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
    console.log(`温度 ${T}°C: 速率 = ${rate.toFixed(6)}`);
    if (rate > maxRate) {
        maxRate = rate;
        optimalTemp = T;
    }
}

console.log(`\n最优温度: ${optimalTemp}°C, 最大速率: ${maxRate.toFixed(6)}`);
