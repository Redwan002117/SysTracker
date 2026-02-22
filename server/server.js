// ---------------------------------------------------------------------------
// pkg-safe path resolution — MUST be first, before dotenv
// When bundled with pkg, __dirname is the read-only virtual snapshot.
// Writable files live next to the real EXE on disk.
// ---------------------------------------------------------------------------
const path = require('path');
const IS_PKG = typeof process.pkg !== 'undefined';
const BASE_DIR = IS_PKG ? path.dirname(process.execPath) : __dirname;
const ASSETS_DIR = __dirname; // snapshot dir (dashboard-dist lives here)

// Helper function for safe module loading
function safeRequire(moduleName) {
    try {
        // Try relative path first (development mode)
        return require(`./${moduleName}`);
    } catch (e1) {
        try {
            // Try absolute path for pkg bundled mode
            return require(path.join(BASE_DIR, `${moduleName}.js`));
        } catch (e2) {
            try {
                // Try from snapshot dir
                return require(path.join(ASSETS_DIR, `${moduleName}.js`));
            } catch (e3) {
                console.error(`Failed to load module: ${moduleName}`);
                throw new Error(`Module not found: ${moduleName}`);
            }
        }
    }
}

// Load .env from the EXE's real directory (or project root in dev)
require('dotenv').config({ path: path.join(BASE_DIR, '.env') });
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const fs = require('fs');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailTemplates = safeRequire('emailTemplates');
const nodemailer = require('nodemailer');

// Import validation and logging modules using safe require
const { validateProcessData, validateHardwareInfo, validateDiskDetails } = safeRequire('dataValidation');
const { logger, LOG_DIR } = safeRequire('errorLogger');

// Log server startup
logger.info('SysTracker Server starting...', { pid: process.pid });



// JWT secret — use env var in production, auto-generate otherwise
let JWT_SECRET = process.env.JWT_SECRET;
const secretFilePath = path.join(BASE_DIR, 'data', 'jwt.secret');

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

// Serve the static dashboard (embedded read-only asset inside the pkg snapshot)
const dashboardPath = path.join(ASSETS_DIR, 'dashboard-dist');

// Middleware to check if assets exist (debugging)
app.use((req, res, next) => {
    // Only log if specifically requesting asset (uncomment for debug)
    // console.log('Request:', req.path); 
    next();
});

app.use(express.static(dashboardPath, { extensions: ['html'] }));

app.set('trust proxy', 1); // Trust Nginx proxy headers
app.use(cors());
app.use(express.json({ limit: '5mb' })); // Enough for hardware_info payloads

// Database Setup


// Database Setup

