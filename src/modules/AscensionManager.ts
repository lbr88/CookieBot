/**
 * Manages ascension decisions and heavenly upgrades
 */

declare const Game: any;
declare const Beautify: (num: number) => string;
declare const AutoPlay: any;

interface AscensionState {
  ascendLimit: number;
  onAscend: boolean;
  loggedAchievements: { [key: number]: boolean };
  neverclickWarn: boolean;
  resetTime: number;
}

interface AutoPlayContext {
  now: number;
  nextAchievement: number;
  wantedAchievements: number[];
  lumpHarvestAchievements: number[];
  wantAscend: boolean;
  Config: {
    HardcoreMode?: number;
    NightMode?: number;
  };
  mainActivity: string;
  activities: string;
  hyperActive: boolean;
  workingOnSpecialAchievement: boolean;
  plantPending: boolean;
  delay: number;
  finished: boolean;

  // Permanent slot arrays
  kittens: number[];
  maxBuildings: number[];
  cursors: number[];
  butterBiscuits: number[];
  expensive: number[];

  // Methods that need to be called
  info: (message: string) => void;
  logAction: (action: string, details?: string) => void;
  logStatus: (type: string, message: string, details?: string) => void;
  addActivity: (activity: string) => void;
  setMainActivity: (activity: string) => void;
  setDeadline: (time: number) => void;
  findNextAchievement: () => void;
  endPhase: () => boolean;
  preNightMode: () => boolean;
  mustRebornAscend: () => boolean;
  assignSpirit: (slot: number, spirit: string, force: number) => void;
}

// Priority upgrades for heavenly cookie purchases
const PRIO_UPGRADES = [363, 323, 411, 412, 413, 264, 265, 266, 267, 268, 520, 181, 282, 283, 284, 291, 393, 394];

export class AscensionManager {
  private state: AscensionState;
  private context: AutoPlayContext;

  constructor(context: AutoPlayContext) {
    this.context = context;
    this.state = {
      ascendLimit: 0.9 * Math.floor(2 * (1 - Game.ascendMeterPercent)),
      onAscend: false,
      loggedAchievements: {},
      neverclickWarn: true,
      resetTime: Date.now()
    };
  }

  /**
   * Main handler for ascension logic
   * Checks achievements, prestige levels, and decides when to ascend
   */
  handleAscend(): void {
    // Check for newly won achievements
    this.checkAchievements();

    // Handle reincarnation if we're on the ascend screen
    if (Game.OnAscend) {
      this.doReincarnate();
      this.context.findNextAchievement();
      this.context.setDeadline(0); // reactivate all activities
      this.context.now = Date.now();
      this.state.onAscend = false;
      this.state.loggedAchievements = {}; // Reset achievement tracking for new run
      return;
    }

    // Continue ascension process if timer is ready
    if (this.state.onAscend && Game.AscendTimer === 0) {
      Game.Ascend(true);
    }

    // Update achievement goals for first run
    if (Game.ascensionMode === 0 && Game.prestige === 0) {
      this.canContinue(); // update achievement goals
    }

    // Check if target achievement was won
    if (Game.AchievementsById[this.context.nextAchievement].won) {
      this.handleAchievementWon();
      return;
    }

    // Check if reborn mode failed
    if (Game.ascensionMode === 1 && !this.canContinue() && !Game.AchievementsById[this.context.nextAchievement].won) {
      this.doAscend("reborn mode did not work, retry.");
      return;
    }

    // Don't ascend right before night
    if (this.context.preNightMode() && this.context.Config.NightMode && this.context.Config.NightMode > 0) {
      return;
    }

    // Check for endless cycle achievement (1000 ascends)
    if (this.checkEndlessCycle()) {
      return;
    }

    // Check for reincarnation achievement (100 ascends)
    if (this.checkReincarnation()) {
      return;
    }

    // Check for time-based ascension (days in run)
    if (this.checkTimeBasedAscension()) {
      return;
    }

    // Check for lucky digit/number/payout upgrades
    if (this.checkLuckyUpgrades()) {
      return;
    }

    // Check for season switcher
    if (!Game.Upgrades["Season switcher"].bought &&
        this.context.nextAchievement === 108 && Game.ascendMeterLevel > 1111) {
      this.doAscend("getting season switcher.");
      return;
    }
  }

