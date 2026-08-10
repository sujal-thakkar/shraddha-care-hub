import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Users, Loader2, Search, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1OeHRRTQw-oosoRJKxWgUOs4Kb4DcQy8cjFT0-oLOz_o/edit";

type ActiveMember = {
  id: string;
  name: string;
  phone_digits: string;
  synced_at: string;
};

export default function ActiveMembersSync() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);

  const { data: members, isLoading } = useQuery({
    queryKey: ["admin-active-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("active_members")
        .select("id, name, phone_digits, synced_at")
        .order("name");
      if (error) throw error;
      return data as ActiveMember[];
    },
  });

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-active-members");
      if (error) throw error;
      if (data?.error) throw new Error(String(data.error));
      toast({
        title: "Members synced",
        description: `${data.synced} members imported${data.skipped ? `, ${data.skipped} rows skipped (invalid phone)` : ""}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-active-members"] });
    } catch (err) {
      toast({
        title: "Sync failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const lastSynced = members?.[0]?.synced_at;
  const filtered = members?.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.phone_digits.includes(search.replace(/\D/g, "")),
  );

  return (
    <Card className="border-border">
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-semibold text-foreground">Active Members Directory</h2>
              <p className="text-xs text-muted-foreground">
                Synced from the Google Sheet. Used to waive fees on paid event registrations.
                {lastSynced && ` Last synced ${format(new Date(lastSynced), "MMM d, yyyy h:mm a")}.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={SHEET_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" /> Open sheet
              </a>
            </Button>
            <Button size="sm" onClick={handleSync} disabled={syncing}>
              {syncing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Syncing...</>
              ) : (
                <><RefreshCw className="h-4 w-4 mr-2" /> Sync now</>
              )}
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {isLoading ? "Loading..." : `${members?.length ?? 0} active members`}
          </span>
        </div>

        {filtered && filtered.length > 0 && (
          <div className="max-h-64 overflow-y-auto rounded-lg border border-border divide-y divide-border">
            {filtered.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-foreground">{m.name}</span>
                <span className="text-muted-foreground tabular-nums">{m.phone_digits}</span>
              </div>
            ))}
          </div>
        )}

        {!isLoading && (members?.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground">
            No members imported yet. Click "Sync now" to pull the list from the sheet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
