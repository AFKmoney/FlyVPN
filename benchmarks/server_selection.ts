
import { SERVERS } from '../constants';
import { performance } from 'perf_hooks';

// Mock server for testing if needed, but we use real ones
const iterations = 100000;

function currentImplementation() {
  return [...SERVERS].sort((a, b) => (a.latency ?? Infinity) - (b.latency ?? Infinity))[0];
}

function optimizedImplementation() {
  if (SERVERS.length === 0) return undefined;
  let minServer = SERVERS[0];
  let minLatency = minServer.latency ?? Infinity;

  for (let i = 1; i < SERVERS.length; i++) {
    const server = SERVERS[i];
    const latency = server.latency ?? Infinity;
    if (latency < minLatency) {
      minLatency = latency;
      minServer = server;
    }
  }
  return minServer;
}

console.log(`Running benchmark with ${iterations} iterations...`);

const startCurrent = performance.now();
for (let i = 0; i < iterations; i++) {
  currentImplementation();
}
const endCurrent = performance.now();
const timeCurrent = endCurrent - startCurrent;

const startOptimized = performance.now();
for (let i = 0; i < iterations; i++) {
  optimizedImplementation();
}
const endOptimized = performance.now();
const timeOptimized = endOptimized - startOptimized;

console.log(`Current Implementation: ${timeCurrent.toFixed(2)}ms`);
console.log(`Optimized Implementation: ${timeOptimized.toFixed(2)}ms`);
console.log(`Improvement: ${(timeCurrent / timeOptimized).toFixed(2)}x faster`);

// Verify correctness
const resultCurrent = currentImplementation();
const resultOptimized = optimizedImplementation();

if (resultCurrent?.id !== resultOptimized?.id) {
  console.error('Mismatch! Current:', resultCurrent?.id, 'Optimized:', resultOptimized?.id);
  process.exit(1);
} else {
  console.log('Verification: Results match.');
}
