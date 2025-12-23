/**
 * Game object IDs for Cookie Clicker
 *
 * These constants provide type-safe access to game objects by ID.
 * Using constants instead of magic numbers improves code readability
 * and prevents typos.
 */

// ==================== Achievements ====================

export const ACHIEVEMENT_IDS = {
  // Clicking achievements
  NEVERCLICK: 'Neverclick', // Don't click the big cookie for entire ascension
  TRUE_NEVERCLICK: 'True Neverclick', // Never click the big cookie (permanent)
  UNCANNY_CLICKER: 'Uncanny clicker', // 15 clicks per second for 10 seconds

  // Grandmapocalypse
  ELDER_NAP: 'Elder nap', // Pledge the elders once
  ELDER_SLUMBER: 'Elder slumber', // Pledge the elders 5 times
  ELDER_CALM: 'Elder calm', // Declare a covenant with the elders
  GRANDMAPOCALYPSE: 'Grandmapocalypse', // Awaken the grandmatriarchs

  // Progression
  HARDCORE: 'Hardcore', // Get to 1 billion cookies with no upgrades
  HERE_BE_DRAGON: 'Here be dragon', // Complete your dragon's training
  THICK_SKINNED: 'Thick-skinned', // Keep 10 wrinklers at once

  // Minigame specific
  FOUR_LEAF_COOKIE: 'Four-leaf cookie', // Have 4 golden cookies on screen at once
  SEEDLESS_TO_NAY: 382, // Harvest a garden with all plants unlocked
  DUDE_SWEET: 459, // Own 500 of each stock good
  DEBT_EVASION: 'Debt evasion', // Ascend with a loan
  JUST_RIGHT: 397, // Have exactly specific amounts of each building

  // Cookie Clicker meta
  TABLOID_ADDICTION: 'Tabloid addiction', // Click news ticker 50 times
  HERE_YOU_GO: 'Here you go', // Dismiss 50 notifications
  TINY_COOKIE: 'Tiny cookie', // Click tiny cookie
  GOD_COMPLEX: 'God complex', // Name yourself Orteil
  CHEATED_COOKIES_TASTE_AWFUL: 'Cheated cookies taste awful', // Open dev tools
  THIRD_PARTY: 'Third-party', // Use an add-on
  OLDEN_DAYS: 'Olden days', // Have Grandma use old sprite

  // Milk achievements
  COOKIE_DUNKER: 'Cookie-dunker', // Dunk the cookie in milk

  // News ticker
  STIFLING_THE_PRESS: 'Stifling the press', // Have 0 news ticker updates queued

  // Time-based
  NO_TIME_LIKE_THE_PRESENT: 'No time like the present', // Have all time-based achievements
  EARLY_BIRD: 'Early bird', // Click a golden cookie within 1 second of spawning
  FADING_LUCK: 'Fading luck', // Click a golden cookie within its last second

  // Ascension
  IN_HER_LIKENESS: 'In her likeness', // Have at least 1 of yourself

  // Minigames
  SO_MUCH_TO_DO_SO_MUCH_TO_SEE: 'So much to do so much to see', // Reach level 10 in all minigames

  // Wrinklers
  WRINKLER_POKER: 'Wrinkler poker', // Pop a wrinkler
} as const;

// ==================== Upgrades ====================

export const UPGRADE_IDS = {
  // Golden cookie upgrades
  LUCKY_DAY: 52, // Unlocks "Lucky" golden cookie effect
  SERENDIPITY: 53, // Unlocks "Lucky" golden cookie during frenzy
  GET_LUCKY: 86, // Golden cookies appear more often

  // Grandmapocalypse progression
  ONE_MIND: 71, // Research grandmapocalypse stage 1
  COMMUNAL_BRAINSWEEP: 73, // Research grandmapocalypse stage 2
  ELDER_PLEDGE: 74, // Temporarily delay grandmapocalypse
  ELDER_COVENANT: 84, // Permanently stop grandmapocalypse

  // Special upgrades
  CHOCOLATE_EGG: 227, // Easter egg that gives huge bonus when sold
  SHIMMERING_VEIL: 563, // Golden/wrath switch (off state)

  // Garden upgrades (soil types, plants, etc.)
  GARDEN_UPGRADES_START: 470,
  GARDEN_UPGRADES_END: 476,
} as const;

// ==================== Buildings ====================

