/**
 * Manages cookie savings and reserves (Lucky, Lucky Frenzy)
 *
 * This module handles the calculation of savings goals based on different strategies:
 * - NONE (0): No savings
 * - AUTO (1): Automatically ramp up savings over time
 * - LUCKY (2): Save for Lucky golden cookie (100 minutes of CPS)
 * - LUCKY_FRENZY (3): Save for Lucky Frenzy (700 minutes of CPS)
 */
interface SavingsManagerConfig {
    SavingStrategy: number;
}
interface SavingsManagerContext {
    getSavingStrategy: () => number;
}
export declare class SavingsManager {
    private savingsGoal;
    private savingsStart;
    private config;
    private context;
    private now;
    private logStatus;
    private readonly START_TIME;
    private readonly TARGET_TIME;
    private readonly LUCKY_MULTIPLIER;
    private readonly FRENZY_MULTIPLIER;
    constructor(config: SavingsManagerConfig, context: SavingsManagerContext, logStatus?: (type: string, message: string) => void);
    /**
     * Get current saving strategy (from live config or context getter)
     */
    private getSavingStrategy;
    /**
     * Initialize savings tracking (called on ascension)
     */
    initializeSavings(currentTime: number): void;
    /**
     * Update current time (called each game loop)
     */
    setCurrentTime(currentTime: number): void;
    /**
     * Main savings calculation logic
     * Migrated from AutoPlay.handleSavings (line 388-448 in cookieAutoPlayBeta.js)
     */
    handleSavings(): void;
    /**
     * Get the current savings goal
     */
    getSavingsGoal(): number;
    /**
     * Get the reserve for Lucky cookie (100 minutes of CPS)
     */
    getLuckyReserve(): number;
    /**
     * Get the reserve for Lucky Frenzy (700 minutes of CPS)
     */
    getLuckyFrenzyReserve(): number;
    /**
     * Get available cookies after accounting for savings
     */
    getAvailableCookies(): number;
    /**
     * Check if we have enough cookies for a purchase (accounting for savings)
     */
    canAfford(price: number): boolean;
    /**
     * Get status for dashboard display
     */
    getStatus(): any;
}
export {};
//# sourceMappingURL=SavingsManager.d.ts.map