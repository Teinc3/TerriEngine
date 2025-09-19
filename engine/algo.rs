use crate::pixel::Pixel;
use crate::speed::Speed;
use crate::interest::Interest;
use crate::game_statistics::GameStatistics;

#[derive(Debug, Clone)]
pub struct Algo {
    neut_cost: i32,
    marked_pixel_count: i32,
}

impl Algo {
    pub fn new() -> Self {
        Self {
            neut_cost: 2,
            marked_pixel_count: 0,
        }
    }

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

    pub fn return_remaining(&self, speed: &mut Speed, interest: &mut Interest, game_statistics: &mut GameStatistics) {
        interest.troops += speed.remaining;
        game_statistics.expenses[1] -= speed.remaining;
        speed.remove_entry();
    }

    pub fn take_border_pixels(&self, speed: &mut Speed, pixel: &mut Pixel) {
        speed.remaining -= self.marked_pixel_count * self.neut_cost;
        pixel.land += self.marked_pixel_count;
        pixel.border += pixel.border_increment;
    }
}