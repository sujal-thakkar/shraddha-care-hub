import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Save, Send, ImagePlus, Wand2, Check, X, Bold, List, ArrowLeft, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useImageUpload } from "@/hooks/use-image-upload";
import { useFontSize, FontSizeToggle } from "@/hooks/use-font-size";

interface Suggestion { original: string; suggestion: string; reason: string; }

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
  const [submitting, setSubmitting] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auth check
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate("/auth?next=/blog/write", { replace: true });
        return;
      }
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

  // Autosave: debounced
  useEffect(() => {
    if (!session) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (!title.trim() && !body.trim()) return;
    setSavingState("saving");
    saveTimer.current = setTimeout(() => saveDraft(true), 5000);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [title, body, cover, session, saveDraft]);

  // Save on visibility change / beforeunload
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

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file);
    if (url) setCover(url);
    e.target.value = "";
  };

  const runAiCheck = async () => {
    if (!body.trim()) {
      toast({ title: "Nothing to check yet", description: "Write something first." });
      return;
    }
    setChecking(true);
    setSuggestions([]);
    const { data, error } = await supabase.functions.invoke("check-blog-writing", { body: { text: body } });
    setChecking(false);
    if (error) {
      const message = (error as any)?.context?.body ? await (error as any).context.text().catch(() => "") : error.message;
      toast({ title: "AI check failed", description: message || "Please try again.", variant: "destructive" });
      return;
    }
    if (data?.error) {
      toast({ title: "AI check failed", description: data.error, variant: "destructive" });
      return;
    }
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
    if (error) {
      toast({ title: "Submit failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Story submitted!", description: "We'll review it shortly and let you know." });
      navigate("/blog/my-stories");
    }
  };

  if (pageLoading) {
    return <Layout><div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  const ready = title.trim() && body.trim();

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
            <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
              {savingState === "saving" && <><Loader2 className="h-3 w-3 animate-spin" /> Saving…</>}
              {savingState === "saved" && <>Saved{lastSavedAt ? ` · ${Math.max(1, Math.round((Date.now() - lastSavedAt) / 1000))}s ago` : ""}</>}
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
            <Button type="button" variant="outline" disabled title="Coming soon" className="h-12">
              <Mic className="mr-2 h-4 w-4" /> Speak instead (coming soon)
            </Button>
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
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold">We found {suggestions.length} suggestion{suggestions.length === 1 ? "" : "s"}</div>
                  <Button size="sm" onClick={acceptAll}>Accept all</Button>
                </div>
                <ul className="space-y-3">
                  {suggestions.map((s, idx) => (
                    <li key={idx} className="border-b border-border pb-3 last:border-0">
                      <div className="text-sm">
                        <span className="line-through text-destructive/80">{s.original}</span>
                        {" → "}
                        <span className="text-primary font-medium">{s.suggestion}</span>
                      </div>
                      {s.reason && <div className="text-xs text-muted-foreground mt-1">{s.reason}</div>}
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline" onClick={() => acceptSuggestion(idx)} className="h-9"><Check className="h-3 w-3 mr-1" />Accept</Button>
                        <Button size="sm" variant="ghost" onClick={() => rejectSuggestion(idx)} className="h-9"><X className="h-3 w-3 mr-1" />Ignore</Button>
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
