import type { Meeting } from "./types";
import { calculate } from "./meter";
import { japanParts } from "./dates";

export function statistics(history: Meeting[], now: number) {
  const month = japanParts(now).date.slice(0, 7);
  const monthly = history.filter((item) => japanParts(item.start).date.startsWith(month));
  const costs = history.map((item) => ({ meeting: item, ...calculate(item, item.end ?? now) }));
  return {
    monthlyTotal: monthly.reduce((sum, item) => sum + calculate(item, item.end ?? now).cost, 0),
    monthlyCount: monthly.length,
    averageDuration: costs.length
      ? costs.reduce((sum, item) => sum + item.duration, 0) / costs.length
      : 0,
    highest: costs.sort((a, b) => b.cost - a.cost)[0] ?? null,
  };
}
