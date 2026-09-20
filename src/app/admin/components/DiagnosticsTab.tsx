"use client";

import React, { useState } from 'react';
import { 
    Server, 
    Database, 
    HardDrive, 
    Radio, 
    RefreshCcw, 
    CheckCircle2, 
    XCircle, 
    AlertTriangle, 
    Cpu, 
    Zap,
    ShieldCheck
} from 'lucide-react';
import apiClient from '@/lib/apiClient';

interface DiagnosticsTabProps {
    systemData: any;
    loading: boolean;
    onRefresh: () => void;
}

export default function DiagnosticsTab({ systemData, loading, onRefresh }: DiagnosticsTabProps) {
    const [testingPing, setTestingPing] = useState(false);
    const [nasResult, setNasResult] = useState<any>(null);

    const runNasTest = async () => {
        setTestingPing(true);
        try {
            const { data } = await apiClient.get('/api/admin/system');
            setNasResult(data.nas);
            onRefresh();
        } catch (err: any) {
            setNasResult({
                reachable: false,
                error: err.message || 'Kapcsolódási hiba',
                latencyMs: 0
            });
        } finally {
            setTestingPing(false);
        }
    };

    const nas = nasResult || systemData?.nas || {};
    const env = systemData?.env || {};
    const db = systemData?.database || {};
    const server = systemData?.server || {};

    const formatBytes = (bytes: number) => {
        if (!bytes) return '0 MB';
        return `${Math.round(bytes / 1024 / 1024)} MB`;
    };

    return (
        <div className="space-y-6">
            {/* Top Action Bar */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Zap size={16} className="text-amber-400" /> Rendszer & Infrasruktúra Diagnosztika
                    </h3>
                    <p className="text-xs text-slate-400">Külső szolgáltatások, Synology NAS és adatbázis kapcsolatok ellenőrzése</p>
                </div>
                <button
                    onClick={onRefresh}
                    className={`p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors ${loading ? 'animate-spin' : ''}`}
                    title="Frissítés"
                >
                    <RefreshCcw size={16} />
                </button>
            </div>

            {/* NAS Connection Test Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400">
                            <HardDrive size={22} />
                        </div>
                        <div>
                            <h4 className="text-base font-bold text-white">Synology NAS WebDAV Szerver</h4>
                            <p className="text-xs text-slate-400 font-mono">
                                {nas.url || 'https://api.filesharer.rozsnorbert.hu:9443'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={runNasTest}
                        disabled={testingPing}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {testingPing ? (
                            <>
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Kapcsolódás tesztelése...
                            </>
                        ) : (
                            <>
                                <Zap size={14} /> Élő Ping Teszt
                            </>
                        )}
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                    <div>
                        <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-bold">Állapot</span>
                        <div className="mt-1 flex items-center gap-2">
                            {nas.reachable ? (
                                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                                    <CheckCircle2 size={16} /> Elérhető és Működik
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                                    <XCircle size={16} /> {nas.error || 'Nem elérhető'}
                                </span>
                            )}
                        </div>
                    </div>

                    <div>
                        <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-bold">Válaszidő (Round-Trip)</span>
                        <div className="mt-1 text-sm font-mono font-bold text-white">
                            {nas.latencyMs ? `${nas.latencyMs} ms` : '-'}
                        </div>
                    </div>

                    <div>
                        <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-bold">Hitelesítés</span>
                        <div className="mt-1 text-xs font-semibold text-purple-400">
                            x-api-key Fejléc Érvényesítve
                        </div>
                    </div>
                </div>
            </div>

            {/* Two-column layout: Config & Database Collections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Environment Variables Checklist */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <ShieldCheck size={16} className="text-purple-400" /> Környezeti Változók & Integrációk
                    </h4>

                    <div className="space-y-2.5">
                        <ConfigItem 
                            label="MONGODB_URI" 
                            set={env.MONGODB_URI?.set} 
                            desc="Adatbázis kapcsolati sztring" 
                        />
                        <ConfigItem 
                            label="STORAGE_API_URL" 
                            set={env.STORAGE_API_URL?.set} 
                            desc="Synology WebDAV szerver címe" 
                        />
                        <ConfigItem 
                            label="STORAGE_API_KEY" 
                            set={env.STORAGE_API_KEY?.set} 
                            desc="NAS feltöltési titkos kulcs" 
                        />
                        <ConfigItem 
                            label="PUSHER_APP_ID & KEY" 
                            set={env.PUSHER_APP_ID?.set && env.PUSHER_KEY?.set} 
                            desc="Valós idejű WebSocket chat és szinkronizáció" 
                        />
                        <ConfigItem 
                            label="AGORA_APP_ID" 
                            set={env.AGORA_APP_ID?.set} 
                            desc="Videó- és hanghívás RTC motor" 
                        />
                        <ConfigItem 
                            label="JWT_SECRET" 
                            set={env.JWT_SECRET?.set} 
                            desc="30 napos token hitelesítés" 
                        />
                    </div>
                </div>

                {/* MongoDB Collections Breakdown */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Database size={16} className="text-blue-400" /> MongoDB Adatbázis Táblák ({db.name || 'memora'})
                    </h4>

                    {(!db.collections || db.collections.length === 0) ? (
                        <div className="text-center py-8 text-xs text-slate-500">Nincsenek elérhető gyűjtemény adatok.</div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2.5">
                            {db.collections.map((col: any) => (
                                <div key={col.name} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex items-center justify-between">
                                    <span className="text-xs font-mono text-slate-300 truncate">{col.name}</span>
                                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700/60 text-xs font-bold text-purple-400">
                                        {col.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Server Specs */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Server size={16} className="text-emerald-400" /> Szerver Specifikációk
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">Platform</span>
                        <span className="text-sm font-bold text-white capitalize">{server.platform || 'macOS / Darwin'}</span>
                    </div>
                    <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">Node.js</span>
                        <span className="text-sm font-bold text-white">{server.nodeVersion || 'v20+'}</span>
                    </div>
                    <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">RSS Memória</span>
                        <span className="text-sm font-bold text-white">{formatBytes(server.memoryUsage?.rss)}</span>
                    </div>
                    <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">Szerver Idő</span>
                        <span className="text-xs font-bold text-white truncate block">
                            {server.now ? new Date(server.now).toLocaleTimeString() : '-'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ConfigItem({ label, set, desc }: { label: string; set: boolean; desc: string }) {
    return (
        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex items-center justify-between">
            <div>
                <div className="text-xs font-mono font-bold text-slate-200">{label}</div>
                <div className="text-[11px] text-slate-500">{desc}</div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
                {set ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 size={12} /> Beállítva
                    </span>
                ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <XCircle size={12} /> Hiányzik
                    </span>
                )}
            </div>
        </div>
    );
}