// Database Setup (SQLite) — data folder lives next to the EXE, not in snapshot
const dbFolder = path.join(BASE_DIR, 'data');
if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
}
const dbPath = path.join(dbFolder, 'systracker.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database at:', dbPath);
        db.configure('busyTimeout', 5000); // Wait up to 5s if DB is locked (fixes 500 errors on concurrent writes)
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
            role TEXT DEFAULT 'admin',
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
                // Migration: Add role column if it doesn't exist (defaults to 'admin' for existing users)
                db.run("ALTER TABLE admin_users ADD COLUMN role TEXT DEFAULT 'admin'", (err) => {
                    if (err && !err.message.includes("duplicate column name")) {
                        console.error("Migration error (admin_users role):", err.message);
                    }
                });
                // Migration: Add avatar column
                db.run("ALTER TABLE admin_users ADD COLUMN avatar TEXT", (err) => {
                    if (err && !err.message.includes("duplicate column name")) {
                        console.error("Migration error (admin_users avatar):", err.message);
                    }
                });
                // Migration: Add display_name column
                db.run("ALTER TABLE admin_users ADD COLUMN display_name TEXT", (err) => {
                    if (err && !err.message.includes("duplicate column name")) {
                        console.error("Migration error (admin_users display_name):", err.message);
                    }
                });
                // Migration: Add bio column
                db.run("ALTER TABLE admin_users ADD COLUMN bio TEXT", (err) => {
                    if (err && !err.message.includes("duplicate column name")) {
                        console.error("Migration error (admin_users bio):", err.message);
                    }
                });
                // Migration: Add location column
                db.run("ALTER TABLE admin_users ADD COLUMN location TEXT", (err) => {
                    if (err && !err.message.includes("duplicate column name")) {
                        console.error("Migration error (admin_users location):", err.message);
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

        // Audit Logs
        db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            actor TEXT NOT NULL,
            actor_id INTEGER,
            action TEXT NOT NULL,
            target TEXT,
            detail TEXT,
            ip TEXT,
            ts DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('Error creating audit_logs table:', err.message);
        });

        // Internal Mail Messages
        db.run(`CREATE TABLE IF NOT EXISTS mail_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            from_user TEXT NOT NULL,
            to_user TEXT NOT NULL,
            subject TEXT NOT NULL,
            body TEXT NOT NULL,
            template_key TEXT,
            is_read INTEGER DEFAULT 0,
            folder TEXT DEFAULT 'inbox',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('Error creating mail_messages table:', err.message);
        });

        // Internal Chat (Phase 1: 1:1 text)
        db.run(`CREATE TABLE IF NOT EXISTS chat_threads (
            id TEXT PRIMARY KEY,
            is_group INTEGER DEFAULT 0,
            name TEXT,
            created_by TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('Error creating chat_threads table:', err.message);
        });

        db.run(`CREATE TABLE IF NOT EXISTS chat_thread_members (
            thread_id TEXT NOT NULL,
            username TEXT NOT NULL,
            added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(thread_id, username),
            FOREIGN KEY(thread_id) REFERENCES chat_threads(id)
        )`, (err) => {
            if (err) console.error('Error creating chat_thread_members table:', err.message);
        });

        db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY,
            thread_id TEXT NOT NULL,
            sender TEXT NOT NULL,
            body TEXT NOT NULL,
            attachment_url TEXT,
            attachment_name TEXT,
            attachment_size INTEGER,
            attachment_type TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(thread_id) REFERENCES chat_threads(id)
        )`, (err) => {
            if (err) console.error('Error creating chat_messages table:', err.message);
        });

        db.run(`CREATE TABLE IF NOT EXISTS chat_thread_reads (
            thread_id TEXT NOT NULL,
            username TEXT NOT NULL,
            last_read_at DATETIME,
            PRIMARY KEY(thread_id, username),
            FOREIGN KEY(thread_id) REFERENCES chat_threads(id)
        )`, (err) => {
            if (err) console.error('Error creating chat_thread_reads table:', err.message);
        });

        db.run('CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON chat_messages(thread_id, created_at)');

        // Chat message migrations (attachments)
        db.run('ALTER TABLE chat_messages ADD COLUMN attachment_url TEXT', (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Migration error (chat_messages attachment_url):', err.message);
            }
        });
        db.run('ALTER TABLE chat_messages ADD COLUMN attachment_name TEXT', (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Migration error (chat_messages attachment_name):', err.message);
            }
        });
        db.run('ALTER TABLE chat_messages ADD COLUMN attachment_size INTEGER', (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Migration error (chat_messages attachment_size):', err.message);
            }
        });
        db.run('ALTER TABLE chat_messages ADD COLUMN attachment_type TEXT', (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Migration error (chat_messages attachment_type):', err.message);
            }
        });

        // Settings: Key-Value Store
        db.run(`CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('Error creating settings table:', err.message);
        });

        // Alerts: Seed default policies if none exist
        db.get('SELECT COUNT(*) as count FROM alert_policies', (err, row) => {
            if (err) return;
            if (row && row.count > 0) return;

            const defaultPolicies = [
                { name: 'High CPU Usage', metric: 'cpu', operator: '>', threshold: 90, duration_minutes: 5, priority: 'high', enabled: 1 },
                { name: 'Critical CPU Usage', metric: 'cpu', operator: '>', threshold: 95, duration_minutes: 5, priority: 'high', enabled: 1 },
                { name: 'High RAM Usage', metric: 'ram', operator: '>', threshold: 90, duration_minutes: 5, priority: 'high', enabled: 1 },
                { name: 'Critical RAM Usage', metric: 'ram', operator: '>', threshold: 95, duration_minutes: 5, priority: 'high', enabled: 1 },
                { name: 'Disk Usage High', metric: 'disk', operator: '>', threshold: 90, duration_minutes: 10, priority: 'medium', enabled: 1 },
                { name: 'Disk Usage Critical', metric: 'disk', operator: '>', threshold: 95, duration_minutes: 10, priority: 'high', enabled: 1 },
                { name: 'Machine Offline', metric: 'offline', operator: '=', threshold: 1, duration_minutes: 5, priority: 'high', enabled: 1 },
                { name: 'Network Disconnected', metric: 'network', operator: '<', threshold: 1, duration_minutes: 5, priority: 'medium', enabled: 1 },
                { name: 'Agent Crash Detected', metric: 'crash', operator: '=', threshold: 1, duration_minutes: 10, priority: 'high', enabled: 1 }
            ];

            const stmt = db.prepare(`INSERT INTO alert_policies (id, name, metric, operator, threshold, duration_minutes, priority, enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
            defaultPolicies.forEach(policy => {
                stmt.run([
                    crypto.randomUUID(),
                    policy.name,
                    policy.metric,
                    policy.operator,
                    policy.threshold,
                    policy.duration_minutes,
                    policy.priority,
                    policy.enabled
                ]);
            });
            stmt.finalize();
            console.log('[Alert] Default alert policies seeded.');
        });

        // Agent Releases: Auto-Updater Support
        db.run(`CREATE TABLE IF NOT EXISTS agent_releases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version TEXT NOT NULL UNIQUE,
            file_path TEXT NOT NULL,
            file_hash TEXT NOT NULL,
            file_size INTEGER,
            upload_date DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('Error creating agent_releases table:', err.message);
            else {
                // Migration: Add file_hash and file_size columns if they don't exist
                db.run("ALTER TABLE agent_releases ADD COLUMN file_hash TEXT", (err) => {
                    if (err && !err.message.includes("duplicate column name")) {
                        console.error("Migration error (agent_releases file_hash):", err.message);
                    }
                });
                db.run("ALTER TABLE agent_releases ADD COLUMN file_size INTEGER", (err) => {
                    if (err && !err.message.includes("duplicate column name")) {
                        console.error("Migration error (agent_releases file_size):", err.message);
                    }
                });
            }
        });

        // Maintenance Windows Table
        db.run(`CREATE TABLE IF NOT EXISTS maintenance_windows (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            start_time DATETIME NOT NULL,
            end_time DATETIME NOT NULL,
            status TEXT DEFAULT 'scheduled',
            notify_users INTEGER DEFAULT 1,
            affected_machines TEXT,
            created_by TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('Error creating maintenance_windows table:', err.message);
        });

        // Google OAuth: add google_id column to admin_users if not present
        db.run("ALTER TABLE admin_users ADD COLUMN google_id TEXT", (err) => {
            if (err && !err.message.includes("duplicate column name")) {
                console.error("Migration error (admin_users google_id):", err.message);
            }
        });
        db.run("ALTER TABLE admin_users ADD COLUMN google_email TEXT", (err) => {
            if (err && !err.message.includes("duplicate column name")) {
                console.error("Migration error (admin_users google_email):", err.message);
            }
        });

        // Load OAuth settings from DB into process.env at startup (if not already set via env)
        db.all("SELECT key, value FROM settings WHERE key LIKE 'oauth_%'", [], (err, rows) => {
            if (err || !rows) return;
            const cfg = {};
            rows.forEach(r => (cfg[r.key] = r.value));
            if (!process.env.GOOGLE_CLIENT_ID && cfg['oauth_google_client_id'])
                process.env.GOOGLE_CLIENT_ID = cfg['oauth_google_client_id'];
            if (!process.env.GOOGLE_CLIENT_SECRET && cfg['oauth_google_client_secret'])
                process.env.GOOGLE_CLIENT_SECRET = cfg['oauth_google_client_secret'];
            if (!process.env.GOOGLE_CALLBACK_URL && cfg['oauth_google_callback_url'])
                process.env.GOOGLE_CALLBACK_URL = cfg['oauth_google_callback_url'];
            if (process.env.GOOGLE_CLIENT_ID)
                console.log('[OAuth] Google OAuth loaded from DB settings.');
        });

        // Load config settings from DB at startup
        db.all("SELECT key, value FROM settings WHERE key LIKE 'config_%'", [], (err, rows) => {
            if (err || !rows) return;
            rows.forEach(r => {
                if (r.key === 'config_jwt_expires_in' && r.value) process.env.JWT_EXPIRES_IN = r.value;
            });
        });
    });
}

// Helper: Ensure Setup Token or Create Admin from Env
function ensureSetupToken() {
    db.get("SELECT count(*) as count FROM admin_users", (err, row) => {
        if (err) return console.error("Error checking admin users:", err.message);
        if (row.count > 0) return; // Users exist, no setup needed

        // No users — prompt admin to complete setup via the /setup web page
        db.get("SELECT token FROM setup_tokens WHERE used = 0", (err, row) => {
            if (err) return console.error("Error checking setup tokens:", err.message);
            if (row) {
                console.log("---------------------------------------------------");
                console.log("SETUP REQUIRED: Visit /setup in your browser to create the first admin account.");
                console.log("---------------------------------------------------");
            } else {
                const token = crypto.randomBytes(32).toString('hex');
                db.run("INSERT INTO setup_tokens (token) VALUES (?)", [token], (err) => {
                    if (err) return console.error("Error creating setup token:", err.message);
                    console.log("---------------------------------------------------");
                    console.log("SETUP REQUIRED: Visit /setup in your browser to create the first admin account.");
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
        const mailOptions = {
            from: config.from,
            to, subject, text, html // Pass html
        };
        await transporter.sendMail(mailOptions);
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

// Middleware: Require Admin Role
const requireAdmin = (req, res, next) => {
    if (req.admin && req.admin.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
};

// Middleware: Require Admin OR Moderator
const requireAdminOrModerator = (req, res, next) => {
    if (req.admin && ['admin', 'moderator'].includes(req.admin.role)) {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden: Admin or Moderator access required' });
    }
};

// Helper: Write an audit log entry (fire-and-forget)
function logAudit(actor, actorId, action, target, detail, ip) {
    db.run(
        "INSERT INTO audit_logs (actor, actor_id, action, target, detail, ip) VALUES (?, ?, ?, ?, ?, ?)",
        [actor || 'system', actorId || null, action, target || null, detail || null, ip || null],
        (err) => { if (err) console.error('[Audit] Log error:', err.message); }
    );
}

// Middleware: Authenticate API (Agent)
const authenticateAPI = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    let validKey = process.env.API_KEY || 'YOUR_STATIC_API_KEY_HERE';

    // Check DB for override
    try {
        const row = await new Promise((resolve, reject) => {
            db.get("SELECT value FROM settings WHERE key = 'general_api_key'", (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        if (row && row.value) validKey = row.value;
    } catch (e) {
        console.error("Error fetching API Key from DB:", e);
    }

    if (!validKey) {
        // Fallback or warning
        console.warn("[Security] No API_KEY configured.");
    }

    if (apiKey && apiKey === validKey) {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden: Invalid API Key' });
    }
};

// --- Auth Endpoints ---

// Check Auth Status (for frontend redirect)
app.get('/api/auth/status', (req, res) => {
    // Check if setup is required
    db.get("SELECT count(*) as count FROM admin_users", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        const setupRequired = row.count === 0;

        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) return res.json({ authenticated: false, setup_required: setupRequired });

        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) return res.json({ authenticated: false, setup_required: setupRequired });

            // Fetch full user details (email) from DB
            db.get("SELECT id, username, email, role, avatar, display_name, bio, location, google_id, (CASE WHEN password_hash IS NOT NULL AND password_hash != '' THEN 1 ELSE 0 END) as has_password FROM admin_users WHERE id = ?", [decoded.id], (err, user) => {
                if (err || !user) return res.json({ authenticated: false, setup_required: setupRequired });
                const safeUser = { ...user, has_google: !!user.google_id, google_id: undefined };
                res.json({ authenticated: true, user: safeUser, setup_required: setupRequired });
            });
        });
    });
});

// OAuth status — lets the frontend know if Google Sign-In is available
app.get('/api/auth/oauth-status', (req, res) => {
    // Check env vars first, then fall back to DB settings
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        return res.json({ google_oauth_enabled: true });
    }
    // Check DB for saved settings
    db.all("SELECT key, value FROM settings WHERE key IN ('oauth_google_client_id','oauth_google_client_secret')", [], (err, rows) => {
        if (err || !rows) return res.json({ google_oauth_enabled: false });
        const cfg = {};
        rows.forEach(r => (cfg[r.key] = r.value));
        const enabled = !!(cfg['oauth_google_client_id'] && cfg['oauth_google_client_secret']);
        if (enabled) {
            // Load into process.env for subsequent OAuth redirects
            process.env.GOOGLE_CLIENT_ID = cfg['oauth_google_client_id'];
            process.env.GOOGLE_CLIENT_SECRET = cfg['oauth_google_client_secret'];
            if (cfg['oauth_google_callback_url']) process.env.GOOGLE_CALLBACK_URL = cfg['oauth_google_callback_url'];
        }
        res.json({ google_oauth_enabled: enabled });
    });
});

// Google OAuth — redirect to Google
app.get('/api/auth/google', (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL ||
        `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
    if (!clientId) {
        return res.redirect('/login?error=oauth_not_configured');
    }
    // Encode returnTo in the state param so we can restore it after callback
    const returnTo = req.query.returnTo ? String(req.query.returnTo) : '';
    const state = returnTo ? Buffer.from(JSON.stringify({ returnTo })).toString('base64url') : '';
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: callbackUrl,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'select_account',
        ...(state ? { state } : {})
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// Google OAuth callback
app.get('/api/auth/google/callback', async (req, res) => {
    const { code, error, state } = req.query;
    if (error || !code) return res.redirect('/login?error=oauth_failed');

    // Decode returnTo from state
    let returnTo = '';
    try {
        if (state) {
            const decoded = JSON.parse(Buffer.from(String(state), 'base64url').toString());
            if (decoded.returnTo && String(decoded.returnTo).startsWith('/dashboard')) {
                returnTo = decoded.returnTo;
            }
        }
    } catch { /* ignore invalid state */ }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL ||
        `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

    if (!clientId || !clientSecret) return res.redirect('/login?error=oauth_not_configured');

    try {
        // Exchange code for tokens
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: callbackUrl, grant_type: 'authorization_code' })
        });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) return res.redirect('/login?error=oauth_failed');

        // Get user profile from Google
        const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        const profile = await profileRes.json();
        if (!profile.email) return res.redirect('/login?error=no_email');

        const googleId = profile.id;
        const googleEmail = profile.email;
        const googleName = profile.name || googleEmail.split('@')[0];
        const googleAvatar = profile.picture || null;

        // Find or create user by google_id / email
        db.get("SELECT * FROM admin_users WHERE google_id = ? OR email = ?", [googleId, googleEmail], (err, user) => {
            if (err) return res.redirect('/login?error=database_error');

            const issueJwt = (u, firstLogin) => {
                const token = jwt.sign({ id: u.id, username: u.username, role: u.role || 'admin' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
                logAudit(u.username, u.id, 'login', null, `Google OAuth login`, req.ip);
                const params = new URLSearchParams({ token, username: u.username, role: u.role || 'admin', ...(firstLogin ? { first_login: '1' } : {}), ...(returnTo ? { returnTo } : {}) });
                res.redirect(`/login?${params}`);
            };

            if (user) {
                // Update google_id and avatar if not set
                db.run("UPDATE admin_users SET google_id = COALESCE(google_id, ?), google_email = ?, avatar = COALESCE(avatar, ?) WHERE id = ?",
                    [googleId, googleEmail, googleAvatar, user.id]);
                issueJwt(user, false);
            } else {
                // First-time Google login: create account
                const username = googleName.replace(/\s+/g, '').toLowerCase().slice(0, 20) + '_' + googleId.slice(-4);
                const passwordHash = null; // Google-only login — no password
                db.run("INSERT INTO admin_users (username, email, display_name, avatar, google_id, google_email, role, password_hash) VALUES (?, ?, ?, ?, ?, ?, 'viewer', ?)",
                    [username, googleEmail, googleName, googleAvatar, googleId, googleEmail, passwordHash],
                    function(err) {
                        if (err) return res.redirect('/login?error=user_creation_failed');
                        db.get("SELECT * FROM admin_users WHERE id = ?", [this.lastID], (err, newUser) => {
                            if (err || !newUser) return res.redirect('/login?error=processing_failed');
                            issueJwt(newUser, true);
                        });
                    }
                );
            }
        });
    } catch (err) {
        console.error('[OAuth] Error:', err);
        res.redirect('/login?error=oauth_failed');
    }
});

// Login Endpoint
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM admin_users WHERE username = ?", [username], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        bcrypt.compare(password, user.password_hash, (err, match) => {
            if (err || !match) return res.status(401).json({ error: 'Invalid credentials' });

            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role || 'admin' },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            logAudit(user.username, user.id, 'login', null, `Login from ${req.ip}`, req.ip);
            res.json({ token, username: user.username, role: user.role || 'admin' });
        });
    });
});

// Logout Endpoint — JWT is stateless; client drops the token.
// Route must exist to avoid 404 in the browser console.
app.post('/api/auth/logout', (req, res) => {
    res.json({ message: 'Logged out' });
});

// --- Settings Endpoints ---

// Get General Settings (API Key)
app.get('/api/settings/general', authenticateDashboard, (req, res) => {
    db.get("SELECT value FROM settings WHERE key = 'general_api_key'", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        const apiKey = row ? row.value : (process.env.API_KEY || 'YOUR_STATIC_API_KEY_HERE');
        // Also include server runtime info
        db.all("SELECT key, value FROM settings WHERE key IN ('config_server_port','config_jwt_expires_in')", [], (err2, rows) => {
            const cfg = {};
            (rows || []).forEach(r => (cfg[r.key] = r.value));
            res.json({
                api_key: apiKey,
                version: require('./package.json').version || '3.x',
                node_version: process.version,
                uptime_seconds: Math.floor(process.uptime()),
                server_port: cfg['config_server_port'] || (process.env.PORT || '7777'),
                jwt_expires_in: cfg['config_jwt_expires_in'] || process.env.JWT_EXPIRES_IN || '7d'
            });
        });
    });
});

// Update General Settings (API Key)
app.put('/api/settings/general', authenticateDashboard, (req, res) => {
    const { api_key } = req.body;
    if (!api_key) return res.status(400).json({ error: 'API Key is required' });

    db.run("INSERT INTO settings (key, value, updated_at) VALUES ('general_api_key', ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
        [api_key],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'API Key updated' });
        }
    );
});

// Get Runtime Config
app.get('/api/settings/config', authenticateDashboard, requireAdmin, (req, res) => {
    db.all("SELECT key, value FROM settings WHERE key LIKE 'config_%'", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const cfg = {};
        (rows || []).forEach(r => (cfg[r.key.replace('config_', '')] = r.value));
        res.json({
            server_port: cfg['server_port'] || process.env.PORT || '7777',
            jwt_expires_in: cfg['jwt_expires_in'] || process.env.JWT_EXPIRES_IN || '7d'
        });
    });
});

// Update Runtime Config
app.put('/api/settings/config', authenticateDashboard, requireAdmin, (req, res) => {
    const { server_port, jwt_expires_in } = req.body;
    const upsert = (key, value, cb) => {
        db.run("INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
            [key, value], cb);
    };
    const tasks = [];
    if (server_port) tasks.push(cb => upsert('config_server_port', String(server_port), cb));
    if (jwt_expires_in) tasks.push(cb => upsert('config_jwt_expires_in', jwt_expires_in, cb));
    if (tasks.length === 0) return res.json({ success: true, message: 'Nothing to update' });
    let done = 0;
    tasks.forEach(fn => fn(err => {
        if (err) return res.status(500).json({ error: err.message });
        if (++done === tasks.length) {
            // Apply jwt_expires_in at runtime immediately (port requires restart)
            if (jwt_expires_in) process.env.JWT_EXPIRES_IN = jwt_expires_in;
            res.json({ success: true, message: 'Configuration saved' });
        }
    }));
});

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

// Get Chat Settings (Admin only)
app.get('/api/settings/chat', authenticateDashboard, requireAdmin, (req, res) => {
    db.all("SELECT key, value FROM settings WHERE key LIKE 'chat_%'", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const settings = {};
        if (rows) rows.forEach(r => settings[r.key] = r.value);

        res.json({
            max_file_mb: parseInt(settings.chat_max_file_mb || '100', 10),
            max_files_per_message: parseInt(settings.chat_max_files_per_message || '5', 10),
            allowed_mime: settings.chat_allowed_mime || 'image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,application/zip',
            history_days: parseInt(settings.chat_history_days || '180', 10)
        });
    });
});

// Update Chat Settings (Admin only)
app.put('/api/settings/chat', authenticateDashboard, requireAdmin, (req, res) => {
    const { max_file_mb, max_files_per_message, allowed_mime, history_days } = req.body;

    const updates = [
        { key: 'chat_max_file_mb', value: String(max_file_mb ?? 100) },
        { key: 'chat_max_files_per_message', value: String(max_files_per_message ?? 5) },
        { key: 'chat_allowed_mime', value: String(allowed_mime || '') },
        { key: 'chat_history_days', value: String(history_days ?? 180) }
    ];

    db.serialize(() => {
        const stmt = db.prepare("INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP");
        updates.forEach(u => stmt.run([u.key, u.value]));
        stmt.finalize((err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'Chat settings updated' });
        });
    });
});

// Get Google OAuth Settings
app.get('/api/settings/oauth', authenticateDashboard, requireAdmin, (req, res) => {
    db.all("SELECT key, value FROM settings WHERE key LIKE 'oauth_%'", [], (err, rows) => {
        const cfg = {};
        if (rows) rows.forEach(r => (cfg[r.key] = r.value));
        const clientId = process.env.GOOGLE_CLIENT_ID || cfg['oauth_google_client_id'] || '';
        const hasSecret = !!(process.env.GOOGLE_CLIENT_SECRET || cfg['oauth_google_client_secret']);
        const callbackUrl = process.env.GOOGLE_CALLBACK_URL || cfg['oauth_google_callback_url'] || '';
        res.json({
            google_client_id: clientId,
            has_secret: hasSecret,
            google_callback_url: callbackUrl,
            google_oauth_enabled: !!(clientId && hasSecret)
        });
    });
});

// Save Google OAuth Settings (writes to .env file next to exe)
app.put('/api/settings/oauth', authenticateDashboard, requireAdmin, (req, res) => {
    const { google_client_id, google_client_secret, google_callback_url } = req.body;
    // Persist in DB settings table (runtime only; env vars override if set)
    const updates = [
        { key: 'oauth_google_client_id', value: google_client_id || '' },
        { key: 'oauth_google_client_secret', value: google_client_secret || '' },
        { key: 'oauth_google_callback_url', value: google_callback_url || '' }
    ];
    db.serialize(() => {
        const stmt = db.prepare("INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP");
        updates.forEach(u => stmt.run([u.key, u.value]));
        stmt.finalize((err) => {
            if (err) return res.status(500).json({ error: err.message });
            // Apply to runtime process.env for immediate effect
            if (google_client_id) process.env.GOOGLE_CLIENT_ID = google_client_id;
            if (google_client_secret) process.env.GOOGLE_CLIENT_SECRET = google_client_secret;
            if (google_callback_url) process.env.GOOGLE_CALLBACK_URL = google_callback_url;
            logAudit(req.admin.username, req.admin.id, 'settings_changed', 'oauth', 'Google OAuth settings updated', req.ip);
            res.json({ success: true, message: 'Google OAuth settings saved. Restart server to fully apply from env file.' });
        });
    });
});

// Test SMTP Settings
app.post('/api/settings/smtp/test', authenticateDashboard, (req, res) => {
    const { email: testToEmail } = req.body;

    // Get current user's email as fallback
    db.get('SELECT email FROM admin_users WHERE id = ?', [req.admin.id], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });

        const recipient = testToEmail || (user ? user.email : null);

        if (!recipient) {
            return res.status(400).json({
                error: 'Recipient email required. Please provide a "test to" email or update your profile email first.'
            });
        }

        const htmlContent = emailTemplates.testEmail(recipient);
        const textContent = 'If you are reading this, your SMTP settings are correct!';

        const success = await sendEmail(recipient, 'SysTracker SMTP Test', textContent, htmlContent);
        if (success) res.json({ success: true, message: `Test email sent to ${recipient}` });
        else res.status(500).json({ error: 'Failed to send test email. Check server logs for details.' });
    });
});

// Change password
app.post('/api/auth/change-password', authenticateDashboard, (req, res) => {
    const { current_password, new_password } = req.body;
    if (!new_password) return res.status(400).json({ error: 'new_password is required' });
    if (new_password.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }
    db.get('SELECT * FROM admin_users WHERE id = ?', [req.admin.id], (err, user) => {
        if (err || !user) return res.status(500).json({ error: 'User not found' });

        const doHash = () => {
            bcrypt.hash(new_password, 12, (err, hash) => {
                if (err) return res.status(500).json({ error: 'Error hashing password' });
                db.run('UPDATE admin_users SET password_hash = ? WHERE id = ?', [hash, user.id], (err) => {
                    if (err) return res.status(500).json({ error: err.message });
                    console.log(`[Auth] Password changed: ${user.username}`);
                    res.json({ success: true, message: 'Password updated successfully!' });
                });
            });
        };

        // OAuth-only users (no password_hash) can set a password without current_password
        if (!user.password_hash) {
            return doHash();
        }

        // Regular users must provide current_password
        if (!current_password) {
            return res.status(400).json({ error: 'current_password is required' });
        }

        bcrypt.compare(current_password, user.password_hash, (err, match) => {
            if (err || !match) return res.status(401).json({ error: 'Current password is incorrect' });
            doHash();
        });
    });
});

// Update Profile (Email/Username/Display Name/Bio/Location/Avatar)
app.put('/api/auth/profile', authenticateDashboard, (req, res) => {
    const { email, username, display_name, bio, location, avatar } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' });

    db.run('UPDATE admin_users SET email = ?, username = COALESCE(?, username), display_name = ?, bio = ?, location = ?, avatar = ? WHERE id = ?',
        [email, username || null, display_name || null, bio || null, location || null, avatar || null, req.admin.id],
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

                const confirmLink = `${req.protocol}://${req.get('host')}/login/reset-password?token=${token}`;
                const htmlContent = emailTemplates.forgotPassword(user.username, confirmLink);
                // Fallback text
                const textContent = `Hello ${user.username},\n\nClick here to reset your password: ${confirmLink}\n\nLink expires in 1 hour.`;

                await sendEmail(email, 'Password Reset Request', textContent, htmlContent);
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

// Setup Password (same as reset, but for newly created users)
app.post('/api/auth/setup-password', (req, res) => {
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
                    res.json({ success: true, message: 'Password setup successful. Please login.' });
                });
            });
        });
});

