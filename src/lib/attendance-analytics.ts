export type AnalyticsPeriod = "today" | "this_week" | "last_month" | "this_year";

export interface AnalyticsRange {
  startDate: string;
  endDate: string;
  bucket: "day" | "month";
}

export interface AnalyticsAttendanceRecord {
  session_date: string;
  session_title?: string | null;
  participation_role?: string | null;
}

export interface ParticipationSummary {
  listeners: number;
  activeRoles: number;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getAnalyticsRange(period: AnalyticsPeriod, now = new Date()): AnalyticsRange {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === "today") {
    return { startDate: formatDate(today), endDate: formatDate(today), bucket: "day" };
  }

  if (period === "this_week") {
    const start = new Date(today);
    const mondayOffset = (today.getDay() + 6) % 7;
    start.setDate(today.getDate() - mondayOffset);
    return { startDate: formatDate(start), endDate: formatDate(today), bucket: "day" };
  }

  if (period === "last_month") {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 0);
    return { startDate: formatDate(start), endDate: formatDate(end), bucket: "day" };
  }

  return {
    startDate: formatDate(new Date(today.getFullYear(), 0, 1)),
    endDate: formatDate(today),
    bucket: "month",
  };
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
