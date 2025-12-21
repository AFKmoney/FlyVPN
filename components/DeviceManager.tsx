import React, { useState, useEffect } from 'react';
import { useLocalization, useAppContext } from '../contexts/LocalizationContext';
import { Device } from '../types';

const MOCK_DEVICES: Device[] = [
    { id: 'dev-1', name: 'This PC', type: 'desktop', os: 'Windows 11', status: 'protected', lastSeen: Date.now(), ip: '108.59.8.1', isCurrent: true },
    { id: 'dev-2', name: 'Pixel 8 Pro', type: 'mobile', os: 'Android 14', status: 'online', lastSeen: Date.now() - 3600000, ip: '192.168.1.101' },
    { id: 'dev-3', name: 'MacBook Pro', type: 'desktop', os: 'macOS Sonoma', status: 'offline', lastSeen: Date.now() - 86400000 * 2, ip: 'N/A' },
    { id: 'dev-4', name: 'Samsung Tab S9', type: 'tablet', os: 'Android 14', status: 'online', lastSeen: Date.now() - 7200000, ip: '192.168.1.105' },
];

const DeviceIcon: React.FC<{ type: Device['type'] }> = ({ type }) => {
    switch(type) {
        case 'desktop': return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
        case 'mobile': return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
        case 'tablet': return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-5.25-11.494v11.494M17.25-3.747v11.494M5.25 3.75h13.5a2.25 2.25 0 012.25 2.25v13.5a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 19.5V6a2.25 2.25 0 012.25-2.25z" /></svg>;
        default: return null;
    }
};

const formatLastSeen = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const diffMinutes = Math.floor(diff / 60000);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
};

export const DeviceManager: React.FC = () => {
    const { t } = useLocalization();
    const { currentServer, user } = useAppContext();
    const [devices, setDevices] = useState(MOCK_DEVICES);
    const [syncingId, setSyncingId] = useState<string | null>(null);

    useEffect(() => {
        // Update current device's IP when VPN connects/disconnects
        setDevices(prev => prev.map(d => d.isCurrent ? { ...d, ip: user.virtualIP !== 'N/A' ? user.virtualIP : user.realIP, status: user.virtualIP !== 'N/A' ? 'protected' : 'online' } : d));
    }, [user.virtualIP, user.realIP]);

    const handlePushConnection = (deviceId: string) => {
        setSyncingId(deviceId);
        setTimeout(() => {
            setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, status: 'protected', ip: currentServer.ip } : d));
            setSyncingId(null);
        }, 2000);
    };
    
    return (
        <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-100">{t('deviceManagerTitle')}</h2>
              <p className="text-slate-400">{t('deviceManagerSubtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass rounded-3xl p-6">
                    <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-4">{t('activeDevices')}</h3>
                    <div className="space-y-4">
                        {devices.map(device => (
                            <div key={device.id} className="bg-slate-900/50 p-4 rounded-xl border border-white/5 flex items-center gap-4">
                                <div className={`flex-shrink-0 ${device.status === 'protected' ? 'text-cyan-400' : device.status === 'online' ? 'text-slate-300' : 'text-slate-600'}`}>
                                    <DeviceIcon type={device.type} />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-sm text-slate-100">{device.name} {device.isCurrent && <span className="text-xs text-cyan-400">(This Device)</span>}</div>
                                    <div className="text-xs text-slate-400">{device.os}</div>
                                    <div className="text-[10px] mono text-slate-500 mt-1">{device.status === 'offline' ? `Last seen ${formatLastSeen(device.lastSeen)}` : device.ip}</div>
                                </div>
                                {!device.isCurrent && device.status !== 'offline' && (
                                    <button 
                                        onClick={() => handlePushConnection(device.id)}
                                        disabled={!!syncingId}
                                        className="text-xs font-bold px-3 py-1.5 rounded-md transition-colors bg-slate-700/50 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-wait"
                                    >
                                        {syncingId === device.id ? t('syncing') : t('pushConnection')}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                 <div className="glass rounded-3xl p-6">
                    <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-4">{t('downloadClients')}</h3>
                     <div className="space-y-3">
                        <a href="#" className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M2.5 5h8.3v8.3H2.5V5zm0 10.3h8.3V24H2.5v-8.7zM13.2 5h8.3v8.3h-8.3V5zm0 10.3h8.3V24h-8.3v-8.7z"/></svg>
                            <span className="text-sm font-semibold">{t('downloadWindows')}</span>
                        </a>
                         <a href="#" className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M19.3,3.82,14.66.2A3.33,3.33,0,0,0,12,0,3.28,3.28,0,0,0,9.34.2L4.7,3.82A3.28,3.28,0,0,0,2.5,6.59v9.5A5.13,5.13,0,0,0,7.63,21.2a5,5,0,0,0,4.22-2.31,4.8,4.8,0,0,0,4.3,2.31A5.13,5.13,0,0,0,21.5,16.09v-9.5A3.28,3.28,0,0,0,19.3,3.82ZM12,1.83c.31,0,.88.33,1.11.53l.14.12-2.5,2.15V1.91C11.13,2.05,11.66,1.83,12,1.83Zm9,14.26a3,3,0,0,1-3,3.13,3,3,0,0,1-3.13-3,3,3,0,0,1,.81-2L14,13.11v-4H10v4L8.31,14.2a3,3,0,0,1,.82,2,3,3,0,0,1-3.13,3,3,3,0,0,1-3-3.13V6.59a1.18,1.18,0,0,1,.65-1l4.64-3.62,1.52,1.31L8,9.45v5.16l4-3.37,4,3.37V9.45L14.19,8.28l1.52-1.31,4.64,3.62a1.18,1.18,0,0,1,.65,1Z"/></svg>
                             <span className="text-sm font-semibold">{t('downloadMac')}</span>
                        </a>
                         <a href="#" className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M20,6.5H4a1,1,0,0,0-1,1v9a1,1,0,0,0,1,1H20a1,1,0,0,0,1-1v-9A1,1,0,0,0,20,6.5Zm-8,10a1,1,0,1,1,1-1A1,1,0,0,1,12,16.5Z"/></svg>
                             <span className="text-sm font-semibold">{t('downloadIOS')}</span>
                        </a>
                         <a href="#" className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M15.1,14.3l-2.8-2.8a1.6,1.6,0,0,0-2.3,0L7.2,14.3a1.6,1.6,0,0,0,0,2.3l2.8,2.8a1.6,1.6,0,0,0,2.3,0l2.8-2.8A1.6,1.6,0,0,0,15.1,14.3ZM12,17.2,9.3,14.5a.2.2,0,0,1,0-.3l2.8-2.8a.2.2,0,0,1,.3,0l2.8,2.8a.2.2,0,0,1,0,.3ZM22.2,8.6l-3-5.2A1.6,1.6,0,0,0,17.7,2.8H6.3a1.6,1.6,0,0,0-1.5.6L1.8,8.6a1.6,1.6,0,0,0,0,1.6l3,5.2a1.6,1.6,0,0,0,1.5.6H17.7a1.6,1.6,0,0,0,1.5-.6l3-5.2A1.6,1.6,0,0,0,22.2,8.6ZM20.8,9.7,18,14.5a.2.2,0,0,1-.2.1H6.3a.2.2,0,0,1-.2-.1L3.2,9.7a.2.2,0,0,1,0-.3L6.1,4.2a.2.2,0,0,1,.2-.1H17.7a.2.2,0,0,1,.2.1l2.8,5.2A.2.2,0,0,1,20.8,9.7Z"/></svg>
                             <span className="text-sm font-semibold">{t('downloadAndroid')}</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};
