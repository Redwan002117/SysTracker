const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'systracker.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("Adding nickname column to machines table...");
    db.run("ALTER TABLE machines ADD COLUMN nickname TEXT", (err) => {
        if (err) {
            if (err.message.includes("duplicate column name")) {
                console.log("Column 'nickname' already exists.");
            } else {
                console.error("Error adding column:", err.message);
            }
        } else {
            console.log("Column 'nickname' added successfully.");
        }
    });
});

db.close();
