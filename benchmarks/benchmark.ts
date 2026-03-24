import { fetchPublicNodes } from '../services/vpnDataService';

async function runBenchmark() {
    console.log("Starting benchmark...");

    // First call - cold cache
    const start1 = performance.now();
    try {
        await fetchPublicNodes();
        const end1 = performance.now();
        console.log(`First call (cold): ${(end1 - start1).toFixed(2)}ms`);
    } catch (e) {
        console.error("First call failed", e);
    }

    // Second call - should be cached
    const start2 = performance.now();
    try {
        await fetchPublicNodes();
        const end2 = performance.now();
        console.log(`Second call (warm): ${(end2 - start2).toFixed(2)}ms`);
    } catch (e) {
        console.error("Second call failed", e);
    }
}

runBenchmark();
