// gameStatistics.js

class GameStatistics {
    constructor(deps) {
        this.deps = deps;
    }
    init() {
        this.income = [512,0]; //Land, Interest
        this.expenses = [0,0]; //Tax, Attack
        this.logs = [];
    }
    getOI() {
        return this.income[1] + this.income[0];
    }
    update() {
        this.logs.push({
            tick: this.deps.time.tick,
            troops: this.deps.interest.troops,
            land: this.deps.pixel.getLand(),
            remaining: this.deps.speed.remaining,
            oi: this.getOI(),
            tax: this.expenses[0]
        })
    }
    getResults(instructions) {
        return {
            IFSes: instructions.IFSes,
            legacy: instructions?.timings?.legacy ? {
                troops: this.logs.find(log => log.tick == instructions.timings.legacy)?.troops,
                oi: this.logs.find(log => log.tick == instructions.timings.legacy)?.oi,
            } : "Disabled",
            troops: this.deps.interest.troops,
            land: this.deps.pixel.getLand(),
            oi: this.getOI(),
            tax: this.expenses[0],
        }
    }
}

module.exports = GameStatistics;