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

// gameStatistics.js

class GameStatistics {
    constructor() {
        this.results = [];
    }
    init() {
        this.income = [512,0]; //Land, Interest
        this.expenses = [0,0]; //Tax, Attack
        this.logs = [];
    }
    getOI() {
        return this.income[1] + this.income[0];
    }
    update() {
        this.logs.push({
            tick: time.tick,
            troops: interest.troops,
            land: pixel.getLand(),
            remaining: speed.remaining,
            oi: this.getOI(),
            tax: this.expenses[0]
        })
    }
}

// processAction.js

class ProcessAction {
    constructor() {}
  
    update() {
        var pendingAttacks = algoLoopPreset && time.tick < (testCycle-1)*100+7 ? algoLoopPreset : IFSes;
        for (let IFS of pendingAttacks) {
            if (time.tick === IFS.IFS) {
                if (!this.isInfoSend()) console.log(time.tick, " is not an IFS tick!");
                if (this.processAttack(IFS.troops)) break;
                else return false;
            }
        }
        return true;
    }
  
    isInfoSend() {
        return time.tick % 7 === 0;
    }
  
    processAttack(amount) {
        var tax = Math.floor(interest.troops * 3 / 256);
        amount -= amount * 2 >= interest.troops ? tax : 0;
        if (amount > 0) {
            interest.troops -= (amount + tax);
            if (interest.troops < 0) return false //Combination failed nerd
            gameStatistics.expenses[0] += tax;
            gameStatistics.expenses[1] += amount;
            speed.addEntry(amount);
            return true;
        } else {
            console.log("Combination failed!", IFSes)
            return false;
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
        gameStatistics.init();
        if (algoLoopPreset) {
            while (this.tick < (testCycle-1)*100+7) this.update();
        }
    }
  
    update() {
        interest.update();
        if (!processAction.update()) return true;
        speed.update();
        gameStatistics.update();
        this.tick++;
        if (this.tick == simEndTime) {
            gameStatistics.results.push({
                IFSes: IFSes,
                legacy: {
                    troops: gameStatistics.logs.find(log => log.tick == legacyTime).troops,
                    oi: gameStatistics.logs.find(log => log.tick == legacyTime).oi,
                },
                troops: interest.troops,
                land: pixel.getLand(),
                oi: gameStatistics.getOI(),
                tax: gameStatistics.expenses[0],
            });
            return true;
        } else return false;
    }
}

// index.js

const fs = require('fs');

var algo = new Algo, interest = new Interest, pixel = new Pixel, processAction = new ProcessAction, speed = new Speed, time = new Time, gameStatistics = new GameStatistics;

/* Task:
1. Obtain a completely random infosend (IFS) tick as initial processAtk tick
2. Calculate the number of IFSes and their respective ticks, with the range starting from initial tick all the way to before the next cycle starts
3. Repeatedly test combinations of these IFS by enabling/disabling them as reinforcement ticks through binary (0000 -> 0001 -> 0010 etc).
4. Calculate the ticks for an atk update (AU). For each "Enabled" IFS, obtain the next closest AU tick and stick it to the IFS object.
5. Calculate the number of AUs between each enabled IFS. This allows the amount of troops required during each IFS to be easily calculated.
6. Execute simulation. If running out of troops, terminate the run and continue with a different combination.
7. Log all final results in a JSON file.
*/

var algoLoopPreset, testCycle, IFSes, legacyTime, simEndTime, enableInitAtk;

function setupIFSes(initIFS) {
    IFSes = [];
    var currentIFS = initIFS + 7;
    while (currentIFS < testCycle*100-1) { // Task 2
        IFSes.push({ //We make an object containing attributes for IFS and next closest AU tick first, then use the objects to calculate the number of AUs between each IFS later.
            IFS: currentIFS,
            CAUT: 0, // Closest next AU tick. For now, we just set it to 0,
            auDiffs: 0, // Number of AUs between this and next IFS/cyc end. For now, we just set it to 0
            troops: 0 // Number of troops required for this IFS. For now, we just set it to 0
        });
        currentIFS += 7;
    }
}

function testLoop() {
    for (var initIFS = Math.ceil((100 * testCycle - 41) / 7) * 7 - 7; initIFS <= Math.floor((100 * testCycle - 1) / 7) * 7; initIFS += 7) { // Cycle 2
        setupIFSes(initIFS);
        // Now we generate all possible binary combinations of enable/disable IFSes, note that the first IFS is always enabled
        // For example, if the array is [1,0,0], the combinations will be [1,0,0], [1,0,1], [1,1,0], [1,1,1] etc.
        var combinations = Array(IFSes.length).fill(0);
        for (var combinValue = Math.pow(2, IFSes.length) - 1; combinValue >= 0 ; combinValue--) {
            combinations = combinations.map((value, index) => combinValue & (1 << index) ? 1 : 0);
            // We also have to note that the first IFS is always enabled, so we set it to 1. Quit to next iteration if the first IFS is disabled
            if (!combinations[0]) continue;
            // Valid combination found, now we calculate the number of IFSes and their respective ticks
            setupIFSes(initIFS);
            IFSes = IFSes.filter((IFS, index) => combinations[index]);
            // Initialize the simulation
            time.init();
            // Now we calculate the closest AU tick for each IFS
            var auInterval = pixel.getLand() < 1E3 ? 4 : 3
            IFSes.forEach(IFS => {
                var closestAU = initIFS + 7;
                while (closestAU < IFS.IFS) {
                    closestAU += auInterval;
                }
                IFS.CAUT = closestAU;
            })
            IFSes = IFSes.filter(IFS => IFS.CAUT < testCycle*100-1); // We filter out IFSes that have AUs in the next cycle, because theres no use to reinforce for the border
            // Task 5, Now we calculate the number of AUs between each IFS and store it in the auDiffs attribute.
            // For the last IFS we calculate the number of AUs between it and the end of the cycle (tick 98, inclusive!)
            for (var IFSindex = 0; IFSindex < IFSes.length - 1; IFSindex++) {
                IFSes[IFSindex].auDiffs = (IFSes[IFSindex + 1].CAUT - IFSes[IFSindex].CAUT)/auInterval;
            }
            IFSes[IFSes.length - 1].auDiffs = 1 + Math.floor((testCycle*100 -2 - IFSes[IFSes.length - 1].CAUT)/auInterval); // We add 1 because the last IFS is inclusive itself
            // Now calculate the number of land (and troops) required for each IFS
            // We start from the first IFS and work our way forward
            var landDiff = 0, currentBorder = (Math.sqrt(2*pixel.getLand() + 1)/2 - .5)*4;
            IFSes.forEach(IFS => {
                var oldBorderTroops = 0;
                if (landDiff) { //Means not the first IFS
                    landDiff = 0;
                    // Save down the currentBorder, which we will deduct from troops later
                    oldBorderTroops = currentBorder;
                }
                // We Repeat this for auDiffs times: (add nextExpansion to landDiff, then nextExpansion += 4)
                for (var expansionCount = 0; expansionCount < IFS.auDiffs; expansionCount++) {
                    landDiff += (currentBorder+4);
                    currentBorder += 4;
                }
                // Then apply amount to troops
                IFS.troops = 2 * landDiff + currentBorder - oldBorderTroops;
            })
            // We then check and see if the first IFS and init IFS are on different cycles (so interest!), if so we have 2 combins to test:
            // 1. Remove first IFS and just send the troops in the initIFS
            // 2. Initialize attack with 1 troop for initIFS, and just send the remaining troops in the first IFS
            var cycleDiff = Math.floor((IFSes[0].IFS + 1)/10) - Math.floor((initIFS + 1)/10); // 0/1
            for (var options = 0; options <= Math.min(cycleDiff, enableInitAtk ? 1 : 0); options++) {
                if (options == 0) { //Send all troops in initIFS
                    IFSes[0].IFS = initIFS;
                } else { // Send all-1 troops in initIFS, and send 1 troop in first IFS
                    //Note that since we ran option 0 already, we have to revert the last IFS edit.
                    time.init();
                    IFSes[0].IFS = initIFS + 7;
                    IFSes[0].troops-=3;
                    // Create an IFS object for the initIFS, unshift it to the IFSes array
                    IFSes.unshift({
                        IFS: initIFS,
                        troops: 3
                    });
                }
                // Now we execute the simulation
                var simEnd = false;
                while (!simEnd) simEnd = time.update();
            }
        }
    }
    // We then sort and log all results by descending order of oi - taxes
    gameStatistics.results.sort((a, b) => (b.oi - b.tax) - (a.oi - a.tax));
    // Write the JSON string to a file
    fs.writeFileSync('openings_data.json', JSON.stringify(gameStatistics.results), 'utf-8');

    console.log("Done! The best opening is: ", gameStatistics.results[0]);
}

function main() {
    algoLoopPreset = false; //Cycle 1 Preset
    testCycle = 2;
    enableInitAtk = true;
    IFSes = [];
    simEndTime = 308;
    legacyTime = 208;
    if (algoLoopPreset) testLoop();
    else {
        IFSes = [...presets[0]]
        time.init();
        var simEnd = false;
        while (!simEnd) simEnd = time.update();
        console.log("Done! Logs for this run: ", gameStatistics.logs);
        fs.writeFileSync('opening_data.json', JSON.stringify(gameStatistics.logs), 'utf-8');
    }
}

var presets = [
    [
        //Vkij V5 Cycle 1 :flushed:
        {IFS: 63, troops: 1},
        {IFS: 70, troops: 167},
        {IFS: 84, troops: 128},
        {IFS: 91, troops: 160},
        //Cyc 2
        { IFS: 154, troops: 1 },
        { IFS: 161, CAUT: 161, auDiffs: 2, troops: 251 },
        { IFS: 168, CAUT: 169, auDiffs: 2, troops: 240 },
        { IFS: 175, CAUT: 177, auDiffs: 2, troops: 272 },
        { IFS: 182, CAUT: 185, auDiffs: 3, troops: 468 },
        { IFS: 196, CAUT: 197, auDiffs: 1, troops: 172 }
    ],
    [   
        //144 Opening
        {IFS: 70, troops: 168},
        {IFS: 91, troops: 128}
    ]
]

main();
