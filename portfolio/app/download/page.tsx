'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import PortfolioNavbar from '../../components/PortfolioNavbar';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Download, Github, Package, Star, GitFork, Tag, Clock,
    Monitor, Server, Shield, Zap, ChevronRight, ExternalLink,
    CheckCircle, AlertCircle, Loader2, Box, Globe, FileCode,
    Terminal, Cpu, HardDrive, Wifi, Activity, Users, Lock,
    ArrowRight, Copy, Check, Mail
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface GithubRelease {
    tag_name: string;
    name: string;
    published_at: string;
    html_url: string;
    prerelease: boolean;
    body: string;
    assets: Array<{
        name: string;
        size: number;
        download_count: number;
        browser_download_url: string;
        content_type: string;
    }>;
}

interface RepoStats {
    stargazers_count: number;
    forks_count: number;
    open_issues_count: number;
    watchers_count: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBytes(bytes: number) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days} days ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
}

function getAssetIcon(name: string) {
    if (name.endsWith('.exe')) return <Monitor size={16} className="text-blue-500" />;
    if (name.endsWith('.zip')) return <Package size={16} className="text-purple-500" />;
    if (name.endsWith('.tar.gz') || name.endsWith('.tar')) return <Box size={16} className="text-amber-500" />;
    if (name.endsWith('.deb') || name.endsWith('.rpm')) return <Terminal size={16} className="text-emerald-500" />;
    return <FileCode size={16} className="text-slate-400" />;
}

