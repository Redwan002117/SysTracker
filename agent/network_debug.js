const si = require('systeminformation');
const fs = require('fs');

async function test() {
    const output = [];
    output.push('--- Network Debug ---');

    try {
        const ifaces = await si.networkInterfaces();
        output.push('Interfaces:');
        ifaces.forEach(i => output.push(`${i.iface} (${i.ifaceName}): type=${i.type}, ip4=${i.ip4}, operstate=${i.operstate}`));

        output.push('\nStats Run 1:');
        let stats = await si.networkStats();
        stats.forEach(s => output.push(`${s.iface}: rx_sec=${s.rx_sec}, tx_sec=${s.tx_sec}, rx_bytes=${s.rx_bytes}, tx_bytes=${s.tx_bytes}`));

        output.push('\nWaiting 3 seconds...');
        await new Promise(r => setTimeout(r, 3000));

        output.push('\nStats Run 2:');
        stats = await si.networkStats();
        stats.forEach(s => output.push(`${s.iface}: rx_sec=${s.rx_sec}, tx_sec=${s.tx_sec}, rx_bytes=${s.rx_bytes}, tx_bytes=${s.tx_bytes}`));

    } catch (e) {
        output.push(`Error: ${e.message}`);
    }

    fs.writeFileSync('net_debug.txt', output.join('\n'));
    console.log('Debug written to net_debug.txt');
}

test();
