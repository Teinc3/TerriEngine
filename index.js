// index.js

const Algo = require('./algo.js'),
    GameStatistics = require('./gameStatistics.js'),
    Interest = require('./interest.js'),
    Pixel = require('./pixel.js'),
    ProcessAction = require('./processAction.js'),
    Speed = require('./speed.js'),
    Time = require('./time.js');

const gameStatistics = new GameStatistics(),
    pixel = new Pixel(),
    speed = new Speed({ pixel, algo: null }),
    algo = new Algo({ speed, pixel, interest: null, gameStatistics }),
    interest = new Interest( {pixel, time: null, gameStatistics }),
    processAction = new ProcessAction({ speed, time: null, interest, gameStatistics }),
    time = new Time({ interest, pixel, gameStatistics, processAction, speed });

speed.algo = algo;
algo.interest = interest;
interest.time = time;
processAction.time = time;