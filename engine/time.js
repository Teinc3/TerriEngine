// time.js

class Time {
    constructor(deps) {
        this.deps = deps;

        this.instructions;
        this.tick = 0;
    }
  
    init(instructions) {
        this.instructions = instructions;

        this.tick = 0;
        this.deps.interest.troops = 512;
        this.deps.pixel.init();
        this.deps.gameStatistics.init();
    }
  
    update() { 
        // Returns true if the sim prematurely ends, false if the sim has not yet ended, and a results object if the sim has ended.
        this.deps.interest.update();
        if (!this.deps.processAction.update()) return false; // Illegal attack - sim ended
        this.deps.speed.update();
        this.deps.gameStatistics.update();
        this.tick++;
        
        if (this.tick == this.instructions.timings.simDuration) { // Sim ended, return results
            return this.deps.gameStatistics.getResults(this.instructions);
        } else return true; // Sim has not yet ended
    }

    addIFSes(IFSes) {
        this.instructions.IFSes = IFSes;
    }
}

module.exports = Time;