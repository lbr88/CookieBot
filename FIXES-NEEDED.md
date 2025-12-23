# Quick Fix Guide for TypeScript Errors

This document provides the exact code changes needed to fix all TypeScript compilation errors.

## Fix 1: AutoPlay.ts - Add SavingStrategy to default config

**File:** `/home/lrasmussen/git/private/CookieBot/src/AutoPlay.ts`
**Line:** 147

**Change:**
```typescript
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
    buyMode: 'pp',
    minCookieBank: 0,
    savingsGoal: 0,
    savingsEnabled: true,
    SavingStrategy: 1,  // ADD THIS LINE (0=NONE, 1=AUTO, 2=LUCKY, 3=LUCKY_FRENZY)
    seasonOrder: ['christmas', 'valentines', 'easter', 'halloween'],
    currentSeasonIndex: 0,
  };
}
```

---

## Fix 2: AutoPlay.ts - Create AutoPlayContext object

**File:** `/home/lrasmussen/git/private/CookieBot/src/AutoPlay.ts`
**Line:** Add new method after constructor

**Add this method:**
```typescript
/**
 * Create context object for modules that need it
 */
private createContext(): AutoPlayContext {
  return {
    now: this.state.now,
    nextAchievement: 0,
    wantedAchievements: [],
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
    info: (message: string) => console.log(`[INFO] ${message}`),
    logAction: (action: string, details?: string) => console.log(`[ACTION] ${action}`, details),
    logStatus: (type: string, message: string, details?: string) => console.log(`[STATUS:${type}] ${message}`, details),
    addActivity: (activity: string) => this.state.activities.push(activity),
    setMainActivity: (activity: string) => { /* TODO */ },
    setDeadline: (time: number) => { /* TODO */ },
    findNextAchievement: () => { /* TODO */ },
    endPhase: () => false,
    preNightMode: () => false,
    mustRebornAscend: () => false,
    assignSpirit: (slot: number, spirit: string, force: number) => { /* TODO */ },
  };
}
```

---

## Fix 3: AutoPlay.ts - Pass context to constructors

**File:** `/home/lrasmussen/git/private/CookieBot/src/AutoPlay.ts`
**Lines:** 41-59

**Change constructor to:**
```typescript
constructor() {
  // Initialize default configuration
  this.config = this.getDefaultConfig();
  this.state = this.getDefaultState();

  // Create context for modules that need it
  const context = this.createContext();

  // Initialize modules
  this.goldenCookieHandler = new GoldenCookieHandler();
  this.savingsManager = new SavingsManager();
  this.buildingManager = new BuildingManager();
  this.upgradeManager = new UpgradeManager(context);  // PASS CONTEXT
  this.seasonHandler = new SeasonHandler();
  this.sugarLumpManager = new SugarLumpManager(this.state);
  this.wrinklerManager = new WrinklerManager(this.state);
  this.achievementHandler = new AchievementHandler();
  this.ascensionManager = new AscensionManager(context);  // PASS CONTEXT
  this.dragonManager = new DragonManager();
  this.dashboard = new Dashboard();
  this.nightMode = new NightMode(this.config);  // PASS CONFIG
}
```

---

## Fix 4: AutoPlay.ts - Remove unused variable

**File:** `/home/lrasmussen/git/private/CookieBot/src/AutoPlay.ts`
**Line:** 123

**Change:**
```typescript
private calculateDelay(): number {
  // Dynamic deadline logic (100ms to 15s)
  const baseDelay = 100;
  // const maxDelay = 15000;  // REMOVE OR COMMENT OUT

  // TODO: Implement actual dynamic delay calculation
  return baseDelay;
}
```

---

## Fix 5: AscensionManager.ts - Fix doAscend signature

**File:** `/home/lrasmussen/git/private/CookieBot/src/modules/AscensionManager.ts`
**Line:** 407

**Change:**
```typescript
/**
 * Perform the actual ascension
 * @param reason Why we're ascending
 * @param log Whether to log the ascension (default: true)
 */
private doAscend(reason: string, log: boolean = true): void {
  if (Game.AscendTimer > 0 || Game.ReincarnateTimer > 0) return;
  if (this.state.onAscend || Game.OnAscend) return;

  // Only log if log parameter is true
  if (log) {
    this.context.logStatus('ascend', reason);
  }

  this.context.wantAscend = this.context.plantPending;
  this.context.addActivity("Preparing to ascend.");

  // ... rest of the method remains the same
```

---

## Fix 6: cookieclicker.d.ts - Add buffs property

**File:** `/home/lrasmussen/git/private/CookieBot/src/types/cookieclicker.d.ts`
**Line:** Add after line 48 (after wrinklers property)

**Add:**
```typescript
interface CookieClickerGame {
  ready: boolean;
  version: number;
  // ... existing properties ...
  wrinklers: Wrinkler[];
  buffs: { [key: string]: Buff };  // ADD THIS LINE

  // Methods
  LoadMod: (url: string) => void;
  // ... rest remains same
}

// Add this interface at the end of the file
interface Buff {
  name: string;
  time: number;
  maxTime: number;
  power: number;
  type: string;
}
```

---

## Fix 7: BuildingManager.ts - Remove unused variables

**File:** `/home/lrasmussen/git/private/CookieBot/src/modules/BuildingManager.ts`
**Lines:** 28, 325

**Change:**
```typescript
// Line 28 - Remove or comment out
// const hyperActive = false;  // REMOVE THIS LINE

// Line 325 - Remove the entire unused function or add underscore prefix
// private calculatePP() { ... }  // REMOVE OR RENAME TO _calculatePP
```

---

## Fix 8: Dashboard.ts - Remove unused import

**File:** `/home/lrasmussen/git/private/CookieBot/src/modules/Dashboard.ts`
**Line:** 6-12

**Change:**
```typescript
import type {
  ConfigData,
  Config,
  ActionHistoryEntry,
  StatusHistoryEntry,
  ActivityEntry
  // Remove StatusInfo from here if it's not used
} from '../types/autoplay';
```

---

## Fix 9: NightMode.ts - Remove unused import

**File:** `/home/lrasmussen/git/private/CookieBot/src/modules/NightMode.ts`
**Line:** 14

**Change:**
```typescript
// Remove AutoPlayState if not used
import type { AutoPlayConfig } from '../types/autoplay';
```

---

## Fix 10: SugarLumpManager.ts - Remove unused import

**File:** `/home/lrasmussen/git/private/CookieBot/src/modules/SugarLumpManager.ts`
**Line:** 10

**Change:**
```typescript
// Remove AutoPlayConfig if not used
import type { AutoPlayState } from '../types/autoplay';
```

---

## Verification Commands

After making all changes:

```bash
# 1. Check types
npm run type-check

# 2. Build if type check passes
npm run build

# 3. Verify output exists
ls -lh dist/cookieAutoPlayBeta.js
```

---

## Priority Order

If you need to fix issues incrementally, do them in this order:

1. **Fix 1** - Add SavingStrategy (1 minute)
2. **Fix 2 & 3** - Create context and pass to constructors (5 minutes)
3. **Fix 5** - Fix doAscend signature (2 minutes)
4. **Fix 6** - Add buffs to type definitions (2 minutes)
5. **Fix 4, 7-10** - Clean up warnings (5 minutes)

**Total estimated time:** 15-20 minutes
