import { chromium } from "playwright";

const BASE = "http://127.0.0.1:5173";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function login(page, username, password) {
  await page.goto(`${BASE}/auth?tab=in`, { waitUntil: "networkidle" });
  await pause(800);
  await page.getByRole("tab", { name: "Connexion" }).click();
  await pause(400);
  await page.locator("#username").fill(username);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Entrer" }).click();
  await page.waitForURL((u) => u.pathname.includes("/hub"), { timeout: 45000 });
  await pause(1000);
}

async function main() {
  const browser = await chromium.launch({
    channel: "chrome",
    headless: false,
    args: ["--window-size=1280,800", "--window-position=40,40"],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  const quit = page.getByRole("button", { name: "Quitter" });
  await page.goto(BASE);
  await pause(1000);
  if (await quit.isVisible().catch(() => false)) {
    await quit.click();
    await pause(800);
  }

  await login(page, "nova_42", "password123");
  await page.locator('a[href="/play/echo-memory"]').click();
  await pause(1200);

  // Flip several cards slowly so flips are visible
  const cards = page.locator(".mem-card");
  const count = await cards.count();
  for (let i = 0; i < Math.min(6, count); i++) {
    await cards.nth(i).click();
    await pause(700);
  }
  await pause(2000);

  await page.getByRole("navigation", { name: "Navigation" }).getByRole("link", { name: "Hub" }).click();
  await pause(800);
  await page.locator('a[href="/play/pulse-snake"]').click();
  await pause(1500);
  await page.locator(".board").scrollIntoViewIfNeeded();
  await pause(3000);

  await browser.close();
  console.log("demo_echo_classement_done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
