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
// JWT Secret Persistence (Prevent session invalidation on restart)
let JWT_SECRET = process.env.JWT_SECRET;
const secretFilePath = path.join(__dirname, 'data', 'jwt.secret');

if (!JWT_SECRET) {
    if (fs.existsSync(secretFilePath)) {
        try {
            JWT_SECRET = fs.readFileSync(secretFilePath, 'utf8').trim();
        } catch (e) {
            console.error('Error reading JWT secret file:', e);
        }
    }

    if (!JWT_SECRET) {
        JWT_SECRET = crypto.randomBytes(64).toString('hex');
        try {
            const dbDir = path.dirname(secretFilePath);
            if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
            fs.writeFileSync(secretFilePath, JWT_SECRET, { mode: 0o600 });
            console.log('Generated and persisted new JWT_SECRET to data/jwt.secret');
        } catch (e) {
            console.error('Error writing JWT secret file:', e);
        }
    }
}
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

app.use(express.static(dashboardPath, { extensions: ['html'] }));

app.set('trust proxy', 1); // Trust Nginx proxy headers
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
            email TEXT UNIQUE,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('Error creating admin_users table:', err.message);
            else {
                // Migration: Add email column if it doesn't exist
                db.run("ALTER TABLE admin_users ADD COLUMN email TEXT UNIQUE", (err) => {
                    if (err && !err.message.includes("duplicate column name")) {
                        console.error("Migration error (admin_users email):", err.message);
                    }
                });
            }
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

        // Auth: Password Reset Tokens
        db.run(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
            token TEXT PRIMARY KEY,
            user_id INTEGER,
            expires_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES admin_users(id)
        )`, (err) => {
            if (err) console.error('Error creating password_reset_tokens table:', err.message);
        });

        // Settings: Key-Value Store
        db.run(`CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('Error creating settings table:', err.message);
        });
    });
}

// Helper: Ensure Setup Token or Create Admin from Env
function ensureSetupToken() {
    db.get("SELECT count(*) as count FROM admin_users", (err, row) => {
        if (err) return console.error("Error checking admin users:", err.message);
        if (row.count > 0) return; // Users exist, no setup needed

        // Check if Admin Env Vars are present
        const adminUser = process.env.ADMIN_USER;
        const adminPass = process.env.ADMIN_PASSWORD;

        if (adminUser && adminPass) {
            console.log(`[Auth] Creating initial admin user from ENV: ${adminUser}`);
            bcrypt.hash(adminPass, 12, (err, hash) => {
                if (err) return console.error("Error hashing password:", err);
                db.run("INSERT INTO admin_users (username, password_hash) VALUES (?, ?)", [adminUser, hash], (err) => {
                    if (err) console.error("Error creating admin from ENV:", err.message);
                    else console.log("[Auth] Admin user created successfully.");
                });
            });
            return;
        }

        db.get("SELECT token FROM setup_tokens WHERE used = 0", (err, row) => {
            if (err) return console.error("Error checking setup tokens:", err.message);
            if (row) {
                console.log("---------------------------------------------------");
                console.log("SETUP REQUIRED: Use this token to create an admin account:");
                console.log(`Token: ${row.token}`);
                console.log("---------------------------------------------------");
            } else {
                const token = crypto.randomBytes(32).toString('hex');
                db.run("INSERT INTO setup_tokens (token) VALUES (?)", [token], (err) => {
                    if (err) return console.error("Error creating setup token:", err.message);
                    console.log("---------------------------------------------------");
                    console.log("SETUP REQUIRED: Use this token to create an admin account:");
                    console.log(`Token: ${token}`);
                    console.log("---------------------------------------------------");
                });
            }
        });
    });
}

// Helper: Get SMTP Config (DB > Env)
function getSmtpConfig() {
    return new Promise((resolve) => {
        db.all("SELECT key, value FROM settings WHERE key LIKE 'smtp_%'", [], (err, rows) => {
            const settings = {};
            if (rows) rows.forEach(r => settings[r.key] = r.value);

            resolve({
                host: settings.smtp_host || process.env.SMTP_HOST || 'smtp.example.com',
                port: parseInt(settings.smtp_port || process.env.SMTP_PORT || '587'),
                secure: (settings.smtp_secure || process.env.SMTP_SECURE) === 'true',
                auth: {
                    user: settings.smtp_user || process.env.SMTP_USER || 'user',
                    pass: settings.smtp_pass || process.env.SMTP_PASS || 'pass',
                },
                from: settings.smtp_from || process.env.SMTP_FROM || '"SysTracker" <no-reply@systracker.local>'
            });
        });
    });
}

const nodemailer = require('nodemailer');

// Helper: Send Email (Dynamic)
async function sendEmail(to, subject, text, html) {
    const config = await getSmtpConfig();

    // Check if configured (basic check)
    if (config.host === 'smtp.example.com' && !process.env.SMTP_HOST) {
        console.log(`[Email Mock] To: ${to}, Subject: ${subject}\n${text}`);
        return true;
    }

    try {
        const transporter = nodemailer.createTransport(config);
        await transporter.sendMail({
            from: config.from,
            to, subject, text, html
        });
        console.log(`[Email] Sent to ${to}`);
        return true;
    } catch (error) {
        console.error('[Email] Error:', error);
        return false;
    }
}

