"use client";

import React, { useState } from 'react';
import { 
    Shield, 
    Search, 
    Trash2, 
    RefreshCcw, 
    Copy, 
    Check, 
    Users, 
    Image as ImageIcon,
    Clock, 
    AlertCircle 
} from 'lucide-react';
import apiClient from '@/lib/apiClient';

interface SpacesTabProps {
    spaces: any[];
    loading: boolean;
    onRefresh: () => void;
}

export default function SpacesTab({ spaces, loading, onRefresh }: SpacesTabProps) {
    const [search, setSearch] = useState('');
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const showMessage = (text: string, type: 'success' | 'error') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 4000);
    };

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleDeleteSpace = async (spaceId: string, spaceName: string) => {
        setDeletingId(spaceId);
        try {
            await apiClient.delete(`/api/admin/spaces?id=${spaceId}`);
            showMessage(`"${spaceName}" széf és hozzá tartozó emlékek törölve!`, 'success');
            setConfirmDeleteId(null);
            onRefresh();
        } catch (err: any) {
            showMessage(err?.response?.data?.error || 'Hiba a széf törlésekor', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    const filteredSpaces = spaces.filter((s) => {
        const q = search.toLowerCase();
        return s.name?.toLowerCase().includes(q) || s.inviteCode?.toLowerCase().includes(q);
    });

    return (
        <div className="space-y-6">
            {/* Header / Search */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative flex-1 w-full max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                        type="text"
                        placeholder="Keresés széf név vagy meghívókód alapján..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-medium">
                        Összesen: <strong className="text-white">{filteredSpaces.length}</strong> széf
                    </span>
                    <button
                        onClick={onRefresh}
                        className={`p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors ${loading ? 'animate-spin' : ''}`}
                        title="Frissítés"
                    >
                        <RefreshCcw size={16} />
                    </button>
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

            {/* Spaces Grid / Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredSpaces.length === 0 ? (
                    <div className="col-span-full py-16 text-center text-xs text-slate-500 bg-slate-900/40 border border-slate-800/80 rounded-3xl">
                        Nincs találat a megadott keresési feltételekre.
                    </div>
                ) : (
                    filteredSpaces.map((s) => (
                        <div 
                            key={s._id}
                            className="p-5 bg-slate-900/60 border border-slate-800 rounded-3xl flex flex-col justify-between backdrop-blur-xl hover:border-slate-700/80 transition-all"
                        >
                            <div>
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-3">
                                        <div 
                                            className="w-10 h-10 rounded-2xl flex items-center justify-center border text-white font-bold"
                                            style={{ backgroundColor: `${s.themeColor || '#9B86BD'}20`, borderColor: `${s.themeColor || '#9B86BD'}50` }}
                                        >
                                            <Shield size={20} style={{ color: s.themeColor || '#9B86BD' }} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-200 text-sm truncate max-w-[180px]">{s.name}</h4>
                                            <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">
                                                {s.type || 'Personal'} széf
                                            </span>
                                        </div>
                                    </div>

                                    {/* Invite code badge with copy */}
                                    <button
                                        onClick={() => handleCopy(s.inviteCode)}
                                        className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/80 border border-slate-800 hover:border-purple-500/40 rounded-xl text-[11px] font-mono font-bold text-purple-400 transition-colors"
                                        title="Meghívókód másolása"
                                    >
                                        <span>{s.inviteCode}</span>
                                        {copiedCode === s.inviteCode ? (
                                            <Check size={12} className="text-emerald-400" />
                                        ) : (
                                            <Copy size={12} className="text-slate-500" />
                                        )}
                                    </button>
                                </div>

                                {/* Details row */}
                                <div className="grid grid-cols-2 gap-2 my-4 bg-slate-950/50 p-3 rounded-2xl border border-slate-800/80">
                                    <div className="flex items-center gap-2">
                                        <Users size={14} className="text-blue-400" />
                                        <div>
                                            <span className="text-[10px] text-slate-500 block">Tagok száma</span>
                                            <span className="text-xs font-bold text-white">{s.membersCount ?? 0}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ImageIcon size={14} className="text-emerald-400" />
                                        <div>
                                            <span className="text-[10px] text-slate-500 block">Emlékek száma</span>
                                            <span className="text-xs font-bold text-white">{s.memoriesCount ?? 0}</span>
                                        </div>
                                    </div>
                                </div>

                                {s.countdown?.isActive && s.countdown?.targetDate && (
                                    <div className="p-2.5 mb-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center gap-2 text-xs text-purple-300">
                                        <Clock size={14} className="text-purple-400 shrink-0" />
                                        <div className="truncate">
                                            <span className="font-semibold">{s.countdown.title}: </span>
                                            <span className="text-slate-400">{new Date(s.countdown.targetDate).toLocaleDateString('hu-HU')}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer & Actions */}
                            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                                <span>Létrehozva: {s.createdAt ? new Date(s.createdAt).toLocaleDateString('hu-HU') : '-'}</span>

                                {confirmDeleteId === s._id ? (
                                    <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 p-1 rounded-xl">
                                        <button
                                            onClick={() => handleDeleteSpace(s._id, s.name)}
                                            disabled={deletingId === s._id}
                                            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold"
                                        >
                                            {deletingId === s._id ? 'Törlés...' : 'Megerősít'}
                                        </button>
                                        <button
                                            onClick={() => setConfirmDeleteId(null)}
                                            className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px]"
                                        >
                                            Mégse
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setConfirmDeleteId(s._id)}
                                        className="p-1.5 bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition-colors"
                                        title="Széf törlése"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
