'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Github, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://monitor.rico.bd';

const PortfolioNavbar = () => {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const links = [
        { href: '/', label: 'Home' },
        { href: '/download', label: 'Download' },
        { href: '/contact', label: 'Contact' },
        { href: '/privacy', label: 'Privacy' },
    ];

    const navLink = (href: string, label: string) => (
        <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={`text-sm font-medium transition-colors hover:text-blue-600 ${pathname === href ? 'text-blue-600' : 'text-slate-600'}`}
        >
            {label}
        </Link>
    );

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
                        <div className="w-8 h-8 rounded-lg overflow-hidden shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-300">
                            <Image src="/logo.png" alt="SysTracker" width={32} height={32} className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-slate-900">
                            Sys<span className="text-blue-600">Tracker</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        {links.map(l => navLink(l.href, l.label))}
                        <a
                            href="https://github.com/Redwan002117/SysTracker"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-slate-900 transition-colors"
                            aria-label="GitHub"
                        >
                            <Github size={20} />
                        </a>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* CTA */}
                        <a href={DASHBOARD_URL} target="_blank" rel="noopener noreferrer">
                            <button className="hidden md:block bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 cursor-pointer">
                                Launch Dashboard →
                            </button>
                        </a>
                        {/* Mobile Menu Toggle */}
                        <button
                            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label="Toggle menu"
                        >
                            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="md:hidden border-t border-slate-200 bg-white overflow-hidden"
                    >
                        <div className="px-4 py-4 space-y-3">
                            {links.map(l => (
                                <div key={l.href}>
                                    {navLink(l.href, l.label)}
                                </div>
                            ))}
                            <div className="pt-2 border-t border-slate-100">
                                <a href={DASHBOARD_URL} target="_blank" rel="noopener noreferrer">
                                    <button className="w-full bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer">
                                        Launch Dashboard →
                                    </button>
                                </a>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
};

export default PortfolioNavbar;
