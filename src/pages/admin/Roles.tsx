import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, Search, Plus, Minus, ShieldAlert, KeyRound } from "lucide-react";
import { Label } from "@/components/ui/label";
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


function PassphraseSection() {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    supabase.functions
      .invoke("admin-passphrase", { body: { action: "status" } })
      .then(({ data }) => setUpdatedAt((data as any)?.updated_at ?? null))
      .catch(() => {});
  }, []);

  const submit = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-passphrase", {
        body: {
          action: "update",
          password,
          current_passphrase: current,
          new_passphrase: next,
          confirm_passphrase: confirm,
        },
      });
      if (error || (data as any)?.error) {
        throw new Error((data as any)?.error ?? error?.message ?? "Something went wrong");
      }
      toast({ title: "Passphrase updated", description: "Use the new passphrase from now on." });
      setPassword(""); setCurrent(""); setNext(""); setConfirm("");
      setUpdatedAt(new Date().toISOString());
    } catch (e) {
      toast({ title: "Could not update", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const ready = password.length >= 4 && current.length >= 4 && next.length >= 10 && next === confirm;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <KeyRound className="h-5 w-5 text-primary" /> Console passphrase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This passphrase unlocks the HQ console and the account recovery page. To change it, confirm
          your identity by re-entering your own admin password along with the current passphrase.
          {updatedAt ? ` Last changed ${new Date(updatedAt).toLocaleString()}.` : ""}
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pp-pwd">Your admin password</Label>
            <Input id="pp-pwd" type="password" autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pp-cur">Current passphrase</Label>
            <Input id="pp-cur" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pp-new">New passphrase (min 10 characters)</Label>
            <Input id="pp-new" type="password" value={next} onChange={(e) => setNext(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pp-conf">Repeat new passphrase</Label>
            <Input id="pp-conf" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
        </div>
        {confirm.length > 0 && next !== confirm && (
          <p className="text-sm text-destructive">The two new passphrases do not match.</p>
        )}
        <Button onClick={submit} disabled={!ready || saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
          Change passphrase
        </Button>
      </CardContent>
    </Card>
  );
}

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

      <PassphraseSection />
    </div>
  );
}
