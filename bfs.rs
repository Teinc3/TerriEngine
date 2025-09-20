use std::fs;
use std::time::Instant;
use std::collections::HashMap;
use terri_engine::{Instructions, Time};
use terri_engine::config::IFS;
use serde_json;

// Extended IFS struct for internal BFS calculations (matching JS structure)
#[derive(Debug, Clone)]
struct ExtendedIFS {
    ifs: i32,
    troops: Option<i32>,
    ratio: Option<i32>,
    caut: i32,       // Closest Attack Unit Time
    au_diffs: i32,   // Attack Unit differences  
    remarks: String, // "default", "PIAI", "AFAU"
}

impl From<IFS> for ExtendedIFS {
    fn from(ifs: IFS) -> Self {
        ExtendedIFS {
            ifs: ifs.ifs,
            troops: ifs.troops,
            ratio: ifs.ratio,
            caut: 0,
            au_diffs: 0,
            remarks: "default".to_string(),
        }
    }
}

impl From<ExtendedIFS> for IFS {
    fn from(ext_ifs: ExtendedIFS) -> Self {
        IFS {
            ifs: ext_ifs.ifs,
            troops: ext_ifs.troops,
            ratio: ext_ifs.ratio,
        }
    }
}

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
    
    // Use a for loop to go through all IFS-Combinations this cycle (matching JS exactly)
    'combin_loop: for combin_value in 0..(1u32 << (num_ifses + 1)) {
        // Convert combinValue into the combinations array (matching JS bit logic)
        let mut combinations = vec![0; num_ifses + 1];
        for index in 0..combinations.len() {
            combinations[index] = (combin_value >> (num_ifses + 1 - index - 1)) & 1;
        }
        
        // Filter out all disabled IFSes (And deepcopy our IFS objects)
        let mut base_cycle_ifses = vec![];
        for (index, &enabled) in combinations[..num_ifses].iter().enumerate() {
            if enabled == 1 {
                base_cycle_ifses.push(all_cycle_ifses[index].clone());
            }
        }
        
        let abort_final_au = combinations[num_ifses] == 0; // If true, then we abort the final AU
        
        // Check if there are enabled non-initIFS IFSes that cannot be buffered
        for (index, ifs) in base_cycle_ifses.iter_mut().enumerate() {
            if get_i_tick(ifs.ifs - 7) == get_i_tick(ifs.ifs) {
                if index == 0 {
                    // We can use it as initIFS, just that we can't set option for PIAI
                    break;
                } else {
                    // Skip this combination
                    continue 'combin_loop;
                }
            } else if index == 0 {
                // We can set option for PIAI if its initIFS
                ifs.remarks = "PIAI".to_string();
            }
        }
        
        // Determine PIAI variants
        let piai_variants = if !base_cycle_ifses.is_empty() && base_cycle_ifses[0].remarks == "PIAI" {
            2 // Can do PIAI
        } else {
            1 // Cannot do PIAI
        };
        
        // PIAI loop: for each combination, try with and without PIAI
        'piai_loop: for piai in 0..piai_variants {
            let mut cycle_ifses = base_cycle_ifses.clone();
            
            // Load the state from the previous sim
            engine.load_state(&save_state);
            
            // If there are no attacks this cycle, we skip directly to next cycle
            if !cycle_ifses.is_empty() {
                // Set first IFS to default
                cycle_ifses[0].remarks = "default".to_string();
                
                // Handle PIAI
                if piai == 1 {
                    let piai_ifs = ExtendedIFS {
                        ifs: cycle_ifses[0].ifs - 7,
                        troops: Some(3),
                        ratio: None,
                        caut: 0,
                        au_diffs: 0,
                        remarks: "PIAI".to_string(),
                    };
                    cycle_ifses.insert(0, piai_ifs);
                }
                
                // Add cycle-end marker for CAUT calculations
                cycle_ifses.push(ExtendedIFS {
                    ifs: current_cycle * 100 - 1,
                    troops: None,
                    ratio: None,
                    caut: 0,
                    au_diffs: 0,
                    remarks: "end_marker".to_string(),
                });
                
                // Calculate AU differences and CAUT (with marker present)
                if !calculate_au_and_caut(&mut cycle_ifses, &engine, current_cycle, config) {
                    continue 'piai_loop;
                }
                
                // Remove the cycle-end IFS marker (AFTER CAUT calculation)
                cycle_ifses.pop();
                
                if cycle_ifses.is_empty() {
                    if abort_final_au {
                        // Without AFAU there would be no cycleIFSes anyways so skip
                        continue 'combin_loop;
                    }
                    // If we have no IFSes left, then we skip this combination
                    continue 'combin_loop;
                } else if abort_final_au {
                    // Check if we can abort final AU
                    if let Some(last_ifs) = cycle_ifses.last() {
                        if last_ifs.au_diffs <= 1 {
                            continue 'combin_loop;
                        }
                        // Abort final AU - decrement auDiffs and mark as AFAU
                        if let Some(last_ifs_mut) = cycle_ifses.last_mut() {
                            last_ifs_mut.au_diffs -= 1;
                            last_ifs_mut.remarks = "AFAU".to_string();
                        }
                    }
                }
                
                // Calculate troops for each IFS
                calculate_troops_for_cycle_ifses(&mut cycle_ifses, &engine, piai == 1);
            }
            
            // Convert back to regular IFS and append instructions to the cycle
            let cycle_ifses_regular: Vec<IFS> = cycle_ifses.into_iter().map(|ifs| ifs.into()).collect();
            let mut all_ifses = prev_ifses.clone();
            all_ifses.extend(cycle_ifses_regular);
            engine.add_ifses(all_ifses.clone());
            
            // Run simulation up to start of next cycle
            let mut simulation_failed = false;
            while engine.tick < current_cycle * 100 {
                let result = engine.update();
                match result {
                    Ok(true) => continue,
                    Ok(false) => {
                        if abort_final_au {
                            // If we abort final AU but still fail, skip next combination too
                            continue 'combin_loop;
                        }
                        simulation_failed = true;
                        break;
                    }
                    Err(_) => break, // Simulation completed normally
                }
            }
            
            if !simulation_failed {
                // Create result - get OI and tax from game statistics
                let (oi, tax) = get_game_statistics(&engine);
                let result = BfsResult {
                    ifses: all_ifses,
                    troops: engine.get_troops(),
                    land: engine.get_land(),
                    oi,
                    tax,
                    remaining: engine.get_remaining(),
                };
                results.push(result);
            }
        }
    }
    
    results
}

