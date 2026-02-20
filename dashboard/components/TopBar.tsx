'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Zap, LogOut, User, ChevronDown, Monitor, Bell, Settings, Users } from 'lucide-react';
import { clearToken, getUsername, isAuthenticated, getRole, isAdmin } from '../lib/auth';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TopBar = () => {
    const router = useRouter();
    const [username, setUsername] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string>('admin');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
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
                    <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center border border-slate-200">
                        <User size={16} />
                    </div>
                    <div className="hidden sm:block text-left">
                        <div className="text-xs font-semibold text-slate-700 leading-tight">{username || 'User'}</div>
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
                            className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1 overflow-hidden"
                        >
                            <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50">
                                <p className="text-sm font-medium text-slate-900">Signed in as</p>
                                <p className="text-xs text-slate-500 truncate">{username}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5 capitalize">Role: {userRole}</p>
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
