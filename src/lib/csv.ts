import { meetingCard, sortedHistory } from "./history";
import { japanParts } from "./dates";
import type { Meeting } from "./types";

export function csvCell(value: string | number) {
  const safe = String(value).replace(/^[=+@\-\t\r]/, "'$&");
  return `"${safe.replaceAll('"', '""')}"`;
}

export function historyCsv(history: Meeting[]) {
  const rows = sortedHistory(history).map((meeting) => {
    const card = meetingCard(meeting);
    return [
      card.date,
      card.time,
      card.name,
      Math.round(card.duration / 1000),
      card.count,
      card.cost,
    ]
      .map(csvCell)
      .join(",");
  });
  return (
    "\uFEFF日付,開始時刻,会議名,時間（秒）,最大同時参加人数,金額（円）\r\n" + rows.join("\r\n")
  );
}

export function csvFilename(history: Meeting[], now: number) {
  const dates = history.map((item) => japanParts(item.start).date).sort();
  return `会議コスト履歴_${dates[0] ?? japanParts(now).date}_${dates.at(-1) ?? japanParts(now).date}.csv`;
}
