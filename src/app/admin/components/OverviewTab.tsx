"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Users, 
    Shield, 
    HardDrive, 
    Image as ImageIcon, 
    Gamepad2, 
    Activity, 
    Server, 
    Database, 
    Cpu, 
    Clock, 
    AlertTriangle,
    ArrowUpRight,
    CheckCircle2
} from 'lucide-react';

interface OverviewTabProps {
    data: any;
    loading: boolean;
    onNavigateTab: (tabId: string) => void;
}

export default function OverviewTab({ data, loading, onNavigateTab }: OverviewTabProps) {
    if (loading && !data) {
        return (
            <div className="flex items-center justify-center py-24 text-slate-500">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mr-3" />
                <span>Rendszer áttekintés betöltése...</span>
            </div>
        );
    }

    const stats = data?.stats || {};
    const system = data?.system || {};
    const recentActivity = data?.recentActivity || {};

    const formatBytes = (bytes: number) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatUptime = (seconds: number) => {
        if (!seconds) return '0s';
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor((seconds % (3600 * 24)) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (d > 0) return `${d}n ${h}ó ${m}p`;
        if (h > 0) return `${h}ó ${m}p`;
        return `${m}p ${s}mp`;
    };

    return (
        <div className="space-y-8">
            {/* Top KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard 
                    title="Összes Felhasználó" 
                    value={stats.totalUsers ?? 0}
                    subtext={`+${stats.newUsersThisWeek ?? 0} új az elmúlt 7 napban`}
                    icon={<Users className="text-purple-400" size={22} />}
                    color="border-purple-500/20 bg-purple-500/5 hover:border-purple-500/40"
                    onClick={() => onNavigateTab('users')}
                />
                <KPICard 
                    title="Széfek / Terek" 
                    value={stats.totalSpaces ?? 0}
                    subtext="Aktív családi és páros terek"
                    icon={<Shield className="text-blue-400" size={22} />}
                    color="border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40"
                    onClick={() => onNavigateTab('spaces')}
                />
                <KPICard 
                    title="Feltöltött Emlékek" 
                    value={stats.totalMemories ?? 0}
                    subtext={`${stats.totalMediaCount ?? 0} médiafájl (${formatBytes(stats.totalStorageBytes)})`}
                    icon={<ImageIcon className="text-emerald-400" size={22} />}
                    color="border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40"
                    onClick={() => onNavigateTab('memories')}
                />
                <KPICard 
                    title="Aktív Játékok" 
                    value={stats.activeGames?.total ?? 0}
                    subtext={`${stats.activeGames?.chess ?? 0} sakk · ${stats.activeGames?.hangman ?? 0} akasztófa · ${stats.activeGames?.lobbies ?? 0} lobby`}
                    icon={<Gamepad2 className="text-amber-400" size={22} />}
                    color="border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40"
                    onClick={() => onNavigateTab('games')}
                />
            </div>

            {/* Server Health & Diagnostics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                                <Activity size={20} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-base">Szerver Állapot & Erőforrások</h3>
                                <p className="text-xs text-slate-400">Valós idejű futási mutatók és processzor adatok</p>
                            </div>
                        </div>
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Normál üzem
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                                <Database size={14} className="text-blue-400" /> MongoDB
                            </div>
                            <div className="text-base font-bold text-white capitalize">
                                {system.database === 'connected' ? (
                                    <span className="text-emerald-400 flex items-center gap-1">
                                        <CheckCircle2 size={14} /> Kapcsolódva
                                    </span>
                                ) : (
                                    <span className="text-rose-400 flex items-center gap-1">
                                        <AlertTriangle size={14} /> Hiba
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] text-slate-500">Adatbázis állapot</span>
                        </div>

                        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                                <Clock size={14} className="text-purple-400" /> Futásidő
                            </div>
                            <div className="text-base font-bold text-white">
                                {formatUptime(system.uptimeSeconds)}
                            </div>
                            <span className="text-[10px] text-slate-500">Node process</span>
                        </div>

                        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                                <Cpu size={14} className="text-amber-400" /> RAM (Heap)
                            </div>
                            <div className="text-base font-bold text-white">
                                {system.memoryUsage?.heapUsedMB ?? 0} MB
                            </div>
                            <span className="text-[10px] text-slate-500">/ {system.memoryUsage?.heapTotalMB ?? 0} MB</span>
                        </div>

                        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                                <Server size={14} className="text-emerald-400" /> Node Verzió
                            </div>
                            <div className="text-base font-bold text-white">
                                {system.nodeVersion ?? 'N/A'}
                            </div>
                            <span className="text-[10px] text-slate-500">Next.js Turbopack</span>
                        </div>
                    </div>

                    {/* API Traffic Summary */}
                    <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-6">
                            <div>
                                <span className="text-xs text-slate-400 block">Kérések (24 óra)</span>
                                <span className="text-xl font-bold text-white">{stats.traffic?.requestsLast24h ?? 0}</span>
                            </div>
                            <div className="w-px h-8 bg-slate-800" />
                            <div>
                                <span className="text-xs text-slate-400 block">Hibás válaszok (4xx/5xx)</span>
                                <span className={`text-xl font-bold ${(stats.traffic?.errorsLast24h ?? 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {stats.traffic?.errorsLast24h ?? 0}
                                </span>
                            </div>
                            <div className="w-px h-8 bg-slate-800" />
                            <div>
                                <span className="text-xs text-slate-400 block">Összes rögzített napló</span>
                                <span className="text-xl font-bold text-slate-300">{stats.traffic?.totalLogs ?? 0}</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => onNavigateTab('logs')}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                        >
                            Naplók megtekintése <ArrowUpRight size={14} />
                        </button>
                    </div>
                </div>

                {/* Storage Card */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                                <HardDrive size={20} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-base">Synology NAS Tárhely</h3>
                                <p className="text-xs text-slate-400">WebDAV Médiafelhő</p>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-slate-400">Becsült fotó & videó méret</span>
                                <span className="text-xs font-bold text-purple-400">{formatBytes(stats.totalStorageBytes)}</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                <div 
                                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full transition-all duration-500" 
                                    style={{ width: '35%' }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500 mt-2">
                                <span>{stats.totalMediaCount ?? 0} fájl tárolva</span>
                                <span>Korlátlan NAS kapacitás</span>
                            </div>
                        </div>

                        <ul className="text-xs text-slate-400 space-y-2">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span>Darabolt feltöltés (chunked upload) aktív</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span>Közvetlen streaming proxy bekapcsolva</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span>API kulcs hitelesítés konfigurálva</span>
                            </li>
                        </ul>
                    </div>

                    <button 
                        onClick={() => onNavigateTab('diagnostics')}
                        className="mt-6 w-full py-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold text-xs rounded-xl transition-colors text-center"
                    >
                        NAS Kapcsolat Tesztelése
                    </button>
                </div>
            </div>

            {/* Recent Activity Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Latest Memories */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-bold text-sm flex items-center gap-2">
                            <ImageIcon size={16} className="text-emerald-400" /> Legutóbbi Emlékek
                        </h3>
                        <button 
                            onClick={() => onNavigateTab('memories')}
                            className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
                        >
                            Összes ({stats.totalMemories ?? 0})
                        </button>
                    </div>

                    {(!recentActivity.memories || recentActivity.memories.length === 0) ? (
                        <div className="text-center py-8 text-xs text-slate-500">Még nincsenek feltöltött emlékek.</div>
                    ) : (
                        <div className="space-y-3">
                            {recentActivity.memories.map((m: any) => (
                                <div key={m._id} className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                                            {m.media?.[0]?.url ? (
                                                <img src={m.media[0].url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon size={16} className="text-slate-500" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-200">{m.title}</h4>
                                            <p className="text-[11px] text-slate-500">{m.media?.length || 0} média · Széf: {m.spaceId}</p>
                                        </div>
                                    </div>
                                    <span className="text-[11px] text-slate-500">
                                        {new Date(m.createdAt).toLocaleDateString('hu-HU')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Latest Registered Users */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-bold text-sm flex items-center gap-2">
                            <Users size={16} className="text-purple-400" /> Legújabb Felhasználók
                        </h3>
                        <button 
                            onClick={() => onNavigateTab('users')}
                            className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
                        >
                            Összes ({stats.totalUsers ?? 0})
                        </button>
                    </div>

                    {(!recentActivity.users || recentActivity.users.length === 0) ? (
                        <div className="text-center py-8 text-xs text-slate-500">Még nincsenek felhasználók.</div>
                    ) : (
                        <div className="space-y-3">
                            {recentActivity.users.map((u: any) => (
                                <div key={u._id} className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold text-sm flex items-center justify-center shrink-0">
                                            {u.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                                                {u.name}
                                                {u.role === 'admin' && (
                                                    <span className="px-1.5 py-0.5 text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded font-black uppercase">
                                                        Admin
                                                    </span>
                                                )}
                                            </h4>
                                            <p className="text-[11px] text-slate-500">{u.email}</p>
                                        </div>
                                    </div>
                                    <span className="text-[11px] text-slate-500">
                                        {new Date(u.createdAt).toLocaleDateString('hu-HU')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function KPICard({ title, value, subtext, icon, color, onClick }: any) {
    return (
        <motion.div 
            whileHover={{ y: -2 }}
            onClick={onClick}
            className={`p-5 rounded-3xl border transition-all cursor-pointer backdrop-blur-xl ${color}`}
        >
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400">{title}</span>
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                    {icon}
                </div>
            </div>
            <div className="text-3xl font-extrabold text-white mb-1">{value}</div>
            <div className="text-xs text-slate-400 truncate">{subtext}</div>
        </motion.div>
    );
}
