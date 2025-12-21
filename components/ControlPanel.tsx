import React, { useState } from 'react';
import { VPNConfig, VPNProtocol, DNSProvider } from '../types';
import { Toggle } from './ui/Toggle';
import { useLocalization, useAppContext } from '../contexts/LocalizationContext';
import { IntelView } from '../App';

type SettingsView = 'core' | 'stealth' | 'threat' | 'network' | 'device' | 'intel' | 'system';

const WarrantCanaryModal: React.FC<{ onClose: () => void; }> = ({ onClose }) => {
  const { t, language } = useLocalization();
  const today = new Date().toLocaleDateString(language, { year: 'numeric', month: 'long', day: 'numeric' });
  const content = {
      title: t('warrantCanaryTitle'),
      body: t('warrantCanaryText', { date: today })
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass rounded-2xl max-w-lg w-full p-6 border-cyan-500/20 animate-in fade-in-50 zoom-in-95" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-cyan-400 mb-4">{content.title}</h3>
        <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{content.body}</p>
        <button onClick={onClose} className="mt-6 bg-slate-700/50 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors w-full">Close</button>
      </div>
    </div>
  );
};


// --- Sub-Panels for each category ---

const CoreEnginePanel: React.FC<{ config: VPNConfig; updateConfig: (k: keyof VPNConfig, v: any) => void; }> = ({ config, updateConfig }) => {
    const { t } = useLocalization();
    return (
      <div className="glass rounded-3xl p-6">
        <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-2">{t('coreEngineTitle')}</h3>
        <div className="space-y-1 divide-y divide-white/5">
          <Toggle enabled={config.killSwitch} onChange={(v) => updateConfig('killSwitch', v)} label={t('killSwitchLabel')} description={t('killSwitchDescription')} />
          <Toggle enabled={config.splitTunneling} onChange={(v) => updateConfig('splitTunneling', v)} label={t('splitTunnelingLabel')} description={t('splitTunnelingDescription')} />
          <Toggle enabled={config.onionOverVPN} onChange={(v) => updateConfig('onionOverVPN', v)} label={t('onionOverVPNLabel')} description={t('onionOverVPNDescription')} />
          <Toggle enabled={config.secureCoreRouting} onChange={(v) => updateConfig('secureCoreRouting', v)} label={t('secureCoreRoutingLabel')} description={t('secureCoreRoutingDescription')} />
          <Toggle enabled={config.dedicatedIP} onChange={(v) => updateConfig('dedicatedIP', v)} label={t('dedicatedIPLabel')} description={t('dedicatedIPDescription')} />
        </div>
      </div>
    );
};

const StealthPanel: React.FC<{ config: VPNConfig; updateConfig: (k: keyof VPNConfig, v: any) => void; }> = ({ config, updateConfig }) => {
  const { t } = useLocalization();
  const handleStealthToggle = (enabled: boolean) => {
    updateConfig('ghostMode', enabled);
    updateConfig('dynamicMAC', enabled);
    updateConfig('scramble', enabled);
    updateConfig('multiHop', enabled);
    updateConfig('dynamicIPRotation', enabled);
    updateConfig('portScrambling', enabled);
    updateConfig('antiDPIEngine', enabled);
    updateConfig('decoyTrafficGenerator', enabled);
  };
  return (
    <div className="glass rounded-3xl p-6">
      <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-2">{t('stealthProtocolTitle')}</h3>
      <div className="space-y-1 divide-y divide-white/5">
        <Toggle enabled={config.ghostMode} onChange={handleStealthToggle} label={t('stealthProtocolLabel')} description={t('stealthProtocolDescription')} />
        <div className={`pl-4 border-l-2 ${config.ghostMode ? 'border-cyan-500/30' : 'border-slate-800'} transition-all divide-y divide-white/5`}>
            <Toggle enabled={config.multiHop} onChange={(v) => updateConfig('multiHop', v)} label={t('multiHopLabel')} description={t('multiHopDescription')} />
            <Toggle enabled={config.scramble} onChange={(v) => updateConfig('scramble', v)} label={t('scrambleLabel')} description={t('scrambleDescription')} />
            <Toggle enabled={config.dynamicMAC} onChange={(v) => updateConfig('dynamicMAC', v)} label={t('dynamicMACLabel')} description={t('dynamicMACDescription')} />
            <Toggle enabled={config.dynamicIPRotation} onChange={(v) => updateConfig('dynamicIPRotation', v)} label={t('dynamicIPRotationLabel')} description={t('dynamicIPRotationDescription')} />
            <Toggle enabled={config.portScrambling} onChange={(v) => updateConfig('portScrambling', v)} label={t('portScramblingLabel')} description={t('portScramblingDescription')} />
            <Toggle enabled={config.antiDPIEngine} onChange={(v) => updateConfig('antiDPIEngine', v)} label={t('antiDPIEngineLabel')} description={t('antiDPIEngineDescription')} />
            <Toggle enabled={config.decoyTrafficGenerator} onChange={(v) => updateConfig('decoyTrafficGenerator', v)} label={t('decoyTrafficGeneratorLabel')} description={t('decoyTrafficGeneratorDescription')} />
        </div>
      </div>
    </div>
  );
};

