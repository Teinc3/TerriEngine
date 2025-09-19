use crate::config::{Instructions, SimulationResult, SimulationLog, LegacyResults};
use crate::pixel::Pixel;
use crate::speed::Speed;
use crate::interest::Interest;
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct GameStatisticsState {
    pub income: [i32; 2],
    pub expenses: [i32; 2],
    pub logs: Option<Vec<SimulationLog>>,
}

#[derive(Debug, Clone)]
pub struct GameStatistics {
    pub income: [i32; 2], // [Land, Interest]
    pub expenses: [i32; 2], // [Tax, Attack]
    pub store_sim_logs: bool,
    pub logs: Option<Vec<SimulationLog>>,
}

impl GameStatistics {
    pub fn new() -> Self {
        Self {
            income: [0, 0],
            expenses: [0, 0],
            store_sim_logs: false,
            logs: None,
        }
    }

    pub fn init(&mut self, instructions: &Instructions) {
        self.income = [512, 0]; // Land, Interest
        self.expenses = [0, 0]; // Tax, Attack
        self.store_sim_logs = instructions.options
            .as_ref()
            .and_then(|opt| opt.store_sim_logs)
            .unwrap_or(false);
        
        if self.store_sim_logs {
            self.logs = Some(Vec::new());
        }
    }

    pub fn get_oi(&self) -> i32 {
        self.income[1] + self.income[0]
    }

    pub fn update(&mut self, tick: i32, interest: &Interest, pixel: &Pixel, speed: &Speed) {
        if self.store_sim_logs {
            let oi = self.get_oi();
            if let Some(ref mut logs) = self.logs {
                logs.push(SimulationLog {
                    tick,
                    troops: interest.troops,
                    land: pixel.land,
                    remaining: speed.remaining,
                    oi,
                    tax: self.expenses[0],
                });
            }
        }
    }

    pub fn get_results(&self, instructions: &Instructions, interest: &Interest, pixel: &Pixel, speed: &Speed) -> SimulationResult {
        let mut result = SimulationResult {
            ifses: instructions.ifses.clone(),
            troops: interest.troops,
            land: pixel.land,
            oi: self.get_oi(),
            tax: self.expenses[0],
            remaining: speed.remaining,
            logs: None,
            legacy: None,
        };

        if self.store_sim_logs {
            result.logs = self.logs.clone();
            
            if let Some(legacy_tick) = instructions.timings.legacy_tick() {
                if let Some(ref logs) = self.logs {
                    let legacy_log = logs.iter().find(|log| log.tick == legacy_tick);
                    if let Some(log) = legacy_log {
                        result.legacy = Some(LegacyResults {
                            troops: Some(log.troops),
                            oi: Some(log.oi),
                            remaining: Some(log.remaining),
                        });
                    }
                }
            }
        }

        result
    }

    pub fn load_state(&mut self, state: &GameStatisticsState) {
        self.income = state.income;
        self.expenses = state.expenses;
        if self.store_sim_logs {
            self.logs = state.logs.clone();
        }
    }

    pub fn save_state(&self) -> GameStatisticsState {
        GameStatisticsState {
            income: self.income,
            expenses: self.expenses,
            logs: if self.store_sim_logs { self.logs.clone() } else { None },
        }
    }
}