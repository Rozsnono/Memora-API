"use client";

import React, { useState } from 'react';
import { 
    Image as ImageIcon, 
    Search, 
    Trash2, 
    RefreshCcw, 
    ExternalLink, 
    MapPin, 
    MessageSquare, 
    Heart, 
    Pin, 
    Check, 
    AlertCircle,
    Eye
} from 'lucide-react';
import apiClient from '@/lib/apiClient';

interface MemoriesTabProps {
    memories: any[];
    spaces: any[];
    loading: boolean;
    onRefresh: () => void;
    onOpenLightbox: (memory: any) => void;
}

export default function MemoriesTab({ memories, spaces, loading, onRefresh, onOpenLightbox }: MemoriesTabProps) {
    const [search, setSearch] = useState('');
    const [selectedSpaceId, setSelectedSpaceId] = useState('ALL');
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const showMessage = (text: string, type: 'success' | 'error') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 4000);
    };

    const handleDeleteMemory = async (memoryId: string, memoryTitle: string) => {
        setDeletingId(memoryId);
        try {
            await apiClient.delete(`/api/admin/memories?id=${memoryId}`);
            showMessage(`"${memoryTitle}" emlék sikeresen törölve!`, 'success');
            setConfirmDeleteId(null);
            onRefresh();
        } catch (err: any) {
            showMessage(err?.response?.data?.error || 'Hiba az emlék törlésekor', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    const filteredMemories = memories.filter((m) => {
        const matchesSearch = m.title?.toLowerCase().includes(search.toLowerCase()) || 
                              m.creatorName?.toLowerCase().includes(search.toLowerCase());
        const matchesSpace = selectedSpaceId === 'ALL' || m.spaceId === selectedSpaceId;
        return matchesSearch && matchesSpace;
    });

    return (
        <div className="space-y-6">
            {/* Header / Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-72">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Keresés cím vagy szerző szerint..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50"
                        />
                    </div>

                    <select
                        value={selectedSpaceId}
                        onChange={(e) => setSelectedSpaceId(e.target.value)}
                        className="px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs text-slate-300 focus:outline-none focus:border-purple-500/50"
                    >
                        <option value="ALL">Minden széf ({memories.length})</option>
                        {spaces.map((s) => (
                            <option key={s._id} value={s._id}>{s.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-medium">
                        Találat: <strong className="text-white">{filteredMemories.length}</strong> emlék
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

            {/* Memories Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredMemories.length === 0 ? (
                    <div className="col-span-full py-16 text-center text-xs text-slate-500 bg-slate-900/40 border border-slate-800/80 rounded-3xl">
                        Nincsenek megjeleníthető emlékek.
                    </div>
                ) : (
                    filteredMemories.map((m) => {
                        const firstMedia = m.media?.[0];
                        const mediaUrl = firstMedia?.url;
                        const isVideo = firstMedia?.mediaType === 'video';

                        return (
                            <div 
                                key={m._id}
                                className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl flex flex-col justify-between group hover:border-slate-700/80 transition-all"
                            >
                                {/* Thumbnail Header */}
                                <div 
                                    onClick={() => onOpenLightbox(m)}
                                    className="relative aspect-[4/3] bg-slate-950 flex items-center justify-center cursor-pointer overflow-hidden"
                                >
                                    {mediaUrl ? (
                                        <img 
                                            src={mediaUrl} 
                                            alt={m.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e: any) => {
                                                e.target.onerror = null;
                                                e.target.src = "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop";
                                            }}
                                        />
                                    ) : (
                                        <ImageIcon size={32} className="text-slate-700" />
                                    )}

                                    {/* Overlay badges */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80" />

                                    <div className="absolute top-3 left-3 flex gap-1.5">
                                        {m.isPinned && (
                                            <span className="p-1.5 bg-purple-500/80 text-white rounded-lg backdrop-blur-md">
                                                <Pin size={12} />
                                            </span>
                                        )}
                                        {m.media?.length > 1 && (
                                            <span className="px-2 py-0.5 bg-slate-900/80 text-slate-200 text-[10px] font-bold rounded-lg backdrop-blur-md">
                                                +{m.media.length - 1} fotó
                                            </span>
                                        )}
                                    </div>

                                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                        <span className="text-xs font-bold text-white truncate drop-shadow-md">{m.title}</span>
                                        <button className="p-1.5 bg-slate-900/80 hover:bg-purple-600 text-white rounded-xl backdrop-blur-md transition-colors">
                                            <Eye size={12} />
                                        </button>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-4 space-y-3">
                                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                                        <span className="truncate">Széf: <strong className="text-slate-300">{m.spaceName}</strong></span>
                                        <span>{new Date(m.createdAt).toLocaleDateString('hu-HU')}</span>
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-2.5">
                                        <span className="truncate">Szerző: <strong className="text-slate-400">{m.creatorName}</strong></span>
                                        
                                        <div className="flex items-center gap-2 text-slate-400">
                                            {m.perspectives?.length > 0 && (
                                                <span className="flex items-center gap-1 text-[10px]">
                                                    <MessageSquare size={11} className="text-purple-400" />
                                                    {m.perspectives.length}
                                                </span>
                                            )}
                                            {m.location?.name && (
                                                <span className="flex items-center gap-1 text-[10px]" title={m.location.name}>
                                                    <MapPin size={11} className="text-emerald-400" />
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action row */}
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                                        <span className="text-[10px] text-slate-600 font-mono truncate max-w-[140px]">
                                            {firstMedia?.webdavPath || 'NAS tárhely'}
                                        </span>

                                        {confirmDeleteId === m._id ? (
                                            <div className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/30 p-1 rounded-xl">
                                                <button
                                                    onClick={() => handleDeleteMemory(m._id, m.title)}
                                                    disabled={deletingId === m._id}
                                                    className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold"
                                                >
                                                    {deletingId === m._id ? 'Törlés...' : 'Törlés'}
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
                                                onClick={() => setConfirmDeleteId(m._id)}
                                                className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition-colors"
                                                title="Emlék moderálása és törlése"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
