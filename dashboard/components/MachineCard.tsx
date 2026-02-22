'use client';

import React from 'react';
import { Machine } from '../types';
import { Server, HardDrive, Cpu, Activity, ShieldCheck, CircuitBoard, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface MachineCardProps {
    machine: Machine;
    onClick: (machine: Machine) => void;
    isViewerMode?: boolean;
}

const MachineCard: React.FC<MachineCardProps> = ({ machine, onClick, isViewerMode = false }) => {
    const isOnline = machine.status === 'online';

    // Improved usage color coding (Subtle variants)
    const getUsageColor = (usage: number) => {
        if (usage >= 90) return 'text-rose-600 bg-rose-50 border-rose-100';
        if (usage >= 70) return 'text-amber-600 bg-amber-50 border-amber-100';
        return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    };

    const getProgressBarColor = (usage: number) => {
        if (usage >= 90) return 'bg-linear-to-r from-rose-500 to-rose-600 shadow-rose-200';
        if (usage >= 70) return 'bg-linear-to-r from-amber-400 to-amber-500 shadow-amber-200';
        return 'bg-linear-to-r from-emerald-400 to-emerald-500 shadow-emerald-200';
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
        <motion.div
            layout // Smooth layout transitions
            onClick={() => onClick(machine)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={isViewerMode ? { scale: 1.01 } : { y: -8, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`
                group relative p-5 rounded-2xl border transition-all duration-300 overflow-hidden
                ${isViewerMode ? 'cursor-not-allowed' : 'cursor-pointer'}
                ${isOnline
                    ? 'bg-white/95 backdrop-blur-xl border-slate-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_40px_rgba(99,102,241,0.15)] ring-1 ring-slate-900/5'
                    : 'bg-slate-50/50 backdrop-blur-sm border-slate-200/60 opacity-70 grayscale-[0.8] hover:opacity-100 hover:grayscale-0'}
            `}
        >
            {/* Lock Icon Overlay for Viewers */}
            {isViewerMode && (
                <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20 pointer-events-none">
                    <div className="bg-linear-to-br from-amber-500 to-orange-600 text-white p-3 rounded-2xl shadow-2xl shadow-amber-500/40 ring-2 ring-white/50">
                        <Lock size={20} />
                    </div>
                </div>
            )}

            {/* Online Glow Effect */}
            {isOnline && (
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-40 h-40 bg-linear-to-br from-blue-400/20 to-purple-400/20 blur-3xl rounded-full pointer-events-none group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all duration-700" />
            )}

            {/* Header */}
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className={`
                        p-2.5 rounded-xl shadow-sm ring-1 ring-inset transition-all duration-300
                        ${isOnline
                            ? 'bg-linear-to-br from-blue-100 via-indigo-50 to-purple-100 text-blue-600 ring-blue-200/50 group-hover:ring-blue-300 group-hover:scale-110 group-hover:shadow-md'
                            : 'bg-slate-100 text-slate-400 ring-slate-200'}
                    `}>
                        <Server size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors text-base tracking-tight">
                            {machine.nickname || machine.hostname}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5 tracking-wide opacity-80 flex items-center gap-1.5">
                            {machine.ip}
                            {machine.metrics?.active_vpn && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                                    <ShieldCheck size={8} /> VPN
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Status Badge */}
                <div className={`
                    pl-2 pr-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border flex items-center gap-1.5 shadow-sm transition-all duration-300
                    ${isOnline
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100 group-hover:border-emerald-200 group-hover:bg-emerald-100/50'
                        : 'bg-slate-100 text-slate-500 border-slate-200'}
                `}>
                    <div className="relative flex size-2">
                        {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                        <span className={`relative inline-flex rounded-full size-2 ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    </div>
                    {machine.status}
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="space-y-3 relative z-10">
                {/* Metric Item: CPU */}
                <div className="space-y-1">
                    <div className="flex justify-between items-end text-xs font-semibold tracking-tight">
                        <span className="text-slate-500 flex items-center gap-1.5">
                            <Cpu size={14} className="text-slate-400" /> CPU
                        </span>
                        <span className={`px-1.5 py-0.5 rounded border ${getUsageColor(machine.metrics?.cpu || 0)}`}>
                            {machine.metrics?.cpu || 0}%
                        </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden ring-1 ring-slate-100/50">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${machine.metrics?.cpu || 0}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className={`h-full rounded-full shadow-sm ${getProgressBarColor(machine.metrics?.cpu || 0)}`}
                        />
                    </div>
                </div>

                {/* Metric Item: RAM */}
                <div className="space-y-1">
                    <div className="flex justify-between items-end text-xs font-semibold tracking-tight">
                        <span className="text-slate-500 flex items-center gap-1.5">
                            <CircuitBoard size={14} className="text-slate-400" /> RAM
                        </span>
                        <span className={`px-1.5 py-0.5 rounded border ${getUsageColor(machine.metrics?.ram || 0)}`}>
                            {machine.metrics?.ram || 0}%
                        </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden ring-1 ring-slate-100/50">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${machine.metrics?.ram || 0}%` }}
                            transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
                            className={`h-full rounded-full shadow-sm ${getProgressBarColor(machine.metrics?.ram || 0)}`}
                        />
                    </div>
                </div>

                {/* Metric Item: Disk */}
                <div className="space-y-1">
                    <div className="flex justify-between items-end text-xs font-semibold tracking-tight">
                        <span className="text-slate-500 flex items-center gap-1.5">
                            <HardDrive size={14} className="text-slate-400" /> Disk
                        </span>
                        <span className={`px-1.5 py-0.5 rounded border ${getUsageColor(machine.metrics?.disk || 0)}`}>
                            {machine.metrics?.disk || 0}%
                        </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden ring-1 ring-slate-100/50">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${machine.metrics?.disk || 0}%` }}
                            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                            className={`h-full rounded-full shadow-sm ${getProgressBarColor(machine.metrics?.disk || 0)}`}
                        />
                    </div>
                </div>
            </div>

            {/* Footer / Network Stats */}
            <div className="mt-4 pt-3 border-t border-slate-100/80 flex justify-between items-center relative z-10">
                <div className="flex gap-2 text-[10px] font-semibold text-slate-500">
                    <div className="flex items-center gap-1.5 bg-slate-50/80 px-2 py-1 rounded-md border border-slate-100" title="Download">
                        <Activity size={12} className="rotate-180 text-blue-500" />
                        {formatNetworkSpeed(machine.metrics?.network_down_kbps)}
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50/80 px-2 py-1 rounded-md border border-slate-100" title="Upload">
                        <Activity size={12} className="text-emerald-500" />
                        {formatNetworkSpeed(machine.metrics?.network_up_kbps)}
                    </div>
                </div>

                <div className="text-[10px] text-slate-400 font-bold bg-white/50 px-2 py-0.5 rounded border border-slate-100/80 uppercase tracking-widest">
                    {(machine.os || 'Unknown').split(' ')[0]}
                </div>
            </div>
        </motion.div>
    );
};

export default MachineCard;
