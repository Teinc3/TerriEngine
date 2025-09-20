use std::fs;
use terri_engine::{Instructions, Time};
use terri_engine::config::IFS;

fn main() {
    // Load debug config
    let config_str = fs::read_to_string("data/debug_bfs_config.json").unwrap();
    let config: Instructions = serde_json::from_str(&config_str).unwrap();
    
    // Test IFS generation for cycle 2
    println!("=== Testing Cycle 2 IFS Generation ===");
    
    let earliest_ifs = get_earliest_ifs(2);
    println!("Earliest IFS for cycle 2: {}", earliest_ifs);
    
    let cycle_ifses = get_cycle_ifses(earliest_ifs);
    println!("Generated IFSes for cycle 2:");
    for (i, ifs) in cycle_ifses.iter().enumerate() {
        println!("  IFS[{}]: {}", i, ifs.ifs);
    }
    
    println!("Number of IFSes: {}", cycle_ifses.len());
    println!("Number of combinations: {}", 1u32 << (cycle_ifses.len() + 1));
    
    // Test a few combinations
    println!("\n=== Testing Combination Logic ===");
    for combin_value in 0..8 {
        let mut combinations = vec![0; cycle_ifses.len() + 1];
        for index in 0..combinations.len() {
            combinations[index] = (combin_value >> (cycle_ifses.len() + 1 - index - 1)) & 1;
        }
        
        let mut selected_ifses = vec![];
        for (index, &enabled) in combinations[..cycle_ifses.len()].iter().enumerate() {
            if enabled == 1 {
                selected_ifses.push(cycle_ifses[index].ifs);
            }
        }
        
        let abort_final_au = combinations[cycle_ifses.len()] == 0;
        
        println!("Combination {}: {:?} -> IFSes: {:?}, AbortFinalAU: {}",
                 combin_value, combinations, selected_ifses, abort_final_au);
    }
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

fn get_next_ifs(tick: i32) -> i32 {
    ((tick + 6) / 7) * 7
}

#[derive(Debug, Clone)]
struct SimpleIFS {
    ifs: i32,
}

fn get_cycle_ifses(current_ifs: i32) -> Vec<SimpleIFS> {
    let mut cycle_ifses = vec![];
    let current_cycle = (current_ifs + 99) / 100;
    let mut ifs = current_ifs;
    
    while ifs < 100 * current_cycle {
        cycle_ifses.push(SimpleIFS { ifs });
        ifs += 7;
    }
    
    cycle_ifses
}