export const BUILDING_IDS = {
  CURSOR: 0,
  GRANDMA: 1,
  FARM: 2,
  MINE: 3,
  FACTORY: 4,
  BANK: 5,
  TEMPLE: 6,
  WIZARD_TOWER: 7,
  SHIPMENT: 8,
  ALCHEMY_LAB: 9,
  PORTAL: 10,
  TIME_MACHINE: 11,
  ANTIMATTER_CONDENSER: 12,
  PRISM: 13,
  CHANCEMAKER: 14,
  FRACTAL_ENGINE: 15,
  JAVASCRIPT_CONSOLE: 16,
  IDLEVERSE: 17,
  CORTEX_BAKER: 18,
  YOU: 19,
} as const;

// ==================== Building Names ====================

export const BUILDING_NAMES = {
  CURSOR: 'Cursor',
  GRANDMA: 'Grandma',
  FARM: 'Farm',
  MINE: 'Mine',
  FACTORY: 'Factory',
  BANK: 'Bank',
  TEMPLE: 'Temple',
  WIZARD_TOWER: 'Wizard tower',
  SHIPMENT: 'Shipment',
  ALCHEMY_LAB: 'Alchemy lab',
  PORTAL: 'Portal',
  TIME_MACHINE: 'Time machine',
  ANTIMATTER_CONDENSER: 'Antimatter condenser',
  PRISM: 'Prism',
  CHANCEMAKER: 'Chancemaker',
  FRACTAL_ENGINE: 'Fractal engine',
  JAVASCRIPT_CONSOLE: 'Javascript console',
  IDLEVERSE: 'Idleverse',
  CORTEX_BAKER: 'Cortex baker',
  YOU: 'You',
} as const;

// ==================== Pantheon Spirits ====================

export const SPIRIT_IDS = {
  // Diamond slot (most powerful)
  HOLOBORE: 0, // +10% CpS
  MOKALSIUM: 1, // -25% cookie prices
  JEREMY: 2, // +10% building power
  DOTJEIESS: 3, // +5% golden cookie effects
  CYCLIUS: 4, // Cycles between -25% to +25% CpS
  GODZAMOK: 5, // Sell buildings for CpS bonus
  MURIDAL: 6, // +5% wrinkler reward
  SKRUUIA: 7, // +5% wrinkler reward
  VOMITRAX: 8, // Buildings +5%, CpS -5%
  SELEBRAK: 9, // Buildings -5%, CpS +5%
  RIGIDEL: 10, // Buildings cheaper with each 10 built
} as const;

export const SPIRIT_NAMES = {
  // Day spirits (normal operation)
  MOTHER: 'mother', // Holobore - +5% CpS
  DECADENCE: 'decadence', // Mokalsium - Buildings -1% price
  LABOR: 'labor', // Jeremy - Buildings +1% production

  // Night spirits (sleep mode)
  SCORN: 'scorn', // Skruuia - Wrinklers +15% cookies
  ORDER: 'order', // Dotjeiess - Sugar lumps ripen 1hr sooner
  ASCETICISM: 'asceticism', // Selebrak - Buildings -5%, CpS +5%
  INDUSTRY: 'industry', // Vomitrax - Buildings +10%, CpS -10%

  // Special spirits
  CYCLIUS: 'cyclius', // Cycles CpS modifier
  GODZAMOK: 'godzamok', // Sell buildings for temp CpS
  RIGIDEL: 'rigidel', // Discount every 10 buildings bought
} as const;

// ==================== Dragon Auras ====================

export const DRAGON_AURA_IDS = {
  BREATH_OF_MILK: 0, // Milk is 5% more powerful
  DRAGONS_FORTUNE: 1, // Golden cookies appear 5% more often
  RADIANT_APPETITE: 2, // Buildings produce 2% more
  DRAGONS_CURVE: 3, // Big cookie clicks are worth 5% more
  BREATH_OF_ETERNITY: 4, // Sugar lumps mature 5% sooner
  SUPREME_INTELLECT: 5, // Prisms produce 1% more per achievement
  EARTH_SHATTERER: 6, // Buildings produce 20% more (with Dragon Orbs)
  MIND_OVER_MATTER: 7, // Golden/wrath cookie effects last 5% longer
  FIERCE_HOARDER: 8, // -2% building prices
  REALITY_BENDING: 9, // Golden cookies last 5% longer
} as const;

// ==================== Season Types ====================

export const SEASON_NAMES = {
  NONE: '',
  CHRISTMAS: 'christmas',
  EASTER: 'easter',
  HALLOWEEN: 'halloween',
  VALENTINES: 'valentines',
} as const;

// ==================== Garden Plants ====================

