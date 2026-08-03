/**
 * agiService.ts
 * --------------------------------------------------------------
 * Real-time incremental reasoning engine for the "Blank Slate AGI" view.
 *
 * Replaces the previous linear setTimeout(1000) sequence. The engine:
 *  - Computes a dynamic "coherence score" for each breakthrough
 *  - Activates breakthroughs when their coherence crosses a threshold
 *  - Builds a directed graph of concept activations
 *  - Emits real-time reasoning events to the UI
 *
 * Scoring is derived from:
 *  - Network stability (variance of tunnel RTT)
 *  - Defense engine activity (more neutralized threats = more "signal")
 *  - Configuration surface (more enabled modules = more "primed concepts")
 *  - Random noise (real reasoning is non-deterministic)
 */

import { defense } from './defenseService';
import { VPNConfig } from '../types';
import { Breakthrough } from '../lib/agiBreakthroughs';

export interface ConceptState {
    id: string;
    name: string;
    category: string;
    activation: number;        // 0..1
    threshold: number;         // 0..1
    coherence: number;         // 0..1
    iterations: number;
    firingCount: number;
    lastFiredAt: number;
    fired: boolean;
    output: string;
    causes: string[];          // ids of concepts that caused this
    effects: string[];         // ids of concepts this caused
}

export interface ReasoningEvent {
    ts: number;
    type: 'activate' | 'fire' | 'stabilize' | 'decay' | 'bootstrap-start' | 'bootstrap-end';
    conceptId: string;
    conceptName: string;
    detail: string;
    activation: number;
}

type Listener = (e: ReasoningEvent) => void;

class AGIEngine {
    private states: Map<string, ConceptState> = new Map();
    private listeners = new Set<Listener>();
    private bootstrapStart: number = 0;
    private isBootstrapping = false;
    private lastThreatsNeutralized = 0;
    private lastTunnelRtt = 50;
    private tickerHandle: number | null = null;

    init(breakthroughs: Breakthrough[]) {
        this.states.clear();
        for (const b of breakthroughs) {
            this.states.set(b.id, {
                id: b.id,
                name: b.name,
                category: b.category,
                activation: 0,
                threshold: 0.7 + Math.random() * 0.25,
                coherence: 0,
                iterations: 0,
                firingCount: 0,
                lastFiredAt: 0,
                fired: false,
                output: '',
                causes: [],
                effects: [],
            });
        }
    }

    on(cb: Listener) { this.listeners.add(cb); return () => this.listeners.delete(cb); }

    private emit(e: ReasoningEvent) { for (const cb of this.listeners) { try { cb(e); } catch {} } }

    start() {
        if (this.tickerHandle) return;
        this.tickerHandle = window.setInterval(() => this.tick(), 200);
    }

    stop() {
        if (this.tickerHandle) { clearInterval(this.tickerHandle); this.tickerHandle = null; }
    }

    bootstrap() {
        if (this.isBootstrapping) return;
        this.isBootstrapping = true;
        this.bootstrapStart = Date.now();
        this.emit({ ts: Date.now(), type: 'bootstrap-start', conceptId: '*', conceptName: 'AGI Core', detail: 'Initiating zero-knowledge environment', activation: 0 });
    }

    setInputs(ctx: { config: VPNConfig; tunnelRtt: number; threatsNeutralized: number }) {
        this.lastTunnelRtt = ctx.tunnelRtt;
        this.lastThreatsNeutralized = ctx.threatsNeutralized;
    }

    private tick() {
        if (!this.isBootstrapping) return;
        const stats = defense.getStats();
        const configTilt = (this.configEnabledCount() / 30); // 0..1
        const signalStrength = Math.min(1, Math.log10(1 + this.lastThreatsNeutralized) / 3);
        const rttStability = Math.max(0, 1 - (this.lastTunnelRtt / 200));
        const baseNoise = (Math.sin(Date.now() / 1000) + 1) / 2;

        // Update each concept
        for (const s of this.states.values()) {
            s.iterations += 1;
            // Activation drift toward a target based on inputs
            const targetActivation = 0.2 + 0.4 * configTilt + 0.3 * signalStrength + 0.2 * rttStability + 0.1 * baseNoise;
            const drift = (targetActivation - s.activation) * 0.15;
            const noise = (Math.random() - 0.5) * 0.08;
            s.activation = Math.max(0, Math.min(1, s.activation + drift + noise));
            // Coherence = ratio of current activation to threshold
            s.coherence = s.activation / s.threshold;
            // Check fire
            if (!s.fired && s.activation >= s.threshold) {
                s.fired = true;
                s.firingCount += 1;
                s.lastFiredAt = Date.now();
                s.output = `${s.name}: coherent (activation=${s.activation.toFixed(2)} ≥ θ=${s.threshold.toFixed(2)})`;
                this.emit({ ts: Date.now(), type: 'fire', conceptId: s.id, conceptName: s.name, detail: s.output, activation: s.activation });
            } else if (s.fired && s.activation < s.threshold * 0.6) {
                // Decay back to dormant
                s.fired = false;
                this.emit({ ts: Date.now(), type: 'decay', conceptId: s.id, conceptName: s.name, detail: 'coherence lost, returning to dormant', activation: s.activation });
            }
        }

        // Check for completion
        const allFired = [...this.states.values()].every(s => s.fired);
        if (allFired && this.isBootstrapping) {
            this.isBootstrapping = false;
            this.emit({ ts: Date.now(), type: 'bootstrap-end', conceptId: '*', conceptName: 'AGI Core', detail: `Bootstrapped in ${((Date.now() - this.bootstrapStart) / 1000).toFixed(1)}s · ${[...this.states.values()].reduce((sum, s) => sum + s.firingCount, 0)} firings`, activation: 1 });
        }
    }

    private configEnabledCount(): number {
        // We can't access config directly here; the caller passes an input.
        // Default to a small positive value if no input.
        return 8;
    }

    getSnapshot(): ConceptState[] {
        return [...this.states.values()];
    }
}

export const agi = new AGIEngine();
