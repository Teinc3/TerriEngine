// algo.js

class Algo {
    constructor(deps) {
        this.deps = deps;
        
        this.neutCost = 2;
        this.markedPixels = [];
    }
  
    attackProcessInit() {
        this.markPossiblePixels();
        if (this.markedPixels.length === 0) {
            this.returnRemaining();
        } else {
            const remaining = this.deps.speed.remaining;
            if (Math.floor(remaining / this.markedPixels.length) > this.neutCost) {
                this.takeBorderPixels();
            } else {
                this.returnRemaining();
            }
        }
    }
  
    markPossiblePixels() {
        this.markedPixels = [];
        const borderPixels = this.deps.pixel.getBorderPixels();
        for (let borderPixel of borderPixels) {
            for (let side = 0; side <= 3; side++) {
                let x = this.deps.pixel.getX(borderPixel),
                    y = this.deps.pixel.getY(borderPixel);
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
                const pIndex = this.deps.pixel.getIndex(x, y);
                if (this.deps.pixel.mapArray[pIndex] === 0 && !this.markedPixels.includes(pIndex)) {
                    this.markedPixels.push(pIndex);
                }
            }
        }
    }
  
    returnRemaining() {
        this.deps.interest.troops += this.deps.speed.remaining;
        this.deps.gameStatistics.expenses[1] -= this.deps.speed.remaining;
        this.deps.speed.removeEntry();
    }
  
    takeBorderPixels() {
        this.deps.speed.remaining -= this.markedPixels.length * this.neutCost;
        for (let pIndex of this.markedPixels) {
            this.deps.pixel.mapArray[this.deps.pixel.getIndex(this.deps.pixel.getX(pIndex), this.deps.pixel.getY(pIndex))] = 2;
        }
        this.deps.pixel.updatePixels();
    }
}

module.exports = Algo;