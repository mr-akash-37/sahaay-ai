import { expect, test } from "@playwright/test";
import { choose, chooseFromList, ready } from "./helpers";

test.describe("citizen journeys (guest mode)", () => {
  test("farmer answers step by step → PM-KISAN eligible → roadmap", async ({ page }) => {
    await page.goto("/en/check");
    await ready(page);

    await choose(page, "Farmer");
    await page.getByPlaceholder("Age in years").fill("48");
    await page.getByRole("button", { name: "Next" }).click();
    await choose(page, "Man");
    await chooseFromList(page, "Bihar");
    await choose(page, "Village (rural)");
    await choose(page, "General / other");
    await choose(page, "₹1 – 2.5 lakh");
    await choose(page, "Yes"); // owns farmland
    await choose(page, "No"); // income tax
    await choose(page, "No"); // government job in family
    await choose(page, "No"); // daughter under 10

    await expect(page).toHaveURL(/\/en\/results$/);
    const kisan = page.getByRole("listitem").filter({ hasText: "PM-KISAN" }).first();
    await expect(kisan).toContainText("Eligible");
    await expect(page.getByRole("listitem").filter({ hasText: "PM Fasal Bima Yojana" }).first()).toContainText("Eligible");
    // Student schemes may be listed under the collapsed "don't match" section, never as a match.
    await expect(page.getByText("Post-Matric Scholarship for SC Students").filter({ visible: true })).toHaveCount(0);
    // Central schemes work in every state; the page says honestly that Bihar's own schemes aren't in Sahaay yet.
    await expect(page.getByText(/We don't have Bihar government schemes yet/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Search Bihar schemes on myScheme" })).toHaveAttribute("href", /myscheme\.gov\.in/);

    await page.getByRole("link", { name: /Your next step/ }).click();
    await expect(page).toHaveURL(/\/en\/roadmap$/);
    await expect(page.getByRole("link", { name: "Share on WhatsApp" })).toHaveAttribute("href", /^https:\/\/wa\.me\/\?text=/);
  });

  test("Kannada: describe in my own words → answers filled in", async ({ page }) => {
    await page.goto("/kn/check");
    await ready(page);
    await page.getByRole("tab", { name: "ನನ್ನ ಮಾತುಗಳಲ್ಲಿ ವಿವರಿಸುವೆ" }).click();
    await page.getByLabel("ನಿಮ್ಮ ಪರಿಸ್ಥಿತಿ").fill("ನಾನು ಮಂಡ್ಯದ 45 ವರ್ಷದ ರೈತ, 2 ಎಕರೆ ಜಮೀನು ಇದೆ. ಆದಾಯ ವರ್ಷಕ್ಕೆ 1.5 ಲಕ್ಷ.");
    await page.getByRole("button", { name: "ನನ್ನ ಪರಿಸ್ಥಿತಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ" }).click();
    await expect(page.getByText("ರೈತ", { exact: true })).toBeVisible();
    await expect(page.getByText("45", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: /ಹೌದು, ಇದು ಸರಿ/ }).click();
    // Jumps to the first question it couldn't read (gender).
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("ನಿಮ್ಮ ಲಿಂಗ ಯಾವುದು?");
  });

  test("assistant: 'I need financial support for my crops' → guided questions → schemes", async ({ page }) => {
    await page.goto("/en/assistant");
    await ready(page);
    const input = page.getByPlaceholder("Type your question or describe your situation…");
    await input.fill("I need financial support for my crops");
    await input.press("Enter");

    const log = page.getByRole("log");
    await expect(log).toContainText("I understood");
    await expect(log).toContainText("How old are you?");
    await page.getByPlaceholder("Age in years").fill("50");
    await page.getByPlaceholder("Age in years").press("Enter");

    // Keep answering the buttons the assistant offers until it shows results.
    const answers: Record<string, string> = {
      "What is your gender?": "Man",
      "Do you live in a village or in a town/city?": "Village (rural)",
      "Does your family own farmland?": "Yes",
      "Does anyone in your family pay income tax?": "No",
      "Does anyone in your family work in government service or get a government pension?": "No",
    };
    for (let i = 0; i < 12; i++) {
      if (await log.getByText("That's all I need").isVisible()) break;
      const question = (await log.locator("p.text-lg").last().textContent())?.trim() ?? "";
      if (question === "Which state or union territory do you live in?") {
        await log.getByRole("combobox").selectOption({ label: "Karnataka" });
        continue;
      }
      await log.getByRole("button", { name: answers[question] ?? "I don't know", exact: true }).last().click();
    }
    await expect(log.getByText("That's all I need")).toBeVisible();
    await expect(log.getByRole("link", { name: /PM-KISAN/ })).toBeVisible();
    await expect(log.getByText("Post-Matric")).toHaveCount(0);
  });

  test("Hindi safety question gets the 'applying is free' answer", async ({ page }) => {
    await page.goto("/hi/assistant");
    await ready(page);
    const input = page.getByPlaceholder("अपना सवाल लिखें या अपनी स्थिति बताएँ…");
    await input.fill("क्या आवेदन के लिए एजेंट को पैसे देने होंगे?");
    await input.press("Enter");
    await expect(page.getByRole("log")).toContainText("आवेदन मुफ़्त है");
  });

  test("floating 'Ask Sahaay' opens on any page and closes with Escape", async ({ page }) => {
    await page.goto("/en/schemes");
    await ready(page);
    await page.getByRole("button", { name: "Ask Sahaay" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByPlaceholder("Type your question or describe your situation…")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: "Ask Sahaay" })).toBeFocused();
  });

  test("scheme page: application tracker saves; report form opens", async ({ page }) => {
    await page.goto("/en/schemes/pm-kisan");
    await ready(page);
    await page.getByLabel("Application status").selectOption("applied");
    await page.reload();
    await ready(page);
    await expect(page.getByLabel("Application status")).toHaveValue("applied");

    await page.getByRole("button", { name: "Report wrong information" }).click();
    await page.getByLabel("What is wrong on this page?").fill("short");
    await page.getByRole("button", { name: "Send report" }).click();
    await expect(page.locator("form").getByRole("alert")).toHaveText("Please write at least 10 characters.");
  });

  test("demo: 'Try an example' → Lakshmi → her schemes", async ({ page }) => {
    await page.goto("/en");
    await ready(page);
    await page.getByRole("link", { name: "Try an example" }).first().click();
    await expect(page).toHaveURL(/\/en\/demo$/);
    await page.getByRole("button", { name: /Lakshmi, 34/ }).click();
    await expect(page).toHaveURL(/\/en\/results$/);
    for (const name of ["Gruha Lakshmi", "Shakti — free bus travel for women", "PM MUDRA Yojana (business loans)"]) {
      await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
    }
  });

  test("profile: delete my data clears saved answers", async ({ page }) => {
    await page.goto("/en/check");
    await ready(page);
    await choose(page, "Student");
    await page.goto("/en/settings");
    await ready(page);
    await expect(page.getByText("Student", { exact: true })).toBeVisible();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Delete my data" }).click();
    await expect(page.getByText("Your data has been deleted from this device.")).toBeVisible();
    await expect(page.getByText("You have no saved answers.")).toBeVisible();
  });
});
