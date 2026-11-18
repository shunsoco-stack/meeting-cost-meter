export const DAY = 86_400_000;

export function japanParts(epoch: number) {
  const iso = new Date(epoch + 9 * 3_600_000).toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
}

export function japanMidnight(epoch: number) {
  return Date.parse(`${japanParts(epoch).date}T00:00:00+09:00`);
}

export function durationLabel(ms: number) {
  const seconds = Math.floor(Math.max(0, ms) / 1000);
  return `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor(seconds / 60) % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function imageFilename(epoch: number) {
  const { date, time } = japanParts(epoch);
  return `会議の値段_${date}_${time.replace(":", "")}.png`;
}
