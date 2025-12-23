/**
 * Main AutoPlay class that coordinates all modules
 */

import { GoldenCookieHandler } from './modules/GoldenCookieHandler';
import { SavingsManager } from './modules/SavingsManager';
import { PurchaseManager } from './modules/PurchaseManager';
// import { UpgradeManager } from './modules/UpgradeManager'; // Moved to BuildingManager
import { SeasonHandler } from './modules/SeasonHandler';
import { SugarLumpManager } from './modules/SugarLumpManager';
import { WrinklerManager } from './modules/WrinklerManager';
import { AchievementHandler } from './modules/AchievementHandler';
import { AscensionManager } from './modules/AscensionManager';
import { DragonManager } from './modules/DragonManager';
import { Dashboard } from './modules/Dashboard';
import { NightMode } from './modules/NightMode';
import { PantheonManager } from './modules/PantheonManager';
import { GrimoireManager } from './modules/GrimoireManager';
import { GardenManager } from './modules/GardenManager';
import { StockMarketManager } from './modules/StockMarketManager';
import type { AutoPlayConfig, AutoPlayState, AutoPlayContext } from './types/autoplay';
// import type { UpgradeManagerContext } from './modules/UpgradeManager'; // Moved to BuildingManager
import { WANTED_ACHIEVEMENTS, LUMP_RELATED_ACHIEVEMENTS } from './constants/gameIds';
import { Logger } from './utils/Logger';

export default class AutoPlay {
  // Version
  static readonly version = '2.052.16';

  // State
  private config: AutoPlayConfig;
  private state: AutoPlayState;

  // Modules
  private goldenCookieHandler: GoldenCookieHandler;
  private savingsManager: SavingsManager;
  private purchaseManager: PurchaseManager;
  // private upgradeManager: UpgradeManager; // Moved to BuildingManager
  private seasonHandler: SeasonHandler;
  private sugarLumpManager: SugarLumpManager;
  private wrinklerManager: WrinklerManager;
  private achievementHandler: AchievementHandler;
  private ascensionManager: AscensionManager;
  private dragonManager: DragonManager;
  private dashboard: Dashboard;
  private nightMode: NightMode;
  private pantheonManager: PantheonManager;
  private grimoireManager: GrimoireManager;
  private gardenManager: GardenManager;
  private stockMarketManager: StockMarketManager;

  // Shared context for upgrade manager (moved to BuildingManager)
  // private upgradeContext: UpgradeManagerContext;

  // Public properties for global AutoPlay access (needed by modules)
  wantedAchievements: number[] = [];
  lateAchievements: number[] = [];
  robotName: string = 'Automated ';
  backupHeight: number = 0;
  giftCode: number | string = 0;

  // Public accessors for state properties (proxies to this.state)
  get nextAchievement(): number { return this.state.nextAchievement; }
  set nextAchievement(value: number) { this.state.nextAchievement = value; }

  get finished(): boolean { return this.state.finished; }
  set finished(value: boolean) { this.state.finished = value; }

  get wantAscend(): boolean { return this.state.wantAscend; }
  set wantAscend(value: boolean) { this.state.wantAscend = value; }

  get mainActivity(): string {
    console.log('AutoPlay.mainActivity getter called, value:', this.state?.mainActivity);
    return this.state.mainActivity;
  }
  set mainActivity(value: string) { this.state.mainActivity = value; }

  get activities(): string {
    console.log('AutoPlay.activities getter called, value:', this.state?.activities);
    return this.state.activities;
  }
  set activities(value: string) { this.state.activities = value; }

  // Additional accessors for Dashboard
  get nextPurchase(): string | null {
    console.log('AutoPlay.nextPurchase getter called, this.state:', this.state, 'value:', this.state?.nextPurchase);
    return this.state.nextPurchase;
  }
  set nextPurchase(value: string | null) { this.state.nextPurchase = value; }

  get nextPurchaseType(): string | null { return this.state.nextPurchaseType; }
  set nextPurchaseType(value: string | null) { this.state.nextPurchaseType = value; }

  get nextPurchasePrice(): number | null { return this.state.nextPurchasePrice; }
  set nextPurchasePrice(value: number | null) { this.state.nextPurchasePrice = value; }

  get nextPurchasePP(): number | null { return this.state.nextPurchasePP; }
  set nextPurchasePP(value: number | null) { this.state.nextPurchasePP = value; }

  get deadline(): number { return this.state.deadline; }
  set deadline(value: number) { this.state.deadline = value; }

  get now(): number { return this.state.now; }
  set now(value: number) { this.state.now = value; }

  get savingsGoal(): number { return this.config.savingsGoal; }
  set savingsGoal(value: number) { this.config.savingsGoal = value; }

  get hyperActive(): boolean { return this.state.hyperActive; }
  set hyperActive(value: boolean) { this.state.hyperActive = value; }

  get savingsStart(): number { return this.state.savingsStart; }
  set savingsStart(value: number) { this.state.savingsStart = value; }

