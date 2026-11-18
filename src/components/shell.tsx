"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "./store-provider";

const links = [
  ["/", "◷", "会議をはじめる"],
  ["/meter", "▥", "メーター"],
  ["/history", "▤", "過去の会議"],
  ["/settings", "⚙", "設定"],
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { notice, notify } = useStore();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-mark">¥</span>
          <span>
            会議コスト
            <br />
            メーター<small>MEETING COST METER</small>
          </span>
        </Link>
        <p className="nav-caption">時間を、価値に変えよう。</p>
        <nav aria-label="メインナビゲーション">
          {links.map(([href, icon, label]) => (
            <Link
              key={href}
              href={href}
              className={pathname === href ? "active" : ""}
              aria-current={pathname === href ? "page" : undefined}
            >
              <span aria-hidden="true">{icon}</span>
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/backup">↓ バックアップ</Link>
          <Link href="/about">ⓘ このデモについて</Link>
          <p>
            その会議、
            <br />
            おいくらですか。
          </p>
          <small>デモ用の架空データです</small>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span>小さな気づきで、会議を少し短く。</span>
          <span className="demo-badge">
            DEMO <span>架空データ</span>
          </span>
        </header>
        {notice && (
          <div className="notice" role="status">
            {notice}
            <button onClick={() => notify("")} aria-label="通知を閉じる">
              ×
            </button>
          </div>
        )}
        <main>{children}</main>
        <footer>
          金額は目安です。データはこのブラウザ内に保存されます。
          <Link href="/about">このデモについて</Link>
          <Link href="/backup">バックアップ</Link>
        </footer>
      </div>
      <nav className="mobile-tabs" aria-label="モバイルナビゲーション">
        {links.map(([href, icon, label]) => (
          <Link key={href} href={href} className={pathname === href ? "active" : ""}>
            <span aria-hidden="true">{icon}</span>
            {label === "会議をはじめる" ? "はじめる" : label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {children && <p className="subheading">{children}</p>}
    </div>
  );
}

export function Loading() {
  return (
    <p className="panel" role="status">
      ブラウザのデータを読み込んでいます…
    </p>
  );
}
