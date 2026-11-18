import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Module, { createRequire } from "node:module";

const load = createRequire(import.meta.url);
const ts = load("typescript");

Module._extensions[".ts"] = (module, filename) => {
  const source = readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  module._compile(compiled.outputText, filename);
};

const { defaultSetup, hourlyRate, participants, yen } = load("../src/lib/rates.ts");
const { calculate, startMeeting, togglePause, finishMeeting, changeParticipants, activeDuration } =
  load("../src/lib/meter.ts");
const { japanParts, japanMidnight, durationLabel, imageFilename, DAY } =
  load("../src/lib/dates.ts");
const { analogy, milestone, examples } = load("../src/lib/analogies.ts");
const { encodeShare, decodeShare, shareText, validCard } = load("../src/lib/share.ts");
const { createSeed } = load("../src/lib/seed.ts");
const { isBusinessDay, holidaysForYear } = load("../src/lib/business-days.ts");
const { readBackup, writeBackup } = load("../src/lib/backup.ts");
const { validStore, validSetup, validMeeting } = load("../src/lib/validation.ts");
const { restore } = load("../src/lib/storage.ts");
const { statistics } = load("../src/lib/stats.ts");
const { meetingCard, sortedHistory } = load("../src/lib/history.ts");
const { historyCsv, csvCell, csvFilename } = load("../src/lib/csv.ts");

const epoch = Date.parse("2026-11-18T14:30:00+09:00");
const setup = { ...defaultSetup, count: 2, rate: 3600 };
const meeting = () => startMeeting(setup, epoch, "test-meeting");
const card = {
  name: "価格の相談",
  date: "2026-11-18",
  time: "14:30",
  duration: 60000,
  count: 2,
  cost: 120,
  analogy: "ひと呼吸",
};

for (const [seconds, cost] of [
  [0, 0],
  [1, 2],
  [30, 60],
  [60, 120],
  [3600, 7200],
  [86400, 172800],
  [604800, 1209600],
]) {
  test(`経過${seconds}秒の積算`, () =>
    assert.equal(calculate(meeting(), epoch + seconds * 1000).cost, cost));
}

test("1円未満は最後に切り捨てる", () =>
  assert.equal(
    calculate(startMeeting({ ...setup, rate: 1 }, epoch, "a"), epoch + 1800000).cost,
    1,
  ));
test("1円に達しない費用は0円", () =>
  assert.equal(calculate(startMeeting({ ...setup, rate: 1 }, epoch, "a"), epoch + 1000).cost, 0));
test("ツール代を加算", () => assert.equal(hourlyRate({ ...setup, room: 1200 }), 8400));
test("役職別の時給を積算", () =>
  assert.equal(hourlyRate({ ...defaultSetup, mode: "roles" }), 23000));
test("役職別人数", () => assert.equal(participants({ ...defaultSetup, mode: "roles" }), 7));
test("人数増加は変更後だけ", () => {
  const next = changeParticipants(meeting(), { ...setup, count: 4 }, epoch + 30000);
  assert.equal(calculate(next, epoch + 60000).cost, 180);
});
test("人数減少は変更後だけ", () => {
  const next = changeParticipants(meeting(), { ...setup, count: 1 }, epoch + 30000);
  assert.equal(calculate(next, epoch + 60000).cost, 90);
});
test("一時停止中は増えない", () => {
  const paused = togglePause(meeting(), epoch + 10000);
  assert.equal(calculate(paused, epoch + DAY).cost, 20);
});
test("再開後だけ増加", () => {
  const paused = togglePause(togglePause(meeting(), epoch + 10000), epoch + 30000);
  assert.equal(calculate(paused, epoch + 60000).cost, 80);
});
test("複数の停止区間", () => {
  let current = meeting();
  for (const sec of [10, 20, 30, 50]) current = togglePause(current, epoch + sec * 1000);
  assert.equal(calculate(current, epoch + 60000).duration, 30000);
});
test("一時停止中の人数変更", () => {
  let current = togglePause(meeting(), epoch + 10000);
  current = changeParticipants(current, { ...setup, count: 4 }, epoch + 20000);
  current = togglePause(current, epoch + 30000);
  assert.equal(calculate(current, epoch + 40000).cost, 60);
});
test("一時停止中はツール代も停止", () => {
  const current = togglePause(startMeeting({ ...setup, room: 3600 }, epoch, "a"), epoch + 10000);
  assert.equal(calculate(current, epoch + 60000).cost, 30);
});
test("終了後に費用が増えない", () =>
  assert.equal(calculate(finishMeeting(meeting(), epoch + 10000), epoch + DAY).cost, 20));
