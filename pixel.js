// pixel.js

const mapDims = {
    x: 200,
    y: 200
};
var mapArray = new Array(mapDims.x * mapDims.y).fill(0);

const getX = (pIndex) => {
    return pIndex % mapDims.x;
}
const getY = (pIndex) => {
    return Math.floor(pIndex / mapDims.x);
}
const getIndex = (x, y) => {
    return y * mapDims.x + x;
}
const getLand = () => {
    return mapArray.filter((value) => value  >= 1).length;
}
const getValue = (pIndex) => {
    return mapArray[pIndex];
}
const getBorderPixels = () => {
    let borderPixels = [];
    for (let x = 0; x < mapDims.x; x++) {
        for (let y = 0; y < mapDims.y; y++) {
            if (mapArray[getValue(x, y)] === 2) {
                if (mapArray[getValue(x - 1, y)] === 1 || mapArray[getValue(x + 1, y)] === 1 || mapArray[getValue(x, y - 1)] === 1 || mapArray[getValue(x, y + 1)] === 1) {
                    borderPixels.push(getIndex(x, y));
                }
            }
        }
    }
    return borderPixels;
}

const setPixel = (pIndex, value) => {
    mapArray[pIndex] = value;
}
const updatePixels = () => {
    // If there are border pixels which do not border any neutral pixels, set them to inner pixels
    for (let x = 0; x < mapDims.x; x++) {
        for (let y = 0; y < mapDims.y; y++) {
            if (mapArray[getValue(x, y)] === 0) {
                if (mapArray[getValue(x - 1, y)] === 1 || mapArray[getValue(x + 1, y)] === 1 || mapArray[getValue(x, y - 1)] === 1 || mapArray[getValue(x, y + 1)] === 1) {
                    setPixel(getIndex(x, y), 2);
                }
            }
        }
    }
}

const init = () => {
    // We'll fill 4 pixels in the centre of the map with value 1, and 8 pixels outside with value 2
    for (let x = 99; x <= 102; x++) {
        for (let y = 99; y <= 102; y++) {
            if (x === 99 || x === 102 || y === 99 || y === 102) {
                if ((x === 99 || x === 102) && (y === 99 || y === 102)) continue;
                setPixel(getIndex(x, y), 2);
            } else {
                setPixel(getIndex(x, y), 1);
            }
        }
    }
}

module.exports = {
    getValue,
    getX,
    getY,
    getIndex,
    getLand,
    updatePixels,
    getBorderPixels,
    init
}