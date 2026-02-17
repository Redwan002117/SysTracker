const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'systracker.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT * FROM logs ORDER BY id DESC LIMIT 5", [], (err, rows) => {
    if (err) {
        console.error("Error:", err);
    } else {
        console.log("Latest Logs:");
        console.log(JSON.stringify(rows, null, 2));
    }
    db.close();
});
