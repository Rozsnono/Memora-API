import Link from 'next/link';
import { Terminal, Database, Server, HardDrive, ShieldCheck, ArrowRight, Activity } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0B0F19] text-slate-200 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Server size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Memora Backend API</h1>
              <p className="text-xs text-slate-400">REST Gateway & Media Storage Service</p>
            </div>
          </div>
          <span className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-2xl flex items-center gap-3">
            <Database className="text-purple-400" size={20} />
            <div>
              <p className="text-xs text-slate-400 font-medium">Database</p>
              <p className="text-sm font-semibold text-slate-200">MongoDB / Mongoose</p>
            </div>
          </div>

          <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-2xl flex items-center gap-3">
            <HardDrive className="text-blue-400" size={20} />
            <div>
              <p className="text-xs text-slate-400 font-medium">Storage Engine</p>
              <p className="text-sm font-semibold text-slate-200">Synology NAS (WebDAV)</p>
            </div>
          </div>

          <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-2xl flex items-center gap-3">
            <Activity className="text-amber-400" size={20} />
            <div>
              <p className="text-xs text-slate-400 font-medium">Realtime</p>
              <p className="text-sm font-semibold text-slate-200">Pusher Channels</p>
            </div>
          </div>

          <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-2xl flex items-center gap-3">
            <ShieldCheck className="text-emerald-400" size={20} />
            <div>
              <p className="text-xs text-slate-400 font-medium">Auth</p>
              <p className="text-sm font-semibold text-slate-200">JWT + BCrypt</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/admin"
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-2xl transition-all shadow-lg shadow-purple-600/20 active:scale-[0.98]"
          >
            <Terminal size={18} />
            Open System Logs & Traffic
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </main>
  );
}
