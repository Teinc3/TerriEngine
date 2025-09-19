use crate::config::{Instructions, SimulationResult};
use crate::pixel::Pixel;
use crate::interest::Interest;
use crate::algo::Algo;
use crate::speed::Speed;
use crate::game_statistics::GameStatistics;
use crate::process_action::ProcessAction;

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