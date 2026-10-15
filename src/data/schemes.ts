import type { Criterion, IndianState, LocalizedText } from "@/lib/engine/types";
import type { DocumentId } from "./documents";
import { citizenSchemes } from "./schemes-citizens.ts";

/**
 * Scheme records.
 *
 * DATA POLICY: only rules confirmed across public sources are included.
 * Benefit amounts and deadlines change every year and sources disagree, so
 * they are NOT stored — users are sent to the official portal instead.
 * Every record stays "partially_verified" until an admin checks it against
 * the current official notification.
 */

export type TrustStatus = "verified" | "partially_verified" | "needs_review";

export type Scheme = {
  slug: string;
  name: LocalizedText;
  department: LocalizedText;
  level: "state" | "central";
  /** For state schemes: the state that runs it. Central schemes apply in every state. */
  state?: IndianState;
  summary: LocalizedText;
  benefit: LocalizedText;
  criteria: Criterion[];
  documents: DocumentId[];
  howToApply: LocalizedText[];
  applyUrl: string;
  portalName: LocalizedText;
  sources: { label: string; url: string }[];
  trust: TrustStatus;
  /** ISO date the record was last reviewed. */
  lastReviewed: string;
  /** ISO date of the official deadline, or null when not announced / not verified. Never guessed. */
  deadline: string | null;
  notes?: LocalizedText;
};

const SSP_URL = "https://ssp.postmatric.karnataka.gov.in/";
const NSP_URL = "https://scholarships.gov.in/";
const REVIEWED = "2026-10-13";

const sspPortal: LocalizedText = {
  en: "State Scholarship Portal (SSP)",
  kn: "ರಾಜ್ಯ ವಿದ್ಯಾರ್ಥಿವೇತನ ಪೋರ್ಟಲ್ (SSP)",
  hi: "राज्य छात्रवृत्ति पोर्टल (SSP)",
};

const POST_MATRIC = ["puc", "diploma_iti", "ug", "pg"] as const;
const KA_CLASSES = ["cat_1", "cat_2a", "cat_3a", "cat_3b"] as const;

// ---- Reusable criteria -------------------------------------------------------

/** Residence rule for a state scheme. Add one per state as state schemes are added. */
const resident: Criterion = {
  id: "karnataka_resident",
  rule: { kind: "equals", field: "state", value: "ka" },
  label: {
    en: "Permanent resident of Karnataka",
    kn: "ಕರ್ನಾಟಕದ ಖಾಯಂ ನಿವಾಸಿ",
    hi: "कर्नाटक के स्थायी निवासी",
  },
};

// Students only: education is asked only of students, so occupation is checked too.
const postMatric: Criterion = {
  id: "post_matric_course",
  rule: {
    kind: "allOf",
    rules: [
      { kind: "equals", field: "occupation", value: "student" },
      { kind: "in", field: "educationLevel", values: POST_MATRIC },
    ],
  },
  label: {
    en: "Studying after Class 10 (PUC, diploma, degree or PG)",
    kn: "10ನೇ ತರಗತಿಯ ನಂತರ ಓದುತ್ತಿರುವವರು (ಪಿಯುಸಿ, ಡಿಪ್ಲೊಮಾ, ಪದವಿ ಅಥವಾ ಸ್ನಾತಕೋತ್ತರ)",
    hi: "कक्षा 10 के बाद पढ़ाई (पीयूसी, डिप्लोमा, डिग्री या पीजी)",
  },
};

const incomeUpTo2_5L: Criterion = {
  id: "income_2_5l",
  rule: { kind: "incomeAtMost", max: 250_000 },
  label: {
    en: "Family income up to ₹2.5 lakh a year",
    kn: "ಕುಟುಂಬದ ವಾರ್ಷಿಕ ಆದಾಯ ₹2.5 ಲಕ್ಷದವರೆಗೆ",
    hi: "परिवार की सालाना आय ₹2.5 लाख तक",
  },
};

