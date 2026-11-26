import { supabase } from "@/integrations/supabase/client";
import type { Lang } from "@/i18n";
import type { ParticipationRole } from "@/lib/attendance";

// ==============================================================================
// Domain types
// ==============================================================================

export type ProgramType = "kathamrita" | "pathochokro";
export type ItemType = "song" | "reading" | "prayer" | "other";
export type SessionStatus = "scheduled" | "cancelled";

export interface StudyCircleSession {
  id: string;
  program_type: ProgramType;
  scheduled_date: string; // YYYY-MM-DD
  start_time: string | null; // HH:MM:SS
  status: SessionStatus;
  title_bn: string;
  title_en: string | null;
  note: string | null;
  note_en: string | null;
  meeting_link: string | null;
  is_published: boolean;
  published_at: string | null;
  routine_session_id: string | null;
  created_at: string;
  updated_at: string;
}

/** `display_name` is stored in the DB `guest_name` column (used as a name cache). */
export interface StudyCirclePerformer {
  id?: string;
  member_id: string | null;
  display_name: string;
  display_order: number;
}

export interface StudyCircleRole {
  id?: string;
  role_name: string;
  role_name_en: string | null;
  display_order: number;
  performers: StudyCirclePerformer[];
}

export interface StudyCirclePart {
  id?: string;
  part_number: number | null;
  item_type: ItemType;
  description: string;
  description_en: string | null;
  reference_link: string | null;
  display_order: number;
  performers: StudyCirclePerformer[];
}

export interface StudyCircleBundle {
  session: StudyCircleSession;
  roles: StudyCircleRole[];
  parts: StudyCirclePart[];
}

export interface MemberSearchResult {
  id: string;
  name: string;
  membership_id: string | null;
  phone_digits: string | null;
  status: string | null;
}

export interface RoutineSessionOption {
  id: string;
  title: string;
  title_bn: string | null;
  day_of_week: number;
  start_time: string;
}

export interface SaveSessionResult {
  success: boolean;
  session_id?: string;
  is_published?: boolean;
  message?: string;
  conflict_id?: string;
  sync?: { success: boolean; marked?: number; credited?: number; message?: string };
}

// ==============================================================================
// Program configuration
// ==============================================================================

export interface ProgramConfig {
  label: string;
  labelBn: string;
  defaultWeekday: number; // 0 = Sunday .. 6 = Saturday
  defaultTime: string;
  /** Tailwind-ish accent tokens used across the public + admin UI. */
  accent: {
    text: string;
    bg: string;
    border: string;
    chipBg: string;
    chipText: string;
  };
}

export const PROGRAMS: Record<ProgramType, ProgramConfig> = {
  kathamrita: {
    label: "Kathamrita",
    labelBn: "কথামৃত",
    defaultWeekday: 2, // Tuesday — tentative
    defaultTime: "19:00",
    accent: {
      text: "text-orange-700 dark:text-orange-300",
      bg: "bg-orange-50 dark:bg-orange-950/30",
      border: "border-orange-200 dark:border-orange-900/60",
      chipBg: "bg-orange-100 dark:bg-orange-900/40",
      chipText: "text-orange-800 dark:text-orange-200",
    },
  },
  pathochokro: {
    label: "Pathochokro",
    labelBn: "পাঠচক্র",
    defaultWeekday: 4, // Thursday — guaranteed
    defaultTime: "19:00",
    accent: {
      text: "text-purple-700 dark:text-purple-300",
      bg: "bg-purple-50 dark:bg-purple-950/30",
      border: "border-purple-200 dark:border-purple-900/60",
      chipBg: "bg-purple-100 dark:bg-purple-900/40",
      chipText: "text-purple-800 dark:text-purple-200",
    },
  },
};

export const PROGRAM_ORDER: ProgramType[] = ["kathamrita", "pathochokro"];

export function programLabel(program: ProgramType, lang: Lang = "en"): string {
  const cfg = PROGRAMS[program];
  return lang === "bn" ? cfg.labelBn : cfg.label;
}

/** Default roles seeded for a brand new session (design doc §8.4). */
export const DEFAULT_ROLES: { role_name: string; role_name_en: string }[] = [
  { role_name: "Rule Reader", role_name_en: "Rule Reader" },
  { role_name: "Improvement Catalyst", role_name_en: "Improvement Catalyst" },
  { role_name: "Backup Reader", role_name_en: "Backup Reader" },
  { role_name: "Backup Singer", role_name_en: "Backup Singer" },
];

export const ITEM_TYPE_LABELS: Record<ItemType, { en: string; bn: string }> = {
  song: { en: "Song", bn: "গান" },
  reading: { en: "Reading", bn: "পাঠ" },
  prayer: { en: "Prayer", bn: "প্রার্থনা" },
  other: { en: "Other", bn: "অন্যান্য" },
};

