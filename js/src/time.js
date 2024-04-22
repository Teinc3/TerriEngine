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
        this.deps.speed.removeEntry();
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
    
    loadState(state) {
        // Load state from a previous sim
        // interest: troops
        const { time, interest, pixel, speed, gameStatistics } = state;
        
        this.tick = time.tick;
        this.instructions = structuredClone(time.instructions);
        this.deps.pixel.loadState(pixel);
        this.deps.speed.loadState(speed);
        this.deps.gameStatistics.loadState(gameStatistics);
        this.deps.interest.loadState(interest);
    }

    saveState() {
        const saveState = {
            time: {
                tick: this.tick,
                instructions: this.instructions
            },
            interest: this.deps.interest.troops,
            pixel: {
                land: this.deps.pixel.land,
                border: this.deps.pixel.border,
                borderIncrement: this.deps.pixel.borderIncrement
            },
            speed: {
                newAttackIntervalsLeft: this.deps.speed.newAttackIntervalsLeft,
                intervalsLeft: this.deps.speed.intervalsLeft,
                attacking: this.deps.speed.attacking,
                remaining: this.deps.speed.remaining
            },
            gameStatistics: {
                income: this.deps.gameStatistics.income,
                expenses: this.deps.gameStatistics.expenses
            }
        }
        if (this.instructions?.options?.storeSimLogs) {
            saveState.gameStatistics.logs = this.deps.gameStatistics.logs;
        }
        return saveState;
    }
}

module.exports = Time;