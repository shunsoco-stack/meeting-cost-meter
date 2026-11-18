import type { Meeting, Setup } from "./types";
import { hourlyRate, participants } from "./rates";

export function activeDuration(meeting: Meeting, from: number, to: number) {
  const start = Math.max(from, meeting.start);
  const end = Math.max(start, Math.min(to, meeting.end ?? to));
  const paused = meeting.pauses.reduce(
    (sum, pause) =>
      sum + Math.max(0, Math.min(end, pause.end ?? end) - Math.max(start, pause.start)),
    0,
  );
  return Math.max(0, end - start - paused);
}

export function calculate(meeting: Meeting, now: number) {
  const end = meeting.end ?? now;
  const rawCost = meeting.changes.reduce((sum, change, index) => {
    const until = Math.min(end, meeting.changes[index + 1]?.at ?? end);
    return sum + (activeDuration(meeting, change.at, until) * change.hourly) / 3_600_000;
  }, 0);
  return {
    duration: activeDuration(meeting, meeting.start, end),
    cost: Math.floor(rawCost + 1e-9),
    rawCost,
  };
}

export function startMeeting(setup: Setup, now: number, id: string): Meeting {
  return {
    id,
    setup,
    start: now,
    end: null,
    pauses: [],
    changes: [{ at: now, hourly: hourlyRate(setup), count: participants(setup) }],
  };
}

export function changeParticipants(meeting: Meeting, setup: Setup, now: number): Meeting {
  return {
    ...meeting,
    setup,
    changes: [
      ...meeting.changes,
      { at: now, hourly: hourlyRate(setup), count: participants(setup) },
    ],
  };
}

export function togglePause(meeting: Meeting, now: number): Meeting {
  const last = meeting.pauses.at(-1);
  return {
    ...meeting,
    pauses:
      last && last.end === null
        ? meeting.pauses.map((pause, index) =>
            index === meeting.pauses.length - 1 ? { ...pause, end: now } : pause,
          )
        : [...meeting.pauses, { start: now, end: null }],
  };
}

export function finishMeeting(meeting: Meeting, now: number): Meeting {
  return {
    ...meeting,
    end: now,
    pauses: meeting.pauses.map((pause) => ({ ...pause, end: pause.end ?? now })),
  };
}