  /**
   * Handle heavenly upgrade purchases during ascension
   */
  handleHeavenlyUpgrades(): void {
    this.buyHeavenlyUpgrades();
  }

  /**
   * Check all achievements and log newly won ones
   */
  private checkAchievements(): void {
    for (const key in Game.Achievements) {
      const achiev = Game.Achievements[key];
      if (achiev.won && !this.state.loggedAchievements[achiev.id]) {
        // This achievement was just won
        this.state.loggedAchievements[achiev.id] = true;
        this.context.logAction('Achievement unlocked', achiev.name + ' - ' + achiev.ddesc.replace(/<q>.*?<\/q>/ig, ''));
      }
    }
  }

  /**
   * Handle when the target achievement is won
   */
  private handleAchievementWon(): void {
    const achiev = Game.AchievementsById[this.context.nextAchievement];
    this.context.logStatus('achievement', 'Unlocked: ' + achiev.name);

    // Check if this is first ascension and if we should wait for 365+ prestige
    const isFirstRun = (Game.prestige === 0);
    const currentPrestige = Game.ascendMeterLevel;
    const isHardcoreAchievement = (
      achiev.id === Game.Achievements["Hardcore"].id ||
      achiev.id === Game.Achievements["Neverclick"].id ||
      achiev.id === Game.Achievements["True Neverclick"].id
    );

    if (isFirstRun && currentPrestige < 365 && !isHardcoreAchievement) {
      // Don't ascend yet - need to reach 365+ prestige for first ascension
      this.context.logStatus('prestige', 'Waiting for 365+ prestige before first ascension (currently ' + Math.floor(currentPrestige) + ')');
      return;
    }

    const date = new Date();
    date.setTime(this.context.now - Game.startDate);
    const legacyTime = Game.sayTime(date.getTime() / 1000 * Game.fps, -1);
    date.setTime(this.context.now - Game.fullDate);
    const fullTime = Game.sayTime(date.getTime() / 1000 * Game.fps, -1);

    this.doAscend(
      "have achievement: " + achiev.ddesc.replace(/<q>.*?<\/q>/ig, '') +
      " after " + legacyTime + "(total: " + fullTime + ")"
    );
  }

  /**
   * Check for endless cycle achievement (1000 ascends)
   */
  private checkEndlessCycle(): boolean {
    if (this.context.endPhase() && !Game.Achievements["Endless cycle"].won &&
        !Game.ascensionMode && Game.Upgrades["Sucralosia Inutilis"].bought &&
        Game.Upgrades['Lucky payout'].bought) {
      // this costs approx. 1 minute per ascend
      this.context.activities = "Going for 1000 ascends.";
      this.context.hyperActive = true; // full activity
      this.context.wantAscend = true; // avoid buying plants

      if (Game.ascendMeterLevel > 0) {
        this.doAscend("go for 1000 ascends");
        return true;
      }
    }
    return false;
  }

  /**
   * Check for reincarnation achievement (100 ascends)
   */
  private checkReincarnation(): boolean {
    if (Game.Upgrades["Permanent upgrade slot V"].bought &&
        !Game.Achievements["Reincarnation"].won && !Game.ascensionMode) {
      // this costs 3+2 minute per 2 ascend
      this.context.activities = "Going for 100 ascends.";
      this.context.hyperActive = true; // full activity
      this.context.wantAscend = true; // avoid buying plants

      if (Game.ascendMeterLevel > 0 &&
          this.state.ascendLimit < Game.ascendMeterLevel * Game.ascendMeterPercent) {
        this.doAscend("go for 100 ascends");
        return true;
      }
    }
    return false;
  }

  /**
   * Check if it's time to ascend based on days in run
   */
  private checkTimeBasedAscension(): boolean {
    const daysInRun = (this.context.now - Game.startDate) / 1000 / 60 / 60 / 24;

    // Stock market profit check
    if (this.context.nextAchievement === 463 && daysInRun > 10 &&
        Game.Objects["Bank"].minigame && Game.Objects["Bank"].minigame.profit > daysInRun * 300000) {
      this.context.addActivity("Making money in stock market for achievements.");
      return false;
    }

    // Calculate maximum days in run
    const maxDaysInRun = Math.pow(
      40 * (Game.prestige + 1000000000) / (Game.ascendMeterLevel + 1),
      2
    );

    if (!this.context.wantAscend && daysInRun > 20) {
      this.context.addActivity("Still " + Beautify(maxDaysInRun - daysInRun) +
        " days until next hard ascend.");
    }

    if (daysInRun > maxDaysInRun && daysInRun > 20) {
      // do not ascend if the first digit of the total cookies is a 9
      let x = Game.cookiesEarned;
      while (x > 10) x /= 10;

      if (x < 9) {
        this.doAscend("ascend after " + Math.floor(daysInRun) +
          " days just while waiting for next achievement.");
        return true;
      }
    }

    return false;
  }

