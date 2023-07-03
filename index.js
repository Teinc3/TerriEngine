// index.js

//const gameStatistics = require('./gameStatistics.js');
const time = require('./time.js');

const gameInit = () => {
    time.init();
}

const gameTickInit = () => time.update();

gameInit();
gameTickInit();