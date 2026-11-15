export type PeriodGranularity = "day" | "week" | "month" | "year";

/** How a range is subdivided for the trend chart. */
export type AnalyticsBucket = "hour" | "day" | "month";

export interface AnalyticsRange {
  startDate: string;
  endDate: string;
  bucket: AnalyticsBucket;
  granularity: PeriodGranularity;
  label: string;
}

export interface AnalyticsAttendanceRecord {
  session_date: string;
  session_title?: string | null;
  participation_role?: string | null;
  /** Wall-clock check-in time; falls back to created_at when absent. */
  checkin_time?: string | null;
  created_at?: string | null;
}

export interface ParticipationSummary {
  listeners: number;
  activeRoles: number;
}

export interface TrendBucket {
  label: string;
  listeners: number;
  performers: number;
  total: number;
}

export interface RoleDistributionEntry {
  role: string;
  value: number;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function hourLabel(hour: number): string {
  const period = hour < 12 ? "AM" : "PM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12} ${period}`;
}

/** Hour of day (0-23) in IST, regardless of the runtime timezone. */
export function istHour(value?: string | null): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) return null;
  const minutesIst = Math.floor(ms / 60000) + 330;
  return ((Math.floor(minutesIst / 60) % 24) + 24) % 24;
}

/**
 * Builds the inclusive calendar range for a granularity. "year" is a real
 * calendar year (Jan 1 - Dec 31), never a rolling 365-day window.
 */
export function getGranularityRange(
  granularity: PeriodGranularity,
  reference = new Date(),
): AnalyticsRange {
  const ref = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());

  if (granularity === "day") {
    const iso = formatDate(ref);
    return {
      startDate: iso,
      endDate: iso,
      bucket: "hour",
      granularity,
      label: ref.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
    };
  }

  if (granularity === "week") {
    const start = new Date(ref);
    const mondayOffset = (ref.getDay() + 6) % 7;
    start.setDate(ref.getDate() - mondayOffset);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return {
      startDate: formatDate(start),
      endDate: formatDate(end),
      bucket: "day",
      granularity,
      label: `Week of ${start.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`,
    };
  }

  if (granularity === "month") {
    const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
    return {
      startDate: formatDate(start),
      endDate: formatDate(end),
      bucket: "day",
      granularity,
      label: ref.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
    };
  }

  const start = new Date(ref.getFullYear(), 0, 1);
  const end = new Date(ref.getFullYear(), 11, 31);
  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
    bucket: "month",
    granularity,
    label: String(ref.getFullYear()),
  };
}

/** Moves a reference date by `steps` units of the given granularity. */
export function shiftReference(
  granularity: PeriodGranularity,
  reference: Date,
  steps: number,
): Date {
  const next = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  if (granularity === "day") next.setDate(next.getDate() + steps);
  else if (granularity === "week") next.setDate(next.getDate() + steps * 7);
  else if (granularity === "month") next.setMonth(next.getMonth() + steps);
  else next.setFullYear(next.getFullYear() + steps);
  return next;
}

export function isActiveParticipation(role?: string | null): boolean {
  return Boolean(role && role !== "listener");
}

export function filterAttendanceByRange<T extends AnalyticsAttendanceRecord>(
  records: T[],
  range: AnalyticsRange,
): T[] {
  return records.filter((record) => record.session_date >= range.startDate && record.session_date <= range.endDate);
}

export function summarizeParticipation(records: AnalyticsAttendanceRecord[]): ParticipationSummary {
  const activeRoles = records.filter((record) => isActiveParticipation(record.participation_role)).length;
  return { listeners: records.length - activeRoles, activeRoles };
}

/** Counts every distinct participation role, missing values counting as listeners. */
export function summarizeRoleDistribution(records: AnalyticsAttendanceRecord[]): RoleDistributionEntry[] {
  const counts = new Map<string, number>();
  records.forEach((record) => {
    const role = (record.participation_role && record.participation_role.trim()) || "listener";
    counts.set(role, (counts.get(role) || 0) + 1);
  });

  return Array.from(counts, ([role, value]) => ({ role, value })).sort((a, b) => b.value - a.value);
}

/**
 * Buckets present records into a readable trend series. Day granularity buckets
 * by hour (so a single day is still a meaningful chart), week/month bucket by
 * day, and year buckets by month. Listeners and performers are returned
 * separately so the chart can stack them without double counting.
 */
export function buildTrendSeries(
  records: AnalyticsAttendanceRecord[],
  range: AnalyticsRange,
): TrendBucket[] {
  const inRange = filterAttendanceByRange(records, range);
  const buckets: TrendBucket[] = [];

  const push = (label: string, matched: AnalyticsAttendanceRecord[]) => {
    const performers = matched.filter((record) => isActiveParticipation(record.participation_role)).length;
    buckets.push({ label, listeners: matched.length - performers, performers, total: matched.length });
  };

  if (range.bucket === "hour") {
    for (let hour = 0; hour < 24; hour++) {
      push(
        hourLabel(hour),
        inRange.filter((record) => istHour(record.checkin_time || record.created_at) === hour),
      );
    }
    return buckets;
  }

  if (range.bucket === "month") {
    const year = range.startDate.slice(0, 4);
    for (let month = 0; month < 12; month++) {
      const key = `${year}-${String(month + 1).padStart(2, "0")}`;
      push(
        new Date(Number(year), month, 1).toLocaleDateString("en-IN", { month: "short" }),
        inRange.filter((record) => record.session_date?.startsWith(key)),
      );
    }
    return buckets;
  }

  const cursor = new Date(`${range.startDate}T00:00:00`);
  const end = new Date(`${range.endDate}T00:00:00`);
  while (cursor.getTime() <= end.getTime()) {
    const iso = formatDate(cursor);
    push(
      cursor.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      inRange.filter((record) => record.session_date === iso),
    );
    cursor.setDate(cursor.getDate() + 1);
  }
  return buckets;
}

export function summarizeSessions(records: AnalyticsAttendanceRecord[]) {
  const sessions = new Map<string, number>();
  records.forEach((record) => {
    const title = record.session_title || "Unknown Session";
    sessions.set(title, (sessions.get(title) || 0) + 1);
  });

  return Array.from(sessions.entries())
    .map(([name, attendees]) => ({ name, attendees }))
    .sort((a, b) => b.attendees - a.attendees)
    .slice(0, 5);
}

export function calculateStreaks(sessionDates: string[], today = new Date()) {
  const dates = Array.from(new Set(sessionDates)).sort();
  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  let longestStreak = 1;
  let runningStreak = 1;

  for (let index = 1; index < dates.length; index++) {
    const previous = new Date(`${dates[index - 1]}T00:00:00`);
    const current = new Date(`${dates[index]}T00:00:00`);
    const difference = Math.round((current.getTime() - previous.getTime()) / 86400000);
    runningStreak = difference === 1 ? runningStreak + 1 : 1;
    longestStreak = Math.max(longestStreak, runningStreak);
  }

  const latestDate = new Date(`${dates[dates.length - 1]}T00:00:00`);
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const daysSinceLatest = Math.round((todayDate.getTime() - latestDate.getTime()) / 86400000);

  return {
    currentStreak: daysSinceLatest <= 1 ? runningStreak : 0,
    longestStreak,
  };
}
