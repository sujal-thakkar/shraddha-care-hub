import * as React from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  pauseOnHover?: boolean;
  speed?: "slow" | "normal" | "fast";
  direction?: "left" | "right";
}

export function Marquee({
  children,
  pauseOnHover = true,
  speed = "normal",
  direction = "left",
  className,
  ...props
}: MarqueeProps) {
  const speedMap = {
    slow: "40s",
    normal: "25s",
    fast: "15s",
  };

  return (
    <div
      className={cn(
        "group flex overflow-hidden [--gap:2rem]",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "flex min-w-full shrink-0 items-center justify-around gap-[--gap]",
          "motion-safe:animate-marquee",
          pauseOnHover && "group-hover:[animation-play-state:paused]",
          direction === "right" && "[animation-direction:reverse]"
        )}
        style={{
          animationDuration: speedMap[speed],
        }}
      >
        {children}
      </div>
      <div
        aria-hidden="true"
        className={cn(
          "flex min-w-full shrink-0 items-center justify-around gap-[--gap]",
          "motion-safe:animate-marquee",
          pauseOnHover && "group-hover:[animation-play-state:paused]",
          direction === "right" && "[animation-direction:reverse]"
        )}
        style={{
          animationDuration: speedMap[speed],
        }}
      >
        {children}
      </div>
    </div>
  );
}
