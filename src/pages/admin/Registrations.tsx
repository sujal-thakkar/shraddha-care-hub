import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, CheckCircle, XCircle, Users, UserCheck, Clock, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function AdminRegistrations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: registrations, isLoading } = useQuery({
    queryKey: ["admin-registrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async ({ id, checked_in }: { id: string; checked_in: boolean }) => {
      const { error } = await supabase
        .from("event_registrations")
        .update({
          checked_in,
          checked_in_at: checked_in ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { checked_in }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-registrations"] });
      toast({ title: checked_in ? "Checked in!" : "Check-in undone" });
    },
    onError: () => {
      toast({ title: "Failed to update", variant: "destructive" });
    },
  });

  const filtered = registrations?.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.full_name.toLowerCase().includes(q) ||
      r.mobile.includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.area.toLowerCase().includes(q)
    );
  });

  const stats = registrations
    ? {
        total: registrations.length,
        checkedIn: registrations.filter((r) => r.checked_in).length,
        pending: registrations.filter((r) => !r.checked_in).length,
      }
    : { total: 0, checkedIn: 0, pending: 0 };

  const exportCSV = () => {
    if (!registrations?.length) return;
    const headers = ["Name", "Mobile", "Email", "Age", "Area", "Medical Concerns", "Source", "Checked In", "Registered At"];
    const rows = registrations.map((r) => [
      r.full_name, r.mobile, r.email, r.age, r.area,
      r.medical_concerns || "", r.source, r.checked_in ? "Yes" : "No",
      format(new Date(r.created_at), "PPp"),
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "event-registrations.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Event Registrations</h1>
          <p className="text-muted-foreground">Mumbai Health Camp — March 15, 2026</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} disabled={!registrations?.length}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{isLoading ? "—" : stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <UserCheck className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{isLoading ? "—" : stats.checkedIn}</p>
              <p className="text-xs text-muted-foreground">Checked In</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold text-foreground">{isLoading ? "—" : stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, mobile, email, area..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : !filtered?.length ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {search ? "No registrations match your search." : "No registrations yet."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((reg) => (
            <Card key={reg.id} className={cn("transition-colors", reg.checked_in && "border-primary/30 bg-primary/5")}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{reg.full_name}</h3>
                      <Badge variant={reg.checked_in ? "default" : "secondary"} className="text-xs">
                        {reg.checked_in ? "Checked In" : "Registered"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">Age: {reg.age}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>{reg.mobile}</span>
                      <span>{reg.email}</span>
                      <span>{reg.area}</span>
                    </div>
                    {reg.medical_concerns && (
                      <p className="text-xs text-destructive mt-1">⚕ {reg.medical_concerns}</p>
                    )}
                    <div className="flex gap-x-4 text-xs text-muted-foreground mt-1">
                      <span>Source: {reg.source}</span>
                      <span>Registered: {format(new Date(reg.created_at), "PPp")}</span>
                      {reg.checked_in_at && <span>Checked in: {format(new Date(reg.checked_in_at), "p")}</span>}
                    </div>
                  </div>
                  <Button
                    variant={reg.checked_in ? "outline" : "default"}
                    size="sm"
                    onClick={() => checkInMutation.mutate({ id: reg.id, checked_in: !reg.checked_in })}
                    disabled={checkInMutation.isPending}
                    className="flex-shrink-0"
                  >
                    {reg.checked_in ? (
                      <><XCircle className="h-4 w-4 mr-1" /> Undo</>
                    ) : (
                      <><CheckCircle className="h-4 w-4 mr-1" /> Check In</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
