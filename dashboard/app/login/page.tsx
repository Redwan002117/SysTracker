'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, Lock, User, Shield } from 'lucide-react';
import { setToken, isAuthenticated } from '../../lib/auth';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [form, setForm] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [setupRequired, setSetupRequired] = useState(false);

    // Check if already logged in or setup needed
    useEffect(() => {
        if (isAuthenticated()) {
            router.replace('/dashboard');
            return;
        }
        fetch('/api/auth/status')
            .then(r => r.json())
            .then(data => {
                if (data.setup_required) setSetupRequired(true);
            })
            .catch(() => { });
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMsg('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();

            if (!res.ok) {
                setStatus('error');
                setErrorMsg(data.error || 'Login failed');
                return;
            }

            setToken(data.token, data.username);
            setStatus('success');
            setTimeout(() => router.replace('/dashboard'), 600);
        } catch {
            setStatus('error');
            setErrorMsg('Cannot reach server. Is SysTracker running?');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />
            </div>

            {/* Grid pattern overlay */}
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
                    <p className="text-slate-400 text-sm mt-1">Admin Dashboard</p>
                </motion.div>

                {/* Setup required banner */}
                <AnimatePresence>
                    {setupRequired && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3"
                        >
                            <Shield size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-amber-300 text-sm font-semibold">First-time setup required</p>
                                <p className="text-amber-400/80 text-xs mt-0.5">
                                    No admin account found. Check the server console for the setup link.{' '}
                                    <Link href="/setup" className="underline text-amber-300 hover:text-white transition-colors">
                                        Go to Setup →
                                    </Link>
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Login card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
                >
                    <h2 className="text-xl font-bold text-white mb-1">Sign in</h2>
                    <p className="text-slate-400 text-sm mb-7">Enter your admin credentials to continue</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Username */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Username</label>
                            <div className="relative">
                                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    required
                                    autoComplete="username"
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
                                    autoComplete="current-password"
                                    value={form.password}
                                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                    placeholder="••••••••"
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
                        </div>

                        {/* Error message */}
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
                                    Login successful! Redirecting...
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={status === 'loading' || status === 'success'}
                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold shadow-xl shadow-blue-500/30 transition-all hover:-translate-y-0.5 cursor-pointer mt-2"
                        >
                            {status === 'loading' ? (
                                <><Loader2 size={18} className="animate-spin" /> Signing in...</>
                            ) : status === 'success' ? (
                                <><CheckCircle size={18} /> Signed in!</>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>
                </motion.div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center mt-6 text-slate-500 text-xs"
                >
                    Self-hosted · All data stays on your server ·{' '}
                    <Link href="/" className="text-slate-400 hover:text-white transition-colors">
                        Back to home
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-blue-400" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
