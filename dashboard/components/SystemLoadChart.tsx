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
import { Loader2, Activity } from 'lucide-react';

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
                            {entry.value.toFixed(1)}%
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function SystemLoadChart() {
    const [range, setRange] = useState<'1h' | '24h' | '7d'>('24h');
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
                        cpu: d.avg_cpu,
                        ram: d.avg_ram
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

        // Refresh every minute
        const interval = setInterval(fetchHistory, 60000);
        return () => clearInterval(interval);
    }, [range]);

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Activity className="text-blue-500" size={18} />
                        Global System Load
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Average resource usage across all machines</p>
                </div>
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
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-64 w-full flex flex-col">
                {loading && data.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        <Loader2 className="animate-spin mr-2" /> Loading data...
                    </div>
                ) : (
                    <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="globalCpu" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="globalRam" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="timestamp"
                                type="number"
                                domain={['dataMin', 'dataMax']}
                                tickFormatter={(unix) => new Date(unix).toLocaleTimeString('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' }) + ' UTC'}
                                tick={{ fontSize: 10, fill: '#94a3b8' }}
                                axisLine={false}
                                tickLine={false}
                                minTickGap={30}
                            />
                            <YAxis
                                tick={{ fontSize: 10, fill: '#94a3b8' }}
                                axisLine={false}
                                tickLine={false}
                                domain={[0, 100]}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                            <Area
                                type="monotone"
                                dataKey="cpu"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#globalCpu)"
                                name="Avg CPU"
                                unit="%"
                            />
                            <Area
                                type="monotone"
                                dataKey="ram"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#globalRam)"
                                name="Avg RAM"
                                unit="%"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
}
