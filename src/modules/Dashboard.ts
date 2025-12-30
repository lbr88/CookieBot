import type {
  Config,
  ActionHistoryEntry,
  StatusHistoryEntry,
  ActivityEntry,
  AutoPlayContext
} from '../types/autoplay';
import type { ModuleStatuses } from '../types/moduleStatus';
import type { ConfigManager } from './ConfigManager';

declare const Game: any;
declare const Beautify: (num: number) => string;
declare const CookieMonsterData: any;

export class Dashboard {
  private context: AutoPlayContext;
  private configManager: ConfigManager;

  // Dashboard state
  private dashboardCollapsed = false;
  private dashboardObserver: MutationObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private positionTimeout: number | null = null;
  private lastRenderTime = 0;
  private renderInterval = 100; // Min ms between renders (approx 10fps)

  // Activity tracking
  private actionHistory: ActionHistoryEntry[] = [];
  private statusHistory: StatusHistoryEntry[] = [];
  private lastStatus: { [key: string]: string } = {};
  private maxHistorySize = 20;



  constructor(context: AutoPlayContext, configManager: ConfigManager) {
    this.context = context;
    this.configManager = configManager;

    // Register options
    this.configManager.registerOption('ShowDashboard', {
      options: [
        { value: 0, label: 'HIDE' },
        { value: 1, label: 'SHOW' }
      ],
      label: ['HIDE', 'SHOW'], // Legacy support
      desc: 'Toggle dashboard visibility'
    }, 1, 'Display');

    this.configManager.registerOption('CleanLog', {
      options: [
        { value: 0, label: 'Clean Log' }
      ],
      label: ['Clean Log'], // Legacy support
      desc: 'Cleaning the log'
    }, 0, 'Logging');

    this.configManager.registerOption('ShowLog', {
      options: [
        { value: 0, label: 'Show Log' }
      ],
      label: ['Show Log'], // Legacy support
      desc: 'Showing the log'
    }, 0, 'Logging');

    this.configManager.registerOption('ConsoleLog', {
      options: [
        { value: 0, label: 'OFF' },
        { value: 1, label: 'ON' }
      ],
      label: ['OFF', 'ON'], // Legacy support
      desc: 'Log activity to browser console'
    }, 0, 'Logging');

    this.configManager.onDashboardToggle = () => {
      setTimeout(() => {
        this.positionDashboard();
      }, 0);
    };
  }

  /**
   * Get the current config object (for AutoPlay.Config sync)
   */
  getConfig(): Config {
    return this.configManager.getConfig();
  }

  /**
   * Add menu preferences to the game menu
   */
  addMenuPref(): void {
    this.configManager.addMenuPref();
  }

