"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ResultScreen } from "@/components/result-screen";

export default function NotFound() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const ready = () => setMounted(true);
    ready();
  }, []);
  if (!mounted) return <p role="status">ページを確認しています…</p>;
  if (pathname?.startsWith("/result/")) return <ResultScreen />;
  return (
    <>
      <h1>ページが見つかりません</h1>
      <Link href="/">ホームに戻る</Link>
    </>
  );
}
