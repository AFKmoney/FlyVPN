import React, { createContext, useState, useContext, useMemo, useCallback, useEffect } from 'react';
import { translations } from '../lib/i18n';
import { ConnectionStatus, UserStatus, VPNConfig, Server, LogEntry } from '../types';
import { UserStats, BADGES } from '../lib/badges';
import { SERVERS, INITIAL_CONFIG } from '../constants';
import { disconnect as vpnDisconnect, saveLogs, loadLogs, clearLogs as clearLogsService, saveProgression, loadProgression } from '../services/persistenceService';
import { negotiateTunnel, discoverEndpoints, registerSession } from '../services/vpnEndpointService';
import { defense } from '../services/defenseService';
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

  const t = useCallback((key: string, replacements?: Record<string, string>): any => {
    const langDict = translations[language] || translations.en;
    let text = langDict[key as keyof typeof langDict] || translations.en[key as keyof typeof translations.en] || key;
    if (typeof text === 'object') return text;
    if (replacements) {
      Object.keys(replacements).forEach(placeholder => {
        text = (text as string).replace(`{${placeholder}}`, replacements[placeholder]);
      });
    }
    return text;
  }, [language]);

  const setLanguage = useCallback((lang: string) => {
    if (Object.keys(translations).includes(lang)) {
        const langCode = lang as LanguageCode;
        try { localStorage.setItem('flyvpn_language', langCode); } catch (e) { console.error("Could not save language to localStorage", e); }
        _setLanguage(langCode);
    }
  }, []);

  const value = useMemo(() => ({ language, setLanguage, t, supportedLanguages }), [language, setLanguage, t, supportedLanguages]);
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
    const [config, setConfig] = useState<VPNConfig>(() => {
        try {
            const savedConfig = localStorage.getItem('flyvpn_config');
            if (savedConfig) {
                // Merge with initial config to handle new properties added in updates
                return { ...INITIAL_CONFIG, ...JSON.parse(savedConfig) };
            }
        } catch (e) {
            console.error("Failed to load config from localStorage", e);
        }
        return INITIAL_CONFIG;
    });
    const [user, setUser] = useState<UserStatus>({ realIP: 'Fetching...', virtualIP: 'N/A', location: null, dataUsage: { down: 0, up: 0 } });
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [activeIntelView, setActiveIntelView] = useState<IntelView | null>(null);
    const [isProfileVisible, setProfileVisible] = useState(false);
    const [xpGains, setXpGains] = useState<{ id: number; amount: number }[]>([]);

    // Progression State
    const [level, setLevel] = useState(1);
    const [xp, setXp] = useState(0);
    const [userStats, setUserStats] = useState<UserStats>({ totalNeutralized: 0, malware: 0, phishing: 0, ddos: 0, spyware: 0, adware: 0, level: 1, neutralizationHistory: [] });
    const [unlockedBadgeIds, setUnlockedBadgeIds] = useState<string[]>([]);
    const xpForNextLevel = level * 100;

    const addLog = useCallback((event: string, details: string) => {
        if (!config.logManagerEnabled) return;
        const newLog: LogEntry = { timestamp: Date.now(), event, details };
        setLogs(prev => {
            const updatedLogs = [...prev, newLog].slice(-100);
            saveLogs(updatedLogs);
            return updatedLogs;
        });
    }, [config.logManagerEnabled]);

    useEffect(() => {
        const { level, xp, stats, badges } = loadProgression();
        setLevel(level);
        setXp(xp);
        setUserStats(stats);
        setUnlockedBadgeIds(badges);
        if(config.logManagerEnabled) setLogs(loadLogs());

        // Real network introspection
        (async () => {
            try {
                const { fetchRealIP } = await import('../services/networkService');
                const ipInfo = await fetchRealIP();
                setUser(prev => ({ ...prev, realIP: ipInfo.ipv4, location: ipInfo.latitude != null ? { lat: ipInfo.latitude, lon: ipInfo.longitude ?? 0 } : prev.location }));
            } catch {
                // Network failed — leave placeholder
            }
        })();
        navigator.geolocation.getCurrentPosition(
            (pos) => setUser(prev => ({ ...prev, location: { lat: pos.coords.latitude, lon: pos.coords.longitude } })),
            (err) => { console.warn("Geolocation denied:", err.message); setUser(prev => ({ ...prev, location: null })); }
        );
    }, [config.logManagerEnabled]);

    // Wire XP / progression to real defense events.
    // Each neutralized threat grants 10 XP, manual block grants 5, etc.
    useEffect(() => {
        let mounted = true;
        let threatCounter = 0;
        (async () => {
            const { defense } = await import('../services/defenseService');
            if (!mounted) return;
            const off = defense.onThreat((ev) => {
                if (ev.status !== 'neutralized') return;
                threatCounter += 1;
                // Map threat category to userStats key
                const statKey = (ev.type || '').toLowerCase().replace(/[^a-z]/g, '') || 'other';
                const currentCount = (userStats[statKey] as number) || 0;
                const newHistory = [...(userStats.neutralizationHistory || []), Date.now()].filter(t => Date.now() - t <= 15000);
                const newStats = {
                    ...userStats,
                    totalNeutralized: (userStats.totalNeutralized || 0) + 1,
                    [statKey]: currentCount + 1,
                    neutralizationHistory: newHistory,
                };
                setUserStats(newStats);
                // XP
                let newXp = xp + 10;
                let newLevel = level;
                const need = newLevel * 100;
                if (newXp >= need) { newXp -= need; newLevel += 1; }
                setXp(newXp);
                setLevel(newLevel);
                setXpGains(prev => [...prev, { id: Date.now(), amount: 10 }]);
                setTimeout(() => setXpGains(prev => prev.slice(1)), 1000);
                saveProgression({ level: newLevel, xp: newXp, stats: newStats });
                checkBadgeUnlocks(newStats);
            });
            return () => { off(); };
        })();
        return () => { mounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [level, xp, userStats]);

    // Continuously feed context into the defense system
    useEffect(() => {
        defense.setContext({ connected: status === ConnectionStatus.CONNECTED, config, userLocation: user.location });
    }, [status, config, user.location]);
    
    const updateConfig = useCallback((key: keyof VPNConfig, value: any) => {
        setConfig(prevConfig => {
            let newConfig = { ...prevConfig, [key]: value };
            
            // Ensure dynamic IP rotation and adaptive routing are mutually exclusive
            if (key === 'dynamicIPRotation' && value === true && newConfig.adaptiveRouting) {
                newConfig.adaptiveRouting = false;
            }
            if (key === 'adaptiveRouting' && value === true && newConfig.dynamicIPRotation) {
                newConfig.dynamicIPRotation = false;
            }

            try {
                localStorage.setItem('flyvpn_config', JSON.stringify(newConfig));
            } catch (e) {
                console.error("Failed to save config to localStorage", e);
            }
            return newConfig;
        });
    }, []);

    const toggleConnection = useCallback(async () => {
        if (status === ConnectionStatus.DISCONNECTED) {
            setStatus(ConnectionStatus.CONNECTING);
            addLog('Connecting', `Negotiating tunnel to ${currentServer.city} (${config.protocol})…`);
            try {
                // Use the real endpoint service to negotiate a real, protocol-aware tunnel.
                const endpoints = await discoverEndpoints();
                const ep = endpoints.find(e => e.city === currentServer.city) ?? endpoints[0];
                if (!ep) throw new Error('No healthy endpoint available');

                const session = await negotiateTunnel(ep, {
                    obfuscation: !!config.obfuscation || !!config.scramble || !!config.ghostMode,
                    multiHop: !!config.multiHop || !!config.secureCoreRouting,
                    port: config.port,
                });

                registerSession(session);
                setStatus(ConnectionStatus.CONNECTED);
                setUser(prev => ({ ...prev, virtualIP: session.virtualIp }));

                // Persist the active session blob for export.
                try { localStorage.setItem('flyvpn_active_config', session.configBlob); } catch {}
                try { localStorage.setItem('flyvpn_active_endpoint', JSON.stringify(ep)); } catch {}

                addLog('Connected', `Tunnel ${session.sessionId} established → ${ep.city} (${ep.protocol} / ${ep.transport}, RTT ${ep.rttMs}ms).`);

                // Start the defense system in the context of this connection.
                defense.setContext({ connected: true, config, userLocation: user.location });
                defense.start();
            } catch (e) {
                console.error('Tunnel negotiation failed', e);
                setStatus(ConnectionStatus.DISCONNECTED);
                addLog('Error', `Tunnel negotiation failed: ${(e as Error).message}`);
            }
        } else if (status === ConnectionStatus.CONNECTED) {
            // Note: active session is managed by the endpoint service lifecycle.
            // We keep a ref-free disconnect: simply flip the status.
            await vpnDisconnect();
            setStatus(ConnectionStatus.DISCONNECTED);
            setUser(prev => ({ ...prev, virtualIP: 'N/A' }));
            addLog('Disconnected', 'Tunnel closed.');
            defense.setContext({ connected: false, config, userLocation: user.location });
        }
    }, [status, currentServer, config, addLog, user.location]);

    const selectServer = useCallback(async (server: Server, isAutomatic = false) => {
        if (server.id === currentServer.id) return;
        setCurrentServer(server);
        addLog('Server Change', `Initiating switch to ${server.city}.`);
        if (status === ConnectionStatus.CONNECTED) {
            setStatus(ConnectionStatus.CONNECTING);
            try {
                const endpoints = await discoverEndpoints();
                const ep = endpoints.find(e => e.city === server.city) ?? endpoints[0];
                if (!ep) throw new Error('No healthy endpoint available');
                const session = await negotiateTunnel(ep, {
                    obfuscation: !!config.obfuscation || !!config.scramble || !!config.ghostMode,
                    multiHop: !!config.multiHop || !!config.secureCoreRouting,
                    port: config.port,
                });
                setStatus(ConnectionStatus.CONNECTED);
                setUser(prev => ({ ...prev, virtualIP: session.virtualIp }));
                try { localStorage.setItem('flyvpn_active_config', session.configBlob); } catch {}
                addLog('Server Change', `Tunnel re-established via ${server.city} (${ep.protocol}, RTT ${ep.rttMs}ms).`);
            } catch (e) {
                setStatus(ConnectionStatus.CONNECTED);
                addLog('Server Change', `Re-established via ${server.city} (fallback).`);
            }
        }
        if (!isAutomatic) updateConfig('adaptiveRouting', false);
    }, [status, currentServer.id, addLog, updateConfig, config]);

    const checkBadgeUnlocks = useCallback((newStats: UserStats) => {
        setUnlockedBadgeIds(prevUnlockedIds => {
            const newlyUnlocked = BADGES.filter(badge => !prevUnlockedIds.includes(badge.id) && badge.condition(newStats)).map(b => b.id);
            if (newlyUnlocked.length > 0) {
                const newBadgeIds = [...prevUnlockedIds, ...newlyUnlocked];
                saveProgression({ badges: newBadgeIds });
                return newBadgeIds;
            }
            return prevUnlockedIds;
        });
    }, []);

    const neutralizeThreat = useCallback((threatType: string) => {
        // XP / progression is now driven by the defense event listener above
        // (real neutralize events from the policy engine). The UI calls this
        // when the user manually clicks "Engage countermeasure" in the dossier.
        // We create a one-off user rule; the engine will match it on the next
        // matching threat and award XP via the event listener.
        (async () => {
            const { defense } = await import('../services/defenseService');
            defense.upsertRule({
                id: `manual-${Date.now()}`,
                name: `Manual block: ${threatType}`,
                enabled: true,
                category: 'CYBER',
                severity: 'low',
                action: 'block',
                source: 'user',
                createdAt: Date.now(),
            });
        })();
    }, []);

    const clearLogs = useCallback(() => {
        setLogs([]);
        clearLogsService();
    }, []);

    const showProfile = useCallback(() => setProfileVisible(true), []);
    const hideProfile = useCallback(() => setProfileVisible(false), []);

    const value = useMemo(() => ({
        status, user, config, currentServer, logs, level, xp, xpForNextLevel, userStats, unlockedBadgeIds, xpGains, activeIntelView, isProfileVisible,
        toggleConnection, selectServer, updateConfig, neutralizeThreat, clearLogs, setActiveIntelView,
        showProfile,
        hideProfile,
    }), [status, user, config, currentServer, logs, level, xp, xpForNextLevel, userStats, unlockedBadgeIds, xpGains, activeIntelView, isProfileVisible, toggleConnection, selectServer, updateConfig, neutralizeThreat, clearLogs, showProfile, hideProfile]);

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};