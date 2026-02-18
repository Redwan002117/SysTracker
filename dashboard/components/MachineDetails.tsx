import React from 'react';
import { Machine } from '../types';
import { X, Server, Cpu, HardDrive, CircuitBoard, Layers, Monitor, Activity } from 'lucide-react';

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

    return (
        <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white/80 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-white/20 z-50 overflow-y-auto">
            <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <Server className="text-blue-600" />
                            {isEditing ? (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={nickname}
                                        onChange={(e) => setNickname(e.target.value)}
                                        className="border rounded px-2 py-1 text-sm"
                                        placeholder="Enter nickname"
                                    />
                                    <button onClick={handleSaveNickname} className="text-xs bg-blue-500 text-white px-2 py-1 rounded">Save</button>
                                    <button onClick={() => setIsEditing(false)} className="text-xs bg-gray-200 px-2 py-1 rounded">Cancel</button>
                                </div>
                            ) : (
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 group cursor-pointer" onClick={() => { setIsEditing(true); setNickname(machine.nickname || ''); }}>
                                    {machine.nickname || machine.hostname}
                                    <span className="text-xs font-normal text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">(Edit)</span>
                                </h2>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-gray-500">{machine.nickname ? `${machine.hostname} • ` : ''}{machine.ip} • os: {machine.os}</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {machine.status.toUpperCase()}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Metrics Summary */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <div className="text-blue-600 mb-1"><Cpu size={20} /></div>
                        <div className="text-2xl font-bold text-gray-800">{machine.metrics?.cpu || 0}%</div>
                        <div className="text-xs text-gray-500">CPU Usage</div>
                    </div>
                    <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                        <div className="text-purple-600 mb-1"><Layers size={20} /></div>
                        <div className="text-2xl font-bold text-gray-800">{machine.metrics?.ram || 0}%</div>
                        <div className="text-xs text-gray-500">RAM Usage</div>
                    </div>
                    <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                        <div className="text-amber-600 mb-1"><HardDrive size={20} /></div>
                        <div className="text-2xl font-bold text-gray-800">{machine.metrics?.disk || 0}%</div>
                        <div className="text-xs text-gray-500">Disk Usage</div>
                    </div>
                </div>

                {/* Hardware Details */}
                <div className="space-y-6">

                    {/* Motherboard */}
                    <div className="bg-white/50 rounded-xl p-5 border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <CircuitBoard className="text-indigo-500" size={20} /> Motherboard
                        </h3>
                        {hardware_info?.motherboard ? (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="text-gray-500 block">Manufacturer</span> {hardware_info.motherboard.manufacturer}</div>
                                <div><span className="text-gray-500 block">Product</span> {hardware_info.motherboard.product}</div>
                                <div><span className="text-gray-500 block">Version</span> {hardware_info.motherboard.version}</div>
                                <div><span className="text-gray-500 block">Serial</span> {hardware_info.motherboard.serial}</div>
                            </div>
                        ) : <p className="text-gray-400 text-sm">No motherboard info available.</p>}
                    </div>

                    {/* RAM Sticks */}
                    <div className="bg-white/50 rounded-xl p-5 border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <Layers className="text-pink-500" size={20} /> RAM Modules
                        </h3>
                        {hardware_info?.ram && hardware_info.ram.length > 0 ? (
                            <div className="space-y-3">
                                {hardware_info.ram.map((stick, i) => (
                                    <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg text-sm border border-gray-100">
                                        <div>
                                            <div className="font-medium text-gray-700">{stick.manufacturer}</div>
                                            <div className="text-xs text-gray-500">{stick.part_number}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-gray-800">{stick.capacity_gb} GB</div>
                                            <div className="text-xs text-gray-500">{stick.speed} MHz</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-gray-400 text-sm">No RAM info available.</p>}
                    </div>

                    {/* Disks (Real-time Usage) */}
                    <div className="bg-white/50 rounded-xl p-5 border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <HardDrive className="text-teal-500" size={20} /> Storage Drives
                        </h3>
                        {machine.metrics?.disk_details && machine.metrics.disk_details.length > 0 ? (
                            <div className="space-y-3">
                                {machine.metrics.disk_details.map((disk, i) => (
                                    <div key={i} className="bg-gray-50 p-3 rounded-lg text-sm border border-gray-100">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-medium text-gray-700">{disk.mount} <span className="text-xs text-gray-400">({disk.type})</span></span>
                                            <span className="font-bold text-gray-800">{disk.percent}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                            <div className="bg-teal-500 h-2 rounded-full transition-all duration-500" style={{ width: `${disk.percent}%` }}></div>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>Used: {disk.used_gb} GB</span>
                                            <span>Total: {disk.total_gb} GB</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // Fallback to static info if no real-time details
                            <div>
                                {hardware_info?.disks && hardware_info.disks.length > 0 ? (
                                    <div className="space-y-3">
                                        {hardware_info.disks.map((disk, i) => (
                                            <div key={i} className="bg-gray-50 p-3 rounded-lg text-sm border border-gray-100">
                                                <div className="flex justify-between mb-1">
                                                    <span className="font-medium text-gray-700">{disk.model}</span>
                                                    <span className="font-bold text-gray-800">{disk.size_gb} GB</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-gray-400 text-sm">No disk info available.</p>}
                            </div>
                        )}
                    </div>

                    {/* GPU */}
                    <div className="bg-white/50 rounded-xl p-5 border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <Monitor className="text-orange-500" size={20} /> Graphics
                        </h3>
                        {hardware_info?.gpu && hardware_info.gpu.length > 0 ? (
                            <div className="space-y-3">
                                {hardware_info.gpu.map((gpu, i) => (
                                    <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg text-sm border border-gray-100">
                                        <span className="font-medium text-gray-700">{gpu.name}</span>
                                        <span className="text-xs text-gray-500">{gpu.driver_version}</span>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-gray-400 text-sm">No GPU info available.</p>}
                    </div>

                    {/* Network Adapters */}
                    <div className="bg-white/50 rounded-xl p-5 border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <Activity className="text-blue-500" size={20} /> Network Adapters
                        </h3>
                        {hardware_info?.network && hardware_info.network.length > 0 ? (
                            <div className="space-y-3">
                                {hardware_info.network.map((net, i) => (
                                    <div key={i} className="bg-gray-50 p-3 rounded-lg text-sm border border-gray-100">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-medium text-gray-700 truncate max-w-[200px]" title={net.interface}>{net.interface}</span>
                                            <span className="font-bold text-gray-800">{net.type}</span>
                                        </div>
                                        <div className="flex flex-col gap-1 text-xs text-gray-500">
                                            <div className="flex justify-between">
                                                <span>IP: {net.ip_address}</span>
                                                <span>MAC: {net.mac}</span>
                                            </div>
                                            {net.speed_mbps && <div>Speed: {net.speed_mbps} Mbps</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-gray-400 text-sm">No network info available.</p>}
                    </div>

                    {/* System Information */}
                    <div className="bg-white/50 rounded-xl p-5 border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <Server className="text-gray-600" size={20} /> System Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-gray-500 block">OS Distro</span> {machine.os_details?.distro || machine.os}</div>
                            <div><span className="text-gray-500 block">OS Release</span> {machine.os_details?.release}</div>
                            <div><span className="text-gray-500 block">Device Name</span> {machine.device_name || machine.hostname}</div>
                            <div><span className="text-gray-500 block">Serial / UUID</span> <span className="text-xs">{machine.os_details?.serial || machine.os_details?.uuid}</span></div>
                            <div><span className="text-gray-500 block">UEFI</span> {machine.os_details?.uefi ? 'Yes' : 'No'}</div>
                        </div>
                    </div>

                    {/* Users */}
                    <div className="bg-white/50 rounded-xl p-5 border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <CircuitBoard className="text-indigo-500" size={20} /> Users ({machine.users?.length || 0})
                        </h3>
                        {machine.users && machine.users.length > 0 ? (
                            <div className="space-y-2">
                                {machine.users.map((u, i) => (
                                    <div key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                                        <span className="font-medium">{u.user}</span>
                                        <span className="text-xs text-gray-500">{u.date} {u.time}</span>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-gray-400 text-sm">No users logged in.</p>}
                    </div>
                    {/* Top Processes */}
                    <div className="bg-white/50 rounded-xl p-5 border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <Activity className="text-red-500" size={20} /> Top Processes
                        </h3>
                        {machine.metrics?.processes && machine.metrics.processes.length > 0 ? (
                            <div className="overflow-hidden rounded-lg border border-gray-200">
                                <table className="min-w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-medium">
                                        <tr>
                                            <th className="px-3 py-2">Name</th>
                                            <th className="px-3 py-2 text-right">CPU %</th>
                                            <th className="px-3 py-2 text-right">Mem %</th>
                                            <th className="px-3 py-2 text-right">PID</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {machine.metrics.processes.map((p, i) => (
                                            <tr key={i} className="hover:bg-gray-50/50">
                                                <td className="px-3 py-2 font-medium text-gray-700 truncate max-w-[150px]" title={p.name}>{p.name}</td>
                                                <td className="px-3 py-2 text-right text-gray-600">{p.cpu}%</td>
                                                <td className="px-3 py-2 text-right text-gray-600">{p.mem}%</td>
                                                <td className="px-3 py-2 text-right text-gray-400 text-xs">{p.pid}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : <p className="text-gray-400 text-sm">No process info available.</p>}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default MachineDetails;