  /**
   * Create the dashboard UI
   */
  createDashboard(): void {
    // Create container
    const dashboard = document.createElement('div');
    dashboard.id = 'cookieBotDashboard';

    // Create header with toggle button and next update timer
    const header = document.createElement('div');
    header.style.cssText = 'padding: 8px 16px; background: rgba(0, 100, 0, 0.3); cursor: pointer; display: flex; justify-content: space-between; align-items: center;';
    header.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 2px;">
        <span style="color: #6f6; font-size: 14px; font-weight: bold;">CookieBot Dashboard</span>
        <span id="dashboardNextUpdate" style="color: #9cf; font-size: 10px; opacity: 0.8;">Next update: checking...</span>
      </div>
      <span id="dashboardToggle" style="color: #6f6; font-size: 12px;">▼ Collapse</span>
    `;

    // Create content area - flexible grid for modules + activity column
    const content = document.createElement('div');
    content.id = 'dashboardContent';
    content.style.cssText = 'display: flex; padding: 12px; gap: 16px; max-height: 350px; overflow-y: auto;';

    // Left 2/3: Flexible grid of all modules | Right 1/3: Recent Activity
    content.innerHTML = `
      <div id="dashModulesGrid" style="flex: 2; min-width: 400px; display: flex; flex-direction: column; gap: 12px;">
        <div id="dashModulesContent" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; color: #fff; font-size: 11px; line-height: 1.5;">Loading...</div>
      </div>
      <div id="dashActivity" style="flex: 1; min-width: 240px;">
        <div style="color: #6f6; font-size: 13px; margin-bottom: 8px; font-weight: bold;">📋 Recent Activity</div>
        <div id="dashActivityContent" style="color: #fff; font-size: 11px; line-height: 1.4; max-height: 300px; overflow-y: auto;">No activity yet...</div>
      </div>
    `;

    // Add toggle functionality
    header.onclick = () => this.toggleDashboard();

    dashboard.appendChild(header);
    dashboard.appendChild(content);

    // Append to wrapper element
    const wrapper = document.getElementById('wrapper');
    if (wrapper) {
      wrapper.appendChild(dashboard);
    } else {
      document.body.appendChild(dashboard);
    }

    // Calculate bottom offset based on other bottom bars
    // Defer initial positioning to ensure DOM is fully settled
    setTimeout(() => {
      this.positionDashboard();
    }, 100);

    // Watch for new elements being added to wrapper (like Cookie Monster loading later)
    if (wrapper && typeof MutationObserver !== 'undefined') {
      this.dashboardObserver = new MutationObserver(() => {
        // Debounce to avoid multiple rapid calls
        if (this.positionTimeout) {
          clearTimeout(this.positionTimeout);
        }
        this.positionTimeout = window.setTimeout(() => {
          this.positionDashboard();
        }, 50);
      });
      this.dashboardObserver.observe(wrapper, { childList: true });
    }

    // Apply config setting for visibility
    if (this.configManager.getConfig().ShowDashboard === 0) {
      dashboard.style.display = 'none';
    }
  }

  /**
   * Position dashboard at the bottom of the screen
   */
  private positionDashboard(): void {
    const dashboard = document.getElementById('cookieBotDashboard');
    if (!dashboard) return;

    const wrapper = document.getElementById('wrapper');
    if (!wrapper) return;

    // Find all other bottom-positioned elements in the wrapper
    let bottomOffset = 0;
    const children = wrapper.children;

    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      if (child.id !== 'cookieBotDashboard') {
        const style = window.getComputedStyle(child);
        // Check if element is absolutely positioned at the bottom
        if (style.position === 'absolute' && style.bottom === '0px') {
          const height = child.offsetHeight;
          if (height > 0) {
            bottomOffset += height;

            // Watch this element for size changes
            if (typeof ResizeObserver !== 'undefined' && !child.hasAttribute('data-cookiebot-watched')) {
              child.setAttribute('data-cookiebot-watched', 'true');
              if (!this.resizeObserver) {
                this.resizeObserver = new ResizeObserver(() => {
                  this.positionDashboard();
                });
              }
              this.resizeObserver.observe(child);
            }
          }
        }
      }
    }

    // Apply positioning without wiping other styles
    dashboard.style.position = 'absolute';
    dashboard.style.bottom = `${bottomOffset}px`;
    dashboard.style.left = '0';
    dashboard.style.right = '0';
    dashboard.style.background = 'rgba(0, 0, 0, 0.9)';
    dashboard.style.borderTop = '2px solid #6f6';
    dashboard.style.zIndex = '10000';

    // Temporarily ensure dashboard is visible to measure height accurately
    const wasHidden = dashboard.style.display === 'none';
    if (wasHidden) {
      dashboard.style.display = 'block';
    }

    // Force reflow to ensure accurate measurement
    void dashboard.offsetHeight;

    // Get dashboard height (includes header + content if expanded, or just header if collapsed)
    const dashboardHeight = dashboard.offsetHeight;

    // Update #game div's bottom to account for all bottom bars including ours
    const game = document.getElementById('game');
    if (game) {
      const totalBottomHeight = bottomOffset + dashboardHeight;
      game.style.bottom = `${totalBottomHeight}px`;
    }

    // Hide dashboard if config says to
    if (this.configManager.getConfig().ShowDashboard === 0) {
      dashboard.style.display = 'none';
    }
  }

  /**
   * Toggle dashboard collapse/expand
   */
  private toggleDashboard(): void {
    const content = document.getElementById('dashboardContent');
    const toggle = document.getElementById('dashboardToggle');

    this.dashboardCollapsed = !this.dashboardCollapsed;

    if (this.dashboardCollapsed) {
      if (content) content.style.display = 'none';
      if (toggle) toggle.textContent = '▲ Expand';
    } else {
      if (content) content.style.display = 'flex';
      if (toggle) toggle.textContent = '▼ Collapse';
    }

    // Reposition to account for height change
    setTimeout(() => {
      this.positionDashboard();
    }, 0);
  }



  /**
   * Update dashboard content
   */
  updateDashboard(): void {
    if (!document.getElementById('cookieBotDashboard')) {
      return;
    }

    try {
      // Check if context is available
      if (!this.context) {
        return;
      }

      this.updateNextUpdateTimer();
      this.updateModuleColumns();
      this.updateActivity();
    } catch (e) {
      console.error('Dashboard update error:', e);
    }
  }

  /**
   * Update the "next update" timer in the header
   */
  private updateNextUpdateTimer(): void {
    const timerElement = document.getElementById('dashboardNextUpdate');
    if (!timerElement) return;

    try {
      let text = '';
      let color = '#9cf';

      // Check if AutoPlay has a deadline
      if (this.context && this.context.deadline) {
        const now = Date.now();
        const timeUntilUpdate = this.context.deadline - now;

        if (timeUntilUpdate > 0) {
          text = `Next update: ${this.formatTimeRemaining(timeUntilUpdate)}`;
        } else {
          text = 'Next update: now';
          color = '#6f6';
        }
      } else {
        text = 'Next update: continuous';
      }

      // Add tick stats if available
      if (this.context && typeof this.context.lastTickDuration === 'number') {
        const last = this.context.lastTickDuration.toFixed(1);
        const avg = this.context.avgTickDuration.toFixed(1);
        text += ` | Tick: ${last}ms (Avg: ${avg}ms)`;
      }

      timerElement.textContent = text;
      timerElement.style.color = color;
    } catch (e) {
      timerElement.textContent = 'Next update: unknown';
      timerElement.style.color = '#888';
    }
  }


  /**
   * Helper to create a progress bar HTML
   */
  private createProgressBar(percent: number, color: string = '#6f6'): string {
    const clampedPercent = Math.min(100, Math.max(0, percent));
    return `<div style="width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; margin-top: 4px;">
      <div style="width: ${clampedPercent}%; height: 100%; background: ${color}; transition: width 0.3s;"></div>
    </div>`;
  }

  /**
   * Helper to format time remaining
   */
  private formatTimeRemaining(ms: number): string {
    if (ms < 0) return 'Ready';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${minutes % 60}m`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }

