import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Marquee } from "@/components/ui/marquee";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { PartnerContactModal } from "@/components/corporate/PartnerContactModal";
import { ProjectsEventsSection } from "@/components/corporate/ProjectsEventsSection";
import { Building2, Phone, CheckCircle, ArrowRight, Mail } from "lucide-react";

import corporateCareHeroBg from "@/assets/corporate-care-hero-bg.jpg";
import corporateCtaBg from "@/assets/corporate-cta-bg.jpg";
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

  // Partner logos as static SVG strings - safe hardcoded content
  const partnerLogos = [
    // QuartalAI
    `<svg fill="none" height="48" viewBox="0 0 168 48" width="168" xmlns="http://www.w3.org/2000/svg"><g fill="#0A0D12"><path clip-rule="evenodd" d="m80.735 22.8498c0 5.307-3.48 9.367-8.41 10.208v.841c0 1.363.58 1.856 1.972 1.856h92.883v3.161h-93.115c-3.857 0-5.539-1.392-5.539-4.785v-1.044c-5.017-.812-8.526-4.901-8.526-10.237 0-5.974 4.408-10.382 10.382-10.382 5.945 0 10.353 4.408 10.353 10.382zm-16.356 0c0 3.799 2.494 6.612 5.974 6.612s6.003-2.813 6.003-6.612-2.523-6.641-6.003-6.641-5.974 2.842-5.974 6.641z" fill-rule="evenodd"/><path d="m167.181 12.6998h-4.379v20.3h4.379z"/></g><rect fill="#6938ef" height="48" rx="12" width="48"/></svg>`,
    // Biosynthesis
    `<svg fill="none" height="48" viewBox="0 0 213 48" width="213" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="m4.29111 28.6025c.90712.9019.9071 2.3641-.00003 3.266l-.04646.0462c-.90713.9019-2.37788.9018-3.284994-.0001-.9071177-.9019-.9071038-2.3641.000031-3.266l.046453-.0462c.90714-.9019 2.37788-.9018 3.285.0001z" fill="#a4bcfd" fill-rule="evenodd"/><path fill="#444ce7" d="m39.3197 16.8473c.9071.9019.9071 2.3642 0 3.266l-23.3446 23.2098c-.9071.9019-2.3779.9019-3.285 0s-.9071-2.3641 0-3.266l23.3446-23.2098c.9071-.9019 2.3778-.9019 3.285 0z" fill-rule="evenodd"/><g fill="#0A0D12"><path d="m66.254 23.7659c.675.918 1.026 2.052 1.026 3.348 0 1.134-.297 2.133-.864 3.024-.594.918-1.377 1.62-2.403 2.106-1.026.513-2.187.756-3.483.756h-10.53v-21.33h9.828c2.025 0 3.618.513 4.806 1.539 1.161 1.026 1.755 2.376 1.755 4.077 0 1.134-.27 2.133-.81 2.943s-1.296 1.404-2.241 1.728c1.242.27 2.214.891 2.916 1.809z"/></g></svg>`,
    // Eclipseful
    `<svg fill="none" height="48" viewBox="0 0 174 48" width="174" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="m40 24c0 11.0457-8.9543 20-20 20-9.808 0-17.96705-7.06-19.672375-16.3754-.00514-.028-.010224-.0561-.015247-.0843-.205259-1.1491-.312378-2.3322-.312378-3.5403 0-.9645.0682793-1.9131.200267-2.8412 1.247523-8.772 8.186563-15.71101 16.958533-16.95853.0147-.0021.0294-.00417.0442-.00624.914-.1279 1.8478-.19403 2.797-.19403 1.2377 0 2.4491.11243 3.6246.32763 9.3154 1.70532 16.3754 9.86437 16.3754 19.67237z" fill="#dd2590" fill-rule="evenodd"/><g fill="#0A0D12"><path d="m50 32.9999v-21h13.71v3.09h-9.87v5.76h8.97v3h-8.97v6.06h9.87v3.09z"/></g></svg>`,
    // Featherdev
    `<svg fill="none" height="48" viewBox="0 0 185 48" width="185" xmlns="http://www.w3.org/2000/svg"><path d="m36.3068 11.4224c-.4322-.4323-.8644-.8645-1.2967-1.2967-1.2966-1.38311-2.6797-2.76621-4.4086-3.63065-1.9882-1.03733-4.1493-.778-6.3104-.778-3.2849 0-11.4971 0-16.33798 0l3.28488 4.40865h19.6228c1.8153 0 3.3713.3458 4.8409 1.2967.2593.0864.5186.0864.6051 0z" fill="#66c61c"/><path d="m39.9368 18.511c-.4322-.4322-.8645-.8645-1.2967-1.2967-1.2967-1.3831-2.6797-2.7662-4.4086-3.6306-1.9882-1.0374-4.1494-.778-6.3105-.778-2.8526 0-9.6817 0-14.5226 0l3.2849 4.4086h17.8939c1.8154 0 3.3714.3458 4.8409 1.2967.1729.0864.3458.0864.5187 0z" fill="#4ca30d"/><g fill="#0A0D12"><path d="m68.5633 32.467c1.1006.6154 2.3703.923 3.809.923 1.352 0 2.5956-.3553 3.731-1.066 1.144-.7106 1.9803-1.7073 2.509-2.99z"/></g></svg>`,
    // Leapyear
    `<svg fill="none" height="48" viewBox="0 0 163 48" width="163" xmlns="http://www.w3.org/2000/svg"><path d="m21.3314 18.6667v-10.6667h-21.33335312v10.6667z" fill="#eaaa08"/><path d="m21.3309 29.3332c-5.891 0-10.6666 4.7757-10.6666 10.6667l-10.66494994.0004v-.2753c.14659294-11.6097 9.56705994-20.9847 21.19434994-21.058l10.8043.0005v21.3333h-10.6666z" fill="#eaaa08"/><g fill="#0A0D12"><path d="m42 32.9999v-19.683h5.076v15.201h8.883v4.482z"/></g></svg>`,
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
        <div className="absolute -bottom-px left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
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
          {partnerLogos.map((logo, index) => (
            <div 
              key={index}
              className="flex items-center justify-center px-8 py-4 rounded-xl border border-border/50 bg-background hover:border-[hsl(250,70%,45%)]/30 hover:shadow-lg transition-all duration-300"
              dangerouslySetInnerHTML={{ __html: logo }}
            />
          ))}
        </Marquee>
      </section>

      {/* Projects & Events */}
      <ProjectsEventsSection />

      {/* CTA */}
      <ScrollReveal>
        <section className="relative overflow-hidden bg-card">
          {/* Background Image - covers entire section including wave area */}
          <div className="absolute inset-0">
            <img 
              src={corporateCtaBg} 
              alt="" 
              className="w-full h-full object-cover"
            />
            <div 
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(88, 55, 163, 0.75) 0%, rgba(55, 100, 180, 0.85) 50%, rgba(88, 55, 163, 0.90) 100%)",
              }}
            />
          </div>
          
          {/* Top Wave - wavy side up, flat bottom connects to content */}
          <div className="relative z-10 -mb-px">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-[80px] lg:h-[120px] block" preserveAspectRatio="none">
              <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V0H0Z" fill="hsl(var(--card))"/>
            </svg>
          </div>
          
          <div className="container relative z-10 text-center space-y-6 py-16 lg:py-24 text-white">
            <h2 className="font-serif text-3xl lg:text-4xl font-bold drop-shadow-lg">
              Ready to Support Your Team's Families?
            </h2>
            <p className="text-white/90 max-w-2xl mx-auto drop-shadow">
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
