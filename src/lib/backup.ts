import { validStore } from "./validation";
import type { Store } from "./types";

export function readBackup(text: string): Store {
  if (text.length > 5_000_000) throw new Error("ファイルが大きすぎます（最大5MB）。");
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("JSON形式を読み取れません。");
  }
  if (!validStore(value))
    throw new Error("バックアップの内容・バージョン・日時に不正な値があります。");
  return value;
}

export function writeBackup(store: Store) {
  return JSON.stringify(store, null, 2);
}
