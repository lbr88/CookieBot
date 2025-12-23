/**
 * Handles achievement hunting (small achievements, ascension-related)
 */
import type { ModuleStatus } from '../types/moduleStatus';
export declare class AchievementHandler {
    /**
     * Handle small achievements that can be obtained through simple interactions
     */
    handleSmallAchievements(): void;
    /**
     * Undunk the cookie after getting the achievement
     */
    private undunkCookie;
    /**
     * Redeem a previously sent gift
     */
    private redeemPresent;
    /**
     * Check if we're in the end phase of achievement hunting
     */
    endPhase(): boolean;
    /**
     * Check if we're in grinding mode (hunting last 10 achievements)
     */
    grinding(): boolean;
    /**
     * Check if we should use cheats during grinding (last 8 achievements)
     */
    grindingCheat(): boolean;
    /**
     * Find the next achievement to pursue
     */
    findNextAchievement(): void;
    /**
     * Check if all achievements have been obtained
     */
    checkAllAchievementsOK(): boolean;
    /**
     * Main handler called periodically
     */
    handleAchievements(): void;
    /**
     * Get achievement handler status
     */
    getStatus(): ModuleStatus;
}
//# sourceMappingURL=AchievementHandler.d.ts.map