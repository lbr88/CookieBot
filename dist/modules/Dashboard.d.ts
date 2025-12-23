/**
 * Manages UI dashboard and menu
 * Migrated from cookieAutoPlayBeta.js lines 2271-3068
 */
export declare class Dashboard {
    private config;
    private configData;
    private configDefault;
    private configPrefix;
    private dashboardCollapsed;
    private dashboardObserver;
    private resizeObserver;
    private positionTimeout;
    private actionHistory;
    private statusHistory;
    private lastStatus;
    private maxHistorySize;
    private colorTextPre;
    private colorBlue;
    constructor();
    /**
     * Initialize configuration options
     */
    private initializeConfigData;
    /**
     * Set default configuration values
     */
    private setConfigDefaults;
    /**
     * Save configuration to localStorage
     */
    private saveConfig;
    /**
     * Load configuration from localStorage
     */
    private loadConfig;
    /**
     * Restore default configuration
     */
    private restoreDefault;
    /**
     * Toggle a configuration option
     */
    private toggleConfig;
    /**
     * Increment a configuration option
     */
    private toggleConfigUp;
    /**
     * Get display text for a configuration option
     */
    private getConfigDisplay;
    /**
     * Add menu preferences to the game menu
     */
    addMenuPref(): void;
    /**
     * Set bot mode handler
     */
    private setBotMode;
    /**
     * Create the dashboard UI
     */
    createDashboard(): void;
    /**
     * Position dashboard at the bottom of the screen
     */
    private positionDashboard;
    /**
     * Toggle dashboard collapse/expand
     */
    private toggleDashboard;
    /**
     * Toggle dashboard visibility via config
     */
    private toggleDashboardConfig;
    /**
     * Update dashboard content
     */
    updateDashboard(): void;
    /**
     * Update next actions section
     */
    private updateNextActions;
    /**
     * Update progress section
     */
    private updateProgress;
    /**
     * Get achievement progress HTML
     */
    private getAchievementProgress;
    /**
     * Update activity section
     */
    private updateActivity;
    /**
     * Log an action to the activity history
     */
    logAction(action: string, details?: string): void;
    /**
     * Log a status update to the status history
     */
    logStatus(statusType: string, message: string, details?: string): void;
    /**
     * Clean the log
     */
    private cleanLog;
    /**
     * Show the log
     */
    private showLog;
    /**
     * Format time in short form (s/m/h)
     */
    private formatTimeShort;
    /**
     * Render/update the dashboard
     */
    render(): void;
    /**
     * Toggle dashboard visibility
     */
    toggle(): void;
}
//# sourceMappingURL=Dashboard.d.ts.map