"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "./store-provider";
import { Loading, PageHeading } from "./shell";
import { NumberField, ParticipantFields } from "./participant-fields";
import { hourlyRate, participants, yen } from "@/lib/rates";
import { startMeeting } from "@/lib/meter";
import { validSetup } from "@/lib/validation";
import { statistics } from "@/lib/stats";
import { meetingCard, sortedHistory } from "@/lib/history";
import type { Store } from "@/lib/types";

export function SetupScreen() {
  const { store } = useStore();
  if (!store) return <Loading />;
  return <SetupForm initial={store} />;
}

function SetupForm({ initial }: { initial: Store }) {
  const { store, update, notify } = useStore();
  const [setup, setSetup] = useState(initial.setup);
  const [now] = useState(() => Date.now());
  const router = useRouter();
  const hourly = hourlyRate(setup);
  const stats = statistics(store?.history ?? [], now);
  const recent = sortedHistory(store?.history ?? []).slice(0, 3);
  return (
    <>
      <PageHeading eyebrow="LET’S MAKE TIME COUNT" title="その会議、いくらかかる？">
        人数と時給を入れたら、準備完了。会議のコストを見える化しましょう。
      </PageHeading>
      {store?.active && (
        <div className="resume-banner">
          計測中の会議があります。
          <Link className="button" href="/meter">
            メーターに戻る →
          </Link>
        </div>
      )}
      <div className="setup-grid">
        <form
          className="panel setup-panel"
          onSubmit={(event) => {
            event.preventDefault();
            if (!store || store.active) return;
            if (!validSetup(setup)) {
              notify("人数・時給・役職名を確認してください。役職別では合計1人以上が必要です。");
              return;
            }
            const active = startMeeting(setup, Date.now(), crypto.randomUUID());
            update({ ...store, setup, active });
            router.push("/meter");
          }}
        >
          <div className="section-title">
            <span className="step">01</span>
            <h2>会議の設定</h2>
            <span className="muted">約10秒で準備完了</span>
          </div>
          <label className="field">
            <span>
              会議名 <small>任意</small>
            </span>
            <input
              maxLength={80}
              placeholder="例：新商品の企画ミーティング"
              value={setup.name}
              onChange={(event) => setSetup({ ...setup, name: event.target.value })}
            />
          </label>
          <div className="field">
            <span>参加者の入れ方</span>
            <div className="segmented">
              {(["average", "roles"] as const).map((mode) => (
                <button
                  type="button"
                  key={mode}
                  aria-pressed={setup.mode === mode}
                  className={setup.mode === mode ? "selected" : ""}
                  onClick={() => setSetup({ ...setup, mode, roles: store?.presets ?? setup.roles })}
                >
                  {mode === "average" ? "人数 × 平均時給" : "役職ごとの人数 × 時給"}
                </button>
              ))}
            </div>
          </div>
          <ParticipantFields setup={setup} onChange={setSetup} />
          <p className="hint">ⓘ 時給は架空の例です。ざっくりした目安で大丈夫。</p>
          <div className="room-field">
            <NumberField
              label="会議室・ツール代（任意）"
              value={setup.room}
              suffix="円 / 時"
              onChange={(room) => setSetup({ ...setup, room })}
            />
            <p className="hint">追加費用がなければ、0円のままで。</p>
          </div>
          <button className="primary start-button" disabled={!!store?.active} type="submit">
            <span>▶</span> この設定で会議を開始 <span>→</span>
          </button>
          <p className="center hint">開始後も人数の変更・一時停止ができます</p>
        </form>
        <aside className="preview-column">
          <div className="cost-preview">
            <span className="preview-label">
              <span className="live-dot" /> COST PREVIEW
            </span>
            <h2>この会議、1時間で</h2>
            <div className="preview-price">
              <small>¥</small>
              {yen(hourly)}
            </div>
            <p>
              {participants(setup)}人で、1分あたり <strong>¥{yen(hourly / 60)}</strong>
            </p>
            <div className="preview-divider" />
            <div className="preview-estimates">
              <span>
                30分なら<strong>¥{yen(hourly / 2)}</strong>
              </span>
              <span>
                15分短くすると<strong>¥{yen(hourly / 4)} 節約</strong>
              </span>
            </div>
            <span className="preview-footnote">時間を意識する。それだけで、少し変わる。</span>
          </div>
          <div className="tip-card">
            <span>✦</span>
            <div>
              <h3>会議にも、値札を。</h3>
              <p>責めるためではなく、気づくための数字。いい会議を、ちょうどいい長さで。</p>
            </div>
          </div>
        </aside>
      </div>
      <div className="section-heading">
        <h2>最近の会議</h2>
        <Link href="/history">すべての履歴を見る →</Link>
      </div>
      <div className="recent-grid">
        {recent.map((meeting) => {
          const card = meetingCard(meeting);
          return (
            <a href={`/result/${meeting.id}`} className="recent-card" key={meeting.id}>
              <span>
                {card.date} · {Math.floor(card.duration / 60000)}分
              </span>
              <h3>{card.name}</h3>
              <strong>¥{yen(card.cost)}</strong>
              <small>
                {card.count}人参加 <span>↗</span>
              </small>
            </a>
          );
        })}
      </div>
      <p className="monthly-summary">
        今月の会議コスト <strong>¥{yen(stats.monthlyTotal)}</strong>
        <span> / {stats.monthlyCount}件の会議</span>
        <span className="demo-note">デモ用の架空データです</span>
      </p>
    </>
  );
}
