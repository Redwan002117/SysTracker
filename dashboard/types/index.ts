export interface Machine {
    id: string;
    hostname: string;
    nickname?: string | null;
    ip: string;
    os: string;
    os_details?: {
        distro: string;
        release: string;
        codename: string;
        serial: string;
        uefi: boolean;
        uuid: string;
    };
    device_name?: string;
    users?: Array<{ user: string; tty: string; date: string; time: string; }>;
    status: 'online' | 'offline' | 'warning' | 'error';
    last_seen: string;
    metrics?: Metrics;
    hardware_info?: HardwareInfo;
    profile?: {
        name: string;
        role: string;
        avatar?: string;
        tags?: string[];
        stats?: Array<{ label: string; value: string }>;
        floor_name?: string;
        desk_name?: string;
        pc_number?: string;
    };
}

export interface DiskDetail {
    mount: string;
    device?: string;
    label?: string;
    type: string;
    total_gb: number;
    used_gb: number;
    percent: number;
}

export interface Metrics {
    cpu: number;
    ram: number;
    disk: number;
    disk_details?: DiskDetail[];
    processes?: Array<{ name: string; cpu: number; mem: number; mem_mb?: number; pid: number }>;
    network_up_kbps: number;
    network_down_kbps: number;
    active_vpn: boolean;
}

export interface HardwareInfo {
    motherboard?: {
        manufacturer: string;
        product: string;
        serial: string;
        version: string;
    };
    ram?: Array<{
        capacity_gb: number;
        speed: number;
        manufacturer: string;
        part_number: string;
    }>;
    gpu?: Array<{
        name: string;
        driver_version: string;
    }>;
    disks?: Array<{
        model: string;
        serial: string;
        size_gb: number;
        interface: string;
        media_type: string;
    }>;
    network?: Array<{
        interface: string;
        ip_address: string;
        mac: string;
        type: string;
        speed_mbps: number | null;
    }>;
    system?: {
        uuid: string;
        identifying_number: string;
    };
    all_details?: {
        cpu: {
            name: string;
            cores: number;
            logical: number;
            socket: string;
            l2_cache: string;
            l3_cache: string;
            virtualization: string;
        };
        ram: {
            modules: Array<{
                capacity: string;
                speed: string;
                manufacturer: string;
                part_number: string;
                form_factor: string;
            }>;
            slots_used: number;
        };
        gpu: Array<{
            name: string;
            driver_version: string;
            driver_date: string;
            memory: string;
        }>;
        motherboard?: {
            manufacturer: string;
            product: string;
            serial: string;
            version: string;
        };
        system?: {
            uuid: string;
            identifying_number: string;
        };
        network?: Array<{
            interface: string;
            ip_address: string;
            mac: string;
            type: string;
            speed_mbps: number | null;
        }>;
    };
}
