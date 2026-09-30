import { chromium } from "playwright";
import { mkdirSync, copyFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

const BASE = "http://127.0.0.1:5173";
const OUT = "/tmp/relay-demo-cemantik";
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

async function guess(page, word) {
  await page.locator(".cemantik-input").fill(word);
  await page.getByRole("button", { name: "Tester" }).click();
  await pause(550);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  mkdirSync(ART, { recursive: true });

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--window-size=1280,900"],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 860 },
    recordVideo: { dir: OUT, size: { width: 1280, height: 860 } },
  });
  const page = await context.newPage();

  await login(page);
  await page.screenshot({ path: join(ART, "cemantik_hub_card.png"), fullPage: true });

  await page.locator('a[href="/play/cemantik"]').click();
  await page.waitForURL(/cemantik/);
  await pause(900);

  await page.getByRole("button", { name: "Libre" }).click();
  await pause(400);

  for (const w of ["eau", "mer", "ocean", "soleil", "maison", "amour", "arbre", "livre"]) {
    await guess(page, w);
  }

  await page.screenshot({ path: join(ART, "cemantik_guesses.png") });

  await page.getByRole("button", { name: "Abandonner" }).click();
  await pause(400);
  const targetText = await page.locator(".cemantik-reveal strong").textContent();
  const target = (targetText || "").trim();
  if (!target) throw new Error("target not revealed");
  await guess(page, target);
  await pause(800);
  await page.screenshot({ path: join(ART, "cemantik_found.png") });

  await context.close();
  await browser.close();

  const vids = readdirSync(OUT).filter((f) => f.endsWith(".webm") || f.endsWith(".mp4"));
  if (!vids.length) throw new Error("no video");
  const src = join(OUT, vids[0]);
  const dest = join(ART, "cemantik_play_demo.webm");
  copyFileSync(src, dest);
  console.log("ok", { target, dest, shots: ["cemantik_hub_card.png", "cemantik_guesses.png", "cemantik_found.png"] });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