// --- Upload Handling (Multer) ---
const multer = require('multer');
const uploadDir = path.join(BASE_DIR, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const chatUploadDir = path.join(uploadDir, 'chat');
if (!fs.existsSync(chatUploadDir)) {
    fs.mkdirSync(chatUploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '');
        cb(null, `${Date.now()}-${sanitized}`);
    }
});
const upload = multer({ storage: storage });

app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    res.json({ url: `/uploads/${req.file.filename}` });
});

// --- Standalone Download Endpoints ---
app.get('/api/download/agent', authenticateDashboard, (req, res) => {
    const agentPath = path.join(ASSETS_DIR, 'bin', 'SysTracker_Agent.exe');
    if (fs.existsSync(agentPath)) {
        res.download(agentPath, 'SysTracker_Agent.exe');
    } else {
        res.status(404).json({ error: 'Agent binary not bundled in this server. Check pkg configuration.' });
    }
});

// --- Agent Auto-Updater Endpoints ---

// Upload new agent release (Admin only)
app.post('/api/settings/agent/upload', authenticateDashboard, requireAdmin, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const { version } = req.body;
    if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Valid semantic version (e.g., 2.9.0) is required' });
    }

    // Create agent_releases directory if it doesn't exist
    const agentReleasesDir = path.join(BASE_DIR, 'data', 'agent_releases');
    if (!fs.existsSync(agentReleasesDir)) {
        fs.mkdirSync(agentReleasesDir, { recursive: true });
    }

    // Calculate SHA256 hash of the file for integrity verification
    const crypto = require('crypto');
    const fileBuffer = fs.readFileSync(req.file.path);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const fileSize = fileBuffer.length;

    // Move file to agent_releases directory
    const targetPath = path.join(agentReleasesDir, `SysTracker_Agent_v${version}.exe`);
    try {
        fs.renameSync(req.file.path, targetPath);
    } catch (e) {
        return res.status(500).json({ error: 'Failed to save agent release: ' + e.message });
    }

    // Save to database with hash for integrity verification
    db.run("INSERT INTO agent_releases (version, file_path, file_hash, file_size) VALUES (?, ?, ?, ?)",
        [version, targetPath, hash, fileSize],
        function (err) {
            if (err) {
                // Clean up file
                if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Version already exists' });
                }
                return res.status(500).json({ error: err.message });
            }
            console.log(`[AgentUpdater] New agent release v${version} uploaded by ${req.admin.username} (SHA256: ${hash.substring(0, 16)}...)`);
            res.json({ success: true, message: 'Agent release uploaded successfully', version, hash });
        }
    );
});

// Check for agent updates (Public - no auth required, like /api/telemetry)
app.get('/api/agent/check-update', (req, res) => {
    const { current_version } = req.query;

    // Get the latest version from database with hash for integrity verification
    db.get("SELECT version, file_hash, file_size FROM agent_releases ORDER BY upload_date DESC LIMIT 1", [], (err, latest) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!latest) return res.json({ updateAvailable: false });

        // Simple semantic version comparison
        const isNewer = compareVersions(latest.version, current_version || '0.0.0') > 0;

        res.json({
            updateAvailable: isNewer,
            version: isNewer ? latest.version : null,
            downloadUrl: isNewer ? `/api/agent/download?v=${latest.version}` : null,
            fileHash: isNewer ? latest.file_hash : null,
            fileSize: isNewer ? latest.file_size : null
        });
    });
});

