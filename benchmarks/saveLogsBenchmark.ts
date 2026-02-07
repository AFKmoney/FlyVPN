
// Mock React first (needed for lib/badges.ts)
(global as any).React = {
    createElement: () => ({}),
    cloneElement: () => ({}),
};

// Mock localStorage
const store: Record<string, string> = {};
const localStorageMock = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
        store[key] = value.toString();
    },
    removeItem: (key: string) => {
        delete store[key];
    },
    clear: () => {
        for (const key in store) delete store[key];
    }
};

Object.defineProperty(global, 'localStorage', {
    value: localStorageMock
});

// Mock console.error
const originalConsoleError = console.error;
console.error = () => {};

import { LogEntry } from '../types';

async function runBenchmark() {
    console.log("Starting SaveLogs Benchmark (Optimized)...");

    // Dynamic import to ensure mocks are set up first
    const { saveLogs, flushLogs } = await import('../services/geminiService');

    // Increased to 1000 items to simulate a large log history
    const logs: LogEntry[] = Array.from({ length: 1000 }, (_, i) => ({
        timestamp: Date.now() - i * 1000,
        event: `Event ${i}`,
        details: `Details for event ${i} - slightly longer string to simulate real data`
    }));

    const iterations = 1000;
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
        saveLogs([...logs]);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    const avgTime = duration / iterations;

    console.log(`\nResults:`);
    console.log(`Total Time (Loop): ${duration.toFixed(2)}ms`);
    console.log(`Average Time per Call: ${avgTime.toFixed(4)}ms`);
    console.log(`Calls per Second: ${(1000 / avgTime).toFixed(2)}`);

    // Verify data was NOT written immediately (debounce check)
    const immediateData = localStorage.getItem('flyvpn_connection_logs');
    if (!immediateData) {
        console.log(`\nVerification 1: Success. No immediate write detected (Debounce active).`);
    } else {
        console.warn(`\nVerification 1: Warning. Data found immediately. Debounce might not be working or previous run data persists.`);
    }

    // Force flush to verify data integrity
    if (flushLogs) {
        flushLogs();
        const flushedData = localStorage.getItem('flyvpn_connection_logs');
        if (flushedData) {
             const parsed = JSON.parse(flushedData);
             console.log(`\nVerification 2: Success. flushedData contains ${parsed.length} logs.`);
        } else {
             console.error(`\nVerification 2: Failed. No data found after flush.`);
        }
    } else {
        // specific to services that might not export flushLogs, wait for timeout
        console.log("Waiting for debounce timeout...");
        await new Promise(resolve => setTimeout(resolve, 2100));
        const delayedData = localStorage.getItem('flyvpn_connection_logs');
        if (delayedData) {
            const parsed = JSON.parse(delayedData);
            console.log(`\nVerification 2: Success. Delayed write contained ${parsed.length} logs.`);
        } else {
            console.error(`\nVerification 2: Failed. No data found after timeout.`);
        }
    }
}

runBenchmark().catch(err => {
    console.error("Benchmark failed:", err);
    process.exit(1);
});
