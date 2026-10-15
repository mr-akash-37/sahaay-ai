import { expect, test } from "@playwright/test";
import { expectAccessible, expectNoHorizontalScroll, ready } from "./helpers";

const pages = ["", "/check", "/results", "/roadmap", "/assistant", "/schemes", "/schemes/pm-kisan", "/help", "/settings", "/demo"];

test.describe("every page loads, fits the screen and is accessible", () => {
  for (const locale of ["en", "kn", "hi"] as const) {
    for (const path of pages) {
      test(`/${locale}${path}`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(e.message));
        const response = await page.goto(`/${locale}${path}`);
        expect(response?.status()).toBe(200);
        await ready(page);
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.locator("main h1").first()).toBeVisible();
        await expectNoHorizontalScroll(page);
        expect(errors).toEqual([]);
        if (locale === "en") await expectAccessible(page);
      });
    }
  }
});

test("/ redirects to a language", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/(en|kn|hi)$/);
});

test("unknown pages show a translated 404", async ({ page }) => {
  const response = await page.goto("/kn/no-such-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "ಪುಟ ಕಂಡುಬಂದಿಲ್ಲ" })).toBeVisible();
});

test("language switcher keeps you on the same page", async ({ page }) => {
  await page.goto("/en/help");
  await ready(page);
  await page.getByRole("link", { name: "हिन्दी" }).first().click();
  await expect(page).toHaveURL(/\/hi\/help$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("अपने पास मदद पाएँ");
});

test("security headers are sent", async ({ request }) => {
  const response = await request.get("/en");
  const headers = response.headers();
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
});

test("installable app files are served", async ({ request }) => {
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBe(true);
  expect((await manifest.json()).short_name).toBe("Sahaay AI");
  const icon = await request.get("/app-icon/512");
  expect(icon.headers()["content-type"]).toBe("image/png");
  expect((await request.get("/sw.js")).ok()).toBe(true);
});
