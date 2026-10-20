import { test, expect, chromium } from "@playwright/test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import { STORAGE_KEY } from "../src/storage";

async function choose(page: Page, text: string) {
  await page.getByRole("radio", { name: text, exact: false }).check();
}
async function decide(page: Page, text: string) {
  await choose(page, text);
  await page.getByRole("button", { name: "Make this decision" }).click();
}
async function lesson(page: Page) {
  await choose(page, "There is a signal to verify");
  await page.getByRole("button", { name: "Check my reasoning" }).click();
  await page.getByRole("button", { name: "Continue to the next step" }).click();
  await choose(page, "Validate events and mature cohorts");
  await page.getByRole("button", { name: "Check my reasoning" }).click();
  await page.getByRole("button", { name: "Continue to the next step" }).click();
  await choose(page, "Paid-social Android: its rate fell");
  await page.getByRole("button", { name: "Check my reasoning" }).click();
  await page
    .getByRole("button", { name: "Continue to the transfer challenge" })
    .click();
}
async function transfer(page: Page, passing = true) {
  await choose(page, "Validate D7 events");
  await choose(
    page,
    passing ? "Mature D7 cohorts matched" : "Overall weekly active users",
  );
  await choose(page, "If a within-segment drop aligns");
  await page
    .getByLabel("Your reflection")
    .fill(
      "I would separate acquisition mix from a within-segment release effect.",
    );
  await page.getByRole("button", { name: "Check transfer challenge" }).click();
}

test("complete adaptive loop persists across reloads and a reopened browser tab", async ({
  page,
  context,
}) => {
  const errors: string[] = [],
    external: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:4173/"))
      external.push(request.url());
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Small decisions. Lasting judgment." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Continue Simulation", exact: true })
    .click();
  await decide(page, "Build a streak feature immediately");
  await expect(
    page.getByRole("region", { name: "Decision feedback" }),
  ).toContainText("Solution-first thinking");
  await expect(page.getByText("$108,000", { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Practice this gap" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Practice this gap" }).click();
  await lesson(page);
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Transfer challenge: a D7 onboarding decline",
    }),
  ).toBeVisible();
  await transfer(page, false);
  await expect(
    page.getByText("Transfer not yet passed", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Lesson steps" })
    .getByRole("button", { name: "Understand the problem" })
    .click();
  await page
    .getByRole("button", { name: "Progress & Feedback", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Retry the transfer challenge" })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Transfer challenge: a D7 onboarding decline",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Try the challenge again" }).click();
  await transfer(page, true);
  await expect(
    page.getByText("Transfer passed", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Continue Simulation", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Segment Investigation", exact: true }),
  ).toBeVisible();
  await decide(page, "Investigate paid social: both mix and quality changed");
  await expect(
    page.getByRole("region", { name: "Decision feedback" }),
  ).toContainText("composition explains 4 percentage points");
  await page
    .getByRole("button", { name: "Continue to Product Decision" })
    .click();
  await decide(page, "Repair the save defect and stage a measured rollout");
  await page
    .getByRole("button", { name: "Complete this simulation cycle" })
    .click();
  await expect(page.getByText("$101,000", { exact: true })).toBeVisible();
  await expect(page.getByText("21%", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Review decisions & progress" })
    .click();
  await expect(page.getByText("Passed · latest attempt")).toBeVisible();
  await expect(page.locator(".journal-entry")).toHaveCount(3);
  const reopened = await context.newPage();
  await reopened.goto("/");
  await expect(reopened.locator(".journal-entry")).toHaveCount(3);
  await expect(reopened.getByText("Passed · latest attempt")).toBeVisible();
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test("well-supported decisions keep the lesson optional and preserve observed retention", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Continue Simulation", exact: true })
    .click();
  await decide(page, "Verify the signal, then segment cohorts");
  await expect(
    page.getByRole("button", { name: "Practice this gap" }),
  ).toHaveCount(0);
  await expect(page.getByText("$118,500", { exact: true })).toBeVisible();
  await expect(page.getByText("21%", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Continue to Segment Investigation" })
    .click();
  await expect(page.getByRole("table")).toContainText("1,000 · 210");
});

for (const raw of ["{broken", JSON.stringify({ version: 99 })]) {
  test(`unreadable save recovers: ${raw}`, async ({ page }) => {
    await page.addInitScript(({ key, raw }) => localStorage.setItem(key, raw), {
      key: STORAGE_KEY,
      raw,
    });
    await page.goto("/");
    await expect(
      page.getByText("The saved progress was unreadable", { exact: false }),
    ).toBeVisible();
    await expect(page.getByText("$120,000", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Dismiss storage notice" }).click();
    await expect(
      page.getByText("The saved progress was unreadable", { exact: false }),
    ).toHaveCount(0);
  });
}

test("storage failure is visible while decisions remain playable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Blocked", "SecurityError");
    };
    Storage.prototype.getItem = () => {
      throw new DOMException("Blocked", "SecurityError");
    };
  });
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText(
    "Progress cannot be saved",
  );
  await page
    .getByRole("button", { name: "Continue Simulation", exact: true })
    .click();
  await decide(page, "Verify the signal, then segment cohorts");
  await expect(page.getByText("$118,500", { exact: true })).toBeVisible();
});

test("restart can be cancelled and then resets all saved progress", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Continue Simulation", exact: true })
    .click();
  await decide(page, "Build a streak feature immediately");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page
    .getByRole("button", { name: "Restart simulation", exact: true })
    .click();
  await expect(page.getByText("$108,000", { exact: true })).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Restart simulation", exact: true })
    .click();
  await expect(page.getByText("$120,000", { exact: true })).toBeVisible();
  const stored = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    STORAGE_KEY,
  );
  expect(stored.decisions).toEqual([]);
  expect(stored.transferAttempts).toEqual([]);
  expect(stored.lesson.answers).toEqual({});
});

test("lesson state and first checked answer survive a reload", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Personalized Learning", exact: true })
    .click();
  await choose(page, "Subscription revenue must have fallen");
  await page.getByRole("button", { name: "Check my reasoning" }).click();
  await expect(
    page.getByText("A useful opportunity to reconsider."),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("A useful opportunity to reconsider."),
  ).toBeVisible();
  await expect(page.getByRole("radio").first()).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Transfer challenge", exact: false }),
  ).toBeDisabled();
});

