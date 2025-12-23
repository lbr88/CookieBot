/**
 * Handles Golden Cookies, Reindeer, and other shimmers
 * Migrated from cookieAutoPlayBeta.js "Handle Cookies and Golden Cookies" section
 */

import type { ModuleStatus } from '../types/moduleStatus';

declare const Game: any;
declare const Beautify: ((value: number, floats?: number) => string) | undefined;

export interface GoldenCookieConfig {
  GoldenClickMode?: number; // 0=off, 1=normal, 2=aggressive
  CheatGolden?: number; // 0=off, 1=auto, 2+=manual levels
  getGoldenClickMode?: () => number; // Live getter for current config value
  getCheatGolden?: () => number; // Live getter for current config value
}

export class GoldenCookieHandler {
  private config: GoldenCookieConfig;
  private cheatMax: number = 0;
  private cheatMaxTime: number = Date.now();
  private hyperActive: boolean = false;
  private wantAscend: boolean = false;
  private now: number = Date.now();

  // Callbacks for integration with main AutoPlay
  private logAction: (action: string, details?: string) => void;
  private addActivity: (activity: string) => void;
  private grindingCheat: () => boolean;

  constructor(
    config?: GoldenCookieConfig,
    logAction?: (action: string, details?: string) => void,
    addActivity?: (activity: string) => void,
    grindingCheat?: () => boolean
  ) {
    this.config = config || { GoldenClickMode: 0, CheatGolden: 0 };
    this.logAction = logAction || (() => {});
    this.addActivity = addActivity || (() => {});
    this.grindingCheat = grindingCheat || (() => false);
  }

  /**
   * Get current GoldenClickMode (from live config or fallback)
   */
  private getGoldenClickMode(): number {
    if (this.config.getGoldenClickMode) {
      return this.config.getGoldenClickMode();
    }
    return this.config.GoldenClickMode || 0;
  }

  /**
   * Get current CheatGolden (from live config or fallback)
   */
  private getCheatGolden(): number {
    if (this.config.getCheatGolden) {
      return this.config.getCheatGolden();
    }
    return this.config.CheatGolden || 0;
  }

  /**
   * Update runtime state
   */
  updateState(now: number, wantAscend: boolean): void {
    this.now = now;
    this.wantAscend = wantAscend;
  }

  /**
   * Returns whether the bot is in hyperactive mode (frequent updates needed)
   */
  isHyperActive(): boolean {
    return this.hyperActive;
  }

  /**
   * Reset hyperactive flag (call at start of each cycle)
   */
  resetHyperActive(): void {
    this.hyperActive = false;
  }

  /**
   * Main handler for golden cookies and reindeer
   * Pops first golden cookie or reindeer based on configuration
   */
  handleGoldenCookies(): void {
    const goldenClickMode = this.getGoldenClickMode();
    if (!goldenClickMode || goldenClickMode === 0) return;

    // Grab fortune cookie from ticker
    if (Game.TickerEffect) {
      Game.tickerL.click();
    }

    // Check if multiple golden cookies are active (hyperactive mode)
    if (Game.shimmerTypes['golden'].n >= 2) {
      this.hyperActive = true;
    }

    // Wait for Four-leaf cookie achievement if close
    if (
      Game.shimmerTypes['golden'].n >= 4 &&
      !Game.Achievements['Four-leaf cookie'].won
    ) {
      return; // wait for achievement
    }

    // Process all shimmers
    for (const sx in Game.shimmers) {
      const s = Game.shimmers[sx];
      this.hyperActive = true; // check whether full activity

      // Handle cookie storm drops (aggressive mode only)
      if (s.force === 'cookie storm drop' && goldenClickMode === 2) {
        s.pop();
        this.logAction('Clicked cookie storm drop', s.type);
      }

      // Click non-golden shimmers, or golden cookies that are about to expire
      if (
        s.type !== 'golden' ||
        s.life < Game.fps ||
        !Game.Achievements['Early bird'].won
      ) {
        this.clickShimmerWithTracking(s);
        return;
      }

      // Click golden cookies that have been around for a while (if we have Fading luck)
      if (
        s.life / Game.fps < s.dur - 2 &&
        Game.Achievements['Fading luck'].won
      ) {
        this.clickShimmerWithTracking(s);
        return;
      }
    }

    // Try to cheat golden cookies if configured
    this.cheatGoldenCookies();
  }

