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
    const [showEditPolicy, setShowEditPolicy] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState<AlertPolicy | null>(null);
    const [newPolicy, setNewPolicy] = useState<Partial<AlertPolicy>>({
        metric: 'cpu',
        operator: '>',
        threshold: 90,
        duration_minutes: 1,
        priority: 'high',
        enabled: true
    });

    const priorities: AlertPolicy['priority'][] = ['low', 'medium', 'high'];

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

    const handleEditPolicy = (policy: AlertPolicy) => {
        setEditingPolicy(policy);
        setShowEditPolicy(true);
    };

    const handleUpdatePolicy = async () => {
        if (!editingPolicy) return;

        try {
            const token = localStorage.getItem('systracker_token');
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };

            await fetch(`/api/alerts/policies/${editingPolicy.id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(editingPolicy)
            });
            setShowEditPolicy(false);
            setEditingPolicy(null);
            refreshData();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg shadow-blue-500/30">
                            <Shield className="text-white" size={26} />
                        </div>
                        <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">Security & Alerts</span>
                    </h1>
                    <p className="text-slate-500 mt-2 ml-1">Monitor system health and configure automated policies.</p>
                </div>
                <div className="flex bg-white/80 backdrop-blur-xl rounded-xl p-1.5 border border-slate-200/50 shadow-lg">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 flex items-center gap-2 ${activeTab === 'overview' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30' : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'}`}
                    >
                        <Activity size={16} /> Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('policies')}
                        className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 flex items-center gap-2 ${activeTab === 'policies' ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md shadow-purple-500/30' : 'text-slate-600 hover:text-purple-600 hover:bg-purple-50'}`}
                    >
                        <Settings size={16} /> Policies
                    </button>
                </div>
            </div>

            {activeTab === 'overview' ? (
                <div className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(239,68,68,0.15)] transition-all duration-300 group hover:scale-[1.02]">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-gradient-to-br from-red-100 to-rose-50 text-red-600 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300"><AlertTriangle size={26} strokeWidth={2.5} /></div>
                                <div>
                                    <h3 className="text-3xl font-bold text-slate-800">{alerts.filter(a => a.priority === 'high').length}</h3>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Critical Alerts</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(245,158,11,0.15)] transition-all duration-300 group hover:scale-[1.02]">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-gradient-to-br from-amber-100 to-orange-50 text-amber-600 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300"><Bell size={26} strokeWidth={2.5} /></div>
                                <div>
                                    <h3 className="text-3xl font-bold text-slate-800">{alerts.length}</h3>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Total Active</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(34,197,94,0.15)] transition-all duration-300 group hover:scale-[1.02]">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-gradient-to-br from-emerald-100 to-green-50 text-emerald-600 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300"><CheckCircle size={26} strokeWidth={2.5} /></div>
                                <div>
                                    <h3 className="text-3xl font-bold text-slate-800">{policies.filter(p => p.enabled).length}</h3>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Active Policies</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Active Alerts List */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)] overflow-hidden">
                        <div className="p-6 border-b border-slate-200/50 bg-gradient-to-r from-slate-50/50 to-blue-50/30 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 text-lg">Active Incidents</h3>
                            <button
                                onClick={refreshData}
                                disabled={loading}
                                className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:scale-100 shadow-md"
                            >
                                {loading ? 'Refreshing...' : 'Refresh'}
                            </button>
                        </div>
                        <div className="divide-y divide-slate-100/50">
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
                                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button
                                        onClick={() => handleEditPolicy(policy)}
                                        className="text-slate-300 hover:text-blue-500 transition-colors"
                                        title="Edit policy"
                                    >
                                        <Settings size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeletePolicy(policy.id)}
                                        className="text-slate-300 hover:text-red-500 transition-colors"
                                        title="Delete policy"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
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
                                                {priorities.map(p => (
                                                    <button
                                                        key={p}
                                                        onClick={() => setNewPolicy({ ...newPolicy, priority: p })}
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

                    {/* Edit Policy Modal */}
                    <AnimatePresence>
                        {showEditPolicy && editingPolicy && (
                            <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100"
                                >
                                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                        <h3 className="text-lg font-bold text-slate-800">Edit Alert Policy</h3>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Policy Name</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                                placeholder="e.g. High CPU Usage"
                                                value={editingPolicy.name || ''}
                                                onChange={e => setEditingPolicy({ ...editingPolicy, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Metric</label>
                                                <select
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                                                    value={editingPolicy.metric}
                                                    onChange={e => setEditingPolicy({ ...editingPolicy, metric: e.target.value })}
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
                                                    value={editingPolicy.operator}
                                                    onChange={e => setEditingPolicy({ ...editingPolicy, operator: e.target.value })}
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
                                                    value={editingPolicy.threshold}
                                                    onChange={e => setEditingPolicy({ ...editingPolicy, threshold: Number(e.target.value) })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Duration (Min)</label>
                                                <input
                                                    type="number"
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                                                    value={editingPolicy.duration_minutes}
                                                    onChange={e => setEditingPolicy({ ...editingPolicy, duration_minutes: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Priority</label>
                                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                                {priorities.map(p => (
                                                    <button
                                                        key={p}
                                                        onClick={() => setEditingPolicy({ ...editingPolicy, priority: p })}
                                                        className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${editingPolicy.priority === p ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={editingPolicy.enabled}
                                                    onChange={e => setEditingPolicy({ ...editingPolicy, enabled: e.target.checked })}
                                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm font-medium text-slate-700">Policy Enabled</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                                        <button
                                            onClick={() => { setShowEditPolicy(false); setEditingPolicy(null); }}
                                            className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleUpdatePolicy}
                                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-sm shadow-blue-200 transition-all"
                                        >
                                            Update Policy
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
