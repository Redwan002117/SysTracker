'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Bell, Inbox, MessageCircle, Users, Settings, User } from 'lucide-react';
import { isAdmin } from '../lib/auth';

const navItems = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/alerts', label: 'Alerts', icon: Bell },
    { href: '/dashboard/mail', label: 'Mail', icon: Inbox },
    { href: '/dashboard/chat', label: 'Chat', icon: MessageCircle },
    { href: '/dashboard/profile', label: 'Profile', icon: User },
];

const adminItems = [
    { href: '/dashboard/users', label: 'Users', icon: Users },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const isActive = (href: string) => pathname === href;

    return (
        <aside className="hidden md:block fixed top-16 left-0 bottom-0 w-64 bg-gradient-to-b from-white to-slate-50/50 border-r border-slate-200/50 px-3 py-5 shadow-sm">
            <nav className="space-y-1">
                {navItems.map(({ href, label, icon: Icon }) => (
                    <Link
                        key={href}
                        href={href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group ${
                            isActive(href)
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                                : 'text-slate-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:shadow-sm hover:scale-[1.02]'
                        }`}
                    >
                        <Icon size={18} className={`transition-transform duration-300 ${isActive(href) ? '' : 'group-hover:scale-110'}`} />
                        {label}
                    </Link>
                ))}
            </nav>

            {isAdmin() && (
                <div className="mt-8">
                    <div className="px-3 mb-3 flex items-center gap-2">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Admin</p>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
                    </div>
                    <nav className="space-y-1">
                        {adminItems.map(({ href, label, icon: Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group ${
                                    isActive(href)
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                                        : 'text-slate-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:shadow-sm hover:scale-[1.02]'
                                }`}
                            >
                                <Icon size={18} className={`transition-transform duration-300 ${isActive(href) ? '' : 'group-hover:scale-110'}`} />
                                {label}
                            </Link>
                        ))}
                    </nav>
                </div>
            )}
        </aside>
    );
}
