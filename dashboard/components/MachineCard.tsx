import React from 'react';
import { Machine } from '../types';
import { Server, HardDrive, Cpu, Activity } from 'lucide-react';

interface MachineCardProps {
    machine: Machine;
    onClick: (machine: Machine) => void;
}

const MachineCard: React.FC<MachineCardProps> = ({ machine, onClick }) => {
    const isOnline = machine.status === 'online';

    const getUsageColor = (usage: number) => {
        if (usage >= 90) return 'text-red-500';
        if (usage >= 70) return 'text-yellow-500';
        return 'text-green-500';
    };

    const getProgressBarColor = (usage: number) => {
        if (usage >= 90) return 'bg-red-500';
        if (usage >= 70) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    return (
        <div
            onClick={() => onClick(machine)}
            className={`p-5 rounded-2xl shadow-sm border transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-1 ${isOnline ? 'bg-white/80 backdrop-blur-md border-white/50' : 'bg-gray-100 border-gray-200 opacity-60 grayscale'}`}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isOnline ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                        <Server size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-800">{machine.nickname || machine.hostname}</h3>
                        <p className="text-xs text-gray-500">{machine.nickname ? machine.hostname : machine.ip}</p>
                    </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-semibold ${isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                    {machine.status.toUpperCase()}
                </div>
            </div>

            <div className="space-y-3">
                {/* CPU */}
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 flex items-center gap-1"><Cpu size={14} /> CPU</span>
                        <span className={`font-medium ${getUsageColor(machine.metrics?.cpu || 0)}`}>{machine.metrics?.cpu || 0}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(machine.metrics?.cpu || 0)}`}
                            style={{ width: `${machine.metrics?.cpu || 0}%` }}
                        />
                    </div>
                </div>

                {/* RAM */}
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 flex items-center gap-1"><Activity size={14} /> RAM</span>
                        <span className={`font-medium ${getUsageColor(machine.metrics?.ram || 0)}`}>{machine.metrics?.ram || 0}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(machine.metrics?.ram || 0)}`}
                            style={{ width: `${machine.metrics?.ram || 0}%` }}
                        />
                    </div>
                </div>

                {/* Disk */}
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 flex items-center gap-1"><HardDrive size={14} /> Main Disk</span>
                        <span className={`font-medium ${getUsageColor(machine.metrics?.disk || 0)}`}>{machine.metrics?.disk || 0}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(machine.metrics?.disk || 0)}`}
                            style={{ width: `${machine.metrics?.disk || 0}%` }}
                        />
                    </div>
                </div>

                {/* Network Summary */}
                <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-xs">
                    <div className="flex gap-3">
                        <span className="flex items-center gap-1 text-gray-500">
                            <Activity size={12} className="rotate-180 text-blue-500" />
                            {(machine.metrics?.network_down_kbps || 0).toFixed(1)} KB/s
                        </span>
                        <span className="flex items-center gap-1 text-gray-500">
                            <Activity size={12} className="text-green-500" />
                            {(machine.metrics?.network_up_kbps || 0).toFixed(1)} KB/s
                        </span>
                    </div>
                    {machine.metrics?.active_vpn && (
                        <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold">VPN</span>
                    )}
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
                OS: {machine.os}
            </div>
        </div>
    );
};

export default MachineCard;
