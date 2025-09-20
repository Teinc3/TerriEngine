fn main() {
    // Test IFS generation for cycle 2
    println!("=== Testing Cycle 2 IFS Generation ===");
    
    let earliest_ifs = get_earliest_ifs(2);
    println!("Earliest IFS for cycle 2: {}", earliest_ifs);
    
    let cycle_ifses = get_cycle_ifses(earliest_ifs);
    println!("Generated IFSes for cycle 2:");
    for (i, ifs) in cycle_ifses.iter().enumerate() {
        println!("  IFS[{}]: {}", i, ifs);
    }
    
    println!("Number of IFSes: {}", cycle_ifses.len());
    println!("Number of combinations: {}", 1u32 << (cycle_ifses.len() + 1));
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

fn get_cycle_ifses(current_ifs: i32) -> Vec<i32> {
    let mut cycle_ifses = vec![];
    let current_cycle = (current_ifs + 99) / 100;
    let mut ifs = current_ifs;
    
    while ifs < 100 * current_cycle {
        cycle_ifses.push(ifs);
        ifs += 7;
    }
    
    cycle_ifses
}