const obcCategory: Criterion = {
  id: "obc_category",
  rule: {
    kind: "allOf",
    rules: [
      { kind: "equals", field: "category", value: "obc" },
      { kind: "in", field: "kaBackwardClass", values: KA_CLASSES },
    ],
  },
  label: {
    en: "Belongs to a Backward Class category (Category 1, 2A, 3A or 3B)",
    kn: "ಹಿಂದುಳಿದ ವರ್ಗಕ್ಕೆ ಸೇರಿದವರು (ಪ್ರವರ್ಗ 1, 2ಎ, 3ಎ ಅಥವಾ 3ಬಿ)",
    hi: "पिछड़ा वर्ग श्रेणी से हैं (श्रेणी 1, 2A, 3A या 3B)",
  },
};

// Category 1: up to ₹2.5 lakh. Categories 2A, 3A, 3B: up to ₹1 lakh.
const obcIncome: Criterion = {
  id: "obc_income",
  rule: {
    kind: "anyOf",
    rules: [
      {
        kind: "allOf",
        rules: [
          { kind: "equals", field: "kaBackwardClass", value: "cat_1" },
          { kind: "incomeAtMost", max: 250_000 },
        ],
      },
      {
        kind: "allOf",
        rules: [
          { kind: "in", field: "kaBackwardClass", values: ["cat_2a", "cat_3a", "cat_3b"] },
          { kind: "incomeAtMost", max: 100_000 },
        ],
      },
    ],
  },
  appliesWhen: { kind: "equals", field: "category", value: "obc" },
  label: {
    en: "Family income up to ₹2.5 lakh (Category 1) or ₹1 lakh (2A, 3A, 3B)",
    kn: "ಕುಟುಂಬದ ಆದಾಯ ₹2.5 ಲಕ್ಷದವರೆಗೆ (ಪ್ರವರ್ಗ 1) ಅಥವಾ ₹1 ಲಕ್ಷದವರೆಗೆ (2ಎ, 3ಎ, 3ಬಿ)",
    hi: "परिवार की आय ₹2.5 लाख तक (श्रेणी 1) या ₹1 लाख तक (2A, 3A, 3B)",
  },
};

const sspDocuments: DocumentId[] = [
  "caste_certificate",
  "income_certificate",
  "aadhaar",
  "bank_account",
  "marks_card",
  "admission_proof",
];

const sspSteps: LocalizedText[] = [
  {
    en: "Get your caste and income certificates. Keep their RD numbers ready.",
    kn: "ಜಾತಿ ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ ಪಡೆಯಿರಿ. ಅವುಗಳ RD ಸಂಖ್ಯೆ ಸಿದ್ಧವಾಗಿಟ್ಟುಕೊಳ್ಳಿ.",
    hi: "जाति और आय प्रमाणपत्र बनवाएँ। उनके RD नंबर तैयार रखें।",
  },
  {
    en: "Make sure your bank account is linked to Aadhaar.",
    kn: "ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಖಾತೆ ಆಧಾರ್‌ಗೆ ಜೋಡಣೆಯಾಗಿದೆಯೇ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.",
    hi: "पक्का करें कि आपका बैंक खाता आधार से जुड़ा है।",
  },
  {
    en: "Apply online on the State Scholarship Portal (SSP) after your college admission.",
    kn: "ಕಾಲೇಜು ಪ್ರವೇಶದ ನಂತರ ರಾಜ್ಯ ವಿದ್ಯಾರ್ಥಿವೇತನ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ (SSP) ಆನ್‌ಲೈನ್ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.",
    hi: "कॉलेज प्रवेश के बाद राज्य छात्रवृत्ति पोर्टल (SSP) पर ऑनलाइन आवेदन करें।",
  },
  {
    en: "Your college verifies the application. Track its status on SSP.",
    kn: "ನಿಮ್ಮ ಕಾಲೇಜು ಅರ್ಜಿಯನ್ನು ಪರಿಶೀಲಿಸುತ್ತದೆ. ಸ್ಥಿತಿಯನ್ನು SSP ಯಲ್ಲಿ ನೋಡಿ.",
    hi: "आपका कॉलेज आवेदन की जाँच करता है। स्थिति SSP पर देखें।",
  },
];

