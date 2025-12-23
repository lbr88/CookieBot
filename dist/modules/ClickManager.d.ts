/**
 * Handles automatic clicking of the big cookie
 * Respects Neverclick and True Neverclick achievements
 * Original: AutoPlay.handleClicking (lines 360-384)
 */
import type { ModuleStatus } from '../types/moduleStatus';
interface ClickManagerConfig {
    clickMode: number;
}
interface ClickManagerContext {
    now: number;
    endPhase: () => boolean;
    grindingCheat: () => boolean;
}
export declare class ClickManager {
    private config;
    private context;
    constructor(config: ClickManagerConfig, context: ClickManagerContext);
    /**
     * Handle clicking - respects Neverclick/True Neverclick achievements
     * Original: AutoPlay.handleClicking (lines 360-378)
     */
    handleClicking(): void;
    /**
     * Speed clicking with multiplier (for aggressive click modes)
     * Original: AutoPlay.speedClicking (lines 380-383)
     */
    private speedClicking;
    /**
     * Get clicking status for dashboard
     */
    getStatus(): ModuleStatus;
    /**
     * Get human-readable click mode name
     */
    private getClickModeName;
}
export {};
//# sourceMappingURL=ClickManager.d.ts.map