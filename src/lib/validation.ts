import type { Meeting, Role, Setup, Store } from "./types";

export function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function numberIn(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function text(value: unknown, length: number): value is string {
  return typeof value === "string" && value.length <= length && !/[\u0000-\u001f]/.test(value);
}

export function validRole(value: unknown): value is Role {
  return (
    record(value) &&
    text(value.name, 30) &&
    value.name.trim().length > 0 &&
    numberIn(value.count, 0, 10000) &&
    Number.isInteger(value.count) &&
    numberIn(value.rate, 0, 1000000)
  );
}

export function validSetup(value: unknown): value is Setup {
  return (
    record(value) &&
    text(value.name, 80) &&
    ["average", "roles"].includes(String(value.mode)) &&
    numberIn(value.count, 1, 10000) &&
    Number.isInteger(value.count) &&
    numberIn(value.rate, 0, 1000000) &&
    numberIn(value.room, 0, 1000000) &&
    Array.isArray(value.roles) &&
    value.roles.length > 0 &&
    value.roles.length <= 20 &&
    value.roles.every(validRole) &&
    (value.mode === "average" || value.roles.reduce((sum, role) => sum + role.count, 0) > 0)
  );
}

export function validMeeting(value: unknown): value is Meeting {
  if (
    !record(value) ||
    !text(value.id, 100) ||
    !/^[\w-]+$/.test(value.id) ||
    !validSetup(value.setup) ||
    !numberIn(value.start, 0, 8e12)
  )
    return false;
  if (value.end !== null && !numberIn(value.end, value.start, 8e12)) return false;
  const end = typeof value.end === "number" ? value.end : 8e12;
  if (
    !Array.isArray(value.pauses) ||
    value.pauses.length > 10000 ||
    !Array.isArray(value.changes) ||
    !value.changes.length ||
    value.changes.length > 10000
  )
    return false;
  let previousEnd = value.start;
  for (const pause of value.pauses) {
    if (!record(pause) || !numberIn(pause.start, previousEnd, end)) return false;
    if (pause.end !== null && !numberIn(pause.end, pause.start, end)) return false;
    if (pause.end === null && value.end !== null) return false;
    previousEnd = pause.end === null ? Infinity : (pause.end as number);
  }
  let previousChange = value.start;
  for (const change of value.changes) {
    if (
      !record(change) ||
      !numberIn(change.at, previousChange, end) ||
      !numberIn(change.hourly, 0, 2e11) ||
      !numberIn(change.count, 0, 200000) ||
      !Number.isInteger(change.count)
    )
      return false;
    previousChange = change.at;
  }
  return value.changes[0].at === value.start;
}

export function validStore(value: unknown): value is Store {
  if (
    !record(value) ||
    value.version !== 1 ||
    !validSetup(value.setup) ||
    typeof value.analogies !== "boolean" ||
    !Array.isArray(value.presets) ||
    !value.presets.length ||
    value.presets.length > 20 ||
    !value.presets.every(validRole)
  )
    return false;
  if (value.active !== null && (!validMeeting(value.active) || value.active.end !== null))
    return false;
  if (
    !Array.isArray(value.history) ||
    value.history.length > 10000 ||
    !value.history.every((item) => validMeeting(item) && item.end !== null)
  )
    return false;
  const ids = value.history.map((item) => item.id);
  if (value.active) ids.push(value.active.id);
  return new Set(ids).size === ids.length;
}
