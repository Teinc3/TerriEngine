// processAction.js

const interest = require("./interest");
const speed = require("./speed");
const time = require("./time");

const update = () => {
    if (!isInfoSend()) return;
    // Opening: 228 449 669 1076 2419 Troops at Ticks 70, 175, 273, 371, 462
    if (time.getTicksElapsed() === 70) {
        processAttack(228);
    } else if (time.getTicksElapsed() === 175) {
        processAttack(449);
    } else if (time.getTicksElapsed() === 273) {
        processAttack(669);
    } else if (time.getTicksElapsed() === 371) {
        processAttack(1076);
    } else if (time.getTicksElapsed() === 462) {
        processAttack(2419);
    }
}

const isInfoSend = () => {
    return time.getTicksElapsed() % 7 === 0;
}

const processAttack = (amount) => {
    var tax = Math.floor(interest.getTroops() * 3/256);
    amount -= amount*2 >= interest.getTroops() ? tax : 0;
    if (amount > 0) {
        interest.setTroops(interest.getTroops() - amount + tax);
        speed.addEntry(amount);
    }
}

module.exports = {
    update
}