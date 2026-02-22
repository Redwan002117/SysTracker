'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, Lock, User, Shield } from 'lucide-react';
import { setToken, isAuthenticated } from '../../lib/auth';

// Google Icon Component
function GoogleIcon({ size = 18 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
    );
}

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [form, setForm] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [setupRequired, setSetupRequired] = useState(false);
    const [oauthRequired, setOauthRequired] = useState(false);
    const [googleOAuthEnabled, setGoogleOAuthEnabled] = useState(false);

    // Check if already logged in or setup needed, and handle OAuth callback
    useEffect(() => {
        // Handle OAuth callback with token in URL
        const token = searchParams.get('token');
        const username = searchParams.get('username');
        const role = searchParams.get('role');
        const firstLogin = searchParams.get('first_login');
        
        if (token && username && role) {
            setToken(token, username, role);
            setStatus('success');
            
            // Clean URL
            window.history.replaceState({}, '', '/login');
            
            const returnTo = searchParams.get('returnTo');
            const dest = returnTo && returnTo.startsWith('/dashboard') ? returnTo : '/dashboard';
            if (firstLogin) {
                setTimeout(() => router.replace(`${dest}?welcome=true`), 600);
            } else {
                setTimeout(() => router.replace(dest), 600);
            }
            return;
        }

        // Handle OAuth errors
        const error = searchParams.get('error');
        if (error) {
            setStatus('error');
            const errorMessages: Record<string, string> = {
                'oauth_not_configured': 'Google Sign-In is not configured on this server.',
                'oauth_failed': 'Google Sign-In failed. Please try again.',
                'no_email': 'No email address found in your Google account.',
                'database_error': 'Database error. Please try again later.',
                'user_creation_failed': 'Failed to create user account. Please try again.',
                'processing_failed': 'Failed to process authentication. Please try again.'
            };
            setErrorMsg(errorMessages[error] || 'Authentication error occurred.');
            
            // Clean URL
            window.history.replaceState({}, '', '/login');
            return;
        }

        // Check if already logged in
        if (isAuthenticated()) {
            const returnTo = searchParams.get('returnTo');
            const dest = returnTo && returnTo.startsWith('/dashboard') ? returnTo : '/dashboard';
            router.replace(dest);
            return;
        }
        
        // Check setup status
        fetch('/api/auth/status')
            .then(r => r.json())
            .then(data => {
                if (data.setup_required) {
                    setSetupRequired(true);
                    // Auto-redirect to setup wizard
                    router.replace('/setup');
                }
            })
            .catch(() => { });
        
        // Check if Google OAuth is enabled
        fetch('/api/auth/oauth-status')
            .then(r => r.json())
            .then(data => {
                setGoogleOAuthEnabled(data.google_oauth_enabled || false);
            })
            .catch(() => {
                setGoogleOAuthEnabled(false);
            });
    }, [router, searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMsg('');
        setOauthRequired(false);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();

            if (!res.ok) {
                setStatus('error');
                if (data.oauth_required) {
                    setOauthRequired(true);
                    setErrorMsg(data.error || 'This account requires Google Sign-In.');
                } else {
                    setErrorMsg(data.error || 'Login failed');
                }
                return;
            }

            setToken(data.token, data.username, data.role);
            setStatus('success');
            const returnTo = searchParams.get('returnTo');
            const dest = returnTo && returnTo.startsWith('/dashboard') ? returnTo : '/dashboard';
            setTimeout(() => router.replace(dest), 600);
        } catch {
            setStatus('error');
            setErrorMsg('Cannot reach server. Is SysTracker running?');
        }
    };

    const handleGoogleSignIn = () => {
        // Redirect to Google OAuth endpoint, preserving returnTo so the
        // server can append it after successful OAuth callback
        const returnTo = searchParams.get('returnTo');
        const url = returnTo ? `/api/auth/google?returnTo=${encodeURIComponent(returnTo)}` : '/api/auth/google';
        window.location.href = url;
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4 relative overflow-hidden">
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
                    <div className="bg-linear-to-br from-blue-500 to-purple-600 text-white p-4 rounded-2xl shadow-2xl shadow-blue-500/50 mb-5 ring-4 ring-white/20">
                        <Zap size={36} fill="currentColor" strokeWidth={2} />
                    </div>
                    <h1 className="text-3xl font-extrabold bg-linear-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">SysTracker</h1>
                    <p className="text-slate-400 text-sm mt-2 font-medium">Admin Dashboard</p>
                </motion.div>

                {/* Setup required banner */}
                <AnimatePresence>
                    {setupRequired && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3"
                        >
                            <Shield size={18} className="text-amber-400 shrink-0 mt-0.5" />
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
                    className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-10 shadow-[0_24px_48px_rgba(0,0,0,0.3)] hover:shadow-[0_32px_64px_rgba(0,0,0,0.4)] transition-all duration-300"
                >
                    <h2 className="text-2xl font-bold text-white mb-2">Sign in</h2>
                    <p className="text-slate-400 text-sm mb-7">Enter your admin credentials to continue</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Username or Email */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Username or Email</label>
                            <div className="relative">
                                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    required
                                    autoComplete="username"
                                    value={form.username}
                                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                                    placeholder="admin or admin@example.com"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-sm font-semibold text-slate-300">Password</label>
                                <Link
                                    href="/login/forgot-password"
                                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>
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
                                    <AlertCircle size={16} className="shrink-0" />
                                    <div>
                                        {errorMsg}
                                        {oauthRequired && googleOAuthEnabled && (
                                            <button
                                                onClick={handleGoogleSignIn}
                                                className="block mt-1 text-xs underline hover:text-red-300"
                                            >
                                                Click here to sign in with Google
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                            {status === 'success' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="flex items-center gap-2.5 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm"
                                >
                                    <CheckCircle size={16} className="shrink-0" />
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

                        {/* Divider - Only show if OAuth enabled */}
                        {googleOAuthEnabled && (
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/10"></div>
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="bg-white/10 px-3 py-1 rounded-full text-slate-400 backdrop-blur-sm">or continue with</span>
                                </div>
                            </div>
                        )}

                        {/* Google Sign-In Button - Only show if OAuth enabled */}
                        {googleOAuthEnabled && (
                            <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={status === 'loading' || status === 'success'}
                                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-60 text-gray-700 font-semibold shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer border border-gray-200"
                            >
                                <GoogleIcon size={20} />
                                Sign in with Google
                            </button>
                        )}
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
                    <Link href="https://systracker.rico.bd/" className="text-slate-400 hover:text-white transition-colors">
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