// ─── Copy Button ──────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Copy"
        >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        </button>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DownloadPage() {
    const [releases, setReleases] = useState<GithubRelease[]>([]);
    const [repoStats, setRepoStats] = useState<RepoStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRelease, setSelectedRelease] = useState<GithubRelease | null>(null);
    const [activeTab, setActiveTab] = useState<'agent' | 'server' | 'docker'>('agent');
    const [policyPopup, setPolicyPopup] = useState(false);

    const REPO = process.env.NEXT_PUBLIC_GITHUB_REPO || 'Redwan002117/SysTracker';
    const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:7777';

    useEffect(() => {
        Promise.all([
            fetch(`https://api.github.com/repos/${REPO}/releases?per_page=10`).then(r => r.json()),
            fetch(`https://api.github.com/repos/${REPO}`).then(r => r.json()),
        ])
            .then(([releasesData, repoData]) => {
                if (Array.isArray(releasesData)) {
                    setReleases(releasesData);
                    setSelectedRelease(releasesData.find((r: GithubRelease) => !r.prerelease) || releasesData[0]);
                }
                setRepoStats(repoData);
                setLoading(false);
            })
            .catch(() => {
                setError('Could not fetch release data. Please visit GitHub directly.');
                setLoading(false);
            });
    }, [REPO]);

    const latestRelease = releases.find(r => !r.prerelease) || releases[0];

    const installTabs = {
        agent: {
            label: 'Windows Agent',
            icon: <Monitor size={16} />,
            code: `# 1. Download SysTracker_Agent_Windows.zip from the latest release
# 2. Extract and edit config.json:
{
  "server_url": "http://YOUR_SERVER_IP:3001"
}

# 3. Run the installer as Administrator:
.\\install_agent.ps1`,
            lang: 'powershell',
        },
        server: {
            label: 'Admin Server',
            icon: <Server size={16} />,
            code: `# Download SysTracker_Admin.exe (Windows) or SysTracker_Admin (Linux)
# Run directly — no Node.js required:

# Windows
.\\SysTracker_Admin.exe

# Linux
chmod +x ./SysTracker_Admin
./SysTracker_Admin`,
            lang: 'bash',
        },
        docker: {
            label: 'Docker',
            icon: <Box size={16} />,
            code: `docker run -d \\
  --name systracker \\
  -p 3001:3001 \\
  -v /DATA/AppData/Monitor:/DATA/AppData/Monitor \\
  ghcr.io/redwan002117/systracker:latest`,
            lang: 'bash',
        },
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
            <PortfolioNavbar />

            {/* ── Hero ── */}
            <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
                {/* Background blobs */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl" />
                    <div className="absolute top-20 right-1/4 w-80 h-80 bg-cyan-400/15 rounded-full blur-3xl" />
                    <div className="absolute -bottom-20 left-1/2 w-[600px] h-[300px] bg-indigo-400/10 rounded-full blur-3xl" />
                </div>

                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        {/* Left: Text */}
                        <div className="flex-1 text-center lg:text-left">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold mb-6"
                            >
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                                </span>
                                {loading ? 'Loading latest...' : latestRelease ? `Latest: ${latestRelease.tag_name}` : 'Open Source'}
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight mb-6"
                            >
                                SysTracker
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                                    Fleet Monitor
                                </span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-lg text-slate-600 max-w-xl mb-8 leading-relaxed"
                            >
                                A self-hosted, open-source Remote Monitoring &amp; Management (RMM) tool for Windows fleets.
                                Real-time telemetry, hardware inventory, event logs — all on your own infrastructure.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
                            >
                                {latestRelease && (
                                    <a
                                        href={latestRelease.assets.find(a => a.name.includes('Agent') && a.name.endsWith('.zip'))?.browser_download_url || latestRelease.html_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xl shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:shadow-2xl cursor-pointer"
                                    >
                                        <Download size={18} />
                                        Download Agent
                                        <span className="text-blue-200 text-sm font-normal">{latestRelease.tag_name}</span>
                                    </a>
                                )}
                                <a
                                    href={`https://github.com/${REPO}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer"
                                >
                                    <Github size={18} />
                                    View on GitHub
                                </a>
                                <a
                                    href={DASHBOARD_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-bold shadow-lg border border-slate-200 transition-all hover:-translate-y-0.5 cursor-pointer"
                                >
                                    <Zap size={18} className="text-blue-600" />
                                    Live Dashboard
                                </a>
                            </motion.div>

                            {/* Repo Stats */}
                            {repoStats && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="flex items-center gap-6 mt-8 justify-center lg:justify-start"
                                >
                                    <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                                        <Star size={15} className="text-amber-400 fill-amber-400" />
                                        <span className="font-semibold text-slate-700">{repoStats.stargazers_count}</span> stars
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                                        <GitFork size={15} className="text-slate-400" />
                                        <span className="font-semibold text-slate-700">{repoStats.forks_count}</span> forks
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                                        <Users size={15} className="text-slate-400" />
                                        <span className="font-semibold text-slate-700">{repoStats.watchers_count}</span> watching
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Right: App Preview Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex-1 w-full max-w-md"
                        >
                            <div className="relative bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl shadow-slate-200/80 p-6 overflow-hidden">
                                <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
                                <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />

                                {/* Mock dashboard preview */}
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                                                <Zap size={16} fill="currentColor" />
                                            </div>
                                            <span className="font-bold text-slate-900">SysTracker</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold border border-green-100">
                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                            Live
                                        </div>
                                    </div>

                                    {/* Mini stat cards */}
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        {[
                                            { label: 'CPU', value: '34%', color: 'text-blue-600', bg: 'bg-blue-50', icon: <Cpu size={14} /> },
                                            { label: 'RAM', value: '61%', color: 'text-purple-600', bg: 'bg-purple-50', icon: <Activity size={14} /> },
                                            { label: 'Disk', value: '48%', color: 'text-amber-600', bg: 'bg-amber-50', icon: <HardDrive size={14} /> },
                                            { label: 'Network', value: '12 MB/s', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <Wifi size={14} /> },
                                        ].map((stat, i) => (
                                            <div key={i} className={`${stat.bg} rounded-xl p-3 border border-white`}>
                                                <div className={`flex items-center gap-1.5 ${stat.color} mb-1`}>
                                                    {stat.icon}
                                                    <span className="text-xs font-semibold">{stat.label}</span>
                                                </div>
                                                <div className={`text-xl font-extrabold ${stat.color}`}>{stat.value}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Mini machine list */}
                                    <div className="space-y-2">
                                        {['WORKSTATION-01', 'SERVER-PROD', 'LAPTOP-DEV'].map((name, i) => (
                                            <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-amber-400' : 'bg-green-400'} animate-pulse`} />
                                                    <span className="text-xs font-semibold text-slate-700">{name}</span>
                                                </div>
                                                <span className="text-xs text-slate-400">{i === 1 ? 'Warning' : 'Online'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── Microsoft Partner / Store Banner ── */}
            <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-8 md:p-12 border border-white/10"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                {/* Microsoft logo SVG */}
                                <svg viewBox="0 0 23 23" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 1h10v10H1z" fill="#F25022" />
                                    <path d="M12 1h10v10H12z" fill="#7FBA00" />
                                    <path d="M1 12h10v10H1z" fill="#00A4EF" />
                                    <path d="M12 12h10v10H12z" fill="#FFB900" />
                                </svg>
                                <div>
                                    <div className="text-white font-bold text-lg">Microsoft Partner Center</div>
                                    <div className="text-blue-300 text-sm">Verified Publisher — In Progress</div>
                                </div>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
                                Coming to the Microsoft Store
                            </h2>
                            <p className="text-slate-300 leading-relaxed max-w-xl">
                                SysTracker is being enlisted in the Microsoft Store to provide a trusted, signed distribution channel.
                                This eliminates Windows SmartScreen warnings and ensures verified, tamper-proof binaries for enterprise deployments.
                            </p>
                            <div className="flex flex-wrap gap-3 mt-6">
                                {[
                                    { icon: <Shield size={14} />, text: 'Code Signed Binaries' },
                                    { icon: <CheckCircle size={14} />, text: 'SmartScreen Trusted' },
                                    { icon: <Lock size={14} />, text: 'Microsoft Verified Publisher' },
                                ].map((badge, i) => (
                                    <div key={i} className="flex items-center gap-1.5 bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20">
                                        {badge.icon}
                                        {badge.text}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="w-24 h-24 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                                <div className="bg-blue-600 text-white p-3 rounded-xl">
                                    <Zap size={32} fill="currentColor" />
                                </div>
                            </div>
                            <div className="bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-center">
                                <div className="text-white text-xs font-bold uppercase tracking-wider mb-1">Store Status</div>
                                <div className="flex items-center gap-2 text-amber-400 font-bold">
                                    <Clock size={14} />
                                    Pending Review
                                </div>
                            </div>
                            <a
                                href={`https://github.com/${REPO}/releases/latest`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-300 hover:text-white text-sm font-medium transition-colors flex items-center gap-1 cursor-pointer"
                            >
                                Download from GitHub in the meantime <ExternalLink size={12} />
                            </a>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* ── Install Instructions ── */}
            <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-extrabold text-slate-900">Quick Install</h2>
                    <p className="text-slate-500 mt-2">Three ways to get started</p>
                </div>

                <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
                    {/* Tab bar */}
                    <div className="flex border-b border-slate-800">
                        {(Object.entries(installTabs) as [keyof typeof installTabs, typeof installTabs[keyof typeof installTabs]][]).map(([key, tab]) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors cursor-pointer ${activeTab === key
                                    ? 'text-white border-b-2 border-blue-500 bg-slate-800/50'
                                    : 'text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Code block */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.15 }}
                            className="relative p-6"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-slate-500 text-xs font-mono">{installTabs[activeTab].lang}</span>
                                <CopyButton text={installTabs[activeTab].code} />
                            </div>
                            <pre className="text-green-400 text-sm font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto">
                                {installTabs[activeTab].code}
                            </pre>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </section>

            {/* ── Latest Releases ── */}
            <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-900">Releases</h2>
                        <p className="text-slate-500 mt-1">Latest builds and changelogs</p>
                    </div>
                    <a
                        href={`https://github.com/${REPO}/releases`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                    >
                        All releases <ExternalLink size={14} />
                    </a>
                </div>

                {loading && (
                    <div className="flex items-center justify-center py-20 text-slate-400">
                        <Loader2 size={24} className="animate-spin mr-3" />
                        Loading releases from GitHub...
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-3 p-5 bg-red-50 border border-red-200 rounded-2xl text-red-700">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                {!loading && !error && (
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Release list */}
                        <div className="lg:col-span-1 space-y-3">
                            {releases.slice(0, 8).map((release) => (
                                <button
                                    key={release.tag_name}
                                    onClick={() => setSelectedRelease(release)}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${selectedRelease?.tag_name === release.tag_name
                                        ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                                        : 'border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <Tag size={14} className="text-slate-400" />
                                            <span className="font-bold text-slate-900 text-sm">{release.tag_name}</span>
                                        </div>
                                        {release.prerelease && (
                                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Pre-release</span>
                                        )}
                                        {!release.prerelease && releases.indexOf(release) === 0 && (
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Latest</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                                        <Clock size={11} />
                                        {timeAgo(release.published_at)}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Release detail */}
                        <div className="lg:col-span-2">
                            {selectedRelease && (
                                <motion.div
                                    key={selectedRelease.tag_name}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm h-full"
                                >
                                    <div className="flex items-start justify-between mb-5">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-xl font-extrabold text-slate-900">{selectedRelease.name || selectedRelease.tag_name}</h3>
                                                {!selectedRelease.prerelease && (
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Stable</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                                                <Clock size={13} />
                                                {new Date(selectedRelease.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </div>
                                        </div>
                                        <a
                                            href={selectedRelease.html_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                                        >
                                            <Github size={16} />
                                            View on GitHub
                                        </a>
                                    </div>

                                    {/* Assets */}
                                    {selectedRelease.assets.length > 0 && (
                                        <div className="mb-6">
                                            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Downloads</h4>
                                            <div className="space-y-2">
                                                {selectedRelease.assets.map((asset) => (
                                                    <a
                                                        key={asset.name}
                                                        href={asset.browser_download_url}
                                                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-all group cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {getAssetIcon(asset.name)}
                                                            <div>
                                                                <div className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">{asset.name}</div>
                                                                <div className="text-xs text-slate-400">{formatBytes(asset.size)} · {asset.download_count.toLocaleString()} downloads</div>
                                                            </div>
                                                        </div>
                                                        <Download size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Changelog */}
                                    {selectedRelease.body && (
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Changelog</h4>
                                            <div className="text-slate-600 text-sm leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-200 max-h-48 overflow-y-auto whitespace-pre-wrap font-mono">
                                                {selectedRelease.body}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    </div>
                )}
            </section>

            {/* ── Feature Grid ── */}
            <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-extrabold text-slate-900">What SysTracker Monitors</h2>
                    <p className="text-slate-500 mt-2">Everything you need, nothing you don&apos;t</p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { icon: <Cpu className="text-blue-500" size={22} />, title: 'CPU & Processes', desc: 'Real-time CPU load, top processes sorted by CPU/RAM/PID, per-core breakdown.', bg: 'bg-blue-50' },
                        { icon: <Activity className="text-purple-500" size={22} />, title: 'Memory Usage', desc: 'Total, used, and free RAM. Per-process memory consumption in MB.', bg: 'bg-purple-50' },
                        { icon: <HardDrive className="text-amber-500" size={22} />, title: 'Disk & Storage', desc: 'All drives with usage %, free space, disk model, serial, and interface type.', bg: 'bg-amber-50' },
                        { icon: <Wifi className="text-emerald-500" size={22} />, title: 'Network Traffic', desc: 'Live upload/download speeds, VPN detection, network adapter details.', bg: 'bg-emerald-50' },
                        { icon: <Shield className="text-rose-500" size={22} />, title: 'Windows Events', desc: 'Security logins, service failures, critical system events — all logged.', bg: 'bg-rose-50' },
                        { icon: <Monitor className="text-cyan-500" size={22} />, title: 'Hardware Inventory', desc: 'Motherboard, GPU, RAM modules, BIOS version, system UUID — full spec sheet.', bg: 'bg-cyan-50' },
                        { icon: <Users className="text-indigo-500" size={22} />, title: 'User Profiles', desc: 'Assign user names, roles, floor, desk, and asset IDs to each machine.', bg: 'bg-indigo-50' },
                        { icon: <Globe className="text-teal-500" size={22} />, title: 'Remote Overview', desc: 'Monitor 70+ machines from a single dashboard. Filter, search, sort.', bg: 'bg-teal-50' },
                        { icon: <Lock className="text-slate-500" size={22} />, title: 'Self-Hosted & Private', desc: 'All data stays on your server. No cloud, no telemetry sent to us.', bg: 'bg-slate-100' },
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 cursor-default group"
                        >
                            <div className={`w-11 h-11 ${feature.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                {feature.icon}
                            </div>
                            <h3 className="font-bold text-slate-900 mb-2">{feature.title}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── Links & Resources ── */}
            <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-extrabold text-slate-900">Resources</h2>
                    <p className="text-slate-500 mt-2">Everything in one place</p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[
                        {
                            icon: <Github size={24} />,
                            title: 'Source Code',
                            desc: 'Full source on GitHub. MIT Licensed.',
                            href: `https://github.com/${REPO}`,
                            color: 'text-slate-900',
                            bg: 'bg-slate-100',
                        },
                        {
                            icon: <Package size={24} />,
                            title: 'Docker Image',
                            desc: 'ghcr.io/redwan002117/systracker',
                            href: `https://github.com/${REPO}/pkgs/container/systracker`,
                            color: 'text-blue-600',
                            bg: 'bg-blue-50',
                        },
                        {
                            icon: <Tag size={24} />,
                            title: 'All Releases',
                            desc: 'Changelog and binary downloads.',
                            href: `https://github.com/${REPO}/releases`,
                            color: 'text-purple-600',
                            bg: 'bg-purple-50',
                        },
                        {
                            icon: <FileCode size={24} />,
                            title: 'Dashboard Repo',
                            desc: 'Separate dashboard source code.',
                            href: 'https://github.com/Redwan002117/dashboard',
                            color: 'text-emerald-600',
                            bg: 'bg-emerald-50',
                        },
                    ].map((link, i) => (
                        <a
                            key={i}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer"
                        >
                            <div className={`w-12 h-12 ${link.bg} ${link.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                {link.icon}
                            </div>
                            <h3 className="font-bold text-slate-900 mb-1">{link.title}</h3>
                            <p className="text-slate-500 text-sm flex-1">{link.desc}</p>
                            <div className={`flex items-center gap-1 mt-3 text-sm font-semibold ${link.color}`}>
                                Visit <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </a>
                    ))}
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="border-t border-slate-200 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 text-white p-1 rounded-md">
                            <Zap size={16} fill="currentColor" />
                        </div>
                        <span className="font-bold text-slate-900">SysTracker</span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
                        <Link href="/download" className="hover:text-blue-600 transition-colors">Download</Link>
                        <Link href="/contact" className="hover:text-blue-600 transition-colors">Contact</Link>
                        <Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-blue-600 transition-colors">Terms of Use</Link>
                        <Link href="/data-retention" className="hover:text-blue-600 transition-colors">Data Retention</Link>
                        <Link href="/acceptable-use" className="hover:text-blue-600 transition-colors">Acceptable Use</Link>
                    </div>
                    <p className="text-slate-400 text-sm">© {new Date().getFullYear()} SysTracker. MIT License.</p>
                </div>
            </footer>

            {/* ── Floating Action Buttons ── */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
                {/* Policy popup */}
                <AnimatePresence>
                    {policyPopup && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-5 w-64 mb-1"
                        >
                            <div className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                                <Shield size={16} className="text-blue-500" />
                                Legal &amp; Policies
                            </div>
                            <div className="space-y-1">
                                {[
                                    { href: '/privacy', label: 'Privacy Policy' },
                                    { href: '/terms', label: 'Terms of Use' },
                                    { href: '/data-retention', label: 'Data Retention' },
                                    { href: '/acceptable-use', label: 'Acceptable Use' },
                                ].map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setPolicyPopup(false)}
                                        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-sm transition-colors cursor-pointer"
                                    >
                                        {link.label}
                                        <ChevronRight size={14} className="text-slate-300" />
                                    </Link>
                                ))}
                            </div>
                            <div className="border-t border-slate-100 mt-3 pt-3">
                                <Link
                                    href="/contact"
                                    onClick={() => setPolicyPopup(false)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                                >
                                    <Mail size={14} />
                                    Contact Us
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* FAB button */}
                <button
                    onClick={() => setPolicyPopup(!policyPopup)}
                    className="w-12 h-12 rounded-full bg-slate-900 hover:bg-blue-600 text-white shadow-2xl flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
                    title="Policies & Contact"
                >
                    <AnimatePresence mode="wait">
                        {policyPopup
                            ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} className="text-lg font-bold leading-none">✕</motion.span>
                            : <motion.span key="q" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><Shield size={20} /></motion.span>
                        }
                    </AnimatePresence>
                </button>
            </div>
        </div>
    );
}
