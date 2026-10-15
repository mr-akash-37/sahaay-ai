import { describe, expect, it } from "vitest";
import { classifySendLinkError, cleanEmail } from "@/lib/supabase/send-link";

describe("cleanEmail", () => {
  it("removes stray characters people type by accident", () => {
    expect(cleanEmail("akash@gmail.com\\")).toBe("akash@gmail.com");
    expect(cleanEmail("  Akash@Gmail.com. ")).toBe("akash@gmail.com");
    expect(cleanEmail("akash@gmail.com,")).toBe("akash@gmail.com");
  });

  it("still rejects addresses that are really wrong", () => {
    expect(cleanEmail("akash@gmail")).toBeNull();
    expect(cleanEmail("akash gmail.com")).toBeNull();
    expect(cleanEmail("")).toBeNull();
  });
});

describe("sign-in link errors", () => {
  it("explains each kind of failure", () => {
    expect(classifySendLinkError(null)).toBe("sent");
    expect(classifySendLinkError({ name: "AuthRetryableFetchError", status: 0, message: "Failed to fetch" })).toBe("unavailable");
    expect(classifySendLinkError({ status: 429, message: "email rate limit exceeded" })).toBe("rateLimited");
    expect(classifySendLinkError({ status: 500, message: "Error sending magic link email" })).toBe("error");
  });
});
