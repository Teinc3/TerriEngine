# TerriEngine
TerriEngine is an opening engine for the strategy game territorial.io. It is a simplified version of the algorithm used in game to calculate expansion and attack moves written in node.js.


## Structure
The engine files are stored within the `/src` subdirectory and are as follows:
- **core.js**: The main engine file. This file combines all the other files and provides the main functions for the engine.
- **algo.js**: The algorithm file. This file contains the functions that are used to calculate the expansion process.
- **pixel.js**: The map file. This file contains the functions that handles the pixel ownership within the map.
- **interest.js**: The currency file. This file keeps tracks of your troops and handles interest and land income.
- **processAction.js**: The action file. This file processes the attack instructions that are sent to the engine.
- **time.js**: The time file. This file handles the time and the tick based functions.
- **gameStatistics.js**: The statistics file. This file keeps track of the game statistics (such as overall income etc) and returns the results at the end of the game.


## API

### Single use case
To test the engine for a single use case, run the following command in the repository directory:

```shell
npm start
```

The engine will read attack instructions from `/data/config.json` and output the results of the simulation to `results.json` in the same directory.

### Multiple use cases
To include the engine as a module in your own project, add `engine` to `package.json` and add the following line to your code:

```javascript
const engine = require('engine');
```

You can then use the engine by calling the following methods:
    
```javascript
engine.init(INSTRUCTIONS);
const simResult = engine.update(); // either true, false or a results object
console.log(engine.tick); // 1
```

where `INSTRUCTIONS` is an array of attack instructions. See `/data/config.json` for an example.

The simulation result varies depending on the state of simulation.
- If the simulation is still running, the result will be `true`.
- If there is an error with one of the attack instructions, the result will be `false`.
- If the simulation has ended successfully, the result will be an object containing the statistics of the simulation.

Ideally, you should call `engine.update()` in a while loop with condition en `true`.

### Configurations
The engine can be configured by modifying the `config.json` file in the `/data` subdirectory. The following configurations are available:

- **IFSes**: You can insert a list of predefined attack instructions here. The engine will run the simulation correspondingly. Attribute can be left empty, but cannot be omitted.

- **timings**: Set timings to control the engine's ending condition. The following settings are available:
 - **simDuration**: The number of ticks to simulate before a result is returned. Default: `100`.
 - **legacy** (optional): Displays the amount of troops and overall income during that tick. simDuration is usually used to rank results that end at legacy ticks. Default: `false`.

- **singleplayer**: Allows attacks to be executed in Non-IFS ticks. Default: `false`.

- **options**: Allows greater customization of engine configurations
 - **noTaxOnAttack** (optional): Tax is deducted from the balance and not from the attack if the player sends more than 50% of their balance. Default: `false`.
 - **storeCycleResults** (optional): Stores the results of each cycle in an array. Default: `false`.
 - **pruneMoreTroops** (optional, BFS only): For two branches where the difference in land is greater than the difference in troops, prune the branch with more troops. Default: `false`.
 - **storeSimLogs** (optional): Stores the simulation logs in the result object. Default: `false`.


## Opening Calculator

The opening calculator is a tool that calculates the optimal opening moves to take in order to grant the player the greatest advantage in a multiplayer game.

### Working Principle

The calculator employs a Breadth-First Search (BFS) algorithm coupled with alpha-beta pruning to compute the optimal opening moves. The algorithm operates as follows:

1. **Initialization**: The calculator begins at a specified cycle. For this cycle, it computes the ticks at which the player can execute attack instructions, referred to as InFoSend (IFS) ticks.

2. **Tree Generation**: The calculator generates a tree of all possible attack instruction combinations for the cycle using a for loop. Depending on the IFS characteristics, the calculator also evaluates the feasibility of Pre-Interest Attack Initialization (PIAI).

3. **Attack Update Differences (AUDiffs) Calculation**: For each attack instruction combination, the calculator computes the number of Attack Updates (AUs) that can be executed between the current IFS and the next IFS. It then calculates the amount of land that will be captured during this period and the corresponding number of troops required for the attack.

4. **Simulation and Pruning**: The calculator simulates the attack instructions from previous cycles along with those from the current cycle. If the simulation fails due to insufficient troops, the calculator prunes the combination branch. If it succeeds, the calculator adds the combination branch to a results array.

5. **Results Pruning**: After the for loop completes, the calculator prunes the results array, removing any branch that is directly inferior to another branch (such as having both a lower troop and land count than another).

6. **Cycle Incrementation**: If the calculator has not reached the end of the game, it repeats the process for the next cycle by incrementing the cycle by 1 and injecting the results array into the calculator as previous instructions for forward simulation. This process continues until the end of the game.

7. **Results Return**: Finally, the calculator returns the results array, which contains the optimal sequence of attack instructions.


## Hotkey Calculator

**NOTE: This feature is outdated and will be updated soon.**

The hotkey calculator is a tool that calculates the optimal hotkeys to press which changes the troop selector's percentage from one initial value to another.

Documentation for use cases will be added soon.


## Terminologies

* IFS: InFoSend - Ticks when attack instructions can be executed by the engine in multiplayer.
* AU: Attack Update - Tick when a layer of land can be taken.
* CAUT: Closest AU Tick - The tick when the next AU will occur.
* AUDiffs: Attack Update Differences - The number of AU ticks between the current IFS and the next IFS.
* PIAI: Pre-Interest Attack Initialization - We initialize an attack with 3 troops here. At the next AU during the next IFS, we will reinforce the bulk of the troops, if we can gain interest between the PIIT and the next AU.
* AFAU: Abort Final Attack Update - If this is enabled, the last attack update will be removed and the attack will end prematurely before the cycle ends.

## Note
This engine is simplified and NOT a perfect representation of the game engine. Some discrepancies may include:
- Multiplayer interactions are not supported.
- The engine does not support interest change due to high land count. It is assumed to decrease at a linear rate.

## TODO

### Opening Calculator
- Add option to drop last AU if it is not needed.
- Enable option for fullsend opening at the last cycle.