// Download specific agent version (Public - no auth required)
app.get('/api/agent/download', (req, res) => {
    const { v } = req.query;

    if (!v) {
        // Get latest version
        db.get("SELECT version, file_path FROM agent_releases ORDER BY upload_date DESC LIMIT 1", [], (err, release) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!release) return res.status(404).json({ error: 'No agent releases available' });

            if (fs.existsSync(release.file_path)) {
                res.download(release.file_path, `SysTracker_Agent_v${release.version}.exe`);
            } else {
                res.status(404).json({ error: 'Agent file not found on disk' });
            }
        });
    } else {
        // Get specific version
        db.get("SELECT version, file_path FROM agent_releases WHERE version = ?", [v], (err, release) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!release) return res.status(404).json({ error: 'Version not found' });

            if (fs.existsSync(release.file_path)) {
                res.download(release.file_path, `SysTracker_Agent_v${release.version}.exe`);
            } else {
                res.status(404).json({ error: 'Agent file not found on disk' });
            }
        });
    }
});

// Get current distributed version (for dashboard display)
app.get('/api/settings/agent/version', authenticateDashboard, (req, res) => {
    db.get("SELECT version, upload_date, file_hash, file_size FROM agent_releases ORDER BY upload_date DESC LIMIT 1", [], (err, release) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(release || { version: null, upload_date: null, file_hash: null, file_size: null });
    });
});

// List all agent releases (Admin only)
app.get('/api/settings/agent/releases', authenticateDashboard, requireAdmin, (req, res) => {
    db.all("SELECT id, version, upload_date FROM agent_releases ORDER BY upload_date DESC", [], (err, releases) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(releases || []);
    });
});

// Helper: Compare semantic versions (returns -1, 0, or 1)
function compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
        if (parts1[i] > parts2[i]) return 1;
        if (parts1[i] < parts2[i]) return -1;
    }
    return 0;
}


// --- DEBUG ENDPOINT ---
app.get('/api/debug/config', (req, res) => {
    const resolvedDbFolder = path.join(BASE_DIR, 'data');
    const resolvedDbFile = path.join(resolvedDbFolder, 'systracker.db');

    let snapshotContents = [];
    try {
        snapshotContents = fs.readdirSync(ASSETS_DIR);
    } catch (e) { snapshotContents = [`Error: ${e.message}`]; }

    res.json({
        cwd: process.cwd(),
        is_pkg: IS_PKG,
        base_dir: BASE_DIR,
        assets_dir: ASSETS_DIR,
        snapshotContents,
        dbFolder: resolvedDbFolder,
        dbFolderExists: fs.existsSync(resolvedDbFolder),
        dbFile: resolvedDbFile,
        dbFileExists: fs.existsSync(resolvedDbFile),
        isDocker: fs.existsSync('/.dockerenv')
    });
});

// --- Setup Endpoint (first-run wizard) ---
// Only works when no admin users exist yet; blocked once setup is complete.
app.post('/api/setup', (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    db.get("SELECT count(*) as count FROM admin_users", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row.count > 0) {
            return res.status(403).json({ error: 'Setup already completed. Please login.' });
        }

        bcrypt.hash(password, 12, (err, hash) => {
            if (err) return res.status(500).json({ error: 'Hashing error' });

            db.run("INSERT INTO admin_users (username, email, password_hash) VALUES (?, ?, ?)",
                [username, email, hash],
                function (err) {
                    if (err) return res.status(500).json({ error: err.message });

                    // Clear setup tokens as they are no longer needed
                    db.run("DELETE FROM setup_tokens");

                    console.log(`[Setup] Admin user '${username}' created via Setup Wizard.`);
                    res.json({ success: true, message: 'Setup complete. Redirecting to login...' });
                }
            );
        });
    });
});

// --- User Management Endpoints (Admin Only) ---

// List all users (include avatar + display_name)
app.get('/api/users', authenticateDashboard, requireAdmin, (req, res) => {
    db.all("SELECT id, username, email, role, avatar, display_name, created_at FROM admin_users ORDER BY created_at DESC", [], (err, users) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(users);
    });
});

// Create new user
app.post('/api/users', authenticateDashboard, requireAdmin, (req, res) => {
    const { username, email, password, role, sendSetupEmail } = req.body;

    if (!username || !email) {
        return res.status(400).json({ error: 'Username and email are required' });
    }

    // Password can be optional if sendSetupEmail is true
    if (password && password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    if (!password && !sendSetupEmail) {
        return res.status(400).json({ error: 'Either password or sendSetupEmail must be provided' });
    }

    if (role && !['admin', 'moderator', 'viewer'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be "admin", "moderator", or "viewer"' });
    }

    const createUserWithHash = (hash) => {
        db.run("INSERT INTO admin_users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
            [username, email, hash, role || 'admin'],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Username or email already exists' });
                    }
                    return res.status(500).json({ error: err.message });
                }
                const userId = this.lastID;
                console.log(`[UserMgmt] User '${username}' created with role '${role || 'admin'}' by ${req.admin.username}`);
                logAudit(req.admin.username, req.admin.id, 'user_created', username, `role=${role || 'admin'}`, req.ip);

                // If sendSetupEmail is true, send welcome email then setup email
                if (sendSetupEmail) {
                    const welcomeHtml = emailTemplates.welcomeEmail(username);
                    const welcomeText = `Welcome to SysTracker, ${username}! Your account has been created.`;

                    sendEmail(email, 'Welcome to SysTracker', welcomeText, welcomeHtml)
                        .then(() => {
                            const token = crypto.randomBytes(32).toString('hex');
                            const expiresAt = new Date(Date.now() + 86400000).toISOString(); // 24 hours

                            db.run('INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES (?, ?, ?)',
                                [token, userId, expiresAt],
                                async (err) => {
                                    if (err) {
                                        console.error('[UserMgmt] Failed to create setup token:', err);
                                        return res.json({ success: true, message: 'User created but failed to send setup email', userId });
                                    }

                                    const setupLink = `${req.protocol}://${req.get('host')}/login/setup-password?token=${token}`;
                                    const htmlContent = emailTemplates.passwordSetupEmail(username, null, setupLink, '24 hours');
                                    const textContent = `Hello ${username},\n\nYour account has been created. Set your password here: ${setupLink}\n\nLink expires in 24 hours.`;

                                    try {
                                        await sendEmail(email, 'Set Your Password - SysTracker', textContent, htmlContent);
                                        console.log(`[UserMgmt] Password setup email sent to ${username}`);
                                        logAudit(req.admin.username, req.admin.id, 'password_setup_sent', username, null, req.ip);
                                        res.json({ success: true, message: 'User created and setup email sent', userId });
                                    } catch (emailErr) {
                                        console.error('[Email] Failed to send password setup:', emailErr);
                                        res.json({ success: true, message: 'User created but failed to send setup email', userId });
                                    }
                                });
                        })
                        .catch((emailErr) => {
                            console.error('[Email] Failed to send welcome email:', emailErr);
                            res.json({ success: true, message: 'User created but failed to send welcome email', userId });
                        });
                } else {
                    res.json({ success: true, message: 'User created successfully', userId });
                }
            }
        );
    };

    if (password) {
        bcrypt.hash(password, 12, (err, hash) => {
            if (err) return res.status(500).json({ error: 'Hashing error' });
            createUserWithHash(hash);
        });
    } else {
        // Generate a random temporary password that will be overwritten when user sets their password
        const tempPassword = crypto.randomBytes(32).toString('hex');
        bcrypt.hash(tempPassword, 12, (err, hash) => {
            if (err) return res.status(500).json({ error: 'Hashing error' });
            createUserWithHash(hash);
        });
    }
});

// Send Password Setup Email
app.post('/api/users/:id/send-password-setup', authenticateDashboard, requireAdmin, (req, res) => {
    const { id } = req.params;

    db.get('SELECT id, username, email, display_name FROM admin_users WHERE id = ?', [id], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (!user.email) return res.status(400).json({ error: 'User has no email address' });

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 86400000).toISOString(); // 24 hours

        db.run('INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES (?, ?, ?)',
            [token, user.id, expiresAt],
            async (err) => {
                if (err) return res.status(500).json({ error: err.message });

                const setupLink = `${req.protocol}://${req.get('host')}/login/setup-password?token=${token}`;
                const htmlContent = emailTemplates.passwordSetupEmail(user.username, user.display_name, setupLink, '24 hours');
                const textContent = `Hello ${user.username},\n\nYour account has been created. Set your password here: ${setupLink}\n\nLink expires in 24 hours.`;

                try {
                    await sendEmail(user.email, 'Set Your Password - SysTracker', textContent, htmlContent);
                    console.log(`[UserMgmt] Password setup email sent to ${user.username} by ${req.admin.username}`);
                    logAudit(req.admin.username, req.admin.id, 'password_setup_sent', user.username, null, req.ip);
                    res.json({ success: true, message: 'Password setup email sent successfully' });
                } catch (emailErr) {
                    console.error('[Email] Failed to send password setup:', emailErr);
                    res.status(500).json({ error: 'Failed to send email', details: emailErr.message });
                }
            });
    });
});

// Delete user
app.delete('/api/users/:id', authenticateDashboard, requireAdmin, (req, res) => {
    const { id } = req.params;

    // Prevent deleting yourself
    if (parseInt(id) === req.admin.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    db.run("DELETE FROM admin_users WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        console.log(`[UserMgmt] User ID ${id} deleted by ${req.admin.username}`);
        logAudit(req.admin.username, req.admin.id, 'user_deleted', `user_id=${id}`, null, req.ip);
        res.json({ success: true, message: 'User deleted successfully' });
    });
});

// Update user info (admin only)
app.put('/api/users/:id', authenticateDashboard, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { username, email, display_name, password } = req.body;

    const fieldsToUpdate = [];
    const values = [];

    if (username) { fieldsToUpdate.push('username = ?'); values.push(username); }
    if (email) { fieldsToUpdate.push('email = ?'); values.push(email); }
    if (display_name !== undefined) { fieldsToUpdate.push('display_name = ?'); values.push(display_name); }

    if (fieldsToUpdate.length === 0 && !password) {
        return res.status(400).json({ error: 'No fields to update' });
    }

    const doUpdate = (extraFields, extraVals) => {
        const allFields = [...fieldsToUpdate, ...extraFields];
        const allVals = [...values, ...extraVals, id];
        db.run(`UPDATE admin_users SET ${allFields.join(', ')} WHERE id = ?`, allVals, function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Username or email already in use' });
                return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
            logAudit(req.admin.username, req.admin.id, 'user_updated', `user_id=${id}`, `fields=${allFields.join(',')}`, req.ip);
            res.json({ success: true, message: 'User updated' });
        });
    };

    if (password) {
        if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
        bcrypt.hash(password, 12, (err, hash) => {
            if (err) return res.status(500).json({ error: 'Hashing error' });
            doUpdate(['password_hash = ?'], [hash]);
        });
    } else {
        doUpdate([], []);
    }
});

