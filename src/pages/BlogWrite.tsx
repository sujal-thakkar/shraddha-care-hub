import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2, Save, Send, ImagePlus, Wand2, Check, X, Bold, List,
  ArrowLeft, Sparkles, Lightbulb,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useImageUpload } from "@/hooks/use-image-upload";
import { useFontSize, FontSizeToggle } from "@/hooks/use-font-size";

interface Suggestion { original: string; suggestion: string; reason: string; }

const QUICK_PROMPTS = [
  { label: "A memory from my youth", seed: "One memory from my youth that still makes me smile is " },
  { label: "A person who shaped me", seed: "The person who shaped me most is " },
  { label: "A day I'll never forget", seed: "There's one day I'll never forget. It was " },
  { label: "What Hosla means to me", seed: "Being part of Hosla means " },
  { label: "Advice for younger people", seed: "If I could tell my younger self one thing, it would be " },
  { label: "Something I'm proud of", seed: "One thing I'm truly proud of is " },
];

const TIPS = [
  "Write like you're telling a friend. Simple words are best.",
  "Don't worry about spelling — you can fix it later with one tap.",
  "Pick one memory and describe what you saw, heard, or felt.",
  "You can save and come back anytime. Nothing is lost.",
];

// Word-level diff for a suggestion pair — highlights what changed.
function diffWords(a: string, b: string): { removed: string[]; added: string[] } {
  const A = a.split(/(\s+)/);
  const B = b.split(/(\s+)/);
  const setA = new Set(A);
  const setB = new Set(B);
  return {
    removed: A.filter((t) => t.trim() && !setB.has(t)),
    added: B.filter((t) => t.trim() && !setA.has(t)),
  };
}

