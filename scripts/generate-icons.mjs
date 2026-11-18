import { writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const { chromium } = await import(pathToFileURL(process.env.MCM_PLAYWRIGHT_PATH).href);
const browser = await chromium.launch({ channel: "msedge", headless: true });

try {
  const page = await browser.newPage();
  for (const size of [192, 512]) {
    const data = await page.evaluate((size) => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      context.scale(size / 128, size / 128);
      context.fillStyle = "#142b2d";
      context.fillRect(0, 0, 128, 128);
      context.strokeStyle = "#bde8bb";
      context.lineWidth = 9;
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(35, 30);
      context.lineTo(64, 64);
      context.lineTo(93, 30);
      context.moveTo(64, 64);
      context.lineTo(64, 101);
      context.moveTo(37, 66);
      context.lineTo(91, 66);
      context.moveTo(37, 81);
      context.lineTo(91, 81);
      context.stroke();
      return canvas.toDataURL("image/png").split(",")[1];
    }, size);
    await writeFile(`public/icon-${size}.png`, Buffer.from(data, "base64"));
  }
} finally {
  await browser.close();
}
