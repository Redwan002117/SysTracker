import React from 'react';
import { Machine } from '../types';
import { Server, HardDrive, Cpu, Activity, ShieldCheck, Wifi, WifiOff } from 'lucide-react';

interface MachineCardProps {
    machine: Machine;
    onClick: (machine: Machine) => void;
}

const MachineCard: React.FC<MachineCardProps> = ({ machine, onClick }) => {
    const isOnline = machine.status === 'online';

    // Helper for usage color coding
    const getUsageColor = (usage: number) => {
        if (usage >= 90) return 'text-red-600';
        if (usage >= 70) return 'text-amber-600';
        return 'text-emerald-600';
    };

    const getProgressBarColor = (usage: number) => {
        if (usage >= 90) return 'bg-gradient-to-r from-red-500 to-red-600';
        if (usage >= 70) return 'bg-gradient-to-r from-amber-400 to-amber-500';
        return 'bg-gradient-to-r from-emerald-400 to-emerald-500';
    };

    const formatNetworkSpeed = (kbps: number | undefined) => {
        if (!kbps) return '0 bps';
        const bitsPerSec = kbps * 1024 * 8;
        if (bitsPerSec >= 1_000_000_000) return `${(bitsPerSec / 1_000_000_000).toFixed(1)} Gbps`;
        if (bitsPerSec >= 1_000_000) return `${(bitsPerSec / 1_000_000).toFixed(1)} Mbps`;
        if (bitsPerSec >= 1_000) return `${(bitsPerSec / 1_000).toFixed(1)} Kbps`;
        return `${bitsPerSec.toFixed(0)} bps`;
    };

    return (
        <div
            onClick={() => onClick(machine)}
            className={`
                group relative p-5 rounded-2xl border transition-all duration-500 cursor-pointer overflow-hidden
                ${isOnline
                    ? 'bg-white/80 backdrop-blur-xl border-white/40 shadow-sm hover:shadow-2xl hover:-translate-y-1 hover:border-blue-200/50 ring-1 ring-slate-900/5'
                    : 'bg-slate-50/50 backdrop-blur-sm border-slate-200/60 opacity-60 grayscale-[0.8] hover:opacity-100 hover:grayscale-0'}
            `}
        >
            {/* Hover Glow Effect */}
            {isOnline && (
                <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            )}

            {/* Header */}
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-4">
                    <div className={`
                        p-3 rounded-xl transition-colors shadow-inner ring-1 ring-inset
                        ${isOnline ? 'bg-blue-50/80 text-blue-600 ring-blue-100 group-hover:bg-blue-100/80' : 'bg-slate-100 text-slate-400 ring-slate-200'}
                    `}>
                        <Server size={22} strokeWidth={2} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors text-lg tracking-tight">
                            {machine.nickname || machine.hostname}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5 tracking-wide opacity-80">
                            {machine.nickname ? machine.hostname : machine.ip}
                        </p>
                    </div>
                </div>

                {/* Status Badge */}
                <div className={`
                    pl-2 pr-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border flex items-center gap-1.5 shadow-sm
                    ${isOnline
                        ? 'bg-emerald-50/80 text-emerald-700 border-emerald-100/50 backdrop-blur-sm'
                        : 'bg-slate-100/80 text-slate-500 border-slate-200/50'}
                `}>
                    <div className="relative flex size-2">
                        {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                        <span className={`relative inline-flex rounded-full size-2 ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    </div>
                    {machine.status}
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="space-y-5 relative z-10">
                {/* CPU */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold tracking-tight">
                        <span className="text-slate-500 flex items-center gap-1.5">
                            <Cpu size={14} className="text-slate-400" /> CPU
                        </span>
                        <span className={getUsageColor(machine.metrics?.cpu || 0)}>
                            {machine.metrics?.cpu || 0}%
                        </span>
                    </div>
                    <div className="h-2 bg-slate-100/80 rounded-full overflow-hidden shadow-inner">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ease-out shadow-sm ${getProgressBarColor(machine.metrics?.cpu || 0)}`}
                            style={{ width: `${machine.metrics?.cpu || 0}%` }}
                        />
                    </div>
                </div>

                {/* RAM */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold tracking-tight">
                        <span className="text-slate-500 flex items-center gap-1.5">
                            <Activity size={14} className="text-slate-400" /> RAM
                        </span>
                        <span className={getUsageColor(machine.metrics?.ram || 0)}>
                            {machine.metrics?.ram || 0}%
                        </span>
                    </div>
                    <div className="h-2 bg-slate-100/80 rounded-full overflow-hidden shadow-inner">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ease-out shadow-sm ${getProgressBarColor(machine.metrics?.ram || 0)}`}
                            style={{ width: `${machine.metrics?.ram || 0}%` }}
                        />
                    </div>
                </div>

                {/* Disk */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold tracking-tight">
                        <span className="text-slate-500 flex items-center gap-1.5">
                            <HardDrive size={14} className="text-slate-400" /> Disk
                        </span>
                        <span className={getUsageColor(machine.metrics?.disk || 0)}>
                            {machine.metrics?.disk || 0}%
                        </span>
                    </div>
                    <div className="h-2 bg-slate-100/80 rounded-full overflow-hidden shadow-inner">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ease-out shadow-sm ${getProgressBarColor(machine.metrics?.disk || 0)}`}
                            style={{ width: `${machine.metrics?.disk || 0}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Footer / Network Stats */}
            <div className="mt-6 pt-4 border-t border-slate-100/60 flex justify-between items-center relative z-10">
                <div className="flex gap-4 text-[11px] font-semibold text-slate-500">
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100" title="Download">
                        <Activity size={12} className="rotate-180 text-blue-500" />
                        {formatNetworkSpeed(machine.metrics?.network_down_kbps)}
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100" title="Upload">
                        <Activity size={12} className="text-emerald-500" />
                        {formatNetworkSpeed(machine.metrics?.network_up_kbps)}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {machine.metrics?.active_vpn && (
                        <div className="px-1.5 py-0.5 bg-indigo-50/80 text-indigo-600 rounded text-[10px] font-bold border border-indigo-100/50 flex items-center gap-1 shadow-sm">
                            <ShieldCheck size={10} /> VPN
                        </div>
                    )}
                    <div className="text-[10px] text-slate-400 font-bold bg-white/50 px-2 py-0.5 rounded border border-slate-100/80 uppercase tracking-widest">
                        {machine.os.split(' ')[0]}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MachineCard;
