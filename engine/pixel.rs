use serde::Serialize;

/// Serializable state for the Pixel component
#[derive(Debug, Clone, Serialize)]
pub struct PixelState {
    pub land: i32,
    pub border: i32,
    pub border_increment: i32,
}

/// Pixel management system for the territorial simulation
/// 
/// Note: This doesn't have any dependencies - it's completely self-contained!
/// This is a simplified version compared to the original implementation which had
/// complex 2D map array management with boundary tracking.
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

    /// Initialize the pixel state with starting values
    /// Sets up a 4x4 starting area: 12 land pixels and 8 border pixels
    pub fn init(&mut self) {
        self.land = 12;
        self.border = 8;
        self.border_increment = 4;
    }

    /// Load state from a previous simulation
    pub fn load_state(&mut self, state: &PixelState) {
        self.land = state.land;
        self.border = state.border;
        self.border_increment = state.border_increment;
    }

    /// Save current state for serialization
    pub fn save_state(&self) -> PixelState {
        PixelState {
            land: self.land,
            border: self.border,
            border_increment: self.border_increment,
        }
    }
}