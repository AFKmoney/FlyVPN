import { DefenseSystem } from './defenseService';
import { ReplayEventSource, ReplayScenario } from './eventSources';
import { ThreatEvent } from './defenseTypes';

export interface ReplayResult {
    scenarioId: string;
    eventsProcessed: number;
    decisions: Array<{
        threatId: number;
        status: ThreatEvent['status'];
        ruleApplied?: string;
        responsePlan?: ThreatEvent['responsePlan'];
    }>;
    startedAt: number;
    finishedAt: number;
}

export interface ReplayOptions {
    speed?: number;
}

/**
 * Feeds recorded scenarios through the same DefenseSystem used by the UI.
 * Replay is intentionally an orchestration layer: policy/evaluation stays in
 * DefenseSystem so simulation, replay, and future live adapters share logic.
 */
export const replayScenario = async (
    defense: DefenseSystem,
    scenario: ReplayScenario,
    options: ReplayOptions = {},
): Promise<ReplayResult> => {
    const startedAt = Date.now();
    const decisions: ReplayResult['decisions'] = [];
    let eventsProcessed = 0;

    const unsubscribe = defense.onThreat((event) => {
        decisions.push({
            threatId: event.id,
            status: event.status,
            ruleApplied: event.ruleApplied,
            responsePlan: event.responsePlan,
        });
    });

    const source = new ReplayEventSource(scenario, options.speed ?? 1);

    await new Promise<void>((resolve) => {
        if (scenario.events.length === 0) {
            resolve();
            return;
        }

        const maxAt = Math.max(...scenario.events.map(e => e.atMs));
        const timer = setTimeout(() => {
            source.stop();
            resolve();
        }, maxAt / Math.max(0.01, options.speed ?? 1) + 25);

        source.start((event) => {
            eventsProcessed += 1;
            defense.ingest(event, { immediate: true });
            if (eventsProcessed >= scenario.events.length) {
                clearTimeout(timer);
                source.stop();
                resolve();
            }
        });
    });

    unsubscribe();

    return {
        scenarioId: scenario.id,
        eventsProcessed,
        decisions,
        startedAt,
        finishedAt: Date.now(),
    };
};