test("停止中に終了すると区間を閉じる", () =>
  assert.equal(
    finishMeeting(togglePause(meeting(), epoch), epoch + 5000).pauses[0].end,
    epoch + 5000,
  ));
test("日付をまたぐ時間", () => {
  const start = Date.parse("2026-11-18T23:59:00+09:00");
  assert.equal(calculate(startMeeting(setup, start, "a"), start + 120000).cost, 240);
});
test("スリープ後も時刻差で復元", () =>
  assert.equal(
    calculate(JSON.parse(JSON.stringify(meeting())), epoch + 7200000).duration,
    7200000,
  ));
test("時計が開始前でも負額なし", () => assert.equal(calculate(meeting(), epoch - 10000).cost, 0));
test("区間を切り出した経過時間", () =>
  assert.equal(activeDuration(meeting(), epoch + 1000, epoch + 3000), 2000));
test("最大人数は最後の人数に依存しない", () => {
  const current = changeParticipants(meeting(), { ...setup, count: 1 }, epoch + 1000);
  assert.equal(meetingCard(finishMeeting(current, epoch + 5000)).count, 2);
});
test("日本時間の日付", () =>
  assert.deepEqual(japanParts(epoch), { date: "2026-11-18", time: "14:30" }));
test("UTC前日でもJSTは翌日", () =>
  assert.equal(japanParts(Date.parse("2026-11-17T15:01:00Z")).date, "2026-11-18"));
test("日本時間0時を取得", () => assert.equal(japanParts(japanMidnight(epoch)).time, "00:00"));
test("長時間の表示", () => assert.equal(durationLabel(90061000), "25:01:01"));
test("PNGファイル名", () => assert.equal(imageFilename(epoch), "会議の値段_2026-11-18_1430.png"));
test("円の桁区切り", () => assert.equal(yen(12345.9), "12,345"));
test("例えは15種類以上", () => assert.ok(examples.length >= 15));
test("低額の例え", () => assert.match(analogy(0, 0), /ひと呼吸/));
test("同じ金額でも例えを変えられる", () =>
  assert.notEqual(analogy(30000, 0), analogy(30000, 0.99)));
test("例えの人数は金額を超えない", () => assert.match(analogy(15000, 0.99), /約1/));
for (const [cost, expected] of [
  [9999, 0],
  [10000, 10000],
  [29999, 10000],
  [30000, 30000],
  [50000, 50000],
  [100000, 100000],
  [250000, 200000],
]) {
  test(`節目 ${cost}円`, () => assert.equal(milestone(cost), expected));
}
test("共有URLの日本語往復", () => assert.deepEqual(decodeShare(encodeShare(card)), card));
test("共有URLの特殊文字往復", () => {
  const value = { ...card, name: "企画 & A+B? #1 🍵" };
  assert.deepEqual(decodeShare(encodeShare(value)), value);
});
test("不正JSONを拒否", () => assert.equal(decodeShare("v=1&data=%7B"), null));
test("別バージョンを拒否", () =>
  assert.equal(decodeShare(encodeShare(card).replace("v=1", "v=2")), null));
test("共有URLの重複dataを拒否", () =>
  assert.equal(decodeShare(encodeShare(card) + "&data={}"), null));
test("過大なURLを拒否", () => assert.equal(decodeShare("x".repeat(12001)), null));
for (const [key, value] of [
  ["cost", -1],
  ["cost", 1.5],
  ["cost", Infinity],
  ["count", -1],
  ["count", 1.5],
  ["count", 200001],
  ["duration", -1],
  ["date", "2026-02-30"],
  ["date", "today"],
  ["time", "24:00"],
  ["time", "9:00"],
  ["name", "x".repeat(81)],
]) {
  test(`共有カード不正値 ${key} ${value}`, () =>
    assert.equal(validCard({ ...card, [key]: value }), false));
}
test("共有文面", () =>
  assert.equal(shareText(card), "「価格の相談」、1分・2人で 120円でした。 #会議コストメーター"));