const ThreatShieldPanel: React.FC<{ config: VPNConfig; updateConfig: (k: keyof VPNConfig, v: any) => void; }> = ({ config, updateConfig }) => {
    const { t } = useLocalization();
    return (
        <div className="glass rounded-3xl p-6">
            <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-2">{t('threatShieldTitle')}</h3>
            <div className="space-y-1 divide-y divide-white/5">
                <Toggle enabled={config.adBlocker} onChange={(v) => updateConfig('adBlocker', v)} label={t('adBlockerLabel')} description={t('adBlockerDescription')} />
                <Toggle enabled={config.malwareShield} onChange={(v) => updateConfig('malwareShield', v)} label={t('malwareShieldLabel')} description={t('malwareShieldDescription')} />
                <Toggle enabled={config.phishingShield} onChange={(v) => updateConfig('phishingShield', v)} label={t('phishingShieldLabel')} description={t('phishingShieldDescription')} />
                <Toggle enabled={config.spywareBlocker} onChange={(v) => updateConfig('spywareBlocker', v)} label={t('spywareBlockerLabel')} description={t('spywareBlockerDescription')} />
                <Toggle enabled={config.antiRansomwareEngine} onChange={(v) => updateConfig('antiRansomwareEngine', v)} label={t('antiRansomwareEngineLabel')} description={t('antiRansomwareEngineDescription')} />
                <Toggle enabled={config.iotDeviceProtection} onChange={(v) => updateConfig('iotDeviceProtection', v)} label={t('iotDeviceProtectionLabel')} description={t('iotDeviceProtectionDescription')} />
            </div>
        </div>
    );
};

