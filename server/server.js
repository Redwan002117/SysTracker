require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// JWT secret — use env var in production, auto-generate otherwise
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

const app = express();
const server = http.createServer(app); // Changed from http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for now (dev/prod mixed)
        methods: ["GET", "POST"]
    }
});

// Serve the static dashboard files
// In 'pkg', __dirname points to the virtual filesystem inside the snapshot
const dashboardPath = path.join(__dirname, 'dashboard-dist');

// Middleware to check if assets exist (debugging)
app.use((req, res, next) => {
    // Only log if specifically requesting asset (uncomment for debug)
    // console.log('Request:', req.path); 
    next();
});

app.use(express.static(dashboardPath));

app.use(cors());
app.use(express.json()); // Changed from app.use(express.json({ limit: '5mb' }));

// Database Setup


// Handle client-side routing by serving index.html for all non-API routes
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(dashboardPath, 'index.html'));
});

// Database Setup (SQLite)
// Database Setup (SQLite)
const dbFolder = path.join(__dirname, 'data');
if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
}
const dbPath = path.join(dbFolder, 'systracker.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database at:', dbPath);
        initializeDb();
    }
});

function initializeDb() {
    const schemaPath = path.resolve(__dirname, 'schema_sqlite.sql');
    let schema = '';
    try {
        schema = fs.readFileSync(schemaPath, 'utf8');
    } catch (e) {
        // Fallback schema if file not found
        schema = `
            CREATE TABLE IF NOT EXISTS machines (
                id TEXT PRIMARY KEY,
                hostname TEXT,
                nickname TEXT,
                ip_address TEXT,
                os_info TEXT,
                os_distro TEXT,
                os_release TEXT,
                os_codename TEXT,
                os_serial TEXT,
                os_uefi INTEGER,
                uuid TEXT,
                device_name TEXT,
                users TEXT,
                hardware_info TEXT,
                status TEXT,
                last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                profile TEXT
            );
            CREATE TABLE IF NOT EXISTS metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                machine_id TEXT,
                cpu_usage REAL,
                ram_usage REAL,
                disk_total_gb REAL,
                disk_free_gb REAL,
                network_up_kbps REAL,
                network_down_kbps REAL,
                active_vpn INTEGER,
                disk_details TEXT,
                processes TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(machine_id) REFERENCES machines(id)
            );
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                machine_id TEXT,
                event_id INTEGER,
                source TEXT,
                message TEXT,
                severity TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(machine_id) REFERENCES machines(id)
            );
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                machine_id TEXT,
                level TEXT,
                message TEXT,
                stack_trace TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(machine_id) REFERENCES machines(id)
            );
        `;
    }

    const queries = schema.split(';').filter(q => q.trim().length > 0);

    db.serialize(() => {
        queries.forEach(query => {
            db.run(query, (err) => {
                if (err) console.error('Error initializing DB:', err.message);
            });
        });

        // Migration: Add profile column if it doesn't exist
        db.run("ALTER TABLE machines ADD COLUMN profile TEXT", (err) => {
            if (err && !err.message.includes("duplicate column name")) {
                console.error("Migration error (profile):", err.message);
            }
        });

        // Auth: Create admin_users table
        db.run(`CREATE TABLE IF NOT EXISTS admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('Error creating admin_users table:', err.message);
        });

        // Auth: Create setup_tokens table (one-time first-run token)
        db.run(`CREATE TABLE IF NOT EXISTS setup_tokens (
            token TEXT PRIMARY KEY,
            used INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('Error creating setup_tokens table:', err.message);
            else ensureSetupToken();
        });
    });
}

