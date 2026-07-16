import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Download, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Newsletter { id: string; title: string; issue_number: number | null; status: string; created_at: string; }
interface BlogRow { id: string; title: string; author_id: string; published_at: string | null; }

function SortableItem({ id, title, onRemove }: { id: string; title: string; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 border border-border rounded p-2 bg-card">
      <button {...attributes} {...listeners} className="cursor-grab touch-none"><GripVertical className="h-4 w-4 text-muted-foreground" /></button>
      <div className="flex-1 truncate">{title}</div>
      <Button variant="ghost" size="icon" onClick={onRemove}><Trash2 className="h-4 w-4" /></Button>
    </div>
  );
}

export default function AdminNewsletters() {
  const { toast } = useToast();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [items, setItems] = useState<Array<{ blog_id: string; position: number; title: string }>>([]);
  const [available, setAvailable] = useState<BlogRow[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newIssue, setNewIssue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const load = async () => {
    setLoading(true);
    const [{ data: nl }, { data: blogs }] = await Promise.all([
      supabase.from("newsletters").select("*").order("created_at", { ascending: false }),
      supabase.from("blogs").select("id, title, author_id, published_at").eq("status", "published").order("published_at", { ascending: false }),
    ]);
    setNewsletters((nl ?? []) as Newsletter[]);
    setAvailable((blogs ?? []) as BlogRow[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const loadItems = async (id: string) => {
    const { data } = await supabase
      .from("newsletter_blogs")
      .select("blog_id, position, blogs(title)")
      .eq("newsletter_id", id)
      .order("position", { ascending: true });
    setItems((data ?? []).map((r: any) => ({ blog_id: r.blog_id, position: r.position, title: r.blogs?.title || "Untitled" })));
  };

  const selectNewsletter = async (id: string) => {
    setSelectedId(id);
    await loadItems(id);
  };

  const createNewsletter = async () => {
    if (!newTitle.trim()) return;
    const { data, error } = await supabase.from("newsletters").insert({
      title: newTitle.trim(),
      issue_number: newIssue ? parseInt(newIssue) : null,
    }).select("*").single();
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    setNewTitle(""); setNewIssue("");
    await load();
    if (data) selectNewsletter(data.id);
  };

  const addBlog = async (blogId: string) => {
    if (!selectedId) return;
    if (items.some((i) => i.blog_id === blogId)) return;
    const newPos = items.length;
    const { error } = await supabase.from("newsletter_blogs").insert({ newsletter_id: selectedId, blog_id: blogId, position: newPos });
    if (error) { toast({ title: "Add failed", description: error.message, variant: "destructive" }); return; }
    loadItems(selectedId);
  };

  const removeBlog = async (blogId: string) => {
    if (!selectedId) return;
    await supabase.from("newsletter_blogs").delete().eq("newsletter_id", selectedId).eq("blog_id", blogId);
    loadItems(selectedId);
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id || !selectedId) return;
    const oldIndex = items.findIndex((i) => i.blog_id === active.id);
    const newIndex = items.findIndex((i) => i.blog_id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex).map((it, idx) => ({ ...it, position: idx }));
    setItems(reordered);
    setSaving(true);
    await Promise.all(reordered.map((it) =>
      supabase.from("newsletter_blogs").update({ position: it.position }).eq("newsletter_id", selectedId).eq("blog_id", it.blog_id)
    ));
    setSaving(false);
  };

  const deleteNewsletter = async (id: string) => {
    if (!confirm("Delete this newsletter? Blog rows are not deleted.")) return;
    await supabase.from("newsletters").delete().eq("id", id);
    if (selectedId === id) setSelectedId(null);
    load();
  };

  const exportDocx = async () => {
    if (!selectedId) return;
    setExporting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectRef}.supabase.co/functions/v1/generate-newsletter-docx`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ newsletterId: selectedId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `newsletter-${selectedId}.docx`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast({ title: "Downloaded", description: "Open the file in Word or Google Docs to review." });
    } catch (e: any) {
      toast({ title: "Export failed", description: e.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const selected = newsletters.find((n) => n.id === selectedId);
  const usedIds = new Set(items.map((i) => i.blog_id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Newsletters</h1>
        <p className="text-muted-foreground">Bundle published stories and export a formatted DOCX.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Create newsletter</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Input placeholder="Title (e.g. Hosla Voices)" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="flex-1 min-w-[200px]" />
          <Input placeholder="Issue #" value={newIssue} onChange={(e) => setNewIssue(e.target.value)} type="number" className="w-32" />
          <Button onClick={createNewsletter}><Plus className="h-4 w-4 mr-1" />Create</Button>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle>All newsletters</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {newsletters.length === 0 ? <p className="text-sm text-muted-foreground">None yet.</p> : newsletters.map((n) => (
              <div key={n.id} className={`flex items-center justify-between gap-2 p-2 rounded border ${selectedId === n.id ? "border-primary bg-primary/5" : "border-border"}`}>
                <button className="flex-1 text-left truncate" onClick={() => selectNewsletter(n.id)}>
                  <div className="font-medium truncate">{n.title}</div>
                  <div className="text-xs text-muted-foreground">{n.issue_number ? `Issue ${n.issue_number}` : "No issue"}</div>
                </button>
                <Button size="icon" variant="ghost" onClick={() => deleteNewsletter(n.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle>{selected ? selected.title : "Select a newsletter"}</CardTitle>
              {selected && (
                <Button onClick={exportDocx} disabled={exporting || items.length === 0}>
                  {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}Export DOCX
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selected ? <p className="text-muted-foreground">Pick a newsletter on the left, or create one.</p> : (
              <div className="space-y-6">
                <div>
                  <Label className="mb-2 block">Included stories {saving && <Loader2 className="h-3 w-3 animate-spin inline ml-2" />}</Label>
                  {items.length === 0 ? <p className="text-sm text-muted-foreground">No stories yet.</p> : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={items.map((i) => i.blog_id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                          {items.map((it) => <SortableItem key={it.blog_id} id={it.blog_id} title={it.title} onRemove={() => removeBlog(it.blog_id)} />)}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
                <div>
                  <Label className="mb-2 block">Add published stories</Label>
                  <div className="space-y-2 max-h-64 overflow-y-auto border border-border rounded p-2">
                    {available.filter((b) => !usedIds.has(b.id)).map((b) => (
                      <button key={b.id} onClick={() => addBlog(b.id)} className="w-full text-left p-2 rounded hover:bg-accent flex items-center justify-between gap-2">
                        <span className="truncate">{b.title}</span>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                    {available.filter((b) => !usedIds.has(b.id)).length === 0 && <p className="text-sm text-muted-foreground p-2">All published stories are already in this newsletter.</p>}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
