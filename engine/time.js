// time.js

class Time {
    constructor(deps) {
        this.deps = deps;
        
        this.tick = 0;
    }
  
    init() {
        this.tick = 0;
        this.deps.interest.troops = 512;
        this.deps.pixel.init();
        this.deps.gameStatistics.init();
        if (algoLoopPreset) {
            while (this.tick < (testCycle-1)*100+7) this.update();
        }
    }
  
    update() {
        this.deps.interest.update();
        if (!this.deps.processAction.update()) return true;
        this.deps.speed.update();
        this.deps.gameStatistics.update();
        this.tick++;
        if (this.tick == simEndTime) {
            this.deps.gameStatistics.results.push({
                IFSes: IFSes,
                legacy: {
                    troops: this.deps.gameStatistics.logs.find(log => log.tick == legacyTime).troops,
                    oi: this.deps.gameStatistics.logs.find(log => log.tick == legacyTime).oi,
                },
                troops: this.deps.interest.troops,
                land: this.deps.pixel.getLand(),
                oi: this.deps.gameStatistics.getOI(),
                tax: this.deps.gameStatistics.expenses[0],
            });
            return true;
        } else return false;
    }
}

module.exports = Time;