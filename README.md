# TerriEngine
TerriEngine is an opening engine for the strategy game territorial.io. It is a simplified version of the algorithm used in game to calculate expansion and attack moves written in node.js.

## Structure
The engine files are stored within the /engine subdirectory and are as follows:
- **core.js**: The main engine file. This file combines all the other files and provides the main functions for the engine.
- **algo.js**: The algorithm file. This file contains the functions that are used to calculate the expansion of a player. Most of the functions are ripped from the web client and simplified to singleplayer only.
- **pixel.js**: The map file. This file contains the functions that handles the pixel data within the map.
- **interest.js**: The currency file. This file keeps tracks of your troops and handles interest and land income.
- **processAction.js**: The action file. This file processes the attack instructions that are sent to the engine.
- **time.js**: The time file. This file handles the time and the tick based functions.
- **gameStatistics.js**: The statistics file. This file keeps track of the game statistics (such as overall income etc) and returns the results at the end of the game.

## Usage

### Single use case
To test the engine for a single use case, open your terminal, navigate to this repo, and run the following command:

```shell
npm start [ticks to run simulation for]
```

The engine will read a file named "ifs.json" from /data and output the results of the simulation to a file named "results.json" in the same directory.

### Multiple use cases
To include the engine as a module in your own project, add the following line to your code:

```javascript
const engine = require('./engine/core.js');
```

npm package coming soon :)

## Note
This engine is simplified and NOT a perfect representation of the game engine. Some discrepancies may include:
- Multiplayer interactions are not supported
- The engine does not support interest change due to high troop count or high land count. It is assumed to decrease at a linear rate.