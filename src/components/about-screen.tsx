"use client";

import { useState } from "react";
import { useStore } from "./store-provider";
import { PageHeading } from "./shell";
import { createSeed } from "@/lib/seed";

export function AboutScreen() {
  const { update, notify } = useStore();
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <PageHeading eyebrow="ABOUT THIS DEMO" title="会議にも、値札を。">
        ちょっと笑えて、少しだけ会議を短くしたくなる道具。
      </PageHeading>
      <article className="panel prose">
        <h2>デモ用の架空データです</h2>
        <p>
          会議名・時給・人数は架空の例です。表示金額は人件費と会議室・ツール代の目安であり、実際の給与や請求額を示すものではありません。例えに使う価格も固定の架空の目安です。
        </p>
        <h2>計算方法</h2>
        <p>
          人数 ×
          時給（役職別の場合はその合計）に会議室・ツール代を加え、実際の経過時間で積算します。途中の人数・時給変更は、その時点から反映。一時停止中はすべての費用が止まります。1円未満は積算後に切り捨てます。
        </p>
        <h2>日時と保存先</h2>
        <p>
          日時は日本時間。経過時間は端末の時計を使い、ページを閉じている間やスリープ中も計算します。端末の時計を変更すると影響を受けます。データはブラウザの
          localStorage（mcm:v1）に保存し、外部APIやサーバーには送信しません。共有URLに含めた内容は、リンクを受け取った人が読むことができます。
        </p>
        <h2>会議の内容は、記録しません</h2>
        <p>
          議事録・要約・フォローアップ・予約・カレンダー連携・勤怠管理は行いません。会議の「時間とコスト」に集中したデモです。
        </p>
        <h2>既定データに戻す</h2>
        <p>
          現在の履歴・設定・計測中の会議を消し、日本時間の今日を基準に架空の会議30件を作り直します。
        </p>
        {!confirm ? (
          <button onClick={() => setConfirm(true)}>既定データに戻す</button>
        ) : (
          <div className="confirmation">
            <p>このブラウザの記録を置き換えます。必要な記録は先にバックアップしてください。</p>
            <div className="button-row">
              <button
                className="danger"
                onClick={() => {
                  update(createSeed(Date.now()));
                  setConfirm(false);
                  notify("既定の架空データに戻しました。");
                }}
              >
                記録を置き換える
              </button>
              <button onClick={() => setConfirm(false)}>キャンセル</button>
            </div>
          </div>
        )}
      </article>
    </>
  );
}
