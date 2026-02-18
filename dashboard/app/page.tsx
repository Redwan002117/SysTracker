'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';
import { ArrowRight, Server, ShieldCheck, Activity, Cpu, HardDrive, Wifi, Zap } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center space-y-8 pt-10 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100 mb-4"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            v1.0.0 Now Available
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl"
          >
            Monitor your infrastructure <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">in Real-Time.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed"
          >
            SysTracker provides instant visibility into your server fleet. Track CPU, RAM, Disk, and Network usage with a beautiful, modern dashboard.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-4"
          >
            <Link href="/dashboard">
              <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-xl shadow-blue-500/30 transition-all hover:-translate-y-1 hover:shadow-2xl flex items-center justify-center gap-2">
                Open Dashboard <ArrowRight size={20} />
              </button>
            </Link>
            <a href="https://github.com/Redwan002117/SysTracker" target="_blank" rel="noopener noreferrer">
              <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-lg border border-slate-200 shadow-sm transition-all hover:bg-slate-50 flex items-center justify-center gap-2">
                View on GitHub
              </button>
            </a>
          </motion.div>

          {/* Hero Visual Details */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-3xl -z-10 mix-blend-multiply opacity-50 animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-400/20 rounded-full blur-3xl -z-10 mix-blend-multiply opacity-50 ml-20 mt-20 animate-pulse delay-700"></div>
        </section>

        {/* Features Grid */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Everything you need to monitor</h2>
            <p className="text-slate-500 mt-2">Powerful features packed into a lightweight agent.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {([
              { icon: <Cpu className="text-blue-500" />, title: "CPU & Memory", desc: "Real-time tracking of processor load and memory consumption across all nodes." },
              { icon: <HardDrive className="text-purple-500" />, title: "I/O monitoring", desc: "Track disk usage, read/write speeds, and storage capacity alerts." },
              { icon: <Wifi className="text-emerald-500" />, title: "Network Traffic", desc: "Visualize upload/download speeds and detect bandwidth bottlenecks." },
              { icon: <Activity className="text-amber-500" />, title: "Live Telemetry", desc: "Sub-second updates via WebSockets for instant status reflection." },
              { icon: <ShieldCheck className="text-rose-500" />, title: "Security Events", desc: "Log critical system events, login attempts, and service status changes." },
              { icon: <Server className="text-cyan-500" />, title: "Hardware Specs", desc: "Deep dive into motherboard, GPU, and peripheral details." },
            ] as Array<{ icon: React.ReactNode; title: string; desc: string }>).map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-white border border-slate-100 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-4 text-slate-700 group-hover:scale-110 transition-transform">
                  {React.cloneElement(feature.icon as React.ReactElement<any>, { size: 24 })}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 mt-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 text-white p-1 rounded-md">
                <Zap size={16} fill="currentColor" />
              </div>
              <span className="font-bold text-slate-900">SysTracker</span>
            </div>
            <p className="text-slate-500 text-sm">
              © 2024 SysTracker. Open Source Monitoring.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default LandingPage;
