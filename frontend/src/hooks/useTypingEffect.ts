import { useState, useEffect } from 'react';

interface UseTypingEffectOptions {
  texts: string[];
  speed?: number;
  deleteSpeed?: number;
  delayBetween?: number;
  loop?: boolean;
}

export function useTypingEffect({ 
  texts, 
  speed = 100, 
  deleteSpeed = 50, 
  delayBetween = 1000,
  loop = true 
}: UseTypingEffectOptions) {
  const [displayText, setDisplayText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);

  useEffect(() => {
    if (texts.length === 0) return;

    const currentText = texts[textIndex];
    
    const timer = setTimeout(() => {
      if (isWaiting) {
        setIsWaiting(false);
        setIsDeleting(true);
        return;
      }

      if (isDeleting) {
        if (charIndex > 0) {
          setCharIndex(charIndex - 1);
          setDisplayText(currentText.substring(0, charIndex - 1));
        } else {
          setIsDeleting(false);
          setTextIndex((textIndex + 1) % texts.length);
        }
      } else {
        if (charIndex < currentText.length) {
          setCharIndex(charIndex + 1);
          setDisplayText(currentText.substring(0, charIndex + 1));
        } else {
          if (loop && texts.length > 1) {
            setIsWaiting(true);
          }
        }
      }
    }, isDeleting ? deleteSpeed : isWaiting ? delayBetween : speed);

    return () => clearTimeout(timer);
  }, [texts, textIndex, charIndex, isDeleting, isWaiting, speed, deleteSpeed, delayBetween, loop]);

  return { displayText, isComplete: !loop && textIndex === texts.length - 1 && charIndex === texts[textIndex]?.length };
}