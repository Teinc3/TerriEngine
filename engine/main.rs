use std::fs;
use terri_engine::{Instructions, Time};

fn main() {
    // Read config path from command line args or use default
    let config_path = std::env::args().nth(1)
        .unwrap_or_else(|| "data/config.json".to_string());
    
    // Read and parse instructions
    let instructions_str = fs::read_to_string(&config_path)
        .expect(&format!("Failed to read config file: {}", config_path));
    
    let instructions: Instructions = serde_json::from_str(&instructions_str)
        .expect("Failed to parse config.json");
    
    // Validate instructions
    if instructions.timings.sim_duration.is_none() {
        panic!("Instructions cannot be loaded. Please check the validity of config.json in the /data folder.");
    }
    
    // Initialize engine
    let mut time = Time::new();
    time.init(&instructions);
    
    // Run simulation
    let mut results = Ok(true);
    while results.as_ref().map_or(false, |&r| r) {
        results = time.update();
    }
    
    match results {
        Ok(false) => {
            eprintln!("Simulation ended with error");
            std::process::exit(1);
        }
        Err(result) => {
            // Write results to file
            let results_json = serde_json::to_string_pretty(&result)
                .expect("Failed to serialize results");
            
            fs::write("data/results.json", results_json)
                .expect("Failed to write results.json");
            
            println!("Simulation completed. Check /data/results.json for results.");
        }
        _ => unreachable!()
    }
}
