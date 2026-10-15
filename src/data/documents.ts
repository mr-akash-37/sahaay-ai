import type { LocalizedText } from "@/lib/engine/types";

export const documentIds = [
  "caste_certificate",
  "income_certificate",
  "aadhaar",
  "bank_account",
  "marks_card",
  "admission_proof",
  "fruits_id",
  "nsp_otr",
  "ration_card",
  "land_records",
  "business_plan",
  "degree_certificate",
  "birth_certificate",
] as const;

export type DocumentId = (typeof documentIds)[number];

export type DocumentInfo = {
  id: DocumentId;
  name: LocalizedText;
  why: LocalizedText;
  issuer: LocalizedText;
  where: LocalizedText;
  /** What you usually need to bring. Always confirm at the office. */
  prerequisites: LocalizedText;
  officialUrl?: string;
};

const revenueIssuer: LocalizedText = {
  en: "Tahsildar, Revenue Department of your state",
  kn: "ತಹಶೀಲ್ದಾರ್, ನಿಮ್ಮ ರಾಜ್ಯದ ಕಂದಾಯ ಇಲಾಖೆ",
  hi: "तहसीलदार, आपके राज्य का राजस्व विभाग",
};

const revenueWhere: LocalizedText = {
  en: "Your tehsil / taluk office, a Common Service Centre (CSC), or your state's e-District portal online. In Karnataka: Nadakacheri.",
  kn: "ನಿಮ್ಮ ತಹಶೀಲ್ / ತಾಲ್ಲೂಕು ಕಚೇರಿ, ಸಾಮಾನ್ಯ ಸೇವಾ ಕೇಂದ್ರ (CSC), ಅಥವಾ ನಿಮ್ಮ ರಾಜ್ಯದ ಇ-ಡಿಸ್ಟ್ರಿಕ್ಟ್ ಪೋರ್ಟಲ್. ಕರ್ನಾಟಕದಲ್ಲಿ: ನಾಡಕಚೇರಿ.",
  hi: "आपका तहसील / तालुक कार्यालय, कॉमन सर्विस सेंटर (CSC), या आपके राज्य का ई-डिस्ट्रिक्ट पोर्टल। कर्नाटक में: नाडकचेरी।",
};

const revenuePrereq: LocalizedText = {
  en: "Usually: Aadhaar, ration card and address proof. Confirm the list at the office.",
  kn: "ಸಾಮಾನ್ಯವಾಗಿ: ಆಧಾರ್, ಪಡಿತರ ಚೀಟಿ ಮತ್ತು ವಿಳಾಸದ ಪುರಾವೆ. ಪಟ್ಟಿಯನ್ನು ಕಚೇರಿಯಲ್ಲಿ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.",
  hi: "आमतौर पर: आधार, राशन कार्ड और पते का प्रमाण। सूची कार्यालय में पक्की कर लें।",
};

