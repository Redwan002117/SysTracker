import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Play, RotateCcw, Save, Trash2, Plus, FileCode } from 'lucide-react';
import { Machine } from '../types';
import { io } from 'socket.io-client';

interface TerminalTabProps {
    machine: Machine;
}

interface Command {
    id: string;
    command: string;
    status: 'pending' | 'sent' | 'running' | 'completed' | 'failed';
    output: string | null;
    created_at: string;
    completed_at: string | null;
}

interface Script {
    id: string;
    name: string;
    command: string;
    platform: string;
}

const TerminalTab: React.FC<TerminalTabProps> = ({ machine }) => {
    const [command, setCommand] = useState('');
    const [history, setHistory] = useState<Command[]>([]);
    const [loading, setLoading] = useState(false);

    // Script Library State
    const [scripts, setScripts] = useState<Script[]>([]);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [newScriptName, setNewScriptName] = useState('');

    const bottomRef = useRef<HTMLDivElement>(null);

    // Fetch history & scripts on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('systracker_token');
                const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

                // History
                const resHist = await fetch(`/api/machines/${machine.id}/commands`, { headers });
                if (resHist.ok) setHistory((await resHist.json()).reverse());

                // Scripts
                const resScripts = await fetch(`/api/scripts`, { headers });
                if (resScripts.ok) setScripts(await resScripts.json());

            } catch (err) {
                console.error(err);
            }
        };
        fetchData();

        // Socket listener for live updates
        const socket = io();
        socket.on('command_updated', (data: any) => {
            setHistory(prev => {
                const idx = prev.findIndex(c => c.id === data.id);
                if (idx !== -1) {
                    const newHist = [...prev];
                    newHist[idx] = { ...newHist[idx], ...data };
                    return newHist;
                }
                return prev;
            });
        });

        return () => {
            socket.disconnect();
        };
    }, [machine.id]);

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!command.trim()) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('systracker_token');
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };

            const res = await fetch(`/api/machines/${machine.id}/command`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ command })
            });

            if (res.ok) {
                const newCmd = await res.json();
                setHistory(prev => [...prev, {
                    id: newCmd.commandId,
                    command,
                    status: 'pending',
                    output: null,
                    created_at: new Date().toISOString(),
                    completed_at: null
                }]);
                setCommand('');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveScript = async () => {
        if (!newScriptName.trim() || !command.trim()) return;
        try {
            const token = localStorage.getItem('systracker_token');
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };

            const res = await fetch(`/api/scripts`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    name: newScriptName,
                    command: command,
                    platform: 'all'
                })
            });

            if (res.ok) {
                const saved = await res.json();
                setScripts(prev => [...prev, saved].sort((a, b) => a.name.localeCompare(b.name)));
                setShowSaveModal(false);
                setNewScriptName('');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteScript = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Delete this script?')) return;
        try {
            const token = localStorage.getItem('systracker_token');
            const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

            await fetch(`/api/scripts/${id}`, {
                method: 'DELETE',
                headers
            });
            setScripts(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="flex h-[500px] bg-slate-950 rounded-lg overflow-hidden border border-slate-800 font-mono text-sm">
            {/* Sidebar: Scripts */}
            <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
                <div className="p-3 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <FileCode size={12} /> Script Library
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {scripts.length === 0 && (
                        <div className="text-slate-600 text-xs italic p-2 text-center">No saved scripts.</div>
                    )}
                    {scripts.map(script => (
                        <div
                            key={script.id}
                            onClick={() => setCommand(script.command)}
                            className="group flex items-center justify-between p-2 rounded hover:bg-slate-800 cursor-pointer transition-colors text-slate-300 text-xs"
                        >
                            <div className="truncate font-medium pr-2" title={script.command}>
                                {script.name}
                            </div>
                            <button
                                onClick={(e) => handleDeleteScript(script.id, e)}
                                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 rounded transition-all"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Terminal Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="bg-slate-900 p-2 border-b border-slate-800 flex items-center justify-between text-slate-400">
                    <div className="flex items-center gap-2">
                        <Terminal size={14} />
                        <span className="text-xs">Remote Shell - {machine.hostname}</span>
                    </div>
                </div>

                {/* Output Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-slate-300">
                    {history.length === 0 && (
                        <div className="text-slate-600 italic text-center mt-20">
                            No command history. Type a command or select a script.
                            <br />
                            <span className="text-xs text-slate-700">Supports PowerShell (Windows) or Bash (Linux)</span>
                        </div>
                    )}

                    {history.map((cmd) => (
                        <div key={cmd.id} className="group">
                            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                                <span className="text-blue-500 font-bold">$</span>
                                <span>{new Date(cmd.created_at).toLocaleTimeString('en-US', { timeZone: 'UTC' })} UTC</span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold ${cmd.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                    cmd.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                                        'bg-yellow-500/10 text-yellow-500'
                                    }`}>
                                    {cmd.status}
                                </span>
                            </div>
                            <div className="font-bold text-white mb-1">{cmd.command}</div>
                            {cmd.output && (
                                <pre className="whitespace-pre-wrap text-slate-400 text-xs pl-4 border-l-2 border-slate-800 selected-all">
                                    {cmd.output}
                                </pre>
                            )}
                        </div>
                    ))}

                    {/* Scroll Anchor */}
                    <div ref={bottomRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="bg-slate-900 p-2 flex gap-2 border-t border-slate-800 relative">
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 font-bold">$</span>
                        <input
                            type="text"
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            placeholder="Enter command..."
                            className="w-full bg-slate-950 text-white pl-8 pr-12 py-2 rounded border border-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                            disabled={loading}
                        />
                        {command.trim() && (
                            <button
                                type="button"
                                onClick={() => setShowSaveModal(true)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400 transition-colors p-1"
                                title="Save as Script"
                            >
                                <Save size={14} />
                            </button>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !command.trim()}
                        className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <RotateCcw className="animate-spin" size={18} /> : <Play size={18} />}
                    </button>

                    {/* Save Modal Popover */}
                    {showSaveModal && (
                        <div className="absolute bottom-full left-0 right-0 bg-slate-800 p-3 border-t border-slate-700 shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-2">
                            <input
                                type="text"
                                autoFocus
                                value={newScriptName}
                                onChange={(e) => setNewScriptName(e.target.value)}
                                placeholder="Script Name (e.g. Flush DNS)"
                                className="flex-1 bg-slate-950 text-white px-3 py-1.5 rounded border border-slate-700 focus:border-blue-500 text-xs outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveScript()}
                            />
                            <button
                                type="button"
                                onClick={handleSaveScript}
                                disabled={!newScriptName.trim()}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded disabled:opacity-50"
                            >
                                Save
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowSaveModal(false)}
                                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default TerminalTab;
