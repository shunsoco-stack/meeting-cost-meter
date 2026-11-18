import type { Card } from "./types";
import { yen } from "./rates";

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function cardImage(card: Card): Promise<Blob> {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 900;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("画像を作成できません。");
  context.fillStyle = "#142b2d";
  context.fillRect(0, 0, 1200, 900);
  context.fillStyle = "#b6d7ca";
  context.font = "24px sans-serif";
  context.fillText("MEETING COST METER", 80, 90);
  context.fillStyle = "#ffffff";
  context.font = "36px sans-serif";
  context.fillText("この会議の値段", 80, 170);
  context.font = "28px sans-serif";
  const characters = [...card.name];
  let line = "";
  let y = 240;
  for (const character of characters) {
    if (context.measureText(line + character).width > 1040) {
      context.fillText(line, 80, y);
      y += 40;
      line = "";
    }
    line += character;
  }
  context.fillText(line, 80, y);
  context.fillStyle = "#ffd581";
  const amount = `¥${yen(card.cost)}`;
  let fontSize = 120;
  do {
    context.font = `bold ${fontSize--}px monospace`;
  } while (context.measureText(amount).width > 1040);
  context.fillText(amount, 80, 480);
  context.fillStyle = "#ffffff";
  context.font = "30px sans-serif";
  context.fillText(
    `${card.date} ${card.time}  /  ${Math.floor(card.duration / 60000)}分${Math.floor(card.duration / 1000) % 60}秒  /  最大${card.count}人`,
    80,
    580,
  );
  context.fillText(
    `1分あたり ¥${yen(card.duration ? card.cost / (card.duration / 60000) : 0)}`,
    80,
    640,
  );
  context.font = "26px sans-serif";
  context.fillText(card.analogy, 80, 735, 1040);
  context.fillStyle = "#b6d7ca";
  context.font = "22px sans-serif";
  context.fillText("金額・例えは目安です。デモ用の架空データです。", 80, 830);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("PNGを作成できません。"))),
      "image/png",
    ),
  );
}
