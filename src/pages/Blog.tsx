import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PenLine, Search, Loader2 } from "lucide-react";
import { useDocumentTitle } from "@/hooks/use-document-title";

interface BlogRow {
  id: string;
  title: string;
  slug: string | null;
  cover_image_url: string | null;
  language: string | null;
  published_at: string | null;
  body: string;
  author_id: string;
}

export default function Blog() {
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [authors, setAuthors] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [lang, setLang] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("blogs")
        .select("id, title, slug, cover_image_url, language, published_at, body, author_id")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(60);
      const rows = (data ?? []) as BlogRow[];
      setBlogs(rows);
      const ids = Array.from(new Set(rows.map((r) => r.author_id)));
      if (ids.length) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", ids);
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

  return (
    <Layout>
      <Helmet>
        <title>Stories from our community — Shraddha</title>
        <meta name="description" content="Read stories, memories, and reflections shared by our elderly community." />
      </Helmet>

      <section className="container max-w-6xl px-4 py-12 md:py-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground">Stories</h1>
            <p className="text-muted-foreground mt-2 text-lg">Voices, memories and reflections from our community.</p>
          </div>
          <Button asChild size="lg" className="h-12">
            <Link to={session ? "/blog/write" : "/auth?next=/blog/write"}>
              <PenLine className="mr-2 h-5 w-5" />
              Write your story
            </Link>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search stories" className="pl-10 h-12" />
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
            <p className="text-lg">No stories yet. Be the first to share yours!</p>
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
                      {b.body.replace(/\*\*/g, "").slice(0, 180)}
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
