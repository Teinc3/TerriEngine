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

/* Task:
1. Obtain a completely random infosend (IFS) tick as initial processAtk tick
2. Calculate the number of IFSes and their respective ticks, with the range starting from initial tick all the way to before the next cycle starts
3. Repeatedly test combinations of these IFS by enabling/disabling them as reinforcement ticks through binary (0000 -> 0001 -> 0010 etc).
4. Calculate the ticks for an atk update (AU). For each "Enabled" IFS, obtain the next closest AU tick and stick it to the IFS object.
5. Calculate the number of AUs between each enabled IFS. This allows the amount of troops required during each IFS to be easily calculated.
6. Execute simulation. If running out of troops, terminate the run and continue with a different combination.
7. Log all final results in a JSON file.
*/

function generateCombinations(IFSes, combinations, currentIndex) {
    if (currentIndex === IFSes.length) {
        // All elements in combinations are set, do something with the combination
        // Valid combination found, now we map the combination back to the IFSes array (overwrite)
        // We make an object containing attributes for IFS and next closest AU tick first.
        // We can then use the objects to calculate the number of AUs between each IFS later.
        IFSes = IFSes.filter(index => combinations[index]).map(IFS => {
            return {
                IFS: IFS,
                CAUT: 0, // Closest next AU tick. For now, we just set it to 0,
                auDiffs: 0, // Number of AUs between this and next IFS/cyc end. For now, we just set it to 0
                troops: 0 // Number of troops required for this IFS. For now, we just set it to 0
            }
        });
        // Now we calculate the closest AU tick for each IFS
        var auInterval = pixel.getLand() < 1E3 ? 4 : 3
        IFSes.forEach(IFS => {
            var closestAU = initIFS + 7;
            while (closestAU < IFS.IFS) {
                closestAU += auInterval;
            }
            IFS.CAUT = closestAU;
        })
        // Task 5, Now we calculate the number of AUs between each IFS and store it in the auDiffs attribute.
        // For the last IFS we calculate the number of AUs between it and the end of the cycle (tick 98, inclusive!)
        for (var j = 0; j <= IFSes.length - 1; j++) {
            IFSes[j].auDiffs = (IFSes[j + 1].CAUT - IFSes[j].CAUT)/auInterval;
        }
        IFSes[IFSes.length - 1].auDiffs = Math.floor((98 - IFSes[IFSes.length - 1].CAUT)/auInterval); //Check if floor or ceil
        // Now calculate the number of land (and troops) required for each IFS
        // We start from the first IFS and work our way forward
        var landDiff = 0, nextExpansion = (Math.sqrt(2*pixel.getLand() + 1)/2 - .5)*4;
        IFSes.forEach(IFS => {
            landDiff = 0;
            // We Repeat this for auDiffs times: (add nextExpansion to landDiff, then nextExpansion += 4)
            for (var k = 0; k < IFS.auDiffs; k++) {
                landDiff += nextExpansion;
                nextExpansion += 4;
            }
            // Then apply amount to troops
            IFS.troops = 2 * landDiff + nextExpansion - 4;
        })

        // Now we execute the simulation
        time.init();
        var simEnd = false;
        while (!simEnd) simEnd = time.update();
        return;
    }
  
    // Toggle IFS state to 0 (disable)
    combinations[currentIndex] = 0;
    generateCombinations(IFSes, combinations, currentIndex + 1);
  
    // Toggle IFS state to 1 (enable)
    combinations[currentIndex] = 1;
    generateCombinations(IFSes, combinations, currentIndex + 1);
  }

function testLoop() {
    for (var initIFS = 56; initIFS <= 91; initIFS+=7) { // Task 1
        var IFSes = [], currentIFS = initIFS + 7;
        while (currentIFS < 100) { // Task 2
            IFSes.push(currentIFS);
            currentIFS += 7;
        }
        // Now we generate all possible binary combinations of enable/disable IFSes
        // For example, if the array is [0,0,0], the combinations will be [0,0,0], [0,0,1], [0,1,0], [0,1,1] etc.
        var combinations = Array(IFSes.length).fill(0);
        // Loop from the last element to the first element, toggle if needed and recursion until all combinations are generated
        generateCombinations(IFSes, combinations, 0);
    }
}

testLoop();