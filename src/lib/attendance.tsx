import React from "react";
import { Headphones, Star, Mic, Clapperboard, Megaphone, Music, BookOpen, Sparkles } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

export type AttendanceRecord = Database["public"]["Tables"]["attendance_records"]["Row"];
export type MemberCreditLedger = Database["public"]["Tables"]["member_credit_ledger"]["Row"];
export type AttendanceAuditLog = Database["public"]["Tables"]["attendance_audit_logs"]["Row"];

export type AttendanceStatus = "present" | "absent" | "excused" | "pending" | "unmarked";
export type ParticipationRole = "listener" | "performer" | "anchor" | "director" | "speaker" | "singer" | "reader" | "other";

export const ROLE_CREDITS: Record<ParticipationRole, number> = {
  listener: 3,
  performer: 5,
  anchor: 5,
  director: 5,
  speaker: 5,
  singer: 5,
  reader: 5,
  other: 3,
};

export const ROLE_LABELS: Record<ParticipationRole, { label: string; icon: React.ReactNode; description: string }> = {
  listener: { label: "Listener / Participant", icon: <Headphones className="w-4 h-4" />, description: "Attending and listening" },
  performer: { label: "Performer", icon: <Star className="w-4 h-4" />, description: "Song, poetry, recitation or performance" },
  anchor: { label: "Anchor / Host", icon: <Mic className="w-4 h-4" />, description: "Hosting or moderating the session" },
  director: { label: "Director / Coordinator", icon: <Clapperboard className="w-4 h-4" />, description: "Guiding the session flow" },
  speaker: { label: "Speaker / Educator", icon: <Megaphone className="w-4 h-4" />, description: "Giving a talk or discourse" },
  singer: { label: "Singer", icon: <Music className="w-4 h-4" />, description: "Singing devotional or cultural songs" },
  reader: { label: "Reader", icon: <BookOpen className="w-4 h-4" />, description: "Reading scripture, text, or news" },
  other: { label: "Other Role", icon: <Sparkles className="w-4 h-4" />, description: "Contributing actively" },
};

export const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; badgeClass: string }> = {
  present: {
    label: "Present",
    color: "#10b981",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
  absent: {
    label: "Absent",
    color: "#ef4444",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300",
  },
  excused: {
    label: "Excused",
    color: "#f59e0b",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300",
  },
  pending: {
    label: "Pending verification",
    color: "#6366f1",
    badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-300",
  },
  unmarked: {
    label: "Unmarked",
    color: "#94a3b8",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300",
  },
};

/**
 * Normalizes any Indian phone number string to a standard 10-digit format.
 * Strips out +91, leading 0, spaces, dashes, parentheses.
 */
export function normalizePhone10(raw: string | null | undefined): string {
  if (!raw) return "";
  const cleaned = raw.replace(/\D/g, "");
  if (cleaned.length >= 10) {
    return cleaned.slice(-10);
  }
  return cleaned;
}

/** Formats a 10-digit phone for human display: "+91 98765 43210" */
export function formatPhoneDisplay(phone10: string): string {
  const digits = normalizePhone10(phone10);
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return phone10 || "—";
}

/** Mask phone number for privacy display on public autocomplete: "******9309" */
export function maskPhone(phone: string): string {
  const digits = normalizePhone10(phone);
  if (digits.length >= 4) {
    return `******${digits.slice(-4)}`;
  }
  return digits;
}

/** Single source of truth for the "already present" message shown to attendees. */
export const ALREADY_MARKED_PRESENT_MESSAGE = "You have already been marked present for this session";

/** Minimal shape needed to detect an existing present attendance record. */
export interface PresentAttendanceLike {
  attendance_status?: string | null;
  member_user_id?: string | null;
  attendee_phone?: string | null;
}

export interface AlreadyPresentLookup {
  memberUserId?: string | null;
  phone?: string | null;
}

/**
 * Shared matching logic used by the public form to cross-reference a submitted
 * member id / phone against a session's present attendance list.
 *
 * A record matches when it is marked `present` and identifies the same
 * attendee, either by `member_user_id` (registered members) or by the last 10
 * digits of the phone number. This mirrors the SQL used server-side so member
 * and non-member flows behave identically and neither produces false positives
 * (matching a different attendee) nor false negatives (missing the same one).
 */
export function isAlreadyMarkedPresent(
  records: PresentAttendanceLike[],
  { memberUserId, phone }: AlreadyPresentLookup,
): boolean {
  const phone10 = normalizePhone10(phone);
  const hasPhone = phone10.length === 10;

  return records.some((record) => {
    if (record.attendance_status !== "present") return false;
    if (memberUserId && record.member_user_id && record.member_user_id === memberUserId) return true;
    if (hasPhone && normalizePhone10(record.attendee_phone) === phone10) return true;
    return false;
  });
}

export type SelfCheckinOutcome = "already_present" | "pending_verification" | "confirmed";

/**
 * Interprets the JSON returned by the `submit_self_attendance` RPC.
 * `already_present` short-circuits everything else so a duplicate submission can
 * never overwrite an administrator's verification.
 */
export function describeSelfCheckinResult(result: unknown): SelfCheckinOutcome {
  if (!result || typeof result !== "object") return "pending_verification";
  const res = result as Record<string, unknown>;
  if (res.already_present === true) return "already_present";
  if (res.verification_pending === false) return "confirmed";
  return "pending_verification";
}

/**
 * Supportive check-in message template for seniors who missed multiple sessions.
 * Conforms to Doc Tab 08: supportive, friendly, never punitive or guilt-driven.
 */
export function generateSupportiveAbsenceMessage(
  memberName: string,
  sessionTitle: string = "Hosla & Shraddha Sessions",
  daysAbsent?: number,
): string {
  const greeting = memberName ? `Dear ${memberName},` : "Dear Friend,";
  return `${greeting}

We noticed you haven't been able to join our ${sessionTitle} recently. 

We truly miss your warm presence and smiles in our circle! We hope you are keeping well and in good health. If there is anything we can help you with or if you'd like to share an update, please feel free to reach out.

Looking forward to seeing you soon!
With warm regards and best wishes,
Hosla & Shraddha Care Hub Team.`;
}

/** Local storage key for offline pending attendance records */
const OFFLINE_ATTENDANCE_QUEUE_KEY = "hosla_offline_attendance_queue_v1";

export function getOfflineAttendanceQueue(): any[] {
  try {
    const raw = localStorage.getItem(OFFLINE_ATTENDANCE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOfflineAttendanceQueue(queue: any[]) {
  try {
    localStorage.setItem(OFFLINE_ATTENDANCE_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error("Failed to save offline attendance queue", err);
  }
}
