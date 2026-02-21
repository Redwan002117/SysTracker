'use client';

import React from 'react';
import { Machine } from '../types';
import { Server, Activity, Globe, Radio, Terminal, Shield, CircuitBoard, Cpu, Layers, HardDrive, Monitor, LayoutList, Database, X, Trash2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileCard from './ProfileCard';
import TerminalTab from './TerminalTab';
import PerformanceHistory from './PerformanceHistory';
import { isAdmin, getToken } from '../lib/auth';

interface MachineDetailsProps {
    machine: Machine | null;
    onClose: () => void;
    onDelete?: (id: string) => void;
}

const MachineDetails: React.FC<MachineDetailsProps> = ({ machine, onClose, onDelete }) => {
    // React Hooks must be called before any early returns
    const [activeTab, setActiveTab] = React.useState<'overview' | 'terminal' | 'history'>('overview');
    const [isEditing, setIsEditing] = React.useState(false);
    const [nickname, setNickname] = React.useState(machine?.nickname || '');
    const [sortConfig, setSortConfig] = React.useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'cpu', direction: 'desc' });
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [deleteError, setDeleteError] = React.useState<string | null>(null);

    // Close on escape key
    React.useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Update nickname when machine changes
    React.useEffect(() => {
        if (machine) {
            setNickname(machine.nickname || '');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [machine?.nickname]);

    // Sort processes (moved before early return for React Hooks compliance)
    const sortedProcesses = React.useMemo(() => {
        if (!machine?.metrics?.processes) return [];
        const sortableProcesses = [...machine.metrics.processes];
        if (sortConfig !== null) {
            sortableProcesses.sort((a, b) => {
                // @ts-expect-error - dynamic key access
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                // @ts-expect-error - dynamic key access
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableProcesses;
    }, [machine?.metrics?.processes, sortConfig]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    if (!machine) return null;

    const isOnline = machine.status === 'online';
    const { hardware_info } = machine;

    const handleSaveNickname = async () => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('systracker_token') : null;
            await fetch(`/api/machines/${machine.id}/nickname`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ nickname })
            });
            setIsEditing(false);
            // Socket will update the UI
        } catch (error) {
            console.error('Failed to update nickname:', error);
        }
    };

    const handleProfileUpdate = async (newProfile: Machine['profile']): Promise<boolean> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('systracker_token') : null;
            const res = await fetch(`/api/machines/${machine.id}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ profile: newProfile })
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `Server error ${res.status}`);
            }
            // Socket will update the UI via machine_update event
            return true;
        } catch (err) {
            console.error('[ProfileCard] Save failed:', err);
            return false;
        }
    };

    const handleDelete = async () => {
        if (!machine) return;
        setIsDeleting(true);
        setDeleteError(null);
        try {
            const token = getToken();
            const res = await fetch(`/api/machines/${machine.id}`, {
                method: 'DELETE',
                headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `Server error ${res.status}`);
            }
            onDelete?.(machine.id);
            onClose();
        } catch (err: unknown) {
            setDeleteError(err instanceof Error ? err.message : 'Failed to remove device');
        } finally {
            setIsDeleting(false);
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
        <AnimatePresence>
            {machine && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
                        onClick={onClose}
                    />

                    {/* Drawer Container */}
                    <div className="fixed inset-0 z-50 flex pointer-events-none justify-end">

                        {/* Profile Card Floating (Desktop) */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                            className="hidden xl:flex fixed left-0 top-0 bottom-0 w-[calc(100%-48rem)] items-center justify-center pointer-events-none z-50"
                        >
                            <div className="pointer-events-auto">
                                <ProfileCard machine={machine} onUpdate={handleProfileUpdate} />
                            </div>
                        </motion.div>


                        {/* Right Drawer */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-full max-w-3xl bg-white/95 backdrop-blur-3xl shadow-2xl pointer-events-auto h-full border-l border-slate-200 flex flex-col"
                        >
                            {/* Drawer Header */}
                            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100 p-6 flex justify-between items-start shadow-sm">
                                <div>
                                    <div className="flex items-center gap-4">
                                        <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 ring-1 ring-blue-100 shadow-sm">
                                            <Server size={24} strokeWidth={1.5} />
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
                                                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => { setIsEditing(true); setNickname(machine.nickname || ''); }}>
                                                    <h2 className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                        {machine.nickname || machine.hostname}
                                                    </h2>
                                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-100 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wide">Edit</span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 font-medium">
                                                <span className="font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100/80 text-xs">{machine.ip}</span>
                                                <span className="text-slate-300">•</span>
                                                <span className="flex items-center gap-1.5"><Monitor size={14} className="text-slate-400" /> {machine.os}</span>
                                                <span className="text-slate-300">•</span>
                                                <span className={`flex items-center gap-1.5 ${isOnline ? 'text-emerald-600' : 'text-slate-500'}`}>
                                                    <div className={`size-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                                    {machine.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {isAdmin() && onDelete && (
                                        <button
                                            onClick={() => { setShowDeleteConfirm(true); setDeleteError(null); }}
                                            title="Remove device from server"
                                            className="p-2 hover:bg-rose-50 rounded-full transition-colors text-slate-400 hover:text-rose-600 duration-200"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600 hover:rotate-90 duration-300">
                                        <X size={24} />
                                    </button>
                                </div>

                                {/* Delete Confirmation Modal */}
                                {showDeleteConfirm && (
                                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}>
                                        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-2.5 bg-rose-100 rounded-xl text-rose-600 shrink-0">
                                                    <AlertTriangle size={22} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-800 text-base">Remove Device?</h3>
                                                    <p className="text-xs text-slate-500 mt-0.5">This deletes all metrics, events, and logs for this machine from the server.</p>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 rounded-xl px-4 py-3 mb-4 border border-slate-100">
                                                <p className="text-sm font-semibold text-slate-700">{machine.nickname || machine.hostname}</p>
                                                <p className="text-xs text-slate-400 font-mono mt-0.5">{machine.ip}</p>
                                            </div>
                                            {deleteError && (
                                                <p className="text-xs text-rose-600 mb-3 bg-rose-50 px-3 py-2 rounded-lg border border-rose-100">{deleteError}</p>
                                            )}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setShowDeleteConfirm(false)}
                                                    disabled={isDeleting}
                                                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                                                >Cancel</button>
                                                <button
                                                    onClick={handleDelete}
                                                    disabled={isDeleting}
                                                    className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-colors disabled:opacity-60"
                                                >{isDeleting ? 'Removing…' : 'Remove Device'}</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Tab Navigation */}
                            <div className="flex bg-slate-50 border-b border-slate-200">
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'overview' ? 'text-blue-600 bg-white border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-100'}`}
                                >
                                    <Activity size={16} />
                                    <span>Overview</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('terminal')}
                                    className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'terminal' ? 'text-purple-600 bg-white border-purple-600' : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-100'}`}
                                >
                                    <Terminal size={16} />
                                    <span>Terminal</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'history' ? 'text-emerald-600 bg-white border-emerald-600' : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-100'}`}
                                >
                                    <Activity size={16} />
                                    <span>History</span>
                                </button>
                            </div>

                            {activeTab === 'overview' ? (
                                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                    {/* Metrics Summary Cards */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors hover:bg-blue-50/30 group">
                                            <div className="text-slate-500 mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"><Cpu size={14} /> CPU</div>
                                            <div className="text-3xl font-bold text-slate-800 tabular-nums tracking-tight">{machine.metrics?.cpu || 0}%</div>
                                            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }} animate={{ width: `${machine.metrics?.cpu || 0}%` }} transition={{ duration: 1 }}
                                                    className="bg-blue-500 h-full rounded-full"
                                                />
                                            </div>
                                        </div>
                                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 hover:border-purple-200 transition-colors hover:bg-purple-50/30">
                                            <div className="text-slate-500 mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"><Layers size={14} /> RAM</div>
                                            <div className="text-3xl font-bold text-slate-800 tabular-nums tracking-tight">{machine.metrics?.ram || 0}%</div>
                                            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }} animate={{ width: `${machine.metrics?.ram || 0}%` }} transition={{ duration: 1, delay: 0.1 }}
                                                    className="bg-purple-500 h-full rounded-full"
                                                />
                                            </div>
                                        </div>
                                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 hover:border-amber-200 transition-colors hover:bg-amber-50/30">
                                            <div className="text-slate-500 mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"><HardDrive size={14} /> Disk</div>
                                            <div className="text-3xl font-bold text-slate-800 tabular-nums tracking-tight">{machine.metrics?.disk || 0}%</div>
                                            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }} animate={{ width: `${machine.metrics?.disk || 0}%` }} transition={{ duration: 1, delay: 0.2 }}
                                                    className="bg-amber-500 h-full rounded-full"
                                                />
                                            </div>
                                        </div>
                                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 hover:border-emerald-200 transition-colors hover:bg-emerald-50/30">
                                            <div className="text-slate-500 mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"><Activity size={14} /> Network</div>
                                            <div className="mt-1 space-y-1.5">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="flex items-center gap-1.5 text-slate-400 font-medium"><Activity size={10} className="rotate-180 text-blue-500" /> Down</span>
                                                    <span className="font-bold text-slate-700 font-mono">{formatNetworkSpeed(machine.metrics?.network_down_kbps)}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="flex items-center gap-1.5 text-slate-400 font-medium"><Activity size={10} className="text-emerald-500" /> Up</span>
                                                    <span className="font-bold text-slate-700 font-mono">{formatNetworkSpeed(machine.metrics?.network_up_kbps)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Left Column: System & Hardware */}
                                        <div className="space-y-8">

                                            {/* Mobile Profile Card */}
                                            <div className="xl:hidden">
                                                <ProfileCard machine={machine} onUpdate={handleProfileUpdate} />
                                            </div>

                                            {/* System Details */}
                                            <section>
                                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <Shield size={14} /> System Info
                                                </h3>
                                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5 hover:shadow-md transition-shadow">
                                                    <div className="grid grid-cols-2 gap-y-6 gap-x-6">
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">Hostname</span>
                                                            <span className="font-semibold text-slate-700 bg-slate-50 px-2 py-1 rounded select-all">{machine.hostname}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">OS Version</span>
                                                            <span className="font-medium text-slate-700 text-sm">{machine.os}</span>
                                                        </div>
                                                        <div className="col-span-2 border-t border-slate-50 pt-4 grid grid-cols-2 gap-6">
                                                            <div>
                                                                <span className="text-[10px] text-slate-400 font-bold uppercase mb-1.5 flex items-center gap-1.5"><Activity size={10} /> Uptime</span>
                                                                <span className="font-mono text-sm text-slate-700 font-medium">
                                                                    {(() => {
                                                                        const seconds = machine.metrics?.uptime_seconds || 0;
                                                                        const days = Math.floor(seconds / 86400);
                                                                        const hours = Math.floor((seconds % 86400) / 3600);
                                                                        const minutes = Math.floor((seconds % 3600) / 60);
                                                                        const secs = Math.floor(seconds % 60);
                                                                        return `${days}d ${hours}h ${minutes}m ${secs}s`;
                                                                    })()}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] text-slate-400 font-bold uppercase mb-1.5 flex items-center gap-1.5"><Radio size={10} /> Last Saw</span>
                                                                <span className="font-mono text-sm text-slate-700 font-medium">
                                                                    {new Date(machine.last_seen).toLocaleTimeString('en-US', { timeZone: 'UTC' })} UTC
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">Boot Time</span>
                                                                <span className="font-mono text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                                                                    {machine.metrics?.uptime_seconds
                                                                        ? new Date(Date.now() - machine.metrics.uptime_seconds * 1000).toLocaleString('en-US', { timeZone: 'UTC' }) + ' UTC'
                                                                        : 'Unknown'}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">Serial / UUID</span>
                                                                <span className="font-mono text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded select-all block break-all truncate" title={(() => {
                                                                    const sys = hardware_info?.all_details?.system;
                                                                    const mb = hardware_info?.all_details?.motherboard;
                                                                    if (sys?.identifying_number && sys.identifying_number !== 'N/A') return sys.identifying_number;
                                                                    if (sys?.uuid && sys.uuid !== 'N/A') return sys.uuid;
                                                                    return mb?.serial || 'N/A';
                                                                })()}>
                                                                    {(() => {
                                                                        const sys = hardware_info?.all_details?.system;
                                                                        const mb = hardware_info?.all_details?.motherboard;
                                                                        if (sys?.identifying_number && sys.identifying_number !== 'N/A' && sys.identifying_number !== 'To be filled by O.E.M.') return sys.identifying_number;
                                                                        if (sys?.uuid && sys.uuid !== 'N/A' && sys.uuid !== 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF') return sys.uuid;
                                                                        const mbSerial = mb?.serial;
                                                                        if (mbSerial && mbSerial !== 'N/A' && !mbSerial.toLowerCase().includes('default string')) return mbSerial;
                                                                        return 'N/A';
                                                                    })()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </section>

                                            {/* Hardware Specs */}
                                            <section>
                                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <CircuitBoard size={14} /> Hardware Specs
                                                </h3>
                                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50 hover:shadow-md transition-shadow">

                                                    {/* Motherboard */}
                                                    <div className="p-5">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg ring-1 ring-indigo-100"><CircuitBoard size={16} /></div>
                                                            <h4 className="font-semibold text-slate-800 text-sm">Motherboard</h4>
                                                        </div>
                                                        {hardware_info?.all_details?.motherboard && Object.keys(hardware_info.all_details.motherboard).length > 0 ? (
                                                            <div className="text-sm space-y-1 ml-11">
                                                                <div className="text-slate-800 font-medium">{formatValue(hardware_info.all_details.motherboard.manufacturer || 'Unknown')}</div>
                                                                <div className="text-slate-500">{formatValue(hardware_info.all_details.motherboard.product || 'Unknown Model')}</div>
                                                                <div className="text-xs text-slate-400 font-mono mt-1">Ver: {formatValue(hardware_info.all_details.motherboard.version || 'N/A')}</div>
                                                            </div>
                                                        ) : <span className="text-slate-400 italic text-sm ml-11">Unknown Motherboard</span>}
                                                    </div>

                                                    {/* CPU Details */}
                                                    <div className="p-5">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className="bg-orange-50 text-orange-600 p-1.5 rounded-lg ring-1 ring-orange-100"><Cpu size={16} /></div>
                                                            <h4 className="font-semibold text-slate-800 text-sm">Processor</h4>
                                                        </div>
                                                        {hardware_info?.all_details?.cpu?.name ? (
                                                            <div className="text-sm space-y-2 ml-11">
                                                                <div className="text-slate-800 font-medium leading-tight">{hardware_info.all_details.cpu.name}</div>
                                                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                                                                    <div className="bg-slate-50 px-2 py-1 rounded">Cores: <span className="text-slate-700 font-semibold">{hardware_info.all_details.cpu.cores || 'N/A'}</span></div>
                                                                    <div className="bg-slate-50 px-2 py-1 rounded">Threads: <span className="text-slate-700 font-semibold">{hardware_info.all_details.cpu.logical || 'N/A'}</span></div>
                                                                    <div>Socket: <span className="text-slate-700">{hardware_info.all_details.cpu.socket || 'N/A'}</span></div>
                                                                    <div>Virt: <span className="text-slate-700">{hardware_info.all_details.cpu.virtualization || 'N/A'}</span></div>
                                                                </div>
                                                            </div>
                                                        ) : <span className="text-slate-400 italic text-sm ml-11">Unknown CPU - Waiting for data update</span>}
                                                    </div>

                                                    {/* GPU Details */}
                                                    {hardware_info?.all_details?.gpu && hardware_info.all_details.gpu.length > 0 && (
                                                        <div className="p-5">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div className="bg-red-50 text-red-600 p-1.5 rounded-lg ring-1 ring-red-100"><Monitor size={16} /></div>
                                                                <h4 className="font-semibold text-slate-800 text-sm">Graphics</h4>
                                                            </div>
                                                            <div className="space-y-4 ml-11">
                                                                {hardware_info.all_details.gpu.map((gpu, i) => (
                                                                    <div key={i} className="text-sm">
                                                                        <div className="text-slate-800 font-medium">{gpu.name}</div>
                                                                        <div className="grid grid-cols-2 gap-1 text-xs text-slate-500 mt-1">
                                                                            <div>Mem: <span className="text-slate-700">{gpu.memory}</span></div>
                                                                            <div className="truncate" title={gpu.driver_version}>Driver: <span className="text-slate-700">{gpu.driver_version}</span></div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Memory Details */}
                                                    <div className="p-5">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className="bg-pink-50 text-pink-600 p-1.5 rounded-lg ring-1 ring-pink-100"><Layers size={16} /></div>
                                                            <h4 className="font-semibold text-slate-800 text-sm">Memory Modules</h4>
                                                        </div>
                                                        {hardware_info?.all_details?.ram?.modules && hardware_info.all_details.ram.modules.length > 0 ? (
                                                            <div className="space-y-2 ml-11">
                                                                {hardware_info.all_details.ram.modules.map((stick, i) => (
                                                                    <div key={i} className="flex flex-col text-xs bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                                                                        <div className="flex justify-between items-center mb-1">
                                                                            <span className="font-semibold text-slate-700">{stick.capacity} <span className="text-slate-400 font-normal">@ {stick.speed}</span></span>
                                                                            <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-100 shadow-sm">{stick.form_factor}</span>
                                                                        </div>
                                                                        <div className="text-slate-400 flex justify-between items-center">
                                                                            <span>{stick.manufacturer}</span>
                                                                            <span className="font-mono opacity-80">{stick.part_number}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                <div className="text-xs text-slate-400 text-right mt-1 font-medium">Slots Used: {hardware_info.all_details.ram.slots_used}</div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 italic text-sm ml-11">Unknown RAM</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </section>
                                        </div>

                                        {/* Right Column: Dynamic Data */}
                                        <div className="space-y-8">

                                            {/* Network Adapters */}
                                            <section>
                                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <Globe size={14} /> Interfaces
                                                </h3>
                                                <div className="space-y-3">
                                                    {hardware_info?.all_details?.network && hardware_info.all_details.network.length > 0 ? (
                                                        hardware_info.all_details.network.map((net, i) => (
                                                            <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2 hover:border-blue-100 transition-colors">
                                                                <div className="flex justify-between items-center">
                                                                    <div className="flex items-center gap-2.5">
                                                                        <div className={`p-1.5 rounded-lg text-xs ${net.type === 'Wi-Fi' ? 'bg-sky-50 text-sky-600' : 'bg-slate-100 text-slate-500'}`}>
                                                                            {net.type === 'Wi-Fi' ? <Radio size={14} /> : <CircuitBoard size={14} />}
                                                                        </div>
                                                                        <span className="font-semibold text-slate-700 text-xs truncate max-w-[150px]" title={net.interface}>{net.interface}</span>
                                                                    </div>
                                                                    {net.speed_mbps ? <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100">{formatLinkSpeed(net.speed_mbps)}</span> : null}
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg font-mono">
                                                                    <div title={net.ip_address} className="truncate">{net.ip_address}</div>
                                                                    <div className="text-right truncate" title={net.mac}>{net.mac}</div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : <p className="text-slate-400 text-sm italic">No network interfaces.</p>}
                                                </div>
                                            </section>

                                            {/* Storage */}
                                            <section>
                                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <HardDrive size={14} /> Storage Structure
                                                </h3>

                                                {/* Physical Drives */}
                                                {hardware_info?.all_details?.drives && hardware_info.all_details.drives.length > 0 && (
                                                    <div className="mb-4 space-y-3">
                                                        <h4 className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5 ml-1"><Database size={12} /> Physical Drives</h4>
                                                        {hardware_info.all_details.drives.map((drive, i) => (
                                                            <div key={i} className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-1.5 hover:border-blue-100 transition-colors">
                                                                <div className="flex justify-between items-start">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="bg-slate-50 text-slate-500 p-1.5 rounded-md border border-slate-100"><HardDrive size={14} /></div>
                                                                        <span className="font-semibold text-slate-800 text-sm leading-tight">{drive.model}</span>
                                                                    </div>
                                                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase tracking-wider">{drive.size}</span>
                                                                </div>
                                                                <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-1">
                                                                    Serial: <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 select-all">{drive.serial}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Logical Volumes */}
                                                <div>
                                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5 ml-1 mb-3"><LayoutList size={12} /> Logical Volumes</h4>
                                                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-5 hover:shadow-md transition-shadow">
                                                        {machine.metrics?.disk_details && machine.metrics.disk_details.length > 0 ? (
                                                            machine.metrics.disk_details.map((disk, i) => (
                                                                <div key={i}>
                                                                    <div className="flex justify-between items-center mb-1.5">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-semibold text-slate-700 text-sm">
                                                                                {disk.label ? `${disk.label} (${disk.mount})` : disk.mount}
                                                                            </span>
                                                                            <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.5 bg-slate-50 rounded uppercase">{disk.type}</span>
                                                                        </div>
                                                                        <span className="text-sm font-bold text-slate-600">{disk.percent}%</span>
                                                                    </div>

                                                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-1.5">
                                                                        <motion.div
                                                                            initial={{ width: 0 }}
                                                                            animate={{ width: `${disk.percent}%` }}
                                                                            transition={{ duration: 0.8, delay: 0.2 }}
                                                                            className={`h-full rounded-full ${disk.percent > 90 ? 'bg-rose-500' : disk.percent > 75 ? 'bg-amber-500' : 'bg-teal-500'}`}
                                                                        />
                                                                    </div>

                                                                    <div className="flex justify-between text-xs text-slate-500">
                                                                        <span>Used: <span className="font-medium text-slate-700">{disk.used_gb} GB</span></span>
                                                                        <span>Total: {disk.total_gb} GB</span>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-slate-400 text-sm italic">No storage usage data.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </section>

                                            {/* Processes Table */}
                                            <section>
                                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <Activity size={14} className="text-rose-400" /> Hot Processes
                                                </h3>
                                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                                    <table className="w-full text-left text-xs">
                                                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                                                            <tr>
                                                                <th className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('name')}>
                                                                    Name {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                                                </th>
                                                                <th className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('cpu')}>
                                                                    <div className="flex flex-col items-end">
                                                                        <span>CPU% {sortConfig?.key === 'cpu' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</span>
                                                                    </div>
                                                                </th>
                                                                <th className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('mem')}>
                                                                    <div className="flex flex-col items-end">
                                                                        <span>Mem {sortConfig?.key === 'mem' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</span>
                                                                    </div>
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50">
                                                            {sortedProcesses.slice(0, 10).map((p, i) => (
                                                                <tr key={i} className="hover:bg-blue-50/30 transition-colors group">
                                                                    <td className="px-4 py-2.5 font-medium text-slate-700 truncate max-w-[140px]" title={p.name}>{p.name}</td>
                                                                    <td className={`px-4 py-2.5 text-right font-mono ${p.cpu > 10 ? 'text-rose-600 font-bold bg-rose-50' : 'text-slate-600'}`}>{p.cpu}%</td>
                                                                    <td className="px-4 py-2.5 text-right font-mono text-slate-600">
                                                                        <div className="flex flex-col items-end leading-tight">
                                                                            <span>{p.mem}%</span>
                                                                            {p.mem_mb && <span className="text-[10px] text-slate-400 group-hover:text-slate-500">{p.mem_mb.toFixed(1)} MB</span>}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            {sortedProcesses.length === 0 && (
                                                                <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400 italic">No active process data available</td></tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </section>
                                        </div>
                                    </div>
                                </div>
                            ) : activeTab === 'terminal' ? (
                                <div className="flex-1 overflow-hidden p-0 bg-slate-950">
                                    <TerminalTab machine={machine} />
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/50">
                                    <PerformanceHistory machineId={machine.id} />
                                </div>
                            )}
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence >
    );
};

export default MachineDetails;
