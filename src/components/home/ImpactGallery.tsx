import { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
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
  { src: elderAbuseAwareness, alt: "World Elder Abuse Awareness Day 2024" },
  { src: clothDistribution, alt: "Cloth distribution to seniors by Shraddha" },
  { src: impactImg1, alt: "Awareness session with community members" },
  { src: impactImg2, alt: "Educational outreach program" },
  { src: impactImg3, alt: "Community engagement with children and seniors" },
  { src: impactImg4, alt: "Award ceremony recognition" },
  { src: impactImg5, alt: "Mobile awareness campaign" },
  { src: impactImg6, alt: "Cloth donation drive" },
];

export const ImpactGallery = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      {/* Main Carousel */}
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
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
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedImage !== null && (
        <div 
          className="fixed inset-0 z-50 bg-foreground/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-background hover:text-primary transition-colors text-lg font-medium"
            >
              Close ✕
            </button>
            <img
              src={impactImages[selectedImage].src}
              alt={impactImages[selectedImage].alt}
              className="w-full h-full object-contain rounded-lg"
            />
            <p className="text-center text-background/80 mt-4 text-sm">
              {impactImages[selectedImage].alt}
            </p>
            
            {/* Navigation buttons */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage((selectedImage - 1 + impactImages.length) % impactImages.length);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/20 hover:bg-background/40 text-background p-3 rounded-full transition-colors"
            >
              ←
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage((selectedImage + 1) % impactImages.length);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/20 hover:bg-background/40 text-background p-3 rounded-full transition-colors"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
