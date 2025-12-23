/**
 * Manages Pantheon (Temple minigame) spirit assignments
 *
 * The Pantheon has 3 slots for spirits that provide various bonuses:
 * - Slot 0 (Diamond): Most powerful effects
 * - Slot 1 (Ruby): Medium effects
 * - Slot 2 (Jade): Weakest effects
 *
 * Strategy:
 * - Slot 0: Mother (CpS boost) normally, Order (lump ripening) near harvest, Scorn (wrinkler boost) when popping
 * - Slot 1: Decadence (buildings cheaper) during day, Asceticism (buildings/CpS -5%) at night
 * - Slot 2: Labor (buildings +5%) during day, Industry (buildings +10%) at night
 */

declare const Game: any;

export class PantheonManager {
  // Injected dependencies
  private now: number = Date.now();
  private poppingWrinklers: boolean = false;
  private cheatLumps: boolean = false;

  /**
   * Main handler - called periodically (every 15 seconds)
   * Assigns optimal spirits based on current game state
   */
  handlePantheon(): void {
    if (!Game.isMinigameReady(Game.Objects['Temple'])) return;

    const age = this.now - Game.lumpT;

    // Slot 0 (Diamond) - Most important slot
    if (this.poppingWrinklers) {
      // Scorn: Wrinklers give +15% more cookies
      this.assignSpirit(0, 'scorn', 0);
    } else if (Game.lumpRipeAge - age < 61 * 60 * 1000 && !this.cheatLumps) {
      // Order: Sugar lumps ripen 1 hour sooner (use when < 61 min from harvest)
      this.assignSpirit(0, 'order', 0);
    } else if (this.preNightMode() &&
               Game.lumpOverripeAge - age < 9 * 60 * 60000 &&
               (new Date()).getMinutes() === 59 &&
               !this.cheatLumps) {
      // Order: Also use at 59 minutes before midnight if lump about to over-ripen
      this.assignSpirit(0, 'order', 0);
    } else {
      // Mother: +5% CpS (default - best general purpose)
      this.assignSpirit(0, 'mother', 0);
    }

    // Slot 1 (Ruby) - Decadence makes buildings cheaper
    this.assignSpirit(1, 'decadence', 0);

    // Slot 2 (Jade) - Labor makes buildings produce more
    this.assignSpirit(2, 'labor', 0);
  }

  /**
   * Activate night mode spirits
   * Called from NightMode.prepareForNight()
   */
  activateNightSpirits(): void {
    if (!Game.isMinigameReady(Game.Objects['Temple'])) return;

    // Remove day spirits
    this.removeSpirit(1, 'decadence');
    this.removeSpirit(2, 'labor');

    // Add night spirits (force=1 means use 1 swap if needed)
    this.assignSpirit(1, 'asceticism', 1); // Buildings/CpS -5% (saves money at night)
    this.assignSpirit(2, 'industry', 1);    // Buildings +10% (better than Labor's +5%)
  }

  /**
   * Deactivate night mode spirits
   * Called from NightMode.deactivateNightFeatures()
   */
  deactivateNightSpirits(): void {
    if (!Game.isMinigameReady(Game.Objects['Temple'])) return;

    // Just remove asceticism, let main logic handle others
    this.removeSpirit(1, 'asceticism');
  }

  /**
   * Assign a spirit to a pantheon slot
   * @param slot 0=Diamond, 1=Ruby, 2=Jade
   * @param godName Name of the spirit (e.g., 'mother', 'decadence')
   * @param force If 1, forces use of 1 swap. If 0, requires 3 swaps available.
   */
  private assignSpirit(slot: number, godName: string, force: number): void {
    const pantheon = Game.Objects['Temple'].minigame;

    // Check if we have enough swaps (worship swaps recharge over time)
    if (pantheon.swaps + force < 3) return;

    // Check if spirit already in this slot
    if (pantheon.slot[slot] === pantheon.gods[godName].id) return;

    // Assign the spirit
    pantheon.slotHovered = slot;
    pantheon.dragging = pantheon.gods[godName];
    pantheon.dropGod();
  }

  /**
   * Remove a spirit from a pantheon slot
   * @param slot 0=Diamond, 1=Ruby, 2=Jade
   * @param godName Name of the spirit to remove
   */
  private removeSpirit(slot: number, godName: string): void {
    const pantheon = Game.Objects['Temple'].minigame;

    // Check if this spirit is in the slot
    if (pantheon.slot[slot] !== pantheon.gods[godName].id) return;

    // Remove the spirit
    pantheon.slotHovered = -1;
    pantheon.dragging = pantheon.gods[godName];
    pantheon.dropGod();
  }

  /**
   * Check if it's pre-night mode (after 10pm)
   */
  private preNightMode(): boolean {
    const hour = new Date().getHours();
    return hour >= 22;
  }

  /**
   * Update state from AutoPlay
   */
  updateState(now: number, poppingWrinklers: boolean, cheatLumps: boolean): void {
    this.now = now;
    this.poppingWrinklers = poppingWrinklers;
    this.cheatLumps = cheatLumps;
  }
}
