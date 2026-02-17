-- Database Schema for SysTracker RMM (PostgreSQL)

-- Machines Table
CREATE TABLE IF NOT EXISTS machines (
    id VARCHAR(255) PRIMARY KEY, -- MAC Address or UUID
    hostname VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    os_info VARCHAR(255),
    hardware_info JSONB, -- Stores detailed RAM, Disk, Mobo info
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'offline' -- online, offline, warning, error
);

-- Metrics Table (Timeseries data)
CREATE TABLE IF NOT EXISTS metrics (
    id SERIAL PRIMARY KEY,
    machine_id VARCHAR(255) REFERENCES machines(id),
    cpu_usage FLOAT,
    ram_usage FLOAT,
    disk_total_gb FLOAT,
    disk_free_gb FLOAT,
    disk_details JSONB, -- Stores detailed per-drive usage
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Events Table (Windows Event Logs)
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    machine_id VARCHAR(255) REFERENCES machines(id),
    event_id INTEGER,
    source VARCHAR(255),
    message TEXT,
    severity VARCHAR(50), -- Critical, Error, Warning, Info
    timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Alerts Table (System generated alerts)
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    machine_id VARCHAR(255) REFERENCES machines(id),
    type VARCHAR(50), -- CPU_HIGH, DISK_FULL, OFFINE, EVENT_ERROR
    message TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_metrics_machine_id_timestamp ON metrics(machine_id, timestamp);
CREATE INDEX idx_events_machine_id_timestamp ON events(machine_id, timestamp);
