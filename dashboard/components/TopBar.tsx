'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Zap, LogOut, User, ChevronDown, Settings, MapPin, Mail } from 'lucide-react';
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
    const profileCacheKey = 'systracker_profile';

    useEffect(() => {
        setUsername(getUsername());
        setUserRole(getRole() || 'admin');

        if (typeof window !== 'undefined') {
            const cachedProfile = localStorage.getItem(profileCacheKey);
            if (cachedProfile) {
                try {
                    setProfile(JSON.parse(cachedProfile));
                } catch {
                    localStorage.removeItem(profileCacheKey);
                }
            }

            const token = localStorage.getItem('systracker_token');
            if (token) {
                const refreshProfile = () => {
                    fetch('/api/auth/status', { headers: { Authorization: `Bearer ${token}` } })
                        .then(r => r.ok ? r.json() : null)
                        .then(data => {
                            if (data?.authenticated && data.user) {
                                setProfile(data.user);
                                localStorage.setItem(profileCacheKey, JSON.stringify(data.user));
                            }
                        })
                        .catch(() => {});
                };
                
                // Initial fetch
                refreshProfile();
                
                // Listen for profile updates from other components
                const handleProfileUpdate = (e: CustomEvent) => {
                    console.log('Profile update event received:', e.detail);
                    refreshProfile();
                };
                window.addEventListener('profile-updated', handleProfileUpdate as EventListener);
                
                // Cleanup
                return () => {
                    window.removeEventListener('profile-updated', handleProfileUpdate as EventListener);
                };
            }
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('systracker_token') : null;
        if (token) {
            fetch('/api/auth/logout', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            }).catch(() => { });
        }
        clearToken();
        if (typeof window !== 'undefined') {
            localStorage.removeItem(profileCacheKey);
        }
        router.push('/login');
    };

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/50 shadow-[0_4px_12px_rgba(0,0,0,0.05)] px-4 h-16 flex items-center justify-between">
            {/* Logo Area */}
            <Link href="/dashboard" className="flex items-center gap-2 group">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-2 rounded-xl shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-300 group-hover:scale-110">
                    <Zap size={20} fill="currentColor" />
                </div>
                <span className="font-bold text-xl tracking-tight">
                    <span className="text-slate-800">Sys</span><span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Tracker</span>
                </span>
            </Link>

            {/* Right Menu */}
            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 hover:bg-white p-1.5 pr-3 rounded-2xl transition-all duration-300 border border-transparent hover:border-slate-200 hover:shadow-sm"
                >
                    <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center shadow-sm">
                        {profile?.avatar
                            ? <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                            : <User size={18} className="text-slate-600" />
                        }
                    </div>
                    <div className="hidden sm:block text-left">
                        <div className="text-xs font-semibold text-slate-700 leading-tight">{profile?.display_name || username || 'User'}</div>
                        <div className="text-[10px] text-slate-500 leading-tight capitalize">{userRole}</div>
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 top-full mt-2 w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden"
                        >
                            {/* Profile card header */}
                            <div className="relative bg-gradient-to-br from-blue-50 via-purple-50 to-slate-50 px-4 pt-5 pb-4 border-b border-slate-200/50">
                                <div className="flex items-center gap-3">
                                    {/* Avatar */}
                                    <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white shadow-lg bg-gradient-to-br from-blue-100 to-purple-100 flex-shrink-0 flex items-center justify-center">
                                        {profile?.avatar
                                            ? <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                                            : <User size={24} className="text-slate-500" />
                                        }
                                    </div>
                                    {/* Info */}
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-900 text-sm leading-tight truncate">
                                            {profile?.display_name || username || 'User'}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">@{username}</p>
                                        <span className="inline-block mt-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white text-[10px] font-bold capitalize shadow-sm">
                                            {userRole}
                                        </span>
                                    </div>
                                </div>

                                {/* Location & Email */}
                                <div className="mt-3 space-y-1.5">
                                    {profile?.location && (
                                        <div className="flex items-center gap-2 text-xs text-slate-600 bg-white/60 px-2 py-1 rounded-lg">
                                            <MapPin size={12} className="flex-shrink-0 text-slate-400" />
                                            <span className="truncate">{profile.location}</span>
                                        </div>
                                    )}
                                    {profile?.email && (
                                        <div className="flex items-center gap-2 text-xs text-slate-600 bg-white/60 px-2 py-1 rounded-lg">
                                            <Mail size={12} className="flex-shrink-0 text-slate-400" />
                                            <span className="truncate">{profile.email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-2">
                                <Link
                                    href="/dashboard/profile"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all duration-300 group"
                                >
                                    <User size={16} className="group-hover:scale-110 transition-transform duration-300" />
                                    Profile
                                </Link>
                                {isAdmin() && (
                                    <Link
                                        href="/dashboard/settings"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all duration-300 group"
                                    >
                                        <Settings size={16} className="group-hover:scale-110 transition-transform duration-300" />
                                        Settings
                                    </Link>
                                )}
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent my-1" />

                            <div className="p-2">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 text-left group"
                                >
                                    <LogOut size={16} className="group-hover:scale-110 transition-transform duration-300" />
                                    Logout
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
