import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, Search, Plus, Minus, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminRole } from "@/hooks/use-admin-role";

type Row = {
  user_id: string;
  full_name: string | null;
  phone_e164: string | null;
  membership_id: string | null;
  status: string | null;
  roles: string[];
};

const ROLES: { key: "admin" | "team_admin" | "main_admin"; label: string; hint: string }[] = [
  { key: "admin", label: "Admin", hint: "Full admin dashboard access" },
  { key: "team_admin", label: "Team admin", hint: "Day-to-day team operations" },
  { key: "main_admin", label: "Main admin", hint: "Can manage roles and the HQ console" },
];

export default function AdminRoles() {
  const { toast } = useToast();
  const { loading: roleLoading, isMainAdmin } = useAdminRole();
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Row[]>([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const call = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("admin-roles", { body });
    if (error || (data as any)?.error) {
      throw new Error((data as any)?.error ?? error?.message ?? "Something went wrong");
    }
    return data as any;
  };

  const load = async () => {
    try {
      const data = await call({ action: "list" });
      setAdmins(data.admins ?? []);
    } catch (e) {
      toast({ title: "Could not load admins", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!roleLoading && isMainAdmin) load();
    else if (!roleLoading) setLoading(false);
  }, [roleLoading, isMainAdmin]);

  const search = async () => {
    if (q.trim().length < 2) return;
    setSearching(true);
    try {
      const data = await call({ action: "search", q });
      setResults(data.results ?? []);
    } catch (e) {
      toast({ title: "Search failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const toggleRole = async (row: Row, role: string, grant: boolean) => {
    setBusy(`${row.user_id}:${role}`);
    try {
      const data = await call({ action: grant ? "grant" : "revoke", user_id: row.user_id, role });
      setAdmins(data.admins ?? []);
      setResults((prev) =>
        prev.map((r) =>
          r.user_id === row.user_id
            ? { ...r, roles: grant ? [...new Set([...r.roles, role])] : r.roles.filter((x) => x !== role) }
            : r,
        ),
      );
      toast({
        title: grant ? "Role granted" : "Role removed",
        description: `${row.full_name ?? "Account"} — ${role.replace("_", " ")}`,
      });
    } catch (e) {
      toast({ title: "Action failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const RoleButtons = ({ row }: { row: Row }) => (
    <div className="flex flex-wrap gap-2">
      {ROLES.map((r) => {
        const has = row.roles.includes(r.key);
        const key = `${row.user_id}:${r.key}`;
        return (
          <Button
            key={r.key}
            size="sm"
            variant={has ? "secondary" : "outline"}
            disabled={busy === key}
            onClick={() => toggleRole(row, r.key, !has)}
            title={r.hint}
          >
            {busy === key ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : has ? (
              <Minus className="h-3.5 w-3.5" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            <span className="ml-1.5">{r.label}</span>
          </Button>
        );
      })}
    </div>
  );

  const Person = ({ row }: { row: Row }) => (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <p className="font-medium">{row.full_name ?? "Unnamed"}</p>
        <p className="text-sm text-muted-foreground">
          {row.membership_id ?? "No membership ID"}
          {row.phone_e164 ? ` · ${row.phone_e164}` : ""}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {row.roles.length ? (
            row.roles.map((r) => (
              <Badge key={r} variant={r === "main_admin" ? "default" : "secondary"}>
                {r.replace("_", " ")}
              </Badge>
            ))
          ) : (
            <Badge variant="outline">no admin roles</Badge>
          )}
        </div>
      </div>
      <RoleButtons row={row} />
    </div>
  );

  if (roleLoading || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isMainAdmin) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-10">
          <ShieldAlert className="h-6 w-6 text-destructive" />
          <div>
            <p className="font-medium">Main admin only</p>
            <p className="text-sm text-muted-foreground">
              Ask a main admin to promote you before managing roles.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <ShieldCheck className="h-6 w-6 text-primary" /> Admin roles
        </h1>
        <p className="text-sm text-muted-foreground">
          Promote or demote admins and set main admin. Every change is recorded in the audit log.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Find an account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Name, membership ID or phone"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
            />
            <Button onClick={search} disabled={searching || q.trim().length < 2}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Search</span>
            </Button>
          </div>
          {results.length > 0 && (
            <div className="space-y-3">
              {results.map((r) => (
                <Person key={r.user_id} row={r} />
              ))}
            </div>
          )}
          {!searching && q.trim().length >= 2 && results.length === 0 && (
            <p className="text-sm text-muted-foreground">No accounts matched that search.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current admins ({admins.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {admins.length === 0 ? (
            <p className="text-sm text-muted-foreground">No admins yet.</p>
          ) : (
            admins.map((r) => <Person key={r.user_id} row={r} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
