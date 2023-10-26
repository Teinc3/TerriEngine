// gameStatistics.js
// This is also another class that doesn't have dependencies on other classes.

class GameStatistics {
    constructor() {
        this.results = [];
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
            tick: time.tick,
            troops: interest.troops,
            land: pixel.getLand(),
            remaining: speed.remaining,
            oi: this.getOI(),
            tax: this.expenses[0]
        })
    }
}

module.exports = GameStatistics;