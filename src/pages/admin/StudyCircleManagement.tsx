import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { MemberSearchCombobox, type MemberSelection } from "@/components/admin/MemberSearchCombobox";
import { StudyCircleDatePicker } from "@/components/studycircle/StudyCircleDatePicker";
import {
  ArrowLeft, CalendarDays, CheckCircle2, ClipboardCopy, GripVertical, Loader2, Plus, Trash2, AlertTriangle, Pencil, X,
} from "lucide-react";
import {
  DEFAULT_ROLES, ITEM_TYPE_LABELS, PROGRAMS, PROGRAM_ORDER, buildSavePayload, fetchBundle, findUnassigned,
  generateWhatsAppMessage, listAllSessions, listRoutineSessions, deleteSession, saveSession, syncAttendance,
  parseSessionDateInput,
  type ItemType, type ProgramType, type StudyCircleBundle, type StudyCirclePart, type StudyCirclePerformer,
  type StudyCircleRole, type StudyCircleSession,
} from "@/lib/studycircle";

// ---------------------------------------------------------------------------
// Local editor shapes (add a stable client key for React lists)
// ---------------------------------------------------------------------------

type EPerformer = StudyCirclePerformer & { uid: string };
type ERole = Omit<StudyCircleRole, "performers"> & { uid: string; performers: EPerformer[] };
type EPart = Omit<StudyCirclePart, "performers"> & { uid: string; performers: EPerformer[] };

interface Draft {
  session: StudyCircleSession;
  roles: ERole[];
  parts: EPart[];
}

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const emptySession = (program: ProgramType, date: string, title: string): StudyCircleSession => ({
  id: "",
  program_type: program,
  scheduled_date: date,
  start_time: PROGRAMS[program].defaultTime,
  status: "scheduled",
  title_bn: title,
  title_en: null,
  note: null,
  note_en: null,
  meeting_link: null,
  is_published: false,
  published_at: null,
  routine_session_id: null,
  created_at: "",
  updated_at: "",
});

function bundleToDraft(b: StudyCircleBundle): Draft {
  // Renumber parts on load so the serial column always reflects display order,
  // even for sessions created before auto-serialization existed.
  const orderedParts = [...b.parts]
    .sort((a, c) => a.display_order - c.display_order)
    .map((p, i) => ({ ...p, part_number: i + 1, display_order: i }));
  return {
    session: b.session,
    roles: b.roles.map((r) => ({ ...r, uid: uid(), performers: r.performers.map((p) => ({ ...p, uid: uid() })) })),
    parts: orderedParts.map((p) => ({ ...p, uid: uid(), performers: p.performers.map((pp) => ({ ...pp, uid: uid() })) })),
  };
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  lapsed: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  due: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
};

// ---------------------------------------------------------------------------
// Sortable part row
// ---------------------------------------------------------------------------

