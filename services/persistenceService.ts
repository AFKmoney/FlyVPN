/**
 * persistenceService.ts
 * --------------------------------------------------------------
 * localStorage persistence for user progression, logs, and config.
 * Renamed from the old "geminiService.ts" which was a misnomer
 * (the file never used Gemini — it was a persistence layer).
 */

import { LogEntry } from '../types';
import { UserStats } from '../lib/badges';

// ---------------------------------------------------------------------------
// Progression
// ---------------------------------------------------------------------------

export const loadProgression = (): { level: number, xp: number, stats: UserStats, badges: string[] } => {
    try {
        if (typeof localStorage === 'undefined') return defaultProgression();
        const savedLevel = localStorage.getItem('flyvpn_level');
        const savedXp = localStorage.getItem('flyvpn_xp');
        const savedStats = localStorage.getItem('flyvpn_userStats');
        const savedBadges = localStorage.getItem('flyvpn_unlockedBadges');
        return {
            level: savedLevel ? JSON.parse(savedLevel) : 1,
            xp: savedXp ? JSON.parse(savedXp) : 0,
            stats: savedStats ? { ...defaultStats(), ...JSON.parse(savedStats) } : defaultStats(),
            badges: savedBadges ? JSON.parse(savedBadges) : [],
        };
    } catch (e) {
        console.error("Failed to load progression data", e);
        return defaultProgression();
    }
};

const defaultStats = (): UserStats => ({
    totalNeutralized: 0, malware: 0, phishing: 0, ddos: 0, spyware: 0, adware: 0,
    ransomware: 0, botnet: 0, cryptojacking: 0, commandControl: 0,
    rfThreats: 0, xBandJams: 0, gsmIntercept: 0, wifiProbes: 0,
    domainBlocks: 0, auditsGenerated: 0, endpointsUsed: 0,
    rulesEnabled: 0, tunnelsEstablished: 0, daysActive: 0,
    level: 1, neutralizationHistory: [],
});

const defaultProgression = () => ({ level: 1, xp: 0, stats: defaultStats(), badges: [] });

let pendingProgressionData: { level?: number, xp?: number, stats?: UserStats, badges?: string[] } = {};
let saveProgressionTimeout: ReturnType<typeof setTimeout> | null = null;

const performSave = () => {
    try {
        if (typeof localStorage === 'undefined') return;
        if (pendingProgressionData.level) localStorage.setItem('flyvpn_level', JSON.stringify(pendingProgressionData.level));
        if (pendingProgressionData.xp) localStorage.setItem('flyvpn_xp', JSON.stringify(pendingProgressionData.xp));
        if (pendingProgressionData.stats) localStorage.setItem('flyvpn_userStats', JSON.stringify(pendingProgressionData.stats));
        if (pendingProgressionData.badges) localStorage.setItem('flyvpn_unlockedBadges', JSON.stringify(pendingProgressionData.badges));
        pendingProgressionData = {};
        saveProgressionTimeout = null;
    } catch (e) {
        console.error("Failed to save progression data", e);
    }
};

export const saveProgression = (data: { level?: number, xp?: number, stats?: UserStats, badges?: string[] }) => {
    pendingProgressionData = { ...pendingProgressionData, ...data };
    if (saveProgressionTimeout) clearTimeout(saveProgressionTimeout);
    saveProgressionTimeout = setTimeout(performSave, 1000);
};

if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        if (saveProgressionTimeout) { clearTimeout(saveProgressionTimeout); performSave(); }
    });
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && saveProgressionTimeout) {
            clearTimeout(saveProgressionTimeout); performSave();
        }
    });
}

// ---------------------------------------------------------------------------
// Logs
// ---------------------------------------------------------------------------

export const loadLogs = (): LogEntry[] => {
    try {
        if (typeof localStorage === 'undefined') return [];
        const savedLogs = localStorage.getItem('flyvpn_connection_logs');
        return savedLogs ? JSON.parse(savedLogs) : [];
    } catch (e) {
        console.error("Failed to load logs from localStorage", e);
        if (typeof localStorage !== 'undefined') localStorage.removeItem('flyvpn_connection_logs');
        return [];
    }
};

let saveLogsTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingLogs: LogEntry[] | null = null;

const persistLogs = () => {
    if (!pendingLogs || typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem('flyvpn_connection_logs', JSON.stringify(pendingLogs));
        pendingLogs = null;
    } catch (e) {
        console.error("Failed to save logs to localStorage", e);
    }
    saveLogsTimeout = null;
};

export const saveLogs = (logs: LogEntry[]) => {
    pendingLogs = logs;
    if (saveLogsTimeout) clearTimeout(saveLogsTimeout);
    saveLogsTimeout = setTimeout(persistLogs, 2000);
};

export const flushLogs = () => {
    if (saveLogsTimeout) { clearTimeout(saveLogsTimeout); persistLogs(); }
};

export const clearLogs = () => {
    if (saveLogsTimeout) { clearTimeout(saveLogsTimeout); saveLogsTimeout = null; }
    pendingLogs = null;
    try { if (typeof localStorage !== 'undefined') localStorage.removeItem('flyvpn_connection_logs'); } catch (e) {
        console.error("Failed to clear logs from localStorage", e);
    }
};

// ---------------------------------------------------------------------------
// Backwards-compat shim
// ---------------------------------------------------------------------------
// Some code paths still import { disconnect } from "geminiService". Keep a
// thin re-export so the rename doesn't break anything.
export const disconnect = (): Promise<void> => {
    if (typeof window !== 'undefined') return new Promise(r => setTimeout(r, 100));
    return Promise.resolve();
};
