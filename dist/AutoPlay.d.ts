/**
 * Main AutoPlay class that coordinates all modules
 */
import type { AutoPlayConfig, AutoPlayState } from './types/autoplay';
export default class AutoPlay {
    static readonly version = "2.052.5";
    private config;
    private state;
    private goldenCookieHandler;
    private savingsManager;
    private purchaseManager;
    private seasonHandler;
    private sugarLumpManager;
    private wrinklerManager;
    private achievementHandler;
    private ascensionManager;
    private dragonManager;
    private dashboard;
    private nightMode;
    private pantheonManager;
    private grimoireManager;
    private gardenManager;
    private stockMarketManager;
    constructor();
    /**
     * Initialize the bot
     */
    init(): void;
    /**
     * Hook into Game.UpdateMenu to add config options to preferences menu
     */
    private setupMenuHook;
    /**
     * Main execution cycle - implements 8-phase model from original
     * Runs every 300ms via setInterval
     */
    private periodic;
    /**
     * Schedule the next periodic execution
     * Original runs at fixed 300ms interval via setInterval
     */
    private scheduleNextRun;
    /**
     * Handle clicking - respects Neverclick/True Neverclick achievements
     * Click modes: 0=off, 1=normal, 2+=aggressive
     */
    private handleClicking;
    /**
     * Speed clicking with multiplier (for aggressive click modes)
     */
    private speedClicking;
    /**
     * Unified bestBuy - compares buildings AND upgrades by payback period
     * Delegates to BuildingManager which has full CookieMonster integration
     * Original: lines 471-615 in cookieAutoPlayBeta.js
     */
    private bestBuy;
    /**
     * Check if an upgrade should be avoided
     * (Moved to BuildingManager.shouldAvoidBuy())
     */
    private avoidBuy;
    /**
     * Handle speed minigames - grimoire spells
     * Runs in high-activity phase
     */
    private handleSpeedMinigames;
    /**
     * Handle periodic minigames - garden, pantheon, stock market
     * Runs every 15 seconds
     */
    private handleMinigames;
    /**
     * Handle notes - extend lifetime of game notifications
     */
    private handleNotes;
    /**
     * Status check - calculate missing achievements/upgrades/lumps
     */
    private status;
    /**
     * Set deadline to earlier time if needed
     */
    private setDeadline;
    /**
     * Check if we're in the endgame phase
     *
     * Returns true when the next achievement is NOT in the wanted list,
     * meaning we've completed all critical path achievements.
     *
     * Original: AutoPlay.endPhase()
     */
    private endPhase;
    /**
     * Check if we're in grinding mode (working on final achievements)
     *
     * Grinding mode activates when we've completed all but the last 10 achievements.
     * During grinding, the bot:
     * - Does not sleep at night (stays active 24/7)
     * - Focuses on maximizing cookie production
     *
     * Original: AutoPlay.grinding()
     * @public - Used by NightMode to determine if bot should sleep
     */
    grinding(): boolean;
    /**
     * Check if we're in cheating/aggressive mode (working on final 5 achievements)
     *
     * Cheating mode activates when we've completed all but the last 8 achievements.
     * During cheating, the bot uses aggressive golden cookie tactics.
     *
     * Original: AutoPlay.grindingCheat()
     * @public - Used by GoldenCookieHandler for aggressive tactics
     */
    grindingCheat(): boolean;
    /**
     * Run Just Right achievement special logic
     *
     * Achievement #397 "Just Right" requires:
     * - Exactly 1 trillion (10^12) cookies baked
     * - Specific building counts (each type has 10 more than the next)
     *
     * This is a multi-phase process:
     * 1. Build up to ~100B cookies with buildings/upgrades
     * 2. Sell buildings to reach exact cookie count
     * 3. Fine-tune by clicking or buying cursors
     * 4. Ascend when exact count reached
     *
     * Original: AutoPlay.runJustRight() (lines 172-223)
     */
    private runJustRight;
    /**
     * Load configuration from localStorage
     */
    private loadConfig;
    /**
     * Save configuration to localStorage
     */
    saveConfig(): void;
    /**
     * Get default configuration
     */
    private getDefaultConfig;
    /**
     * Get default state
     */
    private getDefaultState;
    /**
     * Toggle dashboard visibility
     */
    toggleDashboard(): void;
    /**
     * Toggle night mode
     */
    toggleNightMode(): void;
    /**
     * Get current configuration (for external access)
     */
    getConfig(): AutoPlayConfig;
    /**
     * Update configuration (for external access)
     */
    updateConfig(updates: Partial<AutoPlayConfig>): void;
    /**
     * Get current state (for external access)
     */
    getState(): AutoPlayState;
}
//# sourceMappingURL=AutoPlay.d.ts.map