// gameStatistics.js

class GameStatistics {
    constructor(deps) {
        this.deps = deps;
    }

    init() {
        this.income = [512,0]; //Land, Interest
        this.expenses = [0,0]; //Tax, Attack
        this.storeSimLogs = this.deps.time.instructions?.options?.storeSimLogs || false;
        if (this.storeSimLogs) {
            this.logs = [];
        }
    }

    getOI() {
        return this.income[1] + this.income[0];
    }

    update() {
        if (this.storeSimLogs) {
            this.logs.push({
                tick: this.deps.time.tick,
                troops: this.deps.interest.troops,
                land: this.deps.pixel.land,
                remaining: this.deps.speed.remaining,
                oi: this.getOI(),
                tax: this.expenses[0]
            })
        }
    }

    getResults(instructions) {
        const result = {
            IFSes: [...instructions.IFSes],
            troops: this.deps.interest.troops,
            land: this.deps.pixel.land,
            oi: this.getOI(),
            tax: this.expenses[0],
        }
        if (this.deps.speed.remaining > 0) {
            result.remaining = this.deps.speed.remaining;
        }
        if (this.storeSimLogs) {
            result.logs = this.logs;
            if (instructions?.timings?.legacy) {
                result.legacy = {
                    troops: this.logs.find(log => log.tick == instructions.timings.legacy)?.troops,
                    oi: this.logs.find(log => log.tick == instructions.timings.legacy)?.oi
                }
            }
        }
        return result;
    }

    loadState(gameStatistics) {
        this.income = structuredClone(gameStatistics.income);
        this.expenses = structuredClone(gameStatistics.expenses);
        if (this.storeSimLogs) {
            this.logs = structuredClone(gameStatistics.logs);
        }
    }
}

module.exports = GameStatistics;