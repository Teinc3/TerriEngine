use std::fs;
use std::time::Instant;
use terri_engine::{Instructions, Time};
use terri_engine::config::IFS;
use serde_json;

fn main() {
    let config_path = std::env::args().nth(1)
        .unwrap_or_else(|| "data/bfs_config.json".to_string());
    
    // Load config file
    let config_str = fs::read_to_string(&config_path)
        .expect(&format!("Failed to read config file: {}", config_path));
    
    let config: Instructions = serde_json::from_str(&config_str)
        .expect("Failed to parse config.json");
    
    // Validate config
    if config.timings.sim_duration.is_none() {
        panic!("Instructions cannot be loaded. Please check the validity of the config file.");
    }
    
    let sim_duration = config.timings.sim_duration.unwrap();
    let start_cycle = if config.ifses.is_empty() {
        1
    } else {
        // Find the latest IFS and obtain the cycle number where we start brute-forcing
        let latest_ifs = config.ifses.iter().map(|ifs| ifs.ifs).max().unwrap();
        (latest_ifs + 1) / 100 + 1 // 99 -> 2, 100 -> 3
    };
    
    let end_cycle = (sim_duration + 1) / 100;
    
    println!("Starting BFS from cycle {} to cycle {} (sim duration: {})", 
             start_cycle, end_cycle, sim_duration);
    
    run_bfs(&config, start_cycle, end_cycle);
}

fn run_bfs(config: &Instructions, start_cycle: i32, end_cycle: i32) {
    let mut prev_ifses: Vec<BfsResult> = vec![];
    let total_start = Instant::now();
    
    for cycle in start_cycle..=end_cycle {
        let cycle_start = Instant::now();
        
        if prev_ifses.is_empty() {
            prev_ifses = cycle_loop(cycle, vec![], config);
            prev_ifses = prune_results(prev_ifses, cycle, config);
        } else {
            let mut new_results = vec![];
            for result in prev_ifses.iter() {
                let cycle_results = cycle_loop(cycle, result.ifses.clone(), config);
                new_results.extend(cycle_results);
            }
            prev_ifses = prune_results(new_results, cycle, config);
        }
        
        let cycle_time = cycle_start.elapsed();
        println!("Cycle {} took {:.2} seconds with {} combinations generated.", 
                 cycle, cycle_time.as_secs_f64(), prev_ifses.len());
        
        // Create output directory if it doesn't exist
        fs::create_dir_all("data/bfs_data").ok();
        
        // Store cycle results if enabled
        if config.options.as_ref()
            .and_then(|opt| opt.store_cycle_results)
            .unwrap_or(false) {
            let cycle_file = format!("data/bfs_data/cycle{}.json", cycle);
            let cycle_json = serde_json::to_string_pretty(&prev_ifses)
                .expect("Failed to serialize cycle results");
            fs::write(cycle_file, cycle_json)
                .expect("Failed to write cycle results");
            println!("Cycle results logged to data/bfs_data/cycle{}.json", cycle);
        }
    }
    
    let total_time = total_start.elapsed();
    println!("Total time taken: {:.3}ms.", total_time.as_millis());
    
    // Write final results
    let results_file = "data/bfs_data/results.json";
    let results_json = serde_json::to_string_pretty(&prev_ifses)
        .expect("Failed to serialize results");
    fs::write(results_file, results_json)
        .expect("Failed to write results.json");
    
    println!("Simulation completed. Check {} for results.", results_file);
}

#[derive(Debug, Clone, serde::Serialize)]
struct BfsResult {
    #[serde(rename = "IFSes")]
    ifses: Vec<IFS>,
    troops: i32,
    land: i32,
    oi: i32,
    tax: i32,
    remaining: i32,
}

