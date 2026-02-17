const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'systracker.db');
const schemaPath = path.resolve(__dirname, 'schema_sqlite.sql');

const db = new sqlite3.Database(dbPath);

const schema = fs.readFileSync(schemaPath, 'utf8');
const queries = schema.split(';').filter(q => q.trim().length > 0);

db.serialize(() => {
    queries.forEach(query => {
        db.run(query, (err) => {
            if (err) {
                console.error('Error running query:', err.message);
                console.error('Query:', query);
            } else {
                console.log('Query executed successfully.');
            }
        });
    });
});

db.close();
