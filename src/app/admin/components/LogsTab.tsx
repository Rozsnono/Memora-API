"use client";

import React, { useState, useEffect } from 'react';
import { 
    Terminal, 
    Search, 
    RefreshCcw, 
    Trash2, 
    Activity, 
    Cpu, 
    ShieldCheck, 
    Check, 
    AlertCircle, 
    Clock,
    Filter
} from 'lucide-react';
import apiClient from '@/lib/apiClient';

interface LogsTabProps {
    logs: any[];
    loading: boolean;
    onRefresh: () => void;
}

export default function LogsTab({ logs, loading, onRefresh }: LogsTabProps) {
    const [methodFilter, setMethodFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [search, setSearch] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(() => {
            onRefresh();
        }, 3000);
        return () => clearInterval(interval);
    }, [autoRefresh, onRefresh]);

    const showMessage = (text: string, type: 'success' | 'error') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 4000);
    };

    const handleClearLogs = async () => {
        setClearing(true);
        try {
            await apiClient.delete('/api/logs');
            showMessage('Rendszernaplók sikeresen ürítve!', 'success');
            setConfirmClear(false);
            onRefresh();
        } catch (err: any) {
            showMessage(err?.response?.data?.error || 'Hiba a naplók törlésekor', 'error');
        } finally {
            setClearing(false);
        }
    };

    const filteredLogs = logs.filter((log) => {
        const matchesMethod = methodFilter === 'ALL' || log.method === methodFilter;
        let matchesStatus = true;
        if (statusFilter === '2xx') matchesStatus = log.status >= 200 && log.status < 300;
        else if (statusFilter === '4xx') matchesStatus = log.status >= 400 && log.status < 500;
        else if (statusFilter === '5xx') matchesStatus = log.status >= 500;

        const q = search.toLowerCase();
        const matchesSearch = !search || 
            log.path?.toLowerCase().includes(q) || 
            log.ip?.toLowerCase().includes(q) ||
            log.errorMessage?.toLowerCase().includes(q);

        return matchesMethod && matchesStatus && matchesSearch;
    });

    const avgLatency = logs.length > 0
        ? Math.round(logs.reduce((acc, l) => acc + (l.duration || 0), 0) / logs.length)
        : 0;

    return (
        <div className="space-y-6">
            {/* Action / Filter Bar */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <input
                            type="text"
                            placeholder="Keresés útvonal, IP..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50"
                        />
                    </div>

                    {/* Method filter */}
                    <select
                        value={methodFilter}
                        onChange={(e) => setMethodFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs text-slate-300 focus:outline-none focus:border-purple-500/50"
                    >
                        <option value="ALL">Minden Metódus</option>
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PATCH">PATCH</option>
                        <option value="DELETE">DELETE</option>
                    </select>

                    {/* Status filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs text-slate-300 focus:outline-none focus:border-purple-500/50"
                    >
                        <option value="ALL">Minden Státusz</option>
                        <option value="2xx">2xx Sikeres</option>
                        <option value="4xx">4xx Kliens hiba</option>
                        <option value="5xx">5xx Szerver hiba</option>
                    </select>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
                    {/* Auto Refresh Toggle */}
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                            autoRefresh 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-sm' 
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                        Élő frissítés (3s)
                    </button>

                    <button
                        onClick={onRefresh}
                        className={`p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors ${loading ? 'animate-spin' : ''}`}
                        title="Frissítés"
                    >
                        <RefreshCcw size={16} />
                    </button>

                    {/* Clear logs */}
                    {confirmClear ? (
                        <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 p-1 rounded-xl">
                            <button
                                onClick={handleClearLogs}
                                disabled={clearing}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors"
                            >
                                {clearing ? 'Törlés...' : 'Naplók ürítése'}
                            </button>
                            <button
                                onClick={() => setConfirmClear(false)}
                                className="px-2 py-1 bg-slate-800 text-slate-400 rounded-lg text-xs"
                            >
                                Mégse
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setConfirmClear(true)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                        >
                            <Trash2 size={13} /> Ürítés
                        </button>
                    )}
                </div>
            </div>

            {/* Notification */}
            {message && (
                <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 border ${
                    message.type === 'success' 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}>
                    {message.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                        <Activity size={14} className="text-blue-400" /> Kérések (Mutatva / Összes)
                    </div>
                    <div className="text-xl font-bold text-white">{filteredLogs.length} <span className="text-xs text-slate-500 font-normal">/ {logs.length}</span></div>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                        <Cpu size={14} className="text-emerald-400" /> Átlagos Válaszidő
                    </div>
                    <div className="text-xl font-bold text-emerald-400">{avgLatency} ms</div>
                </div>
                <div className="col-span-2 sm:col-span-1 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                        <Clock size={14} className="text-purple-400" /> Hibaarány
                    </div>
                    <div className="text-xl font-bold text-purple-400">
                        {logs.length > 0 ? ((logs.filter(l => l.status >= 400).length / logs.length) * 100).toFixed(1) : 0}%
                    </div>
                </div>
            </div>

            {/* Log Table */}
            <div className="bg-slate-900/60 rounded-3xl border border-slate-800 overflow-hidden overflow-x-auto backdrop-blur-xl">
                <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-950/60 text-slate-400 uppercase text-[9px] tracking-widest border-b border-slate-800">
                        <tr>
                            <th className="p-4 pl-6">Metódus</th>
                            <th className="p-4">Útvonal</th>
                            <th className="p-4">Státusz</th>
                            <th className="p-4">IP / Felhasználó</th>
                            <th className="p-4">Időtartam</th>
                            <th className="p-4 pr-6 text-right">Időbélyeg</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                        {filteredLogs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                                    Nincsenek rögzített kérések vagy naplók.
                                </td>
                            </tr>
                        ) : (
                            filteredLogs.map((log) => (
                                <tr key={log._id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="p-4 pl-6">
                                        <span className={`px-2 py-0.5 rounded font-black text-[9px] ${
                                            log.method === 'POST' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                            log.method === 'PATCH' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                            log.method === 'DELETE' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                            'bg-slate-800 text-slate-300 border border-slate-700'
                                        }`}>
                                            {log.method}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-300 max-w-[200px] sm:max-w-xs truncate font-sans">
                                        {log.path}
                                        {log.errorMessage && (
                                            <span className="block text-[10px] text-rose-400 truncate">{log.errorMessage}</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className={`font-bold ${
                                            log.status >= 500 ? 'text-rose-400' :
                                            log.status >= 400 ? 'text-amber-400' :
                                            'text-emerald-400'
                                        }`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-400 text-[11px] font-sans">
                                        <span className="text-slate-200 block font-semibold">{log.userName || log.ip || 'Anonymous'}</span>
                                        {log.userAgent && (
                                            <span className="text-[10px] text-slate-500 truncate block max-w-[150px]">
                                                {log.userAgent}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-slate-400">
                                        {log.duration ? `${log.duration}ms` : '-'}
                                    </td>
                                    <td className="p-4 pr-6 text-right text-slate-500">
                                        {new Date(log.timestamp || log.createdAt).toLocaleTimeString([], { 
                                            hour: '2-digit', 
                                            minute: '2-digit', 
                                            second: '2-digit' 
                                        })}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
