/**
 * Game object IDs for Cookie Clicker
 *
 * These constants provide type-safe access to game objects by ID.
 * Using constants instead of magic numbers improves code readability
 * and prevents typos.
 */
export declare const ACHIEVEMENT_IDS: {
    readonly NEVERCLICK: "Neverclick";
    readonly TRUE_NEVERCLICK: "True Neverclick";
    readonly UNCANNY_CLICKER: "Uncanny clicker";
    readonly ELDER_NAP: "Elder nap";
    readonly ELDER_SLUMBER: "Elder slumber";
    readonly ELDER_CALM: "Elder calm";
    readonly GRANDMAPOCALYPSE: "Grandmapocalypse";
    readonly HARDCORE: "Hardcore";
    readonly HERE_BE_DRAGON: "Here be dragon";
    readonly THICK_SKINNED: "Thick-skinned";
    readonly FOUR_LEAF_COOKIE: "Four-leaf cookie";
    readonly SEEDLESS_TO_NAY: 382;
    readonly DUDE_SWEET: 459;
    readonly DEBT_EVASION: "Debt evasion";
    readonly JUST_RIGHT: 397;
    readonly TABLOID_ADDICTION: "Tabloid addiction";
    readonly HERE_YOU_GO: "Here you go";
    readonly TINY_COOKIE: "Tiny cookie";
    readonly GOD_COMPLEX: "God complex";
    readonly CHEATED_COOKIES_TASTE_AWFUL: "Cheated cookies taste awful";
    readonly THIRD_PARTY: "Third-party";
    readonly OLDEN_DAYS: "Olden days";
    readonly COOKIE_DUNKER: "Cookie-dunker";
    readonly STIFLING_THE_PRESS: "Stifling the press";
    readonly NO_TIME_LIKE_THE_PRESENT: "No time like the present";
    readonly EARLY_BIRD: "Early bird";
    readonly FADING_LUCK: "Fading luck";
    readonly IN_HER_LIKENESS: "In her likeness";
    readonly SO_MUCH_TO_DO_SO_MUCH_TO_SEE: "So much to do so much to see";
    readonly WRINKLER_POKER: "Wrinkler poker";
};
export declare const UPGRADE_IDS: {
    readonly LUCKY_DAY: 52;
    readonly SERENDIPITY: 53;
    readonly GET_LUCKY: 86;
    readonly ONE_MIND: 71;
    readonly COMMUNAL_BRAINSWEEP: 73;
    readonly ELDER_PLEDGE: 74;
    readonly ELDER_COVENANT: 84;
    readonly CHOCOLATE_EGG: 227;
    readonly SHIMMERING_VEIL: 563;
    readonly GARDEN_UPGRADES_START: 470;
    readonly GARDEN_UPGRADES_END: 476;
};
export declare const BUILDING_IDS: {
    readonly CURSOR: 0;
    readonly GRANDMA: 1;
    readonly FARM: 2;
    readonly MINE: 3;
    readonly FACTORY: 4;
    readonly BANK: 5;
    readonly TEMPLE: 6;
    readonly WIZARD_TOWER: 7;
    readonly SHIPMENT: 8;
    readonly ALCHEMY_LAB: 9;
    readonly PORTAL: 10;
    readonly TIME_MACHINE: 11;
    readonly ANTIMATTER_CONDENSER: 12;
    readonly PRISM: 13;
    readonly CHANCEMAKER: 14;
    readonly FRACTAL_ENGINE: 15;
    readonly JAVASCRIPT_CONSOLE: 16;
    readonly IDLEVERSE: 17;
    readonly CORTEX_BAKER: 18;
    readonly YOU: 19;
};
export declare const BUILDING_NAMES: {
    readonly CURSOR: "Cursor";
    readonly GRANDMA: "Grandma";
    readonly FARM: "Farm";
    readonly MINE: "Mine";
    readonly FACTORY: "Factory";
    readonly BANK: "Bank";
    readonly TEMPLE: "Temple";
    readonly WIZARD_TOWER: "Wizard tower";
    readonly SHIPMENT: "Shipment";
    readonly ALCHEMY_LAB: "Alchemy lab";
    readonly PORTAL: "Portal";
    readonly TIME_MACHINE: "Time machine";
    readonly ANTIMATTER_CONDENSER: "Antimatter condenser";
    readonly PRISM: "Prism";
    readonly CHANCEMAKER: "Chancemaker";
    readonly FRACTAL_ENGINE: "Fractal engine";
    readonly JAVASCRIPT_CONSOLE: "Javascript console";
    readonly IDLEVERSE: "Idleverse";
    readonly CORTEX_BAKER: "Cortex baker";
    readonly YOU: "You";
};
export declare const SPIRIT_IDS: {
    readonly HOLOBORE: 0;
    readonly MOKALSIUM: 1;
    readonly JEREMY: 2;
    readonly DOTJEIESS: 3;
    readonly CYCLIUS: 4;
    readonly GODZAMOK: 5;
    readonly MURIDAL: 6;
    readonly SKRUUIA: 7;
    readonly VOMITRAX: 8;
    readonly SELEBRAK: 9;
    readonly RIGIDEL: 10;
};
export declare const SPIRIT_NAMES: {
    readonly MOTHER: "mother";
    readonly DECADENCE: "decadence";
    readonly LABOR: "labor";
    readonly SCORN: "scorn";
    readonly ORDER: "order";
    readonly ASCETICISM: "asceticism";
    readonly INDUSTRY: "industry";
    readonly CYCLIUS: "cyclius";
    readonly GODZAMOK: "godzamok";
    readonly RIGIDEL: "rigidel";
};
export declare const DRAGON_AURA_IDS: {
    readonly BREATH_OF_MILK: 0;
    readonly DRAGONS_FORTUNE: 1;
    readonly RADIANT_APPETITE: 2;
    readonly DRAGONS_CURVE: 3;
    readonly BREATH_OF_ETERNITY: 4;
    readonly SUPREME_INTELLECT: 5;
    readonly EARTH_SHATTERER: 6;
    readonly MIND_OVER_MATTER: 7;
    readonly FIERCE_HOARDER: 8;
    readonly REALITY_BENDING: 9;
};
export declare const SEASON_NAMES: {
    readonly NONE: "";
    readonly CHRISTMAS: "christmas";
    readonly EASTER: "easter";
    readonly HALLOWEEN: "halloween";
    readonly VALENTINES: "valentines";
};
export declare const PLANT_KEYS: {
    readonly MEDDLEWEED: "meddleweed";
    readonly BROWN_MOLD: "brownMold";
    readonly CRUMBSPORE: "crumbspore";
    readonly BAKEBERRY: "bakeberry";
    readonly CHOCOROOT: "chocoroot";
    readonly WHITE_CHOCOROOT: "whiteChocoroot";
    readonly QUEENBEET: "queenbeet";
    readonly QUEENBEET_LUMP: "queenbeetLump";
    readonly DUKETATER: "duketater";
    readonly ELDERWORT: "Elderwort";
    readonly EVERDAISY: "Everdaisy";
};
export declare const HARVESTABLE_PLANTS: readonly ["bakeberry", "chocoroot", "whiteChocoroot", "queenbeet", "queenbeetLump", "duketater"];
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
export declare const PLANT_DEPENDENCIES: ReadonlyArray<readonly [string, string, string]>;
export declare const STOCK_GOOD_IDS: {
    readonly CRL: 0;
    readonly CHC: 1;
    readonly BTR: 2;
    readonly SUG: 3;
    readonly NUT: 4;
    readonly SLT: 5;
    readonly VNL: 6;
    readonly EGG: 7;
    readonly CNM: 8;
    readonly CRM: 9;
    readonly JAM: 10;
    readonly WHT: 11;
    readonly HNY: 12;
    readonly CKI: 13;
    readonly RCP: 14;
    readonly SBD: 15;
    readonly CRM2: 16;
};
export declare const SPELL_NAMES: {
    readonly CONJURE_BAKED_GOODS: "conjure baked goods";
    readonly HAND_OF_FATE: "hand of fate";
    readonly STRETCH_TIME: "stretch time";
    readonly SPONTANEOUS_EDIFICE: "spontaneous edifice";
    readonly HAGGLER_LUCK: "haggler's luck";
    readonly SUMMON_CRAFTY_PIXIES: "summon crafty pixies";
    readonly GAMBLER_FEVER_DREAM: "gambler's fever dream";
    readonly RESURRECT_ABOMINATION: "resurrect abomination";
    readonly FORCE_THE_HAND_OF_FATE: "force the hand of fate";
};
export declare const BUFF_NAMES: {
    readonly FRENZY: "Frenzy";
    readonly LUCKY: "Lucky";
    readonly CLICK_FRENZY: "Click frenzy";
    readonly DRAGONFLIGHT: "Dragonflight";
    readonly ELDER_FRENZY: "Elder frenzy";
    readonly CLOT: "Clot";
    readonly CURSED_FINGER: "Cursed finger";
    readonly BUILDING_SPECIAL: "Building special";
    readonly EVERYTHING_MUST_GO: "Everything must go";
};
export declare const NON_ASCENSION_UPGRADES: readonly [71, 72, 73, 87, 227];
export declare const GARDEN_UPGRADE_IDS: readonly [470, 471, 472, 473, 474, 475, 476];
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
export declare const WANTED_ACHIEVEMENTS: readonly [82, 89, 108, 225, 227, 229, 279, 280, 372, 373, 374, 375, 390, 391, 429, 451, 452, 453, 470, 471, 472, 534, 535, 536, 578, 579, 586, 587, 592, 593, 585, 575, 397];
/**
 * Kitten upgrade IDs (boost CPS by milk percentage)
 */
export declare const KITTEN_UPGRADES: readonly [31, 32, 54, 108, 187, 320, 321, 322, 425, 442, 462, 494, 613, 766, 865];
/**
 * Cursor upgrade IDs (special upgrades for cursor building)
 */
export declare const CURSOR_UPGRADES: readonly [0, 1, 2, 3, 4, 5, 6, 43, 82, 109, 188, 189, 660, 764, 873];
/**
 * Sugar lump related achievements
 * These achievements require sugar lumps to complete
 * When all are achieved, the `finished` flag is set to true
 *
 * Includes:
 * - Building level achievements (307-319: level 10 for each building)
 * - Other lump-requiring achievements (336, 427, 447, 525, 396, 268, 271)
 */
export declare const LUMP_RELATED_ACHIEVEMENTS: readonly [307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 336, 427, 447, 525, 396, 268, 271];
//# sourceMappingURL=gameIds.d.ts.map