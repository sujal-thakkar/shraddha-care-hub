import { useState, useEffect, useMemo } from "react";

const words = [
  { text: "Seniors", color: "hsl(var(--primary))" },
  { text: "Elders", color: "hsl(200, 70%, 50%)" },
  { text: "Parents", color: "hsl(45, 100%, 50%)" },
  { text: "Grandparents", color: "hsl(280, 60%, 55%)" },
  { text: "Community Pillars", color: "hsl(15, 78%, 53%)" },
  { text: "The Silver Generation", color: "hsl(330, 100%, 64%)", isLong: true },
];

export const AnimatedHeroText = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState(words[0].text);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentColor, setCurrentColor] = useState(words[0].color);
  const [isLongWord, setIsLongWord] = useState(words[0].isLong || false);

  // Use "Grandparents" as width reference (longest single-line word)
  const widthReference = "Grandparents";

  // Find the longest word for underline calculation
  const longestWord = useMemo(() => {
    return words.reduce((longest, word) => 
      word.text.length > longest.length ? word.text : longest
    , "");
  }, []);

  useEffect(() => {
    const currentWord = words[currentIndex].text;

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
        setIsLongWord(words[nextIndex].isLong || false);
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

  // Calculate underline width percentage based on current text
  const underlineWidth = useMemo(() => {
    const referenceLength = isLongWord ? longestWord.length : widthReference.length;
    return Math.min((displayText.length / referenceLength) * 100, 100);
  }, [displayText, longestWord, isLongWord]);

  return (
    <span className="relative inline-block align-bottom">
      {/* Invisible text to maintain consistent width - use shorter reference */}
      <span className="invisible whitespace-nowrap" aria-hidden="true">
        {widthReference}
      </span>
      {/* Visible animated text positioned on top */}
      <span 
        className={`absolute left-0 top-0 transition-colors duration-500 ${isLongWord ? 'whitespace-normal' : 'whitespace-nowrap'}`}
        style={{ color: currentColor }}
      >
        {displayText}
        <span className="animate-pulse">|</span>
      </span>
      {/* Animated underline that follows text width */}
      <svg
        className="absolute -bottom-2 left-0 h-3 transition-all duration-100"
        style={{ 
          width: `${underlineWidth}%`,
          color: currentColor, 
          opacity: displayText.length > 0 ? 0.3 : 0 
        }}
        viewBox="0 0 200 12"
        preserveAspectRatio="none"
      >
        <path d="M0 9c50-5 100-5 200 0" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    </span>
  );
};
