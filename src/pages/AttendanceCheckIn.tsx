import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import {
  CheckCircle2, UserCheck, CalendarDays, Clock, MapPin, Sparkles,
  Search, ShieldCheck, Flame, Award, Heart, Loader2, ArrowLeft, RefreshCw,
  Globe, Headphones, Star
} from "lucide-react";
import {
  normalizePhone10, maskPhone, ROLE_CREDITS, ROLE_LABELS,
  type ParticipationRole
} from "@/lib/attendance";
import { formatTime12, getISTNow, type RoutineSession } from "@/lib/routine";
import logoShraddha from "@/assets/logo-shraddha.png";

export default function AttendanceCheckIn() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const sessionIdParam = searchParams.get("session_id") || "";
  const eventIdParam = searchParams.get("event_id") || "";
  const dateParam = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const modeParam = (searchParams.get("mode") || "offline") as "online" | "offline";

  // Form states
  const [selectedSessionId, setSelectedSessionId] = useState(sessionIdParam);
  const [selectedRole, setSelectedRole] = useState<ParticipationRole>("listener");
  
  // Dynamic Name / Phone / Member search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{
    user_id: string;
    full_name: string;
    membership_id: string | null;
    phone_e164: string;
  } | null>(null);

  const [guestName, setGuestName] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [guestExperienceFeedback, setGuestExperienceFeedback] = useState("");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<{
    success: boolean;
    attendee_name: string;
    membership_id?: string | null;
    is_member: boolean;
    verification_pending?: boolean;
    credits_awarded: number;
    total_credits?: number;
    current_streak?: number;
  } | null>(null);

  // Fetch session details if sessionIdParam is present
  const { data: currentSession, isLoading: sessionLoading } = useQuery({
    queryKey: ["attendance-checkin-session", selectedSessionId],
    enabled: !!selectedSessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("routine_sessions")
        .select("*")
        .eq("id", selectedSessionId)
        .maybeSingle();
      if (error) {
        console.warn("Could not fetch routine session:", error);
        return null;
      }
      return data as RoutineSession | null;
    },
  });

  // If no session ID in query, fetch today's active routine sessions for selection
  const istNow = useMemo(() => getISTNow(), []);
  const { data: todaySessions = [] } = useQuery({
    queryKey: ["attendance-today-sessions", istNow.day],
    enabled: !selectedSessionId,
    queryFn: async () => {
      const { data } = await supabase
        .from("routine_sessions")
        .select("*")
        .eq("is_active", true)
        .eq("day_of_week", istNow.day)
        .order("start_time", { ascending: true });
      return (data || []) as RoutineSession[];
    },
  });

  // Dynamic search for members as user types phone number, Hosla ID, or Name
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        // Try RPC lookup first
        const { data, error } = await supabase.rpc("lookup_member_for_attendance", { _query: q });
        if (!error && Array.isArray(data)) {
          setSearchResults(data);
        } else {
          // Fallback: search profiles if permitted
          const cleanedDigits = q.replace(/\D/g, "");
          let query = supabase
            .from("profiles")
            .select("user_id, full_name, membership_id, phone_e164")
            .not("membership_id", "is", null)
            .limit(6);
          if (cleanedDigits.length >= 4) {
            query = query.ilike("phone_e164", `%${cleanedDigits}%`);
          } else {
            query = query.or(`full_name.ilike.%${q}%,membership_id.ilike.%${q}%`);
          }
          const { data: fallbackData } = await query;
          setSearchResults(fallbackData || []);
        }
      } catch (err) {
        console.warn("Member lookup error:", err);
      } finally {
        setSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handler when a member suggestion is clicked
  const handleSelectMember = (member: any) => {
    setSelectedMember(member);
    setSearchQuery(member.full_name);
    setPhoneInput(normalizePhone10(member.phone_e164));
    setIsGuestMode(false);
    setSearchResults([]);
  };

  const handleResetMember = () => {
    setSelectedMember(null);
    setSearchQuery("");
    setPhoneInput("");
    setGuestName("");
    setIsGuestMode(false);
    setGuestExperienceFeedback("");
    setSearchResults([]);
  };

  const sessionTitle = currentSession?.title || "Hosla & Shraddha Care Hub Session";
  const sessionTime = currentSession?.start_time ? formatTime12(currentSession.start_time) : "";

  const saveGuestLead = async (name: string, phone: string, feedback: string) => {
    const { error } = await supabase.rpc("upsert_attendance_guest_lead", {
      p_attendee_name: name,
      p_attendee_phone: phone,
      p_experience_feedback: feedback || null,
      p_source: "self_checkin",
    });
    if (error) console.warn("Could not save guest follow-up lead:", error);
  };

  // Submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedPhone = normalizePhone10(phoneInput);
    if (!normalizedPhone || normalizedPhone.length < 10) {
      toast({
        title: "Valid Phone Number Required",
        description: "Please enter your 10-digit mobile number.",
        variant: "destructive",
      });
      return;
    }

    const attendeeName = selectedMember ? selectedMember.full_name : guestName.trim();
    if (!attendeeName) {
      toast({
        title: "Name is required",
        description: "Please enter your full name.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const creditsToAward = ROLE_CREDITS[selectedRole] ?? 3;

    try {
      // 1. Try server RPC function submit_self_attendance
      const { data: rpcData, error: rpcError } = await supabase.rpc("submit_self_attendance", {
        p_routine_session_id: selectedSessionId || null,
        p_event_id: eventIdParam || null,
        p_session_date: dateParam,
        p_session_title: sessionTitle,
        p_event_mode: modeParam,
        p_attendee_name: attendeeName,
        p_attendee_phone: normalizedPhone,
        p_participation_role: selectedRole,
      });

      if (!rpcError && rpcData && typeof rpcData === "object" && (rpcData as any).success) {
        const res = rpcData as any;
        setSubmittedResult({
          success: true,
          attendee_name: res.attendee_name || attendeeName,
          membership_id: res.membership_id,
          is_member: !!res.is_member,
          verification_pending: res.verification_pending ?? true,
          credits_awarded: res.verification_pending ? 0 : (res.credits_awarded || creditsToAward),
          total_credits: res.total_credits,
          current_streak: res.current_streak,
        });

        if (!res.is_member) await saveGuestLead(attendeeName, normalizedPhone, guestExperienceFeedback);

        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6"],
        });
        return;
      }

      // 2. Direct client insert fallback (if RPC is not yet applied to the DB)
      const recordData = {
        routine_session_id: selectedSessionId || null,
        event_id: eventIdParam || null,
        session_date: dateParam,
        session_title: sessionTitle,
        event_mode: modeParam,
        member_user_id: selectedMember?.user_id || null,
        membership_id: selectedMember?.membership_id || null,
        attendee_name: attendeeName,
        attendee_phone: normalizedPhone,
        is_member: !!selectedMember,
        attendance_status: "pending",
        participation_role: selectedRole,
        credits_awarded: 0,
        checkin_source: "self_checkin",
      };

      const { data: insertedRecord, error: insertError } = await supabase
        .from("attendance_records")
        .insert([recordData as any])
        .select()
        .single();

      if (insertError) {
        // If unique constraint violation, let them know they are already marked
        if (insertError.code === "23505" || insertError.message?.includes("duplicate")) {
          setSubmittedResult({
            success: true,
            attendee_name: attendeeName,
            membership_id: selectedMember?.membership_id,
            is_member: !!selectedMember,
            verification_pending: true,
            credits_awarded: 0,
          });
          toast({
            title: "Already Checked In!",
            description: "Your attendance was already recorded for this session today.",
          });
          if (!selectedMember) await saveGuestLead(attendeeName, normalizedPhone, guestExperienceFeedback);
          return;
        }
        throw insertError;
      }

      if (!selectedMember) await saveGuestLead(attendeeName, normalizedPhone, guestExperienceFeedback);

      setSubmittedResult({
        success: true,
        attendee_name: attendeeName,
        membership_id: selectedMember?.membership_id,
        is_member: !!selectedMember,
        verification_pending: true,
        credits_awarded: 0,
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6"],
      });

    } catch (err: any) {
      console.error("Attendance submission error:", err);
      toast({
        title: "Could not record attendance",
        description: err.message || "Please check your network and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background py-8 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-white shadow-sm border mb-1">
            <img src={logoShraddha} alt="Hosla & Shraddha" className="h-10 w-auto object-contain" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Session Check-In
          </h1>
          <p className="text-sm text-muted-foreground">
            Hosla & Shraddha Attendance & Engagement Portal
          </p>
        </div>

        {/* Success View */}
        {submittedResult ? (
          <Card className="border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900 shadow-md">
            <CardContent className="pt-8 pb-8 text-center space-y-5">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <Badge className={submittedResult.verification_pending ? "bg-amber-600 text-white hover:bg-amber-600 px-3 py-1 text-xs" : "bg-emerald-600 text-white hover:bg-emerald-600 px-3 py-1 text-xs"}>
                  {submittedResult.verification_pending ? "Submitted for verification" : "Attendance Confirmed!"}
                </Badge>
                <h2 className="text-2xl font-bold text-foreground pt-2">
                  {submittedResult.attendee_name}
                </h2>
                {submittedResult.membership_id && (
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    Hosla ID: {submittedResult.membership_id}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">{sessionTitle}</p>
              </div>

              {submittedResult.verification_pending ? (
                <div className="max-w-sm mx-auto rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Your check-in was received and is waiting for coordinator verification. Credits will be added after approval.
                </div>
              ) : (
              /* Earned Credits & Streak Banner */
              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto pt-2">
                <div className="p-3 bg-white dark:bg-card rounded-xl border border-emerald-200/80 shadow-sm text-center">
                  <div className="flex items-center justify-center gap-1 text-emerald-600 font-bold text-xl">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    +{submittedResult.credits_awarded}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium mt-0.5">
                    Credits Earned
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-card rounded-xl border border-emerald-200/80 shadow-sm text-center">
                  <div className="flex items-center justify-center gap-1 text-amber-600 font-bold text-xl">
                    <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
                    {submittedResult.current_streak ? `${submittedResult.current_streak} Streak` : "Active"}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium mt-0.5">
                    Consistency
                  </div>
                </div>
              </div>
              )}

              <div className="pt-4 flex flex-col sm:flex-row gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSubmittedResult(null);
                    handleResetMember();
                  }}
                  className="rounded-xl"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Check-In Another Attendee
                </Button>
                <Button asChild className="rounded-xl">
                  <Link to="/daily-routine">
                    View Daily Routine
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Check-In Form */
          <Card className="shadow-lg border-primary/20 backdrop-blur-sm bg-card/95">
            <CardHeader className="pb-4">
              {/* Event Pre-defined Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-accent/30 to-background border border-primary/20 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    Scheduled Session
                  </span>
                  <Badge variant={modeParam === "online" ? "secondary" : "default"} className="capitalize flex items-center gap-1">
                    {modeParam === "online" ? <><Globe className="w-3.5 h-3.5" /> Online</> : <><MapPin className="w-3.5 h-3.5" /> Offline</>}
                  </Badge>
                </div>
                <div className="font-bold text-base sm:text-lg text-foreground leading-snug">
                  {sessionTitle}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {dateParam}
                  </span>
                  {sessionTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {sessionTime}
                    </span>
                  )}
                  {currentSession?.note && (
                    <span className="flex items-center gap-1 truncate max-w-[200px]">
                      <MapPin className="w-3.5 h-3.5" />
                      {currentSession.note}
                    </span>
                  )}
                </div>
              </div>

              {/* If no session was in URL, allow picking today's sessions */}
              {!selectedSessionId && todaySessions.length > 0 && (
                <div className="pt-2">
                  <Label className="text-xs font-semibold">Select Today's Session</Label>
                  <select
                    className="w-full mt-1.5 p-2.5 rounded-lg border bg-background text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                  >
                    <option value="">-- Choose Session --</option>
                    {todaySessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {formatTime12(s.start_time)} - {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* 1. Member Lookup / Identification */}
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-foreground flex items-center justify-between">
                    <span>Your Details (Member or Guest)</span>
                    {selectedMember && (
                      <button
                        type="button"
                        onClick={handleResetMember}
                        className="text-xs text-primary underline font-normal"
                      >
                        Change Member
                      </button>
                    )}
                  </Label>

                  {/* Selected Member Verified Pill */}
                  {selectedMember ? (
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                          <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-foreground">
                            {selectedMember.full_name}
                          </div>
                          <div className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                            {selectedMember.membership_id ? `Hosla ID: ${selectedMember.membership_id}` : "Verified Member"}
                            {" · "}
                            {maskPhone(selectedMember.phone_e164)}
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-emerald-600 text-white">Verified</Badge>
                    </div>
                  ) : (
                    /* Search Input */
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Type Phone Number, Hosla ID, or Name..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            // If user is typing digits, keep phone input synchronized
                            const raw = e.target.value;
                            if (/^\d+$/.test(raw)) {
                              setPhoneInput(raw);
                            }
                          }}
                          className="pl-9 text-base py-5 rounded-xl border-primary/30 focus-visible:ring-primary"
                          autoComplete="off"
                        />
                        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                        {searching && (
                          <Loader2 className="w-4 h-4 text-primary animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                        )}
                      </div>

                      {/* Autocomplete Dropdown */}
                      {searchResults.length > 0 && !selectedMember && (
                        <div className="bg-popover text-popover-foreground border rounded-xl shadow-lg overflow-hidden divide-y">
                          <div className="px-3 py-1.5 bg-muted/60 text-xs font-semibold text-muted-foreground">
                            Found Hosla Members (Click to select)
                          </div>
                          {searchResults.map((m) => (
                            <button
                              key={m.user_id}
                              type="button"
                              onClick={() => handleSelectMember(m)}
                              className="w-full text-left p-3 hover:bg-primary/10 transition-colors flex items-center justify-between"
                            >
                              <div>
                                <div className="font-semibold text-sm text-foreground">
                                  {m.full_name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {m.membership_id && <span className="font-mono text-primary font-bold mr-2">{m.membership_id}</span>}
                                  <span>{m.phone_masked || formatPhoneDisplay(m.phone_e164)}</span>
                                </div>
                              </div>
                              <span className="text-xs text-primary font-medium">Select →</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Non-member guest fallback prompt */}
                      {searchQuery.trim().length >= 3 && searchResults.length === 0 && !searching && (
                        <div className="p-3 bg-muted/40 rounded-xl border text-xs space-y-2">
                          <p className="text-muted-foreground">
                            No registered member found for <span className="font-semibold text-foreground">"{searchQuery}"</span>.
                            Joining as a guest?
                          </p>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="w-full text-xs font-semibold"
                            onClick={() => {
                              setIsGuestMode(true);
                              if (!/^\d+$/.test(searchQuery)) {
                                setGuestName(searchQuery);
                              }
                            }}
                          >
                            <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                            Continue as Guest / Walk-in Attendee
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Guest inputs if not selecting an existing member */}
                  {(!selectedMember && isGuestMode) && (
                    <div className="space-y-3 pt-2 p-3.5 bg-muted/30 rounded-xl border border-dashed">
                      <div className="text-xs font-bold text-foreground">Guest Attendee Information:</div>
                      <div className="space-y-1">
                        <Label className="text-xs">Full Name</Label>
                        <Input
                          placeholder="Enter your full name"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          className="rounded-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">10-Digit Mobile Number</Label>
                        <Input
                          type="tel"
                          placeholder="e.g. 9876543210"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          maxLength={10}
                          className="rounded-lg font-mono"
                        />
                      </div>
                      <div className="space-y-1 pt-1">
                        <Label className="text-xs">How was your experience? (Optional)</Label>
                        <Textarea
                          value={guestExperienceFeedback}
                          onChange={(e) => setGuestExperienceFeedback(e.target.value)}
                          placeholder="Share a quick note"
                          className="rounded-lg min-h-20"
                          maxLength={500}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Participation Role Selection */}
                <div className="space-y-2 pt-1">
                  <Label className="text-sm font-bold text-foreground">
                    Participating Today As:
                  </Label>
                  <RadioGroup
                    value={selectedRole}
                    onValueChange={(val) => setSelectedRole(val as ParticipationRole)}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    {/* Listener Card */}
                    <label
                      htmlFor="role-listener"
                      className={`relative flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedRole === "listener"
                          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                          : "border-border bg-card hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                          <Headphones className="w-5 h-5 text-emerald-600" />
                          <span>Listener / Participant</span>
                        </div>
                        <RadioGroupItem value="listener" id="role-listener" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Joining, listening, and being part of the group
                      </p>
                      <div className="mt-3">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold text-xs">
                          +3 Credits
                        </Badge>
                      </div>
                    </label>

                    {/* Performer / Active Role Card */}
                    <label
                      htmlFor="role-performer"
                      className={`relative flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedRole !== "listener"
                          ? "border-amber-500 bg-amber-50/20 shadow-sm ring-1 ring-amber-500 dark:border-amber-600"
                          : "border-border bg-card hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                          <Star className="w-5 h-5 text-amber-500" />
                          <span>Active Performer</span>
                        </div>
                        <RadioGroupItem value="performer" id="role-performer" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Singing, reciting poem, reading, anchoring, or speaking
                      </p>
                      <div className="mt-3">
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 font-semibold text-xs">
                          +5 Credits
                        </Badge>
                      </div>
                    </label>
                  </RadioGroup>
                </div>

                {/* 3. Submit Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting || (!selectedMember && !guestName.trim())}
                    className="w-full py-6 text-base font-bold rounded-xl shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Recording Attendance...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Confirm Attendance ({ROLE_CREDITS[selectedRole]} Credits)
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-center pt-1">
                  <p className="text-xs text-muted-foreground">
                    Attendance records support Hosla & Shraddha community health, consistency recognition, and senior engagement.
                  </p>
                </div>

              </form>
            </CardContent>
          </Card>
        )}

        {/* Back Link */}
        <div className="text-center">
          <Link
            to="/daily-routine"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Daily Routine Schedule
          </Link>
        </div>

      </div>
    </div>
  );
}
