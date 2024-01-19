// speed.js

class Speed {
    constructor(deps) {
        this.deps = deps;

        this.newAttackIntervalsLeft = 6;
        this.intervalsLeft = 0;
        this.attacking = false;
        this.remaining = 0;
    }
  
    setSpeedInterval() {
        this.intervalsLeft = this.intervalsLeft === 10 ? this.newAttackIntervalsLeft : (this.deps.pixel.getLand() < 1E3 ? 3 : 2);
    }
  
    update() {
        if (!this.attacking) return;
        if (this.intervalsLeft === 10) {
            this.setSpeedInterval();
        } else if (this.intervalsLeft-- === 0) {
            this.setSpeedInterval();
            this.deps.algo.attackProcessInit();
        }
    }
  
    removeEntry() {
        this.attacking = false;
        this.remaining = 0;
    }
  
    addEntry(amount) {
        if (this.attacking) {
            this.remaining += amount;
        } else {
            this.attacking = true;
            this.intervalsLeft = 10;
            this.remaining = amount;
        }
    }
}

module.exports = Speed;