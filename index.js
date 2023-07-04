// algo.js

class Algo {
    constructor() {
      this.neutCost = 2;
      this.markedPixels = [];
    }
  
    attackProcessInit() {
      this.markPossiblePixels();
      if (this.markedPixels.length === 0) {
        this.returnRemaining();
      } else {
        const remaining = speed.getRemaining();
        if (Math.floor(remaining / this.markedPixels.length) > this.neutCost) {
          this.takeBorderPixels();
        } else {
          this.returnRemaining();
        }
      }
    }
  
    markPossiblePixels() {
      this.markedPixels = [];
      const borderPixels = pixel.getBorderPixels();
      for (let borderPixel of borderPixels) {
        for (let side = 0; side <= 3; side++) {
          let x = pixel.getX(borderPixel),
            y = pixel.getY(borderPixel);
          switch (side) {
            case 0:
              x--;
              break;
            case 1:
              x++;
              break;
            case 2:
              y--;
              break;
            case 3:
              y++;
              break;
          }
          const pIndex = pixel.getIndex(x, y);
          if (pixel.getValue(pIndex) === 0 && !this.markedPixels.includes(pIndex)) {
            this.markedPixels.push(pIndex);
          }
        }
      }
    }
  
    returnRemaining() {
      interest.setTroops(interest.getTroops() + speed.getRemaining());
      gameStatistics.expenses[1] -= speed.getRemaining();
      speed.removeEntry();
    }
  
    takeBorderPixels() {
      const remaining = speed.getRemaining();
      speed.setRemaining(remaining - this.markedPixels.length * this.neutCost);
      for (let pIndex of this.markedPixels) {
        pixel.setPixel(pixel.getIndex(pixel.getX(pIndex), pixel.getY(pIndex)), 2);
      }
      pixel.updatePixels();
    }
}

// interest.js

class Interest {
    constructor() {
      this.troops = 0;
    }
  
    update() {
      if (time.getTicksElapsed() % 10 === 9) {
        const newInterest = Math.max(1, Math.floor(this.troops * this.getInterestRate() / 10000));
        this.troops += newInterest;
        gameStatistics.income[1] += newInterest;
        if (time.getTicksElapsed() % 100 === 99) {
            this.troops += pixel.getLand();
            gameStatistics.income[0] += pixel.getLand();
        }
      }
    }
  
    getInterestRate() {
      const landIRate = Math.floor(100 * (13440 - 6 * time.getTicksElapsed()) / 1920);
      return landIRate < 0 ? 0 : landIRate > 700 ? 700 : landIRate;
    }
  
    getTroops() {
      return this.troops;
    }
  
    setTroops(amount) {
      this.troops = amount;
    }
}
  
// pixel.js

class Pixel {
    constructor() {
      this.mapDims = {
        x: 200,
        y: 200
      };
      this.mapArray = new Array(this.mapDims.x * this.mapDims.y).fill(0);
    }
  
    getX(pIndex) {
      return pIndex % this.mapDims.x;
    }
  
    getY(pIndex) {
      return Math.floor(pIndex / this.mapDims.x);
    }
  
    getIndex(x, y) {
      return y * this.mapDims.x + x;
    }
  
    getLand() {
      return this.mapArray.filter((value) => value >= 1).length;
    }
  
    getValue(pIndex) {
      return this.mapArray[pIndex];
    }
  
    getBorderPixels() {
      const borderPixels = [];
      for (let x = 0; x < this.mapDims.x; x++) {
        for (let y = 0; y < this.mapDims.y; y++) {
          if (this.mapArray[this.getIndex(x, y)] === 2) { // Border
            if (
              this.mapArray[this.getIndex(x - 1, y)] === 0 ||
              this.mapArray[this.getIndex(x + 1, y)] === 0 ||
              this.mapArray[this.getIndex(x, y - 1)] === 0 ||
              this.mapArray[this.getIndex(x, y + 1)] === 0
            ) { 
              borderPixels.push(this.getIndex(x, y));
            }
          }
        }
      }
      return borderPixels;
    }
  
    setPixel(pIndex, value) {
      this.mapArray[pIndex] = value;
    }
  
