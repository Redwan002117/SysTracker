'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, new_password: password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Reset failed');

            setMessage({ type: 'success', text: data.message });
            setTimeout(() => router.push('/login'), 2000);
        } catch (err: unknown) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Reset failed' });
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="text-center text-red-600">
                <p>Invalid link. Token missing.</p>
                <Link href="/login" className="text-blue-600 hover:underline mt-4 inline-block">Back to Login</Link>
            </div>
        );
    }

    return (
        <>
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-700 mb-4">
                    <Lock size={24} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>
                <p className="text-slate-500 mt-2">Enter your new secure password.</p>
            </div>

            {message && (
                <div className={`p-4 rounded-lg mb-6 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                    <input
                        type="password"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="••••••••"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                    <input
                        type="password"
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="••••••••"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-lg transition-all flex justify-center items-center gap-2"
                >
                    {loading ? 'Reseting...' : <><CheckCircle size={18} /> Reset Password</>}
                </button>
            </form>
        </>
    );
}

export default function ResetPassword() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8"
            >
                <Suspense fallback={<div>Loading...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </motion.div>
        </div>
    );
}