  /**
   * Click a shimmer and track the cookies gained
   */
  private clickShimmerWithTracking(shimmer: any): void {
    // Track cookies before clicking for Lucky/Lucky Frenzy bonus calculation
    const cookiesBefore = Game.cookies;
    shimmer.pop();
    const cookiesGained = Game.cookies - cookiesBefore;

    // Check if this was a Lucky or Lucky Frenzy golden cookie
    if (shimmer.type === 'golden' && cookiesGained > 0 && typeof Beautify !== 'undefined') {
      const bonusType = shimmer.force || 'fading luck';
      // Lucky and Lucky Frenzy both have "lucky" in their force name
      if (bonusType.toLowerCase().includes('lucky')) {
        this.logAction(
          `Clicked ${bonusType} golden cookie`,
          `💰 +${Beautify(cookiesGained)} cookies`
        );
        return;
      }
    }

    // Log regular shimmer click
    if (shimmer.type === 'golden') {
      this.logAction('Clicked golden cookie', shimmer.force || 'fading luck');
    } else {
      this.logAction(`Clicked ${shimmer.type}`, shimmer.force || 'shimmer');
    }
  }

  /**
   * Cheat golden cookies by advancing their spawn timer
   */
  private cheatGoldenCookies(): void {
    const cheatGolden = this.getCheatGolden();
    if (!cheatGolden || cheatGolden === 0) return;

    // Don't cheat if Lucky payout isn't bought and we have enough heavenly chips
    if (!Game.Upgrades['Lucky payout'].bought && Game.heavenlyChips > 77777777) {
      return;
    }

    let level = 10 + 30 * (cheatGolden - 1);

    if (cheatGolden === 1) {
      // Auto cheat mode
      if (this.wantAscend) return; // already cheated enough
      if (!this.grindingCheat()) return; // only cheat in grinding

      const daysInRun = (this.now - Game.startDate) / 1000 / 60 / 60 / 24;
      if (daysInRun < 20) return; // cheat only after 20 days

      level = ((3 * daysInRun) << 0) - 20;
      if (level > 100) level = 100;

      const timeToNextLevel = (2 * 60 * 60 * 1000) / ((level - this.cheatMax + 8) / 10);
      if (this.now - this.cheatMaxTime >= timeToNextLevel) {
        this.cheatMaxTime = this.now;
        this.cheatMax++;
      }

      if (level > this.cheatMax) level = this.cheatMax;
      this.cheatMax = level;
    }

    this.addActivity(`Cheating golden cookies at level ${level}.`);

    const levelTime = (Game.shimmerTypes.golden.maxTime * level) / 140;
    if (Game.shimmerTypes.golden.time < levelTime) {
      Game.shimmerTypes.golden.time = levelTime;
    }

    /* golden cookie with building special:
    const newShimmer = new Game.shimmer("golden");
    newShimmer.force = "building special";
    */
  }

  /**
   * Check if we're in a frenzy buff state
   */
  hasFrenzyBuff(): boolean {
    return (
      'Click frenzy' in Game.buffs ||
      'Dragonflight' in Game.buffs ||
      'Cursed finger' in Game.buffs ||
      'Frenzy' in Game.buffs ||
      'Elder frenzy' in Game.buffs ||
      'Dragon Harvest' in Game.buffs
    );
  }

  /**
   * Check if we have a specific buff active
   */
  hasBuff(buffName: string): boolean {
    return buffName in Game.buffs;
  }

  /**
   * Get remaining time for a buff in seconds
   */
  getBuffTimeRemaining(buffName: string): number {
    if (buffName in Game.buffs) {
      return Math.ceil(Game.buffs[buffName].time / Game.fps);
    }
    return 0;
  }

