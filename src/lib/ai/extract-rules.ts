import { stateAliases } from "@/data/state-aliases";
import { incomeToBand, type CitizenProfile, type IndianState, type Occupation, type ProfileField } from "@/lib/engine/types";

/**
 * Deterministic, multilingual (English / Kannada / Hindi, incl. common
 * romanised words) reader for "describe your situation" text. Used when no AI
 * key is configured, and as a safety net when the AI is unavailable.
 *
 * It only sets a field when the text clearly says so; everything else stays
 * unanswered so the citizen is asked instead of guessed about.
 */

export type Extraction = { profile: CitizenProfile; fields: ProfileField[] };

const any = (text: string, patterns: readonly RegExp[]) => patterns.some((p) => p.test(text));

// Order matters: more specific roles first.
const OCCUPATION_PATTERNS: readonly [Occupation, readonly RegExp[]][] = [
  ["student", [/\bstud(ent|ying)\b/, /\bcollege\b/, /\bschool\b/, /ವಿದ್ಯಾರ್ಥಿ/, /ಓದುತ್ತಿದ್ದೇನೆ/, /छात्र/, /विद्यार्थी/, /पढ़ाई कर/]],
  ["farm_labourer", [/\b(farm|agricultural|agri)\s*(labour|labor|worker)/, /ಕೃಷಿ\s*ಕೂಲಿ/, /खेत(िहर)?\s*मज़?दूर/]],
  [
    "artisan",
    [
      /\b(carpenter|tailor|potter|blacksmith|goldsmith|cobbler|barber|weaver|mason|sculptor|washerman|artisan|craftsman|craftsperson|locksmith|basket\s*maker|boat\s*maker)\b/,
      /ಬಡಗಿ|ದರ್ಜಿ|ಕುಂಬಾರ|ಕಮ್ಮಾರ|ನೇಕಾರ|ಕ್ಷೌರಿಕ|ಅಕ್ಕಸಾಲಿಗ|ಕುಶಲಕರ್ಮಿ/,
      /बढ़ई|दर्ज़?ी|कुम्हार|लोहार|सुनार|मोची|नाई|बुनकर|कारीगर/,
    ],
  ],
  ["govt_employee", [/\b(government|govt|sarkari)\s*(employee|job|servant|naukri|service)\b/, /ಸರ್ಕಾರಿ\s*(ನೌಕರ|ಉದ್ಯೋಗ)/, /सरकारी\s*(नौकरी|कर्मचारी)/]],
  ["salaried_private", [/\bprivate\s*(job|company|sector)\b/, /\bsoftware\b/, /\b(it|tech)\s*(employee|company|job)\b/, /\bsalaried\b/, /ಖಾಸಗಿ\s*ಉದ್ಯೋಗ/, /प्राइवेट\s*नौकरी/, /कंपनी\s*में\s*(काम|नौकरी)/]],
  ["job_seeker", [/\bunemployed\b/, /\bjobless\b/, /\b(looking|searching)\s*for\s*(a\s*)?(job|work)\b/, /\bno\s*job\b/, /ನಿರುದ್ಯೋಗ/, /ಉದ್ಯೋಗ\s*ಹುಡುಕ/, /बेरोज़?गार/, /नौकरी\s*(ढूँढ|ढूंढ|खोज)/]],
  [
    "business_owner",
    [
      /\b(business|shop\s*keeper|shopkeeper|my\s*shop|a\s*shop|startup|entrepreneur|self[-\s]?employed|dukaan|dukan|enterprise)\b/,
      /ವ್ಯಾಪಾರ|ವ್ಯವಹಾರ|ಅಂಗಡಿ|ಉದ್ಯಮ/,
      /व्यापार|व्यवसाय|दुकान|बिज़?नेस|उद्यम/,
    ],
  ],
  [
    "unorganised_worker",
    [
      /\b(daily[-\s]?wage|labou?rer|coolie|construction\s*worker|domestic\s*worker|house\s*maid|maid|auto\s*driver|rickshaw|street\s*vendor|hawker|helper)\b/,
      /ಕೂಲಿ|ಕಾರ್ಮಿಕ|ಮನೆಗೆಲಸ/,
      /मज़?दूर|दिहाड़ी|घरेलू\s*काम|रेहड़ी|ठेला/,
    ],
  ],
  [
    "farmer",
    [/\bfarm(er|ing)\b/, /\bagricultur/, /\bcultivat/, /\bcrops?\b/, /\bharvest/, /\bkisan\b/, /\braith?a\b/, /ರೈತ|ಕೃಷಿ|ಬೇಸಾಯ|ಬೆಳೆ/, /किसान|खेती|फ़?सल/],
  ],
  ["homemaker", [/\b(housewife|homemaker|home\s*maker)\b/, /ಗೃಹಿಣಿ/, /गृहिणी/]],
  ["retired", [/\b(retired|pensioner|senior\s*citizen)\b/, /ನಿವೃತ್ತ|ಹಿರಿಯ\s*ನಾಗರಿಕ/, /सेवानिवृत्त|रिटायर|वरिष्ठ\s*नागरिक/]],
];

