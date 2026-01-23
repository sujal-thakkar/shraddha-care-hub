import { Heart, Sparkles, Star } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Marquee } from "@/components/ui/marquee";
import floralFrame from "@/assets/floral-frame.jpg";

interface Donor {
  name: string;
  donated_at: string;
}

interface WallOfThanksProps {
  donors: Donor[];
}

// Simple donor card
const DonorCard = ({ donor, index }: { donor: Donor; index: number }) => {
  const colors = [
    "from-primary/20 to-accent/40",
    "from-accent/30 to-primary/20",
    "from-rose-200/40 to-pink-300/30",
    "from-amber-200/40 to-orange-300/30",
    "from-sky-200/40 to-blue-300/30",
    "from-violet-200/40 to-purple-300/30",
    "from-emerald-200/40 to-teal-300/30",
    "from-lime-200/40 to-green-300/30",
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
        </div>
        <span className="font-medium text-foreground whitespace-nowrap">{donor.name}</span>
      </div>
    </div>
  );
};

// Floating heart decoration component
const FloatingHeart = ({ className, delay = "0s" }: { className?: string; delay?: string }) => (
  <div 
    className={`absolute animate-float-bounce ${className}`}
    style={{ animationDelay: delay }}
  >
    <Heart className="h-6 w-6 text-primary/15 fill-primary/10" />
  </div>
);

export function WallOfThanks({ donors }: WallOfThanksProps) {
  if (!donors || donors.length === 0) return null;

  // Threshold for switching between stacked and marquee layout
  const MARQUEE_THRESHOLD = 6;
  const useMarquee = donors.length > MARQUEE_THRESHOLD;

  // Split donors into two rows for marquee (only used when useMarquee is true)
  const midPoint = Math.ceil(donors.length / 2);
  const firstRow = donors.slice(0, midPoint);
  const secondRow = donors.slice(midPoint);

  return (
    <section className="relative py-24 lg:py-36 overflow-hidden">
      {/* Parallax background image */}
      <div 
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: `url(${floralFrame})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      />
      
      {/* Light overlay to maintain readability */}
      <div className="absolute inset-0 bg-background/30" />

      {/* Floating decorative elements */}
      <FloatingHeart className="top-24 left-[10%]" delay="0s" />
      <FloatingHeart className="top-40 right-[15%]" delay="0.5s" />
      <FloatingHeart className="bottom-32 left-[20%]" delay="1s" />
      <FloatingHeart className="bottom-40 right-[25%]" delay="1.5s" />
      <FloatingHeart className="top-1/3 left-[5%]" delay="2s" />
      <FloatingHeart className="top-1/2 right-[8%]" delay="0.8s" />
      
      {/* Decorative circles */}
      <div className="absolute top-20 left-16 w-32 h-32 border-2 border-primary/10 rounded-full animate-float-bounce opacity-30" />
      <div className="absolute bottom-28 right-24 w-20 h-20 border-2 border-primary/15 rounded-full animate-float-bounce opacity-25" style={{ animationDelay: '0.5s' }} />
      <div className="absolute top-1/2 right-10 w-12 h-12 border border-accent-foreground/10 rounded-full animate-float-bounce opacity-20" style={{ animationDelay: '1.2s' }} />
      
      {/* Decorative dots */}
      <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-primary/25 rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 left-1/3 w-4 h-4 bg-accent-foreground/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-2/3 left-1/4 w-2 h-2 bg-primary/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
      
      {/* Decorative stars */}
      <Star className="absolute top-20 right-20 h-7 w-7 text-primary/15 fill-primary/10 animate-pulse" />
      <Star className="absolute bottom-24 left-24 h-5 w-5 text-primary/10 fill-primary/5" />
      <Star className="absolute top-1/2 left-12 h-4 w-4 text-accent-foreground/10 fill-accent-foreground/5" />

      {/* Top Wave */}
      <div className="absolute top-0 left-0 right-0 -mt-px rotate-180">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
          <path d="M0 120L48 105C96 90 192 60 288 50C384 40 480 50 576 55C672 60 768 60 864 65C960 70 1056 80 1152 80C1248 80 1344 70 1392 65L1440 60V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z" fill="hsl(var(--card))"/>
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <ScrollReveal direction="up">
          <div className="text-center mb-20 px-4">            
            {/* Enhanced title with decorative elements */}
            <div className="relative inline-block">
              <h2 className="font-serif text-5xl lg:text-6xl font-bold text-foreground mb-4">
                Wall of{" "}
                <span className="relative inline-block text-primary">
                  Thanks
                  <svg className="absolute -bottom-3 left-0 w-full" viewBox="0 0 200 15" fill="none">
                    <path d="M2 10C30 4 60 4 100 8C140 12 170 6 198 10" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" className="opacity-50"/>
                    <path d="M10 12C50 6 150 6 190 12" stroke="hsl(var(--accent-foreground))" strokeWidth="2" strokeLinecap="round" className="opacity-30"/>
                  </svg>
                </span>
              </h2>
              
              {/* Decorative heart beside title */}
              <Heart className="absolute -top-2 -right-6 h-5 w-5 text-primary/25 fill-primary/20 rotate-[15deg]" />
            </div>
            
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg mt-6 leading-relaxed">
              We're deeply grateful to these wonderful souls who have supported our mission 
              and chosen to be recognized for their generosity.
            </p>
          </div>
        </ScrollReveal>

        {/* Decorative divider before donors */}
        <div className="flex items-center justify-center gap-4 mb-10 px-4">
          <div className="h-px w-20 bg-gradient-to-r from-transparent to-primary/30" />
          <Heart className="h-5 w-5 text-primary/40 fill-primary/25" />
          <div className="h-px w-20 bg-gradient-to-l from-transparent to-primary/30" />
        </div>

        {/* Conditional Layout: Stacked for few donors, Marquee for many */}
        {useMarquee ? (
          // Animated Marquee of Donors (for more than 6 donors)
          <div className="space-y-8 py-4">
            <div className="py-2">
              <Marquee pauseOnHover speed="slow">
                {firstRow.map((donor, index) => (
                  <DonorCard key={`first-${donor.name}-${index}`} donor={donor} index={index} />
                ))}
              </Marquee>
            </div>
            
            {secondRow.length > 0 && (
              <div className="py-2">
                <Marquee direction="right" pauseOnHover speed="slow">
                  {secondRow.map((donor, index) => (
                    <DonorCard key={`second-${donor.name}-${index}`} donor={donor} index={index + midPoint} />
                  ))}
                </Marquee>
              </div>
            )}
          </div>
        ) : (
          // Stacked centered layout (for 6 or fewer donors)
          <div className="flex flex-wrap justify-center items-center gap-4 px-4 py-6 max-w-3xl mx-auto">
            {donors.map((donor, index) => (
              <DonorCard key={`stacked-${donor.name}-${index}`} donor={donor} index={index} />
            ))}
          </div>
        )}

        {/* Decorative divider after marquee */}
        <div className="flex items-center justify-center gap-4 mt-10 px-4">
          <div className="h-px w-20 bg-gradient-to-r from-transparent to-primary/30" />
          <Sparkles className="h-5 w-5 text-primary/40" />
          <div className="h-px w-20 bg-gradient-to-l from-transparent to-primary/30" />
        </div>

        <ScrollReveal direction="up" delay={200}>
          <div className="text-center mt-14 px-4">
            <div className="inline-flex items-center bg-card/90 backdrop-blur-md border border-border px-6 py-3 rounded-full shadow-sm">
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
