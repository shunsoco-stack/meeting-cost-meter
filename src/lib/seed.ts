import { DAY, japanMidnight } from "./dates";
import { defaultSetup, presets } from "./rates";
import { finishMeeting, startMeeting } from "./meter";
import type { Store, Meeting } from "./types";

const topics = [
  "新商品の価格決め",
  "春の展示会ブース相談",
  "採用サイトの写真選び",
  "物流コストの見直し",
  "月曜のチーム朝会",
  "問い合わせ導線の改善",
  "新メンバーとの1on1",
  "全社方針説明会",
  "試作品の使い心地レビュー",
  "キャンペーン企画",
  "今月の振り返り",
  "来期の予算相談",
  "週次の進捗共有",
  "パッケージの色決め",
  "販売店向け資料の確認",
  "オンボーディング相談",
  "繁忙期の運用設計",
  "アクセシビリティ勉強会",
  "新拠点の備品選び",
  "週末イベントの準備",
  "顧客アンケートの読み合わせ",
  "プロトタイプの動作確認",
  "チーム目標のすり合わせ",
  "配送箱のサイズ検討",
  "ニュースレターの編集会議",
  "営業と制作の相談会",
  "社内発表のリハーサル",
  "障害対応の振り返り",
  "次の実験テーマ選び",
  "月末の販売実績レビュー",
];

export function randomGenerator(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function createSeed(now: number): Store {
  const random = randomGenerator(Math.floor(japanMidnight(now) / DAY));
  const available = [...topics];
  const history: Meeting[] = [];
  while (available.length) {
    const name = available.splice(Math.floor(random() * available.length), 1)[0];
    let day = japanMidnight(now) - (1 + Math.floor(random() * 59)) * DAY;
    const weekday = new Date(day + 9 * 3600000).getUTCDay();
    if (weekday === 0) day -= 2 * DAY;
    if (weekday === 6) day -= DAY;
    if (name.includes("月曜")) {
      const currentDay = new Date(day + 9 * 3600000).getUTCDay();
      day -= (currentDay - 1) * DAY;
    }
    if (name.includes("月末")) {
      const date = new Date(now + 9 * 3600000);
      day = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 0) - 9 * 3600000;
      const monthEndWeekday = new Date(day + 9 * 3600000).getUTCDay();
      if (monthEndWeekday === 0) day -= 2 * DAY;
      if (monthEndWeekday === 6) day -= DAY;
    }
    const minutes = name.includes("全社")
      ? 90
      : name.includes("1on1")
        ? 30
        : 15 + Math.floor(random() * 106);
    const start =
      day + (name.includes("月曜") ? 9 * 60 + 15 : 9 * 60 + Math.floor(random() * 470)) * 60000;
    const count = name.includes("全社")
      ? 64
      : name.includes("1on1")
        ? 2
        : 3 + Math.floor(random() * 10);
    const setup = {
      ...defaultSetup,
      name: `（架空）${name}`,
      count,
      rate: 2400 + Math.floor(random() * 20) * 100,
      room: random() < 0.3 ? 1200 : 0,
    };
    history.push(
      finishMeeting(
        startMeeting(setup, start, `demo-${history.length + 1}`),
        start + minutes * 60000,
      ),
    );
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
