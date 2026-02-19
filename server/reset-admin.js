#!/usr/bin/env node
/**
 * reset-admin.js  — SysTracker Admin Password Reset
 *
 * Usage (run from inside the container or against the DB file directly):
 *   node reset-admin.js [username] [new-password]
 *
 * Examples:
 *   node reset-admin.js                          # resets rickyadams2117 to ChangeMe123!
 *   node reset-admin.js rickyadams2117 MyPass!1  # custom username + password
 *   node reset-admin.js admin ChangeMe123!       # reset the default admin user
 *
 * The script will:
 *  1. Hash the given password with bcrypt (cost 12)
 *  2. If the user exists  → UPDATE password_hash
 *  3. If the user is new  → INSERT a fresh admin row
 */

'use strict';

const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();

// ── Resolve DB path (same logic as server.js) ────────────────────────────────
const dbPath = path.join(__dirname, 'data', 'systracker.db');

if (!fs.existsSync(dbPath)) {
    console.error(`\n[ERROR] Database not found at: ${dbPath}`);
    console.error('  Make sure you are running inside the container or the data volume is mounted.\n');
    process.exit(1);
}

// ── Args ─────────────────────────────────────────────────────────────────────
const username = process.argv[2] || 'rickyadams2117';
const newPassword = process.argv[3] || 'ChangeMe123!';

console.log(`\n[reset-admin] Target:   ${username}`);
console.log(`[reset-admin] DB path:  ${dbPath}\n`);

// ── Main ─────────────────────────────────────────────────────────────────────
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) { console.error('[ERROR] Cannot open DB:', err.message); process.exit(1); }

    bcrypt.hash(newPassword, 12, (err, hash) => {
        if (err) { console.error('[ERROR] bcrypt failed:', err); process.exit(1); }

        db.get('SELECT id FROM admin_users WHERE username = ?', [username], (err, row) => {
            if (err) { console.error('[ERROR] DB query failed:', err.message); process.exit(1); }

            if (row) {
                // Update existing user
                db.run(
                    'UPDATE admin_users SET password_hash = ? WHERE username = ?',
                    [hash, username],
                    function (err) {
                        if (err) { console.error('[ERROR] Update failed:', err.message); process.exit(1); }
                        console.log(`[OK] Password updated for user: ${username}`);
                        console.log(`[OK] You can now log in with the new password.\n`);
                        db.close();
                    }
                );
            } else {
                // Create new user
                db.run(
                    'INSERT INTO admin_users (username, password_hash) VALUES (?, ?)',
                    [username, hash],
                    function (err) {
                        if (err) { console.error('[ERROR] Insert failed:', err.message); process.exit(1); }
                        console.log(`[OK] Created new admin user: ${username}`);
                        console.log(`[OK] You can now log in with the given password.\n`);
                        db.close();
                    }
                );
            }
        });
    });
});
