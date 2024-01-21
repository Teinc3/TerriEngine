// core.js

const fs = require('fs');

// Custom modules
const Algo = require('./algo.js'),
    GameStatistics = require('./gameStatistics.js'),
    Interest = require('./interest.js'),
    Pixel = require('./pixel.js'),
    ProcessAction = require('./processAction.js'),
    Speed = require('./speed.js'),
    Time = require('./time.js');

const pixel = new Pixel(),
    speed = new Speed({ pixel, algo: null }),
    gameStatistics = new GameStatistics({ pixel, speed, time: null, interest: null }),
    interest = new Interest({ pixel, time: null, gameStatistics }),
    algo = new Algo({ speed, pixel, interest, gameStatistics }),
    processAction = new ProcessAction({ speed, time: null, interest, gameStatistics }),
    time = new Time({ interest, pixel, gameStatistics, processAction, speed });

speed.deps.algo = algo;
gameStatistics.deps.time = time;
gameStatistics.deps.interest = interest;
interest.deps.time = time;
processAction.deps.time = time;

if (require.main === module) { // Run this if this file is run directly
    const instructions = JSON.parse(fs.readFileSync('./data/ifs.json', 'utf8'));
    if (!instructions || !instructions.IFSes || !instructions.timings || !instructions.timings.simDuration) {
        throw new Error("Instructions cannot be loaded. Please check the validity of ifs.json in the /data folder.");
    }

    time.init(instructions);
    let results;
    while (!(results = time.update())) {}

    fs.writeFileSync('./data/results.json', JSON.stringify(results));
    console.log("Simulation completed. Check /data/results.json for results.");
}

module.exports = {
    deps: {
        algo,
        gameStatistics,
        interest,
        pixel,
        processAction,
        speed,
        time
    }
};