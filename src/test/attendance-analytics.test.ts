import { describe, expect, it } from "vitest";
import {
  buildTrendSeries,
  calculateStreaks,
  filterAttendanceByRange,
  getGranularityRange,
  istHour,
  isActiveParticipation,
  shiftReference,
  summarizeParticipation,
  summarizeRoleDistribution,
  summarizeSessions,
} from "@/lib/attendance-analytics";

// Friday, 9 October 2026 (local time)
const ref = new Date(2026, 9, 9, 12);

describe("attendance analytics", () => {
  it("builds inclusive calendar ranges, using a real calendar year for 'year'", () => {
    expect(getGranularityRange("day", ref)).toMatchObject({ startDate: "2026-10-09", endDate: "2026-10-09", bucket: "hour" });
    expect(getGranularityRange("week", ref)).toMatchObject({ startDate: "2026-10-05", endDate: "2026-10-11", bucket: "day" });
    expect(getGranularityRange("month", ref)).toMatchObject({ startDate: "2026-10-01", endDate: "2026-10-31", bucket: "day" });
    expect(getGranularityRange("year", ref)).toMatchObject({
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      bucket: "month",
      label: "2026",
    });
  });

  it("shifts the reference date by whole calendar units", () => {
    expect(getGranularityRange("day", shiftReference("day", ref, 1)).startDate).toBe("2026-10-10");
    expect(getGranularityRange("week", shiftReference("week", ref, -1)).startDate).toBe("2026-09-28");
    expect(getGranularityRange("month", shiftReference("month", ref, 1)).startDate).toBe("2026-11-01");
    expect(getGranularityRange("year", shiftReference("year", ref, -1)).startDate).toBe("2025-01-01");
  });

  it("filters records inclusively at both range boundaries", () => {
    const range = getGranularityRange("week", ref);
    const records = [
      { session_date: "2026-10-04" },
      { session_date: "2026-10-05" },
      { session_date: "2026-10-11" },
      { session_date: "2026-10-12" },
    ];
    expect(filterAttendanceByRange(records, range).map((record) => record.session_date)).toEqual(["2026-10-05", "2026-10-11"]);
  });

  it("converts a timestamp to the IST hour of day", () => {
    expect(istHour("2026-10-09T06:30:00.000Z")).toBe(12);
    expect(istHour("2026-10-09T18:45:00.000Z")).toBe(0);
    expect(istHour(null)).toBeNull();
    expect(istHour("not-a-date")).toBeNull();
  });

  it("counts missing roles as listeners and named roles as active participation", () => {
    expect(isActiveParticipation("speaker")).toBe(true);
    expect(isActiveParticipation("listener")).toBe(false);
    expect(isActiveParticipation(null)).toBe(false);
    expect(
      summarizeParticipation([
        { session_date: "2026-10-09", participation_role: "listener" },
        { session_date: "2026-10-09", participation_role: "speaker" },
        { session_date: "2026-10-09", participation_role: null },
      ]),
    ).toEqual({ listeners: 2, activeRoles: 1 });
  });

  it("counts every distinct role, defaulting blanks to listeners", () => {
    const distribution = summarizeRoleDistribution([
      { session_date: "2026-10-09", participation_role: "speaker" },
      { session_date: "2026-10-09", participation_role: "speaker" },
      { session_date: "2026-10-09", participation_role: "listener" },
      { session_date: "2026-10-09", participation_role: null },
      { session_date: "2026-10-09", participation_role: "singer" },
    ]);

    expect(distribution.sort((a, b) => a.role.localeCompare(b.role))).toEqual([
      { role: "listener", value: 2 },
      { role: "singer", value: 1 },
      { role: "speaker", value: 2 },
    ]);
  });

  it("buckets a week by day, stacking listeners and performers without double counting", () => {
    const series = buildTrendSeries(
      [
        { session_date: "2026-10-06", participation_role: "listener" },
        { session_date: "2026-10-06", participation_role: "speaker" },
        { session_date: "2026-10-07", participation_role: "listener" },
        { session_date: "2026-10-13", participation_role: "speaker" },
      ],
      getGranularityRange("week", ref),
    );

    expect(series).toHaveLength(7);
    expect(series.find((bucket) => bucket.label === "6 Oct")).toEqual({ label: "6 Oct", listeners: 1, performers: 1, total: 2 });
    expect(series.find((bucket) => bucket.label === "5 Oct")).toEqual({ label: "5 Oct", listeners: 0, performers: 0, total: 0 });
  });

  it("buckets a single day by IST hour using the check-in time", () => {
    const series = buildTrendSeries(
      [
        { session_date: "2026-10-09", participation_role: "listener", checkin_time: "2026-10-09T06:30:00.000Z" },
        { session_date: "2026-10-09", participation_role: "speaker", checkin_time: "2026-10-09T06:45:00.000Z" },
      ],
      getGranularityRange("day", ref),
    );

    expect(series).toHaveLength(24);
    expect(series.find((bucket) => bucket.label === "12 PM")).toEqual({ label: "12 PM", listeners: 1, performers: 1, total: 2 });
  });

  it("buckets a calendar year by month and ignores neighbouring years", () => {
    const series = buildTrendSeries(
      [
        { session_date: "2026-01-15", participation_role: "listener" },
        { session_date: "2026-10-09", participation_role: "singer" },
        { session_date: "2025-12-31", participation_role: "listener" },
      ],
      getGranularityRange("year", ref),
    );

    expect(series).toHaveLength(12);
    expect(series[0]).toEqual({ label: "Jan", listeners: 1, performers: 0, total: 1 });
    expect(series[9]).toEqual({ label: "Oct", listeners: 0, performers: 1, total: 1 });
    expect(series.reduce((sum, bucket) => sum + bucket.total, 0)).toBe(2);
  });

  it("calculates current and longest streaks without giving stale records a current streak", () => {
    expect(calculateStreaks(["2026-10-06", "2026-10-07", "2026-10-09"], ref)).toEqual({ currentStreak: 1, longestStreak: 2 });
    expect(calculateStreaks(["2026-10-06", "2026-10-07"], ref)).toEqual({ currentStreak: 0, longestStreak: 2 });
    expect(calculateStreaks([], ref)).toEqual({ currentStreak: 0, longestStreak: 0 });
  });

  it("ranks session popularity by attendance count", () => {
    expect(
      summarizeSessions([
        { session_date: "2026-10-09", session_title: "Morning Circle" },
        { session_date: "2026-10-09", session_title: "Morning Circle" },
        { session_date: "2026-10-09", session_title: "Study Circle" },
      ]),
    ).toEqual([
      { name: "Morning Circle", attendees: 2 },
      { name: "Study Circle", attendees: 1 },
    ]);
  });
});
