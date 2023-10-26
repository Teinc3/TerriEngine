// pixel.js
// Surprisingly, this class doesn't have any dependencies. Amazing!

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
        this.mapArray = new Array(this.mapDims.x * this.mapDims.y).fill(0);
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

module.exports = Pixel;