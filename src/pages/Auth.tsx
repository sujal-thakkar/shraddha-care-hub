import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, User, Phone, Lock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/Layout";
import { COUNTRY_CODES, validatePhone, toE164, syntheticEmail, composePassword, isValidPin } from "@/lib/phone-auth";

export default function Auth() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/blog/write";
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [signupDone, setSignupDone] = useState(false);

  // Shared
  const [dial, setDial] = useState("+91");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");

  // Signup only
  const [fullName, setFullName] = useState("");
  const [pin2, setPin2] = useState("");

  // Simple client-side rate limit for login attempts
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate(next, { replace: true });
      setChecking(false);
    });
  }, [navigate, next]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return toast({ title: "Enter your full name", variant: "destructive" });
    const v = validatePhone(dial, phone);
    if (!v.ok) return toast({ title: "Check phone number", description: v.msg, variant: "destructive" });
    if (!isValidPin(pin)) return toast({ title: "PIN must be 4 digits", variant: "destructive" });
    if (pin !== pin2) return toast({ title: "PINs don't match", variant: "destructive" });

    const e164 = toE164(dial, v.digits);
    setLoading(true);

    // Uniqueness check before signup
    const { data: available, error: chkErr } = await supabase.rpc("is_phone_available", { _phone: e164 });
    if (chkErr) { setLoading(false); return toast({ title: "Signup failed", description: chkErr.message, variant: "destructive" }); }
    if (!available) {
      setLoading(false);
      return toast({ title: "Phone already registered", description: "Try signing in instead.", variant: "destructive" });
    }

    const { error } = await supabase.auth.signUp({
      email: syntheticEmail(e164),
      password: composePassword(e164, pin),
      options: {
        emailRedirectTo: `${window.location.origin}${next}`,
        data: {
          full_name: fullName.trim(),
          phone_e164: e164,
          country_code: dial,
        },
      },
    });
    setLoading(false);

    if (error) return toast({ title: "Signup failed", description: error.message, variant: "destructive" });
    // Sign out immediately — user shouldn't be logged in until admin approves
    await supabase.auth.signOut();
    setSignupDone(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Date.now() < cooldownUntil) {
      const secs = Math.ceil((cooldownUntil - Date.now()) / 1000);
      return toast({ title: `Please wait ${secs}s`, description: "Too many attempts.", variant: "destructive" });
    }
    const v = validatePhone(dial, phone);
    if (!v.ok) return toast({ title: "Check phone number", description: v.msg, variant: "destructive" });
    if (!isValidPin(pin)) return toast({ title: "PIN must be 4 digits", variant: "destructive" });

    const e164 = toE164(dial, v.digits);
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: syntheticEmail(e164),
      password: composePassword(e164, pin),
    });
    setLoading(false);

    if (error || !data.user) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 5) {
        setCooldownUntil(Date.now() + 60_000);
        setAttempts(0);
        return toast({ title: "Too many attempts", description: "Wait 60 seconds and try again.", variant: "destructive" });
      }
      return toast({ title: "Wrong phone or PIN", description: "Please check and try again.", variant: "destructive" });
    }

    // Check profile status
    const { data: profile } = await supabase.from("profiles").select("status, full_name").eq("user_id", data.user.id).maybeSingle();
    if (!profile) {
      await supabase.auth.signOut();
      return toast({ title: "Account not found", variant: "destructive" });
    }
    if (profile.status === "pending") {
      await supabase.auth.signOut();
      return toast({ title: "Account under review", description: "The team will approve your account soon.", variant: "destructive" });
    }
    if (profile.status === "rejected") {
      await supabase.auth.signOut();
      return toast({ title: "Account not approved", description: "Please contact us.", variant: "destructive" });
    }

    setAttempts(0);
    toast({ title: `Welcome, ${profile.full_name || "friend"}!` });
    navigate(next, { replace: true });
  };

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (signupDone) {
    return (
      <Layout>
        <div className="container max-w-md py-16 px-4">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="font-serif text-2xl">Account created</CardTitle>
              <CardDescription>
                Your account is being reviewed by the admin team.
                Once approved, you can sign in and start writing.
                Usually within a day or two.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full h-12" onClick={() => setSignupDone(false)}>Back to sign in</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const phoneRow = (idPrefix: string) => (
    <div className="space-y-2">
      <Label htmlFor={`${idPrefix}-phone`} className="flex items-center gap-2"><Phone className="h-4 w-4" /> Phone number</Label>
      <div className="flex gap-2">
        <Select value={dial} onValueChange={setDial}>
          <SelectTrigger className="w-[110px] h-12 text-base"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-80">
            {COUNTRY_CODES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                <span className="inline-flex items-center gap-2">
                  <span className="text-lg leading-none">{c.flag}</span>
                  <span className="font-medium">{c.code}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input id={`${idPrefix}-phone`} type="tel" inputMode="numeric" autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/[^\d\s-]/g, ""))}
          placeholder="10-digit number"
          className="h-12 text-base flex-1" />
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="container max-w-md py-16 px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="font-serif text-2xl">Welcome</CardTitle>
            <CardDescription>Sign in with your phone number and 4-digit PIN.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  {phoneRow("in")}
                  <div className="space-y-2">
                    <Label htmlFor="in-pin" className="flex items-center gap-2"><Lock className="h-4 w-4" /> 4-digit PIN</Label>
                    <Input id="in-pin" type="password" inputMode="numeric" maxLength={4}
                      value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="••••" className="h-12 text-2xl tracking-[0.5em] text-center" />
                  </div>
                  <Button type="submit" className="w-full h-12" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Forgot your PIN? Contact the admin — they can reset it for you.
                  </p>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="up-name" className="flex items-center gap-2"><User className="h-4 w-4" /> Full name</Label>
                    <Input id="up-name" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your name" className="h-12 text-base" />
                  </div>
                  {phoneRow("up")}
                  <div className="space-y-2">
                    <Label htmlFor="up-pin" className="flex items-center gap-2"><Lock className="h-4 w-4" /> Create a 4-digit PIN</Label>
                    <Input id="up-pin" type="password" inputMode="numeric" maxLength={4}
                      value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="••••" className="h-12 text-2xl tracking-[0.5em] text-center" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="up-pin2">Confirm PIN</Label>
                    <Input id="up-pin2" type="password" inputMode="numeric" maxLength={4}
                      value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="••••" className="h-12 text-2xl tracking-[0.5em] text-center" />
                  </div>
                  <Button type="submit" className="w-full h-12" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Your account will be reviewed by the admin team before you can start writing.
                  </p>
                </form>
              </TabsContent>
            </Tabs>

            <p className="text-sm text-muted-foreground text-center mt-6">
              <Link to="/blog" className="underline">Browse blogs</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
