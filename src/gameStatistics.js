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
        if (this.deps.time.instructions?.options?.storeSimLogs) {
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
        if (instructions?.timings?.legacy) {
            result.legacy = {
                troops: this.logs.find(log => log.tick == instructions.timings.legacy)?.troops,
                oi: this.logs.find(log => log.tick == instructions.timings.legacy)?.oi
            }
        }
        if (instructions?.options?.storeSimLogs) {
            result.logs = this.logs;
        }
        return result;
    }

    loadState(gameStatistics) {
        this.income = structuredClone(gameStatistics.income);
        this.expenses = structuredClone(gameStatistics.expenses);
        if (this.deps.time.instructions?.options?.storeSimLogs) {
            this.logs = structuredClone(gameStatistics.logs);
        }
    }
}

module.exports = GameStatistics;