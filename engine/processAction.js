// processAction.js

class ProcessAction {
    constructor(deps) {
        this.deps = deps;

        this.instructions;
    }
  
    update() {
        const IFS = this.instructions.IFSes.find(IFS => IFS.IFS === this.deps.time.tick);
        if (!IFS) return true;
        if (!this.isInfoSend() && !this.instructions.singleplayer) throw new Error(`${this.deps.time.tick} is not an IFS tick!`);
        return this.processAttack(IFS.troops);
    }
  
    isInfoSend() {
        return this.deps.time.tick % 7 === 0;
    }
  
    processAttack(amount) {
        let tax = Math.floor(this.deps.interest.troops * 3 / 256);
        amount -= amount * 2 >= this.deps.interest.troops ? tax : 0;
        if (amount > 0) {
            this.deps.interest.troops -= (amount + tax);
            if (this.deps.interest.troops < 0) return false // Combination failed nerd
            this.deps.gameStatistics.expenses[0] += tax;
            this.deps.gameStatistics.expenses[1] += amount;
            this.deps.speed.addEntry(amount);
            return true;
        } else { // Sim unsuccessful
            return false;
        }
    }
}

module.exports = ProcessAction;