// speed.js

const pixel = require('./pixel.js');
const algo = require('./algo.js');

const newAttackIntervalsLeft = 6;
var intervalsLeft = 0,
    attacking = false,
    remaining = 0;

const setSpeedInterval = () => {
    intervalsLeft = 10 === intervalsLeft ? newAttackIntervalsLeft : 1E3 > pixel.getLand() ? 3 : 2
};

const update = () => {
    if (!attacking) return
    if (10 === intervalsLeft) setSpeedInterval();
    else if (0 === intervalsLeft--) {
        setSpeedInterval();
        algo.attackProcessInit();
    }
}

const removeEntry = () => {
    attacking = false;
    remaining = 0;
}

const addEntry = (amount) => {
    attacking = true;
    intervalsLeft = 10;
    remaining = amount;
}

module.exports = {
    update,
    removeEntry,
    addEntry,
    getRemaining: () => remaining,
    setRemaining: (amount) => remaining = amount,
    getAttacking: () => attacking
}