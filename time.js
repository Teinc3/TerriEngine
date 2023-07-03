// time.js

const interest = require('./interest.js');
const processAction = require('./processAction.js');
const speed = require('./speed.js');
//const gameStatistics = require('./gameStatistics.js');
const pixel = require('./pixel.js');

const timeInterval = 56;
var tick;

const init = () => {
    tick = 0;
    interest.setTroops(512);
    pixel.init();
    //gameStatistics.init();
}

const update = () => {
    interest.update();
    processAction.update();
    speed.update();
    //gameStatistics.update();
    tick++;
    if (tick <= 508) {
        console.log(tick, interest.getTroops(), speed.getRemaining(), pixel.getLand());
        setTimeout(update, timeInterval);
    }
    
}

module.exports = {
    init,
    update,
    getTicksElapsed: () => tick,
    setTimeInterval: (interval) => timeInterval = interval
}