// Update user role
app.patch('/api/users/:id/role', authenticateDashboard, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'moderator', 'viewer'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be "admin", "moderator", or "viewer"' });
    }

    // Prevent changing your own role
    if (parseInt(id) === req.admin.id) {
        return res.status(400).json({ error: 'Cannot change your own role' });
    }

    db.run("UPDATE admin_users SET role = ? WHERE id = ?", [role, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        console.log(`[UserMgmt] User ID ${id} role changed to '${role}' by ${req.admin.username}`);
        logAudit(req.admin.username, req.admin.id, 'role_changed', `user_id=${id}`, `new_role=${role}`, req.ip);
        res.json({ success: true, message: 'User role updated successfully' });
    });
});

// --- Audit Logs Endpoint ---
app.get('/api/audit-logs', authenticateDashboard, requireAdmin, (req, res) => {
    const { actor, action, from, to, limit } = req.query;
    const conditions = [];
    const params = [];
    if (actor) { conditions.push('actor LIKE ?'); params.push(`%${actor}%`); }
    if (action) { conditions.push('action = ?'); params.push(action); }
    if (from) { conditions.push('ts >= ?'); params.push(from); }
    if (to) { conditions.push('ts <= ?'); params.push(to); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const maxRows = parseInt(limit) || 200;
    db.all(`SELECT * FROM audit_logs ${where} ORDER BY ts DESC LIMIT ?`, [...params, maxRows], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- Internal Mail Endpoints ---
// GET /api/mail?folder=inbox|sent
app.get('/api/mail', authenticateDashboard, (req, res) => {
    const me = req.admin.username;
    const folder = req.query.folder || 'inbox';
    let query, params;
    if (folder === 'sent') {
        query = 'SELECT * FROM mail_messages WHERE from_user = ? ORDER BY created_at DESC LIMIT 100';
        params = [me];
    } else {
        // Include messages sent directly to the user OR broadcast to all
        query = "SELECT * FROM mail_messages WHERE (to_user = ? OR to_user = '__broadcast__') ORDER BY created_at DESC LIMIT 100";
        params = [me];
    }
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// GET /api/mail/unread-count
app.get('/api/mail/unread-count', authenticateDashboard, (req, res) => {
    const me = req.admin.username;
    db.get("SELECT COUNT(*) as count FROM mail_messages WHERE (to_user = ? OR to_user = '__broadcast__') AND is_read = 0", [me], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ count: row ? row.count : 0 });
    });
});

// GET /api/mail/:id - single message + mark read
app.get('/api/mail/:id', authenticateDashboard, (req, res) => {
    const me = req.admin.username;
    db.get("SELECT * FROM mail_messages WHERE id = ? AND (to_user = ? OR from_user = ? OR to_user = '__broadcast__')", [req.params.id, me, me], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Message not found' });
        // Only mark as read if it's specifically addressed to the user
        if ((row.to_user === me) && !row.is_read) {
            db.run('UPDATE mail_messages SET is_read = 1 WHERE id = ?', [row.id]);
        }
        res.json(row);
    });
});

// POST /api/mail - compose
app.post('/api/mail', authenticateDashboard, (req, res) => {
    const { to_user, subject, body, template_key } = req.body;
    const from_user = req.admin.username;
    if (!to_user || !subject || !body) return res.status(400).json({ error: 'to_user, subject, and body are required' });
    db.run(
        'INSERT INTO mail_messages (from_user, to_user, subject, body, template_key) VALUES (?, ?, ?, ?, ?)',
        [from_user, to_user, subject, body, template_key || null],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            logAudit(from_user, req.admin.id, 'mail_sent', to_user, subject, req.ip);
            res.json({ success: true, id: this.lastID });
        }
    );
});

// DELETE /api/mail/:id
app.delete('/api/mail/:id', authenticateDashboard, (req, res) => {
    const me = req.admin.username;
    db.run('DELETE FROM mail_messages WHERE id = ? AND (to_user = ? OR from_user = ?)', [req.params.id, me, me], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Message not found' });
        res.json({ success: true });
    });
});

// GET /api/mail-users - list all usernames for composing
app.get('/api/mail-users', authenticateDashboard, (req, res) => {
    db.all('SELECT username, display_name, avatar FROM admin_users', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- Internal Chat Endpoints (Phase 2: groups, uploads, receipts) ---
const getChatSettings = () => new Promise((resolve) => {
    db.all("SELECT key, value FROM settings WHERE key LIKE 'chat_%'", [], (err, rows) => {
        const settings = {};
        if (rows) rows.forEach(r => settings[r.key] = r.value);
        resolve({
            max_file_mb: parseInt(settings.chat_max_file_mb || '100', 10),
            max_files_per_message: parseInt(settings.chat_max_files_per_message || '5', 10),
            allowed_mime: (settings.chat_allowed_mime || '').split(',').map(s => s.trim()).filter(Boolean),
            history_days: parseInt(settings.chat_history_days || '180', 10)
        });
    });
});

// GET /api/chat/threads
app.get('/api/chat/threads', authenticateDashboard, (req, res) => {
    const me = req.admin.username;
    const query = `
        SELECT 
            t.id,
            t.is_group,
            t.name,
            t.created_at,
            r.last_read_at,
            m.body AS last_message,
            m.attachment_name AS last_attachment_name,
            m.created_at AS last_message_at,
            u.username AS other_username,
            u.display_name AS other_display_name,
            u.avatar AS other_avatar,
            (SELECT COUNT(*) FROM chat_thread_members WHERE thread_id = t.id) AS member_count
        FROM chat_threads t
        JOIN chat_thread_members tm ON tm.thread_id = t.id
        LEFT JOIN chat_thread_members tm2 ON tm2.thread_id = t.id AND tm2.username != ?
        LEFT JOIN admin_users u ON u.username = tm2.username
        LEFT JOIN chat_thread_reads r ON r.thread_id = t.id AND r.username = ?
        LEFT JOIN chat_messages m ON m.id = (
            SELECT id FROM chat_messages WHERE thread_id = t.id ORDER BY created_at DESC LIMIT 1
        )
        WHERE tm.username = ?
        ORDER BY (m.created_at IS NULL) ASC, m.created_at DESC, t.created_at DESC
    `;
    db.all(query, [me, me, me], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const enriched = (rows || []).map(r => {
            const lastAt = r.last_message_at || r.created_at;
            const unread = r.last_message_at && (!r.last_read_at || r.last_message_at > r.last_read_at);
            return { ...r, unread_count: unread ? 1 : 0, last_activity_at: lastAt };
        });
        res.json(enriched);
    });
});

// POST /api/chat/threads { target_user }
app.post('/api/chat/threads', authenticateDashboard, (req, res) => {
    const me = req.admin.username;
    const { target_user } = req.body;

    if (!target_user) return res.status(400).json({ error: 'target_user is required' });
    if (target_user === me) return res.status(400).json({ error: 'Cannot chat with yourself' });

    db.get('SELECT username FROM admin_users WHERE username = ?', [target_user], (err, userRow) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!userRow) return res.status(404).json({ error: 'User not found' });

        const existingQuery = `
            SELECT t.id FROM chat_threads t
            JOIN chat_thread_members a ON a.thread_id = t.id
            JOIN chat_thread_members b ON b.thread_id = t.id
            WHERE t.is_group = 0 AND a.username = ? AND b.username = ?
            LIMIT 1
        `;
        db.get(existingQuery, [me, target_user], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (row) return res.json({ success: true, thread_id: row.id, existing: true });

            const threadId = crypto.randomUUID();
            db.run('INSERT INTO chat_threads (id, is_group, name, created_by) VALUES (?, 0, NULL, ?)',
                [threadId, me],
                (err) => {
                    if (err) return res.status(500).json({ error: err.message });

                    const stmt = db.prepare('INSERT INTO chat_thread_members (thread_id, username) VALUES (?, ?)');
                    stmt.run([threadId, me]);
                    stmt.run([threadId, target_user]);
                    stmt.finalize();

                    res.json({ success: true, thread_id: threadId, existing: false });
                }
            );
        });
    });
});

// POST /api/chat/groups { name, members[] }
app.post('/api/chat/groups', authenticateDashboard, (req, res) => {
    const me = req.admin.username;
    const { name, members } = req.body;
    const memberList = Array.isArray(members) ? members.filter(Boolean) : [];

    if (!name || !name.trim()) return res.status(400).json({ error: 'Group name is required' });
    if (memberList.length === 0) return res.status(400).json({ error: 'At least one member is required' });

    const uniqueMembers = Array.from(new Set([me, ...memberList]));
    const placeholders = uniqueMembers.map(() => '?').join(',');

    db.all(`SELECT username FROM admin_users WHERE username IN (${placeholders})`, uniqueMembers, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!rows || rows.length !== uniqueMembers.length) return res.status(400).json({ error: 'One or more users not found' });

        const threadId = crypto.randomUUID();
        db.run('INSERT INTO chat_threads (id, is_group, name, created_by) VALUES (?, 1, ?, ?)',
            [threadId, name.trim(), me],
            (err) => {
                if (err) return res.status(500).json({ error: err.message });
                const stmt = db.prepare('INSERT INTO chat_thread_members (thread_id, username) VALUES (?, ?)');
                uniqueMembers.forEach(u => stmt.run([threadId, u]));
                stmt.finalize();
                res.json({ success: true, thread_id: threadId });
            }
        );
    });
});

// GET /api/chat/threads/:id/members
app.get('/api/chat/threads/:id/members', authenticateDashboard, (req, res) => {
    const me = req.admin.username;
    const threadId = req.params.id;

    db.get('SELECT 1 FROM chat_thread_members WHERE thread_id = ? AND username = ?', [threadId, me], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(403).json({ error: 'Access denied' });

        db.all('SELECT u.username, u.display_name, u.avatar FROM chat_thread_members m JOIN admin_users u ON u.username = m.username WHERE m.thread_id = ?',
            [threadId],
            (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(rows || []);
            }
        );
    });
});

// POST /api/chat/threads/:id/members { username }
app.post('/api/chat/threads/:id/members', authenticateDashboard, (req, res) => {
    const me = req.admin.username;
    const threadId = req.params.id;
    const { username } = req.body;

    if (!username) return res.status(400).json({ error: 'username is required' });

    db.get('SELECT created_by, is_group FROM chat_threads WHERE id = ?', [threadId], (err, thread) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!thread) return res.status(404).json({ error: 'Thread not found' });
        if (!thread.is_group) return res.status(400).json({ error: 'Not a group thread' });

        db.get('SELECT 1 FROM chat_thread_members WHERE thread_id = ? AND username = ?', [threadId, me], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(403).json({ error: 'Access denied' });

            db.get('SELECT username FROM admin_users WHERE username = ?', [username], (err, userRow) => {
                if (err) return res.status(500).json({ error: err.message });
                if (!userRow) return res.status(404).json({ error: 'User not found' });

                db.run('INSERT OR IGNORE INTO chat_thread_members (thread_id, username) VALUES (?, ?)', [threadId, username], function (err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ success: true, added: this.changes > 0 });
                });
            });
        });
    });
});

// DELETE /api/chat/threads/:id/members/:username
app.delete('/api/chat/threads/:id/members/:username', authenticateDashboard, (req, res) => {
    const me = req.admin.username;
    const threadId = req.params.id;
    const username = req.params.username;

    db.get('SELECT is_group FROM chat_threads WHERE id = ?', [threadId], (err, thread) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!thread) return res.status(404).json({ error: 'Thread not found' });
        if (!thread.is_group) return res.status(400).json({ error: 'Not a group thread' });

        db.get('SELECT 1 FROM chat_thread_members WHERE thread_id = ? AND username = ?', [threadId, me], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(403).json({ error: 'Access denied' });

            db.run('DELETE FROM chat_thread_members WHERE thread_id = ? AND username = ?', [threadId, username], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, removed: this.changes > 0 });
            });
        });
    });
});

