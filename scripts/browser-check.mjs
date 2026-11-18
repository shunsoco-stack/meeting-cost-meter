import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

const { chromium } = await import(pathToFileURL(process.env.MCM_PLAYWRIGHT_PATH).href);
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  acceptDownloads: true,
});
const page = await context.newPage();
const errors = [];

page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});

const origin = "http://localhost:3100";

try {
  await page.goto(origin);
  await page.getByRole("heading", { name: "その会議、いくらかかる？" }).waitFor();
  await page.getByPlaceholder("例：新商品の企画ミーティング").fill("動作確認の会議");
  await page.getByLabel("参加人数", { exact: true }).fill("8");
  await page.getByLabel("平均時給", { exact: true }).fill("3600");
  await page.getByLabel("会議室・ツール代（任意）").fill("1200");
  await page.getByRole("button", { name: "この設定で会議を開始" }).click();
  await page.waitForURL("**/meter");
  await page.locator(".meter-price").waitFor();
  await page.waitForTimeout(1200);
  assert.ok(Number((await page.locator(".meter-price").innerText()).replace(/[^0-9]/g, "")) > 0);
  await page.getByRole("button", { name: "一時停止", exact: false }).click();
  const frozen = await page.locator(".meter-price").innerText();
  await page.waitForTimeout(1200);
  assert.equal(await page.locator(".meter-price").innerText(), frozen);
  await page.reload();
  await page.getByRole("button", { name: "再開する" }).waitFor();
  assert.equal(await page.locator(".meter-price").innerText(), frozen);
  await page.getByRole("button", { name: "再開する" }).click();
  await page.getByLabel("参加人数", { exact: true }).fill("4");
  await page.getByRole("button", { name: "この人数・時給に変更" }).click();
  await page.getByRole("button", { name: "会議を終了する" }).click();
  await page.waitForURL("**/result/**");
  await page.getByRole("heading", { name: "この会議の値段" }).waitFor();
  const resultUrl = page.url();
  await page.reload();
  await page.getByText("最大 8人", { exact: true }).waitFor();
  const pngDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "画像として保存" }).click();
  assert.match(
    (await pngDownload).suggestedFilename(),
    /^会議の値段_\d{4}-\d{2}-\d{2}_\d{4}\.png$/,
  );
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: "URLをコピー" }).click();
  await page.getByRole("status").filter({ hasText: "共有用URLをコピーしました" }).waitFor();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  await page.goto(sharedUrl);
  await page.getByRole("heading", { name: "この会議の値段" }).waitFor();
  assert.equal(await page.locator(".result-name").innerText(), "会議");
  await page.goto(`${origin}/share?v=1&data=bad`);
  await page.getByRole("heading", { name: "表示できません" }).waitFor();
  await page.goto(`${origin}/history`);
  await page.getByRole("cell", { name: "動作確認の会議", exact: false }).waitFor();
  const csvDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSVを書き出す" }).click();
  assert.match((await csvDownload).suggestedFilename(), /^会議コスト履歴_.*\.csv$/);
  await page.goto(`${origin}/backup`);
  const backup = await page.evaluate(() => localStorage.getItem("mcm:v1"));
  await page
    .locator("#backup-file")
    .setInputFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(backup),
    });
  await page.getByRole("button", { name: "この内容で復元する" }).click();
  await page
    .locator("#backup-file")
    .setInputFiles({ name: "bad.json", mimeType: "application/json", buffer: Buffer.from("{}") });
  await page.getByRole("status").filter({ hasText: "不正な値" }).waitFor();
  await page.goto(`${origin}/settings`);
  await page.getByRole("button", { name: "役職を追加" }).click();
  await page.getByRole("button", { name: "設定を保存する" }).click();
  await page.getByRole("status").filter({ hasText: "設定を保存しました" }).waitFor();
  await page.setViewportSize({ width: 375, height: 812 });
  for (const path of [
    "/",
    "/history",
    "/settings",
    "/backup",
    "/about",
    new URL(resultUrl).pathname,
    new URL(sharedUrl).pathname + new URL(sharedUrl).search,
  ]) {
    await page.goto(origin + path);
    await page.waitForTimeout(250);
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      `overflow: ${path}`,
    );
  }
  await page.goto(origin);
  await page.getByRole("button", { name: "役職ごとの人数 × 時給" }).click();
  await page.getByRole("button", { name: "この設定で会議を開始" }).click();
  await page.waitForURL("**/meter");
  await page.locator(".meter-price").waitFor();
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    "meter overflow",
  );
  await page.getByRole("button", { name: "全画面表示" }).click();
  await page.getByRole("button", { name: "全画面を閉じる" }).waitFor();
  await page.getByRole("button", { name: "全画面を閉じる" }).click();
  await page.getByRole("button", { name: "会議を終了する" }).click();
  await page.waitForURL("**/result/**");
  await page.evaluate(() => localStorage.setItem("mcm:v1", "broken"));
  await page.goto(origin);
  await page.getByRole("status").filter({ hasText: "保存データが壊れていたため" }).waitFor();
  await page.waitForTimeout(300);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: production flows, reload, pause, attendance, PNG, share, CSV, backup, settings, 375px, fullscreen, corruption recovery; console errors=0",
  );
} finally {
  await context.close();
  await browser.close();
}
