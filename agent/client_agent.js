const si = require('systeminformation');
const axios = require('axios');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// Configuration: Prefer Command Line Args > CONFIG file > Env Var > Default
const args = process.argv.slice(2);
const configPath = path.resolve(__dirname, 'agent_config.json');
let config = {};

if (fs.existsSync(configPath)) {
    try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) { console.error("Config parse error", e); }
}

const SERVER_URL = args[0] || config.SERVER_URL || process.env.SERVER_URL || 'http://localhost:3001';
const API_URL = `${SERVER_URL}/api`;

const MACHINE_ID = os.hostname();
const TELEMETRY_INTERVAL = 2000; // 2 seconds for "live" feel

// Global state to track previous network stats for speed calculation
let prevNetStats = {};
let lastNetCheck = Date.now();

async function getSystemMetrics() {
    try {
        const cpu = await si.currentLoad();
        const mem = await si.mem();
        const fsSize = await si.fsSize();
        const netStats = await si.networkStats();

        // Find main drive (C: or /)
        const mainDrive = fsSize.find(d => d.mount === 'C:' || d.mount === '/') || fsSize[0];
        // console.log('Disks found:', fsSize.map(d => `${d.mount} (${d.type})`).join(', '));
        // console.log('Selected Main Drive:', mainDrive ? mainDrive.mount : 'None');

        // Calculate Network Speed Manually if library fails
        const now = Date.now();
        const timeDiff = (now - lastNetCheck) / 1000; // seconds
        lastNetCheck = now;

        netStats.forEach(iface => {
            if (prevNetStats[iface.iface]) {
                const prev = prevNetStats[iface.iface];
                const rxDiff = iface.rx_bytes - prev.rx_bytes;
                const txDiff = iface.tx_bytes - prev.tx_bytes;

                // DEBUG: Only log if there's activity or if it's the main interface
                if (iface.iface !== 'lo' && (rxDiff > 0 || txDiff > 0)) {
                    console.log(`Net: ${iface.iface} | RX Diff: ${rxDiff} | Time: ${timeDiff.toFixed(3)}s | Calc Speed: ${(rxDiff / timeDiff / 1024).toFixed(2)} KB/s`);
                }

                // If library returns null for rates, calculate them
                // Also force calculation if 0, as si might be returning cached 0s
                if (!iface.rx_sec || iface.rx_sec === 0) {
                    iface.rx_sec = timeDiff > 0 ? rxDiff / timeDiff : 0;
                    iface.tx_sec = timeDiff > 0 ? txDiff / timeDiff : 0;
                }
            }
            // Update previous state
            prevNetStats[iface.iface] = { rx_bytes: iface.rx_bytes, tx_bytes: iface.tx_bytes };
        });

        // Find default interface (usually the one with traffic)
        // Prefer Ethernet or Wi-Fi over "Lo" or "Teredo"
        // Also use the one with the highest rx_bytes if multiple are up
        let defaultNet = netStats.find(n => n.iface !== 'lo' && !n.internal && n.operstate === 'up') || netStats[0];

        // Backup: find the interface with the most traffic
        if (!defaultNet || (defaultNet.rx_bytes === 0 && defaultNet.tx_bytes === 0)) {
            const activeIfaces = netStats.filter(n => !n.internal && n.operstate === 'up');
            if (activeIfaces.length > 0) {
                defaultNet = activeIfaces.reduce((prev, current) => (prev.rx_bytes > current.rx_bytes) ? prev : current);
            }
        }

        // VPN Detection (Simple check for common VPN interface names)
        const interfaces = await si.networkInterfaces();
        const activeVPN = interfaces.some(iface =>
            (iface.iface.toLowerCase().includes('tun') ||
                iface.iface.toLowerCase().includes('tap') ||
                iface.iface.toLowerCase().includes('vpn')) &&
            iface.operstate === 'up'
        );

        // Processes
        const processes = await si.processes();
        const topProcesses = processes.list
            .sort((a, b) => b.cpu - a.cpu)
            .slice(0, 5)
            .map(p => ({
                name: p.name,
                cpu: p.cpu.toFixed(1),
                mem: p.mem.toFixed(1),
                pid: p.pid
            }));

        return {
            cpu_usage: Math.round(cpu.currentLoad),
            // Use (total - available) for a better match with Task Manager
            ram_usage: Math.round(((mem.total - mem.available) / mem.total) * 100),
            disk_total_gb: mainDrive ? Math.round(mainDrive.size / (1024 ** 3)) : 0,
            disk_free_gb: mainDrive ? Math.round((mainDrive.size - mainDrive.used) / (1024 ** 3)) : 0,
            disk_details: fsSize.map(d => ({
                mount: d.mount,
                type: d.type,
                total_gb: Math.round(d.size / (1024 ** 3)),
                used_gb: Math.round(d.used / (1024 ** 3)),
                percent: Math.round(d.use)
            })),
            network_up_kbps: defaultNet ? parseFloat((defaultNet.tx_sec / 1024).toFixed(2)) : 0,
            network_down_kbps: defaultNet ? parseFloat((defaultNet.rx_sec / 1024).toFixed(2)) : 0,
            active_vpn: activeVPN,
            processes: topProcesses,
            ip_address: getIpAddress()
        };
    } catch (e) {
        console.error('Error collecting metrics:', e.message);
        return null;
    }
}

