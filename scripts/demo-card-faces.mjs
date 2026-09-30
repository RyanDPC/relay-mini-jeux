import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join } from "path";

const BASE = "http://127.0.0.1:5173";
const ART = "/opt/cursor/artifacts";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function login(page) {
  await page.goto(`${BASE}/auth?tab=in`, { waitUntil: "networkidle" });
  await pause(500);
  const quit = page.getByRole("button", { name: "Quitter" });
  if (await quit.isVisible().catch(() => false)) {
    await quit.click();
    await pause(600);
    await page.goto(`${BASE}/auth?tab=in`, { waitUntil: "networkidle" });
  }
  await page.getByRole("tab", { name: "Connexion" }).click().catch(() => {});
  await page.locator("#username").fill("nova_42");
  await page.locator("#password").fill("password123");
  await page.getByRole("button", { name: "Entrer" }).click();
  await page.waitForURL(/\/hub/, { timeout: 45000 });
  await pause(800);
}

async function main() {
  mkdirSync(ART, { recursive: true });
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--window-size=1280,900"],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  await login(page);

  await page.locator('a[href="/play/solitaire"]').click();
  await pause(1200);
  await page.screenshot({ path: join(ART, "cards_solitaire_face_verso.png") });

  await page.getByRole("navigation", { name: "Navigation" }).getByRole("link", { name: "Hub" }).click();
  await pause(500);
  await page.locator('a[href="/play/blackjack"]').click();
  await pause(700);
  await page.getByRole("button", { name: "Distribuer" }).click();
  await pause(900);
  await page.screenshot({ path: join(ART, "cards_blackjack_face_verso.png") });

  await page.getByRole("navigation", { name: "Navigation" }).getByRole("link", { name: "Hub" }).click();
  await pause(500);
  await page.locator('a[href="/play/uno"]').click();
  await pause(1800);
  await page.screenshot({ path: join(ART, "cards_uno_face_verso.png") });

  await browser.close();
  console.log("card_design_shots_ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
