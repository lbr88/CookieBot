/**
 * Centralized logging system for CookieBot
 * Provides unified activity logging and status logging across all modules
 */
export interface LoggerCallbacks {
    logAction: (action: string, details?: string) => void;
    logStatus: (type: string, message: string) => void;
    addActivity: (activity: string) => void;
}
/**
 * Singleton logger instance
 * Provides centralized logging for all modules
 */
declare class LoggerService {
    private static instance;
    private callbacks?;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): LoggerService;
    /**
     * Initialize logger with callbacks from AutoPlay
     * Should be called once during AutoPlay construction
     */
    initialize(callbacks: LoggerCallbacks): void;
    /**
     * Log an action with optional details
     * @param action - Action description
     * @param details - Optional details (e.g., price, count)
     */
    logAction(action: string, details?: string): void;
    /**
     * Log a status update
     * @param type - Status type (e.g., 'wrinkler', 'dragon', 'ascend')
     * @param message - Status message
     */
    logStatus(type: string, message: string): void;
    /**
     * Add an activity message to the activity log
     * @param activity - Activity description
     */
    addActivity(activity: string): void;
    /**
     * Check if logger is initialized
     */
    isInitialized(): boolean;
}
export declare const Logger: LoggerService;
export {};
//# sourceMappingURL=Logger.d.ts.map