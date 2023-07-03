// algo.js

const pixel = require('./pixel.js');
const speed = require('./speed.js');
const interest = require('./interest.js');

const neutCost = 2;
var markedPixels = [];

const attackProcessInit = () => {
    // Mark all neutral pixels which we can capture.
    markPossiblePixels();
    if (markedPixels.length == 0) returnRemaining();
    else {
        if (Math.floor(speed.getRemaining() / markedPixels.length) > neutCost) takeBorderPixels();
        else returnRemaining();
    }
}

const markPossiblePixels = () => {
    markedPixels = [];
    for (let borderPixel of pixel.getBorderPixels()) {
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
            var pIndex = pixel.getIndex(x, y);
            if (pixel.getValue[pIndex] === 0) {
                markedPixels.push(pIndex);
                break;
            }
        }
    }
}

const returnRemaining = () => {
    interest.setTroops(interest.getTroops() + speed.getRemaining());
    speed.removeEntry();
}

const takeBorderPixels = () => {
    speed.setRemaining(speed.getRemaining() - markedPixels.length * neutCost);
    for (let pIndex of markedPixels) {
        pixel.setPixel(pixel.getX(pIndex), pixel.getY(pIndex), 1);
    }
    //Now change all pixels which are not border pixels to neutral pixels
    pixel.updatePixels();
}

module.exports = {
    attackProcessInit
}