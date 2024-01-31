// processAction.js

class ProcessAction {
    constructor(deps) {
        this.deps = deps;

        this.ratioBase = 1000;
    }
  
    update() { // Returns false if an illegal attack takes place
        const instructions = this.deps.time.instructions;
        const IFS = instructions.IFSes.find(IFS => IFS.IFS === this.deps.time.tick);
        if (!IFS) return true; // No attack this tick, still safe
        if (!this.isInfoSend() && !instructions.singleplayer) throw new Error(`${this.deps.time.tick} is not an IFS tick!`);
        return this.processAttack(IFS); // Status of Attack
    }
  
    isInfoSend() {
        return this.deps.time.tick % 7 === 0;
    }
  
    processAttack(IFS) {
        let amount;
        const tax = Math.floor(this.deps.interest.troops * 3 / 256);
        const useRatio = IFS.hasOwnProperty('ratio');
        if (useRatio) {
            amount = Math.floor(this.deps.interest.troops * IFS.ratio / this.ratioBase);
        } else {
            amount = IFS.troops;
        }
        if (useRatio || !this.deps.time.instructions?.options?.noTaxOnAttack) {
            amount -= (amount * 2 >= this.deps.interest.troops ? tax : 0);
        }
        if (amount > 2) { // minDefensePerSquare
            this.deps.interest.troops -= (amount + tax);
            if (this.deps.interest.troops < 0) return false // Impossible attack
            this.deps.gameStatistics.expenses[0] += tax;
            this.deps.gameStatistics.expenses[1] += amount;
            this.deps.speed.addEntry(amount);
            return true; // Attack successful
        } else { // No attack executed
            return false;
        }
    }
}

module.exports = ProcessAction;