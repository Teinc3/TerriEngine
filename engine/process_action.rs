use crate::config::{Instructions, IFS};
use crate::interest::Interest;
use crate::speed::Speed;
use crate::game_statistics::GameStatistics;

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

    fn is_info_send(&self, tick: i32) -> bool {
        tick % 7 == 0
    }

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

        if amount > 2 { // minDefensePerSquare
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
}