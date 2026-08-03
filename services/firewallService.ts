/**
 * firewallService.ts
 * --------------------------------------------------------------
 * Browser-side kill switch / firewall.
 *
 * Wraps fetch / XMLHttpRequest / WebSocket / sendBeacon / EventSource
 * to drop or block outgoing traffic when the VPN tunnel drops. Optional
 * allow-list via origin patterns.
 *
 * The firewall operates as a singleton: arm() / disarm() / updateRules().
 * Listeners can subscribe to block events to feed the audit log.
 */

export interface FirewallRule {
    id: string;
    pattern: string;       // substring or RegExp source
    action: 'allow' | 'block';
    reason: string;
    source: 'system' | 'user';
    createdAt: number;
}

type FirewallEvent =
    | { type: 'armed' }
    | { type: 'disarmed' }
    | { type: 'block'; url: string; method: string; reason: string; ts: number }
    | { type: 'allow'; url: string; method: string; ts: number };

const listeners = new Set<(e: FirewallEvent) => void>();
let isArmed = false;
let rules: FirewallRule[] = [];
const DEFAULT_RULES: FirewallRule[] = [
    { id: 'sys-allow-local',  pattern: 'localhost',           action: 'allow', reason: 'Local development', source: 'system', createdAt: Date.now() },
    { id: 'sys-allow-127',    pattern: '127.0.0.1',           action: 'allow', reason: 'Loopback',           source: 'system', createdAt: Date.now() },
    { id: 'sys-allow-flyvpn', pattern: 'flyvpn.net',          action: 'allow', reason: 'VPN control plane',  source: 'system', createdAt: Date.now() },
];

// Originals (captured on first install)
const originals = {
    fetch: typeof fetch !== 'undefined' ? fetch : undefined,
    XMLHttpRequest: typeof XMLHttpRequest !== 'undefined' ? XMLHttpRequest : undefined,
    WebSocket: typeof WebSocket !== 'undefined' ? WebSocket : undefined,
    sendBeacon: typeof navigator !== 'undefined' && navigator.sendBeacon ? navigator.sendBeacon.bind(navigator) : undefined,
    EventSource: typeof EventSource !== 'undefined' ? EventSource : undefined,
};

const emit = (e: FirewallEvent) => {
    for (const cb of listeners) { try { cb(e); } catch {} }
};

const evaluate = (url: string): { allow: boolean; reason: string } => {
    if (!isArmed) return { allow: true, reason: 'firewall-disarmed' };
    for (const r of rules) {
        try {
            if (r.action === 'block' && url.includes(r.pattern)) return { allow: false, reason: r.reason };
        } catch {}
    }
    for (const r of rules) {
        try {
            if (r.action === 'allow' && url.includes(r.pattern)) return { allow: true, reason: r.reason };
        } catch {}
    }
    return { allow: false, reason: 'kill-switch' };
};

let installed = false;
const install = () => {
    if (installed) return;
    installed = true;
    rules = [...DEFAULT_RULES];

    if (originals.fetch) {
        const origFetch = originals.fetch.bind(globalThis);
        (globalThis as any).fetch = (input: any, init?: any) => {
            const url = typeof input === 'string' ? input : (input?.url ?? '');
            const method = (init?.method ?? 'GET').toUpperCase();
            const decision = evaluate(url);
            emit({ type: decision.allow ? 'allow' : 'block', url, method, ts: Date.now(), ...(decision.allow ? {} : { reason: decision.reason }) } as any);
            if (!decision.allow) {
                return Promise.reject(new Error(`[FlyVPN kill-switch] Blocked: ${url} (${decision.reason})`));
            }
            return origFetch(input, init);
        };
    }

    if (originals.XMLHttpRequest) {
        const Orig = originals.XMLHttpRequest;
        const origOpen = Orig.prototype.open;
        const origSend = Orig.prototype.send;
        Orig.prototype.open = function(method: string, url: string, ...rest: any[]) {
            (this as any).__flyvpn_url = url;
            (this as any).__flyvpn_method = method;
            return origOpen.call(this, method, url, ...rest);
        };
        Orig.prototype.send = function(body?: any) {
            const url = (this as any).__flyvpn_url ?? '';
            const method = ((this as any).__flyvpn_method ?? 'GET').toUpperCase();
            const decision = evaluate(url);
            emit({ type: decision.allow ? 'allow' : 'block', url, method, ts: Date.now(), ...(decision.allow ? {} : { reason: decision.reason }) } as any);
            if (!decision.allow) {
                throw new Error(`[FlyVPN kill-switch] Blocked: ${url} (${decision.reason})`);
            }
            return origSend.call(this, body);
        };
    }

    if (originals.WebSocket) {
        (globalThis as any).WebSocket = function(url: string, protocols?: string | string[]) {
            const decision = evaluate(url);
            emit({ type: decision.allow ? 'allow' : 'block', url, method: 'WS', ts: Date.now(), ...(decision.allow ? {} : { reason: decision.reason }) } as any);
            if (!decision.allow) throw new Error(`[FlyVPN kill-switch] Blocked: ${url} (${decision.reason})`);
            return new originals.WebSocket!(url, protocols as any);
        } as any;
    }

    if (originals.sendBeacon) {
        (navigator as any).sendBeacon = (url: string, data?: any) => {
            const decision = evaluate(url);
            emit({ type: decision.allow ? 'allow' : 'block', url, method: 'BEACON', ts: Date.now(), ...(decision.allow ? {} : { reason: decision.reason }) } as any);
            if (!decision.allow) return false;
            return originals.sendBeacon!(url, data);
        };
    }

    if (originals.EventSource) {
        (globalThis as any).EventSource = function(url: string, conf?: any) {
            const decision = evaluate(url);
            emit({ type: decision.allow ? 'allow' : 'block', url, method: 'SSE', ts: Date.now(), ...(decision.allow ? {} : { reason: decision.reason }) } as any);
            if (!decision.allow) throw new Error(`[FlyVPN kill-switch] Blocked: ${url} (${decision.reason})`);
            return new originals.EventSource!(url, conf);
        } as any;
    }
};

export const armFirewall = () => {
    install();
    if (!isArmed) { isArmed = true; emit({ type: 'armed' }); }
};

export const disarmFirewall = () => {
    if (isArmed) { isArmed = false; emit({ type: 'disarmed' }); }
};

export const isFirewallArmed = (): boolean => isArmed;

export const setFirewallRules = (newRules: FirewallRule[]) => {
    rules = [...DEFAULT_RULES, ...newRules];
};

export const addFirewallRule = (rule: Omit<FirewallRule, 'createdAt'>) => {
    if (rules.find(r => r.id === rule.id)) return;
    rules.push({ ...rule, createdAt: Date.now() });
};

export const removeFirewallRule = (id: string) => {
    rules = rules.filter(r => r.id !== id);
};

export const getFirewallRules = (): FirewallRule[] => [...rules];

export const onFirewallEvent = (cb: (e: FirewallEvent) => void): (() => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
};
