import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminMemberships from "@/pages/admin/Memberships";
import { PLANS, defaultAmount, monthlyEquivalent, planLabel, type BillingCycle } from "@/lib/membership-plans";
import { Loader2, Search, HandCoins, BellRing, IdCard, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminRole } from "@/hooks/use-admin-role";
import {
  formatINR, prettyDate, memberStatusOf, STATUS_LABEL, monthsCovered, coveredPeriod, makeMembershipId,
} from "@/lib/membership";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  due: "bg-amber-100 text-amber-800",
  lapsed: "bg-destructive/15 text-destructive",
  none: "bg-muted text-muted-foreground",
};

export default function AdminMembers() {
  const { toast } = useToast();
  const { isMainAdmin } = useAdminRole();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [me, setMe] = useState<any>(null);

  // Cash collection dialog
  const [cashFor, setCashFor] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [receiver, setReceiver] = useState("");
  const [saving, setSaving] = useState(false);

  // New member dialog
  const [newOpen, setNewOpen] = useState(false);
  const [nName, setNName] = useState("");
  const [nPhone, setNPhone] = useState("");
  const [nPlan, setNPlan] = useState("standard-non-metro");
  const [nCycle, setNCycle] = useState<BillingCycle>("monthly");
  const [nFee, setNFee] = useState(defaultAmount("standard-non-metro", "monthly"));
  const [creating, setCreating] = useState(false);
  const [issued, setIssued] = useState<{ membership_id: string; password: string } | null>(null);

  // Reminders
  const [sending, setSending] = useState(false);

  const load = async () => {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, phone_e164, email, membership_id, plan, monthly_fee_amount, paid_up_until, member_status, chapter")
      .not("membership_id", "is", null)
      .order("full_name");
    setMembers(data ?? []);
    if (uid) {
      const mine = (data ?? []).find((m: any) => m.user_id === uid);
      setMe(mine ?? null);
      const { data: p } = await supabase.from("profiles").select("full_name").eq("user_id", uid).maybeSingle();
      setReceiver(p?.full_name || "");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return members;
    return members.filter((m) =>
      [m.full_name, m.membership_id, m.phone_e164].filter(Boolean).some((v: string) => String(v).toLowerCase().includes(needle))
    );
  }, [members, q]);

  const dueMembers = members.filter((m) => memberStatusOf(m.paid_up_until) !== "active");

  const openCash = (m: any) => {
    setCashFor(m);
    setAmount(String(m.monthly_fee_amount || ""));
  };

  const cashPreview = (() => {
    if (!cashFor) return null;
    const months = monthsCovered(Number(amount || 0), Number(cashFor.monthly_fee_amount || 0));
    const period = coveredPeriod(cashFor.paid_up_until, months);
    if (!period) return null;
    return `${formatINR(Number(amount))} covers ${period.label} — new paid-until ${prettyDate(period.end)}`;
  })();

  const recordCash = async () => {
    if (!cashFor) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast({ title: "Enter the amount collected", variant: "destructive" });
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("record-cash-collection", {
      body: { member_user_id: cashFor.user_id, amount_inr: amt, receiver_name: receiver },
    });
    setSaving(false);
    if (error || (data as any)?.error) {
      return toast({ title: "Couldn't record it", description: (data as any)?.error || error?.message, variant: "destructive" });
    }
    setCashFor(null);
    toast({
      title: "Collection recorded",
      description: "The member has a receipt. It goes to the main admin for settlement.",
    });
  };

  const createMember = async () => {
    if (!nName.trim() || nPhone.replace(/\D/g, "").length < 10) {
      return toast({ title: "Enter a name and 10-digit phone", variant: "destructive" });
    }
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("member-credentials", {
      body: {
        action: "create_member",
        name: nName.trim(),
        phone: nPhone.replace(/\D/g, ""),
        plan: nPlan,
        monthly_fee_amount: monthlyEquivalent(Number(nFee), nCycle),
      },
    });
    setCreating(false);
    const payload = data as any;
    if (error || payload?.error) {
      return toast({ title: "Couldn't create the member", description: payload?.error || error?.message, variant: "destructive" });
    }
    setIssued({ membership_id: payload.membership_id, password: payload.password });
    setNName(""); setNPhone("");
    load();
  };

  const sendReminders = async (userIds: string[]) => {
    if (userIds.length === 0) return toast({ title: "Nobody to remind right now" });
    setSending(true);
    const { data, error } = await supabase.functions.invoke("send-fee-reminders", { body: { user_ids: userIds } });
    setSending(false);
    if (error || (data as any)?.error) {
      return toast({ title: "Couldn't send reminders", description: (data as any)?.error || error?.message, variant: "destructive" });
    }
    toast({ title: `Reminders sent to ${(data as any)?.sent ?? userIds.length} member(s)` });
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold">Members &amp; Fee Management</h1>
          <p className="text-muted-foreground">Member accounts, plans, cash collections, reminders and card applications — all in one place.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { setIssued(null); setNewOpen(true); }} className="h-11">
            <UserPlus className="h-4 w-4 mr-2" /> New member
          </Button>
          <Button variant="outline" className="h-11" disabled={sending || dueMembers.length === 0}
            onClick={() => sendReminders(dueMembers.map((m) => m.user_id))}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BellRing className="h-4 w-4 mr-2" />}
            Remind all due ({dueMembers.length})
          </Button>
        </div>
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members &amp; fees</TabsTrigger>
          <TabsTrigger value="applications">Card applications</TabsTrigger>
        </TabsList>
        <TabsContent value="applications" className="mt-4">
          <AdminMemberships />
        </TabsContent>
        <TabsContent value="members" className="mt-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><IdCard className="h-5 w-5 text-primary" /> Member directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, Membership ID or phone" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-11" />
          </div>
          {filtered.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center">No members found.</p>
          ) : (
            <div className="divide-y">
              {filtered.map((m) => {
                const status = memberStatusOf(m.paid_up_until);
                return (
                  <div key={m.user_id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{m.full_name || "—"} <span className="text-muted-foreground font-normal">· {m.membership_id}</span></p>
                      <p className="text-sm text-muted-foreground">
                        {planLabel(m.plan)}{m.monthly_fee_amount ? ` · ${formatINR(m.monthly_fee_amount)}/month` : ""} · paid up to {prettyDate(m.paid_up_until)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_STYLE[status]}>{STATUS_LABEL[status]}</Badge>
                      <Button size="sm" variant="outline" className="h-10" onClick={() => openCash(m)}>
                        <HandCoins className="h-4 w-4 mr-1" /> Record cash
                      </Button>
                      <Button size="sm" variant="ghost" className="h-10" onClick={() => sendReminders([m.user_id])} disabled={sending}>
                        <BellRing className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {isMainAdmin && (
        <p className="text-sm text-muted-foreground">
          Approvals, cash settlement and credential overrides live in the main-admin console.
        </p>
      )}
        </TabsContent>
      </Tabs>

      {/* Cash collection: three fields only */}
      <Dialog open={!!cashFor} onOpenChange={(o) => !o && setCashFor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record cash collection</DialogTitle>
            <DialogDescription>{cashFor?.full_name} · {cashFor?.membership_id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount collected (₹)</Label>
              <Input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                className="h-12 text-lg mt-1" />
            </div>
            <div>
              <Label>Received by</Label>
              <Input value={receiver} onChange={(e) => setReceiver(e.target.value)} className="h-12 mt-1" />
            </div>
            <div className="rounded-lg bg-muted/50 border p-3 text-sm space-y-1">
              <p>Plan: <strong>{cashFor?.plan || "—"}</strong> · Monthly fee: <strong>{formatINR(cashFor?.monthly_fee_amount)}</strong></p>
              <p>Currently paid up to: <strong>{prettyDate(cashFor?.paid_up_until)}</strong></p>
              {cashPreview && <p className="text-foreground">{cashPreview}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={recordCash} disabled={saving} className="h-12 w-full text-base">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <HandCoins className="h-4 w-4 mr-2" />}
              Record collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New member */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New member account</DialogTitle>
            <DialogDescription>A Membership ID and password are generated for the member.</DialogDescription>
          </DialogHeader>
          {issued ? (
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Membership ID</p>
                <p className="text-2xl font-bold tracking-[0.15em]">{issued.membership_id}</p>
                <p className="text-sm text-muted-foreground mt-3">Temporary password</p>
                <p className="text-xl font-mono">{issued.password}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Write these down for the member — the password is shown only once. They can change it in their profile.
              </p>
              <Button className="h-11 w-full" onClick={() => { setIssued(null); setNewOpen(false); }}>Done</Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <Label>Full name</Label>
                  <Input value={nName} onChange={(e) => setNName(e.target.value)} className="h-12 mt-1" />
                </div>
                <div>
                  <Label>Phone (10 digits)</Label>
                  <Input inputMode="numeric" value={nPhone} onChange={(e) => setNPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} className="h-12 mt-1" />
                </div>
                <div>
                  <Label>Plan</Label>
                  <Select value={nPlan} onValueChange={(v) => { setNPlan(v); setNFee(defaultAmount(v, nCycle)); }}>
                    <SelectTrigger className="h-12 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLANS.map((p) => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Billing</Label>
                    <Select value={nCycle} onValueChange={(v) => { setNCycle(v as BillingCycle); setNFee(defaultAmount(nPlan, v as BillingCycle)); }}>
                      <SelectTrigger className="h-12 mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Amount (₹ / {nCycle === "monthly" ? "month" : "year"})</Label>
                    <Input inputMode="numeric" value={nFee} onChange={(e) => setNFee(e.target.value.replace(/\D/g, ""))}
                      placeholder={nPlan.startsWith("premium") ? "Custom amount" : ""} className="h-12 mt-1" />
                  </div>
                </div>
                {nCycle === "yearly" && Number(nFee) > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Charged as <strong>{formatINR(monthlyEquivalent(Number(nFee), "yearly"))}/month</strong> in the fee ledger.
                  </p>
                )}
                {nName && nPhone.length === 10 && (
                  <p className="text-sm text-muted-foreground">
                    Membership ID will be <strong>{makeMembershipId(nName, nPhone)}</strong>
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button onClick={createMember} disabled={creating} className="h-12 w-full text-base">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                  Create account
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