function getIpAddress() {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return '127.0.0.1';
}

async function getDetailedHardwareInfo() {
    try {
        const baseboard = await si.baseboard();
        const memLayout = await si.memLayout();
        const diskLayout = await si.diskLayout();
        const graphics = await si.graphics();
        const netInterfaces = await si.networkInterfaces();

        return {
            motherboard: {
                manufacturer: baseboard.manufacturer,
                product: baseboard.model,
                serial: baseboard.serial,
                version: baseboard.version
            },
            ram: memLayout.map(m => ({
                capacity_gb: Math.round(m.size / (1024 ** 3)),
                speed: m.clockSpeed,
                manufacturer: m.manufacturer,
                part_number: m.partNum
            })),
            disks: diskLayout.map(d => ({
                model: d.name,
                serial: d.serialNum,
                size_gb: Math.round(d.size / (1024 ** 3)),
                interface: d.interfaceType,
                media_type: d.type
            })),
            gpu: graphics.controllers.map(g => ({
                name: g.model,
                driver_version: g.driverVersion || 'N/A'
            })),
            network: netInterfaces.filter(n => !n.internal).map(n => ({
                interface: n.ifaceName || n.iface,
                ip_address: n.ip4,
                mac: n.mac,
                type: n.type,
                speed_mbps: n.speed
            }))
        };
    } catch (e) {
        await logToServer('error', 'Error collecting hardware info', e);
        return null;
    }
}

async function getWindowsEvents() {
    if (process.platform !== 'win32') return [];

    return new Promise((resolve) => {
        // Get last 5 Errors from System log
        const command = `powershell -Command "Get-EventLog -LogName System -EntryType Error,Warning -Newest 5 | Select-Object Index,EntryType,Source,Message,TimeGenerated | ConvertTo-Json"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('Event Log Error:', error.message);
                resolve([]);
                return;
            }
            try {
                const events = JSON.parse(stdout);
                // Powershell returns single object if only 1 result, array otherwise
                const eventArray = Array.isArray(events) ? events : [events];

                resolve(eventArray.map(e => ({
                    event_id: e.Index,
                    severity: e.EntryType === 1 ? 'Error' : (e.EntryType === 2 ? 'Warning' : 'Info'), // 1=Error, 2=Warning in .NET enum usually, checking string is safer
                    type: typeof e.EntryType === 'string' ? e.EntryType : (e.EntryType === 1 ? 'Error' : 'Warning'),
                    source: e.Source,
                    message: e.Message,
                    timestamp: new Date(parseInt(e.TimeGenerated.replace(/\/Date\((.*?)\)\//, '$1'))).toISOString()
                })));
            } catch (e) {
                // stdout might be empty or invalid json
                resolve([]);
            }
        });
    });
}

async function logToServer(level, message, error = null) {
    const stack = error?.stack || error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
    if (level === 'error') console.error(message, error);
    else console.log(`[${level.toUpperCase()}] ${message}`);

    try {
        await axios.post(`${SERVER_URL}/api/logs`, {
            machine_id: MACHINE_ID,
            level: level,
            message: message,
            stack_trace: error ? stack : null
        });
    } catch (e) {
        console.error('Failed to report log to server:', e.message);
    }
}

async function main() {
    console.log(`Starting SysTracker Node.js Agent on ${MACHINE_ID}`);
    await logToServer('info', `Agent started on ${MACHINE_ID}`);

    const osInfo = await si.osInfo();
    const uuid = await si.uuid();
    const chassis = await si.chassis();
    const users = await si.users();

    const sysInfo = {
        id: MACHINE_ID,
        hostname: os.hostname(),
        os_info: `${os.type()} ${os.release()} ${os.arch()}`,
        os_distro: osInfo.distro,
        os_release: osInfo.release,
        os_codename: osInfo.codename,
        os_serial: osInfo.serial,
        os_uefi: osInfo.uefi,
        uuid: uuid.os, // or uuid.hardware
        device_name: chassis.type, // Desktop, Laptop, etc
        users: users
    };

    // Collect Hardware Info once
    const hwInfo = await getDetailedHardwareInfo();
    if (hwInfo) {
        sysInfo.hardware_info = hwInfo;
    }

    // Main Loop
    setInterval(async () => {
        const metrics = await getSystemMetrics();
        const events = await getWindowsEvents();

        if (metrics) {
            const payload = {
                machine: sysInfo,
                metrics: metrics,
                events: events
            };

            console.log('Sending Metrics:', JSON.stringify(metrics)); // DEBUG LOG

            try {
                // await axios.post(`${API_URL}/telemetry`, payload, { headers: { 'X-API-Key': API_KEY } });
                await axios.post(`${API_URL}/telemetry`, payload);
                console.log('Telemetry sent');
            } catch (e) {
                await logToServer('error', 'Agent loop error', e);
            }
        }
    }, TELEMETRY_INTERVAL);
}

main();
