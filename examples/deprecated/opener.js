const fs = require('fs');
const engine = require('./src/core.js');

const results = [];

// read presets from file, if any
const instructions = JSON.parse(fs.readFileSync('../data/config.json', 'utf-8'));

let startCycle = 1;
if (instructions?.IFSes) {
    // Find the latest IFS and obtain the cycle number where we start brute-forcing
    instructions.IFSes.sort((a, b) => b.IFS - a.IFS);
    const latestIFS = instructions.IFSes[0].IFS;
    startCycle = Math.ceil((latestIFS + 1)/100) + 1; // 99 -> 2, 100 -> 3
}

const endCycle = process.argv[2] || 5, // Up to cycle 5
    legacyTime = endCycle * 100 + 8, // Next cycle start
    simEndTime = legacyTime + 100; // These should be included in the instructions

const currentIFSes = {}

for (let cycleIndex = startCycle; cycleIndex <= endCycle; cycleIndex++) {
    currentIFSes[cycleIndex] = [];
}

function testLoop(testCycle) {
    
    // Calculate all possible IFS-Combinations for this cycle
    // Step 1. First calculate the initIFS and latestIFS for this cycle
    for (let initIFS = getEarliestIFS(testCycle); initIFS <= getLatestIFS(testCycle); initIFS += 7) {
        
        // Step 2. Obtain all IFSes that are possible for this cycle.
        let cycleIFSes = getCycleIFSes(initIFS);

        // Step 3. Generate all possible combinations of IFSes for this cycle using a binary array
        const numIFSes = cycleIFSes.length;
        const combinations = Array(numIFSes).fill(0);

        // Use a for loop to go through all IFS-Combinations this cycle
        for (let combinValue = 2 ** numIFSes - 1; combinValue >= 0; combinValue--) {
            // Convert combinValue into the combinations array
            combinations = combinations.map((_, index) => (combinValue >> (3 - index)) & 1);

            // If the 1st and 2nd IFS are both disabled, then we skip this combination
            // Also, if the first and second IFS is on the same cycle, then we skip this combination
            if (!combinations[0] && !combinations[1]) continue;
            if (combinations[0] && combinations[1] && Math.floor((cycleIFSes[0].IFS + 1) / 10) - Math.floor((cycleIFSes[1] + 1) / 10) == 0) continue;

            // Now we filter out all disabled IFSes
            cycleIFSes = cycleIFSes.filter((_, index) => combinations[index]);

            // Init the simulation if its the first cycle
            if (testCycle === startCycle) engine.init(/*instructions*/);

            // Run the simulation right up to the start of the first IFS
            let results;
            while (engine.deps.time.tick < cycleIFSes[0].IFS - 1) {
                results = engine.update();
                if (results !== false) continue; // This means the simulation has failed or ended (?), so we skip this combination
            }
            
            // Now we calculate the closest AU tick, as well as the difference in AUs between each IFS.
            cycleIFSes.push({ IFS: testCycle * 100 - 1 });

            let index = 1,
                closestAU = cycleIFSes[0] + 7;
            let accumulatedLand = engine.deps.pixel.getLand();
            let auInterval = accumulatedLand > 1E3 ? 3 : 4;
            
            while (index < cycleIFSes.length) {
                const IFS = cycleIFSes[index];
                let auDiffs = 0;
                while (closestAU > IFS.IFS) {
                    closestAU += auInterval;
                    auDiffs++;
                    if (auInterval == 4) {
                        accumulatedLand += 4 * (layerFormula(accumulatedLand) + 1);
                        if (accumulatedLand > 1E3) auInterval = 3;
                    }
                }
                IFS.CAUT = closestAU;
            
                if (index > 1) {
                    cycleIFSes[index - 1].auDiffs = auDiffs;
                    // Check if this IFS's CAUT exceeds the cycle-end IFS
                    if (index == cycleIFSes.length - 2 && IFS.CAUT >= testCycle * 100 - 1) {
                        // Remove this IFS from the array
                        cycleIFSes.splice(index, 1);
                        break; // Exit the loop
                    }
                }
                index++;
            }
            
            cycleIFSes.pop(); // Remove the cycle-end IFS

            // Now we calculate the number of land (and troops) required for each IFS
            let landDiff = 0,
                currentBorder = 2 * Math.sqrt(2 * engine.deps.pixel.getLand() + 1) - 2;
            
            cycleIFSes.forEach(IFS => {
                let oldBorderTroops = 0;

                if (landDiff) { // Means not the first IFS
                    landDiff = 0;
                    // Save down the currentBorder, which we will deduct from troops later
                    oldBorderTroops = currentBorder;
                } else { // 3 troops for initIFS
                    IFS.troops = 3;
                    IFS.auDiffs = 0;
                }

                // We Repeat this for auDiffs times: (add nextExpansion to landDiff, then nextExpansion += 4)
                for (var expansionCount = 0; expansionCount < IFS.auDiffs; expansionCount++) {
                    landDiff += (currentBorder + 4);
                    currentBorder += 4;
                }
                // Then apply amount to troops
                IFS.troops = 2 * landDiff + currentBorder - oldBorderTroops;
            })

            // Run the sim up until the next cycle
            while (engine.deps.time.tick < testCycle * 100 + 4) {
                results = engine.update();
                if (results !== false) continue; // This means the simulation has failed or ended (?), so we skip this combination
            }       

            // Recursively call testLoop, which will test the next cycle
            if (testCycle <= endCycle) {
                testLoop(testCycle + 1); // Test the next cycle
                // For the next combination in this cycle, we need to reset and rerun the simulation up until the start of this cycle
                engine.init(/*instructions*/);
            } else {
                // Run the simulation until simEndTime
                let results;
                while (!(results = engine.update())) {}
                // Process the results (will be done in the future)
            }
        }
    }
}

function getNextIFS(tick) { // When is the next time an attack can start in multiplayer?
    return Math.ceil(tick / 7) * 7;
}

function getEarliestIFS(cycle) {
    // Earliest possible ticks are set to 1: 50, 2: 140, 3: 230, 4: 320, 5: 410, 6: 500 + 4 (3 for 499 + 4 < 500 + 4)
    return getNextIFS(Math.max((cycle - 1) * 100 + 3, cycle * 90 - 40));
}

function getLatestIFS(cycle) {
    // Latest possible tick to reinforce an attack
    return Math.floor((cycle * 100 - 1) / 7) * 7;
}

function getCycleIFSes(currentIFS) {
    const cycleIFSes = [];
    const currentCycle = Math.ceil((currentIFS + 1) / 100);
    while (currentIFS < 100 * currentCycle) {
        cycleIFSes.push({
            IFS: currentIFS,
            CAUT: 0,
            auDiffs: 0,
            troops: 0
        });
        currentIFS += 7;
    }
    return cycleIFSes;
}

function layerFormula(land) {
    return Math.sqrt(2 * land + 1) / 2 - 0.5;
}

function main() {
    testLoop(startCycle);
}