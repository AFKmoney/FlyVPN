/**
 * vpnEndpointService.test.ts
 * --------------------------------------------------------------
 * Smoke tests for the new real endpoint service and defense system.
 * Run with: node test/vpnEndpointService.test.ts
 */

import { discoverEndpoints, negotiateTunnel, onTrafficSample, mapServerToEndpoint, registerSession, unregisterSession } from '../services/vpnEndpointService';
import { defense } from '../services/defenseService';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const assert = (cond: any, msg: string) => {
    if (!cond) { console.error('✗ FAIL:', msg); process.exit(1); }
    console.log('✓', msg);
};

(async () => {
    console.log('--- vpnEndpointService tests ---');

    const endpoints = await discoverEndpoints(true);
    assert(endpoints.length > 0, 'discovers a non-empty list of real endpoints');
    assert(endpoints.every(e => !!e.host), 'every endpoint has a host');
    assert(endpoints.every(e => !!e.protocol), 'every endpoint has a protocol');
    assert(endpoints.every(e => e.rttMs > 0), 'every endpoint has a real RTT measurement');
    assert(endpoints.every(e => ['healthy', 'degraded', 'offline', 'unknown'].includes(e.health)), 'every endpoint has a health status');

    // Sort order
    const sorted = [...endpoints].sort((a, b) => a.rttMs - b.rttMs);
    assert(endpoints[0].rttMs <= endpoints[endpoints.length - 1].rttMs, 'endpoints are ordered by RTT');

    // Negotiate
    const ep = endpoints[0];
    const session = await negotiateTunnel(ep, { obfuscation: true, multiHop: false });
    assert(session.sessionId.length > 0, 'session has a session id');
    assert(/\d+\.\d+\.\d+\.\d+/.test(session.virtualIp), 'session has a virtual IP');
    assert(session.configBlob.includes(ep.host), 'config blob references the endpoint host');
    assert(ep.protocol === 'WireGuard' ? session.configBlob.includes('[Interface]') : true, 'WireGuard config has Interface section');

    // Map existing server -> endpoint
    const { SERVERS } = await import('../constants');
    const synth = mapServerToEndpoint(SERVERS[0], endpoints);
    assert(synth !== null, 'maps existing server to endpoint');

    // Telemetry
    registerSession(session);
    let received = false;
    const off = onTrafficSample(() => { received = true; });
    await sleep(400);
    assert(received, 'received a traffic sample after registering session');
    off();
    unregisterSession(session);

    console.log('--- defenseService tests ---');

    defense.start();
    let sawThreat = false;
    let sawAudit = false;
    const offT = defense.onThreat(() => { sawThreat = true; });
    const offA = defense.onAudit(() => { sawAudit = true; });

    await sleep(3500);
    assert(sawThreat, 'defense system emits threat events');
    assert(sawAudit, 'defense system writes audit entries');

    const stats = defense.getStats();
    assert(stats.total > 0, 'defense stats show a non-zero total');

    offT();
    offA();
    defense.stop();

    console.log('\nAll tests passed.');
    process.exit(0);
})().catch(e => { console.error('Test crash:', e); process.exit(1); });
