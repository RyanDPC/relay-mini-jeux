import { chromium } from "playwright";
import { mkdirSync, copyFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

const BASE = "http://127.0.0.1:5173";
const OUT = "/tmp/relay-demo-games";
const ARTIFACTS = "/opt/cursor/artifacts";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function login(page, username, password) {
  await page.goto(`${BASE}/auth?tab=in`, { waitUntil: "networkidle" });
  await pause(600);
  const quit = page.getByRole("button", { name: "Quitter" });
  if (await quit.isVisible().catch(() => false)) {
    await quit.click();
    await pause(700);
    await page.goto(`${BASE}/auth?tab=in`, { waitUntil: "networkidle" });
    await pause(500);
  }
  await page.getByRole("tab", { name: "Connexion" }).click().catch(() => {});
  await pause(250);
  await page.locator("#username").fill(username);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Entrer" }).click();
  await page.waitForURL((u) => u.pathname.includes("/hub"), { timeout: 45000 });
  await pause(1000);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  mkdirSync(ARTIFACTS, { recursive: true });

  const browser = await chromium.launch({
    channel: "chrome",
    headless: false,
    args: ["--window-size=1280,860", "--window-position=60,40"],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: OUT, size: { width: 1280, height: 800 } },
  });
  const page = await context.newPage();

  await login(page, "nova_42", "password123");
  await page.screenshot({ path: join(ARTIFACTS, "demo_hub_catalogue.png"), fullPage: true });
  await pause(1200);

  // Ash Circuit
  await page.locator('a[href="/play/ash-circuit"]').click();
  await page.waitForURL(/ash-circuit/);
  await pause(800);
  await page.getByRole("button", { name: /Go|Reset/ }).click();
  await pause(500);
  for (let i = 0; i < 8; i++) {
    await page.keyboard.down(i % 2 === 0 ? "ArrowLeft" : "ArrowRight");
    await pause(200);
    await page.keyboard.up(i % 2 === 0 ? "ArrowLeft" : "ArrowRight");
    if (i % 3 === 0) {
      await page.keyboard.down("Shift");
      await pause(350);
      await page.keyboard.up("Shift");
    }
    if (i % 4 === 0) {
      await page.keyboard.down("Space");
      await pause(250);
      await page.keyboard.up("Space");
    }
    await page.keyboard.press("KeyF");
    await pause(400);
  }
  await pause(1500);
  await page.screenshot({ path: join(ARTIFACTS, "demo_ash_circuit_play.png") });
  await pause(800);

  // Split Voltage
  await page.getByRole("navigation", { name: "Navigation" }).getByRole("link", { name: "Hub" }).click();
  await pause(700);
  await page.locator('a[href="/play/split-voltage"]').click();
  await page.waitForURL(/split-voltage/);
  await pause(700);
  await page.getByRole("button", { name: /Duel|Reset/ }).click();
  await pause(400);
  for (let i = 0; i < 12; i++) {
    const keys = ["KeyW", "KeyA", "KeyS", "KeyD"];
    const k = keys[i % 4];
    await page.keyboard.down(k);
    await pause(180);
    await page.keyboard.up(k);
    if (i % 3 === 0) await page.keyboard.press("Shift");
    if (i % 4 === 0) await page.keyboard.press("KeyF");
    if (i % 2 === 0) await page.keyboard.press("KeyJ");
    await pause(350);
  }
  await pause(1500);
  await page.screenshot({ path: join(ARTIFACTS, "demo_split_voltage_play.png") });
  await pause(600);

  // Blackjack
  await page.getByRole("navigation", { name: "Navigation" }).getByRole("link", { name: "Hub" }).click();
  await pause(600);
  await page.locator('a[href="/play/blackjack"]').click();
  await page.waitForURL(/blackjack/);
  await pause(600);
  await page.getByRole("button", { name: "Distribuer" }).click();
  await pause(1800);
  await page.screenshot({ path: join(ARTIFACTS, "demo_blackjack.png") });

  // UNO
  await page.getByRole("navigation", { name: "Navigation" }).getByRole("link", { name: "Hub" }).click();
  await pause(600);
  await page.locator('a[href="/play/uno"]').click();
  await page.waitForURL(/uno/);
  await pause(2500);
  await page.screenshot({ path: join(ARTIFACTS, "demo_uno_table.png") });

  // Undercover quick
  await page.getByRole("navigation", { name: "Navigation" }).getByRole("link", { name: "Hub" }).click();
  await pause(500);
  await page.locator('a[href="/play/undercover"]').click();
  await pause(700);
  await page.getByRole("button", { name: /Lancer/ }).click();
  await pause(2000);
  await page.screenshot({ path: join(ARTIFACTS, "demo_undercover.png") });

  // Werewolf quick
  await page.getByRole("navigation", { name: "Navigation" }).getByRole("link", { name: "Hub" }).click();
  await pause(500);
  await page.locator('a[href="/play/werewolf"]').click();
  await pause(700);
  await page.getByRole("button", { name: /Lancer/ }).click();
  await pause(2200);
  await page.screenshot({ path: join(ARTIFACTS, "demo_loup_garou.png") });

  // Solitaire peek
  await page.getByRole("navigation", { name: "Navigation" }).getByRole("link", { name: "Hub" }).click();
  await pause(500);
  await page.locator('a[href="/play/solitaire"]').click();
  await pause(1500);
  await page.screenshot({ path: join(ARTIFACTS, "demo_solitaire.png") });

  await page.getByRole("navigation", { name: "Navigation" }).getByRole("link", { name: "Hub" }).click();
  await pause(1000);

  await context.close();
  await browser.close();

  const vids = readdirSync(OUT).filter((f) => f.endsWith(".mp4"));
  if (!vids.length) throw new Error("no video recorded");
  const src = join(OUT, vids[0]);
  const dest = join(ARTIFACTS, "relay_jeux_ash_split_cartes_demo.mp4");
  copyFileSync(src, dest);
  console.log("video", dest, "screens", readdirSync(ARTIFACTS).filter((f) => f.startsWith("demo_")).join(", "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
