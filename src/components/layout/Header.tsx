import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logoShraddha from "@/assets/logo-shraddha.png";

const navItems = [
  { name: "Home", path: "/" },
  { name: "About Us", path: "/about" },
  { name: "Corporate Care", path: "/corporate-care" },
  { name: "Legal Resources", path: "/legal-resources" },
  { name: "Volunteer", path: "/volunteer" },
  { name: "Donate", path: "/donate" },
  { name: "Contact", path: "/contact" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center">
            <img src={logoShraddha} alt="Shraddha" className="h-10" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location.pathname === item.path
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {item.name}
              </Link>
            ))}
            <Button asChild size="sm">
              <Link to="/donate">Support Us</Link>
            </Button>
          </nav>

          {/* Mobile Menu Button - Enhanced touch target */}
          <button
            className="lg:hidden relative z-[60] w-12 h-12 flex items-center justify-center rounded-lg transition-colors hover:bg-accent active:bg-accent/80 touch-manipulation"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
          >
            {/* Animated hamburger icon */}
            <div className="relative w-6 h-5 flex flex-col justify-between">
              <span
                className={cn(
                  "block h-0.5 w-6 bg-foreground rounded-full transition-all duration-300 ease-in-out origin-center",
                  isMenuOpen && "rotate-45 translate-y-[9px]"
                )}
              />
              <span
                className={cn(
                  "block h-0.5 w-6 bg-foreground rounded-full transition-all duration-300 ease-in-out",
                  isMenuOpen && "opacity-0 scale-x-0"
                )}
              />
              <span
                className={cn(
                  "block h-0.5 w-6 bg-foreground rounded-full transition-all duration-300 ease-in-out origin-center",
                  isMenuOpen && "-rotate-45 -translate-y-[9px]"
                )}
              />
            </div>
          </button>
        </div>
      </header>

      {/* Mobile Navigation - Moved outside header to fix stacking context */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 top-16 bg-background z-[55] transition-all duration-300 ease-in-out",
          isMenuOpen
            ? "opacity-100 visible"
            : "opacity-0 invisible pointer-events-none"
        )}
      >
        <nav className="container h-full py-6 px-4 flex flex-col overflow-y-auto">
          <div className="flex flex-col gap-1">
            {navItems.map((item, index) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center px-4 py-4 text-base font-medium rounded-xl transition-all duration-300 active:scale-[0.98] touch-manipulation",
                  location.pathname === item.path
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-accent",
                  isMenuOpen
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-4 opacity-0"
                )}
                style={{
                  transitionDelay: isMenuOpen ? `${index * 50}ms` : "0ms",
                }}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Mobile CTA Button */}
          <div
            className={cn(
              "mt-6 pt-6 border-t border-border transition-all duration-300",
              isMenuOpen
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            )}
            style={{
              transitionDelay: isMenuOpen ? `${navItems.length * 50 + 100}ms` : "0ms",
            }}
          >
            <Button asChild size="lg" className="w-full h-14 text-base">
              <Link to="/donate" onClick={() => setIsMenuOpen(false)}>
                <Heart className="mr-2 h-5 w-5" />
                Support Us
              </Link>
            </Button>
          </div>
        </nav>
      </div>
    </>
  );
}
