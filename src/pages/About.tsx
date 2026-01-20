import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Target, Award, Quote, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TeamSection } from "@/components/team/TeamSection";

// Import real images
import orgCollage from "@/assets/org-collage.png";
import awarenessCamp from "@/assets/awareness-camp.png";
import clothDistribution from "@/assets/cloth-distribution.png";
import eventPurulia from "@/assets/event-purulia.png";
import teamEvent from "@/assets/team-event.png";
import hoslaBooth from "@/assets/hosla-booth.png";

export default function About() {
  const { data: successStories } = useQuery({
    queryKey: ["success-stories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("success_stories")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(6);
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <Layout>
      {/* Hero */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src={teamEvent} 
            alt="" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/85 via-primary/75 to-primary/90" />
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-primary-foreground/20 rounded-full animate-float-bounce" />
        <div className="absolute bottom-16 right-16 w-32 h-32 border-2 border-primary-foreground/10 rounded-full" />
        <div className="absolute top-1/4 right-10 w-4 h-4 bg-primary-foreground/30 rounded-full animate-pulse" />
        <div className="absolute bottom-1/3 left-16 w-6 h-6 bg-primary-foreground/20 rounded-full animate-pulse" />
        <div className="absolute top-20 right-1/4 w-16 h-16 border border-primary-foreground/15 rotate-45" />
        <div className="absolute bottom-10 left-1/4 w-12 h-12 border border-primary-foreground/10 rotate-12 rounded-lg" />
        
        {/* Content */}
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground px-4 py-2 rounded-full text-sm font-medium border border-primary-foreground/20">
              <Heart className="h-4 w-4" />
              Serving Seniors Since 2020
            </div>
            <h1 className="font-serif text-4xl lg:text-6xl font-bold text-primary-foreground drop-shadow-lg">
              About Shraddha
            </h1>
            <p className="text-lg lg:text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Our journey, our mission, and the impact we're creating together for elderly welfare across India.
            </p>
          </div>
        </div>
        
        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
          </svg>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                <Heart className="h-4 w-4" />
                Our Story
              </div>
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground">
                Born from Compassion, Backed by Hosla
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Shraddha was founded with a simple yet powerful vision: to ensure that every 
                senior citizen in India lives with dignity and respect. Backed by Hosla, 
                we draw inspiration from the timeless values championed by leaders like Ratan Tata - 
                compassion, integrity, and an unwavering commitment to serving others.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our name "Shraddha" means devotion and respect - the very foundation upon which 
                our organization stands. We believe that caring for our elders is not just a duty, 
                but a privilege.
              </p>
            </div>
            <div className="relative">
              <img 
                src={orgCollage} 
                alt="Shraddha Welfare Association activities and team" 
                className="rounded-2xl shadow-lg w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* The Why */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Target className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
                The "Why" Behind Our Mission
              </h2>
            </div>
            
            <Card className="border-primary/20">
              <CardContent className="p-8 space-y-6">
                <div className="flex gap-4">
                  <Quote className="h-8 w-8 text-primary flex-shrink-0" />
                  <p className="text-lg text-muted-foreground italic leading-relaxed">
                    "The pandemic showed us how isolated our seniors truly are. Locked away from 
                    their families, many faced not just physical challenges, but profound loneliness 
                    and fear. We realized then that our elders needed more than occasional visits - 
                    they needed an extended family."
                  </p>
                </div>
                <p className="text-muted-foreground leading-relaxed pl-12">
                  This realization became the driving force behind Shraddha. We're not just an 
                  organization - we're a movement to rebuild the bonds of care, respect, and 
                  protection that every senior deserves. We stand against elder abuse, fight 
                  for their rights, and provide the companionship that makes life meaningful.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Photo Gallery */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Our Work in Action
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Glimpses from our awareness camps, events, and community programs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="aspect-video overflow-hidden rounded-xl shadow-md">
              <img 
                src={awarenessCamp} 
                alt="Awareness camp conducted by Shraddha" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="aspect-video overflow-hidden rounded-xl shadow-md">
              <img 
                src={clothDistribution} 
                alt="Cloth distribution to seniors" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="aspect-video overflow-hidden rounded-xl shadow-md">
              <img 
                src={eventPurulia} 
                alt="Senior citizen event in Purulia" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="aspect-video overflow-hidden rounded-xl shadow-md">
              <img 
                src={hoslaBooth} 
                alt="Hosla community booth" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="container">
          <div className="text-center mb-12">
            <Star className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Success Stories
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Real stories of impact from the seniors and families we've had the privilege to support.
            </p>
          </div>

          {successStories && successStories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {successStories.map((story) => (
                <Card key={story.id} className="border-border hover:border-primary/50 transition-colors">
                  {story.image_url && (
                    <div className="aspect-video overflow-hidden rounded-t-lg">
                      <img 
                        src={story.image_url} 
                        alt={story.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-serif text-lg font-semibold text-foreground">
                      {story.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-4">
                      {story.content}
                    </p>
                    {story.author_name && (
                      <div className="pt-4 border-t border-border">
                        <p className="text-sm font-medium text-foreground">{story.author_name}</p>
                        {story.author_role && (
                          <p className="text-xs text-muted-foreground">{story.author_role}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Placeholder stories with real images */}
              {[
                {
                  title: "A New Beginning for Mr. Sharma",
                  content: "After losing his wife, Mr. Sharma felt completely alone. Through our companionship program, he found a new community and purpose. Today, he volunteers to help other seniors.",
                  author: "The Sharma Family",
                  role: "Kolkata",
                  image: awarenessCamp
                },
                {
                  title: "Justice for Mrs. Devi",
                  content: "When her children tried to take her property illegally, our legal awareness team helped Mrs. Devi understand her rights and fight back. She now lives peacefully in her own home.",
                  author: "Mrs. Kamala Devi",
                  role: "Senior Citizen",
                  image: hoslaBooth
                },
                {
                  title: "Community Support Program",
                  content: "Our partnership with local communities has transformed how they support senior citizens. Regular check-ins and wellness programs have improved family bonds.",
                  author: "Community Leader",
                  role: "Bishnupur, Bankura",
                  image: clothDistribution
                }
              ].map((story, index) => (
                <Card key={index} className="border-border hover:border-primary/50 transition-colors">
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img 
                      src={story.image} 
                      alt={story.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-serif text-lg font-semibold text-foreground">
                      {story.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {story.content}
                    </p>
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm font-medium text-foreground">{story.author}</p>
                      <p className="text-xs text-muted-foreground">{story.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Achievements */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <Award className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Our Achievements
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Milestones we've reached together with our community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { number: "500+", label: "Seniors Supported", description: "Direct care and support" },
              { number: "50+", label: "Legal Awareness Camps", description: "Educating communities" },
              { number: "100+", label: "Active Volunteers", description: "Dedicated team members" },
              { number: "10+", label: "Cities Reached", description: "Expanding our presence" },
            ].map((stat, index) => (
              <Card key={index} className="text-center border-border">
                <CardContent className="p-6 space-y-2">
                  <div className="text-4xl font-bold text-primary">{stat.number}</div>
                  <div className="font-semibold text-foreground">{stat.label}</div>
                  <div className="text-sm text-muted-foreground">{stat.description}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <TeamSection />
    </Layout>
  );
}
