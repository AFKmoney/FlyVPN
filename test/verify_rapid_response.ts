
// Verification script for Rapid Response badge logic

interface UserStats {
    totalNeutralized: number;
    malware: number;
    phishing: number;
    ddos: number;
    spyware: number;
    adware: number;
    level: number;
    neutralizationHistory: number[];
    [key: string]: number | number[];
}

// The condition function logic copied from lib/badges.ts
const rapidResponseCondition = (s: UserStats) => {
    if (!s.neutralizationHistory || s.neutralizationHistory.length < 3) return false;
    const history = s.neutralizationHistory;
    return history[history.length - 1] - history[history.length - 3] <= 10000;
};

console.log("Testing Rapid Response badge condition logic...");

// Helper to create mock stats
const createStats = (history: number[]): UserStats => ({
    totalNeutralized: history.length,
    malware: 0,
    phishing: 0,
    ddos: 0,
    spyware: 0,
    adware: 0,
    level: 1,
    neutralizationHistory: history
});

// Test Cases
const now = 100000;

const testCases = [
    {
        name: "Empty history",
        history: [],
        expected: false
    },
    {
        name: "1 threat",
        history: [now],
        expected: false
    },
    {
        name: "2 threats in 10s",
        history: [now - 5000, now],
        expected: false
    },
    {
        name: "3 threats in > 10s (e.g. 15s)",
        history: [now - 15000, now - 5000, now],
        expected: false
    },
    {
        name: "3 threats exactly in 10s",
        history: [now - 10000, now - 5000, now],
        expected: true
    },
    {
        name: "3 threats in < 10s (e.g. 5s)",
        history: [now - 5000, now - 2000, now],
        expected: true
    },
    {
        name: "4 threats, last 3 in 10s",
        history: [now - 20000, now - 5000, now - 2000, now],
        expected: true
    },
    {
        name: "4 threats, last 3 NOT in 10s (but subset is)",
        history: [now - 15000, now - 12000, now - 11000, now],
        expected: false
    }
];

let failed = false;

testCases.forEach(tc => {
    const stats = createStats(tc.history);
    const result = rapidResponseCondition(stats);
    if (result !== tc.expected) {
        console.error(`[FAIL] ${tc.name}: Expected ${tc.expected}, got ${result}`);
        failed = true;
    } else {
        console.log(`[PASS] ${tc.name}`);
    }
});

if (failed) {
    console.error("Some tests failed.");
    process.exit(1);
} else {
    console.log("All tests passed.");
    process.exit(0);
}
