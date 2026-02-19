'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import PortfolioNavbar from '../../components/PortfolioNavbar';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Download, Github, Package, Tag, Clock, Monitor,
    CheckCircle, AlertCircle, Loader2, Box, FileCode,
    Terminal, ExternalLink, Sparkles, Bug, Zap as ZapIcon,
    AlertTriangle, ChevronDown, ChevronUp, ArrowLeft,
    BarChart2, Users2, Cpu, GitCommit, Code2
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface GithubRelease {
    tag_name: string;
    name: string;
    published_at: string;
    html_url: string;
    prerelease: boolean;
    body: string;
    zipball_url: string;
    tarball_url: string;
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

interface ParsedChangelog {
    features: string[];
    bugfixes: string[];
    improvements: string[];
    breaking: string[];
    other: string[];
}

interface CommitEntry {
    sha: string;
    message: string;
    author: string;
    url: string;
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

function getAssetPlatform(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('windows') || n.endsWith('.exe') || n.endsWith('.msix')) return 'Windows';
    if (n.includes('linux') || n.endsWith('.deb') || n.endsWith('.rpm') || n.endsWith('.tar.gz')) return 'Linux';
    if (n.includes('mac') || n.endsWith('.dmg') || n.endsWith('.pkg')) return 'macOS';
    return '';
}

/** Parse release body markdown into categorised sections */
function parseChangelog(body: string): ParsedChangelog {
    const result: ParsedChangelog = { features: [], bugfixes: [], improvements: [], breaking: [], other: [] };
    if (!body) return result;
    const lines = body.split('\n');
    let current: keyof ParsedChangelog = 'other';
    const matchSection = (line: string): keyof ParsedChangelog | null => {
        if (/new features?|what.?s new|added|feature/i.test(line)) return 'features';
        if (/bug fix|bugfix|fixed|fixes|patch/i.test(line)) return 'bugfixes';
        if (/improve|enhance|update|upgrade|performance|refactor|polish/i.test(line)) return 'improvements';
        if (/breaking change|migration|incompatible/i.test(line)) return 'breaking';
        return null;
    };
    for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;
        if (line.startsWith('#')) { const hit = matchSection(line); if (hit) current = hit; continue; }
        if (line.startsWith('-') || line.startsWith('*') || line.startsWith('+')) {
            const text = line.replace(/^[-*+]\s*/, '').trim();
            if (!text) continue;
            if (current === 'other') {
                if (/✨|🆕|feat|add|new/i.test(text)) { result.features.push(text); continue; }
                if (/🐛|fix|bug|patch|resolve/i.test(text)) { result.bugfixes.push(text); continue; }
                if (/🚀|improve|enhance|refactor|perf/i.test(text)) { result.improvements.push(text); continue; }
                if (/⚠️|break|breaking|migration/i.test(text)) { result.breaking.push(text); continue; }
            }
            result[current].push(text);
        }
    }
    return result;
}

/**
 * Parse conventional commit messages into changelog categories.
 * Handles: feat, fix, perf, refactor, chore, docs, style, test, ci, build, revert, BREAKING CHANGE
 */
function commitsToChangelog(commits: CommitEntry[]): ParsedChangelog {
    const result: ParsedChangelog = { features: [], bugfixes: [], improvements: [], breaking: [], other: [] };
    for (const c of commits) {
        const msg = c.message.split('\n')[0].trim(); // first line only
        // skip merge commits
        if (/^Merge (pull request|branch)/i.test(msg)) continue;
        const conventionalMatch = msg.match(/^(\w+)(\(.*?\))?(!)?:\s*(.+)/);
        if (conventionalMatch) {
            const [, type, , bang, description] = conventionalMatch;
            const t = type.toLowerCase();
            if (bang || /breaking/i.test(msg)) { result.breaking.push(description); continue; }
            if (t === 'feat' || t === 'feature') { result.features.push(description); continue; }
            if (t === 'fix' || t === 'bugfix' || t === 'hotfix') { result.bugfixes.push(description); continue; }
            if (t === 'perf' || t === 'refactor' || t === 'improve') { result.improvements.push(description); continue; }
            if (t === 'chore' || t === 'build' || t === 'ci' || t === 'docs' || t === 'style' || t === 'test') {
                result.other.push(description); continue;
            }
            result.other.push(description);
        } else {
            // non-conventional: try keyword inference
            const lower = msg.toLowerCase();
            if (/add|feat|new|implement/i.test(lower)) { result.features.push(msg); continue; }
            if (/fix|bug|patch|resolve|correct/i.test(lower)) { result.bugfixes.push(msg); continue; }
            if (/improve|enhance|refactor|optim|speed|perf/i.test(lower)) { result.improvements.push(msg); continue; }
            if (/break|breaking|migration/i.test(lower)) { result.breaking.push(msg); continue; }
            result.other.push(msg);
        }
    }
    return result;
}