// GET /api/chat/threads/:id/messages
app.get('/api/chat/threads/:id/messages', authenticateDashboard, (req, res) => {
    const me = req.admin.username;
    const threadId = req.params.id;

    db.get('SELECT 1 FROM chat_thread_members WHERE thread_id = ? AND username = ?', [threadId, me], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(403).json({ error: 'Access denied' });

        db.all('SELECT id, thread_id, sender, body, attachment_url, attachment_name, attachment_size, attachment_type, created_at FROM chat_messages WHERE thread_id = ? ORDER BY created_at ASC LIMIT 500',
            [threadId],
            (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(rows || []);
            }
        );
    });
});

// POST /api/chat/threads/:id/read
app.post('/api/chat/threads/:id/read', authenticateDashboard, (req, res) => {
    const me = req.admin.username;
    const threadId = req.params.id;

    db.get('SELECT 1 FROM chat_thread_members WHERE thread_id = ? AND username = ?', [threadId, me], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(403).json({ error: 'Access denied' });

        db.run('INSERT INTO chat_thread_reads (thread_id, username, last_read_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(thread_id, username) DO UPDATE SET last_read_at = CURRENT_TIMESTAMP',
            [threadId, me],
            (err) => {
                if (err) return res.status(500).json({ error: err.message });
                io.emit('chat_read', { thread_id: threadId, username: me, read_at: new Date().toISOString() });
                res.json({ success: true });
            }
        );
    });
});

// POST /api/chat/threads/:id/messages
app.post('/api/chat/threads/:id/messages', authenticateDashboard, (req, res) => {
    const me = req.admin.username;
    const threadId = req.params.id;
    const { body } = req.body;

    if (!body || !body.trim()) return res.status(400).json({ error: 'Message body is required' });

    db.get('SELECT 1 FROM chat_thread_members WHERE thread_id = ? AND username = ?', [threadId, me], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(403).json({ error: 'Access denied' });

        const msgId = crypto.randomUUID();
        db.run('INSERT INTO chat_messages (id, thread_id, sender, body) VALUES (?, ?, ?, ?)',
            [msgId, threadId, me, body.trim()],
            (err) => {
                if (err) return res.status(500).json({ error: err.message });

                const payload = { id: msgId, thread_id: threadId, sender: me, body: body.trim(), created_at: new Date().toISOString() };
                io.emit('chat_message', payload);
                res.json({ success: true, message: payload });
            }
        );
    });
});

// POST /api/chat/threads/:id/upload (multipart)
app.post('/api/chat/threads/:id/upload', authenticateDashboard, async (req, res) => {
    const me = req.admin.username;
    const threadId = req.params.id;

    const settings = await getChatSettings();
    const maxFiles = settings.max_files_per_message || 5;
    const allowedMime = settings.allowed_mime || [];

    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, chatUploadDir),
        filename: (req, file, cb) => {
            const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '');
            cb(null, `${Date.now()}-${sanitized}`);
        }
    });

    const uploadChat = multer({
        storage,
        limits: { fileSize: (settings.max_file_mb || 100) * 1024 * 1024, files: maxFiles },
        fileFilter: (req, file, cb) => {
            if (allowedMime.length === 0 || allowedMime.includes(file.mimetype)) return cb(null, true);
            cb(new Error('File type not allowed'));
        }
    }).array('files', maxFiles);

    uploadChat(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message });
        const files = req.files || [];
        const body = (req.body?.body || '').trim();

        if (!Array.isArray(files) || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        db.get('SELECT 1 FROM chat_thread_members WHERE thread_id = ? AND username = ?', [threadId, me], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(403).json({ error: 'Access denied' });

            const created = [];
            const stmt = db.prepare('INSERT INTO chat_messages (id, thread_id, sender, body, attachment_url, attachment_name, attachment_size, attachment_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
            files.forEach((file) => {
                const msgId = crypto.randomUUID();
                const messageBody = body || `Sent a file: ${file.originalname}`;
                const attachmentUrl = `/uploads/chat/${file.filename}`;
                stmt.run([
                    msgId,
                    threadId,
                    me,
                    messageBody,
                    attachmentUrl,
                    file.originalname,
                    file.size,
                    file.mimetype
                ]);
                const payload = {
                    id: msgId,
                    thread_id: threadId,
                    sender: me,
                    body: messageBody,
                    attachment_url: attachmentUrl,
                    attachment_name: file.originalname,
                    attachment_size: file.size,
                    attachment_type: file.mimetype,
                    created_at: new Date().toISOString()
                };
                created.push(payload);
                io.emit('chat_message', payload);
            });
            stmt.finalize();
            res.json({ success: true, messages: created });
        });
    });
});

// Chat history retention (daily)
setInterval(async () => {
    try {
        const settings = await getChatSettings();
        const days = settings.history_days || 180;
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        db.all('SELECT id, attachment_url FROM chat_messages WHERE created_at < ?', [cutoff], (err, rows) => {
            if (err || !rows) return;
            rows.forEach(row => {
                if (row.attachment_url && row.attachment_url.startsWith('/uploads/')) {
                    const filePath = path.join(BASE_DIR, row.attachment_url.replace('/uploads/', 'uploads/'));
                    if (fs.existsSync(filePath)) {
                        try { fs.unlinkSync(filePath); } catch {}
                    }
                }
            });
            db.run('DELETE FROM chat_messages WHERE created_at < ?', [cutoff]);
        });
    } catch {}
}, 24 * 60 * 60 * 1000);

// --- Background Jobs ---

// Periodic Offline Check (every 60s)
setInterval(() => {
    const threshold = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 minutes ago
    db.run(
        "UPDATE machines SET status = 'offline' WHERE last_seen < ? AND status = 'online'",
        [threshold],
        function (err) {
            if (err) console.error("[Job] Error updating offline status:", err.message);
            else if (this.changes > 0) {
                console.log(`[Job] Marked ${this.changes} machine(s) as offline.`);
                db.all("SELECT id FROM machines WHERE status = 'offline'", (err, rows) => {
                    if (err || !rows) return;
                    rows.forEach(row => evaluateAlerts(row.id, { status: 'offline' }));
                });
            }
        }
    );
}, 60000);

// --- API Endpoints ---

// Ingest Telemetry (from Python Agent)
// Track last DB-persist time per machine — we emit to socket every call but only write to DB every ~10s
const lastMetricsDbWrite = new Map(); // machineId -> timestamp (ms)
const METRICS_DB_THROTTLE_MS = 10_000; // persist to DB at most once per 10s per machine

const lastMachineDbWrite = new Map(); // machineId -> timestamp (ms)
const MACHINE_DB_THROTTLE_MS = 60_000; // persist machine metadata at most once per minute

