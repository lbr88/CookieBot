/**
 * Manages UI dashboard and menu
 * Migrated from cookieAutoPlayBeta.js lines 2271-3068
 */

import type {
  ConfigData,
  Config,
  ActionHistoryEntry,
  StatusHistoryEntry,
  ActivityEntry
} from '../types/autoplay';

declare const Game: any;
declare const AutoPlay: any;
declare const Beautify: (num: number) => string;
declare const CookieMonsterData: any;

export class Dashboard {
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

  constructor() {
    this.initializeConfigData();
    this.setConfigDefaults();
    this.loadConfig();
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
    if (typeof AutoPlay !== 'undefined') {
      AutoPlay.info?.(`The bot has changed mode to ${modeName}`);
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

    // Create header with toggle button
    const header = document.createElement('div');
    header.style.cssText = 'padding: 8px 16px; background: rgba(0, 100, 0, 0.3); cursor: pointer; display: flex; justify-content: space-between; align-items: center;';
    header.innerHTML = '<span style="color: #6f6; font-size: 14px; font-weight: bold;">CookieBot Dashboard</span><span id="dashboardToggle" style="color: #6f6; font-size: 12px;">▼ Collapse</span>';

    // Create content area
    const content = document.createElement('div');
    content.id = 'dashboardContent';
    content.style.cssText = 'display: flex; padding: 12px; gap: 16px; max-height: 250px; overflow-y: auto;';

    // Three columns: Stats & Reserve | Next Actions | Recent Activity
    content.innerHTML = `
      <div id="dashProgress" style="flex: 1; min-width: 250px;">
        <div style="color: #6f6; font-size: 13px; margin-bottom: 8px; font-weight: bold;">Stats & Reserve</div>
        <div id="dashProgressContent" style="color: #fff; font-size: 11px; line-height: 1.5;">Loading...</div>
      </div>
      <div id="dashNextActions" style="flex: 1; min-width: 250px;">
        <div style="color: #6f6; font-size: 13px; margin-bottom: 8px; font-weight: bold;">Next Actions</div>
        <div id="dashNextContent" style="color: #fff; font-size: 11px; line-height: 1.5; max-height: 200px; overflow-y: auto;">Loading...</div>
      </div>
      <div id="dashActivity" style="flex: 1; min-width: 250px;">
        <div style="color: #6f6; font-size: 13px; margin-bottom: 8px; font-weight: bold;">Recent Activity</div>
        <div id="dashActivityContent" style="color: #fff; font-size: 11px; line-height: 1.4; max-height: 200px; overflow-y: auto;">No activity yet...</div>
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
      console.log('Dashboard element not found, skipping update');
      return;
    }

    try {
      // Check if AutoPlay is available
      if (typeof AutoPlay === 'undefined') {
        console.log('AutoPlay is undefined, dashboard cannot update');
        return;
      }

      this.updateNextActions();
      this.updateProgress();
      this.updateActivity();
    } catch (e) {
      console.error('Dashboard update error:', e);
    }
  }

  /**
   * Update next actions section
   */
  private updateNextActions(): void {
    let nextHtml = '';

    // Safety check for AutoPlay global
    if (typeof AutoPlay === 'undefined') {
      nextHtml = '<div style="color: #f66; font-size: 11px;">AutoPlay not initialized yet...</div>';
      const nextContent = document.getElementById('dashNextContent');
      if (nextContent) {
        nextContent.innerHTML = nextHtml;
      }
      return;
    }

    // DEBUG: Log AutoPlay object itself
    console.log('Dashboard Update - typeof AutoPlay:', typeof AutoPlay);
    console.log('Dashboard Update - AutoPlay object:', AutoPlay);
    console.log('Dashboard Update - AutoPlay.state:', (AutoPlay as any).state);

    // DEBUG: Log what we're seeing
    console.log('Dashboard Update - nextPurchase:', AutoPlay.nextPurchase, 'type:', AutoPlay.nextPurchaseType, 'price:', AutoPlay.nextPurchasePrice);
    console.log('Dashboard Update - mainActivity:', AutoPlay.mainActivity);
    console.log('Dashboard Update - activities:', AutoPlay.activities);

    // Show next purchase
    if (AutoPlay.nextPurchase && typeof Beautify !== 'undefined') {
      const purchaseColor = AutoPlay.nextPurchaseType === 'building' ? '#6f6' : '#fc6';
      nextHtml += `<div style="margin-bottom: 12px; padding: 10px; background: rgba(0,200,0,0.08); border: 2px solid ${purchaseColor}; border-radius: 4px;" title="The next item the bot plans to purchase based on efficiency calculations">`;
      nextHtml += `<div style="color: ${purchaseColor}; font-weight: bold; font-size: 13px; margin-bottom: 6px;">`;
      nextHtml += `${AutoPlay.nextPurchaseType === 'building' ? '🏢 ' : '⬆️ '}${AutoPlay.nextPurchase}`;
      nextHtml += '</div>';
      nextHtml += `<div style="color: #ccc; font-size: 11px; margin-bottom: 4px;">Cost: ${Beautify(AutoPlay.nextPurchasePrice)}</div>`;

      // Calculate available cookies (total - savings reserve)
      const availableCookies = Game.cookies - (AutoPlay.savingsGoal || 0);
      const needsForPurchase = AutoPlay.nextPurchasePrice - availableCookies;

      if (needsForPurchase > 0) {
        // Not enough cookies after reserves
        const timeToAfford = needsForPurchase / Game.cookiesPs;
        const timeUntilCheck = Math.max(0, (AutoPlay.deadline - Date.now()) / 1000);
        const timeStr = this.formatTimeShort(timeToAfford);
        nextHtml += `<div style="color: #f96; font-size: 11px; margin-top: 4px; font-weight: bold;" title="Time until you can afford this purchase (calculated by dividing cookies needed by your CPS)">⏳ Time left: ${timeStr}</div>`;
        nextHtml += `<div style="color: #888; font-size: 10px;">Need ${Beautify(needsForPurchase)} more cookies`;
        if (AutoPlay.savingsGoal > 0) {
          nextHtml += ` <span title="The bot keeps a reserve of cookies for Lucky and Lucky Frenzy golden cookie bonuses. This amount is not available for purchases.">(after ${Beautify(AutoPlay.savingsGoal)} reserve)</span>`;
        }
        nextHtml += '</div>';
        // Show when bot will check
        if (timeUntilCheck < timeToAfford) {
          nextHtml += `<div style="color: #6f6; font-size: 9px; margin-top: 2px;">⚡ Auto-check in ${timeUntilCheck.toFixed(1)}s</div>`;
        }
      } else if (AutoPlay.nextPurchasePrice > Game.cookies) {
        // Can't afford at all (even without reserves)
        const timeToAfford = (AutoPlay.nextPurchasePrice - Game.cookies) / Game.cookiesPs;
        const timeUntilCheck = Math.max(0, (AutoPlay.deadline - Date.now()) / 1000);
        const timeStr = this.formatTimeShort(timeToAfford);
        nextHtml += `<div style="color: #f96; font-size: 11px; margin-top: 4px; font-weight: bold;" title="Time until you can afford this purchase (calculated by dividing cookies needed by your CPS)">⏳ Time left: ${timeStr}</div>`;
        nextHtml += `<div style="color: #888; font-size: 10px;">Need ${Beautify(AutoPlay.nextPurchasePrice - Game.cookies)} more cookies</div>`;
        // Show when bot will check
        if (timeUntilCheck < timeToAfford) {
          nextHtml += `<div style="color: #6f6; font-size: 9px; margin-top: 2px;">⚡ Auto-check in ${timeUntilCheck.toFixed(1)}s</div>`;
        }
      } else {
        // Can afford now!
        nextHtml += '<div style="color: #6f6; font-size: 11px; margin-top: 4px; font-weight: bold;">✓ Ready to buy!</div>';
        if (AutoPlay.hyperActive) {
          nextHtml += '<div style="color: #6f6; font-size: 10px;">🚀 High activity mode - buying immediately</div>';
        } else {
          const timeUntilCheck = Math.max(0, (AutoPlay.deadline - Date.now()) / 1000);
          if (timeUntilCheck < 1) {
            nextHtml += '<div style="color: #6f6; font-size: 10px;">⚡ Buying in < 1s</div>';
          } else {
            nextHtml += `<div style="color: #888; font-size: 10px;">Next check in ${timeUntilCheck.toFixed(1)}s</div>`;
          }
        }
      }

      if (AutoPlay.nextPurchasePP !== undefined && AutoPlay.nextPurchasePP !== null && AutoPlay.nextPurchasePP < Infinity) {
        const ppStr = this.formatTimeShort(AutoPlay.nextPurchasePP);
        nextHtml += `<div style="color: #888; font-size: 9px; margin-top: 4px;" title="How long it will take for this purchase to pay for itself through increased CPS (shorter is better)">Payback: ${ppStr}</div>`;
      }

      // Show if using fallback logic (no Cookie Monster)
      if (typeof CookieMonsterData === 'undefined') {
        nextHtml += '<div style="color: #888; font-size: 9px; margin-top: 4px; font-style: italic;" title="Cookie Monster mod provides better purchase calculations. Without it, the bot uses simpler logic that may not always be optimal.">Using simple buying logic (Cookie Monster not installed)</div>';
      }
      nextHtml += '</div>';
    } else {
      nextHtml += '<div style="color: #888; font-size: 11px; margin-bottom: 12px;">No purchase planned yet...</div>';
    }

    // Show main activity/goal in styled box
    if (AutoPlay.mainActivity) {
      let goalColor = '#9cf';
      let goalIcon = '🎯';

      // Determine icon based on activity type
      if (AutoPlay.mainActivity.toLowerCase().indexOf('achievement') !== -1) {
        goalIcon = '🏆';
        goalColor = '#fc6';
      } else if (AutoPlay.mainActivity.toLowerCase().indexOf('ascend') !== -1) {
        goalIcon = '⬆️';
        goalColor = '#f9f';
      }

      nextHtml += `<div style="margin-bottom: 12px; padding: 8px; background: rgba(0,200,200,0.08); border: 2px solid ${goalColor}; border-radius: 4px;" title="Current bot objective">`;
      nextHtml += `<div style="color: ${goalColor}; font-weight: bold; font-size: 11px; margin-bottom: 4px;">`;
      nextHtml += `${goalIcon} Current Goal`;
      nextHtml += '</div>';
      nextHtml += `<div style="color: #ccc; font-size: 10px; line-height: 1.3;">${AutoPlay.mainActivity}</div>`;
      nextHtml += '</div>';
    }

    // Show additional activities in styled box if present (filter out status info)
    if (AutoPlay.activities && AutoPlay.activities !== AutoPlay.mainActivity) {
      let extraActivities = AutoPlay.activities.replace(AutoPlay.mainActivity, '').replace(/<div class="line"><\/div>/g, '');
      // Filter out "Missing X achievements" text - it's now in Stats & Reserve
      if (extraActivities.indexOf('Missing') !== -1 && extraActivities.indexOf('achievements') !== -1) {
        extraActivities = '';
      }
      if (extraActivities.trim()) {
        nextHtml += '<div style="margin-bottom: 12px; padding: 10px; background: rgba(100,100,100,0.08); border: 2px solid #888; border-radius: 4px;" title="Additional bot activities">';
        nextHtml += '<div style="color: #888; font-weight: bold; font-size: 11px; margin-bottom: 4px;">';
        nextHtml += 'ℹ️ Additional Info';
        nextHtml += '</div>';
        nextHtml += `<div style="color: #aaa; font-size: 10px; line-height: 1.4;">${extraActivities}</div>`;
        nextHtml += '</div>';
      }
    }

    const nextContent = document.getElementById('dashNextContent');
    console.log('Dashboard Update - nextContent element:', nextContent);
    console.log('Dashboard Update - generated HTML length:', nextHtml.length);
    if (nextContent) {
      nextContent.innerHTML = nextHtml || 'Initializing...';
      console.log('Dashboard Update - HTML inserted, new innerHTML length:', nextContent.innerHTML.length);
    } else {
      console.error('Dashboard Update - dashNextContent element not found!');
    }
  }

  /**
   * Update progress section
   */
  private updateProgress(): void {
    let progressHtml = '';

    // Safety check for AutoPlay global
    if (typeof AutoPlay === 'undefined') {
      progressHtml = '<div style="color: #f66; font-size: 11px;">AutoPlay not initialized yet...</div>';
      const progressContent = document.getElementById('dashProgressContent');
      if (progressContent) {
        progressContent.innerHTML = progressHtml;
      }
      return;
    }

    // Savings progress bar (golden cookie reserve)
    if (typeof Beautify !== 'undefined' && typeof Game !== 'undefined' && Game.unbuffedCps > 0) {
      // Calculate base thresholds (without time scaling)
      const baseLucky = Game.unbuffedCps * 60 * 100; // 6000 seconds of CPS
      const baseLuckyFrenzy = baseLucky * 7; // 42000 seconds of CPS
      const hasGetLucky = Game.UpgradesById[86] && Game.UpgradesById[86].bought;

      // Check if we're actively saving or just showing info
      const isSavingActive = AutoPlay.savingsGoal > 0;
      const reserveStatus = isSavingActive ? '🍪 Golden Cookie Reserve' : '🍪 Golden Cookie Info (Reserve Disabled)';
      const reserveTooltip = isSavingActive
        ? 'The bot keeps a reserve of cookies to maximize Lucky and Lucky Frenzy golden cookie bonuses. This amount is unavailable for purchases.'
        : 'Golden cookie thresholds shown for reference. Reserve is disabled during special achievements like Hardcore.';

      progressHtml += '<div style="margin-bottom: 8px;">';
      progressHtml += `<div style="color: #fc6; font-size: 11px; font-weight: bold; margin-bottom: 6px;" title="${reserveTooltip}">${reserveStatus}</div>`;

      // Show why reserve is not active (if applicable)
      if (!isSavingActive) {
        // Check if in startup period
        const startTime = 30 * 60 * 1000;
        if (AutoPlay.savingsStart !== undefined) {
          const elapsedTime = Date.now() - AutoPlay.savingsStart - startTime;
          if (elapsedTime < 0) {
            const minutesRemaining = Math.ceil(Math.abs(elapsedTime) / 60 / 1000);
            progressHtml += '<div style="font-size: 10px; color: #fc6; font-weight: bold; margin-bottom: 4px; padding: 4px; background: rgba(255,200,100,0.1); border-left: 3px solid #fc6;">⏱ Reserve Disabled: Startup Period</div>';
            progressHtml += `<div style="font-size: 9px; color: #ccc; margin-bottom: 4px; margin-left: 4px;">Reserve will activate in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''} (30-minute startup delay)</div>`;
          } else if (Game.ascensionMode === 1) {
            progressHtml += '<div style="font-size: 10px; color: #9cf; font-weight: bold; margin-bottom: 4px; padding: 4px; background: rgba(150,200,255,0.1); border-left: 3px solid #9cf;">🏆 Reserve Disabled: Hardcore Mode</div>';
            progressHtml += '<div style="font-size: 9px; color: #ccc; margin-bottom: 4px; margin-left: 4px;">All cookies are available for purchases during Hardcore achievement</div>';
          } else if (!Game.UpgradesById[52].bought || !Game.UpgradesById[53].bought) {
            const missingUpgrades: string[] = [];
            if (!Game.UpgradesById[52].bought) missingUpgrades.push('Lucky day');
            if (!Game.UpgradesById[53].bought) missingUpgrades.push('Serendipity');
            progressHtml += '<div style="font-size: 10px; color: #fc6; font-weight: bold; margin-bottom: 4px; padding: 4px; background: rgba(255,200,100,0.1); border-left: 3px solid #fc6;">⏳ Reserve Disabled: Missing Upgrades</div>';
            progressHtml += `<div style="font-size: 9px; color: #ccc; margin-bottom: 4px; margin-left: 4px;">Need golden cookie upgrades: ${missingUpgrades.join(', ')}</div>`;
          }
        }
      }

      // Calculate actual target with time scaling
      let scaling = 1;
      if (isSavingActive && AutoPlay.savingsStart !== undefined && Game.startDate) {
        const startTime = 30 * 60 * 1000;
        const targetTime = 400 * 60 * 1000;
        const elapsedTime = Date.now() - AutoPlay.savingsStart - startTime;
        scaling = Math.max(0, Math.min(elapsedTime / targetTime, 1));

        if (scaling < 1) {
          progressHtml += `<div style="font-size: 9px; color: #888; margin-bottom: 4px;" title="The reserve target gradually increases over 400 minutes after a 30-minute startup period. This prevents the bot from over-saving early in the run.">⏱ Target ramping up: ${(scaling * 100).toFixed(1)}% (full at ${(targetTime / 60000).toFixed(0)} min)</div>`;
        }
      }

      const targetLucky = baseLucky * scaling;
      const targetLuckyFrenzy = baseLuckyFrenzy * scaling;

      // Lucky progress
      const luckyPercent = Math.min(100, (Game.cookies / targetLucky) * 100);
      const luckyColor = Game.cookies >= targetLucky ? '#6f6' : '#fc6';
      progressHtml += '<div style="margin-bottom: 6px;">';
      progressHtml += `<div style="font-size: 10px; color: ${luckyColor};" title="Reserve for Lucky golden cookie bonus (7x your cookies). Requires ${Beautify(targetLucky)} cookies.">`;
      progressHtml += `${Game.cookies >= targetLucky ? '✓ ' : '○ '}Lucky: ${Beautify(targetLucky)}`;
      progressHtml += '</div>';
      if (Game.cookies < targetLucky) {
        progressHtml += `<div style="background: #333; height: 8px; border: 1px solid #666; margin-top: 2px;"><div style="background: linear-gradient(to right, #fc6, #f90); height: 100%; width: ${luckyPercent}%;"></div></div>`;
        progressHtml += `<div style="font-size: 9px; color: #888; margin-top: 1px;">${Beautify(Game.cookies)} / ${Beautify(targetLucky)} (${luckyPercent.toFixed(1)}%)</div>`;
      }
      progressHtml += '</div>';

      // Lucky Frenzy progress (only if Get Lucky upgrade is bought)
      if (hasGetLucky) {
        const luckyFrenzyPercent = Math.min(100, (Game.cookies / targetLuckyFrenzy) * 100);
        const luckyFrenzyColor = Game.cookies >= targetLuckyFrenzy ? '#6f6' : '#fc6';
        progressHtml += '<div style="margin-bottom: 6px;">';
        progressHtml += `<div style="font-size: 10px; color: ${luckyFrenzyColor};" title="Reserve for Lucky Frenzy golden cookie bonus (777x your cookies). Requires Get Lucky upgrade and ${Beautify(targetLuckyFrenzy)} cookies.">`;
        progressHtml += `${Game.cookies >= targetLuckyFrenzy ? '✓ ' : '○ '}Lucky Frenzy: ${Beautify(targetLuckyFrenzy)}`;
        progressHtml += '</div>';
        if (Game.cookies < targetLuckyFrenzy) {
          progressHtml += `<div style="background: #333; height: 8px; border: 1px solid #666; margin-top: 2px;"><div style="background: linear-gradient(to right, #f96, #f66); height: 100%; width: ${luckyFrenzyPercent}%;"></div></div>`;
          progressHtml += `<div style="font-size: 9px; color: #888; margin-top: 1px;">${Beautify(Game.cookies)} / ${Beautify(targetLuckyFrenzy)} (${luckyFrenzyPercent.toFixed(1)}%)</div>`;
        }
        progressHtml += '</div>';
      } else {
        progressHtml += '<div style="font-size: 9px; color: #666; font-style: italic; margin-bottom: 6px;" title="Purchase the Get Lucky upgrade to unlock Lucky Frenzy bonuses (777x cookies).">○ Lucky Frenzy: Locked (need Get Lucky upgrade)</div>';
      }

      progressHtml += '</div>';
    }

    // Achievement progress
    progressHtml += this.getAchievementProgress();

    // Time in run
    if (Game.startDate && typeof Game.sayTime !== 'undefined') {
      const timeInRun = Date.now() - Game.startDate;
      progressHtml += `<div style="font-size: 10px; color: #aaa;" title="Total time elapsed since the start of this game run">Time in run: ${Game.sayTime(timeInRun / 1000 * Game.fps, -1)}</div>`;
    }

    // CPS
    if (typeof Beautify !== 'undefined' && Game.cookiesPs !== undefined) {
      const cpsMult = Game.unbuffedCps > 0 ? Game.cookiesPs / Game.unbuffedCps : 1;
      progressHtml += `<div style="font-size: 10px; color: #aaa;" title="Current cookies per second production rate. The multiplier includes buffs from golden cookies, frenzies, etc.">CPS: ${Beautify(Game.cookiesPs)} (${cpsMult.toFixed(1)}x multiplier)</div>`;
    }

    // Buildings and Upgrades
    if (Game.BuildingsOwned !== undefined && Game.UpgradesOwned !== undefined) {
      progressHtml += `<div style="font-size: 10px; color: #aaa;" title="Total number of buildings and upgrades you currently own">Buildings: ${Game.BuildingsOwned} | Upgrades: ${Game.UpgradesOwned}</div>`;
    }

    // Prestige
    if (Game.prestige !== undefined && typeof Beautify !== 'undefined') {
      const nextPrestige = Game.HowMuchPrestige(Game.cookiesReset + Game.cookiesEarned);
      const prestigeGain = Math.floor(nextPrestige - Game.prestige);
      if (prestigeGain > 0) {
        progressHtml += `<div style="font-size: 10px; color: #aaa;" title="Current prestige level. Ascending now would give you additional prestige levels, which permanently increase your CPS.">Prestige: ${Beautify(Game.prestige)} (+${Beautify(prestigeGain)} on ascend)</div>`;
      } else {
        progressHtml += `<div style="font-size: 10px; color: #aaa;" title="Current prestige level. Prestige permanently increases your CPS.">Prestige: ${Beautify(Game.prestige)}</div>`;
      }
    }

    // Active buffs
    if (Game.buffs) {
      const activeBuffs: string[] = [];
      for (const buff in Game.buffs) {
        if (Game.buffs[buff].time > 0) {
          const buffName = Game.buffs[buff].type.name;
          const timeLeft = Math.ceil(Game.buffs[buff].time / Game.fps);
          activeBuffs.push(`${buffName} (${timeLeft}s)`);
        }
      }
      if (activeBuffs.length > 0) {
        progressHtml += `<div style="font-size: 10px; color: #fc6; margin-top: 4px;" title="Currently active temporary buffs from golden cookies, frenzies, and other bonuses">✨ ${activeBuffs.join(', ')}</div>`;
      }
    }

    // Completion status
    if (AutoPlay.statusInfo) {
      progressHtml += '<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #444;">';
      progressHtml += '<div style="font-size: 10px; color: #888; font-weight: bold; margin-bottom: 2px;">Progress to Completion</div>';
      if (AutoPlay.statusInfo.achievements > 0) {
        progressHtml += `<div style="font-size: 9px; color: #aaa;">🏆 ${AutoPlay.statusInfo.achievements} achievements remaining`;
        if (AutoPlay.statusInfo.shadowAchievements > 0) {
          progressHtml += ` (${AutoPlay.statusInfo.shadowAchievements} shadow)`;
        }
        progressHtml += '</div>';
      }
      if (AutoPlay.statusInfo.upgrades > 0) {
        progressHtml += `<div style="font-size: 9px; color: #aaa;">⬆️ ${AutoPlay.statusInfo.upgrades} upgrades remaining</div>`;
      }
      if (AutoPlay.statusInfo.lumps > 0) {
        progressHtml += `<div style="font-size: 9px; color: #aaa;">🍬 ${AutoPlay.statusInfo.lumps} sugar lumps needed</div>`;
      }
      if (AutoPlay.statusInfo.achievements === 0 && AutoPlay.statusInfo.upgrades === 0 && AutoPlay.statusInfo.lumps === 0) {
        progressHtml += '<div style="font-size: 9px; color: #6f6;">✓ All content completed!</div>';
      }
      progressHtml += '</div>';
    }

    const progressContent = document.getElementById('dashProgressContent');
    if (progressContent) {
      progressContent.innerHTML = progressHtml || 'No active goals';
    }
  }

  /**
   * Get achievement progress HTML
   */
  private getAchievementProgress(): string {
    if (typeof AutoPlay === 'undefined' || typeof Game === 'undefined') {
      return '';
    }
    if (!AutoPlay.nextAchievement || typeof Beautify === 'undefined' || !Game.AchievementsById) {
      return '';
    }

    const achiev = Game.AchievementsById[AutoPlay.nextAchievement];
    // List of all "bake X cookies" achievement IDs
    const bakingAchievements = [225, 227, 229, 279, 280, 372, 373, 374, 375, 390, 391, 429, 451, 452, 453, 470, 471, 472, 534, 535, 536, 578, 579, 586, 587, 592, 593];

    // Check for special achievements
    let isHardcore = false;
    let isNeverclick = false;
    let isTrueNeverclick = false;

    if (achiev) {
      const achievDesc = (achiev.ddesc || '').toLowerCase();
      const achievName = (achiev.name || '').toLowerCase();

      if (achievName.indexOf('hardcore') !== -1 || achievDesc.indexOf('1 billion') !== -1) {
        isHardcore = true;
      } else if (achievName.indexOf('true neverclick') !== -1) {
        isTrueNeverclick = true;
      } else if (achievName.indexOf('neverclick') !== -1) {
        isNeverclick = true;
      }

      // Also check by ID if we can
      if (Game.Achievements["Hardcore"] && achiev.id === Game.Achievements["Hardcore"].id) isHardcore = true;
      if (Game.Achievements["Neverclick"] && achiev.id === Game.Achievements["Neverclick"].id) isNeverclick = true;
      if (Game.Achievements["True Neverclick"] && achiev.id === Game.Achievements["True Neverclick"].id) isTrueNeverclick = true;
    }

    let isSpecialAchievement = isHardcore || isNeverclick || isTrueNeverclick;

    // Also check if we're working on a special achievement
    if (!isSpecialAchievement && AutoPlay.workingOnSpecialAchievement && achiev) {
      // Fallback check based on activity text
      const activityText = (AutoPlay.mainActivity || '').toLowerCase();
      if (activityText.indexOf('hardcore') !== -1) isHardcore = true;
      if (activityText.indexOf('true neverclick') !== -1) isTrueNeverclick = true;
      if (activityText.indexOf('neverclick') !== -1 && activityText.indexOf('true') === -1) isNeverclick = true;
      isSpecialAchievement = isHardcore || isNeverclick || isTrueNeverclick;
    }

    if (!achiev || (bakingAchievements.indexOf(achiev.id) === -1 && !isSpecialAchievement)) {
      return '';
    }

    // This is a trackable achievement - show progress
    let cookieThreshold: number;
    const currentCookies = Game.cookiesEarned;

    // Set thresholds for special achievements
    if (isHardcore) {
      cookieThreshold = 1000000000; // 1 billion
    } else if (isNeverclick || isTrueNeverclick) {
      cookieThreshold = 1000000; // 1 million
    } else {
      cookieThreshold = achiev.threshold;
    }

    if (!cookieThreshold || cookieThreshold <= 0) {
      return '';
    }

    const progressPercent = Math.min(100, (currentCookies / cookieThreshold) * 100);
    const remaining = Math.max(0, cookieThreshold - currentCookies);

    let progressHtml = '<div style="margin-bottom: 8px; margin-top: 8px;">';
    progressHtml += '<div style="color: #6f6; font-size: 11px; font-weight: bold; margin-bottom: 6px;" title="Progress toward next achievement">🎯 Achievement Progress</div>';
    progressHtml += `<div style="font-size: 10px; color: #ccc; margin-bottom: 4px;">${achiev.name}</div>`;

    // Show special requirements for Hardcore/Neverclick achievements
    if (isSpecialAchievement) {
      if (isHardcore) {
        const upgradesStatus = Game.UpgradesOwned === 0 ? '✓' : '✗';
        const upgradesColor = Game.UpgradesOwned === 0 ? '#6f6' : '#f66';
        progressHtml += `<div style="font-size: 9px; color: ${upgradesColor}; margin-bottom: 2px;">${upgradesStatus} No upgrades purchased (${Game.UpgradesOwned} owned)</div>`;
      } else if (isTrueNeverclick) {
        const clicksStatus = Game.cookieClicks === 0 ? '✓' : '✗';
        const clicksColor = Game.cookieClicks === 0 ? '#6f6' : '#f66';
        progressHtml += `<div style="font-size: 9px; color: ${clicksColor}; margin-bottom: 2px;">${clicksStatus} No cookie clicks (${Game.cookieClicks} clicks)</div>`;
      } else if (isNeverclick) {
        const clicksStatus = Game.cookieClicks <= 15 ? '✓' : '✗';
        const clicksColor = Game.cookieClicks <= 15 ? '#6f6' : '#f66';
        progressHtml += `<div style="font-size: 9px; color: ${clicksColor}; margin-bottom: 2px;">${clicksStatus} Max 15 cookie clicks (${Game.cookieClicks}/15 used)</div>`;
      }
    }

    // Progress bar
    const barColor = progressPercent < 50 ? '#f66' : (progressPercent < 80 ? '#fc6' : '#6f6');
    const barColor2 = progressPercent < 50 ? '#f90' : (progressPercent < 80 ? '#6f6' : '#0f0');
    progressHtml += `<div style="background: #333; height: 12px; border: 1px solid #666; margin-top: 4px; margin-bottom: 2px;"><div style="background: linear-gradient(to right, ${barColor}, ${barColor2}); height: 100%; width: ${progressPercent}%;"></div></div>`;
    progressHtml += `<div style="font-size: 9px; color: #aaa;">${Beautify(currentCookies)} / ${Beautify(cookieThreshold)} (${progressPercent.toFixed(1)}%)</div>`;

    // Time estimate
    if (remaining > 0 && Game.cookiesPs > 0) {
      const timeRemaining = remaining / Game.cookiesPs;
      let timeStr = '';
      if (timeRemaining < 60) {
        timeStr = `${timeRemaining.toFixed(0)} seconds`;
      } else if (timeRemaining < 3600) {
        timeStr = `${(timeRemaining / 60).toFixed(1)} minutes`;
      } else if (timeRemaining < 86400) {
        timeStr = `${(timeRemaining / 3600).toFixed(1)} hours`;
      } else {
        timeStr = `${(timeRemaining / 86400).toFixed(1)} days`;
      }
      progressHtml += `<div style="font-size: 9px; color: #fc6; margin-top: 2px;" title="Estimated time to reach this achievement based on current CPS">⏱ Est. time: ${timeStr}</div>`;
    } else if (remaining === 0) {
      // Check if special requirements are met
      let requirementsMet = true;
      if (isHardcore && Game.UpgradesOwned !== 0) requirementsMet = false;
      if (isTrueNeverclick && Game.cookieClicks !== 0) requirementsMet = false;
      if (isNeverclick && Game.cookieClicks > 15) requirementsMet = false;

      if (requirementsMet) {
        progressHtml += '<div style="font-size: 9px; color: #6f6; margin-top: 2px; font-weight: bold;">✓ Ready to unlock!</div>';
      } else {
        progressHtml += '<div style="font-size: 9px; color: #f66; margin-top: 2px; font-weight: bold;">✗ Requirements not met</div>';
      }
    }

    progressHtml += '</div>';
    return progressHtml;
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
   * Format time in short form (s/m/h)
   */
  private formatTimeShort(seconds: number): string {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    } else if (seconds < 3600) {
      return `${(seconds / 60).toFixed(1)}m`;
    } else {
      return `${(seconds / 3600).toFixed(1)}h`;
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
