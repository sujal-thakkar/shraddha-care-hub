import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Bell, Heart, MessageCircle, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Notif {
  id: string;
  type: "like" | "comment";
  blog_id: string | null;
  blog_title: string | null;
  blog_slug: string | null;
  actor_name: string | null;
  comment_body: string | null;
  read_at: string | null;
  created_at: string;
}

const db = supabase as any;

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 7 ? `${d}d ago` : new Date(iso).toLocaleDateString();
}

function stripHtml(s: string) {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function NotificationBell() {
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const unread = items.filter((i) => !i.read_at).length;

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await db
      .from("author_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    setItems((data as Notif[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setUserId(data.session?.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      return;
    }
    load();
    const channel = supabase
      .channel(`author_notifications_${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "author_notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          setItems((prev) => [payload.new as Notif, ...prev].slice(0, 30));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, load]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const markAllRead = async () => {
    const ids = items.filter((i) => !i.read_at).map((i) => i.id);
    if (!ids.length) return;
    const now = new Date().toISOString();
    setItems((prev) => prev.map((i) => (i.read_at ? i : { ...i, read_at: now })));
    await db.from("author_notifications").update({ read_at: now }).in("id", ids);
  };

  const markRead = async (id: string) => {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, read_at: i.read_at ?? now } : i)));
    await db.from("author_notifications").update({ read_at: now }).eq("id", id);
  };

  if (!userId) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        className="relative w-11 h-11 flex items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent active:bg-accent/80 touch-manipulation"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-[70] w-[min(92vw,22rem)] rounded-xl border border-border bg-popover shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={markAllRead}>
                <Check className="h-3.5 w-3.5 mr-1" /> Mark all read
              </Button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                No notifications yet. Likes and comments on your blogs will show up here.
              </p>
            ) : (
              items.map((n) => {
                const to = n.blog_slug ? `/blog/${n.blog_slug}` : "/profile";
                const actor = n.actor_name?.trim() || "Someone";
                return (
                  <Link
                    key={n.id}
                    to={to}
                    onClick={() => {
                      markRead(n.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex gap-3 px-4 py-3 border-b border-border/60 last:border-0 transition-colors hover:bg-accent",
                      !n.read_at && "bg-primary/5"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 h-8 w-8 shrink-0 rounded-full flex items-center justify-center",
                        n.type === "like" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                      )}
                    >
                      {n.type === "like" ? <Heart className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      {n.type === "like" ? (
                        <span className="block text-sm text-foreground">Your post got a new like</span>
                      ) : (
                        <>
                          <span className="block text-sm text-foreground italic line-clamp-2">
                            &lsquo;{stripHtml(n.comment_body ?? "")}&rsquo;
                          </span>
                          <span className="block text-sm text-foreground mt-0.5">
                            new comment by {actor}
                          </span>
                        </>
                      )}
                      {n.blog_title && (
                        <span className="block text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          on “{n.blog_title}”
                        </span>
                      )}
                      <span className="block text-[11px] text-muted-foreground mt-1">{timeAgo(n.created_at)}</span>
                    </span>
                    {!n.read_at && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
