'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, LayoutDashboard, Settings, Github, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
    const pathname = usePathname();

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 supports-[backdrop-filter]:bg-white/60"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="bg-blue-600 text-white p-1.5 rounded-lg shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-300">
                            <Zap size={20} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-slate-900">
                            Sys<span className="text-blue-600">Tracker</span>
                        </span>
                    </Link>

                    {/* Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link
                            href="/"
                            className={`text-sm font-medium transition-colors hover:text-blue-600 ${pathname === '/' ? 'text-blue-600' : 'text-slate-600'}`}
                        >
                            Home
                        </Link>
                        <Link
                            href="/dashboard"
                            className={`text-sm font-medium transition-colors hover:text-blue-600 ${pathname === '/dashboard' ? 'text-blue-600' : 'text-slate-600'}`}
                        >
                            Dashboard
                        </Link>
                        <a
                            href="https://github.com/Redwan002117/SysTracker"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-slate-900 transition-colors"
                        >
                            <Github size={20} />
                        </a>
                    </div>

                    {/* CTA Button */}
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <button className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2">
                                <LayoutDashboard size={16} />
                                Launch App
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </motion.nav>
    );
};

export default Navbar;
