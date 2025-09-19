use crate::pixel::Pixel;
use crate::speed::Speed;

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

    pub fn attack_process_init(&mut self, speed: &mut Speed, pixel: &mut Pixel) -> bool {
        self.marked_pixel_count = pixel.border + pixel.border_increment;
        if self.marked_pixel_count == 0 {
            speed.remove_entry();
            return true; // Signal that troops should be returned
        } else {
            let remaining = speed.remaining;
            if remaining / self.marked_pixel_count > self.neut_cost {
                self.take_border_pixels(speed, pixel);
                return false; // No troops to return
            } else {
                speed.remove_entry();
                return true; // Signal that troops should be returned
            }
        }
    }

    pub fn take_border_pixels(&self, speed: &mut Speed, pixel: &mut Pixel) {
        speed.remaining -= self.marked_pixel_count * self.neut_cost;
        pixel.land += self.marked_pixel_count;
        pixel.border += pixel.border_increment;
    }
}