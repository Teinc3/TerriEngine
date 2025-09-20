use crate::pixel::Pixel;
use crate::speed::Speed;
use crate::interest::Interest;
use crate::game_statistics::GameStatistics;
use serde::Serialize;

/// Serializable state for the Algo component
#[derive(Debug, Clone, Serialize)]
pub struct AlgoState {
    pub neut_cost: i32,
    pub marked_pixel_count: i32,
}

/// Attack algorithm for territorial expansion
/// 
/// This is a simplified version of the original implementation.
/// The original had complex pixel marking and border detection logic
/// using a 2D map array with boundary tracking.
#[derive(Debug, Clone)]
pub struct Algo {
    /// Cost in troops to neutralize one pixel (neut cost)
    neut_cost: i32,
    /// Number of pixels that can be attacked this round
    marked_pixel_count: i32,
}

impl Algo {
    pub fn new() -> Self {
        Self {
            neut_cost: 2,
            marked_pixel_count: 0,
        }
    }

    /// Initialize attack processing
    /// Decides whether to attack border pixels or return remaining troops
    pub fn attack_process_init(&mut self, speed: &mut Speed, pixel: &mut Pixel, interest: &mut Interest, game_statistics: &mut GameStatistics) {
        self.marked_pixel_count = pixel.border + pixel.border_increment;
        if self.marked_pixel_count == 0 {
            self.return_remaining(speed, interest, game_statistics);
        } else {
            let remaining = speed.remaining;
            if remaining / self.marked_pixel_count > self.neut_cost {
                self.take_border_pixels(speed, pixel);
            } else {
                self.return_remaining(speed, interest, game_statistics);
            }
        }
    }

    /// Return unused troops to the interest pool
    /// Also refunds the attack expense since troops weren't used
    pub fn return_remaining(&self, speed: &mut Speed, interest: &mut Interest, game_statistics: &mut GameStatistics) {
        interest.troops += speed.remaining;
        game_statistics.expenses[1] -= speed.remaining;
        speed.remove_entry();
    }

    /// Execute the attack on border pixels
    /// Consumes troops to gain land and expand the border
    pub fn take_border_pixels(&self, speed: &mut Speed, pixel: &mut Pixel) {
        speed.remaining -= self.marked_pixel_count * self.neut_cost;
        pixel.land += self.marked_pixel_count;
        pixel.border += pixel.border_increment;
    }

    /// Load state from a previous simulation
    pub fn load_state(&mut self, state: &AlgoState) {
        self.neut_cost = state.neut_cost;
        self.marked_pixel_count = state.marked_pixel_count;
    }

    /// Save current state for serialization
    pub fn save_state(&self) -> AlgoState {
        AlgoState {
            neut_cost: self.neut_cost,
            marked_pixel_count: self.marked_pixel_count,
        }
    }
}