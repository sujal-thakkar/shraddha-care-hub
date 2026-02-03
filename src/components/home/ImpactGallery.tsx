import { useState, useEffect, useCallback } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

// Import all impact images
import impactImg1 from "@/assets/impact-img1.jpg";
import impactImg2 from "@/assets/impact-img2.jpg";
import impactImg3 from "@/assets/impact-img3.jpg";
import impactImg4 from "@/assets/impact-img4.jpg";
import impactImg5 from "@/assets/impact-img5.jpg";
import impactImg6 from "@/assets/impact-img6.jpg";
import elderAbuseAwareness from "@/assets/elder-abuse-awareness.png";
import clothDistribution from "@/assets/cloth-distribution.png";

const impactImages = [
  { 
    src: elderAbuseAwareness, 
    alt: "World Elder Abuse Awareness Day 2024",
    caption: "World Elder Abuse Awareness Day 2024",
    description: "Shraddha organized awareness programs across multiple locations to mark World Elder Abuse Awareness Day, educating communities about the rights of senior citizens."
  },
  { 
    src: clothDistribution, 
    alt: "Cloth distribution to seniors by Shraddha",
    caption: "Festival Cloth Distribution",
    description: "Our volunteers distributed new clothes to underprivileged seniors during the festive season, bringing joy and dignity to their celebrations."
  },
  { 
    src: impactImg1, 
    alt: "Awareness session with community members",
    caption: "Community Awareness Session",
    description: "Interactive sessions with community members to spread awareness about elder care, mental health support, and available resources for senior citizens."
  },
  { 
    src: impactImg2, 
    alt: "Educational outreach program",
    caption: "Educational Outreach Program",
    description: "Our team conducting educational programs at rehabilitation centers, helping individuals understand the importance of respecting and caring for elders."
  },
  { 
    src: impactImg3, 
    alt: "Community engagement with children and seniors",
    caption: "Intergenerational Bonding",
    description: "Bringing together children and seniors to foster understanding, respect, and meaningful connections across generations."
  },
  { 
    src: impactImg4, 
    alt: "Award ceremony recognition",
    caption: "Recognition & Awards",
    description: "Shraddha Welfare Association receiving recognition for outstanding contribution towards senior citizen welfare and community development."
  },
  { 
    src: impactImg5, 
    alt: "Mobile awareness campaign",
    caption: "Mobile Awareness Campaign",
    description: "Taking our message to the streets with mobile awareness campaigns, reaching communities in remote areas to spread knowledge about elder rights."
  },
  { 
    src: impactImg6, 
    alt: "Cloth donation drive",
    caption: "Festival at Every Home",
    description: "Our 'Festival at Every Home' initiative ensuring that every senior citizen, regardless of their circumstances, can celebrate festivals with new clothes and dignity."
  },
];

export const ImpactGallery = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [isPaused, setIsPaused] = useState(false);

  // Autoplay functionality
  useEffect(() => {
    if (!api || isPaused) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 4000);

    return () => clearInterval(interval);
  }, [api, isPaused]);

  const handleMouseEnter = useCallback(() => setIsPaused(true), []);
  const handleMouseLeave = useCallback(() => setIsPaused(false), []);

  return (
    <div className="space-y-6">
      {/* Main Carousel */}
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {impactImages.map((image, index) => (
            <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
              <div 
                className="overflow-hidden rounded-xl shadow-lg cursor-pointer group aspect-[4/3]"
                onClick={() => setSelectedImage(index)}
              >
              <img
                  src={image.src}
                  alt={image.alt}
                  loading="lazy"
                  width={413}
                  height={310}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-4 bg-background/80 backdrop-blur-sm border-border hover:bg-background" />
        <CarouselNext className="hidden md:flex -right-4 bg-background/80 backdrop-blur-sm border-border hover:bg-background" />
      </Carousel>

      {/* Thumbnail Navigation */}
      <div className="flex justify-center gap-2 overflow-x-auto py-2 px-4">
        {impactImages.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(index)}
            className={`flex-shrink-0 w-16 h-12 rounded-md overflow-hidden border-2 transition-all duration-300 ${
              selectedImage === index 
                ? "border-primary ring-2 ring-primary/30" 
                : "border-border hover:border-primary/50"
            }`}
          >
            <img
              src={image.src}
              alt={image.alt}
              loading="lazy"
              width={64}
              height={48}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedImage !== null && (
        <div 
          className="fixed inset-0 z-[100] bg-foreground/95 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative max-w-5xl max-h-[90vh] w-full flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-background hover:text-primary transition-colors text-lg font-medium z-10"
            >
              Close ✕
            </button>
            
            <div className="relative flex-1 min-h-0">
              <img
                src={impactImages[selectedImage].src}
                alt={impactImages[selectedImage].alt}
                loading="eager"
                className="w-full h-full object-contain rounded-lg max-h-[60vh]"
              />
              
              {/* Navigation buttons */}
              <button
                onClick={() => setSelectedImage((selectedImage - 1 + impactImages.length) % impactImages.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/20 hover:bg-background/40 text-background p-3 rounded-full transition-colors"
              >
                ←
              </button>
              <button
                onClick={() => setSelectedImage((selectedImage + 1) % impactImages.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/20 hover:bg-background/40 text-background p-3 rounded-full transition-colors"
              >
                →
              </button>
            </div>
            
            {/* Caption and Description */}
            <div className="mt-4 text-center px-4 space-y-2">
              <h3 className="text-xl font-serif font-semibold text-background">
                {impactImages[selectedImage].caption}
              </h3>
              <p className="text-background/80 text-sm max-w-2xl mx-auto leading-relaxed">
                {impactImages[selectedImage].description}
              </p>
              <p className="text-background/50 text-xs mt-2">
                {selectedImage + 1} / {impactImages.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
