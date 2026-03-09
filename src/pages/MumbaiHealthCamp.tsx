import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  CalendarDays, Clock, MapPin, Phone, Heart, Stethoscope, Mic2, Gamepad2, Brain,
  BadgePercent, Users, Leaf, CheckCircle, ArrowRight, Sparkles, Star
} from "lucide-react";
import hoslaLogo from "@/assets/hosla-logo.png";
import logoShraddha from "@/assets/logo-shraddha.png";

const eventHighlights = [
  {
    icon: Stethoscope,
    title: "Free Dental Check-up",
    description: "Professional screening to ensure your oral health is on track. A healthy smile is a timeless one!",
  },
  {
    icon: Mic2,
    title: "Senior Citizen Talent Express",
    description: "A stage for our elders to shine — sing a classic melody, recite poetry, or share a life story.",
  },
  {
    icon: Gamepad2,
    title: "Recreational Games & Activities",
    description: "Specially designed light physical activities to keep the energy high and the spirit youthful.",
  },
  {
    icon: Brain,
    title: "Memory Games",
    description: "Fun, cognitive exercises aimed at boosting mental agility and keeping the mind sharp.",
  },
  {
    icon: BadgePercent,
    title: "Exclusive Membership Offers",
    description: "Be the first to join the Hosla community with special Early Bird Offers available only at the event.",
  },
];

const sourceOptions = ["WhatsApp", "Facebook/Instagram", "Friend/Relative", "Website", "Other"];