  /**
   * Check for lucky digit/number/payout heavenly upgrades
   */
  private checkLuckyUpgrades(): boolean {
    // Lucky digit (prestige % 10 == 7)
    if (!Game.Upgrades["Lucky digit"].bought && Game.heavenlyChips > 777 &&
        Game.ascendMeterLevel > 0 && Game.ascendMeterLevel < 20 &&
        ((Game.prestige + Game.ascendMeterLevel) % 10 === 7)) {
      this.doAscend("ascend for heavenly upgrade lucky digit.");
      return true;
    }

    // Lucky number (prestige % 1000 == 777)
    if (!Game.Upgrades["Lucky number"].bought && Game.heavenlyChips > 77777 &&
        Game.ascendMeterLevel > 0 && Game.ascendMeterLevel < 200 &&
        ((Game.prestige + Game.ascendMeterLevel) % 1000 === 777)) {
      this.doAscend("ascend for heavenly upgrade lucky number.");
      return true;
    }

    // Lucky payout (need six 7s in prestige)
    if (!Game.Upgrades["Lucky payout"].bought && Game.heavenlyChips > 77777777) {
      const newPrestige = Game.prestige + Game.ascendMeterLevel;
      this.context.wantAscend = true; // avoid buying plants
      this.context.hyperActive = true; // full activity
      this.context.addActivity("Trying to get heavenly upgrade Lucky Payout.");

      const sevenCount = (newPrestige + '').split('7').length - 1;
      if (Math.ceil(sevenCount) >= 4) {
        this.doAscend("ascend for heavenly upgrade lucky payout.");
        return true;
      }
    }

    return false;
  }

  /**
   * Check if we can continue with special achievement runs
   * Returns true if working on special achievement, false otherwise
   */
  private canContinue(): boolean {
    let needAchievement = false;
    let targetActivity = '';
    this.context.workingOnSpecialAchievement = false; // Clear flag by default

    // Check if Hardcore/Neverclick mode is enabled (AUTO = 1, SKIP = 0)
    const shouldAttemptHardcore = this.context.Config.HardcoreMode === 1;

    // True Neverclick (0 clicks)
    if (shouldAttemptHardcore && !Game.Achievements["True Neverclick"].won && Game.cookieClicks === 0) {
      const achiev = Game.Achievements["True Neverclick"];
      targetActivity = "Trying to get achievement: " + achiev.name + " - " + achiev.ddesc.replace(/<q>.*?<\/q>/ig, '');

      if (this.state.neverclickWarn) {
        Game.Prompt('<h3>Attention</h3><div class="block">' +
          '<p>Cookie Bot is trying to get the true neverclick achievement.</p>' +
          '<p>Please do not click cookies now.</p>' +
          '</div>', ['OK']);
      }
      this.state.neverclickWarn = false;
      needAchievement = true;
    }
    // Neverclick (<=15 clicks)
    else if (shouldAttemptHardcore && !Game.Achievements["Neverclick"].won && Game.cookieClicks <= 15) {
      const achiev = Game.Achievements["Neverclick"];
      targetActivity = "Trying to get achievement: " + achiev.name + " - " + achiev.ddesc.replace(/<q>.*?<\/q>/ig, '');
      needAchievement = true;
    }
    // Hardcore (0 upgrades)
    else if (shouldAttemptHardcore && !Game.Achievements["Hardcore"].won && Game.UpgradesOwned === 0) {
      const achiev = Game.Achievements["Hardcore"];
      targetActivity = "Trying to get achievement: " + achiev.name + " - " + achiev.ddesc.replace(/<q>.*?<\/q>/ig, '');
      needAchievement = true;
    }

    if (needAchievement) {
      // Only update if the goal changed
      if (this.context.mainActivity !== targetActivity) {
        this.context.setMainActivity(targetActivity);
        this.context.activities = targetActivity; // Also update activities to match
      }
      this.context.workingOnSpecialAchievement = true; // Flag to skip adding extra activity hints
      return true;
    }

    // Speed baking achievements
    if (!Game.Achievements["Speed baking I"].won &&
        (this.context.now - Game.startDate <= 1000 * 60 * 35)) {
      const achiev = Game.Achievements["Speed baking I"];
      targetActivity = "Trying to get achievement: " + achiev.name + " - " + achiev.ddesc.replace(/<q>.*?<\/q>/ig, '');
    } else if (!Game.Achievements["Speed baking II"].won &&
        (this.context.now - Game.startDate <= 1000 * 60 * 25)) {
      const achiev = Game.Achievements["Speed baking II"];
      targetActivity = "Trying to get achievement: " + achiev.name + " - " + achiev.ddesc.replace(/<q>.*?<\/q>/ig, '');

      // threefold clicking speed
      for (let i = 1; i < 3; i++) {
        setTimeout(() => { Game.ClickCookie(0, Game.computedMouseCps); }, 60 * i);
      }
    } else if (!Game.Achievements["Speed baking III"].won &&
        (this.context.now - Game.startDate <= 1000 * 60 * 15)) {
      const achiev = Game.Achievements["Speed baking III"];
      targetActivity = "Trying to get achievement: " + achiev.name + " - " + achiev.ddesc.replace(/<q>.*?<\/q>/ig, '');

      // fivefold clicking speed
      for (let i = 1; i < 5; i++) {
        setTimeout(() => { Game.ClickCookie(0, Game.computedMouseCps); }, 30 * i);
      }
    } else {
      return false;
    }

    // Only update if the goal changed
    if (this.context.mainActivity !== targetActivity) {
      this.context.setMainActivity(targetActivity);
      this.context.activities = targetActivity; // Also update activities to match
    }
    this.context.workingOnSpecialAchievement = true; // Flag to skip adding extra activity hints
    this.context.hyperActive = true; // full activity for speed baking
    return true;
  }

