// interest.js

const pixel = require('./pixel.js');
const time = require('./time.js');

var troops;

const sqrtEstimation = (n, trials) => {
    if (1 > n) return 0;
    var estimate = Math.floor((n+1)/2);
    for (var index = 0; index < trials; index++) {
        estimate = Math.floor((estimate + Math.floor(n/estimate))/2);
    }
    return estimate;
}

var discreteInterestArray = new Uint16Array(512);
for (var index = 0; index < 512; index++) {
    discreteInterestArray[index] = 100 + sqrtEstimation(Math.floor(25600*index/508), 9)
}

const update = () => {
    if (9 === time.getTicksElapsed() % 10) {
        var newInterest = Math.floor(troops * getInterestRate() / 1000);
        troops += 1 > newInterest ? 1 : newInterest;
        if (99 === time.getTicksElapsed() % 100) {
            troops += pixel.getLand();
        }
    }
}

const getInterestRate = () => {
    var landIRate = Math.floor(100 * (13440 - 6 * time.getTicksElapsed()) / 1920);
    return 0 > landIRate ? 0 : 700 < landIRate ? 700 : landIRate;
}

module.exports = {
    update,
    getTroops: () => troops,
    setTroops: (amount) => troops = amount,
    getInterestRate
}