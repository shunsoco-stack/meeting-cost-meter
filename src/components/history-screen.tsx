"use client";

import { useState } from "react";
import { useStore } from "./store-provider";
import { Loading, PageHeading } from "./shell";
import { statistics } from "@/lib/stats";
import { sortedHistory, meetingCard } from "@/lib/history";
import { yen } from "@/lib/rates";
import { csvFilename, historyCsv } from "@/lib/csv";
import { downloadBlob } from "@/lib/download";
import type { Meeting } from "@/lib/types";

export function HistoryScreen() {
  const { store } = useStore();
  if (!store) return <Loading />;
  return <HistoryContent history={store.history} />;
}

function HistoryContent({ history }: { history: Meeting[] }) {
  const [now] = useState(() => Date.now());
  const [query, setQuery] = useState("");
  const stats = statistics(history, now);
  const filtered = sortedHistory(history).filter((item) => item.setup.name.includes(query));
  return (
    <>
      <PageHeading eyebrow="MEETING ARCHIVE" title="過去の会議">
        積み重なった時間を、振り返ってみよう。
      </PageHeading>
      <div className="stats-grid">
        <div className="panel">
          <p>今月の合計</p>
          <strong>¥{yen(stats.monthlyTotal)}</strong>
          <small>{stats.monthlyCount}件の会議</small>
        </div>
        <div className="panel">
          <p>平均時間（全履歴）</p>
          <strong className="duration-stat">
            {Math.round(stats.averageDuration / 60000)} <span className="duration-unit">分</span>
          </strong>
          <small>{history.length}件の平均</small>
        </div>
        <div className="panel">
          <p>いちばん高かった会議</p>
          <strong>¥{yen(stats.highest?.cost ?? 0)}</strong>
          <small>{stats.highest?.meeting.setup.name ?? "まだありません"}</small>
        </div>
      </div>
      <div className="section-heading">
        <h2>
          会議の履歴 <small>{filtered.length}件</small>
        </h2>
        <button
          disabled={!filtered.length}
          onClick={() =>
            downloadBlob(
              new Blob([historyCsv(filtered)], { type: "text/csv;charset=utf-8" }),
              csvFilename(filtered, now),
            )
          }
        >
          ↓ CSVを書き出す
        </button>
      </div>
      <label className="field search-field">
        <span>会議名で検索</span>
        <input
          type="search"
          placeholder="会議名を入力"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>日付 / 開始</th>
              <th>会議名</th>
              <th>時間</th>
              <th>最大人数</th>
              <th>金額</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((meeting) => {
              const card = meetingCard(meeting);
              return (
                <tr key={meeting.id}>
                  <td>
                    {card.date}
                    <small>{card.time}</small>
                  </td>
                  <td>
                    <a href={`/result/${meeting.id}`}>{card.name} ↗</a>
                  </td>
                  <td>
                    {Math.floor(card.duration / 60000)}分{Math.floor(card.duration / 1000) % 60}秒
                  </td>
                  <td>{card.count}人</td>
                  <td className="table-cost">¥{yen(card.cost)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!filtered.length && <p className="empty">該当する会議はありません。</p>}
      </div>
      <p className="hint">CSVには検索結果を出力します。人数は会議中の最大同時参加人数です。</p>
    </>
  );
}
