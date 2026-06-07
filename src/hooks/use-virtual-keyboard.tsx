
"use client";

import { useState, useEffect } from 'react';
import { useIsMobile } from './use-mobile';

export function useVirtualKeyboard() {
  const isMobile = useIsMobile();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!isMobile || typeof window === 'undefined' || !window.visualViewport) {
      return;
    }

    const initialViewportHeight = window.visualViewport.height;

    const handleResize = () => {
      if (!window.visualViewport) return;
      
      const currentViewportHeight = window.visualViewport.height;
      const heightDifference = window.innerHeight - currentViewportHeight;

      if (heightDifference > 150) { // A threshold to avoid false positives
        setIsKeyboardOpen(true);
        setKeyboardHeight(heightDifference);
      } else {
        setIsKeyboardOpen(false);
        setKeyboardHeight(0);
      }
    };
    
    window.visualViewport.addEventListener('resize', handleResize);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, [isMobile]);

  return { isKeyboardOpen, keyboardHeight };
}
