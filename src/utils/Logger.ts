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
class LoggerService {
  private static instance: LoggerService;
  private callbacks?: LoggerCallbacks;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  /**
   * Initialize logger with callbacks from AutoPlay
   * Should be called once during AutoPlay construction
   */
  initialize(callbacks: LoggerCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Log an action with optional details
   * @param action - Action description
   * @param details - Optional details (e.g., price, count)
   */
  logAction(action: string, details?: string): void {
    if (this.callbacks?.logAction) {
      this.callbacks.logAction(action, details);
    } else {
      console.log(`[Action] ${action}${details ? ': ' + details : ''}`);
    }
  }

  /**
   * Log a status update
   * @param type - Status type (e.g., 'wrinkler', 'dragon', 'ascend')
   * @param message - Status message
   */
  logStatus(type: string, message: string): void {
    if (this.callbacks?.logStatus) {
      this.callbacks.logStatus(type, message);
    } else {
      console.log(`[${type}] ${message}`);
    }
  }

  /**
   * Add an activity message to the activity log
   * @param activity - Activity description
   */
  addActivity(activity: string): void {
    if (this.callbacks?.addActivity) {
      this.callbacks.addActivity(activity);
    } else {
      console.log(`[Activity] ${activity}`);
    }
  }

  /**
   * Check if logger is initialized
   */
  isInitialized(): boolean {
    return !!this.callbacks;
  }
}

// Export singleton instance
export const Logger = LoggerService.getInstance();
