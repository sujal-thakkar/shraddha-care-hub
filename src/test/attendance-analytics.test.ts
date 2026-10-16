import { describe, expect, it } from "vitest";
import {
  calculateStreaks,
  filterAttendanceByRange,
  getAnalyticsRange,
  isActiveParticipation,
  summarizeParticipation,
  summarizeSessions,
} from "@/lib/attendance-analytics";

describe("attendance analytics", () => {
  const now = new Date(2026, 9, 9, 12);

  it("creates calendar ranges for today, this week, last month, and this year", () => {
    expect(getAnalyticsRange("today", now)).toMatchObject({ startDate: "2026-10-09", endDate: "2026-10-09" });
    expect(getAnalyticsRange("this_week", now)).toMatchObject({ startDate: "2026-10-05", endDate: "2026-10-09" });
    expect(getAnalyticsRange("last_month", now)).toMatchObject({ startDate: "2026-09-01", endDate: "2026-09-30" });
    expect(getAnalyticsRange("this_year", now)).toMatchObject({ startDate: "2026-01-01", endDate: "2026-10-09" });
  });

  it("filters records inclusively at both range boundaries", () => {
    const range = getAnalyticsRange("this_week", now);
    const records = [
      { session_date: "2026-10-04" },
      { session_date: "2026-10-05" },
      { session_date: "2026-10-09" },
      { session_date: "2026-10-10" },
    ];
    expect(filterAttendanceByRange(records, range).map((record) => record.session_date)).toEqual(["2026-10-05", "2026-10-09"]);
  });

  it("counts missing roles as listeners and named roles as active participation", () => {
    expect(isActiveParticipation("speaker")).toBe(true);
    expect(isActiveParticipation("listener")).toBe(false);
    expect(isActiveParticipation(null)).toBe(false);
    expect(summarizeParticipation([
      { session_date: "2026-10-09", participation_role: "listener" },
      { session_date: "2026-10-09", participation_role: "speaker" },
      { session_date: "2026-10-09", participation_role: null },
    ])).toEqual({ listeners: 2, activeRoles: 1 });
  });

  it("calculates current and longest streaks without giving stale records a current streak", () => {
    expect(calculateStreaks(["2026-10-06", "2026-10-07", "2026-10-09"], now)).toEqual({ currentStreak: 1, longestStreak: 2 });
    expect(calculateStreaks(["2026-10-06", "2026-10-07"], now)).toEqual({ currentStreak: 0, longestStreak: 2 });
    expect(calculateStreaks([], now)).toEqual({ currentStreak: 0, longestStreak: 0 });
  });

  it("ranks session popularity by attendance count", () => {
    expect(summarizeSessions([
      { session_date: "2026-10-09", session_title: "Morning Circle" },
      { session_date: "2026-10-09", session_title: "Morning Circle" },
      { session_date: "2026-10-09", session_title: "Study Circle" },
    ])).toEqual([
      { name: "Morning Circle", attendees: 2 },
      { name: "Study Circle", attendees: 1 },
    ]);
  });
});