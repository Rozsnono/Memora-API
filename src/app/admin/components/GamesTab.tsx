"use client";

import React, { useState } from 'react';
import { 
    Gamepad2, 
    RefreshCcw, 
    Trash2, 
    Users, 
    Clock, 
    Check, 
    AlertCircle,
    Swords,
    HelpCircle,
    Disc
} from 'lucide-react';
import apiClient from '@/lib/apiClient';

interface GamesTabProps {
    games: {
        chess?: any[];
        hangman?: any[];
        lobbies?: any[];
    };
    loading: boolean;
    onRefresh: () => void;
}

export default function GamesTab({ games, loading, onRefresh }: GamesTabProps) {
    const [selectedType, setSelectedType] = useState<'all' | 'chess' | 'hangman' | 'lobby'>('all');
    const [confirmDelete, setConfirmDelete] = useState<{ id: string; type: string } | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const showMessage = (text: string, type: 'success' | 'error') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 4000);
    };

    const handleDeleteGame = async (type: string, id: string) => {
        setDeletingId(id);
        try {
            await apiClient.delete(`/api/admin/games?type=${type}&id=${id}`);
            showMessage(`Játék munkamenet sikeresen leállítva/törölve!`, 'success');
            setConfirmDelete(null);
            onRefresh();
        } catch (err: any) {
            showMessage(err?.response?.data?.error || 'Hiba a játék törlésekor', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    const chessList = games?.chess || [];
    const hangmanList = games?.hangman || [];
    const lobbyList = games?.lobbies || [];

    const totalCount = chessList.length + hangmanList.length + lobbyList.length;

    return (
        <div className="space-y-6">
            {/* Header / Type Selector */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-2xl border border-slate-800">
                    <button
                        onClick={() => setSelectedType('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            selectedType === 'all' 
                                ? 'bg-purple-600 text-white shadow-lg' 
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        Minden játék ({totalCount})
                    </button>
                    <button
                        onClick={() => setSelectedType('chess')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            selectedType === 'chess' 
                                ? 'bg-purple-600 text-white shadow-lg' 
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Swords size={14} /> Sakk ({chessList.length})
                    </button>
                    <button
                        onClick={() => setSelectedType('hangman')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            selectedType === 'hangman' 
                                ? 'bg-purple-600 text-white shadow-lg' 
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <HelpCircle size={14} /> Akasztófa ({hangmanList.length})
                    </button>
                    <button
                        onClick={() => setSelectedType('lobby')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            selectedType === 'lobby' 
                                ? 'bg-purple-600 text-white shadow-lg' 
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Disc size={14} /> Szerencsekerék ({lobbyList.length})
                    </button>
                </div>

                <button
                    onClick={onRefresh}
                    className={`p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors ${loading ? 'animate-spin' : ''}`}
                    title="Frissítés"
                >
                    <RefreshCcw size={16} />
                </button>
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

            {/* Sections */}
            <div className="space-y-8">
                {/* Chess Section */}
                {(selectedType === 'all' || selectedType === 'chess') && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                            <Swords size={16} className="text-blue-400" /> Sakk Partik ({chessList.length})
                        </h3>

                        {chessList.length === 0 ? (
                            <div className="p-6 bg-slate-900/40 rounded-2xl border border-slate-800 text-xs text-slate-500 text-center">
                                Nincsenek aktív vagy mentett sakk partik.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {chessList.map((c) => (
                                    <div key={c._id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col justify-between backdrop-blur-xl">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                    c.status === 'playing' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                    c.status === 'waiting' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                    'bg-slate-800 text-slate-400'
                                                }`}>
                                                    {c.status}
                                                </span>
                                                <span className="text-[10px] text-slate-500">{new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>

                                            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 mb-3 space-y-1">
                                                <div className="text-xs text-slate-300 flex justify-between">
                                                    <span>⚪ Világos:</span>
                                                    <strong className="text-white">{c.whitePlayer?.name || 'Várakozás...'}</strong>
                                                </div>
                                                <div className="text-xs text-slate-300 flex justify-between">
                                                    <span>⚫ Sötét:</span>
                                                    <strong className="text-white">{c.blackPlayer?.name || 'Várakozás...'}</strong>
                                                </div>
                                            </div>

                                            <div className="text-[10px] font-mono text-slate-500 truncate mb-3">
                                                FEN: {c.fen}
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                                            <span className="text-[11px] text-slate-400">Lépések: {c.history?.length || 0}</span>

                                            {confirmDelete?.id === c._id ? (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleDeleteGame('chess', c._id)}
                                                        disabled={deletingId === c._id}
                                                        className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold"
                                                    >
                                                        Törlés
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDelete(null)}
                                                        className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px]"
                                                    >
                                                        Mégse
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setConfirmDelete({ id: c._id, type: 'chess' })}
                                                    className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                                                    title="Parti leállítása"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Hangman Section */}
                {(selectedType === 'all' || selectedType === 'hangman') && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                            <HelpCircle size={16} className="text-amber-400" /> Akasztófa Játékok ({hangmanList.length})
                        </h3>

                        {hangmanList.length === 0 ? (
                            <div className="p-6 bg-slate-900/40 rounded-2xl border border-slate-800 text-xs text-slate-500 text-center">
                                Nincsenek aktív akasztófa játékok.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {hangmanList.map((h) => (
                                    <div key={h._id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col justify-between backdrop-blur-xl">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                    h.status === 'playing' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                    h.status === 'waiting' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                    'bg-slate-800 text-slate-400'
                                                }`}>
                                                    {h.status}
                                                </span>
                                                <span className="text-[10px] text-slate-500">{h.category || 'Kategória nélkül'}</span>
                                            </div>

                                            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 mb-3 space-y-1">
                                                <div className="text-xs text-slate-300 flex justify-between">
                                                    <span>Rejtett szó:</span>
                                                    <strong className="text-purple-400 font-mono tracking-widest">{h.word}</strong>
                                                </div>
                                                <div className="text-xs text-slate-300 flex justify-between">
                                                    <span>Létrehozó:</span>
                                                    <span className="text-slate-200">{h.creatorName}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                                            <span className="text-[11px] text-slate-400">
                                                Hibák: <strong className="text-rose-400">{h.wrongGuesses ?? 0}</strong> / {h.maxAttempts || 6}
                                            </span>

                                            {confirmDelete?.id === h._id ? (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleDeleteGame('hangman', h._id)}
                                                        disabled={deletingId === h._id}
                                                        className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold"
                                                    >
                                                        Törlés
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDelete(null)}
                                                        className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px]"
                                                    >
                                                        Mégse
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setConfirmDelete({ id: h._id, type: 'hangman' })}
                                                    className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                                                    title="Játék törlése"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Lucky Wheel Lobbies */}
                {(selectedType === 'all' || selectedType === 'lobby') && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                            <Disc size={16} className="text-emerald-400" /> Szerencsekerék Többjátékos Lobbyk ({lobbyList.length})
                        </h3>

                        {lobbyList.length === 0 ? (
                            <div className="p-6 bg-slate-900/40 rounded-2xl border border-slate-800 text-xs text-slate-500 text-center">
                                Nincsenek aktív szerencsekerék lobbyk.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {lobbyList.map((l) => (
                                    <div key={l._id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col justify-between backdrop-blur-xl">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-mono font-bold text-purple-400 text-sm">
                                                    #{l.code}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                    l.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                    l.status === 'waiting' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                    'bg-slate-800 text-slate-400'
                                                }`}>
                                                    {l.status}
                                                </span>
                                            </div>

                                            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 mb-3 space-y-1">
                                                <div className="text-xs text-slate-300 flex justify-between">
                                                    <span>Host:</span>
                                                    <strong className="text-white">{l.hostName}</strong>
                                                </div>
                                                <div className="text-xs text-slate-300 flex justify-between">
                                                    <span>Játékosok:</span>
                                                    <span className="text-slate-200">{l.players?.length || 0} / {l.maxPlayers || 3}</span>
                                                </div>
                                                <div className="text-xs text-slate-300 flex justify-between">
                                                    <span>Kör:</span>
                                                    <span className="text-slate-200">{l.round || 1} / {l.maxRounds || 3}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                                            <span className="text-[11px] text-slate-500">
                                                {new Date(l.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>

                                            {confirmDelete?.id === l._id ? (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleDeleteGame('lobby', l._id)}
                                                        disabled={deletingId === l._id}
                                                        className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold"
                                                    >
                                                        Törlés
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDelete(null)}
                                                        className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px]"
                                                    >
                                                        Mégse
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setConfirmDelete({ id: l._id, type: 'lobby' })}
                                                    className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                                                    title="Lobby leállítása"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
