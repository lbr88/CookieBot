/**
 * Handles seasonal events and upgrades
 */

import { Logger } from '../utils/Logger';

/**
 * Helper function to create a range of numbers (inclusive)
 */
function range(start: number, end: number): number[] {
  const result: number[] = [];
  for (let i = start; i <= end; i++) {
    result.push(i);
  }
  return result;
}

export class SeasonHandler {
  // Season upgrade IDs
  private readonly valentineUpgrades: number[] = range(169, 174).concat([645]);
  private readonly christmasUpgrades: number[] = [168]; // just wait for dominion
  private readonly easterUpgrades: number[] = range(210, 229);
  private readonly halloweenUpgrades: number[] = range(134, 140);
  private readonly allSeasonUpgrades: number[];

  private elfClickTimeout: number | null = null;

  constructor() {
    this.allSeasonUpgrades = this.valentineUpgrades
      .concat(this.christmasUpgrades)
      .concat(this.easterUpgrades)
      .concat(this.halloweenUpgrades);
  }

  /**
   * Main season handling logic
   * Manages Santa upgrades, Christmas elf achievement, and season cycling
   */
  handleSeasons(): void {
    // Handle Santa development
    this.handleSanta();

    // Handle Christmas elf achievement
    this.handleChristmasElf();

    // Handle season cycling
    this.cycleSeason();
  }

  /**
   * Develop Santa upgrades
   */
  private handleSanta(): void {
    if (
      !!Game.Upgrades["A festive hat"].bought &&
      !Game.Upgrades["Santa's dominion"].unlocked
    ) {
      // Upgrade Santa
      Game.specialTab = "santa";
      Game.UpgradeSanta();
      Game.ToggleSpecialMenu(0);
    }
  }

  /**
   * Handle Christmas elf achievement detection
   * Skip if no grandmas bought yet (elf can't appear without grandmas)
   */
  private handleChristmasElf(): void {
    // Skip if not Christmas season
    if (Game.season !== "christmas") return;

    // Skip if achievement already won
    if (!!Game.Achievements["Baby it's old outside"].won) return;

    // Skip if no grandmas purchased yet (elf can't appear without grandmas)
    // This is the fix for the menu closing issue
    if (Game.Objects["Grandma"].amount === 0) return;

    // Close any open menu
    if (Game.onMenu) Game.ShowMenu("");

    // Scroll grandma canvas into view
    Game.Objects["Grandma"].canvas.parentElement?.scrollIntoView();

    // Find elf grandma
    const elfGrandmas = Game.Objects["Grandma"].pics.filter(
      (p) => p.pic === "elfGrandma.png"
    );

    if (elfGrandmas.length > 0) {
      const elfGranny = elfGrandmas[0];
      const xPos = elfGranny.x + 32;
      const yPos = elfGranny.y + 32;

      // Set mouse position and trigger click
      Game.Objects["Grandma"].mousePos = [xPos, yPos];
      Game.Objects["Grandma"].mouseOn = true;
      Game.mouseDown = 1;

      // Release click after 1 second
      this.elfClickTimeout = window.setTimeout(() => this.unElf(), 1000);
    }
  }

  /**
   * Release the elf click and scroll back to ticker
   */
  private unElf(): void {
    Game.mouseDown = 0;
    Game.tickerL.scrollIntoView();
  }

  /**
   * Handle season cycling between Christmas -> Valentine -> Easter -> Halloween
   */
  private cycleSeason(): void {
    // Don't cycle if season switcher not bought
    if (!Game.Upgrades["Season switcher"].bought) return; // bought is number, falsy check works

    // Don't cycle in Born Again mode
    if (Game.ascensionMode === 1) return;

    // Don't cycle if too many season switches already
    if (Game.seasonUses > 20) return;

    // Check if current season is finished
    if (this.seasonFinished(Game.season)) {
      // Cycle to next season
      switch (Game.season) {
        case "christmas":
          Game.Upgrades["Lovesick biscuit"].buy(); // to valentine
          break;
        case "valentines":
          Game.Upgrades["Bunny biscuit"].buy(); // to easter
          break;
        case "easter":
          Game.Upgrades["Ghostly biscuit"].buy(); // to halloween
          break;
        default:
          Game.Upgrades["Festive biscuit"].buy(); // to christmas
          break;
      }
    } else if (!this.allUnlocked(this.allSeasonUpgrades)) {
      // Still waiting for upgrades in current season
      Logger.addActivity(`Waiting for all results in ${Game.season}.`);
    }
  }

  /**
   * Check if all upgrades in a list are unlocked
   */
  private allUnlocked(upgradeIds: number[]): boolean {
    return upgradeIds.every((id) => Game.UpgradesById[id].unlocked);
  }

  /**
   * Check if a season is finished (all upgrades collected)
   */
  public seasonFinished(season: string): boolean {
    if (season === "") return true;

    switch (season) {
      case "valentines":
        return this.allUnlocked(this.valentineUpgrades);

      case "christmas":
        // If all season upgrades are unlocked, stay in Christmas
        if (this.allUnlocked(this.allSeasonUpgrades)) return false;
        // Otherwise check if Christmas-specific upgrades are done
        return this.allUnlocked(this.christmasUpgrades);

      case "easter":
        return (
          !!Game.Achievements["Hide & seek champion"].won &&
          this.allUnlocked(this.easterUpgrades)
        );

      case "halloween":
        return this.allUnlocked(this.halloweenUpgrades);

      default:
        return true;
    }
  }

  /**
   * Cleanup method to clear any pending timeouts
   */
  cleanup(): void {
    if (this.elfClickTimeout !== null) {
      clearTimeout(this.elfClickTimeout);
      this.elfClickTimeout = null;
    }
  }
}
