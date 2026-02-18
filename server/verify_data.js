const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'systracker.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) { console.error(err.message); process.exit(1); }
});

db.serialize(() => {
    db.all(`
        SELECT m.id, m.hostname, m.hardware_info, m.users, me.processes 
        FROM machines m
        LEFT JOIN (
            SELECT machine_id, processes 
            FROM metrics 
            WHERE id IN (SELECT MAX(id) FROM metrics GROUP BY machine_id)
        ) me ON m.id = me.machine_id
    `, (err, rows) => {
        if (err) { console.error(err); return; }

        rows.forEach((row) => {
            console.log(`\n=== Machine: ${row.hostname} (${row.id}) ===`);

            console.log("\n[Hardware Info (Network)]:");
            try {
                const hw = JSON.parse(row.hardware_info);
                if (hw.network) console.dir(hw.network, { depth: null });
                else console.log("No network info.");
            } catch (e) { console.log("Error parsing hw info"); }

            console.log("\n[Users]:");
            try {
                const users = JSON.parse(row.users);
                console.dir(users, { depth: null });
            } catch (e) { console.log(row.users || "No users data"); }

            console.log("\n[Top Processes]:");
            try {
                const procs = JSON.parse(row.processes);
                console.dir(procs, { depth: null });
            } catch (e) { console.log(row.processes || "No process data"); }
        });
    });
});

db.close();
