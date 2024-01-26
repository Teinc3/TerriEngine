// pixel.js
// Surprisingly, this class doesn't have any dependencies. Amazing!

class Pixel {
    constructor() {
        this.mapDims = {
            x: 200,
            y: 200
        };
        this.mapArray = new Uint8Array(this.mapDims.x * this.mapDims.y).fill(0);
        this.land = 0;

        this.boundary = new Uint16Array(4);
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
  
    getBorderPixels() {
        const borderPixels = [];
        for (let x = this.boundary[0]; x <= this.boundary[1]; x++) {
            for (let y = this.boundary[2]; y <= this.boundary[3]; y++) {
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
        for (let x = this.boundary[0]; x <= this.boundary[1]; x++) {
            for (let y = this.boundary[2]; y <= this.boundary[3]; y++) {
                if (this.mapArray[this.getIndex(x, y)] === 2) {
                    if (this.mapArray[this.getIndex(x - 1, y)] && this.mapArray[this.getIndex(x + 1, y)] &&
                        this.mapArray[this.getIndex(x, y - 1)] && this.mapArray[this.getIndex(x, y + 1)]) {
                        this.setPixel(x, y, 1);
                    }
                }
            }
        }
    }

    setPixel(x, y, value) {
        this.mapArray[this.getIndex(x, y)] = value;
        if (value === 2) {
            this.land++; // From 0 to 2
            if (x < this.boundary[0]) this.boundary[0] = x;
            else if (x > this.boundary[1]) this.boundary[1] = x;
            if (y < this.boundary[2]) this.boundary[2] = y;
            else if (y > this.boundary[3]) this.boundary[3] = y;
        }
    }
  
    init() {
        this.mapArray = new Array(this.mapDims.x * this.mapDims.y).fill(0);
        for (let x = 99; x <= 102; x++) {
            for (let y = 99; y <= 102; y++) {
                if (x === 99 || x === 102 || y === 99 || y === 102) {
                    if ((x === 99 || x === 102) && (y === 99 || y === 102)) continue;
                    this.setPixel(x, y, 2);
                } else {
                    this.setPixel(x, y, 1);
                }
            }
        }
        this.land = 12;
        this.boundary[0] = this.boundary[2] = 99;
        this.boundary[1] = this.boundary[3] = 102;
    }

    loadState(pixel) {
        this.land = pixel.land;
        this.boundary = structuredClone(pixel.boundary);
        this.mapArray = new Uint8Array(pixel.mapArray.length);
        for (let i = 0; i < this.mapArray.length; i++) {
            this.mapArray[i] = pixel.mapArray[i];
        }
    }
}

module.exports = Pixel;