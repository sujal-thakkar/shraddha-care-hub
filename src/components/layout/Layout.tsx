import { ReactNode, useState } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { ScrollToTopButton } from "@/components/ui/scroll-to-top-button";
import { AlertTriangle } from "lucide-react";
import { QuickReportModal } from "@/components/QuickReportModal";
import { TextFlip } from "@/components/ui/text-flip";

interface LayoutProps {
  children: ReactNode;
}

// "Report Elder Abuse" in major Indian regional languages
const reportTexts = [
  "Report Elder Abuse",           // English
  "बुजुर्ग शोषण रिपोर्ट करें",      // Hindi
  "প্রবীণ নির্যাতন রিপোর্ট",         // Bengali
  "முதியோர் துஷ்பிரயோகம் புகார்",    // Tamil
  "వృద్ధుల దుర్వినియోగం నివేదిక",    // Telugu
  "वृद्ध शोषण तक्रार करा",          // Marathi
  "વૃદ્ધ દુર્વ્યવહારની જાણ કરો",      // Gujarati
  "ಹಿರಿಯರ ದುರುಪಯೋಗ ವರದಿ",        // Kannada
  "മുതിർന്ന പീഡനം റിപ്പോർട്ട്",       // Malayalam
  "ਬਜ਼ੁਰਗ ਦੁਰਵਿਵਹਾਰ ਰਿਪੋਰਟ",        // Punjabi
  "ବୟସ୍କ ନିର୍ଯ୍ୟାତନ ରିପୋର୍ଟ",        // Odia
];

export function Layout({ children }: LayoutProps) {
  const [isQuickReportOpen, setIsQuickReportOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ScrollToTopButton />
      
      {/* Floating Report Elder Abuse Button - Rectangular with animated multilingual text */}
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
            <TextFlip 
              words={reportTexts} 
              duration={2500} 
              className="text-sm font-semibold min-w-[140px] sm:min-w-[180px] text-left"
            />
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
