const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'systracker.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error(err.message);
        process.exit(1);
    }
});

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
    { table: 'machines', column: 'os_uefi', type: 'BOOLEAN' }
];

db.serialize(() => {
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
