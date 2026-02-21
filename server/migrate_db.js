const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'systracker.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error(err.message);
        process.exit(1);
    }
});

const createCommandsTable = `
CREATE TABLE IF NOT EXISTS commands (
    id TEXT PRIMARY KEY,
    machine_id TEXT NOT NULL,
    command TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    output TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY(machine_id) REFERENCES machines(id)
);
`;

const createScriptsTable = `
CREATE TABLE IF NOT EXISTS saved_scripts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    command TEXT NOT NULL,
    platform TEXT DEFAULT 'all',
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

const createAlertPoliciesTable = `
CREATE TABLE IF NOT EXISTS alert_policies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    metric TEXT NOT NULL, -- cpu, ram, disk, offline, network, crash
    operator TEXT NOT NULL,
    threshold REAL NOT NULL,
    duration_minutes INTEGER DEFAULT 1,
    priority TEXT DEFAULT 'high',
    enabled BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

const createAlertsTable = `
CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    machine_id TEXT NOT NULL,
    policy_id TEXT NOT NULL,
    value REAL,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY(machine_id) REFERENCES machines(id),
    FOREIGN KEY(policy_id) REFERENCES alert_policies(id)
);
`;

const createChatThreadsTable = `
CREATE TABLE IF NOT EXISTS chat_threads (
    id TEXT PRIMARY KEY,
    is_group INTEGER DEFAULT 0,
    name TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

const createChatThreadMembersTable = `
CREATE TABLE IF NOT EXISTS chat_thread_members (
    thread_id TEXT NOT NULL,
    username TEXT NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(thread_id, username),
    FOREIGN KEY(thread_id) REFERENCES chat_threads(id)
);
`;

const createChatMessagesTable = `
CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL,
    sender TEXT NOT NULL,
    body TEXT NOT NULL,
    attachment_url TEXT,
    attachment_name TEXT,
    attachment_size INTEGER,
    attachment_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(thread_id) REFERENCES chat_threads(id)
);
`;

const createChatThreadReadsTable = `
CREATE TABLE IF NOT EXISTS chat_thread_reads (
    thread_id TEXT NOT NULL,
    username TEXT NOT NULL,
    last_read_at DATETIME,
    PRIMARY KEY(thread_id, username),
    FOREIGN KEY(thread_id) REFERENCES chat_threads(id)
);
`;

const columnsToAdd = [
    { table: 'metrics', column: 'disk_details', type: 'TEXT' },
    { table: 'metrics', column: 'processes', type: 'TEXT' },
    { table: 'metrics', column: 'network_up_kbps', type: 'REAL' },
    { table: 'metrics', column: 'network_down_kbps', type: 'REAL' },
    { table: 'metrics', column: 'active_vpn', type: 'BOOLEAN' },
    { table: 'machines', column: 'users', type: 'TEXT' },
    { table: 'machines', column: 'device_name', type: 'TEXT' },
    { table: 'machines', column: 'uuid', type: 'TEXT' },
    { table: 'machines', column: 'os_distro', type: 'TEXT' },
    { table: 'machines', column: 'os_release', type: 'TEXT' },
    { table: 'machines', column: 'os_codename', type: 'TEXT' },
    { table: 'machines', column: 'os_serial', type: 'TEXT' },
    { table: 'machines', column: 'os_uefi', type: 'BOOLEAN' },
    { table: 'machines', column: 'nickname', type: 'TEXT' }
];

db.serialize(() => {
    db.run(createCommandsTable, (err) => {
        if (err) console.error("Failed to create commands table:", err);
        else console.log("Commands table ensured.");
    });

    db.run(createScriptsTable, (err) => {
        if (err) console.error("Failed to create scripts table:", err);
        else console.log("Scripts table ensured.");
    });

    db.run(createAlertPoliciesTable, (err) => {
        if (err) console.error("Failed to create alert_policies table:", err);
        else console.log("Alert Policies table ensured.");
    });

    db.run(createAlertsTable, (err) => {
        if (err) console.error("Failed to create alerts table:", err);
        else console.log("Alerts table ensured.");
    });

    db.run(createChatThreadsTable, (err) => {
        if (err) console.error("Failed to create chat_threads table:", err);
        else console.log("Chat threads table ensured.");
    });

    db.run(createChatThreadMembersTable, (err) => {
        if (err) console.error("Failed to create chat_thread_members table:", err);
        else console.log("Chat thread members table ensured.");
    });

    db.run(createChatMessagesTable, (err) => {
        if (err) console.error("Failed to create chat_messages table:", err);
        else console.log("Chat messages table ensured.");
    });

    db.run(createChatThreadReadsTable, (err) => {
        if (err) console.error("Failed to create chat_thread_reads table:", err);
        else console.log("Chat thread reads table ensured.");
    });

    columnsToAdd.forEach(({ table, column, type }) => {
        db.all(`PRAGMA table_info(${table})`, (err, rows) => {
            if (err) {
                console.error(err);
                return;
            }
            const exists = rows.some(row => row.name === column);
            if (!exists) {
                console.log(`Adding ${column} to ${table}...`);
                db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`, (err) => {
                    if (err) console.error(`Failed to add ${column}: ${err.message}`);
                    else console.log(`Added ${column} successfully.`);
                });
            } else {
                console.log(`${column} already exists in ${table}.`);
            }
        });
    });
});

// Close later to allow async queries to finish (simple timeout for this script)
setTimeout(() => {
    db.close();
}, 2000);