test("空の共有データ", () => assert.equal(decodeShare(""), null));

for (const date of [
  "2026-11-18T00:01",
  "2026-11-18T08:00",
  "2026-11-18T12:30",
  "2026-11-18T23:59",
  "2026-12-01T00:00",
  "2026-11-30T09:00",
  "2026-11-16T09:00",
  "2028-03-01T00:02",
]) {
  test(`シードの日時整合性 ${date}`, () => {
    const now = Date.parse(`${date}:00+09:00`);
    const seed = createSeed(now);
    assert.equal(seed.history.length, 30);
    assert.ok(validStore(seed));
    assert.ok(seed.history.every((item) => item.end < now && item.start >= now - 92 * DAY));
    assert.ok(
      seed.history.every(
        (item) => item.end - item.start >= 15 * 60000 && item.end - item.start <= 120 * 60000,
      ),
    );
    assert.ok(
      seed.history.every(
        (item) => japanParts(item.start).time >= "09:00" && japanParts(item.end).time <= "19:00",
      ),
    );
    assert.ok(seed.history.every((item) => japanParts(item.start).date !== japanParts(now).date));
  });
}
// 生成側の祝日関数とは独立した、テスト対象期間の祝日一覧。
const calendarHolidays = new Set([
  "2025-11-03",
  "2025-11-23",
  "2025-11-24",
  "2026-01-01",
  "2026-01-12",
  "2026-02-11",
  "2026-02-23",
  "2026-03-20",
  "2026-04-29",
  "2026-05-03",
  "2026-05-04",
  "2026-05-05",
  "2026-05-06",
  "2026-07-20",
  "2026-08-11",
  "2026-09-21",
  "2026-09-22",
  "2026-09-23",
  "2026-10-12",
  "2026-11-03",
  "2026-11-23",
  "2027-01-01",
  "2027-01-11",
  "2028-01-01",
  "2028-01-10",
  "2028-02-11",
  "2028-02-23",
]);
const fixtureBusinessDay = (day) => {
  const weekday = new Date(day + 9 * 3600000).getUTCDay();
  return weekday !== 0 && weekday !== 6 && !calendarHolidays.has(japanParts(day).date);
};
for (const date of [
  "2026-11-18T12:30", // 平日昼
  "2026-11-16T09:00", // 月曜朝
  "2026-11-21T15:00", // 土曜
  "2026-09-24T10:00", // 3連続の祝日翌日
  "2026-11-24T00:20", // 祝日翌日の深夜
  "2026-11-04T08:00",
  "2026-12-01T00:20", // 11月最終営業日
  "2026-05-07T12:00", // 連続祝日と振替休日
  "2027-01-12T09:00", // 年またぎ
  "2028-03-01T00:20", // うるう年
]) {
  test(`自然な営業日カレンダー30件 ${date}`, () => {
    const now = Date.parse(`${date}:00+09:00`);
    const today = japanMidnight(now);
    const history = createSeed(now).history;
    assert.equal(history.length, 30);
    assert.deepEqual(createSeed(now).history, history);
    const byDay = new Map();
    for (const [index, item] of history.entries()) {
      assert.ok(!item.setup.name.includes("（架空）"));
      assert.ok(fixtureBusinessDay(item.start), japanParts(item.start).date);
      assert.ok(item.end < now);
      assert.ok(index === 0 || history[index - 1].start >= item.start);
      const day = japanMidnight(item.start);
      assert.ok(item.start >= day + 9 * 3600000 && item.end <= day + 18 * 3600000);
      assert.ok(item.end <= day + 12 * 3600000 || item.start >= day + 13 * 3600000);
      assert.ok([0, 5, 15, 30, 45].includes(new Date(item.start).getUTCMinutes()));
      const meetings = byDay.get(day) ?? [];
      meetings.push(item);
      byDay.set(day, meetings);
      const minutes = (item.end - item.start) / 60000;
      if (item.setup.name.includes("1on1")) {
        assert.equal(item.setup.count, 2);
        assert.ok(minutes >= 25 && minutes <= 35);
      }
      if (item.setup.name.includes("勉強会")) {
        assert.ok(minutes >= 40 && minutes <= 50);
        assert.ok(item.setup.count >= 6 && item.setup.count <= 9);
      }
      if (item.setup.name.includes("写真選び")) assert.ok(item.setup.count <= 4);
    }
    for (const meetings of byDay.values()) {
      assert.ok(meetings.length <= 3);
      meetings.sort((a, b) => a.start - b.start);
      assert.ok(meetings.every((item, i) => i === 0 || meetings[i - 1].end <= item.start));
    }
    let previous = today;
    for (let i = 0; i < 2; i++) {
      do {
        previous -= DAY;
      } while (!fixtureBusinessDay(previous));
      assert.ok(byDay.has(previous), `直近営業日 ${japanParts(previous).date}`);
    }
    for (const [name, weekday, time, min, max] of [
      ["月曜のチーム朝会", 1, "09:30", 15, 25],
      ["週次の進捗共有", 4, "14:00", 40, 60],
    ]) {
      const recurring = history.filter((item) => item.setup.name === name);
      assert.ok(recurring.length >= 4);
      for (let day = today - 56 * DAY; day < today; day += DAY) {
        if (!fixtureBusinessDay(day) || new Date(day + 9 * 3600000).getUTCDay() !== weekday)
          continue;
        const item = recurring.find((meeting) => japanMidnight(meeting.start) === day);
        assert.ok(item, `${name} ${japanParts(day).date}`);
        assert.equal(japanParts(item.start).time, time);
        assert.ok(item.end - item.start >= min * 60000 && item.end - item.start <= max * 60000);
        assert.ok(item.setup.count >= 7 && item.setup.count <= 8);
        assert.ok(item.setup.rate >= 3000 && item.setup.rate <= 3800);
      }
    }
    for (let day = today - 56 * DAY; day < today; day += DAY) {
      if (!fixtureBusinessDay(day)) continue;
      let next = day + DAY;
      while (!fixtureBusinessDay(next)) next += DAY;
      const isMonthEnd = japanParts(day).date.slice(0, 7) !== japanParts(next).date.slice(0, 7);
      assert.equal(
        history.some(
          (item) => japanMidnight(item.start) === day && item.setup.name.includes("月末"),
        ),
        isMonthEnd,
      );
    }
    const company = history.filter((item) => item.setup.name.includes("全社"));
    assert.equal(company.length, 1);
    assert.ok(company[0].setup.count >= 50 && company[0].setup.count <= 70);
    assert.ok(
      company[0].end - company[0].start >= 60 * 60000 &&
        company[0].end - company[0].start <= 90 * 60000,
    );
    assert.ok(history.some((item) => item.setup.name.includes("1on1")));
    assert.ok(history.some((item) => (item.end - item.start) % 60000 !== 0));
    assert.ok(!byDay.has(today));
  });
}
test("祝日一覧・振替休日・国民の休日を年別に判定する", () => {
  for (const date of calendarHolidays)
    assert.equal(isBusinessDay(Date.parse(`${date}T10:00:00+09:00`)), false, date);
  assert.deepEqual(
    [...holidaysForYear(2026)].map((day) => japanParts(day).date).sort(),
    [...calendarHolidays].filter((day) => day.startsWith("2026")).sort(),
  );
  assert.equal(isBusinessDay(Date.parse("2026-09-24T10:00:00+09:00")), true);
  assert.equal(isBusinessDay(Date.parse("2027-03-22T10:00:00+09:00")), false);
});

