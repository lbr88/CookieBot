/**
 * Manages sugar lump harvesting and spending
 *
 * Handles:
 * - Automatic lump harvesting at optimal times
 * - Auto-spending lumps on building levels for minigames
 * - Lump type manipulation for achievements (when cheating enabled)
 */

import type { AutoPlayState } from '../types/autoplay';

declare const Game: any;
declare const AutoPlay: any;

// Sugar lump types
enum LumpType {
  Normal = 0,
  Bifurcated = 1,
  Golden = 2,
  Meaty = 3,
  Caramelized = 4
}

// Building IDs for level 1 order (unlocking minigames)
const LEVEL_1_ORDER = [2, 6, 7, 5]; // Farm, Wizard tower, Temple, Bank (Garden, Grimoire, Pantheon, Stock Market)

// Lump-related achievement IDs (307-320, plus 336, 427, 447, 525, 396, 268, 271)
const LUMP_RELATED_ACHIEVEMENTS = [
  307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320,
  336, 427, 447, 525, 396, 268, 271
];

export class SugarLumpManager {
  private minLumpsOK: boolean = false;
  private cheatLumps: boolean = false;
  private canUseLumps: boolean = false;

  // Injected dependencies
  private state: AutoPlayState;
  private addActivity: (msg: string) => void;

  // Extended config for sugar lumps
  private cheatLumpsLevel: number = 0;

  /**
   * Constructor - expects 1 argument: state object
   * @param state AutoPlayState for accessing game state
   */
  constructor(state: AutoPlayState) {
    this.state = state;
    // Default activity logger - should be overridden via setAddActivity if needed
    this.addActivity = (msg: string) => console.log(`[SugarLumps] ${msg}`);
  }

  /**
   * Set the activity logging callback
   * @param addActivity Callback to log activities
   */
  setAddActivity(addActivity: (msg: string) => void): void {
    this.addActivity = addActivity;
  }

  /**
   * Set the cheat lumps level
   * @param level CheatLumps configuration level
   */
  setCheatLumpsLevel(level: number): void {
    this.cheatLumpsLevel = level;
  }

  /**
   * Main sugar lump handler - called periodically with no parameters
   */
  handleSugarLumps(): void {
    // Type assertions for Game properties not yet in type definitions
    const game = Game as any;

    if (!game.canLumps()) return; // Do not work with sugar lumps before enabled
    if (Game.ascensionMode === 1) return; // No sugar lumps in born again mode

    const now = this.state.now;
    const age = now - game.lumpT;

    // Hand-pick normal lumps when mature for "Hand-picked" achievement
    if (
      age >= game.lumpMatureAge &&
      game.lumpCurrentType === LumpType.Normal &&
      this.minLumpsOK &&
      !Game.Achievements["Hand-picked"].won
    ) {
      this.harvestLump();
    }

    // Normal harvesting when ripe
    if (age >= game.lumpRipeAge) {
      this.harvestLump();
    }

    // Apply lump time cheats if enabled
    this.cheatSugarLumps(age);

    // Auto-spend lumps on building levels
    this.useLump();
  }

  /**
   * Harvest a sugar lump by clicking it
   */
  private harvestLump(): void {
    const game = Game as any;
    game.clickLump();
    this.useLump(); // Immediately try to use the harvested lump
  }

