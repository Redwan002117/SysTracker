'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, Loader2, AlertCircle, CheckCircle, User, Info } from 'lucide-react';
import { setToken } from '../../lib/auth';

function SetupUsernameForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Get URL params once during initialization
    const urlToken = searchParams.get('token');
    const urlEmail = searchParams.get('email') || '';
    const urlName = searchParams.get('name') || '';

    // Initialize suggested username from email or name
    const suggestedUsername = urlEmail 
        ? urlEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '')
        : urlName 
            ? urlName.toLowerCase().replace(/[^a-z0-9_-]/g, '')
            : '';

    const [username, setUsername] = useState(suggestedUsername);
    const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    // Check if token exists, redirect if not
    useEffect(() => {
        if (!urlToken) {
            router.replace('/login');
        }
    }, [urlToken, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!username.trim()) {
            setStatus('error');
            setErrorMsg('Please enter a username');
            return;
        }

        // Validate username format
        const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
        if (!usernameRegex.test(username)) {
            setStatus('error');
            setErrorMsg('Username must be 3-30 characters and contain only letters, numbers, underscores, or hyphens');
            return;
        }

        setStatus('loading');
        setErrorMsg('');

        try {
            const res = await fetch('/api/auth/set-username', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${urlToken}`
                },
                body: JSON.stringify({ username: username.trim() }),
            });
            
            const data = await res.json();

            if (!res.ok) {
                setStatus('error');
                setErrorMsg(data.error || 'Failed to set username');
                return;
            }

            // Save new token with updated username
            setToken(data.token, data.username, 'admin');
            setStatus('success');
            
            // Redirect to dashboard after short delay
            setTimeout(() => {
                router.replace('/dashboard?welcome=true');
            }, 1500);
        } catch {
            setStatus('error');
            setErrorMsg('Cannot reach server. Please try again.');
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
                    className="flex flex-col items-center mb-10"
                >
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-4 rounded-2xl shadow-2xl shadow-blue-500/50 mb-5 ring-4 ring-white/20">
                        <Zap size={36} fill="currentColor" strokeWidth={2} />
                    </div>
                    <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">Welcome to SysTracker!</h1>
                    <p className="text-slate-400 text-sm mt-2 font-medium">One more step to get started</p>
                </motion.div>

                {/* Setup card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-10 shadow-[0_24px_48px_rgba(0,0,0,0.3)]"
                >
                    <h2 className="text-2xl font-bold text-white mb-2">Choose Your Username</h2>
                    <p className="text-slate-400 text-sm mb-7">
                        You&apos;ll use this to sign in to SysTracker. Choose something you&apos;ll remember!
                    </p>

                    {/* Info banner */}
                    <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-start gap-3">
                        <Info size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-300">
                            <p className="font-semibold mb-1">Your account details:</p>
                            <p className="text-blue-400/80">Email: {urlEmail}</p>
                            {urlName && <p className="text-blue-400/80">Name: {urlName}</p>}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Username */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                                Username <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    placeholder="john_doe"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                    disabled={status === 'loading' || status === 'success'}
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1.5">
                                3-30 characters • Letters, numbers, underscores, or hyphens
                            </p>
                        </div>

                        {/* Error/Success message */}
                        {status === 'error' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
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
                                Username set successfully! Redirecting...
                            </motion.div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={status === 'loading' || status === 'success'}
                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold shadow-xl shadow-blue-500/30 transition-all hover:-translate-y-0.5 cursor-pointer mt-6"
                        >
                            {status === 'loading' ? (
                                <><Loader2 size={18} className="animate-spin" /> Setting username...</>
                            ) : status === 'success' ? (
                                <><CheckCircle size={18} /> Done!</>
                            ) : (
                                'Continue to Dashboard'
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
                    Secure sign-in powered by Google OAuth
                </motion.div>
            </div>
        </div>
    );
}

export default function SetupUsernamePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-blue-400" />
            </div>
        }>
            <SetupUsernameForm />
        </Suspense>
    );
}