// ==============================================================================
// Role → attendance participation_role mapping (mirrors SQL helper)
// ==============================================================================

export function roleToParticipation(roleName: string): ParticipationRole {
  const n = (roleName || "").toLowerCase();
  if (n.includes("singer")) return "singer";
  if (n.includes("reader")) return "reader";
  if (n.includes("anchor") || n.includes("host")) return "anchor";
  if (n.includes("director") || n.includes("coordinator")) return "director";
  if (n.includes("speaker") || n.includes("catalyst") || n.includes("educator")) return "speaker";
  return "performer";
}

// ==============================================================================
// Formatting helpers
// ==============================================================================

export function formatSessionDate(dateStr: string, lang: Lang = "en"): string {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function parseSessionDateInput(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;

  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return `${yearText}-${monthText}-${dayText}`;
}

export function formatSessionDateInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function formatSessionDayOfMonth(dateStr: string, lang: Lang = "en"): string {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-IN", {
    day: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/** "19:00:00" → "7:00 PM" */
export function displayTime(time: string | null): string {
  if (!time) return "";
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  if (Number.isNaN(h)) return time.slice(0, 5);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${(mStr ?? "00").slice(0, 2)} ${suffix}`;
}

export function performerNames(performers: StudyCirclePerformer[]): string[] {
  return performers.map((p) => p.display_name).filter(Boolean);
}

/** Today's calendar date (YYYY-MM-DD) in India Standard Time. */
export function todayISO(): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Soonest session on/after today; falls back to the newest overall. Cancelled
 *  sessions are deprioritised — a scheduled session always wins if one exists. */
export function pickCurrentSession(sessions: StudyCircleSession[]): StudyCircleSession | null {
  if (sessions.length === 0) return null;
  const today = todayISO();
  const sorted = [...sessions].sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
  const scheduled = sorted.filter((s) => s.status !== "cancelled");
  const pool = scheduled.length > 0 ? scheduled : sorted;
  return pool.find((s) => s.scheduled_date >= today) ?? pool[pool.length - 1];
}

export function getPerformerNames(performers: StudyCirclePerformer[]): string {
  const names = performerNames(performers);
  return names.length > 0 ? names.join(", ") : "—";
}

export function generateWhatsAppMessage(bundle: StudyCircleBundle, lang: Lang = "en"): string {
  const { session, roles, parts } = bundle;
  const lines: string[] = [];

  // Header — program label + title (Bengali primary, English subtitle).
  lines.push(`${programLabel(session.program_type, lang)} — ${session.title_bn}`);
  if (session.title_en) lines.push(session.title_en);
  lines.push(`🗓 ${formatSessionDate(session.scheduled_date, lang)}${session.start_time ? ` · ${displayTime(session.start_time)}` : ""}`);
  if (session.meeting_link) lines.push(`🔗 ${session.meeting_link}`);
  lines.push("");

  // Roles section.
  const namedRoles = roles.filter((r) => r.performers.length > 0);
  if (namedRoles.length > 0) {
    lines.push("👥 *Roles*");
    for (const r of namedRoles) {
      lines.push(`• ${r.role_name}: ${getPerformerNames(r.performers)}`);
    }
    lines.push("");
  }

  // Programme section — multi-line descriptions get their performer on a
  // separate, indented line; single-line (or empty) descriptions keep it inline.
  const namedParts = parts.filter((p) => p.description.trim() || p.performers.length > 0);
  if (namedParts.length > 0) {
    lines.push("📋 *Programme*");
    for (const p of namedParts) {
      const num = p.part_number != null ? `#${p.part_number}` : "";
      const descLines = p.description.split("\n").map((l) => l.trimEnd()).filter((l, i, arr) => l !== "" || i < arr.length - 1);
      const who = p.performers.length > 0 ? ` — ${getPerformerNames(p.performers)}` : "";

      if (descLines.length <= 1) {
        const first = descLines[0] ?? "";
        lines.push(`${num}${num ? " " : ""}${first}${who}`.trimEnd());
      } else {
        lines.push(`${num}${num ? " " : ""}${descLines[0]}`.trimEnd());
        for (let i = 1; i < descLines.length; i++) {
          lines.push(descLines[i]);
        }
        if (who) lines.push(` ${who.trim()}`);
      }
    }
  }

  return lines.join("\n").trimEnd();
}

// ==============================================================================
// Edge functions / data access
// ==============================================================================

// The study-circle tables & RPCs are added by migration 20261020000000 and are
// not yet present in the generated Database types, so a narrow structural cast
// keeps this module compiling without hand-editing the generated file.
type ScRpcResult = { data: unknown; error: { message: string } | null };
interface ScQuery extends PromiseLike<ScRpcResult> {
  select(columns?: string): ScQuery;
  eq(column: string, value: string | boolean): ScQuery;
  order(column: string, options?: { ascending?: boolean }): ScQuery;
  delete(): ScQuery;
}

