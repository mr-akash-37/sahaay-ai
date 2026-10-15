import { describe, expect, it } from "vitest";
import { voiceProblemFor } from "@/components/voice/voice-button";
import { getDictionary } from "@/i18n/dictionaries";

describe("voice input problems", () => {
  it("turns browser errors into something the citizen can act on", () => {
    expect(voiceProblemFor("not-allowed")).toBe("denied");
    expect(voiceProblemFor("NotAllowedError")).toBe("denied");
    expect(voiceProblemFor("NotFoundError")).toBe("noMic");
    expect(voiceProblemFor("audio-capture")).toBe("noMic");
    expect(voiceProblemFor("no-speech")).toBe("noSpeech");
    expect(voiceProblemFor("network")).toBe("network");
    expect(voiceProblemFor("language-not-supported")).toBe("language");
    expect(voiceProblemFor("something-new")).toBe("unavailable");
    expect(voiceProblemFor("aborted")).toBeNull(); // pressing Stop is not an error
  });

  it("has every message in every language", () => {
    for (const locale of ["en", "kn", "hi"]) {
      const t = getDictionary(locale).describe;
      for (const key of ["voiceUnavailable", "voiceDenied", "voiceNoMic", "voiceNoSpeech", "voiceNetwork", "voiceLanguage"] as const) {
        expect(t[key].length, `${locale}.${key}`).toBeGreaterThan(10);
      }
    }
  });
});
