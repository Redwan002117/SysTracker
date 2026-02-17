const si = require('systeminformation');

async function test() {
    console.log('--- Testing systeminformation ---');

    try {
        console.log('1. CPU Load:');
        const cpu = await si.currentLoad();
        console.log(JSON.stringify(cpu, null, 2));
    } catch (e) { console.error('CPU Error:', e.message); }

    try {
        console.log('\n2. Memory:');
        const mem = await si.mem();
        console.log(JSON.stringify(mem, null, 2));
    } catch (e) { console.error('Mem Error:', e.message); }

    try {
        console.log('\n3. Network Stats (First run):');
        let net = await si.networkStats();
        console.log(JSON.stringify(net, null, 2));

        console.log('Waiting 2 seconds for calculating speed...');
        await new Promise(r => setTimeout(r, 2000));

        console.log('\n3. Network Stats (Second run):');
        net = await si.networkStats();
        console.log(JSON.stringify(net, null, 2));
    } catch (e) { console.error('Net Error:', e.message); }

    try {
        console.log('\n4. Network Interfaces:');
        const ifaces = await si.networkInterfaces();
        // Filter for relevant ones to avoid spam
        const main = ifaces.map(i => ({ iface: i.iface, name: i.ifaceName, ip4: i.ip4, type: i.type }));
        console.log(JSON.stringify(main, null, 2));
    } catch (e) { console.error('Interface Error:', e.message); }
}

test();
