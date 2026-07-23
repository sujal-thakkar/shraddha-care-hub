import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PenLine, Search, Loader2, UserPlus, User as UserIcon, Clock, UserCircle } from "lucide-react";
import { stripKindMarker } from "@/lib/markdown-lite";


interface BlogRow {
  id: string;
  title: string;
  slug: string | null;
  cover_image_url: string | null;
  language: string | null;
  published_at: string | null;
  body: string;
  author_id: string;
  is_guest?: boolean | null;
  guest_name?: string | null;
}

export default function Blog() {
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [authors, setAuthors] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [lang, setLang] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);

  useEffect(() => {
    const loadStatus = async (uid: string | undefined) => {
      if (!uid) { setProfileStatus(null); return; }
      const { data } = await supabase.from("profiles").select("status").eq("user_id", uid).maybeSingle();
      setProfileStatus((data as any)?.status ?? null);
    };
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      loadStatus(data.session?.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      loadStatus(s?.user.id);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("blogs")
        .select("id, title, slug, cover_image_url, language, published_at, body, author_id, sort_order")
        .eq("status", "published")
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("published_at", { ascending: false })
        .limit(60);
      const rows = (data ?? []) as BlogRow[];
      setBlogs(rows);
      const ids = Array.from(new Set(rows.map((r) => r.author_id)));
      if (ids.length) {
        const { data: profiles } = await supabase.rpc("get_authors_public", { _user_ids: ids });
        const map: Record<string, string> = {};
        (profiles ?? []).forEach((p: any) => { map[p.user_id] = p.full_name || "Anonymous"; });
        setAuthors(map);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = blogs.filter((b) => {
    if (lang !== "all" && b.language !== lang) return false;
    if (!q) return true;
    const needle = q.toLowerCase();
    return b.title.toLowerCase().includes(needle) || b.body.toLowerCase().includes(needle);
  });

  const languages = Array.from(new Set(blogs.map((b) => b.language).filter(Boolean))) as string[];

  useEffect(() => {
    document.title = "Blogs from our community — Shraddha";
  }, []);

  return (
    <Layout>

      <section className="container max-w-6xl px-4 py-12 md:py-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground">Blogs</h1>
            <p className="text-muted-foreground mt-2 text-lg">Stories, poems, recitations & reflections from our community.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!session ? (
              <>
                <Button asChild size="lg" className="h-12">
                  <Link to="/auth?next=/blog/write">
                    <UserPlus className="mr-2 h-5 w-5" />
                    Become a writer
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12">
                  <Link to="/blog/write-guest">
                    <UserCircle className="mr-2 h-5 w-5" />
                    Write as guest
                  </Link>
                </Button>
              </>
            ) : profileStatus === "approved" ? (
              <>
                <Button asChild size="lg" className="h-12">
                  <Link to="/blog/write">
                    <PenLine className="mr-2 h-5 w-5" />
                    Write a blog
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12">
                  <Link to="/profile">
                    <UserIcon className="mr-2 h-5 w-5" />
                    My profile
                  </Link>
                </Button>
              </>
            ) : profileStatus === "rejected" ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 text-destructive px-4 py-2 text-sm">
                  Your writer application was declined. Contact an admin for details.
                </div>
                <Button asChild size="lg" variant="outline" className="h-12">
                  <Link to="/blog/write-guest"><UserCircle className="mr-2 h-5 w-5" />Write as guest instead</Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 text-amber-800 px-4 py-2 text-sm">
                  <Clock className="h-4 w-4" />
                  Writer application pending admin approval.
                </div>
                <Button asChild size="lg" variant="outline" className="h-12">
                  <Link to="/blog/write-guest"><UserCircle className="mr-2 h-5 w-5" />Write as guest meanwhile</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search blogs" className="pl-10 h-12" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant={lang === "all" ? "default" : "outline"} onClick={() => setLang("all")} className="h-12">All</Button>
            {languages.map((l) => (
              <Button key={l} variant={lang === l ? "default" : "outline"} onClick={() => setLang(l)} className="h-12">{l.toUpperCase()}</Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No blogs yet. Be the first to share yours!</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((b) => (
              <Link to={`/blog/${b.slug ?? b.id}`} key={b.id}>
                <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden">
                  {b.cover_image_url && (
                    <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                      <img src={b.cover_image_url} alt={b.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="font-serif line-clamp-2">{b.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {stripKindMarker(b.body).replace(/\*\*/g, "").slice(0, 180)}
                    </p>
                    <div className="mt-4 text-xs text-muted-foreground">
                      By {authors[b.author_id] || "Anonymous"}
                      {b.published_at && <> · {new Date(b.published_at).toLocaleDateString()}</>}
                      {b.language && <> · {b.language.toUpperCase()}</>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
