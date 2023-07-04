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
            const remaining = speed.remaining;
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
                if (pixel.mapArray[pIndex] === 0 && !this.markedPixels.includes(pIndex)) {
                    this.markedPixels.push(pIndex);
                }
            }
        }
    }
  
    returnRemaining() {
        interest.troops += speed.remaining;
        gameStatistics.expenses[1] -= speed.remaining;
        speed.removeEntry();
    }
  
    takeBorderPixels() {
        speed.remaining -= this.markedPixels.length * this.neutCost;
        for (let pIndex of this.markedPixels) {
            pixel.mapArray[pixel.getIndex(pixel.getX(pIndex), pixel.getY(pIndex))] = 2;
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
      if (time.tick % 10 === 9) {
        const newInterest = Math.max(1, Math.floor(this.troops * this.getInterestRate() / 10000));
        this.troops += newInterest;
        gameStatistics.income[1] += newInterest;
        if (time.tick % 100 === 99) {
            this.troops += pixel.getLand();
            gameStatistics.income[0] += pixel.getLand();
        }
      }
    }
  
    getInterestRate() {
        const landIRate = Math.floor(100 * (13440 - 6 * time.tick) / 1920);
        return landIRate < 0 ? 0 : landIRate > 700 ? 700 : landIRate;
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
  
    getBorderPixels() {
        const borderPixels = [];
        for (let x = 0; x < this.mapDims.x; x++) {
            for (let y = 0; y < this.mapDims.y; y++) {
                if (this.mapArray[this.getIndex(x, y)] === 2) { // Border
                    if (this.mapArray[this.getIndex(x - 1, y)] === 0 || this.mapArray[this.getIndex(x + 1, y)] === 0 ||
                        this.mapArray[this.getIndex(x, y - 1)] === 0 || this.mapArray[this.getIndex(x, y + 1)] === 0) { 
                        borderPixels.push(this.getIndex(x, y));
                    }
                }
            }
        }
        return borderPixels;
    }
  
    updatePixels() {
        for (let x = 0; x < this.mapDims.x; x++) {
            for (let y = 0; y < this.mapDims.y; y++) {
                if (this.mapArray[this.getIndex(x, y)] === 2) {
                    if (this.mapArray[this.getIndex(x - 1, y)] && this.mapArray[this.getIndex(x + 1, y)] &&
                        this.mapArray[this.getIndex(x, y - 1)] && this.mapArray[this.getIndex(x, y + 1)]) {
                        this.mapArray[this.getIndex(x, y)] = 1;
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
                    this.mapArray[this.getIndex(x, y)] = 2;
                } else {
                    this.mapArray[this.getIndex(x, y)] = 1;
                }
            }
        }
    }
}

// gameStatistics.js

class GameStatistics {
    constructor() {
        this.results = [];
    }
    init() {
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
        var settings = [[70, 72],[84, 96],[91, 128]]
        if (!this.isInfoSend()) return;
        for (let pair of settings) {
            if (time.tick === pair[0]) {
                this.processAttack(pair[1]);
                break;
            }
        }
    }
  
    isInfoSend() {
        return time.tick % 7 === 0;
    }
  
    processAttack(amount) {
        var tax = Math.floor(interest.troops * 3 / 256);
        amount -= amount * 2 >= interest.troops ? tax : 0;
        if (amount > 0) {
            interest.troops -= (amount + tax);
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
}

// time.js

class Time {
    constructor() {
        this.tick = 0;
    }
  
    init() {
        this.tick = 0;
        interest.troops = 512;
        pixel.init();
    }
  
    update() {
        interest.update();
        processAction.update();
        speed.update();
        this.tick++;
        if (this.tick == 109) {
            gameStatistics.results.push({
                troops: interest.troops,
                land: pixel.getLand(),
                oi: gameStatistics.getOI(),
                tax: gameStatistics.expenses[0]
            })
            //console.log(this.tick, interest.troops, speed.remaining, pixel.getLand(), gameStatistics.getOI(), gameStatistics.expenses[0]);
            return true;
        } else return false;
    }
}

// index.js
var algo = new Algo, interest = new Interest, pixel = new Pixel, processAction = new ProcessAction,
    speed = new Speed, time = new Time, gameStatistics = new GameStatistics;

time.init();
time.update();