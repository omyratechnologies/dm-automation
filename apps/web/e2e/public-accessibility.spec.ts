import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const width of [320, 375, 414, 768, 1024, 1440]) {
  test(`public landing page reflows at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
    expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
  });
}

test("public landing page has no serious or critical axe findings", async ({ page }) => {
  await page.goto("/");
  // Run axe after the intentional entrance transition reaches its stable UI
  // state; otherwise it measures partially transparent text mid-animation.
  await expect(page.locator("header")).toHaveCSS("opacity", "1");
  await expect(page.locator("h1").first()).toHaveCSS("opacity", "1");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")).toEqual([]);
});
