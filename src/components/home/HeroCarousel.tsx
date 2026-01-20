import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

// Import images
import awarenessBanner from "@/assets/awareness-banner.png";
import elderAbuseAwareness from "@/assets/elder-abuse-awareness.png";
import clothDistribution from "@/assets/cloth-distribution.png";
import teamEvent from "@/assets/team-event.png";
import orgCollage from "@/assets/org-collage.png";
import heroIllustration1 from "@/assets/hero-illustration-1.jpg";

const heroImages = [
  { src: awarenessBanner, alt: "Stop Domestic Abuse of Elderly" },
  { src: heroIllustration1, alt: "Family caring for seniors illustration" },
  { src: elderAbuseAwareness, alt: "World Elder Abuse Awareness Day" },
  { src: clothDistribution, alt: "Cloth distribution to seniors" },
  { src: teamEvent, alt: "Team event" },
  { src: orgCollage, alt: "Organization activities collage" },
];

export function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % heroImages.length);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  return (
    <div 
      className="relative w-full aspect-[4/3] md:aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl group"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Images */}
      {heroImages.map((image, index) => (
        <div
          key={index}
          className={cn(
            "absolute inset-0 transition-all duration-700 ease-in-out",
            index === currentIndex 
              ? "opacity-100 scale-100" 
              : "opacity-0 scale-105"
          )}
        >
          <img
            src={image.src}
            alt={image.alt}
            className="w-full h-full object-cover"
          />
        </div>
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />

      {/* Dots indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              index === currentIndex 
                ? "bg-primary-foreground w-6" 
                : "bg-primary-foreground/50 hover:bg-primary-foreground/75"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
