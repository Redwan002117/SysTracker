'use client';

import React, { useState, useEffect } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { Loader2, Calendar } from 'lucide-react';

interface PerformanceHistoryProps {
    machineId: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-700">
                <p className="font-bold mb-2 text-slate-300">{new Date(label).toLocaleString('en-US', { timeZone: 'UTC' })} UTC</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="capitalize">{entry.name}:</span>
                        <span className="font-mono font-bold">
                            {entry.value.toFixed(1)}
                            {entry.unit}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function PerformanceHistory({ machineId }: PerformanceHistoryProps) {
    const [range, setRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, [machineId, range]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('systracker_token');
            const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
            const res = await fetch(`/api/machines/${machineId}/history?range=${range}`, { headers });
            if (res.ok) {
                const rawData = await res.json();
                // Process data for charts
                const processed = rawData.map((d: any) => ({
                    ...d,
                    timestamp: new Date(d.timestamp).getTime(), // Ensure numeric timestamp
                    cpu: d.cpu_usage,
                    ram: d.ram_usage,
                    net_up: (d.network_up_kbps || 0) / 1024, // Convert to Mbps
                    net_down: (d.network_down_kbps || 0) / 1024
                }));
                setData(processed);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const ranges = [
        { label: '1 Hour', value: '1h' },
        { label: '24 Hours', value: '24h' },
        { label: '7 Days', value: '7d' },
        { label: '30 Days', value: '30d' },
    ];

    if (loading && data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400">
                <Loader2 className="animate-spin mr-2" /> Loading history...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header / Controls */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={16} /> Performance Trends
                </h3>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    {ranges.map((r) => (
                        <button
                            key={r.value}
                            onClick={() => setRange(r.value as any)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${range === r.value
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Charts Grid */}
            <div className="space-y-8">
                {/* CPU Chart */}
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm h-64 flex flex-col">
                    <div className="text-xs font-bold text-slate-500 mb-3">CPU Usage (%)</div>
                    <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="timestamp"
                                type="number"
                                domain={['dataMin', 'dataMax']}
                                tickFormatter={(unix) => new Date(unix).toLocaleTimeString('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' }) + ' UTC'}
                                tick={{ fontSize: 10, fill: '#64748b' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 10, fill: '#64748b' }}
                                axisLine={false}
                                tickLine={false}
                                domain={[0, 100]}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="cpu"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorCpu)"
                                name="CPU"
                                unit="%"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                    </div>
                </div>

                {/* RAM Chart */}
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm h-64 flex flex-col">
                    <div className="text-xs font-bold text-slate-500 mb-3">RAM Usage (%)</div>
                    <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="timestamp"
                                type="number"
                                domain={['dataMin', 'dataMax']}
                                tickFormatter={(unix) => new Date(unix).toLocaleTimeString('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' }) + ' UTC'}
                                tick={{ fontSize: 10, fill: '#64748b' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 10, fill: '#64748b' }}
                                axisLine={false}
                                tickLine={false}
                                domain={[0, 100]}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="ram"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorRam)"
                                name="RAM"
                                unit="%"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                    </div>
                </div>

                {/* Network Chart */}
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm h-64 flex flex-col">
                    <div className="text-xs font-bold text-slate-500 mb-3">Network Traffic (Mbps)</div>
                    <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="timestamp"
                                type="number"
                                domain={['dataMin', 'dataMax']}
                                tickFormatter={(unix) => new Date(unix).toLocaleTimeString('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' }) + ' UTC'}
                                tick={{ fontSize: 10, fill: '#64748b' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 10, fill: '#64748b' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="net_down"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorDown)"
                                name="Download"
                                unit=" Mbps"
                            />
                            <Area
                                type="monotone"
                                dataKey="net_up"
                                stroke="#10b981"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorUp)"
                                name="Upload"
                                unit=" Mbps"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