  /**
   * Public method to trigger ascension with a reason
   * Used by special achievement logic like runJustRight()
   */
  triggerAscend(reason: string): void {
    this.doAscend(reason);
  }

  /**
   * Perform the actual ascension
   */
  private doAscend(reason: string): void {
    if (Game.AscendTimer > 0 || Game.ReincarnateTimer > 0) return;
    if (this.state.onAscend || Game.OnAscend) return;

    this.context.logStatus('ascend', reason);
    this.context.wantAscend = this.context.plantPending;
    this.context.addActivity("Preparing to ascend.");

    // Do not ascend when waiting for a plant
    if (this.context.wantAscend) return;

    // Do not ascend during sugar frenzy/blessing
    if (Game.hasBuff("Sugar frenzy")) return;
    if (Game.hasBuff("Sugar blessing")) return;

    this.context.setDeadline(0); // full activity to monitor ascension

    // Pop wrinklers if they're close to ready
    if (Game.wrinklers.some((w: any) => w.close)) {
      this.context.assignSpirit(0, "scorn", 1);
      this.context.delay = 10;
    }
    Game.wrinklers.forEach((w: any) => { if (w.close === 1) w.hp = 0; });

    // Harvest garden
    if (Game.isMinigameReady && Game.isMinigameReady(Game.Objects["Farm"])) {
      Game.Objects["Farm"].minigame.harvestAll();
    }

    // Sell all stock market goods
    if (Game.isMinigameReady && Game.isMinigameReady(Game.Objects["Bank"])) {
      const market = Game.Objects["Bank"].minigame;
      for (const g in market.goods) {
        market.sellGood(market.goods[g].id, 10000);
      }
    }

    // Buy chocolate egg if available
    if (Game.Upgrades["Chocolate egg"].unlocked &&
        !Game.Upgrades["Chocolate egg"].bought) {
      // Set first aura to earth shatterer
      if (Game.dragonLevel >= 9) {
        Game.specialTab = "dragon";
        Game.SetDragonAura(5, 0);
        Game.ConfirmPrompt();
        Game.ToggleSpecialMenu(0);
      }
      Game.ObjectsById.forEach((e: any) => { e.sell(e.amount); });
      Game.Upgrades["Chocolate egg"].buy();
      this.context.delay = 10;
    } else {
      this.context.info(reason);

      // Log prestige gain
      const prestigeGain = Game.ascendMeterLevel;
      const newPrestige = Game.prestige + prestigeGain;

      if (typeof Beautify !== 'undefined' && prestigeGain > 0) {
        this.context.logAction('Ascending',
          reason + ' | Prestige: ' + Beautify(Game.prestige) + ' → ' +
          Beautify(newPrestige) + ' (+' + Beautify(prestigeGain) + ')');
      } else {
        this.context.logAction('Ascending', reason);
      }

      this.context.delay = 15;
      // Call logging before ascension if available
      if (typeof (AutoPlay as any).logging === 'function') {
        (AutoPlay as any).logging();
      }
      Game.Ascend(true);
      this.state.onAscend = true;
    }
  }

