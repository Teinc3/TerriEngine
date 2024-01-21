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
        this.deps.processAction.instructions = this.instructions;
        this.deps.pixel.init();
        this.deps.gameStatistics.init();
    }
  
    update() { // Returns true if sim ended
        this.deps.interest.update();
        if (this.instructions.IFSes !== false) {
            if (!this.deps.processAction.update()) return true;
        }
        this.deps.speed.update();
        this.deps.gameStatistics.update();
        this.tick++;
        
        if (this.tick == this.instructions.timings.simDuration) {
            return this.deps.gameStatistics.getResults(this.instructions);
        } else return false;
    }
}

module.exports = Time;