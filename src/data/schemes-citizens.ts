import type { Criterion, LocalizedText } from "../lib/engine/types.ts";
import type { Scheme } from "./schemes.ts";

/**
 * Schemes for all citizens (farmers, workers, business owners, women, seniors,
 * job seekers, housing). Same DATA POLICY as schemes.ts: only rules confirmed
 * across public sources; no amounts or deadlines; official portal links.
 * Reviewed 2026-10-13.
 */

const REVIEWED = "2026-10-13";
const SEVA_SINDHU = "https://sevasindhu.karnataka.gov.in/";

const seeportal = (what: LocalizedText): LocalizedText => ({
  en: `${what.en} Check the official portal for current amounts and terms.`,
  kn: `${what.kn} ಪ್ರಸ್ತುತ ಮೊತ್ತ ಮತ್ತು ನಿಯಮಗಳಿಗಾಗಿ ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ನೋಡಿ.`,
  hi: `${what.hi} मौजूदा राशि और शर्तों के लिए आधिकारिक पोर्टल देखें।`,
});

// ---- Reusable criteria -------------------------------------------------------

const resident: Criterion = {
  id: "karnataka_resident",
  rule: { kind: "equals", field: "state", value: "ka" },
  label: { en: "Permanent resident of Karnataka", kn: "ಕರ್ನಾಟಕದ ಖಾಯಂ ನಿವಾಸಿ", hi: "कर्नाटक के स्थायी निवासी" },
};

const woman: Criterion = {
  id: "woman",
  rule: { kind: "equals", field: "gender", value: "female" },
  label: { en: "Woman", kn: "ಮಹಿಳೆ", hi: "महिला" },
};

const age = (id: string, min: number | undefined, max: number | undefined, label: LocalizedText): Criterion => ({
  id,
  rule: { kind: "between", field: "age", min, max },
  label,
});

const adult = age("age_18_plus", 18, undefined, {
  en: "18 years or older",
  kn: "18 ವರ್ಷ ಅಥವಾ ಹೆಚ್ಚು",
  hi: "18 वर्ष या उससे अधिक",
});

const noGovtJobInFamily: Criterion = {
  id: "no_govt_job_in_family",
  rule: { kind: "equals", field: "familyGovtEmployee", value: false },
  label: {
    en: "No one in the family works in (or retired from) government service",
    kn: "ಕುಟುಂಬದಲ್ಲಿ ಯಾರೂ ಸರ್ಕಾರಿ ಸೇವೆಯಲ್ಲಿ ಇಲ್ಲ (ಅಥವಾ ನಿವೃತ್ತರಲ್ಲ)",
    hi: "परिवार में कोई सरकारी सेवा में नहीं है (या उससे रिटायर नहीं है)",
  },
};

const noFamilyIncomeTax: Criterion = {
  id: "no_family_income_tax",
  rule: { kind: "equals", field: "familyPaysIncomeTax", value: false },
  label: {
    en: "No one in the family pays income tax",
    kn: "ಕುಟುಂಬದಲ್ಲಿ ಯಾರೂ ಆದಾಯ ತೆರಿಗೆ ಪಾವತಿಸುವುದಿಲ್ಲ",
    hi: "परिवार में कोई आयकर नहीं भरता",
  },
};

// If no one in the family pays income tax, the applicant doesn't either.
const notIncomeTaxPayer: Criterion = {
  id: "not_income_tax_payer",
  rule: {
    kind: "anyOf",
    rules: [
      { kind: "equals", field: "familyPaysIncomeTax", value: false },
      { kind: "equals", field: "selfPaysIncomeTax", value: false },
    ],
  },
  label: { en: "You do not pay income tax", kn: "ನೀವು ಆದಾಯ ತೆರಿಗೆ ಪಾವತಿಸುವುದಿಲ್ಲ", hi: "आप आयकर नहीं भरते" },
};

const occupationIs = (id: string, values: string[], label: LocalizedText): Criterion => ({
  id,
  rule: { kind: "in", field: "occupation", values },
  label,
});

const farmer = occupationIs("farmer", ["farmer"], { en: "You are a farmer", kn: "ನೀವು ರೈತರು", hi: "आप किसान हैं" });
const businessOwner = occupationIs("business_owner", ["business_owner"], {
  en: "Running or starting a business",
  kn: "ವ್ಯವಹಾರ ನಡೆಸುತ್ತಿದ್ದೀರಿ ಅಥವಾ ಆರಂಭಿಸುತ್ತಿದ್ದೀರಿ",
  hi: "व्यवसाय चला रहे हैं या शुरू कर रहे हैं",
});
const newBusiness: Criterion = {
  id: "new_business",
  rule: { kind: "equals", field: "businessStage", value: "new" },
  label: {
    en: "Starting a new business (not expanding an existing one)",
    kn: "ಹೊಸ ವ್ಯವಹಾರ ಆರಂಭಿಸುತ್ತಿದ್ದೀರಿ (ಈಗಿರುವುದನ್ನು ವಿಸ್ತರಿಸುತ್ತಿಲ್ಲ)",
    hi: "नया व्यवसाय शुरू कर रहे हैं (मौजूदा का विस्तार नहीं)",
  },
};

const bankDocs = ["aadhaar", "bank_account"] as const;

// ---- Schemes -----------------------------------------------------------------

