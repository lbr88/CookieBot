/**
 * Manages upgrade purchases and decision making
 * Migrated from cookieAutoPlayBeta.js "Handle Upgrades" section (lines 617-659)
 */

export interface UpgradeManagerContext {
  now: number;
  savingsGoal: number;
  canUseLumps: boolean;
  nextAchievement: number | null;
  nextPurchase: string | null;
  nextPurchaseType: 'upgrade' | 'building' | null;
  nextPurchasePrice: number | null;
  nextPurchasePP: number | null;
  hyperActive: boolean;
  logAction: (action: string, details?: string) => void;
  addActivity: (activity: string) => void;
}

export class UpgradeManager {
  private context: UpgradeManagerContext;

  constructor(context: UpgradeManagerContext) {
    this.context = context;
  }

  /**
   * Main upgrade handling function
   * Iterates through all unlocked upgrades and purchases them if conditions are met
   */
  handleUpgrades(): void {
    // Don't buy upgrades until Hardcore achievement is won or at least one upgrade is owned
    if (!Game.Achievements["Hardcore"].won && Game.UpgradesOwned === 0) {
      return;
    }

    // Track best upgrade for dashboard
    let bestUpgrade: Upgrade | null = null;

    for (const upgradeId in Game.UpgradesById) {
      const upgrade = Game.UpgradesById[upgradeId];

      if (upgrade.unlocked && !upgrade.bought && !this.shouldAvoidBuy(upgrade)) {
        // Track first valid upgrade for dashboard
        if (!bestUpgrade) {
          bestUpgrade = upgrade;
          this.context.nextPurchase = upgrade.name;
          this.context.nextPurchaseType = 'upgrade';
          this.context.nextPurchasePrice = upgrade.getPrice();
          this.context.nextPurchasePP = null; // No payback calculation without Cookie Monster
        }

        // Try to buy the upgrade (checks price internally)
        this.buyUpgrade(upgrade, true);
      }
    }

    // Special handling for Sugar frenzy upgrade
    // Only buy after 3 days into the run if lumps are available
    this.handleSugarFrenzy();
  }

  /**
   * Purchase an upgrade if we have enough cookies
   * @param upgrade - The upgrade to purchase
   * @param bypass - Whether to bypass the popup (default true)
   */
  buyUpgrade(upgrade: Upgrade, bypass: boolean = true): void {
    const price = upgrade.getPrice();

    // Only buy if we have enough cookies after accounting for savings goal
    if (price < Game.cookies - this.context.savingsGoal) {
      upgrade.buy(bypass);
      this.context.logAction('Upgraded: ' + upgrade.name, this.formatNumber(price) + ' cookies');
      this.context.hyperActive = true; // Might buy more soon
    }
  }

  /**
   * Determines if an upgrade should be avoided based on special conditions
   * @param upgrade - The upgrade to check
   * @returns true if the upgrade should not be purchased
   */
  private shouldAvoidBuy(upgrade: Upgrade): boolean {
    switch (upgrade.id) {
      // Brainsweep and Elder Pact - wait for all grandmapocalypse achievements
      case 71: // One mind
      case 73: // Elder Pact
        return !!Game.Achievements["Elder nap"].won &&
               !!Game.Achievements["Grandmapocalypse"].won &&
               !!Game.Achievements["Elder slumber"].won &&
               !!Game.Achievements["Elder calm"].won;

      // Elder Pledge - wait for certain achievements and Elder Covenant
      case 74: // Elder Pledge
        return !!Game.Achievements["Elder nap"].won &&
               !!Game.Achievements["Elder slumber"].won &&
               !!Game.Upgrades["Elder Covenant"].unlocked;

      // Elder Covenant - wait until pledge is bought or calm achievement won
      case 84: // Elder Covenant
        return !!Game.Upgrades["Elder Pledge"].bought ||
               !!Game.Achievements["Elder calm"].won;

      // Chocolate egg - always avoid (used for ascension strategy)
      case 227: // Chocolate egg
        return true;

      // Shimmering veil - avoid unless working on specific achievement
      case 563: // Shimmering veil
        return this.context.nextAchievement !== 432 || // "Thick-skinned" achievement ID
               !!Game.Achievements["Thick-skinned"].won;

      // Avoid all toggle-pool upgrades by default
      default:
        return upgrade.pool === "toggle";
    }
  }

  /**
   * Special handling for Sugar frenzy upgrade
   * Only purchase after 3 days into the run
   */
  private handleSugarFrenzy(): void {
    const sugarFrenzyUpgrade = Game.Upgrades["Sugar frenzy"];

    if (!sugarFrenzyUpgrade) {
      return;
    }

    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
    const runDuration = this.context.now - Game.startDate;

    if (this.context.canUseLumps &&
        sugarFrenzyUpgrade.unlocked &&
        !sugarFrenzyUpgrade.bought &&
        runDuration > threeDaysInMs) {
      sugarFrenzyUpgrade.buy();
    }
  }

  /**
   * Format a number with appropriate suffixes (million, billion, etc.)
   * @param num - Number to format
   * @returns Formatted string
   */
  private formatNumber(num: number): string {
    // Use Cookie Clicker's Beautify function if available
    if (typeof (window as any).Beautify === 'function') {
      return (window as any).Beautify(num);
    }

    // Fallback simple formatting
    if (num >= 1e12) return (num / 1e12).toFixed(2) + ' trillion';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + ' billion';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + ' million';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + ' thousand';
    return num.toFixed(0);
  }

  /**
   * Get information about the next upgrade to purchase
   * Used for dashboard display
   */
  getNextUpgradeInfo(): {
    name: string | null;
    price: number | null;
    canAfford: boolean;
  } {
    if (!this.context.nextPurchase || this.context.nextPurchaseType !== 'upgrade') {
      return { name: null, price: null, canAfford: false };
    }

    const canAfford = this.context.nextPurchasePrice !== null &&
                      this.context.nextPurchasePrice < Game.cookies - this.context.savingsGoal;

    return {
      name: this.context.nextPurchase,
      price: this.context.nextPurchasePrice,
      canAfford: canAfford
    };
  }

  /**
   * Check if a specific upgrade should be prioritized
   * @param upgradeName - Name of the upgrade
   * @returns true if upgrade should be prioritized
   */
  isPrioritized(upgradeName: string): boolean {
    const priorityUpgrades = [
      'Kitten helpers',
      'Kitten workers',
      'Kitten engineers',
      'Kitten overseers',
      'Kitten managers',
      'Kitten accountants',
      'Kitten specialists',
      'Kitten experts',
      'Kitten consultants',
      'Kitten assistants to the regional manager',
      'Kitten marketeers',
      'Kitten analysts',
      'Kitten executives',
      'Lucky day',
      'Serendipity',
      'Get lucky'
    ];

    return priorityUpgrades.includes(upgradeName);
  }

  /**
   * Update the context with new values
   * Called by main AutoPlay loop
   */
  updateContext(context: Partial<UpgradeManagerContext>): void {
    this.context = { ...this.context, ...context };
  }
}