    updatePixels() {
      for (let x = 0; x < this.mapDims.x; x++) {
        for (let y = 0; y < this.mapDims.y; y++) {
          if (this.mapArray[this.getIndex(x, y)] === 2) {
            if (
              this.mapArray[this.getIndex(x - 1, y)] &&
              this.mapArray[this.getIndex(x + 1, y)] &&
              this.mapArray[this.getIndex(x, y - 1)] &&
              this.mapArray[this.getIndex(x, y + 1)]
            ) {
              this.setPixel(this.getIndex(x, y), 1);
            }
          }
        }
      }
    }
  
    init() {
      for (let x = 99; x <= 102; x++) {
        for (let y = 99; y <= 102; y++) {
          if (x === 99 || x === 102 || y === 99 || y === 102) {
            if ((x === 99 || x === 102) && (y === 99 || y === 102)) continue;
            this.setPixel(this.getIndex(x, y), 2);
          } else {
            this.setPixel(this.getIndex(x, y), 1);
          }
        }
      }
    }
}

// gameStatistics.js

class GameStatistics {
    constructor() {
        this.income = [512,0]; //Land, Interest
        this.expenses = [0,0]; //Tax, Attack
    }
    getOI() {
        return this.income[1] + this.income[0];
    }
}

// processAction.js

class ProcessAction {
    constructor() {}
  
    update() {
      if (!this.isInfoSend()) return; //70, 77, 85, 92
      if (time.getTicksElapsed() === 70) { //4 updates, 72 land, 78, 82, 86, 90 ==> 91 reinforcement, 94 continue
        this.processAttack(168);
      } else if (time.getTicksElapsed() === 91) { //For 144 overflow, 296T
        this.processAttack(128);
      } /*else if (time.getTicksElapsed() === 175) {
        this.processAttack(449);
      } else if (time.getTicksElapsed() === 273) {
        this.processAttack(669);
      } else if (time.getTicksElapsed() === 371) {
        this.processAttack(1076);
      } else if (time.getTicksElapsed() === 462) {
        this.processAttack(2419);
      }*/
    }
  
    isInfoSend() {
      return time.getTicksElapsed() % 7 === 0;
    }
  
    processAttack(amount) {
      var tax = Math.floor(interest.getTroops() * 3 / 256);
      amount -= amount * 2 >= interest.getTroops() ? tax : 0;
      if (amount > 0) {
        interest.setTroops(interest.getTroops() - amount - tax);
        gameStatistics.expenses[0] += tax;
        gameStatistics.expenses[1] += amount;
        speed.addEntry(amount);
      }
    }
}
  
// speed.js

class Speed {
    constructor() {
      this.newAttackIntervalsLeft = 6;
      this.intervalsLeft = 0;
      this.attacking = false;
      this.remaining = 0;
    }
  
    setSpeedInterval() {
      this.intervalsLeft = this.intervalsLeft === 10 ? this.newAttackIntervalsLeft : (pixel.getLand() < 1E3 ? 3 : 2);
    }
  
    update() {
      if (!this.attacking) return;
      if (this.intervalsLeft === 10) {
        this.setSpeedInterval();
      } else if (this.intervalsLeft-- === 0) {
        this.setSpeedInterval();
        algo.attackProcessInit();
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
  
    getRemaining() {
      return this.remaining;
    }
  
    setRemaining(amount) {
      this.remaining = amount;
    }
  
    getAttacking() {
      return this.attacking;
    }
}

// time.js

class Time {
    constructor() {
      this.timeInterval = 0;
      this.tick = 0;
    }
  
    init() {
      this.tick = 0;
      interest.setTroops(512);
      pixel.init();
    }
  
    update() {
      interest.update();
      processAction.update();
      speed.update();
      this.tick++;
      if (this.tick <= 108) {
        console.log(this.tick, interest.getTroops(), speed.getRemaining(), pixel.getLand(), gameStatistics.getOI());
        setTimeout(this.update.bind(this), this.timeInterval);
      }
    }
  
    getTicksElapsed() {
      return this.tick;
    }
  
    setTimeInterval(interval) {
      this.timeInterval = interval;
    }
}

// index.js
var algo = new Algo, interest = new Interest, pixel = new Pixel,processAction = new ProcessAction,
    speed = new Speed, time = new Time, gameStatistics = new GameStatistics;

const gameInit = () => {
    time.init();
}

const gameTickInit = () => time.update();

gameInit();
gameTickInit();