import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Target, Award, Quote, Star, Facebook, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TeamSection } from "@/components/team/TeamSection";
import { WorkGallery } from "@/components/about/WorkGallery";

// Import real images
import orgCollage from "@/assets/org-collage.png";
import teamEvent from "@/assets/team-event.png";

// Import success story images
import successStory1 from "@/assets/success-story-1.jpg";
import successStory2a from "@/assets/success-story-2a.jpg";
import successStory2b from "@/assets/success-story-2b.jpg";
import successStory3 from "@/assets/success-story-3.jpg";

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
      <WorkGallery />

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
              {/* Story 1 - Joy Through Service */}
              {[
                {
                  title: "A Stream of Joy Through Service",
                  content: "Through Hosla and Shraddha, we experience the eternal truths of Existence, Consciousness, and Bliss. Those connected to our organization not just by work, but by heart and action, are truly experiencing the blissful nature of the soul. For an organization, what greater success can there be than helping people realize inner joy and purpose?",
                  author: "Shraddha Team",
                  role: "Hosla Care Family",
                  images: [successStory1],
                  fbLink: "https://www.facebook.com/share/p/1DjtNL59nX/"
                },
                {
                  title: "Spreading Warmth in Tribal Villages",
                  content: "Winter essentials were distributed at Rupur and Jharul villages in Burdwan. The simplicity of the tribal families — and the happiness they felt receiving warm clothes, fruits, and food — reminded us what real humanity looks like. Moments like these widen not just our reach, but our hearts too.",
                  author: "Shraddha & Hosla Team",
                  role: "Winter Relief Drive, Burdwan",
                  images: [successStory2a, successStory2b],
                  fbLink: "https://www.facebook.com/share/p/17ixHymTaY/"
                },
                {
                  title: "Shri Amiya Dasgupta's Testimonial",
                  content: "At 86 years old, when my son and daughter-in-law had to leave for my granddaughter's treatment, I felt anxious being alone. Hosla immediately assured me — 'We're here with you in every way.' They arranged a trusted night caregiver, and their team calls regularly to check on me. From the beginning, Hosla's slogan has been 'Serving seniors in their time of need' — and they truly live by it.",
                  author: "Shri Amiya Dasgupta",
                  role: "Hosla Member, Age 86",
                  images: [successStory3],
                  fbLink: "https://www.facebook.com/share/p/1DonFcT5pS/"
                }
              ].map((story, index) => (
                <Card key={index} className="group relative border-border hover:border-primary/50 transition-colors overflow-hidden">
                  <div className="relative aspect-video overflow-hidden rounded-t-lg">
                    {story.images.length > 1 ? (
                      <div className="grid grid-cols-2 h-full">
                        {story.images.map((img, imgIdx) => (
                          <img 
                            key={imgIdx}
                            src={img} 
                            alt={`${story.title} - ${imgIdx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ))}
                      </div>
                    ) : (
                      <img 
                        src={story.images[0]} 
                        alt={story.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    {/* Facebook Hover Overlay */}
                    <a 
                      href={story.fbLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/70 to-primary/50 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out translate-y-2 group-hover:translate-y-0"
                    >
                      <div className="flex items-center gap-2 bg-background/20 backdrop-blur-sm px-4 py-2 rounded-full border border-primary-foreground/30">
                        <Facebook className="h-5 w-5 text-primary-foreground" />
                        <span className="text-primary-foreground font-medium text-sm">View on Facebook</span>
                        <ExternalLink className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <p className="text-primary-foreground/80 text-xs">See proof of our impact</p>
                    </a>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-serif text-lg font-semibold text-foreground">
                      {story.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-4">
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
