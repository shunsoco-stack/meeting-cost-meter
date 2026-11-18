"use client";

import { useState } from "react";
import { useStore } from "./store-provider";
import { Loading, PageHeading } from "./shell";
import { RoleFields } from "./participant-fields";
import { validRole } from "@/lib/validation";
import type { Store } from "@/lib/types";

export function SettingsScreen() {
  const { store } = useStore();
  if (!store) return <Loading />;
  return <SettingsForm initial={store} />;
}

function SettingsForm({ initial }: { initial: Store }) {
  const { store, update, notify } = useStore();
  const [roles, setRoles] = useState(initial.presets);
  const [enabled, setEnabled] = useState(initial.analogies);
  return (
    <>
      <PageHeading eyebrow="PREFERENCES" title="いつもの設定">
        チームに合わせて、ちょうどよく。
      </PageHeading>
      <form
        className="panel"
        onSubmit={(event) => {
          event.preventDefault();
          if (!store) return;
          if (!roles.every(validRole)) {
            notify("役職名・人数・時給を確認してください。");
            return;
          }
          update({ ...store, presets: roles, analogies: enabled });
          notify("設定を保存しました。役職プリセットは次回の役職別設定に反映されます。");
        }}
      >
        <h2>役職と時給のプリセット</h2>
        <p className="hint">時給は架空の例です。個人名ではなく、役職名を入力してください。</p>
        <RoleFields editable roles={roles} onChange={setRoles} />
        <hr />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />
          <span>
            費用の節目に、例えを表示する
            <small>ランチ、新幹線、旅行など。メーター上にふわっと表示します。</small>
          </span>
        </label>
        <button className="primary" type="submit">
          設定を保存する
        </button>
      </form>
    </>
  );
}
