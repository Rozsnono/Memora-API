"use client";

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ExternalLink, Calendar, MapPin, User, Shield } from 'lucide-react';

interface MediaLightboxModalProps {
    memory: any;
    onClose: () => void;
}

export default function MediaLightboxModal({ memory, onClose }: MediaLightboxModalProps) {
    const [mediaIndex, setMediaIndex] = useState(0);

    const mediaList = memory?.media || [];
    const currentMedia = mediaList[mediaIndex];
    const isVideo = currentMedia?.mediaType === 'video';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-white text-sm">{memory.title}</h3>
                        <p className="text-xs text-slate-400">
                            Széf: <strong className="text-slate-200">{memory.spaceName}</strong> · Szerző: <strong className="text-slate-200">{memory.creatorName}</strong>
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Media Content */}
                <div className="relative flex-1 bg-black flex items-center justify-center min-h-[360px] overflow-hidden">
                    {isVideo ? (
                        <video 
                            src={currentMedia?.url} 
                            controls 
                            autoPlay 
                            className="max-h-[60vh] max-w-full rounded-lg"
                        />
                    ) : (
                        <img 
                            src={currentMedia?.url} 
                            alt={memory.title}
                            className="max-h-[60vh] max-w-full object-contain"
                        />
                    )}

                    {/* Left/Right controls if multiple photos */}
                    {mediaList.length > 1 && (
                        <>
                            <button
                                onClick={() => setMediaIndex((prev) => (prev > 0 ? prev - 1 : mediaList.length - 1))}
                                className="absolute left-4 p-2.5 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-sm"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={() => setMediaIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : 0))}
                                className="absolute right-4 p-2.5 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-sm"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </>
                    )}
                </div>

                {/* Footer details */}
                <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-purple-400" />
                            {new Date(memory.createdAt).toLocaleDateString('hu-HU')}
                        </span>
                        {memory.location?.name && (
                            <span className="flex items-center gap-1.5">
                                <MapPin size={13} className="text-emerald-400" />
                                {memory.location.name}
                            </span>
                        )}
                        <span className="text-[11px] font-mono text-slate-500">
                            {currentMedia?.webdavPath || 'NAS tárhely'}
                        </span>
                    </div>

                    {currentMedia?.url && (
                        <a 
                            href={currentMedia.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                            Megnyitás eredeti méretben <ExternalLink size={13} />
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
