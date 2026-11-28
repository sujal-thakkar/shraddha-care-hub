import { CalendarDays, Clock, Link2, ListMusic } from "lucide-react";
import type { Lang } from "@/i18n";
import { cn } from "@/lib/utils";
import { STUDY_CIRCLE_POSTERS } from "@/components/studycircle/posters";
import {
  displayTime,
  formatSessionDate,
  getPerformerNames,
  ITEM_TYPE_LABELS,
  programLabel,
  PROGRAMS,
  type StudyCircleBundle,
  type ItemType,
} from "@/lib/studycircle";

const ITEM_BADGE: Record<ItemType, string> = {
  song: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
  reading: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  prayer: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200",
  other: "bg-muted text-muted-foreground",
};

interface SessionViewerProps {
  bundle: StudyCircleBundle;
  lang?: Lang;
}

/** Public read-only rendering of a study circle session (roles + numbered parts). */
export function SessionViewer({ bundle, lang = "en" }: SessionViewerProps) {
  const { session, roles, parts } = bundle;
  const accent = PROGRAMS[session.program_type]?.accent;

  const namedRoles = roles.filter((r) => r.performers.length > 0 || r.role_name);
  const visibleParts = [...parts].sort(
    (a, b) => (a.part_number ?? 0) - (b.part_number ?? 0) || a.display_order - b.display_order,
  );

  return (
    <div className="space-y-6">
      {/* Session card */}
      <div
        className={cn(
          "sc-card sc-poster-card sc-divine-vignette relative isolate overflow-hidden rounded-2xl border p-5 shadow-sm transition-opacity lg:p-6",
          session.status === "cancelled" ? "opacity-70 grayscale" : "",
          accent?.border,
          accent?.bg,
        )}
      >
        <img
          src={STUDY_CIRCLE_POSTERS[session.program_type]}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="sc-poster-image pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-center"
        />
        <div className="sc-poster-wash pointer-events-none absolute inset-0 z-[1]" aria-hidden="true" />
        <div className="relative z-10 mb-2 flex flex-wrap items-center gap-2">
          <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold", accent?.chipBg, accent?.chipText)}>
            {programLabel(session.program_type, lang)}
          </span>
          {session.status === "cancelled" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800 dark:bg-red-900/40 dark:text-red-200">
              {lang === "bn" ? "বাতিল" : "Cancelled"}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <CalendarDays className="h-4 w-4" />
            {formatSessionDate(session.scheduled_date, lang)}
          </span>
          {session.start_time && (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Clock className="h-4 w-4" />
              {displayTime(session.start_time)}
            </span>
          )}
        </div>

        <h2 className="relative z-10 text-xl font-bold text-foreground lg:text-2xl">{session.title_bn}</h2>
        {session.title_en && <p className="relative z-10 text-sm text-muted-foreground">{session.title_en}</p>}

        {session.note && (
          <div className="relative z-10 mt-4 whitespace-pre-wrap rounded-xl border border-amber-300/70 bg-amber-50/80 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
            {session.note}
          </div>
        )}

        {session.meeting_link && (
          <a
            href={session.meeting_link}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 dark:bg-amber-600 dark:hover:bg-amber-500"
          >
            <Link2 className="h-4 w-4" />
            {lang === "bn" ? "যোগ দিন" : "Join Session"}
          </a>
        )}
      </div>

      {/* Roles */}
      {namedRoles.length > 0 && (
        <div className="sc-divine-vignette overflow-hidden rounded-2xl border border-amber-200/70 bg-card dark:border-amber-900/50">
          <div className="border-b border-amber-200/70 bg-amber-50/70 px-5 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
            <h3 className="font-serif font-semibold text-amber-900 dark:text-amber-100">{lang === "bn" ? "দায়িত্ব" : "Roles"}</h3>
          </div>
          <div className="divide-y divide-amber-100 dark:divide-amber-900/40">
            {namedRoles.map((r) => (
              <div key={r.id ?? r.role_name} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-5 py-3">
                <div className="sm:w-56 shrink-0 font-medium text-foreground">{r.role_name}</div>
                <div className="text-sm text-muted-foreground">{getPerformerNames(r.performers)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parts */}
      {visibleParts.length > 0 && (
        <div className="sc-divine-vignette overflow-hidden rounded-2xl border border-amber-200/70 bg-card dark:border-amber-900/50">
          <div className="flex items-center gap-2 border-b border-amber-200/70 bg-amber-50/70 px-5 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
            <ListMusic className="h-4 w-4 text-amber-700 dark:text-amber-300" />
            <h3 className="font-serif font-semibold text-amber-900 dark:text-amber-100">{lang === "bn" ? "কর্মসূচি" : "Programme"}</h3>
          </div>
          <ol className="divide-y divide-amber-100 dark:divide-amber-900/40">
            {visibleParts.map((p, idx) => (
              <li key={p.id ?? idx} className="flex gap-4 px-5 py-4">
                <div className="w-7 shrink-0 pt-0.5 text-right font-bold text-muted-foreground">
                  {p.part_number != null ? p.part_number : "–"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", ITEM_BADGE[p.item_type])}>
                      {ITEM_TYPE_LABELS[p.item_type]?.[lang === "bn" ? "bn" : "en"] ?? p.item_type}
                    </span>
                    {p.performers.length > 0 && (
                      <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">{getPerformerNames(p.performers)}</span>
                    )}
                  </div>
                  {p.description && (
                    <p className="whitespace-pre-wrap text-sm text-foreground">{p.description}</p>
                  )}
                  {p.description_en && (
                    <p className="whitespace-pre-wrap text-xs text-muted-foreground">{p.description_en}</p>
                  )}
                  {p.reference_link && (
                    <a
                      href={p.reference_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex min-h-11 items-center gap-1 text-xs text-amber-800 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 dark:text-amber-200"
                    >
                      <Link2 className="h-3 w-3" /> {lang === "bn" ? "রেফারেন্স" : "Reference"}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {namedRoles.length === 0 && visibleParts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          {lang === "bn" ? "এখনও কোনো বিবরণ যোগ করা হয়নি।" : "No details added yet."}
        </div>
      )}
    </div>
  );
}

export default SessionViewer;
