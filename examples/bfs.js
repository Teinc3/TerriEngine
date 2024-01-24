const engine = require('../engine/core.js');
const fs = require('fs');
const { performance } = require('perf_hooks');
const configFileName = process.argv[2] || '../data/bfs_config.json'; // Or could be ./data/config.json

// Load config file
const config = require(configFileName);

// If config is a broken file, then throw an error
if (!config || !config.IFSes || !config.timings || (!config.timings.simDuration && config.timings.simDuration !== 0)) {
    throw new Error(`Instructions cannot be loaded. Please check the validity of the ${configFileName} file.`);
}

let startCycle = 1;
if (config.IFSes && config.IFSes.length > 0) {
    // Find the latest IFS and obtain the cycle number where we start brute-forcing
    config.IFSes.sort((a, b) => b.IFS - a.IFS);
    const latestIFS = config.IFSes[0].IFS;
    startCycle = Math.ceil((latestIFS + 1) / 100) + 1; // 99 -> 2, 100 -> 3
}

const simDuration = config.simDuration,
    legacyTime = config.legacyTime || simDuration - 100, // Next cycle start
    endCycle = Math.floor((simDuration + 1) / 100); // watch legacy; 508 -> cyc5 end, 499 -> cyc4 end

function cycleLoop(currentCycle, prevIFSes) { // Change prevIFSes to prevSimState in the future

    // Generate all possible IFSes for this cycle
    const minIFS = getEarliestIFS(currentCycle);
    let baseCycleIFSes = getCycleIFSes(minIFS);

    // Generate all possible combinations of IFSes for this cycle using a binary array
    const numIFSes = baseCycleIFSes.length;
    let combinations = Array(numIFSes).fill(0);

    const results = [];

    // Use a for loop to go through all IFS-Combinations this cycle
    combinLoop: for (let combinValue = 0; combinValue < 2 ** numIFSes; combinValue++) { // 000... to 111...

        // Convert combinValue into the combinations array
        combinations.forEach((_, index) => combinations[index] = (combinValue >> (numIFSes - index - 1)) & 1);

        // Generate all possible IFSes for this cycle
        const minIFS = getEarliestIFS(currentCycle);
        baseCycleIFSes = getCycleIFSes(minIFS);

        // Filter out all disabled IFSes
        baseCycleIFSes = baseCycleIFSes.filter((_, index) => combinations[index]);

        // Check if there are enabled non-initIFS IFSes that cannot be buffered (Those that when -7 still has the same interest tick), then we skip this combination
        for (let index = 0; index < baseCycleIFSes.length; index++) {
            const IFS = baseCycleIFSes[index];
            if (getITick(IFS.IFS - 7) == getITick(IFS.IFS)) {
                if (index == 0) { // We can use it as initIFS, just that we can't set option for PIAI
                    break;
                } else {
                    // console.log(`${combinValue} (${baseCycleIFSes.map(obj => obj.IFS)}): FAILED (IFS NON-BUFFERABLE)`); // Log Failures
                    continue combinLoop;
                }
            } else if (index == 0) { // We can set option for PIAI if its initIFS
                IFS.PIAI = true;
            }
        }

        // If PIAI is allowed for this IFS, then we make a for loop; one with PIAI ON and one OFF
        // For the one ON, we unshift an IFS of tick IFS-7 and troops 3 to the cycleIFSes array
        piaiLoop: for (let piai = 0; piai < ((baseCycleIFSes.length == 0 || !baseCycleIFSes[0].PIAI) ? 1 : 2); piai++) {

            const cycleIFSes = JSON.parse(JSON.stringify(baseCycleIFSes)); // Deep copy our base

            // Init the engine using our new config
            engine.init(config);

            if (currentCycle !== startCycle) {
                // Use engine savestate IN THE FUTURE;
                // We set our instructions for now
                engine.addIFSes(prevIFSes);
            }

            // If there are no attacks this cycle, we skip directly to next cycle

/*             // CHECK
            if (currentCycle == 2 && prevIFSes.length == 0 && cycleIFSes.length == 0) {
                console.log("Damn interesting");
            } */

            if (cycleIFSes.length !== 0) {

                cycleIFSes[0].PIAI = false;
                if (piai == 1) {
                    cycleIFSes.unshift({
                        IFS: cycleIFSes[0].IFS - 7,
                        troops: 3,
                        auDiffs: 0,
                        PIAI: true
                    });
                }
                
                // Run the simulation to the start of this cycle
                let engineResult;
                while (engine.tick < (currentCycle - 1) * 100 + 4) {
                    engineResult = engine.update();
                    if (engineResult !== true) {
                        //console.log(`${combinValue} (${cycleIFSes.map(obj => obj.IFS)}) @ PIAI ${piai == 1}: FAILED (CAN'T REACH CYCLE)`); // Log failures
                        continue combinLoop; // Obviously we wont last until PIAI, so we directly skip to combinLoop
                    }
                    // False results means the simulation has failed or ended prematurely (?), so we skip the combination
                }

                cycleIFSes.push({ IFS: currentCycle * 100 - 1 }); // This is added to ensure that the last IFS's AUs can be calculated properly as at x99 engine enters new cycle

                // Now we calculate the closest AU tick, as well as the difference in AUs between each IFS.
                let index = 0, // Initially this was 1, but because we want to prune the IFS if it's too late, we start from 0
                    closestAU = cycleIFSes[0].IFS + 7;
                let accumulatedLand = engine.deps.pixel.getLand();
                let auInterval = accumulatedLand > 1E3 ? 3 : 4;

                while (index < cycleIFSes.length) {
                    const IFS = cycleIFSes[index];
                    let auDiffs = 0;
                    while (closestAU < IFS.IFS) { // At cAU = IFS[i], the auDiff should be counted towards i and not i-1, so we use < instead of <=
                        closestAU += auInterval;
                        auDiffs++;
                        if (auInterval == 4) { // This helps us check if we need to change the auInterval (if we change it, we don't have to check again anymore)
                            accumulatedLand += 4 * (layerFormula(accumulatedLand) + 1);
                            if (accumulatedLand > 1E3) auInterval = 3;
                        }
                    }
                    IFS.CAUT = closestAU;
                
                    if (index > 0) {
                        // We assign the auDiffs to the previous IFS
                        // Note that the auInterval for the first IFS is always 7 so auDiffs will always be 0, hence index > 0 for our if condition
                        cycleIFSes[index - 1].auDiffs = auDiffs;

                        // Check if this IFS's CAUT exceeds the cycle-end IFS (which means if we reinforce it then AU occurs after cycle end)
                        if (index == cycleIFSes.length - 2 && IFS.CAUT >= currentCycle * 100 - 1) {
                            // Remove this IFS from the array
                            cycleIFSes.splice(index, 1);
                            break; // Exit the loop
                        }
                    } else {
                        // If this is the first IFS, then we check if the CAUT exceeds the cycle-end IFS
                        if (IFS.CAUT >= currentCycle * 100 - 1) {
                            // No way to actually get any land from this IFS, so we skip this combination
                            // console.log(`${combinValue} (${cycleIFSes.map(obj => obj.IFS)}) @ PIAI ${piai == 1}: FAILED (NO POSSIBLE LAND)`); // Log failures
                            continue piaiLoop; // It might be possible that we get a few AUs if this was piai, so we skip to the next piaiLoop
                        }
                    }
                    index++;
                }
                
                cycleIFSes.pop(); // Remove the cycle-end IFS that assisted our CAUT calculations

                if (cycleIFSes.length == 0) {
                    //console.log(`${combinValue} (${cycleIFSes.map(obj => obj.IFS)}) @ PIAI ${piai == 1}: FAILED (DUPLICATE, NO POSSIBLE LAND)`); // Log failures
                    continue combinLoop; // If we have no IFSes left, then we skip this combination (Since we should have already checked for this earlier)
                }

                // Now we calculate the number of land (and troops) required for each IFS
                let landDiff = 0,
                currentBorder = 2 * Math.sqrt(2 * engine.deps.pixel.getLand() + 1) - 2;
                
                cycleIFSes.forEach((IFS, index) => {
                    let oldBorderTroops = 0;

                    if (piai == 1 && index == 0) { // initIFS is PIAI
                        IFS.troops = 3;
                        IFS.auDiffs = 0;
                        return;
                    } else {
                        landDiff = 0;
                        // For initIFS, we haven't deposited any border Fee, so we don't deduct it 
                        // If piai, since our 1st reinforcement is delayed, we haven't actually paid any reinforcement, so we don't deduct it
                        if (piai == 0 && index != 0 || piai == 1 && index != 1) {
                            // Save down the currentBorder, which we will deduct from troops later
                            oldBorderTroops = currentBorder;
                        }
                    }

                    // We Repeat this for auDiffs times: (add nextExpansion to landDiff, then nextExpansion += 4)
                    for (var expansionCount = 0; expansionCount < IFS.auDiffs; expansionCount++) {
                        landDiff += (currentBorder + 4);
                        currentBorder += 4;
                    }

                    // Now we calculate the troops required for this IFS
                    IFS.troops = 2 * landDiff + currentBorder - oldBorderTroops;

                    // If we are doing PIAI and this is the 2nd IFS, then we deduct 3 troops here
                    if (piai == 1 && index == 1) IFS.troops -= 3;
                });               
            }

            // Append our instructions to the cycle.
            engine.addIFSes([...prevIFSes, ...cycleIFSes]);

            // Here we run the simulation up to the start of next cycle
            let engineResult;
            while (engine.tick < currentCycle * 100 + 4) {
                engineResult = engine.update();
                if (!engineResult || typeof engineResult == 'object') { // false = failed
                    //console.log(`${combinValue} (${cycleIFSes.map(obj => obj.IFS)}) @ PIAI ${piai == 1}: FAILED (INVALID ATTACK)`); //Log failures
                    continue combinLoop; // At the same tick, no PIAI will always have more troops than PIAI, so we skip this combination if it fails
                }
                // False results means the simulation has failed or ended prematurely (?), so we skip the combination
            }

            // Push the results
            const result = engine.deps.gameStatistics.getResults(engine.instructions);
            results.push(result);
            //console.log(`${combinValue} (${result.IFSes.map(obj => obj.IFS)}) @ PIAI ${piai == 1}: (${result.troops}, ${result.land}) with ${result.oi}`);
        }
    }

    return pruneResults(results);
}

