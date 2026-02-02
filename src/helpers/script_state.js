// Shared script engine state
// This module breaks circular dependencies between script_engine, script_env, and script_std
// by providing a shared state object that can be populated by script_engine and read by others.

const state = {
    // Runtime values (updated by script_engine during execution)
    t: 0,           // Current timestamp
    tf: 0,          // Main chart timeframe
    iter: 0,        // Current iteration index
    data: {},       // Data storage (datasets)
    shared: {},     // Shared variables between scripts
    mods: {},       // Modules (extensions/plugins)

    // Function references (set by script_engine on init)
    send: null,     // Send messages to DataCube
    std_inject: null, // Inject custom functions into std lib
    match_ds: null    // Match dataset id using script id & type
}

export default state
