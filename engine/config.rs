use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct IFS {
    #[serde(rename = "IFS")]
    pub ifs: i32,
    pub troops: Option<i32>,
    pub ratio: Option<i32>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(untagged)]
pub enum LegacyValue {
    Bool(bool),
    Int(i32),
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Timings {
    pub legacy: Option<LegacyValue>,
    #[serde(rename = "simDuration")]
    pub sim_duration: Option<i32>,
}

impl Timings {
    pub fn legacy_tick(&self) -> Option<i32> {
        match &self.legacy {
            Some(LegacyValue::Int(tick)) => Some(*tick),
            Some(LegacyValue::Bool(false)) | None => None,
            Some(LegacyValue::Bool(true)) => None, // Invalid case, treat as None
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Options {
    #[serde(rename = "noTaxOnAttack")]
    pub no_tax_on_attack: Option<bool>,
    #[serde(rename = "storeCycleResults")]
    pub store_cycle_results: Option<bool>,
    #[serde(rename = "pruneMoreTroops")]
    pub prune_more_troops: Option<bool>,
    #[serde(rename = "storeSimLogs")]
    pub store_sim_logs: Option<bool>,
    #[serde(rename = "checkAllAUInterval")]
    pub check_all_au_interval: Option<bool>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Instructions {
    #[serde(rename = "IFSes")]
    pub ifses: Vec<IFS>,
    pub timings: Timings,
    pub singleplayer: Option<bool>,
    pub options: Option<Options>,
}

#[derive(Debug, Clone, Serialize)]
pub struct SimulationLog {
    pub tick: i32,
    pub troops: i32,
    pub land: i32,
    pub remaining: i32,
    pub oi: i32,
    pub tax: i32,
}

#[derive(Debug, Clone, Serialize)]
pub struct LegacyResults {
    pub troops: Option<i32>,
    pub oi: Option<i32>,
    pub remaining: Option<i32>,
}

#[derive(Debug, Clone, Serialize)]
pub struct SimulationResult {
    #[serde(rename = "IFSes")]
    pub ifses: Vec<IFS>,
    pub troops: i32,
    pub land: i32,
    pub oi: i32,
    pub tax: i32,
    pub remaining: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub logs: Option<Vec<SimulationLog>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub legacy: Option<LegacyResults>,
}