fn get_earliest_ifs(cycle: i32) -> i32 {
    let earliest_tick = match cycle {
        1 => 56,
        2 => 104,
        3 => 240,
        4 => 330,
        5 => 420,
        6 => 504,
        _ => (cycle - 1) * 100,
    };
    get_next_ifs(earliest_tick)
}

fn get_cycle_ifses(current_ifs: i32) -> Vec<ExtendedIFS> {
    let mut cycle_ifses = vec![];
    let current_cycle = (current_ifs + 99) / 100; // Equivalent to Math.ceil((currentIFS + 1) / 100)
    let mut ifs = current_ifs;
    
    while ifs < 100 * current_cycle {
        cycle_ifses.push(ExtendedIFS {
            ifs,
            troops: None, // Will be calculated later
            ratio: None,
            caut: 0,
            au_diffs: 0,
            remarks: "default".to_string(),
        });
        ifs += 7; // Next IFS is 7 ticks later
    }
    
    cycle_ifses
}

fn get_next_ifs(tick: i32) -> i32 {
    // When is the next time an attack can start in multiplayer?
    ((tick + 6) / 7) * 7
}

fn get_i_tick(tick: i32) -> i32 {
    // Interest tick level of a tick (matching JS exactly)
    (tick + 1) / 10
}

fn layer_formula(land: i32) -> f64 {
    // Exact match of JavaScript layer formula
    (2.0 * land as f64 + 1.0).sqrt() / 2.0 - 0.5
}

// Calculate AU differences and CAUT for all IFSes in the cycle
fn calculate_au_and_caut(cycle_ifses: &mut Vec<ExtendedIFS>, engine: &Time, current_cycle: i32, config: &Instructions) -> bool {
    let mut index = 0;
    let mut closest_au = if !cycle_ifses.is_empty() { cycle_ifses[0].ifs + 7 } else { return false; };
    let mut accumulated_land = engine.get_land();
    let mut au_interval = if accumulated_land > 10000 { 2 } else if accumulated_land > 1000 { 3 } else { 4 };
    let cycle_end_threshold = current_cycle * 100 - 1;
    
    while index < cycle_ifses.len() {
        let mut au_diffs = 0;
        let current_ifs = cycle_ifses[index].ifs;
        
        // Calculate AU differences
        while closest_au < current_ifs {
            closest_au += au_interval;
            au_diffs += 1;
            
            // Check if we need to change the auInterval 
            if config.options.as_ref().and_then(|opt| opt.check_all_au_interval).unwrap_or(false) || au_interval == 4 {
                accumulated_land += (4.0 * (layer_formula(accumulated_land) + 1.0)) as i32;
                if accumulated_land > 10000 {
                    au_interval = 2;
                } else if accumulated_land > 1000 {
                    au_interval = 3;
                }
            }
        }
        
        // Set CAUT for this IFS
        cycle_ifses[index].caut = closest_au;
        
        if index > 0 {
            // Assign the auDiffs to the previous IFS
            cycle_ifses[index - 1].au_diffs = au_diffs;
            
            // Check if this IFS's CAUT exceeds the cycle-end IFS (second-to-last check)
            if index == cycle_ifses.len() - 2 && closest_au >= cycle_end_threshold {
                // Remove this IFS from the array
                cycle_ifses.remove(index);
                break;
            }
        } else {
            // If this is the first IFS, check if the CAUT exceeds the cycle-end IFS
            if closest_au >= cycle_end_threshold {
                // No way to actually get any land from this IFS, skip entire combination
                return false;
            }
        }
        index += 1;
    }
    
    true
}

