'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import MachineCard from '../../components/MachineCard';
import MachineDetails from '../../components/MachineDetails';
import SystemLoadChart from '../../components/SystemLoadChart';
import { Machine } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Search, Cpu, Wifi, Server, Lock, X, Network, HardDrive } from 'lucide-react';
import { fetchWithAuth, clearToken, isViewer } from '../../lib/auth';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

export default function Dashboard() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'online' | 'offline' | 'critical'>('all');
  const [loading, setLoading] = useState(true);
  const [showAccessDeniedToast, setShowAccessDeniedToast] = useState(false);

  const router = useRouter(); // Explicitly use router

  // Handle machine card click with role-based access control
  const handleMachineClick = (machine: Machine) => {
    if (isViewer()) {
      // Show toast notification for viewers
      setShowAccessDeniedToast(true);
      setTimeout(() => setShowAccessDeniedToast(false), 4000);
      return;
    }
    setSelectedMachine(machine);
  };

  type MachineUpdatePayload = Partial<Machine> & { id: string; status?: 'online' | 'offline' };

  useEffect(() => {
    // Explicit socket options for better connectivity behind proxies
    const socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });

    // Initial fetch (with auth token)
    fetchWithAuth('/api/machines')
      .then(res => {
        if (res.status === 401) {
          clearToken(); // Ensure token is removed
          router.replace('/login');
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data && Array.isArray(data)) setMachines(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching machines:', err);
        setLoading(false);
      });

    // Real-time updates
    socket.on('machine_update', (data: MachineUpdatePayload) => {
      setMachines(prev => {
        const index = prev.findIndex(m => m.id === data.id);
        if (index === -1) {
          const newMachine: Machine = {
            hostname: data.hostname ?? data.id,
            ip: data.ip ?? '',
            os: data.os ?? '',
            status: 'online',
            last_seen: new Date().toISOString(),
            ...data,
          };
          return [...prev, newMachine];
        }
        const newMachines = [...prev];
        newMachines[index] = {
          ...newMachines[index],
          ...data,
          metrics: data.metrics || newMachines[index].metrics,
          hardware_info: data.hardware_info || newMachines[index].hardware_info,
          profile: data.profile || newMachines[index].profile,
          nickname: data.nickname || newMachines[index].nickname,
          status: (data.status || newMachines[index].status) as 'online' | 'offline'
        };
        return newMachines;
      });
    });

    socket.on('machine_status_change', ({ id, status }: { id: string, status: 'online' | 'offline' }) => {
      setMachines(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    });

    socket.on('machine_removed', ({ id }: { id: string }) => {
      setMachines(prev => prev.filter(m => m.id !== id));
      setSelectedMachine(prev => (prev?.id === id ? null : prev));
    });

    socket.on('refresh_request', () => {
      fetchWithAuth('/api/machines')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setMachines(data);
        })
        .catch(err => console.error('Refresh failed:', err));
    });

    return () => {
      socket.disconnect();
    };
  }, [router]);

  // Handle machine delete — removes from state and closes the detail panel
  const handleMachineDelete = (id: string) => {
    setMachines(prev => prev.filter(m => m.id !== id));
    setSelectedMachine(null);
  };

  // Keep selectedMachine in sync with the machines array.
  // When a profile save triggers a socket update, the machines array gets the
  // updated machine — this effect pushes that update into selectedMachine so
  // MachineDetails always renders fresh data without requiring a panel reopen.
  useEffect(() => {
    setSelectedMachine(prev => {
      if (!prev) return prev;
      const latest = machines.find(m => m.id === prev.id);
      return latest ?? prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [machines]);

  // Filter Logic
  const filteredMachines = machines.filter(machine => {
    if (!machine) return false;

    const hostname = machine.hostname || '';
    const ip = machine.ip || '';
    const nickname = machine.nickname || '';
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      hostname.toLowerCase().includes(query) ||
      ip.includes(searchQuery) ||
      nickname.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (filter === 'all') return true;
    if (filter === 'online') return machine.status === 'online';
    if (filter === 'offline') return machine.status === 'offline';
    if (filter === 'critical') return (machine.metrics?.cpu || 0) > 90 || (machine.metrics?.ram || 0) > 90;

    return true;
  });

  const totalAgents = machines.length;
  const onlineAgents = machines.filter(m => m.status === 'online').length;
  const offlineAgents = totalAgents - onlineAgents;
  const criticalAlerts = machines.filter(m => (m.metrics?.cpu || 0) > 90 || (m.metrics?.ram || 0) > 90).length;

  // OS distribution
  const osDist = machines.reduce<Record<string, number>>((acc, m) => {
    const name = m.os
      ? m.os.includes('Windows') ? 'Windows'
        : m.os.includes('Ubuntu') || m.os.includes('Debian') ? 'Linux (Debian)'
        : m.os.includes('Linux') ? 'Linux'
        : m.os.includes('Mac') ? 'macOS'
        : 'Other'
      : 'Unknown';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  const osColors: Record<string, string> = {
    'Windows': '#3b82f6', 'Linux (Debian)': '#f59e0b', 'Linux': '#f59e0b',
    'macOS': '#10b981', 'Other': '#6366f1', 'Unknown': '#94a3b8'
  };

  // Network I/O totals (from all online machines)
  const totalNetUp = machines.reduce((acc, m) => acc + (m.metrics?.network_up_kbps || 0), 0);
  const totalNetDown = machines.reduce((acc, m) => acc + (m.metrics?.network_down_kbps || 0), 0);
  const fmtNet = (kbps: number) => kbps > 1024 ? `${(kbps/1024).toFixed(1)} MB/s` : `${Math.round(kbps)} KB/s`;

  // Top 5 machines by CPU
  const topCPU = [...machines].filter(m => m.status === 'online').sort((a, b) => (b.metrics?.cpu || 0) - (a.metrics?.cpu || 0)).slice(0, 5);

  // Online/Offline ring
  const ringR = 28; const ringCircum = 2 * Math.PI * ringR;
  const onlinePct = totalAgents > 0 ? onlineAgents / totalAgents : 0;

  return (
    <>
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">

        {/* Dashboard Header & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 mb-6">
          <div className="lg:col-span-3 flex flex-col justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg shadow-blue-500/30">
                  <Activity className="text-white" size={24} />
                </div>
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">Dashboard</span>
              </h1>
              <p className="text-slate-500 text-sm mt-2 ml-1">Live infrastructure metrics and system overview.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-4 mt-5">
              <div className="bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(34,197,94,0.15)] transition-all duration-300 flex items-center justify-between group hover:scale-[1.02]">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Online Agents</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                    {onlineAgents}
                  </p>
                  <p className="text-xs text-slate-400 font-medium mt-1">of {totalAgents} total</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-emerald-100 to-green-50 rounded-xl text-green-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Wifi size={24} strokeWidth={2.5} />
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(239,68,68,0.15)] transition-all duration-300 flex items-center justify-between group hover:scale-[1.02]">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Critical Alerts</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                    {criticalAlerts}
                  </p>
                  <p className="text-xs text-slate-400 font-medium mt-1">high usage</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-red-100 to-rose-50 rounded-xl text-red-500 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Activity size={24} strokeWidth={2.5} />
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(59,130,246,0.15)] transition-all duration-300 flex items-center justify-between group hover:scale-[1.02]">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Avg CPU Load</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {totalAgents > 0 ? Math.round(machines.reduce((acc, m) => acc + (m.metrics?.cpu || 0), 0) / totalAgents) : 0}%
                  </p>
                  <p className="text-xs text-slate-400 font-medium mt-1">across fleet</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-50 rounded-xl text-blue-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Cpu size={24} strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)] flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search machines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md"
              />
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter Status</span>
              <div className="flex flex-wrap gap-2">
                {(['all', 'online', 'offline', 'critical'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all duration-300 border ${filter === f
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-transparent shadow-[0_4px_12px_rgba(99,102,241,0.3)] scale-105'
                      : 'bg-white text-slate-600 border-slate-200/50 hover:border-blue-300 hover:text-blue-600 hover:shadow-sm hover:scale-105'
                      }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <SystemLoadChart />
        </div>

        {/* Infrastructure Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
          {/* Online / Offline Ring */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-all duration-300 p-5 flex items-center gap-4 group hover:scale-[1.02]">
            <svg width={80} height={80} className="shrink-0">
              <circle cx={40} cy={40} r={ringR} fill="none" stroke="#f1f5f9" strokeWidth={8} />
              <circle cx={40} cy={40} r={ringR} fill="none" stroke="#ef4444" strokeWidth={8}
                strokeDasharray={ringCircum}
                strokeDashoffset={ringCircum * onlinePct}
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', strokeLinecap: 'round' }} />
              <circle cx={40} cy={40} r={ringR} fill="none" stroke="#22c55e" strokeWidth={8}
                strokeDasharray={ringCircum * onlinePct}
                strokeDashoffset={0}
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', strokeLinecap: 'round' }} />
              <text x={40} y={45} textAnchor="middle" fontSize={16} fontWeight={700} fill="#1e293b">{totalAgents}</text>
            </svg>
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-bold text-slate-700 mb-1">Machines</p>
              <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />{onlineAgents} Online</div>
              <div className="flex items-center gap-2 text-xs text-red-500 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-sm" />{offlineAgents} Offline</div>
            </div>
          </div>

          {/* OS Distribution */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-all duration-300 p-5 group hover:scale-[1.02]">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Server size={14} className="text-blue-500" />
              OS Distribution
            </p>
            {Object.keys(osDist).length === 0 ? (
              <p className="text-slate-400 text-sm">No data</p>
            ) : (
              <div className="flex flex-col gap-2">
                {Object.entries(osDist).map(([os, count]) => {
                  const pct = Math.round((count / totalAgents) * 100);
                  return (
                    <div key={os}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600 font-medium truncate max-w-[120px]">{os}</span>
                        <span className="text-slate-500 font-semibold">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div style={{ width: `${pct}%`, backgroundColor: osColors[os] || '#94a3b8' }} 
                          className="h-full rounded-full transition-all duration-500 shadow-sm" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Network I/O */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-all duration-300 p-5 flex flex-col justify-between group hover:scale-[1.02]">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Network size={14} className="text-purple-500" />
              Network I/O
            </p>
            <div className="flex flex-col gap-3">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl px-4 py-3 border border-blue-100/50 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-blue-600 font-bold uppercase">Upload</p>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                </div>
                <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{fmtNet(totalNetUp)}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl px-4 py-3 border border-emerald-100/50 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-emerald-600 font-bold uppercase">Download</p>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">{fmtNet(totalNetDown)}</p>
              </div>
            </div>
          </div>

          {/* Top machines by CPU */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-all duration-300 p-5 group hover:scale-[1.02]">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Cpu size={14} className="text-amber-500" />
              Top CPU Load
            </p>
            {topCPU.length === 0 ? (
              <p className="text-slate-400 text-sm">No online machines</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {topCPU.map(m => {
                  const cpu = m.metrics?.cpu || 0;
                  const col = cpu > 80 ? 'bg-gradient-to-r from-red-500 to-rose-500' : cpu > 50 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-green-500';
                  const textCol = cpu > 80 ? 'text-red-600' : cpu > 50 ? 'text-amber-600' : 'text-emerald-600';
                  return (
                    <div key={m.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-700 font-medium truncate max-w-[120px]">{m.nickname || m.hostname}</span>
                        <span className={`font-bold ${textCol}`}>{cpu}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div style={{ width: `${cpu}%` }} 
                          className={`h-full rounded-full transition-all duration-500 shadow-sm ${col}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
        >
          <AnimatePresence mode='popLayout'>
            {loading && machines.length === 0 && (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-48 rounded-2xl bg-white/50 border border-slate-200 animate-pulse" />
              ))
            )}

            {filteredMachines.map(machine => (
              <motion.div
                key={machine.id}
                variants={item}
                layoutId={machine.id}
                className="h-full"
              >
                <MachineCard
                  machine={machine}
                  onClick={handleMachineClick}
                  isViewerMode={isViewer()}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {!loading && filteredMachines.length === 0 && (
            <div className="col-span-full text-center py-20 text-slate-400">
              <Server size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Monitoring Agents Found</p>
              <p className="text-sm">Run &apos;python agent.py&apos; on your machines to connect.</p>
            </div>
          )}
        </motion.div>
      </main>

      {selectedMachine && (
        <MachineDetails
          machine={selectedMachine}
          onClose={() => setSelectedMachine(null)}
          onDelete={handleMachineDelete}
        />
      )}

      {/* Access Denied Toast for Viewers */}
      <AnimatePresence>
        {showAccessDeniedToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className="fixed top-8 left-1/2 z-50 bg-amber-500 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-amber-500/30 flex items-center gap-3 border border-amber-400 max-w-md"
          >
            <Lock size={20} className="shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-sm">Admin Access Required</p>
              <p className="text-xs text-amber-100 mt-0.5">
                You do not have permission to view detailed machine telemetry and terminal controls.
              </p>
            </div>
            <button
              onClick={() => setShowAccessDeniedToast(false)}
              className="text-amber-100 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
