/**
 * defenseTypes.ts
 * --------------------------------------------------------------
 * Type definitions for the Continuous Defense System (CDS).
 */

export type ThreatCategory = 'CYBER' | 'RF' | 'all';
export type ThreatSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ThreatStatus = 'detecting' | 'locking' | 'neutralizing' | 'neutralized' | 'failed';

export type RuleAction = 'block' | 'throttle' | 'scrub' | 'jam' | 'log' | 'redirect' | 'alert';

export interface DefenseRule {
    id: string;
    name: string;
    enabled: boolean;
    category: ThreatCategory;
    severity: ThreatSeverity;
    action: RuleAction;
    matchCountries?: string[];
    matchAsn?: string[];
    matchSubType?: string[]; // for RF
    source: 'system' | 'user';
    createdAt: number;
}

export interface ThreatEvent {
    id: number;
    category: 'CYBER' | 'RF';
    type: string;
    subType?: string;
    severity: ThreatSeverity;
    coords: { lat: number; lon: number };
    timestamp: number;
    status: ThreatStatus;
    ruleApplied?: string;
    responsePlan?: RuleAction;
    counterMeasure?: string;
    cyber?: {
        sourceCountry: string;
        sourceIp: string;
        asn: string;
        asnName: string;
        domain: string;
        protocol: 'TCP' | 'UDP' | 'QUIC' | 'DNS';
        destinationPort: number;
    };
    signal?: {
        frequency: string;
        powerDbm: string;
        distance: string;
    };
}

export interface AuditEntry {
    id: string;
    timestamp: number;
    event: string;
    details: string;
    actor: 'auto' | 'user' | 'system';
    threatId?: number;
}

export interface DiscoveryFeed {
    generatedAt: number;
    sources: Array<{
        asn: string;
        name: string;
        cc: string;
        events: number;
        reputation: number;
    }>;
    globalStats: Record<string, number>;
}

export const DEFAULT_RULES: DefenseRule[] = [
    {
        id: 'sys-block-critical-cyber',
        name: 'Auto-Block Critical Cyber',
        enabled: true,
        category: 'CYBER',
        severity: 'critical',
        action: 'block',
        source: 'system',
        createdAt: Date.now(),
    },
    {
        id: 'sys-throttle-rf-xband',
        name: 'Jam X-Band Radar',
        enabled: true,
        category: 'RF',
        severity: 'high',
        action: 'jam',
        matchSubType: ['X-Band Radar'],
        source: 'system',
        createdAt: Date.now(),
    },
    {
        id: 'sys-block-ransomware',
        name: 'Quarantine Ransomware',
        enabled: true,
        category: 'CYBER',
        severity: 'critical',
        action: 'redirect',
        matchCountries: ['Russia', 'North Korea', 'Iran'],
        source: 'system',
        createdAt: Date.now(),
    },
    {
        id: 'sys-scrub-ddos',
        name: 'Scrub DDoS Floods',
        enabled: true,
        category: 'CYBER',
        severity: 'high',
        action: 'scrub',
        source: 'system',
        createdAt: Date.now(),
    },
    {
        id: 'sys-alert-spyware',
        name: 'Alert on Spyware Probes',
        enabled: false,
        category: 'CYBER',
        severity: 'medium',
        action: 'alert',
        source: 'system',
        createdAt: Date.now(),
    },
];
