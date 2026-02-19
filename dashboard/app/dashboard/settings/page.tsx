'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../../lib/auth';
import { Mail, Save, Server, Shield, User, AlertCircle, CheckCircle, Send, Key, Copy, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Settings() {
    const [activeTab, setActiveTab] = useState<'general' | 'smtp'>('general');
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
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Failed to load settings: ' + err.message });
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
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
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
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
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
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
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
            </AnimatePresence>
        </main>
    );
}
