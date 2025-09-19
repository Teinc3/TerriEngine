use crate::pixel::Pixel;
use crate::algo::Algo;
use crate::interest::Interest;
use crate::game_statistics::GameStatistics;
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct SpeedState {
    pub new_attack_intervals_left: i32,
    pub intervals_left: i32,
    pub attacking: bool,
    pub remaining: i32,
}

#[derive(Debug, Clone)]
pub struct Speed {
    pub new_attack_intervals_left: i32,
    pub intervals_left: i32,
    pub attacking: bool,
    pub remaining: i32,
}

impl Speed {
    pub fn new() -> Self {
        Self {
            new_attack_intervals_left: 6,
            intervals_left: 0,
            attacking: false,
            remaining: 0,
        }
    }

    pub fn set_speed_interval(&mut self, pixel: &Pixel) {
        self.intervals_left = if self.intervals_left == 10 {
            self.new_attack_intervals_left
        } else if pixel.land < 1000 {
            3
        } else if pixel.land < 10000 {
            2
        } else {
            1
        };
    }

    pub fn update(&mut self, pixel: &mut Pixel, algo: &mut Algo, interest: &mut Interest, game_statistics: &mut GameStatistics) {
        if !self.attacking {
            return;
        }
        
        if self.intervals_left == 10 {
            self.set_speed_interval(pixel);
        } else if self.intervals_left == 0 {
            self.intervals_left -= 1; // Mimic the post-decrement: check 0, then decrement to -1
            self.set_speed_interval(pixel);
            algo.attack_process_init(self, pixel, interest, game_statistics);
        } else {
            self.intervals_left -= 1;
        }
    }

    pub fn remove_entry(&mut self) {
        self.attacking = false;
        self.remaining = 0;
    }

    pub fn add_entry(&mut self, amount: i32) {
        if self.attacking {
            self.remaining += amount;
        } else {
            self.attacking = true;
            self.intervals_left = 10;
            self.remaining = amount;
        }
    }

    pub fn load_state(&mut self, state: &SpeedState) {
        self.new_attack_intervals_left = state.new_attack_intervals_left;
        self.intervals_left = state.intervals_left;
        self.attacking = state.attacking;
        self.remaining = state.remaining;
    }

    pub fn save_state(&self) -> SpeedState {
        SpeedState {
            new_attack_intervals_left: self.new_attack_intervals_left,
            intervals_left: self.intervals_left,
            attacking: self.attacking,
            remaining: self.remaining,
        }
    }
}