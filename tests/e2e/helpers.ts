import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** Waits until client-side code has hydrated (saved answers loaded from localStorage). */
export async function ready(page: Page) {
  await page.waitForLoadState("networkidle");
}

/** Fails on serious or critical accessibility problems (WCAG 2.1 A/AA rules). */
export async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const serious = results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.help} (${v.nodes.length}) → ${v.nodes[0]?.target.join(" ")}`);
  expect(serious, serious.join("\n")).toEqual([]);
}

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

/** Answers a long-list wizard question (the state) from its dropdown. */
export async function chooseFromList(page: Page, label: string) {
  await page.getByRole("combobox").selectOption({ label });
  await page.getByRole("button", { name: /^(Next|See my schemes)/ }).click();
}

/** Answers the current wizard question by clicking the option with this visible text. */
export async function choose(page: Page, label: string) {
  await page.getByRole("radio", { name: label, exact: true }).check();
  await page.getByRole("button", { name: /^(Next|See my schemes)/ }).click();
}
