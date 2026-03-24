
let contextCount = 0;
const MAX_CONTEXTS = 6;

// Mocking window and AudioContext
class MockAudioContext {
  currentTime: number = 0;
  destination: any = {};

  constructor() {
      if (contextCount >= MAX_CONTEXTS) {
          throw new Error("DOMException: The number of AudioContexts exceeded the maximum limit.");
      }
      contextCount++;
  }

  createOscillator() {
    return {
      connect: () => {},
      frequency: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
        linearRampToValueAtTime: () => {},
      },
      type: 'sine',
      start: () => {},
      stop: () => {},
    };
  }

  createGain() {
    return {
      connect: () => {},
      gain: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      },
    };
  }

  resume() {
    return Promise.resolve();
  }

  close() {
      // In reality, garbage collection might handle this if not explicitly closed,
      // but the limit is strict in browsers until closed.
      // The current code DOES NOT call close().
  }
}

// Global mock
(global as any).window = {
  AudioContext: MockAudioContext,
};

// --- Slow Version (Current Implementation) ---
const playAlertSoundSlow = (type: 'CYBER' | 'RF' | 'LOCK') => {
    try {
        const AudioContext = (global as any).window.AudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext(); // Creates new context every time
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
    } catch (e: any) {
        // console.error(e.message);
        throw e;
    }
};

// --- Optimized Version (Proposed Fix) ---
let audioCtx: any = null;

const playAlertSoundFast = (type: 'CYBER' | 'RF' | 'LOCK') => {
    try {
        const AudioContext = (global as any).window.AudioContext;
        if (!AudioContext) return;

        if (!audioCtx) {
            audioCtx = new AudioContext();
        }

        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
    } catch (e) {
        throw e;
    }
};

// --- Benchmark ---
const ITERATIONS = 20;

console.log(`Running "Crash Test" benchmark with ${ITERATIONS} iterations (Max contexts: ${MAX_CONTEXTS})...`);

// Measure Slow
console.log("\nTesting Slow Implementation...");
try {
    for (let i = 0; i < ITERATIONS; i++) {
        process.stdout.write(`Iteration ${i + 1}: `);
        playAlertSoundSlow('RF');
        console.log("Success");
    }
} catch (e: any) {
    console.log(`\nFAILED at iteration: ${e.message}`);
}

// Reset for Fast Test
contextCount = 0;
audioCtx = null;

// Measure Fast
console.log("\nTesting Fast Implementation...");
try {
    for (let i = 0; i < ITERATIONS; i++) {
        process.stdout.write(`Iteration ${i + 1}: `);
        playAlertSoundFast('RF');
        console.log("Success");
    }
    console.log("\nPASSED: All iterations completed successfully.");
} catch (e: any) {
    console.log(`\nFAILED at iteration: ${e.message}`);
}
