'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../../../lib/auth';
import {
    Wrench, Plus, Trash2, RefreshCw, CheckCircle, Clock, AlertTriangle,
    X, Calendar, Bell, BellOff, Edit3, Play, Pause, Check, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MaintenanceWindow {
    id: number;
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    status: 'scheduled' | 'active' | 'completed' | 'cancelled';
    notify_users: number;
    affected_machines?: string;
    created_by: string;
    created_at: string;
}

const STATUS_CONFIG = {
    scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700', icon: Clock },
    active: { label: 'Active', color: 'bg-amber-100 text-amber-700', icon: Play },
    completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    cancelled: { label: 'Cancelled', color: 'bg-slate-100 text-slate-500', icon: X },
};

const MAINTENANCE_TEMPLATES = [
    {
        key: 'os_update',
        label: 'OS Updates',
        title: 'Operating System Updates',
        description: 'Scheduled OS and security patch installation.\n\nDuring this window, machines will be restarted automatically. Please save your work before the maintenance begins.',
    },
    {
        key: 'hardware',
        label: 'Hardware Upgrade',
        title: 'Hardware Maintenance',
        description: 'Physical hardware upgrade/replacement.\n\nAffected machines will be powered off during this window. Please expect full unavailability during this time.',
    },
    {
        key: 'network',
        label: 'Network Maintenance',
        title: 'Network Infrastructure Maintenance',
        description: 'Network switches, routers, or firewall updates.\n\nAll monitored machines will show as offline briefly. This does not indicate a real issue — it is expected during the maintenance window.',
    },
    {
        key: 'backup',
        label: 'Backup Window',
        title: 'Scheduled Backup & Archive',
        description: 'Full system backup and data archival.\n\nExpect reduced performance on affected machines during this time. Network throughput may be higher than normal.',
    },
    {
        key: 'custom',
        label: 'Custom',
        title: '',
        description: '',
    },
];

function timeUntil(dateStr: string): string {
    const diff = new Date(dateStr).getTime() - Date.now();
    if (diff < 0) return 'Past';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h > 48) return `${Math.floor(h / 24)}d`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function formatDt(dateStr: string) {
    return new Date(dateStr).toLocaleString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function durationMinutes(start: string, end: string) {
    const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
    if (mins < 60) return `${mins}m`;
    if (mins < 1440) return `${Math.round(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ''}`.trim();
    return `${Math.round(mins / 1440)}d`;
}

function toLocalISOString(date: Date) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function MaintenancePage() {
    const [windows, setWindows] = useState<MaintenanceWindow[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState<MaintenanceWindow | null>(null);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('custom');
    const [templateOpen, setTemplateOpen] = useState(false);

    const defaultStart = toLocalISOString(new Date(Date.now() + 3600000));
    const defaultEnd = toLocalISOString(new Date(Date.now() + 7200000));

    const [form, setForm] = useState({
        title: '',
        description: '',
        start_time: defaultStart,
        end_time: defaultEnd,
        notify_users: true,
        affected_machines: '',
    });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchWithAuth('/api/maintenance');
            if (res.ok) setWindows(await res.json());
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Auto-refresh active windows every 30s
    useEffect(() => {
        const t = setInterval(load, 30000);
        return () => clearInterval(t);
    }, [load]);

    const openNew = () => {
        setEditItem(null);
        setForm({ title: '', description: '', start_time: defaultStart, end_time: defaultEnd, notify_users: true, affected_machines: '' });
        setSelectedTemplate('custom');
        setError('');
        setShowForm(true);
    };

    const openEdit = (w: MaintenanceWindow) => {
        setEditItem(w);
        setForm({
            title: w.title,
            description: w.description || '',
            start_time: toLocalISOString(new Date(w.start_time)),
            end_time: toLocalISOString(new Date(w.end_time)),
            notify_users: !!w.notify_users,
            affected_machines: w.affected_machines ? JSON.parse(w.affected_machines).join(', ') : '',
        });
        setSelectedTemplate('custom');
        setError('');
        setShowForm(true);
    };

    const applyTemplate = (key: string) => {
        const t = MAINTENANCE_TEMPLATES.find(t => t.key === key);
        if (!t) return;
        setSelectedTemplate(key);
        setForm(f => ({
            ...f,
            title: t.title || f.title,
            description: t.description || f.description,
        }));
        setTemplateOpen(false);
    };

    const submit = async () => {
        if (!form.title || !form.start_time || !form.end_time) {
            setError('Title, start time, and end time are required.'); return;
        }
        if (new Date(form.end_time) <= new Date(form.start_time)) {
            setError('End time must be after start time.'); return;
        }
        setSending(true); setError('');
        try {
            const body = {
                ...form,
                start_time: new Date(form.start_time).toISOString(),
                end_time: new Date(form.end_time).toISOString(),
                affected_machines: form.affected_machines ? form.affected_machines.split(',').map(s => s.trim()).filter(Boolean) : [],
            };
            const res = await fetchWithAuth(editItem ? `/api/maintenance/${editItem.id}` : '/api/maintenance', {
                method: editItem ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                setSuccess(editItem ? 'Maintenance window updated.' : 'Maintenance window scheduled.');
                setShowForm(false);
                setTimeout(() => setSuccess(''), 4000);
                load();
            } else {
                const err = await res.json().catch(() => ({ error: 'Failed' }));
                setError(err.error || 'Failed to save.');
            }
        } finally { setSending(false); }
    };

    const updateStatus = async (id: number, status: string) => {
        await fetchWithAuth(`/api/maintenance/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        load();
    };

    const deleteWindow = async (id: number) => {
        if (!confirm('Delete this maintenance window?')) return;
        await fetchWithAuth(`/api/maintenance/${id}`, { method: 'DELETE' });
        load();
    };

    const sendMaintenanceMail = async (w: MaintenanceWindow) => {
        setSending(true);
        const subject = `Maintenance: ${w.title}`;
        const body = `Scheduled Maintenance Window\n\nTitle: ${w.title}\nStart: ${formatDt(w.start_time)}\nEnd: ${formatDt(w.end_time)}\nDuration: ${durationMinutes(w.start_time, w.end_time)}\n\n${w.description || ''}`;
        const res = await fetchWithAuth('/api/mail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to_user: '__broadcast__', subject, body, template_key: 'maintenance' }),
        }).catch(() => null);
        setSending(false);
        if (res?.ok) {
            setSuccess('Maintenance notification sent to all users.');
            setTimeout(() => setSuccess(''), 4000);
        }
    };

    const active = windows.filter(w => w.status === 'active');
    const scheduled = windows.filter(w => w.status === 'scheduled');
    const past = windows.filter(w => w.status === 'completed' || w.status === 'cancelled');

    return (
        <main className="max-w-300 mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-linear-to-br from-amber-500 to-orange-500 p-3 rounded-2xl shadow-lg shadow-amber-500/25">
                        <Wrench className="text-white" size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold bg-linear-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                            Maintenance
                        </h1>
                        <p className="text-sm text-slate-500">Schedule and manage maintenance windows</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={load} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors" disabled={loading}>
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={openNew}
                        className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-200 hover:scale-105"
                    >
                        <Plus size={16} strokeWidth={2.5} /> Schedule Maintenance
                    </button>
                </div>
            </div>

            {/* Notifications */}
            <AnimatePresence>
                {success && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="mb-4 flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
                        <CheckCircle size={16} /> {success}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Active banner */}
            {active.length > 0 && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3">
                    <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                        <p className="font-semibold text-amber-900 text-sm">Active Maintenance Window</p>
                        {active.map(w => (
                            <p key={w.id} className="text-amber-700 text-sm mt-0.5">
                                <strong>{w.title}</strong> — ends {formatDt(w.end_time)}
                            </p>
                        ))}
                    </div>
                </div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Active', count: active.length, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Scheduled', count: scheduled.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Completed', count: windows.filter(w => w.status === 'completed').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Total', count: windows.length, color: 'text-slate-600', bg: 'bg-slate-50' },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-white/60`}>
                        <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Lists */}
            {loading && windows.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-slate-400">
                    <RefreshCw size={20} className="animate-spin mr-2" /> Loading...
                </div>
            ) : windows.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                    <Wrench size={40} className="mb-3 opacity-20" />
                    <p className="font-medium">No maintenance windows scheduled</p>
                    <p className="text-sm mt-1">Click &quot;Schedule Maintenance&quot; to create one</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Active + Scheduled */}
                    {[...active, ...scheduled].length > 0 && (
                        <section>
                            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Upcoming & Active</h2>
                            <div className="space-y-3">
                                {[...active, ...scheduled].map(w => (
                                    <MaintenanceCard
                                        key={w.id}
                                        w={w}
                                        onEdit={() => openEdit(w)}
                                        onDelete={() => deleteWindow(w.id)}
                                        onStatusChange={(s) => updateStatus(w.id, s)}
                                        onNotify={() => sendMaintenanceMail(w)}
                                        sending={sending}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                    {/* Past */}
                    {past.length > 0 && (
                        <section>
                            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">History</h2>
                            <div className="space-y-3">
                                {past.slice(0, 20).map(w => (
                                    <MaintenanceCard
                                        key={w.id}
                                        w={w}
                                        onEdit={() => openEdit(w)}
                                        onDelete={() => deleteWindow(w.id)}
                                        onStatusChange={(s) => updateStatus(w.id, s)}
                                        onNotify={() => sendMaintenanceMail(w)}
                                        sending={sending}
                                        compact
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-slate-100">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Wrench size={18} className="text-amber-500" />
                                    {editItem ? 'Edit Maintenance Window' : 'Schedule Maintenance Window'}
                                </h2>
                                <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Template Picker */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Template</label>
                                    <div className="relative">
                                        <button
                                            onClick={() => setTemplateOpen(!templateOpen)}
                                            className="w-full flex items-center justify-between px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 hover:border-amber-300 transition-colors bg-slate-50 hover:bg-white"
                                        >
                                            <span>{MAINTENANCE_TEMPLATES.find(t => t.key === selectedTemplate)?.label || 'Select template'}</span>
                                            <ChevronDown size={15} className={`text-slate-400 transition-transform ${templateOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        <AnimatePresence>
                                            {templateOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                                    className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
                                                >
                                                    {MAINTENANCE_TEMPLATES.map(t => (
                                                        <button
                                                            key={t.key}
                                                            onClick={() => applyTemplate(t.key)}
                                                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-amber-50 transition-colors flex items-center justify-between ${selectedTemplate === t.key ? 'text-amber-700 bg-amber-50 font-semibold' : 'text-slate-700'}`}
                                                        >
                                                            {t.label}
                                                            {selectedTemplate === t.key && <Check size={14} className="text-amber-500" />}
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Title *</label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                        placeholder="e.g. Weekly security patches"
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                                    <textarea
                                        value={form.description}
                                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                        rows={4}
                                        placeholder="What will happen during this maintenance window?"
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300 resize-none"
                                    />
                                </div>

                                {/* Time range */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Start Time *</label>
                                        <input
                                            type="datetime-local"
                                            value={form.start_time}
                                            onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">End Time *</label>
                                        <input
                                            type="datetime-local"
                                            value={form.end_time}
                                            onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300"
                                        />
                                    </div>
                                </div>

                                {/* Affected machines */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Affected Machines</label>
                                    <input
                                        type="text"
                                        value={form.affected_machines}
                                        onChange={e => setForm(f => ({ ...f, affected_machines: e.target.value }))}
                                        placeholder="Comma-separated hostnames, or leave blank for all"
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300"
                                    />
                                </div>

                                {/* Notify toggle */}
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, notify_users: !f.notify_users }))}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.notify_users ? 'bg-amber-500' : 'bg-slate-200'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${form.notify_users ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">Email Notification</p>
                                        <p className="text-xs text-slate-500">Send maintenance notice to all users via email</p>
                                    </div>
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                                        <AlertTriangle size={14} /> {error}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
                                <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                    Cancel
                                </button>
                                <button
                                    onClick={submit}
                                    disabled={sending}
                                    className="flex items-center gap-2 px-5 py-2 bg-linear-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50"
                                >
                                    {sending ? <RefreshCw size={14} className="animate-spin" /> : <Calendar size={14} />}
                                    {editItem ? 'Update' : 'Schedule'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}

interface CardProps {
    w: MaintenanceWindow;
    onEdit: () => void;
    onDelete: () => void;
    onStatusChange: (status: string) => void;
    onNotify: () => void;
    sending: boolean;
    compact?: boolean;
}

function MaintenanceCard({ w, onEdit, onDelete, onStatusChange, onNotify, sending, compact }: CardProps) {
    const cfg = STATUS_CONFIG[w.status] || STATUS_CONFIG.scheduled;
    const Icon = cfg.icon;
    const isActive = w.status === 'active';
    const isScheduled = w.status === 'scheduled';
    const isPast = w.status === 'completed' || w.status === 'cancelled';

    return (
        <motion.div
            layout
            className={`bg-white border ${isActive ? 'border-amber-200 shadow-amber-100' : 'border-slate-200'} rounded-2xl shadow-sm overflow-hidden`}
        >
            {isActive && <div className="h-1 bg-linear-to-r from-amber-400 to-orange-400" />}
            {isScheduled && <div className="h-1 bg-linear-to-r from-blue-400 to-indigo-400" />}

            <div className={`flex items-start gap-4 ${compact ? 'p-4' : 'p-5'}`}>
                <div className={`shrink-0 p-2 rounded-xl ${cfg.color.replace('text-', 'text-').split(' ')[1] ? '' : ''} bg-slate-50`}>
                    <Icon size={compact ? 16 : 20} className={cfg.color.split(' ')[1]} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className={`font-semibold text-slate-800 truncate ${compact ? 'text-sm' : ''}`}>{w.title}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.color}`}>{cfg.label}</span>
                                {w.notify_users ? <Bell size={12} className="text-slate-400" /> : <BellOff size={12} className="text-slate-300" />}
                            </div>
                            {!compact && w.description && (
                                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{w.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
                                <span className="flex items-center gap-1">
                                    <Calendar size={11} /> {formatDt(w.start_time)}
                                </span>
                                <span>→ {formatDt(w.end_time)}</span>
                                <span className="text-slate-400">({durationMinutes(w.start_time, w.end_time)})</span>
                                {isScheduled && (
                                    <span className="text-blue-600 font-medium">in {timeUntil(w.start_time)}</span>
                                )}
                                <span className="text-slate-400">by {w.created_by}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                            {isScheduled && (
                                <>
                                    <button onClick={() => onStatusChange('active')}
                                        className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-medium transition-colors"
                                        title="Mark as Active">
                                        <Play size={12} /> Start
                                    </button>
                                    <button onClick={onNotify} disabled={sending}
                                        className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors" title="Send notification">
                                        <Bell size={14} />
                                    </button>
                                    <button onClick={onEdit} className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-lg transition-colors" title="Edit">
                                        <Edit3 size={14} />
                                    </button>
                                </>
                            )}
                            {isActive && (
                                <button onClick={() => onStatusChange('completed')}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-medium transition-colors"
                                    title="Mark as Completed">
                                    <Check size={12} /> Complete
                                </button>
                            )}
                            {!isPast && (
                                <button onClick={() => onStatusChange('cancelled')}
                                    className="p-1.5 hover:bg-slate-100 text-slate-300 hover:text-slate-500 rounded-lg transition-colors" title="Cancel">
                                    <Pause size={14} />
                                </button>
                            )}
                            <button onClick={onDelete} className="p-1.5 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors" title="Delete">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
