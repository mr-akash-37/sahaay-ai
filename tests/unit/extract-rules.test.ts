import { describe, expect, it } from "vitest";
import { extractProfileFromText } from "@/lib/ai/extract-rules";

const read = (text: string) => extractProfileFromText(text).profile;

describe("extractProfileFromText — English", () => {
  it("reads a farmer's description", () => {
    expect(
      read("I am a 45-year-old farmer from Mandya with 2 acres of land. Our family income is about 1.5 lakh a year."),
    ).toEqual({
      occupation: "farmer",
      age: 45,
      state: "ka",
      incomeBand: "1l_2_5l",
      ownsFarmland: true,
    });
  });

  it("reads a woman starting a business", () => {
    const p = read("I'm a 32 year old woman in Bengaluru city. SC category. I want to start a new tailoring shop business, need a loan of 5 lakh.");
    expect(p.gender).toBe("female");
    expect(p.age).toBe(32);
    expect(p.areaType).toBe("urban");
    expect(p.category).toBe("sc");
    expect(p.incomeBand).toBeUndefined(); // the 5 lakh is a loan, not income
  });

  it("reads a construction worker with monthly pay", () => {
    const p = read("I am a construction worker, 28 years old, I earn 12,000 per month in Hubli");
    expect(p.occupation).toBe("unorganised_worker");
    expect(p.ownIncomeUpTo15kMonth).toBe(true);
    expect(p.incomeBand).toBe("1l_2_5l");
    expect(p.state).toBe("ka");
  });

  it("reads a student whose parents farm", () => {
    const p = read("I am a BSc student in Mysuru, my father is a farmer");
    expect(p.occupation).toBe("student");
    expect(p.educationLevel).toBe("ug");
    expect(p.parentFarmer).toBe(true);
    expect(p.ownsFarmland).toBeUndefined();
  });

  it("does not mistake 'St. Joseph's' for Scheduled Tribe", () => {
    expect(read("I study at St. Joseph's college").category).toBeUndefined();
  });

  it("reads senior citizens and other states", () => {
    const p = read("I am a retired man, 72 years, living in Chennai");
    expect(p.occupation).toBe("retired");
    expect(p.age).toBe(72);
    expect(p.gender).toBe("male");
    expect(p.state).toBe("tn");
  });

  it("finds the state from a state or city name anywhere in India", () => {
    expect(read("I am a farmer in Bihar").state).toBe("br");
    expect(read("We live in Lucknow").state).toBe("up");
    expect(read("small shop in Pune").state).toBe("mh");
    expect(read("I live in Mysuru, Karnataka").state).toBe("ka");
  });

  it("reads a BPL / Antyodaya ration card", () => {
    expect(read("I am 68, retired, we have a BPL card").bplHousehold).toBe(true);
    expect(read("मेरे पास अंत्योदय कार्ड है").bplHousehold).toBe(true);
  });

  it("does not guess when two different states are named", () => {
    expect(read("I am from Bihar but now work in Bengaluru").state).toBeUndefined();
  });

  it("reads Karnataka backward-class categories only for Karnataka", () => {
    expect(read("I am a student in Mandya, category 2A")).toMatchObject({ category: "obc", kaBackwardClass: "cat_2a" });
    const outside = read("I am an OBC student in Patna");
    expect(outside).toMatchObject({ category: "obc", state: "br" });
    expect(outside.kaBackwardClass).toBeUndefined();
  });

  it("returns nothing for unrelated text", () => {
    expect(extractProfileFromText("hello, what can you do?").fields).toEqual([]);
  });
});

describe("extractProfileFromText — Kannada", () => {
  it("reads a Kannada farmer description", () => {
    const p = read("ನಾನು ಮಂಡ್ಯದ 45 ವರ್ಷದ ರೈತ, 2 ಎಕರೆ ಜಮೀನು ಇದೆ. ನಮ್ಮ ಕುಟುಂಬದ ಆದಾಯ ವರ್ಷಕ್ಕೆ ಸುಮಾರು 1.5 ಲಕ್ಷ.");
    expect(p).toMatchObject({ occupation: "farmer", age: 45, state: "ka", ownsFarmland: true, incomeBand: "1l_2_5l" });
  });

  it("reads a Kannada woman head of family", () => {
    const p = read("ನಾನು ಗೃಹಿಣಿ, ಹಳ್ಳಿಯಲ್ಲಿ ಇದ್ದೇನೆ, ಪಡಿತರ ಚೀಟಿಯಲ್ಲಿ ಯಜಮಾನಿ ನಾನೇ");
    expect(p).toMatchObject({ occupation: "homemaker", gender: "female", areaType: "rural", womanHeadOfFamily: true });
  });
});

describe("extractProfileFromText — Hindi", () => {
  it("reads a Hindi job seeker", () => {
    const p = read("मैं 24 साल का बेरोजगार हूँ, बेंगलुरु में रहता हूँ, डिग्री पूरी की है");
    expect(p).toMatchObject({ occupation: "job_seeker", age: 24, state: "ka" });
  });

  it("reads a Hindi artisan", () => {
    const p = read("मैं गाँव का बढ़ई हूँ, उम्र 38, महीने के 9000 रुपये कमाता हूँ");
    expect(p).toMatchObject({ occupation: "artisan", age: 38, areaType: "rural", ownIncomeUpTo15kMonth: true });
  });

  it("reads Hindi state and city names as whole words", () => {
    expect(read("मैं पटना में रहता हूँ").state).toBe("br");
    expect(read("मैं उत्तर प्रदेश का किसान हूँ").state).toBe("up");
    // "असमर्थ" (unable) must not be read as Assam.
    expect(read("मैं काम करने में असमर्थ हूँ").state).toBeUndefined();
  });
});
