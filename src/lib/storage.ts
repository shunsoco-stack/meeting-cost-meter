import { readBackup, writeBackup } from "./backup";
import { createSeed } from "./seed";
import type { Store } from "./types";

export const STORAGE_KEY = "mcm:v1";

export function restore(raw: string | null, now: number) {
  if (!raw) return { store: createSeed(now), notice: "" };
  try {
    return { store: readBackup(raw), notice: "" };
  } catch {
    return {
      store: createSeed(now),
      notice: "保存データが壊れていたため、既定の架空データに戻しました。",
    };
  }
}

export function persist(store: Store) {
  localStorage.setItem(STORAGE_KEY, writeBackup(store));
}