  get statusInfo() { return this.state.statusInfo; }
  set statusInfo(value) { this.state.statusInfo = value; }

  get workingOnSpecialAchievement(): boolean { return this.state.workingOnSpecialAchievement; }
  set workingOnSpecialAchievement(value: boolean) { this.state.workingOnSpecialAchievement = value; }

  // Public methods expected by modules
  info(message: string): void {
    console.log(`[CookieBot] ${message}`);
  }

  setMainActivity(activity: string): void {
    // When mainActivity changes, reset activities to the new base
    if (this.state.mainActivity !== activity) {
      this.state.mainActivity = activity;
      this.state.activities = activity;
    }
  }

  addActivity(activity: string): boolean {
    if (!this.state.activities.includes(activity)) {
      this.state.activities += '<div class="line"></div>' + activity;
      return true;
    }
    return false;
  }

  logAction(action: string, details?: string): void {
    if (this.dashboard) {
      this.dashboard.logAction(action, details);
    }
  }

  logStatus(category: string, message: string, details?: string): void {
    if (this.dashboard) {
      this.dashboard.logStatus(category, message, details);
    }
  }

  constructor() {
    // Initialize default configuration
    this.config = this.getDefaultConfig();
    this.state = this.getDefaultState();

    // Initialize public achievement arrays
    this.wantedAchievements = [...WANTED_ACHIEVEMENTS];
    this.lateAchievements = [...LUMP_RELATED_ACHIEVEMENTS];

    // Create dashboard FIRST so logging callbacks can use it
    this.dashboard = new Dashboard();

    // Helper methods for logging and activities (now dashboard exists)
    const logAction = (action: string, details?: string) => {
      // Dashboard handles all action history tracking
      this.dashboard.logAction(action, details);
    };

    const logStatus = (type: string, message: string, details?: string) => {
      // Dashboard handles all status history tracking
      this.dashboard.logStatus(type, message, details);
    };

    const addActivity = (activity: string): boolean => {
      // Original uses string concatenation with HTML, not array
      // Check for duplicates before adding
      if (!this.state.activities.includes(activity)) {
        this.state.activities += '<div class="line"></div>' + activity;
        return true;
      }
      return false;
    };

    // Initialize centralized logger AFTER dashboard created
    Logger.initialize({
      logAction,
      logStatus,
      addActivity,
    });

    // Initialize modules with proper constructor arguments
    this.goldenCookieHandler = new GoldenCookieHandler(
      {
        GoldenClickMode: this.config.autoGoldenCookie ? 1 : 0,
        CheatGolden: this.config.cheatGolden,
      },
      logAction,
      addActivity,
      () => this.grindingCheat()
    );

    this.savingsManager = new SavingsManager(this.config, logStatus);

    this.purchaseManager = new PurchaseManager({
      logAction,
      addActivity,
    });

    // Create upgrade manager context (moved to BuildingManager)
    // this.upgradeContext = {
    //   now: this.state.now,
    //   savingsGoal: this.config.savingsGoal,
    //   canUseLumps: false,
    //   nextAchievement: null,
    //   nextPurchase: null,
    //   nextPurchaseType: null,
    //   nextPurchasePrice: null,
    //   nextPurchasePP: null,
    //   hyperActive: false,
    //   logAction,
    //   addActivity,
    // };
    // this.upgradeManager = new UpgradeManager(this.upgradeContext); // Moved to BuildingManager

    this.seasonHandler = new SeasonHandler();
    this.sugarLumpManager = new SugarLumpManager(this.state);
    this.wrinklerManager = new WrinklerManager(this.state);
    this.achievementHandler = new AchievementHandler();

    // Create ascension context (simplified - will need full AutoPlayContext later)
    const ascensionContext: AutoPlayContext = {
      now: this.state.now,
      nextAchievement: 0,
      wantedAchievements: [...WANTED_ACHIEVEMENTS],
      lumpHarvestAchievements: [],
      wantAscend: false,
      Config: {},
      mainActivity: '',
      activities: '',
      hyperActive: false,
      workingOnSpecialAchievement: false,
      plantPending: false,
      delay: 0,
      finished: false,
      kittens: [],
      maxBuildings: [],
      cursors: [],
      butterBiscuits: [],
      expensive: [],
      info: (msg: string) => console.log(msg),
      logAction,
      logStatus,
      addActivity,
      setMainActivity: (activity: string) => console.log(`Main: ${activity}`),
      setDeadline: (time: number) => console.log(`Deadline: ${time}`),
      findNextAchievement: () => {},
      endPhase: () => false,
      preNightMode: () => false,
      mustRebornAscend: () => false,
      assignSpirit: () => {},
    };
    this.ascensionManager = new AscensionManager(ascensionContext);

    this.dragonManager = new DragonManager();
    // Dashboard already created at top of constructor
    this.nightMode = new NightMode(this.config);
    this.pantheonManager = new PantheonManager();
    this.grimoireManager = new GrimoireManager();
    this.gardenManager = new GardenManager();
    this.stockMarketManager = new StockMarketManager();

    // Set up activity callback for modules that need it
    this.sugarLumpManager.setAddActivity(addActivity);
    this.nightMode.setAddActivityCallback(addActivity);
    this.gardenManager.setAddActivity(addActivity);

    // Set up wrinkler manager dependencies
    this.wrinklerManager.setDependencies(
      this.seasonHandler,
      [...WANTED_ACHIEVEMENTS],
      this.state.nextAchievement
    );

    // Set up pantheon manager reference for night mode
    this.nightMode.setPantheonManager(this.pantheonManager);

    // Set up stock market manager reference for night mode
    this.nightMode.setStockMarketManager(this.stockMarketManager);
  }

