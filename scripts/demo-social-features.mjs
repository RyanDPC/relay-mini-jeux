import { chromium } from "playwright";

const BASE = "http://127.0.0.1:5173";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function login(page, username, password) {
  await page.goto(`${BASE}/auth?tab=in`, { waitUntil: "networkidle" });
  await pause(700);
  await page.getByRole("tab", { name: "Connexion" }).click();
  await pause(300);
  await page.locator("#username").fill(username);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Entrer" }).click();
  await page.waitForURL((u) => u.pathname.includes("/hub"), { timeout: 45000 });
  await pause(1200);
}

async function main() {
  const browser = await chromium.launch({
    channel: "chrome",
    headless: false,
    args: ["--window-size=1280,860", "--window-position=40,40"],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });

  await page.goto(BASE);
  await pause(800);
  const quit = page.getByRole("button", { name: "Quitter" });
  if (await quit.isVisible().catch(() => false)) {
    await quit.click();
    await pause(800);
  }

  await login(page, "nova_42", "password123");

  // Profil
  await page.getByRole("navigation", { name: "Navigation" }).getByRole("link", { name: "Profil" }).click();
  await pause(1200);
  await page.getByRole("button", { name: "✦" }).click();
  await pause(400);
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await pause(1200);

  // Amis + chat
  await page.getByRole("navigation", { name: "Navigation" }).getByRole("link", { name: "Amis" }).click();
  await pause(1500);
  const chatLink = page.getByRole("link", { name: "Chat" }).first();
  if (await chatLink.isVisible().catch(() => false)) {
    await chatLink.click();
    await pause(1000);
  } else {
    await page.getByRole("navigation", { name: "Navigation" }).getByRole("link", { name: "Chat" }).click();
    await pause(1000);
  }
  const peerBtn = page.locator(".chat-peers button").first();
  if (await peerBtn.isVisible().catch(() => false)) {
    await peerBtn.click();
    await pause(800);
    await page.locator(".thread-form input").fill("Salut depuis RELAY live");
    await page.locator(".thread-form button[type=submit]").click();
    await pause(1500);
  }

  // Party
  await page.getByRole("navigation", { name: "Navigation" }).getByRole("link", { name: "Party" }).click();
  await pause(1200);
  await page.getByRole("button", { name: "Créer une party" }).click();
  await page.waitForURL(/\/party\//, { timeout: 20000 });
  await pause(2000);

  // Touch pad visible on snake in party if duel - skip, show invite form
  await pause(1500);

  // Play with touch pad area
  await page.getByRole("navigation", { name: "Navigation" }).getByRole("link", { name: "Hub" }).click();
  await pause(800);
  await page.locator('a[href="/play/pulse-snake"]').click();
  await pause(1500);
  // force show touch pad via CSS for demo? already on coarse pointer - set viewport mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await pause(1000);
  await page.getByRole("button", { name: /Start|Rejouer|Relancer/ }).click();
  await pause(500);
  const pad = page.locator(".touch-pad button").first();
  if (await pad.isVisible().catch(() => false)) {
    await pad.click();
    await pause(300);
    await page.locator(".touch-pad .right").click().catch(() => page.locator(".touch-pad button").nth(2).click());
    await pause(800);
  }
  await pause(1500);

  await browser.close();
  console.log("demo_social_features_done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
