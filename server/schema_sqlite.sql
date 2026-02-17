-- Database Schema for SysTracker RMM (SQLite)

-- Machines Table
CREATE TABLE IF NOT EXISTS machines (
    id TEXT PRIMARY KEY, -- MAC Address or UUID
    hostname TEXT NOT NULL,
    ip_address TEXT,
    os_info TEXT,
    os_distro TEXT,
    os_release TEXT,
    os_codename TEXT,
    os_serial TEXT,
    os_uefi BOOLEAN,
    uuid TEXT,
    device_name TEXT,
    users TEXT, -- JSON string of logged in users
    hardware_info TEXT, -- Stores detailed RAM, Disk, Mobo info (JSON string)
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'offline' -- online, offline, warning, error
);

-- Metrics Table (Timeseries data)
CREATE TABLE IF NOT EXISTS metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    machine_id TEXT,
    cpu_usage REAL,
    ram_usage REAL,
    disk_total_gb REAL,
    disk_free_gb REAL,
    network_up_kbps REAL,
    network_down_kbps REAL,
    active_vpn BOOLEAN,
    disk_details TEXT, -- JSON string of all drives
    processes TEXT, -- JSON string of top processes
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(machine_id) REFERENCES machines(id)
);

-- Events Table (Windows Event Logs)
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    machine_id TEXT,
    event_id INTEGER,
    source TEXT,
    message TEXT,
    severity TEXT, -- Critical, Error, Warning, Info
    timestamp DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(machine_id) REFERENCES machines(id)
);

-- System Logs Table (Agent/Server Errors)
CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    machine_id TEXT,
    level TEXT, -- info, warn, error
    message TEXT,
    stack_trace TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_metrics_machine_id_timestamp ON metrics(machine_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_events_machine_id_timestamp ON events(machine_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_machine_id_timestamp ON logs(machine_id, timestamp);