fn cycle_loop(current_cycle: i32, prev_ifses: Vec<IFS>, config: &Instructions) -> Vec<BfsResult> {
    // Generate all possible IFSes for this cycle
    let min_ifs = get_earliest_ifs(current_cycle);
    let all_cycle_ifses = get_cycle_ifses(min_ifs);
    
    let num_ifses = all_cycle_ifses.len();
    let mut results = vec![];
    
    // Run the simulation to the start of this cycle
    let mut engine = Time::new();
    engine.init(config);
    
    if current_cycle != 1 && !prev_ifses.is_empty() {
        engine.add_ifses(prev_ifses.clone());
    }
    
    // Run simulation up to start of current cycle
    while engine.tick < (current_cycle - 1) * 100 {
        let result = engine.update();
        if result.is_err() || result.unwrap() == false {
            // Simulation failed, no valid results for this branch
            return vec![];
        }
    }
    
    let save_state = engine.save_state();
    
    // Generate all possible combinations (2^n possibilities)
    for combin_value in 0..(1u32 << (num_ifses + 1)) {
        // Load the state from the previous sim
        engine.load_state(&save_state);
        
        // Determine which IFSes to include based on binary representation
        let mut base_cycle_ifses = vec![];
        for i in 0..num_ifses {
            if (combin_value >> i) & 1 == 1 {
                base_cycle_ifses.push(all_cycle_ifses[i].clone());
            }
        }
        
        // Skip if no attacks this cycle and not last combination
        if base_cycle_ifses.is_empty() && combin_value != (1u32 << num_ifses) {
            continue;
        }
        
        // Check for PIAI compatibility and process
        let can_use_piai = base_cycle_ifses.first()
            .map(|ifs| get_i_tick(ifs.ifs - 7) != get_i_tick(ifs.ifs))
            .unwrap_or(false);
        
        let piai_variants = if can_use_piai { 2 } else { 1 };
        
        for piai in 0..piai_variants {
            let mut cycle_ifses = base_cycle_ifses.clone();
            
            // Load the state again for this PIAI variant
            engine.load_state(&save_state);
            
            if !cycle_ifses.is_empty() {
                // Add PIAI if enabled
                if piai == 1 {
                    let piai_ifs = IFS {
                        ifs: cycle_ifses[0].ifs - 7,
                        troops: Some(3),
                        ratio: None,
                    };
                    cycle_ifses.insert(0, piai_ifs);
                }
                
                // Add end-of-cycle marker (this should not be processed as an attack)
                // We don't add this as it causes issues - just run to end of cycle
                
                // Calculate troops for each IFS based on AU differences
                calculate_troops_for_ifses(&mut cycle_ifses, &engine, piai == 1);
            }
            
            // Append instructions to the cycle
            let mut all_ifses = prev_ifses.clone();
            all_ifses.extend(cycle_ifses);
            engine.add_ifses(all_ifses.clone());
            
            // Run simulation up to start of next cycle
            let mut simulation_failed = false;
            while engine.tick < current_cycle * 100 {
                let result = engine.update();
                match result {
                    Ok(true) => continue,
                    Ok(false) => {
                        simulation_failed = true;
                        break;
                    }
                    Err(_) => break, // Simulation completed normally
                }
            }
            
            if !simulation_failed {
                // Create result
                let result = BfsResult {
                    ifses: all_ifses,
                    troops: engine.get_troops(),
                    land: engine.get_land(),
                    oi: 0, // We'll calculate this from game statistics if needed
                    tax: 0, // We'll calculate this from game statistics if needed  
                    remaining: engine.get_remaining(),
                };
                results.push(result);
            }
        }
    }
    
    results
}

fn get_earliest_ifs(cycle: i32) -> i32 {
    cycle * 100 // Start of cycle
}

fn get_cycle_ifses(min_ifs: i32) -> Vec<IFS> {
    let mut ifses = vec![];
    let max_ifs = min_ifs + 99; // End of cycle
    
    // Generate IFSes every 7 ticks (info send intervals)
    let mut ifs = get_next_ifs(min_ifs);
    while ifs < max_ifs {
        ifses.push(IFS {
            ifs,
            troops: None, // Will be calculated later
            ratio: None,
        });
        ifs = get_next_ifs(ifs + 1);
    }
    
    ifses
}

fn get_next_ifs(tick: i32) -> i32 {
    // Round up to next multiple of 7
    ((tick + 6) / 7) * 7
}

fn get_i_tick(tick: i32) -> i32 {
    // Interest tick calculation - every 10 ticks
    tick / 10
}

fn calculate_troops_for_ifses(cycle_ifses: &mut Vec<IFS>, engine: &Time, is_piai: bool) {
    // This is a simplified version - the original has complex AU calculation
    // For now, we'll use a basic troop calculation
    let _current_land = engine.get_land();
    let current_border = engine.get_border();
    
    let cycle_len = cycle_ifses.len();
    for (index, ifs) in cycle_ifses.iter_mut().enumerate() {
        if ifs.troops.is_none() && index < cycle_len - 1 { // Skip end marker
            // Basic troop calculation - this would need to be more sophisticated
            // in a full implementation to match the JavaScript version
            let base_troops = current_border * 2; // Basic neut cost calculation
            
            // Adjust for PIAI
            let mut troops = base_troops;
            if is_piai && index == 1 {
                troops -= 3; // Deduct PIAI troops
            }
            
            ifs.troops = Some(troops.max(1)); // Ensure at least 1 troop
        }
    }
}

fn prune_results(mut results: Vec<BfsResult>, _cycle: i32, config: &Instructions) -> Vec<BfsResult> {
    if results.is_empty() {
        return results;
    }
    
    // Basic pruning - remove clearly dominated results
    results.sort_by(|a, b| {
        // Sort by land first, then by total troops
        match a.land.cmp(&b.land) {
            std::cmp::Ordering::Equal => {
                let a_total = a.troops + a.remaining;
                let b_total = b.troops + b.remaining;
                b_total.cmp(&a_total) // Higher troops is better
            }
            other => other.reverse() // Higher land is better  
        }
    });
    
    // Keep only non-dominated results
    let mut pruned: Vec<BfsResult> = vec![];
    for result in results {
        let mut dominated = false;
        for existing in &pruned {
            if existing.land >= result.land && 
               (existing.troops + existing.remaining) >= (result.troops + result.remaining) {
                dominated = true;
                break;
            }
        }
        if !dominated {
            pruned.push(result);
        }
    }
    
    // Limit results to prevent exponential explosion
    if pruned.len() > 100 {
        pruned.truncate(100);
    }
    
    pruned
}