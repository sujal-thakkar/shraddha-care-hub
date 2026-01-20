import { useState, useEffect } from "react";

const words = [
  { text: "Seniors", color: "hsl(var(--primary))" },
  { text: "Elders", color: "hsl(142, 60%, 45%)" },
  { text: "Parents", color: "hsl(45, 100%, 50%)" },
  { text: "Grandparents", color: "hsl(280, 60%, 55%)" },
  { text: "Community Pillars", color: "hsl(15, 78%, 53%)" },
  { text: "The Silver Generation", color: "hsl(330, 100%, 64%)" },
];

export const AnimatedHeroText = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState(words[0].text);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentColor, setCurrentColor] = useState(words[0].color);

  useEffect(() => {
    const currentWord = words[currentIndex].text;
    const targetColor = words[currentIndex].color;

    let timeout: NodeJS.Timeout;

    if (isDeleting) {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 50);
      } else {
        setIsDeleting(false);
        const nextIndex = (currentIndex + 1) % words.length;
        setCurrentIndex(nextIndex);
        setCurrentColor(words[nextIndex].color);
      }
    } else {
      if (displayText.length < currentWord.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentWord.slice(0, displayText.length + 1));
        }, 100);
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, 2500);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentIndex]);

  return (
    <span className="relative inline-block">
      <span className="transition-colors duration-500" style={{ color: currentColor }}>
        {displayText}
        <span className="animate-pulse">|</span>
      </span>
      <svg
        className="absolute -bottom-2 left-0 w-full h-3 transition-colors duration-500"
        viewBox="0 0 200 12"
        preserveAspectRatio="none"
        style={{ color: currentColor, opacity: 0.3 }}
      >
        <path d="M0 9c50-5 100-5 200 0" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    </span>
  );
};
