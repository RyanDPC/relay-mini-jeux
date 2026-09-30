import { chromium } from "playwright";

const BASE = "http://127.0.0.1:5173";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function signOutIfNeeded(page) {
  const quit = page.getByRole("button", { name: "Quitter" });
  if (await quit.isVisible().catch(() => false)) {
    await quit.click();
    await pause(1000);
  }
}

async function login(page, username, password) {
  await page.goto(`${BASE}/auth?tab=in`, { waitUntil: "networkidle" });
  await pause(1000);
  await page.getByRole("tab", { name: "Connexion" }).click();
  await pause(500);
  await page.locator("#username").fill("");
  await page.locator("#username").fill(username);
  await page.locator("#password").fill("");
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Entrer" }).click();
  await page.waitForURL((url) => url.pathname.includes("/hub"), { timeout: 45000 });
  await pause(1500);
}

function nav(page, name) {
  return page.getByRole("navigation", { name: "Navigation" }).getByRole("link", { name });
}

async function main() {
  const browser = await chromium.launch({
    channel: "chrome",
    headless: false,
    args: ["--window-size=1280,800", "--window-position=40,40"],
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  await page.goto(BASE, { waitUntil: "networkidle" });
  await pause(1500);
  await signOutIfNeeded(page);
  await pause(1000);

  await login(page, "nova_42", "password123");

  await nav(page, "Amis").click();
  await pause(2500);

  for (let i = 0; i < 5; i++) {
    const accept = page.getByRole("button", { name: "Accepter" }).first();
    if (!(await accept.isVisible().catch(() => false))) break;
    await accept.click();
    await pause(1000);
  }
  await pause(2000);

  await nav(page, "Hub").click();
  await pause(1000);
  await page.locator('a[href="/play/pulse-snake"]').click();
  await pause(1500);
  // Classement already seeded — make sure it's visible
  await page.locator(".board").scrollIntoViewIfNeeded().catch(() => {});
  await pause(2500);

  await page.getByRole("button", { name: /Start|Rejouer|Relancer/ }).click();
  await pause(600);
  for (const key of ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "ArrowUp", "ArrowUp", "ArrowUp", "ArrowUp", "ArrowUp", "ArrowUp"]) {
    await page.keyboard.press(key);
    await pause(150);
  }
  await pause(2000);

  await nav(page, "Hub").click();
  await pause(900);
  await page.locator('a[href="/play/drift-breaker"]').click();
  await pause(1200);
  await page.getByRole("button", { name: /Start|Relancer/ }).click();
  await pause(600);
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press(i % 2 === 0 ? "ArrowLeft" : "ArrowRight");
    await pause(140);
  }
  await pause(2000);

  await nav(page, "Amis").click();
  await pause(3000);

  await browser.close();
  console.log("demo_friends_scores_done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
