'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Bell, Settings, Plus, Trash2, CheckCircle, AlertTriangle, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AlertPolicy {
    id: string;
    name: string;
    metric: string;
    operator: string;
    threshold: number;
    duration_minutes: number;
    priority: 'low' | 'medium' | 'high';
    enabled: boolean;
}

interface ActiveAlert {
    id: string;
    machine_id: string;
    hostname: string;
    policy_name: string;
    value: number;
    priority: 'low' | 'medium' | 'high';
    created_at: string;
}

export default function AlertsPage() {
    const [activeTab, setActiveTab] = useState<'overview' | 'policies'>('overview');
    const [policies, setPolicies] = useState<AlertPolicy[]>([]);
    const [alerts, setAlerts] = useState<ActiveAlert[]>([]);
    const [loading, setLoading] = useState(true);

    const [showAddPolicy, setShowAddPolicy] = useState(false);
    const [newPolicy, setNewPolicy] = useState<Partial<AlertPolicy>>({
        metric: 'cpu',
        operator: '>',
        threshold: 90,
        duration_minutes: 1,
        priority: 'high',
        enabled: true
    });

    const refreshData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('systracker_token');
            const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

            const [polRes, alertRes] = await Promise.all([
                fetch('/api/alerts/policies', { headers }),
                fetch('/api/alerts/active', { headers })
            ]);

            if (polRes.ok) setPolicies(await polRes.json());
            if (alertRes.ok) setAlerts(await alertRes.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const handleAddPolicy = async () => {
        if (!newPolicy.name) return alert('Name is required');

        try {
            const token = localStorage.getItem('systracker_token');
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };

            await fetch('/api/alerts/policies', {
                method: 'POST',
                headers,
                body: JSON.stringify(newPolicy)
            });
            setShowAddPolicy(false);
            refreshData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeletePolicy = async (id: string) => {
        if (!confirm('Area you sure you want to delete this policy?')) return;
        try {
            const token = localStorage.getItem('systracker_token');
            const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
            await fetch(`/api/alerts/policies/${id}`, { method: 'DELETE', headers });
            setPolicies(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <Shield className="text-blue-600" /> Security & Alerts
                    </h1>
                    <p className="text-slate-500 mt-1">Monitor system health and configure automated policies.</p>
                </div>
                <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'overview' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Activity size={16} /> Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('policies')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'policies' ? 'bg-purple-50 text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Settings size={16} /> Policies
                    </button>
                </div>
            </div>

            {activeTab === 'overview' ? (
                <div className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-50 text-red-600 rounded-xl"><AlertTriangle size={24} /></div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-800">{alerts.filter(a => a.priority === 'high').length}</h3>
                                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Critical Alerts</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Bell size={24} /></div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-800">{alerts.length}</h3>
                                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Total Active</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle size={24} /></div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-800">{policies.filter(p => p.enabled).length}</h3>
                                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Active Policies</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Active Alerts List */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <h3 className="font-bold text-slate-700">Active Incidents</h3>
                            <button onClick={refreshData} className="text-sm text-blue-600 hover:underline">Refresh</button>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {alerts.length === 0 ? (
                                <div className="p-12 text-center text-slate-400 italic flex flex-col items-center gap-4">
                                    <CheckCircle size={48} className="text-emerald-100" />
                                    <span>All systems normal. No active alerts.</span>
                                </div>
                            ) : (
                                alerts.map(alert => (
                                    <div key={alert.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-2 h-2 rounded-full ${alert.priority === 'high' ? 'bg-red-500 shadow-red-200 shadow-[0_0_8px]' : 'bg-amber-500'}`} />
                                            <div>
                                                <h4 className="font-semibold text-slate-800 text-sm">{alert.policy_name}</h4>
                                                <p className="text-xs text-slate-500">
                                                    Machine: <span className="font-medium text-slate-700">{alert.hostname}</span> •
                                                    Value: <span className="font-mono">{typeof alert.value === 'number' ? alert.value.toFixed(1) : alert.value}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-mono text-slate-400">{new Date(alert.created_at).toLocaleTimeString()}</span>
                                            <div className={`mt-1 text-[10px] font-bold uppercase tracking-wider ${alert.priority === 'high' ? 'text-red-500' : 'text-amber-500'}`}>{alert.priority}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Policies Header */}
                    <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Alert Policies</h2>
                            <p className="text-sm text-slate-500">Define thresholds for automatic alerting.</p>
                        </div>
                        <button
                            onClick={() => setShowAddPolicy(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm shadow-blue-200"
                        >
                            <Plus size={16} /> New Policy
                        </button>
                    </div>

                    {/* Policies List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {policies.map(policy => (
                            <div key={policy.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:border-blue-100 hover:shadow-md transition-all group relative">
                                <button
                                    onClick={() => handleDeletePolicy(policy.id)}
                                    className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`p-2 rounded-lg ${policy.enabled ? 'bg-purple-50 text-purple-600' : 'bg-slate-50 text-slate-400'}`}>
                                        <Activity size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-700">{policy.name}</h4>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${policy.enabled ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                            {policy.enabled ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm text-slate-500">
                                    <div className="flex justify-between border-b border-slate-50 pb-2">
                                        <span>Condition</span>
                                        <span className="font-mono font-medium text-slate-700">{policy.metric.toUpperCase()} {policy.operator} {policy.threshold}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-50 pb-2">
                                        <span>Duration</span>
                                        <span className="font-medium text-slate-700">{policy.duration_minutes} min</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Priority</span>
                                        <span className={`font-bold uppercase text-xs ${policy.priority === 'high' ? 'text-red-500' : 'text-slate-500'}`}>{policy.priority}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Policy Modal */}
                    <AnimatePresence>
                        {showAddPolicy && (
                            <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100"
                                >
                                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                        <h3 className="text-lg font-bold text-slate-800">Create Alert Policy</h3>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Policy Name</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                                placeholder="e.g. High CPU Usage"
                                                value={newPolicy.name || ''}
                                                onChange={e => setNewPolicy({ ...newPolicy, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Metric</label>
                                                <select
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                                                    value={newPolicy.metric}
                                                    onChange={e => setNewPolicy({ ...newPolicy, metric: e.target.value })}
                                                >
                                                    <option value="cpu">CPU Usage (%)</option>
                                                    <option value="ram">RAM Usage (%)</option>
                                                    <option value="disk">Disk Usage (%)</option>
                                                    <option value="offline">Offline Status</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Operator</label>
                                                <select
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                                                    value={newPolicy.operator}
                                                    onChange={e => setNewPolicy({ ...newPolicy, operator: e.target.value })}
                                                >
                                                    <option value=">">Greater Than (&gt;)</option>
                                                    <option value="<">Less Than (&lt;)</option>
                                                    <option value="=">Equals (=)</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Threshold</label>
                                                <input
                                                    type="number"
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                                                    value={newPolicy.threshold}
                                                    onChange={e => setNewPolicy({ ...newPolicy, threshold: Number(e.target.value) })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Duration (Min)</label>
                                                <input
                                                    type="number"
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                                                    value={newPolicy.duration_minutes}
                                                    onChange={e => setNewPolicy({ ...newPolicy, duration_minutes: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Priority</label>
                                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                                {['low', 'medium', 'high'].map(p => (
                                                    <button
                                                        key={p}
                                                        onClick={() => setNewPolicy({ ...newPolicy, priority: p as any })}
                                                        className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${newPolicy.priority === p ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                                        <button
                                            onClick={() => setShowAddPolicy(false)}
                                            className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleAddPolicy}
                                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-sm shadow-blue-200 transition-all"
                                        >
                                            Create Policy
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
