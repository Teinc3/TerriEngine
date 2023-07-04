/*
Yo nerds now we doin opening bruteforcing for the 6th cycle cuz gb is cringe af
Anyways:
For cycle 6 ticks will be 5, 12, 19, 26, 33, 40, 47, 54, 61, 68, 75, 82, 89, 96
Formula: tick % 7 == 5
I'll test between starting tick 5 to 40
And when should we reinforce? Probably 1 infoSend earlier than
the time that the remaining amount is not enough to capture land until our reinforcement arrives.
We'll also have to end our attack at cycle 7 tick 3.

Regarding the amount we'll send:
I guess what we can do is generate reinfrocementCount-1 indep. vars which give update counts incrementing from 0 onwards
Then we can calculate if this will require more troops than what we have, if so we quit and try again
then calculate the last one by 
*/

function Opening() {
    function hasNextPermutation(arr) {
        function swap(arr, i, j) {
            const temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
        function reverse(arr, start) {
            let i = start;
            let j = arr.length - 1;
            while (i < j) {
                swap(arr, i, j);
                i++;
                j--;
            }
        }

        const n = arr.length;
        let i = n - 2;
        while (i >= 0 && arr[i] >= arr[i + 1]) {
            i--;
        }
        if (i < 0) {
            return false; // All permutations exhausted
        }
        let j = n - 1;
        while (arr[i] >= arr[j]) {
            j--;
        }
        swap(arr, i, j);
        reverse(arr, i + 1);
        return true;
    }
    var reinforcementCount = 3;
    var startingTick = 7 + 5;
    const totalUpdateCount = Math.ceil((100 - startingTick) / 3);
    var updateCounts = Array(reinforcementCount-1).fill(1).concat([totalUpdateCount-(reinforcementCount-1)]);
    
    // Example usage
    console.log(updateCounts)
    while (hasNextPermutation(updateCounts)) {
        console.log(updateCounts);
    }
    console.log("All updateCounts are already covered")
}

Opening();

/*
Hello, we will be doing a new Test!
Cycle 1: 71
Cycle 2: 62, 69, 76
Cycle 3: 60, 67, 74
Cycle 4: 65, 72
Cycle 5: 63, 70

We will also be testing the amount of overflow, from 0 (atk ends before cycle ends) to 1 (atk ends one atk update after cycle ends)
We need to check different amounts of overflow for every cycle, so there will be 3*3*2*2 = 36 tests in total on timings, and as each test we test multiple overflow, there will be 36*3 = 108 tests in total
The result of the test is the OI (Overall Income) at the start of cycle 6 precisely.
Instead of using an array, we will use individual parameters.
The problem with overflowIndex is that it dictates that every timing must have the same overFlow Index which is not what we want, we want to test every timing with different overflow index
*/

/*

function Opening() {
    function isInterestingCombination () {
        return interestingCombinations.includes(JSON.stringify([JSON.stringify(currentTimingIndex), JSON.stringify(overFlowIndex)]))
    }
    function alert() {
        mainSettings.buttons[3].active = true;
        sounds.play(4);
        mainSettings.buttons[3].active = false;
    }
    var interestingCombinations = [
        JSON.stringify([JSON.stringify([0, 0, 0, 0, 1]), JSON.stringify([0, 1, 1, 1, 0])])
    ];
    var perTickLogs = [];
    var overFlowIndex = [1, 1, 1, 1, 1];
    var currentTimingIndex = [0, 0, 0, 0, 0];
    var timings = [[71], [76, 69, 62], [74, 67, 60], [72, 65], [70, 63]];
    this.openingStats = [];
    this.init = function() {
        if (isInterestingCombination()) {
            console.log("Interesting Combination Found! Combination: ", currentTimingIndex, overFlowIndex);
            modHandler.gameSpeed = 600;
            alert();
        } else {
            this.newTest(); //For now we will just skip unrelated tests
            return
        }
        spawn.set(myID, currentMapWidth/2, currentMapHeight/2);
        spawn.update();
    }
    this.update = function() {
        modHandler.gameSpeed = isInterestingCombination() ? 600 : 600;
        perTickLogs.push({
            cycle: modHandler.cycle,
            tick: modHandler.tick,
            land: land[myID],
            troops: troops[myID],
            remaining: attacks.getTotalTroopsAttacking(myID),
            OI: statisticNumbers.numbers[8] + statisticNumbers.numbers[9] + statisticNumbers.numbers[10] + statisticNumbers.numbers[11]
        })
        if (modHandler.cycle == 6) {
            if (modHandler.tick == 8) {
                gameStateManager.onEscape();
                console.log(JSON.stringify(perTickLogs));
            }
            if (modHandler.tick == 9) this.newTest();
            return false;
        }
        //We calculate the amount of ticks left in the cycle, check how many layers of land we can capture, and decide if we need an overflow
        //Then we use the formula f^2 + 2f - i^2 - i to calculate the amount of troops we need to send to capture the land, where f is final and i is init layer
        var nextTiming = timings[modHandler.cycle - 1][currentTimingIndex[modHandler.cycle - 1]];
        if (modHandler.tick + modHandler.latency == nextTiming) {
            var initialLayer = Math.round(-1 + Math.sqrt(1 + 2 * land[myID])) / 2,
                finalLayer = Math.floor(modHandler.getSpeed(myID) * (100 - 7 - nextTiming)) + initialLayer + overFlowIndex[modHandler.cycle - 1],
                troopsRequired = 4 * (finalLayer**2 + 2 * finalLayer - initialLayer**2 - initialLayer),
                iTicksElapsed = Math.floor(nextTiming / 10) - Math.floor(modHandler.tick / 10),
                interestChange = divideFloor(100 * (13440 - 6 * ((modHandler.cycle - 1) * 100 + nextTiming + 1)), 1920) ** iTicksElapsed,
                newTroop = Math.floor(divideFloor(troops[myID] * interestChange, 1E4) + troops[myID]),
                ratio = Math.ceil(troopsRequired * 1E3 / newTroop);
            if (ratio > 1E3) {
                this.newTest();
                return false;
            }
            latencySimulator.addPendingAction(0, ratio, maxEntities, 0, 0);
        }
    }
    this.newTest = function() {
        this.openingStats.push({
            OI: statisticNumbers.numbers[8] + statisticNumbers.numbers[9] + statisticNumbers.numbers[10] + statisticNumbers.numbers[11],
            currentLand: land[myID],
            totalTroops: troops[myID] + attacks.getTotalTroopsAttacking(myID),
            timing: JSON.parse(JSON.stringify(currentTimingIndex)),
            overflow: JSON.parse(JSON.stringify(overFlowIndex))
        }); //Overall Income
        overFlowIndex[4]--;
        if (overFlowIndex[4] == -1) {
            overFlowIndex[4] = 1;
            overFlowIndex[3]--;
            if (overFlowIndex[3] == -1) {
                overFlowIndex[3] = 1;
                overFlowIndex[2]--;
                if (overFlowIndex[2] == -1) {
                    overFlowIndex[2] = 1;
                    overFlowIndex[1]--;
                    if (overFlowIndex[1] == -1) {
                        overFlowIndex[1] = 1;
                        overFlowIndex[0]--;
                        if (overFlowIndex[0] == -1) {
                            overFlowIndex[0] = 1;
                            currentTimingIndex[4]++;
                            if (currentTimingIndex[4] == 2) {
                                currentTimingIndex[4] = 0;
                                currentTimingIndex[3]++;
                                if (currentTimingIndex[3] == 2) {
                                    currentTimingIndex[3] = 0;
                                    currentTimingIndex[2]++;
                                    if (currentTimingIndex[2] == 3) {
                                        currentTimingIndex[2] = 0;
                                        currentTimingIndex[1]++;
                                        if (currentTimingIndex[1] == 3) {
                                            this.openingStats = this.openingStats.sort((a,b) => b.OI - a.OI).filter(v => v.OI >= 1E4)
                                            console.log("Test Completed! Best Run: ", this.openingStats[0] , ", Results: ", this.openingStats)
                                            alert();
                                            leaveGame()
                                            return true;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        gameInit(currentSeedSpawn, myID, playerInfo, gamemode, isContest);
    }
}

*/


/*
for (let i = 4; i >= 0; i--) {
    overFlowIndex[i]--;
    if (overFlowIndex[i] == -1) {
        overFlowIndex[i] = 1;
        if (i > 0) {
            currentTimingIndex[i - 1]++;
            if (currentTimingIndex[i - 1] == (i == 1 ? 2 : 3)) {
                if (i == 1) {
                    console.log("Test Done! Results:", this.openingStats)
                    leaveGame()
                    return true;
                }
                currentTimingIndex[i - 1] = 0;
            } else break;
        }
    } else break;
}
*/