function SortablePartRow({
  part, onChange, onRemove,
}: {
  part: EPart;
  onChange: (p: EPart) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: part.uid });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const addPerformer = (sel: MemberSelection) => {
    if (!sel.displayName) return;
    onChange({
      ...part,
      performers: [...part.performers, { uid: uid(), member_id: sel.memberId, display_name: sel.displayName, display_order: part.performers.length }],
    });
  };
  const removePerformer = (id: string) =>
    onChange({ ...part, performers: part.performers.filter((p) => p.uid !== id) });

  return (
    <div ref={setNodeRef} style={style} className={cn("rounded-xl border border-border bg-background p-3", isDragging && "opacity-60 shadow-lg")}>
      <div className="flex flex-wrap items-start gap-2">
        <button
          type="button"
          className="mt-2 cursor-grab touch-none text-muted-foreground hover:text-foreground"
          aria-label="Reorder part"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="flex w-12 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-sm font-bold text-foreground">
          {part.part_number ?? "–"}
        </div>

        <Select value={part.item_type} onValueChange={(v) => onChange({ ...part, item_type: v as ItemType })}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(ITEM_TYPE_LABELS) as ItemType[]).map((t) => (
              <SelectItem key={t} value={t}>{ITEM_TYPE_LABELS[t].en}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1 min-w-[12rem]">
          <Textarea
            value={part.description}
            onChange={(e) => onChange({ ...part, description: e.target.value })}
            placeholder="Description (Bengali)…"
            rows={1}
            className="min-h-[2.5rem] resize-y"
          />
        </div>

        <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 pl-6">
        {part.performers.map((p) => (
          <span key={p.uid} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 pl-2.5 pr-1 py-1 text-sm">
            <span className="font-medium">{p.display_name}</span>
            <button type="button" onClick={() => removePerformer(p.uid)} className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <div className="w-52">
          <MemberSearchCombobox
            value={{ memberId: null, guestName: null }}
            onChange={addPerformer}
            placeholder="Add performer…"
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Session editor
// ---------------------------------------------------------------------------

function SessionEditor({ sessionId, onBack }: { sessionId: string; onBack: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showValidation, setShowValidation] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const hydratedRef = useRef(false);
  const skipDebounceRef = useRef(false);

  const { data: routineOptions = [] } = useQuery({
    queryKey: ["sc-routine-options"],
    staleTime: 5 * 60 * 1000,
    queryFn: listRoutineSessions,
  });

  const { data: bundle, isLoading } = useQuery({
    queryKey: ["sc-admin-bundle", sessionId],
    queryFn: () => fetchBundle(sessionId),
  });

  useEffect(() => {
    if (bundle && !hydratedRef.current) {
      hydratedRef.current = true;
      setDraft(bundleToDraft(bundle));
    }
  }, [bundle]);

  const saveMutation = useMutation({
    mutationFn: (d: Draft) => saveSession(buildSavePayload(d.session, d.roles, d.parts)),
    onSuccess: (res) => {
      if (!res.success) {
        setSaveState("error");
        toast({ title: "Save failed", description: res.message ?? "Unknown error", variant: "destructive" });
        return;
      }
      setSaveState("saved");
    },
    onError: (e: any) => {
      setSaveState("error");
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    },
  });

  const saveRef = useRef(saveMutation);
  saveRef.current = saveMutation;

  // Debounced (2s) auto-save on every change.
  useEffect(() => {
    if (!draft || !hydratedRef.current) return;
    if (skipDebounceRef.current) {
      skipDebounceRef.current = false;
      return;
    }
    setSaveState("saving");
    const t = window.setTimeout(() => saveRef.current.mutate(draft), 2000);
    return () => window.clearTimeout(t);
  }, [draft]);

  const saveNow = useCallback(
    (d: Draft) => {
      skipDebounceRef.current = true;
      setDraft(d);
      setSaveState("saving");
      saveMutation.mutate(d);
    },
    [saveMutation],
  );

  const updateSession = (patch: Partial<StudyCircleSession>) =>
    setDraft((d) => (d ? { ...d, session: { ...d.session, ...patch } } : d));

  const renumberParts = (parts: EPart[]): EPart[] =>
    parts.map((p, i) => ({ ...p, part_number: i + 1, display_order: i }));

  const handleStatusChange = (next: "scheduled" | "cancelled") => {
    if (next === "cancelled") {
      setConfirmCancel(true);
    } else {
      updateSession({ status: "scheduled" });
    }
  };

  const applyCancel = () => {
    updateSession({ status: "cancelled" });
    setConfirmCancel(false);
    toast({ title: "Session cancelled", description: "Attendance will be cleared on save." });
  };

  const addRole = () =>
    setDraft((d) =>
      d ? { ...d, roles: [...d.roles, { uid: uid(), role_name: "New Role", role_name_en: null, display_order: d.roles.length, performers: [] }] } : d,
    );
  const updateRole = (ruid: string, patch: Partial<ERole>) =>
    setDraft((d) => (d ? { ...d, roles: d.roles.map((r) => (r.uid === ruid ? { ...r, ...patch } : r)) } : d));
  const removeRole = (ruid: string) =>
    setDraft((d) => (d ? { ...d, roles: d.roles.filter((r) => r.uid !== ruid) } : d));

  const addPart = () =>
    setDraft((d) => {
      if (!d) return d;
      const next = d.parts.length + 1;
      return {
        ...d,
        parts: [
          ...d.parts,
          { uid: uid(), part_number: next, item_type: "other", description: "", description_en: null, reference_link: null, display_order: d.parts.length, performers: [] },
        ],
      };
    });
  const updatePart = (puid: string, next: EPart) =>
    setDraft((d) => (d ? { ...d, parts: d.parts.map((p) => (p.uid === puid ? next : p)) } : d));
  const removePart = (puid: string) =>
    setDraft((d) => (d ? { ...d, parts: renumberParts(d.parts.filter((p) => p.uid !== puid)) } : d));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setDraft((d) => {
      if (!d) return d;
      const oldIndex = d.parts.findIndex((p) => p.uid === active.id);
      const newIndex = d.parts.findIndex((p) => p.uid === over.id);
      if (oldIndex < 0 || newIndex < 0) return d;
      return { ...d, parts: renumberParts(arrayMove(d.parts, oldIndex, newIndex)) };
    });
  };

  const doPublish = () => {
    if (!draft) return;
    saveNow({ ...draft, session: { ...draft.session, is_published: true } });
    toast({ title: "Published", description: "Session is now live and attendance has been synced." });
  };
  const doUnpublish = () => {
    if (!draft) return;
    saveNow({ ...draft, session: { ...draft.session, is_published: false } });
  };

  const requestPublish = () => {
    if (!draft) return;
    const unassigned = findUnassigned(draft.roles, draft.parts);
    if (unassigned.roles.length === 0 && unassigned.parts.length === 0) doPublish();
    else setShowValidation(true);
  };

  const handleDelete = async () => {
    try {
      await deleteSession(sessionId);
      qc.invalidateQueries({ queryKey: ["sc-admin-sessions"] });
      toast({ title: "Deleted", description: "Session removed." });
      onBack();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
  };

  const handleCopyWhatsApp = async () => {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(generateWhatsAppMessage(draft as unknown as StudyCircleBundle, "bn"));
      toast({ title: "Copied", description: "WhatsApp message copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const handleManualSync = async () => {
    try {
      const res = await syncAttendance(sessionId);
      const sync = res.sync ?? (res as any);
      toast({ title: "Attendance synced", description: `${sync.marked ?? 0} marked · ${sync.credited ?? 0} credited.` });
    } catch (e: any) {
      toast({ title: "Sync failed", description: e.message, variant: "destructive" });
    }
  };

  if (isLoading || !draft) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const programCfg = PROGRAMS[draft.session.program_type];
  const unassigned = findUnassigned(draft.roles, draft.parts);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <div>
              <h1 className={cn("text-xl font-bold", programCfg.accent.text)}>
                {programCfg.label} · {formatDate(draft.session.scheduled_date)}
              </h1>
              <SaveIndicator state={saveState} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {draft.session.is_published ? (
              <Badge className="gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" /> Published
              </Badge>
            ) : (
              <Badge variant="secondary">Draft</Badge>
            )}
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopyWhatsApp}>
              <ClipboardCopy className="h-4 w-4" /> Copy WhatsApp
            </Button>
            {draft.session.is_published ? (
              <>
                <Button variant="outline" size="sm" onClick={handleManualSync}>Re-sync attendance</Button>
                <Button variant="outline" size="sm" onClick={doUnpublish}>Unpublish</Button>
              </>
            ) : (
              <Button size="sm" onClick={requestPublish}>Publish</Button>
            )}
            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Section 1 — metadata */}
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <h2 className="font-semibold text-foreground">Session Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Program</Label>
              <Select
                value={draft.session.program_type}
                onValueChange={(v) => updateSession({ program_type: v as ProgramType })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROGRAM_ORDER.map((p) => (
                    <SelectItem key={p} value={p}>{PROGRAMS[p].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Scheduled date *</Label>
              <Input
                type="date"
                value={draft.session.scheduled_date}
                onChange={(e) => updateSession({ scheduled_date: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Title (Bengali) *</Label>
              <Input value={draft.session.title_bn} onChange={(e) => updateSession({ title_bn: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Title (English)</Label>
              <Input value={draft.session.title_en ?? ""} onChange={(e) => updateSession({ title_en: e.target.value || null })} />
            </div>
            <div className="space-y-2">
              <Label>Start time</Label>
              <Input
                type="time"
                value={(draft.session.start_time ?? "").slice(0, 5)}
                onChange={(e) => updateSession({ start_time: e.target.value || null })}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={draft.session.status} onValueChange={(v) => handleStatusChange(v as "scheduled" | "cancelled")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Note / Announcement</Label>
              <Textarea
                value={draft.session.note ?? ""}
                onChange={(e) => updateSession({ note: e.target.value || null })}
                rows={2}
                placeholder="e.g. ৪:৪৫ এর পরিবর্তে রাত ৯:৩০ থেকে হবে"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Meeting link</Label>
              <Input value={draft.session.meeting_link ?? ""} onChange={(e) => updateSession({ meeting_link: e.target.value || null })} placeholder="https://…" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Attendance routine</Label>
              <Select
                value={draft.session.routine_session_id ?? "auto"}
                onValueChange={(v) => updateSession({ routine_session_id: v === "auto" ? null : v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (by weekday)</SelectItem>
                  {routineOptions.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.title} · {DAY_SHORT[r.day_of_week] ?? ""} {r.start_time?.slice(0, 5)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Publishing marks these performers present in this routine's attendance record.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2 — roles */}
      <Card>
        <CardContent className="space-y-3 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Roles</h2>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={addRole}>
              <Plus className="h-4 w-4" /> Add role
            </Button>
          </div>
          {draft.roles.map((role) => (
            <div key={role.uid} className="rounded-xl border border-border bg-background p-3">
              <div className="flex items-center gap-2">
                <Input
                  value={role.role_name}
                  onChange={(e) => updateRole(role.uid, { role_name: e.target.value })}
                  className="max-w-xs font-medium"
                />
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeRole(role.uid)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 pl-1">
                {role.performers.map((p) => (
                  <span key={p.uid} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 pl-2.5 pr-1 py-1 text-sm">
                    <span className="font-medium">{p.display_name}</span>
                    <button
                      type="button"
                      onClick={() => updateRole(role.uid, { performers: role.performers.filter((x) => x.uid !== p.uid) })}
                      className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
                <div className="w-56">
                  <MemberSearchCombobox
                    value={{ memberId: null, guestName: null }}
                    placeholder="Search member…"
                    onChange={(sel) => {
                      if (!sel.displayName) return;
                      updateRole(role.uid, {
                        performers: [
                          ...role.performers,
                          { uid: uid(), member_id: sel.memberId, display_name: sel.displayName, display_order: role.performers.length },
                        ],
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Section 3 — parts */}
      <Card>
        <CardContent className="space-y-3 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Programme Parts</h2>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={addPart}>
              <Plus className="h-4 w-4" /> Add part
            </Button>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={draft.parts.map((p) => p.uid)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {draft.parts.map((part) => (
                  <SortablePartRow
                    key={part.uid}
                    part={part}
                    onChange={(next) => updatePart(part.uid, next)}
                    onRemove={() => removePart(part.uid)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {draft.parts.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">No parts yet. Click "Add part".</p>
          )}
        </CardContent>
      </Card>

      {/* Publish validation dialog */}
      <Dialog open={showValidation} onOpenChange={setShowValidation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Publish with gaps?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <p className="text-muted-foreground">The following items have no performer assigned:</p>
            {unassigned.roles.length > 0 && (
              <div>
                <p className="font-medium text-foreground">Roles</p>
                <ul className="list-disc pl-5 text-muted-foreground">
                  {unassigned.roles.map((r) => <li key={r.uid}>{r.role_name}</li>)}
                </ul>
              </div>
            )}
            {unassigned.parts.length > 0 && (
              <div>
                <p className="font-medium text-foreground">Parts</p>
                <ul className="list-disc pl-5 text-muted-foreground">
                  {unassigned.parts.map((p) => <li key={p.uid}>{p.description || "(untitled part)"}</li>)}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowValidation(false)}>Keep editing</Button>
            <Button onClick={() => { setShowValidation(false); doPublish(); }}>Publish anyway</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this session?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the session, its roles/parts and any auto-synced attendance. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" /> Cancel this session?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This marks the session as cancelled. It will appear with a "Cancelled" badge on the public page, and any
              auto-synced attendance for this session will be cleared. This can be undone by switching the status back to Scheduled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep scheduled</AlertDialogCancel>
            <AlertDialogAction onClick={applyCancel} className="bg-red-600 text-white hover:bg-red-700">
              Yes, cancel session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SaveIndicator({ state }: { state: "idle" | "saving" | "saved" | "error" }) {
  if (state === "saving") return <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Saving…</span>;
  if (state === "saved") return <span className="flex items-center gap-1.5 text-xs text-emerald-600"><CheckCircle2 className="h-3 w-3" /> Saved</span>;
  if (state === "error") return <span className="flex items-center gap-1.5 text-xs text-destructive"><AlertTriangle className="h-3 w-3" /> Save failed</span>;
  return <span className="text-xs text-muted-foreground">All changes auto-save</span>;
}

const DAY_SHORT: Record<number, string> = { 0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat" };

function formatDate(d: string): string {
  if (!d) return "";
  const dt = new Date(`${d}T00:00:00`);
  return Number.isNaN(dt.getTime()) ? d : new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(dt);
}

// ---------------------------------------------------------------------------
// Session list + create
// ---------------------------------------------------------------------------

function ProgramColumn({ program, onEdit }: { program: ProgramType; onEdit: (id: string) => void }) {
  const cfg = PROGRAMS[program];
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["sc-admin-sessions", program],
    queryFn: () => listAllSessions(program),
  });

  return (
    <Card className={cn("border-2", cfg.accent.border)}>
      <CardContent className="p-4 sm:p-5">
        <div className={cn("mb-3 rounded-lg px-3 py-2 font-semibold", cfg.accent.bg, cfg.accent.text)}>
          {cfg.label} <span className="text-xs opacity-70">({program === "kathamrita" ? "Tue" : "Thu"})</span>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : sessions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No session yet.</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatDate(s.scheduled_date)}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{s.title_bn || "—"}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {s.is_published ? (
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">Published</Badge>
                  ) : (
                    <Badge variant="secondary">Draft</Badge>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => onEdit(s.id)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function StudyCircleManagement() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ program: "kathamrita" as ProgramType, date: "", title_bn: "" });
  const parsedFormDate = parseSessionDateInput(form.date);

  const createMutation = useMutation({
    mutationFn: async () => {
      const scheduledDate = parseSessionDateInput(form.date);
      if (!scheduledDate) throw new Error("Enter a valid date in DD/MM/YYYY format.");
      const base = emptySession(form.program, scheduledDate, form.title_bn.trim());
      const roles: StudyCircleRole[] = DEFAULT_ROLES.map((r, i) => ({
        role_name: r.role_name, role_name_en: r.role_name_en, display_order: i, performers: [],
      }));
      const res = await saveSession(buildSavePayload(base, roles, []));
      if (!res.success) throw new Error(res.message ?? "Could not create session");
      return res.session_id!;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["sc-admin-sessions"] });
      setCreateOpen(false);
      setForm({ program: "kathamrita", date: "", title_bn: "" });
      setEditingId(id);
    },
    onError: (e: any) => toast({ title: "Could not create", description: e.message, variant: "destructive" }),
  });

  if (editingId) {
    return <SessionEditor sessionId={editingId} onBack={() => { setEditingId(null); qc.invalidateQueries({ queryKey: ["sc-admin-sessions"] }); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Study Circle</h1>
          <p className="text-muted-foreground">
            Create and publish the performer schedule. Publishing marks performers present and awards credits automatically.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Create Session
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <ProgramColumn program="kathamrita" onEdit={setEditingId} />
        <ProgramColumn program="pathochokro" onEdit={setEditingId} />
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Program *</Label>
              <Select value={form.program} onValueChange={(v) => setForm({ ...form, program: v as ProgramType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROGRAM_ORDER.map((p) => <SelectItem key={p} value={p}>{PROGRAMS[p].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-session-date">Scheduled date *</Label>
              <StudyCircleDatePicker
                id="create-session-date"
                value={form.date}
                onChange={(date) => setForm({ ...form, date })}
                invalid={Boolean(form.date && !parsedFormDate)}
                describedBy="create-session-date-help"
              />
              <p
                id="create-session-date-help"
                className={cn("text-xs", form.date && !parsedFormDate ? "text-destructive" : "text-muted-foreground")}
              >
                {form.date && !parsedFormDate ? "Enter a valid date as DD/MM/YYYY." : "Format: DD/MM/YYYY"}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Title (Bengali) *</Label>
              <Input
                value={form.title_bn}
                onChange={(e) => setForm({ ...form, title_bn: e.target.value })}
                placeholder="e.g. রামকৃষ্ণ কথামৃত"
                className="placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !parsedFormDate || !form.title_bn.trim()}
            >
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create & Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
