import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Marquee } from "@/components/ui/marquee";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { PartnerContactModal } from "@/components/corporate/PartnerContactModal";
import { Building2, Phone, CheckCircle, ArrowRight, Mail, Quote } from "lucide-react";

import corporateCareHeroBg from "@/assets/corporate-care-hero-bg.jpg";
import cpcMentalHealth from "@/assets/cpc-mental-health.png";
import cpcCompanionship from "@/assets/cpc-companionship.png";
import cpcWellness from "@/assets/cpc-wellness.png";
import cpcHelpline from "@/assets/cpc-helpline.png";
import cpcBenefits1 from "@/assets/cpc-benefits-1.png";
import cpcBenefits2 from "@/assets/cpc-benefits-2.png";
import cpcBenefits3 from "@/assets/cpc-benefits-3.png";

export default function CorporateCare() {
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [currentBenefitImage, setCurrentBenefitImage] = useState(0);
  
  const benefitImages = [cpcBenefits1, cpcBenefits2, cpcBenefits3];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBenefitImage((prev) => (prev + 1) % benefitImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [benefitImages.length]);
  const features = [
    {
      image: cpcMentalHealth,
      title: "Mental Health Support",
      description: "Regular counseling and emotional support for your employees' parents, helping them navigate life's challenges."
    },
    {
      image: cpcCompanionship,
      title: "Companionship Programs",
      description: "Trained volunteers provide regular visits and calls, ensuring seniors never feel alone or isolated."
    },
    {
      image: cpcWellness,
      title: "Wellness Activities",
      description: "Organized activities, virtual and in-person, that keep seniors engaged, active, and connected."
    },
    {
      image: cpcHelpline,
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

  const testimonials = [
    {
      quote: "Shraddha's Corporate Parental Care program has been a game-changer for our employees. They now work with peace of mind knowing their parents are well cared for.",
      author: "Priya Sharma",
      role: "HR Director",
      company: "TechVision Solutions"
    },
    {
      quote: "The positive impact on employee morale and productivity has exceeded our expectations. This partnership truly reflects our values as a people-first organization.",
      author: "Rajesh Kumar",
      role: "CEO",
      company: "Innovate Industries"
    },
    {
      quote: "Our team members feel valued and supported. The regular updates and professional care provided by Shraddha have strengthened our employee engagement significantly.",
      author: "Anita Desai",
      role: "Head of People Operations",
      company: "GlobalTech Corp"
    }
  ];

  const partnerCompanies = [
    { name: "TechVision", abbr: "TV" },
    { name: "Innovate Industries", abbr: "II" },
    { name: "GlobalTech", abbr: "GT" },
    { name: "Sunrise Corp", abbr: "SC" },
    { name: "Nexus Systems", abbr: "NS" },
    { name: "Horizon Group", abbr: "HG" },
    { name: "Vertex Solutions", abbr: "VS" },
    { name: "Prime Tech", abbr: "PT" },
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
              <Button 
                size="lg" 
                className="bg-white text-[hsl(250_70%_45%)] hover:bg-white/90"
                onClick={() => setIsPartnerModalOpen(true)}
              >
                <Mail className="mr-2 h-4 w-4" />
                Partner With Us
              </Button>
              <Button asChild variant="heroOutline" size="lg" className="hover:text-[hsl(250_70%_45%)]">
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
      <section className="relative py-16 lg:py-24 bg-background overflow-hidden">
        {/* Subtle purple dot pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(250, 70%, 45%) 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />
        <div className="container relative z-10">
          <ScrollReveal>
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
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <ScrollReveal key={index} delay={index * 100} direction="up">
                <div 
                  className="group relative h-64 md:h-72 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {/* Background Image */}
                  <img 
                    src={feature.image} 
                    alt={feature.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  
                  {/* Gradient Overlay */}
                  <div 
                    className="absolute inset-0 transition-opacity duration-300"
                    style={{
                      background: 'linear-gradient(to top, rgba(88, 55, 163, 0.95) 0%, rgba(88, 55, 163, 0.7) 40%, rgba(55, 100, 180, 0.3) 100%)'
                    }}
                  />
                  
                  {/* Content */}
                  <div className="relative h-full flex flex-col justify-end p-6 text-white">
                    <h3 className="font-serif text-xl md:text-2xl font-bold mb-2 drop-shadow-lg">
                      {feature.title}
                    </h3>
                    <p className="text-white/90 text-sm md:text-base leading-relaxed drop-shadow">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="relative py-16 lg:py-24 overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(88, 55, 163, 0.05) 0%, rgba(120, 80, 200, 0.08) 100%)' }}>
        {/* Subtle diagonal lines pattern */}
        <div 
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, hsl(250, 70%, 45%) 0, hsl(250, 70%, 45%) 1px, transparent 0, transparent 50%)`,
            backgroundSize: '16px 16px'
          }}
        />
        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal direction="left">
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
                      <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'hsl(250, 70%, 45%)' }} />
                      <span className="text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right" delay={200}>
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-xl">
                {benefitImages.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Corporate benefits ${index + 1}`}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                      index === currentBenefitImage ? "opacity-100" : "opacity-0"
                    }`}
                  />
                ))}
                {/* Progress indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {benefitImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentBenefitImage(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentBenefitImage 
                          ? "bg-white w-6" 
                          : "bg-white/50 hover:bg-white/75"
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-16 lg:py-24 bg-background overflow-hidden">
        {/* Subtle circle pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at center, hsl(250, 70%, 45%) 0, hsl(250, 70%, 45%) 2px, transparent 2px, transparent 100%)`,
            backgroundSize: '48px 48px'
          }}
        />
        <div className="container relative z-10">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
                How It Works
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                A simple, streamlined process to get started with Corporate Parental Care.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Connect", description: "Reach out to discuss your organization's needs" },
              { step: "2", title: "Customize", description: "We design a program tailored to your workforce" },
              { step: "3", title: "Onboard", description: "Employees enroll their parents in the program" },
              { step: "4", title: "Care", description: "We provide ongoing support and regular reports" },
            ].map((item, index) => (
              <ScrollReveal key={index} delay={index * 150}>
                <div className="text-center space-y-4">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto text-2xl font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, hsl(250, 70%, 45%), hsl(220, 70%, 50%))' }}
                  >
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  {index < 3 && (
                    <ArrowRight className="h-6 w-6 mx-auto hidden md:block" style={{ color: 'hsl(250, 50%, 60%)' }} />
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Logos Strip */}
      <section className="py-12 bg-card border-y border-border/50 overflow-hidden">
        <ScrollReveal>
          <div className="container">
            <p className="text-center text-sm text-muted-foreground mb-8 uppercase tracking-wider font-medium">
              Trusted by Leading Organizations
            </p>
          </div>
        </ScrollReveal>
        <Marquee pauseOnHover speed="slow" className="py-4">
          {partnerCompanies.map((company, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 px-6 py-4 rounded-xl border border-border/50 bg-background hover:border-[hsl(250,70%,45%)]/30 hover:shadow-lg transition-all duration-300 min-w-[180px]"
            >
              {/* Logo placeholder with initials */}
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ 
                  background: `linear-gradient(135deg, hsl(${250 + index * 15}, 60%, 50%), hsl(${220 + index * 10}, 65%, 55%))`
                }}
              >
                {company.abbr}
              </div>
              <span 
                className="font-semibold text-base whitespace-nowrap"
                style={{ color: 'hsl(250, 40%, 35%)' }}
              >
                {company.name}
              </span>
            </div>
          ))}
        </Marquee>
      </section>

      {/* Testimonials */}
      <section 
        className="relative py-16 lg:py-24 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(88, 55, 163, 0.08) 0%, rgba(120, 80, 200, 0.12) 100%)' }}
      >
        {/* Decorative quote marks */}
        <div className="absolute top-10 left-10 opacity-5">
          <Quote className="w-32 h-32" style={{ color: 'hsl(250, 70%, 45%)' }} />
        </div>
        <div className="absolute bottom-10 right-10 opacity-5 rotate-180">
          <Quote className="w-32 h-32" style={{ color: 'hsl(250, 70%, 45%)' }} />
        </div>
        
        <div className="container relative z-10">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
                What Our Partners Say
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Hear from organizations that have transformed their employee experience with our program.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <ScrollReveal key={index} delay={index * 150}>
                <div 
                  className="relative bg-background rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50 group h-full"
                >
                  {/* Purple accent line */}
                  <div 
                    className="absolute top-0 left-6 right-6 h-1 rounded-b-full"
                    style={{ background: 'linear-gradient(90deg, hsl(250, 70%, 45%), hsl(220, 70%, 50%))' }}
                  />
                  
                  <Quote 
                    className="w-8 h-8 mb-4 opacity-20 group-hover:opacity-40 transition-opacity" 
                    style={{ color: 'hsl(250, 70%, 45%)' }}
                  />
                  
                  <p className="text-muted-foreground mb-6 leading-relaxed italic">
                    "{testimonial.quote}"
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ background: 'linear-gradient(135deg, hsl(250, 70%, 45%), hsl(220, 70%, 50%))' }}
                    >
                      {testimonial.author.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      <p className="text-sm font-medium" style={{ color: 'hsl(250, 70%, 45%)' }}>{testimonial.company}</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <ScrollReveal>
        <section 
          className="py-16 lg:py-24 text-white"
          style={{
            background:
              "radial-gradient(900px circle at 20% 20%, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0) 45%), radial-gradient(800px circle at 80% 75%, rgba(255, 255, 255, 0.10) 0%, rgba(255, 255, 255, 0) 40%), linear-gradient(135deg, rgba(88, 55, 163, 0.88) 0%, rgba(55, 100, 180, 0.80) 55%, rgba(88, 55, 163, 0.90) 100%)",
          }}
        >
          <div className="container text-center space-y-6">
            <h2 className="font-serif text-3xl lg:text-4xl font-bold">
              Ready to Support Your Team's Families?
            </h2>
            <p className="text-white/80 max-w-2xl mx-auto">
              Join leading organizations who trust Shraddha to care for their employees' parents. 
              Let's discuss how we can create a customized program for your team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                className="bg-white text-[hsl(250_70%_45%)] hover:bg-white/90 hover:text-[hsl(220_70%_50%)]"
                onClick={() => setIsPartnerModalOpen(true)}
              >
                Request a Consultation
              </Button>
              <Button asChild variant="heroOutline" size="lg" className="hover:bg-white hover:text-[hsl(250_70%_45%)]">
                <Link to="/contact">
                  Contact Us
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <PartnerContactModal 
        open={isPartnerModalOpen} 
        onOpenChange={setIsPartnerModalOpen} 
      />
    </Layout>
  );
}
