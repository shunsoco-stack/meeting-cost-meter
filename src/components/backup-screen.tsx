"use client";

import { useState } from "react";
import { useStore } from "./store-provider";
import { Loading, PageHeading } from "./shell";
import { readBackup, writeBackup } from "@/lib/backup";
import { downloadBlob } from "@/lib/download";
import { japanParts } from "@/lib/dates";
import type { Store } from "@/lib/types";

export function BackupScreen() {
  const { store, update, notify } = useStore();
  const [pending, setPending] = useState<Store | null>(null);
  if (!store) return <Loading />;
  return (
    <>
      <PageHeading eyebrow="KEEP YOUR DATA" title="バックアップ">
        ブラウザを変えるときも、会議の記録を持ち運べます。
      </PageHeading>
      <section className="panel">
        <h2>データを書き出す</h2>
        <p>履歴・設定・計測中の会議を、JSONファイルにまとめます。</p>
        <button
          className="primary"
          onClick={() =>
            downloadBlob(
              new Blob([writeBackup(store)], { type: "application/json" }),
              `会議コストバックアップ_${japanParts(Date.now()).date}.json`,
            )
          }
        >
          ↓ バックアップを書き出す（JSON）
        </button>
      </section>
      <section className="panel">
        <h2>データを読み込む</h2>
        <p>内容を検証したあと、現在のデータを置き換えます。最大5MB。</p>
        <input
          className="visually-hidden file-input"
          type="file"
          id="backup-file"
          accept=".json,application/json"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            setPending(null);
            if (!file) return;
            try {
              if (file.size > 5000000) throw new Error("ファイルが大きすぎます（最大5MB）。");
              setPending(readBackup(await file.text()));
            } catch (error) {
              notify(error instanceof Error ? error.message : "読み込めませんでした。");
            }
          }}
        />
        <label className="button file-label" htmlFor="backup-file">
          バックアップを読み込む（JSON）
        </label>
        {pending && (
          <div className="confirmation" role="status">
            <p>
              履歴 {pending.history.length}件、計測中の会議 {pending.active ? "1件" : "なし"}
              。この内容で現在のデータを置き換えますか？
            </p>
            <div className="button-row">
              <button
                className="primary"
                onClick={() => {
                  update(pending);
                  setPending(null);
                  notify("バックアップを復元しました。");
                }}
              >
                この内容で復元する
              </button>
              <button onClick={() => setPending(null)}>キャンセル</button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
