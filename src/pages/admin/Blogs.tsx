import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, MessageSquareWarning, Archive, EyeOff, Send, Trash2, ImagePlus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RenderMarkdownLite } from "@/lib/markdown-lite";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useImageUpload } from "@/hooks/use-image-upload";


// Drafts are private to each writer — admins only see stories once submitted for review.
const STATUSES = ["submitted", "under_review", "needs_changes", "approved", "published", "archived"] as const;

export default function AdminBlogs() {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [authors, setAuthors] = useState<Record<string, { name: string; email: string }>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("submitted");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editCover, setEditCover] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const { upload: uploadCover, isUploading: coverUploading, progress: coverProgress } = useImageUpload({
    bucket: "project-posters",
    folder: "blogs",
    maxSizeMB: 1,
    maxWidthOrHeight: 1600,
  });


  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("blogs").select("*").neq("status", "draft").order("updated_at", { ascending: false }).limit(200);
    setRows(data ?? []);
    const ids = Array.from(new Set((data ?? []).map((r: any) => r.author_id)));
    if (ids.length) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", ids);
      const map: Record<string, { name: string; email: string }> = {};
      (profiles ?? []).forEach((p: any) => { map[p.user_id] = { name: p.full_name || "Anonymous", email: p.email }; });
      setAuthors(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) => r.status === filter), [rows, filter]);

  const openRow = (row: any) => {
    if (expanded === row.id) { setExpanded(null); return; }
    setExpanded(row.id);
    setEditTitle(row.title || "");
    setEditBody(row.body || "");
    setEditCover(row.cover_image_url || null);
    setNotes(row.admin_notes || "");
  };

  const saveEdits = async (row: any) => {
    setBusy(true);
    const { error } = await supabase.from("blogs").update({ title: editTitle, body: editBody, cover_image_url: editCover }).eq("id", row.id);
    setBusy(false);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Saved" }); load(); }
  };

  const handleCoverFile = async (file: File) => {
    const url = await uploadCover(file);
    if (url) setEditCover(url);
  };


  const runAction = async (row: any, action: string, notesOverride?: string) => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("publish-blog", { body: { blogId: row.id, action, adminNotes: notesOverride ?? notes } });
    setBusy(false);
    if (error || data?.error) {
      toast({ title: "Failed", description: (error as any)?.message || data?.error, variant: "destructive" });
    } else {
      toast({ title: "Done" });
      setExpanded(null);
      load();
    }
  };

  const deleteBlog = async (row: any) => {
    if (!confirm(`Permanently delete "${row.title || "Untitled"}"? This removes it from the database and cannot be undone.`)) return;
    setBusy(true);
    const { error } = await supabase.from("blogs").delete().eq("id", row.id);
    setBusy(false);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); setExpanded(null); load(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold">Story moderation</h1>
          <p className="text-muted-foreground">Review, edit, and publish community stories.</p>
        </div>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="flex-wrap h-auto">
          {STATUSES.map((s) => {
            const count = rows.filter((r) => r.status === s).length;
            return <TabsTrigger key={s} value={s} className="capitalize">{s.replace("_", " ")} ({count})</TabsTrigger>;
          })}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No stories in this state.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => (
            <Card key={row.id}>
              <CardHeader className="cursor-pointer" onClick={() => openRow(row)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg truncate">{row.title || "Untitled"}</CardTitle>
                    <div className="text-xs text-muted-foreground mt-1">
                      By {authors[row.author_id]?.name || "Unknown"} · Updated {new Date(row.updated_at).toLocaleString()}
                      {row.language && <> · {row.language.toUpperCase()}</>}
                    </div>
                  </div>
                  <Badge variant="outline">{row.status}</Badge>
                </div>
              </CardHeader>
              {expanded === row.id && (
                <CardContent className="space-y-4 border-t">
                  <div>
                    <Label>Cover image</Label>
                    <div className="mt-2 space-y-2">
                      {editCover ? (
                        <div className="relative">
                          <img src={editCover} alt="cover" className="w-full max-h-64 object-cover rounded border" />
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="absolute top-2 right-2 h-8 w-8"
                            onClick={() => setEditCover(null)}
                            disabled={coverUploading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-border rounded p-6 text-center text-sm text-muted-foreground">
                          No cover image
                        </div>
                      )}
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverFile(f); e.currentTarget.value = ""; }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => coverInputRef.current?.click()}
                        disabled={coverUploading}
                      >
                        {coverUploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading {coverProgress}%</> : <><ImagePlus className="h-4 w-4 mr-2" />{editCover ? "Replace cover" : "Add cover"}</>}
                      </Button>
                      <p className="text-xs text-muted-foreground">Click "Save edits" below to apply the new cover.</p>
                    </div>
                  </div>

                  <div>
                    <Label>Title</Label>
                    <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                  </div>
                  <div>
                    <Label>Body (markdown-lite)</Label>
                    <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} className="min-h-[300px] font-mono text-sm" />
                  </div>
                  <div>
                    <Label>Preview</Label>
                    <div className="border border-border rounded p-4 bg-background max-h-64 overflow-auto">
                      <RenderMarkdownLite text={editBody} />
                    </div>
                  </div>
                  <div>
                    <Label>Note to author (used with "Request changes")</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Could you add a bit more about the day at the temple?" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => saveEdits(row)} disabled={busy}>Save edits</Button>
                    <Button onClick={() => runAction(row, "publish")} disabled={busy}><Send className="h-4 w-4 mr-1" />Publish</Button>
                    <Button variant="outline" onClick={() => runAction(row, "approve")} disabled={busy}><CheckCircle2 className="h-4 w-4 mr-1" />Approve</Button>
                    <Button variant="outline" onClick={() => runAction(row, "request_changes")} disabled={busy || !notes.trim()}><MessageSquareWarning className="h-4 w-4 mr-1" />Request changes</Button>
                    {row.status === "published" && <Button variant="outline" onClick={() => runAction(row, "unpublish")} disabled={busy}><EyeOff className="h-4 w-4 mr-1" />Unpublish</Button>}
                    <Button variant="ghost" onClick={() => runAction(row, "archive")} disabled={busy}><Archive className="h-4 w-4 mr-1" />Archive</Button>
                    <Button variant="destructive" onClick={() => deleteBlog(row)} disabled={busy} className="ml-auto"><Trash2 className="h-4 w-4 mr-1" />Delete permanently</Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