const FEMALE = [/\b(woman|women|female|girl|lady|mother|wife|widow|housewife|daughter)\b/, /ಮಹಿಳೆ|ಹೆಣ್ಣು|ಗೃಹಿಣಿ|ವಿಧವೆ|ತಾಯಿ/, /महिला|औरत|लड़की|गृहिणी|विधवा|छात्रा/];
const MALE = [/\b(man|male|boy|gentleman|son|husband)\b/, /ಪುರುಷ|ಗಂಡು|ಹುಡುಗ/, /पुरुष|आदमी|लड़का/];

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * One matcher per state. Whole words only, so "assam" never matches inside
 * another word; Kannada names may take case endings ("ಬೆಂಗಳೂರಿನಲ್ಲಿ" is
 * covered by the stem), so only their start is anchored.
 */
const STATE_MATCHERS: readonly [IndianState, RegExp][] = (Object.entries(stateAliases) as [IndianState, readonly string[]][]).map(
  ([state, aliases]) => {
    const parts = aliases.map((alias) => {
      const body = escapeRegex(alias).replace(/\s+/g, "\\s*");
      return /[ಀ-೿]/.test(alias) ? `(?<![\\p{L}\\p{M}])${body}` : `(?<![\\p{L}\\p{M}])${body}(?![\\p{L}\\p{M}])`;
    });
    return [state, new RegExp(parts.join("|"), "u")];
  },
);

/** The state named in the text, or null when none or more than one is named. */
function stateFromText(text: string): IndianState | null {
  const found = STATE_MATCHERS.filter(([, re]) => re.test(text)).map(([state]) => state);
  return found.length === 1 ? found[0] : null;
}
const RURAL = [/\b(village|rural|gram|hamlet)\b/, /ಹಳ್ಳಿ|ಗ್ರಾಮ/, /गाँव|गांव|ग्रामीण|देहात/];
const URBAN = [/\b(city|town|urban|metro)\b/, /\b(bengaluru|bangalore)\b/, /ನಗರ|ಪಟ್ಟಣ|ಬೆಂಗಳೂರು/, /शहर|कस्बा|नगर/];

