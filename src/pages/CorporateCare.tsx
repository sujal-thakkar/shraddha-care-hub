import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Heart, Users, Brain, Phone, CheckCircle, ArrowRight, Mail } from "lucide-react";

export default function CorporateCare() {
  const features = [
    {
      icon: Brain,
      title: "Mental Health Support",
      description: "Regular counseling and emotional support for your employees' parents, helping them navigate life's challenges."
    },
    {
      icon: Users,
      title: "Companionship Programs",
      description: "Trained volunteers provide regular visits and calls, ensuring seniors never feel alone or isolated."
    },
    {
      icon: Heart,
      title: "Wellness Activities",
      description: "Organized activities, virtual and in-person, that keep seniors engaged, active, and connected."
    },
    {
      icon: Phone,
      title: "24/7 Helpline",
      description: "Round-the-clock support for emergencies, ensuring help is always just a call away."
    }
  ];

  const benefits = [
    "Improved employee retention and satisfaction",
    "Reduced absenteeism due to family care concerns",
    "Enhanced company reputation as a caring employer",
    "Tax benefits under CSR initiatives",
    "Customized programs for your workforce size",
    "Regular impact reports and feedback"
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-accent to-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <Building2 className="h-4 w-4" />
              B2B Partnership Program
            </div>
            <h1 className="font-serif text-4xl lg:text-5xl font-bold text-foreground">
              Corporate Parental Care
            </h1>
            <p className="text-lg text-muted-foreground">
              Partner with Shraddha to extend care to your employees' parents. 
              Because when their families are supported, your team thrives.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg">
                <a href="mailto:hoslacare@gmail.com?subject=Corporate Partnership Inquiry">
                  <Mail className="mr-2 h-4 w-4" />
                  Partner With Us
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="tel:7811009309">
                  <Phone className="mr-2 h-4 w-4" />
                  Call Us
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Why Corporate Parental Care?
            </h2>
            <p className="text-muted-foreground">
              In today's fast-paced world, your employees often worry about their aging parents 
              who live far away. Our program bridges that gap, providing professional care and 
              companionship while your team focuses on work with peace of mind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-border hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-serif">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground">
                Benefits for Your Organization
              </h2>
              <p className="text-muted-foreground">
                Investing in your employees' family well-being creates a ripple effect of 
                positivity throughout your organization.
              </p>
              <ul className="space-y-3">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center">
                <Building2 className="h-32 w-32 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A simple, streamlined process to get started with Corporate Parental Care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Connect", description: "Reach out to discuss your organization's needs" },
              { step: "2", title: "Customize", description: "We design a program tailored to your workforce" },
              { step: "3", title: "Onboard", description: "Employees enroll their parents in the program" },
              { step: "4", title: "Care", description: "We provide ongoing support and regular reports" },
            ].map((item, index) => (
              <div key={index} className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                {index < 3 && (
                  <ArrowRight className="h-6 w-6 text-muted-foreground mx-auto hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
        <div className="container text-center space-y-6">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold">
            Ready to Support Your Team's Families?
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto">
            Join leading organizations who trust Shraddha to care for their employees' parents. 
            Let's discuss how we can create a customized program for your team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild variant="secondary" size="lg">
              <a href="mailto:hoslacare@gmail.com?subject=Corporate Partnership Inquiry">
                Request a Consultation
              </a>
            </Button>
            <Button asChild variant="heroOutline" size="lg">
              <Link to="/contact">
                Contact Us
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
