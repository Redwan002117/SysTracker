'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import MachineCard from '../../components/MachineCard';
import MachineDetails from '../../components/MachineDetails';
import SystemLoadChart from '../../components/SystemLoadChart';
import { Machine } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Search, Cpu, Wifi, Server } from 'lucide-react';
import { fetchWithAuth, clearToken } from '../../lib/auth';

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

  const router = useRouter(); // Explicitly use router

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
    socket.on('machine_update', (data: any) => {
      setMachines(prev => {
        const index = prev.findIndex(m => m.id === data.id);
        if (index === -1) {
          return [...prev, { ...data, status: 'online', last_seen: new Date().toISOString() }];
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
  }, []);

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

  // Stats
  const totalAgents = machines.length;
  const onlineAgents = machines.filter(m => m.status === 'online').length;
  const criticalAlerts = machines.filter(m => (m.metrics?.cpu || 0) > 90 || (m.metrics?.ram || 0) > 90).length;

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
                  onClick={setSelectedMachine}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {!loading && filteredMachines.length === 0 && (
            <div className="col-span-full text-center py-20 text-slate-400">
              <Server size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Monitoring Agents Found</p>
              <p className="text-sm">Run 'python agent.py' on your machines to connect.</p>
            </div>
          )}
        </motion.div>
      </main>

      {selectedMachine && (
        <MachineDetails
          machine={selectedMachine}
          onClose={() => setSelectedMachine(null)}
        />
      )}
    </>
  );
}
