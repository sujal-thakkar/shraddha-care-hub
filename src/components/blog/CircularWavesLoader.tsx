import { useEffect, useState } from "react";

interface Props {
  progress: number; // 0-100
  label?: string;
  size?: number;
}

/**
 * Circular waves loading animation with animated percentage.
 * Water level rises based on `progress`. Waves animate continuously via CSS.
 */
export function CircularWavesLoader({ progress, label = "Uploading", size = 140 }: Props) {
  const clamped = Math.max(0, Math.min(100, Math.round(progress)));
  const [display, setDisplay] = useState(0);

  // Smoothly animate the displayed number toward the actual progress.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setDisplay((prev) => {
        if (prev === clamped) return prev;
        const diff = clamped - prev;
        const step = Math.sign(diff) * Math.max(1, Math.round(Math.abs(diff) / 6));
        const next = prev + step;
        if ((diff > 0 && next >= clamped) || (diff < 0 && next <= clamped)) return clamped;
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [clamped]);

  const waterY = 100 - clamped; // higher progress = lower translateY

  return (
    <div className="flex flex-col items-center justify-center gap-2" role="status" aria-live="polite">
      <div
        className="relative rounded-full overflow-hidden border-4 border-primary/30 bg-background shadow-lg"
        style={{ width: size, height: size }}
      >
        {/* Water fill */}
        <div
          className="absolute inset-x-0 bottom-0 top-0 transition-transform duration-300 ease-out"
          style={{ transform: `translateY(${waterY}%)` }}
        >
          {/* Back wave */}
          <div
            className="absolute left-1/2 top-0 h-[200%] w-[200%] -translate-x-1/2 -translate-y-1/2 rounded-[40%] bg-primary/40"
            style={{ animation: "cwl-wave-back 7s linear infinite" }}
          />
          {/* Front wave */}
          <div
            className="absolute left-1/2 top-0 h-[200%] w-[200%] -translate-x-1/2 -translate-y-[48%] rounded-[42%] bg-primary/80"
            style={{ animation: "cwl-wave-front 5s linear infinite" }}
          />
        </div>

        {/* Percentage text */}
        <div className="absolute inset-0 flex items-center justify-center font-bold text-foreground mix-blend-difference text-white select-none pointer-events-none" style={{ fontSize: size * 0.22 }}>
          {display}%
        </div>
      </div>
      {label && <div className="text-sm text-muted-foreground">{label}…</div>}

      <style>{`
        @keyframes cwl-wave-front {
          0%   { transform: translate(-50%, -48%) rotate(0deg); }
          100% { transform: translate(-50%, -48%) rotate(360deg); }
        }
        @keyframes cwl-wave-back {
          0%   { transform: translate(-50%, -50%) rotate(360deg); }
          100% { transform: translate(-50%, -50%) rotate(0deg); }
        }
      `}</style>
    </div>
  );
}
