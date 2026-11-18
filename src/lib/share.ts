import type { Card } from "./types";
import { numberIn, record } from "./validation";
import { yen } from "./rates";

export function validCard(value: unknown): value is Card {
  if (!record(value)) return false;
  const date = typeof value.date === "string" ? value.date : "";
  return (
    typeof value.name === "string" &&
    value.name.length <= 80 &&
    typeof value.analogy === "string" &&
    value.analogy.length <= 100 &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(Date.parse(date)) &&
    new Date(date).toISOString().slice(0, 10) === date &&
    typeof value.time === "string" &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(value.time) &&
    numberIn(value.duration, 0, 8e12) &&
    numberIn(value.count, 0, 200000) &&
    Number.isInteger(value.count) &&
    numberIn(value.cost, 0, 1e15) &&
    Number.isInteger(value.cost)
  );
}

export function encodeShare(card: Card) {
  if (!validCard(card)) throw new Error("共有内容が不正です。");
  return new URLSearchParams({ v: "1", data: JSON.stringify(publicFields(card)) }).toString();
}

function publicFields(card: Card): Card {
  const { name, date, time, duration, count, cost, analogy } = card;
  return { name, date, time, duration, count, cost, analogy };
}

export function decodeShare(query: string): Card | null {
  if (query.length > 12000) return null;
  try {
    const params = new URLSearchParams(query);
    if (
      params.get("v") !== "1" ||
      params.getAll("v").length !== 1 ||
      params.getAll("data").length !== 1
    )
      return null;
    const card: unknown = JSON.parse(params.get("data") ?? "null");
    return validCard(card) ? publicFields(card) : null;
  } catch {
    return null;
  }
}

export function shareText(card: Card) {
  return `「${card.name}」、${Math.floor(card.duration / 60000)}分・${card.count}人で ${yen(card.cost)}円でした。 #会議コストメーター`;
}
