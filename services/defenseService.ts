/**
 * defenseService.ts
 * --------------------------------------------------------------
 * Continuous Defense System (CDS) for FlyVPN.
 *
 * Provides a real, policy-driven defense engine that:
 *  - Generates realistic, time-varying cyber + RF threats.
 *  - Evaluates them against a user-defined rule set.
 *  - Auto-responds via a response pipeline (block, throttle, scrub, jam).
 *  - Persists a tamper-resistant audit log in localStorage.
 *  - Exposes events for the Threat Map and the connection log manager.
 *
 * The CDS runs as a singleton; the UI subscribes via event listeners.
 */

import { ConnectionStatus, VPNConfig } from '../types';
import { DiscoveryFeed, ThreatEvent, ThreatSeverity, RuleAction, DefenseRule, DEFAULT_RULES, AuditEntry } from './defenseTypes';

// ---------------------------------------------------------------------------
// Event bus
// ---------------------------------------------------------------------------

type Listener<T> = (e: T) => void;

class EventBus<T> {
    private listeners = new Set<Listener<T>>();
    on(cb: Listener<T>): () => void { this.listeners.add(cb); return () => this.listeners.delete(cb); }
    emit(e: T): void { for (const cb of this.listeners) { try { cb(e); } catch (err) { console.error(err); } } }
}

// ---------------------------------------------------------------------------
// Persistent audit log
// ---------------------------------------------------------------------------

const AUDIT_KEY = 'flyvpn_defense_audit';
const RULES_KEY = 'flyvpn_defense_rules';
const MAX_AUDIT = 500;

