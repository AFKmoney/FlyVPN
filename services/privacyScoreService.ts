/**
 * privacyScoreService.ts
 * --------------------------------------------------------------
 * Real privacy/audit score computation.
 *
 * Replaces the previous static config-based calculation. Now the score
 * incorporates live signals from the network/firewall/defense system:
 *  - Tunnel state & RTT
 *  - DNS resolution latency
 *  - WebRTC leak status
 *  - Geofence consistency
 *  - Firewall state
 *  - Active defense rules
 *  - Hardware fingerprint surface
 *  - Recent defense activity
 */

import { ConnectionStatus, VPNConfig, DNSProvider } from '../types';

export interface PrivacyInputs {
    status: ConnectionStatus;
    config: VPNConfig;
    tunnelRttMs?: number;
    tunnelLossPct?: number;
    dnsRttMs?: number;
    dnsProvider?: DNSProvider;
    webRtcLeak?: boolean;
    geofenceDistanceKm?: number;
    firewallArmed?: boolean;
    activeRulesCount?: number;
    hardwareFingerprintScrambled?: boolean;
    deviceFingerprint?: string;
    recentThreatsNeutralized?: number;
    auditCount?: number;
}

export interface PrivacyResult {
    score: number;
    grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
    color: string;
    breakdown: { category: string; points: number; max: number; status: 'good' | 'warn' | 'bad' | 'info' }[];
    recommendations: string[];
}

const GRADE_TABLE: Array<{ min: number; grade: PrivacyResult['grade']; color: string }> = [
    { min: 95, grade: 'A+', color: 'text-cyan-400' },
    { min: 88, grade: 'A',  color: 'text-emerald-400' },
    { min: 78, grade: 'B',  color: 'text-lime-400' },
    { min: 65, grade: 'C',  color: 'text-yellow-400' },
    { min: 50, grade: 'D',  color: 'text-orange-500' },
    { min: 0,  grade: 'F',  color: 'text-rose-500' },
];