export const PLANT_KEYS = {
  MEDDLEWEED: 'meddleweed',
  BROWN_MOLD: 'brownMold',
  CRUMBSPORE: 'crumbspore',
  BAKEBERRY: 'bakeberry',
  CHOCOROOT: 'chocoroot',
  WHITE_CHOCOROOT: 'whiteChocoroot',
  QUEENBEET: 'queenbeet',
  QUEENBEET_LUMP: 'queenbeetLump',
  DUKETATER: 'duketater',
  ELDERWORT: 'Elderwort',
  EVERDAISY: 'Everdaisy',
} as const;

// Harvestable plants that drop cookies
export const HARVESTABLE_PLANTS = [
  PLANT_KEYS.BAKEBERRY,
  PLANT_KEYS.CHOCOROOT,
  PLANT_KEYS.WHITE_CHOCOROOT,
  PLANT_KEYS.QUEENBEET,
  PLANT_KEYS.QUEENBEET_LUMP,
  PLANT_KEYS.DUKETATER,
] as const;

/**
 * Plant mutation dependencies
 *
 * Each entry is [target, parent1, parent2] - plant parent1 and parent2 adjacent
 * to create the target plant through mutation.
 *
 * Ordered by planting priority:
 * - Index 0: dummy placeholder
 * - Index 1-2: Special expensive plants (queenbeetLump, everdaisy)
 * - Index 3+: Regular plants ordered by dependency level
 */
export const PLANT_DEPENDENCIES: ReadonlyArray<readonly [string, string, string]> = [
  ['dummy', 'dummy', 'dummy'], // Index 0: placeholder
  ['queenbeetLump', 'queenbeet', 'queenbeet'], // Index 1: Need queenbeet mature
  ['everdaisy', 'elderwort', 'tidygrass'], // Index 2: Need both unlocked
  // Queenbeet chain (most important)
  ['bakeberry', 'bakerWheat', 'bakerWheat'], // Level 1
  ['chocoroot', 'bakerWheat', 'brownMold'], // Level 1
  ['queenbeet', 'chocoroot', 'bakeberry'], // Level 2
  // Longest dependency chain
  ['thumbcorn', 'bakerWheat', 'bakerWheat'], // Level 1
  ['cronerice', 'bakerWheat', 'thumbcorn'], // Level 2
  ['gildmillet', 'thumbcorn', 'cronerice'], // Level 3
  ['clover', 'bakerWheat', 'gildmillet'], // Level 4
  ['shimmerlily', 'gildmillet', 'clover'], // Level 5
  ['elderwort', 'cronerice', 'shimmerlily'], // Level 6
  // Rest ordered by ripening times
  ['drowsyfern', 'chocoroot', 'keenmoss'], // Level 7
  ['duketater', 'queenbeet', 'queenbeet'], // Level 3
  ['tidygrass', 'bakerWheat', 'whiteChocoroot'], // Level 3
  ['nursetulip', 'whiskerbloom', 'whiskerbloom'], // Level 7
  ['doughshroom', 'crumbspore', 'crumbspore'], // Level 1
  ['wrinklegill', 'crumbspore', 'brownMold'], // Level 1
  ['shriekbulb', 'wrinklegill', 'elderwort'], // Level 7
  ['ichorpuff', 'crumbspore', 'elderwort'], // Level 7
  ['whiskerbloom', 'whiteChocoroot', 'shimmerlily'], // Level 6
  ['chimerose', 'whiskerbloom', 'shimmerlily'], // Level 7
  ['keenmoss', 'brownMold', 'greenRot'], // Level 6
  ['wardlichen', 'cronerice', 'whiteMildew'], // Level 3
  ['glovemorel', 'thumbcorn', 'crumbspore'], // Level 2
  ['whiteChocoroot', 'chocoroot', 'whiteMildew'], // Level 2
  ['whiteMildew', 'brownMold', 'brownMold'], // Level 1
  ['goldenClover', 'bakerWheat', 'gildmillet'], // Level 4
  ['greenRot', 'clover', 'whiteMildew'], // Level 5
  ['cheapcap', 'crumbspore', 'shimmerlily'], // Level 6
  ['foolBolete', 'greenRot', 'doughshroom'], // Level 6
] as const;

// ==================== Stock Market Goods ====================

