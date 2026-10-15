import { describe, expect, it } from "vitest";
import { reachableFrom } from "@/lib/supabase/browser";

describe("reachableFrom", () => {
  it("uses a local database only when the page is also opened on this computer", () => {
    expect(reachableFrom("http://127.0.0.1:54321", "localhost")).toBe(true);
    expect(reachableFrom("http://127.0.0.1:54321", "127.0.0.1")).toBe(true);
    // A phone opening the app through ngrok must not call its own "localhost".
    expect(reachableFrom("http://127.0.0.1:54321", "silliness-clicker.ngrok-free.dev")).toBe(false);
  });

  it("always uses a cloud database", () => {
    expect(reachableFrom("https://abcd.supabase.co", "sahaay-ai.vercel.app")).toBe(true);
    expect(reachableFrom("https://abcd.supabase.co", "localhost")).toBe(true);
  });

  it("rejects a malformed address", () => {
    expect(reachableFrom("not a url", "localhost")).toBe(false);
  });
});
