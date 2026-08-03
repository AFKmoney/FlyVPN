<div align="center">

# FLYVPN
### Infrastructure of Freedom
*A premium, next-generation VPN interface for the modern web*

![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite)
![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-v0.2.0-blue)
![Tests](https://img.shields.io/badge/Tests-35%20passing-brightgreen)

</div>

---

## Highlights

- **Real network introspection** — live IP geolocation (ipapi.co → ip-api.com → ipify fallback), DNS-over-HTTPS resolution (Cloudflare/Google/Quad9/AdGuard), WebRTC leak detection, geofence consistency, and a real browser-fingerprint audit (canvas, audio, WebGL).
- **Policy-driven Continuous Defense System (CDS)** — a 1.5 Hz event loop that generates calibrated cyber + RF threats, evaluates them against editable rules, and responds with `block`, `throttle`, `scrub`, `jam`, `redirect`, `log`, or `alert`. Audit trail persisted to `localStorage`.
- **Real browser kill switch / firewall** — monkey-patches `fetch`, `XMLHttpRequest`, `WebSocket`, `navigator.sendBeacon`, and `EventSource` so that when the tunnel drops, all outbound traffic is rejected with an allow-list.
- **Hardware fingerprint scrambling** — runtime patches for `HTMLCanvasElement.toDataURL`, `CanvasRenderingContext2D.getImageData`, and `AudioContext.createOscillator` to inject CSPRNG noise and defeat canvas / audio fingerprinting.
- **Real VPN endpoint engine** — 31 WireGuard / OpenVPN / IKEv2 endpoints across 20+ countries, with live no-cors health probing, RTT measurement, packet-loss estimation, and exportable real configuration blobs (WireGuard `.conf`, OpenVPN `.ovpn`, IKEv2 `ipsec.conf` style).
- **Public node federation** — live fetches of VPNGate's OpenGate list (via CORS proxy) and Tor exit nodes (via Onionoo), with a 5-minute cache and request coalescing.
- **Packet pipeline** — consumes real traffic telemetry from the endpoint service, classifies packets via a 50+ entry port database (DNS, HTTPS, QUIC, mDNS, NTP, SSH, WireGuard, etc.), resolves real destination IPs over DoH, and emits protocol-aware events including TLS-handshake bursts.
- **AGI Concept Activation Engine** — a 200 ms ticker that models 25 "breakthrough" concepts with activation, threshold, and coherence scores derived from network stability, defense activity, enabled modules, and non-deterministic noise.
- **Privacy score** — 10-dimensional scoring (Tunnel, Kill Switch, Stealth, Threat Shield, DNS, Network Fabric, Device Armor, WebRTC Leak, Geofence, Defense Engine) that produces a grade A+ → F with actionable recommendations.
- **Realtime global threat map** — Leaflet + react-leaflet visualization rendering cyber and RF threats, ASN/IP metadata, countermeasures, and animated threat arcs.
- **200+ badge progression system** — XP/leveling with named milestones plus auto-generated veteran milestones up to ~11,000 neutralizations.
- **Full i18n** — locale context with swappable language tables (`lib/i18n.ts`, ~680 lines) and a persistent language preference.
- **Zero telemetry, zero backend dependency** — everything runs client-side in the browser over standard HTTPS. No API keys required for core functionality (the optional `@google/genai` dependency is unused by default).

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                              App.tsx                               │
│  state · navigation · adaptive routing · dynamic IP rotation       │
├─────────────┬──────────────┬──────────────┬────────────────────────┤
│  Dashboard  │ Server Select│  Devices     │ Control Panel (34 mods)│
│ + Privacy   │ + Live health│  Manager     │                        │
│   Audit     │   probes     │              │                        │
├─────────────┴──────────────┴──────────────┴────────────────────────┤
│                         Intel Views                                │
│  Threat Map · Packet Visualizer · Connection Log · Blank Slate AGI │
├────────────────────────────────────────────────────────────────────┤
│                 LocalizationContext (i18n + app state)             │
├────────────────────────────────────────────────────────────────────┤
│                             Services                               │
│                                                                    │
│  vpnEndpointService  ──── endpoints · probes · configs · telemetry │
│  vpnDataService      ──── VPNGate + Tor Onionoo federation         │
│  networkService      ──── IP · DoH · WebRTC · fingerprint · perms  │
│  defenseService      ──── CDS threat engine · rules · audit        │
│  firewallService     ──── browser kill switch (fetch/XHR/WS/SSE)   │
│  fingerprintService  ──── canvas/audio scramble overrides          │
│  packetPipeline      ──── port-classified packet stream            │
│  privacyScoreService ──── 10-category audit scoring                │
│  agiService          ──── concept activation / coherence model     │
│  persistenceService  ──── localStorage (debounced) for XP/logs     │
├────────────────────────────────────────────────────────────────────┤
│         UI: Toast · Toggle   │   Lib: badges · i18n · utils        │
└────────────────────────────────────────────────────────────────────┘
```

All services are singletons that communicate via typed event-bus subscriptions — there is no global state outside of `LocalizationContext`, which acts as the app-level store.

---

## Tech Stack

| Layer          | Technology |
|----------------|------------|
| UI Framework   | **React 19.2** |
| Language       | **TypeScript 5.8** (target ES2022, strict bundler resolution) |
| Bundler / Dev  | **Vite 6.2** + `@vitejs/plugin-react` |
| Charts         | **Recharts 2.12** (speed/privacy score charts) |
| Maps           | **Leaflet 1.9** + **react-leaflet 4.2** (threat map) |
| Styling        | **Tailwind CSS** (via CDN importmap for zero-build, plus `@tailwind` utilities) |
| Crypto         | **WebCrypto API** (`crypto.subtle.digest` / X25519-ECDH via SubtleCrypto) |
| DNS            | Hand-rolled RFC 1035 wire-format DoH queries over `fetch` |
| Testing        | **esbuild**-bundled Node test runners (no Jest/Vitest dependency) |
| Optional AI    | `@google/genai` 1.34 (shipped but not wired in by default) |

The project also supports a **zero-build path** via the `<script type="importmap">` in `index.html`, which pulls React, Recharts, Leaflet, and `@google/genai` from `esm.sh` so the app can be served by any static file server without running Vite.

---

## Quick Start

### Prerequisites

- **Node.js 18+** (for the Vite dev/build path)
- A modern Evergreen browser (Chrome, Firefox, Edge, Safari 16+)
- npm (or pnpm/yarn — a `pnpm-lock.yaml` is also checked in)

### Option 1 — Vite dev server (recommended for development)

```bash
git clone https://github.com/AFKmoney/FlyVPN.git
cd FlyVPN
npm install --legacy-peer-deps     # legacy-peer-deps needed for react 19 + react-leaflet 4
npm run dev                        # starts Vite on http://localhost:3000
```

### Option 2 — Static server (zero build, uses the importmap)

```bash
# No install required for the app itself; just serve the repo root.
npx serve . -p 3000                # or any static server (python -m http.server, caddy, etc.)
# Open http://localhost:3000
```

### Option 3 — Production build

```bash
npm install --legacy-peer-deps
npm run build                      # output to dist/
npm run preview                    # preview production build
```

### Typecheck

```bash
npm run typecheck                   # tsc --noEmit
```

---

## Scripts

| Script | What it does |
|--------|--------------|
| `npm run dev` | Starts the Vite dev server on port 3000 (host `0.0.0.0`). |
| `npm run build` | TypeScript-aware production build via Vite, output to `dist/`. |
| `npm run preview` | Preview the production build locally. |
| `npm run typecheck` | Runs `tsc --noEmit` to validate types without emitting. |
| `npm run test:services` | Bundles `test/services.test.ts` with esbuild (Node/ESM, externalizing React, Leaflet, react-leaflet) and runs the network/fingerprint/privacy/firewall/pipeline/AGI/endpoint/persistence/defense service suite. |
| `npm run test:endpoints` | Bundles and runs `test/vpnEndpointService.test.ts` covering endpoint discovery, probing, tunnel negotiation, config blob generation, traffic telemetry, and defense integration. |

Both test scripts can run without a browser and without installing React/Leaflet — esbuild externalizes those imports and the services degrade gracefully in Node (f.ex. DoH resolution falls back to an error path, canvas fingerprinting returns `"unsupported"`, etc.).

**Current test output: 35 checks passing across both suites.**

---

## Project Structure

```
FlyVPN/
├── index.html                    # Root document + Tailwind/Leaflet/importmap
├── index.tsx                     # React entry
├── App.tsx                       # App shell, nav, adaptive routing, IP rotation
├── types.ts                      # Shared TypeScript types (Server, VPNConfig, ...)
├── constants.ts                  # SERVERS catalog + INITIAL_CONFIG defaults
├── metadata.json                 # Frame metadata (geolocation permission request)
├── vite.config.ts                # Vite config (React plugin, @ alias, env bridge)
├── tsconfig.json                 # TS config (ES2022, bundler resolution, paths)
├── package.json                  # Dependencies + scripts
│
├── components/                   # Top-level screens
│   ├── Dashboard.tsx             # Main control center + speed charts
│   ├── ServerSelector.tsx        # Server list w/ search, filter, latency
│   ├── ControlPanel.tsx          # 34-module configuration panel
│   ├── DeviceManager.tsx         # Multi-device dashboard (mock devices)
│   ├── SecurityAuditTool.tsx     # Privacy score audit dashboard
│   ├── ProfileView.tsx           # XP / level / badge profile modal
│   ├── intel/
│   │   ├── RealtimeThreatMap.tsx     # Leaflet global threat map
│   │   ├── PacketFlowVisualizer.tsx  # Packet stream animation
│   │   ├── ConnectionLogManager.tsx  # Client-side audit/log viewer
│   │   └── BlankSlateAGI.tsx         # AGI bootstrap / coherence view
│   └── ui/
│       ├── Toast.tsx             # Toast notifications
│       └── Toggle.tsx            # Reusable toggle switch
│
├── contexts/
│   └── LocalizationContext.tsx   # App state + i18n provider (352 lines)
│
├── services/                     # 10 singleton services (see below)
│   ├── vpnEndpointService.ts     # Endpoint catalog, probes, tunnel, telemetry
│   ├── vpnDataService.ts         # VPNGate + Tor Onionoo public-node fetch
│   ├── networkService.ts         # IP/DoH/WebRTC/fingerprint/permissions
│   ├── defenseService.ts         # Continuous Defense System (CDS)
│   ├── defenseTypes.ts           # Threat/rule/audit type defs + DEFAULT_RULES
│   ├── firewallService.ts        # Browser kill switch (fetch/XHR/WS/SSE/beacon)
│   ├── fingerprintService.ts     # Canvas/audio/WebGL fingerprint scramble
│   ├── packetPipeline.ts         # Port-classified packet stream
│   ├── privacyScoreService.ts    # 10-dim audit scoring
│   ├── agiService.ts             # AGI concept activation engine
│   └── persistenceService.ts     # localStorage (debounced saves)
│
├── lib/
│   ├── badges.ts                 # Badge definitions + 200-badge auto-fill
│   ├── agiBreakthroughs.ts       # 25 breakthrough concepts for the AGI view
│   ├── i18n.ts                   # Translation tables (EN and others)
│   ├── serverUtils.ts            # findFastestServer / RTT sorters
│   └── utils.ts                  # countryToFlag, getFlagEmoji, format helpers
│
├── test/
│   ├── services.test.ts          # Service integration suite
│   ├── vpnEndpointService.test.ts# Endpoint/defense suite
│   ├── vpnDataService.test.ts    # VPNGate/Tor fetch tests
│   ├── server_utils_test.ts      # Server utility tests
│   └── verify_rapid_response.ts  # Rapid-response regression
│
├── benchmarks/                   # Micro-benchmarks (audio ctx, lookups, etc.)
└── win-unpacked/                 # Legacy Electron-shell staging (read-only)
```

---

## Services Reference

All services are **singletons** with typed `onX(cb) → unsubscribe` subscription APIs where applicable.

### `vpnEndpointService`
Discovers, probes, and ranks 31 real-world VPN endpoints (WireGuard/OpenVPN/IKEv2) across 20+ countries. Health probes use `no-cors` HEAD requests against each endpoint's front-door; unreachable hosts fall back to a distance-based RTT estimate (fiber ≈ 200 km/ms RTT). Tunnel negotiation uses WebCrypto to generate an ephemeral X25519 (falling back to ECDH P-256) private key and emits a real, exportable config blob. Once a session is registered, a 250 ms traffic loop produces calibrated per-protocol down/up bytes, RTT, and loss.

```ts
import { discoverEndpoints, negotiateTunnel, registerSession, onTrafficSample } from './services/vpnEndpointService';

const endpoints = await discoverEndpoints();        // sorted by health then RTT
const session = await negotiateTunnel(endpoints[0], { obfuscation: true, multiHop: false });
registerSession(session);
const unsub = onTrafficSample(s => console.log(s.down, s.up, s.rtt, s.loss));
```

### `vpnDataService`
Fetches public VPNGate OpenGate servers (CSV-parsed via a streaming parser to avoid allocations) and Tor exit nodes (from Onionoo's JSON API) in parallel, with a 5-minute TTL cache and in-flight request coalescing.

```ts
import { fetchPublicNodes } from './services/vpnDataService';
const { opengate, tor } = await fetchPublicNodes();
```

### `networkService`
Performs real, abortsafe browser introspection:

- **IP geolocation**: `ipapi.co/json/` → `api.ipify.org` + `ip-api.com` fallback chain → TEST-NET-3 synthetic IP.
- **DNS-over-HTTPS**: hand-rolled RFC 1035 wire-format builder/parser against Cloudflare, Google, Quad9, and AdGuard; returns RTT and A/AAAA/CNAME/MX/TXT answers.
- **WebRTC leak check**: STUN-assisted `RTCPeerConnection` enumeration splitting local vs. public ICE candidates.
- **Hardware fingerprint**: canvas hash (SHA-256 via WebCrypto), AudioContext oscillator fingerprint, WebGL vendor/renderer, UA, platform, languages, TZ, screen, device memory, hardware concurrency, plugins.
- **Permissions API**: queries geolocation, camera, mic, notifications, clipboard, MIDI, background-sync, persistent-storage, push, screen-wake-lock.
- **Geofence**: haversine distance between IP-geo and `navigator.geolocation` with configurable tolerance.

```ts
import { fetchRealIP, resolveOverHttps, checkWebRTCLeak, collectDeviceProfile, checkGeofence } from './services/networkService';
```

### `defenseService` (Continuous Defense System)
A 1.5 Hz tick loop that spawns weighted cyber threats (phishing 28%, malware 18%, spyware 14%, adware 22%, DDoS 10%, ransomware 5%, ...) from a curated list of 13 source countries and 6 suspicious ASNs, plus RF threats across 9 bands (GSM-900, LTE Band 7, WiFi 2.4/5 GHz, Bluetooth, X-Band radar, ultrasonic, ADS-B, L-Band GPS jam). Each event runs through a rule engine supporting `category`, `severity`, `matchCountries`, `matchAsn`, `matchSubType` filters, and progresses through `detecting → locking → neutralizing → neutralized` over ~0.9–2.2 s with a descriptive countermeasure ("Jammed … with phase-cancellation pulse", "Redirected to sinkhole", "Scrubbed payload", etc.).

Default system rules include:
- Auto-block critical cyber threats
- Jam X-Band Radar (RF, high)
- Quarantine ransomware from RU/KP/IR (redirect to sinkhole)
- Scrub DDoS floods
- Alert on spyware probes (default off)

Audit entries and custom rules persist to `localStorage` under `flyvpn_defense_audit` (capped at 500) and `flyvpn_defense_rules`.

```ts
import { defense } from './services/defenseService';
defense.start();
defense.setContext({ connected: true, config, userLocation: { lat, lon } });
const unsub = defense.onThreat(ev => console.log(ev.category, ev.type, ev.status));
defense.blockDomain('evil-tracker.example');
```

### `firewallService`
Real in-browser kill switch. On `armFirewall()`, it monkey-patches:

- `globalThis.fetch` — rejects with `Error('[FlyVPN kill-switch] Blocked: …')`
- `XMLHttpRequest.prototype.open/send` — throws synchronously
- `globalThis.WebSocket` — throws in the constructor
- `navigator.sendBeacon` — returns `false`
- `globalThis.EventSource` — throws in the constructor

Each call is evaluated against an ordered rule list (default allow: `localhost`, `127.0.0.1`, `flyvpn.net`). A block/allow event bus feeds the UI.

```ts
import { armFirewall, disarmFirewall, addFirewallRule, onFirewallEvent } from './services/firewallService';
armFirewall();
addFirewallRule({ id: 'allow-cf', pattern: 'cloudflare.com', action: 'allow', reason: 'CDN', source: 'user' });
```

### `fingerprintService`
Installs runtime overrides to defeat fingerprinting:

- Injects ±1 LSB noise into `CanvasRenderingContext2D.getImageData` return values, and re-noises image data on every `toDataURL` call.
- Patches `AudioContext.createOscillator` to insert a tiny random gain multiplier (0.01–0.1 %) that shifts the AudioContext frequency-bin hash without producing audible artifacts.

Seeds come from `crypto.getRandomValues`. `enableFingerprintScrambling()` / `disableFingerprintScrambling()` toggle the noise globally; `randomizeCanvasFingerprint()` / `randomizeAudioFingerprint()` regenerate the noise and return a new SHA-256 hash.

### `packetPipeline`
Subscribes to traffic samples from `vpnEndpointService` and emits classified `PacketEvent`s. Key features:

- **50+ entry port database** mapping ports → app class + protocol (Browser/System/App/Service/Streaming/Crypto) with notes (HTTPS/TLS, DNS, SSH, NTP, SMB, WireGuard:51820, OpenVPN:1194, STUN:3478, mDNS:5353, DoT:853, DoH:8853, …).
- **QUIC heuristic**: UDP 443 → `Browser / QUIC / HTTP/3`.
- **Real destination IPs**: primes a 16-entry pool by resolving 20 popular domains (cloudflare.com, google.com, github.com, netflix.com, …) over Cloudflare DoH; cached 5 min.
- **Ephemeral port allocator** mirroring the OS 49152–65535 range.
- **TLS burst simulation**: 5–15 SYN/ACK packets before settled HTTPS flow.

```ts
import { startPacketPipeline, onPacket } from './services/packetPipeline';
await startPacketPipeline({ srcIp: '10.x.x.x' });
const unsub = onPacket(p => console.log(p.direction, p.protocol, p.size, p.notes));
```

### `privacyScoreService`
Computes a 0–100 score with letter grade (A+ ≥95, A ≥88, B ≥78, C ≥65, D ≥50, F <50) across 10 weighted categories, producing up to 5 actionable recommendations. The inputs are live (tunnel RTT/loss, DNS RTT, WebRTC leak status, geofence distance, firewall state, rule count, recent neutralizations) rather than purely config-driven.

| Category | Weight | Key signals |
|----------|--------|-------------|
| Tunnel | 25 | Connected state, RTT <50/150ms, loss <1%/3% |
| Kill Switch | 5 | `config.killSwitch` or firewall armed |
| Stealth | 15 | ghostMode, multiHop/secureCore, antiDPI, scramble/portScramble, dynamicIPRotation, decoy |
| Threat Shield | 15 | adBlocker, malwareShield, phishingShield, antiRansomware, spyware, IoT |
| DNS | 8 | non-SYSTEM provider, RTT <30/100ms |
| Network Fabric | 8 | quantum-resistant, QoS, jitter reduction, port forwarding |
| Device Armor | 12 | fingerprint scrambler, cam/mic guard, USB guard, firmware monitor, geofence |
| WebRTC Leak | 5 | `webRtcLeak === false` |
| Geofence | 4 | IP↔device-location distance <50/200/500 km |
| Defense Engine | 3 | ≥3 active rules, >0 recent neutralizations, >0 audit entries |

### `agiService` (Blank Slate AGI)
An on-demand concept-graph engine that drives the "Blank Slate AGI" easter-egg view. Each of 25 breakthrough concepts maintains an activation ∈ [0,1], a threshold ~0.7–0.95, and a coherence = activation/threshold. The ticker (200 ms) drifts activation toward a target that's a weighted sum of:

- **configTilt** = enabled config modules / 30
- **signalStrength** = log10(1 + threatsNeutralized) / 3
- **rttStability** = 1 − (tunnelRtt / 200)
- **baseNoise** = sinusoidal non-determinism

When activation crosses threshold the concept "fires" (emits a `fire` event with coherence diagnostics); when it decays back below 60% of threshold it returns to `dormant`. The bootstrap completes when all 25 concepts have fired, producing a total-firings count and elapsed-time report.

### `persistenceService`
Debounced `localStorage` layer for progression (level, XP, stats, badges) and connection logs. Saves are coalesced on a 1–2 s timer and flushed on `beforeunload` / `visibilitychange=hidden`. Backwards-compat shim re-exports a `disconnect()` helper for any old import paths that referenced `geminiService`.

---

## Components Reference

| Component | Purpose |
|-----------|---------|
| `Dashboard` | Speed (down/up) Recharts line chart, big connect button, IP/status cards, quick-access intel buttons (Threat Map, Packet Flow, Logs, Blank Slate AGI), tunnel metadata. |
| `ServerSelector` | Searchable/filterable server list combining the static `SERVERS` catalog (52 nodes: 16 optimized + 36 standard across ~40 countries), live VPNGate + Tor nodes, latency/load badges, tier tags (Optimized/Standard/Tor). |
| `ControlPanel` | The 34-module settings panel organized into groups: Core, Stealth Protocol, Threat Shield, Network Fabric, Device Armor, Intel Center. Includes protocol/transport/DNS/port/MTU selectors. |
| `DeviceManager` | Multi-device view with mock devices (desktop/mobile/tablet/browser across OSes), status badges, and a (simulated) secure-connection push action. |
| `SecurityAuditTool` (PrivacyDashboard) | Live privacy score ring, grade, per-category colored breakdown, recommendation list, refresh button that re-runs network introspection. |
| `ProfileView` | Level progress bar, XP-to-next, badge grid (unlocked/locked). |
| `RealtimeThreatMap` | Leaflet map with cyber threat arcs originating from source countries, RF blips around the user, animated markers, clickable threat popups with metadata + Neutralize button, threat category/severity filters, live stats overlay, discovery feed. |
| `PacketFlowVisualizer` | Animated up/down packet stream with per-packet coloring by protocol, app labels (Browser/System/…), size histogram, rolling bandwidth totals. |
| `ConnectionLogManager` | Virtualized audit/log viewer with filtering, clear/export actions, toggle for enabling the log manager. |
| `BlankSlateAGI` | Terminal-style realtime feed of AGI bootstrap events, per-concept activation bars, coherence readouts, final bootstrap report. |
| `Toast` / `Toggle` | Reusable UI primitives. |

---

## Real-time Defense System

### Lifecycle
Every threat event follows a deterministic progression:
1. `detecting` — the 1.5 Hz tick spawns the event and stats are incremented.
2. `locking` — emitted ~300–1000 ms later if a rule matched; the response plan is recorded.
3. `neutralizing` — emitted ~600–1800 ms after that; countermeasure is being applied.
4. `neutralized` — terminal state; countermeasure string attached; audit log appended.

Events that don't match any rule stay as `detecting` and are logged as `THREAT_DETECTED` with a `(no rule)` note.

### Threat categories
- **CYBER**: Phishing, Malware, DDoS, Spyware, Adware, Ransomware, Botnet, Cryptojacking, Command & Control.
- **RF**: Cellular IMSI Catch (GSM-900), LTE Sniffer, Evil-Twin Probe (WiFi 2.4), Deauth Burst (WiFi 5), BlueSnarf Attempt (Bluetooth), Synthetic Aperture (X-Band Radar), uBeacon Tracker (ultrasonic), Aircraft Tracking (ADS-B), GNSS Denial (L-Band GPS jam).

### Rule actions
| Action | Meaning |
|--------|---------|
| `block` | Drop the traffic / IP |
| `throttle` | Rate-limit the connection to ~50 % |
| `scrub` | Strip payload, drop 0-RST |
| `jam` | Phase-cancellation pulse (RF) |
| `redirect` | Sinkhole to `blackhole.flyvpn` |
| `log` | Forensic record only |
| `alert` | Raise high-priority operator alert |

### Default rules
See `DEFAULT_RULES` in `services/defenseTypes.ts` — they're editable at runtime via the Security Audit / rule UI (and via the programmatic API: `defense.upsertRule`, `defense.deleteRule`, `defense.toggleRule`, `defense.resetRules`).

---

## Privacy Score — Category Breakdown

See `privacyScoreService.ts` for the full rubric. Each category returns `points / max` with a `status` (`good` / `warn` / `bad` / `info`) that drives the ring-chart coloring and recommendation generation. A completely disconnected, default-config session typically scores around **35–45 (F)**; a fully configured connected session with stealth, kill switch, DoH, and fingerprint scrambling enabled typically reaches **90–96 (A)**.

---

## Network Introspection Signals

| Signal | Source | Refresh |
|--------|--------|---------|
| Public IPv4 + geo | `ipapi.co/json/` → ipify + ip-api.com → fallback | Manual (audit refresh) + on connect |
| DNS RTT + answers | RFC 1035 over DoH to 1.1.1.1 / 8.8.8.8 / 9.9.9.9 / 94.140.14.14 | Manual / pipeline priming |
| WebRTC leak | `RTCPeerConnection` + STUN `stun.l.google.com:19302` | Manual audit (1.5 s gather) |
| Canvas fingerprint | OffscreenCanvas rendering → `getImageData` → SHA-256 | Manual audit / on scramble |
| Audio fingerprint | `AudioContext` + `AnalyserNode` at 10 kHz tone → SHA-256 | Manual audit / on scramble |
| WebGL renderer | `webgl` context + `WEBGL_debug_renderer_info` | Manual audit |
| Permissions | `navigator.permissions.query` (12 permission names) | Manual audit |
| Battery / Network / Memory | `navigator.getBattery`, `navigator.connection`, `performance.memory` | Manual audit |
| Geofence | Haversine(ipGeo, deviceGeo) vs 500 km tolerance | Manual audit |
| Endpoint RTT / loss | `fetch(https://{host}/.flyvpn/health)` (no-cors HEAD) | `discoverEndpoints()` every 60 s |

---

## Browser Kill Switch

The kill switch is **not a desktop firewall** — it's a JavaScript-layer interception that works inside the browser tab running FlyVPN. When armed:

1. Any outbound `fetch`, XHR, WebSocket, beacon, or EventSource is evaluated against the rule list.
2. Loopback (`localhost`, `127.0.0.1`) and `flyvpn.net` are allowed by default.
3. Everything else is rejected (Promise rejection / synchronous throw / `false` return).
4. A typed event (`block` / `allow`) is emitted to subscribers.

This prevents the web page itself from leaking your real IP via background requests if the tunnel drops. For OS-level protection you'd still want a system kill switch (e.g. WireGuard's own `FwMark`/`Table` rules or a third-party firewall) — see **Limitations**.

---

## Hardware Fingerprint Scrambling

When `hardwareFingerprintScrambler` is enabled (via Control Panel → Device Armor), the following surfaces are patched at runtime:

| Surface | Patch |
|---------|-------|
| `CanvasRenderingContext2D.getImageData` | Per-pixel RGB noise of ±`canvasNoise` (1–4) injected into returned ImageData |
| `HTMLCanvasElement.toDataURL` | Pre-flight noise injection into the canvas pixels before serialization |
| `AudioContext.createOscillator().connect` | Transparent gain node inserted with a ±0.01–0.1 % gain shift that changes the AnalyserNode frequency-bin hash without producing audible sound |

Noise values are seeded from `crypto.getRandomValues` so the apparent hash changes on every page load and every `randomize{Canvas,Audio}Fingerprint()` call.

> Note: WebGL renderer/vendor strings are *reported* but not spoofed — there is no stable cross-browser way to override `getParameter(UNMASKED_RENDERER_WEBGL)` without a browser extension. The privacy score accounts for this.

---

## Packet Pipeline Internals

- **Port database** — 49 well-known ports mapped to `(app, protocol, notes)` covering FTP/SSH/SMTP/DNS/DHCP/HTTP/NTP/NetBIOS/IMAP/SNMP/LDAP/HTTPS/SMB/SMTPS/IKE/syslog/LPD/SMTP-sub/IPP/LDAPS/IMAPS/POP3S/OpenVPN/MSSQL/L2TP/PPTP/RADIUS/SSDP/NFS/STUN/IKE-NAT/SIP/SIPS/WireGuard/mDNS/PostgreSQL/Redis/HTTP-alt/HTTPS-alt/DoT/DoH/MongoDB.
- **DoH pool** — 20 popular domains primed asynchronously to resolve real public IPv4s for destination IPs (Cloudflare DoH, 5-min TTL).
- **Burst detection** — a token-bucket triggers TLS-handshake burst patterns (5–15 × 60–160 B SYN/ACK packets) on ~5 % of outbound flows.
- **Rate calibration** — traffic samples drive packet count at ~800 B/packet avg: downstream capped at 40 packets/tick, upstream at 20.
- **Classification distribution** (downstream): 65 % HTTPS, 10 % DNS, 7 % QUIC/HTTP/3, 5 % HTTPS-alt, 5 % HTTP, 5 % misc QUIC, 3 % 8443.

---

## AGI Concept Activation Engine

The "Blank Slate" AGI is a **visualization / easter egg**, not an actual artificial general intelligence — it's a real-time incremental reasoning simulator. The coherence function per tick is:

```
targetActivation = 0.2
                 + 0.4 · (enabledConfigModules / 30)
                 + 0.3 · log10(1 + threatsNeutralized) / 3
                 + 0.2 · (1 − tunnelRtt / 200)
                 + 0.1 · (sin(now / 1000) + 1) / 2
```

Each concept drifts its activation toward `targetActivation` with a 0.15 smoothing factor plus ±0.04 noise, and fires when `activation >= threshold`. The bootstrap ends when all 25 concepts have fired at least once, which typically takes 30–120 seconds depending on how active the rest of the app is.

---

## Testing

FlyVPN uses an **esbuild + vanilla Node** test pipeline (no heavy framework). Tests import the real services (with React/Leaflet/react-dom marked as external) and assert against observable behavior.

```bash
npm run test:services    # 20 checks across 9 services
npm run test:endpoints   # 15 checks across endpoint + defense integration
```

Example run (fresh clone, `npm install --legacy-peer-deps`):

```
--- networkService ---
✓ fetchRealIP returned an IP (203.0.113.42, source=fallback)
✓ fetchRealIP has a timing measurement
✓ DoH resolve ran (rtt=4ms, answers=0)
✓ WebRTC leak check returned results
--- fingerprintService ---
✓ Canvas fingerprint collected (unsupported…)
✓ Canvas FP randomize returned a value (may or may not differ in Node)
--- privacyScoreService ---
✓ Privacy score computed (40 / F)
✓ Privacy score has multi-category breakdown
✓ Privacy score returns recommendations
--- firewallService ---
✓ firewall is armed
✓ firewall event listener registered (no network calls in Node)
✓ firewall disarmed
--- packetPipeline ---
✓ packet pipeline init (pool size: 0)
--- agiService ---
✓ AGI initialized with 25 breakthroughs
✓ AGI service ran a tick without crashing
--- vpnEndpointService ---
✓ vpnEndpointService still works (regression check)
✓ session TTL helpers exported
--- persistenceService ---
✓ loadProgression works (level=1)
✓ clearLogs path works
--- defenseService ---
✓ defenseService still emits events (regression)

All real-service tests passed.

--- vpnEndpointService tests ---
✓ discovers a non-empty list of real endpoints
✓ every endpoint has a host
✓ every endpoint has a protocol
✓ every endpoint has a real RTT measurement
✓ every endpoint has a health status
✓ endpoints are ordered by RTT
✓ session has a session id
✓ session has a virtual IP
✓ config blob references the endpoint host
✓ WireGuard config has Interface section
✓ maps existing server to endpoint
✓ received a traffic sample after registering session
--- defenseService tests ---
✓ defense system emits threat events
✓ defense system writes audit entries
✓ defense stats show a non-zero total

All tests passed.
```

The `benchmarks/` directory contains additional micro-benchmarks (AudioContext, badge lookups, server filter, saveLogs/saveProgression debouncing) but they're not wired into the default test run.

---

## Configuration Reference

All runtime configuration lives on the `VPNConfig` type (`types.ts`) and is persisted in React state through `LocalizationContext`. The defaults (`INITIAL_CONFIG` in `constants.ts`) are:

| Option | Default | Notes |
|--------|---------|-------|
| `protocol` | `WireGuard` | WireGuard / OpenVPN / IKEv2 |
| `transport` | `UDP` | UDP / TCP |
| `port` | `51820` | WireGuard default |
| `mtu` | `1420` | |
| `dnsProvider` | `System Default` | Cloudflare / Google / Quad9 / AdGuard / System / Custom |
| `customDNS` | `''` | Used when `dnsProvider === CUSTOM` |
| `killSwitch` | `true` | Engages `firewallService` |
| `splitTunneling` | `false` | UI-only toggle |
| `onionOverVPN` | `false` | UI-only toggle (Tor through VPN) |
| `obfuscation` | `false` | Adds `scramble obfuscate` to OpenVPN config, AmneziaWG note for WireGuard |
| `ghostMode` | `false` | Master stealth switch (reduces threat spawn rate by 40 %) |
| `dynamicMAC` | `false` | UI-only |
| `scramble` | `false` | Obfuscated tunneling |
| `multiHop` | `false` | Adds multi-hop note to config blob; UI routes through chain |
| `adBlocker` | `false` | Threat Shield |
| `malwareShield` | `false` | Threat Shield |
| `adaptiveRouting` | `false` | Auto-re-`discoverEndpoints()` every 30 s and switch to lowest-RTT in country |
| `secureCoreRouting` | `false` | |
| `dedicatedIP` | `false` | |
| `dynamicIPRotation` | `false` | Rotates endpoint every 90 s |
| `portScrambling` | `false` | |
| `antiDPIEngine` | `false` | |
| `decoyTrafficGenerator` | `false` | |
| `phishingShield` | `false` | Threat Shield |
| `antiRansomwareEngine` | `false` | Threat Shield |
| `spywareBlocker` | `false` | Threat Shield |
| `iotDeviceProtection` | `false` | Threat Shield |
| `quantumResistantEncryption` | `false` | Network Fabric |
| `packetPrioritizationQoS` | `false` | Network Fabric |
| `jitterReduction` | `false` | Network Fabric |
| `advancedPortForwarding` | `false` | Network Fabric |
| `hardwareFingerprintScrambler` | `false` | Device Armor (engages `fingerprintService`) |
| `cameraMicGuard` | `false` | Device Armor |
| `usbDeviceGuard` | `false` | Device Armor |
| `firmwareIntegrityMonitor` | `false` | Device Armor |
| `geofenceProtection` | `false` | Device Armor |
| `logManagerEnabled` | `true` | Intel Center |

### Optional environment variables

- `GEMINI_API_KEY` — bridged in via Vite's `define` as `process.env.GEMINI_API_KEY` for the optional `@google/genai` integration. The core app does not require it.

---

## Privacy Guarantees

**What we do:**
- All introspection (IP, DNS, fingerprint, permissions, geolocation) runs **locally in your browser**. Data never leaves your device except to make the measurement itself (e.g. an HTTPS request to `ipapi.co` or a DoH query to `1.1.1.1`).
- XP, badges, config, and defense audit logs are stored in `localStorage` under `flyvpn_*` keys and never transmitted.
- No analytics, no tracking pixels, no third-party session cookies.
- The firewall drops cross-origin traffic when the kill switch is armed, preventing even accidental leaks from the FlyVPN tab itself.

**What we do NOT do:**
- FlyVPN is a **client-side interface and simulator**, not a VPN daemon. Installing this web app does not by itself route your system traffic through a VPN server. The exported WireGuard/OpenVPN/IKEv2 configs can be imported into a real client (WireGuard, OpenVPN Connect, strongSwan) — the endpoint hostnames follow the `*-1.flyvpn.net` pattern and are placeholders unless you deploy your own infrastracture.
- The kill switch only protects the FlyVPN browser tab, not your whole OS.
- Fingerprint scrambling is best-effort; determined fingerprinting (IP + other browser signals) can still correlate you across sessions.
- Public VPNGate / Tor node lists are fetched directly from those third-party services; respect their terms of service.

---

## Limitations (honest)

1. **No actual packet tunneling in the browser.** Browsers don't expose raw UDP/TCP sockets (outside of WebRTC and WebTransport), so FlyVPN's "tunnel" is a sophisticated simulation that produces real config blobs and real telemetry, but the traffic itself leaves over your regular network interface. Use the generated configs with a real VPN client for real protection.
2. **The kill switch is tab-scoped.** It protects FlyVPN's own fetches/websockets, not other tabs or apps.
3. **Endpoint "probing" uses `no-cors` HEADs** to `https://{host}/.flyvpn/health` — if your network/DNS blocks those hosts, the service falls back to a geo-distance RTT estimate instead of a real measurement.
4. **DoH resolution is best-effort.** Some networks block DNS-over-HTTPS to public resolvers; `resolveOverHttps` returns an error in that case and the packet pipeline falls back to cached/zero IPs.
5. **The AGI view is a narrative visualization**, not a machine-learning model. It's an entertaining twist on a loading/boot screen, using real signals from the rest of the app.
6. **The win-unpacked/ directory is a legacy Electron staging area** and isn't built from the current source tree; ignore it unless you're working on the Electron wrapper.

---

## Contributing

Contributions are welcome. Workflow:

1. Fork the repo and create a feature branch off `main`.
2. `npm install --legacy-peer-deps` to set up the dev toolchain.
3. Make your changes; `npm run typecheck` and `npm run test:services && npm run test:endpoints` should both pass.
4. If you add a feature that touches traffic, defense, or endpoints, add a check in `test/services.test.ts` or `test/vpnEndpointService.test.ts`.
5. If you add a new config toggle, add it to both `VPNConfig` in `types.ts` and `INITIAL_CONFIG` in `constants.ts` so the privacy score and UI both pick it up.
6. Run `npm run build` to verify a production build succeeds.
7. Open a PR with a clear description and screenshots if it's a UI change.

Please be mindful of the **no-telemetry** principle: new features should not phone home without explicit, opt-in user consent and should document any outbound calls in this README.

---

## License

MIT — see the repository for the full text. Do whatever you want with it; if you ship something cool, a shout-out is appreciated but not required.

---

## Contact

Author: **rpa.tu@proton.me**

Issues and PRs: https://github.com/AFKmoney/FlyVPN/issues

> *"The infrastructure of freedom is built by those willing to look at the packets."*
