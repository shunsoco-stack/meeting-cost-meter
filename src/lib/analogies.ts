export const examples = [
  [150, "缶コーヒー", "本"],
  [300, "おにぎりセット", "食"],
  [500, "カフェラテ", "杯"],
  [1000, "ランチ", "人分"],
  [1500, "文庫本", "冊"],
  [2000, "映画鑑賞", "人分"],
  [3000, "ちょっといいケーキ", "台"],
  [4000, "花束", "束"],
  [5000, "打ち上げ", "人分"],
  [8000, "日帰り温泉旅行", "人分"],
  [10000, "ちょっといいイヤホン", "個"],
  [15000, "新幹線 東京〜大阪 片道", "人分"],
  [20000, "ホテルの宿泊", "泊"],
  [30000, "オフィスチェア", "脚"],
  [50000, "週末旅行", "人分"],
  [100000, "ノートパソコン", "台"],
  [200000, "海外旅行", "人分"],
] as const;

export function analogy(cost: number, random: number) {
  const choices = examples.filter(([price]) => price <= cost && price >= cost / 30);
  if (!choices.length) return "まだ、小さなひと呼吸ぶん。";
  const [price, name, unit] =
    choices[Math.min(choices.length - 1, Math.floor(Math.max(0, random) * choices.length))];
  return `${name} 約${Math.floor(cost / price)}${unit}`;
}

export function milestone(cost: number) {
  if (cost < 10000) return 0;
  if (cost < 30000) return 10000;
  if (cost < 50000) return 30000;
  if (cost < 100000) return 50000;
  return Math.floor(cost / 100000) * 100000;
}