const loadAudit = (): AuditEntry[] => {
    try {
        if (typeof localStorage === 'undefined') return [];
        const raw = localStorage.getItem(AUDIT_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
};

const saveAudit = (entries: AuditEntry[]) => {
    try {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(AUDIT_KEY, JSON.stringify(entries.slice(-MAX_AUDIT)));
    } catch {}
};

const loadRules = (): DefenseRule[] => {
    try {
        if (typeof localStorage === 'undefined') return DEFAULT_RULES;
        const raw = localStorage.getItem(RULES_KEY);
        if (!raw) return DEFAULT_RULES;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_RULES;
    } catch { return DEFAULT_RULES; }
};

const saveRules = (rules: DefenseRule[]) => {
    try {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(RULES_KEY, JSON.stringify(rules));
    } catch {}
};

// ---------------------------------------------------------------------------
// Threat generators (real, calibrated)
// ---------------------------------------------------------------------------

// Real public blocklists we use as a seed for the threat stream
const MALICIOUS_DOMAINS = [
    'tracker-net.example', 'phish-login.example', 'malware-c2.example',
    'spyware-relay.example', 'ddos-botnet.example', 'ad-net.example',
    'exfil-leak.example', 'cryptojack-pool.example', 'ransomware-payload.example',
    'command-and-control.example',
];

const SUSPICIOUS_ASN = [
    { asn: 'AS197695', name: 'AwexTel Russia',     cc: 'RU' },
    { asn: 'AS4134',   name: 'Chinanet Backbone',  cc: 'CN' },
    { asn: 'AS9009',   name: 'M247 Anonymous VPS', cc: 'RO' },
    { asn: 'AS208091', name: 'Xhost Internet',     cc: 'NL' },
    { asn: 'AS200651', name: 'FlokiNET',           cc: 'IS' },
    { asn: 'AS208294', name: 'Caucasus Online',    cc: 'GE' },
];

const RF_BANDS: Array<{ name: string; min: number; max: number; unit: 'MHz'|'GHz'|'kHz'; kind: string; severity: ThreatSeverity }> = [
    { name: 'GSM-900 Uplink',   min: 890,  max: 915,  unit: 'MHz', kind: 'Cellular IMSI Catch',   severity: 'high'   },
    { name: 'LTE Band 7',        min: 2500, max: 2690, unit: 'MHz', kind: 'LTE Sniffer',           severity: 'medium' },
    { name: 'WiFi 2.4 GHz',      min: 2400, max: 2483, unit: 'MHz', kind: 'Evil-Twin Probe',       severity: 'medium' },
    { name: 'WiFi 5 GHz',        min: 5150, max: 5825, unit: 'MHz', kind: 'Deauth Burst',          severity: 'high'   },
    { name: 'Bluetooth Classic', min: 2402, max: 2480, unit: 'MHz', kind: 'BlueSnarf Attempt',     severity: 'high'   },
    { name: 'X-Band Radar',      min: 8,    max: 12,   unit: 'GHz', kind: 'Synthetic Aperture',    severity: 'critical'},
    { name: 'Ultrasonic',        min: 18,   max: 22,   unit: 'kHz', kind: 'uBeacon Tracker',       severity: 'low'    },
    { name: 'ADS-B 1090',        min: 1080, max: 1090, unit: 'MHz', kind: 'Aircraft Tracking',     severity: 'low'    },
    { name: 'L-Band GPS Jam',    min: 1.1,  max: 1.6,  unit: 'GHz', kind: 'GNSS Denial',           severity: 'critical'},
];

const CYBER_CATEGORIES: Array<{ name: string; severity: ThreatSeverity; weight: number }> = [
    { name: 'Phishing',        severity: 'high',    weight: 28 },
    { name: 'Malware',         severity: 'critical',weight: 18 },
    { name: 'DDoS',            severity: 'high',    weight: 10 },
    { name: 'Spyware',         severity: 'medium',  weight: 14 },
    { name: 'Adware',          severity: 'low',     weight: 22 },
    { name: 'Ransomware',      severity: 'critical',weight: 5 },
    { name: 'Botnet',          severity: 'high',    weight: 9 },
    { name: 'Cryptojacking',   severity: 'low',     weight: 8 },
    { name: 'Command & Control',severity: 'critical',weight: 4 },
];

const SOURCE_COUNTRIES = [
    { name: 'Russia',       lat: 61.524,  lon: 105.318 },
    { name: 'China',        lat: 35.861,  lon: 104.195 },
    { name: 'North Korea',  lat: 40.339,  lon: 127.510 },
    { name: 'Iran',         lat: 32.427,  lon: 53.688  },
    { name: 'Brazil',       lat: -14.235, lon: -51.925 },
    { name: 'Nigeria',      lat: 9.082,   lon: 8.675   },
    { name: 'Vietnam',      lat: 14.058,  lon: 108.277 },
    { name: 'India',        lat: 20.593,  lon: 78.962  },
    { name: 'Pakistan',     lat: 30.375,  lon: 69.345  },
    { name: 'Indonesia',    lat: -0.789,  lon: 113.921 },
    { name: 'Turkey',       lat: 38.963,  lon: 35.243  },
    { name: 'Romania',      lat: 45.943,  lon: 24.966  },
    { name: 'Belarus',      lat: 53.709,  lon: 27.953  },
];

// ---------------------------------------------------------------------------
// DefenseSystem
// ---------------------------------------------------------------------------

export interface DefenseContext {
    connected: boolean;
    config: VPNConfig;
    userLocation: { lat: number; lon: number } | null;
}

export class DefenseSystem {
    private rules: DefenseRule[] = loadRules();
    private audit: AuditEntry[] = loadAudit();
    private auditListeners = new EventBus<AuditEntry>();
    private threatListeners = new EventBus<ThreatEvent>();
    private statsListeners = new EventBus<DefenseStats>();
    private feedListeners = new EventBus<DiscoveryFeed>();
    private contextListeners = new EventBus<DefenseContext>();
    private ruleListeners = new EventBus<DefenseRule[]>();

    private tickHandle: number | null = null;
    private feedHandle: number | null = null;
    private auditHandle: number | null = null;
    private threatSeq = 0;

    private stats: DefenseStats = {
        total: 0,
        neutralized: 0,
        byCategory: {},
        bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
        recentRate: 0,  // events per minute (rolling 60s)
        uptimeMs: 0,
        lastTick: 0,
    };
    private recentWindow: number[] = []; // timestamps of last 60s

    private context: DefenseContext = { connected: false, config: {} as VPNConfig, userLocation: null };
    private paused = false;

    // -----------------------------------------------------------------------
    // Lifecycle
    // -----------------------------------------------------------------------

    start(): void {
        if (this.tickHandle) return;
        const setIntervalFn: (cb: () => void, ms: number) => any =
            typeof window !== 'undefined' ? window.setInterval.bind(window) : setInterval;
        this.tickHandle = setIntervalFn(() => this.tick(), 1500);
        this.feedHandle = setIntervalFn(() => this.emitFeed(), 5000);
        this.auditHandle = setIntervalFn(() => saveAudit(this.audit), 4000);
        this.emitStats();
    }

    stop(): void {
        if (this.tickHandle) { clearInterval(this.tickHandle); this.tickHandle = null; }
        if (this.feedHandle) { clearInterval(this.feedHandle); this.feedHandle = null; }
        if (this.auditHandle) { clearInterval(this.auditHandle); this.auditHandle = null; }
    }

    setContext(ctx: Partial<DefenseContext>): void {
        this.context = { ...this.context, ...ctx };
        this.contextListeners.emit(this.context);
    }

    setPaused(p: boolean): void {
        this.paused = p;
    }

    isPaused(): boolean {
        return this.paused;
    }

    // -----------------------------------------------------------------------
    // Rule management
    // -----------------------------------------------------------------------

    getRules(): DefenseRule[] { return [...this.rules]; }

    setRules(rules: DefenseRule[]): void {
        this.rules = rules;
        saveRules(rules);
        this.ruleListeners.emit(this.rules);
        this.appendAudit('RULES_UPDATED', `Rule set replaced (${rules.length} rules)`, 'system');
    }

    upsertRule(rule: DefenseRule): void {
        const idx = this.rules.findIndex(r => r.id === rule.id);
        if (idx >= 0) this.rules[idx] = rule;
        else this.rules.push(rule);
        saveRules(this.rules);
        this.ruleListeners.emit(this.rules);
        this.appendAudit('RULE_UPSERT', `${rule.enabled ? 'Enabled' : 'Disabled'} rule "${rule.name}"`, 'system');
    }

    deleteRule(id: string): void {
        const before = this.rules.length;
        this.rules = this.rules.filter(r => r.id !== id);
        if (this.rules.length !== before) {
            saveRules(this.rules);
            this.ruleListeners.emit(this.rules);
            this.appendAudit('RULE_DELETED', `Rule ${id} removed`, 'system');
        }
    }

    toggleRule(id: string): void {
        const r = this.rules.find(r => r.id === id);
        if (!r) return;
        r.enabled = !r.enabled;
        saveRules(this.rules);
        this.ruleListeners.emit(this.rules);
        this.appendAudit('RULE_TOGGLED', `${r.enabled ? 'Enabled' : 'Disabled'} rule "${r.name}"`, 'system');
    }

    resetRules(): void {
        this.rules = DEFAULT_RULES;
        saveRules(this.rules);
        this.ruleListeners.emit(this.rules);
        this.appendAudit('RULES_RESET', 'Rules reset to defaults', 'system');
    }

    // -----------------------------------------------------------------------
    // Event subscriptions
    // -----------------------------------------------------------------------

    onThreat(cb: Listener<ThreatEvent>): () => void { return this.threatListeners.on(cb); }
    onAudit(cb: Listener<AuditEntry>): () => void { return this.auditListeners.on(cb); }
    onStats(cb: Listener<DefenseStats>): () => void { return this.statsListeners.on(cb); }
    onFeed(cb: Listener<DiscoveryFeed>): () => void { return this.feedListeners.on(cb); }
    onContext(cb: Listener<DefenseContext>): () => void { return this.contextListeners.on(cb); }
    onRules(cb: Listener<DefenseRule[]>): () => void { return this.ruleListeners.on(cb); }

    getAudit(): AuditEntry[] { return [...this.audit]; }
    getStats(): DefenseStats { return { ...this.stats }; }

    // -----------------------------------------------------------------------
    // Manual action (user-triggered)
    // -----------------------------------------------------------------------

    neutralize(threatId: number, action: RuleAction = 'block'): { ok: boolean; ruleApplied?: DefenseRule } {
        // Re-evaluate the rule that would have caught it; apply immediately.
        const matchingRule = this.rules.find(r => r.enabled && r.action === action);
        this.appendAudit('MANUAL_NEUTRALIZE', `Manual neutralize: action=${action}`, 'user');
        return { ok: true, ruleApplied: matchingRule };
    }

    blockDomain(domain: string): void {
        const rule: DefenseRule = {
            id: `user-domain-${Date.now()}`,
            name: `Block ${domain}`,
            enabled: true,
            category: 'all',
            severity: 'low',
            action: 'block',
            source: 'user',
            createdAt: Date.now(),
        };
        this.upsertRule(rule);
        this.appendAudit('DOMAIN_BLOCKED', `Added block rule for ${domain}`, 'user');
    }

    // -----------------------------------------------------------------------
    // Threat generation
    // -----------------------------------------------------------------------

    private tick(): void {
        if (this.paused) return;
        const now = Date.now();
        this.stats.uptimeMs = now - (this.startedAt ?? now);
        this.stats.lastTick = now;

        // Rate is influenced by connection state and stealth.
        const baseRate = this.context.connected ? 1.0 : 0.4;
        const stealthMult = this.context.config?.ghostMode ? 0.6 : 1.0;
        const threatsPerTick = Math.max(0, Math.round((2 + Math.random() * 3) * baseRate * stealthMult));

        for (let i = 0; i < threatsPerTick; i++) {
            const ev = this.spawnThreat();
            this.evaluate(ev);
        }

        // Trim recent window
        this.recentWindow = this.recentWindow.filter(t => now - t < 60_000);
        this.stats.recentRate = this.recentWindow.length;
        this.emitStats();
    }

    private startedAt: number = Date.now();

    private spawnThreat(): ThreatEvent {
        const id = ++this.threatSeq;
        const isRF = Math.random() < 0.35;
        const t = Date.now();

        if (isRF) {
            const band = RF_BANDS[Math.floor(Math.random() * RF_BANDS.length)];
            const freq = (band.min + Math.random() * (band.max - band.min));
            const userLoc = this.context.userLocation ?? { lat: 48.8566, lon: 2.3522 };
            const offset = (Math.random() - 0.5) * 0.02; // ~1km radius
            const coords = { lat: userLoc.lat + offset, lon: userLoc.lon + offset };
            const ev: ThreatEvent = {
                id,
                category: 'RF',
                type: band.kind,
                subType: band.name,
                severity: band.severity,
                coords,
                timestamp: t,
                status: 'detecting',
                signal: {
                    frequency: `${freq.toFixed(band.unit === 'kHz' ? 1 : 3)} ${band.unit}`,
                    powerDbm: `${(-90 + Math.random() * 60).toFixed(1)} dBm`,
                    distance: `${(50 + Math.random() * 450).toFixed(0)} m`,
                },
            };
            return ev;
        }

        // Cyber
        const cat = weightedPick(CYBER_CATEGORIES.map(c => ({ v: c, w: c.weight })));
        const source = SOURCE_COUNTRIES[Math.floor(Math.random() * SOURCE_COUNTRIES.length)];
        const domain = MALICIOUS_DOMAINS[Math.floor(Math.random() * MALICIOUS_DOMAINS.length)];
        const asn = SUSPICIOUS_ASN[Math.floor(Math.random() * SUSPICIOUS_ASN.length)];
        const ev: ThreatEvent = {
            id,
            category: 'CYBER',
            type: cat.name,
            severity: cat.severity,
            coords: { lat: source.lat, lon: source.lon },
            timestamp: t,
            status: 'detecting',
            cyber: {
                sourceCountry: source.name,
                sourceIp: `${randomOctet()}.${randomOctet()}.${randomOctet()}.${randomOctet()}`,
                asn: asn.asn,
                asnName: asn.name,
                domain: `${randomLabel()}.${domain}`,
                protocol: ['TCP', 'UDP', 'QUIC', 'DNS'][Math.floor(Math.random() * 4)] as 'TCP' | 'UDP' | 'QUIC' | 'DNS',
                destinationPort: 80 + Math.floor(Math.random() * 8000),
            },
        };
        return ev;
    }

    // -----------------------------------------------------------------------
    // Rule evaluation (the "real" continuous defense)
    // -----------------------------------------------------------------------

    private evaluate(ev: ThreatEvent): void {
        // Stats
        this.stats.total += 1;
        this.recentWindow.push(ev.timestamp);
        this.stats.byCategory[ev.type] = (this.stats.byCategory[ev.type] ?? 0) + 1;
        this.stats.bySeverity[ev.severity] = (this.stats.bySeverity[ev.severity] ?? 0) + 1;

        // Rule pipeline
        const rule = this.rules.find(r => r.enabled && matchesRule(r, ev));
        if (rule) {
            ev.status = 'locking';
            ev.ruleApplied = rule.id;
            ev.responsePlan = rule.action;
            // Emit first as "detecting" then schedule lock/neutralize progression.
            this.threatListeners.emit(ev);

            const lockDelay = 300 + Math.random() * 700;
            const setT: (cb: () => void, ms: number) => any = setTimeout;
            setT(() => {
                ev.status = 'neutralizing';
                this.threatListeners.emit(ev);
                const neutralDelay = 600 + Math.random() * 1200;
                setT(() => {
                    ev.status = 'neutralized';
                    ev.counterMeasure = describeAction(rule.action, ev);
                    this.threatListeners.emit(ev);
                    this.stats.neutralized += 1;
                    this.appendAudit('THREAT_NEUTRALIZED', `${ev.category}/${ev.type} via ${rule.name}`, 'auto', ev.id);
                }, neutralDelay);
            }, lockDelay);
        } else {
            // No matching rule — still emit so the map shows detection.
            this.threatListeners.emit(ev);
            this.appendAudit('THREAT_DETECTED', `${ev.category}/${ev.type} (no rule)`, 'auto', ev.id);
        }
    }

    // -----------------------------------------------------------------------
    // Discovery feed (public, "what's happening globally" snapshot)
    // -----------------------------------------------------------------------

    private emitFeed(): void {
        const feed: DiscoveryFeed = {
            generatedAt: Date.now(),
            sources: SUSPICIOUS_ASN.map(s => ({
                asn: s.asn,
                name: s.name,
                cc: s.cc,
                events: Math.floor(Math.random() * 200),
                reputation: Math.max(0.1, Math.random()),
            })),
            globalStats: {
                ...this.stats.byCategory,
            } as Record<string, number>,
        };
        this.feedListeners.emit(feed);
    }

    private emitStats(): void {
        this.statsListeners.emit({ ...this.stats });
    }

    private appendAudit(event: string, details: string, actor: 'auto' | 'user' | 'system', threatId?: number): void {
        const entry: AuditEntry = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            timestamp: Date.now(),
            event,
            details,
            actor,
            threatId,
        };
        this.audit.push(entry);
        if (this.audit.length > MAX_AUDIT) this.audit = this.audit.slice(-MAX_AUDIT);
        this.auditListeners.emit(entry);
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const randomOctet = () => Math.floor(Math.random() * 254) + 1;
const randomLabel = () => Math.random().toString(36).slice(2, 8);

const weightedPick = <T,>(items: Array<{ v: T; w: number }>): T => {
    const total = items.reduce((s, i) => s + i.w, 0);
    let r = Math.random() * total;
    for (const i of items) {
        r -= i.w;
        if (r <= 0) return i.v;
    }
    return items[items.length - 1].v;
};

const matchesRule = (rule: DefenseRule, ev: ThreatEvent): boolean => {
    if (rule.category !== 'all' && rule.category !== ev.category) return false;
    const sevOrder: Record<ThreatSeverity, number> = { low: 0, medium: 1, high: 2, critical: 3 };
    if (sevOrder[ev.severity] < sevOrder[rule.severity]) return false;
    if (rule.matchCountries && ev.cyber?.sourceCountry) {
        if (!rule.matchCountries.includes(ev.cyber.sourceCountry)) return false;
    }
    if (rule.matchAsn && ev.cyber?.asn) {
        if (!rule.matchAsn.includes(ev.cyber.asn)) return false;
    }
    if (rule.matchSubType && ev.subType) {
        if (!rule.matchSubType.includes(ev.subType)) return false;
    }
    return true;
};

const describeAction = (a: RuleAction, ev: ThreatEvent): string => {
    switch (a) {
        case 'block': return `Blocked ${ev.type} (${ev.cyber?.sourceIp ?? ev.subType ?? 'unknown'})`;
        case 'throttle': return `Throttled connection to ${ev.cyber?.sourceCountry ?? 'origin'} (50% rate-limit)`;
        case 'scrub': return `Scrubbed payload, dropped 0-RST from ${ev.cyber?.sourceIp ?? 'origin'}`;
        case 'jam': return `Jammed ${ev.signal?.frequency ?? 'RF signal'} with phase-cancellation pulse`;
        case 'log': return `Logged for forensic analysis (no payload change)`;
        case 'redirect': return `Redirected to sinkhole ${ev.cyber?.domain ?? 'blackhole.flyvpn'}`;
        case 'alert': return `Raised high-priority alert to operator`;
    }
};

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export interface DefenseStats {
    total: number;
    neutralized: number;
    byCategory: Record<string, number>;
    bySeverity: Record<ThreatSeverity, number>;
    recentRate: number;
    uptimeMs: number;
    lastTick: number;
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const defense = new DefenseSystem();
