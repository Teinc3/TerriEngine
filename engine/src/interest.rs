use crate::pixel::Pixel;
use crate::game_statistics::GameStatistics;

#[derive(Debug, Clone)]
pub struct Interest {
    pub troops: i32,
}

impl Interest {
    pub fn new() -> Self {
        Self { troops: 0 }
    }

    pub fn update(&mut self, tick: i32, pixel: &Pixel, game_statistics: &mut GameStatistics) {
        if tick % 10 == 9 {
            let new_interest = std::cmp::max(
                1,
                self.troops * self.get_interest_rate(tick, pixel.land) / 10000
            );
            self.troops += new_interest;
            let troops_lost = self.cap_troops(pixel.land);
            game_statistics.income[1] += new_interest - troops_lost;
            
            if tick % 100 == 99 {
                self.troops += pixel.land;
                let troops_lost = self.cap_troops(pixel.land);
                game_statistics.income[0] += pixel.land - troops_lost;
            }
        }
    }

    pub fn get_interest_rate(&self, tick: i32, land: i32) -> i32 {
        let mut interest_rate = self.get_base_i_rate(tick);
        let max_interest = 100 * land;
        if self.troops > max_interest {
            interest_rate -= (2 * interest_rate * (self.troops - max_interest)) / max_interest;
        }
        interest_rate.clamp(0, 700)
    }

    pub fn get_base_i_rate(&self, tick: i32) -> i32 {
        (100 * (13440 - 6 * tick)) / 1920
    }

    pub fn cap_troops(&mut self, land: i32) -> i32 {
        let max_troops = 150 * land;
        if self.troops > max_troops {
            let troops_lost = self.troops - max_troops;
            self.troops = max_troops;
            troops_lost
        } else {
            0
        }
    }

    pub fn load_state(&mut self, troops: i32) {
        self.troops = troops;
    }
}