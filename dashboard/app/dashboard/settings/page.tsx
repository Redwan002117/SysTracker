'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../../components/Navbar';
import AuthGuard from '../../../components/AuthGuard';
import { fetchWithAuth } from '../../../lib/auth';
import { Mail, Save, Server, Shield, User, AlertCircle, CheckCircle, Send } from 'lucide-react';

export default function Settings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [form, setForm] = useState({
        host: '',
        port: '587',
        user: '',
        password: '',
        secure: 'false',
        from: ''
    });

    useEffect(() => {
        fetchWithAuth('/api/settings/smtp')
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);
                setForm({
                    host: data.host,
                    port: data.port,
                    user: data.user,
                    password: data.has_password ? '********' : '',
                    secure: String(data.secure),
                    from: data.from
                });
                setLoading(false);
            })
            .catch(err => {
                setMessage({ type: 'error', text: 'Failed to load settings: ' + err.message });
                setLoading(false);
            });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetchWithAuth('/api/settings/smtp', {
                method: 'PUT',
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setMessage({ type: 'success', text: 'Settings saved successfully!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        setTesting(true);
        setMessage(null);
        try {
            const res = await fetchWithAuth('/api/settings/smtp/test', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setMessage({ type: 'success', text: data.message });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setTesting(false);
        }
    };

    return (
        <AuthGuard>
            <div className="min-h-screen bg-slate-50/50">
                <Navbar />
                <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Server className="text-blue-600" /> System Settings
                        </h1>
                        <p className="text-slate-500 mt-1">Configure global application settings.</p>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-lg mb-6 flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            {message.text}
                        </div>
                    )}

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <Mail size={18} className="text-slate-400" /> SMTP Configuration
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">Configure email server settings for notifications and password resets.</p>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">SMTP Host</label>
                                    <input
                                        type="text"
                                        value={form.host}
                                        onChange={e => setForm({ ...form, host: e.target.value })}
                                        placeholder="smtp.example.com"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Port</label>
                                    <input
                                        type="number"
                                        value={form.port}
                                        onChange={e => setForm({ ...form, port: e.target.value })}
                                        placeholder="587"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                                    <input
                                        type="text"
                                        value={form.user}
                                        onChange={e => setForm({ ...form, user: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                    <input
                                        type="password"
                                        value={form.password}
                                        onChange={e => setForm({ ...form, password: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Encryption (Secure)</label>
                                    <select
                                        value={form.secure}
                                        onChange={e => setForm({ ...form, secure: e.target.value })}
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
                                        value={form.from}
                                        onChange={e => setForm({ ...form, from: e.target.value })}
                                        placeholder='"SysTracker" <no-reply@example.com>'
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                                <button
                                    type="button"
                                    onClick={handleTest}
                                    disabled={testing || loading}
                                    className="px-4 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {testing ? 'Sending...' : <><Send size={18} /> Test Connection</>}
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving || loading}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : <><Save size={18} /> Save Settings</>}
                                </button>
                            </div>
                        </form>
                    </div>

                </main>
            </div>
        </AuthGuard>
    );
}