  /**
   * Initialize the bot
   */
  init(): void {
    if (this.state.isInitialized) {
      console.log('CookieBot already initialized');
      return;
    }

    console.log(`CookieBot v${AutoPlay.version} initializing...`);

    // Load saved configuration
    this.loadConfig();

    // Find first achievement to work on
    this.achievementHandler.findNextAchievement();

    // Create dashboard UI
    this.dashboard.createDashboard();
    this.dashboard.updateDashboard();

    // Update dashboard every second for real-time stats
    setInterval(() => {
      this.dashboard.updateDashboard();
    }, 1000);

    // Hook into Game.UpdateMenu to add config options to preferences
    this.setupMenuHook();

    // Do an initial bestBuy check to populate purchase info for dashboard
    console.log('CookieBot: Running initial bestBuy() to populate purchase info');
    const Game = (globalThis as any).Game;
    const cpsMult = Game.cookiesPs / Game.unbuffedCps;
    this.purchaseManager.setState(
      this.config.savingsGoal,
      Date.now(),
      cpsMult,
      this.sugarLumpManager.getCanUseLumps(),
      this.state.nextAchievement
    );
    this.purchaseManager.bestBuy();
    const purchaseInfo = this.purchaseManager.getPurchaseInfo();
    if (purchaseInfo) {
      this.state.nextPurchase = purchaseInfo.name;
      this.state.nextPurchaseType = purchaseInfo.type;
      this.state.nextPurchasePP = purchaseInfo.pp;
      this.state.nextPurchasePrice = purchaseInfo.price;
    }

    // Set up periodic execution
    this.scheduleNextRun();

    this.state.isInitialized = true;
    console.log('CookieBot initialized successfully');
  }

  /**
   * Hook into Game.UpdateMenu to add config options to preferences menu
   */
  private setupMenuHook(): void {
    const Game = (globalThis as any).Game;

    // Backup original UpdateMenu if not already backed up
    if (!(Game as any).__originalUpdateMenu) {
      (Game as any).__originalUpdateMenu = Game.UpdateMenu;
    }

    // Override UpdateMenu to inject our config options
    const self = this;
    Game.UpdateMenu = function() {
      // Call original UpdateMenu first
      (Game as any).__originalUpdateMenu();

      // Add our config menu when on preferences screen
      if (Game.onMenu === 'prefs') {
        self.dashboard.addMenuPref();
      }
    };
  }

