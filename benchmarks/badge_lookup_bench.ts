
// benchmarks/badge_lookup_bench.ts

const runBenchmark = (badgeCount: number, unlockedCount: number, iterations: number) => {
    console.log(`\n--- Benchmark: ${badgeCount} Badges, ${unlockedCount} Unlocked (${iterations} iterations) ---`);

    // Setup Data
    const badges = Array.from({ length: badgeCount }, (_, i) => ({ id: `badge_${i}` }));
    const unlockedBadgeIds = Array.from({ length: unlockedCount }, (_, i) => `badge_${i * 2}`); // unlock every 2nd badge

    // Baseline: Array.includes
    const startBaseline = performance.now();
    for (let i = 0; i < iterations; i++) {
        let matches = 0;
        for (const badge of badges) {
            if (unlockedBadgeIds.includes(badge.id)) {
                matches++;
            }
        }
    }
    const endBaseline = performance.now();
    const baselineTime = endBaseline - startBaseline;

    // Optimized: Set lookup
    const startOptimized = performance.now();
    for (let i = 0; i < iterations; i++) {
        const unlockedSet = new Set(unlockedBadgeIds); // Construct Set once per render equivalent
        let matches = 0;
        for (const badge of badges) {
            if (unlockedSet.has(badge.id)) {
                matches++;
            }
        }
    }
    const endOptimized = performance.now();
    const optimizedTime = endOptimized - startOptimized;

    console.log(`Array.includes (Linear): ${baselineTime.toFixed(4)} ms`);
    console.log(`Set lookup (O(1)):      ${optimizedTime.toFixed(4)} ms`);
    console.log(`Improvement:             ${(baselineTime / optimizedTime).toFixed(2)}x faster`);
};

// Realistic Scenario
runBenchmark(200, 100, 10000);

// Stress Test Scenario
runBenchmark(2000, 1000, 10000);