app.post('/api/telemetry', authenticateAPI, (req, res) => {
    const { machine, metrics, events } = req.body;

    if (!machine || !machine.id) {
        logger.warn('Invalid telemetry payload: Machine ID required', { ip: req.ip });
        return res.status(400).json({ error: 'Invalid payload: Machine ID required' });
    }

    try {
        // --- STEP 0: Validate incoming data ---
        let validatedProcesses = metrics && metrics.processes ? validateProcessData(metrics.processes) : null;
        let validatedHardwareInfo = machine.hardware_info ? validateHardwareInfo(machine.hardware_info) : null;
        let validatedDiskDetails = metrics && metrics.disk_details ? validateDiskDetails(metrics.disk_details) : null;

        // --- STEP 1: Emit to Dashboard IMMEDIATELY (zero-wait) ---
        // Build mappings first so the dashboard gets notified before any DB work begins.
        const mappedMetrics = metrics ? {
            cpu: metrics.cpu,
            ram: metrics.ram,
            disk: metrics.disk_total_gb ? Math.round(((metrics.disk_total_gb - metrics.disk_free_gb) / metrics.disk_total_gb) * 100) : 0,
            disk_details: validatedDiskDetails || metrics.disk_details,
            processes: validatedProcesses || metrics.processes,
            network_up_kbps: metrics.network_up_kbps,
            network_down_kbps: metrics.network_down_kbps,
            uptime_seconds: metrics.uptime_seconds,
            active_vpn: metrics.active_vpn
        } : {};

        let emittedHardwareInfo = null;
        if (validatedHardwareInfo) {
            const details = validatedHardwareInfo.all_details || validatedHardwareInfo;
            if (metrics && metrics.network_interfaces) {
                details.network = metrics.network_interfaces;
            }
            emittedHardwareInfo = { all_details: details };
        } else if (machine.hardware_info) {
            const raw = machine.hardware_info;
            const details = raw.all_details || raw;
            if (metrics && metrics.network_interfaces) {
                details.network = metrics.network_interfaces;
            }
            emittedHardwareInfo = { all_details: details };
        } else if (metrics && metrics.network_interfaces && metrics.network_interfaces.length > 0) {
            emittedHardwareInfo = { all_details: { network: metrics.network_interfaces } };
        }

        io.emit('machine_update', {
            id: machine.id,
            hostname: machine.hostname,
            status: 'online',
            last_seen: new Date(),
            metrics: mappedMetrics,
            hardware_info: emittedHardwareInfo
        });

        // Respond to agent immediately so it doesn't wait for DB writes
        res.json({ success: true });

        // --- STEP 2: Persist to DB asynchronously (fire and forget) ---
        // Machine upsert — runs only if throttled or if critical info changed
        // We update last_seen every 60s to reduce DB locking
        const now = Date.now();
        const lastMachWrite = lastMachineDbWrite.get(machine.id) || 0;

        if ((now - lastMachWrite) >= MACHINE_DB_THROTTLE_MS) {
            lastMachineDbWrite.set(machine.id, now);

            const machineQuery = `
            INSERT INTO machines (id, hostname, ip_address, os_info, os_distro, os_release, os_codename, os_serial, os_uefi, uuid, device_name, users, hardware_info, status, last_seen)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'online', CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE
            SET hostname = excluded.hostname,
                ip_address = excluded.ip_address,
                os_info = excluded.os_info,
                hardware_info = COALESCE(excluded.hardware_info, machines.hardware_info),
                status = 'online',
                last_seen = CURRENT_TIMESTAMP;
        `;
            db.run(machineQuery, [
                machine.id, machine.hostname,
                machine.ip || (metrics ? metrics.ip_address : null),
                machine.os_info, machine.os_distro, machine.os_release,
                machine.os_codename, machine.os_serial,
                machine.os_uefi ? 1 : 0, machine.uuid,
                machine.device_name, JSON.stringify(machine.users),
                validatedHardwareInfo ? JSON.stringify(validatedHardwareInfo) : (machine.hardware_info ? JSON.stringify(machine.hardware_info) : null)
            ], (err) => {
                if (err) {
                    logger.error('Error upserting machine', err, { machineId: machine.id });
                    console.error("Error upserting machine:", err);
                }
            });
        }

        // Throttled metrics insert — at most once per 10s per machine
        const lastWrite = lastMetricsDbWrite.get(machine.id) || 0;
        if (metrics && (now - lastWrite) >= METRICS_DB_THROTTLE_MS) {
            lastMetricsDbWrite.set(machine.id, now);

            const diskDetailsStr = validatedDiskDetails ? JSON.stringify(validatedDiskDetails) : (metrics.disk_details ? JSON.stringify(metrics.disk_details) : null);
            const processesStr = validatedProcesses ? JSON.stringify(validatedProcesses) : (metrics.processes ? JSON.stringify(metrics.processes) : null);
            db.run(
                `INSERT INTO metrics (machine_id, cpu_usage, ram_usage, disk_total_gb, disk_free_gb, network_up_kbps, network_down_kbps, active_vpn, disk_details, processes, timestamp)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [machine.id, metrics.cpu_usage, metrics.ram_usage, metrics.disk_total_gb, metrics.disk_free_gb,
                metrics.network_up_kbps || 0, metrics.network_down_kbps || 0, metrics.active_vpn ? 1 : 0,
                    diskDetailsStr, processesStr],
                (err) => {
                    if (err) {
                        logger.error('Error inserting metrics', err, { machineId: machine.id });
                        console.error("Error inserting metrics:", err);
                        return;
                    }

                // --- DYNAMIC ALERT EVALUATION ---
                evaluateAlerts(machine.id, {
                    cpu: metrics.cpu_usage,
                    ram: metrics.ram_usage,
                    disk: metrics.disk_total_gb > 0 ? ((metrics.disk_total_gb - metrics.disk_free_gb) / metrics.disk_total_gb) * 100 : 0,
                    network: (metrics.network_up_kbps || 0) + (metrics.network_down_kbps || 0),
                    status: 'online'
                });
            }
        );
    }

    // Events insert (always persist — events are sparse and important)
    if (events && Array.isArray(events) && events.length > 0) {
        const stmt = db.prepare(`INSERT INTO events (machine_id, event_id, source, message, severity, timestamp) VALUES (?, ?, ?, ?, ?, ?)`);
        events.forEach(event => stmt.run([machine.id, event.event_id, event.source, event.message, event.severity, event.timestamp]));
        stmt.finalize();
    }
    
    } catch (error) {
        logger.error('Error processing telemetry', error, { machineId: machine?.id, hasMetrics: !!metrics });
        // Already responded to agent, just log the error
    }
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

// Update Machine Profile (Dashboard uses JWT, not Agent API key)
app.put('/api/machines/:id/profile', authenticateDashboard, (req, res) => {
    const { id } = req.params;
    const { profile } = req.body;

    if (!profile) {
        return res.status(400).json({ error: 'Profile data is required' });
    }

    console.log(`[Profile] Updating for ${id}`);

    // Extract nickname from profile.name for backward compatibility
    const nickname = profile.name || null;
    let profileBinary = null;

    try {
        profileBinary = JSON.stringify(profile);
    } catch (e) {
        console.error('[Profile] JSON Stringify Error:', e);
        return res.status(400).json({ error: 'Invalid profile format' });
    }

    db.run('UPDATE machines SET nickname = ?, profile = ? WHERE id = ?', [nickname, profileBinary, id], function (err) {
        if (err) {
            console.error(`[Profile] DB Error for ${id}:`, err.message);
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) return res.status(404).json({ error: 'Machine not found' });

        io.emit('machine_update', { id, nickname, profile });
        res.json({ success: true });
    });
});

// Delete a Machine (cascades metrics, events, logs) — Admin only
app.delete('/api/machines/:id', authenticateDashboard, requireAdmin, (req, res) => {
    const { id } = req.params;

    // Cascade delete related data manually (SQLite FK enforcement may be off)
    const steps = [
        'DELETE FROM metrics  WHERE machine_id = ?',
        'DELETE FROM events   WHERE machine_id = ?',
        'DELETE FROM logs     WHERE machine_id = ?',
        'DELETE FROM alerts   WHERE machine_id = ?',
        'DELETE FROM commands WHERE machine_id = ?',
        'DELETE FROM machines WHERE id = ?',
    ];

    const runStep = (i) => {
        if (i >= steps.length) {
            // Notify all dashboard clients the machine is gone
            io.emit('machine_removed', { id });
            console.log(`[DELETE] Machine removed: ${id}`);
            return res.json({ success: true, id });
        }
        db.run(steps[i], [id], (err) => {
            if (err) {
                // Non-fatal: table may not exist in all deployments
                console.warn(`[DELETE] Step ${i} warning:`, err.message);
            }
            runStep(i + 1);
        });
    };

    // First check the machine actually exists
    db.get('SELECT id FROM machines WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Machine not found' });
        runStep(0);
    });
});

// Agent self-deregister on uninstall — authenticated by API key
app.post('/api/deregister', authenticateAPI, (req, res) => {
    const { machine_id } = req.body;
    if (!machine_id) return res.status(400).json({ error: 'machine_id required' });

    const steps = [
        'DELETE FROM metrics  WHERE machine_id = ?',
        'DELETE FROM events   WHERE machine_id = ?',
        'DELETE FROM logs     WHERE machine_id = ?',
        'DELETE FROM alerts   WHERE machine_id = ?',
        'DELETE FROM commands WHERE machine_id = ?',
        'DELETE FROM machines WHERE id = ?',
    ];

    const runStep = (i) => {
        if (i >= steps.length) {
            io.emit('machine_removed', { id: machine_id });
            console.log(`[DEREGISTER] Agent self-removed: ${machine_id}`);
            return res.json({ success: true });
        }
        db.run(steps[i], [machine_id], (err) => {
            if (err) {
                console.warn(`[DEREGISTER] Step ${i} warning:`, err.message);
            }
            runStep(i + 1);
        });
    };

    db.get('SELECT id FROM machines WHERE id = ?', [machine_id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Machine not found' });
        runStep(0);
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
                if (row.hardware_info) {
                    const parsed = JSON.parse(row.hardware_info);
                    // Wrap in all_details if not already — dashboard reads hardware_info.all_details.*
                    hwInfo = parsed.all_details ? parsed : { all_details: parsed };
                }
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
            if (machine.hardware_info) {
                const parsed = JSON.parse(machine.hardware_info);
                machine.hardware_info = parsed.all_details ? parsed : { all_details: parsed };
            }
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


// Get Machine History (Metrics)
app.get('/api/machines/:id/history', authenticateDashboard, (req, res) => {
    const { id } = req.params;
    const { range = '24h' } = req.query;

    let timeFilter = "datetime('now', '-24 hours')";
    let groupBy = ""; // Default: no grouping (raw data)
    let select = "*"; // Default: select all columns

    if (range === '1h') {
        timeFilter = "datetime('now', '-1 hour')";
    } else if (range === '7d') {
        timeFilter = "datetime('now', '-7 days')";
        // Group by hour to reduce data points
        groupBy = "GROUP BY strftime('%Y-%m-%d %H', timestamp)";
        select = "MAX(id) as id, machine_id, AVG(cpu_usage) as cpu_usage, AVG(ram_usage) as ram_usage, AVG(disk_total_gb) as disk_total_gb, AVG(disk_free_gb) as disk_free_gb, AVG(network_up_kbps) as network_up_kbps, AVG(network_down_kbps) as network_down_kbps, MAX(timestamp) as timestamp";
    } else if (range === '30d') {
        timeFilter = "datetime('now', '-30 days')";
        // Group by 4-hour buckets approx or just hour is fine for 30d ~ 720 points
        groupBy = "GROUP BY strftime('%Y-%m-%d %H', timestamp)";
        select = "MAX(id) as id, machine_id, AVG(cpu_usage) as cpu_usage, AVG(ram_usage) as ram_usage, AVG(disk_total_gb) as disk_total_gb, AVG(disk_free_gb) as disk_free_gb, AVG(network_up_kbps) as network_up_kbps, AVG(network_down_kbps) as network_down_kbps, MAX(timestamp) as timestamp";
    }

    const query = `
        SELECT ${select}
        FROM metrics 
        WHERE machine_id = ? AND timestamp > ${timeFilter}
        ${groupBy}
        ORDER BY timestamp ASC
    `;

    db.all(query, [id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get Global System Load History
app.get('/api/history/global', authenticateDashboard, (req, res) => {
    const { range = '24h' } = req.query;

    let timeFilter = "datetime('now', '-24 hours')";
    let groupBy = "strftime('%Y-%m-%d %H', timestamp)"; // Default group by hour

    // For global, we ALWAYS group to avoid returning millions of rows
    if (range === '1h') {
        timeFilter = "datetime('now', '-1 hour')";
        groupBy = "strftime('%Y-%m-%d %H:%M', timestamp)"; // Minute resolution for 1h
    } else if (range === '7d') {
        timeFilter = "datetime('now', '-7 days')";
        groupBy = "strftime('%Y-%m-%d %H', timestamp)";
    } else if (range === '30d') {
        timeFilter = "datetime('now', '-30 days')";
        groupBy = "strftime('%Y-%m-%d %H', timestamp)"; // Still hourly avg is fine
    }

    const query = `
        SELECT 
            ${range === '1h' ? "strftime('%Y-%m-%d %H:%M', timestamp)" : "strftime('%Y-%m-%d %H:00', timestamp)"} as time_label,
            AVG(cpu_usage) as avg_cpu,
            AVG(ram_usage) as avg_ram,
            AVG(CASE WHEN disk_total_gb > 0 THEN (1.0 - disk_free_gb / disk_total_gb) * 100 ELSE NULL END) as avg_disk,
            AVG(network_up_kbps) as avg_net_up,
            AVG(network_down_kbps) as avg_net_down,
            COUNT(DISTINCT machine_id) as machine_count,
            MAX(timestamp) as timestamp
        FROM metrics 
        WHERE timestamp > ${timeFilter}
        GROUP BY ${groupBy}
        ORDER BY timestamp ASC
    `;

    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- Maintenance Windows API ---

// List maintenance windows
app.get('/api/maintenance', authenticateDashboard, (req, res) => {
    db.all("SELECT * FROM maintenance_windows ORDER BY start_time DESC LIMIT 100", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create maintenance window
app.post('/api/maintenance', authenticateDashboard, requireAdmin, (req, res) => {
    const { title, description, start_time, end_time, notify_users, affected_machines } = req.body;
    if (!title || !start_time || !end_time) return res.status(400).json({ error: 'title, start_time, and end_time are required' });
    db.run("INSERT INTO maintenance_windows (title, description, start_time, end_time, notify_users, affected_machines, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')",
        [title, description || null, start_time, end_time, notify_users ? 1 : 0, affected_machines ? JSON.stringify(affected_machines) : null, req.admin.username],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            logAudit(req.admin.username, req.admin.id, 'maintenance_created', title, `Start: ${start_time}`, req.ip);
            // Send notification emails if requested
            if (notify_users) {
                const mailBody = `Scheduled Maintenance Window\n\nTitle: ${title}\nStart: ${start_time}\nEnd: ${end_time}\n\n${description || ''}`;
                db.all("SELECT email FROM admin_users WHERE email IS NOT NULL AND email != ''", [], (err, users) => {
                    if (!err && users) {
                        users.forEach(u => sendEmail(u.email, `Maintenance: ${title}`, mailBody, null).catch(() => {}));
                    }
                });
            }
            res.json({ success: true, id: this.lastID });
        }
    );
});

// Update maintenance window status
app.put('/api/maintenance/:id', authenticateDashboard, requireAdmin, (req, res) => {
    const { status, title, description, start_time, end_time, notify_users, affected_machines } = req.body;
    db.run("UPDATE maintenance_windows SET status = COALESCE(?, status), title = COALESCE(?, title), description = COALESCE(?, description), start_time = COALESCE(?, start_time), end_time = COALESCE(?, end_time), notify_users = COALESCE(?, notify_users), affected_machines = COALESCE(?, affected_machines) WHERE id = ?",
        [status || null, title || null, description || null, start_time || null, end_time || null, notify_users != null ? (notify_users ? 1 : 0) : null, affected_machines ? JSON.stringify(affected_machines) : null, req.params.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
            logAudit(req.admin.username, req.admin.id, 'maintenance_updated', req.params.id, `status=${status}`, req.ip);
            res.json({ success: true });
        }
    );
});

// Delete maintenance window
app.delete('/api/maintenance/:id', authenticateDashboard, requireAdmin, (req, res) => {
    db.run("DELETE FROM maintenance_windows WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ success: true });
    });
});

// Active maintenance check (public endpoint for agents/banner)
app.get('/api/maintenance/active', (req, res) => {
    const now = new Date().toISOString();
    db.get("SELECT * FROM maintenance_windows WHERE status = 'active' OR (status = 'scheduled' AND start_time <= ? AND end_time >= ?) ORDER BY start_time ASC LIMIT 1",
        [now, now], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || null);
    });
});

// Socket.io for Real-time Dashboard
io.on('connection', (socket) => {
    // console.log('Dashboard connected:', socket.id);
    // Identify if client is an agent or dashboard
    const isAgent = socket.handshake.query.role === 'agent';
    const machineId = socket.handshake.query.id;

    if (isAgent && machineId) {
        socket.join(`agent_${machineId}`);
        // console.log(`[Socket] Agent joined room: agent_${machineId}`);
    }

    // Listen for Command Results from Agent
    socket.on('command_result', (data) => {
        const { id, output, status } = data; // command id
        console.log(`[Command] Result for ${id}: ${status}`);

        db.run('UPDATE commands SET output = ?, status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
            [output, status, id],
            (err) => {
                if (err) console.error('[Command] DB Update Error:', err.message);

                // Notify Dashboard
                io.emit('command_updated', {
                    id,
                    output,
                    status,
                    completed_at: new Date()
                });
            }
        );
    });

    // Chat typing indicators
    socket.on('chat_typing', (data) => {
        if (!data || !data.thread_id || !data.username) return;
        io.emit('chat_typing', {
            thread_id: data.thread_id,
            username: data.username,
            is_typing: !!data.is_typing
        });
    });

    socket.on('disconnect', () => { });
});

// --- REMOTE COMMAND EXECUTION ---
app.post('/api/machines/:id/command', authenticateDashboard, (req, res) => {
    const { id } = req.params;
    const { command } = req.body;

    if (!command) return res.status(400).json({ error: 'Command is required' });

    const commandId = crypto.randomUUID();
    const cmd = {
        id: commandId,
        machine_id: id,
        command,
        status: 'pending',
        created_at: new Date()
    };

    const stmt = db.prepare('INSERT INTO commands (id, machine_id, command, status, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)');
    stmt.run([commandId, id, command], function (err) {
        if (err) {
            console.error('[Command] DB Error:', err.message);
            return res.status(500).json({ error: 'Failed to save command' });
        }

        // Emit to specific agent room
        io.to(`agent_${id}`).emit('exec_command', {
            id: commandId,
            command
        });

        res.json({ success: true, commandId, status: 'pending' });
    });
    stmt.finalize();
});

app.get('/api/machines/:id/commands', authenticateDashboard, (req, res) => {
    const { id } = req.params;
    db.all('SELECT * FROM commands WHERE machine_id = ? ORDER BY created_at DESC LIMIT 50', [id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- SCRIPT LIBRARY ---
// Get All Scripts
app.get('/api/scripts', authenticateDashboard, (req, res) => {
    db.all('SELECT * FROM saved_scripts ORDER BY name ASC', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Save Script
app.post('/api/scripts', authenticateDashboard, (req, res) => {
    const { name, command, platform } = req.body;
    if (!name || !command) return res.status(400).json({ error: 'Name and Command required' });

    const id = crypto.randomUUID();
    db.run('INSERT INTO saved_scripts (id, name, command, platform) VALUES (?, ?, ?, ?)',
        [id, name, command, platform || 'all'],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id, name, command, platform: platform || 'all' });
        }
    );
});

// Delete Script
app.delete('/api/scripts/:id', authenticateDashboard, (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM saved_scripts WHERE id = ?', [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, deleted: this.changes });
    });
});

// --- ALERTING SYSTEM ---
const evaluateAlerts = (machineId, metrics) => {
    db.all('SELECT * FROM alert_policies WHERE enabled = 1', (err, policies) => {
        if (err || !policies) return;

        const handlePolicyDecision = (policy, value, triggered) => {
            if (triggered) {
                db.get('SELECT id FROM alerts WHERE machine_id = ? AND policy_id = ? AND status = "active"',
                    [machineId, policy.id],
                    (err, existing) => {
                        if (!existing) {
                            const alertId = crypto.randomUUID();
                            console.log(`[Alert] Triggered: ${policy.name} on ${machineId} (Value: ${value})`);
                            db.run('INSERT INTO alerts (id, machine_id, policy_id, value, status, created_at) VALUES (?, ?, ?, ?, "active", CURRENT_TIMESTAMP)',
                                [alertId, machineId, policy.id, value]);

                            db.run('INSERT INTO events (machine_id, event_id, source, message, severity, timestamp) VALUES (?, 9999, "Alert System", ?, "Warning", CURRENT_TIMESTAMP)',
                                [machineId, `Triggered: ${policy.name} (${value} ${policy.operator} ${policy.threshold})`]);

                            db.get('SELECT hostname FROM machines WHERE id = ?', [machineId], (err, machineParams) => {
                                if (machineParams) {
                                    db.get('SELECT email FROM admin_users LIMIT 1', (err, admin) => {
                                        if (admin && admin.email) {
                                            const alertsList = [{ type: policy.name, message: `Value: ${value} (Threshold: ${policy.threshold})` }];
                                            const html = emailTemplates.alertEmail(machineParams.hostname, alertsList);
                                            sendEmail(admin.email, `[Alert] ${policy.name} on ${machineParams.hostname}`,
                                                `Machine ${machineParams.hostname} triggered ${policy.name}. Value: ${value}`, html);
                                        }
                                    });
                                }
                            });
                        }
                    });
            } else {
                db.run('UPDATE alerts SET status = "resolved", resolved_at = CURRENT_TIMESTAMP WHERE machine_id = ? AND policy_id = ? AND status = "active"',
                    [machineId, policy.id],
                    function (err) {
                        if (this.changes > 0) {
                            console.log(`[Alert] Resolved: ${policy.name} on ${machineId}`);
                            db.run('INSERT INTO events (machine_id, event_id, source, message, severity, timestamp) VALUES (?, 9998, "Alert System", ?, "Info", CURRENT_TIMESTAMP)',
                                [machineId, `Resolved: ${policy.name}`]);
                        }
                    }
                );
            }
        };

        policies.forEach(policy => {
            if (policy.metric === 'crash') {
                const crashWindow = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 minutes
                const crashQuery = `
                    SELECT id FROM logs
                    WHERE machine_id = ?
                      AND timestamp >= ?
                      AND (level IN ('error', 'critical') OR message LIKE '%crash%' OR message LIKE '%exception%')
                    LIMIT 1
                `;
                db.get(crashQuery, [machineId, crashWindow], (err, row) => {
                    const triggered = !!row;
                    handlePolicyDecision(policy, triggered ? 1 : 0, triggered);
                });
                return;
            }

            let value = null;
            if (policy.metric === 'cpu') value = metrics.cpu;
            else if (policy.metric === 'ram') value = metrics.ram;
            else if (policy.metric === 'disk') value = metrics.disk;
            else if (policy.metric === 'network') value = metrics.network;
            else if (policy.metric === 'offline') value = metrics.status === 'offline' ? 1 : 0;

            if (value !== null && value !== undefined) {
                let triggered = false;
                if (policy.operator === '>') triggered = value > policy.threshold;
                else if (policy.operator === '<') triggered = value < policy.threshold;
                else if (policy.operator === '=') triggered = value == policy.threshold;

                handlePolicyDecision(policy, value, triggered);
            }
        });
    });
};

// Delete Script
app.delete('/api/scripts/:id', authenticateDashboard, (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM saved_scripts WHERE id = ?', [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, deleted: this.changes });
    });
});

// --- ALERT POLICIES API ---
app.get('/api/alerts/policies', authenticateDashboard, (req, res) => {
    db.all('SELECT * FROM alert_policies ORDER BY created_at DESC', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/alerts/policies', authenticateDashboard, (req, res) => {
    const { name, metric, operator, threshold, duration_minutes, priority, enabled } = req.body;
    if (!name || !metric || !operator || threshold === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = crypto.randomUUID();
    db.run(
        `INSERT INTO alert_policies (id, name, metric, operator, threshold, duration_minutes, priority, enabled) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, name, metric, operator, threshold, duration_minutes || 1, priority || 'high', enabled ? 1 : 0],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id });
        }
    );
});

