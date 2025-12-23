// Type definitions for Cookie Clicker game objects
// This is a partial definition - we'll expand as needed

interface CookieClickerGame {
  ready: boolean;
  version: number;
  sesame: boolean;
  onMenu: string;
  ShowMenu: (menu: string) => void;
  ToggleSpecialMenu: (menu: number) => void;
  specialTab: string;
  UpgradeSanta: () => void;

  // Game state
  cookiesPs: number;
  cookies: number;
  cookiesEarned: number;
  lumps: number;
  lumpsTotal: number;
  lumpT: number; // Timestamp when current lump started growing
  lumpCurrentType: number; // 0=normal, 1=bifurcated, 2=golden, 3=meaty, 4=caramelized
  lumpMatureAge: number; // Time when lump becomes mature (can be hand-picked)
  lumpRipeAge: number; // Time when lump becomes ripe (auto-harvest)
  lumpOverripeAge: number; // Time when lump becomes overripe
  season: string;
  seasonUses: number;
  ascensionMode: number;
  mouseDown: number;
  unbuffedCps: number;
  startDate: number;
  resets: number;
  BuildingsOwned: number;
  UpgradesOwned: number;
  buyMode: number;
  OnAscend: boolean;
  elderWrath: number;

  // Collections
  Objects: { [key: string]: Building };
  ObjectsById: Building[];
  Upgrades: { [key: string]: Upgrade };
  UpgradesById: Upgrade[];
  UpgradesInStore: Upgrade[];
  Achievements: { [key: string]: Achievement };
  AchievementsById: Achievement[];
  shimmerTypes: { [key: string]: ShimmerType };
  shimmers: Shimmer[];
  wrinklers: Wrinkler[];

  // Methods
  LoadMod: (url: string) => void;
  Earn: (amount: number) => void;
  RuinTheFun: () => void;
  CollectWrinklers: () => void;
  Ascend: (mode: number) => void;
  Reincarnate: (mode: number) => void;
  storeBulkButton: (mode: number) => void;
  isMinigameReady: (building: Building) => boolean;
  getWrinklersMax: () => number;

  // Dragon
  hasAura: (auraName: string) => boolean;
  UpgradeDragon: () => void;
  SetDragonAura: (aura: number, slot: number) => void;
  ClickSpecialPic: () => void;
  dragonLevel: number;
  dragonLevels: DragonLevel[];
  dragonAura: number;
  dragonAura2: number;

  // Utility methods
  Has: (upgradeName: string) => boolean;
  HasUnlocked: (upgradeName: string) => boolean;
  ConfirmPrompt: () => void;

  // HTML elements
  tickerL: HTMLElement;
}

interface DragonLevel {
  cost: () => boolean;
}

interface Building {
  id: number;
  name: string;
  amount: number;
  bought: number;
  price: number;
  locked: number;
  level: number;
  storedCps: number;
  pics: { pic: string; x: number; y: number }[];
  canvas: HTMLCanvasElement;
  mousePos: [number, number];
  mouseOn: boolean;
  minigame?: any;
  getPrice: () => number;
  getSumPrice: (amount: number) => number;
  buy: (amount?: number) => void;
  sell: (amount: number) => void;
  sacrifice: (amount: number) => void;
  switchMinigame: (on: boolean) => void;
  levelUp: () => void;
}

interface Upgrade {
  id: number;
  name: string;
  bought: number;
  unlocked: number;
  pool: string;
  basePrice: number;
  getPrice: () => number;
  buy: (withoutPopup?: boolean) => void;
  canBuy: () => boolean;
  icon: [number, number];
}

interface Achievement {
  id: number;
  name: string;
  won: number;
  hide: number;
  pool: string;
}

interface Shimmer {
  type: string;
  life: number;
  dur: number;
  force: string;
  wrath: number;
}

interface ShimmerType {
  maxTime: number;
  minTime: number;
  time: number;
}

interface Wrinkler {
  id: number;
  close: number;  // 0 = not attached, 1 = attached
  sucked: number; // Amount of cookies sucked
  phase: number;  // Animation phase
  type: number;   // 0 = normal, 1 = shiny
  hp: number;     // Health points
  selected: number; // Whether wrinkler is selected for clicking
}

// CookieMonster data structures
interface CookieMonsterBuildingData {
  pp: number;  // Payback Period in seconds
  bonus: number;  // CPS bonus this building provides
  roi: number;  // Return on Investment
}

interface CookieMonsterUpgradeData {
  pp: number;  // Payback Period in seconds
  bonus: number;  // CPS bonus this upgrade provides
  roi: number;  // Return on Investment
}

interface CookieMonsterCache {
  AverageClicks: number;  // Average clicks per second
  WrinklersTotal: number;  // Total cookies stored in wrinklers
}

interface CookieMonsterDataType {
  Cache: CookieMonsterCache;
  Objects1: { [key: string]: CookieMonsterBuildingData };  // Data for buying 1 building
  Objects10: { [key: string]: CookieMonsterBuildingData };  // Data for buying 10 buildings
  Upgrades: { [key: string]: CookieMonsterUpgradeData };  // Data for upgrades
}

// Global Game object
declare const Game: CookieClickerGame;

// Global CookieMonster data (may be undefined if not installed)
declare const CookieMonsterData: CookieMonsterDataType | undefined;

// Global helper function to get elements by ID
declare function l(id: string): HTMLElement;
