import React, { createContext, useState, useContext, useMemo, useCallback, useEffect } from 'react';
import { translations } from '../lib/i18n';
import { ConnectionStatus, UserStatus, VPNConfig, Server, LogEntry } from '../types';
import { UserStats, BADGES } from '../lib/badges';
import { SERVERS, INITIAL_CONFIG } from '../constants';
import * as vpnService from '../services/geminiService';
import * as progressionService from '../services/geminiService';
import * as logService from '../services/geminiService';
import { IntelView } from '../App';

// --- Localization Context ---
type LanguageCode = keyof typeof translations;
interface LocalizationContextType {
  language: LanguageCode;
  setLanguage: (language: string) => void;
  t: (key: string, replacements?: Record<string, string>) => any;
  supportedLanguages: Record<LanguageCode, { name: string }>;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, _setLanguage] = useState<LanguageCode>(() => {
    try {
      const storedLang = localStorage.getItem('flyvpn_language');
      if (storedLang && translations[storedLang as LanguageCode]) {
        return storedLang as LanguageCode;
      }
    } catch (e) { console.error("Could not read language from localStorage", e); }
    return 'en';
  });

  const supportedLanguages = useMemo(() => {
    return (Object.keys(translations) as LanguageCode[]).reduce((acc, langCode) => {
      acc[langCode] = { name: translations[langCode].name };
      return acc;
    }, {} as Record<LanguageCode, { name: string }>);
  }, []);

  const t = (key: string, replacements?: Record<string, string>): any => {
    const langDict = translations[language] || translations.en;
    let text = langDict[key as keyof typeof langDict] || translations.en[key as keyof typeof translations.en] || key;
    if (typeof text === 'object') return text;
    if (replacements) {
      Object.keys(replacements).forEach(placeholder => {
        text = (text as string).replace(`{${placeholder}}`, replacements[placeholder]);
      });
    }
    return text;
  };

  const setLanguage = (lang: string) => {
    if (Object.keys(translations).includes(lang)) {
        const langCode = lang as LanguageCode;
        try { localStorage.setItem('flyvpn_language', langCode); } catch (e) { console.error("Could not save language to localStorage", e); }
        _setLanguage(langCode);
    }
  };

  const value = { language, setLanguage, t, supportedLanguages };
  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
};

export const useLocalization = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  if (!context) throw new Error('useLocalization must be used within a LocalizationProvider');
  return context;
};

// --- Global App Context ---
interface AppContextType {
    status: ConnectionStatus;
    user: UserStatus;
    config: VPNConfig;
    currentServer: Server;
    logs: LogEntry[];
    level: number;
    xp: number;
    xpForNextLevel: number;
    userStats: UserStats;
    unlockedBadgeIds: string[];
    xpGains: { id: number; amount: number }[];
    activeIntelView: IntelView | null;
    isProfileVisible: boolean;

    toggleConnection: () => void;
    selectServer: (server: Server, isAutomatic?: boolean) => void;
    updateConfig: (key: keyof VPNConfig, value: any) => void;
    neutralizeThreat: (threatType: string) => void;
    clearLogs: () => void;
    setActiveIntelView: (view: IntelView | null) => void;
    showProfile: () => void;
    hideProfile: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
    const [currentServer, setCurrentServer] = useState<Server>(SERVERS.find(s => s.tier === 'optimized') || SERVERS[0]);
    const [config, setConfig] = useState<VPNConfig>(INITIAL_CONFIG);
    const [user, setUser] = useState<UserStatus>({ realIP: 'Fetching...', virtualIP: 'N/A', location: null, dataUsage: { down: 0, up: 0 } });
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [activeIntelView, setActiveIntelView] = useState<IntelView | null>(null);
    const [isProfileVisible, setProfileVisible] = useState(false);
    const [xpGains, setXpGains] = useState<{ id: number; amount: number }[]>([]);

    // Progression State
    const [level, setLevel] = useState(1);
    const [xp, setXp] = useState(0);
    const [userStats, setUserStats] = useState<UserStats>({ totalNeutralized: 0, malware: 0, phishing: 0, ddos: 0, spyware: 0, adware: 0, level: 1 });
    const [unlockedBadgeIds, setUnlockedBadgeIds] = useState<string[]>([]);
    const xpForNextLevel = level * 100;

    const addLog = useCallback((event: string, details: string) => {
        if (!config.logManagerEnabled) return;
        const newLog: LogEntry = { timestamp: Date.now(), event, details };
        setLogs(prev => {
            const updatedLogs = [...prev, newLog].slice(-100);
            logService.saveLogs(updatedLogs);
            return updatedLogs;
        });
    }, [config.logManagerEnabled]);