export default function MumbaiHealthCamp() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    mobile: "",
    email: "",
    age: "",
    area: "",
    medical_concerns: "",
    source: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name || !formData.mobile || !formData.email || !formData.age || !formData.area || !formData.source) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const age = parseInt(formData.age);
    if (isNaN(age) || age < 1 || age > 120) {
      toast({ title: "Please enter a valid age", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const rateCheck = await checkRateLimit(formData.email, "contact_messages");
      if (!rateCheck.allowed) {
        toast({ title: "Too many submissions", description: rateCheck.message, variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      const registrationId = crypto.randomUUID();

      const { error } = await supabase.from("event_registrations").insert({
        id: registrationId,
        full_name: formData.full_name.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email.trim().toLowerCase(),
        age,
        area: formData.area.trim(),
        medical_concerns: formData.medical_concerns.trim() || null,
        source: formData.source,
      });

      if (error) throw error;

      // Trigger notification to admins
      try {
        await supabase.functions.invoke("send-event-email", {
          body: {
            type: "registration_confirmation",
            registrationId,
            name: formData.full_name.trim(),
            email: formData.email.trim().toLowerCase(),
          },
        });
      } catch {
        // Don't block on email failure
      }

      setIsRegistered(true);
    } catch (err) {
      console.error("Registration error:", err);
      toast({ title: "Registration failed", description: "Please try again or call us at 78110 09309.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-accent to-primary/5 py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-accent-foreground rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/30 rounded-full blur-3xl" />
        </div>

        <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src={hoslaLogo} alt="Hosla" className="h-10" />
              <span className="text-2xl text-muted-foreground">&</span>
              <img src={logoShraddha} alt="Shraddha" className="h-10" />
            </div>

            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-sm font-medium border border-primary/20">
              <Leaf className="h-4 w-4 text-primary" />
              <span className="text-primary">Senior Citizens' Health & Wellness Camp</span>
              <Leaf className="h-4 w-4 text-primary" />
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              Mumbai Senior Citizens' Meet & <span className="text-primary">Health Wellness Camp</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              This isn't just an event — it's a celebration of wisdom, health, and community. We invite our respected senior citizens 
              to a morning dedicated to well-being, laughter, and rekindling old friendships.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-xl border border-border shadow-sm">
                <CalendarDays className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">March 15, 2026</span>
              </div>
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-xl border border-border shadow-sm">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">9:00 AM – 10:00 AM</span>
              </div>
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-xl border border-border shadow-sm">
                <Heart className="h-5 w-5 text-primary" />
                <span className="font-medium text-primary">FREE Entry</span>
              </div>
            </div>

            <Button size="lg" className="mt-4 group" onClick={() => document.getElementById("register")?.scrollIntoView({ behavior: "smooth" })}>
              Register Now
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* Venue Section */}
      <section className="py-12 bg-card border-y border-border">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left">
            <MapPin className="h-8 w-8 text-primary flex-shrink-0" />
            <div>
              <h3 className="font-medium text-foreground text-lg">Venue</h3>
              <p className="text-muted-foreground">
                J.B. Sadan, Hall above New Angel Medical, Ludrick Stop, Mardes – Wagholi, Nala Sopara West, Mumbai
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Event Highlights */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-primary font-medium uppercase tracking-widest text-sm">What to Expect</span>
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground">Event Highlights</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {eventHighlights.map((item, i) => (
              <Card key={i} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Important Info */}
      <section className="py-12 bg-accent/50 border-y border-border">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-2xl font-bold text-foreground text-center mb-8">Important Information</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium text-foreground">Free Entry</h3>
                <p className="text-sm text-muted-foreground">Completely FREE for all senior citizens</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium text-foreground">Family Welcome</h3>
                <p className="text-sm text-muted-foreground">Family members can accompany their elders</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium text-foreground">Contact Us</h3>
                <p className="text-sm text-muted-foreground">
                  <a href="tel:+917811009309" className="text-primary hover:underline">78110 09309</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section id="register" className="py-16 lg:py-24 bg-background scroll-mt-20">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            {isRegistered ? (
              <Card className="border-primary/20 shadow-lg">
                <CardContent className="p-8 sm:p-12 text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <CheckCircle className="h-10 w-10 text-primary" />
                  </div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
                    Thank you for registering! 🌿
                  </h2>
                  <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
                    We are excited to see you on <strong className="text-foreground">March 15th at J.B. Sadan</strong>. 
                    Your health and happiness are our priority. We will send a reminder via email a day before the event.
                  </p>
                  <div className="bg-accent/50 rounded-xl p-4 border border-border">
                    <p className="text-sm text-muted-foreground">
                      Need help? Call us at{" "}
                      <a href="tel:+917811009309" className="text-primary font-medium hover:underline">78110 09309</a>
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <img src={hoslaLogo} alt="Hosla" className="h-6" />
                    <span className="text-muted-foreground">&</span>
                    <img src={logoShraddha} alt="Shraddha" className="h-6" />
                  </div>
                  <p className="text-xs text-muted-foreground italic">Caring for our Elders</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Star className="h-5 w-5 text-primary" />
                    <span className="text-primary font-medium uppercase tracking-widest text-sm">Register Now</span>
                    <Star className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-3">
                    Reserve Your Spot
                  </h2>
                  <p className="text-muted-foreground">
                    Please register in advance to ensure we can accommodate everyone comfortably.
                  </p>
                </div>

                <Card className="shadow-lg border-border">
                  <CardContent className="p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name *</Label>
                        <Input
                          id="full_name"
                          placeholder="Enter your full name"
                          value={formData.full_name}
                          onChange={(e) => handleChange("full_name", e.target.value)}
                          maxLength={100}
                          required
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="mobile">Mobile Number *</Label>
                          <Input
                            id="mobile"
                            type="tel"
                            placeholder="e.g., 98765 43210"
                            value={formData.mobile}
                            onChange={(e) => handleChange("mobile", e.target.value)}
                            maxLength={15}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="age">Age *</Label>
                          <Input
                            id="age"
                            type="number"
                            placeholder="Your age"
                            value={formData.age}
                            onChange={(e) => handleChange("age", e.target.value)}
                            min={1}
                            max={120}
                            required
                          />
                          <p className="text-xs text-muted-foreground">To help us tailor our activities</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={formData.email}
                          onChange={(e) => handleChange("email", e.target.value)}
                          maxLength={255}
                          required
                        />
                        <p className="text-xs text-muted-foreground">For event reminders and updates</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="area">Area / Locality *</Label>
                        <Input
                          id="area"
                          placeholder="e.g., Vasai East, Nala Sopara West"
                          value={formData.area}
                          onChange={(e) => handleChange("area", e.target.value)}
                          maxLength={200}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="medical_concerns">Medical Concerns (Optional)</Label>
                        <Textarea
                          id="medical_concerns"
                          placeholder="Any specific health concerns, chronic conditions, or allergies our medical team should be aware of?"
                          value={formData.medical_concerns}
                          onChange={(e) => handleChange("medical_concerns", e.target.value)}
                          maxLength={500}
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>How did you hear about this event? *</Label>
                        <Select value={formData.source} onValueChange={(v) => handleChange("source", v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                          <SelectContent>
                            {sourceOptions.map((opt) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? "Registering..." : "Register for Free"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
