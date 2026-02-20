// Process Data Validation & Normalization - SysTracker v3.0.0

/**
 * Validate and normalize process data from agent
 * Ensures CPU%, memory%, and process names are correctly formatted
 */
function validateProcessData(processes) {
    if (!Array.isArray(processes)) {
        return [];
    }

    return processes.map(p => ({
        name: String(p.name || 'Unknown').substring(0, 255),  // Limit name length
        cpu: Math.max(0, Math.min(100, parseFloat(p.cpu) || 0)),  // Clamp 0-100%
        mem: Math.max(0, Math.min(100, parseFloat(p.mem) || 0)),  // Clamp 0-100%
        mem_mb: Math.max(0, parseFloat(p.mem_mb) || 0),  // Ensure positive
        pid: parseInt(p.pid) || 0
    })).sort((a, b) => {
        // Sort by CPU descending by default
        if (b.cpu !== a.cpu) return b.cpu - a.cpu;
        return b.mem - a.mem;
    }).slice(0, 50);  // Limit to top 50 processes
}

/**
 * Validate hardware information structure
 */
function validateHardwareInfo(hwInfo) {
    if (!hwInfo) return null;

    const validated = {
        all_details: {}
    };

    if (hwInfo.all_details) {
        // Validate CPU
        if (hwInfo.all_details.cpu) {
            validated.all_details.cpu = {
                name: String(hwInfo.all_details.cpu.name || 'Unknown CPU').substring(0, 255),
                cores: Math.max(1, parseInt(hwInfo.all_details.cpu.cores) || 1),
                logical: Math.max(1, parseInt(hwInfo.all_details.cpu.logical) || 1),
                socket: String(hwInfo.all_details.cpu.socket || 'Unknown').substring(0, 100),
                virtualization: String(hwInfo.all_details.cpu. || hwInfo.all_details.cpu.virtualization || 'Unknown').substring(0, 100)
            };
        }

        // Validate Motherboard
        if (hwInfo.all_details.motherboard) {
            validated.all_details.motherboard = {
                manufacturer: String(hwInfo.all_details.motherboard.manufacturer || 'Unknown').substring(0, 255),
                product: String(hwInfo.all_details.motherboard.product || 'Unknown').substring(0, 255),
                version: String(hwInfo.all_details.motherboard.version || 'N/A').substring(0, 100),
                serial: String(hwInfo.all_details.motherboard.serial || 'N/A').substring(0, 255)
            };
        }

        // Validate RAM modules
        if (Array.isArray(hwInfo.all_details.ram?.modules)) {
            validated.all_details.ram = {
                modules: hwInfo.all_details.ram.modules.map(m => ({
                    capacity: String(m.capacity || 'Unknown').substring(0, 100),
                    speed: String(m.speed || 'Unknown').substring(0, 100),
                    manufacturer: String(m.manufacturer || 'Unknown').substring(0, 255),
                    form_factor: String(m.form_factor || 'DIMM').substring(0, 100),
                    part_number: String(m.part_number || 'N/A').substring(0, 100)
                })).slice(0, 8),  // Limit to 8 modules
                slots_used: Math.max(0, parseInt(hwInfo.all_details.ram.slots_used) || 0)
            };
        }

        // Validate Drives
        if (Array.isArray(hwInfo.all_details.drives)) {
            validated.all_details.drives = hwInfo.all_details.drives.map(d => ({
                model: String(d.model || 'Unknown').substring(0, 255),
                size: String(d.size || 'Unknown').substring(0, 100),
                serial: String(d.serial || 'N/A').substring(0, 255),
                manufacturer: String(d.manufacturer || 'Unknown').substring(0, 255),
                type: String(d.type || 'HDD').substring(0, 50)
            })).slice(0, 16);  // Limit to 16 drives
        }

        // Validate Network interfaces
        if (Array.isArray(hwInfo.all_details.network)) {
            validated.all_details.network = hwInfo.all_details.network.map(n => ({
                interface: String(n.interface || 'Unknown').substring(0, 100),
                type: String(n.type || 'Ethernet').substring(0, 50),
                ip_address: String(n.ip_address || 'N/A').substring(0, 50),
                mac: String(n.mac || 'N/A').substring(0, 20),
                speed_mbps: Math.max(0, parseInt(n.speed_mbps) || 0)
            })).slice(0, 16);  // Limit to 16 interfaces
        }

        // Validate GPU
        if (Array.isArray(hwInfo.all_details.gpu)) {
            validated.all_details.gpu = hwInfo.all_details.gpu.map(g => ({
                name: String(g.name || 'Unknown GPU').substring(0, 255),
                memory: String(g.memory || 'Unknown').substring(0, 100),
                driver_version: String(g.driver_version || 'N/A').substring(0, 100)
            })).slice(0, 4);  // Limit to 4 GPUs
        }

        // Validate System info
        if (hwInfo.all_details.system) {
            validated.all_details.system = {
                identifying_number: String(hwInfo.all_details.system.identifying_number || 'N/A').substring(0, 255),
                uuid: String(hwInfo.all_details.system.uuid || 'N/A').substring(0, 255)
            };
        }
    }

    return validated;
}

/**
 * Validate disk usage details
 */
function validateDiskDetails(diskDetails) {
    if (!Array.isArray(diskDetails)) {
        return [];
    }

    return diskDetails.map(disk => ({
        mount: String(disk.mount || '/').substring(0, 255),
        label: String(disk.label || '').substring(0, 255),
        type: String(disk.type || 'Unknown').substring(0, 50),
        total_gb: Math.max(0, parseFloat(disk.total_gb) || 0),
        used_gb: Math.max(0, parseFloat(disk.used_gb) || 0),
        free_gb: Math.max(0, parseFloat(disk.free_gb) || 0),
        percent: Math.max(0, Math.min(100, parseFloat(disk.percent) || 0))
    })).slice(0, 26);  // Limit to 26 partitions (A-Z on Windows)
}

module.exports = {
    validateProcessData,
    validateHardwareInfo,
    validateDiskDetails
};
