'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, isAuthenticated, clearToken } from '../lib/auth';
import { Loader2, Zap } from 'lucide-react';

interface AuthGuardProps {
    children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
    const router = useRouter();
    const [status, setStatus] = useState<'checking' | 'authenticated' | 'redirect'>('checking');

    useEffect(() => {
        async function checkAuth() {
            // Helper with timeout
            const fetchWithTimeout = async (url: string, options = {}) => {
                const controller = new AbortController();
                const id = setTimeout(() => controller.abort(), 5000); // 5s timeout
                try {
                    const res = await fetch(url, { ...options, signal: controller.signal });
                    clearTimeout(id);
                    return res;
                } catch (e) {
                    clearTimeout(id);
                    throw e;
                }
            };

            // Quick local check first
            if (!isAuthenticated()) {
                // Check if setup is needed
                const returnTo = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
                const returnParam = returnTo && returnTo.length > 1 ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
                try {
                    const res = await fetchWithTimeout('/api/auth/status');
                    const data = await res.json();
                    if (data.setup_required) {
                        router.replace('/setup');
                    } else {
                        router.replace(`/login${returnParam}`);
                    }
                } catch {
                    // If network fails, go to login
                    router.replace(`/login${returnParam}`);
                }
                setStatus('redirect');
                return;
            }

            // Verify token with server
            try {
                const token = getToken();
                const res = await fetchWithTimeout('/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    setStatus('authenticated');
                } else {
                    clearToken();
                    const returnTo = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
                    const returnParam = returnTo && returnTo.length > 1 ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
                    router.replace(`/login${returnParam}`);
                    setStatus('redirect');
                }
            } catch {
                // Network error — allow access if token looks valid locally
                // Or deny? Better to allow viewing dashboard (offline mode) if possible
                // But for now, let's allow it to prevent lockout loop
                console.warn("Auth check failed (network), assuming offline authenticated");
                setStatus('authenticated');
            }
        }

        checkAuth();
    }, [router]);

    if (status === 'checking') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-xl">
                        <Zap size={28} fill="currentColor" />
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                        <Loader2 size={18} className="animate-spin" />
                        <span className="text-sm font-medium">Verifying session...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'redirect') return null;

    return <>{children}</>;
}
