import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Copy, Share2, ExternalLink, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AttendanceShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionTitle: string;
  sessionId?: string | null;
  eventId?: string | null;
  sessionDate: string;
  eventMode: "online" | "offline";
}

export function AttendanceShareModal({
  open,
  onOpenChange,
  sessionTitle,
  sessionId,
  eventId,
  sessionDate,
  eventMode,
}: AttendanceShareModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const params = new URLSearchParams();
  if (sessionId) params.set("session_id", sessionId);
  if (eventId) params.set("event_id", eventId);
  params.set("date", sessionDate);
  params.set("mode", eventMode);

  const checkinUrl = `${origin}/attendance/checkin?${params.toString()}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(checkinUrl)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(checkinUrl);
      setCopied(true);
      toast({ title: "Link copied to clipboard!" });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast({ title: "Failed to copy link", variant: "destructive" });
    }
  };

  const handleWhatsAppShare = () => {
    const text = `🌸 *Hosla & Shraddha Attendance Check-In* 🌸\n\n*Session:* ${sessionTitle}\n*Date:* ${sessionDate}\n*Mode:* ${eventMode.toUpperCase()}\n\nPlease mark your attendance and earn your Hosla credits here:\n${checkinUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <QrCode className="h-5 w-5 text-primary" />
            Session Attendance Link & QR
          </DialogTitle>
          <DialogDescription>
            Share this link or display the QR code for attendees to record their attendance directly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-4 bg-muted/40 rounded-xl border">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <img
                src={qrUrl}
                alt="Attendance Check-In QR Code"
                className="w-48 h-48 object-contain"
                loading="eager"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Scan with any mobile camera to open the instant check-in form
            </p>
          </div>

          {/* Session Info Pill */}
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 text-sm">
            <div className="font-semibold text-foreground">{sessionTitle}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
              <span>📅 {sessionDate}</span>
              <span className="capitalize">📍 {eventMode} Event</span>
            </div>
          </div>

          {/* Copyable Link */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Shareable Link</label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={checkinUrl}
                className="text-xs font-mono bg-muted/50 selection:bg-primary/20"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button size="icon" variant="outline" onClick={handleCopy} title="Copy link">
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleWhatsAppShare}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share on WhatsApp
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(checkinUrl, "_blank")}
              title="Open form in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
