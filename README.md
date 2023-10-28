# TerriEngine
TerriEngine is an opening engine for the strategy game territorial.io. It is a simplified version of the algorithm used in game to calculate expansion and attack moves written in node.js.

## Structure
The engine files are stored within the `/engine` subdirectory and are as follows:
- **core.js**: The main engine file. This file combines all the other files and provides the main functions for the engine.
- **algo.js**: The algorithm file. This file contains the functions that are used to calculate the expansion process.
- **pixel.js**: The map file. This file contains the functions that handles the pixel ownership within the map.
- **interest.js**: The currency file. This file keeps tracks of your troops and handles interest and land income.
- **processAction.js**: The action file. This file processes the attack instructions that are sent to the engine.
- **time.js**: The time file. This file handles the time and the tick based functions.
- **gameStatistics.js**: The statistics file. This file keeps track of the game statistics (such as overall income etc) and returns the results at the end of the game.

## Usage

### Single use case
To test the engine for a single use case, run the following command in the repository directory:

```shell
npm start
```

The engine will read attack instructions from `/data/ifs.json` and output the results of the simulation to `results.json` in the same directory.

### Multiple use cases
To include the engine as a module in your own project, add the following line to your code:

```javascript
const engine = require('./engine/core.js');
```

You can then use the engine by calling the following properties:
    
```javascript
engine.init(); // Initialize the engine to the initial state
const simResult = engine.update(); // Runs the engine for one tick and returns the simulation result.
```

The simulation result varies depending on the state of simulation.
- If the simulation is still running, the result will be `false`.
- If there is an error with one of the attack instructions, the result will be `true`.
- If the simulation has ended successfully, the result will be an object containing the statistics of the simulation.

## Hotkey Calculator
The hotkey calculator is a tool that calculates the optimal hotkeys to press which changes the troop selector's percentage from one initial value to another.

Documentation for use cases will be added soon.

## Note
This engine is simplified and NOT a perfect representation of the game engine. Some discrepancies may include:
- Multiplayer interactions are not supported.
- The engine does not support interest change due to high troop count or high land count. It is assumed to decrease at a linear rate.