  /**
   * Update both module columns (active and waiting/idle)
   */
  private updateModuleColumns(): void {
    // Safety check for context
    if (!this.context) {
      const modulesContent = document.getElementById('dashModulesContent');
      if (modulesContent) modulesContent.innerHTML = '<div style="color: #f66; grid-column: 1 / -1;">AutoPlay not initialized...</div>';
      return;
    }

    try {
      // Collect statuses from all managers
      const statuses: ModuleStatuses = {};

      // Get status from click manager
      if (this.context.clickManager && typeof this.context.clickManager.getStatus === 'function') {
        statuses.clicking = this.context.clickManager.getStatus();
      }

      // Get statuses from purchase manager (buildings and upgrades separately)
      if (this.context.purchaseManager) {
        if (typeof this.context.purchaseManager.getBuildingStatus === 'function') {
          statuses.buildings = this.context.purchaseManager.getBuildingStatus();
        }
        if (typeof this.context.purchaseManager.getUpgradeStatus === 'function') {
          statuses.upgrades = this.context.purchaseManager.getUpgradeStatus();
        }
      }
      if (this.context.gardenManager && typeof this.context.gardenManager.getStatus === 'function') {
        statuses.garden = this.context.gardenManager.getStatus();
      }
      if (this.context.wrinklerManager && typeof this.context.wrinklerManager.getStatus === 'function') {
        statuses.wrinklers = this.context.wrinklerManager.getStatus();
      }
      if (this.context.goldenCookieHandler && typeof this.context.goldenCookieHandler.getStatus === 'function') {
        statuses.goldenCookies = this.context.goldenCookieHandler.getStatus();
      }
      if (this.context.dragonManager && typeof this.context.dragonManager.getStatus === 'function') {
        statuses.dragon = this.context.dragonManager.getStatus();
      }
      if (this.context.pantheonManager && typeof this.context.pantheonManager.getStatus === 'function') {
        statuses.pantheon = this.context.pantheonManager.getStatus();
      }
      if (this.context.grimoireManager && typeof this.context.grimoireManager.getStatus === 'function') {
        statuses.grimoire = this.context.grimoireManager.getStatus();
      }
      if (this.context.stockMarketManager && typeof this.context.stockMarketManager.getStatus === 'function') {
        statuses.stockMarket = this.context.stockMarketManager.getStatus();
      }
      if (this.context.sugarLumpManager && typeof this.context.sugarLumpManager.getStatus === 'function') {
        statuses.sugarLumps = this.context.sugarLumpManager.getStatus();
      }
      if (this.context.ascensionManager && typeof this.context.ascensionManager.getStatus === 'function') {
        statuses.ascension = this.context.ascensionManager.getStatus();
      }
      if (this.context.seasonHandler && typeof this.context.seasonHandler.getStatus === 'function') {
        statuses.season = this.context.seasonHandler.getStatus();
      }
      if (this.context.achievementHandler && typeof this.context.achievementHandler.getStatus === 'function') {
        statuses.achievements = this.context.achievementHandler.getStatus();
      }
      if (this.context.savingsManager && typeof this.context.savingsManager.getStatus === 'function') {
        statuses.savings = this.context.savingsManager.getStatus();
      }
      if (this.context.nightMode && typeof this.context.nightMode.getStatus === 'function') {
        statuses.nightMode = this.context.nightMode.getStatus();
      }

      // Render module statuses
      const moduleOrder: (keyof ModuleStatuses)[] = [
        'achievements',
        'ascension',
        'clicking',
        'buildings',
        'upgrades',
        'goldenCookies',
        'savings',
        'garden',
        'wrinklers',
        'dragon',
        'pantheon',
        'grimoire',
        'stockMarket',
        'sugarLumps',
        'season',
        'nightMode'
      ];

      // Map status to colors
      const statusColors = {
        'idle': '#888',
        'active': '#6f6',
        'waiting': '#fc6',
        'blocked': '#f66',
        'disabled': '#666',
        'error': '#f00'
      };

      // Collect all modules in persistent order
      const allModules: Array<{ key: keyof ModuleStatuses; status: any }> = [];

      for (const key of moduleOrder) {
        const status = statuses[key];
        if (!status) continue;

        allModules.push({ key, status });
      }

      // Helper function to render a module card
      const renderModuleCard = (key: string, status: any): string => {
        const color = statusColors[status.status as keyof typeof statusColors] || '#ccc';
        const icon = status.icon || '📦';

        // Get timing
        const timingKeyMap: { [key: string]: string } = {
          'clicking': 'ClickManager',
          'buildings': 'PurchaseManager',
          'upgrades': 'PurchaseManager',
          'garden': 'GardenManager',
          'wrinklers': 'WrinklerManager',
          'goldenCookies': 'GoldenCookieHandler',
          'dragon': 'DragonManager',
          'pantheon': 'PantheonManager',
          'grimoire': 'GrimoireManager',
          'stockMarket': 'StockMarketManager',
          'sugarLumps': 'SugarLumpManager',
          'savings': 'SavingsManager',
          'ascension': 'AscensionManager',
          'season': 'SeasonHandler',
          'achievements': 'AchievementHandler'
        };

        const timingKey = timingKeyMap[key];
        const timing = (this.context.moduleTimings && timingKey) ? this.context.moduleTimings[timingKey] : 0;
        const timingDisplay = timing > 0 ? `<span style="color: #666; font-size: 9px; margin-left: 4px;">(${timing.toFixed(2)}ms)</span>` : '';

        let cardHtml = '<div style="padding: 8px; background: rgba(255,255,255,0.03); border-left: 3px solid ' + color + '; border-radius: 4px;">';
        cardHtml += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">';
        cardHtml += '<div><span style="color: ' + color + '; font-weight: bold; font-size: 11px;">' + icon + ' ' + status.module + '</span>' + timingDisplay + '</div>';
        cardHtml += '<span style="color: ' + color + '; font-size: 9px; text-transform: uppercase; opacity: 0.8;">' + status.status + '</span>';
        cardHtml += '</div>';
        cardHtml += '<div style="color: #ccc; font-size: 10px; margin-bottom: 2px;">' + status.currentAction + '</div>';
        cardHtml += '<div style="color: #888; font-size: 9px; margin-bottom: 4px;">' + status.reason + '</div>';

        if (status.nextAction) {
          cardHtml += '<div style="color: #9cf; font-size: 9px; margin-top: 4px;">→ ' + status.nextAction + '</div>';
        }

        // Add standardized progress bar and time remaining
        if (status.progress) {
          cardHtml += '<div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 9px;">';

          const progressColor = status.progressColor || '#6f6';
          const label = status.progress.label || 'Progress';

          // Show progress with formatted values
          if (typeof Beautify !== 'undefined') {
            cardHtml += '<div style="color: #aaa; margin-top: 2px;">' + label + ': ' + Beautify(status.progress.current) + ' / ' + Beautify(status.progress.target) + '</div>';
          } else {
            cardHtml += '<div style="color: #aaa; margin-top: 2px;">' + label + ': ' + status.progress.percent.toFixed(1) + '%</div>';
          }

          // Progress bar
          cardHtml += this.createProgressBar(status.progress.percent, progressColor);

          // Time remaining
          if (status.timeRemaining) {
            cardHtml += '<div style="color: #fc6; font-size: 9px; margin-top: 2px;">⏱ ' + this.formatTimeRemaining(status.timeRemaining) + '</div>';
          }

          cardHtml += '</div>';
        }

        // Show additional details
        if (status.details && Object.keys(status.details).length > 0) {
          cardHtml += '<div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 9px;">';
          for (const [key, value] of Object.entries(status.details)) {
            if (key !== 'Price' && key !== 'Available') {
              cardHtml += '<div style="color: #888; margin-top: 1px;"><span style="color: #aaa;">' + key + ':</span> <span style="color: #ccc;">' + value + '</span></div>';
            }
          }
          cardHtml += '</div>';
        }

        cardHtml += '</div>';
        return cardHtml;
      };

      // Render all modules into a single grid
      let modulesHtml = '';
      for (const { key, status } of allModules) {
        modulesHtml += renderModuleCard(key, status);
      }

      if (modulesHtml === '') {
        modulesHtml = '<div style="color: #888; grid-column: 1 / -1;">No modules active</div>';
      }

      // Update grid
      const modulesContent = document.getElementById('dashModulesContent');
      if (modulesContent) {
        modulesContent.innerHTML = modulesHtml;
      }
    } catch (e) {
      console.error('Module status error:', e);
      const modulesContent = document.getElementById('dashModulesContent');
      if (modulesContent) modulesContent.innerHTML = '<div style="color: #f66; grid-column: 1 / -1;">Error loading module statuses</div>';
    }
  }

