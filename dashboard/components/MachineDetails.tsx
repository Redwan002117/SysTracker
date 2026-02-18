import React from 'react';
import { Machine } from '../types';
import { X, Server, Cpu, HardDrive, CircuitBoard, Layers, Monitor, Activity, Radio, Shield, Globe } from 'lucide-react';

import ProfileCard from './ProfileCard';

interface MachineDetailsProps {
    machine: Machine | null;
    onClose: () => void;
}

const MachineDetails: React.FC<MachineDetailsProps> = ({ machine, onClose }) => {
    if (!machine) return null;

    const isOnline = machine.status === 'online';
    const { hardware_info } = machine;

    const [isEditing, setIsEditing] = React.useState(false);
    const [nickname, setNickname] = React.useState(machine.nickname || '');
    const [sortConfig, setSortConfig] = React.useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'cpu', direction: 'desc' });
    const [isVisible, setIsVisible] = React.useState(false);

    React.useEffect(() => {
        setIsVisible(true);
    }, []);

    // Force update to reflect changes from ProfileCard immediate local state if needed, 
    // though the socket event should handle it.

    // ... existing sort logic ...
    const sortedProcesses = React.useMemo(() => {
        if (!machine.metrics?.processes) return [];
        let sortableProcesses = [...machine.metrics.processes];
        if (sortConfig !== null) {
            sortableProcesses.sort((a, b) => {
                // @ts-ignore
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                // @ts-ignore
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableProcesses;
    }, [machine.metrics?.processes, sortConfig]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'desc'; // Default to descending for numbers usually
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const handleSaveNickname = async () => {
        try {
            await fetch(`/api/machines/${machine.id}/nickname`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname })
            });
            setIsEditing(false);
            // Socket will update the UI
        } catch (error) {
            console.error('Failed to update nickname:', error);
        }
    };

    const handleProfileUpdate = async (newProfile: Machine['profile']) => {
        try {
            const res = await fetch(`/api/machines/${machine.id}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': 'YOUR_STATIC_API_KEY_HERE'
                },
                body: JSON.stringify({ profile: newProfile })
            });
            if (!res.ok) throw new Error('Failed to update profile');

            // Optimistic update handled by local state in MachineDetails or reload
            // But since we pass machine down, we might need to update local machine state? 
            // Better to rely on the socket update which will refresh the machine list/details
        } catch (err) {
            console.error(err);
        }
    };

    const formatValue = (val: string | undefined) => {
        if (!val) return 'N/A';
        const lower = val.toLowerCase();
        if (lower.includes('default string') || lower === 'x.x' || lower === 'to be filled by o.e.m.') return <span className="text-slate-400 italic font-light">{val}</span>;
        return val;
    };

    const formatNetworkSpeed = (kbps: number | undefined) => {
        if (!kbps) return '0 bps';
        const bitsPerSec = kbps * 1024 * 8;
        if (bitsPerSec >= 1_000_000_000) return `${(bitsPerSec / 1_000_000_000).toFixed(1)} Gbps`;
        if (bitsPerSec >= 1_000_000) return `${(bitsPerSec / 1_000_000).toFixed(1)} Mbps`;
        if (bitsPerSec >= 1_000) return `${(bitsPerSec / 1_000).toFixed(1)} Kbps`;
        return `${bitsPerSec.toFixed(0)} bps`;
    };

    const formatLinkSpeed = (mbps: number | undefined) => {
        if (!mbps) return '';
        if (mbps >= 1000) return `${(mbps / 1000).toFixed(1)} Gbps`;
        return `${mbps} Mbps`;
    };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />

            {/* Drawer */}
            {/* Drawer Layout Container - Flex Row */}
            <div className="fixed inset-0 z-50 flex pointer-events-none">

                {/* Left Empty Space - Profile Card Centered Here */}
                <div className="hidden xl:flex flex-1 items-center justify-center pointer-events-none">
                    <div className="pointer-events-auto shadow-2xl rounded-3xl">
                        <ProfileCard machine={machine} onUpdate={handleProfileUpdate} />
                    </div>
                </div>

                {/* Drawer */}
                <div className="w-full max-w-3xl bg-white shadow-2xl pointer-events-auto h-full overflow-y-auto border-l border-slate-100 flex flex-col">
                    {/* Drawer Header */}
                    <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-100 p-6 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
                                    <Server size={24} />
                                </div>
                                <div>
                                    {isEditing ? (
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                value={nickname}
                                                onChange={(e) => setNickname(e.target.value)}
                                                className="border border-blue-200 rounded-lg px-3 py-1.5 text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="Enter nickname"
                                                autoFocus
                                            />
                                            <button onClick={handleSaveNickname} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition">Save</button>
                                            <button onClick={() => setIsEditing(false)} className="text-sm bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition">Cancel</button>
                                        </div>
                                    ) : (
                                        <h2
                                            className="text-2xl font-bold text-slate-900 flex items-center gap-2 group cursor-pointer hover:text-blue-600 transition-colors"
                                            onClick={() => { setIsEditing(true); setNickname(machine.nickname || ''); }}
                                        >
                                            {machine.nickname || machine.hostname}
                                            <span className="text-xs font-normal text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-100 px-2 py-0.5 rounded-full">Edit Name</span>
                                        </h2>
                                    )}
                                    <div className="flex items-center gap-3 mt-1.5 text-sm text-slate-500 font-medium">
                                        <span className="font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{machine.ip}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1"><Monitor size={14} className="text-slate-400" /> {machine.os}</span>
                                        <span>•</span>
                                        <span className={`flex items-center gap-1.5 ${isOnline ? 'text-emerald-600' : 'text-slate-500'}`}>
                                            <div className={`size-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                            {machine.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Metrics Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-blue-100 transition-colors">
                                <div className="text-slate-500 mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"><Cpu size={16} /> CPU</div>
                                <div className="text-3xl font-bold text-slate-800">{machine.metrics?.cpu || 0}%</div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${machine.metrics?.cpu || 0}%` }}></div>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-purple-100 transition-colors">
                                <div className="text-slate-500 mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"><Layers size={16} /> RAM</div>
                                <div className="text-3xl font-bold text-slate-800">{machine.metrics?.ram || 0}%</div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${machine.metrics?.ram || 0}%` }}></div>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-amber-100 transition-colors">
                                <div className="text-slate-500 mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"><HardDrive size={16} /> Disk</div>
                                <div className="text-3xl font-bold text-slate-800">{machine.metrics?.disk || 0}%</div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${machine.metrics?.disk || 0}%` }}></div>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-emerald-100 transition-colors">
                                <div className="text-slate-500 mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"><Activity size={16} /> Network</div>
                                <div className="mt-2 space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-1.5 text-slate-500"><Activity size={12} className="rotate-180 text-blue-500" /> Down</span>
                                        <span className="font-bold text-slate-700">{formatNetworkSpeed(machine.metrics?.network_down_kbps)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-1.5 text-slate-500"><Activity size={12} className="text-emerald-500" /> Up</span>
                                        <span className="font-bold text-slate-700">{formatNetworkSpeed(machine.metrics?.network_up_kbps)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left Column: System & Hardware */}
                            <div className="space-y-6">

                                {/* Machine Profile Card (Mobile/Tablet Only) */}
                                <div className="xl:hidden">
                                    <ProfileCard machine={machine} onUpdate={handleProfileUpdate} />
                                </div>

                                {/* System Details */}
                                <section>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Shield size={16} /> System Info
                                    </h3>
                                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                                        <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                            <div>
                                                <span className="text-xs text-slate-400 uppercase block mb-1">Hostname</span>
                                                <span className="font-medium text-slate-700 select-all">{machine.hostname}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-slate-400 uppercase block mb-1">OS Version</span>
                                                <span className="font-medium text-slate-700">{machine.os}</span>
                                            </div>
                                            <div className="col-span-2 border-t border-slate-50 pt-3">
                                                <span className="text-xs text-slate-400 uppercase block mb-1">Serial Number / UUID</span>
                                                <span className="font-mono text-sm text-slate-600 bg-slate-50 px-2 py-1 rounded select-all block break-all">
                                                    {(() => {
                                                        const sys = hardware_info?.all_details?.system;
                                                        const mb = hardware_info?.all_details?.motherboard;

                                                        // Prioritize System UUID/Serial from CSP
                                                        if (sys?.identifying_number && sys.identifying_number !== 'N/A' && sys.identifying_number !== 'To be filled by O.E.M.') return sys.identifying_number;
                                                        if (sys?.uuid && sys.uuid !== 'N/A' && sys.uuid !== 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF') return sys.uuid;

                                                        // Fallback to Motherboard Serial
                                                        const mbSerial = mb?.serial;
                                                        if (mbSerial && mbSerial !== 'N/A' && !mbSerial.toLowerCase().includes('default string')) return mbSerial;

                                                        return 'N/A';
                                                    })()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Hardware Specs */}
                                <section>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <CircuitBoard size={16} /> Hardware Specs
                                    </h3>
                                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">

                                        {/* Motherboard */}
                                        <div className="p-5">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg"><CircuitBoard size={16} /></div>
                                                <h4 className="font-semibold text-slate-800">Motherboard</h4>
                                            </div>
                                            {hardware_info?.all_details?.motherboard ? (
                                                <div className="text-sm space-y-1 ml-11">
                                                    <div className="text-slate-700 font-medium">{formatValue(hardware_info.all_details.motherboard.manufacturer)}</div>
                                                    <div className="text-slate-500">{formatValue(hardware_info.all_details.motherboard.product)}</div>
                                                    <div className="text-xs text-slate-400 font-mono mt-1">Ver: {formatValue(hardware_info.all_details.motherboard.version)}</div>
                                                </div>
                                            ) : <span className="text-slate-400 italic text-sm ml-11">Unknown</span>}
                                        </div>

                                        {/* CPU Details */}
                                        <div className="p-5">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="bg-orange-50 text-orange-600 p-1.5 rounded-lg"><Cpu size={16} /></div>
                                                <h4 className="font-semibold text-slate-800">Processor</h4>
                                            </div>
                                            {hardware_info?.all_details?.cpu?.name ? (
                                                <div className="text-sm space-y-2 ml-11">
                                                    <div className="text-slate-700 font-medium">{hardware_info.all_details.cpu.name}</div>
                                                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                                                        <div>Cores: <span className="text-slate-700">{hardware_info.all_details.cpu.cores}</span></div>
                                                        <div>Threads: <span className="text-slate-700">{hardware_info.all_details.cpu.logical}</span></div>
                                                        <div>Socket: <span className="text-slate-700">{hardware_info.all_details.cpu.socket}</span></div>
                                                        <div>Virt: <span className="text-slate-700">{hardware_info.all_details.cpu.virtualization}</span></div>
                                                        <div>L2: <span className="text-slate-700">{hardware_info.all_details.cpu.l2_cache}</span></div>
                                                        <div>L3: <span className="text-slate-700">{hardware_info.all_details.cpu.l3_cache}</span></div>
                                                    </div>
                                                </div>
                                            ) : <span className="text-slate-400 italic text-sm ml-11">Unknown CPU</span>}
                                        </div>

                                        {/* GPU Details */}
                                        {hardware_info?.all_details?.gpu && hardware_info.all_details.gpu.length > 0 && (
                                            <div className="p-5">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="bg-red-50 text-red-600 p-1.5 rounded-lg"><Monitor size={16} /></div>
                                                    <h4 className="font-semibold text-slate-800">Graphics</h4>
                                                </div>
                                                <div className="space-y-3 ml-11">
                                                    {hardware_info.all_details.gpu.map((gpu, i) => (
                                                        <div key={i} className="text-sm">
                                                            <div className="text-slate-700 font-medium">{gpu.name}</div>
                                                            <div className="grid grid-cols-2 gap-1 text-xs text-slate-500 mt-1">
                                                                <div>Mem: <span className="text-slate-700">{gpu.memory}</span></div>
                                                                <div>Driver: <span className="text-slate-700">{gpu.driver_version}</span></div>
                                                                <div className="col-span-2">Date: <span className="text-slate-700">{gpu.driver_date}</span></div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Memory Details */}
                                        <div className="p-5">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="bg-pink-50 text-pink-600 p-1.5 rounded-lg"><Layers size={16} /></div>
                                                <h4 className="font-semibold text-slate-800">Memory Modules</h4>
                                            </div>
                                            {hardware_info?.all_details?.ram?.modules && hardware_info.all_details.ram.modules.length > 0 ? (
                                                <div className="space-y-2 ml-11">
                                                    {hardware_info.all_details.ram.modules.map((stick, i) => (
                                                        <div key={i} className="flex flex-col text-sm bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                            <div className="flex justify-between">
                                                                <span className="font-medium text-slate-700">{stick.capacity} <span className="text-slate-400 font-normal">@ {stick.speed}</span></span>
                                                                <span className="text-xs text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-100">{stick.form_factor}</span>
                                                            </div>
                                                            <div className="text-xs text-slate-400 mt-1 flex justify-between">
                                                                <span>{stick.manufacturer}</span>
                                                                <span className="font-mono">{stick.part_number}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div className="text-xs text-slate-400 text-right mt-1">Slots Used: {hardware_info.all_details.ram.slots_used}</div>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 italic text-sm ml-11">Unknown RAM</span>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Right Column: Dynamic Data (Storage, Net, Process) */}
                            <div className="space-y-6">

                                {/* Network Adapters */}
                                <section>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Globe size={16} /> Interfaces
                                    </h3>
                                    <div className="space-y-3">
                                        {hardware_info?.all_details?.network && hardware_info.all_details.network.length > 0 ? (
                                            hardware_info.all_details.network.map((net, i) => (
                                                <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className={`p-1.5 rounded-lg ${net.type === 'Wi-Fi' ? 'bg-sky-50 text-sky-600' : 'bg-slate-100 text-slate-500'}`}>
                                                                {net.type === 'Wi-Fi' ? <Radio size={16} /> : <CircuitBoard size={16} />}
                                                            </div>
                                                            <span className="font-semibold text-slate-700 text-sm truncate max-w-[150px]" title={net.interface}>{net.interface}</span>
                                                        </div>
                                                        {net.speed_mbps ? <span className="text-xs font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100">{formatLinkSpeed(net.speed_mbps)}</span> : null}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg font-mono">
                                                        <div>{net.ip_address}</div>
                                                        <div className="text-right">{net.mac}</div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : <p className="text-slate-400 text-sm italic">No network interfaces.</p>}
                                    </div>
                                </section>

                                {/* Storage - Visual Bars */}
                                <section>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <HardDrive size={16} /> Storage
                                    </h3>
                                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                                        {machine.metrics?.disk_details && machine.metrics.disk_details.length > 0 ? (
                                            machine.metrics.disk_details.map((disk, i) => (
                                                <div key={i}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-slate-700">
                                                                {disk.label ? `${disk.label} (${disk.mount})` : disk.mount}
                                                            </span>
                                                            <span className="text-xs text-slate-400">({disk.type})</span>
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-600">{disk.percent}%</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm mb-1.5">
                                                        <div className="text-slate-600">
                                                            <span className="font-semibold">{disk.used_gb} GB</span> <span className="text-slate-400">/ {disk.total_gb} GB</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${disk.percent > 90 ? 'bg-red-500' : disk.percent > 75 ? 'bg-amber-500' : 'bg-teal-500'}`}
                                                            style={{ width: `${disk.percent}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-slate-400 text-sm italic">No storage usage data.</p>
                                        )}
                                    </div>
                                </section>

                                {/* Processes Table */}
                                <section>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Activity size={16} className="text-red-400" /> Hot Processes
                                    </h3>
                                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('name')}>
                                                        Name {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                                    </th>
                                                    <th className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('cpu')}>
                                                        <div className="flex flex-col items-end">
                                                            <span>CPU% {sortConfig?.key === 'cpu' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</span>
                                                            <span className="text-xs font-normal text-slate-400">Total: {machine.metrics?.cpu}%</span>
                                                        </div>
                                                    </th>
                                                    <th className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('mem')}>
                                                        <div className="flex flex-col items-end">
                                                            <span>Mem {sortConfig?.key === 'mem' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</span>
                                                            <span className="text-xs font-normal text-slate-400">Total: {machine.metrics?.ram}%</span>
                                                        </div>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {sortedProcesses.slice(0, 8).map((p, i) => (
                                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-4 py-2.5 font-medium text-slate-700 truncate max-w-[140px]" title={p.name}>{p.name}</td>
                                                        <td className={`px-4 py-2.5 text-right font-mono ${p.cpu > 10 ? 'text-orange-600 font-bold' : 'text-slate-600'}`}>{p.cpu}%</td>
                                                        <td className="px-4 py-2.5 text-right font-mono text-slate-600">
                                                            <div className="flex flex-col items-end leading-tight">
                                                                <span>{p.mem}%</span>
                                                                {p.mem_mb && <span className="text-xs text-slate-400">{p.mem_mb.toFixed(0)} MB</span>}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {sortedProcesses.length === 0 && (
                                                    <tr><td colSpan={3} className="px-4 py-4 text-center text-slate-400 italic">No active process data</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Left Column: Profile Card */}
                <div className={`
                    w-full lg:w-[24rem] lg:flex-shrink-0 transition-all duration-700 delay-100 ease-out z-20
                    ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}
                `}>
                    <div className="sticky top-6">
                        <ProfileCard
                            machine={machine}
                            onUpdate={handleProfileUpdate}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default MachineDetails;