const amountOnPortal = (what: LocalizedText): LocalizedText => ({
  en: `${what.en} Amounts depend on the course and year — see the official portal for current figures.`,
  kn: `${what.kn} ಮೊತ್ತವು ಕೋರ್ಸ್ ಮತ್ತು ವರ್ಷದ ಮೇಲೆ ಅವಲಂಬಿತ — ಪ್ರಸ್ತುತ ಮೊತ್ತಕ್ಕಾಗಿ ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ನೋಡಿ.`,
  hi: `${what.hi} राशि कोर्स और वर्ष पर निर्भर है — मौजूदा राशि के लिए आधिकारिक पोर्टल देखें।`,
});

// ---- Schemes -----------------------------------------------------------------

const studentSchemes: Scheme[] = [
  {
    slug: "post-matric-scholarship-sc",
    name: {
      en: "Post-Matric Scholarship for SC Students",
      kn: "ಪರಿಶಿಷ್ಟ ಜಾತಿ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಮೆಟ್ರಿಕ್ ನಂತರದ ವಿದ್ಯಾರ್ಥಿವೇತನ",
      hi: "SC छात्रों के लिए पोस्ट-मैट्रिक छात्रवृत्ति",
    },
    department: {
      en: "Social Welfare Department, Government of Karnataka",
      kn: "ಸಮಾಜ ಕಲ್ಯಾಣ ಇಲಾಖೆ, ಕರ್ನಾಟಕ ಸರ್ಕಾರ",
      hi: "समाज कल्याण विभाग, कर्नाटक सरकार",
    },
    level: "state",
    state: "ka",
    summary: {
      en: "Helps Scheduled Caste students continue their studies after Class 10.",
      kn: "ಪರಿಶಿಷ್ಟ ಜಾತಿ ವಿದ್ಯಾರ್ಥಿಗಳು 10ನೇ ತರಗತಿಯ ನಂತರ ಓದು ಮುಂದುವರಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
      hi: "अनुसूचित जाति के छात्रों को कक्षा 10 के बाद पढ़ाई जारी रखने में मदद करती है।",
    },
    benefit: amountOnPortal({
      en: "Fee support and a maintenance allowance.",
      kn: "ಶುಲ್ಕ ಸಹಾಯ ಮತ್ತು ನಿರ್ವಹಣಾ ಭತ್ಯೆ.",
      hi: "फ़ीस सहायता और रखरखाव भत्ता।",
    }),
    criteria: [
      resident,
      {
        id: "sc_category",
        rule: { kind: "equals", field: "category", value: "sc" },
        label: {
          en: "Belongs to a Scheduled Caste (SC)",
          kn: "ಪರಿಶಿಷ್ಟ ಜಾತಿಗೆ (SC) ಸೇರಿದವರು",
          hi: "अनुसूचित जाति (SC) से हैं",
        },
      },
      postMatric,
      incomeUpTo2_5L,
    ],
    documents: sspDocuments,
    howToApply: sspSteps,
    applyUrl: SSP_URL,
    portalName: sspPortal,
    sources: [{ label: "ssp.postmatric.karnataka.gov.in", url: SSP_URL }],
    trust: "partially_verified",
    lastReviewed: REVIEWED,
    deadline: null,
  },
  {
    slug: "post-matric-scholarship-st",
    name: {
      en: "Post-Matric Scholarship for ST Students",
      kn: "ಪರಿಶಿಷ್ಟ ಪಂಗಡದ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಮೆಟ್ರಿಕ್ ನಂತರದ ವಿದ್ಯಾರ್ಥಿವೇತನ",
      hi: "ST छात्रों के लिए पोस्ट-मैट्रिक छात्रवृत्ति",
    },
    department: {
      en: "Scheduled Tribes Welfare Department, Government of Karnataka",
      kn: "ಪರಿಶಿಷ್ಟ ವರ್ಗಗಳ ಕಲ್ಯಾಣ ಇಲಾಖೆ, ಕರ್ನಾಟಕ ಸರ್ಕಾರ",
      hi: "अनुसूचित जनजाति कल्याण विभाग, कर्नाटक सरकार",
    },
    level: "state",
    state: "ka",
    summary: {
      en: "Helps Scheduled Tribe students continue their studies after Class 10.",
      kn: "ಪರಿಶಿಷ್ಟ ಪಂಗಡದ ವಿದ್ಯಾರ್ಥಿಗಳು 10ನೇ ತರಗತಿಯ ನಂತರ ಓದು ಮುಂದುವರಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
      hi: "अनुसूचित जनजाति के छात्रों को कक्षा 10 के बाद पढ़ाई जारी रखने में मदद करती है।",
    },
    benefit: amountOnPortal({
      en: "Fee support and a maintenance allowance.",
      kn: "ಶುಲ್ಕ ಸಹಾಯ ಮತ್ತು ನಿರ್ವಹಣಾ ಭತ್ಯೆ.",
      hi: "फ़ीस सहायता और रखरखाव भत्ता।",
    }),
    criteria: [
      resident,
      {
        id: "st_category",
        rule: { kind: "equals", field: "category", value: "st" },
        label: {
          en: "Belongs to a Scheduled Tribe (ST)",
          kn: "ಪರಿಶಿಷ್ಟ ಪಂಗಡಕ್ಕೆ (ST) ಸೇರಿದವರು",
          hi: "अनुसूचित जनजाति (ST) से हैं",
        },
      },
      postMatric,
      incomeUpTo2_5L,
    ],
    documents: sspDocuments,
    howToApply: sspSteps,
    applyUrl: SSP_URL,
    portalName: sspPortal,
    sources: [{ label: "ssp.postmatric.karnataka.gov.in", url: SSP_URL }],
    trust: "partially_verified",
    lastReviewed: REVIEWED,
    deadline: null,
    notes: {
      en: "Some professional courses may have a higher income limit with partial benefits. Check the portal.",
      kn: "ಕೆಲವು ವೃತ್ತಿಪರ ಕೋರ್ಸ್‌ಗಳಿಗೆ ಭಾಗಶಃ ಸೌಲಭ್ಯದೊಂದಿಗೆ ಹೆಚ್ಚಿನ ಆದಾಯ ಮಿತಿ ಇರಬಹುದು. ಪೋರ್ಟಲ್ ನೋಡಿ.",
      hi: "कुछ प्रोफ़ेशनल कोर्स में आंशिक लाभ के साथ ऊँची आय सीमा हो सकती है। पोर्टल देखें।",
    },
  },
  {
    slug: "post-matric-scholarship-obc",
    name: {
      en: "Post-Matric Scholarship for Backward Classes",
      kn: "ಹಿಂದುಳಿದ ವರ್ಗಗಳ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಮೆಟ್ರಿಕ್ ನಂತರದ ವಿದ್ಯಾರ್ಥಿವೇತನ",
      hi: "पिछड़े वर्गों के लिए पोस्ट-मैट्रिक छात्रवृत्ति",
    },
    department: {
      en: "Backward Classes Welfare Department, Government of Karnataka",
      kn: "ಹಿಂದುಳಿದ ವರ್ಗಗಳ ಕಲ್ಯಾಣ ಇಲಾಖೆ, ಕರ್ನಾಟಕ ಸರ್ಕಾರ",
      hi: "पिछड़ा वर्ग कल्याण विभाग, कर्नाटक सरकार",
    },
    level: "state",
    state: "ka",
    summary: {
      en: "Helps Backward Class students (Category 1, 2A, 3A, 3B) study after Class 10.",
      kn: "ಹಿಂದುಳಿದ ವರ್ಗದ (ಪ್ರವರ್ಗ 1, 2ಎ, 3ಎ, 3ಬಿ) ವಿದ್ಯಾರ್ಥಿಗಳು 10ನೇ ತರಗತಿಯ ನಂತರ ಓದಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
      hi: "पिछड़ा वर्ग (श्रेणी 1, 2A, 3A, 3B) के छात्रों को कक्षा 10 के बाद पढ़ने में मदद करती है।",
    },
    benefit: amountOnPortal({
      en: "Fee support and a scholarship amount.",
      kn: "ಶುಲ್ಕ ಸಹಾಯ ಮತ್ತು ವಿದ್ಯಾರ್ಥಿವೇತನ ಮೊತ್ತ.",
      hi: "फ़ीस सहायता और छात्रवृत्ति राशि।",
    }),
    criteria: [resident, obcCategory, postMatric, obcIncome],
    documents: sspDocuments,
    howToApply: sspSteps,
    applyUrl: SSP_URL,
    portalName: sspPortal,
    sources: [{ label: "ssp.postmatric.karnataka.gov.in", url: SSP_URL }],
    trust: "partially_verified",
    lastReviewed: REVIEWED,
    deadline: null,
  },
  {
    slug: "vidyasiri-food-and-accommodation",
    name: {
      en: "Vidyasiri — Food and Accommodation Assistance",
      kn: "ವಿದ್ಯಾಸಿರಿ — ಊಟ ಮತ್ತು ವಸತಿ ಸಹಾಯ",
      hi: "विद्यासिरी — भोजन और आवास सहायता",
    },
    department: {
      en: "Backward Classes Welfare Department, Government of Karnataka",
      kn: "ಹಿಂದುಳಿದ ವರ್ಗಗಳ ಕಲ್ಯಾಣ ಇಲಾಖೆ, ಕರ್ನಾಟಕ ಸರ್ಕಾರ",
      hi: "पिछड़ा वर्ग कल्याण विभाग, कर्नाटक सरकार",
    },
    level: "state",
    state: "ka",
    summary: {
      en: "Monthly help with food and stay for Backward Class students who do not get a government hostel seat.",
      kn: "ಸರ್ಕಾರಿ ವಸತಿ ನಿಲಯ ಸಿಗದ ಹಿಂದುಳಿದ ವರ್ಗದ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಊಟ ಮತ್ತು ವಸತಿಗಾಗಿ ಮಾಸಿಕ ಸಹಾಯ.",
      hi: "सरकारी छात्रावास न मिलने वाले पिछड़ा वर्ग छात्रों को भोजन और रहने के लिए मासिक मदद।",
    },
    benefit: amountOnPortal({
      en: "A monthly amount for food and accommodation during the academic year.",
      kn: "ಶೈಕ್ಷಣಿಕ ವರ್ಷದಲ್ಲಿ ಊಟ ಮತ್ತು ವಸತಿಗಾಗಿ ಮಾಸಿಕ ಮೊತ್ತ.",
      hi: "शैक्षणिक वर्ष में भोजन और आवास के लिए मासिक राशि।",
    }),
    criteria: [
      resident,
      obcCategory,
      postMatric,
      obcIncome,
      {
        id: "no_government_hostel",
        rule: { kind: "equals", field: "inGovernmentHostel", value: false },
        label: {
          en: "Not staying in a government hostel",
          kn: "ಸರ್ಕಾರಿ ವಸತಿ ನಿಲಯದಲ್ಲಿ ಇಲ್ಲದವರು",
          hi: "सरकारी छात्रावास में नहीं रहते",
        },
      },
    ],
    documents: sspDocuments,
    howToApply: sspSteps,
    applyUrl: SSP_URL,
    portalName: sspPortal,
    sources: [{ label: "ssp.postmatric.karnataka.gov.in", url: SSP_URL }],
    trust: "partially_verified",
    lastReviewed: REVIEWED,
    deadline: null,
    notes: {
      en: "You can usually get only one of: Vidyasiri, a government hostel seat, or certain other Backward Classes benefits. Check the portal.",
      kn: "ಸಾಮಾನ್ಯವಾಗಿ ವಿದ್ಯಾಸಿರಿ, ಸರ್ಕಾರಿ ವಸತಿ ನಿಲಯ ಅಥವಾ ಕೆಲವು ಇತರ ಸೌಲಭ್ಯಗಳಲ್ಲಿ ಒಂದನ್ನು ಮಾತ್ರ ಪಡೆಯಬಹುದು. ಪೋರ್ಟಲ್ ನೋಡಿ.",
      hi: "आमतौर पर विद्यासिरी, सरकारी छात्रावास या कुछ अन्य लाभों में से एक ही मिलता है। पोर्टल देखें।",
    },
  },
  {
    slug: "raitha-vidya-nidhi",
    name: {
      en: "Chief Minister's Raitha Vidya Nidhi",
      kn: "ಮುಖ್ಯಮಂತ್ರಿ ರೈತ ವಿದ್ಯಾ ನಿಧಿ",
      hi: "मुख्यमंत्री रैता विद्या निधि",
    },
    department: {
      en: "Agriculture Department, Government of Karnataka",
      kn: "ಕೃಷಿ ಇಲಾಖೆ, ಕರ್ನಾಟಕ ಸರ್ಕಾರ",
      hi: "कृषि विभाग, कर्नाटक सरकार",
    },
    level: "state",
    state: "ka",
    summary: {
      en: "A scholarship for children of farmers in Karnataka who study after Class 10. No income limit.",
      kn: "10ನೇ ತರಗತಿಯ ನಂತರ ಓದುತ್ತಿರುವ ಕರ್ನಾಟಕದ ರೈತರ ಮಕ್ಕಳಿಗೆ ವಿದ್ಯಾರ್ಥಿವೇತನ. ಆದಾಯ ಮಿತಿ ಇಲ್ಲ.",
      hi: "कक्षा 10 के बाद पढ़ने वाले कर्नाटक के किसानों के बच्चों के लिए छात्रवृत्ति। कोई आय सीमा नहीं।",
    },
    benefit: amountOnPortal({
      en: "A yearly scholarship paid to your bank account.",
      kn: "ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ವಾರ್ಷಿಕ ವಿದ್ಯಾರ್ಥಿವೇತನ.",
      hi: "आपके बैंक खाते में सालाना छात्रवृत्ति।",
    }),
    criteria: [
      resident,
      postMatric,
      {
        id: "parent_farmer",
        rule: { kind: "equals", field: "parentFarmer", value: true },
        label: {
          en: "Parent is a farmer with land in Karnataka (FRUITS registered)",
          kn: "ಪೋಷಕರು ಕರ್ನಾಟಕದಲ್ಲಿ ಜಮೀನು ಹೊಂದಿರುವ ರೈತರು (FRUITS ನೋಂದಣಿ)",
          hi: "माता/पिता कर्नाटक में ज़मीन वाले किसान हैं (FRUITS पंजीकृत)",
        },
      },
    ],
    documents: ["fruits_id", "aadhaar", "bank_account", "marks_card", "admission_proof"],
    howToApply: [
      {
        en: "Your parent registers on FRUITS to get a farmer ID.",
        kn: "ನಿಮ್ಮ ಪೋಷಕರು ರೈತ ಐಡಿ ಪಡೆಯಲು FRUITS ನಲ್ಲಿ ನೋಂದಾಯಿಸಬೇಕು.",
        hi: "माता/पिता किसान आईडी के लिए FRUITS पर पंजीकरण करें।",
      },
      {
        en: "Apply on the State Scholarship Portal (SSP) using your parent's FRUITS ID.",
        kn: "ಪೋಷಕರ FRUITS ಐಡಿ ಬಳಸಿ ರಾಜ್ಯ ವಿದ್ಯಾರ್ಥಿವೇತನ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ (SSP) ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.",
        hi: "माता/पिता की FRUITS आईडी से राज्य छात्रवृत्ति पोर्टल (SSP) पर आवेदन करें।",
      },
      {
        en: "Land records are checked automatically. Track your status on SSP.",
        kn: "ಜಮೀನು ದಾಖಲೆಗಳನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಪರಿಶೀಲಿಸಲಾಗುತ್ತದೆ. ಸ್ಥಿತಿಯನ್ನು SSP ಯಲ್ಲಿ ನೋಡಿ.",
        hi: "ज़मीन के रिकॉर्ड अपने आप जाँचे जाते हैं। स्थिति SSP पर देखें।",
      },
    ],
    applyUrl: SSP_URL,
    portalName: sspPortal,
    sources: [
      { label: "ssp.postmatric.karnataka.gov.in", url: SSP_URL },
      { label: "fruits.karnataka.gov.in", url: "https://fruits.karnataka.gov.in/" },
    ],
    trust: "partially_verified",
    lastReviewed: REVIEWED,
    deadline: null,
  },
  {
    slug: "central-sector-scholarship",
    name: {
      en: "Central Sector Scholarship for College and University Students",
      kn: "ಕಾಲೇಜು ಮತ್ತು ವಿಶ್ವವಿದ್ಯಾಲಯ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಕೇಂದ್ರ ವಲಯ ವಿದ್ಯಾರ್ಥಿವೇತನ",
      hi: "कॉलेज और विश्वविद्यालय छात्रों के लिए केंद्रीय क्षेत्र छात्रवृत्ति",
    },
    department: {
      en: "Department of Higher Education, Ministry of Education, Government of India",
      kn: "ಉನ್ನತ ಶಿಕ್ಷಣ ಇಲಾಖೆ, ಶಿಕ್ಷಣ ಸಚಿವಾಲಯ, ಭಾರತ ಸರ್ಕಾರ",
      hi: "उच्च शिक्षा विभाग, शिक्षा मंत्रालय, भारत सरकार",
    },
    level: "central",
    summary: {
      en: "For top Class 12 performers from families earning up to ₹4.5 lakh, studying a regular degree.",
      kn: "₹4.5 ಲಕ್ಷದವರೆಗೆ ಆದಾಯವಿರುವ ಕುಟುಂಬದ, 12ನೇ ತರಗತಿಯಲ್ಲಿ ಉತ್ತಮ ಸಾಧನೆ ಮಾಡಿ ನಿಯಮಿತ ಪದವಿ ಓದುತ್ತಿರುವವರಿಗೆ.",
      hi: "₹4.5 लाख तक आय वाले परिवारों के, कक्षा 12 में अच्छा प्रदर्शन करने वाले, नियमित डिग्री कर रहे छात्रों के लिए।",
    },
    benefit: amountOnPortal({
      en: "A yearly scholarship for degree and postgraduate study.",
      kn: "ಪದವಿ ಮತ್ತು ಸ್ನಾತಕೋತ್ತರ ಓದಿಗೆ ವಾರ್ಷಿಕ ವಿದ್ಯಾರ್ಥಿವೇತನ.",
      hi: "डिग्री और पोस्टग्रेजुएट पढ़ाई के लिए सालाना छात्रवृत्ति।",
    }),
    criteria: [
      {
        id: "regular_degree",
        rule: {
          kind: "allOf",
          rules: [
            { kind: "equals", field: "occupation", value: "student" },
            { kind: "in", field: "educationLevel", values: ["ug", "pg"] },
          ],
        },
        label: {
          en: "Studying a regular degree or postgraduate course",
          kn: "ನಿಯಮಿತ ಪದವಿ ಅಥವಾ ಸ್ನಾತಕೋತ್ತರ ಕೋರ್ಸ್ ಓದುತ್ತಿರುವವರು",
          hi: "नियमित डिग्री या पोस्टग्रेजुएट कोर्स कर रहे हैं",
        },
      },
      {
        id: "class12_80th_percentile",
        rule: { kind: "equals", field: "class12Above80Percentile", value: true },
        appliesWhen: { kind: "equals", field: "educationLevel", value: "ug" },
        label: {
          en: "Above the 80th percentile in your Class 12 board exam (new applicants)",
          kn: "12ನೇ ತರಗತಿ ಬೋರ್ಡ್ ಪರೀಕ್ಷೆಯಲ್ಲಿ 80ನೇ ಪರ್ಸೆಂಟೈಲ್‌ಗಿಂತ ಮೇಲೆ (ಹೊಸ ಅರ್ಜಿದಾರರು)",
          hi: "कक्षा 12 बोर्ड परीक्षा में 80वें पर्सेंटाइल से ऊपर (नए आवेदक)",
        },
      },
      {
        id: "income_4_5l",
        rule: { kind: "incomeAtMost", max: 450_000 },
        label: {
          en: "Family income up to ₹4.5 lakh a year",
          kn: "ಕುಟುಂಬದ ವಾರ್ಷಿಕ ಆದಾಯ ₹4.5 ಲಕ್ಷದವರೆಗೆ",
          hi: "परिवार की सालाना आय ₹4.5 लाख तक",
        },
      },
    ],
    documents: ["nsp_otr", "income_certificate", "aadhaar", "bank_account", "marks_card", "admission_proof"],
    howToApply: [
      {
        en: "Complete One-Time Registration (OTR) on the National Scholarship Portal.",
        kn: "ರಾಷ್ಟ್ರೀಯ ವಿದ್ಯಾರ್ಥಿವೇತನ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಒಂದು ಬಾರಿಯ ನೋಂದಣಿ (OTR) ಮಾಡಿ.",
        hi: "राष्ट्रीय छात्रवृत्ति पोर्टल पर वन-टाइम रजिस्ट्रेशन (OTR) करें।",
      },
      {
        en: "Apply for the Central Sector Scheme on NSP.",
        kn: "NSP ಯಲ್ಲಿ ಕೇಂದ್ರ ವಲಯ ಯೋಜನೆಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.",
        hi: "NSP पर केंद्रीय क्षेत्र योजना के लिए आवेदन करें।",
      },
      {
        en: "Your college verifies the application. Track its status on NSP.",
        kn: "ನಿಮ್ಮ ಕಾಲೇಜು ಅರ್ಜಿಯನ್ನು ಪರಿಶೀಲಿಸುತ್ತದೆ. ಸ್ಥಿತಿಯನ್ನು NSP ಯಲ್ಲಿ ನೋಡಿ.",
        hi: "आपका कॉलेज आवेदन की जाँच करता है। स्थिति NSP पर देखें।",
      },
    ],
    applyUrl: NSP_URL,
    portalName: {
      en: "National Scholarship Portal (NSP)",
      kn: "ರಾಷ್ಟ್ರೀಯ ವಿದ್ಯಾರ್ಥಿವೇತನ ಪೋರ್ಟಲ್ (NSP)",
      hi: "राष्ट्रीय छात्रवृत्ति पोर्टल (NSP)",
    },
    sources: [{ label: "scholarships.gov.in", url: NSP_URL }],
    trust: "partially_verified",
    lastReviewed: REVIEWED,
    deadline: null,
    notes: {
      en: "You cannot take this together with another scholarship or fee reimbursement scheme. Distance and diploma courses do not qualify.",
      kn: "ಇದನ್ನು ಬೇರೆ ವಿದ್ಯಾರ್ಥಿವೇತನ ಅಥವಾ ಶುಲ್ಕ ಮರುಪಾವತಿ ಯೋಜನೆಯ ಜೊತೆ ಪಡೆಯಲಾಗುವುದಿಲ್ಲ. ದೂರಶಿಕ್ಷಣ ಮತ್ತು ಡಿಪ್ಲೊಮಾ ಕೋರ್ಸ್‌ಗಳು ಅರ್ಹವಲ್ಲ.",
      hi: "इसे किसी अन्य छात्रवृत्ति या फ़ीस प्रतिपूर्ति योजना के साथ नहीं ले सकते। दूरस्थ और डिप्लोमा कोर्स पात्र नहीं हैं।",
    },
  },
];

/** All built-in schemes: education first, then schemes for every citizen. */
export const schemes: Scheme[] = [...studentSchemes, ...citizenSchemes];

export function getScheme(slug: string): Scheme | undefined {
  return schemes.find((s) => s.slug === slug);
}
