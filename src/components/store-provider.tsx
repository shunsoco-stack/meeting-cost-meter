"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Store } from "@/lib/types";
import { persist, restore, STORAGE_KEY } from "@/lib/storage";

type Context = {
  store: Store | null;
  update: (store: Store) => void;
  notice: string;
  notify: (message: string) => void;
};

const StoreContext = createContext<Context | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store | null>(null);
  const [notice, notify] = useState("");
  useEffect(() => {
    const load = () => {
      try {
        const restored = restore(localStorage.getItem(STORAGE_KEY), Date.now());
        setStore(restored.store);
        notify(restored.notice);
        try {
          persist(restored.store);
        } catch {
          notify("保存できません。読み込んだデータは利用できますが、変更は保持されません。");
        }
      } catch {
        setStore(restore(null, Date.now()).store);
        notify("ブラウザに保存できません。この画面を閉じると変更が失われます。");
      }
    };
    load();
    const sync = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) load();
    };
    window.addEventListener("storage", sync);
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() => notify("オフライン機能を登録できませんでした。通常の計測は利用できます。"));
    }
    return () => window.removeEventListener("storage", sync);
  }, []);
  function update(next: Store) {
    setStore(next);
    try {
      persist(next);
    } catch {
      notify("保存できませんでした。空き容量とブラウザの保存設定をご確認ください。");
    }
  }
  return (
    <StoreContext.Provider value={{ store, update, notice, notify }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("保存データの準備ができていません。");
  return context;
}
