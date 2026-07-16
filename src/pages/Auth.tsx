import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/Layout";

const COUNTRY_CODES: { code: string; flag: string; name: string; digits: [number, number] }[] = [
  { code: "+91", flag: "🇮🇳", name: "India", digits: [10, 10] },
  { code: "+1", flag: "🇺🇸", name: "USA / Canada", digits: [10, 10] },
  { code: "+44", flag: "🇬🇧", name: "United Kingdom", digits: [10, 10] },
  { code: "+61", flag: "🇦🇺", name: "Australia", digits: [9, 9] },
  { code: "+65", flag: "🇸🇬", name: "Singapore", digits: [8, 8] },
  { code: "+971", flag: "🇦🇪", name: "UAE", digits: [9, 9] },
  { code: "+880", flag: "🇧🇩", name: "Bangladesh", digits: [10, 10] },
  { code: "+977", flag: "🇳🇵", name: "Nepal", digits: [10, 10] },
  { code: "+94", flag: "🇱🇰", name: "Sri Lanka", digits: [9, 9] },
];

function validatePhone(dial: string, phone: string) {
  const digits = phone.replace(/\D/g, "");
  const rule = COUNTRY_CODES.find((c) => c.code === dial);
  if (!rule) return { ok: false, msg: "Pick a country" };
  const [min, max] = rule.digits;
  if (digits.length < min || digits.length > max) {
    return { ok: false, msg: `Enter ${min === max ? min : `${min}\u2013${max}`} digits after ${dial}` };
  }
  return { ok: true, digits };
}

export default function Auth() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/blog/write";
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [dial, setDial] = useState("+91");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate(next, { replace: true });
      setChecking(false);
    });
  }, [navigate, next]);

  const sendMagicLink = async (mode: "signin" | "signup") => {
    if (!email.trim()) {
      toast({ title: "Enter your email", variant: "destructive" });
      return;
    }
    const meta: Record<string, string> = {};
    if (mode === "signup") {
      if (!fullName.trim()) {
        toast({ title: "Enter your name", variant: "destructive" });
        return;
      }
      if (phone.trim()) {
        const v = validatePhone(dial, phone);
        if (!v.ok) { toast({ title: "Check phone number", description: v.msg, variant: "destructive" }); return; }
        meta.phone_e164 = `${dial}${v.digits}`;
        meta.country_code = dial;
      }
      meta.full_name = fullName.trim();
    }
    setLoading(true);
    const redirectTo = `${window.location.origin}${next}`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: mode === "signup",
        data: meta,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: mode === "signup" ? "Sign-up failed" : "Sign-in failed", description: error.message, variant: "destructive" });
      return;
    }
    setSentTo(email.trim());
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (sentTo) {
    return (
      <Layout>
        <div className="container max-w-md py-16 px-4">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="font-serif text-2xl">Check your email</CardTitle>
              <CardDescription>
                We sent a magic sign-in link to <span className="font-medium text-foreground">{sentTo}</span>.
                Open it on this device to continue — no password needed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Can't find it? Check spam. The link is valid for a short time.
              </p>
              <Button variant="outline" className="w-full h-12" onClick={() => setSentTo(null)}>
                Use a different email
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-md py-16 px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="font-serif text-2xl">Welcome</CardTitle>
            <CardDescription>
              Sign in with a one-tap magic link — no password to remember.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form
                  onSubmit={(e) => { e.preventDefault(); sendMagicLink("signin"); }}
                  className="space-y-4 mt-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email" type="email" required autoComplete="email"
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-12 text-base"
                    />
                  </div>
                  <Button type="submit" className="w-full h-12" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Mail className="h-4 w-4 mr-2" /> Send me a login link</>}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    We'll email you a secure link. Tap it once and you're in.
                  </p>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form
                  onSubmit={(e) => { e.preventDefault(); sendMagicLink("signup"); }}
                  className="space-y-4 mt-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-12 text-base" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email2">Email address</Label>
                    <Input id="email2" type="email" required autoComplete="email"
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-12 text-base" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone number <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <div className="flex gap-2">
                      <Select value={dial} onValueChange={setDial}>
                        <SelectTrigger className="w-[110px] h-12 text-base">
                          <SelectValue />
                        </SelectTrigger>
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
                      <Input
                        id="phone" type="tel" inputMode="numeric" autoComplete="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^\d\s-]/g, ""))}
                        placeholder="10-digit number"
                        className="h-12 text-base flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      We may use this to contact you about your stories. Never shared publicly.
                    </p>
                  </div>
                  <Button type="submit" className="w-full h-12" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Mail className="h-4 w-4 mr-2" /> Send me a login link</>}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    No password needed. We'll email you a secure sign-in link.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
            <p className="text-sm text-muted-foreground text-center mt-6">
              <Link to="/blog" className="underline">Browse stories</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
