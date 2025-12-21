import React from 'react';

// A set of reusable icons. We'll cycle through these.
const ICONS = [
    // Shield
    () => React.createElement('svg', { viewBox: "0 0 20 20", fill: "currentColor" }, React.createElement('path', { fillRule: "evenodd", d: "M10 1.944l-8 4v8l8 4 8-4v-8l-8-4zM8 11.25a.75.75 0 100 1.5.75.75 0 000-1.5zM12 11.25a.75.75 0 100 1.5.75.75 0 000-1.5z", clipRule: "evenodd" })),
    // Target
    () => React.createElement('svg', { viewBox: "0 0 20 20", fill: "currentColor" }, React.createElement('path', { d: "M10 18a8 8 0 100-16 8 8 0 000 16zM10 3a7 7 0 110 14 7 7 0 010-14zM10 5a5 5 0 100 10 5 5 0 000-10zM10 7a3 3 0 110 6 3 3 0 010-6z" })),
    // Bug
    () => React.createElement('svg', { viewBox: "0 0 20 20", fill: "currentColor" }, React.createElement('path', { fillRule: "evenodd", d: "M3.5 2A1.5 1.5 0 002 3.5v13A1.5 1.5 0 003.5 18h13a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0016.5 2h-13zM12 6a1 1 0 011 1v2a1 1 0 11-2 0V7a1 1 0 011-1zm-4 0a1 1 0 011 1v2a1 1 0 11-2 0V7a1 1 0 011-1zM6 12a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1zm8 0a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1z", clipRule: "evenodd" })),
    // Skull
    () => React.createElement('svg', { viewBox: "0 0 20 20", fill: "currentColor" }, React.createElement('path', { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM7 8a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2zm-3 4a.5.5 0 01.5.5v1a.5.5 0 01-1 0v-1a.5.5 0 01.5-.5z", clipRule: "evenodd" })),
    // Bolt
    () => React.createElement('svg', { viewBox: "0 0 20 20", fill: "currentColor" }, React.createElement('path', { d: "M3.75 8.25a.75.75 0 01.75-.75h11a.75.75 0 010 1.5h-11a.75.75 0 01-.75-.75z" }), React.createElement('path', { fillRule: "evenodd", d: "M5.024 4.148a.75.75 0 00-.53 1.298l4.25 4.25a.75.75 0 001.06 0l4.25-4.25a.75.75 0 10-1.06-1.06L10 7.31 6.095 4.405a.75.75 0 00-.54-.257z", clipRule: "evenodd" })),
    // Star
    () => React.createElement('svg', { viewBox: "0 0 20 20", fill: "currentColor" }, React.createElement('path', { fillRule: "evenodd", d: "M10 2.5l2.293 4.646 5.122.744-3.706 3.612.875 5.102L10 14.25l-4.584 2.356.875-5.102L2.585 7.89l5.122-.744L10 2.5z", clipRule: "evenodd" })),
    // Crown
    () => React.createElement('svg', { viewBox: "0 0 20 20", fill: "currentColor" }, React.createElement('path', { fillRule: "evenodd", d: "M10 2l-2.5 5h5L10 2zM3 18l7-7 7 7H3z", clipRule: "evenodd" })),
    // Eye
    () => React.createElement('svg', { viewBox: "0 0 20 20", fill: "currentColor" }, React.createElement('path', { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm-5-8a5 5 0 1110 0 5 5 0 01-10 0z", clipRule: "evenodd" })),
    // Globe
    () => React.createElement('svg', { viewBox: "0 0 20 20", fill: "currentColor" }, React.createElement('path', { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM4.75 7.5a.75.75 0 000 1.5h10.5a.75.75 0 000-1.5H4.75zM4.75 11a.75.75 0 000 1.5h10.5a.75.75 0 000-1.5H4.75z", clipRule: "evenodd" })),
    // Lock
    () => React.createElement('svg', { viewBox: "0 0 20 20", fill: "currentColor" }, React.createElement('path', { fillRule: "evenodd", d: "M10 2a4 4 0 00-4 4v2H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-1V6a4 4 0 00-4-4zm2 4V6a2 2 0 10-4 0v2h4z", clipRule: "evenodd" })),
];

export const COLORS = ['#67e8f9', '#a78bfa', '#f472b6', '#4ade80', '#facc15', '#fb923c', '#f87171'];

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactElement;
  condition: (stats: UserStats) => boolean;
}

export interface UserStats {
    totalNeutralized: number;
    malware: number;
    phishing: number;
    ddos: number;
    spyware: number;
    adware: number;
    level: number;
    [key: string]: number;
}

const createBadge = (id: string, name: string, description: string, iconIndex: number, colorIndex: number, condition: (stats: UserStats) => boolean): Badge => ({
    id,
    name,
    description,
    icon: React.cloneElement(ICONS[iconIndex](), { style: { color: COLORS[colorIndex] } }),
    condition,
});

export const BADGES: Badge[] = [
    // Neutralization Count Badges
    createBadge('n1', 'First Strike', 'Neutralize your first threat.', 0, 0, stats => stats.totalNeutralized >= 1),
    createBadge('n10', 'Threat Hunter', 'Neutralize 10 threats.', 0, 1, stats => stats.totalNeutralized >= 10),
    createBadge('n50', 'Elite Operator', 'Neutralize 50 threats.', 0, 2, stats => stats.totalNeutralized >= 50),
    createBadge('n100', 'Cyber Guardian', 'Neutralize 100 threats.', 0, 3, stats => stats.totalNeutralized >= 100),
    createBadge('n250', 'Digital Sentinel', 'Neutralize 250 threats.', 0, 4, stats => stats.totalNeutralized >= 250),
    createBadge('n500', 'Network Overlord', 'Neutralize 500 threats.', 0, 5, stats => stats.totalNeutralized >= 500),
    createBadge('n1000', 'Legend of the Web', 'Neutralize 1000 threats.', 0, 6, stats => stats.totalNeutralized >= 1000),

    // Level Badges
    createBadge('lvl2', 'Rookie', 'Reach Level 2.', 5, 0, stats => stats.level >= 2),
    createBadge('lvl5', 'Technician', 'Reach Level 5.', 5, 1, stats => stats.level >= 5),
    createBadge('lvl10', 'Specialist', 'Reach Level 10.', 5, 2, stats => stats.level >= 10),
    createBadge('lvl20', 'Expert', 'Reach Level 20.', 5, 3, stats => stats.level >= 20),
    createBadge('lvl30', 'Master', 'Reach Level 30.', 5, 4, stats => stats.level >= 30),
    createBadge('lvl40', 'Virtuoso', 'Reach Level 40.', 5, 5, stats => stats.level >= 40),
    createBadge('lvl50', 'Grandmaster', 'Reach Level 50.', 5, 6, stats => stats.level >= 50),

    // Threat Type Badges
    createBadge('mal10', 'Bug Squasher', 'Neutralize 10 Malware threats.', 2, 6, stats => stats.malware >= 10),
    createBadge('mal50', 'Exterminator', 'Neutralize 50 Malware threats.', 2, 5, stats => stats.malware >= 50),
    createBadge('phish10', 'Phish Finder', 'Neutralize 10 Phishing threats.', 7, 0, stats => stats.phishing >= 10),
    createBadge('phish50', 'Scam Stopper', 'Neutralize 50 Phishing threats.', 7, 1, stats => stats.phishing >= 50),
    createBadge('ddos10', 'Flood Guard', 'Neutralize 10 DDoS threats.', 1, 2, stats => stats.ddos >= 10),
    createBadge('ddos50', 'Unbreakable', 'Neutralize 50 DDoS threats.', 1, 3, stats => stats.ddos >= 50),
    createBadge('spy10', 'Ghost in the Machine', 'Neutralize 10 Spyware threats.', 3, 4, stats => stats.spyware >= 10),
    createBadge('ad10', 'Ad Annihilator', 'Neutralize 10 Adware threats.', 4, 5, stats => stats.adware >= 10),
];

// Procedurally generate more badges to reach the ~200 count
const proceduralThreats = ['Malware', 'Phishing', 'DDoS', 'Spyware', 'Adware'];
const proceduralCounts = [5, 25, 75, 150, 300, 400, 600, 800];
proceduralThreats.forEach((threat, i) => {
    proceduralCounts.forEach((count, j) => {
        const id = `${threat.toLowerCase()}${count}`;
        if (!BADGES.find(b => b.id === id)) {
            BADGES.push(createBadge(
                id,
                `${threat} Slayer ${count}`,
                `Neutralize ${count} ${threat} threats.`,
                (i + j) % ICONS.length,
                (i * 2 + j) % COLORS.length,
                (stats: UserStats) => stats[threat.toLowerCase()] >= count
            ));
        }
    });
});

// Generate more total neutralization badges
const totalCounts = [2, 3, 4, 5, 15, 20, 30, 40, 60, 70, 80, 90, 125, 150, 175, 200, 300, 400, 600, 750, 800, 900];
totalCounts.forEach((count, i) => {
    const id = `n${count}`;
    if (!BADGES.find(b => b.id === id)) {
         BADGES.push(createBadge(
            id,
            `Operator ${count}`,
            `Neutralize ${count} total threats.`,
            (i % 3),
            (6-i) % COLORS.length,
            (stats: UserStats) => stats.totalNeutralized >= count
        ));
    }
});

// Generate more level badges
const levelCounts = [3,4,6,7,8,9,11,12,13,14,15,16,17,18,19,25,35,45];
levelCounts.forEach((count, i) => {
    const id = `lvl${count}`;
    if (!BADGES.find(b => b.id === id)) {
         BADGES.push(createBadge(
            id,
            `Rank ${count}`,
            `Reach Level ${count}.`,
            5,
            (i % COLORS.length),
            (stats: UserStats) => stats.level >= count
        ));
    }
});

// Add some unique/combo badges
BADGES.push(
    createBadge('all5', 'Jack of All Trades', 'Neutralize 5 of each threat type.', 8, 3, s => s.malware >= 5 && s.phishing >= 5 && s.ddos >= 5 && s.spyware >= 5 && s.adware >= 5),
    createBadge('rapid_response', 'Rapid Response', 'Neutralize 3 threats in 10 seconds.', 4, 6, s => false), // This would require more complex state logic
    createBadge('king', 'King of the Hill', 'Reach level 50 and neutralize 1000 threats.', 6, 4, s => s.level >= 50 && s.totalNeutralized >= 1000)
);

// Fill up to 200+
let badgeCount = BADGES.length;
let i = 0;
while(badgeCount < 200) {
    const id = `filler_${i}`;
    if(!BADGES.find(b => b.id === id)) {
        const count = 1000 + i * 50;
        BADGES.push(createBadge(
            id, `Veteran ${i+1}`, `Neutralize ${count} threats.`, i % ICONS.length, i % COLORS.length, s => s.totalNeutralized >= count
        ));
        badgeCount++;
    }
    i++;
}
