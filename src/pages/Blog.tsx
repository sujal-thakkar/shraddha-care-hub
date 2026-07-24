import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PenLine, Search, Loader2, UserPlus, User as UserIcon, Clock, UserCircle, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { stripKindMarker } from "@/lib/markdown-lite";
import { coverImageOrDefault } from "@/lib/blog-cover";
import { useI18n } from "@/i18n";
import { inferCategory, CATEGORY_META, type BlogCategory } from "@/lib/blog-category";


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

type SortMode = "recommended" | "popular" | "newest" | "oldest";
const PAGE_SIZE = 12;

export default function Blog() {
  const { t, lang: uiLang } = useI18n();
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [authors, setAuthors] = useState<Record<string, string>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [q, setQ] = useState("");
  const [lang, setLang] = useState<string>("all");
  const [category, setCategory] = useState<"all" | BlogCategory>("all");
  const [sort, setSort] = useState<SortMode>("recommended");
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [page, setPage] = useState(1);

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
        .select("id, title, slug, cover_image_url, language, published_at, body, author_id, sort_order, is_guest, guest_name")
        .eq("status", "published")
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("published_at", { ascending: false });
      const rows = (data ?? []) as BlogRow[];
      setBlogs(rows);

      const ids = Array.from(new Set(rows.filter((r) => !r.is_guest && r.author_id).map((r) => r.author_id)));
      if (ids.length) {
        const { data: profiles } = await supabase.rpc("get_authors_public", { _user_ids: ids });
        const map: Record<string, string> = {};
        (profiles ?? []).forEach((p: any) => { map[p.user_id] = p.full_name || "Anonymous"; });
        setAuthors(map);
      }

      // Popularity = like counts. Aggregate client-side from blog_likes.
      const blogIds = rows.map((r) => r.id);
      if (blogIds.length) {
        const { data: likes } = await supabase
          .from("blog_likes")
          .select("blog_id")
          .in("blog_id", blogIds);
        const counts: Record<string, number> = {};
        (likes ?? []).forEach((l: any) => { counts[l.blog_id] = (counts[l.blog_id] || 0) + 1; });
        setLikeCounts(counts);
      }

      setLoading(false);
    })();
  }, []);

  // Per-blog inferred category (memoized).
  const blogCategories = useMemo(() => {
    const m: Record<string, BlogCategory> = {};
    blogs.forEach((b) => { m[b.id] = inferCategory(b.title, b.body); });
    return m;
  }, [blogs]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = blogs.filter((b) => {
      if (lang !== "all" && b.language !== lang) return false;
      if (category !== "all" && blogCategories[b.id] !== category) return false;
      if (!needle) return true;
      const authorName = b.is_guest ? (b.guest_name || "") : (authors[b.author_id] || "");
      return (
        b.title.toLowerCase().includes(needle) ||
        b.body.toLowerCase().includes(needle) ||
        authorName.toLowerCase().includes(needle)
      );
    });

    if (sort === "popular") {
      list = [...list].sort((a, b) => (likeCounts[b.id] || 0) - (likeCounts[a.id] || 0));
    } else if (sort === "newest") {
      list = [...list].sort((a, b) => new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime());
    } else if (sort === "oldest") {
      list = [...list].sort((a, b) => new Date(a.published_at || 0).getTime() - new Date(b.published_at || 0).getTime());
    }
    // "recommended" keeps server order (sort_order → published_at desc)
    return list;
  }, [blogs, lang, q, category, sort, blogCategories, authors, likeCounts]);

  const languages = Array.from(new Set(blogs.map((b) => b.language).filter(Boolean))) as string[];

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [q, lang, category, sort]);

  useEffect(() => {
    if (currentPage > 1) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  useEffect(() => {
    document.title = "Blogs from our community — Shraddha";
  }, []);

  // Windowed page numbers: show up to 5 pages, centered on current
  const pageNumbers = useMemo<(number | "…")[]>(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const nums: (number | "…")[] = [1];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    if (start > 2) nums.push("…");
    for (let i = start; i <= end; i++) nums.push(i);
    if (end < totalPages - 1) nums.push("…");
    nums.push(totalPages);
    return nums;
  }, [totalPages, currentPage]);

  return (
    <Layout>

      <section className="container max-w-6xl px-4 py-12 md:py-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground">{t("Blogs")}</h1>
            <p className="text-muted-foreground mt-2 text-lg">{t("Stories, poems, recitations & reflections from our community.")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!session ? (
              <>
                <Button asChild size="lg" className="h-12">
                  <Link to="/auth?next=/blog/write">
                    <UserPlus className="mr-2 h-5 w-5" />
                    {t("Become a writer")}
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12">
                  <Link to="/blog/write-guest">
                    <UserCircle className="mr-2 h-5 w-5" />
                    {t("Write as guest")}
                  </Link>
                </Button>
              </>
            ) : profileStatus === "approved" ? (
              <>
                <Button asChild size="lg" className="h-12">
                  <Link to="/blog/write">
                    <PenLine className="mr-2 h-5 w-5" />
                    {t("Write a blog")}
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12">
                  <Link to="/profile">
                    <UserIcon className="mr-2 h-5 w-5" />
                    {t("My profile")}
                  </Link>
                </Button>
              </>
            ) : profileStatus === "rejected" ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 text-destructive px-4 py-2 text-sm">
                  {t("Your writer application was declined. Contact an admin for details.")}
                </div>
                <Button asChild size="lg" variant="outline" className="h-12">
                  <Link to="/blog/write-guest"><UserCircle className="mr-2 h-5 w-5" />{t("Write as guest instead")}</Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 text-amber-800 px-4 py-2 text-sm">
                  <Clock className="h-4 w-4" />
                  {t("Writer application pending admin approval.")}
                </div>
                <Button asChild size="lg" variant="outline" className="h-12">
                  <Link to="/blog/write-guest"><UserCircle className="mr-2 h-5 w-5" />{t("Write as guest meanwhile")}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search blogs")} className="pl-10 h-12" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant={lang === "all" ? "default" : "outline"} onClick={() => setLang("all")} className="h-12">{t("All")}</Button>
            {languages.map((l) => (
              <Button key={l} variant={lang === l ? "default" : "outline"} onClick={() => setLang(l)} className="h-12">{l.toUpperCase()}</Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">{t("No blogs yet. Be the first to share yours!")}</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paged.map((b) => (
                <Link to={`/blog/${b.slug ?? b.id}`} key={b.id}>
                  <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden">
                    <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                      <img src={coverImageOrDefault(b.cover_image_url)} alt={b.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <CardHeader>
                      <CardTitle className="font-serif line-clamp-2">{b.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {stripKindMarker(b.body).replace(/\*\*/g, "").slice(0, 180)}
                      </p>
                      <div className="mt-4 text-xs text-muted-foreground">
                        {t("By")} {b.is_guest ? `${b.guest_name || t("Anonymous")} (${t("Guest Blogger")})` : (authors[b.author_id] || t("Anonymous"))}
                        {b.published_at && <> · {new Date(b.published_at).toLocaleDateString()}</>}
                        {b.language && <> · {b.language.toUpperCase()}</>}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <nav aria-label="Blog pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="outline"
                  className="h-11"
                  disabled={currentPage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label={t("Previous")}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t("Previous")}
                </Button>
                <div className="flex items-center gap-1">
                  {pageNumbers.map((n, i) =>
                    n === "…" ? (
                      <span key={`e-${i}`} className="px-2 text-muted-foreground" aria-hidden>…</span>
                    ) : (
                      <Button
                        key={n}
                        variant={n === currentPage ? "default" : "outline"}
                        className="h-11 min-w-11 px-3"
                        onClick={() => setPage(n)}
                        aria-current={n === currentPage ? "page" : undefined}
                        aria-label={`Page ${n}`}
                      >
                        {n}
                      </Button>
                    ),
                  )}
                </div>
                <Button
                  variant="outline"
                  className="h-11"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label={t("Next")}
                >
                  {t("Next")}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
                <div className="w-full text-center text-xs text-muted-foreground mt-2">
                  {t("Page {n} of {t}", { n: currentPage, t: totalPages })}
                </div>
              </nav>
            )}
          </>
        )}
      </section>
    </Layout>
  );
}
