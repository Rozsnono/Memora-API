"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, 
    Users, 
    Shield, 
    Image as ImageIcon, 
    Gamepad2, 
    Terminal, 
    Zap, 
    RefreshCcw, 
    ChevronLeft,
    ShieldCheck,
    LogOut,
    Check
} from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { useRouter } from 'next/navigation';

import OverviewTab from './components/OverviewTab';
import UsersTab from './components/UsersTab';
import SpacesTab from './components/SpacesTab';
import MemoriesTab from './components/MemoriesTab';
import GamesTab from './components/GamesTab';
import LogsTab from './components/LogsTab';
import DiagnosticsTab from './components/DiagnosticsTab';
import ResetPasswordModal from './components/ResetPasswordModal';
import MediaLightboxModal from './components/MediaLightboxModal';

export default function AdminDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'spaces' | 'memories' | 'games' | 'logs' | 'diagnostics'>('overview');

    // Data states
    const [overviewData, setOverviewData] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [spaces, setSpaces] = useState<any[]>([]);
    const [memories, setMemories] = useState<any[]>([]);
    const [games, setGames] = useState<any>({ chess: [], hangman: [], lobbies: [] });
    const [logs, setLogs] = useState<any[]>([]);
    const [systemData, setSystemData] = useState<any>(null);

    const [loading, setLoading] = useState<boolean>(true);
    const [selectedUserForReset, setSelectedUserForReset] = useState<any | null>(null);
    const [selectedMemoryForLightbox, setSelectedMemoryForLightbox] = useState<any | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4000);
    };

    // Data fetchers
    const fetchOverview = useCallback(async () => {
        try {
            const { data } = await apiClient.get('/api/admin/overview');
            setOverviewData(data);
        } catch (err) {
            console.error('Failed fetching overview:', err);
        }
    }, []);

    const fetchUsers = useCallback(async () => {
        try {
            const { data } = await apiClient.get('/api/admin/users');
            setUsers(data.users || []);
        } catch (err) {
            console.error('Failed fetching users:', err);
        }
    }, []);

    const fetchSpaces = useCallback(async () => {
        try {
            const { data } = await apiClient.get('/api/admin/spaces');
            setSpaces(data.spaces || []);
        } catch (err) {
            console.error('Failed fetching spaces:', err);
        }
    }, []);

    const fetchMemories = useCallback(async () => {
        try {
            const { data } = await apiClient.get('/api/admin/memories');
            setMemories(data.memories || []);
        } catch (err) {
            console.error('Failed fetching memories:', err);
        }
    }, []);

    const fetchGames = useCallback(async () => {
        try {
            const { data } = await apiClient.get('/api/admin/games');
            setGames(data || { chess: [], hangman: [], lobbies: [] });
        } catch (err) {
            console.error('Failed fetching games:', err);
        }
    }, []);

    const fetchLogs = useCallback(async () => {
        try {
            const { data } = await apiClient.get('/api/logs?limit=150');
            setLogs(data || []);
        } catch (err) {
            console.error('Failed fetching logs:', err);
        }
    }, []);

    const fetchSystem = useCallback(async () => {
        try {
            const { data } = await apiClient.get('/api/admin/system');
            setSystemData(data);
        } catch (err) {
            console.error('Failed fetching system:', err);
        }
    }, []);

    // Initial load
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([
                fetchOverview(),
                fetchUsers(),
                fetchSpaces(),
                fetchMemories(),
                fetchGames(),
                fetchLogs(),
                fetchSystem()
            ]);
            setLoading(false);
        };
        init();
    }, [fetchOverview, fetchUsers, fetchSpaces, fetchMemories, fetchGames, fetchLogs, fetchSystem]);

    // Active tab refresher
    const handleActiveTabRefresh = () => {
        if (activeTab === 'overview') fetchOverview();
        else if (activeTab === 'users') fetchUsers();
        else if (activeTab === 'spaces') fetchSpaces();
        else if (activeTab === 'memories') fetchMemories();
        else if (activeTab === 'games') fetchGames();
        else if (activeTab === 'logs') fetchLogs();
        else if (activeTab === 'diagnostics') fetchSystem();
    };

    const tabs = [
        { id: 'overview', label: 'Áttekintés', icon: LayoutDashboard },
        { id: 'users', label: 'Felhasználók', icon: Users, badge: users.length },
        { id: 'spaces', label: 'Széfek & Terek', icon: Shield, badge: spaces.length },
        { id: 'memories', label: 'Média & Emlékek', icon: ImageIcon, badge: memories.length },
        { id: 'games', label: 'Élő Játékok', icon: Gamepad2 },
        { id: 'logs', label: 'Forgalmi Naplók', icon: Terminal },
        { id: 'diagnostics', label: 'Diagnosztika', icon: Zap },
    ];

    return (
        <div className="min-h-screen bg-[#0B0F19] text-slate-300 font-sans antialiased selection:bg-purple-500/30 selection:text-purple-200">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 bg-[#0F172A]/80 border-b border-slate-800/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    {/* Brand */}
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => router.push('/')}
                            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
                            title="Vissza a főoldalra"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-purple-500/20">
                                M
                            </div>
                            <div>
                                <h1 className="text-white font-bold text-base leading-tight flex items-center gap-2">
                                    Memora Admin
                                    <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                </h1>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                                    Irányítópult & Moderáció
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats / Refresh */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleActiveTabRefresh}
                            className={`p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors ${loading ? 'animate-spin' : ''}`}
                            title="Adatok frissítése"
                        >
                            <RefreshCcw size={16} />
                        </button>

                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs font-semibold text-purple-300">
                            <ShieldCheck size={14} className="text-purple-400" />
                            <span>Admin Mode</span>
                        </div>
                    </div>
                </div>

                {/* Subnav Tabs */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto no-scrollbar border-t border-slate-800/40">
                    <nav className="flex space-x-1 py-2">
                        {tabs.map((t) => {
                            const Icon = t.icon;
                            const isActive = activeTab === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setActiveTab(t.id as any)}
                                    className={`relative px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                                        isActive
                                            ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                    }`}
                                >
                                    <Icon size={15} className={isActive ? 'text-purple-400' : 'text-slate-500'} />
                                    <span>{t.label}</span>
                                    {typeof t.badge === 'number' && (
                                        <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                                            isActive 
                                                ? 'bg-purple-500/20 text-purple-200' 
                                                : 'bg-slate-800 text-slate-400'
                                        }`}>
                                            {t.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Global Toast */}
                {toastMessage && (
                    <div className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-2xl shadow-xl flex items-center gap-2 backdrop-blur-xl animate-fade-in">
                        <Check size={16} />
                        <span>{toastMessage}</span>
                    </div>
                )}

                {/* Tab Switcher */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                    >
                        {activeTab === 'overview' && (
                            <OverviewTab 
                                data={overviewData} 
                                loading={loading} 
                                onNavigateTab={(tab) => setActiveTab(tab as any)} 
                            />
                        )}

                        {activeTab === 'users' && (
                            <UsersTab 
                                users={users} 
                                loading={loading} 
                                onRefresh={fetchUsers} 
                                onOpenPasswordReset={(user) => setSelectedUserForReset(user)} 
                            />
                        )}

                        {activeTab === 'spaces' && (
                            <SpacesTab 
                                spaces={spaces} 
                                loading={loading} 
                                onRefresh={fetchSpaces} 
                            />
                        )}

                        {activeTab === 'memories' && (
                            <MemoriesTab 
                                memories={memories} 
                                spaces={spaces}
                                loading={loading} 
                                onRefresh={fetchMemories} 
                                onOpenLightbox={(mem) => setSelectedMemoryForLightbox(mem)} 
                            />
                        )}

                        {activeTab === 'games' && (
                            <GamesTab 
                                games={games} 
                                loading={loading} 
                                onRefresh={fetchGames} 
                            />
                        )}

                        {activeTab === 'logs' && (
                            <LogsTab 
                                logs={logs} 
                                loading={loading} 
                                onRefresh={fetchLogs} 
                            />
                        )}

                        {activeTab === 'diagnostics' && (
                            <DiagnosticsTab 
                                systemData={systemData} 
                                loading={loading} 
                                onRefresh={fetchSystem} 
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Modals */}
            {selectedUserForReset && (
                <ResetPasswordModal
                    user={selectedUserForReset}
                    onClose={() => setSelectedUserForReset(null)}
                    onSuccess={(msg) => showToast(msg)}
                />
            )}

            {selectedMemoryForLightbox && (
                <MediaLightboxModal
                    memory={selectedMemoryForLightbox}
                    onClose={() => setSelectedMemoryForLightbox(null)}
                />
            )}
        </div>
    );
}