// Stock market good IDs match their index in market.goods array
export const STOCK_GOOD_IDS = {
  CRL: 0, // Cookies (fast)
  CHC: 1, // Chocolate (fast)
  BTR: 2, // Butter (fast)
  SUG: 3, // Sugar (fast)
  NUT: 4, // Nuts (slow)
  SLT: 5, // Salt (slow)
  VNL: 6, // Vanilla (slow)
  EGG: 7, // Eggs (slow)
  CNM: 8, // Cinnamon (slow)
  CRM: 9, // Cream (slow)
  JAM: 10, // Jam (slow)
  WHT: 11, // Wheat (slow)
  HNY: 12, // Honey (slow)
  CKI: 13, // Cookie (slow)
  RCP: 14, // Recipe (slow)
  SBD: 15, // Sugar (slow)
  CRM2: 16, // Cream (slow)
} as const;

// ==================== Grimoire Spells ====================

export const SPELL_NAMES = {
  CONJURE_BAKED_GOODS: 'conjure baked goods',
  HAND_OF_FATE: 'hand of fate',
  STRETCH_TIME: 'stretch time',
  SPONTANEOUS_EDIFICE: 'spontaneous edifice',
  HAGGLER_LUCK: 'haggler\'s luck',
  SUMMON_CRAFTY_PIXIES: 'summon crafty pixies',
  GAMBLER_FEVER_DREAM: 'gambler\'s fever dream',
  RESURRECT_ABOMINATION: 'resurrect abomination',
  FORCE_THE_HAND_OF_FATE: 'force the hand of fate',
} as const;

// ==================== Buff Names ====================

export const BUFF_NAMES = {
  FRENZY: 'Frenzy',
  LUCKY: 'Lucky',
  CLICK_FRENZY: 'Click frenzy',
  DRAGONFLIGHT: 'Dragonflight',
  ELDER_FRENZY: 'Elder frenzy',
  CLOT: 'Clot',
  CURSED_FINGER: 'Cursed finger',
  BUILDING_SPECIAL: 'Building special',
  EVERYTHING_MUST_GO: 'Everything must go',
} as const;

// ==================== Helper Arrays ====================

// Upgrades to avoid buying (for grandmapocalypse control)
export const NON_ASCENSION_UPGRADES = [71, 72, 73, 87, 227] as const;

// Garden upgrade IDs
export const GARDEN_UPGRADE_IDS = [470, 471, 472, 473, 474, 475, 476] as const;

/**
 * Critical path achievements the bot works toward
 *
 * This is the ordered list of major achievements that define progression.
 * The bot focuses on these achievements in sequence.
 *
 * Last 10 achievements trigger "grinding" mode (no night sleep)
 * Last 8 achievements trigger "cheating" mode (aggressive golden cookie tactics)
 *
 * Final achievement: Just Right (397) - requires exact building counts
 */
export const WANTED_ACHIEVEMENTS = [
  82, // Elder calm
  89, // 100 antimatter condensers
  108, // Halloween cookies unlocked
  // Bake X cookies achievements (progression milestones)
  225, 227, 229, 279, 280, 372, 373, 374, 375, 390, 391, 429, 451, 452, 453, 470, 471, 472,
  534, 535, 536, 578, 579, 586, 587, 592, 593,
  // End game achievements
  585, // Endless cycle (max CPS)
  575, // Overdose (max buildings of each type)
  397, // Just Right (exact building counts) - FINAL achievement
] as const;

/**
 * Kitten upgrade IDs (boost CPS by milk percentage)
 */
export const KITTEN_UPGRADES = [
  31, 32, 54, 108, 187, 320, 321, 322, 425, 442, 462, 494, 613, 766, 865,
] as const;

/**
 * Cursor upgrade IDs (special upgrades for cursor building)
 */
export const CURSOR_UPGRADES = [
  0, 1, 2, 3, 4, 5, 6, 43, 82, 109, 188, 189, 660, 764, 873,
] as const;

/**
 * Sugar lump related achievements
 * These achievements require sugar lumps to complete
 * When all are achieved, the `finished` flag is set to true
 *
 * Includes:
 * - Building level achievements (307-319: level 10 for each building)
 * - Other lump-requiring achievements (336, 427, 447, 525, 396, 268, 271)
 */
export const LUMP_RELATED_ACHIEVEMENTS = [
  // Building level 10 achievements (307-319)
  307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319,
  // Other lump achievements
  336, // All natural sugar lumps - own at least 100 sugar lumps
  427, // Starchild - harvest a bifurcated sugar lump
  447, // Sugar sugar - harvest 100 sugar lumps
  525, // Eldeer - have one of every reindeer upgrade
  396, // Elder - have at least 600 grandmas
  268, // Getting even with your food - harvest 7 elderwort crops in one run
  271, // Bicentennial - reach 200 of everything
] as const;