// Generate a one-time setup token if no admin users exist
function ensureSetupToken() {
    db.get('SELECT COUNT(*) as count FROM admin_users', [], (err, row) => {
        if (err || (row && row.count > 0)) return; // Already set up
        const token = crypto.randomBytes(24).toString('hex');
        db.run('DELETE FROM setup_tokens', [], () => {
            db.run('INSERT INTO setup_tokens (token) VALUES (?)', [token], (err) => {
                if (!err) {
                    const PORT = process.env.PORT || 7777;
                    console.log('\n' + '='.repeat(60));
                    console.log('  SYSTRACKER FIRST-RUN SETUP');
                    console.log('  No admin account found.');
                    console.log(`  Visit: http://localhost:${PORT}/setup?token=${token}`);
                    console.log('  This link is one-time use only.');
                    console.log('='.repeat(60) + '\n');
                }
            });
        });
    });
}

// Middleware for API Key Authentication (used by agents)
const authenticateAPI = (req, res, next) => {
    const apiKey = req.header('X-API-Key');
    const VALID_API_KEY = process.env.API_KEY || "YOUR_STATIC_API_KEY_HERE";
    if (!apiKey || apiKey !== VALID_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }
    next();
};

// Middleware for Dashboard JWT Authentication
const authenticateDashboard = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    const token = authHeader.slice(7);
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
};

// ─── Auth Endpoints ───────────────────────────────────────────────────────────

// Check if setup is needed (no admin users)
app.get('/api/auth/status', (req, res) => {
    db.get('SELECT COUNT(*) as count FROM admin_users', [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ setup_required: row.count === 0 });
    });
});

// First-run setup — create the first admin account
app.post('/api/auth/setup', (req, res) => {
    const { username, password, setup_token } = req.body;
    if (!username || !password || !setup_token) {
        return res.status(400).json({ error: 'username, password, and setup_token are required' });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    // Check no users exist
    db.get('SELECT COUNT(*) as count FROM admin_users', [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row.count > 0) return res.status(403).json({ error: 'Setup already completed' });
        // Validate setup token
        db.get('SELECT * FROM setup_tokens WHERE token = ? AND used = 0', [setup_token], (err, tokenRow) => {
            if (err || !tokenRow) return res.status(403).json({ error: 'Invalid or expired setup token' });
            // Hash password and create user
            bcrypt.hash(password, 12, (err, hash) => {
                if (err) return res.status(500).json({ error: 'Error hashing password' });
                db.run('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)', [username.toLowerCase().trim(), hash], function (err) {
                    if (err) return res.status(500).json({ error: err.message });
                    // Mark token as used
                    db.run('UPDATE setup_tokens SET used = 1 WHERE token = ?', [setup_token]);
                    console.log(`[Auth] Admin account created: ${username}`);
                    res.json({ success: true, message: 'Admin account created. Please log in.' });
                });
            });
        });
    });
});

// Login
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    db.get('SELECT * FROM admin_users WHERE username = ?', [username.toLowerCase().trim()], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: 'Invalid username or password' });
        bcrypt.compare(password, user.password_hash, (err, match) => {
            if (err || !match) return res.status(401).json({ error: 'Invalid username or password' });
            const token = jwt.sign(
                { id: user.id, username: user.username },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );
            console.log(`[Auth] Login: ${user.username}`);
            res.json({ token, username: user.username, expires_in: JWT_EXPIRES_IN });
        });
    });
});

// Get current user (validates token)
app.get('/api/auth/me', authenticateDashboard, (req, res) => {
    res.json({ id: req.admin.id, username: req.admin.username });
});

// Logout (stateless — client drops token; endpoint for future blacklist)
app.post('/api/auth/logout', authenticateDashboard, (req, res) => {
    console.log(`[Auth] Logout: ${req.admin.username}`);
    res.json({ success: true });
});

// Change password
app.post('/api/auth/change-password', authenticateDashboard, (req, res) => {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
        return res.status(400).json({ error: 'current_password and new_password are required' });
    }
    if (new_password.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }
    db.get('SELECT * FROM admin_users WHERE id = ?', [req.admin.id], (err, user) => {
        if (err || !user) return res.status(500).json({ error: 'User not found' });
        bcrypt.compare(current_password, user.password_hash, (err, match) => {
            if (err || !match) return res.status(401).json({ error: 'Current password is incorrect' });
            bcrypt.hash(new_password, 12, (err, hash) => {
                if (err) return res.status(500).json({ error: 'Error hashing password' });
                db.run('UPDATE admin_users SET password_hash = ? WHERE id = ?', [hash, user.id], (err) => {
                    if (err) return res.status(500).json({ error: err.message });
                    console.log(`[Auth] Password changed: ${user.username}`);
                    res.json({ success: true });
                });
            });
        });
    });
});

