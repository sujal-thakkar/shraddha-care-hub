import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, CalendarDays, Clock, Check, Copy, ChevronRight, Sparkles } from "lucide-react";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import {
  fetchBundle,
  listPublishedSessions,
  todayISO,
  PROGRAMS,
  formatSessionDate,
  formatSessionDayOfMonth,
  displayTime,
  generateWhatsAppMessage,
  programLabel,
  type StudyCircleSession,
} from "@/lib/studycircle";
import { SessionViewer } from "@/components/studycircle/SessionViewer";
import { STUDY_CIRCLE_POSTERS } from "@/components/studycircle/posters";
import heroImg from "@/assets/study-circle-hero.png";

/** Decorative lotus ornament used as a subtle devotional divider. */
function LotusOrnament({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 32"
      fill="none"
      className={cn("h-5 w-10 text-amber-600/70 dark:text-amber-400/70", className)}
      aria-hidden="true"
    >
      <path d="M32 30 C 26 22, 18 22, 14 26 C 18 20, 22 16, 32 14 C 42 16, 46 20, 50 26 C 46 22, 38 22, 32 30 Z" fill="currentColor" opacity="0.85" />
      <path d="M32 26 C 29 22, 25 22, 23 25 C 25 21, 28 19, 32 18 C 36 19, 39 21, 41 25 C 39 22, 35 22, 32 26 Z" fill="currentColor" opacity="0.5" />
      <circle cx="32" cy="14" r="1.6" fill="currentColor" />
    </svg>
  );
}

/** Subtle devotional mandala ring used as a decorative overlay. */
function MandalaOverlay({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="0.8" opacity="0.35">
        <circle cx="100" cy="100" r="96" />
        <circle cx="100" cy="100" r="78" />
        <circle cx="100" cy="100" r="58" />
        <circle cx="100" cy="100" r="36" />
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={100 + Math.cos(angle) * 36}
              y1={100 + Math.sin(angle) * 36}
              x2={100 + Math.cos(angle) * 96}
              y2={100 + Math.sin(angle) * 96}
            />
          );
        })}
      </g>
    </svg>
  );
}

/** Lazily-loaded past session inside the archive accordion. */
function PastSession({ sessionId, lang }: { sessionId: string; lang: "en" | "bn" }) {
  const { data, isLoading } = useQuery({
    queryKey: ["sc-bundle", sessionId],
    staleTime: 5 * 60 * 1000,
    queryFn: () => fetchBundle(sessionId),
  });
  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
      </div>
    );
  }
  if (!data) return <p className="py-4 text-sm text-muted-foreground">—</p>;
  return (
    <div className="pt-2">
      <SessionViewer bundle={data} lang={lang} />
    </div>
  );
}

/** Devotional session card with an interactive aura glow. */
function SessionCard({
  session,
  active,
  onSelect,
  lang,
}: {
  session: StudyCircleSession;
  active: boolean;
  onSelect: () => void;
  lang: "en" | "bn";
}) {
  const cfg = PROGRAMS[session.program_type];
  const cancelled = session.status === "cancelled";
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "sc-card sc-poster-card group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border bg-card p-3 text-left sm:p-4",
        "border-amber-200/60 dark:border-amber-900/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2",
        active && "sc-card-active sc-poster-card-active",
        cancelled && "opacity-60 grayscale",
      )}
    >
      {/* Aura glow is animated only during interaction. */}
      <span className="sc-aura" aria-hidden="true" />

      <img
        src={STUDY_CIRCLE_POSTERS[session.program_type]}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="sc-poster-image pointer-events-none absolute inset-0 z-[1] h-full w-full object-cover object-center"
      />
      <span className="sc-poster-wash pointer-events-none absolute inset-0 z-[2]" aria-hidden="true" />

      {/* Subtle mandala watermark */}
      <MandalaOverlay className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 text-amber-600/10 dark:text-amber-400/10" />

      <div className="relative z-10 flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200/60 text-amber-800 shadow-inner dark:from-amber-900/50 dark:to-amber-950/40 dark:text-amber-200">
        <span className="text-[10px] font-bold uppercase leading-none">
          {formatSessionDayOfMonth(session.scheduled_date, lang)}
        </span>
      </div>

      <div className="relative z-10 min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-bold text-foreground">{session.title_bn}</span>
          {cancelled && (
            <Badge variant="secondary" className="h-4 shrink-0 bg-red-100 px-1 py-0 text-[10px] font-bold text-red-700 dark:bg-red-900/40 dark:text-red-200">
              {lang === "bn" ? "বাতিল" : "Cancelled"}
            </Badge>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {formatSessionDate(session.scheduled_date, lang)}
          </span>
          {session.start_time && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {displayTime(session.start_time)}
            </span>
          )}
        </div>
      </div>

      <ChevronRight
        className={cn(
          "relative z-10 h-4 w-4 shrink-0 text-amber-600 transition-transform duration-300",
          active && "rotate-90",
        )}
      />
    </button>
  );
}

