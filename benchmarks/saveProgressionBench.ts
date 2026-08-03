import { saveProgression } from '../services/persistenceService';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  let setItemCallCount = 0;

  return {
    getItem(key: string) {
      return store[key] || null;
    },
    setItem(key: string, value: string) {
      store[key] = value.toString();
      setItemCallCount++;
      // Simulate some cost because localStorage is synchronous and slow-ish
      for(let i = 0; i < 10000; i++) {}
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      store = {};
      setItemCallCount = 0;
    },
    get callCount() {
        return setItemCallCount;
    }
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock console.error to keep output clean
const originalConsoleError = console.error;
console.error = () => {};

const runBenchmark = async () => {
    localStorageMock.clear();
    const iterations = 1000;

    console.log(`Starting benchmark: ${iterations} iterations of saveProgression`);

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
        saveProgression({
            level: i,
            xp: i * 100,
            stats: {
                level: i,
                totalNeutralized: i,
                malware: i,
                phishing: i,
                ddos: i,
                spyware: i,
                adware: i
            },
            badges: [`badge_${i}`]
        });
    }
    const end = performance.now();

    console.log(`Total time: ${(end - start).toFixed(2)}ms`);
    console.log(`localStorage.setItem calls: ${localStorageMock.callCount}`);

    // Check if we saved the last one correctly (basic verification)
    const savedLevel = localStorage.getItem('flyvpn_level');
    console.log(`Final saved level: ${savedLevel}`);

    // Wait a bit to ensure debounced calls (if any) are processed
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Final localStorage.setItem calls (after wait): ${localStorageMock.callCount}`);
};

runBenchmark().catch(err => {
    originalConsoleError(err);
    process.exit(1);
});
