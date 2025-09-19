use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct PixelState {
    pub land: i32,
    pub border: i32,
    pub border_increment: i32,
}

#[derive(Debug, Clone)]
pub struct Pixel {
    pub land: i32,
    pub border: i32,
    pub border_increment: i32,
}

impl Pixel {
    pub fn new() -> Self {
        Self {
            land: 0,
            border: 0,
            border_increment: 0,
        }
    }

    pub fn init(&mut self) {
        self.land = 12;
        self.border = 8;
        self.border_increment = 4;
    }

    pub fn load_state(&mut self, state: &PixelState) {
        self.land = state.land;
        self.border = state.border;
        self.border_increment = state.border_increment;
    }

    pub fn save_state(&self) -> PixelState {
        PixelState {
            land: self.land,
            border: self.border,
            border_increment: self.border_increment,
        }
    }
}