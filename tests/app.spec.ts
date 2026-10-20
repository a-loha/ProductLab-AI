import { test, expect, chromium } from "@playwright/test";
import type { Page } from "@playwright/test";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { evidenceSources, definitions } from "../src/mission-content";
import { STORAGE_KEY } from "../src/storage";
import { newWorkspace } from "../src/mission";
import {
  newSession,
  recordDecision,
  recordLessonAnswer,
} from "../src/simulation";
import { completeMission } from "./mission-fixture";

async function area(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Mission working areas" })
    .getByRole("button", { name, exact: true })
    .click();
}
async function pin(page: Page) {
  await page
    .getByRole("button", { name: "Add to evidence notebook", exact: false })
    .first()
    .click();
}
async function research(page: Page) {
  await area(page, "User Research");
  await page
    .getByRole("combobox", { name: /Classify: A routine/ })
    .selectOption("observed");
  await page
    .getByRole("combobox", { name: /Classify: “The price/ })
    .selectOption("hypothesis");
  await page
    .getByRole("combobox", { name: /Classify: An expectation/ })
    .selectOption("observed");
  await pin(page);
  await pin(page);
}
async function backlog(page: Page) {
  await area(page, "Product Backlog");
  for (const title of [
    "Repair Android routine saving",
    "Strengthen cohort and rollout monitoring",
    "Recruit contrasting user interviews",
  ])
    await page.getByRole("checkbox", { name: new RegExp(title) }).check();
}
async function inbox(page: Page) {
  await area(page, "Team Inbox");
  const messages = page.getByRole("navigation", { name: "Team messages" });
  for (const role of [
    "CEO",
    "Product Analyst",
    "Growth Lead",
    "Engineering Lead",
  ]) {
    await messages.getByRole("button", { name: new RegExp(role) }).click();
    await pin(page);
    if (role === "CEO") {
      await page
        .getByRole("combobox", { name: "How will you frame the situation?" })
        .selectOption("separate");
      await page
        .getByRole("combobox", { name: "What will you ask for and commit to?" })
        .selectOption("checkpoint");
    }
  }
}
async function analytics(page: Page) {
  await area(page, "Analytics");
  await pin(page);
  await page.getByLabel("Dimension", { exact: true }).selectOption("combined");
  await pin(page);
  await pin(page);
  await page
    .getByRole("combobox", { name: "Affected joint segment" })
    .selectOption("paid_android");
  await page
    .getByLabel("Mix contribution (percentage points)", { exact: true })
    .fill("4");
  await page
    .getByLabel("Within-segment contribution (percentage points)", {
      exact: true,
    })
    .fill("3");
  const tabs = page.getByRole("navigation", { name: "Analytics views" });
  await tabs.getByRole("button", { name: "Acquisition & funnel" }).click();
  await pin(page);
  await page
    .getByLabel("Organic test allocation", { exact: true })
    .selectOption("1");
  await page
    .getByLabel("Partner referrals test allocation", { exact: true })
    .selectOption("1");
  await page
    .getByRole("combobox", { name: "Acquisition decision rationale" })
    .selectOption("quality");
  await tabs.getByRole("button", { name: "Subscription economics" }).click();
  await pin(page);
  await page
    .getByRole("combobox", { name: "Your billing vs. activity interpretation" })
    .selectOption("mrr_up");
}
async function brief(page: Page) {
  await area(page, "Decision Brief");
  await page
    .getByRole("combobox", { name: "What problem are you solving?" })
    .selectOption("value_gap");
  for (const source of evidenceSources)
    await page
      .getByRole("checkbox", { name: source.label, exact: true })
      .check();
  await page
    .getByRole("checkbox", { name: /The Android save defect may/ })
    .check();
  await page
    .getByRole("checkbox", { name: /Changed acquisition intent may/ })
    .check();
  await page
    .getByRole("combobox", { name: "How certain are these explanations?" })
    .selectOption("unquantified");
  await page
    .getByRole("combobox", { name: "What are you deliberately trading off?" })
    .selectOption("bounded");
  await page
    .getByRole("combobox", { name: /^Success metric/ })
    .selectOption("save_then_d30");
  await page
    .getByRole("combobox", { name: /^Guardrail/ })
    .selectOption("crash_checkout");
  await page
    .getByRole("combobox", { name: "Ownership", exact: true })
    .selectOption("shared");
  await page
    .getByRole("combobox", { name: "Checkpoint and readout" })
    .selectOption("staged");
  await page
    .getByLabel("Optional reflection · not automatically evaluated")
    .fill(
      "I will test the mechanism and separate acquisition mix from causal impact.",
    );
}