test("radio choices support keyboard interaction", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Continue Simulation", exact: true })
    .click();
  const first = page.getByRole("radio").first();
  await first.focus();
  await page.keyboard.press("Space");
  await expect(first).toBeChecked();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("radio").nth(1)).toBeChecked();
  await page.getByRole("button", { name: "Make this decision" }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("region", { name: "Decision feedback" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Decision feedback" }),
  ).toBeFocused();
});

test("confirmed progress survives a full browser close and relaunch", async ({}, testInfo) => {
  const profile = mkdtempSync(join(tmpdir(), "productlab-browser-profile-"));
  const options = { ...testInfo.project.use.launchOptions, headless: true };
  let context = await chromium.launchPersistentContext(profile, options);
  try {
    let page = await context.newPage();
    await page.goto("http://127.0.0.1:4173/");
    await page
      .getByRole("button", { name: "Continue Simulation", exact: true })
      .click();
    await decide(page, "Build a streak feature immediately");
    await page.getByRole("button", { name: "Practice this gap" }).click();
    await lesson(page);
    await transfer(page, true);
    await expect(
      page.getByText("Transfer passed", { exact: true }),
    ).toBeVisible();
    await context.close();
    context = await chromium.launchPersistentContext(profile, options);
    page = await context.newPage();
    await page.goto("http://127.0.0.1:4173/");
    await expect(
      page.getByText("Transfer passed", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("button", { name: "Dashboard", exact: true })
      .click();
    await expect(page.getByText("$108,000", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Transfer passed", { exact: true }),
    ).toBeVisible();
  } finally {
    await context.close();
    rmSync(profile, { recursive: true, force: true });
  }
});

test("all four views and the lesson fit a mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  for (const label of [
    "Dashboard",
    "Simulation",
    "Personalized Learning",
    "Progress & Feedback",
  ]) {
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("button", { name: label, exact: true })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page
    .getByRole("button", { name: "Personalized Learning", exact: true })
    .click();
  await lesson(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
