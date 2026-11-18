import type { Card, Meeting } from "./types";
import { calculate } from "./meter";
import { japanParts } from "./dates";
import { analogy } from "./analogies";

export function meetingCard(meeting: Meeting): Card {
  const result = calculate(meeting, meeting.end ?? meeting.start);
  return {
    name: meeting.setup.name || "名前のない会議",
    ...japanParts(meeting.start),
    ...result,
    count: Math.max(...meeting.changes.map((change) => change.count)),
    analogy: analogy(result.cost, (meeting.start % 997) / 997),
  };
}

export function sortedHistory(history: Meeting[]) {
  return [...history].sort((a, b) => b.start - a.start);
}
