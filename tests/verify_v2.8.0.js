const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
// Removed sqlite3 require

// Config
const SERVER_DIR = path.resolve(__dirname, '../server');
const AGENT_DIR = path.resolve(__dirname, '../agent');
const DB_PATH = path.join(SERVER_DIR, 'sys_tracker.db');
const API_URL = 'http://localhost:3000/api';
const ADMIN_USER = 'rickyadams2117';
const ADMIN_PASS = 'ChangeMe123!';

let serverProcess;
let agentProcess;
let authToken;
let machineId;

const log = (msg) => console.log(`[TEST] ${msg}`);
const error = (msg) => console.error(`[ERROR] ${msg}`);

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 1. Start Server
async function startServer() {
    log('Starting Server...');
    return new Promise((resolve, reject) => {
        const env = { ...process.env, PORT: 3000, JWT_SECRET: 'testsecret', API_KEY: 'testkey' };
        serverProcess = spawn('node', ['server.js'], { cwd: SERVER_DIR, env, stdio: 'pipe' });

        serverProcess.stdout.on('data', (data) => {
            const out = data.toString();
            console.log(`[SERVER] ${out}`);
            if (out.includes('Server running')) {
                log('Server started.');
                resolve();
            }
        });

        serverProcess.stderr.on('data', (data) => console.error(`[SERVER ERR] ${data}`));
    });
}

// 2. Login to get Token
async function login() {
    log('Logging in...');
    // Only works if admin user exists. If not, we might need to seed it. 
    // Assuming standard dev environment has the reset-admin.js run or similar.
    // For this test, let's try to reset admin first just in case.

    return fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS })
    }).then(async res => {
        if (!res.ok) throw new Error(`Login failed: ${res.status}`);
        const data = await res.json();
        authToken = data.token;
        log('Logged in successfully.');
    });
}

// 3. Start Agent
async function startAgent() {
    log('Starting Agent...');
    // Configure agent to point to local server
    // We'll pass args to client_agent.py (if it supports them) or rely on it finding the server.
    // The python agent uses config.json. We should write a temp config.
    const configPath = path.join(AGENT_DIR, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({ api_url: 'http://localhost:3000/api', api_key: 'testkey' }));

    const env = { ...process.env, SYSTRACKER_TEST_MODE: '1' };
    agentProcess = spawn('python', ['client_agent.py'], { cwd: AGENT_DIR, env, stdio: 'pipe' });

    let started = false;
    return new Promise((resolve) => {
        agentProcess.stderr.on('data', (data) => {
            const out = data.toString();
            console.log(`[AGENT] ${out}`);
            if (!started && (out.includes('Starting SysTracker Agent') || out.includes('Connection test status: 200'))) {
                started = true;
                log('Agent started and connecting.');
                resolve();
            }
        });
        // Fallback timeout
        setTimeout(() => { if (!started) resolve(); }, 5000);
    });
}

// 4. Verify History API
async function verifyHistory() {
    log('Verifying History API...');
    // Need machine ID.
    await wait(8000); // Wait for agent to report in

    // Get machines
    const res = await fetch(`${API_URL}/machines`, { headers: { 'Authorization': `Bearer ${authToken}` } });
    const machines = await res.json();
    if (!machines.length) throw new Error('No machines found. Agent failed to register?');

    machineId = machines[0].id; // Use first machine
    log(`Testing with Machine ID: ${machineId}`);

    // Call History Endpoint
    const historyRes = await fetch(`${API_URL}/machines/${machineId}/history?range=1h`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (!historyRes.ok) throw new Error(`History API failed: ${historyRes.status}`);
    const historyData = await historyRes.json();

    if (!Array.isArray(historyData)) throw new Error('History data is not an array');
    log(`History API returned ${historyData.length} records. (OK)`);

    // Call Global History Endpoint
    const globalRes = await fetch(`${API_URL}/history/global?range=1h`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!globalRes.ok) throw new Error(`Global History API failed: ${globalRes.status}`);
    const globalData = await globalRes.json();
    if (!Array.isArray(globalData)) throw new Error('Global history data is not an array');
    log(`Global History API returned ${globalData.length} records. (OK)`);
}

// 5. Verify Remote Command
async function verifyRemoteCommand() {
    log('Verifying Remote Command...');

    // Send Command
    const cmdRes = await fetch(`${API_URL}/machines/${machineId}/command`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ machine_id: machineId, command: 'echo "Hello SysTracker"' })
    });

    if (!cmdRes.ok) throw new Error(`Failed to send command: ${cmdRes.status}`);
    const cmdData = await cmdRes.json();
    const cmdId = cmdData.commandId;
    log(`Command sent. ID: ${cmdId}`);

    // Wait for execution (Agent polls every few seconds or socket push)
    // We'll poll the command status
    for (let i = 0; i < 10; i++) {
        await wait(2000);
        const pollRes = await fetch(`${API_URL}/machines/${machineId}/commands`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const history = await pollRes.json();
        const cmd = history.find(c => c.id === cmdId);

        if (cmd && cmd.status === 'completed') {
            log(`Command completed. Output: ${cmd.output?.trim()}`);
            if (cmd.output.includes('Hello SysTracker')) {
                log('Remote Command Verification PASSED.');
                return;
            }
        }
    }
    throw new Error('Command verification timed out or failed.');
}

// Main Runner
(async () => {
    try {
        await startServer();
        // Ensure admin login (might need to seed DB if verify fails, but assuming persistence)
        await login().catch(async () => {
            log('Login failed. Attempting to seed admin...');
            // Exec reset-admin.js
            require('child_process').execSync('node reset-admin.js', { cwd: SERVER_DIR });
            await login();
        });

        await startAgent();
        await verifyHistory();
        await verifyRemoteCommand();

        log('ALL TESTS PASSED.');
    } catch (e) {
        error(e.message);
        process.exit(1);
    } finally {
        if (serverProcess) serverProcess.kill();
        if (agentProcess) agentProcess.kill();
        process.exit(0);
    }
})();
