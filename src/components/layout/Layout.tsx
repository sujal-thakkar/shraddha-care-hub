import { ReactNode, useState } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { ScrollToTopButton } from "@/components/ui/scroll-to-top-button";
import { AlertTriangle } from "lucide-react";
import { QuickReportModal } from "@/components/QuickReportModal";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isQuickReportOpen, setIsQuickReportOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ScrollToTopButton />
      
      {/* Floating Report Elder Abuse Button */}
      <button
        onClick={() => setIsQuickReportOpen(true)}
        className="fixed bottom-24 right-6 z-50 group"
        aria-label="Report Elder Abuse"
      >
        <div className="relative flex items-center">
          {/* Tooltip */}
          <span className="absolute right-full mr-3 px-3 py-2 bg-destructive text-destructive-foreground text-sm font-medium rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
            Report Elder Abuse
          </span>
          
          {/* Button */}
          <div className="relative">
            {/* Pulse animation */}
            <div className="absolute inset-0 bg-destructive rounded-full animate-ping opacity-30" />
            
            <div className="relative flex items-center justify-center w-14 h-14 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
              <AlertTriangle className="h-6 w-6" />
            </div>
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
