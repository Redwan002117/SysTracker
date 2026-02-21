'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../../../lib/auth';
import { Mail, Send, Trash2, RefreshCw, Inbox, ChevronDown, ChevronUp, Search, Plus, Reply, X, User, Clock, Eye, AtSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MailMessage {
    id: number;
    from_user: string;
    to_user: string;
    subject: string;
    body: string;
    template_key?: string;
    is_read: number;
    folder: string;
    created_at: string;
}

interface MailUser {
    username: string;
    display_name?: string;
    avatar?: string;
}

const TEMPLATES: Record<string, { label: string; subject: string; body: string }> = {
    maintenance: {
        label: 'Maintenance Notice',
        subject: 'Scheduled Maintenance Window',
        body: 'Dear user,\n\nWe want to inform you that SysTracker will undergo scheduled maintenance.\n\nStart: [START_TIME]\nEnd: [END_TIME]\n\nDuring this window, the dashboard may be temporarily unavailable. We apologize for any inconvenience.\n\nRegards,\nSysTracker Admin',
    },
    machine_offline: {
        label: 'Machine Offline Alert',
        subject: 'Alert: Machine Has Gone Offline',
        body: 'Hello,\n\nThis is an automated alert to inform you that a machine under your account has gone offline.\n\nHostname: [HOSTNAME]\nLast Seen: [LAST_SEEN]\n\nPlease check the agent is running and the machine has internet connectivity.\n\nRegards,\nSysTracker Monitoring',
    },
    welcome: {
        label: 'Welcome Message',
        subject: 'Welcome to SysTracker!',
        body: 'Hi [USERNAME],\n\nWelcome to SysTracker — your real-time infrastructure monitoring solution.\n\nYour account has been created successfully. You can now:\n- Monitor connected machines\n- View real-time CPU, RAM, and Disk metrics\n- Manage alerts and notifications\n\nIf you have any questions, feel free to reach out.\n\nWelcome aboard!\nSysTracker Team',
    },
    alert_critical: {
        label: 'Critical Alert',
        subject: 'Critical System Alert',
        body: 'WARNING: A critical threshold has been detected on one of your monitored machines.\n\nMachine: [HOSTNAME]\nMetric: [METRIC]\nValue: [VALUE]%\n\nPlease investigate immediately to prevent service disruption.\n\nSysTracker Monitoring System',
    },
    custom: {
        label: 'Custom Message',
        subject: '',
        body: '',
    },
};

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function getInitials(name: string) {
    return name.slice(0, 2).toUpperCase();
}

export default function MailboxPage() {
    const [folder, setFolder] = useState<'inbox' | 'sent'>('inbox');
    const [messages, setMessages] = useState<MailMessage[]>([]);
    const [selected, setSelected] = useState<MailMessage | null>(null);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<MailUser[]>([]);
    const [search, setSearch] = useState('');
    const [composeOpen, setComposeOpen] = useState(false);
    const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
    const [form, setForm] = useState({ to_user: '', subject: '', body: '' });
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState('');
    const [recipientType, setRecipientType] = useState<'internal' | 'external'>('internal');
    const [showUserDropdown, setShowUserDropdown] = useState(false);

    const loadMessages = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchWithAuth(`/api/mail?folder=${folder}`);
            if (res.ok) setMessages(await res.json());
        } finally { setLoading(false); }
    }, [folder]);

    useEffect(() => { loadMessages(); }, [loadMessages]);

    useEffect(() => {
        fetchWithAuth('/api/mail-users').then(r => r.ok ? r.json() : []).then(setUsers).catch(() => {});
    }, []);

    const openMessage = async (msg: MailMessage) => {
        setSelected(msg);
        if (!msg.is_read && folder === 'inbox') {
            await fetchWithAuth(`/api/mail/${msg.id}`);
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: 1 } : m));
        }
    };

    const deleteMessage = async (id: number) => {
        await fetchWithAuth(`/api/mail/${id}`, { method: 'DELETE' });
        setMessages(prev => prev.filter(m => m.id !== id));
        if (selected?.id === id) setSelected(null);
    };

    const sendMail = async () => {
        if (!form.to_user || !form.subject || !form.body) { 
            setSendError('All fields are required.'); 
            return; 
        }
        
        // Validate email format if external
        if (recipientType === 'external' && !form.to_user.includes('@')) {
            setSendError('Please enter a valid email address');
            return;
        }
        
        setSending(true); 
        setSendError('');
        try {
            const res = await fetchWithAuth('/api/mail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                const result = await res.json();
                setComposeOpen(false);
                setForm({ to_user: '', subject: '', body: '' });
                setRecipientType('internal');
                if (folder === 'sent') loadMessages();
                // Show success message based on type
                console.log(`${result.type === 'external' ? 'External email' : 'Internal message'} sent successfully`);
            } else {
                const err = await res.json().catch(() => ({ error: 'Send failed' }));
                setSendError(err.error || 'Send failed');
            }
        } finally { setSending(false); }
    };

    const applyTemplate = (key: string) => {
        const t = TEMPLATES[key];
        setForm(f => ({ ...f, subject: t.subject || f.subject, body: t.body || f.body }));
        setTemplatePickerOpen(false);
    };

    const startReply = (msg: MailMessage) => {
        setForm({
            to_user: msg.from_user,
            subject: `Re: ${msg.subject}`,
            body: `\n\n--- Original message from ${msg.from_user} ---\n${msg.body}`,
        });
        setComposeOpen(true);
    };

    const filtered = messages.filter(m =>
        m.subject.toLowerCase().includes(search.toLowerCase()) ||
        m.from_user.toLowerCase().includes(search.toLowerCase()) ||
        m.to_user.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-2xl shadow-lg shadow-blue-500/25">
                        <Mail className="text-white" size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                            Mailbox
                            <span className="text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full font-semibold">Admin</span>
                        </h1>
                        <p className="text-sm text-slate-500">Internal messaging & external email system</p>
                    </div>
                </div>
                <button
                    onClick={() => { setComposeOpen(true); setForm({ to_user: '', subject: '', body: '' }); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 hover:scale-105"
                >
                    <Plus size={16} strokeWidth={2.5} /> Compose
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_420px] gap-4" style={{ height: 'calc(100vh - 200px)' }}>
                {/* Sidebar */}
                <div className="flex flex-col gap-1 p-3 overflow-hidden bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
                    <p className="text-xs font-semibold text-slate-400 uppercase px-2 mb-2">Folders</p>
                    {(['inbox', 'sent'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => { setFolder(f); setSelected(null); }}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${folder === f ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 scale-105' : 'text-slate-600 hover:bg-slate-100/60 hover:scale-[1.02]'}`}
                        >
                            {f === 'inbox' ? <Inbox size={16} strokeWidth={2.5} /> : <Send size={16} strokeWidth={2.5} />}
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}

                    <div className="mt-4 border-t border-slate-100 pt-3">
                        <p className="text-xs font-semibold text-slate-400 uppercase px-2 mb-2">Quick Templates</p>
                        {Object.entries(TEMPLATES).map(([key, t]) => (
                            <button
                                key={key}
                                onClick={() => { applyTemplate(key); setComposeOpen(true); }}
                                className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-500 hover:bg-slate-100/60 hover:text-slate-700 transition-colors truncate"
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Message list */}
                <div className="flex flex-col overflow-hidden bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
                    <div className="px-4 pt-4 pb-2 border-b border-slate-100/60 flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search messages..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50/80 border border-slate-200/60 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 hover:shadow-sm"
                            />
                        </div>
                        <button onClick={loadMessages} className="p-2 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 rounded-xl text-slate-400 hover:text-blue-500 transition-all duration-200 hover:scale-110" title="Refresh">
                            <RefreshCw size={15} strokeWidth={2.5} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100/60">
                        {loading && filtered.length === 0 && (
                            <div className="flex items-center justify-center h-32">
                                <RefreshCw size={20} className="text-blue-400 animate-spin" />
                            </div>
                        )}
                        {!loading && filtered.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                                <Inbox size={28} className="opacity-30 mb-2" />
                                <p className="text-sm">No messages</p>
                            </div>
                        )}
                        <AnimatePresence>
                            {filtered.map(msg => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    onClick={() => openMessage(msg)}
                                    className={`px-4 py-3 cursor-pointer hover:bg-blue-50/50 transition-all ${selected?.id === msg.id ? 'bg-blue-50/80' : ''}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${folder === 'inbox' ? 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white' : 'bg-gradient-to-br from-slate-400 to-slate-500 text-white'}`}>
                                            {getInitials(folder === 'inbox' ? msg.from_user : msg.to_user)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1">
                                                <p className={`text-sm truncate ${!msg.is_read && folder === 'inbox' ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                                    {folder === 'inbox' ? msg.from_user : msg.to_user}
                                                </p>
                                                <span className="text-xs text-slate-400 shrink-0">{timeAgo(msg.created_at)}</span>
                                            </div>
                                            <p className={`text-xs truncate mt-0.5 ${!msg.is_read && folder === 'inbox' ? 'text-slate-700 font-semibold' : 'text-slate-500'}`}>
                                                {msg.subject}
                                            </p>
                                        </div>
                                        {!msg.is_read && folder === 'inbox' && (
                                            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Preview pane */}
                <div className="flex flex-col overflow-hidden bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
                    {!selected ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-6 rounded-2xl mb-4">
                                <Eye size={40} className="text-blue-500 opacity-60" strokeWidth={2} />
                            </div>
                            <p className="text-sm font-medium">Select a message to preview</p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            <div className="px-5 pt-5 pb-4 border-b border-slate-100/60">
                                <div className="flex items-start justify-between gap-2">
                                    <h2 className="text-base font-bold text-slate-800 leading-snug">{selected.subject}</h2>
                                    <div className="flex gap-1 shrink-0">
                                        <button onClick={() => startReply(selected)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Reply">
                                            <Reply size={15} />
                                        </button>
                                        <button onClick={() => deleteMessage(selected.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-2 flex flex-col gap-1 text-xs text-slate-500">
                                    <div className="flex items-center gap-1.5">
                                        <User size={11} />
                                        <span><span className="font-medium">From:</span> {selected.from_user}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <User size={11} />
                                        <span><span className="font-medium">To:</span> {selected.to_user}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock size={11} />
                                        <span>{new Date(selected.created_at).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto px-5 py-4">
                                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{selected.body}</pre>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Compose drawer */}
            <AnimatePresence>
                {composeOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                        className="fixed bottom-6 right-6 w-[480px] z-50 flex flex-col bg-white/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.12)] max-h-[560px]"
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100/60 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
                            <h3 className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                                <Send size={14} className="text-blue-500" strokeWidth={2.5} /> New Message
                            </h3>
                            <button onClick={() => setComposeOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1 transition-all duration-200 hover:scale-110">
                                <X size={16} strokeWidth={2.5} />
                            </button>
                        </div>
                        <div className="flex flex-col gap-2 px-4 py-3 overflow-y-auto flex-1">
                            {/* Recipient Type Selector */}
                            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                                <button
                                    onClick={() => { setRecipientType('internal'); setForm(f => ({ ...f, to_user: '' })); }}
                                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${recipientType === 'internal' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <User size={13} strokeWidth={2.5} />
                                    Internal User
                                </button>
                                <button
                                    onClick={() => { setRecipientType('external'); setForm(f => ({ ...f, to_user: '' })); }}
                                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${recipientType === 'external' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <AtSign size={13} strokeWidth={2.5} />
                                    External Email
                                </button>
                            </div>

                            {/* Recipient Input */}
                            {recipientType === 'internal' ? (
                                <select
                                    value={form.to_user}
                                    onChange={e => setForm(f => ({ ...f, to_user: e.target.value }))}
                                    className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                                >
                                    <option value="">To: Select user...</option>
                                    {users.map(u => (
                                        <option key={u.username} value={u.username}>
                                            {u.display_name ? `${u.display_name} (${u.username})` : u.username}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="email"
                                    placeholder="To: Enter email address (e.g., user@example.com)"
                                    value={form.to_user}
                                    onChange={e => setForm(f => ({ ...f, to_user: e.target.value }))}
                                    className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-purple-400/30"
                                />
                            )}
                            
                            <input
                                type="text"
                                placeholder="Subject"
                                value={form.subject}
                                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                                className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                            />
                            <textarea
                                rows={8}
                                placeholder="Write your message..."
                                value={form.body}
                                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                                className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-blue-400/30 resize-none"
                            />

                            {/* Template picker */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setTemplatePickerOpen(v => !v)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors"
                                >
                                    <span>Use a template</span>
                                    {templatePickerOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                </button>
                                <AnimatePresence>
                                    {templatePickerOpen && (
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: 'auto' }}
                                            exit={{ height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="grid grid-cols-2 gap-1 px-2 pb-2">
                                                {Object.entries(TEMPLATES).map(([key, t]) => (
                                                    <button
                                                        key={key}
                                                        onClick={() => applyTemplate(key)}
                                                        className="text-left px-2.5 py-2 text-xs rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors"
                                                    >
                                                        {t.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {sendError && <p className="text-xs text-red-500">{sendError}</p>}
                        </div>
                        <div className="px-4 py-3 border-t border-slate-100/60">
                            <button
                                onClick={sendMail}
                                disabled={sending}
                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 transition-all duration-200 hover:scale-[1.02]"
                            >
                                {sending ? <RefreshCw size={14} strokeWidth={2.5} className="animate-spin" /> : <Send size={14} strokeWidth={2.5} />}
                                {sending ? 'Sending...' : 'Send Message'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