const NetworkFabricPanel: React.FC<{ config: VPNConfig; updateConfig: (k: keyof VPNConfig, v: any) => void; }> = ({ config, updateConfig }) => {
    const { t } = useLocalization();
    const protocolInfo = {
        [VPNProtocol.WIREGUARD]: { descKey: 'protocolWireguardDesc' },
        [VPNProtocol.OPENVPN]: { descKey: 'protocolOpenVPNDesc' },
        [VPNProtocol.IKEV2]: { descKey: 'protocolIKEv2Desc' },
    };
    return (
        <div className="glass rounded-3xl p-6 space-y-6">
            <div>
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-2">{t('networkFabricTitle')}</h3>
                <div className="divide-y divide-white/5">
                    <Toggle enabled={config.adaptiveRouting} onChange={(v) => updateConfig('adaptiveRouting', v)} label={t('adaptiveRoutingLabel')} description={t('adaptiveRoutingDescription')} />
                    <Toggle enabled={config.quantumResistantEncryption} onChange={(v) => updateConfig('quantumResistantEncryption', v)} label={t('quantumResistantEncryptionLabel')} description={t('quantumResistantEncryptionDescription')} />
                    <Toggle enabled={config.packetPrioritizationQoS} onChange={(v) => updateConfig('packetPrioritizationQoS', v)} label={t('packetPrioritizationQoSLabel')} description={t('packetPrioritizationQoSDescription')} />
                    <Toggle enabled={config.jitterReduction} onChange={(v) => updateConfig('jitterReduction', v)} label={t('jitterReductionLabel')} description={t('jitterReductionDescription')} />
                    <Toggle enabled={config.advancedPortForwarding} onChange={(v) => updateConfig('advancedPortForwarding', v)} label={t('advancedPortForwardingLabel')} description={t('advancedPortForwardingDescription')} />
                </div>
            </div>
             <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="space-y-1">
                    <label className="text-xs uppercase font-bold text-slate-400">{t('protocol')}</label>
                     <div className="grid grid-cols-3 gap-2 text-center">
                        {(Object.keys(protocolInfo) as VPNProtocol[]).map((p) => (
                            <div key={p}>
                                <button
                                    onClick={() => updateConfig('protocol', p)}
                                    className={`w-full py-2 rounded-lg border text-[10px] font-black uppercase tracking-tighter transition-all ${config.protocol === p ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' : 'bg-slate-900/50 border-white/5 text-slate-500 hover:border-white/10'}`}
                                >
                                    {p}
                                </button>
                                <p className="text-[10px] text-slate-500 mt-1 px-1 h-8">{t(protocolInfo[p].descKey)}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs uppercase font-bold text-slate-400">{t('dnsProvider')}</label>
                    <select value={config.dnsProvider} onChange={(e) => updateConfig('dnsProvider', e.target.value as DNSProvider)} className="w-full bg-slate-900/50 border border-white/5 rounded-lg p-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500">{Object.values(DNSProvider).map(dns => (<option key={dns} value={dns}>{dns}</option>))}</select>
                </div>
                {config.dnsProvider === DNSProvider.CUSTOM && (<div className="space-y-1"><label className="text-xs uppercase font-bold text-slate-400">{t('customDNSAddress')}</label><input type="text" value={config.customDNS} onChange={(e) => updateConfig('customDNS', e.target.value)} className="w-full bg-slate-900/50 border border-white/5 rounded-lg px-3 py-2 text-sm mono focus:outline-none focus:border-cyan-500" placeholder="e.g., 1.1.1.1"/></div>)}
            </div>
        </div>
    );
};

const DeviceArmorPanel: React.FC<{ config: VPNConfig; updateConfig: (k: keyof VPNConfig, v: any) => void; }> = ({ config, updateConfig }) => {
    const { t } = useLocalization();
    return (
      <div className="glass rounded-3xl p-6">
        <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-2">{t('deviceArmorTitle')}</h3>
        <div className="space-y-1 divide-y divide-white/5">
          <Toggle enabled={config.hardwareFingerprintScrambler} onChange={(v) => updateConfig('hardwareFingerprintScrambler', v)} label={t('hardwareFingerprintScramblerLabel')} description={t('hardwareFingerprintScramblerDescription')} />
          <Toggle enabled={config.cameraMicGuard} onChange={(v) => updateConfig('cameraMicGuard', v)} label={t('cameraMicGuardLabel')} description={t('cameraMicGuardDescription')} />
          <Toggle enabled={config.usbDeviceGuard} onChange={(v) => updateConfig('usbDeviceGuard', v)} label={t('usbDeviceGuardLabel')} description={t('usbDeviceGuardDescription')} />
          <Toggle enabled={config.firmwareIntegrityMonitor} onChange={(v) => updateConfig('firmwareIntegrityMonitor', v)} label={t('firmwareIntegrityMonitorLabel')} description={t('firmwareIntegrityMonitorDescription')} />
          <Toggle enabled={config.geofenceProtection} onChange={(v) => updateConfig('geofenceProtection', v)} label={t('geofenceProtectionLabel')} description={t('geofenceProtectionDescription')} />
        </div>
      </div>
    );
};

const IntelCenterPanel: React.FC<{setActiveIntelView: (view: IntelView) => void}> = ({ setActiveIntelView }) => {
    const { t } = useLocalization();
    
    const intelItems = [
        { id: 'threatMap', labelKey: 'threatMapLabel', descKey: 'threatMapDescription' },
        { id: 'packetVisualizer', labelKey: 'packetVisualizerLabel', descKey: 'packetVisualizerDescription' },
        { id: 'logManager', labelKey: 'logManagerLabel', descKey: 'logManagerDescription' },
        { id: 'warrantCanary', labelKey: 'warrantCanaryLabel', descKey: 'warrantCanaryDescription' },
    ];

    return (
      <div className="glass rounded-3xl p-6">
        <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-4">{t('intelCenterTitle')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {intelItems.map(item => (
            <div key={item.id} className="bg-slate-900/50 border border-white/10 rounded-xl p-4 flex flex-col items-start">
                <h4 className="font-bold text-cyan-400 text-sm">{t(item.labelKey)}</h4>
                <p className="text-xs text-slate-400 flex-1 mt-1">{t(item.descKey)}</p>
                <button onClick={() => setActiveIntelView(item.id as IntelView)} className="mt-4 text-[10px] font-bold uppercase bg-slate-700/50 text-slate-300 px-3 py-1 rounded-md hover:bg-slate-700 transition-colors">View</button>
            </div>
          ))}
        </div>
      </div>
    );
};

