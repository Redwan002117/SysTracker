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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="lg:col-span-3 flex flex-col justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Activity className="text-blue-500" /> Dashboard
              </h1>
              <p className="text-slate-500 text-sm mt-1">Live infrastructure metrics.</p>
            </div>

            {/* KPI Cards (Compact) */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Online</p>
                  <p className="text-2xl font-bold text-slate-800">{onlineAgents} <span className="text-slate-400 text-base font-normal">/ {totalAgents}</span></p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg text-green-600">
                  <Wifi size={20} />
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Critical</p>
                  <p className="text-2xl font-bold text-red-500">{criticalAlerts}</p>
                </div>
                <div className="p-2 bg-red-50 rounded-lg text-red-500">
                  <Activity size={20} />
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Avg Load</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {totalAgents > 0 ? Math.round(machines.reduce((acc, m) => acc + (m.metrics?.cpu || 0), 0) / totalAgents) : 0}%
                  </p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <Cpu size={20} />
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Filter Status</span>
              <div className="flex flex-wrap gap-2">
                {(['all', 'online', 'offline', 'critical'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all border ${filter === f
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
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

        {/* Extra Metric Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {/* Online / Offline Ring */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-4">
            <svg width={72} height={72} className="shrink-0">
              <circle cx={36} cy={36} r={ringR} fill="none" stroke="#f1f5f9" strokeWidth={8} />
              <circle cx={36} cy={36} r={ringR} fill="none" stroke="#ef4444" strokeWidth={8}
                strokeDasharray={ringCircum}
                strokeDashoffset={ringCircum * onlinePct}
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', strokeLinecap: 'round' }} />
              <circle cx={36} cy={36} r={ringR} fill="none" stroke="#22c55e" strokeWidth={8}
                strokeDasharray={ringCircum * onlinePct}
                strokeDashoffset={0}
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', strokeLinecap: 'round' }} />
              <text x={36} y={40} textAnchor="middle" fontSize={14} fontWeight={700} fill="#1e293b">{totalAgents}</text>
            </svg>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-slate-700">Machines</p>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />{onlineAgents} Online</div>
              <div className="flex items-center gap-1.5 text-xs text-red-500"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />{offlineAgents} Offline</div>
            </div>
          </div>

          {/* OS Distribution */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-3">OS Distribution</p>
            {Object.keys(osDist).length === 0 ? (
              <p className="text-slate-400 text-sm">No data</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {Object.entries(osDist).map(([os, count]) => {
                  const pct = Math.round((count / totalAgents) * 100);
                  return (
                    <div key={os}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600 truncate max-w-[120px]">{os}</span>
                        <span className="text-slate-500 font-medium">{count}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div style={{ width: `${pct}%`, backgroundColor: osColors[os] || '#94a3b8' }} className="h-full rounded-full transition-all" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Network I/O */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-3 flex items-center gap-1.5"><Network size={13} />Network I/O (total)</p>
            <div className="flex flex-col gap-3">
              <div className="bg-blue-50 rounded-xl px-4 py-2.5">
                <p className="text-xs text-blue-500 font-medium">Upload</p>
                <p className="text-xl font-bold text-blue-700">{fmtNet(totalNetUp)}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl px-4 py-2.5">
                <p className="text-xs text-emerald-500 font-medium">Download</p>
                <p className="text-xl font-bold text-emerald-700">{fmtNet(totalNetDown)}</p>
              </div>
            </div>
          </div>

          {/* Top machines by CPU */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-3 flex items-center gap-1.5"><Cpu size={13} />Top CPU Load</p>
            {topCPU.length === 0 ? (
              <p className="text-slate-400 text-sm">No online machines</p>
            ) : (
              <div className="flex flex-col gap-2">
                {topCPU.map(m => {
                  const cpu = m.metrics?.cpu || 0;
                  const col = cpu > 80 ? 'bg-red-500' : cpu > 50 ? 'bg-amber-500' : 'bg-emerald-500';
                  return (
                    <div key={m.id}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600 truncate max-w-[100px]">{m.nickname || m.hostname}</span>
                        <span className={`font-semibold ${cpu > 80 ? 'text-red-500' : cpu > 50 ? 'text-amber-500' : 'text-emerald-600'}`}>{cpu}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div style={{ width: `${cpu}%` }} className={`h-full rounded-full transition-all ${col}`} />
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
