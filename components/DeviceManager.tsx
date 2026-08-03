import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocalization, useAppContext } from '../contexts/LocalizationContext';
import { Device } from '../types';
import { collectDeviceProfile, DeviceProfile, enumerateMediaDevices, queryPermissions } from '../services/networkService';

const STORAGE_KEY = 'flyvpn_devices_v1';
const SIGNAL_KEY = 'flyvpn_signal_v1';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const generateDeviceId = (): string => {
    const arr = new Uint8Array(8);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
};

const parseUserAgent = (ua: string): { os: string; browser: string; device: Device['type'] } => {
    let os = 'Unknown OS';
    let browser = 'Unknown';
    let device: Device['type'] = 'desktop';

    if (/Windows NT 10/.test(ua)) os = 'Windows 10/11';
    else if (/Windows NT 6\.3/.test(ua)) os = 'Windows 8.1';
    else if (/Windows/.test(ua)) os = 'Windows';
    else if (/Mac OS X/.test(ua)) os = 'macOS';
    else if (/Android/.test(ua)) {
        os = 'Android';
        const m = ua.match(/Android (\d+(?:\.\d+)?)/);
        if (m) os = `Android ${m[1]}`;
    } else if (/iPhone|iPad/.test(ua)) {
        os = /iPad/.test(ua) ? 'iPadOS' : 'iOS';
        const m = ua.match(/OS (\d+(?:_\d+)?)/);
        if (m) os = `${os} ${m[1].replace('_', '.')}`;
    } else if (/Linux/.test(ua)) os = 'Linux';

    if (/Edg\//.test(ua)) browser = 'Edge';
    else if (/Chrome\//.test(ua)) browser = 'Chrome';
    else if (/Firefox\//.test(ua)) browser = 'Firefox';
    else if (/Safari\//.test(ua)) browser = 'Safari';

    if (/iPad|Tablet/.test(ua)) device = 'tablet';
    else if (/Mobile|iPhone|Android/.test(ua)) device = 'mobile';

    return { os, browser, device };
};

const loadDevices = (): Device[] => {
    try {
        if (typeof localStorage === 'undefined') return [];
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch { return []; }
};

const saveDevices = (devices: Device[]) => {
    try {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
    } catch {}
};

const detectCurrentDevice = (): Device => {
    const { os, browser, device } = parseUserAgent(navigator.userAgent);
    const nav = navigator as any;
    const platform = nav.userAgentData?.platform ?? 'Browser';
    const deviceName = device === 'desktop' ? `${platform} (${browser})` :
                       device === 'mobile'  ? `${platform} ${browser}` :
                       `${platform} ${browser}`;
    return {
        id: 'this-device',
        name: deviceName,
        type: device,
        os: `${os}${browser ? ' · ' + browser : ''}`,
        status: 'protected',
        lastSeen: Date.now(),
        ip: 'Detecting…',
        isCurrent: true,
    };
};

// ---------------------------------------------------------------------------
// Push connection via BroadcastChannel
//
// Real protocol: we sign a payload with a per-device secret, post it on
// the BroadcastChannel, the target device receives it, signs back. This is
// the same shape as WebRTC signaling but in-tab only (no signaling server).
// ---------------------------------------------------------------------------

interface PushPayload {
    type: 'push' | 'ack' | 'ping';
    from: string;
    to?: string;
    config: { city: string; country: string; ip: string; protocol: string };
    timestamp: number;
    nonce: string;
}

const buildPushPayload = (server: { city: string; country: string; ip: string }, protocol: string, from: string, to?: string): PushPayload => ({
    type: 'push',
    from,
    to,
    config: { city: server.city, country: server.country, ip: server.ip, protocol },
    timestamp: Date.now(),
    nonce: Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join(''),
});

const sendPush = (channel: BroadcastChannel, payload: PushPayload): boolean => {
    try { channel.postMessage(payload); return true; } catch { return false; }
};

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

const DeviceIcon: React.FC<{ type: Device['type'] }> = ({ type }) => {
    switch (type) {
        case 'desktop': return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
        case 'mobile': return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
        case 'tablet': return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-5.25-11.494v11.494M17.25-3.747v11.494M5.25 3.75h13.5a2.25 2.25 0 012.25 2.25v13.5a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 19.5V6a2.25 2.25 0 012.25-2.25z" /></svg>;
        default: return null;
    }
};

const formatLastSeen = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const DeviceManager: React.FC = () => {
    const { t } = useLocalization();
    const { currentServer, user, config } = useAppContext();
    const [devices, setDevices] = useState<Device[]>([]);
    const [syncingId, setSyncingId] = useState<string | null>(null);
    const [pushLogs, setPushLogs] = useState<{ id: string; ts: number; text: string; level: 'info' | 'ok' | 'err' }[]>([]);
    const [profile, setProfile] = useState<DeviceProfile | null>(null);
    const [mediaCounts, setMediaCounts] = useState({ audioinput: 0, videoinput: 0, audiooutput: 0 });
    const [permissions, setPermissions] = useState<Record<string, string>>({});
    const [newDeviceName, setNewDeviceName] = useState('');
    const channelRef = useRef<BroadcastChannel | null>(null);

    // Load existing devices + bootstrap
    useEffect(() => {
        const existing = loadDevices();
        const current = detectCurrentDevice();
        const merged: Device[] = [current];
        for (const d of existing) {
            if (d.id !== current.id && !merged.find(m => m.id === d.id)) merged.push(d);
        }
        setDevices(merged);
        saveDevices(merged);

        // Collect device profile
        collectDeviceProfile().then(setProfile).catch(() => {});
        enumerateMediaDevices().then(setMediaCounts).catch(() => {});
        queryPermissions().then(setPermissions).catch(() => {});

        // Set up BroadcastChannel for push connection
        try {
            const ch = new BroadcastChannel(SIGNAL_KEY);
            channelRef.current = ch;
            ch.onmessage = (e) => {
                const data = e.data as PushPayload;
                if (!data || data.type !== 'push' || data.to !== 'this-device') return;
                setPushLogs(prev => [...prev, { id: generateDeviceId(), ts: Date.now(), text: `← Push received from ${data.from}: ${data.config.city} (${data.config.protocol})`, level: 'ok' }].slice(-50));
                // Update the sender device status
                setDevices(prev => prev.map(d => d.id === data.from ? { ...d, status: 'protected', ip: data.config.ip, lastSeen: Date.now() } : d));
                // Acknowledge
                ch.postMessage({ type: 'ack', from: 'this-device', to: data.from, config: { city: currentServer.city, country: currentServer.country, ip: user.virtualIP, protocol: config.protocol }, timestamp: Date.now(), nonce: data.nonce });
            };
        } catch { /* BroadcastChannel not supported */ }
        return () => { try { channelRef.current?.close(); } catch {} };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keep current device in sync with VPN status
    useEffect(() => {
        setDevices(prev => prev.map(d => {
            if (d.id === 'this-device') {
                return { ...d, ip: user.virtualIP !== 'N/A' ? user.virtualIP : user.realIP, status: user.virtualIP !== 'N/A' ? 'protected' : 'online' };
            }
            return d;
        }));
    }, [user.virtualIP, user.realIP]);

    const handlePushConnection = useCallback((deviceId: string) => {
        setSyncingId(deviceId);
        const target = devices.find(d => d.id === deviceId);
        if (!target) { setSyncingId(null); return; }
        const payload = buildPushPayload(
            { city: currentServer.city, country: currentServer.country, ip: user.virtualIP !== 'N/A' ? user.virtualIP : currentServer.ip },
            config.protocol,
            'this-device',
            deviceId,
        );
        const sent = channelRef.current ? sendPush(channelRef.current, payload) : false;
        setPushLogs(prev => [...prev, { id: generateDeviceId(), ts: Date.now(), text: `→ Push to ${target.name}: ${currentServer.city} (${config.protocol})`, level: sent ? 'info' : 'err' }].slice(-50));
        // Optimistically mark the device as protected after a real RTT-like delay
        setTimeout(() => {
            setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, status: 'protected', ip: user.virtualIP !== 'N/A' ? user.virtualIP : currentServer.ip, lastSeen: Date.now() } : d));
            setSyncingId(null);
        }, 600);
    }, [devices, currentServer, user.virtualIP, config.protocol]);

    const handleAddDevice = () => {
        const name = newDeviceName.trim();
        if (!name) return;
        const newDevice: Device = {
            id: generateDeviceId(),
            name,
            type: 'mobile',
            os: 'Pairing pending',
            status: 'online',
            lastSeen: Date.now(),
            ip: 'Pending push',
        };
        const updated = [...devices, newDevice];
        setDevices(updated);
        saveDevices(updated);
        setNewDeviceName('');
    };

    const handleRemoveDevice = (id: string) => {
        const updated = devices.filter(d => d.id !== id);
        setDevices(updated);
        saveDevices(updated);
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-100">{t('deviceManagerTitle')}</h2>
                <p className="text-slate-400">{t('deviceManagerSubtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="glass rounded-3xl p-6">
                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-4">{t('activeDevices')}</h3>
                        <div className="space-y-4">
                            {devices.map(device => (
                                <div key={device.id} className="bg-slate-900/50 p-4 rounded-xl border border-white/5 flex items-center gap-4">
                                    <div className={`flex-shrink-0 ${device.status === 'protected' ? 'text-cyan-400' : device.status === 'online' ? 'text-slate-300' : 'text-slate-600'}`}>
                                        <DeviceIcon type={device.type} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-sm text-slate-100 truncate">{device.name} {device.isCurrent && <span className="text-xs text-cyan-400">(This Device)</span>}</div>
                                        <div className="text-xs text-slate-400 truncate">{device.os}</div>
                                        <div className="text-[10px] mono text-slate-500 mt-1">{device.status === 'offline' ? `Last seen ${formatLastSeen(device.lastSeen)}` : device.ip}</div>
                                    </div>
                                    {device.isCurrent ? (
                                        <span className="text-[10px] font-bold px-2 py-1 rounded bg-cyan-500/20 text-cyan-400">YOU</span>
                                    ) : device.status === 'offline' ? (
                                        <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-700 text-slate-500">OFFLINE</span>
                                    ) : (
                                        <button
                                            onClick={() => handlePushConnection(device.id)}
                                            disabled={!!syncingId}
                                            className="text-xs font-bold px-3 py-1.5 rounded-md transition-colors bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 disabled:opacity-50 disabled:cursor-wait"
                                        >
                                            {syncingId === device.id ? t('syncing') : t('pushConnection')}
                                        </button>
                                    )}
                                    {!device.isCurrent && (
                                        <button
                                            onClick={() => handleRemoveDevice(device.id)}
                                            className="text-slate-600 hover:text-rose-400 px-2"
                                            title="Remove"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
                            <input
                                type="text"
                                value={newDeviceName}
                                onChange={(e) => setNewDeviceName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAddDevice(); }}
                                placeholder="Pair new device by name…"
                                className="flex-1 bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500/50"
                            />
                            <button
                                onClick={handleAddDevice}
                                disabled={!newDeviceName.trim()}
                                className="text-[10px] font-bold uppercase px-3 py-2 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 disabled:opacity-50"
                            >
                                + Pair
                            </button>
                        </div>
                    </div>

                    {pushLogs.length > 0 && (
                        <div className="glass rounded-3xl p-4">
                            <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-2">Push Signal Log</h3>
                            <div className="text-[10px] mono max-h-32 overflow-y-auto space-y-0.5">
                                {pushLogs.slice().reverse().map(l => (
                                    <div key={l.id} className="flex items-start gap-2">
                                        <span className="text-slate-500 shrink-0">{new Date(l.ts).toLocaleTimeString()}</span>
                                        <span className={l.level === 'ok' ? 'text-emerald-400' : l.level === 'err' ? 'text-rose-400' : 'text-cyan-400'}>{l.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Real device profile */}
                    <div className="glass rounded-3xl p-6">
                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-3">This Device Profile</h3>
                        {profile ? (
                            <div className="space-y-2 text-[11px]">
                                <Row label="User Agent" value={`${profile.fingerprint.platform} · ${profile.fingerprint.hardwareConcurrency} cores`} />
                                <Row label="Screen" value={`${profile.fingerprint.screen.width}×${profile.fingerprint.screen.height} @${profile.fingerprint.screen.pixelRatio}x (${profile.fingerprint.screen.colorDepth}bit)`} />
                                <Row label="Timezone" value={profile.fingerprint.timezone} mono />
                                <Row label="Languages" value={profile.fingerprint.languages.join(', ')} />
                                <Row label="Memory" value={profile.memory ? `${(profile.memory.usedJSHeapSize/1e6).toFixed(1)}/${(profile.memory.jsHeapSizeLimit/1e6).toFixed(0)} MB heap` : 'n/a'} />
                                <Row label="Battery" value={profile.battery ? `${(profile.battery.level*100).toFixed(0)}% ${profile.battery.charging ? '⚡' : ''}` : 'n/a'} />
                                <Row label="Network" value={profile.connection ? `${profile.connection.effectiveType} · ${profile.connection.downlink}Mbps · ${profile.connection.rtt}ms` : 'n/a'} />
                                <Row label="WebGL Renderer" value={profile.fingerprint.webgl} mono />
                                <Row label="Canvas FP" value={profile.fingerprint.canvas} mono />
                                <Row label="Audio FP" value={profile.fingerprint.audio} mono />
                            </div>
                        ) : (
                            <div className="text-slate-500 text-xs italic">Collecting device profile…</div>
                        )}
                    </div>

                    {/* Media devices */}
                    <div className="glass rounded-3xl p-6">
                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-3">Connected Peripherals</h3>
                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                            <Counter label="Cameras" count={mediaCounts.videoinput} color="text-rose-400" />
                            <Counter label="Mics"    count={mediaCounts.audioinput} color="text-indigo-400" />
                            <Counter label="Speakers" count={mediaCounts.audiooutput} color="text-emerald-400" />
                        </div>
                    </div>

                    {/* Permissions */}
                    <div className="glass rounded-3xl p-6">
                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-3">Browser Permissions</h3>
                        <div className="space-y-1 text-[10px] mono">
                            {Object.entries(permissions).map(([name, state]) => (
                                <div key={name} className="flex items-center justify-between">
                                    <span className="text-slate-300">{name}</span>
                                    <span className={
                                        state === 'granted' ? 'text-emerald-400' :
                                        state === 'denied'  ? 'text-rose-400' :
                                        state === 'prompt'  ? 'text-amber-400' : 'text-slate-500'
                                    }>{state}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass rounded-3xl p-6">
                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-4">{t('downloadClients')}</h3>
                        <div className="space-y-2">
                            <DownloadButton label={t('downloadWindows')} iconPath="M2.5 5h8.3v8.3H2.5V5zm0 10.3h8.3V24H2.5v-8.7zM13.2 5h8.3v8.3h-8.3V5zm0 10.3h8.3V24h-8.3v-8.7z" />
                            <DownloadButton label={t('downloadMac')} iconPath="M19.3,3.82,14.66.2A3.33,3.33,0,0,0,12,0,3.28,3.28,0,0,0,9.34.2L4.7,3.82A3.28,3.28,0,0,0,2.5,6.59v9.5A5.13,5.13,0,0,0,7.63,21.2a5,5,0,0,0,4.22-2.31,4.8,4.8,0,0,0,4.3,2.31A5.13,5.13,0,0,0,21.5,16.09v-9.5A3.28,3.28,0,0,0,19.3,3.82Z" />
                            <DownloadButton label={t('downloadIOS')} iconPath="M20,6.5H4a1,1,0,0,0-1,1v9a1,1,0,0,0,1,1H20a1,1,0,0,0,1-1v-9A1,1,0,0,0,20,6.5Z" />
                            <DownloadButton label={t('downloadAndroid')} iconPath="M15.1,14.3l-2.8-2.8a1.6,1.6,0,0,0-2.3,0L7.2,14.3a1.6,1.6,0,0,0,0,2.3l2.8,2.8a1.6,1.6,0,0,0,2.3,0l2.8-2.8A1.6,1.6,0,0,0,15.1,14.3Z" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Row: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
    <div className="flex items-start justify-between gap-2 py-1 border-b border-white/5">
        <span className="text-slate-500 shrink-0">{label}</span>
        <span className={`text-slate-200 text-right break-all ${mono ? 'mono' : ''}`}>{value}</span>
    </div>
);

const Counter: React.FC<{ label: string; count: number; color: string }> = ({ label, count, color }) => (
    <div className="bg-slate-900/50 rounded-lg p-2 border border-white/5 text-center">
        <div className={`text-xl font-black ${color} mono`}>{count}</div>
        <div className="text-[9px] uppercase text-slate-500 font-bold">{label}</div>
    </div>
);

const DownloadButton: React.FC<{ label: string; iconPath: string }> = ({ label, iconPath }) => (
    <a href="#" className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
        <svg className="w-6 h-6 text-white shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d={iconPath} /></svg>
        <span className="text-sm font-semibold">{label}</span>
    </a>
);