  /**
   * Accelerate sugar lump growth and manipulate types (cheating)
   */
  private cheatSugarLumps(age: number): void {
    const game = Game as any;
    this.cheatLumps = false;

    if (this.cheatLumpsLevel === 0) return;

    let cheatReduction = 25;

    // Level 1: Only cheat during endgame for lump achievements
    if (this.cheatLumpsLevel === 1) {
      // Check if we're in end phase and not finished
      if (typeof AutoPlay !== 'undefined') {
        if (AutoPlay.finished) return;
        if (typeof AutoPlay.endPhase === 'function' && !AutoPlay.endPhase()) return;
      }

      // If all lump achievements are done, no need to cheat
      if (
        LUMP_RELATED_ACHIEVEMENTS.every(
          (a) => Game.AchievementsById[a].won
        )
      ) {
        return;
      }

      // Apply 625x speedup when targeting lump achievements
      if (typeof AutoPlay !== 'undefined' && 'nextAchievement' in AutoPlay) {
        if (LUMP_RELATED_ACHIEVEMENTS.includes(AutoPlay.nextAchievement)) {
          cheatReduction *= 25; // 25 * 25 = 625x total speedup
        }
      }
    }

    this.cheatLumps = true;
    this.addActivity('Cheating sugar lumps.');

    // Set cheat reduction based on level
    if (this.cheatLumpsLevel === 2) cheatReduction = 25;
    if (this.cheatLumpsLevel === 3) cheatReduction = 25 * 25;
    if (this.cheatLumpsLevel === 4) cheatReduction = 25 * 25 * 25;

    // Accelerate lump growth by reducing time
    const cheatDelay = game.lumpRipeAge / cheatReduction;
    if (age < game.lumpRipeAge - cheatDelay) {
      game.lumpT -= cheatDelay * (cheatReduction - 1);
    }

    // Max level: manipulate lump types for achievements (RNG manipulation)
    if (this.cheatLumpsLevel === 4) {
      if (!Game.Achievements["Sugar sugar"].won) {
        // Bifurcated sugar lumps
        game.lumpCurrentType = LumpType.Bifurcated;
      } else if (
        !Game.Achievements["Sweetmeats"].won &&
        game.elderWrath > 0
      ) {
        // Meaty sugar lumps (grandmapocalypse only)
        game.lumpCurrentType = LumpType.Meaty;
      } else if (!Game.Achievements["Maillard reaction"].won) {
        // Caramelized sugar lumps
        game.lumpCurrentType = LumpType.Caramelized;
      } else {
        // Golden sugar lumps by default (give the most lumps when harvested)
        game.lumpCurrentType = LumpType.Golden;
      }
    }
  }

  /**
   * Auto-spend lumps on building levels (recursive)
   * Priority:
   * 1. Level 1 for minigame buildings (Garden, Grimoire, Pantheon, Stock Market)
   * 2. Farm to level 9 (for Garden)
   * 3. Cursor to level 12 (for Stock Market)
   * 4. All buildings to level 10
   * 5. Cursor to level 20 (for Luminous Gloves achievement)
   */
  private useLump(): void {
    this.canUseLumps = false;

    if (!Game.lumps) return;

    // Step 1: Get level 1 for minigame buildings
    for (const buildingId of LEVEL_1_ORDER) {
      const building = Game.ObjectsById[buildingId];
      if (!building.level && Game.lumps) {
        building.levelUp();
        this.useLump(); // Recursive call
        return;
      }
    }

    // Step 2: Bring Farm (Garden) to level 9
    const farm = Game.Objects["Farm"];
    if (farm.level < 9) {
      if (farm.level < Game.lumps) {
        farm.levelUp();
        this.useLump();
      }
      return;
    }

    // After Garden is level 9, we have minimum lumps OK
    this.minLumpsOK = true;

    // Keep reserve lumps before endgame
    const endPhase = (typeof AutoPlay !== 'undefined' && typeof AutoPlay.endPhase === 'function')
      ? AutoPlay.endPhase()
      : false;
    const lumpLimit = endPhase ? 0 : 100;

    // Step 3: Bring Cursor (Stock Market) to level 12
    const cursor = Game.Objects["Cursor"];
    if (cursor.level < 12) {
      if (cursor.level + lumpLimit < Game.lumps) {
        cursor.levelUp();
        this.useLump();
      }
      return;
    }

    // Step 4: Bring all buildings to level 10 (reverse order for efficiency)
    for (let i = Game.ObjectsById.length - 1; i >= 0; i--) {
      const building = Game.ObjectsById[i];
      if (building.level < 10) {
        if (building.level + lumpLimit < Game.lumps) {
          building.levelUp();
          this.useLump();
          return;
        }
      }
    }

    // All buildings are at least level 10
    this.canUseLumps = true;

    // Step 5: Bring Cursor to level 20 for "Luminous gloves" achievement
    if (cursor.level < 20) {
      if (cursor.level + 100 < Game.lumps) {
        cursor.levelUp();
        this.useLump();
        return;
      } else {
        this.canUseLumps = false;
      }
    }
  }

  /**
   * Get whether we can spend lumps freely (all priority upgrades done)
   */
  getCanUseLumps(): boolean {
    return this.canUseLumps;
  }

  /**
   * Get whether minimum lump requirements are met
   */
  getMinLumpsOK(): boolean {
    return this.minLumpsOK;
  }

  /**
   * Get whether we're currently cheating lumps
   */
  isCheatLumps(): boolean {
    return this.cheatLumps;
  }
}
