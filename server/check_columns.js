const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'systracker.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.all("PRAGMA table_info(machines)", (err, rows) => {
        if (err) {
            console.error(err);
        } else {
            console.log("Columns in 'machines' table:");
            rows.forEach(row => console.log(`- ${row.name} (${row.type})`));
        }
    });
});

db.close();
