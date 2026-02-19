const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'systracker.db');
const db = new sqlite3.Database(dbPath);

const id = 'GamerNo002117';
const nickname = 'TestNick';
const profile = JSON.stringify({ name: 'TestNick', role: 'Dev' });

console.log(`Attempting to update machine ${id}...`);

db.serialize(() => {
    // Check if machine actually exists first
    db.get('SELECT * FROM machines WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Error fetching machine:', err);
            return;
        }
        if (!row) {
            console.log('Machine not found in DB. Creating dummy machine for test.');
            db.run('INSERT INTO machines (id, hostname) VALUES (?, ?)', [id, 'TestHost'], (err) => {
                if (err) console.error('Error inserting dummy machine:', err);
                else performUpdate();
            });
        } else {
            console.log('Machine found:', row);
            performUpdate();
        }
    });
});

function performUpdate() {
    const query = 'UPDATE machines SET nickname = ?, profile = ? WHERE id = ?';
    const params = [nickname, profile, id];

    console.log('Running query:', query);
    console.log('Params:', params);

    db.run(query, params, function (err) {
        if (err) {
            console.error('Update FAILED:', err);
        } else {
            console.log('Update SUCCESS. Changes:', this.changes);
        }
        db.close();
    });
}
