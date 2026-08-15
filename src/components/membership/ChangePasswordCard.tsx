import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ChangePasswordCard({ highlight }: { highlight?: boolean }) {
  const { toast } = useToast();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(true);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (pw.length < 6) return toast({ title: "Use at least 6 characters", variant: "destructive" });
    if (pw !== pw2) return toast({ title: "Passwords don't match", variant: "destructive" });
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (!error) {
      await supabase.from("profiles").update({ must_change_password: false } as any)
        .eq("user_id", (await supabase.auth.getSession()).data.session?.user.id as string);
    }
    setSaving(false);
    if (error) return toast({ title: "Couldn't change password", description: error.message, variant: "destructive" });
    setPw(""); setPw2("");
    toast({ title: "Password updated", description: "Use your new password next time you sign in." });
  };

  return (
    <Card className={highlight ? "border-primary ring-1 ring-primary" : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <KeyRound className="h-5 w-5 text-primary" />
          Change password
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {highlight && (
          <p className="text-base bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-3">
            Please set your own password now — the one given by the office is temporary.
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>New password</Label>
            <Input type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)}
              autoComplete="new-password" className="h-12 mt-1 text-base" />
          </div>
          <div>
            <Label>Confirm new password</Label>
            <Input type={show ? "text" : "password"} value={pw2} onChange={(e) => setPw2(e.target.value)}
              autoComplete="new-password" className="h-12 mt-1 text-base" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
          Show what I type
        </label>
        <Button onClick={save} disabled={saving} className="h-12 text-base">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <KeyRound className="h-4 w-4 mr-2" />}
          Update password
        </Button>
      </CardContent>
    </Card>
  );
}
