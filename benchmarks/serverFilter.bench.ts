
import { SERVERS } from '../constants';

// Mock translation function
const t = (key: string) => key;

const search = 'New York';
const iterations = 10000;

function benchmarkOriginal() {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    SERVERS.filter(s =>
      t(s.country).toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase())
    );
  }
  return performance.now() - start;
}

function benchmarkOptimized() {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    const searchLower = search.toLowerCase();
    SERVERS.filter(s =>
      t(s.country).toLowerCase().includes(searchLower) ||
      s.city.toLowerCase().includes(searchLower)
    );
  }
  return performance.now() - start;
}

console.log('Running benchmarks...');
const originalTime = benchmarkOriginal();
console.log(`Original: ${originalTime.toFixed(4)}ms`);

const optimizedTime = benchmarkOptimized();
console.log(`Optimized: ${optimizedTime.toFixed(4)}ms`);

console.log(`Improvement: ${(((originalTime - optimizedTime) / originalTime) * 100).toFixed(2)}%`);
