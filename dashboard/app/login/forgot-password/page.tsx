'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Request failed');
            setMessage({ type: 'success', text: data.message });
        } catch (err: unknown) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Request failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-4">
                        <Mail size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Forgot Password?</h1>
                    <p className="text-slate-500 mt-2">Enter your email to receive a reset link.</p>
                </div>

                {message && (
                    <div className={`p-4 rounded-lg mb-6 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="admin@example.com"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-all flex justify-center items-center gap-2"
                    >
                        {loading ? 'Sending...' : <><Send size={18} /> Send Reset Link</>}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link href="/login" className="text-sm text-slate-600 hover:text-blue-600 inline-flex items-center gap-1 font-medium">
                        <ArrowLeft size={16} /> Back to Login
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
