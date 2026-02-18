"use client";

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import MachineCard from "@/components/MachineCard";
import MachineDetails from "@/components/MachineDetails";
import { Machine } from '@/types';
import { Activity, Search, Filter } from 'lucide-react';

export default function Home() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'online' | 'offline' | 'critical' | 'high_load'>('all');

  useEffect(() => {
    // Fetch initial data
    fetch('http://localhost:3001/api/machines')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMachines(data);
          setError(null);
        } else {
          console.error('API returned non-array:', data);
          setError('Failed to load machine data. Server might be down or misconfigured.');
        }
      })
      .catch(err => {
        console.error('Error fetching machines:', err);
        setError('Could not connect to server.');
      });

    // Connect to Socket.IO
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('machine_update', (updatedMachine: Machine) => {
      setMachines(prev => {
        const index = prev.findIndex(m => m.id === updatedMachine.id);
        if (index > -1) {
          const newMachines = [...prev];
          newMachines[index] = {
            ...newMachines[index],
            ...updatedMachine,
            hardware_info: updatedMachine.hardware_info || newMachines[index].hardware_info
          };
          return newMachines;
        } else {
          return [...prev, updatedMachine];
        }
      });

      // Update selected machine if it matches the ID
      setSelectedMachine(prevSelected => {
        if (prevSelected && prevSelected.id === updatedMachine.id) {
          return {
            ...prevSelected,
            ...updatedMachine,
            hardware_info: updatedMachine.hardware_info || prevSelected.hardware_info
          };
        }
        return prevSelected;
      });
    });



    newSocket.on('machine_status_change', ({ id, status }: { id: string, status: 'online' | 'offline' }) => {
      setMachines(prev => prev.map(m => {
        if (m.id === id) return { ...m, status };
        return m;
      }));
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Calculate aggregated stats
  const totalAgents = machines.length;
  const onlineAgents = machines.filter(m => m.status === 'online').length;
  const criticalAlerts = machines.filter(m => (m.metrics?.cpu || 0) > 90 || (m.metrics?.ram || 0) > 90).length;

  const avgLoad = totalAgents > 0
    ? Math.round(machines.reduce((acc, m) => acc + (m.metrics?.cpu || 0), 0) / totalAgents)
    : 0;

  // Filter and Search Logic
  const filteredMachines = machines.filter(machine => {
    const matchesSearch =
      machine.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      machine.ip.includes(searchQuery) ||
      (machine.nickname && machine.nickname.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filter === 'all') return true;
    if (filter === 'online') return machine.status === 'online';
    if (filter === 'offline') return machine.status === 'offline';
    if (filter === 'critical') return (machine.metrics?.cpu || 0) > 90 || (machine.metrics?.ram || 0) > 90;
    if (filter === 'high_load') return (machine.metrics?.cpu || 0) > 70; // Avg Load filter (approx)

    return true;
  });

  return (
    <main className="min-h-screen bg-gray-50/50 p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex justify-between items-center bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-4 z-40">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
              <Activity className="text-blue-600" /> SysTracker <span className="text-blue-400 font-light">Pro</span>
            </h1>
            <p className="text-gray-500 mt-1 text-sm font-medium">Centralized Telemetry & Fleet Management</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-semibold border border-green-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              System Operational
            </div>
            {/* Search Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search hostname, IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all w-64"
              />
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div
            onClick={() => setFilter('all')}
            className={`cursor-pointer p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all ${filter === 'all' ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50' : 'bg-white/80 border-gray-100'}`}
          >
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Total Agents</h3>
            <div className="text-4xl font-extrabold text-gray-800">{totalAgents}</div>
          </div>
          <div
            onClick={() => setFilter(filter === 'online' ? 'all' : 'online')}
            className={`cursor-pointer p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all ${filter === 'online' ? 'border-green-500 ring-2 ring-green-100 bg-green-50' : 'bg-white/80 border-gray-100'}`}
          >
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Online</h3>
            <div className="text-4xl font-extrabold text-green-600">{onlineAgents}</div>
          </div>
          <div
            onClick={() => setFilter(filter === 'critical' ? 'all' : 'critical')}
            className={`cursor-pointer p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all ${filter === 'critical' ? 'border-red-500 ring-2 ring-red-100 bg-red-50' : 'bg-white/80 border-gray-100'}`}
          >
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Critical Alerts</h3>
            <div className="text-4xl font-extrabold text-red-500">{criticalAlerts}</div>
          </div>
          <div
            onClick={() => setFilter(filter === 'high_load' ? 'all' : 'high_load')}
            className={`cursor-pointer p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all ${filter === 'high_load' ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50' : 'bg-white/80 border-gray-100'}`}
          >
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Avg Load</h3>
            <div className="text-4xl font-extrabold text-blue-600">{avgLoad}%</div>
          </div>
        </div>

        {/* Filter Badge */}
        {filter !== 'all' && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-500">Filtering by:</span>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1">
              {filter.replace('_', ' ')}
              <button onClick={() => setFilter('all')} className="hover:text-blue-900 ml-1">×</button>
            </span>
          </div>
        )}

        {machines.length === 0 && !error ? (
          <div className="text-center py-32 bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 border-dashed">
            <div className="inline-block p-4 bg-slate-100 rounded-full mb-4">
              <Activity className="text-slate-400" size={48} />
            </div>
            <h3 className="text-2xl font-semibold text-slate-700">No signals detected</h3>
            <p className="text-slate-400 mt-2">Deploy the agent to start monitoring your fleet.</p>
          </div>
        ) : filteredMachines.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">No machines match your search or filter.</p>
            <button onClick={() => { setFilter('all'); setSearchQuery(''); }} className="mt-2 text-blue-500 hover:underline">Clear filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredMachines.map(machine => (
              <MachineCard
                key={machine.id}
                machine={machine}
                onClick={setSelectedMachine}
              />
            ))}
          </div>
        )}

        {/* Details Side Sheet (Modal-like) */}
        {selectedMachine && (
          <>
            <div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
              onClick={() => setSelectedMachine(null)}
            />
            <MachineDetails
              machine={selectedMachine}
              onClose={() => setSelectedMachine(null)}
            />
          </>
        )}
      </div>
    </main>
  );
}
