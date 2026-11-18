"use client";

import type { Setup, Role } from "@/lib/types";

export function NumberField({
  label,
  value,
  onChange,
  max = 1000000,
  min = 0,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
  min?: number;
  suffix: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-unit">
        <input
          type="number"
          aria-label={label}
          required
          min={min}
          max={max}
          step="1"
          value={value}
          onChange={(event) => onChange(event.target.value === "" ? 0 : Number(event.target.value))}
        />
        <span>{suffix}</span>
      </div>
    </label>
  );
}

export function RoleFields({
  roles,
  onChange,
  editable = false,
}: {
  roles: Role[];
  onChange: (roles: Role[]) => void;
  editable?: boolean;
}) {
  function change(index: number, patch: Partial<Role>) {
    onChange(roles.map((role, position) => (position === index ? { ...role, ...patch } : role)));
  }
  return (
    <div className="role-fields">
      {roles.map((role, index) => (
        <div className="role-row" key={index}>
          <label className="field">
            <span>役職</span>
            <input
              aria-label={`役職 ${index + 1}`}
              required
              maxLength={30}
              value={role.name}
              onChange={(event) => change(index, { name: event.target.value })}
            />
          </label>
          <NumberField
            label="人数"
            value={role.count}
            max={10000}
            suffix="人"
            onChange={(count) => change(index, { count })}
          />
          <NumberField
            label="時給"
            value={role.rate}
            suffix="円"
            onChange={(rate) => change(index, { rate })}
          />
          {editable && roles.length > 1 && (
            <button
              type="button"
              aria-label={`${role.name}を削除`}
              onClick={() => onChange(roles.filter((_, position) => index !== position))}
            >
              ×
            </button>
          )}
        </div>
      ))}
      {editable && roles.length < 20 && (
        <button
          type="button"
          className="text-button"
          onClick={() => onChange([...roles, { name: "追加の役職", count: 1, rate: 3000 }])}
        >
          ＋ 役職を追加
        </button>
      )}
    </div>
  );
}

export function ParticipantFields({
  setup,
  onChange,
}: {
  setup: Setup;
  onChange: (setup: Setup) => void;
}) {
  return (
    <>
      {setup.mode === "average" ? (
        <div className="field-grid">
          <NumberField
            label="参加人数"
            value={setup.count}
            min={1}
            max={10000}
            suffix="人"
            onChange={(count) => onChange({ ...setup, count })}
          />
          <NumberField
            label="平均時給"
            value={setup.rate}
            suffix="円 / 時"
            onChange={(rate) => onChange({ ...setup, rate })}
          />
        </div>
      ) : (
        <RoleFields roles={setup.roles} onChange={(roles) => onChange({ ...setup, roles })} />
      )}
    </>
  );
}
