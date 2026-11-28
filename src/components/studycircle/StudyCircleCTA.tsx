import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Clock, Loader2, BookOpen } from "lucide-react";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import { STUDY_CIRCLE_POSTERS } from "@/components/studycircle/posters";
import {
  listPublishedSessions,
  PROGRAMS,
  formatSessionDate,
  formatSessionDayOfMonth,
  displayTime,
  todayISO,
  programLabel,
  type StudyCircleSession,
} from "@/lib/studycircle";

/** Compact single-card CTA on the Daily Routine page listing all upcoming
 *  study-circle sessions from both programs (replaces the old two-card layout
 *  that occupied too much vertical space on mobile). */
export function StudyCircleCTA() {
  const { lang } = useI18n();
  const today = todayISO();

  const kathamritaQ = useQuery({
    queryKey: ["sc-cta", "kathamrita"],
    staleTime: 5 * 60 * 1000,
    queryFn: () => listPublishedSessions("kathamrita", 20),
  });
  const pathochokroQ = useQuery({
    queryKey: ["sc-cta", "pathochokro"],
    staleTime: 5 * 60 * 1000,
    queryFn: () => listPublishedSessions("pathochokro", 20),
  });

  const upcoming = useMemo(
    () =>
      [...(kathamritaQ.data ?? []), ...(pathochokroQ.data ?? [])]
        .filter((s) => s.scheduled_date >= today)
        .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
        .slice(0, 4),
    [kathamritaQ.data, pathochokroQ.data, today],
  );

  const isLoading = kathamritaQ.isLoading || pathochokroQ.isLoading;

  return (
    <div className="sc-divine-vignette relative isolate overflow-hidden rounded-3xl border border-amber-200/70 bg-card/95 p-4 shadow-lg backdrop-blur dark:border-amber-900/50 sm:p-6">
      <div className="relative z-10 mb-4 flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-amber-700 dark:text-amber-300" />
        <h2 className="font-serif text-lg font-bold text-foreground sm:text-xl">
          {lang === "bn" ? "আসন্ন পাঠচক্র সেশন" : "Upcoming Study Circle Sessions"}
        </h2>
      </div>

      <div className="sc-poster-showcase relative z-10 mb-4 grid grid-cols-2 gap-3">
        {(["kathamrita", "pathochokro"] as const).map((program) => (
          <div
            key={program}
            className="sc-poster-tile relative overflow-hidden rounded-xl border border-amber-200/70 bg-amber-50/70 p-1.5 dark:border-amber-800/50 dark:bg-amber-950/20"
          >
            <img
              src={STUDY_CIRCLE_POSTERS[program]}
              alt={lang === "bn" ? `${PROGRAMS[program].labelBn} পাঠচক্রের পোস্টার` : `${PROGRAMS[program].label} study circle poster`}
              loading="lazy"
              decoding="async"
              className="h-auto max-h-28 w-full rounded-lg object-contain sm:max-h-36"
            />
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="relative z-10 flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> {lang === "bn" ? "লোড হচ্ছে…" : "Loading…"}
        </div>
      ) : upcoming.length === 0 ? (
        <p className="relative z-10 py-6 text-center text-sm text-muted-foreground">
          {lang === "bn" ? "এখনও কোনো সেশন নির্ধারিত হয়নি।" : "No sessions scheduled yet."}
        </p>
      ) : (
        <div className="relative z-10 space-y-2">
          {upcoming.map((s: StudyCircleSession) => {
            const cfg = PROGRAMS[s.program_type];
            const cancelled = s.status === "cancelled";
            return (
              <Link
                key={s.id}
                to={`/daily-routine/study-circle?session=${encodeURIComponent(s.id)}`}
                className={cn(
                  "sc-card sc-poster-card group relative isolate flex items-center gap-3 overflow-hidden rounded-2xl border border-amber-200/60 bg-background p-3 hover:border-amber-400/70 dark:border-amber-900/50 sm:p-4",
                  cancelled && "opacity-60",
                )}
              >
                <span className="sc-aura" aria-hidden="true" />
                <img
                  src={STUDY_CIRCLE_POSTERS[s.program_type]}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="sc-poster-image pointer-events-none absolute inset-0 z-[1] h-full w-full object-cover object-center"
                />
                <span className="sc-poster-wash pointer-events-none absolute inset-0 z-[2]" aria-hidden="true" />
                <div className={cn("relative z-10 flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg", cfg.accent.chipBg, cfg.accent.chipText)}>
                  <span className="text-[10px] font-bold uppercase leading-none">
                    {formatSessionDayOfMonth(s.scheduled_date, lang)}
                  </span>
                </div>
                <div className="relative z-10 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold", cfg.accent.chipBg, cfg.accent.chipText)}>
                      {programLabel(s.program_type, lang)}
                    </span>
                    <span className="truncate text-sm font-semibold text-foreground">{s.title_bn}</span>
                    {cancelled && (
                      <span className="shrink-0 rounded bg-red-100 px-1 py-0 text-[10px] font-bold text-red-700 dark:bg-red-900/40 dark:text-red-200">
                        {lang === "bn" ? "বাতিল" : "Cancelled"}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {formatSessionDate(s.scheduled_date, lang)}
                    </span>
                    {s.start_time && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {displayTime(s.start_time)}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="relative z-10 h-4 w-4 shrink-0 text-amber-700 transition-transform group-hover:translate-x-1 dark:text-amber-300" />
              </Link>
            );
          })}
        </div>
      )}

      <Link
        to="/daily-routine/study-circle"
        className="relative z-10 mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-amber-800 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 dark:text-amber-200"
      >
        {lang === "bn" ? "সব পাঠচক্র দেখুন" : "View all study circles"}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export default StudyCircleCTA;
