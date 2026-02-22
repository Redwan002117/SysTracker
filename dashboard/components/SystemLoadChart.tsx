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
    Legend,
    LineChart,
    Line
} from 'recharts';
import { Loader2, Activity, HardDrive, Wifi, BarChart2 } from 'lucide-react';

interface TooltipEntry {
    name: string;
    value: number;
    color: string;
    unit?: string;
}

interface TooltipProps {
    active?: boolean;
    payload?: TooltipEntry[];
    label?: number;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-700">
                <p className="font-bold mb-2 text-slate-300">{new Date(label ?? 0).toLocaleString('en-US', { timeZone: 'UTC' })} UTC</p>
                {payload.map((entry: TooltipEntry, index: number) => (
                    <div key={index} className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="capitalize text-slate-300">{entry.name}:</span>
                        <span className="font-mono font-bold">
                            {entry.value != null ? entry.value.toFixed(1) : '—'}{entry.unit || '%'}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

type MetricView = 'cpu_ram' | 'disk' | 'network';

const METRIC_TABS: { key: MetricView; label: string; icon: React.ElementType }[] = [
    { key: 'cpu_ram', label: 'CPU & RAM', icon: Activity },
    { key: 'disk', label: 'Disk', icon: HardDrive },
    { key: 'network', label: 'Network', icon: Wifi },
];

export default function SystemLoadChart() {
    const [range, setRange] = useState<'1h' | '24h' | '7d'>('24h');
    const [view, setView] = useState<MetricView>('cpu_ram');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('systracker_token');
                const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
                const res = await fetch(`/api/history/global?range=${range}`, { headers });
                if (res.ok) {
                    const rawData = await res.json();
                    const processed = rawData.map((d: any) => ({
                        timestamp: new Date(d.timestamp).getTime(),
                        cpu: d.avg_cpu != null ? Number(d.avg_cpu.toFixed(1)) : null,
                        ram: d.avg_ram != null ? Number(d.avg_ram.toFixed(1)) : null,
                        disk: d.avg_disk != null ? Number(d.avg_disk.toFixed(1)) : null,
                        net_up: d.avg_net_up != null ? Number((d.avg_net_up / 1024).toFixed(2)) : null,
                        net_down: d.avg_net_down != null ? Number((d.avg_net_down / 1024).toFixed(2)) : null,
                        machines: d.machine_count,
                    }));
                    setData(processed);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
        const interval = setInterval(fetchHistory, 60000);
        return () => clearInterval(interval);
    }, [range]);

    const tickFormatter = (unix: number) =>
        new Date(unix).toLocaleTimeString('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' }) + ' UTC';

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-full">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <BarChart2 className="text-blue-500" size={18} />
                        Global System Load
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Average resource usage across all machines
                        {data.length > 0 && data[data.length - 1]?.machines != null &&
                            ` · ${data[data.length - 1].machines} machine${data[data.length - 1].machines !== 1 ? 's' : ''}`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Metric view tabs */}
                    <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
                        {METRIC_TABS.map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setView(key)}
                                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all ${view === key
                                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                                    : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Icon size={12} /> {label}
                            </button>
                        ))}
                    </div>
                    {/* Time range */}
                    <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
                        {([
                            { label: '1H', value: '1h' },
                            { label: '24H', value: '24h' },
                            { label: '7D', value: '7d' },
                        ] as const).map((r) => (
                            <button
                                key={r.value}
                                onClick={() => setRange(r.value)}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${range === r.value
                                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                                    : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Fixed pixel height prevents the Recharts -1 warning */}
            <div style={{ width: '100%', height: 256 }}>
                {loading && data.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        <Loader2 className="animate-spin mr-2" /> Loading data...
                    </div>
                ) : data.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        <Activity size={24} className="mr-2 opacity-30" />
                        <span className="text-sm">No data available for this range</span>
                    </div>
                ) : view === 'cpu_ram' ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                            <defs>
                                <linearGradient id="globalCpu" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="globalRam" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="timestamp" type="number" domain={['dataMin', 'dataMax']}
                                tickFormatter={tickFormatter} tick={{ fontSize: 10, fill: '#94a3b8' }}
                                axisLine={false} tickLine={false} minTickGap={40} />
                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                            <Area type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2}
                                fillOpacity={1} fill="url(#globalCpu)" name="Avg CPU" unit="%" connectNulls />
                            <Area type="monotone" dataKey="ram" stroke="#8b5cf6" strokeWidth={2}
                                fillOpacity={1} fill="url(#globalRam)" name="Avg RAM" unit="%" connectNulls />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : view === 'disk' ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                            <defs>
                                <linearGradient id="globalDisk" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="timestamp" type="number" domain={['dataMin', 'dataMax']}
                                tickFormatter={tickFormatter} tick={{ fontSize: 10, fill: '#94a3b8' }}
                                axisLine={false} tickLine={false} minTickGap={40} />
                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                            <Area type="monotone" dataKey="disk" stroke="#f59e0b" strokeWidth={2}
                                fillOpacity={1} fill="url(#globalDisk)" name="Avg Disk Used" unit="%" connectNulls />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="timestamp" type="number" domain={['dataMin', 'dataMax']}
                                tickFormatter={tickFormatter} tick={{ fontSize: 10, fill: '#94a3b8' }}
                                axisLine={false} tickLine={false} minTickGap={40} />
                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit=" MB/s" />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                            <Line type="monotone" dataKey="net_up" stroke="#10b981" strokeWidth={2}
                                dot={false} name="Upload" unit=" MB/s" connectNulls />
                            <Line type="monotone" dataKey="net_down" stroke="#06b6d4" strokeWidth={2}
                                dot={false} name="Download" unit=" MB/s" connectNulls />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
