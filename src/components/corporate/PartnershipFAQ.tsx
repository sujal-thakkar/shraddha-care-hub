import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "Who is eligible to partner with Hosla / Shraddha?",
    answer:
      "Any organization aligned with elder welfare is welcome — hospitals and clinics, faith and spiritual groups, corporates and CSR teams, NGOs and community groups, educational institutions, and individual donors or sponsors. We assess fit based on shared values and the ability to create genuine impact for seniors, not on the size of the organization.",
  },
  {
    question: "What are the expected timelines to get started?",
    answer:
      "After you reach out, our team responds within 24–48 hours. A typical collaboration moves from first conversation to a scoped plan in 1–2 weeks, and to an on-ground activity (like a health camp or wellness summit) within 3–6 weeks, depending on scale, approvals and logistics. Ongoing programs such as Corporate Parental Care can begin onboarding almost immediately.",
  },
  {
    question: "How do you handle reporting and impact sharing?",
    answer:
      "Transparency is core to how we work. For every collaboration we share clear outcomes — beneficiaries reached, services delivered, photos and highlights — followed by a written impact summary. Corporate and CSR partners receive regular structured reports suitable for HR, management and compliance needs.",
  },
  {
    question: "How does onboarding work for new collaborators?",
    answer:
      "We keep it simple: (1) you submit an interest form, (2) we schedule a discovery call to understand your goals, (3) we co-design a program and confirm scope, roles and dates, (4) we execute together on the ground, and (5) we review outcomes and plan what's next. A dedicated point of contact guides you through every step.",
  },
  {
    question: "What kinds of collaboration areas can we support?",
    answer:
      "Common areas include medical camps and screenings, legal awareness for seniors, mental health and companionship programs, and events or summits. If you have a different idea that helps elders live with health, dignity and joy, we'd love to explore it with you.",
  },
  {
    question: "Is there any cost to partner with us?",
    answer:
      "Most collaborations are built on shared resources — you may contribute professionals, venues, funding or volunteers, while we bring reach, coordination and our senior community. Sponsorship and CSR partnerships involve funding that goes directly toward elder welfare programs, with full transparency on how it's used.",
  },
];

export function PartnershipFAQ() {
  return (
    <section id="partnership-faq" className="relative py-16 lg:py-24 bg-background overflow-hidden scroll-mt-20">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(250, 70%, 45%) 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />
      <div className="container relative z-10">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-[hsl(250,70%,45%)]/10 text-[hsl(250,70%,45%)] px-4 py-2 rounded-full text-sm font-medium mb-4">
              <HelpCircle className="h-4 w-4" />
              Partnership FAQs
            </div>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Questions Collaborators Ask
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Everything you need to know about eligibility, timelines, reporting and onboarding before we begin.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="max-w-3xl mx-auto rounded-2xl border border-border bg-card shadow-lg">
            <Accordion type="single" collapsible className="divide-y">
              {faqs.map((faq, index) => (
                <AccordionItem key={faq.question} value={`faq-${index}`} className="border-border px-2">
                  <AccordionTrigger className="group px-4 py-5 text-left text-base font-semibold text-foreground hover:no-underline">
                    <span className="transition-colors duration-200 group-hover:text-[hsl(250,70%,45%)]">
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-6 text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
