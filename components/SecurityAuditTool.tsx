import React, { useMemo } from 'react';
import { ConnectionStatus, VPNConfig, DNSProvider } from '../types';
import { useLocalization, useAppContext } from '../contexts/LocalizationContext';

const AUDIT_ITEMS = [
  { id: 'connection', labelKey: 'auditTunnel' },
  { id: 'dns', labelKey: 'auditDNS' },
  { id: 'killSwitch', labelKey: 'auditKillswitch' },
  { id: 'threatShield', labelKey: 'auditThreat' },
  { id: 'phishing', labelKey: 'auditPhishing'},
  { id: 'dpi', labelKey: 'auditDPI' },
  { id: 'ghostMode', labelKey: 'auditGhost' },
];

const calculatePrivacyScore = (status: ConnectionStatus, config: VPNConfig): { score: number; grade: string; color: string } => {
  let score = 0;
  if (status === ConnectionStatus.CONNECTED) {
    score += 25; // Base score for connection
    
    // Core Engine
    if (config.killSwitch) score += 5;
    if (config.secureCoreRouting) score += 3;
    if (config.onionOverVPN) score += 2;
    
    // Stealth Protocol
    if (config.ghostMode) score += 5; // Master toggle bonus
    if (config.dynamicMAC) score += 2;
    if (config.scramble) score += 2;
    if (config.multiHop) score += 3;
    if (config.dynamicIPRotation) score += 2;
    if (config.portScrambling) score += 2;
    if (config.antiDPIEngine) score += 5;
    if (config.decoyTrafficGenerator) score += 1;

    // Threat Shield
    if (config.adBlocker) score += 3;
    if (config.malwareShield) score += 4;
    if (config.phishingShield) score += 5;
    if (config.antiRansomwareEngine) score += 3;
    if (config.spywareBlocker) score += 3;
    if (config.iotDeviceProtection) score += 2;

    // Network & DNS
    if (config.dnsProvider !== DNSProvider.SYSTEM) score += 5;
    if (config.quantumResistantEncryption) score += 2;

    // Device Armor
    if (config.hardwareFingerprintScrambler) score += 2;
    if (config.cameraMicGuard) score += 2;
    if (config.usbDeviceGuard) score += 1;
    if (config.firmwareIntegrityMonitor) score += 1;
  }
  
  const finalScore = Math.min(100, Math.round(score));
  let grade = 'F';
  let color = 'text-rose-500';

  if (finalScore >= 95) { grade = 'A+'; color = 'text-cyan-400'; }
  else if (finalScore >= 90) { grade = 'A'; color = 'text-emerald-400'; }
  else if (finalScore >= 80) { grade = 'B'; color = 'text-lime-400'; }
  else if (finalScore >= 70) { grade = 'C'; color = 'text-yellow-400'; }
  else if (finalScore >= 60) { grade = 'D'; color = 'text-orange-500'; }

  return { score: finalScore, grade, color };
};

export const PrivacyDashboard: React.FC = () => {
  const { status, config } = useAppContext();
  const { t } = useLocalization();
  const { score, grade, color } = useMemo(() => calculatePrivacyScore(status, config), [status, config]);

  const isConnected = status === ConnectionStatus.CONNECTED;

  const getAuditItemStatus = (id: string) => {
    if (!isConnected && id !== 'killSwitch') return { icon: '✕', color: 'text-rose-500' };
    
    switch (id) {
      case 'connection': return { icon: '✓', color: 'text-emerald-400' };
      case 'killSwitch': return config.killSwitch ? { icon: '✓', color: 'text-emerald-400' } : { icon: '⚠', color: 'text-amber-400' };
      case 'ghostMode': return config.ghostMode ? { icon: '✓', color: 'text-emerald-400' } : { icon: '○', color: 'text-slate-500' };
      case 'threatShield': return config.adBlocker || config.malwareShield ? { icon: '✓', color: 'text-emerald-400' } : { icon: '○', color: 'text-slate-500' };
      case 'dns': return config.dnsProvider !== DNSProvider.SYSTEM ? { icon: '✓', color: 'text-emerald-400' } : { icon: '⚠', color: 'text-amber-400' };
      case 'phishing': return config.phishingShield ? { icon: '✓', color: 'text-emerald-400' } : { icon: '○', color: 'text-slate-500' };
      case 'dpi': return config.antiDPIEngine ? { icon: '✓', color: 'text-emerald-400' } : { icon: '○', color: 'text-slate-500' };
      default: return { icon: '○', color: 'text-slate-500' };
    }
  };

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="glass rounded-3xl p-6 overflow-hidden relative flex flex-col h-full border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.05)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-black text-xs uppercase tracking-[0.2em] text-cyan-400">{t('privacyDashboardTitle')}</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{t('privacyDashboardSubtitle')}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r={radius} strokeWidth="8" className="stroke-slate-800" fill="none" />
            <circle
              cx="70" cy="70" r={radius} strokeWidth="8"
              className={`transition-all duration-1000 ease-out ${color.replace('text-', 'stroke-')}`} fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 70 70)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-5xl font-black ${color}`}>{grade}</span>
            <span className="text-xs font-bold text-slate-500">{score} / 100</span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-white/5 space-y-2">
         {AUDIT_ITEMS.map(item => {
            const { icon, color } = getAuditItemStatus(item.id);
            return (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">{t(item.labelKey)}</span>
                <div className="flex items-center gap-2">
                  <span className={`mono font-bold ${color}`}>{icon}</span>
                </div>
              </div>
            );
         })}
      </div>
    </div>
  );
};