test("定例の会議名は繰り返す", () =>
  assert.ok(
    createSeed(epoch).history.filter((item) => item.setup.name === "週次の進捗共有").length >= 6,
  ));
test("開始時刻は00分・30分が中心", () =>
  assert.ok(
    createSeed(epoch).history.filter((item) => /:(00|30)$/.test(japanParts(item.start).time))
      .length >= 24,
  ));
test("シードは時間にばらつきがある", () =>
  assert.ok(new Set(createSeed(epoch).history.map((item) => item.end - item.start)).size > 15));
test("全社説明会は高額", () => {
  const data = createSeed(epoch).history;
  const all = data.find((item) => item.setup.name.includes("全社"));
  assert.ok(calculate(all, all.end).cost > 100000);
});
test("朝会は月曜", () => {
  const item = createSeed(epoch).history.find((item) => item.setup.name.includes("月曜"));
  assert.equal(new Date(item.start + 9 * 3600000).getUTCDay(), 1);
});
test("別の日は並び順が変わる", () =>
  assert.notDeepEqual(
    createSeed(epoch).history.map((item) => item.setup.name),
    createSeed(epoch + DAY).history.map((item) => item.setup.name),
  ));
test("JSONバックアップ往復", () => {
  const data = createSeed(epoch);
  assert.deepEqual(readBackup(writeBackup(data)), data);
});
for (const invalid of ["null", "{}", "[]", "not json", '{"version":2}', "x".repeat(5000001)]) {
  test(`不正バックアップ拒否 ${invalid.slice(0, 20)}`, () =>
    assert.throws(() => readBackup(invalid)));
}
test("重複IDを拒否", () => {
  const data = createSeed(epoch);
  data.history.push(data.history[0]);
  assert.equal(validStore(data), false);
});
test("重なる一時停止区間を拒否", () => {
  const current = meeting();
  current.pauses = [
    { start: epoch, end: epoch + 10000 },
    { start: epoch + 5000, end: null },
  ];
  assert.equal(validMeeting(current), false);
});
test("終了前の開始が必要", () =>
  assert.equal(validMeeting({ ...meeting(), end: epoch - 1 }), false));
