import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Volume2, Pause, Play, ArrowLeft } from "lucide-react";
import { RenderMarkdownLite } from "@/lib/markdown-lite";
import { useFontSize, FontSizeToggle } from "@/hooks/use-font-size";
import { useToast } from "@/hooks/use-toast";
import { SocialShare } from "@/components/events/SocialShare";
import { blogPreviewUrl } from "@/lib/preview";

interface BlogRow {
  id: string;
  title: string;
  slug: string | null;
  body: string;
  cover_image_url: string | null;
  language: string | null;
  published_at: string | null;
  author_id: string;
}

export default function BlogRead() {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<BlogRow | null>(null);
  const [authorName, setAuthorName] = useState("Anonymous");
  const [loading, setLoading] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { size, setSize } = useFontSize();
  const { toast } = useToast();

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      // Try by slug, then by id
      let query = supabase.from("blogs").select("*").eq("status", "published");
      const bySlug = await query.eq("slug", slug).maybeSingle();
      let row = bySlug.data;
      if (!row) {
        const byId = await supabase.from("blogs").select("*").eq("status", "published").eq("id", slug).maybeSingle();
        row = byId.data;
      }
      if (row) {
        setBlog(row as BlogRow);
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", (row as any).author_id).maybeSingle();
        if (profile?.full_name) setAuthorName(profile.full_name);
      }
      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    if (blog?.title) document.title = `${blog.title} — Shraddha Stories`;
  }, [blog?.title]);

  const handleReadAloud = async () => {
    if (!blog) return;
    if (audioUrl && audioRef.current) {
      if (playing) { audioRef.current.pause(); setPlaying(false); }
      else { audioRef.current.play(); setPlaying(true); }
      return;
    }
    setTtsLoading(true);
    const { data, error } = await supabase.functions.invoke("read-blog-aloud", { body: { blogId: blog.id } });
    setTtsLoading(false);
    if (error || !data?.url) {
      toast({ title: "Read-aloud unavailable", description: (error as any)?.message || data?.error || "Please try again later.", variant: "destructive" });
      return;
    }
    setAudioUrl(data.url);
    setTimeout(() => { audioRef.current?.play(); setPlaying(true); }, 100);
  };

  if (loading) {
    return <Layout><div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }
  if (!blog) {
    return <Layout>
      <div className="container max-w-2xl py-16 text-center px-4">
        <h1 className="font-serif text-3xl font-bold">Story not found</h1>
        <p className="text-muted-foreground mt-2">This story may have been unpublished or removed.</p>
        <Button asChild className="mt-6"><Link to="/blog">Browse other stories</Link></Button>
      </div>
    </Layout>;
  }

  return (
    <Layout>
      <article className="container max-w-3xl px-4 py-8 md:py-12">
        <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> All stories
        </Link>

        {blog.cover_image_url && (
          <div className="aspect-[16/9] w-full overflow-hidden bg-muted rounded-xl mb-8">
            <img src={blog.cover_image_url} alt={blog.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="text-sm text-muted-foreground">
            By <span className="font-medium text-foreground">{authorName}</span>
            {blog.published_at && <> · {new Date(blog.published_at).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</>}
            {blog.language && <> · {blog.language.toUpperCase()}</>}
          </div>
          <div className="flex items-center gap-2">
            <FontSizeToggle size={size} onChange={setSize} />
            <Button onClick={handleReadAloud} variant="outline" size="lg" className="h-11 gap-2" disabled={ttsLoading}>
              {ttsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : playing ? <Pause className="h-4 w-4" /> : audioUrl ? <Play className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              {playing ? "Pause" : audioUrl ? "Play" : "Read aloud"}
            </Button>
          </div>
        </div>

        <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-6">{blog.title}</h1>

        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            controls
            className="w-full mb-6"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
          />
        )}

        <RenderMarkdownLite
          text={blog.body}
          className="prose prose-lg max-w-none text-foreground"
        />
        <style>{`article .prose p, article .prose li { font-size: ${size}px; line-height: 1.7; }`}</style>

        <div className="mt-12 pt-8 border-t border-border">
          <SocialShare title={blog.title} />
        </div>
      </article>
    </Layout>
  );
}