// Calculate troops for each IFS based on the JS algorithm
fn calculate_troops_for_cycle_ifses(cycle_ifses: &mut Vec<ExtendedIFS>, engine: &Time, is_piai: bool) {
    let mut land_diff;
    let mut current_border = (2.0 * (2.0 * engine.get_land() as f64 + 1.0).sqrt() - 2.0) as i32;
    
    for (index, ifs) in cycle_ifses.iter_mut().enumerate() {
        let mut old_border_troops = 0;
        
        if is_piai && index == 0 {
            // initIFS is PIAI
            ifs.troops = Some(3);
            ifs.au_diffs = 0;
            continue;
        } else {
            land_diff = 0;
            // For initIFS, we haven't deposited any border Fee, so we don't deduct it
            // If piai, since our 1st reinforcement is delayed, we haven't actually paid any reinforcement, so we don't deduct it  
            if (!is_piai && index != 0) || (is_piai && index != 1) {
                // Save down the currentBorder, which we will deduct from troops later
                old_border_troops = current_border;
            }
        }
        
        // Repeat this for auDiffs times: (add nextExpansion to landDiff, then nextExpansion += 4)
        for _ in 0..ifs.au_diffs {
            land_diff += current_border + 4;
            current_border += 4;
        }
        
        // Calculate the troops required for this IFS
        let mut troops = 2 * land_diff + current_border - old_border_troops;
        
        // If we are doing PIAI and this is the 2nd IFS, then we deduct 3 troops here
        if is_piai && index == 1 {
            troops -= 3;
        }
        
        ifs.troops = Some(troops);
    }
}

fn get_game_statistics(_engine: &Time) -> (i32, i32) {
    // Get OI and tax from game statistics
    // For now, return placeholder values - this should access the actual game statistics
    (0, 0)
}

fn prune_results(results: Vec<BfsResult>, cycle: i32, config: &Instructions) -> Vec<BfsResult> {
    if results.is_empty() {
        return results;
    }
    
    // Step 1: Group by land value
    let mut land_map: HashMap<i32, Vec<BfsResult>> = HashMap::new();
    for result in results {
        land_map.entry(result.land).or_insert_with(Vec::new).push(result);
    }
    
    // Step 2 and 3: Find the result with the most troops for each land value and push to selected
    let mut selected = vec![];
    for (_, land_results) in land_map {
        let mut max_troops_result = land_results[0].clone();
        for result in &land_results {
            let result_troops = aggregate_troops(result);
            let max_troops = aggregate_troops(&max_troops_result);
            
            // If more troops OR same troops but fewer IFSes (easier opening)
            if result_troops > max_troops || 
               (result_troops == max_troops && result.ifses.len() < max_troops_result.ifses.len()) {
                max_troops_result = result.clone();
            }
        }
        selected.push(max_troops_result);
    }
    
    // Step 4: Prune results where both land and troops are less than another result
    let mut i = 0;
    while i < selected.len() {
        let mut should_remove = false;
        for j in 0..selected.len() {
            if i != j && selected[j].land > selected[i].land && 
               aggregate_troops(&selected[j]) >= aggregate_troops(&selected[i]) {
                should_remove = true;
                break;
            }
        }
        if should_remove {
            selected.remove(i);
            // Don't increment i since we removed an element
        } else {
            i += 1;
        }
    }
    
    // Step 5: If pruneMoreTroops is enabled, do advanced pruning
    if config.options.as_ref()
        .and_then(|opt| opt.prune_more_troops)
        .unwrap_or(false) {
        
        let mut i = 0;
        while i < selected.len() {
            // Run the engine up to the start of the next cycle for the current result
            let next_cycle_start = (cycle + 1) * 100;
            
            let mut engine = Time::new();
            engine.init(config);
            
            // Set up the engine state as in the JS version
            // Note: This is a bit tricky since we can't directly set engine.tick, engine.land, engine.troops
            // We'll need to simulate the engine to the right state
            
            // For now, skip this advanced pruning as it requires more complex engine manipulation
            // that might not be worth implementing for the initial version
            
            i += 1;
        }
    }
    
    selected
}

fn aggregate_troops(result: &BfsResult) -> i32 {
    result.troops + result.remaining
}