  /**
   * Update activity section
   */
  private updateActivity(): void {
    let activityHtml = '';
    const combinedActivity: ActivityEntry[] = [];

    // Add status entries
    if (this.statusHistory && this.statusHistory.length > 0) {
      this.statusHistory.forEach((entry) => {
        const baseType = entry.type.split(':')[0];
        let color = '#ccc';
        let icon = '📊';
        let tooltip = '';

        if (baseType === 'goal') {
          color = '#fc6';
          icon = '🎯';
          tooltip = "Bot's current goal or target (e.g., achievement, ascension, or upgrade milestone)";
        } else if (baseType === 'reserve') {
          color = '#f96';
          icon = '🍪';
          tooltip = 'Golden cookie reserve status - the bot keeps cookies saved for Lucky/Lucky Frenzy bonuses';
        } else if (baseType === 'achievement') {
          color = '#f66';
          icon = '🏆';
          tooltip = 'Achievement-related status update';
        } else if (baseType === 'mode') {
          color = '#6f6';
          icon = '⚙️';
          tooltip = 'Bot mode or behavior change';
        } else if (baseType === 'ascend') {
          color = '#f6f';
          icon = '⬆️';
          tooltip = 'Ascension-related status update';
        } else if (baseType === 'dragon') {
          color = '#c9f';
          icon = '🐉';
          tooltip = 'Dragon aura change or update';
        } else if (baseType === 'wrinkler') {
          color = '#a8a';
          icon = '🪱';
          tooltip = 'Wrinkler management status';
        }

        combinedActivity.push({
          time: entry.time,
          type: 'status',
          color,
          icon,
          tooltip,
          message: entry.message,
          details: entry.details
        });
      });
    }

    // Add action entries
    if (this.actionHistory && this.actionHistory.length > 0) {
      this.actionHistory.forEach((entry) => {
        let color = '#ccc';
        let icon = '⚡';
        if (entry.action.includes('Bought') || entry.action.includes('Upgraded')) {
          color = '#6f6';
          icon = '🛒';
        }
        if (entry.action.includes('Clicked')) {
          color = '#fc6';
          icon = '👆';
        }
        if (entry.action.includes('Ascend') || entry.action.includes('Achievement')) {
          color = '#f66';
          icon = '🏆';
        }

        combinedActivity.push({
          time: entry.time,
          type: 'action',
          color,
          icon,
          tooltip: 'Action performed by the bot',
          message: entry.action,
          details: entry.details
        });
      });
    }

    // Sort by time (newest first)
    combinedActivity.sort((a, b) => b.time.getTime() - a.time.getTime());

    // Generate HTML
    if (combinedActivity.length > 0) {
      combinedActivity.forEach((entry) => {
        const timeStr = entry.time.toLocaleTimeString();
        activityHtml += `<div style="margin-bottom: 4px; padding: 4px; background: rgba(255,255,255,0.05); border-left: 2px solid ${entry.color};" title="${entry.tooltip}"><span style="color: #888; font-size: 9px;">${timeStr}</span> <span style="color: ${entry.color};">${entry.icon} ${entry.message}</span>${entry.details ? ` <span style="color: #aaa; font-size: 10px;"> - ${entry.details}</span>` : ''}</div>`;
      });
    } else {
      activityHtml = '<div style="color: #888;">No activity yet...</div>';
    }

    const activityContent = document.getElementById('dashActivityContent');
    if (activityContent) {
      activityContent.innerHTML = activityHtml;
    }
  }

