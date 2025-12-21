import React, { useState, useEffect, useRef } from 'react';
import { ConnectionStatus, VPNProtocol } from '../types';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip, XAxis, TooltipProps } from 'recharts';
import { useLocalization, useAppContext } from '../contexts/LocalizationContext';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

const generateInitialData = () => Array.from({ length: 30 }, (_, i) => ({ time: i, down: 0, up: 0 }));

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const downValue = payload.find((p: any) => p.dataKey === 'down')?.value;
    const upValue = payload.find((p: any) => p.dataKey === 'up')?.value;
    return (
      <div className="glass p-2 rounded-md text-xs border-slate-700">
        <p className="text-cyan-400">{`Download: ${typeof downValue === 'number' ? downValue.toFixed(2) : '0.00'} MB/s`}</p>
        <p className="text-indigo-400">{`Upload: ${typeof upValue === 'number' ? upValue.toFixed(2) : '0.00'} MB/s`}</p>
      </div>
    );
  }
  return null;
};


export const Dashboard: React.FC = () => {
  const { status, user, currentServer, toggleConnection, config, updateConfig } = useAppContext();
  const { t } = useLocalization();
  const CONNECTING_MESSAGES = t('connectingMessages');
  
  const isConnected = status === ConnectionStatus.CONNECTED;
  const isConnecting = status === ConnectionStatus.CONNECTING;
  
  const [messageIndex, setMessageIndex] = useState(0);
  const [chartData, setChartData] = useState(generateInitialData());
  const trafficRef = useRef({ down: 0, up: 0 });

  const cycleProtocol = () => {
    const protocols: VPNProtocol[] = [VPNProtocol.WIREGUARD, VPNProtocol.OPENVPN, VPNProtocol.IKEV2];
    const currentIndex = protocols.indexOf(config.protocol);
    const nextIndex = (currentIndex + 1) % protocols.length;
    updateConfig('protocol', protocols[nextIndex]);
  };

  useEffect(() => {
    let messageInterval: number;
    if (isConnecting) {
      messageInterval = window.setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % CONNECTING_MESSAGES.length);
      }, 2000);
    } else {
      setMessageIndex(0);
    }
    return () => clearInterval(messageInterval);
  }, [isConnecting, CONNECTING_MESSAGES.length]);

  useEffect(() => {
    let trafficInterval: number;
    if (isConnected) {
      trafficInterval = window.setInterval(() => {
        const newDown = Math.max(0, trafficRef.current.down + (Math.random() - 0.5) * 5);
        const newUp = Math.max(0, trafficRef.current.up + (Math.random() - 0.5) * 2);
        
        trafficRef.current = { down: newDown, up: newUp };

        setChartData(prevData => {
            const newData = [...prevData.slice(1), { time: prevData.length, down: newDown, up: newUp }];
            return newData;
        });
      }, 1000);
    } else {
      trafficRef.current = { down: 0, up: 0 };
      const zeroingInterval = setInterval(() => {
        setChartData(prev => {
          const lastPoint = prev[prev.length - 1];
          if (lastPoint.down < 0.1 && lastPoint.up < 0.1) {
            clearInterval(zeroingInterval);
            return generateInitialData();
          }
          return [...prev.slice(1), { time: prev.length, down: lastPoint.down * 0.8, up: lastPoint.up * 0.8 }];
        });
      }, 100);
      return () => clearInterval(zeroingInterval);
    }
    return () => clearInterval(trafficInterval);
  }, [isConnected]);

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
        {isConnected && <div className="absolute inset-0 bg-cyan-500/5 animate-pulse-slow pointer-events-none" />}
        {isConnecting && <div className="absolute inset-0 bg-yellow-500/5 animate-pulse-slow pointer-events-none" />}
        
        <div className="relative mb-4">
          <button
            onClick={toggleConnection}
            disabled={isConnecting}
            className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 flex items-center justify-center transition-all duration-500 transform hover:scale-105 active:scale-95 z-10 relative ${
              isConnected 
                ? 'border-cyan-500 bg-cyan-500/10 animate-pulse-fast' 
                : isConnecting 
                  ? 'border-yellow-500/50 bg-yellow-500/5 animate-pulse-slow shadow-[0_0_30px_rgba(234,179,8,0.2)]' 
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-500 shadow-none'
            }`}
          >
            <svg 
              className={`w-10 h-10 sm:w-12 sm:h-12 transition-colors ${isConnected ? 'text-cyan-400' : isConnecting ? 'text-yellow-400' : 'text-slate-500'}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
          
          {isConnecting && (
            <div className="absolute -inset-4 border-2 border-cyan-500/30 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        <h2 className={`text-xl sm:text-2xl font-bold mb-1 ${isConnecting ? 'text-yellow-400' : ''}`}>
          {isConnecting ? t('statusConnecting') : isConnected ? t('statusConnected') : t('statusUnprotected')}
        </h2>
        
        <div className="h-6 flex items-center justify-center mb-4">
          {isConnecting ? (
            <div className="flex flex-col items-center">
              <span key={messageIndex} className="text-xs text-yellow-500/80 uppercase tracking-widest font-black animate-in fade-in slide-in-from-bottom-1 duration-500">
                {CONNECTING_MESSAGES[messageIndex]}
              </span>
            </div>
          ) : (
            <p className="text-slate-400 max-w-xs mx-auto text-sm leading-tight">
              {isConnected 
                ? (config.adaptiveRouting ? t('connectedSubtitleAdaptive') : t('connectedSubtitle', { city: currentServer.city.replace(' (Optimized)', '') }))
                : t('disconnectedSubtitle')}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          <div className="bg-slate-900/50 rounded-2xl p-3 sm:p-4 border border-white/5">
            <span className="block text-[10px] sm:text-xs uppercase tracking-widest text-slate-500 mb-1 font-bold">{t('publicIP')}</span>
            <span className="mono text-xs sm:text-sm font-medium">{isConnected ? user.virtualIP : user.realIP}</span>
          </div>
          <div className="bg-slate-900/50 rounded-2xl p-3 sm:p-4 border border-white/5">
            <span className="block text-[10px] sm:text-xs uppercase tracking-widest text-slate-500 mb-1 font-bold">{t('security')}</span>
            <span className={`text-xs sm:text-sm font-black ${isConnected ? 'text-cyan-400' : isConnecting ? 'text-yellow-400' : 'text-slate-400'}`}>
              {isConnected ? t('encrypted') : isConnecting ? t('shielding') : t('exposed')}
            </span>
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl p-6">
        <h3 className="font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            {t('quickAccess')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {/* Ghost Mode */}
            <button 
                onClick={() => updateConfig('ghostMode', !config.ghostMode)}
                className={`group relative overflow-hidden rounded-xl p-4 transition-all duration-300 border ${config.ghostMode ? 'bg-cyan-500/10 border-cyan-500/50' : 'bg-slate-900/50 border-white/5 hover:bg-white/5 hover:border-white/10'}`}
            >
                <div className={`absolute top-0 right-0 p-2 opacity-50 transition-opacity ${config.ghostMode ? 'opacity-100' : 'group-hover:opacity-100'}`}>
                    <div className={`w-2 h-2 rounded-full ${config.ghostMode ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'bg-slate-700'}`}></div>
                </div>
                <div className={`mb-2 ${config.ghostMode ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </div>
                <div className="text-left">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">{t('stealthProtocolTitle').split(':')[0]}</div>
                    <div className={`text-xs font-bold ${config.ghostMode ? 'text-cyan-100' : 'text-slate-400 group-hover:text-slate-300'}`}>{config.ghostMode ? 'Active' : 'Disabled'}</div>
                </div>
            </button>

            {/* Kill Switch */}
            <button 
                onClick={() => updateConfig('killSwitch', !config.killSwitch)}
                className={`group relative overflow-hidden rounded-xl p-4 transition-all duration-300 border ${config.killSwitch ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-slate-900/50 border-white/5 hover:bg-white/5 hover:border-white/10'}`}
            >
                <div className={`absolute top-0 right-0 p-2 opacity-50 transition-opacity ${config.killSwitch ? 'opacity-100' : 'group-hover:opacity-100'}`}>
                    <div className={`w-2 h-2 rounded-full ${config.killSwitch ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-slate-700'}`}></div>
                </div>
                <div className={`mb-2 ${config.killSwitch ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <div className="text-left">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Kill Switch</div>
                    <div className={`text-xs font-bold ${config.killSwitch ? 'text-emerald-100' : 'text-slate-400 group-hover:text-slate-300'}`}>{config.killSwitch ? 'Engaged' : 'Off'}</div>
                </div>
            </button>

            {/* Ad Blocker */}
            <button 
                onClick={() => updateConfig('adBlocker', !config.adBlocker)}
                className={`group relative overflow-hidden rounded-xl p-4 transition-all duration-300 border ${config.adBlocker ? 'bg-rose-500/10 border-rose-500/50' : 'bg-slate-900/50 border-white/5 hover:bg-white/5 hover:border-white/10'}`}
            >
                <div className={`absolute top-0 right-0 p-2 opacity-50 transition-opacity ${config.adBlocker ? 'opacity-100' : 'group-hover:opacity-100'}`}>
                    <div className={`w-2 h-2 rounded-full ${config.adBlocker ? 'bg-rose-400 shadow-[0_0_10px_#fb7185]' : 'bg-slate-700'}`}></div>
                </div>
                <div className={`mb-2 ${config.adBlocker ? 'text-rose-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <div className="text-left">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">{t('adBlockerLabel').split(' & ')[0]}</div>
                    <div className={`text-xs font-bold ${config.adBlocker ? 'text-rose-100' : 'text-slate-400 group-hover:text-slate-300'}`}>{config.adBlocker ? 'Active' : 'Disabled'}</div>
                </div>
            </button>
            
            {/* Malware Shield */}
            <button 
                onClick={() => updateConfig('malwareShield', !config.malwareShield)}
                className={`group relative overflow-hidden rounded-xl p-4 transition-all duration-300 border ${config.malwareShield ? 'bg-orange-500/10 border-orange-500/50' : 'bg-slate-900/50 border-white/5 hover:bg-white/5 hover:border-white/10'}`}
            >
                <div className={`absolute top-0 right-0 p-2 opacity-50 transition-opacity ${config.malwareShield ? 'opacity-100' : 'group-hover:opacity-100'}`}>
                    <div className={`w-2 h-2 rounded-full ${config.malwareShield ? 'bg-orange-400 shadow-[0_0_10px_#fb923c]' : 'bg-slate-700'}`}></div>
                </div>
                <div className={`mb-2 ${config.malwareShield ? 'text-orange-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <div className="text-left">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">{t('malwareShieldLabel')}</div>
                    <div className={`text-xs font-bold ${config.malwareShield ? 'text-orange-100' : 'text-slate-400 group-hover:text-slate-300'}`}>{config.malwareShield ? 'Active' : 'Disabled'}</div>
                </div>
            </button>

            {/* Anti-DPI */}
            <button 
                onClick={() => updateConfig('antiDPIEngine', !config.antiDPIEngine)}
                className={`group relative overflow-hidden rounded-xl p-4 transition-all duration-300 border ${config.antiDPIEngine ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-slate-900/50 border-white/5 hover:bg-white/5 hover:border-white/10'}`}
            >
                <div className={`absolute top-0 right-0 p-2 opacity-50 transition-opacity ${config.antiDPIEngine ? 'opacity-100' : 'group-hover:opacity-100'}`}>
                    <div className={`w-2 h-2 rounded-full ${config.antiDPIEngine ? 'bg-indigo-400 shadow-[0_0_10px_#818cf8]' : 'bg-slate-700'}`}></div>
                </div>
                <div className={`mb-2 ${config.antiDPIEngine ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                </div>
                <div className="text-left">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Anti-DPI</div>
                    <div className={`text-xs font-bold ${config.antiDPIEngine ? 'text-indigo-100' : 'text-slate-400 group-hover:text-slate-300'}`}>{config.antiDPIEngine ? 'Filtering' : 'Disabled'}</div>
                </div>
            </button>
            
            {/* Protocol */}
            <button 
                onClick={cycleProtocol}
                className={`group relative overflow-hidden rounded-xl p-4 transition-all duration-300 border bg-slate-900/50 border-white/5 hover:bg-white/5 hover:border-white/10`}
            >
                <div className={`absolute top-0 right-0 p-2 opacity-100`}>
                    <div className={`w-2 h-2 rounded-full bg-slate-700 group-hover:bg-cyan-400`}></div>
                </div>
                <div className={`mb-2 text-slate-400 group-hover:text-slate-200`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                </div>
                <div className="text-left">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">{t('protocol')}</div>
                    <div className={`text-xs font-bold text-slate-300 group-hover:text-cyan-400`}>{config.protocol}</div>
                </div>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-300">{t('trafficAnalysis')}</h3>
            <div className="flex gap-2 text-[10px] uppercase font-bold">
              <span className="text-cyan-500">{t('down')}: {trafficRef.current.down.toFixed(1)} MB/s</span>
              <span className="text-indigo-400">{t('up')}: {trafficRef.current.up.toFixed(1)} MB/s</span>
            </div>
          </div>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <YAxis domain={[0, 'dataMax + 10']} hide />
                <XAxis dataKey="time" hide />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="down" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#colorDown)" animationDuration={300} />
                <Area type="monotone" dataKey="up" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorUp)" animationDuration={300} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
         <div className="glass rounded-3xl p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                 <h3 className="font-semibold text-slate-300 mb-4">{t('currentEndpoint')}</h3>
                {config.adaptiveRouting && isConnected && (
                  <div className="flex items-center gap-2 text-cyan-400 -mt-2 mb-3">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                    <span className="text-[10px] font-bold uppercase tracking-wider">{t('adaptiveRoutingActive')}</span>
                  </div>
                )}
              </div>
               <div className="text-right flex-shrink-0">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{t('latency')}</div>
                <div className="text-cyan-400 mono font-bold">{currentServer.latency}ms</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-3xl filter grayscale-[0.2]">{currentServer.flag}</div>
              <div>
                <div className="font-bold flex items-center gap-2">
                  {currentServer.city.replace(' (Optimized)', '')}
                  {currentServer.tier === 'optimized' && (
                    <svg className="w-4 h-4 text-cyan-400 fill-current" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279L12 19.449l-7.416 4.02L6.064 15.134 0 9.306l8.332-1.151L12 .587z"/></svg>
                  )}
                </div>
                <div className="text-sm text-slate-500">{t(currentServer.country)}</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500 uppercase font-black tracking-widest">
              <span>{t('tunnel')}: <b className="text-slate-300">{config.protocol}</b></span>
              {currentServer.tier === 'optimized' && (
                  <span className="text-gradient font-black text-xs">OPTIMIZED</span>
              )}
              <span>{t('load')}: <b className={currentServer.load > 75 ? 'text-rose-400' : currentServer.load > 40 ? 'text-amber-400' : 'text-emerald-400'}>{currentServer.load}%</b></span>
            </div>
        </div>
      </div>
    </div>
  );
};