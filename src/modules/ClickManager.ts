/**
 * Handles automatic clicking of the big cookie
 * Respects Neverclick and True Neverclick achievements
 * Original: AutoPlay.handleClicking (lines 360-384)
 */

import type { ModuleStatus } from '../types/moduleStatus';

declare const Game: any;
declare const Beautify: (num: number) => string;

interface ClickManagerConfig {
  clickMode: number; // 0=off, 1=normal, 2+=aggressive
}

interface ClickManagerContext {
  now: number;
  endPhase: () => boolean;
  grindingCheat: () => boolean;
}

export class ClickManager {
  private config: ClickManagerConfig;
  private context: ClickManagerContext;

  constructor(config: ClickManagerConfig, context: ClickManagerContext) {
    this.config = config;
    this.context = context;
  }

  /**
   * Handle clicking - respects Neverclick/True Neverclick achievements
   * Original: AutoPlay.handleClicking (lines 360-378)
   */
  handleClicking(): void {
    if (this.config.clickMode === 0) return;

    // Respect Neverclick achievement (max 15 clicks)
    if (!Game.Achievements['Neverclick'].won && Game.cookieClicks <= 15) {
      return;
    }

    // Respect True Neverclick in Born Again endgame
    if (Game.ascensionMode === 1 && this.context.endPhase() &&
        !Game.Achievements['True Neverclick'].won && !Game.cookieClicks) {
      return;
    }

    // Uncanny clicker achievement (5 clicks in a row within 1 second)
    if (!Game.Achievements['Uncanny clicker'].won) {
      for (let i = 1; i < 6; i++) {
        setTimeout(() => Game.ClickCookie(), 50 * i);
      }
    }

    // Aggressive clicking (mode 2+)
    if (this.config.clickMode > 1) {
      for (let i = 1; i < 10; i++) {
        setTimeout(() => this.speedClicking(), 30 * i);
      }
    } else {
      // Normal clicking (mode 1)
      Game.ClickCookie();

      // Extra clicks during frenzy buffs
      if ('Click frenzy' in Game.buffs ||
          'Dragonflight' in Game.buffs ||
          'Cursed finger' in Game.buffs) {
        for (let i = 1; i < 5; i++) {
          setTimeout(() => Game.ClickCookie(), 30 * i);
        }
      }
    }
  }

  /**
   * Speed clicking with multiplier (for aggressive click modes)
   * Original: AutoPlay.speedClicking (lines 380-383)
   */
  private speedClicking(): void {
    Game.ClickCookie();
    const clickCount = 1 << (10 * (this.config.clickMode - 2));
    Game.ClickCookie(0, clickCount * Game.computedMouseCps);
  }

  /**
   * Get clicking status for dashboard
   */
  getStatus(): ModuleStatus {
    if (this.config.clickMode === 0) {
      return {
        module: 'Clicking',
        status: 'disabled',
        currentAction: 'Disabled',
        reason: 'Click mode set to OFF',
        icon: '👆',
        details: {
          'Mode': 'OFF'
        }
      };
    }

    // Check if blocked by Neverclick
    if (!Game.Achievements['Neverclick'].won && Game.cookieClicks <= 15) {
      return {
        module: 'Clicking',
        status: 'waiting',
        currentAction: 'Waiting for Neverclick',
        reason: 'Protecting Neverclick achievement (max 15 clicks)',
        nextAction: Game.cookieClicks === 15 ? 'Will resume after achievement unlocked' : undefined,
        icon: '👆',
        details: {
          'Clicks Used': `${Game.cookieClicks}/15`,
          'Neverclick Won': false,
          'Mode': this.getClickModeName()
        }
      };
    }

    // Check if blocked by True Neverclick in Born Again endgame
    if (Game.ascensionMode === 1 && this.context.endPhase() &&
        !Game.Achievements['True Neverclick'].won && !Game.cookieClicks) {
      return {
        module: 'Clicking',
        status: 'waiting',
        currentAction: 'Waiting for True Neverclick',
        reason: 'Protecting True Neverclick achievement (0 clicks)',
        icon: '👆',
        details: {
          'Clicks': 0,
          'True Neverclick Won': false,
          'Mode': 'Born Again',
          'Click Mode': this.getClickModeName()
        }
      };
    }

    // Active clicking
    const clicksPerSecond = this.config.clickMode === 1 ? '~3-5' : '~10+';
    const hasFrenzy = 'Click frenzy' in Game.buffs || 'Dragonflight' in Game.buffs || 'Cursed finger' in Game.buffs;

    return {
      module: 'Clicking',
      status: 'active',
      currentAction: hasFrenzy ? 'Clicking (Frenzy active!)' : 'Auto-clicking big cookie',
      reason: this.getClickModeName(),
      nextAction: !Game.Achievements['Uncanny clicker'].won ? 'Working on Uncanny clicker achievement' : undefined,
      icon: '👆',
      details: {
        'Mode': this.getClickModeName(),
        'Clicks/sec': hasFrenzy ? '~15-20' : clicksPerSecond,
        'Total Clicks': typeof Beautify !== 'undefined' ? Beautify(Game.cookieClicks) : Game.cookieClicks,
        'Frenzy Active': hasFrenzy,
        'Uncanny Clicker': Game.Achievements['Uncanny clicker'].won
      }
    };
  }

  /**
   * Get human-readable click mode name
   */
  private getClickModeName(): string {
    switch (this.config.clickMode) {
      case 0: return 'OFF';
      case 1: return 'Normal';
      case 2: return 'Aggressive';
      case 3: return 'Very Aggressive';
      default: return `Level ${this.config.clickMode}`;
    }
  }
}