// --- DEBUG ENDPOINT ---
app.get('/api/debug/config', (req, res) => {
    const dbFolder = path.join(__dirname, 'data');
    const dbFile = path.join(dbFolder, 'systracker.db');

    let folderContents = [];
    try {
        if (fs.existsSync(dbFolder)) {
            folderContents = fs.readdirSync(dbFolder);
        }
    } catch (e) { folderContents = [`Error: ${e.message}`]; }

    res.json({
        cwd: process.cwd(),
        dirname: __dirname,
        dbFolder: dbFolder,
        dbFolderExists: fs.existsSync(dbFolder),
        dbFile: dbFile,
        dbFileExists: fs.existsSync(dbFile),
        folderContents: folderContents,
        envPort: process.env.PORT,
        isDocker: fs.existsSync('/.dockerenv')
    });
});

// --- API Endpoints ---

// Ingest Telemetry (from Python Agent)
app.post('/api/telemetry', authenticateAPI, (req, res) => {
    const { machine, metrics, events } = req.body;

    // if (metrics) console.log('Received Metrics:', JSON.stringify(metrics)); // DEBUG LOG

    if (!machine || !machine.id) {
        return res.status(400).json({ error: 'Invalid payload: Machine ID required' });
    }

    db.serialize(() => {
        // 1. Update/Insert Machine
        const machineQuery = `
            INSERT INTO machines (id, hostname, ip_address, os_info, os_distro, os_release, os_codename, os_serial, os_uefi, uuid, device_name, users, hardware_info, status, last_seen)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'online', CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE 
            SET hostname = excluded.hostname, 
                ip_address = excluded.ip_address, 
                os_info = excluded.os_info,
                os_distro = excluded.os_distro,
                os_release = excluded.os_release,
                os_codename = excluded.os_codename,
                os_serial = excluded.os_serial,
                os_uefi = excluded.os_uefi,
                uuid = excluded.uuid,
                device_name = excluded.device_name,
                users = excluded.users,
                hardware_info = COALESCE(excluded.hardware_info, machines.hardware_info),
                status = 'online',
                last_seen = CURRENT_TIMESTAMP;
        `;

        db.run(machineQuery, [
            machine.id,
            machine.hostname,
            machine.ip || (metrics ? metrics.ip_address : null),
            machine.os_info,
            machine.os_distro,
            machine.os_release,
            machine.os_codename,
            machine.os_serial,
            machine.os_uefi ? 1 : 0,
            machine.uuid,
            machine.device_name,
            JSON.stringify(machine.users),
            machine.hardware_info ? JSON.stringify(machine.hardware_info) : null
        ], function (err) {
            if (err) console.error("Error upserting machine:", err, this);
        });

        // 2. Insert Metrics
        if (metrics) {
            const metricsQuery = `
                INSERT INTO metrics (machine_id, cpu_usage, ram_usage, disk_total_gb, disk_free_gb, network_up_kbps, network_down_kbps, active_vpn, disk_details, processes, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);
            `;
            const diskDetailsStr = metrics.disk_details ? JSON.stringify(metrics.disk_details) : null;
            const processesStr = metrics.processes ? JSON.stringify(metrics.processes) : null;

            db.run(metricsQuery, [
                machine.id,
                metrics.cpu_usage,
                metrics.ram_usage,
                metrics.disk_total_gb,
                metrics.disk_free_gb,
                metrics.network_up_kbps || 0,
                metrics.network_down_kbps || 0,
                metrics.active_vpn ? 1 : 0,
                diskDetailsStr,
                processesStr
            ], (err) => {
                if (err) console.error("Error inserting metrics:", err);

                // --- ALERTING ENGINE ---
                const alerts = [];
                // CPU Alert (> 95%)
                if (metrics.cpu_usage > 95) {
                    alerts.push({ type: 'CPU', message: `High CPU Usage: ${metrics.cpu_usage}%` });
                }
                // Disk Alert (< 10% free)
                if (metrics.disk_total_gb > 0 && (metrics.disk_free_gb / metrics.disk_total_gb) < 0.10) {
                    alerts.push({ type: 'DISK', message: `Low Disk Space: ${metrics.disk_free_gb}GB free` });
                }

                // Trigger Webhook/Log for Alerts
                if (alerts.length > 0) {
                    console.log(`[ALERT] Machine ${machine.id}:`, alerts);
                    // TODO: Send to Slack/Discord via axios.post(WEBHOOK_URL, ...)
                    // For now, we'll just log it to the 'events' table as a system alert? 
                    // Or ideally a separate 'alerts' table, but 'events' works for now if we use a special source.

                    const alertStmt = db.prepare(`INSERT INTO events (machine_id, event_id, source, message, severity, timestamp) VALUES (?, 9999, 'SysTracker-Alert', ?, 'Warning', CURRENT_TIMESTAMP)`);
                    alerts.forEach(a => {
                        alertStmt.run([machine.id, a.message]);
                    });
                    alertStmt.finalize();
                }
            });
        }

        // 3. Insert Events
        if (events && Array.isArray(events) && events.length > 0) {
            const eventQuery = `
                INSERT INTO events (machine_id, event_id, source, message, severity, timestamp)
                VALUES (?, ?, ?, ?, ?, ?);
            `;
            const stmt = db.prepare(eventQuery);
            events.forEach(event => {
                stmt.run([
                    machine.id,
                    event.event_id,
                    event.source,
                    event.message,
                    event.severity,
                    event.timestamp
                ]);
            });
            stmt.finalize();
        }

        // Notify Dashboard via Socket.IO
        const mappedMetrics = {
            cpu: metrics.cpu_usage,
            ram: metrics.ram_usage,
            disk: metrics.disk_total_gb ? Math.round(((metrics.disk_total_gb - metrics.disk_free_gb) / metrics.disk_total_gb) * 100) : 0,
            disk_details: metrics.disk_details,
            processes: metrics.processes,
            network_up_kbps: metrics.network_up_kbps,
            network_down_kbps: metrics.network_down_kbps,
            active_vpn: metrics.active_vpn
        };

        io.emit('machine_update', {
            id: machine.id,
            status: 'online',
            last_seen: new Date(),
            metrics: mappedMetrics,
            hardware_info: machine.hardware_info
        });

        res.json({ success: true });
    });
});

