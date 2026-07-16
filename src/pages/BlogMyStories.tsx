import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PenLine, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted — awaiting review",
  under_review: "Under review",
  needs_changes: "Small edits needed",
  approved: "Approved — publishing soon",
  published: "Published",
  archived: "Archived",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-purple-100 text-purple-800",
  needs_changes: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  published: "bg-primary/20 text-primary",
  archived: "bg-slate-200 text-slate-700",
};

export default function BlogMyStories() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) { navigate("/auth?next=/blog/my-stories", { replace: true }); return; }
    const { data } = await supabase.from("blogs")
      .select("id, title, status, admin_notes, slug, updated_at, published_at")
      .eq("author_id", sess.session.user.id)
      .order("updated_at", { ascending: false });
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deleteBlog = async (id: string) => {
    if (!confirm("Delete this draft? This cannot be undone.")) return;
    const { error } = await supabase.from("blogs").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); load(); }
  };

  if (loading) return <Layout><div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="container max-w-3xl px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-serif text-3xl font-bold">My stories</h1>
          <Button asChild size="lg" className="h-12"><Link to="/blog/write"><PenLine className="mr-2 h-4 w-4" />Write new</Link></Button>
        </div>

        {rows.length === 0 ? (
          <Card><CardContent className="py-16 text-center">
            <p className="text-muted-foreground mb-4">You haven't written any stories yet.</p>
            <Button asChild size="lg" className="h-12"><Link to="/blog/write"><PenLine className="mr-2 h-4 w-4" />Start writing</Link></Button>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <Card key={r.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="font-serif text-lg font-semibold truncate">{r.title || "Untitled"}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={STATUS_COLOR[r.status] || ""}>{STATUS_LABEL[r.status] || r.status}</Badge>
                        <span className="text-xs text-muted-foreground">Updated {new Date(r.updated_at).toLocaleDateString()}</span>
                      </div>
                      {r.status === "needs_changes" && r.admin_notes && (
                        <p className="text-sm text-amber-800 mt-2 bg-amber-50 border border-amber-200 rounded p-2">{r.admin_notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {r.status === "published" ? (
                        <Button asChild variant="outline" className="h-10"><Link to={`/blog/${r.slug ?? r.id}`}>View</Link></Button>
                      ) : (
                        <Button asChild variant="outline" className="h-10"><Link to={`/blog/write?id=${r.id}`}>Edit</Link></Button>
                      )}
                      {["draft", "needs_changes"].includes(r.status) && (
                        <Button variant="ghost" size="icon" onClick={() => deleteBlog(r.id)} className="h-10 w-10"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
