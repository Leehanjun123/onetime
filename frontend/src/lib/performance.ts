import { NextApiRequest, NextApiResponse } from 'next';

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, any> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Track page load performance
  trackPageLoad(pageName: string) {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      const metrics = {
        pageName,
        timestamp: Date.now(),
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        domInteractive: navigation.domInteractive - navigation.navigationStart,
        firstPaint: this.getFirstPaint(),
        firstContentfulPaint: this.getFirstContentfulPaint(),
        largestContentfulPaint: this.getLargestContentfulPaint(),
        cumulativeLayoutShift: this.getCumulativeLayoutShift(),
        firstInputDelay: this.getFirstInputDelay()
      };

      this.metrics.set(`pageLoad_${pageName}`, metrics);
      
      // Send to analytics if needed
      this.sendMetrics(metrics);
      
      return metrics;
    }
    return null;
  }

  // Track API call performance
  trackApiCall(endpoint: string, startTime: number, endTime: number, status: number) {
    const metrics = {
      endpoint,
      duration: endTime - startTime,
      status,
      timestamp: Date.now()
    };

    this.metrics.set(`api_${endpoint}_${Date.now()}`, metrics);
    
    // Warn about slow API calls
    if (metrics.duration > 2000) {
      console.warn(`🐌 Slow API call: ${endpoint} took ${metrics.duration}ms`);
    }

    return metrics;
  }

  // Get Core Web Vitals
  private getFirstPaint(): number | null {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
  }

  private getFirstContentfulPaint(): number | null {
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : null;
  }

  private getLargestContentfulPaint(): Promise<number | null> {
    return new Promise((resolve) => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry ? lastEntry.startTime : null);
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Timeout after 10 seconds
        setTimeout(() => resolve(null), 10000);
      } else {
        resolve(null);
      }
    });
  }

  private getCumulativeLayoutShift(): Promise<number | null> {
    return new Promise((resolve) => {
      if ('PerformanceObserver' in window) {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        });
        observer.observe({ entryTypes: ['layout-shift'] });
        
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 5000);
      } else {
        resolve(null);
      }
    });
  }

  private getFirstInputDelay(): Promise<number | null> {
    return new Promise((resolve) => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const firstEntry = entries[0];
          resolve(firstEntry ? (firstEntry as any).processingStart - firstEntry.startTime : null);
        });
        observer.observe({ entryTypes: ['first-input'] });
        
        setTimeout(() => resolve(null), 10000);
      } else {
        resolve(null);
      }
    });
  }

  // Send metrics to analytics service
  private sendMetrics(metrics: any) {
    // In a real app, send to your analytics service
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Performance Metrics:', metrics);
    }
  }

  // Get all collected metrics
  getAllMetrics() {
    return Object.fromEntries(this.metrics);
  }

  // Clear metrics
  clearMetrics() {
    this.metrics.clear();
  }
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance();

  const trackPageLoad = (pageName: string) => {
    return monitor.trackPageLoad(pageName);
  };

  const trackApiCall = (endpoint: string, startTime: number, endTime: number, status: number) => {
    return monitor.trackApiCall(endpoint, startTime, endTime, status);
  };

  return {
    trackPageLoad,
    trackApiCall,
    getAllMetrics: () => monitor.getAllMetrics(),
    clearMetrics: () => monitor.clearMetrics()
  };
}

// Image optimization utility
export class ImageOptimizer {
  static generateSrcSet(src: string, widths: number[] = [320, 640, 960, 1280, 1920]): string {
    return widths
      .map(width => `${src}?w=${width} ${width}w`)
      .join(', ');
  }

  static generateSizes(breakpoints: { [key: string]: string } = {
    '(max-width: 320px)': '320px',
    '(max-width: 640px)': '640px',
    '(max-width: 960px)': '960px',
    '(max-width: 1280px)': '1280px',
    'default': '1920px'
  }): string {
    const entries = Object.entries(breakpoints);
    const conditions = entries.slice(0, -1).map(([condition, size]) => `${condition} ${size}`);
    const defaultSize = entries[entries.length - 1][1];
    
    return [...conditions, defaultSize].join(', ');
  }

  static isWebPSupported(): boolean {
    if (typeof window === 'undefined') return false;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  static preloadCriticalImages(imageUrls: string[]) {
    if (typeof window === 'undefined') return;

    imageUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
    });
  }
}

// API performance wrapper
export function withPerformanceTracking<T extends (...args: any[]) => Promise<any>>(
  apiFunction: T,
  endpoint: string
): T {
  return (async (...args: any[]) => {
    const startTime = performance.now();
    const monitor = PerformanceMonitor.getInstance();
    
    try {
      const result = await apiFunction(...args);
      const endTime = performance.now();
      
      monitor.trackApiCall(endpoint, startTime, endTime, 200);
      return result;
    } catch (error: any) {
      const endTime = performance.now();
      const status = error.response?.status || 500;
      
      monitor.trackApiCall(endpoint, startTime, endTime, status);
      throw error;
    }
  }) as T;
}

// Bundle size analyzer (development only)
export function analyzeBundleSize() {
  if (process.env.NODE_ENV !== 'development') return;

  const scripts = document.querySelectorAll('script[src]');
  let totalSize = 0;

  scripts.forEach(async (script) => {
    const src = (script as HTMLScriptElement).src;
    if (src && src.includes('/_next/')) {
      try {
        const response = await fetch(src, { method: 'HEAD' });
        const size = parseInt(response.headers.get('content-length') || '0');
        totalSize += size;
        console.log(`📦 ${src.split('/').pop()}: ${(size / 1024).toFixed(2)}KB`);
      } catch (error) {
        console.warn(`Could not analyze size for ${src}`);
      }
    }
  });

  setTimeout(() => {
    console.log(`📊 Total bundle size: ${(totalSize / 1024).toFixed(2)}KB`);
  }, 1000);
}

// Resource hints utility
export function addResourceHints(hints: {
  preload?: string[];
  prefetch?: string[];
  preconnect?: string[];
  dnsPrefetch?: string[];
}) {
  if (typeof window === 'undefined') return;

  const { preload = [], prefetch = [], preconnect = [], dnsPrefetch = [] } = hints;

  // Add preload hints
  preload.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = href.endsWith('.css') ? 'style' : 'script';
    document.head.appendChild(link);
  });

  // Add prefetch hints
  prefetch.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  });

  // Add preconnect hints
  preconnect.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = href;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });

  // Add DNS prefetch hints
  dnsPrefetch.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = href;
    document.head.appendChild(link);
  });
}