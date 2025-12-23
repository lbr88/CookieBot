/**
 * Manages Grimoire (Wizard Tower minigame) spell casting
 *
 * The Grimoire allows casting spells that cost magic (mana) and recharge over time.
 * Key spells:
 * - Hand of Fate: Summons a golden cookie (can backfire into sugar lump)
 * - Conjure Baked Goods: Instant cookies (normally not worth it)
 *
 * Strategy:
 * - Cast Hand of Fate when we have 2+ golden cookies to get Four-leaf cookie achievement
 * - Cast Hand of Fate when at 95%+ magic to get backfire sugar lumps
 * - Cast spells during high CpS multiplier (>100x) to maximize value
 * - Use lump refill when we have 100+ lumps and canUseLumps
 */

declare const Game: any;

export class GrimoireManager {
  // State tracking
  private canUseLumps: boolean = false;
  private cpsMult: number = 1.0;

  /**
   * Main handler - called in high-activity phase (when hyperActive or deadline reached)
   * Casts grimoire spells when beneficial
   */
  handleGrimoires(): void {
    if (!Game.isMinigameReady(Game.Objects['Wizard tower'])) return;

    const grimoire = Game.Objects['Wizard tower'].minigame;
    const wizardTower = Game.Objects['Wizard tower'];

    // Special case: Four-leaf cookie achievement
    // Try to get 4 golden cookies on screen at once
    if (!Game.Achievements['Four-leaf cookie'].won &&
        wizardTower.amount > 500 &&
        Game.Upgrades['Distilled essence of redoubled luck'].bought) {
      const handOfFate = grimoire.spells['hand of fate'];

      // Wait until we have 2 golden cookies, then cast to get a 3rd
      if (Game.shimmerTypes['golden'].n > 1 &&
          grimoire.magic >= grimoire.getSpellCost(handOfFate)) {
        grimoire.castSpell(handOfFate);
      }

      // If we have 3+ golden cookies and enough magic, sell towers to wait for achievement
      if (Game.shimmerTypes['golden'].n >= 3 &&
          grimoire.magic > 30 &&
          wizardTower.amount > 30) {
        wizardTower.sell(wizardTower.amount - grimoire.magic);
      }

      return; // Save magic for achievement attempt
    }

    // Try to get sugar lump from Hand of Fate backfire
    // Backfires at 95%+ magic have a chance to give a sugar lump
    const handOfFate = grimoire.spells['hand of fate'];
    if (Game.shimmerTypes['golden'].n &&
        grimoire.magic >= grimoire.getSpellCost(handOfFate) &&
        grimoire.magic / grimoire.magicM >= 0.95) {
      grimoire.castSpell(handOfFate);
    }

    // High CpS multiplier (>100x) - cast spells for maximum value
    if (this.cpsMult > 100) {
      // Cast Hand of Fate to get more golden cookies
      if (grimoire.magic >= grimoire.getSpellCost(handOfFate)) {
        grimoire.castSpell(handOfFate);
        return;
      }

      // Cast Conjure Baked Goods (normally not worth it, but ok during high multiplier)
      const conjureBakedGoods = grimoire.spells['conjure baked goods'];
      if (grimoire.magic >= grimoire.getSpellCost(conjureBakedGoods)) {
        grimoire.castSpell(conjureBakedGoods);
        return;
      }

      // Refill magic with sugar lump if we have plenty
      if (this.canUseLumps && Game.lumps > 100) {
        grimoire.lumpRefill.click();
      }
    }
  }

  /**
   * Update state from AutoPlay
   */
  updateState(canUseLumps: boolean, cpsMult: number): void {
    this.canUseLumps = canUseLumps;
    this.cpsMult = cpsMult;
  }
}
