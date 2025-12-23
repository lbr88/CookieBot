/**
 * Handles night mode behavior - reduces bot activity during nighttime hours
 * Night mode makes the bot "sleep" between 11pm-7am to simulate human-like behavior
 *
 * Original logic from cookieAutoPlayBeta.js:
 * - Mode 0: OFF (never sleep)
 * - Mode 1: AUTO (sleep unless grinding)
 * - Mode 2: ON (always sleep during night)
 *
 * Night hours: 11pm (23:00) to 7am (07:00)
 * Active hours: 7am to 11pm
 */
interface NightModeConfig {
    nightMode: number;
}
interface NightModeContext {
    getNightMode: () => number;
}
export declare class NightMode {
    private isNight;
    private config;
    private context;
    private addActivity?;
    private useLumpCallback?;
    private grindinCheckCallback?;
    private handleGoldenCookiesCallback?;
    private pantheonManager?;
    private stockMarketManager?;
    /**
     * Constructor - expects config object and context with live getter
     * @param config NightModeConfig for accessing night mode settings
     * @param context Context with live config getter
     */
    constructor(config: NightModeConfig, context: NightModeContext);
    /**
     * Get current night mode (from live config or context getter)
     */
    private getNightMode;
    /**
     * Set callback for activity logging
     */
    setAddActivityCallback(callback: (msg: string) => void): void;
    /**
     * Set callback for using sugar lumps
     */
    setUseLumpCallback(callback: () => void): void;
    /**
     * Set callback for checking if grinding
     */
    setGrindingCheckCallback(callback: () => boolean): void;
    /**
     * Set callback for handling golden cookies
     */
    setHandleGoldenCookiesCallback(callback: () => void): void;
    /**
     * Set pantheon manager reference
     */
    setPantheonManager(pantheonManager: any): void;
    /**
     * Set stock market manager reference
     */
    setStockMarketManager(stockMarketManager: any): void;
    /**
     * Log activity message
     */
    private logActivity;
    /**
     * Check if it's currently nighttime (after 10pm)
     * Used for pre-night preparation activities
     */
    isPreNightMode(): boolean;
    /**
     * Main night mode logic - determines if bot should be active or sleeping
     * Mirrors original AutoPlay.nightMode() function
     * @returns true if bot should sleep, false if bot should be active
     */
    checkNightMode(): boolean;
    /**
     * Prepare bot for nighttime - activate night features
     */
    private prepareForNight;
    /**
     * Wake up from night mode
     */
    private onWakeUp;
    /**
     * Deactivate night features when day starts
     */
    private deactivateNightFeatures;
    /**
     * Freeze/unfreeze garden during night
     */
    private activateNightAtGarden;
    /**
     * Get current CPS multiplier from active buffs
     * Simplified version - would need full buff calculation from Game.buffs
     */
    private getCurrentCpsMultiplier;
    /**
     * Check if currently sleeping
     */
    isCurrentlySleeping(): boolean;
    /**
     * Toggle night mode
     * Note: This method is deprecated - config should be changed via AutoPlay.Config
     */
    toggle(): void;
    /**
     * Get status for dashboard display
     */
    getStatus(): any;
}
export {};
//# sourceMappingURL=NightMode.d.ts.map