import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, Phone, Lock, IdCard } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import logoShraddha from "@/assets/logo-shraddha.png";
import { COUNTRY_CODES, validatePhone, toE164, syntheticEmail, composePassword, isValidPin } from "@/lib/phone-auth";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [usePin, setUsePin] = useState(false);
  const [membershipId, setMembershipId] = useState("");
  const [password, setPassword] = useState("");
  const [dial, setDial] = useState("+91");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: isAdmin } = await supabase.rpc("is_admin");
        if (isAdmin) navigate("/admin/dashboard");
      }
      setIsCheckingAuth(false);
    })();
  }, [navigate]);

  const finish = async () => {
    const { data: isAdmin, error: roleError } = await supabase.rpc("is_admin");
    if (roleError) throw new Error("Could not verify admin access");
    if (!isAdmin) {
      await supabase.auth.signOut();
      setError("This account is not an admin. Contact the main admin.");
      return;
    }
    toast({ title: "Welcome!", description: "Signed in to admin dashboard." });
    navigate("/admin/dashboard");
  };

  const handleIdLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const id = membershipId.trim().toUpperCase();
    if (!/^[A-Z]{4}\d{4}$/.test(id)) return setError("Membership ID looks like ABCD1234");
    if (password.length < 4) return setError("Enter your password");

    setIsLoading(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("member-login", {
        body: { membership_id: id, password },
      });
      const payload = data as any;
      if (fnErr || !payload?.session) throw new Error(payload?.error || "Wrong Membership ID or password");
      const { error: setErr } = await supabase.auth.setSession({
        access_token: payload.session.access_token,
        refresh_token: payload.session.refresh_token,
      });
      if (setErr) throw setErr;
      await finish();
    } catch (err: any) {
      setError(err.message || "Sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const v = validatePhone(dial, phone);
    if (!v.ok) return setError(v.msg);
    if (!isValidPin(pin)) return setError("PIN must be 4 digits");

    setIsLoading(true);
    const e164 = toE164(dial, v.digits);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: syntheticEmail(e164),
        password: composePassword(e164, pin),
      });
      if (authError) throw authError;
      if (!data.user) throw new Error("No user returned");
      await finish();
    } catch (err: any) {
      setError(err.message === "Invalid login credentials" ? "Wrong phone or PIN" : err.message || "Sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4"><img src={logoShraddha} alt="Shraddha" className="h-14" /></div>
          <CardTitle className="font-serif text-2xl">Admin Login</CardTitle>
          <CardDescription>
            {usePin ? "Sign in with your phone number and PIN" : "Sign in with your Membership ID and password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!usePin ? (
            <form onSubmit={handleIdLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><IdCard className="h-4 w-4" /> Membership ID</Label>
                <Input value={membershipId} autoComplete="username"
                  onChange={(e) => setMembershipId(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))}
                  placeholder="ABCD1234" className="h-12 text-xl tracking-[0.2em] text-center uppercase" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Lock className="h-4 w-4" /> Password</Label>
                <Input type="password" value={password} autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)} placeholder="Your password" className="h-12" />
              </div>
              <Button type="submit" className="w-full h-12" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : "Sign In"}
              </Button>
              <button type="button" onClick={() => { setUsePin(true); setError(""); }}
                className="w-full text-sm text-muted-foreground underline">
                Use my phone + PIN instead
              </button>
            </form>
          ) : (
            <form onSubmit={handlePinLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Phone className="h-4 w-4" /> Phone number</Label>
                <div className="flex gap-2">
                  <Select value={dial} onValueChange={setDial}>
                    <SelectTrigger className="w-[110px] h-12"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-80">
                      {COUNTRY_CODES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          <span className="inline-flex items-center gap-2"><span>{c.flag}</span><span className="font-medium">{c.code}</span></span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="tel" inputMode="numeric" value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d\s-]/g, ""))}
                    placeholder="10-digit number" className="h-12 flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Lock className="h-4 w-4" /> 4-digit PIN</Label>
                <Input type="password" inputMode="numeric" maxLength={4}
                  value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="••••" className="h-12 text-2xl tracking-[0.5em] text-center" />
              </div>
              <Button type="submit" className="w-full h-12" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : "Sign In"}
              </Button>
              <button type="button" onClick={() => { setUsePin(false); setError(""); }}
                className="w-full text-sm text-muted-foreground underline">
                Use my Membership ID instead
              </button>
            </form>
          )}

          <p className="text-sm text-muted-foreground text-center mt-4">
            Can't get in? <Link to="/admin/recover" className="underline">Admin recovery</Link>
          </p>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Not an admin? <Link to="/auth" className="underline">Writer sign-in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
