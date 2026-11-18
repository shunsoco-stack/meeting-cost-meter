import { DAY, japanMidnight } from "./dates";
import { isBusinessDay, weekday } from "./business-days";
import { defaultSetup, presets } from "./rates";
import { finishMeeting, startMeeting } from "./meter";
import type { Store, Meeting } from "./types";

// 予定時間と許容する前後の幅、人数、平均時給。
const kinds = {
  morning: { minutes: 20, spread: 5, count: [7, 8], rate: [3000, 3800] },
  weekly: { minutes: 50, spread: 10, count: [7, 8], rate: [3000, 3800] },
  review: { minutes: 60, spread: 10, count: [7, 9], rate: [3200, 4200] },
  one: { minutes: 30, spread: 5, count: [2, 2], rate: [3200, 4500] },
  all: { minutes: 75, spread: 15, count: [50, 70], rate: [3000, 4000] },
  planning: { minutes: 45, spread: 10, count: [4, 6], rate: [3000, 4200] },
  consult: { minutes: 30, spread: 5, count: [3, 4], rate: [2800, 3800] },
  study: { minutes: 45, spread: 5, count: [6, 9], rate: [2800, 3600] },
} as const;
type Kind = keyof typeof kinds;
const topics: { name: string; kind: Kind }[] = [
  { name: "新メンバーとの1on1", kind: "one" },
  { name: "キャンペーン企画", kind: "planning" },
  { name: "採用サイトの写真選び", kind: "consult" },
  { name: "問い合わせ導線の改善相談", kind: "consult" },
  { name: "試作品の使い心地レビュー", kind: "planning" },
  { name: "アクセシビリティ勉強会", kind: "study" },
  { name: "来期の予算相談", kind: "planning" },
  { name: "オンボーディングの振り返り", kind: "consult" },
  { name: "プロトタイプの動作確認", kind: "consult" },
  { name: "ニュースレターの編集会議", kind: "planning" },
  { name: "営業と制作の相談会", kind: "consult" },
  { name: "社内発表のリハーサル", kind: "consult" },
  { name: "次の実験テーマ選び", kind: "planning" },
  { name: "配送箱のサイズ検討", kind: "consult" },
  { name: "新商品の価格決め", kind: "planning" },
  { name: "物流コストの見直し", kind: "planning" },
  { name: "顧客アンケートの読み合わせ", kind: "study" },
  { name: "販売店向け資料の確認", kind: "consult" },
  { name: "チーム目標のすり合わせ", kind: "planning" },
  { name: "パッケージの色決め", kind: "consult" },
];

export function randomGenerator(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function createSeed(now: number): Store {
  const today = japanMidnight(now);
  const random = randomGenerator(Math.floor(today / DAY));
  const integer = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
  const days = Array.from({ length: 56 }, (_, i) => today - (i + 1) * DAY).filter(isBusinessDay);
  const history: Meeting[] = [];
  const add = (day: number, minute: number, name: string, kind: Kind) => {
    const rule = kinds[kind];
    const start = day + minute * 60000;
    const offset = random() < 0.2 ? 0 : integer(-rule.spread * 60, rule.spread * 60);
    const end = start + (rule.minutes * 60 + offset) * 1000;
    const sameDay = history.filter((item) => japanMidnight(item.start) === day);
    if (
      end >= now ||
      sameDay.length >= 3 ||
      (start < day + 13 * 3600000 && end > day + 12 * 3600000) ||
      sameDay.some((item) => start < item.end! && end > item.start)
    )
      return false;
    history.push(
      finishMeeting(
        startMeeting(
          {
            ...defaultSetup,
            name,
            count: integer(rule.count[0], rule.count[1]),
            rate: integer(rule.rate[0] / 100, rule.rate[1] / 100) * 100,
            room: kind === "all" ? 2400 : 0,
          },
          start,
          `demo-${history.length + 1}`,
        ),
        end,
      ),
    );
    return true;
  };
  for (const day of days) {
    if (weekday(day) === 1) add(day, 570, "月曜のチーム朝会", "morning");
    if (weekday(day) === 4) add(day, 840, "週次の進捗共有", "weekly");
    let next = day + DAY;
    while (!isBusinessDay(next)) next += DAY;
    if (new Date(day + 9 * 3600000).getUTCMonth() !== new Date(next + 9 * 3600000).getUTCMonth()) {
      add(day, 960, "月末の販売実績レビュー", "review");
    }
  }
  const companyDay = days.slice(Math.floor(days.length / 2)).find((day) => weekday(day) === 2)!;
  add(companyDay, 780, "全社方針説明会", "all");
  const available = [...topics];
  // 直近2営業日は必ず記録を残す。13時なら定例と重ならない。
  for (const day of days.slice(0, 2)) {
    if (!history.some((item) => japanMidnight(item.start) === day)) {
      const topic = available.shift()!;
      add(day, 780, topic.name, topic.kind);
    }
  }
  // 1on1は必ず含める。単発は重複させず、空いた日に分散する。
  const one = available.findIndex((topic) => topic.kind === "one");
  if (one >= 0) {
    for (const day of days) {
      if (add(day, 630, available[one].name, "one")) {
        available.splice(one, 1);
        break;
      }
    }
  }
  const shuffled = [...days];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = integer(0, i);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  for (const day of shuffled) {
    if (history.length >= 30) break;
    const index = integer(0, available.length - 1);
    const topic = available[index];
    const start = random() < 0.15 ? [615, 905, 945][integer(0, 2)] : [630, 780, 930][integer(0, 2)];
    if (add(day, start, topic.name, topic.kind)) available.splice(index, 1);
  }
  history.sort((a, b) => b.start - a.start);
  return {
    version: 1,
    setup: structuredClone(defaultSetup),
    presets: structuredClone(presets),
    analogies: true,
    active: null,
    history,
  };
}