  /**
   * Main execution cycle - implements 8-phase model from original
   * Runs every 300ms via setInterval
   */
  private periodic(): void {
    // Declare Game global
    const Game = (globalThis as any).Game;

    // ===== Phase 0: Early exits for timers =====
    if (Game.AscendTimer > 0 || Game.ReincarnateTimer > 0) return;

    // ===== Phase 1: Delay handling =====
    if (this.state.delay > 0) {
      this.state.delay--;
      return;
    }

    // ===== Phase 2: Setup =====
    this.state.now = Date.now();

    // DON'T reset activities every cycle - let them accumulate
    // Only reset when mainActivity changes (checked in Phase 8)
    // this.state.activities = this.state.mainActivity;

    // Handle "Just Right" achievement (special case)
    if (this.state.nextAchievement === 397) {
      this.runJustRight();
      return;
    }

    // Calculate CPS multiplier for later use
    const cpsMult = Game.cookiesPs / Game.unbuffedCps;

    // Update finished state - check if all lump-related achievements are complete
    this.state.finished = LUMP_RELATED_ACHIEVEMENTS.every((id) => Game.AchievementsById[id].won);

    // ===== Phase 3: Night mode =====
    if (this.nightMode.checkNightMode() && !Game.ascensionMode) {
      // If sleeping, only cheat sugar lumps at level 4 and return
      if (this.config.cheatLumps === 4) {
        this.sugarLumpManager.handleSugarLumps();
      }
      return;
    }

    // ===== Phase 4: Fast actions (always run every 300ms) =====
    this.handleClicking();

    if (this.config.autoGoldenCookie) {
      this.goldenCookieHandler.handleGoldenCookies();
    }

    // Speed cheat sugar lumps if level 4
    if (this.config.cheatLumps === 4 && this.config.autoSugarLumps) {
      this.sugarLumpManager.handleSugarLumps();
    }

    // ===== Phase 5: High-activity phase =====
    console.log('Phase 5 check: hyperActive=', this.state.hyperActive, 'now=', this.state.now, 'deadline=', this.state.deadline, 'check result=', (this.state.hyperActive || (this.state.now >= this.state.deadline)));
    if (this.state.hyperActive || (this.state.now >= this.state.deadline)) {
      console.log('Phase 5: Entering high-activity phase, calling bestBuy()');
      this.state.hyperActive = false; // Reset flag, can be overwritten

      // Unified bestBuy logic (compares buildings and upgrades by PP)
      this.bestBuy();

      // Set hyperActive if CPS multiplier is very high
      if (cpsMult > 100) {
        this.state.hyperActive = true;
      }

      // Handle speed minigames (grimoire spells)
      this.handleSpeedMinigames();
    }

    // ===== Phase 6: Frequent ascension checks =====
    // Check ascend often in reborn and during ascend
    if (Game.ascensionMode === 1 || this.state.onAscend) {
      if (this.config.autoAscend) {
        this.ascensionManager.handleAscend();
        // Sync wantAscend state from ascension manager context
        this.state.wantAscend = (this.ascensionManager as any).context.wantAscend;
      }
    }

    // Check ascend often for lucky payout
    if (!Game.Upgrades['Lucky payout'].bought && Game.heavenlyChips > 77777777) {
      if (this.config.autoAscend) {
        this.ascensionManager.handleAscend();
        // Sync wantAscend state from ascension manager context
        this.state.wantAscend = (this.ascensionManager as any).context.wantAscend;
      }
    }

    // ===== Phase 7: Deadline check (end of high-activity) =====
    if (this.state.now < this.state.deadline) return;

    // ===== Phase 8: Periodic actions (every 15 seconds) =====

    // Set robot name in bakery
    const bakeryName = (Game as any).bakeryNameL.textContent;
    const robotName = 'Automated ';
    if (bakeryName.slice(0, robotName.length) !== robotName) {
      (Game as any).bakeryNameL.textContent = robotName + bakeryName;
    }

    // Skip status() when menu is open - it closes the menu
    if (!Game.onMenu) {
      this.status(false);
    }

    // Plant pending warning
    if (this.state.plantPending) {
      Logger.addActivity('Make sure to harvest the new plant before ascend!');
    }

    // Calculate dynamic deadline based on when next purchase is affordable
    let dynamicDeadline = 15000; // Default 15 seconds
    if (this.state.nextPurchasePrice && Game.cookiesPs > 0) {
      const availableCookies = Game.cookies - (this.config.savingsGoal || 0);
      const needsForPurchase = this.state.nextPurchasePrice - availableCookies;

      if (needsForPurchase > 0) {
        // Calculate seconds until affordable (with buffer to catch it early)
        let timeToAfford = (needsForPurchase / Game.cookiesPs) * 1000; // Convert to ms
        const bufferTime = 500; // Check 0.5s before affordable
        timeToAfford = Math.max(timeToAfford - bufferTime, 100);

        // Smart deadline calculation to avoid overshooting
        if (timeToAfford <= 15000) {
          // Can check exactly when it's affordable
          dynamicDeadline = timeToAfford;
        } else {
          // For longer waits, check at intervals that lead up to affordable time
          const remainder = timeToAfford % 15000;
          if (remainder > 1000) {
            // Check at the remainder time to align with affordable moment
            dynamicDeadline = remainder;
          } else {
            // Remainder is small, just use standard 15s interval
            dynamicDeadline = 15000;
          }
        }

        dynamicDeadline = Math.max(dynamicDeadline, 100); // Minimum 100ms
      } else {
        // Already affordable - check immediately
        dynamicDeadline = 100;
      }
    }

    this.state.deadline = this.state.now + dynamicDeadline;
    this.setDeadline(this.state.now + (this.state.now - Game.startDate) / 10); // Quick start

    // Skip dashboard update if user has a menu open
    if (!Game.onMenu || Game.onMenu === '') {
      this.dashboard.render();
    }

    // Run all periodic modules (every 15 seconds)

    // Sugar lumps (if not level 4, which runs in fast phase)
    if (this.config.cheatLumps !== 4 && this.config.autoSugarLumps) {
      this.sugarLumpManager.handleSugarLumps();
    }

    // Savings calculation
    if (this.config.savingsEnabled) {
      this.savingsManager.handleSavings();
    }

    // Seasons
    if (this.config.autoSeason) {
      this.seasonHandler.handleSeasons();
    }

    // Dragon
    this.dragonManager.handleDragon();

    // Small achievements
    this.achievementHandler.handleSmallAchievements();

    // Wrinklers
    if (this.config.autoWrinklers) {
      this.wrinklerManager.updateState(this.state.nextAchievement);
      this.wrinklerManager.handleWrinklers();
    }

    // Ascension
    if (this.config.autoAscend) {
      this.ascensionManager.handleAscend();
      // Sync wantAscend state from ascension manager context
      this.state.wantAscend = (this.ascensionManager as any).context.wantAscend;
    }

    // Minigames (garden, pantheon, stock market)
    this.handleMinigames();

    // Handle notes
    this.handleNotes();

    // Add some more hints what the bot is doing (but only if not working on special achievements)
    if (!this.state.workingOnSpecialAchievement) {
      if (!Game.HasAchiev('Elder')) {
        Logger.addActivity('Getting 7 grandma types');
      }
      if (Game.HasAchiev('Elder') &&
          Game.Upgrades['Bingo center/Research facility'].unlocked &&
          Game.ascensionMode !== 1 &&
          !Game.Upgrades['Bingo center/Research facility'].bought) {
        Logger.addActivity('Funding the grandma research facility');
      }
    }

    // Schedule next periodic run to keep the loop going
    this.scheduleNextRun();
  }