  /**
   * Handle reincarnation (after ascending)
   */
  private doReincarnate(): void {
    this.state.onAscend = false;
    this.context.delay = 10;
    this.buyHeavenlyUpgrades();

    // Choose ascension mode
    if (!Game.Achievements["Neverclick"].won || !Game.Achievements["Hardcore"].won) {
      Game.PickAscensionMode();
      Game.nextAscensionMode = 1;
      Game.ConfirmPrompt();
    }

    if (this.context.endPhase() && this.context.mustRebornAscend()) {
      Game.PickAscensionMode();
      Game.nextAscensionMode = 1;
      Game.ConfirmPrompt();
    }

    Game.Reincarnate(true);
    this.state.resetTime = Date.now(); // save the current date for things that need to be delayed after reincarnating

    // Reset savings start time after reincarnation
    if ('savingsStart' in this.state) {
      (this.state as any).savingsStart = this.context.now;
    }

    this.state.neverclickWarn = true;
    this.state.ascendLimit = 0.9 * Math.floor(2 * (1 - Game.ascendMeterPercent));
  }

  /**
   * Buy all available heavenly upgrades
   */
  private buyHeavenlyUpgrades(): void {
    const upgradesPurchased: string[] = [];

    // Buy priority upgrades first
    PRIO_UPGRADES.forEach((id) => {
      const upgrade = Game.UpgradesById[id];
      if (upgrade && upgrade.canBePurchased && !upgrade.bought && upgrade.buy(true)) {
        this.context.info("buying " + upgrade.name);
        upgradesPurchased.push(upgrade.name);
      }
    });

    // Buy all other available upgrades
    for (const key in Game.UpgradesById) {
      const upgrade = Game.UpgradesById[key];
      if (upgrade && upgrade.canBePurchased && !upgrade.bought && upgrade.buy(true)) {
        this.context.info("buying " + upgrade.name);
        upgradesPurchased.push(upgrade.name);
      }
    }

    // Log all purchased heavenly upgrades
    if (upgradesPurchased.length > 0) {
      this.context.logAction('Purchased heavenly upgrades', upgradesPurchased.join(', '));
    }

    // Assign permanent slots
    this.assignPermanentSlot(1, this.context.kittens);
    this.assignPermanentSlot(2, this.context.maxBuildings);

    if (!Game.Achievements["Reincarnation"].won) { // for many ascends
      this.assignPermanentSlot(0, this.context.cursors);
      this.assignPermanentSlot(3, [52]); // lucky day
      this.assignPermanentSlot(4, [53]); // serendipity
    } else { // collect rare things
      this.assignPermanentSlot(0, this.context.butterBiscuits);
      this.assignPermanentSlot(3, [226]); // omelette
      this.assignPermanentSlot(4, this.context.expensive);
    }
  }

  /**
   * Assign a permanent upgrade slot
   */
  private assignPermanentSlot(slot: number, options: number[]): void {
    // Check if slot is unlocked (base ID is 264)
    if (!Game.UpgradesById[264 + slot].bought) return;

    Game.AssignPermanentSlot(slot);

    // Try to assign the best available upgrade from options (highest priority last)
    for (let i = options.length - 1; i >= 0; i--) {
      if (Game.UpgradesById[options[i]].bought) {
        Game.PutUpgradeInPermanentSlot(options[i], slot);
        break;
      }
    }

    Game.ConfirmPrompt();
  }

  /**
   * Get current ascension state (for external access)
   */
  getState(): AscensionState {
    return { ...this.state };
  }
}
