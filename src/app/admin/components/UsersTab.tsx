"use client";

import React, { useState } from 'react';
import { 
    Users, 
    Search, 
    Shield, 
    ShieldAlert, 
    Key, 
    Trash2, 
    RefreshCcw, 
    Check, 
    AlertCircle,
    UserCheck,
    Image as ImageIcon,
    FolderKanban
} from 'lucide-react';
import apiClient from '@/lib/apiClient';

interface UsersTabProps {
    users: any[];
    loading: boolean;
    onRefresh: () => void;
    onOpenPasswordReset: (user: any) => void;
}

export default function UsersTab({ users, loading, onRefresh, onOpenPasswordReset }: UsersTabProps) {
    const [search, setSearch] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const showMessage = (text: string, type: 'success' | 'error') => {
        setFeedbackMessage({ text, type });
        setTimeout(() => setFeedbackMessage(null), 4000);
    };

    const handleRoleToggle = async (user: any) => {
        const nextRole = user.role === 'admin' ? 'user' : 'admin';
        setUpdatingId(user._id);
        try {
            await apiClient.patch('/api/admin/users', {
                userId: user._id,
                role: nextRole
            });
            showMessage(`${user.name} szerepköre módosítva: ${nextRole}`, 'success');
            onRefresh();
        } catch (err: any) {
            showMessage(err?.response?.data?.error || 'Hiba történt a szerepkör módosításakor', 'error');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        setDeletingId(userId);
        try {
            await apiClient.delete(`/api/admin/users?id=${userId}`);
            showMessage(`${userName} fiókja sikeresen törölve`, 'success');
            setConfirmDeleteId(null);
            onRefresh();
        } catch (err: any) {
            showMessage(err?.response?.data?.error || 'Hiba történt a törlés során', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    const filteredUsers = users.filter((u) => {
        const q = search.toLowerCase();
        return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    });

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative flex-1 w-full max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                        type="text"
                        placeholder="Keresés név vagy email alapján..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-medium">
                        Összesen: <strong className="text-white">{filteredUsers.length}</strong> felhasználó
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

            {/* Feedback Alert */}
            {feedbackMessage && (
                <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 border ${
                    feedbackMessage.type === 'success' 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}>
                    {feedbackMessage.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                    <span>{feedbackMessage.text}</span>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                            <tr>
                                <th className="p-4 pl-6">Felhasználó</th>
                                <th className="p-4">Szerepkör</th>
                                <th className="p-4">Mód</th>
                                <th className="p-4">Széfek</th>
                                <th className="p-4">Emlékek</th>
                                <th className="p-4">Regisztráció</th>
                                <th className="p-4 pr-6 text-right">Műveletek</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500">
                                        Nincs találat a keresési feltételre.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u._id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold text-sm flex items-center justify-center shrink-0">
                                                    {u.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-200">{u.name}</div>
                                                    <div className="text-[11px] text-slate-500">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => handleRoleToggle(u)}
                                                disabled={updatingId === u._id}
                                                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border transition-all ${
                                                    u.role === 'admin'
                                                        ? 'bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25'
                                                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                                                }`}
                                            >
                                                {u.role === 'admin' ? (
                                                    <><Shield size={12} /> Admin</>
                                                ) : (
                                                    <><UserCheck size={12} /> User</>
                                                )}
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800/80 text-slate-300 border border-slate-700/60">
                                                {u.mode || 'personal'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-slate-300 font-semibold flex items-center gap-1">
                                                <FolderKanban size={13} className="text-blue-400" />
                                                {u.spacesJoinedCount ?? 0}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-slate-300 font-semibold flex items-center gap-1">
                                                <ImageIcon size={13} className="text-emerald-400" />
                                                {u.memoriesCount ?? 0}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-500">
                                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('hu-HU') : '-'}
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => onOpenPasswordReset(u)}
                                                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors"
                                                    title="Új jelszó beállítása"
                                                >
                                                    <Key size={14} />
                                                </button>

                                                {confirmDeleteId === u._id ? (
                                                    <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 p-1 rounded-xl">
                                                        <button
                                                            onClick={() => handleDeleteUser(u._id, u.name)}
                                                            disabled={deletingId === u._id}
                                                            className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold transition-colors"
                                                        >
                                                            {deletingId === u._id ? 'Törlés...' : 'Megerősít'}
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmDeleteId(null)}
                                                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-[10px] transition-colors"
                                                        >
                                                            Mégse
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setConfirmDeleteId(u._id)}
                                                        className="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition-colors"
                                                        title="Felhasználó törlése"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
