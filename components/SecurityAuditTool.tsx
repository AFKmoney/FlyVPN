import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ConnectionStatus, VPNConfig, DNSProvider } from '../types';
import { useLocalization, useAppContext } from '../contexts/LocalizationContext';
import { computePrivacyScore, PrivacyInputs, PrivacyResult } from '../services/privacyScoreService';
import { resolveOverHttps, checkWebRTCLeak, fetchRealIP, checkGeofence, WebRTCLeak, IPInfo, GeofenceReport } from '../services/networkService';
import { defense } from '../services/defenseService';
import { isFirewallArmed, armFirewall, disarmFirewall } from '../services/firewallService';

interface AuditCheck {
    id: string;
    labelKey: string;
    run: () => Promise<{ ok: boolean; detail: string }>;
}

export const PrivacyDashboard: React.FC = () => {
    const { status, config, user, currentServer } = useAppContext();
    const { t } = useLocalization();

    const [dnsRtt, setDnsRtt] = useState<number | undefined>(undefined);
    const [webrtc, setWebrtc] = useState<WebRTCLeak | null>(null);
    const [ipInfo, setIpInfo] = useState<IPInfo | null>(null);
    const [geofence, setGeofence] = useState<GeofenceReport | null>(null);
    const [defenseStats, setDefenseStats] = useState(defense.getStats());
    const [firewallArmed, setFirewallArmed] = useState(isFirewallArmed());
    const [hardwareFingerprint, setHardwareFingerprint] = useState<string>('unknown');
    const [auditChecks, setAuditChecks] = useState<Record<string, { ok: boolean; detail: string; ts: number }>>({});
    const [running, setRunning] = useState<string | null>(null);

    const isConnected = status === ConnectionStatus.CONNECTED;

    // Wire defense stats
    useEffect(() => defense.onStats(setDefenseStats), []);

    // Real DNS timing — re-run every 60s
    useEffect(() => {
        let cancelled = false;
        const measure = async () => {
            try {
                const r = await resolveOverHttps('cloudflare.com', DNSProvider.CLOUDFLARE, 'A');
                if (!cancelled) setDnsRtt(r.rttMs);
            } catch {}
        };
        measure();
        const id = window.setInterval(measure, 60_000);
        return () => { cancelled = true; clearInterval(id); };
    }, []);

    // IP + geofence — fetch once + on user change
    useEffect(() => {
        let cancelled = false;
        fetchRealIP().then(async (ip) => {
            if (cancelled) return;
            setIpInfo(ip);
            if (user.location && ip.latitude != null && ip.longitude != null) {
                const g = await checkGeofence(user.location, ip, 500);
                if (!cancelled) setGeofence(g);
            }
        });
        return () => { cancelled = true; };
    }, [user.location]);

    // Hardware fingerprint
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { collectFingerprint } = await import('../services/networkService');
                const fp = await collectFingerprint();
                if (!cancelled) setHardwareFingerprint(`${fp.canvas.slice(0, 12)}…`);
            } catch {}
        })();
        return () => { cancelled = true; };
    }, []);

    const auditChecksList: AuditCheck[] = useMemo(() => [
        {
            id: 'tunnel', labelKey: 'auditTunnel',
            run: async () => ({ ok: isConnected, detail: isConnected ? `Routed via ${currentServer.city}` : 'Not connected' }),
        },
        {
            id: 'dns', labelKey: 'auditDNS',
            run: async () => {
                if (config.dnsProvider === DNSProvider.SYSTEM) return { ok: false, detail: 'Using system DNS — possible leak' };
                const r = await resolveOverHttps('example.com', config.dnsProvider, 'A');
                return { ok: r.answers.length > 0, detail: `${config.dnsProvider} · ${r.rttMs}ms · ${r.answers.length} answers` };
            },
        },
        {
            id: 'killswitch', labelKey: 'auditKillswitch',
            run: async () => ({ ok: config.killSwitch && firewallArmed, detail: config.killSwitch ? (firewallArmed ? 'Browser firewall armed' : 'Toggle on but not armed') : 'Disabled' }),
        },
        {
            id: 'threat', labelKey: 'auditThreat',
            run: async () => ({ ok: config.adBlocker || config.malwareShield, detail: `${defenseStats.neutralized} threats neutralized · ${(defenseStats.recentRate)}/min` }),
        },
        {
            id: 'phishing', labelKey: 'auditPhishing',
            run: async () => ({ ok: config.phishingShield, detail: config.phishingShield ? 'Active' : 'Off' }),
        },
        {
            id: 'dpi', labelKey: 'auditDPI',
            run: async () => ({ ok: config.antiDPIEngine, detail: config.antiDPIEngine ? 'Active' : 'Off' }),
        },
        {
            id: 'ghost', labelKey: 'auditGhost',
            run: async () => ({ ok: config.ghostMode, detail: config.ghostMode ? 'Stealth on' : 'Off' }),
        },
        {
            id: 'webrtc', labelKey: 'auditWebRTC',
            run: async () => {
                const r = await checkWebRTCLeak(1500);
                setWebrtc(r);
                return { ok: !r.hasLeak, detail: r.hasLeak ? `${r.publicIPs.length} public IP(s) exposed` : 'No leak' };
            },
        },
        {
            id: 'fingerprint', labelKey: 'auditFingerprint',
            run: async () => {
                if (!config.hardwareFingerprintScrambler) return { ok: false, detail: 'Hardware FP scrambling off' };
                // Re-randomize the canvas fingerprint in-session
                const { randomizeCanvasFingerprint } = await import('../services/fingerprintService');
                const before = hardwareFingerprint;
                const after = await randomizeCanvasFingerprint();
                setHardwareFingerprint(after.slice(0, 12) + '…');
                return { ok: before !== after, detail: after.slice(0, 16) + '…' };
            },
        },
    ], [config, currentServer.city, defenseStats, firewallArmed, hardwareFingerprint, isConnected]);

    const runCheck = useCallback(async (check: AuditCheck) => {
        setRunning(check.id);
        try {
            const r = await check.run();
            setAuditChecks(prev => ({ ...prev, [check.id]: { ...r, ts: Date.now() } }));
        } finally {
            setRunning(null);
        }
    }, []);

    const runAll = useCallback(async () => {
        for (const c of auditChecksList) await runCheck(c);
    }, [auditChecksList, runCheck]);

    // Auto-run on mount
    useEffect(() => { runAll(); /* eslint-disable-next-line */ }, []);

    // Auto-arm firewall if kill switch is on
    useEffect(() => {
        if (config.killSwitch && isConnected) armFirewall();
        else if (!config.killSwitch) disarmFirewall();
        setFirewallArmed(isFirewallArmed());
    }, [config.killSwitch, isConnected]);

    // Real privacy score from live inputs
    const inputs: PrivacyInputs = useMemo(() => ({
        status,
        config,
        tunnelRttMs: currentServer.latency ?? undefined,
        tunnelLossPct: 0,
        dnsRttMs: dnsRtt,
        dnsProvider: config.dnsProvider,
        webRtcLeak: webrtc?.hasLeak,
        geofenceDistanceKm: geofence?.distanceKm,
        firewallArmed,
        activeRulesCount: defense.getRules().filter(r => r.enabled).length,
        hardwareFingerprintScrambled: config.hardwareFingerprintScrambler,
        deviceFingerprint: hardwareFingerprint,
        recentThreatsNeutralized: defenseStats.neutralized,
        auditCount: Object.keys(auditChecks).length,
    }), [status, config, currentServer.latency, dnsRtt, webrtc, geofence, firewallArmed, hardwareFingerprint, defenseStats, auditChecks]);

    const privacy: PrivacyResult = useMemo(() => computePrivacyScore(inputs), [inputs]);

    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (privacy.score / 100) * circumference;

    return (
        <div className="glass rounded-3xl p-6 overflow-hidden relative flex flex-col h-full border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.05)]">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-black text-xs uppercase tracking-[0.2em] text-cyan-400">{t('privacyDashboardTitle')}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{t('privacyDashboardSubtitle')}</p>
                </div>
                <button
                    onClick={runAll}
                    disabled={!!running}
                    className="text-[10px] uppercase font-bold px-3 py-1.5 rounded border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-50"
                >
                    {running ? 'Running…' : '↻ Re-audit'}
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative w-40 h-40">
                    <svg className="w-full h-full" viewBox="0 0 140 140">
                        <circle cx="70" cy="70" r={radius} strokeWidth="8" className="stroke-slate-800" fill="none" />
                        <circle
                            cx="70" cy="70" r={radius} strokeWidth="8"
                            className={`transition-all duration-1000 ease-out ${privacy.color.replace('text-', 'stroke-')}`} fill="none"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            transform="rotate(-90 70 70)"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-5xl font-black ${privacy.color}`}>{privacy.grade}</span>
                        <span className="text-xs font-bold text-slate-500">{privacy.score} / 100</span>
                    </div>
                </div>
            </div>

            {/* Live signals */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-[10px]">
                <LiveStat label="DNS" value={dnsRtt !== undefined ? `${dnsRtt}ms` : '—'} color={dnsRtt === undefined ? 'text-slate-500' : dnsRtt < 50 ? 'text-emerald-400' : dnsRtt < 150 ? 'text-amber-400' : 'text-rose-400'} />
                <LiveStat label="WebRTC" value={webrtc === null ? '—' : webrtc.hasLeak ? `LEAK (${webrtc.publicIPs.length})` : 'CLEAN'} color={webrtc === null ? 'text-slate-500' : webrtc.hasLeak ? 'text-rose-400' : 'text-emerald-400'} />
                <LiveStat label="Firewall" value={firewallArmed ? 'ARMED' : 'OFF'} color={firewallArmed ? 'text-emerald-400' : 'text-slate-500'} />
                <LiveStat label="Geofence" value={geofence === null ? '—' : geofence.flag === 'match' ? 'MATCH' : geofence.flag === 'mismatch' ? `Δ${geofence.distanceKm}km` : '—'} color={geofence?.flag === 'match' ? 'text-emerald-400' : geofence?.flag === 'mismatch' ? 'text-rose-400' : 'text-slate-500'} />
                <LiveStat label="IP" value={ipInfo?.ipv4 ?? '—'} mono color="text-slate-300" />
                <LiveStat label="Country" value={ipInfo?.countryCode ?? '—'} color="text-cyan-400" />
            </div>

            {/* Audit checks */}
            <div className="mt-4 pt-4 border-t border-white/5 space-y-1.5 max-h-40 overflow-y-auto">
                {auditChecksList.map(check => {
                    const r = auditChecks[check.id];
                    return (
                        <div key={check.id} className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-300">{t(check.labelKey)}</span>
                            <div className="flex items-center gap-2">
                                {r ? (
                                    <span className={`mono font-bold text-[10px] ${r.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{r.ok ? '✓' : '✕'}</span>
                                ) : (
                                    <span className="text-slate-500">○</span>
                                )}
                                {r && <span className="text-slate-500 text-[9px] mono truncate max-w-[140px]" title={r.detail}>{r.detail}</span>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Recommendations */}
            {privacy.recommendations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                    <h4 className="text-[10px] uppercase font-bold text-amber-400 mb-1">Recommendations</h4>
                    <ul className="space-y-1 text-[10px] text-slate-400">
                        {privacy.recommendations.map((r, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-amber-400 shrink-0">▸</span>
                                <span>{r}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const LiveStat: React.FC<{ label: string; value: string; color: string; mono?: boolean }> = ({ label, value, color, mono }) => (
    <div className="bg-slate-900/50 rounded p-1.5 border border-white/5">
        <div className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">{label}</div>
        <div className={`text-[11px] font-bold ${color} ${mono ? 'mono' : ''} truncate`} title={value}>{value}</div>
    </div>
);