export const documents: Record<DocumentId, DocumentInfo> = {
  caste_certificate: {
    id: "caste_certificate",
    name: { en: "Caste certificate", kn: "ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ", hi: "जाति प्रमाणपत्र" },
    why: {
      en: "Proves your category (SC, ST or Backward Class). The scholarship form asks for its RD number.",
      kn: "ನಿಮ್ಮ ವರ್ಗವನ್ನು (SC, ST ಅಥವಾ ಹಿಂದುಳಿದ ವರ್ಗ) ಸಾಬೀತುಪಡಿಸುತ್ತದೆ. ಅರ್ಜಿಯಲ್ಲಿ ಇದರ RD ಸಂಖ್ಯೆ ಕೇಳಲಾಗುತ್ತದೆ.",
      hi: "आपकी श्रेणी (SC, ST या पिछड़ा वर्ग) साबित करता है। आवेदन में इसका RD नंबर माँगा जाता है।",
    },
    issuer: revenueIssuer,
    where: revenueWhere,
    prerequisites: revenuePrereq,
  },
  income_certificate: {
    id: "income_certificate",
    name: { en: "Income certificate", kn: "ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ", hi: "आय प्रमाणपत्र" },
    why: {
      en: "Proves your family income is within the scheme's limit. Usually issued in a parent's name.",
      kn: "ನಿಮ್ಮ ಕುಟುಂಬದ ಆದಾಯ ಯೋಜನೆಯ ಮಿತಿಯೊಳಗಿದೆ ಎಂದು ಸಾಬೀತುಪಡಿಸುತ್ತದೆ. ಸಾಮಾನ್ಯವಾಗಿ ಪೋಷಕರ ಹೆಸರಿನಲ್ಲಿ ನೀಡಲಾಗುತ್ತದೆ.",
      hi: "साबित करता है कि परिवार की आय योजना की सीमा में है। आमतौर पर माता/पिता के नाम पर बनता है।",
    },
    issuer: revenueIssuer,
    where: revenueWhere,
    prerequisites: revenuePrereq,
  },
  aadhaar: {
    id: "aadhaar",
    name: { en: "Aadhaar card", kn: "ಆಧಾರ್ ಕಾರ್ಡ್", hi: "आधार कार्ड" },
    why: {
      en: "Confirms your identity. Scholarships are paid only to Aadhaar-linked accounts.",
      kn: "ನಿಮ್ಮ ಗುರುತನ್ನು ದೃಢಪಡಿಸುತ್ತದೆ. ವಿದ್ಯಾರ್ಥಿವೇತನವನ್ನು ಆಧಾರ್ ಜೋಡಣೆಯಾದ ಖಾತೆಗೆ ಮಾತ್ರ ನೀಡಲಾಗುತ್ತದೆ.",
      hi: "आपकी पहचान पक्की करता है। छात्रवृत्ति केवल आधार से जुड़े खाते में आती है।",
    },
    issuer: { en: "UIDAI", kn: "UIDAI", hi: "UIDAI" },
    where: {
      en: "Any Aadhaar enrolment or update centre",
      kn: "ಯಾವುದೇ ಆಧಾರ್ ನೋಂದಣಿ ಅಥವಾ ತಿದ್ದುಪಡಿ ಕೇಂದ್ರ",
      hi: "कोई भी आधार नामांकन या अपडेट केंद्र",
    },
    prerequisites: {
      en: "Proof of identity and address (see the UIDAI list).",
      kn: "ಗುರುತು ಮತ್ತು ವಿಳಾಸದ ಪುರಾವೆ (UIDAI ಪಟ್ಟಿ ನೋಡಿ).",
      hi: "पहचान और पते का प्रमाण (UIDAI सूची देखें)।",
    },
    officialUrl: "https://uidai.gov.in/",
  },
  bank_account: {
    id: "bank_account",
    name: {
      en: "Bank account linked to Aadhaar",
      kn: "ಆಧಾರ್ ಜೋಡಣೆಯಾದ ಬ್ಯಾಂಕ್ ಖಾತೆ",
      hi: "आधार से जुड़ा बैंक खाता",
    },
    why: {
      en: "Money is sent directly to your account (DBT). The account must be linked to your Aadhaar.",
      kn: "ಹಣವನ್ನು ನೇರವಾಗಿ ನಿಮ್ಮ ಖಾತೆಗೆ (DBT) ಕಳುಹಿಸಲಾಗುತ್ತದೆ. ಖಾತೆ ಆಧಾರ್‌ಗೆ ಜೋಡಣೆಯಾಗಿರಬೇಕು.",
      hi: "पैसा सीधे आपके खाते में (DBT) भेजा जाता है। खाता आधार से जुड़ा होना चाहिए।",
    },
    issuer: { en: "Your bank", kn: "ನಿಮ್ಮ ಬ್ಯಾಂಕ್", hi: "आपका बैंक" },
    where: {
      en: "Your bank branch. Ask them to link (seed) Aadhaar for DBT.",
      kn: "ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಶಾಖೆ. DBTಗಾಗಿ ಆಧಾರ್ ಜೋಡಿಸಲು ಕೇಳಿ.",
      hi: "आपकी बैंक शाखा। DBT के लिए आधार जोड़ने (सीडिंग) को कहें।",
    },
    prerequisites: {
      en: "Aadhaar card and passbook.",
      kn: "ಆಧಾರ್ ಕಾರ್ಡ್ ಮತ್ತು ಪಾಸ್‌ಬುಕ್.",
      hi: "आधार कार्ड और पासबुक।",
    },
  },
  marks_card: {
    id: "marks_card",
    name: { en: "Previous exam marks card", kn: "ಹಿಂದಿನ ಪರೀಕ್ಷೆಯ ಅಂಕಪಟ್ಟಿ", hi: "पिछली परीक्षा की अंकतालिका" },
    why: {
      en: "Shows you passed your last exam and are moving up.",
      kn: "ನೀವು ಕಳೆದ ಪರೀಕ್ಷೆಯಲ್ಲಿ ಉತ್ತೀರ್ಣರಾಗಿದ್ದೀರಿ ಎಂದು ತೋರಿಸುತ್ತದೆ.",
      hi: "दिखाता है कि आपने पिछली परीक्षा पास की है।",
    },
    issuer: {
      en: "Your school, college or exam board",
      kn: "ನಿಮ್ಮ ಶಾಲೆ, ಕಾಲೇಜು ಅಥವಾ ಪರೀಕ್ಷಾ ಮಂಡಳಿ",
      hi: "आपका स्कूल, कॉलेज या परीक्षा बोर्ड",
    },
    where: {
      en: "Your school or college office",
      kn: "ನಿಮ್ಮ ಶಾಲೆ ಅಥವಾ ಕಾಲೇಜು ಕಚೇರಿ",
      hi: "आपके स्कूल या कॉलेज का कार्यालय",
    },
    prerequisites: { en: "None.", kn: "ಯಾವುದೂ ಇಲ್ಲ.", hi: "कुछ नहीं।" },
  },
  admission_proof: {
    id: "admission_proof",
    name: {
      en: "College admission or fee receipt",
      kn: "ಕಾಲೇಜು ಪ್ರವೇಶ ಅಥವಾ ಶುಲ್ಕ ರಸೀದಿ",
      hi: "कॉलेज प्रवेश या फ़ीस रसीद",
    },
    why: {
      en: "Proves you are studying this year in a recognised institution.",
      kn: "ನೀವು ಈ ವರ್ಷ ಮಾನ್ಯತೆ ಪಡೆದ ಸಂಸ್ಥೆಯಲ್ಲಿ ಓದುತ್ತಿದ್ದೀರಿ ಎಂದು ಸಾಬೀತುಪಡಿಸುತ್ತದೆ.",
      hi: "साबित करता है कि आप इस साल मान्यता प्राप्त संस्थान में पढ़ रहे हैं।",
    },
    issuer: { en: "Your college", kn: "ನಿಮ್ಮ ಕಾಲೇಜು", hi: "आपका कॉलेज" },
    where: {
      en: "Your college office (admission receipt, fee receipt or study certificate)",
      kn: "ನಿಮ್ಮ ಕಾಲೇಜು ಕಚೇರಿ (ಪ್ರವೇಶ ರಸೀದಿ, ಶುಲ್ಕ ರಸೀದಿ ಅಥವಾ ವ್ಯಾಸಂಗ ಪ್ರಮಾಣಪತ್ರ)",
      hi: "आपके कॉलेज का कार्यालय (प्रवेश रसीद, फ़ीस रसीद या अध्ययन प्रमाणपत्र)",
    },
    prerequisites: { en: "None.", kn: "ಯಾವುದೂ ಇಲ್ಲ.", hi: "कुछ नहीं।" },
  },
  fruits_id: {
    id: "fruits_id",
    name: {
      en: "Parent's FRUITS farmer ID (Karnataka)",
      kn: "ಪೋಷಕರ FRUITS ರೈತ ಐಡಿ (ಕರ್ನಾಟಕ)",
      hi: "माता/पिता की FRUITS किसान आईडी (कर्नाटक)",
    },
    why: {
      en: "Confirms your parent is a registered farmer with land in Karnataka. The application checks land records using this ID.",
      kn: "ನಿಮ್ಮ ಪೋಷಕರು ಕರ್ನಾಟಕದಲ್ಲಿ ಜಮೀನು ಹೊಂದಿರುವ ನೋಂದಾಯಿತ ರೈತರು ಎಂದು ದೃಢಪಡಿಸುತ್ತದೆ. ಈ ಐಡಿ ಬಳಸಿ ಜಮೀನು ದಾಖಲೆ ಪರಿಶೀಲಿಸಲಾಗುತ್ತದೆ.",
      hi: "पुष्टि करता है कि माता/पिता कर्नाटक में ज़मीन वाले पंजीकृत किसान हैं। इसी आईडी से ज़मीन के रिकॉर्ड जाँचे जाते हैं।",
    },
    issuer: { en: "Agriculture Department, Karnataka", kn: "ಕೃಷಿ ಇಲಾಖೆ, ಕರ್ನಾಟಕ", hi: "कृषि विभाग, कर्नाटक" },
    where: {
      en: "Raitha Samparka Kendra, or the FRUITS portal",
      kn: "ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರ, ಅಥವಾ FRUITS ಪೋರ್ಟಲ್",
      hi: "रैता संपर्क केंद्र, या FRUITS पोर्टल",
    },
    prerequisites: {
      en: "Parent's Aadhaar, land record (RTC) and bank details.",
      kn: "ಪೋಷಕರ ಆಧಾರ್, ಜಮೀನು ದಾಖಲೆ (ಪಹಣಿ/RTC) ಮತ್ತು ಬ್ಯಾಂಕ್ ವಿವರ.",
      hi: "माता/पिता का आधार, ज़मीन का रिकॉर्ड (RTC) और बैंक विवरण।",
    },
    officialUrl: "https://fruits.karnataka.gov.in/",
  },
  nsp_otr: {
    id: "nsp_otr",
    name: {
      en: "NSP One-Time Registration (OTR)",
      kn: "NSP ಒಂದು ಬಾರಿಯ ನೋಂದಣಿ (OTR)",
      hi: "NSP वन-टाइम रजिस्ट्रेशन (OTR)",
    },
    why: {
      en: "Needed before you can apply for any scholarship on the National Scholarship Portal.",
      kn: "ರಾಷ್ಟ್ರೀಯ ವಿದ್ಯಾರ್ಥಿವೇತನ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಯಾವುದೇ ವಿದ್ಯಾರ್ಥಿವೇತನಕ್ಕೆ ಅರ್ಜಿ ಹಾಕುವ ಮೊದಲು ಬೇಕು.",
      hi: "राष्ट्रीय छात्रवृत्ति पोर्टल पर किसी भी छात्रवृत्ति के आवेदन से पहले ज़रूरी है।",
    },
    issuer: {
      en: "National Scholarship Portal (Government of India)",
      kn: "ರಾಷ್ಟ್ರೀಯ ವಿದ್ಯಾರ್ಥಿವೇತನ ಪೋರ್ಟಲ್ (ಭಾರತ ಸರ್ಕಾರ)",
      hi: "राष्ट्रीय छात्रवृत्ति पोर्टल (भारत सरकार)",
    },
    where: { en: "Online at scholarships.gov.in", kn: "scholarships.gov.in ನಲ್ಲಿ ಆನ್‌ಲೈನ್", hi: "scholarships.gov.in पर ऑनलाइन" },
    prerequisites: {
      en: "Aadhaar and a working mobile number.",
      kn: "ಆಧಾರ್ ಮತ್ತು ಚಾಲ್ತಿಯಲ್ಲಿರುವ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ.",
      hi: "आधार और चालू मोबाइल नंबर।",
    },
    officialUrl: "https://scholarships.gov.in/",
  },
  ration_card: {
    id: "ration_card",
    name: { en: "Ration card", kn: "ಪಡಿತರ ಚೀಟಿ", hi: "राशन कार्ड" },
    why: {
      en: "Shows your household and who is the head of the family. Some schemes use it to identify eligible families.",
      kn: "ನಿಮ್ಮ ಕುಟುಂಬ ಮತ್ತು ಕುಟುಂಬದ ಮುಖ್ಯಸ್ಥರು ಯಾರು ಎಂದು ತೋರಿಸುತ್ತದೆ. ಕೆಲವು ಯೋಜನೆಗಳು ಅರ್ಹ ಕುಟುಂಬಗಳನ್ನು ಗುರುತಿಸಲು ಇದನ್ನು ಬಳಸುತ್ತವೆ.",
      hi: "आपका परिवार और परिवार का मुखिया कौन है, यह दिखाता है। कुछ योजनाएँ पात्र परिवार पहचानने के लिए इसका उपयोग करती हैं।",
    },
    issuer: {
      en: "Food & Civil Supplies Department of your state",
      kn: "ನಿಮ್ಮ ರಾಜ್ಯದ ಆಹಾರ ಮತ್ತು ನಾಗರಿಕ ಸರಬರಾಜು ಇಲಾಖೆ",
      hi: "आपके राज्य का खाद्य एवं नागरिक आपूर्ति विभाग",
    },
    where: {
      en: "Your local food / ration office, a CSC, or your state's food department portal",
      kn: "ನಿಮ್ಮ ಸ್ಥಳೀಯ ಆಹಾರ / ಪಡಿತರ ಕಚೇರಿ, CSC, ಅಥವಾ ನಿಮ್ಮ ರಾಜ್ಯದ ಆಹಾರ ಇಲಾಖೆಯ ಪೋರ್ಟಲ್",
      hi: "आपका स्थानीय खाद्य / राशन कार्यालय, CSC, या आपके राज्य के खाद्य विभाग का पोर्टल",
    },
    prerequisites: {
      en: "Aadhaar of all family members and address proof.",
      kn: "ಕುಟುಂಬದ ಎಲ್ಲರ ಆಧಾರ್ ಮತ್ತು ವಿಳಾಸದ ಪುರಾವೆ.",
      hi: "परिवार के सभी सदस्यों का आधार और पते का प्रमाण।",
    },
    officialUrl: "https://nfsa.gov.in/",
  },
  land_records: {
    id: "land_records",
    name: {
      en: "Land records (RTC / Khatauni / 7/12)",
      kn: "ಜಮೀನು ದಾಖಲೆ (ಪಹಣಿ / RTC)",
      hi: "ज़मीन के रिकॉर्ड (खतौनी / जमाबंदी / 7/12)",
    },
    why: {
      en: "Proves that you own or cultivate farmland.",
      kn: "ನೀವು ಕೃಷಿ ಜಮೀನು ಹೊಂದಿದ್ದೀರಿ ಅಥವಾ ಸಾಗುವಳಿ ಮಾಡುತ್ತಿದ್ದೀರಿ ಎಂದು ಸಾಬೀತುಪಡಿಸುತ್ತದೆ.",
      hi: "साबित करता है कि आपके पास खेती की ज़मीन है या आप उस पर खेती करते हैं।",
    },
    issuer: revenueIssuer,
    where: {
      en: "Your state's online land records portal, or your village accountant (patwari / talathi). In Karnataka: Bhoomi.",
      kn: "ನಿಮ್ಮ ರಾಜ್ಯದ ಆನ್‌ಲೈನ್ ಭೂ ದಾಖಲೆ ಪೋರ್ಟಲ್, ಅಥವಾ ಗ್ರಾಮ ಲೆಕ್ಕಿಗ. ಕರ್ನಾಟಕದಲ್ಲಿ: ಭೂಮಿ.",
      hi: "आपके राज्य का ऑनलाइन भू-अभिलेख पोर्टल, या ग्राम लेखाकार (पटवारी / तलाठी)। कर्नाटक में: भूमि।",
    },
    prerequisites: {
      en: "Survey number of your land.",
      kn: "ನಿಮ್ಮ ಜಮೀನಿನ ಸರ್ವೆ ಸಂಖ್ಯೆ.",
      hi: "आपकी ज़मीन का सर्वे नंबर।",
    },
  },
  business_plan: {
    id: "business_plan",
    name: { en: "Business plan / project report", kn: "ವ್ಯವಹಾರ ಯೋಜನೆ / ಯೋಜನಾ ವರದಿ", hi: "व्यवसाय योजना / प्रोजेक्ट रिपोर्ट" },
    why: {
      en: "Banks need to see what you will make or sell, the cost, and how you will repay.",
      kn: "ನೀವು ಏನು ತಯಾರಿಸುತ್ತೀರಿ ಅಥವಾ ಮಾರುತ್ತೀರಿ, ವೆಚ್ಚ ಮತ್ತು ಹೇಗೆ ಮರುಪಾವತಿಸುತ್ತೀರಿ ಎಂದು ಬ್ಯಾಂಕ್ ನೋಡಬೇಕು.",
      hi: "बैंक देखता है कि आप क्या बनाएँगे या बेचेंगे, लागत कितनी है और कर्ज़ कैसे चुकाएँगे।",
    },
    issuer: { en: "You prepare it", kn: "ನೀವೇ ಸಿದ್ಧಪಡಿಸಬೇಕು", hi: "आप स्वयं तैयार करते हैं" },
    where: {
      en: "Your bank branch or District Industries Centre (DIC) can help you prepare it",
      kn: "ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಶಾಖೆ ಅಥವಾ ಜಿಲ್ಲಾ ಕೈಗಾರಿಕಾ ಕೇಂದ್ರ (DIC) ಸಿದ್ಧಪಡಿಸಲು ಸಹಾಯ ಮಾಡಬಹುದು",
      hi: "आपकी बैंक शाखा या ज़िला उद्योग केंद्र (DIC) इसे बनाने में मदद कर सकते हैं",
    },
    prerequisites: {
      en: "Cost estimates (quotations for machines or stock).",
      kn: "ವೆಚ್ಚದ ಅಂದಾಜು (ಯಂತ್ರ ಅಥವಾ ಸರಕುಗಳ ಕೊಟೇಶನ್).",
      hi: "लागत का अनुमान (मशीन या सामान के कोटेशन)।",
    },
  },
  degree_certificate: {
    id: "degree_certificate",
    name: { en: "Degree / diploma certificate", kn: "ಪದವಿ / ಡಿಪ್ಲೊಮಾ ಪ್ರಮಾಣಪತ್ರ", hi: "डिग्री / डिप्लोमा प्रमाणपत्र" },
    why: {
      en: "Shows when you completed your degree or diploma.",
      kn: "ನೀವು ಪದವಿ ಅಥವಾ ಡಿಪ್ಲೊಮಾ ಯಾವಾಗ ಮುಗಿಸಿದಿರಿ ಎಂದು ತೋರಿಸುತ್ತದೆ.",
      hi: "दिखाता है कि आपने डिग्री या डिप्लोमा कब पूरा किया।",
    },
    issuer: { en: "Your university or board", kn: "ನಿಮ್ಮ ವಿಶ್ವವಿದ್ಯಾಲಯ ಅಥವಾ ಮಂಡಳಿ", hi: "आपका विश्वविद्यालय या बोर्ड" },
    where: {
      en: "Your college or university office",
      kn: "ನಿಮ್ಮ ಕಾಲೇಜು ಅಥವಾ ವಿಶ್ವವಿದ್ಯಾಲಯ ಕಚೇರಿ",
      hi: "आपके कॉलेज या विश्वविद्यालय का कार्यालय",
    },
    prerequisites: { en: "None.", kn: "ಯಾವುದೂ ಇಲ್ಲ.", hi: "कुछ नहीं।" },
  },
  birth_certificate: {
    id: "birth_certificate",
    name: { en: "Child's birth certificate", kn: "ಮಗುವಿನ ಜನನ ಪ್ರಮಾಣಪತ್ರ", hi: "बच्चे का जन्म प्रमाणपत्र" },
    why: {
      en: "Proves your child's age and that you are the parent.",
      kn: "ಮಗುವಿನ ವಯಸ್ಸು ಮತ್ತು ನೀವು ಪೋಷಕರು ಎಂದು ಸಾಬೀತುಪಡಿಸುತ್ತದೆ.",
      hi: "बच्चे की उम्र और आप माता-पिता हैं, यह साबित करता है।",
    },
    issuer: {
      en: "Registrar of Births and Deaths (municipality or gram panchayat)",
      kn: "ಜನನ ಮತ್ತು ಮರಣ ನೋಂದಣಾಧಿಕಾರಿ (ಪುರಸಭೆ ಅಥವಾ ಗ್ರಾಮ ಪಂಚಾಯಿತಿ)",
      hi: "जन्म एवं मृत्यु रजिस्ट्रार (नगरपालिका या ग्राम पंचायत)",
    },
    where: {
      en: "Your municipality or gram panchayat office, or online on the Civil Registration System (crsorgi.gov.in)",
      kn: "ನಿಮ್ಮ ಪುರಸಭೆ ಅಥವಾ ಗ್ರಾಮ ಪಂಚಾಯಿತಿ ಕಚೇರಿ, ಅಥವಾ ನಾಗರಿಕ ನೋಂದಣಿ ವ್ಯವಸ್ಥೆಯಲ್ಲಿ (crsorgi.gov.in) ಆನ್‌ಲೈನ್",
      hi: "आपका नगरपालिका या ग्राम पंचायत कार्यालय, या नागरिक पंजीकरण प्रणाली (crsorgi.gov.in) पर ऑनलाइन",
    },
    prerequisites: {
      en: "Hospital discharge or birth record, and parents' ID.",
      kn: "ಆಸ್ಪತ್ರೆ ಡಿಸ್ಚಾರ್ಜ್ ಅಥವಾ ಜನನ ದಾಖಲೆ, ಮತ್ತು ಪೋಷಕರ ಗುರುತಿನ ಚೀಟಿ.",
      hi: "अस्पताल का डिस्चार्ज या जन्म रिकॉर्ड, और माता-पिता का पहचान पत्र।",
    },
    officialUrl: "https://crsorgi.gov.in/",
  },
};
