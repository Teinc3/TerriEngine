// processAction.js

class ProcessAction {
    constructor(deps) {
        this.deps = deps;
    }
  
    update() {
        var pendingAttacks = algoLoopPreset && this.deps.time.tick < (testCycle-1)*100+7 ? algoLoopPreset : IFSes;
        for (let IFS of pendingAttacks) {
            if (this.deps.time.tick === IFS.IFS) {
                if (!this.isInfoSend()) console.log(this.deps.time.tick, " is not an IFS tick!");
                if (this.processAttack(IFS.troops)) break;
                else return false;
            }
        }
        return true;
    }
  
    isInfoSend() {
        return this.deps.time.tick % 7 === 0;
    }
  
    processAttack(amount) {
        var tax = Math.floor(this.deps.interest.troops * 3 / 256);
        amount -= amount * 2 >= this.deps.interest.troops ? tax : 0;
        if (amount > 0) {
            this.deps.interest.troops -= (amount + tax);
            if (this.deps.interest.troops < 0) return false //Combination failed nerd
            this.deps.gameStatistics.expenses[0] += tax;
            this.deps.gameStatistics.expenses[1] += amount;
            this.deps.speed.addEntry(amount);
            return true;
        } else {
            console.log("Combination failed!", IFSes)
            return false;
        }
    }
}

module.exports = ProcessAction;