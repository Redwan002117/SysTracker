const io = require('socket.io-client');
const si = require('systeminformation');
const os = require('os');

// Configuration
const SERVER_URL = 'http://localhost:3001';
const RECONNECT_DELAY = 5000;
const VERSION = '2.0.1';

let socket;
let machineId = os.hostname(); // Simple ID for now

function connect() {
    socket = io(SERVER_URL, {
        reconnectionDelay: RECONNECT_DELAY,
    });

    socket.on('connect', async () => {
        console.log('Connected to server');
        await register();
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });

    socket.on('connect_error', (err) => {
        console.log(`Connection error: ${err.message}`);
    });
}

async function register() {
    try {
        const osInfo = await si.osInfo();
        const network = await si.networkInterfaces();
        // find first non-internal ipv4
        let ip = '127.0.0.1';
        const defaultNet = network.find(n => !n.internal && n.ip4);
        if (defaultNet) ip = defaultNet.ip4;

        const info = {
            id: machineId,
            hostname: os.hostname(),
            ip: ip,
            os: `${osInfo.distro} ${osInfo.release}`
        };

        console.log('Registering with info:', info);
        socket.emit('register', info);

        startMetricsCollection();
    } catch (e) {
        console.error('Error getting system info:', e);
    }
}

let metricsInterval;

function startMetricsCollection() {
    if (metricsInterval) clearInterval(metricsInterval);

    metricsInterval = setInterval(async () => {
        if (!socket.connected) return;

        try {
            const load = await si.currentLoad();
            const mem = await si.mem();
            const fs = await si.fsSize();

            // Calculate total disk usage (average of all drives or main drive)
            // For simplicity, let's take the first drive or the one mounted on / or C:
            let diskUsage = 0;
            const mainDrive = fs.find(d => d.mount === '/' || d.mount === 'C:') || fs[0];
            if (mainDrive) {
                diskUsage = mainDrive.use;
            }

            const metrics = {
                id: machineId,
                cpu: Math.round(load.currentLoad),
                ram: Math.round((mem.active / mem.total) * 100),
                disk: Math.round(diskUsage)
            };

            //console.log('Sending metrics:', metrics);
            socket.emit('metrics', metrics);
        } catch (e) {
            console.error('Error collecting metrics:', e);
        }
    }, 5000);
}

connect();
