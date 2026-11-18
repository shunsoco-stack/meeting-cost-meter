"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useStore } from "./store-provider";
import { Loading, PageHeading } from "./shell";
import { ParticipantFields } from "./participant-fields";
import { calculate, changeParticipants, finishMeeting, togglePause } from "@/lib/meter";
import { durationLabel } from "@/lib/dates";
import { hourlyRate, participants, yen } from "@/lib/rates";
import { analogy, milestone } from "@/lib/analogies";
import { validSetup } from "@/lib/validation";
import type { Meeting } from "@/lib/types";

export function MeterScreen() {
  const { store } = useStore();
  if (!store) return <Loading />;
  if (!store.active)
    return (
      <>
        <PageHeading eyebrow="LIVE METER" title="計測中の会議はありません" />
        <Link className="button primary" href="/">
          会議を設定する →
        </Link>
      </>
    );
  return <LiveMeter meeting={store.active} />;
}

function LiveMeter({ meeting }: { meeting: Meeting }) {
  const { store, update, notify } = useStore();
  const [now, setNow] = useState(() => Date.now());
  const [draft, setDraft] = useState(meeting.setup);
  const [full, setFull] = useState(false);
  const [comparison, setComparison] = useState("");
  const previousMilestone = useRef(0);
  const panel = useRef<HTMLDivElement>(null);
  const result = calculate(meeting, now);
  const paused = meeting.pauses.at(-1)?.end === null;
  const currentMilestone = milestone(result.cost);
  useEffect(() => {
    let frame: number;
    const tick = () => {
      setNow(Date.now());
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (currentMilestone > previousMilestone.current) {
      previousMilestone.current = currentMilestone;
      const timer = window.setTimeout(
        () => setComparison(analogy(currentMilestone, Math.random())),
        0,
      );
      return () => window.clearTimeout(timer);
    }
  }, [currentMilestone]);
  useEffect(() => {
    const changed = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);
  function save(active: Meeting) {
    if (store) update({ ...store, active });
  }
  return (
    <>
      <PageHeading eyebrow="LIVE METER" title={meeting.setup.name || "名前のない会議"}>
        この時間にも、価値があります。
      </PageHeading>
      <div
        ref={panel}
        className={`meter-display ${full ? "fullscreen" : ""}`}
        style={
          {
            "--meter-color": `hsl(${Math.max(18, 44 - result.cost / 4000)} 95% 65%)`,
          } as React.CSSProperties
        }
      >
        <div className="meter-top">
          <span>
            <span className={`live-dot ${paused ? "paused" : ""}`} />{" "}
            {paused ? "一時停止中" : "計測中"}
          </span>
          <button
            onClick={async () => {
              try {
                if (document.fullscreenElement) await document.exitFullscreen();
                else if (panel.current?.requestFullscreen) await panel.current.requestFullscreen();
                else setFull(!full);
              } catch {
                setFull(!full);
              }
            }}
          >
            {full ? "全画面を閉じる" : "⛶ 全画面表示"}
          </button>
        </div>
        <p className="meter-label">ただいまの会議コスト</p>
        <div className="meter-price">
          <span>¥</span>
          {yen(result.cost)}
        </div>
        <div className="meter-metrics">
          <div>
            <span>経過時間</span>
            <strong>{durationLabel(result.duration)}</strong>
          </div>
          <div>
            <span>1分あたり</span>
            <strong>¥{yen(hourlyRate(meeting.setup) / 60)}</strong>
          </div>
          <div>
            <span>1時間あたり</span>
            <strong>¥{yen(hourlyRate(meeting.setup))}</strong>
          </div>
        </div>
        {store?.analogies && comparison && (
          <p key={currentMilestone} className="analogy" aria-live="polite">
            ✦ {comparison}くらいになりました。<small>価格は例えのための目安です</small>
          </p>
        )}
        <div className="meter-actions">
          <button onClick={() => save(togglePause(meeting, Date.now()))}>
            {paused ? "▶ 再開する" : "Ⅱ 一時停止"}
          </button>
          <button
            className="primary"
            onClick={async () => {
              if (!store) return;
              const completed = finishMeeting(meeting, Date.now());
              update({ ...store, active: null, history: [completed, ...store.history] });
              if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
              // Static hosts must load the shared HTML shell for IDs created after the build.
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination
              window.location.assign(`/result/${completed.id}`);
            }}
          >
            ■ 会議を終了する
          </button>
        </div>
      </div>
      <form
        className="panel attendance-panel"
        onSubmit={(event) => {
          event.preventDefault();
          if (!validSetup(draft)) {
            notify("人数と時給を確認してください。");
            return;
          }
          save(changeParticipants(meeting, draft, Date.now()));
          notify("参加者の変更を、この時点から反映しました。");
        }}
      >
        <div className="section-title">
          <h2>途中参加・途中退出</h2>
          <span className="muted">現在 {participants(meeting.setup)}人</span>
        </div>
        <ParticipantFields setup={draft} onChange={setDraft} />
        <button type="submit">この人数・時給に変更</button>
        <p className="hint">
          変更前の費用はそのまま。変更した瞬間から新しい単価で計算します。一時停止中はツール代も停止します。
        </p>
      </form>
    </>
  );
}
