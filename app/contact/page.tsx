'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PortfolioNavbar from '../../components/PortfolioNavbar';
import SiteFooter from '../../components/SiteFooter';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail, Github, MessageSquare, Send, CheckCircle,
    AlertCircle, Loader2, ExternalLink, Bug,
    Lightbulb, HelpCircle, Shield, ChevronDown, ChevronUp
} from 'lucide-react';

const faqs = [
    { q: 'Is SysTracker free to use?', a: 'SysTracker is free for personal and non-commercial use under the SysTracker Proprietary License. Commercial or enterprise deployments require written permission from the project maintainers. Contact SysTracker@rico.bd for licensing inquiries.' },
    { q: 'Where is my data stored?', a: 'All data is stored exclusively on your own server in a local SQLite database. Nothing is sent to us or any third party. You are the sole data controller.' },
    { q: 'Does SysTracker work on Linux?', a: 'The Admin Server runs on Linux. The Agent is currently Windows-only, but Linux agent support is planned.' },
    { q: 'How do I report a security vulnerability?', a: 'Please open a private security advisory on GitHub. Do not post security issues in public GitHub Issues.' },
    { q: 'Can I contribute to SysTracker?', a: 'Yes! Bug reports, feature requests, and pull requests are welcome. Open an issue or pull request on the GitHub repository. Note that contributions submitted to the project are covered under the SysTracker Proprietary License.' },
    { q: 'Is SysTracker coming to the Microsoft Store?', a: 'Yes — we have registered with Microsoft Partner Center and are in the process of enlisting SysTracker in the Microsoft Store to provide signed, SmartScreen-trusted binaries.' },
];

function FaqItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors cursor-pointer">
                <span className="font-semibold text-slate-900 pr-4">{q}</span>
                {open ? <ChevronUp size={18} className="text-blue-500 flex-shrink-0" /> : <ChevronDown size={18} className="text-slate-400 flex-shrink-0" />}
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <p className="px-5 pb-5 text-slate-600 leading-relaxed border-t border-slate-100 pt-4">{a}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function ContactPage() {
    const [form, setForm] = useState({ name: '', email: '', type: 'general', subject: '', message: '' });
    const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const [successPopup, setSuccessPopup] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('sending');
        const body = `Name: ${form.name}\nEmail: ${form.email}\nType: ${form.type}\n\n${form.message}`;
        const mailtoUrl = `mailto:SysTracker@rico.bd?subject=${encodeURIComponent(`[${form.type.toUpperCase()}] ${form.subject}`)}&body=${encodeURIComponent(body)}`;
        setTimeout(() => {
            window.location.href = mailtoUrl;
            setStatus('sent');
            setSuccessPopup(true);
            setTimeout(() => setSuccessPopup(false), 5000);
        }, 800);
    };

    const contactTypes = [
        { value: 'general', label: 'General Question', icon: <HelpCircle size={16} /> },
        { value: 'bug', label: 'Bug Report', icon: <Bug size={16} /> },
        { value: 'feature', label: 'Feature Request', icon: <Lightbulb size={16} /> },
        { value: 'security', label: 'Security Issue', icon: <Shield size={16} /> },
        { value: 'partnership', label: 'Partnership', icon: <MessageSquare size={16} /> },
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
            <PortfolioNavbar />
            <AnimatePresence>
                {successPopup && (
                    <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.95 }} className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-semibold">
                        <CheckCircle size={20} /> Your mail client has opened. Thank you for reaching out!
                    </motion.div>
                )}
            </AnimatePresence>
            <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold mb-4">
                            <Mail size={12} /> Get in Touch
                        </motion.div>
                        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">Contact Us</motion.h1>
                        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-slate-500 text-lg max-w-xl mx-auto">Have a question, found a bug, or want to contribute? We&apos;d love to hear from you.</motion.p>
                    </div>
                    <div className="grid lg:grid-cols-3 gap-10">
                        <div className="space-y-5">
                            <motion.a href="https://github.com/Redwan002117/SysTracker/issues" target="_blank" rel="noopener noreferrer" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex items-start gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group">
                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-slate-900 transition-colors"><Github size={22} className="text-slate-700 group-hover:text-white transition-colors" /></div>
                                <div>
                                    <div className="font-bold text-slate-900 mb-1">GitHub Issues</div>
                                    <div className="text-slate-500 text-sm">Best for bug reports, feature requests, and public discussions.</div>
                                    <div className="flex items-center gap-1 text-blue-600 text-sm font-semibold mt-2">Open an issue <ExternalLink size={12} /></div>
                                </div>
                            </motion.a>
                            <motion.a href="https://github.com/Redwan002117/SysTracker/security/advisories/new" target="_blank" rel="noopener noreferrer" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex items-start gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group">
                                <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-rose-500 transition-colors"><Shield size={22} className="text-rose-500 group-hover:text-white transition-colors" /></div>
                                <div>
                                    <div className="font-bold text-slate-900 mb-1">Security Vulnerabilities</div>
                                    <div className="text-slate-500 text-sm">Report security issues privately via GitHub Security Advisories.</div>
                                    <div className="flex items-center gap-1 text-rose-600 text-sm font-semibold mt-2">Report privately <ExternalLink size={12} /></div>
                                </div>
                            </motion.a>
                            <motion.a href="https://github.com/Redwan002117/SysTracker/discussions" target="_blank" rel="noopener noreferrer" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="flex items-start gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group">
                                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500 transition-colors"><MessageSquare size={22} className="text-purple-500 group-hover:text-white transition-colors" /></div>
                                <div>
                                    <div className="font-bold text-slate-900 mb-1">Community Discussions</div>
                                    <div className="text-slate-500 text-sm">Ask questions, share setups, and connect with other users.</div>
                                    <div className="flex items-center gap-1 text-purple-600 text-sm font-semibold mt-2">Join discussion <ExternalLink size={12} /></div>
                                </div>
                            </motion.a>
                            <motion.a href="mailto:SysTracker@rico.bd" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="flex items-start gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group">
                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 transition-colors"><Mail size={22} className="text-blue-500 group-hover:text-white transition-colors" /></div>
                                <div>
                                    <div className="font-bold text-slate-900 mb-1">Email Us Directly</div>
                                    <div className="text-slate-500 text-sm">For general inquiries, partnerships, or anything else.</div>
                                    <div className="flex items-center gap-1 text-blue-600 text-sm font-semibold mt-2">SysTracker@rico.bd <ExternalLink size={12} /></div>
                                </div>
                            </motion.a>
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="p-5 bg-blue-50 border border-blue-100 rounded-2xl">
                                <div className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wider">Legal &amp; Policies</div>
                                <div className="space-y-2">
                                    {[{ href: '/privacy', label: 'Privacy Policy' }, { href: '/terms', label: 'Terms of Use' }, { href: '/data-retention', label: 'Data Retention Policy' }, { href: '/acceptable-use', label: 'Acceptable Use Policy' }].map((link) => (
                                        <Link key={link.href} href={link.href} className="flex items-center justify-between text-sm text-slate-700 hover:text-blue-600 transition-colors py-1 group">
                                            {link.label}
                                            <ChevronDown size={14} className="-rotate-90 text-slate-300 group-hover:text-blue-400 transition-colors" />
                                        </Link>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-sm p-8">
                            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Send a Message</h2>
                            <p className="text-slate-500 text-sm mb-8">This form opens your mail client with a pre-filled message. No data is sent to our servers.</p>
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Type of Inquiry</label>
                                    <div className="flex flex-wrap gap-2">
                                        {contactTypes.map((type) => (
                                            <button key={type.value} type="button" onClick={() => setForm(f => ({ ...f, type: type.value }))} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${form.type === type.value ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300'}`}>
                                                {type.icon}{type.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Your Name</label>
                                        <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                                        <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@company.com" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all text-sm" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject</label>
                                    <input type="text" required value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Brief description of your inquiry" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Message</label>
                                    <textarea required rows={6} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Describe your question, issue, or idea in detail..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all text-sm resize-none" />
                                </div>
                                <AnimatePresence>
                                    {form.type === 'security' && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
                                            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                                            <div><strong>For security vulnerabilities,</strong> please use <a href="https://github.com/Redwan002117/SysTracker/security/advisories/new" target="_blank" rel="noopener noreferrer" className="underline font-semibold">GitHub Security Advisories</a> instead of email to ensure private disclosure.</div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <button type="submit" disabled={status === 'sending'} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 cursor-pointer">
                                    {status === 'sending' ? <><Loader2 size={18} className="animate-spin" />Opening mail client...</> : status === 'sent' ? <><CheckCircle size={18} />Mail client opened!</> : <><Send size={18} />Send Message</>}
                                </button>
                                <p className="text-center text-slate-400 text-xs">This opens your default mail client. No form data is transmitted to our servers.</p>
                            </form>
                        </motion.div>
                    </div>
                    <div className="mt-20">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
                            <p className="text-slate-500 mt-2">Quick answers to common questions</p>
                        </div>
                        <div className="max-w-3xl mx-auto space-y-3">
                            {faqs.map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
                        </div>
                    </div>
                </div>
            </main>
            <SiteFooter showContact extraTopMargin />
        </div>
    );
}