export const citizenSchemes: Scheme[] = [
  // ------------------------------ Farmers ------------------------------
  {
    slug: "pm-kisan",
    name: { en: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)", kn: "ಪಿಎಂ-ಕಿಸಾನ್ (ಪ್ರಧಾನ ಮಂತ್ರಿ ಕಿಸಾನ್ ಸಮ್ಮಾನ್ ನಿಧಿ)", hi: "पीएम-किसान (प्रधानमंत्री किसान सम्मान निधि)" },
    department: {
      en: "Ministry of Agriculture & Farmers Welfare, Government of India",
      kn: "ಕೃಷಿ ಮತ್ತು ರೈತ ಕಲ್ಯಾಣ ಸಚಿವಾಲಯ, ಭಾರತ ಸರ್ಕಾರ",
      hi: "कृषि एवं किसान कल्याण मंत्रालय, भारत सरकार",
    },
    level: "central",
    summary: {
      en: "Regular income support paid directly to the bank accounts of landholding farmer families.",
      kn: "ಜಮೀನು ಹೊಂದಿರುವ ರೈತ ಕುಟುಂಬಗಳ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ನೇರವಾಗಿ ನಿಯಮಿತ ಆದಾಯ ಬೆಂಬಲ.",
      hi: "ज़मीन वाले किसान परिवारों के बैंक खाते में सीधे नियमित आय सहायता।",
    },
    benefit: seeportal({
      en: "Yearly income support in instalments, paid by DBT.",
      kn: "ಕಂತುಗಳಲ್ಲಿ ವಾರ್ಷಿಕ ಆದಾಯ ಬೆಂಬಲ, DBT ಮೂಲಕ.",
      hi: "किस्तों में सालाना आय सहायता, DBT द्वारा।",
    }),
    criteria: [
      farmer,
      {
        id: "owns_farmland",
        rule: { kind: "equals", field: "ownsFarmland", value: true },
        label: { en: "Family owns farmland", kn: "ಕುಟುಂಬದ ಹೆಸರಿನಲ್ಲಿ ಕೃಷಿ ಜಮೀನು ಇದೆ", hi: "परिवार के पास खेती की ज़मीन है" },
      },
      noFamilyIncomeTax,
      noGovtJobInFamily,
    ],
    documents: ["aadhaar", "land_records", "bank_account"],
    howToApply: [
      {
        en: "Register on the PM-KISAN portal, or at a Common Service Centre / agriculture office.",
        kn: "ಪಿಎಂ-ಕಿಸಾನ್ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ, ಅಥವಾ ಸಾಮಾನ್ಯ ಸೇವಾ ಕೇಂದ್ರ / ಕೃಷಿ ಕಚೇರಿಯಲ್ಲಿ ನೋಂದಾಯಿಸಿ.",
        hi: "पीएम-किसान पोर्टल पर, या कॉमन सर्विस सेंटर / कृषि कार्यालय में पंजीकरण करें।",
      },
      {
        en: "Complete e-KYC and make sure your bank account is linked to Aadhaar.",
        kn: "ಇ-ಕೆವೈಸಿ ಪೂರ್ಣಗೊಳಿಸಿ ಮತ್ತು ಬ್ಯಾಂಕ್ ಖಾತೆ ಆಧಾರ್‌ಗೆ ಜೋಡಣೆಯಾಗಿದೆಯೇ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.",
        hi: "ई-केवाईसी पूरा करें और पक्का करें कि बैंक खाता आधार से जुड़ा है।",
      },
      {
        en: "The state verifies your land records. Check your status on the portal.",
        kn: "ರಾಜ್ಯ ಸರ್ಕಾರ ಜಮೀನು ದಾಖಲೆ ಪರಿಶೀಲಿಸುತ್ತದೆ. ಸ್ಥಿತಿಯನ್ನು ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ನೋಡಿ.",
        hi: "राज्य ज़मीन के रिकॉर्ड जाँचता है। स्थिति पोर्टल पर देखें।",
      },
    ],
    applyUrl: "https://pmkisan.gov.in/",
    portalName: { en: "PM-KISAN portal", kn: "ಪಿಎಂ-ಕಿಸಾನ್ ಪೋರ್ಟಲ್", hi: "पीएम-किसान पोर्टल" },
    sources: [{ label: "pmkisan.gov.in", url: "https://pmkisan.gov.in/" }],
    trust: "partially_verified",
    lastReviewed: REVIEWED,
    deadline: null,
    notes: {
      en: "Also excluded: institutional landholders, holders of constitutional or elected posts, certain professionals and pensioners. See the portal for the full list.",
      kn: "ಇವರೂ ಹೊರಗಿದ್ದಾರೆ: ಸಾಂಸ್ಥಿಕ ಭೂಮಾಲೀಕರು, ಸಾಂವಿಧಾನಿಕ ಅಥವಾ ಚುನಾಯಿತ ಹುದ್ದೆಯವರು, ಕೆಲವು ವೃತ್ತಿಪರರು ಮತ್ತು ಪಿಂಚಣಿದಾರರು. ಪೂರ್ಣ ಪಟ್ಟಿಗೆ ಪೋರ್ಟಲ್ ನೋಡಿ.",
      hi: "ये भी बाहर हैं: संस्थागत भूमिधारक, संवैधानिक या निर्वाचित पदधारी, कुछ पेशेवर और पेंशनभोगी। पूरी सूची पोर्टल पर देखें।",
    },
  },
  {
    slug: "kisan-credit-card",
    name: { en: "Kisan Credit Card (KCC)", kn: "ಕಿಸಾನ್ ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್ (KCC)", hi: "किसान क्रेडिट कार्ड (KCC)" },
    department: {
      en: "Ministry of Agriculture & Farmers Welfare, through banks",
      kn: "ಕೃಷಿ ಮತ್ತು ರೈತ ಕಲ್ಯಾಣ ಸಚಿವಾಲಯ, ಬ್ಯಾಂಕ್‌ಗಳ ಮೂಲಕ",
      hi: "कृषि एवं किसान कल्याण मंत्रालय, बैंकों के माध्यम से",
    },
    level: "central",
    summary: {
      en: "Short-term crop loans from banks for seeds, fertiliser and farm needs, at a concessional interest rate.",
      kn: "ಬೀಜ, ಗೊಬ್ಬರ ಮತ್ತು ಕೃಷಿ ಅಗತ್ಯಗಳಿಗೆ ರಿಯಾಯಿತಿ ಬಡ್ಡಿದರದಲ್ಲಿ ಬ್ಯಾಂಕ್‌ನಿಂದ ಅಲ್ಪಾವಧಿ ಬೆಳೆ ಸಾಲ.",
      hi: "बीज, खाद और खेती की ज़रूरतों के लिए रियायती ब्याज पर बैंक से अल्पकालिक फसल ऋण।",
    },
    benefit: seeportal({
      en: "A revolving credit limit for farming, with interest support for prompt repayment.",
      kn: "ಕೃಷಿಗಾಗಿ ಆವರ್ತ ಸಾಲ ಮಿತಿ, ಸಮಯಕ್ಕೆ ಮರುಪಾವತಿಗೆ ಬಡ್ಡಿ ರಿಯಾಯಿತಿ.",
      hi: "खेती के लिए परिक्रामी ऋण सीमा, समय पर चुकाने पर ब्याज में छूट।",
    }),
    criteria: [farmer],
    documents: ["aadhaar", "land_records", "bank_account"],
    howToApply: [
      {
        en: "Visit any bank branch (or apply online on your bank's website) with your documents.",
        kn: "ದಾಖಲೆಗಳೊಂದಿಗೆ ಯಾವುದೇ ಬ್ಯಾಂಕ್ ಶಾಖೆಗೆ ಭೇಟಿ ನೀಡಿ (ಅಥವಾ ಬ್ಯಾಂಕ್ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ).",
        hi: "दस्तावेज़ों के साथ किसी भी बैंक शाखा में जाएँ (या बैंक की वेबसाइट पर आवेदन करें)।",
      },
      {
        en: "Fill the KCC form. The bank sets your limit based on your crops and land.",
        kn: "KCC ಅರ್ಜಿ ತುಂಬಿ. ನಿಮ್ಮ ಬೆಳೆ ಮತ್ತು ಜಮೀನಿನ ಆಧಾರದ ಮೇಲೆ ಬ್ಯಾಂಕ್ ಮಿತಿ ನಿಗದಿಪಡಿಸುತ್ತದೆ.",
        hi: "KCC फ़ॉर्म भरें। बैंक आपकी फसल और ज़मीन के आधार पर सीमा तय करता है।",
      },
    ],
    applyUrl: "https://www.myscheme.gov.in/",
    portalName: { en: "your bank (see myScheme for details)", kn: "ನಿಮ್ಮ ಬ್ಯಾಂಕ್ (ವಿವರಕ್ಕೆ myScheme ನೋಡಿ)", hi: "आपका बैंक (विवरण के लिए myScheme देखें)" },
    sources: [{ label: "myscheme.gov.in (search: Kisan Credit Card)", url: "https://www.myscheme.gov.in/" }],
    trust: "partially_verified",
    lastReviewed: REVIEWED,
    deadline: null,
    notes: {
      en: "Tenant farmers, sharecroppers, and farmers in animal husbandry and fisheries can also apply. Ask your bank.",
      kn: "ಗೇಣಿದಾರರು, ಪಾಲುದಾರ ರೈತರು, ಪಶುಸಂಗೋಪನೆ ಮತ್ತು ಮೀನುಗಾರಿಕೆ ರೈತರೂ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು. ನಿಮ್ಮ ಬ್ಯಾಂಕ್‌ನಲ್ಲಿ ಕೇಳಿ.",
      hi: "बटाईदार, किराएदार किसान और पशुपालन व मत्स्य पालन करने वाले भी आवेदन कर सकते हैं। बैंक से पूछें।",
    },
  },
  {
    slug: "pm-fasal-bima-yojana",
    name: { en: "PM Fasal Bima Yojana (crop insurance)", kn: "ಪಿಎಂ ಫಸಲ್ ಬಿಮಾ ಯೋಜನೆ (ಬೆಳೆ ವಿಮೆ)", hi: "पीएम फसल बीमा योजना (फसल बीमा)" },
    department: {
      en: "Ministry of Agriculture & Farmers Welfare, with your state government",
      kn: "ಕೃಷಿ ಮತ್ತು ರೈತ ಕಲ್ಯಾಣ ಸಚಿವಾಲಯ, ನಿಮ್ಮ ರಾಜ್ಯ ಸರ್ಕಾರದೊಂದಿಗೆ",
      hi: "कृषि एवं किसान कल्याण मंत्रालय, आपकी राज्य सरकार के साथ",
    },
    level: "central",
    summary: {
      en: "Low-premium insurance that pays when your crop is lost to drought, flood, pests or other natural causes. Tenant farmers and sharecroppers can join too.",
      kn: "ಬರ, ನೆರೆ, ಕೀಟ ಅಥವಾ ಇತರ ನೈಸರ್ಗಿಕ ಕಾರಣಗಳಿಂದ ಬೆಳೆ ನಷ್ಟವಾದಾಗ ಪರಿಹಾರ ನೀಡುವ ಕಡಿಮೆ ಪ್ರೀಮಿಯಂ ವಿಮೆ. ಗೇಣಿದಾರರು ಮತ್ತು ಪಾಲುದಾರ ರೈತರೂ ಸೇರಬಹುದು.",
      hi: "सूखा, बाढ़, कीट या अन्य प्राकृतिक कारणों से फसल खराब होने पर भुगतान करने वाला कम प्रीमियम का बीमा। किराएदार और बटाईदार किसान भी जुड़ सकते हैं।",
    },
    benefit: seeportal({
      en: "Compensation for crop loss on notified crops. You pay a small share of the premium; the government pays the rest.",
      kn: "ಅಧಿಸೂಚಿತ ಬೆಳೆಗಳ ನಷ್ಟಕ್ಕೆ ಪರಿಹಾರ. ಪ್ರೀಮಿಯಂನ ಸಣ್ಣ ಪಾಲು ನೀವು ಕೊಡುತ್ತೀರಿ; ಉಳಿದದ್ದನ್ನು ಸರ್ಕಾರ ಭರಿಸುತ್ತದೆ.",
      hi: "अधिसूचित फसलों के नुकसान का मुआवज़ा। प्रीमियम का छोटा हिस्सा आप देते हैं; बाकी सरकार देती है।",
    }),
    criteria: [
      occupationIs("farmer", ["farmer"], {
        en: "You grow crops (as owner, tenant or sharecropper)",
        kn: "ನೀವು ಬೆಳೆ ಬೆಳೆಯುತ್ತೀರಿ (ಮಾಲೀಕ, ಗೇಣಿದಾರ ಅಥವಾ ಪಾಲುದಾರರಾಗಿ)",
        hi: "आप फसल उगाते हैं (मालिक, किराएदार या बटाईदार के रूप में)",
      }),
    ],
    documents: ["aadhaar", "land_records", "bank_account"],
    howToApply: [
      {
        en: "Before the season's cut-off date, apply through your bank, a Common Service Centre (CSC), the insurance company or the PMFBY portal / Crop Insurance app.",
        kn: "ಹಂಗಾಮಿನ ಕೊನೆಯ ದಿನಾಂಕದ ಮೊದಲು ನಿಮ್ಮ ಬ್ಯಾಂಕ್, ಸಾಮಾನ್ಯ ಸೇವಾ ಕೇಂದ್ರ (CSC), ವಿಮಾ ಕಂಪನಿ ಅಥವಾ PMFBY ಪೋರ್ಟಲ್ / ಕ್ರಾಪ್ ಇನ್ಶೂರೆನ್ಸ್ ಆ್ಯಪ್ ಮೂಲಕ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.",
        hi: "मौसम की अंतिम तिथि से पहले अपने बैंक, कॉमन सर्विस सेंटर (CSC), बीमा कंपनी या PMFBY पोर्टल / क्रॉप इंश्योरेंस ऐप से आवेदन करें।",
      },
      {
        en: "Tenants and sharecroppers: bring your tenancy or sharecropping agreement. Report crop loss quickly through the app or helpline.",
        kn: "ಗೇಣಿದಾರರು ಮತ್ತು ಪಾಲುದಾರರು: ಗೇಣಿ ಅಥವಾ ಪಾಲು ಒಪ್ಪಂದ ತನ್ನಿ. ಬೆಳೆ ನಷ್ಟವನ್ನು ಆ್ಯಪ್ ಅಥವಾ ಸಹಾಯವಾಣಿ ಮೂಲಕ ಬೇಗ ತಿಳಿಸಿ.",
        hi: "किराएदार और बटाईदार: किराया या बटाई का समझौता लाएँ। फसल नुकसान की सूचना ऐप या हेल्पलाइन पर जल्दी दें।",
      },
    ],
    applyUrl: "https://pmfby.gov.in/",
    portalName: { en: "PMFBY portal", kn: "PMFBY ಪೋರ್ಟಲ್", hi: "PMFBY पोर्टल" },
    sources: [{ label: "pmfby.gov.in", url: "https://pmfby.gov.in/" }],
    trust: "partially_verified",
    lastReviewed: REVIEWED,
    deadline: null,
    notes: {
      en: "Only crops and areas notified by your state for the season are covered, and enrolment windows are short. Ask your bank or agriculture office for this season's dates.",
      kn: "ಆ ಹಂಗಾಮಿಗೆ ನಿಮ್ಮ ರಾಜ್ಯ ಅಧಿಸೂಚಿಸಿದ ಬೆಳೆ ಮತ್ತು ಪ್ರದೇಶಗಳಿಗೆ ಮಾತ್ರ ವಿಮೆ, ನೋಂದಣಿ ಅವಧಿ ಕಡಿಮೆ. ಈ ಹಂಗಾಮಿನ ದಿನಾಂಕಗಳಿಗಾಗಿ ಬ್ಯಾಂಕ್ ಅಥವಾ ಕೃಷಿ ಕಚೇರಿಯಲ್ಲಿ ಕೇಳಿ.",
      hi: "केवल आपके राज्य द्वारा उस मौसम के लिए अधिसूचित फसलें और क्षेत्र कवर होते हैं, और नामांकन की अवधि छोटी होती है। इस मौसम की तारीखें बैंक या कृषि कार्यालय से पूछें।",
    },
  },

  // ------------------------------ Business ------------------------------
  {
    slug: "pmegp",
    name: {
      en: "PMEGP (Prime Minister's Employment Generation Programme)",
      kn: "ಪಿಎಂಇಜಿಪಿ (ಪ್ರಧಾನ ಮಂತ್ರಿ ಉದ್ಯೋಗ ಸೃಷ್ಟಿ ಕಾರ್ಯಕ್ರಮ)",
      hi: "पीएमईजीपी (प्रधानमंत्री रोज़गार सृजन कार्यक्रम)",
    },
    department: { en: "KVIC, Ministry of MSME, Government of India", kn: "ಕೆವಿಐಸಿ, ಎಂಎಸ್‌ಎಂಇ ಸಚಿವಾಲಯ, ಭಾರತ ಸರ್ಕಾರ", hi: "केवीआईसी, एमएसएमई मंत्रालय, भारत सरकार" },
    level: "central",
    summary: {
      en: "A bank loan with a government subsidy (margin money) to start a new small business or factory unit.",
      kn: "ಹೊಸ ಸಣ್ಣ ವ್ಯವಹಾರ ಅಥವಾ ಘಟಕ ಆರಂಭಿಸಲು ಸರ್ಕಾರಿ ಸಬ್ಸಿಡಿ (ಮಾರ್ಜಿನ್ ಮನಿ) ಸಹಿತ ಬ್ಯಾಂಕ್ ಸಾಲ.",
      hi: "नया छोटा व्यवसाय या इकाई शुरू करने के लिए सरकारी सब्सिडी (मार्जिन मनी) के साथ बैंक ऋण।",
    },
    benefit: seeportal({
      en: "Part of the project cost is given as a subsidy; the rest is a bank loan.",
      kn: "ಯೋಜನಾ ವೆಚ್ಚದ ಒಂದು ಭಾಗ ಸಬ್ಸಿಡಿ; ಉಳಿದದ್ದು ಬ್ಯಾಂಕ್ ಸಾಲ.",
      hi: "परियोजना लागत का एक हिस्सा सब्सिडी; बाक़ी बैंक ऋण।",
    }),
    criteria: [adult, businessOwner, newBusiness],
    documents: ["aadhaar", "business_plan", "bank_account"],
    howToApply: [
      {
        en: "Prepare a project report for your new unit.",
        kn: "ನಿಮ್ಮ ಹೊಸ ಘಟಕಕ್ಕೆ ಯೋಜನಾ ವರದಿ ಸಿದ್ಧಪಡಿಸಿ.",
        hi: "अपनी नई इकाई के लिए प्रोजेक्ट रिपोर्ट तैयार करें।",
      },
      {
        en: "Apply online on the KVIC PMEGP portal. Your application goes to a bank.",
        kn: "KVIC PMEGP ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಆನ್‌ಲೈನ್ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ. ಅರ್ಜಿ ಬ್ಯಾಂಕ್‌ಗೆ ಹೋಗುತ್ತದೆ.",
        hi: "KVIC PMEGP पोर्टल पर ऑनलाइन आवेदन करें। आवेदन बैंक को जाता है।",
      },
      {
        en: "Complete the entrepreneurship training if asked, then the bank releases the loan.",
        kn: "ಕೇಳಿದರೆ ಉದ್ಯಮಶೀಲತಾ ತರಬೇತಿ ಪೂರ್ಣಗೊಳಿಸಿ, ನಂತರ ಬ್ಯಾಂಕ್ ಸಾಲ ಬಿಡುಗಡೆ ಮಾಡುತ್ತದೆ.",
        hi: "माँगे जाने पर उद्यमिता प्रशिक्षण पूरा करें, फिर बैंक ऋण जारी करता है।",
      },
    ],
    applyUrl: "https://www.kviconline.gov.in/pmegpeportal/",
    portalName: { en: "KVIC PMEGP portal", kn: "KVIC PMEGP ಪೋರ್ಟಲ್", hi: "KVIC PMEGP पोर्टल" },
    sources: [{ label: "kviconline.gov.in", url: "https://www.kviconline.gov.in/pmegpeportal/" }],
    trust: "partially_verified",
    lastReviewed: REVIEWED,
    deadline: null,
    notes: {
      en: "Only for new units. Class 8 pass is needed for larger projects. Only one person per family. Project cost limits change — check the portal.",
      kn: "ಹೊಸ ಘಟಕಗಳಿಗೆ ಮಾತ್ರ. ದೊಡ್ಡ ಯೋಜನೆಗಳಿಗೆ 8ನೇ ತರಗತಿ ಉತ್ತೀರ್ಣ ಬೇಕು. ಕುಟುಂಬಕ್ಕೆ ಒಬ್ಬರಿಗೆ ಮಾತ್ರ. ಯೋಜನಾ ವೆಚ್ಚದ ಮಿತಿ ಬದಲಾಗುತ್ತದೆ — ಪೋರ್ಟಲ್ ನೋಡಿ.",
      hi: "केवल नई इकाइयों के लिए। बड़ी परियोजनाओं के लिए कक्षा 8 पास ज़रूरी। परिवार में एक ही व्यक्ति। लागत सीमा बदलती है — पोर्टल देखें।",
    },
  },
  {
    slug: "pm-mudra-yojana",
    name: { en: "PM MUDRA Yojana (business loans)", kn: "ಪಿಎಂ ಮುದ್ರಾ ಯೋಜನೆ (ವ್ಯವಹಾರ ಸಾಲ)", hi: "पीएम मुद्रा योजना (व्यवसाय ऋण)" },
    department: { en: "Ministry of Finance, through banks, NBFCs and MFIs", kn: "ಹಣಕಾಸು ಸಚಿವಾಲಯ, ಬ್ಯಾಂಕ್/NBFC/MFI ಮೂಲಕ", hi: "वित्त मंत्रालय, बैंकों/NBFC/MFI के माध्यम से" },
    level: "central",
    summary: {
      en: "Collateral-free loans for small non-farm businesses: shops, services, small manufacturing and trading.",
      kn: "ಕೃಷಿಯೇತರ ಸಣ್ಣ ವ್ಯವಹಾರಗಳಿಗೆ — ಅಂಗಡಿ, ಸೇವೆ, ಸಣ್ಣ ಉತ್ಪಾದನೆ ಮತ್ತು ವ್ಯಾಪಾರ — ಭದ್ರತೆ ಇಲ್ಲದ ಸಾಲ.",
      hi: "छोटे गैर-कृषि व्यवसायों — दुकान, सेवा, छोटा निर्माण और व्यापार — के लिए बिना गारंटी ऋण।",
    },
    benefit: seeportal({
      en: "Loans in three categories (Shishu, Kishore, Tarun) without collateral.",
      kn: "ಮೂರು ವರ್ಗಗಳಲ್ಲಿ (ಶಿಶು, ಕಿಶೋರ, ತರುಣ) ಭದ್ರತೆ ಇಲ್ಲದ ಸಾಲ.",
      hi: "तीन श्रेणियों (शिशु, किशोर, तरुण) में बिना गारंटी ऋण।",
    }),
    criteria: [
      occupationIs("small_business_or_artisan", ["business_owner", "artisan"], {
        en: "Running or starting a small non-farm business",
        kn: "ಸಣ್ಣ ಕೃಷಿಯೇತರ ವ್ಯವಹಾರ ನಡೆಸುತ್ತಿದ್ದೀರಿ ಅಥವಾ ಆರಂಭಿಸುತ್ತಿದ್ದೀರಿ",
        hi: "छोटा गैर-कृषि व्यवसाय चला रहे हैं या शुरू कर रहे हैं",
      }),
    ],
    documents: ["aadhaar", "business_plan", "bank_account"],
    howToApply: [
      {
        en: "Visit a bank, NBFC or microfinance institution with your business plan and KYC documents.",
        kn: "ವ್ಯವಹಾರ ಯೋಜನೆ ಮತ್ತು KYC ದಾಖಲೆಗಳೊಂದಿಗೆ ಬ್ಯಾಂಕ್, NBFC ಅಥವಾ ಕಿರುಹಣಕಾಸು ಸಂಸ್ಥೆಗೆ ಭೇಟಿ ನೀಡಿ.",
        hi: "व्यवसाय योजना और KYC दस्तावेज़ों के साथ बैंक, NBFC या माइक्रोफ़ाइनेंस संस्था में जाएँ।",
      },
      {
        en: "Ask for a MUDRA loan in the right category for the amount you need.",
        kn: "ನಿಮಗೆ ಬೇಕಾದ ಮೊತ್ತಕ್ಕೆ ಸರಿಯಾದ ವರ್ಗದ ಮುದ್ರಾ ಸಾಲ ಕೇಳಿ.",
        hi: "ज़रूरी राशि के हिसाब से सही श्रेणी का मुद्रा ऋण माँगें।",
      },
    ],
    applyUrl: "https://www.mudra.org.in/",
    portalName: { en: "MUDRA website", kn: "ಮುದ್ರಾ ವೆಬ್‌ಸೈಟ್", hi: "मुद्रा वेबसाइट" },
    sources: [{ label: "mudra.org.in", url: "https://www.mudra.org.in/" }],
    trust: "partially_verified",
    lastReviewed: REVIEWED,
    deadline: null,
  },
  {
    slug: "stand-up-india",
    name: { en: "Stand-Up India", kn: "ಸ್ಟ್ಯಾಂಡ್-ಅಪ್ ಇಂಡಿಯಾ", hi: "स्टैंड-अप इंडिया" },
    department: { en: "Department of Financial Services, through banks (SIDBI)", kn: "ಹಣಕಾಸು ಸೇವೆಗಳ ಇಲಾಖೆ, ಬ್ಯಾಂಕ್‌ಗಳ ಮೂಲಕ (SIDBI)", hi: "वित्तीय सेवा विभाग, बैंकों के माध्यम से (SIDBI)" },
    level: "central",
    summary: {
      en: "Bank loans for SC/ST and women entrepreneurs starting their first business.",
      kn: "ಮೊದಲ ವ್ಯವಹಾರ ಆರಂಭಿಸುವ SC/ST ಮತ್ತು ಮಹಿಳಾ ಉದ್ಯಮಿಗಳಿಗೆ ಬ್ಯಾಂಕ್ ಸಾಲ.",
      hi: "पहला व्यवसाय शुरू करने वाले SC/ST और महिला उद्यमियों के लिए बैंक ऋण।",
    },
    benefit: seeportal({
      en: "A composite loan (term loan plus working capital) for a new enterprise.",
      kn: "ಹೊಸ ಉದ್ಯಮಕ್ಕೆ ಸಂಯುಕ್ತ ಸಾಲ (ಅವಧಿ ಸಾಲ ಮತ್ತು ದುಡಿಯುವ ಬಂಡವಾಳ).",
      hi: "नए उद्यम के लिए संयुक्त ऋण (टर्म लोन और कार्यशील पूंजी)।",
    }),
    criteria: [
      adult,
      businessOwner,
      newBusiness,
      {
        id: "sc_st_or_woman",
        rule: {
          kind: "anyOf",
          rules: [
            { kind: "in", field: "category", values: ["sc", "st"] },
            { kind: "equals", field: "gender", value: "female" },
          ],
        },
        label: { en: "SC/ST or a woman", kn: "SC/ST ಅಥವಾ ಮಹಿಳೆ", hi: "SC/ST या महिला" },
      },
    ],
    documents: ["aadhaar", "caste_certificate", "business_plan", "bank_account"],
    howToApply: [
      {
        en: "Register on the Stand-Up Mitra portal or visit a bank branch.",
        kn: "ಸ್ಟ್ಯಾಂಡ್-ಅಪ್ ಮಿತ್ರ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ನೋಂದಾಯಿಸಿ ಅಥವಾ ಬ್ಯಾಂಕ್ ಶಾಖೆಗೆ ಭೇಟಿ ನೀಡಿ.",
        hi: "स्टैंड-अप मित्र पोर्टल पर पंजीकरण करें या बैंक शाखा जाएँ।",
      },
      {
        en: "Submit your project report. The bank appraises and sanctions the loan.",
        kn: "ಯೋಜನಾ ವರದಿ ಸಲ್ಲಿಸಿ. ಬ್ಯಾಂಕ್ ಪರಿಶೀಲಿಸಿ ಸಾಲ ಮಂಜೂರು ಮಾಡುತ್ತದೆ.",
        hi: "प्रोजेक्ट रिपोर्ट जमा करें। बैंक जाँच कर ऋण स्वीकृत करता है।",
      },
    ],
    applyUrl: "https://www.standupmitra.in/",
    portalName: { en: "Stand-Up Mitra portal", kn: "ಸ್ಟ್ಯಾಂಡ್-ಅಪ್ ಮಿತ್ರ ಪೋರ್ಟಲ್", hi: "स्टैंड-अप मित्र पोर्टल" },
    sources: [{ label: "standupmitra.in", url: "https://www.standupmitra.in/" }],
    trust: "needs_review",
    lastReviewed: REVIEWED,
    deadline: null,
    notes: {
      en: "We could not confirm that this scheme is still accepting applications after 2025. Please check with the portal or your bank first.",
      kn: "2025ರ ನಂತರ ಈ ಯೋಜನೆ ಅರ್ಜಿ ಸ್ವೀಕರಿಸುತ್ತಿದೆಯೇ ಎಂದು ನಾವು ಖಚಿತಪಡಿಸಲಾಗಲಿಲ್ಲ. ಮೊದಲು ಪೋರ್ಟಲ್ ಅಥವಾ ಬ್ಯಾಂಕ್‌ನಲ್ಲಿ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.",
      hi: "हम पुष्टि नहीं कर सके कि 2025 के बाद यह योजना आवेदन ले रही है। पहले पोर्टल या बैंक से पता करें।",
    },
  },
  {
    slug: "pm-vishwakarma",
    name: { en: "PM Vishwakarma", kn: "ಪಿಎಂ ವಿಶ್ವಕರ್ಮ", hi: "पीएम विश्वकर्मा" },
    department: { en: "Ministry of MSME, Government of India", kn: "ಎಂಎಸ್‌ಎಂಇ ಸಚಿವಾಲಯ, ಭಾರತ ಸರ್ಕಾರ", hi: "एमएसएमई मंत्रालय, भारत सरकार" },
    level: "central",
    summary: {
      en: "Recognition, skill training, toolkit support and easy credit for traditional artisans and craftspeople.",
      kn: "ಸಾಂಪ್ರದಾಯಿಕ ಕುಶಲಕರ್ಮಿಗಳಿಗೆ ಮಾನ್ಯತೆ, ಕೌಶಲ ತರಬೇತಿ, ಉಪಕರಣ ಸಹಾಯ ಮತ್ತು ಸುಲಭ ಸಾಲ.",
      hi: "पारंपरिक कारीगरों और शिल्पकारों के लिए पहचान, कौशल प्रशिक्षण, औज़ार सहायता और आसान ऋण।",
    },
    benefit: seeportal({
      en: "PM Vishwakarma certificate and ID, training with a stipend, toolkit help and collateral-free loans.",
      kn: "ಪಿಎಂ ವಿಶ್ವಕರ್ಮ ಪ್ರಮಾಣಪತ್ರ ಮತ್ತು ಗುರುತಿನ ಚೀಟಿ, ಭತ್ಯೆಯೊಂದಿಗೆ ತರಬೇತಿ, ಉಪಕರಣ ಸಹಾಯ ಮತ್ತು ಭದ್ರತೆ ಇಲ್ಲದ ಸಾಲ.",
      hi: "पीएम विश्वकर्मा प्रमाणपत्र और पहचान पत्र, भत्ते के साथ प्रशिक्षण, औज़ार सहायता और बिना गारंटी ऋण।",
    }),
    criteria: [
      occupationIs("artisan", ["artisan"], {
        en: "Traditional artisan or craftsperson (e.g. carpenter, tailor, potter, blacksmith, barber)",
        kn: "ಸಾಂಪ್ರದಾಯಿಕ ಕುಶಲಕರ್ಮಿ (ಉದಾ: ಬಡಗಿ, ದರ್ಜಿ, ಕುಂಬಾರ, ಕಮ್ಮಾರ, ಕ್ಷೌರಿಕ)",
        hi: "पारंपरिक कारीगर (जैसे बढ़ई, दर्ज़ी, कुम्हार, लोहार, नाई)",
      }),
      adult,
      noGovtJobInFamily,
    ],
    documents: ["aadhaar", "ration_card", "bank_account"],
    howToApply: [
      {
        en: "Register at a Common Service Centre (CSC) with Aadhaar and mobile-based verification.",
        kn: "ಆಧಾರ್ ಮತ್ತು ಮೊಬೈಲ್ ಪರಿಶೀಲನೆಯೊಂದಿಗೆ ಸಾಮಾನ್ಯ ಸೇವಾ ಕೇಂದ್ರದಲ್ಲಿ (CSC) ನೋಂದಾಯಿಸಿ.",
        hi: "आधार और मोबाइल सत्यापन के साथ कॉमन सर्विस सेंटर (CSC) पर पंजीकरण करें।",
      },
      {
        en: "Your application is verified at the Gram Panchayat / urban body and district level.",
        kn: "ನಿಮ್ಮ ಅರ್ಜಿಯನ್ನು ಗ್ರಾಮ ಪಂಚಾಯತ್ / ನಗರ ಸಂಸ್ಥೆ ಮತ್ತು ಜಿಲ್ಲಾ ಮಟ್ಟದಲ್ಲಿ ಪರಿಶೀಲಿಸಲಾಗುತ್ತದೆ.",
        hi: "आवेदन की जाँच ग्राम पंचायत / शहरी निकाय और ज़िला स्तर पर होती है।",
      },
    ],
    applyUrl: "https://pmvishwakarma.gov.in/",
    portalName: { en: "PM Vishwakarma portal", kn: "ಪಿಎಂ ವಿಶ್ವಕರ್ಮ ಪೋರ್ಟಲ್", hi: "पीएम विश्वकर्मा पोर्टल" },
    sources: [{ label: "pmvishwakarma.gov.in", url: "https://pmvishwakarma.gov.in/" }],
    trust: "partially_verified",
    lastReviewed: REVIEWED,
    deadline: null,
    notes: {
      en: "Covers 18 listed traditional trades — check yours on the portal. One member per family. Not for those who took a similar loan (PMEGP, PM SVANidhi, MUDRA) in the last 5 years unless repaid.",
      kn: "ಪಟ್ಟಿ ಮಾಡಿದ 18 ಸಾಂಪ್ರದಾಯಿಕ ಕಸುಬುಗಳು — ನಿಮ್ಮದನ್ನು ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ನೋಡಿ. ಕುಟುಂಬಕ್ಕೆ ಒಬ್ಬರು. ಕಳೆದ 5 ವರ್ಷದಲ್ಲಿ ಇದೇ ರೀತಿಯ ಸಾಲ (PMEGP, PM SVANidhi, ಮುದ್ರಾ) ಪಡೆದು ಮರುಪಾವತಿ ಮಾಡದವರಿಗೆ ಇಲ್ಲ.",
      hi: "18 सूचीबद्ध पारंपरिक व्यवसाय — अपना पोर्टल पर देखें। परिवार में एक सदस्य। पिछले 5 साल में ऐसा ऋण (PMEGP, PM SVANidhi, मुद्रा) लिया हो और चुकाया न हो तो नहीं।",
    },
  },

  // ------------------------------ Workers & pensions ------------------------------
  {
    slug: "pm-shram-yogi-maandhan",
    name: { en: "PM Shram Yogi Maan-dhan (pension for unorganised workers)", kn: "ಪಿಎಂ ಶ್ರಮ ಯೋಗಿ ಮಾನ್-ಧನ್ (ಅಸಂಘಟಿತ ಕಾರ್ಮಿಕರ ಪಿಂಚಣಿ)", hi: "पीएम श्रम योगी मान-धन (असंगठित कामगारों की पेंशन)" },
    department: { en: "Ministry of Labour & Employment, Government of India", kn: "ಕಾರ್ಮಿಕ ಮತ್ತು ಉದ್ಯೋಗ ಸಚಿವಾಲಯ, ಭಾರತ ಸರ್ಕಾರ", hi: "श्रम एवं रोज़गार मंत्रालय, भारत सरकार" },
    level: "central",
    summary: {
      en: "A monthly pension after age 60 for low-income unorganised workers. The government matches your contribution.",
      kn: "ಕಡಿಮೆ ಆದಾಯದ ಅಸಂಘಟಿತ ಕಾರ್ಮಿಕರಿಗೆ 60 ವರ್ಷದ ನಂತರ ಮಾಸಿಕ ಪಿಂಚಣಿ. ನಿಮ್ಮ ಕೊಡುಗೆಯಷ್ಟೇ ಸರ್ಕಾರವೂ ನೀಡುತ್ತದೆ.",
      hi: "कम आय वाले असंगठित कामगारों के लिए 60 वर्ष के बाद मासिक पेंशन। सरकार आपके योगदान के बराबर जोड़ती है।",
    },
    benefit: seeportal({
      en: "An assured monthly pension from age 60. Your contribution depends on your joining age.",
      kn: "60 ವರ್ಷದಿಂದ ಖಚಿತ ಮಾಸಿಕ ಪಿಂಚಣಿ. ನಿಮ್ಮ ಕೊಡುಗೆ ಸೇರುವ ವಯಸ್ಸಿನ ಮೇಲೆ ಅವಲಂಬಿತ.",
      hi: "60 वर्ष से निश्चित मासिक पेंशन। आपका योगदान जुड़ने की उम्र पर निर्भर है।",
    }),
    criteria: [
      occupationIs("unorganised_worker", ["unorganised_worker", "farm_labourer", "artisan"], {
        en: "Unorganised worker (e.g. daily-wage, construction, domestic, farm labour, street vendor)",
        kn: "ಅಸಂಘಟಿತ ಕಾರ್ಮಿಕ (ಉದಾ: ದಿನಗೂಲಿ, ಕಟ್ಟಡ, ಮನೆಗೆಲಸ, ಕೃಷಿ ಕೂಲಿ, ಬೀದಿ ವ್ಯಾಪಾರಿ)",
        hi: "असंगठित कामगार (जैसे दिहाड़ी, निर्माण, घरेलू, खेत मज़दूर, रेहड़ी-पटरी)",
      }),
      age("age_18_40", 18, 40, { en: "Age 18 to 40", kn: "ವಯಸ್ಸು 18 ರಿಂದ 40", hi: "आयु 18 से 40" }),
      {
        id: "own_income_15k",
        rule: { kind: "equals", field: "ownIncomeUpTo15kMonth", value: true },
        label: { en: "Your own monthly income is ₹15,000 or less", kn: "ನಿಮ್ಮ ಸ್ವಂತ ಮಾಸಿಕ ಆದಾಯ ₹15,000 ಅಥವಾ ಕಡಿಮೆ", hi: "आपकी अपनी मासिक आय ₹15,000 या कम" },
      },
      {
        id: "not_epf_esic_nps",
        rule: { kind: "equals", field: "coveredByEpfEsiNps", value: false },
        label: { en: "Not covered by EPF, ESIC or government NPS", kn: "EPF, ESIC ಅಥವಾ ಸರ್ಕಾರಿ NPS ಅಡಿಯಲ್ಲಿ ಇಲ್ಲ", hi: "EPF, ESIC या सरकारी NPS में शामिल नहीं" },
      },
      notIncomeTaxPayer,
    ],
    documents: [...bankDocs],
    howToApply: [
      {
        en: "Visit a Common Service Centre (CSC) with Aadhaar and your savings account details, or self-enrol on the Maandhan portal.",
        kn: "ಆಧಾರ್ ಮತ್ತು ಉಳಿತಾಯ ಖಾತೆ ವಿವರದೊಂದಿಗೆ ಸಾಮಾನ್ಯ ಸೇವಾ ಕೇಂದ್ರಕ್ಕೆ ಭೇಟಿ ನೀಡಿ, ಅಥವಾ ಮಾನ್‌ಧನ್ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ನೀವೇ ನೋಂದಾಯಿಸಿ.",
        hi: "आधार और बचत खाते के विवरण के साथ CSC जाएँ, या मानधन पोर्टल पर स्वयं पंजीकरण करें।",
      },
      {
        en: "Pay the first contribution; later contributions are auto-debited monthly.",
        kn: "ಮೊದಲ ಕೊಡುಗೆ ಪಾವತಿಸಿ; ನಂತರದ ಕೊಡುಗೆಗಳು ಪ್ರತಿ ತಿಂಗಳು ಸ್ವಯಂ ಕಡಿತವಾಗುತ್ತವೆ.",
        hi: "पहला योगदान दें; बाद के योगदान हर महीने अपने आप कटते हैं।",
      },
    ],
    applyUrl: "https://maandhan.in/",
    portalName: { en: "Maandhan portal", kn: "ಮಾನ್‌ಧನ್ ಪೋರ್ಟಲ್", hi: "मानधन पोर्टल" },
    sources: [{ label: "maandhan.in", url: "https://maandhan.in/" }],
    trust: "partially_verified",
    lastReviewed: REVIEWED,
    deadline: null,
  },
  {
    slug: "atal-pension-yojana",
    name: { en: "Atal Pension Yojana (APY)", kn: "ಅಟಲ್ ಪಿಂಚಣಿ ಯೋಜನೆ (APY)", hi: "अटल पेंशन योजना (APY)" },
    department: { en: "PFRDA, Ministry of Finance, Government of India", kn: "PFRDA, ಹಣಕಾಸು ಸಚಿವಾಲಯ, ಭಾರತ ಸರ್ಕಾರ", hi: "PFRDA, वित्त मंत्रालय, भारत सरकार" },
    level: "central",
    summary: {
      en: "A guaranteed monthly pension after age 60 for people who join between 18 and 40 and do not pay income tax.",
      kn: "18–40 ವಯಸ್ಸಿನಲ್ಲಿ ಸೇರುವ, ಆದಾಯ ತೆರಿಗೆ ಪಾವತಿಸದವರಿಗೆ 60 ವರ್ಷದ ನಂತರ ಖಚಿತ ಮಾಸಿಕ ಪಿಂಚಣಿ.",
      hi: "18–40 की उम्र में जुड़ने वाले, आयकर न भरने वालों के लिए 60 वर्ष के बाद गारंटीड मासिक पेंशन।",
    },
    benefit: seeportal({
      en: "You choose a pension level; your monthly contribution depends on it and your joining age.",
      kn: "ನೀವು ಪಿಂಚಣಿ ಮಟ್ಟ ಆಯ್ಕೆಮಾಡುತ್ತೀರಿ; ನಿಮ್ಮ ಮಾಸಿಕ ಕೊಡುಗೆ ಅದರ ಮತ್ತು ಸೇರುವ ವಯಸ್ಸಿನ ಮೇಲೆ ಅವಲಂಬಿತ.",
      hi: "आप पेंशन स्तर चुनते हैं; मासिक योगदान उस पर और जुड़ने की उम्र पर निर्भर है।",
    }),
    criteria: [
      age("age_18_40", 18, 40, { en: "Age 18 to 40", kn: "ವಯಸ್ಸು 18 ರಿಂದ 40", hi: "आयु 18 से 40" }),
      notIncomeTaxPayer,
    ],
    documents: [...bankDocs],
    howToApply: [
      {
        en: "Ask your bank or post office (where you have a savings account) to enrol you in APY.",
        kn: "ಉಳಿತಾಯ ಖಾತೆ ಇರುವ ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಅಥವಾ ಅಂಚೆ ಕಚೇರಿಯಲ್ಲಿ APYಗೆ ಸೇರಿಸಲು ಕೇಳಿ.",
        hi: "जिस बैंक या डाकघर में बचत खाता है, वहाँ APY में नामांकन के लिए कहें।",
      },
      {
        en: "Choose your pension amount. The contribution is auto-debited.",
        kn: "ನಿಮ್ಮ ಪಿಂಚಣಿ ಮೊತ್ತ ಆಯ್ಕೆಮಾಡಿ. ಕೊಡುಗೆ ಸ್ವಯಂ ಕಡಿತವಾಗುತ್ತದೆ.",
        hi: "पेंशन राशि चुनें। योगदान अपने आप कटता है।",
      },
    ],
    applyUrl: "https://www.myscheme.gov.in/schemes/apy",
    portalName: { en: "your bank or post office", kn: "ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಅಥವಾ ಅಂಚೆ ಕಚೇರಿ", hi: "आपका बैंक या डाकघर" },
    sources: [{ label: "myscheme.gov.in/schemes/apy", url: "https://www.myscheme.gov.in/schemes/apy" }],
    trust: "partially_verified",
    lastReviewed: REVIEWED,
    deadline: null,
    notes: {
      en: "Since 1 October 2022, anyone who is or has been an income tax payer cannot join.",
      kn: "1 ಅಕ್ಟೋಬರ್ 2022ರಿಂದ, ಆದಾಯ ತೆರಿಗೆ ಪಾವತಿಸುತ್ತಿರುವ ಅಥವಾ ಪಾವತಿಸಿದ್ದ ಯಾರೂ ಸೇರುವಂತಿಲ್ಲ.",
      hi: "1 अक्टूबर 2022 से, जो आयकर भरता है या भर चुका है, वह नहीं जुड़ सकता।",
    },
  },
  {
    slug: "pmjjby",
    name: { en: "PM Jeevan Jyoti Bima Yojana (life insurance)", kn: "ಪಿಎಂ ಜೀವನ ಜ್ಯೋತಿ ಬಿಮಾ ಯೋಜನೆ (ಜೀವ ವಿಮೆ)", hi: "पीएम जीवन ज्योति बीमा योजना (जीवन बीमा)" },
    department: { en: "Department of Financial Services, through banks", kn: "ಹಣಕಾಸು ಸೇವೆಗಳ ಇಲಾಖೆ, ಬ್ಯಾಂಕ್‌ಗಳ ಮೂಲಕ", hi: "वित्तीय सेवा विभाग, बैंकों के माध्यम से" },
    level: "central",
    summary: {
      en: "Low-cost yearly life insurance for bank account holders aged 18 to 50.",
      kn: "18–50 ವಯಸ್ಸಿನ ಬ್ಯಾಂಕ್ ಖಾತೆದಾರರಿಗೆ ಕಡಿಮೆ ವೆಚ್ಚದ ವಾರ್ಷಿಕ ಜೀವ ವಿಮೆ.",
      hi: "18–50 वर्ष के बैंक खाताधारकों के लिए कम लागत वाला सालाना जीवन बीमा।",
    },
    benefit: seeportal({
      en: "Life cover for death from any cause, renewed every year by auto-debit.",
      kn: "ಯಾವುದೇ ಕಾರಣದ ಮರಣಕ್ಕೆ ಜೀವ ವಿಮೆ, ಪ್ರತಿ ವರ್ಷ ಸ್ವಯಂ ಕಡಿತದಿಂದ ನವೀಕರಣ.",
      hi: "किसी भी कारण से मृत्यु पर बीमा, हर साल ऑटो-डेबिट से नवीनीकरण।",
    }),
    criteria: [age("age_18_50", 18, 50, { en: "Age 18 to 50", kn: "ವಯಸ್ಸು 18 ರಿಂದ 50", hi: "आयु 18 से 50" })],
    documents: [...bankDocs],
    howToApply: [
      {
        en: "Ask your bank to enrol you, or use your bank's app / net banking. The premium is auto-debited each year.",
        kn: "ನಿಮ್ಮ ಬ್ಯಾಂಕ್‌ನಲ್ಲಿ ಸೇರಿಸಲು ಕೇಳಿ, ಅಥವಾ ಬ್ಯಾಂಕ್ ಆ್ಯಪ್ / ನೆಟ್ ಬ್ಯಾಂಕಿಂಗ್ ಬಳಸಿ. ಪ್ರೀಮಿಯಂ ಪ್ರತಿ ವರ್ಷ ಸ್ವಯಂ ಕಡಿತ.",
        hi: "बैंक से नामांकन कराएँ, या बैंक ऐप / नेट बैंकिंग से जुड़ें। प्रीमियम हर साल अपने आप कटता है।",
      },
    ],
    applyUrl: "https://www.jansuraksha.gov.in/",
    portalName: { en: "Jan Suraksha portal", kn: "ಜನ ಸುರಕ್ಷಾ ಪೋರ್ಟಲ್", hi: "जन सुरक्षा पोर्टल" },
    sources: [{ label: "jansuraksha.gov.in", url: "https://www.jansuraksha.gov.in/" }],
    trust: "partially_verified",
    lastReviewed: REVIEWED,
    deadline: null,
  },
  {
    slug: "pmsby",
    name: { en: "PM Suraksha Bima Yojana (accident insurance)", kn: "ಪಿಎಂ ಸುರಕ್ಷಾ ಬಿಮಾ ಯೋಜನೆ (ಅಪಘಾತ ವಿಮೆ)", hi: "पीएम सुरक्षा बीमा योजना (दुर्घटना बीमा)" },
    department: { en: "Department of Financial Services, through banks", kn: "ಹಣಕಾಸು ಸೇವೆಗಳ ಇಲಾಖೆ, ಬ್ಯಾಂಕ್‌ಗಳ ಮೂಲಕ", hi: "वित्तीय सेवा विभाग, बैंकों के माध्यम से" },
    level: "central",
    summary: {
      en: "Very low-cost yearly accident insurance for bank account holders aged 18 to 70.",
      kn: "18–70 ವಯಸ್ಸಿನ ಬ್ಯಾಂಕ್ ಖಾತೆದಾರರಿಗೆ ಅತಿ ಕಡಿಮೆ ವೆಚ್ಚದ ವಾರ್ಷಿಕ ಅಪಘಾತ ವಿಮೆ.",
      hi: "18–70 वर्ष के बैंक खाताधारकों के लिए बहुत कम लागत वाला सालाना दुर्घटना बीमा।",
    },
    benefit: seeportal({
      en: "Cover for accidental death and disability, renewed every year by auto-debit.",
      kn: "ಅಪಘಾತ ಮರಣ ಮತ್ತು ಅಂಗವೈಕಲ್ಯಕ್ಕೆ ವಿಮೆ, ಪ್ರತಿ ವರ್ಷ ಸ್ವಯಂ ಕಡಿತದಿಂದ ನವೀಕರಣ.",
      hi: "दुर्घटना में मृत्यु और विकलांगता पर बीमा, हर साल ऑटो-डेबिट से नवीनीकरण।",
    }),
    criteria: [age("age_18_70", 18, 70, { en: "Age 18 to 70", kn: "ವಯಸ್ಸು 18 ರಿಂದ 70", hi: "आयु 18 से 70" })],
    documents: [...bankDocs],
    howToApply: [
      {
        en: "Ask your bank to enrol you, or use your bank's app / net banking. You can join through only one bank account.",
        kn: "ನಿಮ್ಮ ಬ್ಯಾಂಕ್‌ನಲ್ಲಿ ಸೇರಿಸಲು ಕೇಳಿ, ಅಥವಾ ಬ್ಯಾಂಕ್ ಆ್ಯಪ್ ಬಳಸಿ. ಒಂದು ಖಾತೆಯ ಮೂಲಕ ಮಾತ್ರ ಸೇರಬಹುದು.",
        hi: "बैंक से नामांकन कराएँ, या बैंक ऐप से जुड़ें। केवल एक बैंक खाते से जुड़ सकते हैं।",
      },
    ],
    applyUrl: "https://www.jansuraksha.gov.in/",
    portalName: { en: "Jan Suraksha portal", kn: "ಜನ ಸುರಕ್ಷಾ ಪೋರ್ಟಲ್", hi: "जन सुरक्षा पोर्टल" },
    sources: [{ label: "jansuraksha.gov.in", url: "https://www.jansuraksha.gov.in/" }],
    trust: "partially_verified",
    lastReviewed: REVIEWED,
    deadline: null,
  },

  {
    slug: "e-shram",
    name: { en: "e-Shram card (registration for unorganised workers)", kn: "ಇ-ಶ್ರಮ್ ಕಾರ್ಡ್ (ಅಸಂಘಟಿತ ಕಾರ್ಮಿಕರ ನೋಂದಣಿ)", hi: "ई-श्रम कार्ड (असंगठित कामगारों का पंजीकरण)" },
    department: { en: "Ministry of Labour & Employment, Government of India", kn: "ಕಾರ್ಮಿಕ ಮತ್ತು ಉದ್ಯೋಗ ಸಚಿವಾಲಯ, ಭಾರತ ಸರ್ಕಾರ", hi: "श्रम एवं रोज़गार मंत्रालय, भारत सरकार" },
    level: "central",
    summary: {
      en: "Free national registration for unorganised workers. The e-Shram card (UAN) helps you reach welfare schemes meant for workers.",
      kn: "ಅಸಂಘಟಿತ ಕಾರ್ಮಿಕರಿಗೆ ಉಚಿತ ರಾಷ್ಟ್ರೀಯ ನೋಂದಣಿ. ಇ-ಶ್ರಮ್ ಕಾರ್ಡ್ (UAN) ಕಾರ್ಮಿಕರ ಕಲ್ಯಾಣ ಯೋಜನೆಗಳನ್ನು ಪಡೆಯಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
      hi: "असंगठित कामगारों के लिए मुफ़्त राष्ट्रीय पंजीकरण। ई-श्रम कार्ड (UAN) से कामगारों की कल्याण योजनाओं तक पहुँचने में मदद मिलती है।",
    },
    benefit: seeportal({
      en: "A lifelong e-Shram card (UAN) that links you to schemes for workers.",
      kn: "ಕಾರ್ಮಿಕರ ಯೋಜನೆಗಳಿಗೆ ಜೋಡಿಸುವ ಜೀವನಪರ್ಯಂತ ಇ-ಶ್ರಮ್ ಕಾರ್ಡ್ (UAN).",
      hi: "जीवनभर का ई-श्रम कार्ड (UAN) जो आपको कामगारों की योजनाओं से जोड़ता है।",
    }),
    criteria: [
      occupationIs("unorganised_worker", ["unorganised_worker", "farm_labourer", "artisan"], {
        en: "Unorganised worker (e.g. daily-wage, construction, domestic, farm labour, street vendor, artisan)",
        kn: "ಅಸಂಘಟಿತ ಕಾರ್ಮಿಕ (ಉದಾ: ದಿನಗೂಲಿ, ಕಟ್ಟಡ, ಮನೆಗೆಲಸ, ಕೃಷಿ ಕೂಲಿ, ಬೀದಿ ವ್ಯಾಪಾರಿ, ಕುಶಲಕರ್ಮಿ)",
        hi: "असंगठित कामगार (जैसे दिहाड़ी, निर्माण, घरेलू, खेत मज़दूर, रेहड़ी-पटरी, कारीगर)",
      }),
      age("age_16_59", 16, 59, { en: "Age 16 to 59", kn: "ವಯಸ್ಸು 16 ರಿಂದ 59", hi: "आयु 16 से 59" }),
      {
        id: "not_epfo_esic",
        rule: { kind: "equals", field: "coveredByEpfEsiNps", value: false },
        label: { en: "Not a member of EPFO or ESIC", kn: "EPFO ಅಥವಾ ESIC ಸದಸ್ಯರಲ್ಲ", hi: "EPFO या ESIC के सदस्य नहीं" },
      },
      notIncomeTaxPayer,
    ],
    documents: [...bankDocs],
    howToApply: [
      {
        en: "Register free on the e-Shram portal with your Aadhaar and the mobile number linked to it, or at a Common Service Centre (CSC).",
        kn: "ಆಧಾರ್ ಮತ್ತು ಅದಕ್ಕೆ ಜೋಡಿಸಿದ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯೊಂದಿಗೆ ಇ-ಶ್ರಮ್ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಅಥವಾ ಸಾಮಾನ್ಯ ಸೇವಾ ಕೇಂದ್ರದಲ್ಲಿ (CSC) ಉಚಿತವಾಗಿ ನೋಂದಾಯಿಸಿ.",
        hi: "आधार और उससे जुड़े मोबाइल नंबर के साथ ई-श्रम पोर्टल पर या कॉमन सर्विस सेंटर (CSC) पर मुफ़्त पंजीकरण करें।",
      },
      {
        en: "Download your e-Shram card. Helpline: 14434.",
        kn: "ನಿಮ್ಮ ಇ-ಶ್ರಮ್ ಕಾರ್ಡ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ. ಸಹಾಯವಾಣಿ: 14434.",
        hi: "अपना ई-श्रम कार्ड डाउनलोड करें। हेल्पलाइन: 14434।",
      },
    ],
    applyUrl: "https://eshram.gov.in/",
    portalName: { en: "e-Shram portal", kn: "ಇ-ಶ್ರಮ್ ಪೋರ್ಟಲ್", hi: "ई-श्रम पोर्टल" },
    sources: [
      { label: "eshram.gov.in", url: "https://eshram.gov.in/" },
      { label: "eshram.gov.in/faqs", url: "https://eshram.gov.in/faqs" },
    ],
    trust: "partially_verified",
    lastReviewed: REVIEWED,
    deadline: null,
    notes: {
      en: "There is no income limit, but income tax payers cannot register. Registration is always free — never pay anyone for it.",
      kn: "ಆದಾಯ ಮಿತಿ ಇಲ್ಲ, ಆದರೆ ಆದಾಯ ತೆರಿಗೆ ಪಾವತಿದಾರರು ನೋಂದಾಯಿಸುವಂತಿಲ್ಲ. ನೋಂದಣಿ ಯಾವಾಗಲೂ ಉಚಿತ — ಯಾರಿಗೂ ಹಣ ಕೊಡಬೇಡಿ.",
      hi: "कोई आय सीमा नहीं है, लेकिन आयकर भरने वाले पंजीकरण नहीं कर सकते। पंजीकरण हमेशा मुफ़्त है — किसी को पैसे न दें।",
    },
  },

  // ------------------------------ Women ------------------------------
  {
    slug: "gruha-lakshmi",
    name: { en: "Gruha Lakshmi", kn: "ಗೃಹ ಲಕ್ಷ್ಮಿ", hi: "गृह लक्ष्मी" },
    department: {
      en: "Women & Child Development Department, Government of Karnataka",
      kn: "ಮಹಿಳಾ ಮತ್ತು ಮಕ್ಕಳ ಅಭಿವೃದ್ಧಿ ಇಲಾಖೆ, ಕರ್ನಾಟಕ ಸರ್ಕಾರ",
      hi: "महिला एवं बाल विकास विभाग, कर्नाटक सरकार",
    },
    level: "state",
    state: "ka",
    summary: {
      en: "Monthly financial support for the woman head of the family named on the ration card.",
      kn: "ಪಡಿತರ ಚೀಟಿಯಲ್ಲಿ ಹೆಸರಿರುವ ಕುಟುಂಬದ ಮಹಿಳಾ ಮುಖ್ಯಸ್ಥೆಗೆ ಮಾಸಿಕ ಆರ್ಥಿಕ ನೆರವು.",
      hi: "राशन कार्ड पर दर्ज परिवार की महिला मुखिया को मासिक आर्थिक सहायता।",
    },
    benefit: seeportal({
      en: "A fixed monthly amount paid to the woman's bank account.",
      kn: "ಮಹಿಳೆಯ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ನಿಗದಿತ ಮಾಸಿಕ ಮೊತ್ತ.",
      hi: "महिला के बैंक खाते में तय मासिक राशि।",
    }),
    criteria: [
      resident,
      woman,
      {
        id: "woman_head_of_family",
        rule: { kind: "equals", field: "womanHeadOfFamily", value: true },
        label: {
          en: "Named as the woman head of family on the ration card",
          kn: "ಪಡಿತರ ಚೀಟಿಯಲ್ಲಿ ಕುಟುಂಬದ ಮಹಿಳಾ ಮುಖ್ಯಸ್ಥೆ ಎಂದು ಹೆಸರಿದೆ",
          hi: "राशन कार्ड पर परिवार की महिला मुखिया के रूप में नाम दर्ज",
        },
      },
      noFamilyIncomeTax,
      {
        id: "no_gst_filing",
        rule: { kind: "equals", field: "familyFilesGst", value: false },
        label: { en: "Family does not file GST returns", kn: "ಕುಟುಂಬ GST ರಿಟರ್ನ್ ಸಲ್ಲಿಸುವುದಿಲ್ಲ", hi: "परिवार GST रिटर्न नहीं भरता" },
      },
    ],
    documents: ["ration_card", "aadhaar", "bank_account"],
    howToApply: [
      {
        en: "Apply on Seva Sindhu, or at a Grama One / Karnataka One / Bapuji Seva Kendra.",
        kn: "ಸೇವಾ ಸಿಂಧುವಿನಲ್ಲಿ, ಅಥವಾ ಗ್ರಾಮ ಒನ್ / ಕರ್ನಾಟಕ ಒನ್ / ಬಾಪೂಜಿ ಸೇವಾ ಕೇಂದ್ರದಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.",
        hi: "सेवा सिंधु पर, या ग्राम वन / कर्नाटक वन / बापूजी सेवा केंद्र में आवेदन करें।",
      },
      {
        en: "Make sure your bank account is linked to Aadhaar so the money reaches you.",
        kn: "ಹಣ ತಲುಪಲು ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಖಾತೆ ಆಧಾರ್‌ಗೆ ಜೋಡಣೆಯಾಗಿರಲಿ.",
        hi: "पैसा पहुँचे इसके लिए बैंक खाता आधार से जुड़ा होना चाहिए।",
      },
    ],
    applyUrl: SEVA_SINDHU,
    portalName: { en: "Seva Sindhu", kn: "ಸೇವಾ ಸಿಂಧು", hi: "सेवा सिंधु" },
    sources: [{ label: "sevasindhu.karnataka.gov.in", url: SEVA_SINDHU }],
    trust: "partially_verified",
    lastReviewed: REVIEWED,
    deadline: null,
    notes: {
      en: "Officially the exclusion applies if the woman head or her husband pays income tax or files GST. One woman per family. Beneficiary lists are re-verified from time to time.",
      kn: "ಅಧಿಕೃತವಾಗಿ, ಮಹಿಳಾ ಮುಖ್ಯಸ್ಥೆ ಅಥವಾ ಅವರ ಪತಿ ಆದಾಯ ತೆರಿಗೆ ಪಾವತಿಸಿದರೆ ಅಥವಾ GST ಸಲ್ಲಿಸಿದರೆ ಹೊರಗಿಡಲಾಗುತ್ತದೆ. ಕುಟುಂಬಕ್ಕೆ ಒಬ್ಬ ಮಹಿಳೆ. ಫಲಾನುಭವಿಗಳ ಪಟ್ಟಿಯನ್ನು ಆಗಾಗ ಮರುಪರಿಶೀಲಿಸಲಾಗುತ್ತದೆ.",
      hi: "आधिकारिक रूप से, महिला मुखिया या उनके पति आयकर भरते हैं या GST फ़ाइल करते हैं तो बाहर। परिवार में एक महिला। सूची समय-समय पर दोबारा जाँची जाती है।",
    },
  },
  {
    slug: "shakti-free-bus-travel",
    name: { en: "Shakti — free bus travel for women", kn: "ಶಕ್ತಿ — ಮಹಿಳೆಯರಿಗೆ ಉಚಿತ ಬಸ್ ಪ್ರಯಾಣ", hi: "शक्ति — महिलाओं के लिए मुफ़्त बस यात्रा" },
    department: { en: "Transport Department, Government of Karnataka", kn: "ಸಾರಿಗೆ ಇಲಾಖೆ, ಕರ್ನಾಟಕ ಸರ್ಕಾರ", hi: "परिवहन विभाग, कर्नाटक सरकार" },
    level: "state",
    state: "ka",
    summary: {
      en: "Free travel for women of Karnataka in non-premium state-run buses within the state.",
      kn: "ರಾಜ್ಯದೊಳಗೆ ಸರ್ಕಾರಿ ಸಾಮಾನ್ಯ ಬಸ್‌ಗಳಲ್ಲಿ ಕರ್ನಾಟಕದ ಮಹಿಳೆಯರಿಗೆ ಉಚಿತ ಪ್ರಯಾಣ.",
      hi: "राज्य के भीतर सरकारी सामान्य बसों में कर्नाटक की महिलाओं के लिए मुफ़्त यात्रा।",
    },
    benefit: {
      en: "Zero-fare tickets in eligible KSRTC, BMTC, KKRTC and NWKRTC buses. Premium/AC services are not covered.",
      kn: "ಅರ್ಹ KSRTC, BMTC, KKRTC ಮತ್ತು NWKRTC ಬಸ್‌ಗಳಲ್ಲಿ ಶೂನ್ಯ ದರದ ಟಿಕೆಟ್. ಪ್ರೀಮಿಯಂ/ಎಸಿ ಸೇವೆಗಳು ಸೇರಿಲ್ಲ.",
      hi: "पात्र KSRTC, BMTC, KKRTC और NWKRTC बसों में शून्य किराया टिकट। प्रीमियम/AC सेवाएँ शामिल नहीं।",
    },
    criteria: [resident, woman],
    documents: ["aadhaar"],
    howToApply: [
      {
        en: "Show an ID with a Karnataka address (e.g. Aadhaar) to the conductor to get a zero-fare ticket.",
        kn: "ಶೂನ್ಯ ದರದ ಟಿಕೆಟ್ ಪಡೆಯಲು ಕರ್ನಾಟಕ ವಿಳಾಸವಿರುವ ಗುರುತಿನ ಚೀಟಿ (ಉದಾ: ಆಧಾರ್) ನಿರ್ವಾಹಕರಿಗೆ ತೋರಿಸಿ.",
        hi: "शून्य किराया टिकट के लिए कंडक्टर को कर्नाटक पते वाला पहचान पत्र (जैसे आधार) दिखाएँ।",
      },
      {
        en: "You can also apply for a Shakti smart card on Seva Sindhu.",
        kn: "ಸೇವಾ ಸಿಂಧುವಿನಲ್ಲಿ ಶಕ್ತಿ ಸ್ಮಾರ್ಟ್ ಕಾರ್ಡ್‌ಗೂ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು.",
        hi: "सेवा सिंधु पर शक्ति स्मार्ट कार्ड के लिए भी आवेदन कर सकते हैं।",
      },
    ],
    applyUrl: SEVA_SINDHU,
    portalName: { en: "Seva Sindhu", kn: "ಸೇವಾ ಸಿಂಧು", hi: "सेवा सिंधु" },
    sources: [
      { label: "sevasindhu.karnataka.gov.in", url: SEVA_SINDHU },
      { label: "ksrtc.karnataka.gov.in", url: "https://ksrtc.karnataka.gov.in/" },
    ],
    trust: "partially_verified",
    lastReviewed: REVIEWED,
    deadline: null,
  },

  // ------------------------------ Youth ------------------------------
  {
    slug: "yuva-nidhi",
    name: { en: "Yuva Nidhi (unemployment allowance)", kn: "ಯುವ ನಿಧಿ (ನಿರುದ್ಯೋಗ ಭತ್ಯೆ)", hi: "युवा निधि (बेरोज़गारी भत्ता)" },
    department: {
      en: "Skill Development, Entrepreneurship & Livelihood Department, Government of Karnataka",
      kn: "ಕೌಶಲ್ಯಾಭಿವೃದ್ಧಿ, ಉದ್ಯಮಶೀಲತೆ ಮತ್ತು ಜೀವನೋಪಾಯ ಇಲಾಖೆ, ಕರ್ನಾಟಕ ಸರ್ಕಾರ",
      hi: "कौशल विकास, उद्यमिता एवं आजीविका विभाग, कर्नाटक सरकार",
    },
    level: "state",
    state: "ka",
    summary: {
      en: "A monthly allowance for Karnataka graduates and diploma holders who have not found a job 6 months after passing.",
      kn: "ಉತ್ತೀರ್ಣರಾಗಿ 6 ತಿಂಗಳಾದರೂ ಉದ್ಯೋಗ ಸಿಗದ ಕರ್ನಾಟಕದ ಪದವೀಧರರು ಮತ್ತು ಡಿಪ್ಲೊಮಾ ಹೊಂದಿರುವವರಿಗೆ ಮಾಸಿಕ ಭತ್ಯೆ.",
      hi: "पास होने के 6 महीने बाद भी नौकरी न पाने वाले कर्नाटक के स्नातकों और डिप्लोमा धारकों को मासिक भत्ता।",
    },
    benefit: seeportal({
      en: "A monthly allowance (different for degree and diploma holders) until you get a job, for a limited period.",
      kn: "ಉದ್ಯೋಗ ಸಿಗುವವರೆಗೆ, ಸೀಮಿತ ಅವಧಿಗೆ ಮಾಸಿಕ ಭತ್ಯೆ (ಪದವಿ ಮತ್ತು ಡಿಪ್ಲೊಮಾಗೆ ಬೇರೆ).",
      hi: "नौकरी मिलने तक, सीमित अवधि के लिए मासिक भत्ता (डिग्री और डिप्लोमा के लिए अलग)।",
    }),
    criteria: [
      resident,
      occupationIs("job_seeker", ["job_seeker"], { en: "Looking for a job", kn: "ಉದ್ಯೋಗ ಹುಡುಕುತ್ತಿದ್ದೀರಿ", hi: "नौकरी ढूँढ रहे हैं" }),
      {
        id: "unemployed_graduate",
        rule: { kind: "equals", field: "unemployedGraduate", value: true },
        label: {
          en: "Finished a degree or diploma and still without a job 6 months after passing",
          kn: "ಪದವಿ ಅಥವಾ ಡಿಪ್ಲೊಮಾ ಮುಗಿಸಿ 6 ತಿಂಗಳಾದರೂ ಉದ್ಯೋಗ ಇಲ್ಲ",
          hi: "डिग्री या डिप्लोमा पूरा किया और पास होने के 6 महीने बाद भी नौकरी नहीं",
        },
      },
    ],
    documents: ["degree_certificate", "aadhaar", "bank_account"],
    howToApply: [
      {
        en: "Register on Seva Sindhu with your degree/diploma details.",
        kn: "ಪದವಿ/ಡಿಪ್ಲೊಮಾ ವಿವರದೊಂದಿಗೆ ಸೇವಾ ಸಿಂಧುವಿನಲ್ಲಿ ನೋಂದಾಯಿಸಿ.",
        hi: "डिग्री/डिप्लोमा विवरण के साथ सेवा सिंधु पर पंजीकरण करें।",
      },
      {
        en: "Confirm every month that you are still unemployed, as asked by the department.",
        kn: "ಇಲಾಖೆ ಕೇಳಿದಂತೆ ಪ್ರತಿ ತಿಂಗಳು ನೀವು ಇನ್ನೂ ನಿರುದ್ಯೋಗಿ ಎಂದು ದೃಢಪಡಿಸಿ.",
        hi: "विभाग के कहे अनुसार हर महीने पुष्टि करें कि आप अब भी बेरोज़गार हैं।",
      },
    ],
    applyUrl: SEVA_SINDHU,
    portalName: { en: "Seva Sindhu", kn: "ಸೇವಾ ಸಿಂಧು", hi: "सेवा सिंधु" },
    sources: [{ label: "sevasindhu.karnataka.gov.in", url: SEVA_SINDHU }],
    trust: "partially_verified",
    lastReviewed: REVIEWED,
    deadline: null,
    notes: {
      en: "Check which passing years are currently eligible. You must have studied in Karnataka for at least 6 years. Not for those employed, self-employed, on apprenticeship pay or still studying.",
      kn: "ಪ್ರಸ್ತುತ ಯಾವ ಉತ್ತೀರ್ಣ ವರ್ಷಗಳು ಅರ್ಹ ಎಂದು ಪರಿಶೀಲಿಸಿ. ಕನಿಷ್ಠ 6 ವರ್ಷ ಕರ್ನಾಟಕದಲ್ಲಿ ಓದಿರಬೇಕು. ಉದ್ಯೋಗಿಗಳು, ಸ್ವಯಂ ಉದ್ಯೋಗಿಗಳು, ಅಪ್ರೆಂಟಿಸ್ ವೇತನ ಪಡೆಯುವವರು ಅಥವಾ ಓದುತ್ತಿರುವವರಿಗೆ ಅಲ್ಲ.",
      hi: "देखें कि अभी कौन-से पास वर्ष पात्र हैं। कम से कम 6 साल कर्नाटक में पढ़ाई ज़रूरी। नौकरी, स्वरोज़गार, अप्रेंटिस वेतन वालों या पढ़ रहे लोगों के लिए नहीं।",
    },
  },

  // ------------------------------ Health & seniors ------------------------------
  {
    slug: "ayushman-vay-vandana",
    name: { en: "Ayushman Vay Vandana (health cover for 70+)", kn: "ಆಯುಷ್ಮಾನ್ ವಯ ವಂದನಾ (70+ ಆರೋಗ್ಯ ವಿಮೆ)", hi: "आयुष्मान वय वंदना (70+ स्वास्थ्य कवर)" },
    department: { en: "National Health Authority, Government of India", kn: "ರಾಷ್ಟ್ರೀಯ ಆರೋಗ್ಯ ಪ್ರಾಧಿಕಾರ, ಭಾರತ ಸರ್ಕಾರ", hi: "राष्ट्रीय स्वास्थ्य प्राधिकरण, भारत सरकार" },
    level: "central",
    summary: {
      en: "Free hospital treatment cover under Ayushman Bharat PM-JAY for every senior citizen aged 70 or above, whatever their income.",
      kn: "ಆದಾಯ ಏನೇ ಇರಲಿ, 70 ವರ್ಷ ಮೇಲ್ಪಟ್ಟ ಪ್ರತಿ ಹಿರಿಯ ನಾಗರಿಕರಿಗೆ ಆಯುಷ್ಮಾನ್ ಭಾರತ್ PM-JAY ಅಡಿ ಉಚಿತ ಆಸ್ಪತ್ರೆ ಚಿಕಿತ್ಸೆ.",
      hi: "आय कुछ भी हो, 70 वर्ष या अधिक के हर वरिष्ठ नागरिक को आयुष्मान भारत PM-JAY के तहत मुफ़्त अस्पताल इलाज।",
    },
    benefit: seeportal({
      en: "A yearly family-floater-style cover for hospital treatment at empanelled hospitals.",
      kn: "ಪಟ್ಟಿ ಮಾಡಿದ ಆಸ್ಪತ್ರೆಗಳಲ್ಲಿ ಚಿಕಿತ್ಸೆಗೆ ವಾರ್ಷಿಕ ಆರೋಗ್ಯ ರಕ್ಷಣೆ.",
      hi: "सूचीबद्ध अस्पतालों में इलाज के लिए सालाना स्वास्थ्य कवर।",
    }),
    criteria: [age("age_70_plus", 70, undefined, { en: "70 years or older (as per Aadhaar)", kn: "70 ವರ್ಷ ಅಥವಾ ಹೆಚ್ಚು (ಆಧಾರ್ ಪ್ರಕಾರ)", hi: "70 वर्ष या अधिक (आधार के अनुसार)" })],
    documents: ["aadhaar"],
    howToApply: [
      {
        en: "Apply for the Ayushman Vay Vandana card on the Ayushman app or the beneficiary portal with Aadhaar e-KYC.",
        kn: "ಆಧಾರ್ ಇ-ಕೆವೈಸಿಯೊಂದಿಗೆ ಆಯುಷ್ಮಾನ್ ಆ್ಯಪ್ ಅಥವಾ ಫಲಾನುಭವಿ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಕಾರ್ಡ್‌ಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.",
        hi: "आधार ई-केवाईसी के साथ आयुष्मान ऐप या लाभार्थी पोर्टल पर कार्ड के लिए आवेदन करें।",
      },
      {
        en: "Show the card at any empanelled hospital for cashless treatment.",
        kn: "ನಗದುರಹಿತ ಚಿಕಿತ್ಸೆಗೆ ಯಾವುದೇ ಪಟ್ಟಿ ಮಾಡಿದ ಆಸ್ಪತ್ರೆಯಲ್ಲಿ ಕಾರ್ಡ್ ತೋರಿಸಿ.",
        hi: "कैशलेस इलाज के लिए किसी भी सूचीबद्ध अस्पताल में कार्ड दिखाएँ।",
      },
    ],
    applyUrl: "https://beneficiary.nha.gov.in/",
    portalName: { en: "Ayushman beneficiary portal", kn: "ಆಯುಷ್ಮಾನ್ ಫಲಾನುಭವಿ ಪೋರ್ಟಲ್", hi: "आयुष्मान लाभार्थी पोर्टल" },
    sources: [
      { label: "beneficiary.nha.gov.in", url: "https://beneficiary.nha.gov.in/" },
      { label: "pmjay.gov.in", url: "https://pmjay.gov.in/" },
    ],
    trust: "partially_verified",
    lastReviewed: REVIEWED,
    deadline: null,
    notes: {
      en: "If you already use another government health scheme (e.g. CGHS), you may have to choose one.",
      kn: "ನೀವು ಈಗಾಗಲೇ ಬೇರೆ ಸರ್ಕಾರಿ ಆರೋಗ್ಯ ಯೋಜನೆ (ಉದಾ: CGHS) ಬಳಸುತ್ತಿದ್ದರೆ, ಒಂದನ್ನು ಆಯ್ಕೆಮಾಡಬೇಕಾಗಬಹುದು.",
      hi: "यदि आप पहले से कोई अन्य सरकारी स्वास्थ्य योजना (जैसे CGHS) ले रहे हैं, तो एक चुननी पड़ सकती है।",
    },
  },

  {
    slug: "ignoaps-old-age-pension",
    name: {
      en: "Indira Gandhi National Old Age Pension (IGNOAPS)",
      kn: "ಇಂದಿರಾ ಗಾಂಧಿ ರಾಷ್ಟ್ರೀಯ ವೃದ್ಧಾಪ್ಯ ಪಿಂಚಣಿ (IGNOAPS)",
      hi: "इंदिरा गांधी राष्ट्रीय वृद्धावस्था पेंशन (IGNOAPS)",
    },
    department: {
      en: "Ministry of Rural Development (National Social Assistance Programme), with your state government",
      kn: "ಗ್ರಾಮೀಣಾಭಿವೃದ್ಧಿ ಸಚಿವಾಲಯ (ರಾಷ್ಟ್ರೀಯ ಸಾಮಾಜಿಕ ನೆರವು ಕಾರ್ಯಕ್ರಮ), ನಿಮ್ಮ ರಾಜ್ಯ ಸರ್ಕಾರದೊಂದಿಗೆ",
      hi: "ग्रामीण विकास मंत्रालय (राष्ट्रीय सामाजिक सहायता कार्यक्रम), आपकी राज्य सरकार के साथ",
    },
    level: "central",
    summary: {
      en: "A monthly pension for people aged 60 or above from families below the poverty line (BPL).",
      kn: "ಬಡತನ ರೇಖೆಗಿಂತ ಕೆಳಗಿನ (BPL) ಕುಟುಂಬಗಳ 60 ವರ್ಷ ಮೇಲ್ಪಟ್ಟವರಿಗೆ ಮಾಸಿಕ ಪಿಂಚಣಿ.",
      hi: "गरीबी रेखा से नीचे (BPL) के परिवारों के 60 वर्ष या उससे अधिक उम्र के लोगों के लिए मासिक पेंशन।",
    },
    benefit: seeportal({
      en: "A monthly pension paid to your bank or post office account. Many states add their own amount on top.",
      kn: "ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಅಥವಾ ಅಂಚೆ ಖಾತೆಗೆ ಮಾಸಿಕ ಪಿಂಚಣಿ. ಹಲವು ರಾಜ್ಯಗಳು ತಮ್ಮದೇ ಮೊತ್ತವನ್ನು ಸೇರಿಸುತ್ತವೆ.",
      hi: "आपके बैंक या डाकघर खाते में मासिक पेंशन। कई राज्य अपनी ओर से राशि जोड़ते हैं।",
    }),
    criteria: [
      age("age_60_plus", 60, undefined, { en: "60 years or older", kn: "60 ವರ್ಷ ಅಥವಾ ಹೆಚ್ಚು", hi: "60 वर्ष या उससे अधिक" }),
      {
        id: "bpl_household",
        rule: { kind: "equals", field: "bplHousehold", value: true },
        label: {
          en: "Family is below the poverty line (BPL)",
          kn: "ಕುಟುಂಬ ಬಡತನ ರೇಖೆಗಿಂತ ಕೆಳಗಿದೆ (BPL)",
          hi: "परिवार गरीबी रेखा से नीचे (BPL) है",
        },
      },
    ],
    documents: ["aadhaar", "ration_card", "bank_account"],
    howToApply: [
      {
        en: "Apply at your gram panchayat, block office or municipal office (social welfare section), or through your state's pension portal.",
        kn: "ನಿಮ್ಮ ಗ್ರಾಮ ಪಂಚಾಯಿತಿ, ತಾಲ್ಲೂಕು ಕಚೇರಿ ಅಥವಾ ಪುರಸಭೆ ಕಚೇರಿಯಲ್ಲಿ (ಸಮಾಜ ಕಲ್ಯಾಣ ವಿಭಾಗ), ಅಥವಾ ರಾಜ್ಯದ ಪಿಂಚಣಿ ಪೋರ್ಟಲ್ ಮೂಲಕ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.",
        hi: "अपनी ग्राम पंचायत, ब्लॉक कार्यालय या नगरपालिका कार्यालय (समाज कल्याण शाखा) में, या राज्य के पेंशन पोर्टल से आवेदन करें।",
      },
      {
        en: "Bring age proof, your BPL / ration card and bank details. The pension is paid every month after approval.",
        kn: "ವಯಸ್ಸಿನ ಪುರಾವೆ, BPL / ಪಡಿತರ ಚೀಟಿ ಮತ್ತು ಬ್ಯಾಂಕ್ ವಿವರ ತನ್ನಿ. ಅನುಮೋದನೆಯ ನಂತರ ಪ್ರತಿ ತಿಂಗಳು ಪಿಂಚಣಿ ಬರುತ್ತದೆ.",
        hi: "उम्र का प्रमाण, BPL / राशन कार्ड और बैंक विवरण साथ लाएँ। मंज़ूरी के बाद हर महीने पेंशन मिलती है।",
      },
    ],
    applyUrl: "https://nsap.nic.in/",
    portalName: { en: "National Social Assistance Programme (NSAP)", kn: "ರಾಷ್ಟ್ರೀಯ ಸಾಮಾಜಿಕ ನೆರವು ಕಾರ್ಯಕ್ರಮ (NSAP)", hi: "राष्ट्रीय सामाजिक सहायता कार्यक्रम (NSAP)" },
    sources: [
      { label: "nsap.nic.in", url: "https://nsap.nic.in/" },
      { label: "myscheme.gov.in/schemes/nsap-ignoaps", url: "https://www.myscheme.gov.in/schemes/nsap-ignoaps" },
    ],
    trust: "partially_verified",
    lastReviewed: REVIEWED,
    deadline: null,
    notes: {
      en: "Who counts as BPL is decided by your state's list. Each state pays this pension through its own social welfare / pension department, often under a local name.",
      kn: "BPL ಯಾರು ಎಂಬುದನ್ನು ನಿಮ್ಮ ರಾಜ್ಯದ ಪಟ್ಟಿ ನಿರ್ಧರಿಸುತ್ತದೆ. ಪ್ರತಿ ರಾಜ್ಯ ತನ್ನ ಸಮಾಜ ಕಲ್ಯಾಣ / ಪಿಂಚಣಿ ಇಲಾಖೆಯ ಮೂಲಕ, ಹಲವೊಮ್ಮೆ ಸ್ಥಳೀಯ ಹೆಸರಿನಲ್ಲಿ, ಈ ಪಿಂಚಣಿ ನೀಡುತ್ತದೆ.",
      hi: "BPL कौन है, यह आपके राज्य की सूची तय करती है। हर राज्य इसे अपने समाज कल्याण / पेंशन विभाग के ज़रिए, अक्सर स्थानीय नाम से, देता है।",
    },
  },

  // ------------------------------ Daughters ------------------------------
  {
    slug: "sukanya-samriddhi-yojana",
    name: { en: "Sukanya Samriddhi Yojana (savings for your daughter)", kn: "ಸುಕನ್ಯಾ ಸಮೃದ್ಧಿ ಯೋಜನೆ (ಮಗಳಿಗಾಗಿ ಉಳಿತಾಯ)", hi: "सुकन्या समृद्धि योजना (बेटी के लिए बचत)" },
    department: { en: "Ministry of Finance, Government of India (through post offices and banks)", kn: "ಹಣಕಾಸು ಸಚಿವಾಲಯ, ಭಾರತ ಸರ್ಕಾರ (ಅಂಚೆ ಕಚೇರಿ ಮತ್ತು ಬ್ಯಾಂಕ್‌ಗಳ ಮೂಲಕ)", hi: "वित्त मंत्रालय, भारत सरकार (डाकघरों और बैंकों के माध्यम से)" },
    level: "central",
    summary: {
      en: "A high-interest, tax-saving savings account that parents open for a daughter below 10 years, for her education and marriage.",
      kn: "10 ವರ್ಷದೊಳಗಿನ ಮಗಳಿಗಾಗಿ ಪೋಷಕರು ತೆರೆಯುವ, ಹೆಚ್ಚು ಬಡ್ಡಿ ಮತ್ತು ತೆರಿಗೆ ಉಳಿತಾಯದ ಖಾತೆ — ಅವಳ ಶಿಕ್ಷಣ ಮತ್ತು ಮದುವೆಗಾಗಿ.",
      hi: "10 वर्ष से कम उम्र की बेटी के लिए माता-पिता द्वारा खोला जाने वाला ऊँचे ब्याज और टैक्स बचत वाला खाता — उसकी पढ़ाई और शादी के लिए।",
    },
    benefit: seeportal({
      en: "Government-set interest (reviewed every quarter) and tax benefits. Small yearly deposits are allowed.",
      kn: "ಸರ್ಕಾರ ನಿಗದಿಪಡಿಸಿದ ಬಡ್ಡಿ (ಪ್ರತಿ ತ್ರೈಮಾಸಿಕ ಪರಿಷ್ಕರಣೆ) ಮತ್ತು ತೆರಿಗೆ ಲಾಭ. ಸಣ್ಣ ವಾರ್ಷಿಕ ಠೇವಣಿಗೆ ಅವಕಾಶ.",
      hi: "सरकार द्वारा तय ब्याज (हर तिमाही समीक्षा) और टैक्स लाभ। छोटी सालाना जमा की अनुमति।",
    }),
    criteria: [
      {
        id: "daughter_under_10",
        rule: { kind: "equals", field: "hasDaughterUnder10", value: true },
        label: {
          en: "You are the parent or legal guardian of a daughter below 10 years",
          kn: "ನೀವು 10 ವರ್ಷದೊಳಗಿನ ಮಗಳ ಪೋಷಕರು ಅಥವಾ ಕಾನೂನುಬದ್ಧ ಪಾಲಕರು",
          hi: "आप 10 वर्ष से कम उम्र की बेटी के माता-पिता या कानूनी अभिभावक हैं",
        },
      },
    ],
    documents: ["birth_certificate", "aadhaar"],
    howToApply: [
      {
        en: "Go to a post office or an authorised bank branch with the account opening form.",
        kn: "ಖಾತೆ ತೆರೆಯುವ ಅರ್ಜಿಯೊಂದಿಗೆ ಅಂಚೆ ಕಚೇರಿ ಅಥವಾ ಅಧಿಕೃತ ಬ್ಯಾಂಕ್ ಶಾಖೆಗೆ ಹೋಗಿ.",
        hi: "खाता खोलने के फ़ॉर्म के साथ डाकघर या अधिकृत बैंक शाखा जाएँ।",
      },
      {
        en: "Bring your daughter's birth certificate and your own ID and address proof, and make the first small deposit.",
        kn: "ಮಗಳ ಜನನ ಪ್ರಮಾಣಪತ್ರ ಮತ್ತು ನಿಮ್ಮ ಗುರುತು ಹಾಗೂ ವಿಳಾಸ ಪುರಾವೆ ತನ್ನಿ, ಮೊದಲ ಸಣ್ಣ ಠೇವಣಿ ಮಾಡಿ.",
        hi: "बेटी का जन्म प्रमाणपत्र और अपना पहचान व पते का प्रमाण लाएँ, और पहली छोटी राशि जमा करें।",
      },
    ],
    applyUrl: "https://www.indiapost.gov.in/",
    portalName: { en: "India Post (or an authorised bank)", kn: "ಭಾರತೀಯ ಅಂಚೆ (ಅಥವಾ ಅಧಿಕೃತ ಬ್ಯಾಂಕ್)", hi: "इंडिया पोस्ट (या अधिकृत बैंक)" },
    sources: [
      { label: "indiapost.gov.in", url: "https://www.indiapost.gov.in/" },
      { label: "nsiindia.gov.in", url: "https://www.nsiindia.gov.in/" },
    ],
    trust: "partially_verified",
    lastReviewed: REVIEWED,
    deadline: null,
    notes: {
      en: "One account per daughter, for up to two daughters (three if twins or triplets are born). The girl must be under 10 when the account is opened.",
      kn: "ಪ್ರತಿ ಮಗಳಿಗೆ ಒಂದು ಖಾತೆ, ಗರಿಷ್ಠ ಇಬ್ಬರು ಮಗಳಿಗೆ (ಅವಳಿ ಅಥವಾ ತ್ರಿವಳಿ ಜನಿಸಿದರೆ ಮೂವರು). ಖಾತೆ ತೆರೆಯುವಾಗ ಮಗಳು 10 ವರ್ಷದೊಳಗಿರಬೇಕು.",
      hi: "हर बेटी का एक खाता, अधिकतम दो बेटियों के लिए (जुड़वाँ या तीन बच्चे हों तो तीन)। खाता खोलते समय बेटी 10 वर्ष से छोटी होनी चाहिए।",
    },
  },

  // ------------------------------ Housing ------------------------------
  {
    slug: "pmay-urban-2",
    name: { en: "PM Awas Yojana – Urban 2.0 (housing)", kn: "ಪಿಎಂ ಆವಾಸ್ ಯೋಜನೆ – ನಗರ 2.0 (ವಸತಿ)", hi: "पीएम आवास योजना – शहरी 2.0 (आवास)" },
    department: { en: "Ministry of Housing & Urban Affairs, Government of India", kn: "ವಸತಿ ಮತ್ತು ನಗರ ವ್ಯವಹಾರಗಳ ಸಚಿವಾಲಯ, ಭಾರತ ಸರ್ಕಾರ", hi: "आवास एवं शहरी कार्य मंत्रालय, भारत सरकार" },
    level: "central",
    summary: {
      en: "Help for urban families without a pucca house to build, buy or rent an affordable home.",
      kn: "ಪಕ್ಕಾ ಮನೆ ಇಲ್ಲದ ನಗರ ಕುಟುಂಬಗಳಿಗೆ ಕೈಗೆಟುಕುವ ಮನೆ ಕಟ್ಟಲು, ಖರೀದಿಸಲು ಅಥವಾ ಬಾಡಿಗೆಗೆ ಸಹಾಯ.",
      hi: "पक्के मकान के बिना शहरी परिवारों को किफ़ायती घर बनाने, ख़रीदने या किराये पर लेने में मदद।",
    },
    benefit: seeportal({
      en: "Central assistance or an interest subsidy on a home loan, depending on the option (vertical) you choose.",
      kn: "ನೀವು ಆಯ್ಕೆಮಾಡುವ ಆಯ್ಕೆಯನ್ನು ಅವಲಂಬಿಸಿ ಕೇಂದ್ರ ನೆರವು ಅಥವಾ ಗೃಹ ಸಾಲದ ಬಡ್ಡಿ ಸಬ್ಸಿಡಿ.",
      hi: "आपके चुने विकल्प के अनुसार केंद्रीय सहायता या गृह ऋण पर ब्याज सब्सिडी।",
    }),
    criteria: [
      {
        id: "urban_area",
        rule: { kind: "equals", field: "areaType", value: "urban" },
        label: { en: "Lives in a town or city", kn: "ಪಟ್ಟಣ ಅಥವಾ ನಗರದಲ್ಲಿ ವಾಸ", hi: "कस्बे या शहर में रहते हैं" },
      },
      {
        id: "income_9l",
        rule: { kind: "incomeAtMost", max: 900_000 },
        label: { en: "Family income up to ₹9 lakh a year", kn: "ಕುಟುಂಬದ ವಾರ್ಷಿಕ ಆದಾಯ ₹9 ಲಕ್ಷದವರೆಗೆ", hi: "परिवार की सालाना आय ₹9 लाख तक" },
      },
      {
        id: "no_pucca_house",
        rule: { kind: "equals", field: "ownsPuccaHouse", value: false },
        label: {
          en: "No family member owns a pucca house anywhere in India",
          kn: "ಕುಟುಂಬದ ಯಾರೂ ಭಾರತದಲ್ಲಿ ಎಲ್ಲಿಯೂ ಪಕ್ಕಾ ಮನೆ ಹೊಂದಿಲ್ಲ",
          hi: "परिवार के किसी सदस्य के पास भारत में कहीं पक्का मकान नहीं",
        },
      },
    ],
    documents: ["aadhaar", "income_certificate", "bank_account"],
    howToApply: [
      {
        en: "Apply on the PMAY-Urban portal (or through your city corporation / municipality).",
        kn: "PMAY-ನಗರ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ (ಅಥವಾ ನಿಮ್ಮ ನಗರ ಪಾಲಿಕೆ / ಪುರಸಭೆ ಮೂಲಕ) ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.",
        hi: "PMAY-शहरी पोर्टल पर (या अपने नगर निगम / नगरपालिका के माध्यम से) आवेदन करें।",
      },
      {
        en: "Choose your option (build, buy, rent or interest subsidy) and give a self-declaration of income.",
        kn: "ನಿಮ್ಮ ಆಯ್ಕೆ (ಕಟ್ಟುವುದು, ಖರೀದಿ, ಬಾಡಿಗೆ ಅಥವಾ ಬಡ್ಡಿ ಸಬ್ಸಿಡಿ) ಆರಿಸಿ ಮತ್ತು ಆದಾಯದ ಸ್ವಯಂ ಘೋಷಣೆ ನೀಡಿ.",
        hi: "अपना विकल्प (बनाना, ख़रीदना, किराया या ब्याज सब्सिडी) चुनें और आय का स्व-घोषणा पत्र दें।",
      },
    ],
    applyUrl: "https://pmay-urban.gov.in/",
    portalName: { en: "PMAY-Urban portal", kn: "PMAY-ನಗರ ಪೋರ್ಟಲ್", hi: "PMAY-शहरी पोर्टल" },
    sources: [{ label: "pmay-urban.gov.in", url: "https://pmay-urban.gov.in/" }],
    trust: "partially_verified",
    lastReviewed: REVIEWED,
    deadline: null,
    notes: {
      en: "Income groups: EWS up to ₹3 lakh, LIG up to ₹6 lakh, MIG up to ₹9 lakh (as commonly published — confirm on the portal). The house is usually in the name of the woman of the family or joint.",
      kn: "ಆದಾಯ ಗುಂಪುಗಳು: EWS ₹3 ಲಕ್ಷದವರೆಗೆ, LIG ₹6 ಲಕ್ಷದವರೆಗೆ, MIG ₹9 ಲಕ್ಷದವರೆಗೆ (ಸಾಮಾನ್ಯವಾಗಿ ಪ್ರಕಟವಾದಂತೆ — ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಖಚಿತಪಡಿಸಿ). ಮನೆ ಸಾಮಾನ್ಯವಾಗಿ ಕುಟುಂಬದ ಮಹಿಳೆಯ ಹೆಸರಿನಲ್ಲಿ ಅಥವಾ ಜಂಟಿಯಾಗಿ.",
      hi: "आय वर्ग: EWS ₹3 लाख तक, LIG ₹6 लाख तक, MIG ₹9 लाख तक (आम तौर पर प्रकाशित — पोर्टल पर पुष्टि करें)। घर आम तौर पर परिवार की महिला के नाम या संयुक्त।",
    },
  },
];