    useEffect(() => {
        const { level, xp, stats, badges } = progressionService.loadProgression();
        setLevel(level);
        setXp(xp);
        setUserStats(stats);
        setUnlockedBadgeIds(badges);
        if(config.logManagerEnabled) setLogs(logService.loadLogs());

        vpnService.getRealIP().then(ip => setUser(prev => ({...prev, realIP: ip})));
        navigator.geolocation.getCurrentPosition(
            (pos) => setUser(prev => ({ ...prev, location: { lat: pos.coords.latitude, lon: pos.coords.longitude } })),
            (err) => { console.error("Geolocation error:", err.message); setUser(prev => ({ ...prev, location: null })); }
        );
    }, [config.logManagerEnabled]);
    
    const updateConfig = (key: keyof VPNConfig, value: any) => setConfig(prev => ({ ...prev, [key]: value }));

    const toggleConnection = useCallback(async () => {
        if (status === ConnectionStatus.DISCONNECTED) {
            setStatus(ConnectionStatus.CONNECTING);
            addLog('Connecting', `Establishing tunnel to ${currentServer.city}...`);
            const connectedServer = await vpnService.connect(currentServer);
            setStatus(ConnectionStatus.CONNECTED);
            setUser(prev => ({ ...prev, virtualIP: connectedServer.ip }));
            addLog('Connected', `Secure tunnel to ${currentServer.city} (${currentServer.ip}) established.`);
        } else if (status === ConnectionStatus.CONNECTED) {
            await vpnService.disconnect();
            setStatus(ConnectionStatus.DISCONNECTED);
            setUser(prev => ({ ...prev, virtualIP: 'N/A' }));
            addLog('Disconnected', `Tunnel closed.`);
        }
    }, [status, currentServer, addLog]);

    const selectServer = useCallback(async (server: Server, isAutomatic = false) => {
        if (server.id === currentServer.id) return;
        setCurrentServer(server);
        addLog('Server Change', `Initiating switch to ${server.city}.`);
        if (status === ConnectionStatus.CONNECTED) {
            setStatus(ConnectionStatus.CONNECTING);
            const newServer = await vpnService.switchServer(server);
            setStatus(ConnectionStatus.CONNECTED);
            setUser(prev => ({ ...prev, virtualIP: newServer.ip }));
            addLog('Server Change', `Tunnel re-established via ${server.city} (${server.ip}).`);
        }
        if (!isAutomatic) updateConfig('adaptiveRouting', false);
    }, [status, currentServer.id, addLog]);

    const checkBadgeUnlocks = useCallback((newStats: UserStats) => {
        setUnlockedBadgeIds(prevUnlockedIds => {
            const newlyUnlocked = BADGES.filter(badge => !prevUnlockedIds.includes(badge.id) && badge.condition(newStats)).map(b => b.id);
            if (newlyUnlocked.length > 0) {
                const newBadgeIds = [...prevUnlockedIds, ...newlyUnlocked];
                progressionService.saveProgression({ badges: newBadgeIds });
                return newBadgeIds;
            }
            return prevUnlockedIds;
        });
    }, []);

    const neutralizeThreat = useCallback((threatType: string) => {
        let newXp = xp + 10;
        let newLevel = level;
        if (newXp >= xpForNextLevel) {
            newLevel += 1;
            newXp -= xpForNextLevel;
        }
        
        const gainId = Date.now();
        setXpGains(prev => [...prev, { id: gainId, amount: 10 }]);
        setTimeout(() => setXpGains(prev => prev.filter(g => g.id !== gainId)), 1000);

        const newStats: UserStats = { ...userStats, level: newLevel, totalNeutralized: userStats.totalNeutralized + 1, [threatType.toLowerCase()]: (userStats[threatType.toLowerCase()] || 0) + 1 };
        
        setLevel(newLevel);
        setXp(newXp);
        setUserStats(newStats);
        
        checkBadgeUnlocks(newStats);
        progressionService.saveProgression({ level: newLevel, xp: newXp, stats: newStats });
    }, [xp, level, userStats, xpForNextLevel, checkBadgeUnlocks]);

    const clearLogs = () => {
        setLogs([]);
        logService.clearLogs();
    };

    const value = {
        status, user, config, currentServer, logs, level, xp, xpForNextLevel, userStats, unlockedBadgeIds, xpGains, activeIntelView, isProfileVisible,
        toggleConnection, selectServer, updateConfig, neutralizeThreat, clearLogs, setActiveIntelView,
        showProfile: () => setProfileVisible(true),
        hideProfile: () => setProfileVisible(false),
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
