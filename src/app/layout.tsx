import type { Metadata } from "next";
import { StoreProvider } from "@/components/store-provider";
import { Shell } from "@/components/shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "会議コストメーター",
  description:
    "その会議、いくらかかる？参加人数と時給から、会議の時間とコストをリアルタイムに見える化するデモアプリ。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  );
}
