import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { ServerSelector } from './components/ServerSelector';
import { PrivacyDashboard } from './components/SecurityAuditTool';
import { ControlPanel } from './components/ControlPanel';
import { ConnectionStatus } from './types';
import { SERVERS } from './constants';
import { useLocalization } from './contexts/LocalizationContext';
import { useAppContext } from './contexts/LocalizationContext';
import { RealtimeThreatMap } from './components/intel/RealtimeThreatMap';
import { PacketFlowVisualizer } from './components/intel/PacketFlowVisualizer';
import { ConnectionLogManager } from './components/intel/ConnectionLogManager';
import { ProfileView } from './components/ProfileView';
import { Toast, ToastData } from './components/ui/Toast';

type View = 'dashboard' | 'servers' | 'settings';
export type IntelView = 'threatMap' | 'packetVisualizer' | 'logManager' | 'warrantCanary';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [toasts, setToasts] = useState<ToastData[]>([]); // Toast state remains local to App
  const { language, setLanguage, t, supportedLanguages } = useLocalization();
  const { 
    status, user, config, currentServer, level, xp, xpForNextLevel, unlockedBadgeIds, xpGains,
    activeIntelView, setActiveIntelView, isProfileVisible, showProfile, hideProfile, 
    neutralizeThreat, logs, clearLogs, updateConfig, selectServer
  } = useAppContext();

  // Auto-routing logic remains an effect within App
  useEffect(() => {
    let intervalId: number | undefined;
    if (config.adaptiveRouting && status === ConnectionStatus.CONNECTED) {
      intervalId = window.setInterval(() => {
        // This logic could also be in a service, but is fine here for now
        const fastestServer = [...SERVERS].sort((a, b) => a.latency - b.latency)[0];
        if (fastestServer && fastestServer.id !== currentServer.id) {
            selectServer(fastestServer, true);
        }
      }, 30000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [config.adaptiveRouting, status, currentServer.id, selectServer]);
  
  const NavButton: React.FC<{view: View, label: string, icon: React.ReactElement}> = ({ view, label, icon }) => (
    <button onClick={() => setActiveView(view)} className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-4 py-2 rounded-lg transition-colors text-xs font-bold ${activeView === view ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:bg-slate-800'}`}>
      {icon}
      <span>{label}</span>
    </button>
  );

  const renderIntelView = () => {
    if (!activeIntelView) return null;
    const commonProps = { onClose: () => setActiveIntelView(null) };
    switch (activeIntelView) {
      case 'threatMap': return <RealtimeThreatMap {...commonProps} onNeutralize={neutralizeThreat} userLocation={user.location} />;
      case 'packetVisualizer': return <PacketFlowVisualizer {...commonProps} />;
      case 'logManager': return <ConnectionLogManager {...commonProps} logs={logs} setLogs={() => {}} clearLogs={clearLogs} config={config} updateConfig={updateConfig} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto flex flex-col">
       {renderIntelView()}
       {isProfileVisible && <ProfileView onClose={hideProfile} level={level} xp={xp} xpForNextLevel={xpForNextLevel} unlockedBadgeIds={unlockedBadgeIds} />}
       <div className={activeIntelView || isProfileVisible ? 'blur-sm pointer-events-none' : ''}>
          <header className="glass rounded-2xl flex items-center justify-between mb-8 px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center glow-cyan border border-cyan-500/30">
                 <svg className="w-6 h-6 text-cyan-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 12.0001L9 17.0001L19 7.00006" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M14.5 7.00006C14.5 7.00006 16.5 12.0001 12.5 17.0001C8.5 22.0001 4 17.0001 4 17.0001" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div className="flex items-center gap-3">
                 <div className="relative flex h-3 w-3"><span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status === ConnectionStatus.CONNECTED ? 'bg-cyan-400' : status === ConnectionStatus.CONNECTING ? 'bg-yellow-400' : 'bg-rose-500/80'}`}></span><span className={`relative inline-flex rounded-full h-3 w-3 ${status === ConnectionStatus.CONNECTED ? 'bg-cyan-500' : status === ConnectionStatus.CONNECTING ? 'bg-yellow-500' : 'bg-rose-500'}`}></span></div>
                <div><h1 className="text-lg font-black tracking-tighter text-gradient uppercase leading-none">FLYVPN</h1><p className="text-[9px] text-slate-500 tracking-[0.2em] font-bold uppercase mt-1">{t('appSubtitle')}</p></div>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-2 glass rounded-lg p-1">
              <NavButton view="dashboard" label={t('navDashboard')} icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
              <NavButton view="servers" label={t('navServers')} icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.7 17.3l.426 1.422a2 2 0 001.97 1.423h2.798a2 2 0 001.97-1.423l.426-1.422M6 11V3a3 3 0 013-3h6a3 3 0 013 3v8" /></svg>} />
              <NavButton view="settings" label={t('navSettings')} icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
            </div>
            <div className="flex items-center gap-4">
                <div className="relative" onClick={showProfile}>
                    <div className="flex flex-col items-end cursor-pointer">
                        <span className="text-xs font-bold text-slate-300">Level {level}</span>
                        <div className="w-24 bg-slate-700 rounded-full h-1.5 mt-1"><div className="bg-cyan-400 h-1.5 rounded-full" style={{width: `${(xp/xpForNextLevel)*100}%`}}></div></div>
                    </div>
                     <div className="absolute top-0 right-0 -mt-4">
                        {xpGains.map(gain => (
                            <span key={gain.id} className="absolute right-0 text-cyan-400 font-bold text-sm animate-xp-gain">+{gain.amount} XP</span>
                        ))}
                    </div>
                </div>
              <select value={language} onChange={e => setLanguage(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-cyan-500">
                {Object.keys(supportedLanguages).map(langCode => (<option key={langCode} value={langCode}>{supportedLanguages[langCode].name}</option>))}
              </select>
            </div>
          </header>
          <main className="flex-1 mb-16 lg:mb-0">
            {activeView === 'dashboard' && <div className="grid grid-cols-1 lg:grid-cols-12 gap-8"><div className="lg:col-span-8"><Dashboard /></div><div className="lg:col-span-4"><PrivacyDashboard /></div></div>}
            {activeView === 'servers' && <ServerSelector />}
            {activeView === 'settings' && <ControlPanel />}
          </main>
          <footer className="fixed bottom-0 left-0 right-0 lg:hidden p-2 glass border-t border-white/10 z-50">
            <div className="flex items-center justify-around">
               <NavButton view="dashboard" label={t('navDashboard')} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
               <NavButton view="servers" label={t('navServers')} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.7 17.3l.426 1.422a2 2 0 001.97 1.423h2.798a2 2 0 001.97-1.423l.426-1.422M6 11V3a3 3 0 013-3h6a3 3 0 013 3v8" /></svg>} />
               <NavButton view="settings" label={t('navSettings')} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
            </div>
          </footer>
        </div>
         <div aria-live="assertive" className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-[100]">
            <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
                {toasts.map(toast => <Toast key={toast.id} toast={toast} onDismiss={() => setToasts(p => p.filter(t => t.id !== toast.id))} />)}
            </div>
          </div>
    </div>
  );
};

export default App;