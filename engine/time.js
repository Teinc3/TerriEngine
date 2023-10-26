// time.js

class Time {
    constructor(deps) {
        this.deps = deps;

        this.instructions;
        this.tick = 0;
    }
  
    init(instructions) {
        this.instructions = {
            loopPreset: {
                endCycle: instructions?.loopPreset?.endCycle ?? 0,  // 0 = no preset, n = up to n cycles
                preset: instructions?.loopPreset?.preset ?? []
            },
            IFSes: instructions?.IFSes ?? [],
            legacyTime: instructions?.legacyTime ?? 0
        }

        this.tick = 0;
        this.deps.interest.troops = 512;
        this.deps.processAction.instructions = this.instructions;
        this.deps.pixel.init();
        this.deps.gameStatistics.init();

        if (this.instructions.loopPreset.endCycle > 0) {
            while (this.tick < (this.instructions.loopPreset.endCycle - 1) * 100 + 7) this.update();
        }
    }
  
    update(simEndTime) {
        this.deps.interest.update();
        if (!this.deps.processAction.update()) return true;
        this.deps.speed.update();
        this.deps.gameStatistics.update();
        this.tick++;
        
        if (this.tick == simEndTime) {
            return this.deps.gameStatistics.getResults(this.instructions);
        } else return false;
    }
}

module.exports = Time;