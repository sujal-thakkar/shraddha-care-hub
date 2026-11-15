import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AttendanceShareModal } from "@/components/attendance/AttendanceShareModal";
import {
  STATUS_CONFIG, ROLE_CREDITS, ROLE_LABELS, normalizePhone10, formatPhoneDisplay,
  generateSupportiveAbsenceMessage, type AttendanceStatus, type ParticipationRole,
  type AttendanceRecord
} from "@/lib/attendance";
import { WEEK_DAYS, getISTNow, formatTime12, timeToMinutes, type RoutineSession } from "@/lib/routine";
import {
  buildTrendSeries,
  filterAttendanceByRange,
  getGranularityRange,
  shiftReference,
  summarizeParticipation,
  summarizeRoleDistribution,
  summarizeSessions,
  type AnalyticsAttendanceRecord,
  type AnalyticsRange,
  type PeriodGranularity,
} from "@/lib/attendance-analytics";
import { cn } from "@/lib/utils";
import {
  Users, CheckCircle2, XCircle, HelpCircle, Clock, Calendar, QrCode, Search,
  Download, Plus, Sparkles, MessageCircle, BarChart3, AlertCircle, ArrowUpDown,
  Filter, CheckCheck, Loader2, UserPlus, Flame, Award, Globe, Smartphone, Smile, MapPin, CalendarDays, RotateCcw, Trash2,
  ChevronLeft, ChevronRight
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const CHART_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#14b8a6", "#f43f5e"];

const GRANULARITY_OPTIONS: { value: PeriodGranularity; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

interface AdminAnalyticsData {
  attendanceRecords: AnalyticsAttendanceRecord[];
  topMembers: any[];
}

/** Keeps a granularity + reference date and derives the calendar range. */
function usePeriod(initial: PeriodGranularity) {
  const [granularity, setGranularity] = useState<PeriodGranularity>(initial);
  const [reference, setReference] = useState<Date>(() => new Date());
  const range = useMemo(() => getGranularityRange(granularity, reference), [granularity, reference]);
  const shift = (steps: number) => setReference((prev) => shiftReference(granularity, prev, steps));
  return { granularity, setGranularity, range, shift };
}

/** Day/Week/Month/Year switcher with previous/next navigation. */
function PeriodPicker({
  granularity, setGranularity, range, shift, className,
}: {
  granularity: PeriodGranularity;
  setGranularity: (granularity: PeriodGranularity) => void;
  range: AnalyticsRange;
  shift: (steps: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="flex rounded-xl bg-muted p-1">
        {GRANULARITY_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setGranularity(option.value)}
            className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors",
              granularity === option.value
                ? "bg-white dark:bg-card shadow-sm text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => shift(-1)} aria-label="Previous period">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="min-w-[112px] text-center text-xs font-semibold text-foreground">{range.label}</span>
        <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => shift(1)} aria-label="Next period">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// The generated Supabase types will include this table after the migration is synced.
const guestLeadsTable = () => (supabase as any).from("attendance_guest_leads");
const upsertGuestLead = (params: Record<string, unknown>) =>
  (supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }>)("upsert_attendance_guest_lead", params);

export default function AdminAttendance() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Active session filters
  const todayIST = useMemo(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayIST);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [eventMode, setEventMode] = useState<"online" | "offline">("online");
  const [activeTab, setActiveTab] = useState<string>("roster");
  const [resetAnalyticsOpen, setResetAnalyticsOpen] = useState(false);
  const [resetScope, setResetScope] = useState<"selected_session" | "selected_sessions" | "date_all" | "demo_records" | "all_attendance">("selected_session");
  const [resetSessionIds, setResetSessionIds] = useState<string[]>([]);
  const [resettingAnalytics, setResettingAnalytics] = useState(false);
  const [clearVisitorsOpen, setClearVisitorsOpen] = useState(false);
  const [clearingVisitors, setClearingVisitors] = useState(false);

  // Roster search and status filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMemberIds, setSelectedMemberIds] = useState<Record<string, boolean>>({});

  // Modals
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestRole, setGuestRole] = useState<ParticipationRole>("listener");

  // Selected date's day of week (0=Sun, 1=Mon, ..., 6=Sat)
  const selectedDayOfWeek = useMemo(() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    return new Date(y, m - 1, d).getDay();
  }, [selectedDate]);

  // 1. Fetch routine sessions scheduled for this day
  const { data: daySessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["admin-routine-sessions-by-day", selectedDayOfWeek],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("routine_sessions")
        .select("*")
        .eq("is_active", true)
        .eq("day_of_week", selectedDayOfWeek)
        .order("start_time", { ascending: true });
      if (error) throw error;
      return (data || []) as RoutineSession[];
    },
  });

  // Pick the session currently in progress, or the most recently started one.
  // Before the first session starts, fall back to the earliest session.
  useEffect(() => {
    const selectedStillAvailable = daySessions.some((session) => session.id === selectedSessionId);
    if (daySessions.length > 0 && (!selectedSessionId || !selectedStillAvailable)) {
      const now = getISTNow();
      const startedSessions = selectedDayOfWeek === now.day
        ? daySessions.filter((session) => {
            const start = timeToMinutes(session.start_time);
            return start != null && start <= now.minutes;
          })
        : [];
      const defaultSession = startedSessions[startedSessions.length - 1] || daySessions[0];

      setSelectedSessionId(defaultSession.id);
      // Auto-set mode based on the selected session note.
      if (defaultSession.note?.toLowerCase().includes("offline")) {
        setEventMode("offline");
      } else {
        setEventMode("online");
      }
    }
  }, [daySessions, selectedDayOfWeek, selectedSessionId]);

  const currentSession = useMemo(
    () => daySessions.find((s) => s.id === selectedSessionId) || daySessions[0],
    [daySessions, selectedSessionId]
  );

  useEffect(() => {
    setSelectedMemberIds({});
  }, [selectedDate, selectedSessionId]);

  useEffect(() => {
    const availableIds = new Set(daySessions.map((session) => session.id));
    setResetSessionIds((current) => {
      const validIds = current.filter((id) => availableIds.has(id));
      return validIds.length > 0
        ? validIds
        : selectedSessionId && availableIds.has(selectedSessionId) ? [selectedSessionId] : [];
    });
  }, [daySessions, selectedDate, selectedSessionId]);

  // 2. Fetch all members with membership_id from profiles
  const { data: allMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ["admin-attendance-members-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, membership_id, phone_e164, avatar_url, member_status")
        .not("membership_id", "is", null)
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // 3. Fetch attendance records for the selected date & session
  const { data: attendanceRecords = [], isLoading: recordsLoading, refetch: refetchAttendance } = useQuery({
    queryKey: ["admin-attendance-records", selectedDate, selectedSessionId],
    enabled: !!selectedSessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("session_date", selectedDate)
        .eq("routine_session_id", selectedSessionId);
      if (error) {
        console.warn("Could not fetch attendance records:", error);
        return [];
      }
      return (data || []) as AttendanceRecord[];
    },
  });

  // Non-member self check-ins for consent-aware follow-up.
  const { data: guestLeads = [], refetch: refetchGuestLeads } = useQuery({
    queryKey: ["admin-attendance-guest-leads"],
    queryFn: async () => {
      const { data, error } = await guestLeadsTable()
        .select("*")
        .order("last_seen_at", { ascending: false })
        .limit(100);
      if (error) {
        console.warn("Could not fetch guest follow-up leads:", error);
        return [];
      }
      return data || [];
    },
  });

  // Map attendance by member_user_id and by phone
  const attendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const rec of attendanceRecords) {
      if (rec.member_user_id) {
        map.set(`user:${rec.member_user_id}`, rec);
      }
      if (rec.attendee_phone) {
        map.set(`phone:${normalizePhone10(rec.attendee_phone)}`, rec);
      }
    }
    return map;
  }, [attendanceRecords]);

  // Combined Roster: registered members + any guest walk-ins recorded today
  const fullRoster = useMemo(() => {
    const memberRows = allMembers.map((m) => {
      const phoneClean = normalizePhone10(m.phone_e164);
      const existing = attendanceMap.get(`user:${m.user_id}`) || attendanceMap.get(`phone:${phoneClean}`);
      return {
        id: m.user_id,
        user_id: m.user_id,
        name: m.full_name,
        membership_id: m.membership_id,
        phone: m.phone_e164,
        phone_clean: phoneClean,
        is_member: true,
        status: (existing?.attendance_status as AttendanceStatus) || "unmarked",
        role: (existing?.participation_role as ParticipationRole) || "listener",
        credits: existing ? existing.credits_awarded : 0,
        record_id: existing?.id,
      };
    });

    // Add guests who checked in today for this session who are not in memberRows
    const guestRows = attendanceRecords
      .filter((r) => !r.is_member || !r.member_user_id)
      .map((g) => ({
        id: g.id,
        user_id: null,
        name: g.attendee_name,
        membership_id: null,
        phone: g.attendee_phone,
        phone_clean: normalizePhone10(g.attendee_phone),
        is_member: false,
        status: (g.attendance_status as AttendanceStatus) || "present",
        role: (g.participation_role as ParticipationRole) || "listener",
        credits: g.credits_awarded,
        record_id: g.id,
      }));

    return [...memberRows, ...guestRows];
  }, [allMembers, attendanceRecords, attendanceMap]);

  // Filtered Roster by Search & Status
  const filteredRoster = useMemo(() => {
    return fullRoster.filter((item) => {
      const searchClean = searchQuery.trim().toLowerCase();
      const phoneSearch = searchQuery.replace(/\D/g, "");
      
      const matchesSearch =
        !searchClean ||
        (item.name || "").toLowerCase().includes(searchClean) ||
        ((item.membership_id || "").toLowerCase().includes(searchClean)) ||
        (phoneSearch.length > 0 && (item.phone_clean || "").includes(phoneSearch));

      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [fullRoster, searchQuery, statusFilter]);

  const visibleUnmarkedRows = useMemo(
    () => filteredRoster.filter((item) => item.status === "unmarked"),
    [filteredRoster]
  );

  const selectedUnmarkedRows = useMemo(
    () => fullRoster.filter((item) => selectedMemberIds[item.id] && item.status === "unmarked"),
    [fullRoster, selectedMemberIds]
  );

  const allVisibleUnmarkedSelected = visibleUnmarkedRows.length > 0
    && visibleUnmarkedRows.every((item) => selectedMemberIds[item.id]);

  const toggleVisibleUnmarked = (checked: boolean) => {
    setSelectedMemberIds((current) => {
      const next = { ...current };
      visibleUnmarkedRows.forEach((item) => {
        if (checked) next[item.id] = true;
        else delete next[item.id];
      });
      return next;
    });
  };

  // Metric counts
  const counts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let excused = 0;
    let unmarked = 0;
    let pending = 0;
    let performers = 0;
    let totalCredits = 0;

    for (const r of fullRoster) {
      if (r.status === "present") {
        present++;
        totalCredits += r.credits;
        if (r.role !== "listener") performers++;
      } else if (r.status === "absent") {
        absent++;
      } else if (r.status === "excused") {
        excused++;
      } else if (r.status === "pending") {
        pending++;
      } else {
        unmarked++;
      }
    }

    return {
      total: fullRoster.length,
      present,
      absent,
      excused,
      unmarked,
      pending,
      performers,
      listeners: present - performers,
      totalCredits,
    };
  }, [fullRoster]);

  // Mark status action
  const markStatusMutation = useMutation({
    mutationFn: async ({
      item,
      status,
      role = item.role,
    }: {
      item: any;
      status: AttendanceStatus;
      role?: ParticipationRole;
    }) => {
      if (status === "unmarked") {
        if (!item.record_id) return;
        if (item.user_id) {
          const { error: ledgerError } = await supabase
            .from("member_credit_ledger")
            .delete()
            .eq("attendance_record_id", item.record_id);
          if (ledgerError) throw ledgerError;
        }
        const { error: recordError } = await supabase
          .from("attendance_records")
          .delete()
          .eq("id", item.record_id);
        if (recordError) throw recordError;
        return;
      }

      const credits = status === "present" ? (ROLE_CREDITS[role] ?? 3) : 0;
      const sessionTitle = currentSession?.title || "Daily Routine Session";

      const recordPayload = {
        routine_session_id: selectedSessionId,
        session_date: selectedDate,
        session_title: sessionTitle,
        event_mode: eventMode,
        member_user_id: item.user_id,
        membership_id: item.membership_id,
        attendee_name: item.name,
        attendee_phone: item.phone_clean || "0000000000",
        is_member: item.is_member,
        attendance_status: status,
        participation_role: role,
        credits_awarded: credits,
        checkin_source: "admin_manual",
      };

      if (item.record_id) {
        // Update existing record
        const { error } = await supabase
          .from("attendance_records")
          .update(recordPayload as any)
          .eq("id", item.record_id);
        if (error) throw error;

        // If member, update credit ledger
        if (item.user_id) {
          await supabase.from("member_credit_ledger").delete().eq("attendance_record_id", item.record_id);
          if (status === "present" && credits > 0) {
            await supabase.from("member_credit_ledger").insert([{
              user_id: item.user_id,
              attendance_record_id: item.record_id,
              credits,
              role,
              description: `Attended ${sessionTitle} as ${ROLE_LABELS[role]?.label || role}`,
            } as any]);
          }
        }
      } else {
        // Insert new record
        const { data: inserted, error } = await supabase
          .from("attendance_records")
          .insert([recordPayload as any])
          .select()
          .single();
        if (error) throw error;

        // If member and present, insert into credit ledger
        if (item.user_id && inserted && status === "present" && credits > 0) {
          await supabase.from("member_credit_ledger").insert([{
            user_id: item.user_id,
            attendance_record_id: (inserted as any).id,
            credits,
            role,
            description: `Attended ${sessionTitle} as ${ROLE_LABELS[role]?.label || role}`,
          } as any]);
        }
      }
    },
    onSuccess: () => {
      refetchAttendance();
    },
    onError: (err: any) => {
      toast({
        title: "Could not update status",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Bulk Actions
  const handleMarkAllFilteredPresent = async () => {
    const toMark = selectedUnmarkedRows;
    if (toMark.length === 0) {
      toast({ title: "Select at least one unmarked member first" });
      return;
    }

    try {
      const recordsToInsert = toMark.map((item) => ({
        routine_session_id: selectedSessionId,
        session_date: selectedDate,
        session_title: currentSession?.title || "Daily Routine Session",
        event_mode: eventMode,
        member_user_id: item.user_id,
        membership_id: item.membership_id,
        attendee_name: item.name,
        attendee_phone: item.phone_clean || "0000000000",
        is_member: item.is_member,
        attendance_status: "present",
        participation_role: item.role || "listener",
        credits_awarded: ROLE_CREDITS[item.role || "listener"],
        checkin_source: "admin_manual",
      }));

      const { data: savedRecords, error } = await supabase
        .from("attendance_records")
        .upsert(recordsToInsert as any, {
          onConflict: "session_date,routine_session_id,attendee_phone",
        })
        .select("id, member_user_id, participation_role, session_title, credits_awarded");

      if (error) throw error;

      const memberRecords = (savedRecords || []).filter((record) => record.member_user_id);
      if (memberRecords.length > 0) {
        const recordIds = memberRecords.map((record) => record.id);
        await supabase.from("member_credit_ledger").delete().in("attendance_record_id", recordIds);
        const { error: ledgerError } = await supabase.from("member_credit_ledger").insert(memberRecords.map((record) => ({
          user_id: record.member_user_id,
          attendance_record_id: record.id,
          credits: record.credits_awarded,
          role: record.participation_role,
          description: `Attended ${record.session_title} as ${ROLE_LABELS[record.participation_role as ParticipationRole]?.label || record.participation_role}`,
        })) as any);
        if (ledgerError) throw ledgerError;
      }
      setSelectedMemberIds((current) => {
        const next = { ...current };
        toMark.forEach((item) => delete next[item.id]);
        return next;
      });
      toast({ title: `Marked ${toMark.length} members Present!` });
      refetchAttendance();
    } catch (err: any) {
      toast({ title: "Bulk action failed", description: err.message, variant: "destructive" });
    }
  };

  const handleMarkRemainingAbsent = async () => {
    const unmarked = fullRoster.filter((r) => r.status === "unmarked");
    if (unmarked.length === 0) {
      toast({ title: "No unmarked members left to mark absent" });
      return;
    }

    try {
      const recordsToInsert = unmarked.map((item) => ({
        routine_session_id: selectedSessionId,
        session_date: selectedDate,
        session_title: currentSession?.title || "Daily Routine Session",
        event_mode: eventMode,
        member_user_id: item.user_id,
        membership_id: item.membership_id,
        attendee_name: item.name,
        attendee_phone: item.phone_clean || "0000000000",
        is_member: item.is_member,
        attendance_status: "absent",
        participation_role: "listener",
        credits_awarded: 0,
        checkin_source: "admin_manual",
      }));

      const { error } = await supabase
        .from("attendance_records")
        .upsert(recordsToInsert as any, {
          onConflict: "session_date,routine_session_id,attendee_phone",
        });

      if (error) throw error;
      toast({ title: `Marked ${unmarked.length} members as Absent.` });
      refetchAttendance();
    } catch (err: any) {
      toast({ title: "Bulk mark absent failed", description: err.message, variant: "destructive" });
    }
  };

  // Add Walk-in Guest Attendee
  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneClean = normalizePhone10(guestPhone);
    if (!guestName.trim() || phoneClean.length < 10) {
      toast({ title: "Please enter a valid guest name and 10-digit phone number", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase.from("attendance_records").insert([{
        routine_session_id: selectedSessionId,
        session_date: selectedDate,
        session_title: currentSession?.title || "Daily Routine Session",
        event_mode: eventMode,
        attendee_name: guestName.trim(),
        attendee_phone: phoneClean,
        is_member: false,
        attendance_status: "present",
        participation_role: guestRole,
        credits_awarded: ROLE_CREDITS[guestRole],
        checkin_source: "admin_manual",
      } as any]);

      if (error) throw error;
      const { error: leadError } = await upsertGuestLead({
        p_attendee_name: guestName.trim(),
        p_attendee_phone: phoneClean,
        p_experience_feedback: null,
        p_source: "admin_manual",
      });
      if (leadError) {
        console.warn("Guest attendance saved but follow-up lead was not saved:", leadError);
        toast({
          title: "Guest checked in, follow-up needs attention",
          description: leadError.message,
          variant: "destructive",
        });
      }
      if (!leadError) toast({ title: `Guest ${guestName} checked in and added to New Visitors!` });
      setGuestModalOpen(false);
      setGuestName("");
      setGuestPhone("");
      refetchAttendance();
      refetchGuestLeads();
    } catch (err: any) {
      toast({ title: "Failed to add guest", description: err.message, variant: "destructive" });
    }
  };

  const updateGuestLeadStatus = async (leadId: string, status: string) => {
    const { error } = await guestLeadsTable()
      .update({ follow_up_status: status, updated_at: new Date().toISOString() })
      .eq("id", leadId);
    if (error) {
      toast({ title: "Could not update follow-up status", description: error.message, variant: "destructive" });
      return;
    }
    refetchGuestLeads();
  };

  const removeGuestLead = async (leadId: string) => {
    const { error } = await guestLeadsTable().delete().eq("id", leadId);
    if (error) {
      toast({ title: "Could not remove visitor", description: error.message, variant: "destructive" });
      return;
    }
    refetchGuestLeads();
  };

  const clearGuestLeads = async () => {
    setClearingVisitors(true);
    const { error } = await guestLeadsTable().delete().not("id", "is", null);
    setClearingVisitors(false);
    if (error) {
      toast({ title: "Could not clear visitors", description: error.message, variant: "destructive" });
      return;
    }
    setClearVisitorsOpen(false);
    refetchGuestLeads();
    toast({ title: "Visitor list cleared", description: "Attendance records were not deleted." });
  };

  const resetAnalyticsData = async () => {
    setResettingAnalytics(true);
    try {
      let query = supabase.from("attendance_records").select("id");
      if (resetScope === "selected_session") {
        query = query.eq("session_date", selectedDate).eq("routine_session_id", selectedSessionId);
      } else if (resetScope === "selected_sessions") {
        if (resetSessionIds.length === 0) {
          toast({ title: "Select at least one session" });
          return;
        }
        query = query.eq("session_date", selectedDate).in("routine_session_id", resetSessionIds);
      } else if (resetScope === "date_all") {
        query = query.eq("session_date", selectedDate);
      } else if (resetScope === "demo_records") {
        query = query.in("checkin_source", ["demo", "test"]);
      }

      const { data: rows, error: findError } = await query.range(0, 9999);
      if (findError) throw findError;
      const ids = (rows || []).map((row) => row.id);
      if (ids.length === 0) {
        toast({ title: "Nothing to reset", description: "No records matched the selected reset scope." });
        return;
      }

      const { error: ledgerError } = await supabase
        .from("member_credit_ledger")
        .delete()
        .in("attendance_record_id", ids);
      if (ledgerError) throw ledgerError;

      const { error: deleteError } = await supabase
        .from("attendance_records")
        .delete()
        .in("id", ids);
      if (deleteError) throw deleteError;

      await Promise.all([
        refetchAttendance(),
        queryClient.invalidateQueries({ queryKey: ["admin-attendance-analytics"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-absence-watchlist"] }),
      ]);
      setResetAnalyticsOpen(false);
      toast({ title: "Attendance data reset", description: `Removed ${ids.length} attendance record${ids.length === 1 ? "" : "s"}.` });
    } catch (error) {
      const message = error instanceof Error ? error.message : "The reset could not be completed.";
      toast({ title: "Reset failed", description: message, variant: "destructive" });
    } finally {
      setResettingAnalytics(false);
    }
  };

  // 4. Absence Watchlist Query (Doc Tab 07 & 08: Flag members with prolonged absence)
  const { data: absenceWatchlist = [] } = useQuery({
    queryKey: ["admin-absence-watchlist"],
    queryFn: async () => {
      // Use explicit attendance history only. Never-attended members belong in
      // engagement/new-member reporting, not an absence watchlist.
      const { data: recentRecords } = await supabase
        .from("attendance_records")
        .select("member_user_id, attendee_name, attendee_phone, session_date, attendance_status")
        .order("session_date", { ascending: false });

      const recordsByMember = new Map<string, typeof recentRecords>();
      for (const record of recentRecords || []) {
        if (!record.member_user_id) continue;
        const memberRecords = recordsByMember.get(record.member_user_id) || [];
        memberRecords.push(record);
        recordsByMember.set(record.member_user_id, memberRecords);
      }

      const watchlist = allMembers
        .map((m) => {
          const memberRecords = recordsByMember.get(m.user_id) || [];
          const lastDate = memberRecords.find((record) => record.attendance_status === "present")?.session_date;
          let absentStreak = 0;

          // Records are newest first. Count only the uninterrupted absent run
          // at the end; a present or excused record resets the run.
          for (const record of memberRecords) {
            if (record.attendance_status === "absent") absentStreak++;
            else break;
          }

          if (!lastDate) return null;
          const daysAbsent = lastDate
            ? Math.max(0, Math.floor((Date.now() - new Date(`${lastDate}T00:00:00`).getTime()) / (1000 * 60 * 60 * 24)))
            : 0;

          return {
            member_user_id: m.user_id,
            full_name: m.full_name,
            membership_id: m.membership_id,
            phone: m.phone_e164,
            last_attended_date: lastDate || "No record",
            days_absent: daysAbsent,
            absent_streak: absentStreak,
          };
        })
        .filter((w): w is NonNullable<typeof w> => Boolean(w && (w.days_absent >= 14 || w.absent_streak >= 3)))
        .sort((a, b) => b.days_absent - a.days_absent);

      return watchlist;
    },
    enabled: allMembers.length > 0,
  });

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["Name", "Hosla ID", "Phone", "Status", "Role", "Credits", "Session", "Date", "Mode"];
    const rows = fullRoster.map((r) => [
      `"${r.name}"`,
      `"${r.membership_id || "Guest"}"`,
      `"${r.phone_clean}"`,
      r.status,
      r.role,
      r.credits,
      `"${currentSession?.title || "Routine Session"}"`,
      selectedDate,
      eventMode,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_${selectedDate}_session.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 5. Real Analytics & Leaderboard Query
  const { data: analyticsData } = useQuery<AdminAnalyticsData>({
    queryKey: ["admin-attendance-analytics"],
    queryFn: async (): Promise<AdminAnalyticsData> => {
      const { data: attendanceRecords } = await supabase
        .from("attendance_records")
        .select("session_date, session_title, participation_role, checkin_time, created_at")
        .eq("attendance_status", "present");

      const { data: topMembers } = await supabase
        .from("member_credit_ledger")
        .select("user_id, credits, created_at, profiles(full_name, membership_id, avatar_url)");

      return {
        attendanceRecords: (attendanceRecords || []).map((record) => ({
          session_date: String(record.session_date ?? ""),
          session_title: record.session_title,
          participation_role: record.participation_role,
          checkin_time: record.checkin_time,
          created_at: record.created_at,
        })),
        topMembers: topMembers || [],
      };
    },
  });

  // Independent period controls so each section can be read on its own window.
  const chartPeriod = usePeriod("week");
  const leaderboardPeriod = usePeriod("month");
  const sessionPeriod = usePeriod("month");

  const analyticsRecords = analyticsData?.attendanceRecords || [];

  // Charts (trend + role distribution)
  const trendData = useMemo(
    () => buildTrendSeries(analyticsRecords, chartPeriod.range),
    [analyticsRecords, chartPeriod.range],
  );

  const chartSummary = useMemo(() => {
    const records = filterAttendanceByRange(analyticsRecords, chartPeriod.range);
    const { listeners, activeRoles } = summarizeParticipation(records);
    return { total: records.length, listeners, activeRoles };
  }, [analyticsRecords, chartPeriod.range]);

  const roleDistributionData = useMemo(
    () =>
      summarizeRoleDistribution(filterAttendanceByRange(analyticsRecords, chartPeriod.range)).map((entry) => ({
        name: ROLE_LABELS[entry.role as ParticipationRole]?.label || entry.role,
        value: entry.value,
      })),
    [analyticsRecords, chartPeriod.range],
  );

  const roleDistributionTotal = useMemo(
    () => roleDistributionData.reduce((sum, entry) => sum + entry.value, 0),
    [roleDistributionData],
  );

  // Leaderboard logic (calendar-window filtered)
  const leaderboard = useMemo(() => {
    if (!analyticsData?.topMembers) return [];
    const memberMap = new Map<string, { user_id: string; name: string; id: string; credits: number }>();
    analyticsData.topMembers
      .filter(
        (entry: any) =>
          !entry.created_at ||
          (entry.created_at.slice(0, 10) >= leaderboardPeriod.range.startDate &&
            entry.created_at.slice(0, 10) <= leaderboardPeriod.range.endDate),
      )
      .forEach((entry: any) => {
        if (!entry.user_id) return;
        if (!memberMap.has(entry.user_id)) {
          memberMap.set(entry.user_id, {
            user_id: entry.user_id,
            name: entry.profiles?.full_name || "Unknown",
            id: entry.profiles?.membership_id || "-",
            credits: 0,
          });
        }
        memberMap.get(entry.user_id)!.credits += entry.credits;
      });

    return Array.from(memberMap.values())
      .sort((a, b) => b.credits - a.credits)
      .slice(0, 5);
  }, [analyticsData?.topMembers, leaderboardPeriod.range]);

  // Session Popularity logic
  const topSessions = useMemo(
    () => summarizeSessions(filterAttendanceByRange(analyticsRecords, sessionPeriod.range)),
    [analyticsRecords, sessionPeriod.range],
  );

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Attendance & Engagement Tracker
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time session attendance, active role distribution, and member credits
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="rounded-xl shadow-sm"
            onClick={() => setShareModalOpen(true)}
            disabled={!selectedSessionId}
          >
            <QrCode className="h-4 w-4 mr-2 text-primary" />
            Check-In Link & QR
          </Button>

          <Button
            variant="outline"
            className="rounded-xl shadow-sm"
            onClick={handleExportCSV}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>

          <Button
            onClick={() => setGuestModalOpen(true)}
            className="rounded-xl shadow-sm bg-primary hover:bg-primary/90"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Walk-In Guest
          </Button>
        </div>
      </div>

      {/* Session Control Toolbar */}
      <Card className="border-primary/20 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            
            {/* 1. Date Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                Session Date
              </Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* 2. Routine Session Selector */}
            <div className="space-y-1.5 lg:col-span-2">
              <Label className="text-xs font-semibold flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Scheduled Routine Session ({daySessions.length} available)
                </span>
                <span className="text-[11px] font-normal text-primary">
                  {WEEK_DAYS.find((w) => w.value === selectedDayOfWeek)?.label}
                </span>
              </Label>
              <Select
                value={selectedSessionId}
                onValueChange={(val) => {
                  setSelectedSessionId(val);
                  const sess = daySessions.find((s) => s.id === val);
                  if (sess?.note?.toLowerCase().includes("offline")) {
                    setEventMode("offline");
                  }
                }}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Choose a scheduled session..." />
                </SelectTrigger>
                <SelectContent>
                  {daySessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="font-semibold">{formatTime12(s.start_time)}</span> - {s.title}
                      {s.note ? ` (${s.note.slice(0, 30)}...)` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 3. Event Mode Toggle */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Mode</Label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-xl">
                <button
                  type="button"
                  onClick={() => setEventMode("online")}
                  className={`py-1.5 px-3 flex justify-center text-xs font-semibold rounded-lg transition-colors ${
                    eventMode === "online" ? "bg-white dark:bg-card shadow-sm text-primary" : "text-muted-foreground"
                  }`}
                >
                  <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Online</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEventMode("offline")}
                  className={`py-1.5 px-3 flex justify-center text-xs font-semibold rounded-lg transition-colors ${
                    eventMode === "offline" ? "bg-white dark:bg-card shadow-sm text-primary" : "text-muted-foreground"
                  }`}
                >
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Offline</span>
                </button>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Metric Counters Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-card rounded-2xl border shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground font-medium">Total Roster</div>
            <div className="text-2xl font-extrabold text-foreground mt-0.5">{counts.total}</div>
          </div>
          <Users className="w-6 h-6 text-muted-foreground/40" />
        </div>

        <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-900 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">Present</div>
            <div className="text-2xl font-extrabold text-emerald-600 mt-0.5">{counts.present}</div>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-500/70" />
        </div>

        <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-amber-800 dark:text-amber-300 font-semibold">Performers</div>
            <div className="text-2xl font-extrabold text-amber-600 mt-0.5">{counts.performers}</div>
          </div>
          <Sparkles className="w-6 h-6 text-amber-500/70" />
        </div>

        <div className="p-3.5 bg-rose-50/60 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-rose-800 dark:text-rose-300 font-semibold">Absent</div>
            <div className="text-2xl font-extrabold text-rose-600 mt-0.5">{counts.absent}</div>
          </div>
          <XCircle className="w-6 h-6 text-rose-500/70" />
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Unmarked</div>
            <div className="text-2xl font-extrabold text-slate-700 dark:text-slate-300 mt-0.5">{counts.unmarked}</div>
          </div>
          <HelpCircle className="w-6 h-6 text-slate-400/70" />
        </div>

        <div className="p-3.5 bg-primary/5 rounded-2xl border border-primary/20 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-primary font-semibold">Credits Issued</div>
            <div className="text-2xl font-extrabold text-primary mt-0.5">+{counts.totalCredits}</div>
          </div>
          <Award className="w-6 h-6 text-primary/70" />
        </div>
      </div>

      {/* Tabs: Roster Marking | Analytics & Engagement | Absence Watchlist */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted p-1 rounded-xl">
          <TabsTrigger value="roster" className="rounded-lg font-semibold text-xs sm:text-sm">
            <CheckCheck className="w-4 h-4 mr-2" />
            Fast Attendance Roster
          </TabsTrigger>
          <TabsTrigger value="visitors" className="rounded-lg font-semibold text-xs sm:text-sm">
            <UserPlus className="w-4 h-4 mr-2" />
            New Visitors ({guestLeads.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg font-semibold text-xs sm:text-sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Engagement Analytics
          </TabsTrigger>
          <TabsTrigger value="watchlist" className="rounded-lg font-semibold text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 mr-2" />
            Absence Watchlist ({absenceWatchlist.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Fast Attendance Roster */}
        <TabsContent value="roster" className="space-y-4">
          
          {/* Search & Bulk Actions Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-2xl border shadow-sm">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search member name, Hosla ID, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-xl border-muted-foreground/20 text-sm"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(["all", "present", "pending", "absent", "unmarked"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    statusFilter === st
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Bulk Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllFilteredPresent}
                disabled={selectedUnmarkedRows.length === 0}
                title="Marks checked unmarked members as present"
                className="text-xs font-semibold rounded-xl text-emerald-700 hover:bg-emerald-50 border-emerald-300 disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                Mark {selectedUnmarkedRows.length} Checked Present
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkRemainingAbsent}
                disabled={fullRoster.filter((item) => item.status === "unmarked").length === 0}
                title="Marks all unmarked members in this session as absent, ignoring search filters"
                className="text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
              >
                Mark {fullRoster.filter((item) => item.status === "unmarked").length} Unmarked Absent
              </Button>
            </div>
          </div>

          {/* Roster Table */}
          <Card className="border shadow-sm overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/60 text-xs font-semibold text-muted-foreground border-b uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-12">
                      <Checkbox
                        aria-label="Select all visible unmarked members"
                        checked={allVisibleUnmarkedSelected}
                        onCheckedChange={(checked) => toggleVisibleUnmarked(checked === true)}
                        disabled={visibleUnmarkedRows.length === 0}
                      />
                    </th>
                    <th className="py-3 px-4">Member / Attendee</th>
                    <th className="py-3 px-4">Hosla ID / Contact</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Participation Role</th>
                    <th className="py-3 px-4 text-right">Credits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRoster.map((item) => {
                    const isPresent = item.status === "present";
                    const isAbsent = item.status === "absent";
                    const isExcused = item.status === "excused";
                    const isPending = item.status === "pending";

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-muted/30 transition-colors ${
                          isPresent ? "bg-emerald-50/20" : isAbsent ? "bg-rose-50/20" : ""
                        }`}
                      >
                        <td className="py-3 px-4 w-12">
                          <Checkbox
                            aria-label={`Select ${item.name}`}
                            checked={!!selectedMemberIds[item.id]}
                            onCheckedChange={(checked) => setSelectedMemberIds((current) => ({
                              ...current,
                              [item.id]: checked === true,
                            }))}
                            disabled={item.status !== "unmarked"}
                          />
                        </td>
                        {/* 1. Name & Avatar */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                              {item.name.slice(0, 2)}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground flex items-center gap-1.5">
                                {item.name}
                                {!item.is_member && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-600 border-slate-300">
                                    Walk-in Guest
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Hosla ID / Phone */}
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            {item.membership_id ? (
                              <Badge variant="secondary" className="font-mono text-xs text-primary font-bold">
                                {item.membership_id}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">Guest</span>
                            )}
                            <div className="text-xs text-muted-foreground">
                              {formatPhoneDisplay(item.phone_clean)}
                            </div>
                          </div>
                        </td>

                        {/* 3. Fast One-Tap Status Toggles */}
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => markStatusMutation.mutate({ item, status: "present" })}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                isPresent
                                  ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30"
                                  : "bg-muted text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700"
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {isPending ? "Verify present" : "Present"}
                            </button>

                            <button
                              type="button"
                              onClick={() => markStatusMutation.mutate({ item, status: "absent" })}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                isAbsent
                                  ? "bg-rose-600 text-white shadow-sm ring-2 ring-rose-500/30"
                                  : "bg-muted text-muted-foreground hover:bg-rose-50 hover:text-rose-700"
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Absent
                            </button>

                            <button
                              type="button"
                              onClick={() => markStatusMutation.mutate({ item, status: "excused" })}
                              className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                                isExcused
                                  ? "bg-amber-600 text-white shadow-sm"
                                  : "bg-muted text-muted-foreground hover:bg-amber-50 hover:text-amber-700"
                              }`}
                            >
                              Excused
                            </button>
                            {(isPresent || isAbsent || isExcused) && (
                              <button
                                type="button"
                                onClick={() => markStatusMutation.mutate({ item, status: "unmarked" })}
                                disabled={markStatusMutation.isPending}
                                title="Remove this attendance mark"
                                className="px-2 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 bg-muted text-muted-foreground hover:bg-slate-200 hover:text-slate-800 disabled:opacity-50"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Unmark
                              </button>
                            )}
                          </div>
                        </td>

                        {/* 4. Participation Role Selector */}
                        <td className="py-3 px-4">
                          <Select
                            disabled={!isPresent}
                            value={item.role}
                            onValueChange={(val) =>
                              markStatusMutation.mutate({
                                item,
                                status: "present",
                                role: val as ParticipationRole,
                              })
                            }
                          >
                            <SelectTrigger className="w-[180px] h-8 text-xs rounded-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(ROLE_LABELS).map(([k, meta]) => (
                                <SelectItem key={k} value={k}>
                                  <span className="mr-1.5">{meta.icon}</span>
                                  {meta.label} ({ROLE_CREDITS[k as ParticipationRole]} pts)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>

                        {/* 5. Credits Awarded */}
                        <td className="py-3 px-4 text-right">
                          {isPresent ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-xs">
                              +{item.credits} pts
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredRoster.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">
                        No members found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 2: Non-member visitor follow-up */}
        <TabsContent value="visitors" className="space-y-4">
          <Card className="shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                New Visitors & Follow-up
              </CardTitle>
              <CardDescription className="text-xs">
                Non-members who checked in through a QR, shared link, or admin walk-in entry.
              </CardDescription>
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-destructive border-destructive/30"
                  onClick={() => setClearVisitorsOpen(true)}
                  disabled={guestLeads.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear visitor list
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {guestLeads.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No non-member self check-ins have been recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="py-3 pr-4">Visitor</th>
                        <th className="py-3 pr-4">Phone</th>
                        <th className="py-3 pr-4">Visits</th>
                        <th className="py-3 pr-4">Last seen</th>
                        <th className="py-3 pr-4">Experience</th>
                        <th className="py-3">Follow-up</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {guestLeads.map((lead: any) => (
                        <tr key={lead.id}>
                          <td className="py-3 pr-4 font-semibold">{lead.attendee_name}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{formatPhoneDisplay(lead.attendee_phone)}</td>
                          <td className="py-3 pr-4">{lead.visit_count}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{new Date(lead.last_seen_at).toLocaleDateString("en-IN")}</td>
                          <td className="py-3 pr-4 max-w-xs text-xs text-muted-foreground">{lead.experience_feedback || "-"}</td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <Select value={lead.follow_up_status} onValueChange={(value) => updateGuestLeadStatus(lead.id, value)}>
                                <SelectTrigger className="w-36 h-9 rounded-lg text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="new">New</SelectItem>
                                  <SelectItem value="contacted">Contacted</SelectItem>
                                  <SelectItem value="interested">Interested</SelectItem>
                                  <SelectItem value="not_interested">Not interested</SelectItem>
                                  <SelectItem value="converted">Converted</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                title={`Remove ${lead.attendee_name}`}
                                aria-label={`Remove ${lead.attendee_name}`}
                                onClick={() => removeGuestLead(lead.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Engagement Analytics & Charts */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold">Engagement Analytics</h2>
              <p className="text-xs text-muted-foreground">
                Pick a day, week, month, or calendar year to compare attendance and participation in the charts below.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <PeriodPicker {...chartPeriod} />
              <Button variant="outline" className="rounded-xl text-destructive border-destructive/30" onClick={() => setResetAnalyticsOpen(true)}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset data
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Area Chart: Attendance Over Past Days */}
            <Card className="lg:col-span-2 shadow-sm rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Attendance Volume Trend
                </CardTitle>
                <CardDescription className="text-xs">
                  Every present check-in split into listeners and active roles, bucketed by{" "}
                  {chartPeriod.range.bucket === "hour" ? "hour" : chartPeriod.range.bucket === "month" ? "month" : "day"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex flex-wrap gap-2 pb-3">
                  <Badge variant="outline" className="rounded-lg border-primary/20 bg-primary/5 text-primary font-semibold">
                    {chartSummary.total} present
                  </Badge>
                  <Badge variant="outline" className="rounded-lg border-blue-200 bg-blue-50 text-blue-700 font-semibold dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                    {chartSummary.listeners} listeners
                  </Badge>
                  <Badge variant="outline" className="rounded-lg border-amber-200 bg-amber-50 text-amber-700 font-semibold dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                    {chartSummary.activeRoles} active roles
                  </Badge>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorListeners" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.75}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                        </linearGradient>
                        <linearGradient id="colorPerformers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.85}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                      <XAxis dataKey="label" fontSize={11} stroke="#888888" tickMargin={8} minTickGap={12} />
                      <YAxis fontSize={11} stroke="#888888" allowDecimals={false} width={36} />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Area type="monotone" dataKey="listeners" name="Listeners" stackId="1" stroke="#3b82f6" strokeWidth={2} fill="url(#colorListeners)" />
                      <Area type="monotone" dataKey="performers" name="Active roles" stackId="1" stroke="#f59e0b" strokeWidth={2} fill="url(#colorPerformers)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Donut Chart: Role Distribution */}
            <Card className="shadow-sm rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">Participation by Role</CardTitle>
                <CardDescription className="text-xs">Every present check-in grouped by the role they played</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                {roleDistributionData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-center text-sm text-muted-foreground">
                    Participation data will appear after a present record is saved.
                  </div>
                ) : (
                  <>
                    <div className="relative h-48 w-full min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={roleDistributionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={48}
                            outerRadius={72}
                            paddingAngle={3}
                            dataKey="value"
                            nameKey="name"
                          >
                            {roleDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-extrabold text-foreground">{roleDistributionTotal}</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Check-ins</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs font-semibold pt-1">
                      {roleDistributionData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                          <span className="text-muted-foreground">{entry.name}</span>
                          <span className="text-foreground">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

          </div>

          {/* New Grid for Leaderboard & Session Popularity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            
            {/* Top Contributors Leaderboard */}
            <Card className="shadow-sm rounded-2xl">
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Award className="w-4 h-4 text-primary" />
                      Top Contributors Leaderboard
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Most engagement credits · {leaderboardPeriod.range.label}
                    </CardDescription>
                  </div>
                  <PeriodPicker {...leaderboardPeriod} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mt-2">
                  {leaderboard.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">No credits awarded in this period.</div>
                  ) : (
                    leaderboard.map((member, idx) => {
                      const topCredits = leaderboard[0]?.credits || 1;
                      return (
                        <div key={member.user_id} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                                idx === 0 ? "bg-amber-100 text-amber-600" :
                                idx === 1 ? "bg-slate-100 text-slate-600" :
                                idx === 2 ? "bg-orange-100 text-orange-600" :
                                "bg-primary/10 text-primary"
                              }`}>
                                {idx + 1}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-semibold truncate">{member.name}</div>
                                <div className="text-[10px] text-muted-foreground">{member.id}</div>
                              </div>
                            </div>
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-bold shrink-0">
                              {member.credits} pts
                            </Badge>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary"
                              style={{ width: `${Math.round((member.credits / topCredits) * 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Popular Sessions */}
            <Card className="shadow-sm rounded-2xl">
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-500" />
                      Session Popularity
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Highest attendance by session · {sessionPeriod.range.label}
                    </CardDescription>
                  </div>
                  <PeriodPicker {...sessionPeriod} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mt-2">
                  {topSessions.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">No session data available.</div>
                  ) : (
                    topSessions.map((sess, idx) => {
                      const maxAttendees = topSessions[0]?.attendees || 1;
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium truncate pr-3">{sess.name}</span>
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground shrink-0">
                              <Users className="w-3.5 h-3.5" />
                              {sess.attendees}
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500"
                              style={{ width: `${Math.round((sess.attendees / maxAttendees) * 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* TAB 3: Absence Watchlist & Caring Outreach */}
        <TabsContent value="watchlist" className="space-y-4">
          <Card className="shadow-sm rounded-2xl border-amber-200 dark:border-amber-900 bg-amber-50/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Senior Care & Absence Watchlist
              </CardTitle>
              <CardDescription className="text-xs">
                Members absent for several consecutive sessions. Reach out with a warm, supportive wellness check (Doc Tab 08).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border/60">
                {absenceWatchlist.map((m) => (
                  <div key={m.member_user_id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-sm text-foreground flex items-center gap-2">
                        {m.full_name}
                        {m.membership_id && (
                          <Badge variant="outline" className="font-mono text-xs">
                            {m.membership_id}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
                        <span className="flex items-center gap-1"><Smartphone className="w-3.5 h-3.5" /> {formatPhoneDisplay(m.phone)}</span>
                        <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> Last seen: {m.last_attended_date}</span>
                        <span className="text-amber-700 dark:text-amber-400 font-semibold">
                          ({m.days_absent} days away)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs"
                        onClick={() => {
                          const msg = generateSupportiveAbsenceMessage(
                            m.full_name,
                            currentSession?.title || "Hosla Sessions",
                            m.days_absent
                          );
                          const cleanPhone = normalizePhone10(m.phone);
                          const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`;
                          window.open(url, "_blank");
                        }}
                      >
                        <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                        WhatsApp Wellness Check
                      </Button>
                    </div>
                  </div>
                ))}

                {absenceWatchlist.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
                    No members currently on the absence watchlist. Great consistency! <Smile className="w-4 h-4 text-emerald-500" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      <Dialog open={resetAnalyticsOpen} onOpenChange={setResetAnalyticsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset attendance data</DialogTitle>
            <DialogDescription>
              This removes attendance records and their member credits. Visitor follow-up leads are not deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Reset scope</Label>
              <Select value={resetScope} onValueChange={(value) => setResetScope(value as typeof resetScope)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="selected_session">Selected date and session</SelectItem>
                <SelectItem value="selected_sessions">Multiple sessions on selected date</SelectItem>
                <SelectItem value="date_all">All sessions on selected date</SelectItem>
                <SelectItem value="demo_records">Records marked demo or test</SelectItem>
                <SelectItem value="all_attendance">All attendance records</SelectItem>
              </SelectContent>
            </Select>
            {resetScope === "selected_sessions" && (
              <div className="space-y-2 rounded-xl border p-3 max-h-48 overflow-y-auto">
                <p className="text-xs font-semibold text-muted-foreground">Choose sessions to remove</p>
                {daySessions.map((session) => (
                  <label key={session.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={resetSessionIds.includes(session.id)}
                      onCheckedChange={(checked) => setResetSessionIds((current) => checked === true
                        ? Array.from(new Set([...current, session.id]))
                        : current.filter((id) => id !== session.id))}
                    />
                    <span>{formatTime12(session.start_time)} - {session.title}</span>
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {resetScope === "selected_session"
                ? `Removes records for ${selectedDate} in ${currentSession?.title || "the selected session"}.`
                : resetScope === "selected_sessions"
                  ? `Removes records for ${resetSessionIds.length} selected session${resetSessionIds.length === 1 ? "" : "s"} on ${selectedDate}.`
                  : resetScope === "date_all"
                    ? `Removes every attendance record on ${selectedDate}, across all sessions.`
                    : resetScope === "demo_records"
                      ? "Removes only records whose check-in source is explicitly demo or test. Existing admin entries are kept."
                      : "Removes every attendance record in the system. Visitor follow-up leads are kept."}
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setResetAnalyticsOpen(false)} disabled={resettingAnalytics}>Cancel</Button>
            <Button variant="destructive" onClick={resetAnalyticsData} disabled={resettingAnalytics}>
              {resettingAnalytics && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reset selected data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={clearVisitorsOpen} onOpenChange={setClearVisitorsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear New Visitors?</DialogTitle>
            <DialogDescription>
              This removes all visitor follow-up records, including visit counts, notes, and follow-up statuses. Attendance records are kept.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setClearVisitorsOpen(false)} disabled={clearingVisitors}>Cancel</Button>
            <Button variant="destructive" onClick={clearGuestLeads} disabled={clearingVisitors}>
              {clearingVisitors && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Clear visitor list
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share QR & Link Modal */}
      <AttendanceShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        sessionTitle={currentSession?.title || "Daily Routine Session"}
        sessionId={selectedSessionId}
        sessionDate={selectedDate}
        eventMode={eventMode}
      />

      {/* Add Walk-in Guest Modal */}
      <Dialog open={guestModalOpen} onOpenChange={setGuestModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Walk-In / Guest Attendee</DialogTitle>
            <DialogDescription>
              Record an attendee who is not yet registered in the member directory.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddGuest} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Guest Full Name</Label>
              <Input
                placeholder="Enter full name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">10-Digit Mobile Number</Label>
              <Input
                placeholder="e.g. 9876543210"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                maxLength={10}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Participation Role</Label>
              <Select value={guestRole} onValueChange={(val) => setGuestRole(val as ParticipationRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="listener">🎧 Listener / Participant (+3 credits)</SelectItem>
                  <SelectItem value="performer">🌟 Active Performer (+5 credits)</SelectItem>
                  <SelectItem value="anchor">🎙️ Anchor / Host (+5 credits)</SelectItem>
                  <SelectItem value="reader">📖 Reader (+5 credits)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setGuestModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary">
                Add & Mark Present
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