  /**
   * Log an action to the activity history
   */
  logAction(action: string, details?: string): void {
    try {
      const timestamp = new Date();
      const entry: ActionHistoryEntry = {
        time: timestamp,
        action,
        details: details || ''
      };

      this.actionHistory.unshift(entry); // Add to beginning
      if (this.actionHistory.length > this.maxHistorySize) {
        this.actionHistory.pop(); // Remove oldest
      }

      this.updateDashboard(); // Refresh display
    } catch (e) {
      console.log('Log action error:', e);
    }
  }

  /**
   * Log a status update to the status history
   */
  logStatus(statusType: string, message: string, details?: string): void {
    try {
      // Only log if status changed
      const statusKey = `${statusType}:${message}`;
      if (this.lastStatus[statusType] === statusKey) return;
      this.lastStatus[statusType] = statusKey;

      const timestamp = new Date();
      const entry: StatusHistoryEntry = {
        time: timestamp,
        type: statusType,
        message,
        details: details || ''
      };

      this.statusHistory.unshift(entry); // Add to beginning
      if (this.statusHistory.length > this.maxHistorySize) {
        this.statusHistory.pop(); // Remove oldest
      }

      this.updateDashboard(); // Refresh display
    } catch (e) {
      console.log('Log status error:', e);
    }
  }




  /**
   * Render/update the dashboard
   */
  render(): void {
    // Throttle rendering to avoid DOM thrashing
    const now = Date.now();
    if (now - this.lastRenderTime < this.renderInterval) {
      return;
    }
    this.lastRenderTime = now;

    // Check if dashboard exists, create if not
    if (!document.getElementById('cookieBotDashboard')) {
      this.createDashboard();
    }
    this.updateDashboard();
  }

  /**
   * Toggle dashboard visibility
   */
  toggle(): void {
    this.toggleDashboard();
  }
}
