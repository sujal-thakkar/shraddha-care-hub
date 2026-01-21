import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Heart, Users, Brain, Phone, CheckCircle, ArrowRight, Mail } from "lucide-react";

import corporateCareHeroBg from "@/assets/corporate-care-hero-bg.jpg";

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
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src={corporateCareHeroBg} 
            alt="" 
            className="w-full h-full object-cover"
          />
          {/* Purple/Blue gradient overlay */}
          <div 
            className="absolute inset-0" 
            style={{ 
              background: 'linear-gradient(to bottom, rgba(88, 55, 163, 0.85), rgba(55, 100, 180, 0.75), rgba(88, 55, 163, 0.90))' 
            }} 
          />
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
              <Building2 className="h-4 w-4" />
              B2B Partnership Program
            </div>
            <h1 className="font-serif text-4xl lg:text-6xl font-bold text-primary-foreground drop-shadow-lg">
              Corporate Parental Care
            </h1>
            <p className="text-lg lg:text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Partner with Shraddha to extend care to your employees' parents. 
              Because when their families are supported, your team thrives.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg" className="bg-white text-[hsl(250_70%_45%)] hover:bg-[hsl(250_70%_45%)] hover:text-white transition-colors">
                <a href="mailto:hoslacare@gmail.com?subject=Corporate Partnership Inquiry">
                  <Mail className="mr-2 h-4 w-4" />
                  Partner With Us
                </a>
              </Button>
              <Button asChild size="lg" className="bg-[hsl(250_70%_45%)] text-white hover:bg-[hsl(250_70%_55%)] transition-colors">
                <a href="tel:7811009309">
                  <Phone className="mr-2 h-4 w-4" />
                  Call Us
                </a>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
          </svg>
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
