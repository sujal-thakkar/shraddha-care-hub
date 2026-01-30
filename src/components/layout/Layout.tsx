import { ReactNode, useState } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { ScrollToTopButton } from "@/components/ui/scroll-to-top-button";
import { AlertTriangle } from "lucide-react";
import { QuickReportModal } from "@/components/QuickReportModal";
import { TextFlip } from "@/components/ui/text-flip";
import { StickyBanner } from "@/components/ui/sticky-banner";

interface LayoutProps {
  children: ReactNode;
}

// Banner announcement messages
const bannerMessages = [
  "🛡️ Report Elder Abuse — Your voice can protect our seniors. Speak up, stay anonymous.",
  "🎮 NEW: Fun Games for Seniors — Enjoy puzzles & brain teasers at your fingertips!",
];

export function Layout({ children }: LayoutProps) {
  const [isQuickReportOpen, setIsQuickReportOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky Announcement Banner */}
      <StickyBanner 
        className="bg-gradient-to-r from-blue-600 to-blue-500 text-white"
        hideOnScroll={false}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            <TextFlip 
              words={bannerMessages} 
              duration={4000} 
              className="min-w-[280px] sm:min-w-[400px] text-center"
            />
          </span>
        </div>
      </StickyBanner>

      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ScrollToTopButton />
      
      {/* Floating Report Elder Abuse Button */}
      <button
        onClick={() => setIsQuickReportOpen(true)}
        className="fixed bottom-24 right-4 sm:right-6 z-50 group"
        aria-label="Report Elder Abuse"
      >
        <div className="relative">
          {/* Pulse animation background */}
          <div className="absolute inset-0 bg-destructive rounded-lg animate-ping opacity-20" />
          
          {/* Main button */}
          <div className="relative flex items-center gap-2 px-4 py-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-semibold">Report Elder Abuse</span>
          </div>
        </div>
      </button>

      {/* Quick Report Modal */}
      <QuickReportModal 
        isOpen={isQuickReportOpen} 
        onClose={() => setIsQuickReportOpen(false)} 
      />
    </div>
  );
}
