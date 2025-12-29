import type {
  ConfigData,
  Config,
  ActionHistoryEntry,
  StatusHistoryEntry,
  ActivityEntry,
  AutoPlayContext
} from '../types/autoplay';
import type { ModuleStatuses } from '../types/moduleStatus';

declare const Game: any;
declare const Beautify: (num: number) => string;
declare const CookieMonsterData: any;

export class Dashboard {
  private context: AutoPlayContext;

  // Configuration system
  private config: Config = {};
  private configData: ConfigData = {};
  private configDefault: Config = {};
  private configPrefix = 'autoplayConfig';

  // Dashboard state
  private dashboardCollapsed = false;
  private dashboardObserver: MutationObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private positionTimeout: number | null = null;

  // Activity tracking
  private actionHistory: ActionHistoryEntry[] = [];
  private statusHistory: StatusHistoryEntry[] = [];
  private lastStatus: { [key: string]: string } = {};
  private maxHistorySize = 20;

  // Display utilities
  private colorTextPre = 'color: ';
  private colorBlue = '#4169E1';

  constructor(context: AutoPlayContext) {
    this.context = context;
    this.initializeConfigData();
    this.setConfigDefaults();
    this.loadConfig();
  }

  /**
   * Get the current config object (for AutoPlay.Config sync)
   */
  getConfig(): Config {
    return this.config;
  }

  /**
   * Initialize configuration options
   */
  private initializeConfigData(): void {
    this.configData.BotMode = {
      label: ['IDLE', 'AUTO', 'MANUAL'],
      desc: 'Cookiebot global mode (work in progress)'
    };
    this.configData.NightMode = {
      label: ['OFF', 'AUTO', 'ON'],
      desc: 'Handling of night mode'
    };
    this.configData.ClickMode = {
      label: ['OFF', 'AUTO', 'LIGHT SPEED', 'RIDICULOUS SPEED', 'LUDICROUS SPEED'],
      desc: 'Clicking speed'
    };
    this.configData.GoldenClickMode = {
      label: ['OFF', 'AUTO', 'ALL'],
      desc: 'Golden Cookie clicking mode'
    };
    this.configData.SavingStrategy = {
      label: ['NONE', 'AUTO', 'LUCKY', 'LUCKY FRENZY'],
      desc: 'Saving strategy'
    };
    this.configData.CheatLumps = {
      label: ['OFF', 'AUTO', 'LITTLE', 'MEDIUM', 'MUCH'],
      desc: 'Cheating of sugar lumps'
    };
    this.configData.CheatGolden = {
      label: ['OFF', 'AUTO', 'LITTLE', 'MEDIUM', 'MUCH'],
      desc: 'Cheating of golden cookies'
    };
    this.configData.ShowDashboard = {
      label: ['HIDE', 'SHOW'],
      desc: 'Toggle dashboard visibility'
    };
    this.configData.HardcoreMode = {
      label: ['SKIP', 'AUTO'],
      desc: 'Hardcore/Neverclick achievements: SKIP (ignore them) or AUTO (attempt on first run)'
    };
    this.configData.CleanLog = {
      label: ['Clean Log'],
      desc: 'Cleaning the log'
    };
    this.configData.ShowLog = {
      label: ['Show Log'],
      desc: 'Showing the log'
    };
  }

  /**
   * Set default configuration values
   */
  private setConfigDefaults(): void {
    this.configDefault = {
      BotMode: 1,
      NightMode: 1,
      ClickMode: 1,
      GoldenClickMode: 1,
      SavingStrategy: 1,
      CheatLumps: 1,
      CheatGolden: 1,
      ShowDashboard: 1,
      HardcoreMode: 1,
      CleanLog: 0,
      ShowLog: 0
    };
  }