function main() {
    // Here we run the cycle loop
    let prevIFSes = [];
    const performances = [];

    for (let cycle = startCycle; cycle <= endCycle; cycle++) {
        const cycleStartTime = performance.now();

        if (prevIFSes.length == 0) {
            prevIFSes = cycleLoop(cycle, []);
        } else {
            for (let index = 0; index < prevIFSes.length; index++) {
                // Deepcopy the prevIFSes[index]
                const prevIFS = JSON.parse(JSON.stringify(prevIFSes[index].IFSes));
                prevIFSes[index] = cycleLoop(cycle, prevIFS);
            }

            // Merge the prevIFSes into a single array
            prevIFSes = prevIFSes.reduce((arr, curr) => [...arr, ...curr], []);

            // Prune the prevIFSes
            prevIFSes = pruneResults(prevIFSes);
        }

        const cycleEndTime = performance.now();
        performances.push(cycleEndTime - cycleStartTime);
        console.log(`Cycle ${cycle} took ${Math.round((cycleEndTime - cycleStartTime)/10)/100} seconds.`);
        if (config.options?.storeCycleResults) {
            fs.writeFileSync(`./data/results_cycle${cycle}.json`, JSON.stringify(results));
            console.log(`Cycle results logged to ./data/result_cycle${cycle}.json.`);        
        }
    }

    // Here we print the results
    console.log(`Total time taken: ${performances.reduce((sum, curr) => sum + curr, 0)}ms.`);
    console.log("Simulation completed. Check ./data/results.json for results.");
    fs.writeFileSync('./data/results.json', JSON.stringify(prevIFSes));
}

