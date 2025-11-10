// XP per set: +2, per PR: +10 (enforced by UI)
// Level requirement: 10 * n^1.25, cap 100.

export const LEVEL_CAP = 100;


export function xpRequiredForLevel(n: number): number {
    if (n <= 1) return 0; // level 1 threshold baseline
    return Math.floor(10 * Math.pow(n, 1.25));
}


export function levelFromXP(xp: number): { level: number; toNext: number; atLevelXP: number } {
    let level = 1;
    for (let n = 2; n <= LEVEL_CAP; n++) {
        const req = xpRequiredForLevel(n);
        if (xp >= req) level = n; else break;
    }
    const nextLevel = Math.min(level + 1, LEVEL_CAP);
    const atLevelXP = xpRequiredForLevel(level);
    const nextReq = xpRequiredForLevel(nextLevel);
    const toNext = Math.max(0, nextReq - xp);
    return { level, toNext, atLevelXP };
}


export function xpProgress(xp: number) {
    const { level, toNext, atLevelXP } = levelFromXP(xp);
    const nextReq = xpRequiredForLevel(Math.min(level + 1, LEVEL_CAP));
    const span = Math.max(1, nextReq - atLevelXP);
    const currentInLevel = Math.max(0, xp - atLevelXP);
    return { level, fraction: Math.min(1, currentInLevel / span), current: currentInLevel, span, nextReq };
}