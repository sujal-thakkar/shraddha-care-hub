import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User, Phone, Lock, Send, CheckCircle2, KeyRound, UserCheck, Sparkles, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  COUNTRY_CODES,
  validatePhone,
  toE164,
  syntheticEmail,
  composePassword,
  isValidPin,
} from "@/lib/phone-auth";

type Step = "form" | "existing-pin" | "new-pin" | "done-guest" | "done-linked" | "done-account";

export interface GuestSubmitDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Called with { name, phone, author_id, is_approved_writer } to actually insert the blog row. */
  onSubmit: (data: { guest_name: string; guest_phone: string; author_id: string | null; is_approved_writer: boolean }) => Promise<{ ok: boolean; error?: string }>;
}

export function GuestSubmitDialog({ open, onOpenChange, onSubmit }: GuestSubmitDialogProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("form");
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [dial, setDial] = useState("+91");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [linkedAuthorId, setLinkedAuthorId] = useState<string | null>(null);

  const resetAll = () => {
    setStep("form");
    setBusy(false);
    setName(""); setPhone(""); setPin(""); setPin2(""); setLinkedAuthorId(null);
  };

  const handleClose = (o: boolean) => {
    if (!o) resetAll();
    onOpenChange(o);
  };

  // Step 1 → decide which branch based on whether the phone already has a profile.
  const handleFormNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast({ title: "Please enter your name", variant: "destructive" });
    const v = validatePhone(dial, phone);
    if (!v.ok) return toast({ title: "Check phone number", description: v.msg, variant: "destructive" });

    setBusy(true);
    const e164 = toE164(dial, v.digits);
    const { data: available, error } = await supabase.rpc("is_phone_available", { _phone: e164 });
    setBusy(false);
    if (error) return toast({ title: "Couldn't verify phone", description: error.message, variant: "destructive" });

    if (available === false) {
      // Phone already registered — need existing PIN to link this submission.
      setStep("existing-pin");
    } else {
      // New phone — invite them to become a writer, or stay guest.
      setStep("new-pin");
    }
  };

  // Existing account — verify PIN by signing in, capture user.id, then sign out.
  const handleExistingPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPin(pin)) return toast({ title: "PIN must be 4 digits", variant: "destructive" });
    const v = validatePhone(dial, phone);
    if (!v.ok) return;
    const e164 = toE164(dial, v.digits);

    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: syntheticEmail(e164),
      password: composePassword(e164, pin),
    });
    if (error || !data.user) {
      setBusy(false);
      return toast({ title: "Wrong PIN", description: "That PIN doesn't match this phone number.", variant: "destructive" });
    }
    const authorId = data.user.id;
    // Look up whether this writer is already approved — decides guest vs. non-guest tagging.
    const { data: prof } = await supabase.from("profiles").select("status").eq("user_id", authorId).maybeSingle();
    if (!prof) {
      await supabase.auth.signOut();
      setBusy(false);
      return toast({
        title: "Writer record needs cleanup",
        description: "This phone still has an old PIN, but its writer profile was removed. Please ask an admin to delete/reset this phone from Writers.",
        variant: "destructive",
      });
    }
    const approved = (prof as any)?.status === "approved";
    // Insert while signed in so RLS sees auth.uid() = author_id, then sign out.
    const res = await onSubmit({ guest_name: name.trim(), guest_phone: e164, author_id: authorId, is_approved_writer: approved });
    await supabase.auth.signOut();
    setBusy(false);
    if (!res.ok) return toast({ title: "Submit failed", description: res.error, variant: "destructive" });
    setLinkedAuthorId(authorId);
    setStep(approved ? "done-linked" : "done-account");
  };

  // New account path — either set a PIN (creates account + submits) or stay guest.
  const handleSetPinAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPin(pin)) return toast({ title: "PIN must be 4 digits", variant: "destructive" });
    if (pin !== pin2) return toast({ title: "PINs don't match", variant: "destructive" });
    const v = validatePhone(dial, phone);
    if (!v.ok) return;
    const e164 = toE164(dial, v.digits);

    setBusy(true);
    let { data, error } = await supabase.auth.signUp({
      email: syntheticEmail(e164),
      password: composePassword(e164, pin),
      options: {
        emailRedirectTo: `${window.location.origin}/blog`,
        data: { full_name: name.trim(), phone_e164: e164, country_code: dial },
      },
    });
    // If signup says "user already exists" (e.g. an earlier attempt half-succeeded),
    // fall back to signing in with the same PIN so we can still attach this blog.
    if (error && /already|registered/i.test(error.message)) {
      const signIn = await supabase.auth.signInWithPassword({
        email: syntheticEmail(e164),
        password: composePassword(e164, pin),
      });
      if (signIn.error || !signIn.data.user) {
        setBusy(false);
        setStep("existing-pin");
        return toast({
          title: "This phone already has a PIN",
          description: "Enter the PIN set earlier, or contact an admin to delete/reset this phone.",
          variant: "destructive",
        });
      }
      data = signIn.data as any;
      error = null as any;
    }
    if (error || !data?.user) {
      setBusy(false);
      return toast({ title: "Couldn't create account", description: error?.message, variant: "destructive" });
    }
    const authorId = data.user.id;
    // Insert while signed in so RLS accepts author_id = auth.uid(), then sign out.
    // Brand-new signup → writer is `pending` by default → treat as guest until admin approves.
    // If signup fell back to signInWithPassword (account existed), the writer might already be approved — check.
    const { data: prof } = await supabase.from("profiles").select("status").eq("user_id", authorId).maybeSingle();
    if (!prof) {
      await supabase.auth.signOut();
      setBusy(false);
      return toast({
        title: "Writer record needs cleanup",
        description: "This phone still has an old PIN, but its writer profile was removed. Please ask an admin to delete/reset this phone from Writers.",
        variant: "destructive",
      });
    }
    const approved = (prof as any)?.status === "approved";
    const res = await onSubmit({ guest_name: name.trim(), guest_phone: e164, author_id: authorId, is_approved_writer: approved });
    await supabase.auth.signOut();
    setBusy(false);
    if (!res.ok) return toast({ title: "Submit failed", description: res.error, variant: "destructive" });
    setStep("done-account");
  };

  const handleStayGuest = async () => {
    const v = validatePhone(dial, phone);
    if (!v.ok) return;
    const e164 = toE164(dial, v.digits);
    setBusy(true);
    const res = await onSubmit({ guest_name: name.trim(), guest_phone: e164, author_id: null, is_approved_writer: false });
    setBusy(false);
    if (!res.ok) return toast({ title: "Submit failed", description: res.error, variant: "destructive" });
    setStep("done-guest");
  };

  // Final CTA on done-linked / done-account — reuses the PIN the user just entered/set to sign them in.
  const handleSignInAndGoToProfile = async () => {
    const v = validatePhone(dial, phone);
    if (!v.ok) return;
    const e164 = toE164(dial, v.digits);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: syntheticEmail(e164),
      password: composePassword(e164, pin),
    });
    setBusy(false);
    if (error) {
      return toast({ title: "Couldn't sign you in", description: error.message, variant: "destructive" });
    }
    onOpenChange(false);
    navigate("/profile");
  };

  const handleGoBackToBlog = async () => {
    await supabase.auth.signOut();
    onOpenChange(false);
    navigate("/blog");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Almost there — a few quick details</DialogTitle>
              <DialogDescription>
                Tell us who you are so we can credit your blog when it's reviewed.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleFormNext} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="g-name" className="flex items-center gap-2"><User className="h-4 w-4" /> Your name</Label>
                <Input id="g-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="h-12" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Phone className="h-4 w-4" /> Phone number</Label>
                <div className="flex gap-2">
                  <Select value={dial} onValueChange={setDial}>
                    <SelectTrigger className="w-[110px] h-12"><SelectValue /></SelectTrigger>
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
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d\s-]/g, ""))}
                    placeholder="10-digit number"
                    className="h-12 flex-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full h-12" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <Send className="h-4 w-4 ml-2" /></>}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}

        {step === "existing-pin" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl flex items-center gap-2">
                <UserCheck className="h-6 w-6 text-primary" /> Welcome back
              </DialogTitle>
              <DialogDescription>
                This phone number already belongs to a writer account.
                Enter your <b>4-digit PIN</b> so we can attach this submission to your profile —
                you'll see it under <i>My blogs</i> when you sign in.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleExistingPin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ex-pin" className="flex items-center gap-2"><Lock className="h-4 w-4" /> Your PIN</Label>
                <Input
                  id="ex-pin" type="text" inputMode="numeric" maxLength={4} autoComplete="off"
                  value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="••••" className="h-12 text-2xl tracking-[0.5em] text-center"
                />
              </div>
              <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                <Button type="button" variant="ghost" onClick={() => setStep("form")} disabled={busy}>Back</Button>
                <Button type="submit" className="flex-1 h-12" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify PIN & submit"}
                </Button>
              </DialogFooter>
              <p className="text-xs text-muted-foreground text-center">
                Forgot your PIN? <Link to="/contact" className="underline text-primary hover:text-primary/80">Contact an admin</Link> — we'll reset it for you.
              </p>
            </form>
          </>
        )}

        {step === "new-pin" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" /> Become a writer?
              </DialogTitle>
              <DialogDescription className="space-y-2">
                <span>
                  Set a simple <b>4-digit PIN</b> and this phone number becomes your writer account. That means:
                </span>
                <ul className="text-sm list-disc pl-5 space-y-1 mt-2">
                  <li>Every blog you submit — now and later — will live in <b>your profile</b>.</li>
                  <li>You can edit drafts, respond to reviewer notes, and track publication.</li>
                  <li>Your name and picture will show as the author on published blogs.</li>
                </ul>
                <span className="block text-xs pt-2">
                  Prefer not to? You can still submit this one blog as a guest — but it won't be saved to any profile,
                  and the next time you write, we'll have to ask you again.
                </span>
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSetPinAndSubmit} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="new-pin" className="flex items-center gap-2"><Lock className="h-4 w-4" /> Create a 4-digit PIN</Label>
                <Input id="new-pin" type="text" inputMode="numeric" maxLength={4} autoComplete="off"
                  value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="••••" className="h-12 text-2xl tracking-[0.5em] text-center" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-pin2">Confirm PIN</Label>
                <Input id="new-pin2" type="text" inputMode="numeric" maxLength={4} autoComplete="off"
                  value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="••••" className="h-12 text-2xl tracking-[0.5em] text-center" />
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <Button type="submit" className="h-12" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><KeyRound className="h-4 w-4 mr-2" /> Set PIN & submit</>}
                </Button>
                <Button type="button" variant="outline" className="h-12" onClick={handleStayGuest} disabled={busy}>
                  Stay as a guest & submit anyway
                </Button>
                <Button type="button" variant="ghost" onClick={() => setStep("form")} disabled={busy}>Back</Button>
              </div>
            </form>
          </>
        )}

        {step === "done-guest" && (
          <div className="text-center py-4">
            <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Submitted as guest</DialogTitle>
              <DialogDescription>
                Thanks {name}! Your blog is now with the review team. Since this was a guest submission,
                it won't appear in any personal profile — but we'll credit you as the author if it's published.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6">
              <Button className="w-full h-12" onClick={() => handleClose(false)}>Done</Button>
            </div>
          </div>
        )}

        {step === "done-linked" && (
          <div className="text-center py-4">
            <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Blog linked to your account</DialogTitle>
              <DialogDescription>
                We attached this submission to your existing writer profile. Sign in to see it under <i>My blogs</i>.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 flex flex-col gap-2">
              <Button className="w-full h-12" onClick={handleSignInAndGoToProfile} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in to your profile"}
              </Button>
              <Button variant="ghost" onClick={() => handleClose(false)}>Close</Button>
            </div>
          </div>
        )}

        {step === "done-account" && (
          <div className="text-center py-4">
            <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-amber-700" />
            </div>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Submission and writer request sent</DialogTitle>
              <DialogDescription>
                Your blog has been submitted for review, and your request to become a writer has also gone to the admin team.
                You won't get profile access yet. The Hosla / Shraddha team will inform you after your writer account is approved.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 flex flex-col gap-2">
              <Button className="w-full h-12" onClick={handleGoBackToBlog} disabled={busy}>
                Go back to blog page
              </Button>
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                Setting a PIN only creates a request. Profile, draft management and writer tools unlock only after admin approval.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