const sc = supabase as unknown as {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<ScRpcResult>;
  from: (table: string) => ScQuery;
};

export async function listPublishedSessions(
  program: ProgramType,
  limit = 30,
): Promise<StudyCircleSession[]> {
  const { data, error } = await sc.rpc("list_published_study_circle_sessions", {
    p_program: program,
    p_limit: limit,
  });
  if (error) throw new Error(error.message);
  return (data as StudyCircleSession[]) ?? [];
}

/** Admin-only: every session (drafts included) for a program. RLS gates access. */
export async function listAllSessions(program: ProgramType): Promise<StudyCircleSession[]> {
  const { data, error } = await sc
    .from("study_circle_sessions")
    .select("*")
    .eq("program_type", program)
    .order("scheduled_date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as StudyCircleSession[]) ?? [];
}

/** Admin-only: permanently remove a session (cascades to children + attendance). */
export async function deleteSession(sessionId: string): Promise<void> {
  const { error } = await sc.from("study_circle_sessions").delete().eq("id", sessionId);
  if (error) throw new Error(error.message);
}

export async function fetchBundle(sessionId: string): Promise<StudyCircleBundle | null> {
  const { data, error } = await sc.rpc("get_study_circle_bundle", { p_session_id: sessionId });
  if (error) throw new Error(error.message);
  const bundle = data as StudyCircleBundle | null;
  if (!bundle || !bundle.session) return null;
  return bundle;
}

export async function saveSession(payload: Record<string, unknown>): Promise<SaveSessionResult> {
  const { data, error } = await sc.rpc("save_study_circle_session", { p_session: payload });
  if (error) throw new Error(error.message);
  return data as SaveSessionResult;
}

export async function syncAttendance(sessionId: string): Promise<SaveSessionResult> {
  const { data, error } = await sc.rpc("sync_study_circle_attendance", { p_session_id: sessionId });
  if (error) throw new Error(error.message);
  return data as SaveSessionResult;
}

export async function searchMembers(query: string): Promise<MemberSearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  // Escape PostgREST `or` delimiters so free-text names can't break the filter.
  const safe = q.replace(/[,()%]/g, " ");
  const { data, error } = await supabase
    .from("member_imports")
    .select("id, name, membership_id, phone_digits, status")
    .or(`name.ilike.%${safe}%,membership_id.ilike.%${safe}%,phone_digits.ilike.%${safe}%`)
    .order("name")
    .limit(8);
  if (error) throw new Error(error.message);
  return (data as MemberSearchResult[]) ?? [];
}

export async function listRoutineSessions(): Promise<RoutineSessionOption[]> {
  const { data, error } = await supabase
    .from("routine_sessions")
    .select("id, title, title_bn, day_of_week, start_time")
    .eq("is_active", true)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as RoutineSessionOption[]) ?? [];
}

// ==============================================================================
// Save payload builder
// ==============================================================================

export function buildSavePayload(
  session: Partial<StudyCircleSession> & { program_type: ProgramType; scheduled_date: string; title_bn: string },
  roles: StudyCircleRole[],
  parts: StudyCirclePart[],
): Record<string, unknown> {
  return {
    id: session.id ?? null,
    program_type: session.program_type,
    scheduled_date: session.scheduled_date,
    start_time: session.start_time ?? null,
    status: session.status ?? "scheduled",
    title_bn: session.title_bn,
    title_en: session.title_en ?? null,
    note: session.note ?? null,
    note_en: session.note_en ?? null,
    meeting_link: session.meeting_link ?? null,
    is_published: session.is_published ?? false,
    routine_session_id: session.routine_session_id ?? null,
    roles: roles.map((r, ri) => ({
      role_name: r.role_name,
      role_name_en: r.role_name_en ?? null,
      display_order: r.display_order ?? ri,
      performers: r.performers.map((p, pi) => ({
        member_id: p.member_id,
        guest_name: p.display_name,
        display_order: p.display_order ?? pi,
      })),
    })),
    parts: parts.map((p, pi) => ({
      part_number: p.part_number,
      item_type: p.item_type,
      description: p.description,
      description_en: p.description_en ?? null,
      reference_link: p.reference_link ?? null,
      display_order: p.display_order ?? pi,
      performers: p.performers.map((pp, ppi) => ({
        member_id: pp.member_id,
        guest_name: pp.display_name,
        display_order: pp.display_order ?? ppi,
      })),
    })),
  };
}

/** Detect unassigned roles/parts for the pre-publish validation dialog (design doc §8.5). */
export function findUnassigned<
  R extends { performers: StudyCirclePerformer[] },
  P extends { description: string; performers: StudyCirclePerformer[] },
>(roles: R[], parts: P[]): { roles: R[]; parts: P[] } {
  return {
    roles: roles.filter((r) => r.performers.length === 0),
    parts: parts.filter((p) => !p.description.trim() && p.performers.length === 0),
  };
}