export const computePrivacyScore = (i: PrivacyInputs): PrivacyResult => {
    const breakdown: PrivacyResult['breakdown'] = [];
    const recs: string[] = [];

    // ---- 1. Connection (25)
    let connectionPts = 0;
    if (i.status === ConnectionStatus.CONNECTED) {
        connectionPts += 18;
        if (i.tunnelRttMs !== undefined && i.tunnelRttMs < 50) connectionPts += 4;
        else if (i.tunnelRttMs !== undefined && i.tunnelRttMs < 150) connectionPts += 2;
        else recs.push('Tunnel RTT is high (>150ms) — try a closer server.');
        if (i.tunnelLossPct !== undefined && i.tunnelLossPct < 1) connectionPts += 3;
        else if (i.tunnelLossPct !== undefined && i.tunnelLossPct < 3) connectionPts += 1;
        else recs.push('Packet loss detected — consider switching transport to TCP or another endpoint.');
    } else {
        recs.push('Tunnel is not connected — your real IP and traffic are exposed.');
    }
    breakdown.push({ category: 'Tunnel', points: connectionPts, max: 25, status: connectionPts >= 20 ? 'good' : connectionPts >= 10 ? 'warn' : 'bad' });

    // ---- 2. Kill switch (5)
    let ks = 0;
    if (i.config.killSwitch) ks = 5;
    else if (i.status === ConnectionStatus.CONNECTED) recs.push('Enable the kill switch to block traffic if the tunnel drops.');
    if (i.firewallArmed) ks = 5;
    breakdown.push({ category: 'Kill Switch', points: ks, max: 5, status: ks === 5 ? 'good' : ks > 0 ? 'warn' : 'bad' });

    // ---- 3. Stealth (15)
    let stealth = 0;
    if (i.config.ghostMode) stealth += 4;
    if (i.config.multiHop || i.config.secureCoreRouting) stealth += 3;
    if (i.config.antiDPIEngine) stealth += 3;
    if (i.config.scramble || i.config.portScrambling) stealth += 2;
    if (i.config.dynamicIPRotation) stealth += 2;
    if (i.config.decoyTrafficGenerator) stealth += 1;
    if (stealth === 0 && i.status === ConnectionStatus.CONNECTED) recs.push('Activate Stealth Protocol for DPI resistance.');
    breakdown.push({ category: 'Stealth', points: stealth, max: 15, status: stealth >= 10 ? 'good' : stealth >= 5 ? 'warn' : 'bad' });

    // ---- 4. Threat Shield (15)
    let shield = 0;
    if (i.config.adBlocker) shield += 3;
    if (i.config.malwareShield) shield += 4;
    if (i.config.phishingShield) shield += 4;
    if (i.config.antiRansomwareEngine) shield += 2;
    if (i.config.spywareBlocker) shield += 1;
    if (i.config.iotDeviceProtection) shield += 1;
    if (shield === 0) recs.push('Enable Threat Shield modules (ad blocker, malware, phishing).');
    breakdown.push({ category: 'Threat Shield', points: shield, max: 15, status: shield >= 12 ? 'good' : shield >= 6 ? 'warn' : 'bad' });

    // ---- 5. DNS (8)
    let dns = 0;
    if (i.config.dnsProvider !== DNSProvider.SYSTEM) dns += 4;
    if (i.dnsRttMs !== undefined) {
        if (i.dnsRttMs < 30) dns += 4;
        else if (i.dnsRttMs < 100) dns += 2;
        else recs.push('DNS latency is high — try a closer resolver.');
    } else if (i.config.dnsProvider !== DNSProvider.SYSTEM) {
        dns += 2;
    }
    if (dns === 0) recs.push('Switch to a private DNS provider (Cloudflare, Quad9, AdGuard).');
    breakdown.push({ category: 'DNS', points: dns, max: 8, status: dns >= 6 ? 'good' : dns >= 3 ? 'warn' : 'bad' });

    // ---- 6. Network Fabric (8)
    let network = 0;
    if (i.config.quantumResistantEncryption) network += 3;
    if (i.config.packetPrioritizationQoS) network += 2;
    if (i.config.jitterReduction) network += 2;
    if (i.config.advancedPortForwarding) network += 1;
    breakdown.push({ category: 'Network Fabric', points: network, max: 8, status: network >= 5 ? 'good' : network >= 2 ? 'warn' : 'info' });

    // ---- 7. Device Armor (12)
    let device = 0;
    if (i.hardwareFingerprintScrambled) device += 4;
    else if (i.config.hardwareFingerprintScrambler) device += 4;
    if (i.config.cameraMicGuard) device += 3;
    if (i.config.usbDeviceGuard) device += 2;
    if (i.config.firmwareIntegrityMonitor) device += 2;
    if (i.config.geofenceProtection) device += 1;
    if (device === 0) recs.push('Enable hardware fingerprint scrambling & camera/mic guard.');
    breakdown.push({ category: 'Device Armor', points: device, max: 12, status: device >= 8 ? 'good' : device >= 4 ? 'warn' : 'bad' });

    // ---- 8. WebRTC leak (5)
    let webrtc = 0;
    if (i.webRtcLeak === false) webrtc = 5;
    else if (i.webRtcLeak === true) recs.push('WebRTC is leaking your real IP — disable it in browser settings.');
    breakdown.push({ category: 'WebRTC Leak', points: webrtc, max: 5, status: i.webRtcLeak === false ? 'good' : i.webRtcLeak === true ? 'bad' : 'info' });

    // ---- 9. Geofence (4)
    let geo = 0;
    if (i.geofenceDistanceKm !== undefined) {
        if (i.geofenceDistanceKm < 50) geo = 4;
        else if (i.geofenceDistanceKm < 200) geo = 3;
        else if (i.geofenceDistanceKm < 500) geo = 2;
        else if (i.geofenceDistanceKm >= 0) { geo = 0; recs.push('IP geolocation and device geolocation disagree — possible VPN bypass.'); }
    }
    breakdown.push({ category: 'Geofence', points: geo, max: 4, status: geo >= 3 ? 'good' : geo >= 1 ? 'warn' : geo === 0 ? 'bad' : 'info' });

    // ---- 10. Defense activity (3)
    let defense = 0;
    if ((i.activeRulesCount ?? 0) >= 3) defense += 1;
    if ((i.recentThreatsNeutralized ?? 0) > 0) defense += 1;
    if ((i.auditCount ?? 0) > 0) defense += 1;
    breakdown.push({ category: 'Defense Engine', points: defense, max: 3, status: defense === 3 ? 'good' : defense > 0 ? 'info' : 'info' });

    const score = Math.min(100, breakdown.reduce((s, b) => s + b.points, 0));
    const gradeEntry = GRADE_TABLE.find(g => score >= g.min) ?? GRADE_TABLE[GRADE_TABLE.length - 1];
    if (recs.length === 0) recs.push('All privacy checks pass. Stay vigilant.');

    return { score, grade: gradeEntry.grade, color: gradeEntry.color, breakdown, recommendations: recs.slice(0, 5) };
};
