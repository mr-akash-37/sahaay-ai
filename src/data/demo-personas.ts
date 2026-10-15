import type { CitizenProfile, LocalizedText } from "@/lib/engine/types";

/**
 * Fictional example citizens for demos. Loading one fills in the answers so
 * judges and new users can see real results in one click. The expected
 * schemes are checked by tests/unit/demo-personas.test.ts, so the demo can't
 * silently break when rules change.
 */
export type DemoPersona = {
  id: string;
  emoji: string;
  name: LocalizedText;
  story: LocalizedText;
  profile: CitizenProfile;
  /** Schemes this person should be eligible for — verified by unit tests. */
  expectEligible: string[];
};

export const demoPersonas: DemoPersona[] = [
  {
    id: "farmer",
    emoji: "🌾",
    name: { en: "Ramesh, 48 — small farmer", kn: "ರಮೇಶ್, 48 — ಸಣ್ಣ ರೈತ", hi: "रमेश, 48 — छोटे किसान" },
    story: {
      en: "Grows onions on 2 acres near Nashik, Maharashtra. Family income about ₹1.5 lakh a year.",
      kn: "ಮಹಾರಾಷ್ಟ್ರದ ನಾಸಿಕ್ ಬಳಿ 2 ಎಕರೆಯಲ್ಲಿ ಈರುಳ್ಳಿ ಬೆಳೆಯುತ್ತಾರೆ. ಕುಟುಂಬದ ಆದಾಯ ವರ್ಷಕ್ಕೆ ಸುಮಾರು ₹1.5 ಲಕ್ಷ.",
      hi: "महाराष्ट्र में नासिक के पास 2 एकड़ में प्याज़ उगाते हैं। परिवार की आय साल में लगभग ₹1.5 लाख।",
    },
    profile: {
      occupation: "farmer",
      age: 48,
      gender: "male",
      state: "mh",
      areaType: "rural",
      category: "general",
      incomeBand: "1l_2_5l",
      ownsFarmland: true,
      familyPaysIncomeTax: false,
      familyGovtEmployee: false,
      hasDaughterUnder10: false,
    },
    expectEligible: ["pm-kisan", "kisan-credit-card", "pm-fasal-bima-yojana", "pmjjby", "pmsby"],
  },
  {
    id: "student",
    emoji: "🎓",
    name: { en: "Kavya, 19 — BSc student", kn: "ಕಾವ್ಯ, 19 — ಬಿಎಸ್ಸಿ ವಿದ್ಯಾರ್ಥಿನಿ", hi: "काव्या, 19 — बीएससी छात्रा" },
    story: {
      en: "First in her family at college, in Kalaburagi. SC category. Her father farms. Scored in the top 20% in PUC.",
      kn: "ಕಲಬುರಗಿಯಲ್ಲಿ, ಕುಟುಂಬದಲ್ಲಿ ಕಾಲೇಜಿಗೆ ಹೋಗುತ್ತಿರುವ ಮೊದಲಿಗಳು. ಪರಿಶಿಷ್ಟ ಜಾತಿ. ತಂದೆ ರೈತರು. ಪಿಯುಸಿಯಲ್ಲಿ ಮೇಲಿನ 20% ರಲ್ಲಿ.",
      hi: "कलबुर्गी में, परिवार में कॉलेज जाने वाली पहली। अनुसूचित जाति। पिता किसान हैं। पीयूसी में टॉप 20% में।",
    },
    profile: {
      occupation: "student",
      age: 19,
      gender: "female",
      state: "ka",
      areaType: "rural",
      category: "sc",
      incomeBand: "upto_1l",
      educationLevel: "ug",
      parentFarmer: true,
      class12Above80Percentile: true,
      inGovernmentHostel: false,
      womanHeadOfFamily: false,
      familyPaysIncomeTax: false,
      hasDaughterUnder10: false,
    },
    expectEligible: ["post-matric-scholarship-sc", "raitha-vidya-nidhi", "central-sector-scholarship", "shakti-free-bus-travel"],
  },
  {
    id: "entrepreneur",
    emoji: "🧵",
    name: { en: "Lakshmi, 34 — starting a tailoring shop", kn: "ಲಕ್ಷ್ಮಿ, 34 — ಟೈಲರಿಂಗ್ ಅಂಗಡಿ ಆರಂಭಿಸುತ್ತಿದ್ದಾರೆ", hi: "लक्ष्मी, 34 — सिलाई की दुकान शुरू कर रही हैं" },
    story: {
      en: "Lives on rent in Bengaluru with her 6-year-old daughter, head of family on the ration card. Wants a loan to open her first shop.",
      kn: "6 ವರ್ಷದ ಮಗಳೊಂದಿಗೆ ಬೆಂಗಳೂರಿನಲ್ಲಿ ಬಾಡಿಗೆ ಮನೆಯಲ್ಲಿ ವಾಸ, ಪಡಿತರ ಚೀಟಿಯಲ್ಲಿ ಕುಟುಂಬದ ಮುಖ್ಯಸ್ಥೆ. ಮೊದಲ ಅಂಗಡಿ ತೆರೆಯಲು ಸಾಲ ಬೇಕು.",
      hi: "बेंगलुरु में अपनी 6 साल की बेटी के साथ किराए पर रहती हैं, राशन कार्ड पर परिवार की मुखिया। पहली दुकान खोलने के लिए ऋण चाहिए।",
    },
    profile: {
      occupation: "business_owner",
      age: 34,
      gender: "female",
      state: "ka",
      areaType: "urban",
      category: "obc",
      kaBackwardClass: "cat_2a",
      incomeBand: "1l_2_5l",
      businessStage: "new",
      womanHeadOfFamily: true,
      familyFilesGst: false,
      familyPaysIncomeTax: false,
      ownsPuccaHouse: false,
      hasDaughterUnder10: true,
    },
    expectEligible: ["gruha-lakshmi", "shakti-free-bus-travel", "pmegp", "pm-mudra-yojana", "pmay-urban-2", "atal-pension-yojana", "sukanya-samriddhi-yojana"],
  },
  {
    id: "senior",
    emoji: "👴",
    name: { en: "Siddappa, 72 — retired", kn: "ಸಿದ್ದಪ್ಪ, 72 — ನಿವೃತ್ತರು", hi: "सिद्दप्पा, 72 — सेवानिवृत्त" },
    story: {
      en: "Lives with his son's family in a village near Hassan. The family has a BPL ration card. Worried about hospital costs.",
      kn: "ಹಾಸನದ ಬಳಿಯ ಹಳ್ಳಿಯಲ್ಲಿ ಮಗನ ಕುಟುಂಬದೊಂದಿಗೆ ವಾಸ. ಕುಟುಂಬಕ್ಕೆ BPL ಪಡಿತರ ಚೀಟಿ ಇದೆ. ಆಸ್ಪತ್ರೆ ಖರ್ಚಿನ ಬಗ್ಗೆ ಚಿಂತೆ.",
      hi: "हासन के पास एक गाँव में बेटे के परिवार के साथ रहते हैं। परिवार के पास BPL राशन कार्ड है। अस्पताल के ख़र्च की चिंता है।",
    },
    profile: {
      occupation: "retired",
      age: 72,
      gender: "male",
      state: "ka",
      areaType: "rural",
      category: "general",
      incomeBand: "1l_2_5l",
      familyPaysIncomeTax: false,
      bplHousehold: true,
      hasDaughterUnder10: false,
    },
    expectEligible: ["ayushman-vay-vandana", "ignoaps-old-age-pension"],
  },
  {
    id: "jobseeker",
    emoji: "💼",
    name: { en: "Arjun, 23 — looking for a job", kn: "ಅರ್ಜುನ್, 23 — ಉದ್ಯೋಗ ಹುಡುಕುತ್ತಿದ್ದಾರೆ", hi: "अर्जुन, 23 — नौकरी ढूँढ रहे हैं" },
    story: {
      en: "Finished his BCom in Hubballi 8 months ago and hasn't found work yet.",
      kn: "8 ತಿಂಗಳ ಹಿಂದೆ ಹುಬ್ಬಳ್ಳಿಯಲ್ಲಿ ಬಿಕಾಂ ಮುಗಿಸಿದ್ದಾರೆ, ಇನ್ನೂ ಉದ್ಯೋಗ ಸಿಕ್ಕಿಲ್ಲ.",
      hi: "8 महीने पहले हुबली में बीकॉम पूरा किया, अभी तक काम नहीं मिला।",
    },
    profile: {
      occupation: "job_seeker",
      age: 23,
      gender: "male",
      state: "ka",
      areaType: "urban",
      category: "obc",
      kaBackwardClass: "cat_1",
      incomeBand: "1l_2_5l",
      unemployedGraduate: true,
      familyPaysIncomeTax: false,
      ownsPuccaHouse: true,
      hasDaughterUnder10: false,
    },
    expectEligible: ["yuva-nidhi", "atal-pension-yojana", "pmjjby", "pmsby"],
  },
];
