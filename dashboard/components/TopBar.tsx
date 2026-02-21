'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Zap, LogOut, User, ChevronDown, Monitor, Bell, Settings, Users, MapPin, Mail } from 'lucide-react';
import { clearToken, getUsername, isAuthenticated, getRole, isAdmin } from '../lib/auth';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserProfile {
    username: string;
    display_name?: string;
    email?: string;
    avatar?: string;
    location?: string;
    role?: string;
}

const TopBar = () => {
    const router = useRouter();
    const [username, setUsername] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string>('admin');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setUsername(getUsername());
        setUserRole(getRole() || 'admin');

        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch full profile when menu opens (only once)
    useEffect(() => {
        if (!isMenuOpen || profile) return;
        const token = typeof window !== 'undefined' ? localStorage.getItem('systracker_token') : null;
        if (!token) return;
        fetch('/api/auth/status', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data?.authenticated && data.user) setProfile(data.user); })
            .catch(() => {});
    }, [isMenuOpen]);

    const handleLogout = async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('systracker_token') : null;
        if (token) {
            fetch('/api/auth/logout', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            }).catch(() => { });
        }
        clearToken();
        router.push('/login');
    };

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 px-4 h-16 flex items-center justify-between shadow-sm">
            {/* Logo Area */}
            <Link href="/dashboard" className="flex items-center gap-2 group">
                <div className="bg-blue-600 text-white p-1.5 rounded-lg shadow-md group-hover:shadow-blue-500/30 transition-all">
                    <Zap size={20} fill="currentColor" />
                </div>
                <span className="font-bold text-xl tracking-tight text-slate-800">
                    Sys<span className="text-blue-600">Tracker</span>
                </span>
            </Link>

            {/* Right Menu */}
            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 hover:bg-slate-100 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-slate-200"
                >
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                        {profile?.avatar
                            ? <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                            : <User size={16} className="text-slate-600" />
                        }
                    </div>
                    <div className="hidden sm:block text-left">
                        <div className="text-xs font-semibold text-slate-700 leading-tight">{profile?.display_name || username || 'User'}</div>
                        <div className="text-[10px] text-slate-500 leading-tight capitalize">{userRole}</div>
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden"
                        >
                            {/* Profile card header */}
                            <div className="relative bg-gradient-to-br from-blue-50 to-slate-50 px-4 pt-5 pb-4 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    {/* Avatar */}
                                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md bg-slate-200 flex-shrink-0 flex items-center justify-center">
                                        {profile?.avatar
                                            ? <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                                            : <User size={24} className="text-slate-400" />
                                        }
                                    </div>
                                    {/* Info */}
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-900 text-sm leading-tight truncate">
                                            {profile?.display_name || username || 'User'}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">@{username}</p>
                                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-medium capitalize">
                                            {userRole}
                                        </span>
                                    </div>
                                </div>

                                {/* Location & Email */}
                                <div className="mt-3 space-y-1">
                                    {profile?.location && (
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                            <MapPin size={11} className="flex-shrink-0 text-slate-400" />
                                            <span className="truncate">{profile.location}</span>
                                        </div>
                                    )}
                                    {profile?.email && (
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                            <Mail size={11} className="flex-shrink-0 text-slate-400" />
                                            <span className="truncate">{profile.email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-1">
                                {isAdmin() && (
                                    <>
                                        <Link
                                            href="/dashboard/settings"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Settings size={16} />
                                            Settings
                                        </Link>
                                        <Link
                                            href="/dashboard/users"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Users size={16} />
                                            User Management
                                        </Link>
                                        <Link
                                            href="/dashboard/alerts"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Bell size={16} />
                                            Alerts
                                        </Link>
                                    </>
                                )}
                                <Link
                                    href="/dashboard/profile"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <User size={16} />
                                    Your Profile
                                </Link>
                            </div>

                            <div className="h-px bg-slate-100 my-1" />

                            <div className="p-1">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                                >
                                    <LogOut size={16} />
                                    Sign out
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default TopBar;
