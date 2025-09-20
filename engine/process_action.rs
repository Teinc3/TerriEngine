use crate::config::{Instructions, IFS};
use crate::interest::Interest;
use crate::speed::Speed;
use crate::game_statistics::GameStatistics;
use serde::Serialize;

/// Serializable state for the ProcessAction component
#[derive(Debug, Clone, Serialize)]
pub struct ProcessActionState {
    pub ratio_base: i32,
}

/// Processes attack actions based on IFS (Info-For-Send) instructions
#[derive(Debug, Clone)]
pub struct ProcessAction {
    ratio_base: i32,
}

impl ProcessAction {
    pub fn new() -> Self {
        Self {
            ratio_base: 1000,
        }
    }

    /// Process attacks for the current tick
    /// Returns false if an illegal attack takes place, true otherwise
    pub fn update(&self, tick: i32, instructions: &Instructions, interest: &mut Interest, speed: &mut Speed, game_statistics: &mut GameStatistics) -> bool {
        // Find IFS for current tick
        let ifs = instructions.ifses.iter().find(|ifs| ifs.ifs == tick);
        match ifs {
            None => true, // No attack this tick, still safe
            Some(ifs) => {
                if !self.is_info_send(tick) && !instructions.singleplayer.unwrap_or(false) {
                    panic!("{} is not an IFS tick!", tick);
                }
                self.process_attack(ifs, instructions, interest, speed, game_statistics)
            }
        }
    }

    /// Check if the current tick is an info send tick (every 7 ticks)
    fn is_info_send(&self, tick: i32) -> bool {
        tick % 7 == 0
    }

    /// Process a specific attack based on IFS instructions
    /// Returns false if attack is impossible, true if successful
    fn process_attack(&self, ifs: &IFS, instructions: &Instructions, interest: &mut Interest, speed: &mut Speed, game_statistics: &mut GameStatistics) -> bool {
        let tax = interest.troops * 3 / 256;
        let use_ratio = ifs.ratio.is_some();
        
        let mut amount = if use_ratio {
            let ratio = ifs.ratio.unwrap();
            interest.troops * ratio / self.ratio_base
        } else {
            ifs.troops.unwrap_or(0)
        };

        let no_tax_on_attack = instructions.options
            .as_ref()
            .and_then(|opt| opt.no_tax_on_attack)
            .unwrap_or(false);

        if use_ratio || !no_tax_on_attack {
            amount -= if amount * 2 >= interest.troops { tax } else { 0 };
        }

        if amount > 2 { // minDefensePerSquare - minimum 2 troops per pixel attacked
            interest.troops -= amount + tax;
            if interest.troops < 0 {
                return false; // Impossible attack
            }
            game_statistics.expenses[0] += tax;
            game_statistics.expenses[1] += amount;
            speed.add_entry(amount);
            true // Attack successful
        } else {
            false // No attack executed
        }
    }

    /// Load state from a previous simulation
    pub fn load_state(&mut self, state: &ProcessActionState) {
        self.ratio_base = state.ratio_base;
    }

    /// Save current state for serialization
    pub fn save_state(&self) -> ProcessActionState {
        ProcessActionState {
            ratio_base: self.ratio_base,
        }
    }
}