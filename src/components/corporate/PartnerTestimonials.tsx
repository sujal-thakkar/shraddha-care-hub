import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Quote, Star, HeartPulse, Users, CalendarCheck } from "lucide-react";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  org: string;
}

const testimonials: Testimonial[] = [
  {
    quote:
      "Partnering with Shraddha & Hosla for the senior health camp was seamless. Their team handled outreach and coordination beautifully, and our doctors could focus on what matters — caring for the elders who came in.",
    name: "Medical Team",
    role: "Health Camp Partner",
    org: "IQ City Hospital, Durgapur",
  },
  {
    quote:
      "The Senior Serenity Summit was deeply moving. Hosla brought together elders who truly needed peace and companionship, and together we created a space of calm and joy on the eve of Yoga Day.",
    name: "Program Coordinators",
    role: "Wellness Summit Partner",
    org: "Brahma Kumaris",
  },
  {
    quote:
      "What stood out was their transparency and heart. Every step was clear, every outcome was shared, and the impact on seniors was real. A partner you can trust with your CSR goals.",
    name: "CSR Lead",
    role: "Corporate Collaborator",
    org: "Partner Organization",
  },
];

const outcomes = [
  { icon: HeartPulse, value: "Free", label: "Health check-ups & consultations delivered" },
  { icon: Users, value: "Elders", label: "reached with care, dignity & joy" },
  { icon: CalendarCheck, value: "Multi-sector", label: "collaborations across health & wellness" },
];

export function PartnerTestimonials() {
  return (
    <section
      id="partner-testimonials"
      className="relative py-16 lg:py-24 overflow-hidden scroll-mt-20"
      style={{
        background: "linear-gradient(135deg, rgba(88, 55, 163, 0.06) 0%, rgba(55, 100, 180, 0.08) 100%)",
      }}
    >
      <div className="container relative z-10">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-[hsl(250,70%,45%)]/10 text-[hsl(250,70%,45%)] px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Star className="h-4 w-4" />
              Testimonials & Outcomes
            </div>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Trusted by the Organizations We Work With
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Real words from partners who joined hands with us — and the outcomes we created together.
            </p>
          </div>
        </ScrollReveal>

        {/* Outcome stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto mb-12">
          {outcomes.map((o, i) => (
            <ScrollReveal key={o.label} delay={i * 80} direction="up">
              <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm h-full">
                <div
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ background: "linear-gradient(135deg, hsl(250, 70%, 45%), hsl(220, 70%, 50%))" }}
                >
                  <o.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground leading-tight">{o.value}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{o.label}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {testimonials.map((t, index) => (
            <ScrollReveal key={t.org} delay={index * 120} direction="up">
              <figure className="relative h-full flex flex-col rounded-2xl border border-border bg-card p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <Quote className="h-8 w-8 text-[hsl(250,70%,45%)]/25 mb-3" />
                <blockquote className="text-sm text-muted-foreground leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-5 border-t border-border pt-4">
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-[hsl(250,70%,45%)] font-medium">{t.role}</p>
                  <p className="text-xs text-muted-foreground">{t.org}</p>
                </figcaption>
              </figure>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
