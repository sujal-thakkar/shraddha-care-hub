import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import {
  Heart, Sparkles, Sun, Home, Mic2, Users, PenTool, Globe, GraduationCap,
  Bus, Gift, Building2, BarChart3, Target, Rocket, Briefcase, Phone as PhoneIcon,
  Handshake, UserCog, Mail, CheckCircle, Star, ArrowRight, MapPin,
} from "lucide-react";
import { PartnerContactModal } from "@/components/corporate/PartnerContactModal";
import { HoslaMembershipModal } from "@/components/corporate/HoslaMembershipModal";

/* ------------------------------------------------------------------ */
/*  Types & Data                                                      */
/* ------------------------------------------------------------------ */

type BillingCycle = "monthly" | "yearly";
type CityType = "non-metro" | "metro";

interface Benefit {
  icon: React.ElementType;
  label: string;
}

const hoslaBenefits: Benefit[] = [
  { icon: Heart, label: "Emotional Wellbeing — caring conversations, wellbeing check-ins & compassionate listening" },
  { icon: Sparkles, label: "Spiritual Growth — Satsang & Pathachakra twice a week (Bhagavad Gita, Upanishads, Ramayana & more)" },
  { icon: Sun, label: "Daily Self-Care Therapy — 45-min guided sessions at 6:30 AM & 8:45 PM (breathwork, meditation, brain-health)" },
  { icon: Home, label: "Trusted Household Support — priority access to maid, caregiver, cook, electrician, plumber + periodic home visits" },
  { icon: Mic2, label: "Talent Discovery — singing, recitation, storytelling, quiz, language learning & creative presentations" },
  { icon: Users, label: "Evening Companionship — 7 PM Senior Citizen Adda for friendship & laughter" },
  { icon: PenTool, label: "Create, Write & Be Heard — newsletter articles, artwork showcase, Hosla Radio podcasts" },
  { icon: Globe, label: "Purpose Beyond Retirement — volunteer & community service via Shraddha NGO" },
  { icon: GraduationCap, label: "Expert Sessions — Ramakrishna Mission, Chinmaya Mission, Brahma Kumaris, Art of Living & more" },
  { icon: Bus, label: "Trips, Celebrations & Get-togethers — mini trips, cultural outings, picnics & memorable events" },
  { icon: Gift, label: "Personalized Care for Parents — birthday surprises, festival celebrations, custom care plans" },
];

const corporateExtraBenefits: Benefit[] = [
  { icon: UserCog, label: "Priority dedicated care consultants for each employee's parents (above 50 years of age)" },
  { icon: BarChart3, label: "Monthly wellness reports for HR & management" },
  { icon: Target, label: "Corporate wellness workshops & employee engagement sessions" },
  { icon: Rocket, label: "Priority onboarding & dedicated helpline" },
  { icon: Briefcase, label: "Tax benefits under CSR initiatives" },
];

const personalizedExtraBenefits: Benefit[] = [
  { icon: Target, label: "Fully customized care plan designed around your elder ones" },
  { icon: Gift, label: "Bespoke family experiences — curated with personal attention" },
];

/* ------------------------------------------------------------------ */
/*  Pricing lookup                                                    */
/* ------------------------------------------------------------------ */

