import Image from 'next/image';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  fallbackSrc?: string;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  objectFit = 'cover',
  quality = 75,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  fallbackSrc = '/images/placeholder.png'
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  // Generate blur data URL if not provided
  const shimmer = (w: number, h: number) => `
    <svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <linearGradient id="g">
          <stop stop-color="#f6f7f8" offset="20%" />
          <stop stop-color="#edeef1" offset="50%" />
          <stop stop-color="#f6f7f8" offset="70%" />
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="#f6f7f8" />
      <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
      <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
    </svg>`;

  const toBase64 = (str: string) =>
    typeof window === 'undefined'
      ? Buffer.from(str).toString('base64')
      : window.btoa(str);

  const dataUrl = `data:image/svg+xml;base64,${toBase64(
    shimmer(width || 700, height || 475)
  )}`;

  const handleError = () => {
    if (fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  // Use responsive sizing if dimensions not provided
  const imageProps = width && height
    ? { width, height }
    : { fill: true };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <Image
        {...imageProps}
        src={imgSrc}
        alt={alt}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL || dataUrl}
        onError={handleError}
        onLoad={handleLoad}
        className={cn(
          'duration-700 ease-in-out',
          isLoading ? 'scale-110 blur-2xl' : 'scale-100 blur-0',
          objectFit === 'contain' && 'object-contain',
          objectFit === 'cover' && 'object-cover',
          objectFit === 'fill' && 'object-fill',
          objectFit === 'none' && 'object-none',
          objectFit === 'scale-down' && 'object-scale-down'
        )}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
    </div>
  );
}

// Preload critical images
export function preloadImage(src: string) {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  }
}

// Lazy load images when they come into viewport
export function useLazyLoadImage(src: string, rootMargin = '200px') {
  const [imageSrc, setImageSrc] = useState<string | undefined>();
  const [imageRef, setImageRef] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!imageRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(imageRef);

    return () => observer.disconnect();
  }, [imageRef, src, rootMargin]);

  return { imageSrc, setImageRef };
}