  /**
   * Schedule the next periodic execution
   * Original runs at fixed 300ms interval via setInterval
   */
  private scheduleNextRun(): void {
    setTimeout(() => this.periodic(), 300);
  }

  /**
   * Handle clicking - respects Neverclick/True Neverclick achievements
   * Click modes: 0=off, 1=normal, 2+=aggressive
   */
  private handleClicking(): void {
    const Game = (globalThis as any).Game;

    if (this.config.clickMode === 0) return;

    // Respect Neverclick achievement
    if (!Game.Achievements['Neverclick'].won && Game.cookieClicks <= 15) {
      return;
    }

    // Respect True Neverclick achievement in reborn endgame
    if (Game.ascensionMode === 1 && this.endPhase() &&
        !Game.Achievements['True Neverclick'].won && !Game.cookieClicks) {
      return;
    }

    // Uncanny clicker achievement (5 clicks in a row)
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
   */
  private speedClicking(): void {
    const Game = (globalThis as any).Game;
    Game.ClickCookie();
    const clickCount = 1 << (10 * (this.config.clickMode - 2));
    Game.ClickCookie(0, clickCount * Game.computedMouseCps);
  }

  /**
   * Unified bestBuy - compares buildings AND upgrades by payback period
   * Delegates to BuildingManager which has full CookieMonster integration
   * Original: lines 471-615 in cookieAutoPlayBeta.js
   */
  private bestBuy(): void {
    const Game = (globalThis as any).Game;

    // Update BuildingManager state with current context
    const cpsMult = Game.cookiesPs / Game.unbuffedCps;
    this.purchaseManager.setState(
      this.config.savingsGoal,
      this.state.now,
      cpsMult,
      this.sugarLumpManager.getCanUseLumps(),
      this.state.nextAchievement
    );

    // Delegate to BuildingManager
    this.purchaseManager.bestBuy();

    // Sync purchase info from BuildingManager to AutoPlay state
    const purchaseInfo = this.purchaseManager.getPurchaseInfo();
    console.log('AutoPlay.bestBuy: purchaseInfo from manager:', purchaseInfo);
    if (purchaseInfo) {
      this.state.nextPurchase = purchaseInfo.name;
      this.state.nextPurchaseType = purchaseInfo.type;
      this.state.nextPurchasePP = purchaseInfo.pp;
      this.state.nextPurchasePrice = purchaseInfo.price;
      console.log('AutoPlay.bestBuy: Synced to state:', this.state.nextPurchase, this.state.nextPurchaseType, this.state.nextPurchasePrice);
    } else {
      console.log('AutoPlay.bestBuy: No purchase info, clearing state');
      this.state.nextPurchase = null;
      this.state.nextPurchaseType = null;
      this.state.nextPurchasePP = null;
      this.state.nextPurchasePrice = null;
    }
  }

  /**
   * Check if an upgrade should be avoided
   * (Moved to BuildingManager.shouldAvoidBuy())
   */
  // @ts-ignore TS6133 - Legacy method, kept for reference
  private avoidBuy(upgrade: any): boolean {
    const Game = (globalThis as any).Game;

    switch (upgrade.id) {
      case 71: // One mind
      case 73: // Communal brainsweep
        return Game.Achievements['Elder nap'].won &&
               Game.Achievements['Grandmapocalypse'].won &&
               Game.Achievements['Elder slumber'].won &&
               Game.Achievements['Elder calm'].won;

      case 74: // Elder Pledge
        return Game.Achievements['Elder nap'].won &&
               Game.Achievements['Elder slumber'].won &&
               Game.Upgrades['Elder Covenant'].unlocked;

      case 84: // Elder Covenant
        return Game.Upgrades['Elder Pledge'].bought ||
               Game.Achievements['Elder calm'].won;

      case 227: // Chocolate egg
        return true;

      case 563: // Shimmering veil
        return this.state.nextAchievement !== 432 ||
               Game.Achievements['Thick-skinned'].won;

      default:
        return upgrade.pool === 'toggle';
    }
  }

  /**
   * Handle speed minigames - grimoire spells
   * Runs in high-activity phase
   */
  private handleSpeedMinigames(): void {
    const Game = (globalThis as any).Game;

    // Update grimoire state
    this.grimoireManager.updateState(
      this.sugarLumpManager.getCanUseLumps(),
      Game.cookiesPs / Game.unbuffedCps
    );

    // Cast grimoire spells
    this.grimoireManager.handleGrimoires();
  }

  /**
   * Handle periodic minigames - garden, pantheon, stock market
   * Runs every 15 seconds
   */
  private handleMinigames(): void {
    const Game = (globalThis as any).Game;
    if (Game.ascensionMode === 1) return; // No minigames in born again mode

    // Update pantheon state
    this.pantheonManager.updateState(
      this.state.now,
      this.state.poppingWrinklers,
      this.sugarLumpManager.isCheatLumps()
    );

    // Handle pantheon spirit assignments
    this.pantheonManager.handlePantheon();

    // Update garden state
    this.gardenManager.updateState({
      now: this.state.now,
      cpsMult: Game.cookiesPs / Game.unbuffedCps,
      wantAscend: this.state.wantAscend,
      savingsGoal: this.config.savingsGoal,
      canUseLumps: this.sugarLumpManager.getCanUseLumps(),
      finished: this.state.finished,
      lumpRelatedAchievements: [...LUMP_RELATED_ACHIEVEMENTS] as number[],
      poppingWrinklers: this.state.poppingWrinklers,
      grindingCheat: this.grindingCheat(),
      cheatGolden: this.config.cheatGolden,
    });

    // Handle garden planting and harvesting
    this.gardenManager.handleGarden();

    // Update plantPending state from garden
    this.state.plantPending = this.gardenManager.isPlantPending();

    // Update stock market state
    this.stockMarketManager.updateState({
      resetTime: this.state.resetTime || this.state.now,
      wantAscend: this.state.wantAscend,
      plantPending: this.state.plantPending,
    });

    // Handle stock market trading
    this.stockMarketManager.handleStockMarket();
  }

  /**
   * Handle notes - extend lifetime of game notifications
   */
  private handleNotes(): void {
    const Game = (globalThis as any).Game;
    for (const i in Game.Notes) {
      if (Game.Notes[i].quick === 0) {
        Game.Notes[i].life = 2000 * Game.fps;
        Game.Notes[i].quick = 1;
      }
    }
  }

  /**
   * Status check - calculate missing achievements/upgrades/lumps
   */
  private status(_print: boolean = true): void {
    const Game = (globalThis as any).Game;
    let ach = 0;
    let sach = 0;
    let up = 0;
    let lum = 0;
    const nonUp = [71, 72, 73, 87, 227];

    // Count missing achievements
    for (const a in Game.Achievements) {
      const me = Game.Achievements[a];
      if (!me.won && me.pool !== 'dungeon') {
        if (me.pool === 'shadow') sach++;
        ach++;
      }
    }

    // Count missing upgrades
    for (const i in Game.Upgrades) {
      const me = Game.Upgrades[i];
      if (!me.bought && me.pool !== 'debug' && me.pool !== 'toggle') {
        if (Game.resets && nonUp.includes(me.id)) continue;
        up++;
      }
    }

    // Count missing lumps for building levels
    for (const o in Game.Objects) {
      const me = Game.Objects[o];
      let maxl = 10;
      let myl = 0;
      if (me.id === 0) maxl = 12; // Cursors need level 12
      for (let l = me.level + 1; l <= maxl; l++) {
        myl += l;
      }
      lum += myl;
    }
    lum -= Game.lumps;
    if (lum < 0) lum = 0;

    // Store status info for dashboard
    this.state.statusInfo = {
      achievements: ach,
      shadowAchievements: sach,
      upgrades: up,
      lumps: lum,
    };
  }

  /**
   * Set deadline to earlier time if needed
   */
  private setDeadline(d: number): void {
    if (this.state.deadline > d) {
      this.state.deadline = d;
    }
  }

  /**
   * Check if we're in the endgame phase
   *
   * Returns true when the next achievement is NOT in the wanted list,
   * meaning we've completed all critical path achievements.
   *
   * Original: AutoPlay.endPhase()
   */
  endPhase(): boolean {
    const wantedAchievements = WANTED_ACHIEVEMENTS as readonly number[];
    return wantedAchievements.indexOf(this.state.nextAchievement) < 0;
  }

  /**
   * Check if we're in grinding mode (working on final achievements)
   *
   * Grinding mode activates when we've completed all but the last 10 achievements.
   * During grinding, the bot:
   * - Does not sleep at night (stays active 24/7)
   * - Focuses on maximizing cookie production
   *
   * Original: AutoPlay.grinding()
   * @public - Used by NightMode to determine if bot should sleep
   */
  grinding(): boolean {
    const Game = (globalThis as any).Game;
    const wantedAchievements = WANTED_ACHIEVEMENTS as readonly number[];

    // Get achievement that starts grinding (10th from end)
    const grindingStart = wantedAchievements[wantedAchievements.length - 10];

    // If we've achieved the grinding start achievement
    if (Game.AchievementsById[grindingStart].won) {
      // And we're not yet in endPhase
      if (!this.endPhase()) {
        Logger.addActivity('Grinding cookies - do not sleep at night.');
        return true;
      }
    }
    return false;
  }

  /**
   * Check if we're in cheating/aggressive mode (working on final 5 achievements)
   *
   * Cheating mode activates when we've completed all but the last 8 achievements.
   * During cheating, the bot uses aggressive golden cookie tactics.
   *
   * Original: AutoPlay.grindingCheat()
   * @public - Used by GoldenCookieHandler for aggressive tactics
   */
  grindingCheat(): boolean {
    if (!this.grinding()) return false;

    const Game = (globalThis as any).Game;
    const wantedAchievements = WANTED_ACHIEVEMENTS as readonly number[];

    // Get achievement that starts cheating (8th from end)
    const cheatingStart = wantedAchievements[wantedAchievements.length - 8];

    // If we've achieved the cheating start achievement
    if (Game.AchievementsById[cheatingStart].won) {
      return true;
    }
    return false;
  }

  /**
   * Run Just Right achievement special logic
   *
   * Achievement #397 "Just Right" requires:
   * - Exactly 1 trillion (10^12) cookies baked
   * - Specific building counts (each type has 10 more than the next)
   *
   * This is a multi-phase process:
   * 1. Build up to ~100B cookies with buildings/upgrades
   * 2. Sell buildings to reach exact cookie count
   * 3. Fine-tune by clicking or buying cursors
   * 4. Ascend when exact count reached
   *
   * Original: AutoPlay.runJustRight() (lines 172-223)
   */
  private runJustRight(): void {
    const Game = (globalThis as any).Game;

    // Don't let savings interfere with this achievement
    this.config.savingsGoal = 0;
    Logger.addActivity('Running just right.');

    // Handle ascension checks
    this.ascensionManager.handleAscend();
    // Sync wantAscend state from ascension manager context
    this.state.wantAscend = (this.ascensionManager as any).context.wantAscend;

    // If "You" building exists, we need to start fresh
    const youBuilding = Game.ObjectsById[Game.ObjectsById.length - 1];
    if (youBuilding && youBuilding.amount) {
      this.ascensionManager.triggerAscend('Starting to ascend just right properly.');
      return;
    }

    const goal = 1000000000000; // 1 trillion exact
    const notBuy = [0, 1, 2, 3, 4, 5, 6, 129, 324]; // Upgrades to avoid

    // Phase 1: Build up phase (< 100B cookies)
    if (Game.cookies < goal / 10) {
      // Buy buildings (each type should have 10 more than the next)
      for (let i = Game.ObjectsById.length - 2; i >= 0; i--) {
        const building = Game.ObjectsById[i];
        const nextBuilding = Game.ObjectsById[i + 1];
        const targetAmount = 10 + (nextBuilding ? nextBuilding.amount : 0);

        if (building.getPrice() < Game.cookies && building.amount < targetAmount) {
          building.buy(1);
          return;
        }
      }

      // Buy upgrades (except blocked ones)
      for (const upgradeId in Game.UpgradesById) {
        const upgrade = Game.UpgradesById[upgradeId];
        if (
          upgrade.unlocked &&
          !upgrade.bought &&
          upgrade.canBuy() &&
          upgrade.pool !== 'toggle' &&
          notBuy.indexOf(upgrade.id) < 0
        ) {
          upgrade.buy(true);
        }
      }
    } else {
      // Phase 2: Precision phase (>= 100B cookies)
      const cookieDiff = goal - Game.cookies;

      if (Game.BuildingsOwned === 0) {
        // Phase 2a: All buildings sold - fine-tune cookie count
        if (cookieDiff < 0) {
          // Overshot - increment counter for cursor adjustment
          if (!this.state.runRightCount) this.state.runRightCount = 0;
          this.state.runRightCount++;
        }

        if (Math.round(Game.cookiesd) === goal) {
          // Perfect! Ascend with success
          this.ascensionManager.triggerAscend('Fixed run just right.');
        } else if (cookieDiff < -goal && this.state.now - Game.startDate > 60000) {
          // Too far off after 1 minute - retry
          this.ascensionManager.triggerAscend('ascend just right did not work, retry.');
        } else if (cookieDiff < -2000000000) {
          // Way over - buy many cursors to burn cookies
          Game.ObjectsById[0].buy(130 + (this.state.runRightCount || 0));
        } else if (cookieDiff < -6000000) {
          // Over by 6M - buy cursors
          Game.ObjectsById[0].buy(90 + (this.state.runRightCount || 0));
        } else if (cookieDiff < -30000) {
          // Over by 30k - buy cursors
          Game.ObjectsById[0].buy(50 + (this.state.runRightCount || 0));
        } else if (cookieDiff < 0) {
          // Slightly over - buy few cursors
          Game.ObjectsById[0].buy(22 + (this.state.runRightCount || 0));
        } else if (cookieDiff > 10000000) {
          // Need >10M - buy bank
          Game.ObjectsById[5].buy(1);
        } else if (cookieDiff > 500000) {
          // Need >500k - buy factory
          Game.ObjectsById[4].buy(1);
        } else if (cookieDiff > 5000) {
          // Need >5k - buy farm
          Game.ObjectsById[2].buy(1);
        } else if (cookieDiff > 50) {
          // Need >50 - buy cursor
          Game.ObjectsById[0].buy(1);
        } else {
          // Very close - just click
          Game.ClickCookie();
        }
      } else {
        // Phase 2b: Still have buildings - sell them off
        if (cookieDiff / Game.cookiesPs > 1000) {
          // Need more cookies first - buy a bank
          Game.ObjectsById[5].buy(1);
        }

        // Sell excess buildings (keep 10 more than next type)
        for (let i = Game.ObjectsById.length - 2; i >= 0; i--) {
          const building = Game.ObjectsById[i];
          const nextBuilding = Game.ObjectsById[i + 1];
          const targetAmount = 10 + (nextBuilding ? nextBuilding.amount : 0);

          if (building.amount > targetAmount) {
            building.sell(building.amount - targetAmount);
            return;
          }

          // Sell buildings if their value would overshoot goal
          if (
            building.amount > 0 &&
            4 * building.getReverseSumPrice(building.amount) + Game.cookiesPs > cookieDiff
          ) {
            building.sell(100);
          }
        }
      }
    }
  }

  /**
   * Load configuration from localStorage
   */
  private loadConfig(): void {
    try {
      const saved = localStorage.getItem('CookieBot_Config');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.config = { ...this.config, ...parsed };
        console.log('Configuration loaded from localStorage');
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
    }
  }

  /**
   * Save configuration to localStorage
   */
  saveConfig(): void {
    try {
      localStorage.setItem('CookieBot_Config', JSON.stringify(this.config));
      console.log('Configuration saved to localStorage');
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): AutoPlayConfig {
    return {
      nightMode: false,
      fontSize: 12,
      menuPos: [0, 0],
      autoGoldenCookie: true,
      autoReindeer: true,
      autoFrenzy: true,
      autoClickingFrenzy: true,
      autoElderFrenzy: false,
      autoSeason: true,
      autoAscend: false,
      autoSugarLumps: true,
      autoWrinklers: true,
      clickMode: 1, // 0=off, 1=normal, 2+=aggressive
      cheatLumps: 0, // 0=off, 1=auto, 2-4=manual levels
      cheatGolden: 0, // 0=off, 1=auto, 2+=manual levels
      buyMode: 'pp',
      minCookieBank: 0,
      savingsGoal: 0,
      savingsEnabled: true,
      SavingStrategy: 0, // 0=NONE, 1=AUTO, 2=LUCKY, 3=LUCKY_FRENZY
      seasonOrder: ['christmas', 'valentines', 'easter', 'halloween'],
      currentSeasonIndex: 0,
    };
  }

  /**
   * Get default state
   */
  private getDefaultState(): AutoPlayState {
    const now = Date.now();
    return {
      version: AutoPlay.version,
      now: now,
      lastCheck: 0,
      timeToNextBuy: 0,
      delay: 0,
      deadline: now + 15000, // Start with 15s deadline
      hyperActive: false,
      nextAchievement: 0,
      workingOnSpecialAchievement: false,
      plantPending: false,
      nextPurchase: null,
      nextPurchaseType: null,
      nextPurchasePP: null,
      nextPurchasePrice: null,
      buy10: false,
      onAscend: false,
      savingsStart: now,
      savingsFraction: 0,
      mainActivity: 'Doing nothing in particular.',
      activities: 'Doing nothing in particular.',
      menuVisible: false,
      nextWrinkler: -1,
      poppingWrinklers: false,
      wrinklerTime: now,
      wantAscend: false,
      finished: false,
      isInitialized: false,
    };
  }

  /**
   * Toggle dashboard visibility
   */
  toggleDashboard(): void {
    this.state.menuVisible = !this.state.menuVisible;
    this.dashboard.toggle();
  }

  /**
   * Toggle night mode
   */
  toggleNightMode(): void {
    this.nightMode.toggle();
    this.config.nightMode = !this.config.nightMode;
    this.saveConfig();
  }

  /**
   * Get current configuration (for external access)
   */
  getConfig(): AutoPlayConfig {
    return this.config;
  }

  /**
   * Update configuration (for external access)
   */
  updateConfig(updates: Partial<AutoPlayConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  /**
   * Get current state (for external access)
   */
  getState(): AutoPlayState {
    return this.state;
  }
}
