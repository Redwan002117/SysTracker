const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'systracker.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("Checking for processes column...");
    db.run("ALTER TABLE metrics ADD COLUMN processes TEXT", (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log("Column 'processes' already exists.");
            } else {
                console.error("Error adding column:", err.message);
            }
        } else {
            console.log("Successfully added 'processes' column.");
        }
    });
});

db.close();
