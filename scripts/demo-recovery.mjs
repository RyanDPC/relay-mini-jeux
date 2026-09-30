import { chromium } from "playwright";

const BASE = "http://127.0.0.1:5173";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const user = `rc_${Date.now().toString(36).slice(-6)}`;

async function main() {
  const browser = await chromium.launch({
    channel: "chrome",
    headless: false,
    args: ["--window-size=1100,800", "--window-position=40,40"],
  });
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });

  await page.goto(`${BASE}/auth`);
  await pause(800);
  await page.getByRole("tab", { name: "Inscription" }).click();
  await page.locator("#username").fill(user);
  await page.locator("#password").fill("password123");
  await page.getByRole("button", { name: "Rejoindre RELAY" }).click();
  await page.waitForSelector(".recovery-code", { timeout: 30000 });
  await pause(2500);
  const code = (await page.locator(".recovery-code").innerText()).trim();
  await page.getByRole("button", { name: /J’ai noté|J'ai noté/ }).click();
  await page.waitForURL("**/hub", { timeout: 20000 });
  await pause(800);
  await page.getByRole("button", { name: "Quitter" }).click();
  await pause(800);

  await page.goto(`${BASE}/auth?tab=recover`);
  await pause(600);
  await page.getByRole("tab", { name: "Code" }).click();
  await page.locator("#username").fill(user);
  await page.locator("#recovery").fill(code);
  await page.locator("#newpass").fill("password456");
  await page.getByRole("button", { name: "Réinitialiser" }).click();
  await page.waitForSelector(".recovery-code", { timeout: 30000 });
  await pause(2500);
  await page.getByRole("button", { name: /J’ai noté|J'ai noté/ }).click();
  await page.waitForURL("**/hub", { timeout: 20000 });
  await pause(1500);

  await browser.close();
  console.log("demo_recovery_done", user);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