const hoslaPrice: Record<CityType, Record<BillingCycle, number>> = {
  "non-metro": { monthly: 400, yearly: 4000 },
  "metro": { monthly: 500, yearly: 5000 },
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function MembershipPlans() {
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [city, setCity] = useState<CityType>("non-metro");
  const [partnerModal, setPartnerModal] = useState(false);

  const price = hoslaPrice[city][billing];
  const yearlySavings = hoslaPrice[city].monthly * 12 - hoslaPrice[city].yearly;

  return (
    <>
      <section id="membership-plans" className="relative py-16 lg:py-24 overflow-hidden scroll-mt-20">
        {/* Background decoration */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(250, 70%, 45%) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        <div className="container relative z-10">
          {/* Header */}
          <ScrollReveal>
            <div className="text-center mb-10 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-[hsl(250,70%,45%)]/10 text-[hsl(250,70%,45%)] px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Star className="h-4 w-4" />
                Membership Plans
              </div>
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-3">
                Hosla‑Shraddha Membership Benefits
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Bringing Care, Companionship &amp; Purpose — from the comfort of <strong className="text-foreground">YOUR</strong> Home.
              </p>
            </div>
          </ScrollReveal>

          {/* Toggles */}
          <ScrollReveal delay={100}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
              {/* Billing toggle */}
              <div className="inline-flex items-center gap-1 p-1 rounded-full bg-muted border border-border">
                <button
                  onClick={() => setBilling("monthly")}
                  className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${billing === "monthly"
                      ? "bg-[hsl(250,70%,45%)] text-white shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBilling("yearly")}
                  className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-2 ${billing === "yearly"
                      ? "bg-[hsl(250,70%,45%)] text-white shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Yearly
                  {billing !== "yearly" && (
                    <span className="text-xs bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                      Save ₹{yearlySavings.toLocaleString("en-IN")}
                    </span>
                  )}
                </button>
              </div>

              {/* Metro toggle */}
              <div className="inline-flex items-center gap-1 p-1 rounded-full bg-muted border border-border">
                <button
                  onClick={() => setCity("non-metro")}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1.5 ${city === "non-metro"
                      ? "bg-foreground text-background shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Non‑Metro
                </button>
                <button
                  onClick={() => setCity("metro")}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1.5 ${city === "metro"
                      ? "bg-foreground text-background shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  Metro
                </button>
              </div>
            </div>
          </ScrollReveal>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-start">
            {/* ── Hosla Care (Recommended) ── */}
            <ScrollReveal delay={100}>
              <div className="relative rounded-2xl border-2 border-[hsl(250,70%,45%)] bg-card shadow-xl shadow-[hsl(250,70%,45%)]/10 md:scale-[1.03] md:-translate-y-2">
                {/* Recommended badge */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                  <span className="inline-flex items-center gap-1.5 bg-[hsl(250,70%,45%)] text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    Recommended
                  </span>
                </div>

                <div className="p-6 pt-8 lg:p-8 lg:pt-10">
                  {/* Tier name */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-foreground mb-1">Hosla Care</h3>
                    <p className="text-sm text-muted-foreground">
                      For elder citizens &amp; families with parents living alone
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl lg:text-5xl font-extrabold text-foreground">₹{price.toLocaleString("en-IN")}</span>
                      <span className="text-muted-foreground text-sm">/{billing === "monthly" ? "mo" : "yr"}</span>
                    </div>
                    {billing === "yearly" && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                        Save ₹{yearlySavings.toLocaleString("en-IN")} compared to monthly
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {city === "metro" ? "Metro city pricing" : "Non-metro city pricing"}
                    </p>
                  </div>

                  {/* CTA */}
                  <Button
                    size="lg"
                    className="w-full mb-6 bg-[hsl(250,70%,45%)] hover:bg-[hsl(250,70%,40%)] text-white group"
                    onClick={() => setPartnerModal(true)}
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>

                  {/* Benefits */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Everything included:</p>
                    {hoslaBenefits.map((b, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <b.icon className="h-4 w-4 mt-0.5 flex-shrink-0 text-[hsl(250,70%,45%)]" />
                        <span className="text-sm text-muted-foreground leading-snug">{b.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* ── Corporate Care ── */}
            <ScrollReveal delay={200}>
              <div className="relative rounded-2xl border border-border bg-card shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="p-6 lg:p-8">
                  {/* Tier name */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-5 w-5 text-[hsl(250,70%,45%)]" />
                      <h3 className="text-xl font-bold text-foreground">Corporate Care</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      For companies — like Microsoft 365 for your employees' Parent and Grandparent
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl lg:text-4xl font-extrabold text-foreground">Custom</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Volume-based pricing tailored to your team size</p>
                  </div>

                  {/* CTA */}
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full mb-6 border-[hsl(250,70%,45%)]/40 text-[hsl(250,70%,45%)] hover:bg-[hsl(250,70%,45%)] hover:text-white group"
                    onClick={() => setPartnerModal(true)}
                  >
                    Request a Quote
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>

                  {/* Benefits */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">All Hosla Care benefits, plus:</p>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-500" />
                      <span className="text-sm text-muted-foreground leading-snug font-medium">Everything in Hosla Care</span>
                    </div>
                    <div className="h-px bg-border my-1" />
                    {corporateExtraBenefits.map((b, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <b.icon className="h-4 w-4 mt-0.5 flex-shrink-0 text-[hsl(250,70%,45%)]" />
                        <span className="text-sm text-muted-foreground leading-snug">{b.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* ── Personalized ── */}
            <ScrollReveal delay={300}>
              <div className="relative rounded-2xl border border-border bg-card shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                {/* Subtle gradient accent at top */}
                <div className="h-1 bg-gradient-to-r from-[hsl(250,70%,45%)] via-[hsl(220,70%,50%)] to-[hsl(250,70%,45%)]" />

                <div className="p-6 lg:p-8">
                  {/* Tier name */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <Handshake className="h-5 w-5 text-[hsl(250,70%,45%)]" />
                      <h3 className="text-xl font-bold text-foreground">Personalized</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Fully customized care — designed exclusively for your family
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl lg:text-4xl font-extrabold text-foreground">Let's Talk</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Tailored to your unique requirements</p>
                  </div>

                  {/* CTA */}
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="w-full mb-6 border-[hsl(250,70%,45%)]/40 text-[hsl(250,70%,45%)] hover:bg-[hsl(250,70%,45%)] hover:text-white group"
                  >
                    <a href="tel:7811009309">
                      <PhoneIcon className="mr-2 h-4 w-4" />
                      Contact Hosla
                    </a>
                  </Button>

                  <div className="flex items-center gap-3 mb-6 p-3 rounded-lg bg-muted/50 border border-border">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <a href="mailto:care@hosla.in" className="text-sm text-[hsl(250,70%,45%)] hover:underline font-medium">
                      care@hosla.in
                    </a>
                  </div>

                  {/* Benefits */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">All Corporate Care benefits, plus:</p>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-500" />
                      <span className="text-sm text-muted-foreground leading-snug font-medium">Everything in Corporate Care</span>
                    </div>
                    <div className="h-px bg-border my-1" />
                    {personalizedExtraBenefits.map((b, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <b.icon className="h-4 w-4 mt-0.5 flex-shrink-0 text-[hsl(250,70%,45%)]" />
                        <span className="text-sm text-muted-foreground leading-snug">{b.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Promise footer */}
          <ScrollReveal delay={400}>
            <div className="text-center mt-12 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 text-[hsl(250,70%,45%)] font-semibold mb-2">
                <Heart className="h-4 w-4 fill-current" />
                Hosla's Promise
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                <strong className="text-foreground">Health. Happiness. Companionship. Spiritual Growth. Purpose.</strong><br />
                Everything a senior citizen deserves — delivered with care, dignity, and love, from the comfort of home.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <PartnerContactModal open={partnerModal} onOpenChange={setPartnerModal} />
    </>
  );
}
