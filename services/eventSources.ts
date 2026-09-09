import { ThreatEvent } from './defenseTypes';

export type EventSourceListener = (event: ThreatEvent) => void;

/** A source of threat events. Sources own event production; the defense engine owns evaluation. */
export interface ThreatEventSource {
    start(listener: EventSourceListener): void;
    stop(): void;
}

/** Adapts an existing event factory into the common source contract. */
export class SimulationEventSource implements ThreatEventSource {
    private timer: ReturnType<typeof setInterval> | null = null;

    constructor(
        private readonly factory: () => ThreatEvent,
        private readonly intervalMs = 1500,
    ) {}

    start(listener: EventSourceListener): void {
        if (this.timer) return;
        const emit = () => listener(this.factory());
        emit();
        this.timer = setInterval(emit, this.intervalMs);
    }

    stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}

export interface ReplayEvent {
    atMs: number;
    event: ThreatEvent;
}

export interface ReplayScenario {
    id: string;
    name: string;
    events: ReplayEvent[];
}

/** Replays immutable recorded events without changing the event payloads. */
export class ReplayEventSource implements ThreatEventSource {
    private timers: ReturnType<typeof setTimeout>[] = [];
    private running = false;

    constructor(
        private readonly scenario: ReplayScenario,
        private readonly speed = 1,
    ) {}

    start(listener: EventSourceListener): void {
        if (this.running) return;
        this.running = true;
        this.timers = this.scenario.events.map(({ atMs, event }) => {
            const delay = Math.max(0, atMs) / Math.max(0.01, this.speed);
            return setTimeout(() => {
                if (this.running) listener(structuredClone(event));
            }, delay);
        });
    }

    stop(): void {
        this.running = false;
        for (const timer of this.timers) clearTimeout(timer);
        this.timers = [];
    }
}