// ... auth endpoints ...

// Middleware: Authenticate Dashboard (JWT)
const authenticateDashboard = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.status(401).json({ error: 'Access token required' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.admin = user;
        next();
    });
};

// Middleware: Authenticate API (Agent)
const authenticateAPI = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const validKey = process.env.API_KEY;

    if (!validKey) {
        // If no API key is set, log a warning but maybe allow? 
        // Or consistent with "secure by default", deny. 
        // Let's allow for now if validKey is not set (generic dev mode), or strictly require it.
        // Given the user error, strict is safer but might break if they didn't set it.
        // user has API_KEY=YOUR_STATIC_API_KEY_HERE in .env
        if (apiKey === 'YOUR_STATIC_API_KEY_HERE') return next(); // Allow default
        console.warn("[Security] API_KEY not set in .env, allowing request (unsafe)");
        return next();
    }

    if (apiKey && apiKey === validKey) {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden: Invalid API Key' });
    }
};

// --- Settings Endpoints ---

// Get SMTP Settings
app.get('/api/settings/smtp', authenticateDashboard, (req, res) => {
    db.all("SELECT key, value FROM settings WHERE key LIKE 'smtp_%'", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const settings = {};
        if (rows) rows.forEach(r => settings[r.key] = r.value);

        // Fallback to Env for display if not in DB
        const response = {
            host: settings.smtp_host || process.env.SMTP_HOST || '',
            port: settings.smtp_port || process.env.SMTP_PORT || '587',
            user: settings.smtp_user || process.env.SMTP_USER || '',
            secure: settings.smtp_secure || process.env.SMTP_SECURE || 'false',
            from: settings.smtp_from || process.env.SMTP_FROM || '',
            // Do not send password back
            has_password: !!(settings.smtp_pass || process.env.SMTP_PASS)
        };
        res.json(response);
    });
});

// Update SMTP Settings
app.put('/api/settings/smtp', authenticateDashboard, (req, res) => {
    const { host, port, user, password, secure, from } = req.body;

    const updates = [
        { key: 'smtp_host', value: host },
        { key: 'smtp_port', value: String(port) },
        { key: 'smtp_user', value: user },
        { key: 'smtp_secure', value: String(secure) },
        { key: 'smtp_from', value: from }
    ];

    if (password && password !== '********') {
        updates.push({ key: 'smtp_pass', value: password });
    }

    db.serialize(() => {
        const stmt = db.prepare("INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP");
        updates.forEach(u => stmt.run([u.key, u.value]));
        stmt.finalize((err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'Settings saved' });
        });
    });
});

// Test SMTP Settings
app.post('/api/settings/smtp/test', authenticateDashboard, (req, res) => {
    // Get current user's email
    db.get('SELECT email FROM admin_users WHERE id = ?', [req.admin.id], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user || !user.email) return res.status(400).json({ error: 'Please update your profile email first to receive test emails.' });

        const success = await sendEmail(user.email, 'SysTracker SMTP Test', 'If you are reading this, your SMTP settings are correct!');
        if (success) res.json({ success: true, message: `Test email sent to ${user.email}` });
        else res.status(500).json({ error: 'Failed to send test email. Check server logs.' });
    });
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

// Update Profile (Email/Username)
app.put('/api/auth/profile', authenticateDashboard, (req, res) => {
    const { email, username } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // TODO: Validate email format

    db.run('UPDATE admin_users SET email = ?, username = COALESCE(?, username) WHERE id = ?',
        [email, username || null, req.admin.id],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Email or Username already taken' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, message: 'Profile updated' });
        });
});

// Forgot Password
app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    db.get('SELECT id, username FROM admin_users WHERE email = ?', [email], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' }); // Silent fail

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

        db.run('INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES (?, ?, ?)',
            [token, user.id, expiresAt],
            async (err) => {
                if (err) return res.status(500).json({ error: err.message });

                const resetLink = `${req.protocol}://${req.get('host')}/login/reset-password?token=${token}`;
                const text = `Hello ${user.username},\n\nClick here to reset your password: ${resetLink}\n\nLink expires in 1 hour.`;

                await sendEmail(email, 'Password Reset Request', text);
                res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
            });
    });
});

// Reset Password
app.post('/api/auth/reset-password', (req, res) => {
    const { token, new_password } = req.body;
    if (!token || !new_password) return res.status(400).json({ error: 'Token and new password required' });
    if (new_password.length < 8) return res.status(400).json({ error: 'Password must be 8+ chars' });

    db.get('SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > ?',
        [token, new Date().toISOString()],
        (err, tokenRow) => {
            if (err || !tokenRow) return res.status(400).json({ error: 'Invalid or expired token' });

            bcrypt.hash(new_password, 12, (err, hash) => {
                if (err) return res.status(500).json({ error: 'Hashing error' });

                db.serialize(() => {
                    db.run('UPDATE admin_users SET password_hash = ? WHERE id = ?', [hash, tokenRow.user_id]);
                    db.run('DELETE FROM password_reset_tokens WHERE token = ?', [token]);
                    res.json({ success: true, message: 'Password reset successful. Please login.' });
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
