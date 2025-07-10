
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyLoadComponentProps {
  children: React.ReactNode;
  className?: string;
  placeholderHeight?: string;
}

export function LazyLoadComponent({ 
  children, 
  className,
  placeholderHeight = '280px' // A reasonable default for a product carousel
}: LazyLoadComponentProps) {
  const [isVisible, setIsVisible] = useState(false);
  const placeholderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Use isIntersecting to check if the element is in the viewport
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          // Stop observing once it's visible
          if (placeholderRef.current) {
            observer.unobserve(placeholderRef.current);
          }
        }
      },
      {
        // Start loading the component when it's 200px away from the viewport
        rootMargin: '200px',
        threshold: 0.01 // Trigger as soon as a single pixel is visible
      }
    );

    if (placeholderRef.current) {
      observer.observe(placeholderRef.current);
    }

    return () => {
      if (placeholderRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        observer.unobserve(placeholderRef.current);
      }
    };
  }, []);

  return (
    <div ref={placeholderRef} className={className}>
      {isVisible ? children : <div className="container"><Skeleton style={{ height: placeholderHeight }} className="w-full" /></div>}
    </div>
  );
}
