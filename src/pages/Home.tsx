import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, Users, Megaphone, Building2, ArrowRight, Shield, HandHeart, Heart } from "lucide-react";
import hoslaLogo from "@/assets/hosla-logo.png";
import knowMoreBubble from "@/assets/know-more-bubble.jpg";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { FloatingElements } from "@/components/home/FloatingElements";
import { AnimatedHeroText } from "@/components/home/AnimatedHeroText";
import ServiceCard from "@/components/home/ServiceCard";
import { ImpactGallery } from "@/components/home/ImpactGallery";

// Import hover images
import legalAwarenessHover from "@/assets/legal-awareness-hover.jpg";
import holisticWellbeingHover from "@/assets/holistic-wellbeing-hover.jpg";
import publicSensitizationHover from "@/assets/public-sensitization-hover.jpg";
import corporateHandshake from "@/assets/corporate-handshake.png";

export default function Home() {

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-4rem)] bg-gradient-to-br from-accent via-background to-accent/50 py-16 lg:py-24 overflow-hidden">
        {/* Animated background elements */}
        <FloatingElements />

        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Text content with animations */}
            <div className="space-y-6 animate-fade-in">
              <div className="relative inline-flex items-center">
                <a
                  href="https://hosla.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-sm font-medium border border-primary/20 transition-all duration-300 hover:bg-primary/20 hover:border-primary/40 hover:scale-105 hover:shadow-md cursor-pointer"
                >
                  <span className="text-muted-foreground">Backed by</span>
                  <img src={hoslaLogo} alt="Hosla" className="h-5 w-auto" />
                </a>
                <a
                  href="https://hosla.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute -right-28 -top-10 w-24 h-auto transition-all duration-300 hover:scale-110 hover:brightness-110 drop-shadow-lg"
                >
                  <img src={knowMoreBubble} alt="Click to Know More" className="w-40 h-auto animate-float-bounce" />
                </a>
              </div>

              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Dignity and Protection for <br className="hidden sm:inline lg:hidden" /><AnimatedHeroText />
              </h1>

              <p className="text-lg lg:text-xl text-muted-foreground max-w-lg">
                Shraddha is dedicated to protecting, supporting, and empowering senior citizens across India. Together,
                we're building an extended family for those who need it most.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button asChild size="lg" className="group">
                  <Link to="/about">
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="group">
                  <Link to="/donate">
                    <Heart className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                    Support Our Cause
                  </Link>
                </Button>
              </div>
            </div>

            {/* Carousel */}
            <div className="relative animate-scale-in">
              <HeroCarousel />

              {/* Decorative elements around carousel */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-xl" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-accent rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">Our Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive support for seniors through awareness, care, and advocacy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ServiceCard
              icon={<Scale className="h-6 w-6" />}
              title="Legal Awareness"
              description="Educating seniors about their legal rights and protections under Indian law."
              linkTo="/legal-resources"
              linkText="Learn about your rights"
              hoverImage={legalAwarenessHover}
            />

            <ServiceCard
              icon={<HandHeart className="h-6 w-6" />}
              title="Holistic Well-being"
              description="Mental health support, companionship programs, and wellness activities for seniors."
              linkTo="/about"
              linkText="Explore programs"
              hoverImage={holisticWellbeingHover}
            />

            <ServiceCard
              icon={<Megaphone className="h-6 w-6" />}
              title="Public Sensitization"
              description="Campaigns and awareness programs against elder abuse in communities."
              linkTo="/volunteer"
              linkText="Join the movement"
              hoverImage={publicSensitizationHover}
            />
          </div>
        </div>
      </section>

      {/* Impact Gallery */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">Our Impact</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Making a difference in the lives of seniors across communities.
            </p>
          </div>

          <ImpactGallery />
        </div>
      </section>

      {/* Corporate Care CTA */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent via-accent/80 to-primary/10">
            {/* Content wrapper */}
            <div className="relative z-10 flex flex-col lg:flex-row items-center">
              {/* Text content - left side */}
              <div className="flex-1 p-8 lg:p-12 lg:pr-0 space-y-5">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/10 text-foreground text-sm font-medium">
                  <Building2 className="h-4 w-4" />
                  For Businesses
                </div>
                
                <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                  Corporate Parental<br />Care Program
                </h2>
                
                <p className="text-muted-foreground max-w-md leading-relaxed">
                  Partner with Shraddha to support the parents of your employees. We provide mental health support, companionship, and engagement programs for the senior family members of your workforce.
                </p>
                
                <Button asChild size="lg" className="group bg-foreground hover:bg-foreground/90 text-background">
                  <Link to="/corporate-care">
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
              
              {/* Illustration - right side */}
              <div className="flex-shrink-0 w-full lg:w-1/2 flex justify-center lg:justify-end">
                <img 
                  src={corporateHandshake} 
                  alt="Corporate partnership illustration" 
                  className="w-full max-w-lg lg:max-w-none lg:w-full h-auto object-contain"
                />
              </div>
            </div>
            
            {/* Decorative sparkle elements */}
            <div className="absolute top-8 right-8 text-primary/30">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z"/>
              </svg>
            </div>
            <div className="absolute bottom-8 left-8 text-primary/20">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Shield className="h-16 w-16 text-primary mx-auto" />
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground">Our Mission</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              "To create a society where every senior citizen lives with dignity, free from abuse, neglect, and
              isolation. We believe in building an extended family that cares, protects, and empowers our elders."
            </p>

            {/* Impact Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Seniors Supported</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-primary">50+</div>
                <div className="text-sm text-muted-foreground">Legal Awareness Camps</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-primary">100+</div>
                <div className="text-sm text-muted-foreground">Active Volunteers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-primary">10+</div>
                <div className="text-sm text-muted-foreground">Cities Reached</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
        <div className="container text-center space-y-6">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold">Ready to Make a Difference?</h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto">
            Join our mission to protect and support senior citizens. Whether you volunteer, donate, or partner with us,
            every contribution matters.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild variant="secondary" size="lg">
              <Link to="/volunteer">Become a Volunteer</Link>
            </Button>
            <Button asChild variant="heroOutline" size="lg">
              <Link to="/donate">Donate Now</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
