export type Role = { name: string; count: number; rate: number };

export type Setup = {
  name: string;
  mode: "average" | "roles";
  count: number;
  rate: number;
  room: number;
  roles: Role[];
};

export type Pause = { start: number; end: number | null };

export type Meeting = {
  id: string;
  setup: Setup;
  start: number;
  end: number | null;
  pauses: Pause[];
  changes: { at: number; hourly: number; count: number }[];
};

export type Card = {
  name: string;
  date: string;
  time: string;
  duration: number;
  count: number;
  cost: number;
  analogy: string;
};

export type Store = {
  version: 1;
  setup: Setup;
  presets: Role[];
  analogies: boolean;
  active: Meeting | null;
  history: Meeting[];
};