const LAND_YES = [/\b(acres?|hectares?|guntas?|my\s*land|our\s*land|own\s*land|farm\s*land|farmland)\b/, /ಎಕರೆ|ಗುಂಟೆ|ಜಮೀನು\s*ಇದೆ|ಹೊಲ\s*ಇದೆ/, /एकड़|बीघा|हेक्टेयर|ज़?मीन\s*है/];
const LAND_NO = [/\b(landless|no\s*land|don'?t\s*(own|have)\s*(any\s*)?land)\b/, /ಜಮೀನು\s*ಇಲ್ಲ/, /ज़?मीन\s*नहीं/];

const NO_HOUSE = [/\b(no|don'?t\s*(own|have)\s*(a|an|my|our)?)\s*(own\s*)?(house|home)\b/, /\bhomeless\b/, /ಸ್ವಂತ\s*ಮನೆ\s*ಇಲ್ಲ|ಮನೆ\s*ಇಲ್ಲ/, /अपना\s*(घर|मकान)\s*नहीं|घर\s*नहीं/];
const OWN_HOUSE = [/\b(own|have)\s*(a|my|our)?\s*(own\s*)?(pucca\s*)?(house|home)\b/, /ಸ್ವಂತ\s*ಮನೆ\s*ಇದೆ/, /अपना\s*(पक्का\s*)?(घर|मकान)\s*है/];

const NEW_BUSINESS = [/\b(start|starting|begin|open|set\s*up)\s*(a|my|an)?\s*(new\s*)?(business|shop|unit|enterprise)\b/, /\bnew\s*business\b/, /ಹೊಸ\s*(ವ್ಯಾಪಾರ|ವ್ಯವಹಾರ|ಅಂಗಡಿ)|ಆರಂಭಿಸ/, /नया\s*(व्यापार|व्यवसाय|दुकान|काम)|शुरू\s*कर/];
const EXISTING_BUSINESS = [/\b(running|run|have|own)\s*(a|my|an)?\s*(small\s*)?(business|shop|store)\b/, /ಅಂಗಡಿ\s*ನಡೆಸ|ವ್ಯಾಪಾರ\s*ಮಾಡುತ್ತ/, /दुकान\s*चला|व्यापार\s*कर/];

const BPL = [/\bbpl\b/, /\b(antyodaya|aay\s*card)\b/, /ಬಿಪಿಎಲ್|ಅಂತ್ಯೋದಯ/, /बीपीएल|अंत्योदय|गरीबी\s*रेखा\s*से\s*नीचे/];
const HEAD_OF_FAMILY =[/\bhead\s*of\s*(the\s*)?(family|household)\b/, /ಯಜಮಾನಿ|ಕುಟುಂಬದ\s*ಮುಖ್ಯಸ್ಥ/, /मुखिया|यजमानी/];
const TAX_YES = [/\b(pay|paying|file)\s*(income\s*)?tax\b/, /\btax\s*payer\b|\btaxpayer\b/, /ಆದಾಯ\s*ತೆರಿಗೆ\s*ಪಾವತಿಸ/, /आयकर\s*(भरत|देत)/];
const TAX_NO = [/\b(don'?t|do\s*not|never)\s*pay\s*(income\s*)?tax\b/, /\bno\s*income\s*tax\b/, /ತೆರಿಗೆ\s*ಪಾವತಿಸುವುದಿಲ್ಲ/, /आयकर\s*नहीं/];

const EDUCATION: readonly [NonNullable<CitizenProfile["educationLevel"]>, readonly RegExp[]][] = [
  ["pg", [/\b(m\.?\s?a|m\.?\s?sc|m\.?\s?com|mba|mca|m\.?\s?tech|post\s*graduat\w*|masters?)\b/, /ಸ್ನಾತಕೋತ್ತರ/, /स्नातकोत्तर|पोस्ट\s*ग्रेजुएट/]],
  ["ug", [/\b(b\.?\s?a|b\.?\s?sc|b\.?\s?com|b\.?\s?e|b\.?\s?tech|bca|bba|mbbs|degree|engineering|graduation|undergrad\w*)\b/, /ಪದವಿ|ಇಂಜಿನಿಯರಿಂಗ್/, /स्नातक|डिग्री|इंजीनियरिंग/]],
  ["diploma_iti", [/\b(diploma|iti|polytechnic)\b/, /ಡಿಪ್ಲೊಮಾ|ಐಟಿಐ/, /डिप्लोमा|आईटीआई/]],
  ["puc", [/\b(puc|pre[-\s]?university|1st\s*puc|2nd\s*puc|11th|12th|class\s*1[12])\b/, /ಪಿಯುಸಿ/, /(11|12)\s*वीं|इंटर/]],
  ["class_8_10", [/\b(sslc|8th|9th|10th|class\s*(8|9|10))\b/, /ಎಸ್ಎಸ್ಎಲ್ಸಿ|(8|9|10)ನೇ\s*ತರಗತಿ/, /(8|9|10)\s*वीं/]],
];

function lakhAmount(text: string): number | null {
  const re = /(\d+(?:\.\d+)?)\s*(lakhs?|lacs?|lac|lpa|ಲಕ್ಷ|लाख)/g;
  for (const match of text.matchAll(re)) {
    const after = text.slice(match.index + match[0].length, match.index + match[0].length + 20);
    const before = text.slice(Math.max(0, match.index - 20), match.index);
    // Ignore loan amounts ("I need a loan of 5 lakh").
    if (/loan|ಸಾಲ|लोन|कर्ज|ऋण/.test(before + after)) continue;
    return Math.round(Number.parseFloat(match[1]) * 100_000);
  }
  return null;
}

function monthlyAmount(text: string): number | null {
  const re =
    /(?:₹|rs\.?|rupees|ರೂ\.?|रु\.?|रुपये)?\s*(\d[\d,]{2,})\s*(?:₹|rs\.?|rupees|ರೂಪಾಯಿ|रुपये)?\s*(?:per|a|\/|every|each)?\s*(?:month|monthly|pm\b|ತಿಂಗಳಿಗೆ|ತಿಂಗಳು|महीने|माह|मासिक)/g;
  const match = re.exec(text);
  if (!match) return null;
  const value = Number.parseInt(match[1].replace(/,/g, ""), 10);
  return Number.isFinite(value) && value > 0 && value < 10_000_000 ? value : null;
}

function yearlyRupees(text: string): number | null {
  const re = /(?:₹|rs\.?|rupees)\s*(\d[\d,]{4,})|(\d[\d,]{4,})\s*(?:rs|rupees|ರೂಪಾಯಿ|रुपये)\s*(?:per|a)?\s*(?:year|annum|annual|yearly|ವರ್ಷಕ್ಕೆ|साल|सालाना)/;
  const match = re.exec(text);
  if (!match) return null;
  const value = Number.parseInt((match[1] ?? match[2]).replace(/,/g, ""), 10);
  return Number.isFinite(value) ? value : null;
}

function age(text: string): number | null {
  const patterns = [
    /(\d{1,3})\s*(?:-|\s)?\s*(?:years?|yrs?)(?:\s*-?\s*old)?\b/,
    /\b(?:age|aged|i\s*am|i'm)\s*(?:is\s*)?(\d{1,3})\b/,
    /(\d{1,3})\s*(?:ವರ್ಷ|ವರುಷ)/,
    /ವಯಸ್ಸು\s*(\d{1,3})/,
    /(\d{1,3})\s*(?:साल|वर्ष|बरस)/,
    /(?:उम्र|आयु)\s*(\d{1,3})/,
  ];
  for (const p of patterns) {
    const m = p.exec(text);
    if (m) {
      const value = Number.parseInt(m[1], 10);
      if (value >= 1 && value <= 120) return value;
    }
  }
  return null;
}

/** Karnataka's Backward Class categories (1, 2A, 3A, 3B). These imply OBC. */
function kaBackwardClass(text: string): CitizenProfile["kaBackwardClass"] | null {
  if (/\b(category|cat)[\s.-]*1\b|\bcat[-\s]?i\b|ಪ್ರವರ್ಗ\s*1|श्रेणी\s*1/.test(text)) return "cat_1";
  if (/\b2a\b|ಪ್ರವರ್ಗ\s*2ಎ|श्रेणी\s*2a/.test(text)) return "cat_2a";
  if (/\b3a\b|ಪ್ರವರ್ಗ\s*3ಎ/.test(text)) return "cat_3a";
  if (/\b3b\b|ಪ್ರವರ್ಗ\s*3ಬಿ/.test(text)) return "cat_3b";
  return null;
}

function category(original: string, text: string): CitizenProfile["category"] | null {
  if (kaBackwardClass(text)) return "obc";
  if (/\bscheduled\s*tribe\b|\btribal\b|\badivasi\b|ಪರಿಶಿಷ್ಟ\s*ಪಂಗಡ|अनुसूचित\s*जनजाति|आदिवासी/.test(text) || /\bST\b/.test(original)) return "st";
  if (/\bscheduled\s*caste\b|\bdalit\b|ಪರಿಶಿಷ್ಟ\s*ಜಾತಿ|अनुसूचित\s*जाति|दलित/.test(text) || /\bSC\b/.test(original)) return "sc";
  if (/\bobc\b|\bother\s*backward\s*class|ಹಿಂದುಳಿದ\s*ವರ್ಗ|पिछड़ा\s*वर्ग/.test(text)) return "obc";
  if (/\b(general|open)\s*category\b|ಸಾಮಾನ್ಯ\s*ವರ್ಗ|सामान्य\s*(वर्ग|श्रेणी)/.test(text)) return "general";
  return null;
}

export function extractProfileFromText(input: string): Extraction {
  const original = input.slice(0, 1000);
  const text = original.toLowerCase();
  const profile: CitizenProfile = {};

  const set = <K extends ProfileField>(field: K, value: CitizenProfile[K]) => {
    if (value !== undefined && value !== null) profile[field] = value;
  };

  // Occupation
  let occupation: Occupation | undefined;
  for (const [value, patterns] of OCCUPATION_PATTERNS) {
    if (any(text, patterns)) {
      occupation = value;
      break;
    }
  }
  set("occupation", occupation);

  // A student who mentions farming is talking about their parents.
  const mentionsFarming = any(text, OCCUPATION_PATTERNS.find(([o]) => o === "farmer")![1]);
  if (occupation === "student" && mentionsFarming) set("parentFarmer", true);

  set("age", age(text) ?? undefined);

  if (any(text, FEMALE)) set("gender", "female");
  else if (any(text, MALE)) set("gender", "male");

  set("state", stateFromText(text) ?? undefined);

  if (any(text, RURAL)) set("areaType", "rural");
  else if (any(text, URBAN)) set("areaType", "urban");

  set("category", category(original, text) ?? undefined);
  // Karnataka's sub-categories only mean something for Karnataka residents.
  if (profile.state === "ka") set("kaBackwardClass", kaBackwardClass(text) ?? undefined);

  const yearly = lakhAmount(text) ?? yearlyRupees(text);
  const monthly = monthlyAmount(text);
  if (yearly !== null) set("incomeBand", incomeToBand(yearly));
  else if (monthly !== null) set("incomeBand", incomeToBand(monthly * 12));
  if (monthly !== null && occupation && ["unorganised_worker", "farm_labourer", "artisan"].includes(occupation)) {
    set("ownIncomeUpTo15kMonth", monthly <= 15_000);
  }

  if (occupation === "student") {
    for (const [level, patterns] of EDUCATION) {
      if (any(text, patterns)) {
        set("educationLevel", level);
        break;
      }
    }
  }

  if (occupation !== "student") {
    if (any(text, LAND_NO)) set("ownsFarmland", false);
    else if (any(text, LAND_YES) && (occupation === "farmer" || occupation === undefined)) set("ownsFarmland", true);
  }

  if (any(text, NO_HOUSE)) set("ownsPuccaHouse", false);
  else if (any(text, OWN_HOUSE)) set("ownsPuccaHouse", true);

  if (occupation === "business_owner") {
    if (any(text, NEW_BUSINESS)) set("businessStage", "new");
    else if (any(text, EXISTING_BUSINESS)) set("businessStage", "existing");
  }

  if (profile.gender === "female" && any(text, HEAD_OF_FAMILY)) set("womanHeadOfFamily", true);

  if (any(text, TAX_NO)) set("familyPaysIncomeTax", false);
  else if (any(text, TAX_YES)) set("familyPaysIncomeTax", true);

  if (occupation === "govt_employee") set("familyGovtEmployee", true);

  if (any(text, BPL)) set("bplHousehold", true);

  return { profile, fields: Object.keys(profile) as ProfileField[] };
}
