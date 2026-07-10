import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Calendar, MapPin, Users, Sparkles, CheckCircle } from "lucide-react";
import collabMedicalCamp from "@/assets/collab-medical-camp.jpg";
import collabSerenitySummit from "@/assets/collab-serenity-summit.jpg";

interface Collaboration {
  image: string;
  title: string;
  date: string;
  location: string;
  partner: string;
  description: string;
  outcomes: string[];
}

const collaborations: Collaboration[] = [
  {
    image: collabMedicalCamp,
    title: "Senior Health & Wellness Camp",
    date: "7 July 2026",
    location: "Durgapur",
    partner: "In collaboration with doctors, health professionals & management of IQ City Hospital, Durgapur",
    description:
      "A free health camp bringing specialist doctors and health professionals directly to our elders — check-ups, consultations and guidance, all in one caring space.",
    outcomes: [
      "Free health check-ups & doctor consultations",
      "On-the-spot health guidance for seniors",
      "Trusted hospital partnership for follow-up care",
    ],
  },
  {
    image: collabSerenitySummit,
    title: "Senior Serenity Summit",
    date: "20 June 2026",
    location: "On the eve of International Yoga Day",
    partner: "In collaboration with Brahma Kumaris",
    description:
      "A soulful summit of meditation, yoga and inner peace — helping elders reconnect with calm, purpose and companionship on the eve of Yoga Day.",
    outcomes: [
      "Guided meditation & gentle yoga for elders",
      "Mental peace and emotional well-being sessions",
      "Joyful companionship and community bonding",
    ],
  },
];

export function PastCollaborations() {
  return (
    <section
      id="past-collaborations"
      className="relative py-16 lg:py-24 overflow-hidden scroll-mt-20"
      style={{
        background: "linear-gradient(135deg, rgba(88, 55, 163, 0.05) 0%, rgba(120, 80, 200, 0.08) 100%)",
      }}
    >
      <div className="container relative z-10">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-[hsl(250,70%,45%)]/10 text-[hsl(250,70%,45%)] px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              Collaborations That Made a Difference
            </div>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Our Past Collaborations & Impact
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              When great organizations join hands with Shraddha &amp; Hosla, our elders win. Here are a few
              partnerships that turned into meaningful moments of care and joy.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {collaborations.map((c, index) => (
            <ScrollReveal key={c.title} delay={index * 120} direction="up">
              <article className="group h-full flex flex-col rounded-2xl overflow-hidden bg-card border border-border shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="relative overflow-hidden aspect-[16/10]">
                  <img
                    src={c.image}
                    alt={c.title}
                    width={1280}
                    height={960}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-background/90 backdrop-blur-sm px-3 py-1 text-xs font-medium text-foreground shadow-sm">
                      <Calendar className="h-3.5 w-3.5" style={{ color: "hsl(250, 70%, 45%)" }} />
                      {c.date}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-background/90 backdrop-blur-sm px-3 py-1 text-xs font-medium text-foreground shadow-sm">
                      <MapPin className="h-3.5 w-3.5" style={{ color: "hsl(250, 70%, 45%)" }} />
                      {c.location}
                    </span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col p-6">
                  <h3 className="font-serif text-xl lg:text-2xl font-bold text-foreground mb-2">{c.title}</h3>
                  <div className="flex items-start gap-2 mb-3">
                    <Users className="h-4 w-4 mt-0.5 flex-shrink-0 text-[hsl(250,70%,45%)]" />
                    <p className="text-sm font-medium text-[hsl(250,70%,45%)] leading-snug">{c.partner}</p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{c.description}</p>

                  <div className="mt-auto space-y-2 border-t border-border pt-4">
                    {c.outcomes.map((o) => (
                      <div key={o} className="flex items-start gap-2.5">
                        <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-500" />
                        <span className="text-sm text-muted-foreground leading-snug">{o}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