function getNextIFS(tick) { // When is the next time an attack can start in multiplayer?
    return Math.ceil(tick / 7) * 7;
}

function getEarliestIFS(cycle) {
    // Earliest possible ticks are set to 1: 40, 2: 132, 3: 224, 4: 316, 5: 408, 6: 500 + 4 (3 for 499 + 4 < 500 + 4)
    return getNextIFS(Math.max((cycle - 1) * 100 + 3, cycle * 92 - 52));
}

function getLatestIFS(cycle) {
    // Latest possible tick to reinforce an attack
    return Math.floor((cycle * 100 - 1) / 7) * 7;
}

function getITick(tick) {
    // Interest tick level of a tick
    return Math.floor((tick + 1) / 10);
}

function layerFormula(land) {
    return Math.sqrt(2 * land + 1) / 2 - 0.5;
}

function getCycleIFSes(currentIFS) {
    const cycleIFSes = [];
    const currentCycle = Math.ceil((currentIFS + 1) / 100);
    while (currentIFS < 100 * currentCycle) {
        cycleIFSes.push({
            IFS: currentIFS,
            CAUT: 0,
            auDiffs: 0,
            troops: 0,
            PIAI: false
        });
        currentIFS += 7;
    }
    return cycleIFSes;
}

function pruneResults(results) {
    // Here we do alpha-beta pruning for all collected combinations, and raise them to the next cycle.
    let selected = []; // This is the array of selected combinations

    // Step 1: Group by land value
    const landMap = results.reduce((map, result) => {
        if (!map[result.land]) {
            map[result.land] = [];
        }
        map[result.land].push(result);
        return map;
    }, {});

    // Step 2 and 3: Find the result with the most troops for each land value and push to selected
    for (let land in landMap) {
        let maxTroopsResult = landMap[land].reduce((max, result) => result.troops > max.troops ? result : max, landMap[land][0]);
        selected.push(maxTroopsResult);
    }

    // Step 4: Prune results where both land and troops are less than another result
    selected = selected.filter((resultA, indexA) => {
        return !selected.some((resultB, indexB) => indexB !== indexA && resultB.land > resultA.land && resultB.troops > resultA.troops);
    });

    return selected;
}

main();