// interest.js

class Interest {
    constructor(deps) {
        this.deps = deps
        
        this.troops = 0;
    }
  
    update() {
      if (this.deps.time.tick % 10 === 9) {
        const newInterest = Math.max(1, Math.floor(this.troops * this.getInterestRate() / 10000));
        this.troops += newInterest;
        this.capTroops();
        this.deps.gameStatistics.income[1] += newInterest - this.capTroops();
        if (this.deps.time.tick % 100 === 99) {
            this.troops += this.deps.pixel.land;
            const troopsLost = this.capTroops();
            this.deps.gameStatistics.income[0] += this.deps.pixel.land - troopsLost;
        }
      }
    }
  
    getInterestRate() {
        let interestRate = this.getBaseIRate();
        const maxInterest = 100 * this.deps.pixel.land;
        if (this.troops > maxInterest) {
            interestRate -= Math.floor(2 * interestRate * (this.troops - maxInterest) / maxInterest);
        }
        return interestRate < 0 ? 0 : interestRate > 700 ? 700 : interestRate;
    }

    getBaseIRate() {
        return Math.floor(100 * (13440 - 6 * this.deps.time.tick) / 1920);
    }

    capTroops() {
        const maxTroops = 150 * this.deps.pixel.land;
        if (this.troops > maxTroops) {
            const troopsLost = this.troops - maxTroops;
            this.troops = maxTroops;
            return troopsLost;
        }
        return 0;
    }

    loadState(troops) {
        this.troops = troops;
    }
}

module.exports = Interest;