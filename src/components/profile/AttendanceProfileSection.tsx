import { useEffect, useRef, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Flame, Award, Sparkles, CalendarDays, CheckCircle2, History, Star,
  TrendingUp, Clock, Info
} from "lucide-react";
import { formatPhoneDisplay, ROLE_LABELS, type AttendanceRecord } from "@/lib/attendance";
import { calculateStreaks } from "@/lib/attendance-analytics";

interface AttendanceProfileSectionProps {
  userId: string;
  membershipId?: string | null;
  phone?: string | null;
}

export function AttendanceProfileSection({ userId, membershipId, phone }: AttendanceProfileSectionProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 1. Fetch attendance records for this user
  const { data: records = [], isLoading } = useQuery({
    queryKey: ["user-attendance-history", userId],
    enabled: !!userId,
    queryFn: async () => {
      let query = supabase
        .from("attendance_records")
        .select("*")
        .eq("attendance_status", "present")
        .order("session_date", { ascending: false });

      if (userId) {
        query = query.eq("member_user_id", userId);
      }
      const { data, error } = await query;
      if (error) {
        console.warn("Could not load member attendance:", error);
        return [];
      }
      return (data || []) as AttendanceRecord[];
    },
  });

  // 2. Fetch credits ledger
  const { data: creditLedger = [] } = useQuery({
    queryKey: ["user-credit-ledger", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("member_credit_ledger")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) return [];
      return data || [];
    },
  });

  // Calculate metrics
  const totalCredits = useMemo(() => {
    if (creditLedger.length > 0) {
      return creditLedger.reduce((sum, item) => sum + (item.credits || 0), 0);
    }
    return records.reduce((sum, item) => sum + (item.credits_awarded || 0), 0);
  }, [creditLedger, records]);

  const totalSessions = records.length;

  const performerCount = useMemo(() => {
    return records.filter((r) => r.participation_role && r.participation_role !== "listener").length;
  }, [records]);

  const participationDistribution = useMemo(() => {
    const activeRoles = records.filter((record) => record.participation_role && record.participation_role !== "listener").length;
    return [
      { label: "Attended as listener", value: records.length - activeRoles, color: "bg-emerald-500" },
      { label: "Active role", value: activeRoles, color: "bg-blue-500" },
    ];
  }, [records]);

  // Compute streaks
  const { currentStreak, longestStreak } = useMemo(() => {
    return calculateStreaks(records.map((record) => record.session_date));
  }, [records]);

  // 3. Render Canvas Heatmap (Past 90 Days activity punch-card)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dates map
    const activeDates = new Set(records.map((r) => r.session_date));

    const totalDays = 84; // 12 weeks of 7 days
    const cellSize = 13;
    const cellGap = 4;
    const cols = 12;
    const rows = 7;

    canvas.width = cols * (cellSize + cellGap) + 40;
    canvas.height = rows * (cellSize + cellGap) + 20;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Compute dates starting 12 weeks ago
    const startDay = new Date();
    startDay.setDate(startDay.getDate() - totalDays);

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const dayOffset = c * 7 + r;
        const targetDate = new Date(startDay);
        targetDate.setDate(targetDate.getDate() + dayOffset);
        const dateKey = targetDate.toISOString().split("T")[0];

        const x = 30 + c * (cellSize + cellGap);
        const y = 5 + r * (cellSize + cellGap);

        const isActive = activeDates.has(dateKey);

        ctx.beginPath();
        // Rounded rect
        const radius = 3;
        ctx.roundRect(x, y, cellSize, cellSize, radius);

        if (isActive) {
          ctx.fillStyle = "#10b981"; // Emerald green for active
        } else {
          ctx.fillStyle = "#e2e8f0"; // Neutral grey
        }
        ctx.fill();
      }
    }

    // Day labels (Mon, Wed, Fri)
    ctx.font = "9px sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Mon", 4, 28);
    ctx.fillText("Wed", 4, 62);
    ctx.fillText("Fri", 4, 96);

  }, [records]);

  return (
    <div className="space-y-6">
      
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* Credits Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-card border border-primary/20 shadow-sm">
          <div className="flex items-center justify-between text-primary">
            <span className="text-xs font-semibold uppercase tracking-wider">Hosla Credits</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-foreground mt-2">
            {totalCredits} <span className="text-sm font-semibold text-primary">pts</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            +3 / +5 credits per event
          </div>
        </div>

        {/* Current Streak */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-card border border-amber-300/40 shadow-sm">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Streak</span>
            <Flame className="w-4 h-4 fill-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-foreground mt-2">
            {currentStreak} <span className="text-sm font-semibold text-amber-600">Days</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Best: {longestStreak} days in a row
          </div>
        </div>

        {/* Total Sessions */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-card border border-emerald-300/40 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-semibold uppercase tracking-wider">Attended</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-3xl font-extrabold text-foreground mt-2">
            {totalSessions} <span className="text-sm font-semibold text-emerald-600">Sessions</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Routine & special events
          </div>
        </div>

        {/* Active Roles Performed */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-card border border-purple-300/40 shadow-sm">
          <div className="flex items-center justify-between text-purple-600">
            <span className="text-xs font-semibold uppercase tracking-wider">Performances</span>
            <Star className="w-4 h-4 text-purple-500 fill-purple-500" />
          </div>
          <div className="text-3xl font-extrabold text-foreground mt-2">
            {performerCount} <span className="text-sm font-semibold text-purple-600">Times</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Song, poetry & anchoring
          </div>
        </div>

      </div>

      {/* Canvas Heatmap Activity Graph */}
      <Card className="rounded-2xl border shadow-sm overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            Attendance Activity Heatmap
          </CardTitle>
          <CardDescription className="text-xs">
            Visual record of your participation over the past 12 weeks
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto pb-2">
            <canvas ref={canvasRef} className="block mx-auto max-w-full" />
          </div>
          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground pt-2">
            <span>Less active</span>
            <span className="w-3 h-3 rounded-sm bg-slate-200 inline-block"></span>
            <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block"></span>
            <span>Attended</span>
          </div>
        </CardContent>
      </Card>

      {/* Participation summary */}
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Participation Distribution
          </CardTitle>
          <CardDescription className="text-xs">
            How your attended sessions have been distributed between listening and active roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="text-sm text-muted-foreground">Participation data will appear after your first attended session.</p>
          ) : (
            <div className="space-y-3">
              {participationDistribution.map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-muted-foreground">{item.value} ({Math.round((item.value / records.length) * 100)}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${(item.value / records.length) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Milestone Badges */}
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            Milestone Badges Unlocked
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`p-3 rounded-xl border text-center ${totalSessions >= 1 ? "bg-primary/5 border-primary/30" : "opacity-40 grayscale"}`}>
              <div className="text-2xl mb-1">🥉</div>
              <div className="font-bold text-xs">First Step</div>
              <div className="text-[10px] text-muted-foreground">Joined 1st session</div>
            </div>

            <div className={`p-3 rounded-xl border text-center ${longestStreak >= 7 ? "bg-amber-500/10 border-amber-400" : "opacity-40 grayscale"}`}>
              <div className="text-2xl mb-1">🥈</div>
              <div className="font-bold text-xs">Consistent Member</div>
              <div className="text-[10px] text-muted-foreground">7-Day streak</div>
            </div>

            <div className={`p-3 rounded-xl border text-center ${longestStreak >= 14 ? "bg-emerald-500/10 border-emerald-400" : "opacity-40 grayscale"}`}>
              <div className="text-2xl mb-1">🥇</div>
              <div className="font-bold text-xs">Care Pillar</div>
              <div className="text-[10px] text-muted-foreground">14-Day streak</div>
            </div>

            <div className={`p-3 rounded-xl border text-center ${performerCount >= 3 ? "bg-purple-500/10 border-purple-400" : "opacity-40 grayscale"}`}>
              <div className="text-2xl mb-1">🌟</div>
              <div className="font-bold text-xs">Star Contributor</div>
              <div className="text-[10px] text-muted-foreground">Active 3+ times</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Attendance Log */}
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            Recent Session History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border text-sm">
            {records.slice(0, 10).map((r) => (
              <div key={r.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-foreground">{r.session_title}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                    <span>📅 {r.session_date}</span>
                    <span className="capitalize">📍 {r.event_mode}</span>
                    <span>·</span>
                    <span className="font-medium text-foreground">
                      {ROLE_LABELS[r.participation_role as keyof typeof ROLE_LABELS]?.label || r.participation_role}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold">
                    +{r.credits_awarded} pts
                  </Badge>
                </div>
              </div>
            ))}

            {records.length === 0 && (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No attendance records yet. Join today's routine sessions to start earning credits! 🌸
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