app.delete('/api/alerts/policies/:id', authenticateDashboard, (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM alert_policies WHERE id = ?', [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, deleted: this.changes });
    });
});

app.get('/api/alerts/active', authenticateDashboard, (req, res) => {
    db.all(`
        SELECT a.*, p.name as policy_name, p.priority, m.hostname 
        FROM alerts a
        JOIN alert_policies p ON a.policy_id = p.id
        JOIN machines m ON a.machine_id = m.id
        WHERE a.status = 'active'
        ORDER BY a.created_at DESC
    `, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
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

// Log Retention — delete audit_logs older than 45 days, mail_messages older than 60 days (runs every 24h)
setInterval(() => {
    db.run("DELETE FROM audit_logs WHERE ts < datetime('now', '-45 days')", function(err) {
        if (err) console.error('[Retention] audit_logs purge error:', err.message);
        else if (this.changes > 0) console.log(`[Retention] Purged ${this.changes} audit log(s) older than 45 days`);
    });
    db.run("DELETE FROM mail_messages WHERE created_at < datetime('now', '-60 days')", function(err) {
        if (err) console.error('[Retention] mail_messages purge error:', err.message);
        else if (this.changes > 0) console.log(`[Retention] Purged ${this.changes} mail message(s) older than 60 days`);
    });
    db.run("DELETE FROM logs WHERE timestamp < datetime('now', '-45 days')", function(err) {
        if (err) console.error('[Retention] logs purge error:', err.message);
    });
}, 24 * 60 * 60 * 1000); // 24 hours

const PORT = process.env.PORT || 7777;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Handle client-side routing for the Next.js static export.
// Try the route-specific HTML first, then fall back within the same section
// so the Next.js client-side router can restore the exact URL without the
// root LandingPage firing router.replace('/dashboard').
// MUST BE LAST
app.get('*', (req, res) => {
    const fs = require('fs');

    // 1. Try exact path with .html extension (catches files express.static missed)
    const exactHtml = path.join(dashboardPath, req.path.replace(/\/$/, '') + '.html');
    if (fs.existsSync(exactHtml)) return res.sendFile(exactHtml);

    // 2. For /dashboard/* sub-routes, serve dashboard.html so the Next.js
    //    client-side router hydrates in dashboard context and navigates to the
    //    correct sub-page, rather than triggering the root page redirect.
    if (req.path.startsWith('/dashboard/') || req.path === '/dashboard') {
        const dashHtml = path.join(dashboardPath, 'dashboard.html');
        if (fs.existsSync(dashHtml)) return res.sendFile(dashHtml);
    }

    // 3. Ultimate fallback
    res.sendFile(path.join(dashboardPath, 'index.html'));
});