function totalDownloads(releases: GithubRelease[]): number {
    return releases.reduce((sum, r) => sum + r.assets.reduce((s, a) => s + a.download_count, 0), 0);
}

// ─── Changelog Section Component ──────────────────────────────────────────────
interface ChangeSection { key: keyof ParsedChangelog; label: string; icon: React.ReactNode; color: string; bg: string; border: string; dotBg: string; }
const SECTIONS: ChangeSection[] = [
    { key: 'features', label: 'New Features', icon: <Sparkles size={15} />, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', dotBg: 'bg-blue-400' },
    { key: 'improvements', label: 'Improvements', icon: <ZapIcon size={15} />, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dotBg: 'bg-emerald-400' },
    { key: 'bugfixes', label: 'Bug Fixes', icon: <Bug size={15} />, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', dotBg: 'bg-rose-400' },
    { key: 'breaking', label: 'Breaking Changes', icon: <AlertTriangle size={15} />, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dotBg: 'bg-amber-400' },
    { key: 'other', label: 'Other Changes', icon: <CheckCircle size={15} />, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', dotBg: 'bg-slate-400' },
];

function ChangelogSection({ section, items }: { section: ChangeSection; items: string[] }) {
    const [expanded, setExpanded] = useState(true);
    if (items.length === 0) return null;
    return (
        <div className={`rounded-xl border ${section.border} overflow-hidden`}>
            <button onClick={() => setExpanded(!expanded)}
                className={`w-full flex items-center justify-between px-4 py-3 ${section.bg} cursor-pointer hover:brightness-95 transition-all`}>
                <div className={`flex items-center gap-2 font-bold text-sm ${section.color}`}>
                    {section.icon}{section.label}
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-white/70">{items.length}</span>
                </div>
                {expanded ? <ChevronUp size={14} className={section.color} /> : <ChevronDown size={14} className={section.color} />}
            </button>
            <AnimatePresence>
                {expanded && (
                    <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                        className="bg-white divide-y divide-slate-50 overflow-hidden">
                        {items.map((item, i) => (
                            <li key={i} className="flex items-start gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                                <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${section.dotBg}`} />
                                <span>{item}</span>
                            </li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
}

function RawChangelog({ body }: { body: string }) {
    const [show, setShow] = useState(false);
    return (
        <div className="mt-3">
            <button onClick={() => setShow(!show)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                {show ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {show ? 'Hide' : 'View'} raw release notes
            </button>
            <AnimatePresence>
                {show && (
                    <motion.pre initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 text-slate-500 text-xs font-mono leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-200 max-h-48 overflow-y-auto whitespace-pre-wrap overflow-hidden">
                        {body}
                    </motion.pre>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Commit List Fallback ──────────────────────────────────────────────────────
function CommitFallback({ commits, changelog }: { commits: CommitEntry[]; changelog: ParsedChangelog }) {
    const hasStructured = SECTIONS.some(s => changelog[s.key].length > 0);
    if (commits.length === 0) return null;

    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <GitCommit size={13} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Changelog (from commits)</span>
                <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{commits.length} commits</span>
            </div>

            {hasStructured ? (
                <div className="space-y-2">
                    {SECTIONS.map(section => changelog[section.key].length > 0 ? (
                        <ChangelogSection key={section.key} section={section} items={changelog[section.key]} />
                    ) : null)}
                    <CommitRawList commits={commits} />
                </div>
            ) : (
                <CommitRawList commits={commits} />
            )}
        </div>
    );
}

function CommitRawList({ commits }: { commits: CommitEntry[] }) {
    const [show, setShow] = useState(false);
    const visible = show ? commits : commits.slice(0, 5);
    return (
        <div className="mt-2 rounded-xl border border-slate-200 overflow-hidden">
            <ul className="divide-y divide-slate-100 bg-white">
                {visible.map((c) => (
                    <li key={c.sha} className="flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                        <GitCommit size={14} className="text-slate-300 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700 truncate">{c.message.split('\n')[0]}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-slate-400 font-mono">{c.sha.slice(0, 7)}</span>
                                <span className="text-xs text-slate-400">by {c.author}</span>
                            </div>
                        </div>
                        <a href={c.url} target="_blank" rel="noopener noreferrer"
                            className="text-slate-300 hover:text-blue-500 transition-colors flex-shrink-0">
                            <ExternalLink size={13} />
                        </a>
                    </li>
                ))}
            </ul>
            {commits.length > 5 && (
                <button onClick={() => setShow(!show)}
                    className="w-full text-xs text-slate-400 hover:text-slate-700 py-2.5 bg-slate-50 hover:bg-slate-100 border-t border-slate-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5">
                    {show ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {show ? 'Show less' : `Show ${commits.length - 5} more commits`}
                </button>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const SHOW_LIMIT = 10;

export default function DownloadPage() {
    const [releases, setReleases] = useState<GithubRelease[]>([]);
    const [repoStats, setRepoStats] = useState<RepoStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRelease, setSelectedRelease] = useState<GithubRelease | null>(null);
    const [commits, setCommits] = useState<CommitEntry[]>([]);
    const [commitsLoading, setCommitsLoading] = useState(false);

    const REPO = process.env.NEXT_PUBLIC_GITHUB_REPO || 'Redwan002117/SysTracker';

    useEffect(() => {
        Promise.all([
            fetch(`https://api.github.com/repos/${REPO}/releases?per_page=30`).then(r => r.json()),
            fetch(`https://api.github.com/repos/${REPO}`).then(r => r.json()),
        ])
            .then(([releasesData, repoData]) => {
                if (Array.isArray(releasesData)) {
                    // Show up to SHOW_LIMIT releases
                    const limited = releasesData.slice(0, SHOW_LIMIT);
                    setReleases(limited);
                    setSelectedRelease(limited.find((r: GithubRelease) => !r.prerelease) || limited[0]);
                }
                setRepoStats(repoData);
                setLoading(false);
            })
            .catch(() => {
                setError('Could not fetch release data. Please visit GitHub directly.');
                setLoading(false);
            });
    }, [REPO]);

    /** Fetch commits between this tag and the previous one when body is empty */
    const fetchCommits = useCallback(async (release: GithubRelease, allReleases: GithubRelease[]) => {
        setCommits([]);
        if (release.body?.trim()) return; // has release notes, no need
        setCommitsLoading(true);
        try {
            const idx = allReleases.findIndex(r => r.tag_name === release.tag_name);
            const prevTag = allReleases[idx + 1]?.tag_name;
            const endpoint = prevTag
                ? `https://api.github.com/repos/${REPO}/compare/${prevTag}...${release.tag_name}`
                : `https://api.github.com/repos/${REPO}/commits?sha=${release.tag_name}&per_page=20`;

            const data = await fetch(endpoint).then(r => r.json());
            const raw: CommitEntry[] = (prevTag ? (data.commits || []) : data).map((c: { sha: string; html_url: string; commit: { message: string; author?: { name?: string } }; author?: { login?: string } }) => ({
                sha: c.sha,
                message: c.commit.message,
                author: c.author?.login || c.commit.author?.name || 'unknown',
                url: c.html_url,
            }));
            setCommits(raw);
        } catch {
            // silently fail — commits are bonus info
        } finally {
            setCommitsLoading(false);
        }
    }, [REPO]);

    useEffect(() => {
        if (selectedRelease) fetchCommits(selectedRelease, releases);
    }, [selectedRelease, releases, fetchCommits]);

    const changelog = useMemo(() =>
        selectedRelease?.body ? parseChangelog(selectedRelease.body) : null,
        [selectedRelease]
    );

    const commitChangelog = useMemo(() =>
        commits.length > 0 ? commitsToChangelog(commits) : null,
        [commits]
    );

    const hasReleaseNotes = !!(selectedRelease?.body?.trim());
    const hasStructuredRelease = changelog && SECTIONS.some(s => changelog[s.key].length > 0);

    const latestRelease = releases.find(r => !r.prerelease) || releases[0];
    const totalDL = useMemo(() => totalDownloads(releases), [releases]);
    const stableCount = releases.filter(r => !r.prerelease).length;

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
            <PortfolioNavbar />

            {/* ── Header ── */}
            <section className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute top-0 left-1/3 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
                    <div className="absolute top-20 right-1/4 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl" />
                </div>
                <div className="max-w-7xl mx-auto">
                    <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-6 group">
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                        <div>
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold mb-4">
                                <Tag size={12} />
                                {loading ? 'Fetching releases…' : `${releases.length} releases shown`}
                            </motion.div>
                            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                                className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                                Releases &amp; Changelog
                            </motion.h1>
                            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                className="text-slate-500 mt-2 text-lg">
                                Download the latest builds, track changes, and stay up to date.
                            </motion.p>
                        </div>
                        <motion.a initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                            href={`https://github.com/${REPO}/releases`} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer flex-shrink-0">
                            <Github size={16} />All releases on GitHub <ExternalLink size={12} />
                        </motion.a>
                    </div>

                    {/* Stats bar */}
                    {!loading && repoStats && latestRelease && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-2">
                            {[
                                { icon: <Tag size={16} className="text-blue-500" />, label: 'Latest Version', value: latestRelease.tag_name, bg: 'bg-blue-50', border: 'border-blue-100' },
                                { icon: <CheckCircle size={16} className="text-emerald-500" />, label: 'Stable Releases', value: stableCount.toString(), bg: 'bg-emerald-50', border: 'border-emerald-100' },
                                { icon: <Download size={16} className="text-purple-500" />, label: 'Total Downloads', value: totalDL > 0 ? totalDL.toLocaleString() : '—', bg: 'bg-purple-50', border: 'border-purple-100' },
                                { icon: <AlertCircle size={16} className="text-amber-500" />, label: 'Open Issues', value: repoStats.open_issues_count.toString(), bg: 'bg-amber-50', border: 'border-amber-100' },
                            ].map((s, i) => (
                                <div key={i} className={`${s.bg} border ${s.border} rounded-2xl px-5 py-4 flex items-center gap-3`}>
                                    <div>{s.icon}</div>
                                    <div>
                                        <div className="text-xs font-medium text-slate-500">{s.label}</div>
                                        <div className="text-lg font-extrabold text-slate-900">{s.value}</div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </div>
            </section>

            {/* ── Main Content ── */}
            <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-24">
                {loading && (
                    <div className="flex items-center justify-center py-24 text-slate-400">
                        <Loader2 size={24} className="animate-spin mr-3" />
                        Loading releases from GitHub…
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-3 p-5 bg-red-50 border border-red-200 rounded-2xl text-red-700">
                        <AlertCircle size={20} />{error}
                        <a href={`https://github.com/${REPO}/releases`} target="_blank" rel="noopener noreferrer" className="ml-auto text-sm underline">View on GitHub</a>
                    </div>
                )}

                {!loading && !error && (
                    <div className="grid lg:grid-cols-5 gap-6">

                        {/* ── Left: Release List (latest 10) ── */}
                        <div className="lg:col-span-2 space-y-2">
                            <div className="flex items-center justify-between px-1 mb-3">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Latest Releases</p>
                                <a href={`https://github.com/${REPO}/releases`} target="_blank" rel="noopener noreferrer"
                                    className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                                    View all <ExternalLink size={10} />
                                </a>
                            </div>
                            {releases.map((release, idx) => (
                                <motion.button key={release.tag_name}
                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                                    onClick={() => setSelectedRelease(release)}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${selectedRelease?.tag_name === release.tag_name
                                        ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                                        : 'border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm'}`}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <Tag size={13} className="text-slate-400" />
                                            <span className="font-bold text-slate-900 text-sm">{release.tag_name}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {release.prerelease && (
                                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Beta</span>
                                            )}
                                            {!release.prerelease && idx === releases.findIndex(r => !r.prerelease) && (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Latest</span>
                                            )}
                                            {!release.prerelease && idx !== releases.findIndex(r => !r.prerelease) && (
                                                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold">Stable</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                                            <Clock size={11} />{timeAgo(release.published_at)}
                                        </div>
                                        {release.assets.length > 0 && (
                                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                                <Download size={11} />
                                                {release.assets.reduce((s, a) => s + a.download_count, 0).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                </motion.button>
                            ))}
                        </div>

                        {/* ── Right: Release Detail ── */}
                        <div className="lg:col-span-3">
                            {selectedRelease && (
                                <AnimatePresence mode="wait">
                                    <motion.div key={selectedRelease.tag_name}
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                                        className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">

                                        {/* Header */}
                                        <div className="px-6 pt-6 pb-5 border-b border-slate-100">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                                        <h2 className="text-2xl font-extrabold text-slate-900">
                                                            {selectedRelease.name || selectedRelease.tag_name}
                                                        </h2>
                                                        {!selectedRelease.prerelease && (
                                                            <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-bold">Stable</span>
                                                        )}
                                                        {selectedRelease.prerelease && (
                                                            <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-bold">Beta / Pre-release</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-slate-400">
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock size={13} />
                                                            {new Date(selectedRelease.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Download size={13} />
                                                            {selectedRelease.assets.reduce((s, a) => s + a.download_count, 0).toLocaleString()} downloads
                                                        </div>
                                                    </div>
                                                </div>
                                                <a href={selectedRelease.html_url} target="_blank" rel="noopener noreferrer"
                                                    className="flex-shrink-0 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl cursor-pointer">
                                                    <Github size={15} />GitHub
                                                </a>
                                            </div>
                                        </div>

                                        <div className="p-6 space-y-6">

                                            {/* ── Downloads (assets + source code) ── */}
                                            <div>
                                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                    <Download size={13} /> Downloads
                                                </h3>
                                                <div className="space-y-2">
                                                    {/* Uploaded assets */}
                                                    {selectedRelease.assets.map((asset) => {
                                                        const platform = getAssetPlatform(asset.name);
                                                        return (
                                                            <a key={asset.name} href={asset.browser_download_url}
                                                                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition-all group cursor-pointer">
                                                                <div className="flex items-center gap-3">
                                                                    {getAssetIcon(asset.name)}
                                                                    <div>
                                                                        <div className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">{asset.name}</div>
                                                                        <div className="text-xs text-slate-400 flex items-center gap-2">
                                                                            <span>{formatBytes(asset.size)}</span>
                                                                            {platform && <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md font-medium">{platform}</span>}
                                                                            <span>{asset.download_count.toLocaleString()} downloads</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <Download size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                                                            </a>
                                                        );
                                                    })}

                                                    {/* Source code (always shown) */}
                                                    <div className="mt-3">
                                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                            <Code2 size={11} /> Source Code
                                                        </p>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <a href={selectedRelease.zipball_url}
                                                                className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 transition-all group cursor-pointer">
                                                                <Package size={15} className="text-purple-500 flex-shrink-0" />
                                                                <div>
                                                                    <div className="text-xs font-semibold text-slate-700 group-hover:text-purple-700">{selectedRelease.tag_name}.zip</div>
                                                                    <div className="text-xs text-slate-400">ZIP archive</div>
                                                                </div>
                                                                <Download size={13} className="text-slate-300 group-hover:text-purple-500 ml-auto flex-shrink-0" />
                                                            </a>
                                                            <a href={selectedRelease.tarball_url}
                                                                className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 transition-all group cursor-pointer">
                                                                <Box size={15} className="text-amber-500 flex-shrink-0" />
                                                                <div>
                                                                    <div className="text-xs font-semibold text-slate-700 group-hover:text-amber-700">{selectedRelease.tag_name}.tar.gz</div>
                                                                    <div className="text-xs text-slate-400">TAR archive</div>
                                                                </div>
                                                                <Download size={13} className="text-slate-300 group-hover:text-amber-500 ml-auto flex-shrink-0" />
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ── Changelog ── */}
                                            <div>
                                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                    <BarChart2 size={13} /> What&apos;s Changed
                                                </h3>

                                                {hasReleaseNotes ? (
                                                    /* Structured from release body */
                                                    hasStructuredRelease ? (
                                                        <div className="space-y-2">
                                                            {SECTIONS.map(section =>
                                                                changelog && changelog[section.key].length > 0 ? (
                                                                    <ChangelogSection key={section.key} section={section} items={changelog[section.key]} />
                                                                ) : null
                                                            )}
                                                            <RawChangelog body={selectedRelease.body} />
                                                        </div>
                                                    ) : (
                                                        <div className="text-slate-600 text-sm leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-200 max-h-64 overflow-y-auto whitespace-pre-wrap font-mono">
                                                            {selectedRelease.body}
                                                        </div>
                                                    )
                                                ) : (
                                                    /* Commit-based fallback */
                                                    commitsLoading ? (
                                                        <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
                                                            <Loader2 size={16} className="animate-spin" />
                                                            Loading commit history…
                                                        </div>
                                                    ) : commits.length > 0 && commitChangelog ? (
                                                        <CommitFallback commits={commits} changelog={commitChangelog} />
                                                    ) : (
                                                        <div className="text-center py-6 text-slate-400 text-sm">
                                                            <FileCode size={28} className="mx-auto mb-2 opacity-40" />
                                                            No changelog available for this version.
                                                            <br />
                                                            <a href={selectedRelease.html_url} target="_blank" rel="noopener noreferrer"
                                                                className="text-blue-500 hover:underline mt-1 inline-block">View on GitHub</a>
                                                        </div>
                                                    )
                                                )}
                                            </div>

                                            {/* ── Bug Report CTA ── */}
                                            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 p-5 border border-white/10">
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 text-white font-bold mb-1">
                                                            <Bug size={16} className="text-rose-400" />Found a bug or have a suggestion?
                                                        </div>
                                                        <p className="text-slate-400 text-sm">Open an issue on GitHub — we review every report.</p>
                                                    </div>
                                                    <div className="flex gap-2 flex-shrink-0">
                                                        <a href={`https://github.com/${REPO}/issues/new?labels=bug&template=bug_report.md`}
                                                            target="_blank" rel="noopener noreferrer"
                                                            className="flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer">
                                                            <Bug size={14} /> Report Bug
                                                        </a>
                                                        <a href={`https://github.com/${REPO}/issues/new?labels=enhancement`}
                                                            target="_blank" rel="noopener noreferrer"
                                                            className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer">
                                                            <Sparkles size={14} /> Request Feature
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            )}
                        </div>
                    </div>
                )}
            </section>

            {/* ── Info Cards ── */}
            {!loading && !error && releases.length > 0 && (
                <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-24">
                    <div className="grid sm:grid-cols-3 gap-5">
                        {[
                            {
                                icon: <Cpu size={22} className="text-blue-500" />, bg: 'bg-blue-50', border: 'border-blue-100', title: 'System Requirements',
                                items: ['Windows 10/11 (Agent)', 'Python 3.10+ (from source)', 'Node.js 18+ (server from source)', '512 MB RAM minimum']
                            },
                            {
                                icon: <Users2 size={22} className="text-purple-500" />, bg: 'bg-purple-50', border: 'border-purple-100', title: 'Upgrade Guide',
                                items: ['Download the latest agent EXE', 'Run --install as Administrator', 'Existing config.json is preserved', 'Restart happens automatically']
                            },
                            {
                                icon: <ZapIcon size={22} className="text-emerald-500" />, bg: 'bg-emerald-50', border: 'border-emerald-100', title: 'Docker Update',
                                items: ['docker pull ghcr.io/redwan002117/systracker:latest', 'docker compose down && up -d', 'Data volume is preserved', 'DB migrations run automatically']
                            },
                        ].map((card, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                                className={`${card.bg} border ${card.border} rounded-2xl p-5`}>
                                <div className="flex items-center gap-2 font-bold text-slate-900 mb-3">
                                    {card.icon}{card.title}
                                </div>
                                <ul className="space-y-1.5">
                                    {card.items.map((item, j) => (
                                        <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                                            <CheckCircle size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Footer ── */}
            <footer className="border-t border-slate-200 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="bg-blue-600 text-white p-1 rounded-md"><ZapIcon size={16} fill="currentColor" /></div>
                        <span className="font-bold text-slate-900">SysTracker</span>
                    </Link>
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
                        <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
                        <Link href="/download" className="hover:text-blue-600 transition-colors">Download</Link>
                        <Link href="/contact" className="hover:text-blue-600 transition-colors">Contact</Link>
                        <Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-blue-600 transition-colors">Terms of Use</Link>
                    </div>
                    <p className="text-slate-400 text-sm">© {new Date().getFullYear()} SysTracker. MIT License.</p>
                </div>
            </footer>
        </div>
    );
}
