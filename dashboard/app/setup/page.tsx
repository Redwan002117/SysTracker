'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, CheckCircle, Lock, User, Mail, Sparkles, ArrowRight } from 'lucide-react';
import { isAuthenticated } from '../../lib/auth';

function SetupForm() {
    const router = useRouter();
    const [form, setForm] = useState({
        username: 'admin',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [checking, setChecking] = useState(true);

    // Initial check: if already setup or logged in, redirect
    useEffect(() => {
        if (isAuthenticated()) {
            router.replace('/dashboard');
            return;
        }

        fetch('/api/auth/status')
            .then(r => r.json())
            .then(data => {
                if (!data.setup_required) {
                    router.replace('/login');
                } else {
                    setChecking(false);
                }
            })
            .catch(() => {
                setChecking(false); // Likely error, but let UI handle setup attempt
            });
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (form.password !== form.confirmPassword) {
            setErrorMsg("Passwords do not match");
            setStatus('error');
            return;
        }

        if (form.password.length < 8) {
            setErrorMsg("Password must be at least 8 characters");
            setStatus('error');
            return;
        }

        setStatus('loading');
        setErrorMsg('');

        try {
            const res = await fetch('/api/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: form.username,
                    email: form.email,
                    password: form.password
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
            setErrorMsg('Connection error. Is the server running?');
        }
    };

    if (checking) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden font-sans">
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-linear-to-tr from-indigo-900/20 via-slate-950 to-blue-900/20" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-20" />

            <div className="relative z-10 w-full max-w-lg">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center p-4 bg-blue-600/20 rounded-full mb-6 border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                            <Sparkles size={32} className="text-blue-400" />
                        </div>
                        <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Welcome to SysTracker</h1>
                        <p className="text-slate-400 text-lg">Let&apos;s create your admin account to get started.</p>
                    </div>

                    {/* Card */}
                    <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                        {/* Glow effect */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/30 transition-all duration-700" />

                        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">

                            <div className="grid grid-cols-2 gap-4">
                                {/* Username */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300 ml-1">Username</label>
                                    <div className="relative group/input">
                                        <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-blue-400 transition-colors" />
                                        <input
                                            type="text"
                                            required
                                            value={form.username}
                                            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                            placeholder="admin"
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300 ml-1">Email</label>
                                    <div className="relative group/input">
                                        <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-blue-400 transition-colors" />
                                        <input
                                            type="email"
                                            required
                                            value={form.email}
                                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                            placeholder="admin@example.com"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
                                <div className="relative group/input">
                                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-blue-400 transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        value={form.password}
                                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300 ml-1">Confirm Password</label>
                                <div className="relative group/input">
                                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-blue-400 transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        value={form.confirmPassword}
                                        onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {/* Status Messages */}
                            <AnimatePresence mode='wait'>
                                {status === 'error' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-red-500/10 border border-red-500/20 text-red-200 text-sm p-4 rounded-xl flex items-center gap-3 overflow-hidden"
                                    >
                                        <AlertCircle size={20} className="shrink-0 text-red-400" />
                                        {errorMsg}
                                    </motion.div>
                                )}
                                {status === 'success' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="bg-green-500/10 border border-green-500/20 text-green-200 text-sm p-4 rounded-xl flex items-center gap-3 overflow-hidden"
                                    >
                                        <CheckCircle size={20} className="shrink-0 text-green-400" />
                                        <div>
                                            <p className="font-semibold text-green-300">Account created successfully!</p>
                                            <p className="text-green-400/80 text-xs mt-0.5">Redirecting to login...</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                type="submit"
                                disabled={status === 'loading' || status === 'success'}
                                className="w-full group relative flex items-center justify-center gap-2 py-4 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:-translate-y-0.5 disabled:opacity-70 disabled:pointer-events-none overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                                {status === 'loading' ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <>
                                        Complete Setup
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <p className="text-center mt-8 text-slate-500 text-sm">
                        SysTracker v2.5.5-setup
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

export default function SetupPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
            <SetupForm />
        </Suspense>
    );
}
