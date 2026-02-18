'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Eye, EyeOff, Loader2, AlertCircle, CheckCircle,
    Lock, User, Shield, CheckSquare
} from 'lucide-react';

function SetupForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const setupToken = searchParams.get('token') || '';

    const [form, setForm] = useState({ username: '', password: '', confirmPassword: '', token: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success' | 'already_done'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        // Check if setup is already done
        fetch('/api/auth/status')
            .then(r => r.json())
            .then(data => {
                if (!data.setup_required) setStatus('already_done');
            })
            .catch(() => { });
    }, []);

    const passwordStrength = (pw: string): { score: number; label: string; color: string } => {
        let score = 0;
        if (pw.length >= 8) score++;
        if (pw.length >= 12) score++;
        if (/[A-Z]/.test(pw)) score++;
        if (/[0-9]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;
        if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
        if (score <= 3) return { score, label: 'Fair', color: 'bg-amber-500' };
        return { score, label: 'Strong', color: 'bg-green-500' };
    };

    const strength = passwordStrength(form.password);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            setStatus('error');
            setErrorMsg('Passwords do not match');
            return;
        }
        if (form.password.length < 8) {
            setStatus('error');
            setErrorMsg('Password must be at least 8 characters');
            return;
        }
        const tokenToUse = setupToken || form.token;
        if (!tokenToUse) {
            setStatus('error');
            setErrorMsg('Missing setup token. Check the server console and paste the token.');
            return;
        }

        setStatus('loading');
        setErrorMsg('');

        try {
            const res = await fetch('/api/auth/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: form.username,
                    password: form.password,
                    setup_token: tokenToUse,
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                setStatus('error');
                setErrorMsg(data.error || 'Setup failed');
                return;
            }

            setStatus('success');
            setTimeout(() => router.replace('/login'), 2000);
        } catch {
            setStatus('error');
            setErrorMsg('Cannot reach server. Is SysTracker running?');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center mb-8"
                >
                    <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-2xl shadow-blue-500/40 mb-4">
                        <Zap size={32} fill="currentColor" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-white">SysTracker</h1>
                    <p className="text-slate-400 text-sm mt-1">First-Run Setup</p>
                </motion.div>

                {/* Already done state */}
                {status === 'already_done' ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center"
                    >
                        <CheckSquare size={40} className="text-green-400 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Setup Already Complete</h2>
                        <p className="text-slate-400 text-sm mb-6">An admin account already exists.</p>
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all cursor-pointer"
                        >
                            Go to Login
                        </Link>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <Shield size={18} className="text-blue-400" />
                            <h2 className="text-xl font-bold text-white">Create Admin Account</h2>
                        </div>
                        <p className="text-slate-400 text-sm mb-7">
                            This is a one-time setup. After this, the setup page will be permanently disabled.
                        </p>

                        {/* Token status */}
                        {!setupToken && (
                            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
                                <AlertCircle size={15} />
                                No setup token in URL. Check the server console for the setup link.
                            </div>
                        )}
                        {setupToken && (
                            <div className="mb-5 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm flex items-center gap-2">
                                <CheckCircle size={15} />
                                Valid setup token detected.
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Username */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Admin Username</label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="text"
                                        required
                                        value={form.username}
                                        onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                                        placeholder="admin"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Password</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={form.password}
                                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                        placeholder="Min. 8 characters"
                                        className="w-full pl-10 pr-11 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {/* Password strength bar */}
                                {form.password && (
                                    <div className="mt-2">
                                        <div className="flex gap-1 mb-1">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <div
                                                    key={i}
                                                    className={`h-1 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : 'bg-white/10'}`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-400">{strength.label} password</p>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Confirm Password</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="password"
                                        required
                                        value={form.confirmPassword}
                                        onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                                        placeholder="Repeat password"
                                        className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm ${form.confirmPassword && form.confirmPassword !== form.password
                                            ? 'border-red-500/50'
                                            : 'border-white/10'
                                            }`}
                                    />
                                </div>
                                {form.confirmPassword && form.confirmPassword !== form.password && (
                                    <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                                )}
                            </div>

                            {/* Error/Success */}
                            <AnimatePresence>
                                {status === 'error' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex items-center gap-2.5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
                                    >
                                        <AlertCircle size={16} className="flex-shrink-0" />
                                        {errorMsg}
                                    </motion.div>
                                )}
                                {status === 'success' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="flex items-center gap-2.5 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm"
                                    >
                                        <CheckCircle size={16} className="flex-shrink-0" />
                                        Account created! Redirecting to login...
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Token Input (Manual Fallback) */}
                            {!setupToken && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">Setup Token</label>
                                    <div className="relative">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                                            <Shield size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={form.token}
                                            onChange={e => setForm(f => ({ ...f, token: e.target.value }))}
                                            placeholder="Paste token from server console"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-mono"
                                        />
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={status === 'loading' || status === 'success' || (!setupToken && !form.token)}
                                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold shadow-xl shadow-blue-500/30 transition-all hover:-translate-y-0.5 cursor-pointer mt-2"
                            >
                                {status === 'loading' ? (
                                    <><Loader2 size={18} className="animate-spin" /> Creating account...</>
                                ) : status === 'success' ? (
                                    <><CheckCircle size={18} /> Done!</>
                                ) : (
                                    'Create Admin Account'
                                )}
                            </button>
                        </form>
                    </motion.div>
                )}

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center mt-6 text-slate-500 text-xs"
                >
                    Already have an account?{' '}
                    <Link href="/login" className="text-slate-400 hover:text-white transition-colors">
                        Sign in
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}

export default function SetupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-blue-400" />
            </div>
        }>
            <SetupForm />
        </Suspense>
    );
}
