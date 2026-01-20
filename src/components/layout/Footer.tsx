import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook, ExternalLink } from "lucide-react";
import logoShraddha from "@/assets/logo-shraddha.png";
import hoslaLogo from "@/assets/hosla-logo.png";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center">
              <img src={logoShraddha} alt="Shraddha" className="h-10" />
            </Link>
            <p className="text-sm text-muted-foreground">
              Providing dignity, protection, and care for our beloved seniors. Backed by Hosla.
            </p>
            <a
              href="https://www.hosla.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Visit Hosla <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Quick Links</h3>
            <nav className="flex flex-col gap-2">
              <Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                About Us
              </Link>
              <Link to="/corporate-care" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Corporate Parental Care
              </Link>
              <Link
                to="/legal-resources"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Legal Resources
              </Link>
              <Link to="/volunteer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Volunteer
              </Link>
              <Link to="/donate" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Donate
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Contact Us</h3>
            <div className="flex flex-col gap-3">
              <a
                href="tel:7811009309"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Phone className="h-4 w-4" />
                7811009309
              </a>
              <a
                href="mailto:hoslacare@gmail.com"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="h-4 w-4" />
                hoslacare@gmail.com
              </a>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  Bishnupur, West Bengal
                  <br />
                  Expanding to: Kolkata, Delhi, Mumbai
                </span>
              </div>
            </div>
          </div>

          {/* Social */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Follow Us</h3>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Facebook className="h-5 w-5" />
              Facebook
            </a>
            <p className="text-sm text-muted-foreground">Follow us for updates on our work and impact stories.</p>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground inline-flex items-center justify-center gap-1.5 flex-wrap">
            © {new Date().getFullYear()} Shraddha. All rights reserved. | Powered by{" "}
            <img src={hoslaLogo} alt="Hosla" className="h-4 inline-block" />
          </p>
        </div>
      </div>
    </footer>
  );
}
