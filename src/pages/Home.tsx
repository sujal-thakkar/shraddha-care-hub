import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Scale, Users, Megaphone, Building2, ArrowRight, Shield, HandHeart } from "lucide-react";

// Import real images
import awarenessBanner from "@/assets/awareness-banner.png";
import elderAbuseAwareness from "@/assets/elder-abuse-awareness.png";
import clothDistribution from "@/assets/cloth-distribution.png";

export default function Home() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-accent to-background py-20 lg:py-32">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="font-serif text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                Dignity and Protection for <span className="text-primary">Seniors</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Shraddha, backed by Hosla, is dedicated to protecting, supporting, and empowering 
                senior citizens across India. Together, we're building an extended family for those who need it most.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button asChild size="lg">
                  <Link to="/about">
                    Learn More <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/donate">
                    <Heart className="mr-2 h-4 w-4" />
                    Support Our Cause
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <img 
                src={awarenessBanner} 
                alt="Shraddha Welfare Association - Stop Domestic Abuse of Elderly" 
                className="rounded-2xl shadow-xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Our Services
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive support for seniors through awareness, care, and advocacy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Scale className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-serif">Legal Awareness</CardTitle>
                <CardDescription>
                  Educating seniors about their legal rights and protections under Indian law.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/legal-resources" className="text-primary text-sm font-medium hover:underline inline-flex items-center">
                  Learn about your rights <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </CardContent>
            </Card>

            <Card className="border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <HandHeart className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-serif">Holistic Well-being</CardTitle>
                <CardDescription>
                  Mental health support, companionship programs, and wellness activities for seniors.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/about" className="text-primary text-sm font-medium hover:underline inline-flex items-center">
                  Explore programs <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </CardContent>
            </Card>

            <Card className="border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Megaphone className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-serif">Public Sensitization</CardTitle>
                <CardDescription>
                  Campaigns and awareness programs against elder abuse in communities.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/volunteer" className="text-primary text-sm font-medium hover:underline inline-flex items-center">
                  Join the movement <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Impact Gallery */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Our Impact
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Making a difference in the lives of seniors across communities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="overflow-hidden rounded-2xl shadow-lg">
              <img 
                src={elderAbuseAwareness} 
                alt="World Elder Abuse Awareness Day 2024" 
                className="w-full h-auto"
              />
            </div>
            <div className="overflow-hidden rounded-2xl shadow-lg">
              <img 
                src={clothDistribution} 
                alt="Cloth distribution to seniors by Shraddha" 
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Corporate Care CTA */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 to-accent p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1 space-y-4">
                <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  <Building2 className="h-4 w-4" />
                  For Businesses
                </div>
                <h2 className="font-serif text-2xl lg:text-3xl font-bold text-foreground">
                  Corporate Parental Care Program
                </h2>
                <p className="text-muted-foreground max-w-xl">
                  Partner with Shraddha to support the parents of your employees. 
                  We provide mental health support, companionship, and engagement programs 
                  for the senior family members of your workforce.
                </p>
                <Button asChild size="lg">
                  <Link to="/corporate-care">
                    Learn More <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="flex-shrink-0">
                <div className="w-32 h-32 lg:w-48 lg:h-48 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="h-16 w-16 lg:h-24 lg:w-24 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Shield className="h-16 w-16 text-primary mx-auto" />
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground">
              Our Mission
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              "To create a society where every senior citizen lives with dignity, 
              free from abuse, neglect, and isolation. We believe in building an 
              extended family that cares, protects, and empowers our elders."
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
          <h2 className="font-serif text-3xl lg:text-4xl font-bold">
            Ready to Make a Difference?
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto">
            Join our mission to protect and support senior citizens. 
            Whether you volunteer, donate, or partner with us, every contribution matters.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild variant="secondary" size="lg">
              <Link to="/volunteer">
                Become a Volunteer
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              <Link to="/donate">
                Donate Now
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
