import React, { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import { createIntersectionObserver } from '@/utils/performance';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  placeholder?: string;
  fallback?: string;
  threshold?: number;
  rootMargin?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f3f4f6"%3E%3C/rect%3E%3C/svg%3E',
  fallback = '/images/image-error.png',
  threshold = 0.01,
  rootMargin = '50px',
  onLoad,
  onError,
  className = '',
  alt,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState<string>(placeholder);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!imageRef.current) return;

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsLoading(true);
          loadImage();
          observerRef.current?.disconnect();
        }
      });
    };

    observerRef.current = createIntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
    });

    if (observerRef.current) {
      observerRef.current.observe(imageRef.current);
    } else {
      // Fallback for browsers without IntersectionObserver
      loadImage();
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [src, threshold, rootMargin]);

  const loadImage = () => {
    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
      setHasError(false);
      onLoad?.();
    };

    img.onerror = () => {
      setImageSrc(fallback);
      setIsLoading(false);
      setHasError(true);
      onError?.();
    };

    img.src = src;
  };

  // Preload image formats
  const generateSrcSet = () => {
    if (!src || hasError) return undefined;
    
    const extension = src.split('.').pop();
    if (!extension || !['jpg', 'jpeg', 'png'].includes(extension)) {
      return undefined;
    }

    const basePath = src.substring(0, src.lastIndexOf('.'));
    return `
      ${basePath}.webp 1x,
      ${basePath}@2x.webp 2x,
      ${basePath}@3x.webp 3x
    `;
  };

  return (
    <div className={`relative ${className}`}>
      <img
        ref={imageRef}
        src={imageSrc}
        alt={alt}
        srcSet={generateSrcSet()}
        loading="lazy"
        decoding="async"
        className={`
          ${className}
          ${isLoading ? 'blur-sm' : ''}
          transition-all duration-300
        `}
        {...props}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent" />
        </div>
      )}
    </div>
  );
};

// Image preloader utility
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Batch image preloader
export const preloadImages = async (urls: string[]): Promise<void[]> => {
  const promises = urls.map(url => preloadImage(url));
  return Promise.all(promises);
};