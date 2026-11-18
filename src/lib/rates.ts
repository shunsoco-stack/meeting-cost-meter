import type { Setup, Role } from "./types";

export const presets: Role[] = [
  { name: "部長", count: 1, rate: 5000 },
  { name: "課長", count: 2, rate: 3800 },
  { name: "メンバー", count: 4, rate: 2600 },
];

export const defaultSetup: Setup = {
  name: "",
  mode: "average",
  count: 6,
  rate: 3000,
  room: 0,
  roles: presets,
};

export function participants(setup: Setup) {
  return setup.mode === "average"
    ? setup.count
    : setup.roles.reduce((sum, role) => sum + role.count, 0);
}

export function hourlyRate(setup: Setup) {
  return (
    setup.room +
    (setup.mode === "average"
      ? setup.count * setup.rate
      : setup.roles.reduce((sum, role) => sum + role.count * role.rate, 0))
  );
}

export function yen(value: number) {
  return Math.floor(value).toLocaleString("ja-JP");
}
