'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchWithAuth } from '../../../lib/auth';
import { Mail, Save, Server, Shield, AlertCircle, CheckCircle, Send, Key, Copy, RefreshCw, Download, Upload, Package, ClipboardList, Filter, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuditLog {
    id: number;
    actor: string;
    action: string;
    target?: string;
    detail?: string;
    ip?: string;
    ts: string;
}

const ACTION_COLORS: Record<string, string> = {
    login: 'bg-emerald-100 text-emerald-700',
    logout: 'bg-slate-100 text-slate-600',
    user_created: 'bg-blue-100 text-blue-700',
    user_deleted: 'bg-red-100 text-red-700',
    role_changed: 'bg-violet-100 text-violet-700',
    user_updated: 'bg-indigo-100 text-indigo-700',
    mail_sent: 'bg-sky-100 text-sky-700',
};

function SettingsInner() {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<'general' | 'smtp' | 'agent' | 'logs'>(
        (searchParams?.get('tab') as 'general' | 'smtp' | 'agent' | 'logs') || 'general'
    );
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // API Key State
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);

    // SMTP State
    const [smtpForm, setSmtpForm] = useState({
        host: '',
        port: '587',
        user: '',
        password: '',
        secure: 'false',
        from: ''
    });

    // Agent Release State
    const [currentVersion, setCurrentVersion] = useState<string | null>(null);
    const [releaseDate, setReleaseDate] = useState<string | null>(null);
    const [releaseHash, setReleaseHash] = useState<string | null>(null);
    const [uploadingAgent, setUploadingAgent] = useState(false);
    const [agentFile, setAgentFile] = useState<File | null>(null);
    const [newVersion, setNewVersion] = useState('');

    // Logs State
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [logsFilter, setLogsFilter] = useState({ actor: '', action: '' });

    const loadAuditLogs = useCallback(async () => {
        setLogsLoading(true);
        try {
            const params = new URLSearchParams();
            if (logsFilter.actor) params.set('actor', logsFilter.actor);
            if (logsFilter.action) params.set('action', logsFilter.action);
            params.set('limit', '200');
            const res = await fetchWithAuth(`/api/audit-logs?${params}`);
            if (res.ok) setAuditLogs(await res.json());
        } finally { setLogsLoading(false); }
    }, [logsFilter]);

    useEffect(() => {
        if (activeTab === 'logs') loadAuditLogs();
    }, [activeTab, loadAuditLogs]);

    const exportLogsCSV = () => {
        const rows = [['ID', 'Actor', 'Action', 'Target', 'Detail', 'IP', 'Timestamp'], ...auditLogs.map(l => [l.id, l.actor, l.action, l.target || '', l.detail || '', l.ip || '', l.ts])];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `systracker-audit-${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
    };

    const getErrorMessage = (err: unknown) => (err instanceof Error ? err.message : 'Unknown error');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            // Load API Key
            const keyRes = await fetchWithAuth('/api/settings/general');
            const keyData = await keyRes.json();
            if (keyData.api_key) setApiKey(keyData.api_key);

            // Load SMTP
            const smtpRes = await fetchWithAuth('/api/settings/smtp');
            const smtpData = await smtpRes.json();
            if (smtpData.error) throw new Error(smtpData.error);

            setSmtpForm({
                host: smtpData.host,
                port: smtpData.port,
                user: smtpData.user,
                password: smtpData.has_password ? '********' : '',
                secure: String(smtpData.secure),
                from: smtpData.from
            });

            // Load Agent Version
            const agentRes = await fetchWithAuth('/api/settings/agent/version');
            const agentData = await agentRes.json();
            if (agentData.version) {
                setCurrentVersion(agentData.version);
                setReleaseDate(agentData.upload_date);
                setReleaseHash(agentData.file_hash);
            }
        } catch (err: unknown) {
            setMessage({ type: 'error', text: 'Failed to load settings: ' + getErrorMessage(err) });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSmtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetchWithAuth('/api/settings/smtp', {
                method: 'PUT',
                body: JSON.stringify(smtpForm)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setMessage({ type: 'success', text: 'SMTP Settings saved successfully!' });
        } catch (err: unknown) {
            setMessage({ type: 'error', text: getErrorMessage(err) });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveApiKey = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetchWithAuth('/api/settings/general', {
                method: 'PUT',
                body: JSON.stringify({ api_key: apiKey })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setMessage({ type: 'success', text: 'API Key updated successfully!' });
        } catch (err: unknown) {
            setMessage({ type: 'error', text: getErrorMessage(err) });
        } finally {
            setSaving(false);
        }
    };

    const handleTestSmtp = async () => {
        setTesting(true);
        setMessage(null);
        try {
            const res = await fetchWithAuth('/api/settings/smtp/test', {
                method: 'POST',
                body: JSON.stringify({ email: testEmail })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setMessage({ type: 'success', text: data.message });
        } catch (err: unknown) {
            setMessage({ type: 'error', text: getErrorMessage(err) });
        } finally {
            setTesting(false);
        }
    };

    const generateNewKey = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = 'sk_live_';
        for (let i = 0; i < 32; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setApiKey(result);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(apiKey);
        setMessage({ type: 'success', text: 'API Key copied to clipboard!' });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleAgentUpload = async () => {
        if (!agentFile || !newVersion) {
            setMessage({ type: 'error', text: 'Please select a file and enter a version number' });
            return;
        }

        // Validate semantic version format
        if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
            setMessage({ type: 'error', text: 'Version must be in format X.Y.Z (e.g., 2.9.0)' });
            return;
        }

        setUploadingAgent(true);
        setMessage(null);

        try {
            const formData = new FormData();
            formData.append('file', agentFile);
            formData.append('version', newVersion);

            const res = await fetchWithAuth('/api/settings/agent/upload', {
                method: 'POST',
                body: formData,
                headers: {} // Let browser set Content-Type for FormData
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setMessage({ type: 'success', text: `Agent v${newVersion} uploaded successfully! Hash: ${data.hash?.substring(0, 16)}...` });
            setAgentFile(null);
            setNewVersion('');
            setCurrentVersion(newVersion);
            setReleaseDate(new Date().toISOString());
            setReleaseHash(data.hash);
        } catch (err: unknown) {
            setMessage({ type: 'error', text: getErrorMessage(err) });
        } finally {
            setUploadingAgent(false);
        }
    };

    return (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Server className="text-blue-600" /> System Settings
                </h1>
                <p className="text-slate-500 mt-1">Configure global application settings.</p>
            </div>

            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg mb-6 flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
                >
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {message.text}
                </motion.div>
            )}

            {/* Tabs */}
            <div className="flex space-x-1 rounded-xl bg-slate-200/50 p-1 mb-6 w-fit">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'general' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                        }`}
                >
                    <Shield size={16} /> General & Security
                </button>
                <button
                    onClick={() => setActiveTab('smtp')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'smtp' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                        }`}
                >
                    <Mail size={16} /> SMTP Configuration
                </button>
                <button
                    onClick={() => setActiveTab('agent')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'agent' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                        }`}
                >
                    <Package size={16} /> Agent Management
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'logs' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                        }`}
                >
                    <ClipboardList size={16} /> Activity Logs
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'general' && (
                    <motion.div
                        key="general"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <Key size={18} className="text-slate-400" /> API Authentication
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">Manage the API Key used by Agents to authenticate with the server.</p>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Agent API Key</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type={showKey ? "text" : "password"}
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                            placeholder="YOUR_STATIC_API_KEY_HERE"
                                        />
                                        <Key className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                    </div>
                                    <button
                                        onClick={() => setShowKey(!showKey)}
                                        className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
                                        title={showKey ? "Hide" : "Show"}
                                    >
                                        {showKey ? "Hide" : "Show"}
                                    </button>
                                    <button
                                        onClick={copyToClipboard}
                                        className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
                                        title="Copy to Clipboard"
                                    >
                                        <Copy size={18} />
                                    </button>
                                    <button
                                        onClick={generateNewKey}
                                        className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
                                        title="Generate New Key"
                                    >
                                        <RefreshCw size={18} />
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Warning: Changing this key will disconnect all agents until they are updated with the new key.
                                </p>
                            </div>
                            <div className="flex justify-end pt-4 border-t border-slate-100">
                                <button
                                    onClick={handleSaveApiKey}
                                    disabled={saving || loading}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'smtp' && (
                    <motion.div
                        key="smtp"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <Mail size={18} className="text-slate-400" /> SMTP Configuration
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">Configure email server settings for notifications and password resets.</p>
                        </div>

                        <form onSubmit={handleSaveSmtp} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">SMTP Host</label>
                                    <input
                                        type="text"
                                        value={smtpForm.host}
                                        onChange={e => setSmtpForm({ ...smtpForm, host: e.target.value })}
                                        placeholder="smtp.example.com"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Port</label>
                                    <input
                                        type="number"
                                        value={smtpForm.port}
                                        onChange={e => setSmtpForm({ ...smtpForm, port: e.target.value })}
                                        placeholder="587"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                                    <input
                                        type="text"
                                        value={smtpForm.user}
                                        onChange={e => setSmtpForm({ ...smtpForm, user: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                    <input
                                        type="password"
                                        value={smtpForm.password}
                                        onChange={e => setSmtpForm({ ...smtpForm, password: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Encryption (Secure)</label>
                                    <select
                                        value={smtpForm.secure}
                                        onChange={e => setSmtpForm({ ...smtpForm, secure: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="false">false (TLS - Port 587)</option>
                                        <option value="true">true (SSL - Port 465)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">From Email</label>
                                    <input
                                        type="text"
                                        value={smtpForm.from}
                                        onChange={e => setSmtpForm({ ...smtpForm, from: e.target.value })}
                                        placeholder='"SysTracker" <no-reply@example.com>'
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-100 italic">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Diagnostic Tool</h4>
                                <div className="flex flex-col sm:flex-row gap-3 items-end">
                                    <div className="flex-1 w-full">
                                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Test Recipient</label>
                                        <input
                                            type="email"
                                            value={testEmail}
                                            onChange={e => setTestEmail(e.target.value)}
                                            placeholder="Enter recipient email..."
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleTestSmtp}
                                        disabled={testing || loading}
                                        className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {testing ? 'Sending...' : <><Send size={14} /> Send Test</>}
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2">
                                    Specify a recipient to verify connection. SMTP settings must be <strong>saved</strong> before testing.
                                </p>
                            </div>

                            <div className="flex items-center justify-end pt-6 border-t border-slate-100 mt-6">
                                <button
                                    type="submit"
                                    disabled={saving || loading}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : <><Save size={18} /> Save Settings</>}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}

                {activeTab === 'agent' && (
                    <motion.div
                        key="agent"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <Package size={18} className="text-slate-400" /> Agent Auto-Updater
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">
                                Manage agent releases. Connected agents will automatically update to the latest version.
                            </p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Current Version Display */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Currently Distributed Version</p>
                                        {currentVersion ? (
                                            <>
                                                <p className="text-3xl font-bold text-slate-800 mb-1">v{currentVersion}</p>
                                                <p className="text-sm text-slate-500 mb-3">
                                                    Uploaded {releaseDate ? new Date(releaseDate).toLocaleDateString('en-US', { 
                                                        month: 'long', 
                                                        day: 'numeric', 
                                                        year: 'numeric' 
                                                    }) : 'Unknown'}
                                                </p>
                                                {releaseHash && (
                                                    <div className="flex items-center gap-2">
                                                        <div className="bg-white/80 rounded-lg px-3 py-1.5 border border-blue-200">
                                                            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-0.5">SHA256 Hash</p>
                                                            <p className="text-xs font-mono text-slate-700">{releaseHash.substring(0, 16)}...{releaseHash.substring(releaseHash.length - 8)}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(releaseHash);
                                                                setMessage({ type: 'success', text: 'Hash copied to clipboard!' });
                                                                setTimeout(() => setMessage(null), 2000);
                                                            }}
                                                            className="p-2 bg-white/80 hover:bg-white rounded-lg border border-blue-200 text-blue-600 transition-colors"
                                                            title="Copy full hash"
                                                        >
                                                            <Copy size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <p className="text-slate-500">No agent release uploaded yet</p>
                                        )}
                                    </div>
                                    <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-sm">
                                        <Download className="text-blue-600" size={24} />
                                    </div>
                                </div>
                            </div>

                            {/* Upload New Release */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-700 mb-4">Upload New Agent Release</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Agent Executable File (.exe)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept=".exe"
                                                onChange={(e) => setAgentFile(e.target.files?.[0] || null)}
                                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 transition-colors"
                                            />
                                        </div>
                                        {agentFile && (
                                            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                                <CheckCircle size={12} className="text-green-600" />
                                                Selected: {agentFile.name} ({(agentFile.size / 1024 / 1024).toFixed(2)} MB)
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Semantic Version Number
                                        </label>
                                        <input
                                            type="text"
                                            value={newVersion}
                                            onChange={(e) => setNewVersion(e.target.value)}
                                            placeholder="2.9.0"
                                            pattern="\d+\.\d+\.\d+"
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">
                                            Format: X.Y.Z (e.g., 2.9.0). Agents will automatically update if their version is lower.
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleAgentUpload}
                                        disabled={uploadingAgent || !agentFile || !newVersion}
                                        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
                                    >
                                        {uploadingAgent ? (
                                            <>
                                                <RefreshCw size={18} className="animate-spin" />
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={18} />
                                                Upload Agent Release
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Info Box */}
                            <div className="space-y-4">
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                                    <div className="flex gap-3">
                                        <CheckCircle size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-emerald-900 mb-1">Built-in Safety Mechanisms</p>
                                            <ul className="text-xs text-emerald-800 space-y-1">
                                                <li>• <strong>SHA256 Hash Verification</strong> - Every download is verified for integrity</li>
                                                <li>• <strong>Automatic Backup</strong> - Old version is saved before updating</li>
                                                <li>• <strong>Smart Rollback</strong> - Auto-restores if new version fails to start</li>
                                                <li>• <strong>File Size Check</strong> - Ensures complete download before installing</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <div className="flex gap-3">
                                        <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-amber-900 mb-1">How Auto-Updates Work</p>
                                            <ul className="text-xs text-amber-800 space-y-1">
                                                <li>• Agents check for updates every 60 minutes</li>
                                                <li>• If a newer version is available, the agent downloads and verifies it</li>
                                                <li>• Update installs automatically with backup/rollback protection</li>
                                                <li>• No remote desktop session or manual intervention required</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
                {activeTab === 'logs' && (
                    <motion.div
                        key="logs"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                    <ClipboardList size={18} className="text-slate-400" /> Activity Logs
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">User & system activity for the last 45 days. Older entries are purged automatically.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={loadAuditLogs} disabled={logsLoading} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500" title="Refresh"><RefreshCw size={16} className={logsLoading ? 'animate-spin' : ''} /></button>
                                <button onClick={exportLogsCSV} disabled={auditLogs.length === 0} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors disabled:opacity-50">
                                    <Download size={15} /> Export CSV
                                </button>
                            </div>
                        </div>
                        {/* Filters */}
                        <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                            <Filter size={14} className="text-slate-400" />
                            <input type="text" placeholder="Filter by actor..." value={logsFilter.actor} onChange={e => setLogsFilter({...logsFilter, actor: e.target.value})} className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400/40 w-40" />
                            <select value={logsFilter.action} onChange={e => setLogsFilter({...logsFilter, action: e.target.value})} className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none bg-white focus:ring-2 focus:ring-blue-400/40">
                                <option value="">All actions</option>
                                <option value="login">login</option>
                                <option value="logout">logout</option>
                                <option value="user_created">user_created</option>
                                <option value="user_deleted">user_deleted</option>
                                <option value="role_changed">role_changed</option>
                                <option value="user_updated">user_updated</option>
                                <option value="mail_sent">mail_sent</option>
                            </select>
                            <button onClick={loadAuditLogs} className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">Apply</button>
                            {(logsFilter.actor || logsFilter.action) && (
                                <button onClick={() => setLogsFilter({ actor: '', action: '' })} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            {logsLoading ? (
                                <div className="flex items-center justify-center py-12"><RefreshCw size={20} className="text-blue-400 animate-spin" /></div>
                            ) : auditLogs.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <ClipboardList size={32} className="mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No audit logs found</p>
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="border-b border-slate-100">
                                        <tr>
                                            {['Actor', 'Action', 'Target', 'Detail', 'IP', 'Time'].map(h => (
                                                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {auditLogs.map(log => (
                                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-2.5 font-medium text-slate-800">{log.actor}</td>
                                                <td className="px-4 py-2.5">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-600'}`}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-600 max-w-[120px] truncate">{log.target || '—'}</td>
                                                <td className="px-4 py-2.5 text-slate-500 max-w-[160px] truncate text-xs">{log.detail || '—'}</td>
                                                <td className="px-4 py-2.5 text-slate-400 font-mono text-xs">{log.ip || '—'}</td>
                                                <td className="px-4 py-2.5 text-slate-400 text-xs whitespace-nowrap">{new Date(log.ts).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}

export default function Settings() {
    return (
        <Suspense fallback={<div className="max-w-4xl mx-auto px-4 pt-24 text-slate-500">Loading...</div>}>
            <SettingsInner />
        </Suspense>
    );
}
