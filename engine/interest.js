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
        this.deps.gameStatistics.income[1] += newInterest;
        if (this.deps.time.tick % 100 === 99) {
            this.troops += this.deps.pixel.getLand();
            this.deps.gameStatistics.income[0] += this.deps.pixel.getLand();
        }
      }
    }
  
    getInterestRate() {
        let interestRate = Math.floor(100 * (13440 - 6 * this.deps.time.tick) / 1920);
        const maxInterest = 100 * this.deps.pixel.getLand();
        if (this.troops > maxInterest) {
            interestRate -= Math.floor(2 * interestRate * (this.troops - maxInterest) / maxInterest);
        }
        return interestRate < 0 ? 0 : interestRate > 700 ? 700 : interestRate;
    }
}

module.exports = Interest;