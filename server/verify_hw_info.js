const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'systracker.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error(err.message);
        process.exit(1);
    }
});

db.serialize(() => {
    db.all("SELECT id, hostname, hardware_info FROM machines", (err, rows) => {
        if (err) {
            console.error(err.message);
            return;
        }
        rows.forEach((row) => {
            console.log(`Machine: ${row.hostname} (${row.id})`);
            console.log("Hardware Info:");
            try {
                const hw = JSON.parse(row.hardware_info);
                console.dir(hw, { depth: null });
            } catch (e) {
                console.log("Raw (Non-JSON):", row.hardware_info);
            }
            console.log("-".repeat(40));
        });
    });
});

db.close();