  /**
   * Save configuration to localStorage
   */
  private saveConfig(config: Config): void {
    try {
      window.localStorage.setItem(this.configPrefix, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save config:', e);
    }
  }

  /**
   * Load configuration from localStorage
   */
  private loadConfig(): void {
    try {
      const stored = window.localStorage.getItem(this.configPrefix);
      if (stored != null) {
        this.config = JSON.parse(stored);
        // Check values
        let modified = false;
        for (const key in this.configDefault) {
          if (typeof this.config[key] === 'undefined' ||
              this.config[key] < 0 ||
              this.config[key] >= this.configData[key].label.length) {
            modified = true;
            this.config[key] = this.configDefault[key];
          }
        }
        if (modified) {
          this.saveConfig(this.config);
        }
      } else {
        // Default values
        this.restoreDefault();
      }
    } catch (e) {
      console.error('Failed to load config:', e);
    }
  }

  /**
   * Restore default configuration
   */
  private restoreDefault(): void {
    this.config = {};
    this.saveConfig(this.configDefault);
    this.loadConfig();
    if (typeof Game !== 'undefined' && Game.UpdateMenu) {
      Game.UpdateMenu();
    }
  }

  /**
   * Toggle a configuration option
   */
  private toggleConfig(configKey: string): void {
    this.toggleConfigUp(configKey);
    const element = document.getElementById(this.configPrefix + configKey);
    if (element) {
      element.className = this.config[configKey] ? 'option' : 'option off';
    }
  }

  /**
   * Increment a configuration option
   */
  private toggleConfigUp(configKey: string): void {
    this.config[configKey]++;
    if (this.config[configKey] === this.configData[configKey].label.length) {
      this.config[configKey] = 0;
    }
    const element = document.getElementById(this.configPrefix + configKey);
    if (element) {
      element.innerHTML = this.getConfigDisplay(configKey);
    }
    this.saveConfig(this.config);
  }

  /**
   * Get display text for a configuration option
   */
  private getConfigDisplay(configKey: string): string {
    return this.configData[configKey].label[this.config[configKey]];
  }

  /**
   * Add menu preferences to the game menu
   */
  addMenuPref(): void {
    const header = (text: string): HTMLElement => {
      const div = document.createElement('div');
      div.className = 'listing';
      div.style.padding = '5px 16px';
      div.style.opacity = '0.7';
      div.style.fontSize = '17px';
      div.style.fontFamily = '"Kavoon", Georgia, serif';
      div.textContent = text;
      return div;
    };

    const frag = document.createDocumentFragment();
    const div = document.createElement('div');
    div.className = `title ${this.colorTextPre}${this.colorBlue}`;
    div.textContent = 'Cookiebot Options';
    frag.appendChild(div);

    const listing = (configKey: string, clickFunc?: () => void): HTMLElement => {
      const div = document.createElement('div');
      div.className = 'listing';
      const a = document.createElement('a');
      a.className = 'option';
      if (this.config[configKey] === 0) {
        a.className = 'option off';
      }
      a.id = this.configPrefix + configKey;
      a.onclick = clickFunc || (() => this.toggleConfig(configKey));
      a.textContent = this.getConfigDisplay(configKey);
      div.appendChild(a);
      const label = document.createElement('label');
      label.textContent = this.configData[configKey].desc;
      div.appendChild(label);
      return div;
    };

    frag.appendChild(listing('BotMode', () => this.setBotMode()));
    frag.appendChild(listing('NightMode'));
    frag.appendChild(listing('ClickMode'));
    frag.appendChild(listing('GoldenClickMode'));
    frag.appendChild(listing('SavingStrategy'));
    frag.appendChild(listing('HardcoreMode'));
    frag.appendChild(header('Cheating'));
    frag.appendChild(listing('CheatLumps'));
    frag.appendChild(listing('CheatGolden'));
    frag.appendChild(header('Display'));
    frag.appendChild(listing('ShowDashboard', () => this.toggleDashboardConfig()));
    frag.appendChild(header('Logging'));
    frag.appendChild(listing('CleanLog', () => this.cleanLog()));
    frag.appendChild(listing('ShowLog', () => this.showLog()));

    const menu = document.getElementById('menu');
    if (menu && menu.childNodes[2]) {
      const menuSection = menu.childNodes[2] as HTMLElement;
      const lastChild = menuSection.childNodes[menuSection.childNodes.length - 1];
      menuSection.insertBefore(frag, lastChild);
    }
  }

  /**
   * Set bot mode handler
   */
  private setBotMode(): void {
    this.toggleConfig('BotMode');
    const modeName = this.configData.BotMode.label[this.config.BotMode];
    if (this.context && this.context.info) {
      this.context.info(`The bot has changed mode to ${modeName}`);
      this.logStatus('mode', `Mode: ${modeName}`);
    }
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
    if (this.config.ShowDashboard === 0) {
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
    if (this.config.ShowDashboard === 0) {
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
   * Toggle dashboard visibility via config
   */
  private toggleDashboardConfig(): void {
    this.toggleConfig('ShowDashboard');
    const dashboard = document.getElementById('cookieBotDashboard');
    if (dashboard) {
      dashboard.style.display = this.config.ShowDashboard ? 'block' : 'none';
      // Reposition to update game div's bottom
      setTimeout(() => {
        this.positionDashboard();
      }, 0);
    }
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
      // Check if AutoPlay has a deadline
      if (this.context && this.context.deadline) {
        const now = Date.now();
        const timeUntilUpdate = this.context.deadline - now;

        if (timeUntilUpdate > 0) {
          timerElement.textContent = `Next update: ${this.formatTimeRemaining(timeUntilUpdate)}`;
          timerElement.style.color = '#9cf';
        } else {
          timerElement.textContent = 'Next update: now';
          timerElement.style.color = '#6f6';
        }
      } else {
        timerElement.textContent = 'Next update: continuous';
        timerElement.style.color = '#9cf';
      }
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
        'clicking',
        'buildings',
        'upgrades',
        'garden',
        'wrinklers',
        'goldenCookies',
        'dragon',
        'pantheon',
        'grimoire',
        'stockMarket',
        'sugarLumps',
        'savings',
        'ascension',
        'season',
        'nightMode',
        'achievements'
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

      // Collect all modules and sort by priority (active/blocked first, then others)
      const allModules: Array<{ key: keyof ModuleStatuses; status: any; priority: number }> = [];

      for (const key of moduleOrder) {
        const status = statuses[key];
        if (!status) continue;

        // Priority: active/blocked = 0, waiting/error = 1, idle/disabled = 2
        let priority = 2;
        if (status.status === 'active' || status.status === 'blocked') {
          priority = 0;
        } else if (status.status === 'waiting' || status.status === 'error') {
          priority = 1;
        }

        allModules.push({ key, status, priority });
      }

      // Sort by priority, then by module name
      allModules.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.status.module.localeCompare(b.status.module);
      });

      // Helper function to render a module card
      const renderModuleCard = (status: any): string => {
        const color = statusColors[status.status as keyof typeof statusColors] || '#ccc';
        const icon = status.icon || '📦';

        let cardHtml = '<div style="padding: 8px; background: rgba(255,255,255,0.03); border-left: 3px solid ' + color + '; border-radius: 4px;">';
        cardHtml += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">';
        cardHtml += '<span style="color: ' + color + '; font-weight: bold; font-size: 11px;">' + icon + ' ' + status.module + '</span>';
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
      for (const { status } of allModules) {
        modulesHtml += renderModuleCard(status);
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
   * Clean the log
   */
  private cleanLog(): void {
    try {
      window.localStorage.setItem('autoplayLog', '');
    } catch (e) {
      console.error('Failed to clean log:', e);
    }
  }

  /**
   * Show the log
   */
  private showLog(): void {
    let theLog = '';
    try {
      theLog = window.localStorage.getItem('autoplayLog') || '';
    } catch (e) {
      theLog = '';
    }
    if (typeof Game !== 'undefined' && Game.Prompt) {
      Game.Prompt(
        '<h3>Cookie Bot Log</h3><div class="block">' +
        'This is the log of the bot with saves at important stages.<br>' +
        'Copy it and use it as you like.</div>' +
        '<div class="block"><textarea id="textareaPrompt" ' +
        'style="width:100%;height:128px;" readonly>' +
        theLog + '</textarea></div>',
        ['All done!']
      );
    }
  }


  /**
   * Render/update the dashboard
   */
  render(): void {
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
