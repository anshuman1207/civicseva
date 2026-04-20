import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Wind, Zap, AlertCircle } from 'lucide-react';

export default function AreaHealthGrid({ areaData }) {
    if (!areaData || areaData.length === 0) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {areaData.slice(0, 6).map((area, i) => (
                <motion.div
                    key={area.pincode}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-[var(--color-surface-container-lowest)] p-5 rounded-3xl border border-[var(--color-outline-variant)]/20 shadow-sm hover:shadow-md transition-shadow group overflow-hidden relative"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent rounded-bl-full -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h4 className="text-lg font-black text-[var(--color-on-surface)] tracking-tight">PIN {area.pincode}</h4>
                            <p className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-tighter">Community Health Profile</p>
                        </div>
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shadow-sm ${
                            area.responsivenessScore > 80 ? 'bg-green-100 text-green-700' : 
                            area.responsivenessScore > 50 ? 'bg-amber-100 text-amber-700' : 
                            'bg-red-100 text-red-700'
                        }`}>
                            {Math.round(area.responsivenessScore)}%
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Cleanliness Score */}
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[10px] font-black text-[var(--color-on-surface-variant)] uppercase flex items-center gap-1.5">
                                    <Wind className="w-3 h-3 text-emerald-500" />
                                    Cleanliness
                                </span>
                                <span className="text-[10px] font-black text-emerald-600">{Math.round(area.cleanlinessScore)}/100</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${area.cleanlinessScore}%` }}
                                    className="h-full bg-emerald-500 rounded-full"
                                />
                            </div>
                        </div>

                        {/* Responsiveness */}
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[10px] font-black text-[var(--color-on-surface-variant)] uppercase flex items-center gap-1.5">
                                    <Zap className="w-3 h-3 text-blue-500" />
                                    Response Velocity
                                </span>
                                <span className="text-[10px] font-black text-blue-600">{Math.round(area.responsivenessScore)}/100</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${area.responsivenessScore}%` }}
                                    className="h-full bg-blue-500 rounded-full"
                                />
                            </div>
                        </div>

                        {/* Complaint Density */}
                        <div className="pt-2 flex items-center justify-between border-t border-[var(--color-outline-variant)]/10">
                            <span className="text-[9px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 opacity-50" />
                                Density Score
                            </span>
                            <span className="text-xs font-black text-[var(--color-on-surface)]">
                                {area.complaintDensity} <span className="text-[10px] font-medium opacity-60 uppercase">pts/sqkm</span>
                            </span>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
