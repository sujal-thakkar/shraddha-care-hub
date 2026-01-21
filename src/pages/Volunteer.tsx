import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Users, Clock, MapPin, CheckCircle, Loader2, HandHeart, Phone, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Volunteer() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    motivation: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: application, error } = await supabase
        .from("volunteer_applications")
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          city: formData.city,
          motivation: formData.motivation,
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger email notification
      try {
        await supabase.functions.invoke("send-notification", {
          body: { 
            type: "volunteer_application", 
            applicationId: application.id,
            email: formData.email, 
            name: formData.name 
          },
        });
      } catch (emailError) {
        console.error("Email notification error:", emailError);
      }

      setSubmitted(true);
      toast({
        title: "Application Submitted!",
        description: "Thank you for your interest. We'll be in touch soon!",
      });
    } catch (error) {
      console.error("Error submitting application:", error);
      toast({
        title: "Error",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activities = [
    {
      icon: Phone,
      title: "Companion Calls",
      description: "Regular phone calls to seniors to combat loneliness and provide emotional support."
    },
    {
      icon: Users,
      title: "Home Visits",
      description: "In-person visits to seniors in your area, bringing companionship and checking on their well-being."
    },
    {
      icon: BookOpen,
      title: "Legal Awareness Camps",
      description: "Help organize and conduct camps to educate seniors about their legal rights."
    },
    {
      icon: HandHeart,
      title: "Wellness Programs",
      description: "Assist with organizing health camps, yoga sessions, and recreational activities."
    }
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-accent to-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Users className="h-16 w-16 text-primary mx-auto" />
            <h1 className="font-serif text-4xl lg:text-5xl font-bold text-foreground">
              Volunteer With Us
            </h1>
            <p className="text-lg text-muted-foreground">
              Join our community of caring individuals making a difference in the lives of seniors.
            </p>
          </div>
        </div>
      </section>

      {/* Why Volunteer */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Why Volunteer with Shraddha?
              </h2>
              <p className="text-muted-foreground">
                Your time and compassion can transform the life of a senior citizen.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="text-center border-border">
                <CardContent className="p-6 space-y-4">
                  <Heart className="h-10 w-10 text-primary mx-auto" />
                  <h3 className="font-semibold text-foreground">Make Real Impact</h3>
                  <p className="text-sm text-muted-foreground">
                    Your visits and calls become highlights in seniors' days. Small gestures mean everything.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-border">
                <CardContent className="p-6 space-y-4">
                  <Clock className="h-10 w-10 text-primary mx-auto" />
                  <h3 className="font-semibold text-foreground">Flexible Commitment</h3>
                  <p className="text-sm text-muted-foreground">
                    Give as little as 2 hours a week. We work around your schedule.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-border">
                <CardContent className="p-6 space-y-4">
                  <MapPin className="h-10 w-10 text-primary mx-auto" />
                  <h3 className="font-semibold text-foreground">Local Opportunities</h3>
                  <p className="text-sm text-muted-foreground">
                    Volunteer in your own neighborhood or even from home through calls.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Volunteer Activities */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
                What You'll Do
              </h2>
              <p className="text-muted-foreground">
                Various ways you can contribute based on your skills and availability.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activities.map((activity, index) => (
                <Card key={index} className="border-border hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <activity.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="font-serif">{activity.title}</CardTitle>
                    <CardDescription>{activity.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Signup Form */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Join Our Team
              </h2>
              <p className="text-muted-foreground">
                Fill out the form below and we'll get in touch with next steps.
              </p>
            </div>

            {submitted ? (
              <Card className="border-primary">
                <CardContent className="p-8 text-center space-y-4">
                  <CheckCircle className="h-16 w-16 text-primary mx-auto" />
                  <h3 className="font-serif text-2xl font-bold text-foreground">
                    Application Received!
                  </h3>
                  <p className="text-muted-foreground">
                    Thank you for your interest in volunteering with Shraddha. 
                    Our team will review your application and contact you within 48 hours.
                  </p>
                  <Button onClick={() => setSubmitted(false)}>
                    Submit Another Application
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border">
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="your.email@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Your city"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="motivation">Why do you want to volunteer? *</Label>
                      <Textarea
                        id="motivation"
                        required
                        value={formData.motivation}
                        onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                        placeholder="Tell us a bit about yourself and why you're interested in volunteering with Shraddha..."
                        className="min-h-[120px]"
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Application"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* What Happens Next */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
                What Happens Next?
              </h2>
              <p className="text-muted-foreground">
                Our simple onboarding process to get you started.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: "1", title: "Apply", description: "Submit your application through this form" },
                { step: "2", title: "Connect", description: "Our team will reach out for a brief conversation" },
                { step: "3", title: "Train", description: "Complete our short orientation program" },
                { step: "4", title: "Start", description: "Begin making a difference!" },
              ].map((item, index) => (
                <div key={index} className="text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto text-xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
