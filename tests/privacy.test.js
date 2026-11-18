import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const load = createRequire(import.meta.url);
const { encodeShare, decodeShare } = load("../src/lib/share.ts");

const card = {
  name: "会議",
  date: "2026-11-18",
  time: "14:30",
  duration: 60000,
  count: 2,
  cost: 120,
  analogy: "ひと呼吸",
};

test("共有URLには未知の個人情報フィールドを含めない", () => {
  const query = encodeShare({ ...card, personalName: "個人名のテスト", rawCost: 120.4 });
  assert.deepEqual(JSON.parse(new URLSearchParams(query).get("data")), card);
});

test("共有URLから未知のフィールドを除去", () => {
  const query = new URLSearchParams({
    v: "1",
    data: JSON.stringify({ ...card, personalName: "個人名のテスト" }),
  });
  assert.deepEqual(decodeShare(query.toString()), card);
});

test("共有URLの重複バージョンを拒否", () => {
  assert.equal(decodeShare(encodeShare(card) + "&v=2"), null);
});
