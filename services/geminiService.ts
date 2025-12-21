import { Server, LogEntry } from '../types';
import { UserStats } from '../lib/badges';

// --- VPN Service ---
export const connect = (server: Server): Promise<Server> => {
    return new Promise(resolve => setTimeout(() => resolve(server), 2500));
};

export const disconnect = (): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, 500));
};

export const switchServer = (server: Server): Promise<Server> => {
    return new Promise(resolve => setTimeout(() => resolve(server), 1200));
};

// --- IP Service ---
export const getRealIP = (): Promise<string> => {
    return new Promise(resolve => setTimeout(() => resolve('203.0.113.42'), 1500));
}

// --- Progression Service ---
export const loadProgression = (): { level: number, xp: number, stats: UserStats, badges: string[] } => {
    try {
        const savedLevel = localStorage.getItem('flyvpn_level');
        const savedXp = localStorage.getItem('flyvpn_xp');
        const savedStats = localStorage.getItem('flyvpn_userStats');
        const savedBadges = localStorage.getItem('flyvpn_unlockedBadges');
        return {
            level: savedLevel ? JSON.parse(savedLevel) : 1,
            xp: savedXp ? JSON.parse(savedXp) : 0,
            stats: savedStats ? JSON.parse(savedStats) : { totalNeutralized: 0, malware: 0, phishing: 0, ddos: 0, spyware: 0, adware: 0, level: 1 },
            badges: savedBadges ? JSON.parse(savedBadges) : [],
        };
    } catch (e) {
        console.error("Failed to load progression data", e);
        return { level: 1, xp: 0, stats: { totalNeutralized: 0, malware: 0, phishing: 0, ddos: 0, spyware: 0, adware: 0, level: 1 }, badges: [] };
    }
};

export const saveProgression = (data: { level?: number, xp?: number, stats?: UserStats, badges?: string[] }) => {
    try {
        if (data.level) localStorage.setItem('flyvpn_level', JSON.stringify(data.level));
        if (data.xp) localStorage.setItem('flyvpn_xp', JSON.stringify(data.xp));
        if (data.stats) localStorage.setItem('flyvpn_userStats', JSON.stringify(data.stats));
        if (data.badges) localStorage.setItem('flyvpn_unlockedBadges', JSON.stringify(data.badges));
    } catch (e) {
        console.error("Failed to save progression data", e);
    }
};


// --- Log Service ---
export const loadLogs = (): LogEntry[] => {
    try {
        const savedLogs = localStorage.getItem('flyvpn_connection_logs');
        return savedLogs ? JSON.parse(savedLogs) : [];
    } catch(e) {
        console.error("Failed to load logs from localStorage", e);
        localStorage.removeItem('flyvpn_connection_logs');
        return [];
    }
};

export const saveLogs = (logs: LogEntry[]) => {
    try {
        localStorage.setItem('flyvpn_connection_logs', JSON.stringify(logs));
    } catch (e) {
        console.error("Failed to save logs to localStorage", e);
    }
};

export const clearLogs = () => {
    try {
        localStorage.removeItem('flyvpn_connection_logs');
    } catch (e) {
        console.error("Failed to clear logs from localStorage", e);
    }
}