test("complete a non-linear mission, deliver a brief, and preserve frozen review across reloads", async ({
  page,
  context,
}) => {
  const errors: string[] = [],
    external: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (
      request.url().startsWith("http") &&
      !request.url().startsWith("http://127.0.0.1:4173/")
    )
      external.push(request.url());
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Retention Crisis", exact: true }),
  ).toBeVisible();
  await research(page);
  await backlog(page);
  await inbox(page);
  await analytics(page);
  await brief(page);
  await expect(page.getByText("$120,000", { exact: true })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download draft (.md)", exact: true })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("pulse-decision-brief.md");
  const markdown = readFileSync((await download.path())!, "utf8");
  expect(markdown).toContain("Draft — no cash spent");
  expect(markdown).toContain("Repair Android routine saving");
  await page
    .getByRole("button", { name: "Submit Decision Brief", exact: true })
    .click();
  await expect(
    page.getByText("Mission completed", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("8 of 8 competency areas demonstrated", { exact: false }),
  ).toBeVisible();
  await expect(page.getByText("$108,700", { exact: true })).toBeVisible();
  await expect(page.getByText("21%", { exact: true })).toBeVisible();
  await expect(page.getByText("$48,000", { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("8 of 8 competency areas demonstrated", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Product areas" })
    .getByRole("button", { name: "Simulation Workspace" })
    .click();
  await area(page, "Decision Brief");
  await expect(
    page.getByRole("button", { name: "Submit Decision Brief", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("combobox", { name: "What problem are you solving?" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "About Guardrail", exact: true })
    .click();
  await expect(page.getByRole("tooltip")).toContainText(
    definitions.guardrail.definition,
  );
  await page.keyboard.press("Escape");
  const reopened = await context.newPage();
  await reopened.goto("/");
  await expect(reopened.getByText("This brief is committed.")).toBeVisible();
  const save = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    STORAGE_KEY,
  );
  expect(save.version).toBe(2);
  expect(save.mission.submission.draft.brief.evidence).toHaveLength(11);
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test("tools can be used in a second independent order with no automatic lessons or costs", async ({
  page,
}) => {
  await page.goto("/");
  await backlog(page);
  await analytics(page);
  await inbox(page);
  await research(page);
  await expect(
    page.getByRole("navigation", { name: "Mission working areas" }),
  ).toBeVisible();
  await expect(page.getByText("$120,000", { exact: true })).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(0);
  await brief(page);
  await expect(
    page.getByRole("button", { name: "Submit Decision Brief" }),
  ).toBeEnabled();
});

test("changing dimensions reveals reconciled rates and source-specific snapshots", async ({
  page,
}) => {
  await page.goto("/");
  await area(page, "Analytics");
  const table = page.getByRole("region", { name: "Retention comparison" });
  await expect(table).toContainText("1,000 · 280 · 28%");
  await expect(table).toContainText("1,000 · 210 · 21%");
  await page.getByLabel("Dimension", { exact: true }).selectOption("platform");
  await expect(table).toContainText("Android");
  await expect(table).toContainText("500 · 90 · 18%");
  await page.getByLabel("Dimension", { exact: true }).selectOption("combined");
  await expect(table).toContainText("Paid social · Android");
  await expect(table).toContainText("300 · 15 · 5%");
  await page
    .getByLabel("Measurement window", { exact: true })
    .selectOption("latest");
  await expect(table).not.toContainText("Previous cohort");
  await expect(table).toContainText("Latest cohort");
});

test("priorities can be reordered and capacity/budget stop an unexecutable commitment", async ({
  page,
}) => {
  const state = newWorkspace();
  state.mission = completeMission();
  await page.addInitScript(
    ({ key, state }) => localStorage.setItem(key, JSON.stringify(state)),
    { key: STORAGE_KEY, state },
  );
  await page.goto("/");
  await area(page, "Product Backlog");
  await page
    .getByRole("button", {
      name: "Move Strengthen cohort and rollout monitoring up",
      exact: true,
    })
    .click();
  await expect(page.locator(".priority-list li").first()).toContainText(
    "Strengthen cohort",
  );
  await page.getByRole("checkbox", { name: /Redesign all onboarding/ }).check();
  await expect(page.locator(".budget-summary")).toContainText("Reduce scope");
  await area(page, "Decision Brief");
  await expect(
    page.getByRole("button", { name: "Submit Decision Brief", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText("Bring the plan within eight engineering days."),
  ).toBeVisible();
  await expect(page.getByText("$120,000", { exact: true })).toBeVisible();
});

test("brief citations require collected sources and checkpoint choices are transparent", async ({
  page,
}) => {
  await page.goto("/");
  await area(page, "Decision Brief");
  await expect(
    page.getByText("Your notebook is empty.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Submit Decision Brief" }),
  ).toBeDisabled();
  await page
    .getByText("View the explicit Mission Review rubric", { exact: true })
    .click();
  for (const title of [
    "Product Strategy",
    "Stakeholder Management",
    "Product Leadership",
  ])
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
  await expect(
    page.getByRole("checkbox", {
      name: "September subscription ledger",
      exact: true,
    }),
  ).toHaveCount(0);
});

test("metric help supports hover, keyboard dismissal and toggle without leaving the workspace", async ({
  page,
}) => {
  await page.goto("/");
  const help = page.getByRole("button", { name: "About MRR", exact: true });
  await help.hover();
  await expect(page.getByRole("tooltip")).toContainText(
    definitions.mrr.definition,
  );
  await page.getByRole("tooltip").hover();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await page
    .getByRole("heading", { name: "Retention Crisis", exact: true })
    .hover();
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await help.focus();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await expect(help).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.getByRole("tooltip")).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});

test("Cheat Sheet shares definitions, keeps context, traps focus, and returns it on Escape", async ({
  page,
}) => {
  await page.goto("/");
  await area(page, "Product Backlog");
  await page
    .getByRole("checkbox", { name: /Repair Android routine saving/ })
    .check();
  const trigger = page.getByRole("button", {
    name: "Cheat Sheet",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Cheat Sheet", exact: true });
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("searchbox", { name: "Search Cheat Sheet" })
    .fill("LTV");
  await expect(dialog).toContainText(definitions.ltv.caveat);
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() => !!document.activeElement?.closest("dialog")),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(
    page.getByRole("checkbox", { name: /Repair Android routine saving/ }),
  ).toBeChecked();
  await expect(
    page.getByRole("heading", { name: "Product Backlog", exact: true }),
  ).toBeVisible();
});

test.describe("touch access", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
  test("metric help opens on tap and closes on an outside tap", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "About CAC", exact: true }).tap();
    await expect(page.getByRole("tooltip")).toContainText(
      definitions.cac.formula,
    );
    await page
      .getByRole("heading", { name: "Retention Crisis", exact: true })
      .tap();
    await expect(page.getByRole("tooltip")).toHaveCount(0);
  });
});

test("v1 migration preserves historic business outcomes and resumes optional learning", async ({
  page,
}) => {
  let old = recordDecision(newSession(), "feature");
  old = recordLessonAnswer(old, "symptom");
  await page.addInitScript(
    ({ key, old }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(old));
    },
    { key: STORAGE_KEY, old },
  );
  await page.goto("/");
  await expect(
    page.getByText("Your previous decisions, business outcomes", {
      exact: false,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "My Development", exact: true })
    .click();
  await expect(
    page.getByText("Your earlier decisions are preserved."),
  ).toBeVisible();
  await expect(page.getByText("$108,000", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Resume optional practice", exact: true })
    .click();
  await expect(
    page.getByText("You found the diagnostic signal."),
  ).toBeVisible();
  await expect(page.getByRole("radio").first()).toBeDisabled();
  await page.reload();
  const save = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    STORAGE_KEY,
  );
  expect(save.version).toBe(2);
  expect(save.practice.decisions).toEqual(old.decisions);
  expect(save.practice.lesson.answers).toEqual(old.lesson.answers);
});

for (const raw of ["{broken", JSON.stringify({ version: 99 })])
  test(`invalid save is recovered safely: ${raw}`, async ({ page }) => {
    await page.addInitScript(({ key, raw }) => localStorage.setItem(key, raw), {
      key: STORAGE_KEY,
      raw,
    });
    await page.goto("/");
    await expect(
      page.getByText("The saved workspace was unreadable", { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Retention Crisis", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        (key) => localStorage.getItem(`${key}.recovery`),
        STORAGE_KEY,
      ),
    ).toBe(raw);
  });

test("blocked storage does not prevent investigation", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw Error("Blocked");
    };
    Storage.prototype.setItem = () => {
      throw Error("Blocked");
    };
  });
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("storage is unavailable");
  await area(page, "Team Inbox");
  await pin(page);
  await expect(
    page.getByRole("button", { name: "In evidence notebook", exact: true }),
  ).toBeDisabled();
});

test("restart requires confirmation and keeps previous optional practice", async ({
  page,
}) => {
  const state = newWorkspace(recordLessonAnswer(newSession(), "symptom"));
  state.mission = completeMission();
  await page.addInitScript(
    ({ key, state }) => localStorage.setItem(key, JSON.stringify(state)),
    { key: STORAGE_KEY, state },
  );
  await page.goto("/");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Restart workspace mission" }).click();
  let saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    STORAGE_KEY,
  );
  expect(saved.mission.draft.initiatives).toHaveLength(3);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Restart workspace mission" }).click();
  saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    STORAGE_KEY,
  );
  expect(saved.mission.draft.initiatives).toEqual([]);
  expect(saved.mission.notebook).toEqual([]);
  expect(saved.practice.lesson.answers.understand).toBe("symptom");
});

test("optional lesson and transfer remain usable without forcing them into the mission", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "PM Playbook", exact: true }).click();
  await expect(page.getByRole("radio")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Open optional practice", exact: true })
    .click();
  for (const answer of [
    "There is a signal to verify",
    "Validate events and mature cohorts",
    "Paid-social Android: its rate fell",
  ]) {
    await page.getByRole("radio", { name: new RegExp(answer) }).check();
    await page.getByRole("button", { name: "Check my reasoning" }).click();
    await page
      .getByRole("button", {
        name: /Continue to (the next step|the transfer challenge)/,
      })
      .click();
  }
  await page.getByRole("radio", { name: /Validate D7 events/ }).check();
  await page.getByRole("radio", { name: /Mature D7 cohorts matched/ }).check();
  await page
    .getByRole("radio", { name: /If a within-segment drop aligns/ })
    .check();
  await page.getByRole("button", { name: "Check transfer challenge" }).click();
  await expect(
    page.getByText("Transfer passed", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Return to workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Retention Crisis", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("$120,000", { exact: true })).toBeVisible();
});

test("workspace draft survives a full browser close and relaunch", async ({}, testInfo) => {
  const profile = mkdtempSync(join(tmpdir(), "productlab-workspace-")),
    options = { ...testInfo.project.use.launchOptions, headless: true };
  let context = await chromium.launchPersistentContext(profile, options);
  try {
    let page = await context.newPage();
    await page.goto("http://127.0.0.1:4173/");
    await research(page);
    await backlog(page);
    await context.close();
    context = await chromium.launchPersistentContext(profile, options);
    page = await context.newPage();
    await page.goto("http://127.0.0.1:4173/");
    await expect(
      page.getByRole("checkbox", { name: /Repair Android routine saving/ }),
    ).toBeChecked();
    await area(page, "User Research");
    await expect(
      page.getByRole("combobox", { name: /Classify: A routine/ }),
    ).toHaveValue("observed");
    await expect(
      page.getByRole("button", { name: "In evidence notebook" }),
    ).toHaveCount(2);
  } finally {
    await context.close();
    rmSync(profile, { recursive: true, force: true });
  }
});

test("all working areas, data views, and the Cheat Sheet fit a mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  for (const name of [
    "Mission Brief",
    "Analytics",
    "User Research",
    "Team Inbox",
    "Product Backlog",
    "Decision Brief",
  ]) {
    await area(page, name);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await area(page, "Analytics");
  for (const name of ["Acquisition & funnel", "Subscription economics"]) {
    await page
      .getByRole("navigation", { name: "Analytics views" })
      .getByRole("button", { name })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.getByRole("button", { name: "Cheat Sheet", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