const SystemPanel: React.FC = () => {
    const { t, language, setLanguage, supportedLanguages } = useLocalization();
    return (
        <div className="glass rounded-3xl p-6">
            <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-2">{t('systemSettingsTitle')}</h3>
            <div className="space-y-4 divide-y divide-white/5">
                <div className="flex items-center justify-between py-2">
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-200">{t('languageLabel')}</span>
                        <span className="text-xs text-slate-400">{t('languageDescription')}</span>
                    </div>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                        {Object.keys(supportedLanguages).map((langCode) => (
                            <option key={langCode} value={langCode}>
                                {supportedLanguages[langCode as keyof typeof supportedLanguages].name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};

export const ControlPanel: React.FC = () => {
  const { config, updateConfig, setActiveIntelView } = useAppContext();
  const [activeView, setActiveView] = useState<SettingsView>('intel');
  const [showWarrantCanary, setShowWarrantCanary] = useState(false);
  const { t } = useLocalization();

  const handleIntelView = (view: IntelView) => {
    if (view === 'warrantCanary') {
      setShowWarrantCanary(true);
    } else {
      setActiveIntelView(view);
    }
  };

  const SettingsButton: React.FC<{view: SettingsView, label: string}> = ({ view, label }) => (
    <button 
      onClick={() => setActiveView(view)}
      className={`px-3 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-md transition-colors ${activeView === view ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
    >
      {label}
    </button>
  );
  
  return (
    <>
      {showWarrantCanary && <WarrantCanaryModal onClose={() => setShowWarrantCanary(false)} />}
      <div className="space-y-8">
          <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-100">{t('cpTitle')}</h2>
              <p className="text-slate-400">{t('cpSubtitle')}</p>
          </div>
          <div className="flex justify-center">
              <div className="flex items-center gap-1 sm:gap-2 glass rounded-lg p-1 flex-wrap justify-center">
                  <SettingsButton view="core" label={t('cpCategoryCore')} />
                  <SettingsButton view="stealth" label={t('cpCategoryStealth')} />
                  <SettingsButton view="threat" label={t('cpCategoryThreat')} />
                  <SettingsButton view="network" label={t('cpCategoryNetwork')} />
                  <SettingsButton view="device" label={t('cpCategoryDevice')} />
                  <SettingsButton view="intel" label={t('cpCategoryIntel')} />
                  <SettingsButton view="system" label={t('cpCategorySystem')} />
              </div>
          </div>
          
          <div className="max-w-3xl mx-auto">
              {activeView === 'core' && <CoreEnginePanel config={config} updateConfig={updateConfig} />}
              {activeView === 'stealth' && <StealthPanel config={config} updateConfig={updateConfig} />}
              {activeView === 'threat' && <ThreatShieldPanel config={config} updateConfig={updateConfig} />}
              {activeView === 'network' && <NetworkFabricPanel config={config} updateConfig={updateConfig} />}
              {activeView === 'device' && <DeviceArmorPanel config={config} updateConfig={updateConfig} />}
              {activeView === 'intel' && <IntelCenterPanel setActiveIntelView={handleIntelView} />}
              {activeView === 'system' && <SystemPanel />}
          </div>
      </div>
    </>
  );
};