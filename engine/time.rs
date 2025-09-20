use crate::config::{Instructions, SimulationResult};
use crate::pixel::{Pixel, PixelState};
use crate::interest::Interest;
use crate::algo::{Algo, AlgoState};
use crate::speed::{Speed, SpeedState};
use crate::game_statistics::{GameStatistics, GameStatisticsState};
use crate::process_action::{ProcessAction, ProcessActionState};
use serde::Serialize;

/// Serializable state for the entire Time (engine) component
#[derive(Debug, Clone, Serialize)]
pub struct TimeState {
    pub tick: i32,
    pub interest_troops: i32,
    pub pixel: PixelState,
    pub algo: AlgoState,
    pub speed: SpeedState,
    pub game_statistics: GameStatisticsState,
    pub process_action: ProcessActionState,
}

/// Main simulation engine that coordinates all game systems
/// 
/// This is the equivalent of the core.js file from the JavaScript version,
/// managing the game loop and component dependencies.
#[derive(Debug, Clone)]
pub struct Time {
    pub tick: i32,
    instructions: Option<Instructions>,
    pixel: Pixel,
    interest: Interest,
    algo: Algo,
    speed: Speed,
    game_statistics: GameStatistics,
    process_action: ProcessAction,
}

impl Time {
    pub fn new() -> Self {
        Self {
            tick: 0,
            instructions: None,
            pixel: Pixel::new(),
            interest: Interest::new(),
            algo: Algo::new(),
            speed: Speed::new(),
            game_statistics: GameStatistics::new(),
            process_action: ProcessAction::new(),
        }
    }

    /// Initialize the simulation with given instructions
    pub fn init(&mut self, instructions: &Instructions) {
        self.instructions = Some(instructions.clone());
        self.tick = 0;
        self.interest.troops = 512;
        self.speed.remove_entry();
        self.pixel.init();
        self.game_statistics.init(instructions);
    }

    /// Save current engine state
    pub fn save_state(&self) -> TimeState {
        TimeState {
            tick: self.tick,
            interest_troops: self.interest.troops,
            pixel: self.pixel.save_state(),
            algo: self.algo.save_state(),
            speed: self.speed.save_state(),
            game_statistics: self.game_statistics.save_state(),
            process_action: self.process_action.save_state(),
        }
    }

    /// Load engine state from a previous simulation
    pub fn load_state(&mut self, state: &TimeState) {
        self.tick = state.tick;
        self.interest.load_state(state.interest_troops);
        self.pixel.load_state(&state.pixel);
        self.algo.load_state(&state.algo);
        self.speed.load_state(&state.speed);
        self.game_statistics.load_state(&state.game_statistics);
        self.process_action.load_state(&state.process_action);
    }

    /// Get current land count (for BFS access)
    pub fn get_land(&self) -> i32 {
        self.pixel.land
    }

    /// Get current troop count (for BFS access)
    pub fn get_troops(&self) -> i32 {
        self.interest.troops
    }

    /// Get current border count (for BFS access)
    pub fn get_border(&self) -> i32 {
        self.pixel.border
    }

    /// Get remaining troops in current attack (for BFS access)
    pub fn get_remaining(&self) -> i32 {
        self.speed.remaining
    }

    /// Main game loop update
    /// Returns Ok(true) if simulation continues, Ok(false) if illegal attack occurred,
    /// or Err(SimulationResult) if simulation completed successfully
    pub fn update(&mut self) -> Result<bool, SimulationResult> {
        let instructions = self.instructions.as_ref().unwrap();
        
        // Update interest
        self.interest.update(self.tick, &self.pixel, &mut self.game_statistics);
        
        // Process actions (attacks)
        if !self.process_action.update(
            self.tick, 
            instructions, 
            &mut self.interest, 
            &mut self.speed, 
            &mut self.game_statistics
        ) {
            return Ok(false); // Illegal attack - sim ended
        }
        
        // Update speed
        self.speed.update(&mut self.pixel, &mut self.algo, &mut self.interest, &mut self.game_statistics);
        
        // Update game statistics
        self.game_statistics.update(self.tick, &self.interest, &self.pixel, &self.speed);
        
        // Increment tick
        self.tick += 1;
        
        // Check if simulation should end
        if let Some(sim_duration) = instructions.timings.sim_duration {
            if self.tick == sim_duration {
                // Sim ended, return results
                let results = self.game_statistics.get_results(
                    instructions, 
                    &self.interest, 
                    &self.pixel, 
                    &self.speed
                );
                return Err(results);
            }
        }
        
        Ok(true) // Sim has not yet ended
    }

    /// Update the IFS list for dynamic attack modification
    pub fn add_ifses(&mut self, ifses: Vec<crate::config::IFS>) {
        if let Some(ref mut instructions) = self.instructions {
            instructions.ifses = ifses;
        }
    }
}