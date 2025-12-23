/**
 * Handles Golden Cookies, Reindeer, and other shimmers
 * Migrated from cookieAutoPlayBeta.js "Handle Cookies and Golden Cookies" section
 */
export interface GoldenCookieConfig {
    GoldenClickMode?: number;
    CheatGolden?: number;
}
export declare class GoldenCookieHandler {
    private config;
    private cheatMax;
    private cheatMaxTime;
    private hyperActive;
    private wantAscend;
    private now;
    private logAction;
    private addActivity;
    private grindingCheat;
    constructor(config?: GoldenCookieConfig, logAction?: (action: string, details?: string) => void, addActivity?: (activity: string) => void, grindingCheat?: () => boolean);
    /**
     * Update runtime state
     */
    updateState(now: number, wantAscend: boolean): void;
    /**
     * Returns whether the bot is in hyperactive mode (frequent updates needed)
     */
    isHyperActive(): boolean;
    /**
     * Reset hyperactive flag (call at start of each cycle)
     */
    resetHyperActive(): void;
    /**
     * Main handler for golden cookies and reindeer
     * Pops first golden cookie or reindeer based on configuration
     */
    handleGoldenCookies(): void;
    /**
     * Click a shimmer and track the cookies gained
     */
    private clickShimmerWithTracking;
    /**
     * Cheat golden cookies by advancing their spawn timer
     */
    private cheatGoldenCookies;
    /**
     * Check if we're in a frenzy buff state
     */
    hasFrenzyBuff(): boolean;
    /**
     * Check if we have a specific buff active
     */
    hasBuff(buffName: string): boolean;
    /**
     * Get remaining time for a buff in seconds
     */
    getBuffTimeRemaining(buffName: string): number;
}
//# sourceMappingURL=GoldenCookieHandler.d.ts.map