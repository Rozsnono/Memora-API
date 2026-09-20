"use client";

import React, { useState } from 'react';
import { Key, X, Lock, Check, AlertCircle } from 'lucide-react';
import apiClient from '@/lib/apiClient';

interface ResetPasswordModalProps {
    user: any;
    onClose: () => void;
    onSuccess: (msg: string) => void;
}

export default function ResetPasswordModal({ user, onClose, onSuccess }: ResetPasswordModalProps) {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 4) {
            setError('A jelszónak legalább 4 karakter hosszúnak kell lennie!');
            return;
        }

        if (password !== confirm) {
            setError('A megadott két jelszó nem egyezik meg!');
            return;
        }

        setLoading(true);
        try {
            await apiClient.patch('/api/admin/users', {
                userId: user._id,
                newPassword: password
            });
            onSuccess(`Új jelszó sikeresen beállítva ${user.name} számára!`);
            onClose();
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Hiba a jelszó módosításakor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
                            <Key size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-base">Jelszó Visszaállítása</h3>
                            <p className="text-xs text-slate-400">{user?.name} ({user?.email})</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-2xl flex items-center gap-2">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Új Jelszó</label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Legalább 4 karakter..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Új Jelszó Megerősítése</label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                            <input
                                type="password"
                                required
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                placeholder="Írd be újra a jelszót..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50"
                            />
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                        >
                            Mégse
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                            {loading ? 'Mentés...' : 'Jelszó Mentése'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
