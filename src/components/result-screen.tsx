"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "./store-provider";
import { Loading, PageHeading } from "./shell";
import type { Card } from "@/lib/types";
import { meetingCard } from "@/lib/history";
import { decodeShare, encodeShare, shareText } from "@/lib/share";
import { durationLabel, imageFilename } from "@/lib/dates";
import { yen } from "@/lib/rates";
import { cardImage, downloadBlob } from "@/lib/download";

export function ResultScreen({ shared = false }: { shared?: boolean }) {
  const { store } = useStore();
  const [location, setLocation] = useState<{ id: string; card: Card | null } | null>(null);
  useEffect(() => {
    const load = () =>
      setLocation({
        id: decodeURIComponent(window.location.pathname.split("/").filter(Boolean).at(-1) ?? ""),
        card: decodeShare(window.location.search),
      });
    load();
  }, []);
  if (!location || (!shared && !store)) return <Loading />;
  const meeting = store?.history.find((item) => item.id === location.id);
  const card = shared ? location.card : meeting ? meetingCard(meeting) : null;
  if (!card)
    return (
      <>
        <PageHeading eyebrow="MEETING RECEIPT" title="表示できません" />
        <p>URLの内容が不正か、このブラウザに会議が保存されていません。</p>
        <Link className="button" href="/">
          ホームへ戻る
        </Link>
      </>
    );
  return (
    <>
      <PageHeading eyebrow="MEETING RECEIPT" title="おつかれさまでした。">
        時間の価値を、次の会議のヒントに。
      </PageHeading>
      <ResultCard card={card} />
      <ShareActions card={card} />
      <p className="center hint">人数は最大同時参加人数です。金額・例えは目安です。</p>
      <div className="center">
        <Link href="/">新しい会議をはじめる →</Link>
      </div>
    </>
  );
}

export function ResultCard({ card }: { card: Card }) {
  return (
    <article className="result-card">
      <span className="eyebrow">MEETING COST METER</span>
      <h2>この会議の値段</h2>
      <p className="result-name">{card.name}</p>
      <div className="result-price">¥{yen(card.cost)}</div>
      <div className="receipt-rule" />
      <dl>
        <div>
          <dt>開催日時</dt>
          <dd>
            {card.date} {card.time}
          </dd>
        </div>
        <div>
          <dt>会議時間</dt>
          <dd>{durationLabel(card.duration)}</dd>
        </div>
        <div>
          <dt>参加人数</dt>
          <dd>最大 {card.count}人</dd>
        </div>
        <div>
          <dt>1分あたり</dt>
          <dd>¥{yen(card.duration ? card.cost / (card.duration / 60000) : 0)}</dd>
        </div>
      </dl>
      <p className="result-analogy">✦ {card.analogy}</p>
      <small>デモ用の架空データです</small>
    </article>
  );
}

function ShareActions({ card }: { card: Card }) {
  const { notify } = useStore();
  const [canShare, setCanShare] = useState(false);
  const [name, setName] = useState("会議");
  useEffect(() => {
    const detect = () => setCanShare(typeof navigator.share === "function");
    detect();
  }, []);
  const publicCard = { ...card, name: name.trim() || "会議" };
  function url() {
    return `${window.location.origin}/share?${encodeShare(publicCard)}`;
  }
  async function action(callback: () => Promise<void>) {
    try {
      await callback();
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        notify("操作できませんでした。ブラウザの権限や保存設定をご確認ください。");
    }
  }
  return (
    <section className="share-actions">
      <label className="field">
        <span>共有用の会議名（個人名を入れないでください）</span>
        <input maxLength={80} value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <p className="hint">
        共有URL・画像・文面はこの名前を使います。元の会議名は自動で含めません。
      </p>
      <div className="button-row">
        <button
          className="primary"
          onClick={() =>
            action(async () => {
              await navigator.clipboard.writeText(url());
              notify("共有用URLをコピーしました。");
            })
          }
        >
          ↗ URLをコピー
        </button>
        <button
          onClick={() =>
            action(async () => {
              downloadBlob(
                await cardImage(publicCard),
                imageFilename(Date.parse(`${card.date}T${card.time}:00+09:00`)),
              );
              notify("PNG画像を保存しました。");
            })
          }
        >
          ↓ 画像として保存
        </button>
        <button
          onClick={() =>
            action(async () => {
              await navigator.clipboard.writeText(shareText(publicCard));
              notify("共有文面をコピーしました。");
            })
          }
        >
          文面をコピー
        </button>
        {canShare && (
          <button
            onClick={() =>
              action(() =>
                navigator.share({
                  title: "この会議の値段",
                  text: shareText(publicCard),
                  url: url(),
                }),
              )
            }
          >
            共有
          </button>
        )}
      </div>
    </section>
  );
}
