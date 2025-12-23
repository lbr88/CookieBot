# CookieBot TypeScript Migration

This document explains the new TypeScript modular structure for CookieBot.

## Project Structure

```
CookieBot/
├── src/                          # TypeScript source code
│   ├── modules/                  # Modular components
│   │   ├── GoldenCookieHandler.ts    # Golden cookies & shimmers
│   │   ├── SavingsManager.ts         # Cookie reserves (Lucky, etc.)
│   │   ├── BuildingManager.ts        # Building purchases
│   │   ├── UpgradeManager.ts         # Upgrade purchases
│   │   ├── SeasonHandler.ts          # Seasonal events
│   │   ├── SugarLumpManager.ts       # Sugar lump management
│   │   ├── WrinklerManager.ts        # Wrinkler strategy
│   │   ├── AchievementHandler.ts     # Achievement hunting
│   │   ├── AscensionManager.ts       # Ascension decisions
│   │   ├── DragonManager.ts          # Dragon auras
│   │   ├── Dashboard.ts              # UI dashboard
│   │   └── NightMode.ts              # Night mode styling
│   ├── types/                    # TypeScript type definitions
│   │   ├── cookieclicker.d.ts        # Cookie Clicker game types
│   │   └── autoplay.d.ts             # AutoPlay types
│   ├── utils/                    # Utility functions
│   │   └── helpers.ts                # Shared helper functions
│   ├── AutoPlay.ts               # Main AutoPlay class
│   └── index.ts                  # Entry point
├── dist/                         # Compiled JavaScript (generated)
├── cookieAutoPlayBeta.js         # Original file (kept for reference)
├── CookieBot.user.js             # Userscript loader
├── package.json                  # NPM dependencies
├── tsconfig.json                 # TypeScript configuration
└── webpack.config.js             # Build configuration
```

## Module Responsibilities

### Core Modules

- **GoldenCookieHandler**: Handles clicking golden cookies, reindeer, and other shimmers
- **SavingsManager**: Manages cookie reserves (Lucky: 100min CPS, Lucky Frenzy: 700min CPS)
- **BuildingManager**: Decides which buildings to buy using PP/ROI strategy
- **UpgradeManager**: Handles upgrade purchases and priority
- **SeasonHandler**: Manages seasonal events (Christmas, Easter, etc.) and cycling
- **SugarLumpManager**: Harvests and spends sugar lumps automatically
- **WrinklerManager**: Pops wrinklers based on value calculation
- **AchievementHandler**: Hunts for achievements (clicking, special conditions)
- **AscensionManager**: Decides when to ascend and manages heavenly upgrades
- **DragonManager**: Trains dragon and selects optimal auras
- **Dashboard**: Renders the UI dashboard showing stats and controls
- **NightMode**: Applies dark mode styling

### Supporting

- **AutoPlay**: Main orchestrator class that coordinates all modules
- **types/**: TypeScript definitions for Cookie Clicker and AutoPlay state
- **utils/**: Shared utility functions (formatting, calculations, etc.)

## Development

### Install Dependencies

```bash
npm install
```

### Build for Production

```bash
npm run build
```

This compiles TypeScript and bundles into `dist/cookieAutoPlayBeta.js`

### Development Mode (Watch)

```bash
npm run dev
```

Watches for file changes and rebuilds automatically.

### Type Checking Only

```bash
npm run type-check
```

Runs TypeScript compiler without emitting files.

## Migration Strategy

The original `cookieAutoPlayBeta.js` is preserved. The TypeScript version will be built incrementally:

1. ✅ Set up project structure
2. ✅ Create module skeletons
3. ⏳ Migrate each section to its respective module
4. ⏳ Test each module as it's migrated
5. ⏳ Full integration testing
6. ⏳ Replace original file once stable

## Benefits of TypeScript

- **Type Safety**: Catch errors at compile-time instead of runtime
- **Better IDE Support**: Autocomplete, refactoring, go-to-definition
- **Modular Architecture**: Each concern is separated into its own module
- **Maintainability**: Easier to understand, modify, and extend
- **Documentation**: Types serve as inline documentation

## Next Steps

Start migrating code section by section from `cookieAutoPlayBeta.js` to the respective TypeScript modules.