test("単価変更の逆順を拒否", () => {
  const current = changeParticipants(meeting(), setup, epoch - 1);
  assert.equal(validMeeting(current), false);
});
test("人数の小数を拒否", () => assert.equal(validSetup({ ...setup, count: 1.5 }), false));
test("役職全員0を拒否", () =>
  assert.equal(
    validSetup({ ...setup, mode: "roles", roles: [{ name: "担当", count: 0, rate: 1000 }] }),
    false,
  ));
test("保存破損は通知付きで復元", () => {
  const restored = restore("bad", epoch);
  assert.ok(restored.notice);
  assert.equal(restored.store.history.length, 30);
});
test("初回には破損通知なし", () => assert.equal(restore(null, epoch).notice, ""));
test("履歴を降順にする", () => {
  const list = sortedHistory(createSeed(epoch).history.reverse());
  assert.ok(list.every((item, index) => index === 0 || list[index - 1].start >= item.start));
});
test("月次集計", () => {
  const current = finishMeeting(meeting(), epoch + 60000);
  assert.equal(statistics([current], epoch).monthlyTotal, 120);
});
test("別月の集計に混ぜない", () => {
  const current = finishMeeting(meeting(), epoch + 60000);
  assert.equal(statistics([current], Date.parse("2026-12-01")).monthlyTotal, 0);
});
test("空の集計", () =>
  assert.deepEqual(statistics([], epoch), {
    monthlyTotal: 0,
    monthlyCount: 0,
    averageDuration: 0,
    highest: null,
  }));
test("平均時間と最高額", () => {
  const result = statistics(
    [finishMeeting(meeting(), epoch + 60000), finishMeeting(meeting(), epoch + 120000)],
    epoch,
  );
  assert.equal(result.averageDuration, 90000);
  assert.equal(result.highest.cost, 240);
});
test("CSVはBOM付き", () => assert.equal(historyCsv([]).charCodeAt(0), 0xfeff));
test("CSVの二重引用符をエスケープ", () => assert.equal(csvCell('a,"b"'), '"a,""b"""'));
test("CSVの数式対策", () => assert.equal(csvCell("=1+1"), '"\'=1+1"'));
test("CSVファイル名の日付範囲", () =>
  assert.equal(
    csvFilename([finishMeeting(meeting(), epoch + 1000)], epoch),
    "会議コスト履歴_2026-11-18_2026-11-18.csv",
  ));
test("CSV空配列の名前", () =>
  assert.equal(csvFilename([], epoch), "会議コスト履歴_2026-11-18_2026-11-18.csv"));
test("CSVの行数", () =>
  assert.equal(historyCsv(createSeed(epoch).history).split("\r\n").length, 31));
