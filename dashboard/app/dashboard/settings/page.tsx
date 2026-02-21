'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../../lib/auth';
import { Mail, Save, Server, Shield, AlertCircle, CheckCircle, Send, Key, Copy, RefreshCw, Download, Upload, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Settings() {
    const [activeTab, setActiveTab] = useState<'general' | 'smtp' | 'agent'>('general');
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
            </AnimatePresence>
        </main>
    );
}
