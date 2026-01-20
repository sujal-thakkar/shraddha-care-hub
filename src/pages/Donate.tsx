import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Shield, Facebook, CreditCard, Building, Smartphone, ExternalLink } from "lucide-react";
import { useState } from "react";
import upiQrCode from "@/assets/upi-qr-code.png";

export default function Donate() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    panCard: "",
    amount: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, just show the payment options
    // In production, this would integrate with a payment gateway
    alert("Thank you for your interest in donating! Please use UPI or bank transfer details below, or contact us for other payment options.");
  };

  const impactCards = [
    { amount: "₹500", impact: "Provides a senior with one month of companion calls" },
    { amount: "₹2,000", impact: "Funds a legal awareness session for 10 seniors" },
    { amount: "₹5,000", impact: "Supports a senior's wellness program for 3 months" },
    { amount: "₹10,000", impact: "Enables comprehensive support for one senior for a year" },
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-accent to-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Heart className="h-16 w-16 text-primary mx-auto" />
            <h1 className="font-serif text-4xl lg:text-5xl font-bold text-foreground">
              Support Our Mission
            </h1>
            <p className="text-lg text-muted-foreground">
              Your donation helps us protect and support senior citizens across India.
            </p>
          </div>
        </div>
      </section>

      {/* Transparency Pledge */}
      <section className="py-12 bg-background">
        <div className="container">
          <Card className="max-w-4xl mx-auto border-primary/20">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <Shield className="h-16 w-16 text-primary flex-shrink-0" />
                <div className="text-center md:text-left space-y-3">
                  <h2 className="font-serif text-2xl font-bold text-foreground">
                    Our Transparency Pledge
                  </h2>
                  <p className="text-muted-foreground">
                    Every rupee you donate goes directly to supporting seniors. We maintain complete 
                    transparency in our operations and regularly share impact updates with our donors.
                  </p>
                  <a 
                    href="https://facebook.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    <Facebook className="h-4 w-4" />
                    Follow our journey on Facebook
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Impact Cards */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Your Impact
            </h2>
            <p className="text-muted-foreground">
              See how your donation makes a difference.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {impactCards.map((card, index) => (
              <Card key={index} className="text-center border-border hover:border-primary/50 transition-colors">
                <CardContent className="p-6 space-y-3">
                  <div className="text-3xl font-bold text-primary">{card.amount}</div>
                  <p className="text-sm text-muted-foreground">{card.impact}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Donation Form */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Form */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="font-serif">Donor Information</CardTitle>
                  <CardDescription>
                    Fill in your details for tax exemption certificate (80G)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
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
                      <Label htmlFor="panCard">PAN Card Number</Label>
                      <Input
                        id="panCard"
                        value={formData.panCard}
                        onChange={(e) => setFormData({ ...formData, panCard: e.target.value })}
                        placeholder="For 80G tax exemption"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">Donation Amount (₹) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        required
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="Enter amount"
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      Proceed to Payment
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Payment Options */}
              <div className="space-y-6">
                <Card className="border-border">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-primary" />
                      <CardTitle className="font-serif">UPI Payment</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="max-w-[250px] mx-auto rounded-lg overflow-hidden">
                      <img 
                        src={upiQrCode} 
                        alt="UPI QR Code for Shraddha Welfare Association" 
                        className="w-full h-auto"
                      />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Scan to pay via any UPI app
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        UPI ID: <span className="text-primary">shraddhango@ucobank</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-primary" />
                      <CardTitle className="font-serif">Bank Transfer</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Account Name:</span>
                        <span className="font-medium text-foreground">SHRADDHA WELFARE ASSOCIATION</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Account Number:</span>
                        <span className="font-medium text-foreground">—</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">IFSC Code:</span>
                        <span className="font-medium text-foreground">—</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bank:</span>
                        <span className="font-medium text-foreground">UCO Bank</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <CardTitle className="font-serif">Online Payment</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" disabled>
                      Coming Soon
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Credit/Debit card payments will be available soon
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
        <div className="container text-center space-y-6">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold">
            Questions About Donating?
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto">
            We're happy to assist you with any questions about donations, 
            tax exemptions, or how your contribution will be used.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild variant="secondary" size="lg">
              <a href="mailto:hoslacare@gmail.com">
                Email Us
              </a>
            </Button>
            <Button asChild variant="heroOutline" size="lg">
              <a href="tel:7811009309">
                Call Us
              </a>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
