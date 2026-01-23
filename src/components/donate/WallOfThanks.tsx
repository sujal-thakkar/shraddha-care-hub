import { Heart, Sparkles, Star } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Marquee } from "@/components/ui/marquee";

interface Donor {
  name: string;
  donated_at: string;
}

interface WallOfThanksProps {
  donors: Donor[];
}

const DonorCard = ({ donor, index }: { donor: Donor; index: number }) => {
  const colors = [
    "from-primary/20 to-accent/40",
    "from-accent/30 to-primary/20",
    "from-primary/15 to-primary/30",
  ];
  const colorIndex = index % colors.length;

  return (
    <div
      className={`
        group relative inline-flex items-center gap-3 
        bg-gradient-to-br ${colors[colorIndex]}
        backdrop-blur-sm border border-primary/20
        px-5 py-3 rounded-2xl
        shadow-md hover:shadow-xl
        hover:border-primary/40 hover:scale-105
        transition-all duration-300 ease-out
        cursor-default
      `}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative flex items-center gap-3">
        <div className="relative">
          <Heart className="h-5 w-5 text-primary fill-primary/30 group-hover:fill-primary/50 transition-all duration-300 group-hover:scale-110" />
          <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <span className="font-medium text-foreground whitespace-nowrap">{donor.name}</span>
      </div>
    </div>
  );
};

export function WallOfThanks({ donors }: WallOfThanksProps) {
  if (!donors || donors.length === 0) return null;

  // Split donors into two rows for marquee
  const midPoint = Math.ceil(donors.length / 2);
  const firstRow = donors.slice(0, midPoint);
  const secondRow = donors.slice(midPoint);

  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Parallax Background */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/10 to-primary/5"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, hsl(var(--primary) / 0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, hsl(var(--accent) / 0.15) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.05) 0%, transparent 70%)
          `,
        }}
      />

      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-24 h-24 border-2 border-primary/10 rounded-full animate-float-bounce opacity-40" />
      <div className="absolute bottom-32 right-20 w-16 h-16 border-2 border-primary/15 rounded-full animate-float-bounce opacity-30" style={{ animationDelay: '0.5s' }} />
      <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-primary/20 rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 left-1/3 w-4 h-4 bg-accent-foreground/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Decorative stars */}
      <Star className="absolute top-16 right-16 h-6 w-6 text-primary/15 fill-primary/10 animate-pulse" />
      <Star className="absolute bottom-20 left-20 h-5 w-5 text-primary/10 fill-primary/5" />
      <Heart className="absolute top-1/2 left-8 h-8 w-8 text-primary/10 fill-primary/5 rotate-12" />
      <Heart className="absolute top-1/4 right-12 h-6 w-6 text-primary/10 fill-primary/5 -rotate-12" />

      {/* Top Wave */}
      <div className="absolute top-0 left-0 right-0 -mt-px rotate-180">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
          <path d="M0 120L48 105C96 90 192 60 288 50C384 40 480 50 576 55C672 60 768 60 864 65C960 70 1056 80 1152 80C1248 80 1344 70 1392 65L1440 60V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z" fill="hsl(var(--card))"/>
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <ScrollReveal direction="up">
          <div className="text-center mb-16 px-4">
            <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm text-primary px-5 py-2.5 rounded-full text-sm font-semibold mb-6 border border-primary/20 shadow-sm">
              <Sparkles className="h-4 w-4 animate-pulse" />
              Our Generous Donors
              <Sparkles className="h-4 w-4 animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
            <h2 className="font-serif text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Wall of{" "}
              <span className="relative inline-block">
                Thanks
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                  <path d="M2 8C50 2 150 2 198 8" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" className="opacity-40"/>
                </svg>
              </span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              We're deeply grateful to these wonderful souls who have supported our mission 
              and chosen to be recognized for their generosity.
            </p>
          </div>
        </ScrollReveal>

        {/* Animated Marquee of Donors */}
        <div className="space-y-6">
          <Marquee pauseOnHover speed="slow">
            {firstRow.map((donor, index) => (
              <DonorCard key={`first-${donor.name}-${index}`} donor={donor} index={index} />
            ))}
          </Marquee>
          
          {secondRow.length > 0 && (
            <Marquee direction="right" pauseOnHover speed="slow">
              {secondRow.map((donor, index) => (
                <DonorCard key={`second-${donor.name}-${index}`} donor={donor} index={index + midPoint} />
              ))}
            </Marquee>
          )}
        </div>

        <ScrollReveal direction="up" delay={200}>
          <div className="text-center mt-12 px-4">
            <div className="inline-flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-border px-6 py-3 rounded-full shadow-sm">
              <Heart className="h-4 w-4 text-primary animate-pulse" />
              <p className="text-sm text-muted-foreground">
                Want to see your name here? Check the recognition consent box when donating.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0 -mb-px">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
          <path d="M0 40L48 45C96 50 192 60 288 65C384 70 480 70 576 65C672 60 768 50 864 50C960 50 1056 60 1152 65C1248 70 1344 70 1392 70L1440 70V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z" fill="hsl(var(--primary))"/>
        </svg>
      </div>
    </section>
  );
}
