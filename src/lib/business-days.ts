import { DAY, japanMidnight } from "./dates";

const JST = 9 * 3600000;
export const weekday = (day: number) => new Date(day + JST).getUTCDay();

// 2022年以降の現行規則。春分・秋分の近似式の適用範囲は2099年まで。
// 法改正・臨時の祝日はこの年別の追加表で補正できる。
const additionalHolidays: Record<number, readonly string[]> = {};
export function holidaysForYear(year: number): Set<number> {
  const holidays = new Set<number>();
  const date = (month: number, day: number) => Date.UTC(year, month - 1, day) - JST;
  const add = (month: number, day: number) => holidays.add(date(month, day));
  for (const [month, day] of [
    [1, 1],
    [2, 11],
    [2, 23],
    [4, 29],
    [5, 3],
    [5, 4],
    [5, 5],
    [8, 11],
    [11, 3],
    [11, 23],
  ])
    add(month, day);
  for (const [month, week] of [
    [1, 2],
    [7, 3],
    [9, 3],
    [10, 2],
  ]) {
    add(month, 1 + ((8 - weekday(date(month, 1))) % 7) + (week - 1) * 7);
  }
  add(3, Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4)));
  add(9, Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4)));
  for (const value of additionalHolidays[year] ?? [])
    holidays.add(Date.parse(`${year}-${value}T00:00:00+09:00`));
  // 国民の休日は祝日に挟まれた平日。振替休日はその根拠にはしない。
  for (let day = date(1, 2); day < date(12, 31); day += DAY) {
    if (weekday(day) !== 0 && holidays.has(day - DAY) && holidays.has(day + DAY)) holidays.add(day);
  }
  for (const day of [...holidays].sort((a, b) => a - b)) {
    if (weekday(day) !== 0) continue;
    let substitute = day + DAY;
    while (holidays.has(substitute)) substitute += DAY;
    holidays.add(substitute);
  }
  return holidays;
}

export function isBusinessDay(epoch: number): boolean {
  const day = japanMidnight(epoch);
  return (
    weekday(day) !== 0 &&
    weekday(day) !== 6 &&
    !holidaysForYear(new Date(day + JST).getUTCFullYear()).has(day)
  );
}