function DiffLine({ original, suggestion, mode }: { original: string; suggestion: string; mode: "full" | "highlights" }) {
  const { removed, added } = diffWords(original, suggestion);
  const renderMarked = (text: string, marks: string[], variant: "removed" | "added") => {
    const cls = variant === "removed"
      ? "bg-destructive/15 text-destructive line-through decoration-2 px-1 rounded"
      : "bg-primary/15 text-primary font-semibold px-1 rounded";
    if (marks.length === 0) return <span>{text}</span>;
    const escaped = marks.map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const re = new RegExp(`(${escaped.join("|")})`, "g");
    const parts = text.split(re);
    return (
      <span>
        {parts.map((p, i) =>
          marks.includes(p) ? <mark key={i} className={cls}>{p}</mark> : <span key={i}>{p}</span>
        )}
      </span>
    );
  };

  if (mode === "highlights") {
    // Compact: show only the changed chunks, no unchanged prose.
    const noChanges = removed.length === 0 && added.length === 0;
    return (
      <div className="rounded-lg border border-border bg-muted/40 p-3">
        <div className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground mb-2">
          Changed only
        </div>
        {noChanges ? (
          <div className="text-sm text-muted-foreground italic">Only formatting or order changed — open full view to compare.</div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-relaxed">
            {removed.map((w, i) => (
              <mark key={`r-${i}`} className="bg-destructive/15 text-destructive line-through decoration-2 px-1 rounded">{w}</mark>
            ))}
            {removed.length > 0 && added.length > 0 && (
              <span className="text-muted-foreground">→</span>
            )}
            {added.map((w, i) => (
              <mark key={`a-${i}`} className="bg-primary/15 text-primary font-semibold px-1 rounded">{w}</mark>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-2 md:grid-cols-2">
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
        <div className="text-[11px] uppercase tracking-wide font-semibold text-destructive/80 mb-1">Before</div>
        <div className="text-sm leading-relaxed">{renderMarked(original, removed, "removed")}</div>
      </div>
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
        <div className="text-[11px] uppercase tracking-wide font-semibold text-primary/80 mb-1">After</div>
        <div className="text-sm leading-relaxed">{renderMarked(suggestion, added, "added")}</div>
      </div>
    </div>
  );
}

export default function BlogWrite() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editingId = params.get("id");
  const { toast } = useToast();
  const { upload, isUploading } = useImageUpload({ bucket: "project-posters", folder: "blogs", maxSizeMB: 1, maxWidthOrHeight: 1600 });
  const { size, setSize } = useFontSize();

  const [session, setSession] = useState<any>(null);
  const [blogId, setBlogId] = useState<string | null>(editingId);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [cover, setCover] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("draft");
  const [adminNotes, setAdminNotes] = useState<string | null>(null);
  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [diffMode, setDiffMode] = useState<"full" | "highlights">("full");
  const [submitting, setSubmitting] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [showTips, setShowTips] = useState<boolean>(() => localStorage.getItem("blog_tips_dismissed") !== "1");

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { navigate("/auth?next=/blog/write", { replace: true }); return; }
      setSession(data.session);
      if (editingId) {
        const { data: row } = await supabase.from("blogs").select("*").eq("id", editingId).maybeSingle();
        if (row && row.author_id === data.session.user.id) {
          setBlogId(row.id);
          setTitle(row.title || "");
          setBody(row.body || "");
          setCover(row.cover_image_url);
          setStatus(row.status);
          setAdminNotes(row.admin_notes);
        }
      }
      setPageLoading(false);
    })();
  }, [editingId, navigate]);

  const saveDraft = useCallback(async (silent = false) => {
    if (!session?.user) return;
    if (!title.trim() && !body.trim()) return;
    if (!silent) setSavingState("saving");
    const payload = {
      author_id: session.user.id,
      title: title.trim() || "Untitled",
      body,
      cover_image_url: cover,
      status: status === "needs_changes" ? "needs_changes" : "draft",
    };
    try {
      if (blogId) {
        const { error } = await supabase.from("blogs").update(payload).eq("id", blogId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("blogs").insert(payload).select("id").single();
        if (error) throw error;
        setBlogId(data.id);
        window.history.replaceState(null, "", `/blog/write?id=${data.id}`);
      }
      setSavingState("saved");
      setLastSavedAt(Date.now());
    } catch (e: any) {
      console.error("save error", e);
      setSavingState("error");
      if (!silent) toast({ title: "Couldn't save", description: e.message, variant: "destructive" });
    }
  }, [session, title, body, cover, status, blogId, toast]);

  useEffect(() => {
    if (!session) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (!title.trim() && !body.trim()) return;
    setSavingState("saving");
    saveTimer.current = setTimeout(() => saveDraft(true), 5000);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [title, body, cover, session, saveDraft]);

  useEffect(() => {
    const handler = () => { if (document.visibilityState === "hidden") saveDraft(true); };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [saveDraft]);

  const insertToken = (before: string, after: string = "") => {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const sel = body.slice(start, end);
    const next = body.slice(0, start) + before + sel + after + body.slice(end);
    setBody(next);
    setTimeout(() => { el.focus(); el.selectionStart = start + before.length; el.selectionEnd = end + before.length; }, 0);
  };

  const applyPrompt = (seed: string) => {
    const nextBody = body.trim() ? `${body.replace(/\s+$/, "")}\n\n${seed}` : seed;
    setBody(nextBody);
    setTimeout(() => {
      const el = bodyRef.current;
      if (!el) return;
      el.focus();
      el.selectionStart = el.selectionEnd = nextBody.length;
      el.scrollTop = el.scrollHeight;
    }, 50);
  };

  const dismissTips = () => {
    setShowTips(false);
    localStorage.setItem("blog_tips_dismissed", "1");
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file);
    if (url) setCover(url);
    e.target.value = "";
  };

  const runAiCheck = async () => {
    if (!body.trim()) { toast({ title: "Nothing to check yet", description: "Write something first." }); return; }
    setChecking(true);
    setSuggestions([]);
    const { data, error } = await supabase.functions.invoke("check-blog-writing", { body: { text: body } });
    setChecking(false);
    if (error) {
      const message = (error as any)?.context?.body ? await (error as any).context.text().catch(() => "") : error.message;
      toast({ title: "AI check failed", description: message || "Please try again.", variant: "destructive" });
      return;
    }
    if (data?.error) { toast({ title: "AI check failed", description: data.error, variant: "destructive" }); return; }
    setSuggestions(data?.suggestions ?? []);
    if ((data?.suggestions ?? []).length === 0) {
      toast({ title: "Your writing looks great!", description: "No suggestions." });
    }
  };

  const acceptSuggestion = (idx: number) => {
    const s = suggestions[idx];
    setBody((prev) => prev.replace(s.original, s.suggestion));
    setSuggestions((prev) => prev.filter((_, i) => i !== idx));
  };
  const acceptAll = () => {
    let updated = body;
    suggestions.forEach((s) => { updated = updated.replace(s.original, s.suggestion); });
    setBody(updated);
    setSuggestions([]);
  };
  const rejectSuggestion = (idx: number) => setSuggestions((prev) => prev.filter((_, i) => i !== idx));

  const submitStory = async () => {
    if (!title.trim() || !body.trim()) {
      toast({ title: "Add a title and story", description: "Please fill in both before submitting.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    await saveDraft(true);
    if (!blogId) { setSubmitting(false); return; }
    const { error } = await supabase.from("blogs").update({ status: "submitted", admin_notes: null }).eq("id", blogId);
    setSubmitting(false);
    if (error) toast({ title: "Submit failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Story submitted!", description: "We'll review it shortly and let you know." });
      navigate("/blog/my-stories");
    }
  };

  if (pageLoading) {
    return <Layout><div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  const ready = title.trim() && body.trim();
  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;

  return (
    <Layout>
      <div className="container max-w-3xl px-4 py-6 md:py-10">
        <div className="flex items-center justify-between mb-4">
          <Link to="/blog/my-stories" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> My stories
          </Link>
          <div className="flex items-center gap-2">
            <FontSizeToggle size={size} onChange={setSize} />
          </div>
        </div>

        <h1 className="font-serif text-2xl md:text-3xl font-bold mb-2">Tell your story</h1>
        <p className="text-muted-foreground mb-6">Write in whichever language feels natural. We'll take care of the rest.</p>

        {/* Guided walkthrough: tips + quick prompts */}
        {showTips && (
          <Card className="mb-4 border-primary/30 bg-primary/5">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 font-semibold text-primary">
                  <Lightbulb className="h-5 w-5" />
                  Not sure where to start? Try one of these.
                </div>
                <button
                  type="button"
                  onClick={dismissTips}
                  aria-label="Hide tips"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPrompt(p.seed)}
                    className="text-sm rounded-full border border-primary/40 bg-background hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-2 min-h-[44px]"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <ul className="mt-4 space-y-1.5 text-sm text-foreground/80">
                {TIPS.map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        {!showTips && (
          <button
            type="button"
            onClick={() => setShowTips(true)}
            className="mb-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <Lightbulb className="h-4 w-4" /> Show writing tips & prompts
          </button>
        )}

        {status === "needs_changes" && adminNotes && (
          <Card className="mb-6 border-amber-400 bg-amber-50">
            <CardContent className="pt-6">
              <div className="text-sm font-semibold text-amber-900 mb-1">Small edits needed</div>
              <p className="text-sm text-amber-800">{adminNotes}</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="h-14 text-xl font-serif"
            style={{ fontSize: `${Math.max(size, 20)}px` }}
          />

          <div className="flex flex-wrap gap-2 items-center border border-border rounded-lg p-2 bg-card">
            <Button type="button" variant="ghost" size="sm" onClick={() => insertToken("**", "**")} className="h-11" aria-label="Bold"><Bold className="h-4 w-4 mr-1" />Bold</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => insertToken("\n- ")} className="h-11" aria-label="Bullet"><List className="h-4 w-4 mr-1" />Bullet</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => insertToken("\n\n")} className="h-11" aria-label="Paragraph">¶ Paragraph</Button>
            <div className="ml-auto flex items-center gap-3 text-sm text-muted-foreground">
              <span>{wordCount} words</span>
              {savingState === "saving" && <span className="inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Saving…</span>}
              {savingState === "saved" && <span>Saved{lastSavedAt ? ` · ${Math.max(1, Math.round((Date.now() - lastSavedAt) / 1000))}s ago` : ""}</span>}
              {savingState === "error" && <span className="text-destructive">Save failed</span>}
            </div>
          </div>

          <textarea
            ref={bodyRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your story here…"
            className="w-full min-h-[400px] rounded-lg border border-border bg-background p-4 leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary"
            style={{ fontSize: `${size}px`, lineHeight: 1.7 }}
          />

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={() => document.getElementById("cover-upload")?.click()} className="h-12" disabled={isUploading}>
              <ImagePlus className="mr-2 h-4 w-4" />
              {cover ? "Change cover photo" : "Add cover photo"}
            </Button>
            <input id="cover-upload" type="file" accept="image/*" hidden onChange={handleCoverUpload} />
            <Button type="button" variant="secondary" onClick={runAiCheck} disabled={checking} className="h-12">
              {checking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
              Check my writing
            </Button>
          </div>

          {cover && (
            <div className="rounded-lg overflow-hidden border border-border">
              <img src={cover} alt="Cover" className="w-full max-h-64 object-cover" />
            </div>
          )}

          {suggestions.length > 0 && (
            <Card className="border-primary/40">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-semibold">
                        {suggestions.length} suggestion{suggestions.length === 1 ? "" : "s"} to review
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Your original words stay unless you accept a change. Compare before and after below.
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center flex-wrap">
                    <div className="inline-flex rounded-md border border-border overflow-hidden" role="tablist" aria-label="Diff view mode">
                      <button
                        type="button"
                        onClick={() => setDiffMode("full")}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${diffMode === "full" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                        aria-pressed={diffMode === "full"}
                      >
                        Full compare
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiffMode("highlights")}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${diffMode === "highlights" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                        aria-pressed={diffMode === "highlights"}
                      >
                        Changes only
                      </button>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setSuggestions([])}>Reject all</Button>
                    <Button size="sm" onClick={acceptAll}>Accept all</Button>
                  </div>
                </div>
                <ul className="space-y-5">
                  {suggestions.map((s, idx) => (
                    <li key={idx} className="border-b border-border pb-5 last:border-0">
                      <DiffLine original={s.original} suggestion={s.suggestion} mode={diffMode} />
                      {s.reason && (
                        <div className="mt-2 text-xs text-muted-foreground italic">
                          Why: {s.reason}
                        </div>
                      )}
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" onClick={() => acceptSuggestion(idx)} className="h-10 min-w-[110px]">
                          <Check className="h-4 w-4 mr-1" /> Use this
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => rejectSuggestion(idx)} className="h-10">
                          <X className="h-4 w-4 mr-1" /> Keep mine
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-4">
                <div>Title {title.trim() ? "✓" : "·"}</div>
                <div>Story {body.trim() ? "✓" : "·"}</div>
                <div>Cover photo (optional) {cover ? "✓" : "·"}</div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => saveDraft()} disabled={savingState === "saving"} className="h-12">
                  <Save className="mr-2 h-4 w-4" /> Save draft
                </Button>
                <Button onClick={submitStory} disabled={!ready || submitting} className="h-12">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Submit for publishing
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
