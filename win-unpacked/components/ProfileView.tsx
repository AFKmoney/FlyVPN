
import React from 'react';
import { BADGES, Badge } from '../lib/badges';
import { useLocalization } from '../contexts/LocalizationContext';

interface ProfileViewProps {
    onClose: () => void;
    level: number;
    xp: number;
    xpForNextLevel: number;
    unlockedBadgeIds: string[];
}

const BadgeCard: React.FC<{ badge: Badge; isUnlocked: boolean }> = ({ badge, isUnlocked }) => {
    return (
        <div className={`glass rounded-xl p-4 flex flex-col items-center text-center transition-all duration-300 ${isUnlocked ? 'border-cyan-500/20' : 'border-transparent'}`}>
            <div className={`w-12 h-12 mb-2 transition-all duration-300 ${isUnlocked ? 'text-cyan-400' : 'text-slate-700'}`}>
                {isUnlocked ? badge.icon : <div className="w-full h-full bg-slate-800 rounded-full flex items-center justify-center text-slate-600 text-2xl">?</div>}
            </div>
            <h4 className={`font-bold text-xs ${isUnlocked ? 'text-slate-100' : 'text-slate-600'}`}>{isUnlocked ? badge.name : 'Locked'}</h4>
            <p className="text-[10px] text-slate-500 mt-1">{isUnlocked ? badge.description : 'Unlock condition hidden.'}</p>
        </div>
    )
};


export const ProfileView: React.FC<ProfileViewProps> = ({ onClose, level, xp, xpForNextLevel, unlockedBadgeIds }) => {
    const { t } = useLocalization();

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm p-4 sm:p-8 flex flex-col z-50 animate-in fade-in duration-300" onClick={onClose}>
            <div className="glass rounded-2xl w-full max-w-4xl mx-auto flex flex-col h-full my-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
                    <h2 className="text-xl font-bold text-cyan-400">Your Profile</h2>
                    <button onClick={onClose} className="text-2xl text-slate-400 hover:text-white transition-colors">&times;</button>
                </div>

                <div className="p-6 flex-shrink-0">
                    <h3 className="text-lg font-bold">Level {level}</h3>
                    <div className="mt-2">
                        <div className="w-full bg-slate-800 rounded-full h-4">
                            <div 
                                className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-4 rounded-full transition-all duration-500"
                                style={{ width: `${(xp / xpForNextLevel) * 100}%` }}
                            />
                        </div>
                        <div className="text-right text-xs text-slate-400 mt-1 mono">
                            {xp} / {xpForNextLevel} XP
                        </div>
                    </div>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    <h3 className="font-bold text-slate-300 mb-4">Badge Collection ({unlockedBadgeIds.length} / {BADGES.length})</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {BADGES.map(badge => (
                            <BadgeCard key={badge.id} badge={badge} isUnlocked={unlockedBadgeIds.includes(badge.id)} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
