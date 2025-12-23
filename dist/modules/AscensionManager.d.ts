/**
 * Manages ascension decisions and heavenly upgrades
 */
import type { ModuleStatus } from '../types/moduleStatus';
interface AscensionState {
    ascendLimit: number;
    onAscend: boolean;
    loggedAchievements: {
        [key: number]: boolean;
    };
    neverclickWarn: boolean;
    resetTime: number;
}
interface AutoPlayContext {
    now: number;
    nextAchievement: number;
    wantedAchievements: number[];
    lumpHarvestAchievements: number[];
    wantAscend: boolean;
    Config: {
        HardcoreMode?: number;
        NightMode?: number;
    };
    mainActivity: string;
    activities: string;
    hyperActive: boolean;
    workingOnSpecialAchievement: boolean;
    plantPending: boolean;
    delay: number;
    finished: boolean;
    kittens: number[];
    maxBuildings: number[];
    cursors: number[];
    butterBiscuits: number[];
    expensive: number[];
    info: (message: string) => void;
    logAction: (action: string, details?: string) => void;
    logStatus: (type: string, message: string, details?: string) => void;
    addActivity: (activity: string) => void;
    setMainActivity: (activity: string) => void;
    setDeadline: (time: number) => void;
    findNextAchievement: () => void;
    endPhase: () => boolean;
    preNightMode: () => boolean;
    mustRebornAscend: () => boolean;
    assignSpirit: (slot: number, spirit: string, force: number) => void;
}
export declare class AscensionManager {
    private state;
    private context;
    constructor(context: AutoPlayContext);
    /**
     * Main handler for ascension logic
     * Checks achievements, prestige levels, and decides when to ascend
     */
    handleAscend(): void;
    /**
     * Handle heavenly upgrade purchases during ascension
     */
    handleHeavenlyUpgrades(): void;
    /**
     * Check all achievements and log newly won ones
     */
    private checkAchievements;
    /**
     * Handle when the target achievement is won
     */
    private handleAchievementWon;
    /**
     * Check for endless cycle achievement (1000 ascends)
     */
    private checkEndlessCycle;
    /**
     * Check for reincarnation achievement (100 ascends)
     */
    private checkReincarnation;
    /**
     * Check if it's time to ascend based on days in run
     */
    private checkTimeBasedAscension;
    /**
     * Check for lucky digit/number/payout heavenly upgrades
     */
    private checkLuckyUpgrades;
    /**
     * Check if we can continue with special achievement runs
     * Returns true if working on special achievement, false otherwise
     */
    private canContinue;
    /**
     * Public method to trigger ascension with a reason
     * Used by special achievement logic like runJustRight()
     */
    triggerAscend(reason: string): void;
    /**
     * Perform the actual ascension
     */
    private doAscend;
    /**
     * Handle reincarnation (after ascending)
     */
    private doReincarnate;
    /**
     * Buy all available heavenly upgrades
     */
    private buyHeavenlyUpgrades;
    /**
     * Assign a permanent upgrade slot
     */
    private assignPermanentSlot;
    /**
     * Get current ascension state (for external access)
     */
    getState(): AscensionState;
    /**
     * Get current ascension manager status
     */
    getStatus(): ModuleStatus;
}
export {};
//# sourceMappingURL=AscensionManager.d.ts.map