// Ingest Logs (from Agents)
app.post('/api/logs', authenticateAPI, (req, res) => {
    const { machine_id, level, message, stack_trace } = req.body;

    if (!machine_id || !message) {
        return res.status(400).json({ error: 'Invalid payload: machine_id and message required' });
    }

    const logQuery = `
        INSERT INTO logs (machine_id, level, message, stack_trace, timestamp)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP);
    `;

    db.run(logQuery, [machine_id, level || 'info', message, stack_trace || null], (err) => {
        if (err) {
            console.error("Error inserting log:", err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ success: true });
    });
});

// Update Machine Profile
app.put('/api/machines/:id/profile', authenticateAPI, (req, res) => {
    const { id } = req.params;
    const { profile } = req.body; // Expects full profile object
    console.log(`Updating profile for ${id}`);

    // Extract nickname from profile.name for backward compatibility/search if needed
    const nickname = profile?.name || null;

    db.run('UPDATE machines SET nickname = ?, profile = ? WHERE id = ?', [nickname, JSON.stringify(profile), id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Machine not found' });

        io.emit('machine_update', { id, nickname, profile }); // Notify clients
        res.json({ success: true });
    });
});

// Get All Machines (for Dashboard) — JWT protected
app.get('/api/machines', authenticateDashboard, (req, res) => {
    const query = `
        SELECT m.*, 
               me.cpu_usage, me.ram_usage, me.disk_total_gb, me.disk_free_gb, me.network_up_kbps, me.network_down_kbps, me.active_vpn, me.disk_details, me.processes
        FROM machines m
        LEFT JOIN (
            SELECT machine_id, cpu_usage, ram_usage, disk_free_gb, disk_total_gb, network_up_kbps, network_down_kbps, active_vpn, disk_details, processes
            FROM metrics
            WHERE id IN (SELECT MAX(id) FROM metrics GROUP BY machine_id)
        ) me ON m.id = me.machine_id
        ORDER BY m.hostname ASC;
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching machines:', err.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        // Map to frontend structure
        const machines = rows.map(row => {
            let hwInfo = null;
            let diskDetails = [];
            let processes = [];
            let profile = null;
            try {
                if (row.hardware_info) hwInfo = JSON.parse(row.hardware_info);
                if (row.disk_details) diskDetails = JSON.parse(row.disk_details);
                if (row.processes) processes = JSON.parse(row.processes);
                if (row.profile) profile = JSON.parse(row.profile);
            } catch (e) { console.error("Error parsing JSON", e); }

            return {
                id: row.id,
                hostname: row.hostname,
                nickname: row.nickname || null, // Add nickname
                ip: row.ip_address,
                os: row.os_info,
                os_details: {
                    distro: row.os_distro,
                    release: row.os_release,
                    codename: row.os_codename,
                    serial: row.os_serial,
                    uefi: !!row.os_uefi,
                    uuid: row.uuid
                },
                device_name: row.device_name,
                users: row.users ? JSON.parse(row.users) : [],
                hardware_info: hwInfo,
                profile: profile, // Return profile object
                status: row.status,
                last_seen: row.last_seen,
                metrics: {
                    cpu: row.cpu_usage || 0,
                    ram: row.ram_usage || 0,
                    disk: row.disk_total_gb ? Math.round(((row.disk_total_gb - row.disk_free_gb) / row.disk_total_gb) * 100) : 0,
                    disk_details: diskDetails,
                    processes: processes,
                    network_up_kbps: row.network_up_kbps || 0,
                    network_down_kbps: row.network_down_kbps || 0,
                    active_vpn: !!row.active_vpn
                }
            };
        });

        res.json(machines);
    });
});

// Get Machine Details — JWT protected
app.get('/api/machines/:id', authenticateDashboard, (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM machines WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Machine not found' });

        const machine = row;
        try {
            if (machine.hardware_info) machine.hardware_info = JSON.parse(machine.hardware_info);
        } catch (e) { }

        const historyQuery = 'SELECT * FROM metrics WHERE machine_id = ? ORDER BY timestamp DESC LIMIT 50';
        const eventsQuery = 'SELECT * FROM events WHERE machine_id = ? ORDER BY timestamp DESC LIMIT 50';

        db.all(historyQuery, [id], (err, history) => {
            if (err) return res.status(500).json({ error: err.message });

            db.all(eventsQuery, [id], (err, events) => {
                if (err) return res.status(500).json({ error: err.message });

                res.json({
                    machine,
                    history,
                    events
                });
            });
        });
    });
});


// Socket.io for Real-time Dashboard
io.on('connection', (socket) => {
    // console.log('Dashboard connected:', socket.id);
    socket.on('disconnect', () => { });
});

// Periodic Offset Check (mark offline if > 2 mins)
setInterval(() => {
    db.run(`
        UPDATE machines 
        SET status = 'offline' 
        WHERE status = 'online' AND last_seen < datetime('now', '-2 minutes')
    `, function (err) {
        if (err) console.error("Error updating offline status:", err);
        else if (this.changes > 0) {
            // In a real app we'd fetch the IDs to emit, but this is a simplified 'poll' approach
            // or we could do a SELECT before UPDATE
            io.emit('refresh_request'); // Force frontend to refresh
        }
    });
}, 30000);

// Log periodic status to console (optional)
// setInterval(() => console.log(`[Server] Active. Clients: ${io.engine.clientsCount}`), 60000);

const PORT = process.env.PORT || 7777;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