  /**
   * Get current golden cookie handler status
   */
  getStatus(): ModuleStatus {
    const goldenClickMode = this.getGoldenClickMode();
    const cheatGolden = this.getCheatGolden();

    // Check if golden cookie clicking is enabled
    if (!goldenClickMode || goldenClickMode === 0) {
      return {
        module: 'Golden Cookies',
        status: 'disabled',
        currentAction: 'Disabled in config',
        reason: 'GoldenClickMode is set to 0 (off)',
        icon: '✨',
        details: {
          'Mode': 'Off'
        }
      };
    }

    const goldenCount = Game.shimmerTypes['golden']?.n || 0;
    const activeShimmers = Game.shimmers.length;

    // Check for Four-leaf cookie achievement attempt
    if (!Game.Achievements['Four-leaf cookie'].won &&
        Game.Objects['Wizard tower']?.amount > 500 &&
        Game.Upgrades['Distilled essence of redoubled luck']?.bought) {
      return {
        module: 'Golden Cookies',
        status: 'waiting',
        currentAction: 'Attempting Four-leaf cookie',
        reason: `Need 4 golden cookies on screen (currently ${goldenCount})`,
        nextAction: goldenCount >= 2 ? 'Will cast Hand of Fate' : 'Waiting for more golden cookies',
        icon: '✨',
        details: {
          'Golden Cookies': goldenCount,
          'Target': 4,
          'Wizard Towers': Game.Objects['Wizard tower']?.amount || 0
        }
      };
    }

    // Check for active buffs
    const activeFrenzy = this.hasFrenzyBuff();
    const activeBuff = this.getActiveBuff();

    // Check for cheating mode
    if (cheatGolden && cheatGolden > 0) {
      const level = cheatGolden === 1 ? 'Auto' : cheatGolden;
      return {
        module: 'Golden Cookies',
        status: 'active',
        currentAction: 'Clicking golden cookies',
        reason: `Cheating enabled (level ${level})`,
        nextAction: activeFrenzy ? `Active: ${activeBuff}` : 'Waiting for golden cookies',
        icon: '✨',
        details: {
          'Mode': goldenClickMode === 2 ? 'Aggressive' : 'Normal',
          'Cheat Level': level,
          'Active Shimmers': activeShimmers,
          'Golden Cookies': goldenCount,
          'Active Buff': activeBuff || 'None'
        }
      };
    }

    // Normal mode
    if (activeShimmers > 0) {
      return {
        module: 'Golden Cookies',
        status: 'active',
        currentAction: 'Clicking shimmers',
        reason: goldenClickMode === 2 ? 'Aggressive mode (includes storm drops)' : 'Normal mode',
        nextAction: activeFrenzy ? `Active buff: ${activeBuff}` : undefined,
        icon: '✨',
        details: {
          'Mode': goldenClickMode === 2 ? 'Aggressive' : 'Normal',
          'Active Shimmers': activeShimmers,
          'Golden Cookies': goldenCount,
          'Active Buff': activeBuff || 'None',
          'HyperActive': this.hyperActive
        }
      };
    }

    return {
      module: 'Golden Cookies',
      status: 'idle',
      currentAction: 'Waiting for golden cookies',
      reason: goldenClickMode === 2 ? 'Aggressive mode' : 'Normal mode',
      icon: '✨',
      details: {
        'Mode': this.config.GoldenClickMode === 2 ? 'Aggressive' : 'Normal',
        'Golden Cookies': goldenCount,
        'Active Buff': activeBuff || 'None'
      }
    };
  }

  /**
   * Get the name of the currently active buff (if any)
   */
  private getActiveBuff(): string | null {
    const buffOrder = [
      'Elder frenzy',
      'Click frenzy',
      'Dragonflight',
      'Dragon Harvest',
      'Frenzy',
      'Cursed finger',
      'Building special'
    ];

    for (const buff of buffOrder) {
      if (buff in Game.buffs) {
        return buff;
      }
    }
    return null;
  }
}