export default function StudyCircle() {
  const { lang } = useI18n();
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const requestedSessionId = searchParams.get("session");

  const today = todayISO();

  const kathamritaQ = useQuery({
    queryKey: ["sc-published", "kathamrita"],
    staleTime: 5 * 60 * 1000,
    queryFn: () => listPublishedSessions("kathamrita", 30),
  });
  const pathochokroQ = useQuery({
    queryKey: ["sc-published", "pathochokro"],
    staleTime: 5 * 60 * 1000,
    queryFn: () => listPublishedSessions("pathochokro", 30),
  });

  const allSessions = useMemo(
    () => [...(kathamritaQ.data ?? []), ...(pathochokroQ.data ?? [])],
    [kathamritaQ.data, pathochokroQ.data],
  );

  const upcoming = useMemo(
    () =>
      allSessions
        .filter((s) => s.scheduled_date >= today)
        .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date)),
    [allSessions, today],
  );

  const past = useMemo(
    () =>
      allSessions
        .filter((s) => s.scheduled_date < today)
        .sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date))
        .slice(0, 8),
    [allSessions, today],
  );

  useEffect(() => {
    if (selectedId) return;
    const requestedSession = allSessions.find((session) => session.id === requestedSessionId);
    if (requestedSession) {
      setSelectedId(requestedSession.id);
      return;
    }
    const pool = upcoming.length > 0 ? upcoming : past;
    if (pool.length > 0) {
      const nonCancelled = pool.find((s) => s.status !== "cancelled");
      setSelectedId((nonCancelled ?? pool[0]).id);
    }
  }, [allSessions, upcoming, past, requestedSessionId, selectedId]);

  const { data: bundle, isLoading: bundleLoading } = useQuery({
    queryKey: ["sc-bundle", selectedId ?? "none"],
    enabled: Boolean(selectedId),
    staleTime: 5 * 60 * 1000,
    queryFn: () => fetchBundle(selectedId!),
  });

  const handleCopy = async () => {
    if (!bundle) return;
    const text = generateWhatsAppMessage(bundle, lang);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const isLoading = kathamritaQ.isLoading || pathochokroQ.isLoading;

  return (
    <Layout>
      {/* Hero with study-circle-hero.png as primary visual + devotional glow */}
      <section className="relative overflow-hidden py-12 lg:py-16">
        {/* Hero image background */}
        <img
          src={heroImg}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-20 dark:opacity-15"
        />
        {/* Devotional glow overlay */}
        <div className="sc-hero-glow absolute inset-0" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" aria-hidden="true" />

        {/* Subtle mandala ring decoration */}
        <MandalaOverlay className="pointer-events-none absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 text-amber-600/10 dark:text-amber-400/10" />

        <div className="container relative z-10 text-center">
          <ScrollReveal>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-50/80 px-4 py-1.5 text-sm font-medium text-amber-800 dark:border-amber-700/40 dark:bg-amber-950/40 dark:text-amber-200">
              <Sparkles className="h-4 w-4" />
              Hosla Study Circle
            </span>
            <h1 className="sc-title-shimmer mx-auto max-w-full break-words px-3 py-1 font-serif text-[clamp(1.75rem,5.5vw,3.5rem)] font-bold leading-[1.5]">
              {lang === "bn" ? "পাঠচক্র সূচী" : "Study Circle Schedule"}
            </h1>
            <div className="sc-ornament mt-5">
              <LotusOrnament />
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-6 lg:py-10">
        <div className="container max-w-4xl">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
            </div>
          ) : upcoming.length === 0 && past.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-amber-300/60 bg-card p-12 text-center">
              <CalendarDays className="mx-auto mb-4 h-12 w-12 text-amber-600/50" />
              <p className="text-muted-foreground">
                {lang === "bn" ? "এখনও কোনো সেশন প্রকাশিত হয়নি।" : "No session published yet."}
              </p>
            </div>
          ) : (
            <>
              {/* Unified upcoming-sessions devotional card list */}
              <div className="relative mb-6 overflow-hidden rounded-3xl border border-amber-200/60 bg-card/80 p-4 shadow-lg backdrop-blur dark:border-amber-900/40 sm:p-5">
                <MandalaOverlay className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 text-amber-600/10 dark:text-amber-400/10" />
                <div className="relative z-10 mb-4 flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 font-serif text-base font-bold text-amber-800 dark:text-amber-200 sm:text-lg">
                    <BookOpen className="h-4 w-4" />
                    {lang === "bn" ? "আসন্ন পাঠচক্র সেশন দেখুন" : "View Upcoming Study Circle Session"}
                  </h2>
                  {bundle && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="gap-1.5 border-amber-300/60 text-amber-800 hover:bg-amber-50 focus-visible:ring-amber-600 dark:border-amber-700/40 dark:text-amber-200 dark:hover:bg-amber-950/40"
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      <span className="hidden sm:inline">{copied ? (lang === "bn" ? "কপি হয়েছে" : "Copied") : lang === "bn" ? "শেয়ার" : "Share"}</span>
                    </Button>
                  )}
                </div>

                {upcoming.length > 0 ? (
                  <div className="relative z-10 space-y-2.5">
                    {upcoming.map((s) => (
                      <SessionCard
                        key={s.id}
                        session={s}
                        active={s.id === selectedId}
                        onSelect={() => setSelectedId(s.id)}
                        lang={lang}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="relative z-10 py-3 text-center text-sm text-muted-foreground">
                    {lang === "bn" ? "এখনও কোনো আসন্ন সেশন নেই।" : "No upcoming sessions scheduled."}
                  </p>
                )}
              </div>

              {/* Selected session details */}
              {bundleLoading || !bundle ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
                </div>
              ) : (
                <SessionViewer bundle={bundle} lang={lang} />
              )}

              {/* Past sessions archive */}
              {past.length > 0 && (
                <div className="mt-10">
                  <div className="sc-ornament mb-4">
                    <h2 className="font-serif text-lg font-bold text-amber-800 dark:text-amber-200">
                      {lang === "bn" ? "আগের সেশনসমূহ" : "Past Sessions"}
                    </h2>
                  </div>
                  <Accordion type="single" collapsible className="rounded-2xl border border-amber-200/60 bg-card/80 px-4 backdrop-blur dark:border-amber-900/40">
                    {past.map((s: StudyCircleSession) => (
                      <AccordionItem key={s.id} value={s.id}>
                        <AccordionTrigger className="sc-poster-card relative isolate overflow-hidden rounded-lg px-3 text-left [&>svg]:relative [&>svg]:z-10">
                          <img
                            src={STUDY_CIRCLE_POSTERS[s.program_type]}
                            alt=""
                            aria-hidden="true"
                            loading="lazy"
                            decoding="async"
                            className="sc-poster-image pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-center"
                          />
                          <span className="sc-poster-wash pointer-events-none absolute inset-0 z-[1]" aria-hidden="true" />
                          <span className="relative z-10 flex flex-col items-start gap-0.5">
                            <span className="flex items-center gap-2">
                              <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", PROGRAMS[s.program_type].accent.chipBg, PROGRAMS[s.program_type].accent.chipText)}>
                                {programLabel(s.program_type, lang)}
                              </span>
                              <span className="font-medium text-foreground">{s.title_bn}</span>
                              {s.status === "cancelled" && (
                                <Badge variant="secondary" className="h-4 bg-red-100 px-1 py-0 text-[10px] font-bold text-red-700 dark:bg-red-900/40 dark:text-red-200">
                                  {lang === "bn" ? "বাতিল" : "Cancelled"}
                                </Badge>
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">{formatSessionDate(s.scheduled_date, lang)}</span>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <PastSession sessionId={s.id} lang={lang} />
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
