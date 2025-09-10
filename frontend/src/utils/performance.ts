import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

// Send analytics to your backend
const sendToAnalytics = (metric: WebVitalsMetric) => {
  const body = JSON.stringify({
    metric: metric.name,
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  });

  // Use sendBeacon if available for better reliability
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/web-vitals', body);
  } else {
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(console.error);
  }
};

// Report web vitals
export function reportWebVitals(onPerfEntry?: (metric: WebVitalsMetric) => void) {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    getCLS(onPerfEntry);
    getFID(onPerfEntry);
    getFCP(onPerfEntry);
    getLCP(onPerfEntry);
    getTTFB(onPerfEntry);
  }
}

// Initialize performance monitoring
export function initPerformanceMonitoring() {
  reportWebVitals((metric) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(metric);
    }
    
    // Send to analytics
    sendToAnalytics(metric);
    
    // Custom alerts for poor performance
    if (metric.rating === 'poor') {
      console.warn(`Poor ${metric.name} performance:`, metric.value);
    }
  });
}

// Performance observer for resource timing
export function observeResourceTiming() {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // Log slow resources
          if (resourceEntry.duration > 1000) {
            console.warn('Slow resource:', {
              name: resourceEntry.name,
              duration: resourceEntry.duration,
              transferSize: resourceEntry.transferSize,
              type: resourceEntry.initiatorType,
            });
          }
        }
      }
    });
    
    observer.observe({ entryTypes: ['resource'] });
    
    return observer;
  }
}

// Measure custom performance marks
export function measurePerformance(markName: string) {
  if ('performance' in window && 'mark' in performance) {
    const startMark = `${markName}-start`;
    const endMark = `${markName}-end`;
    const measureName = `${markName}-duration`;
    
    return {
      start() {
        performance.mark(startMark);
      },
      end() {
        performance.mark(endMark);
        performance.measure(measureName, startMark, endMark);
        
        const measure = performance.getEntriesByName(measureName)[0];
        
        // Clean up marks and measures
        performance.clearMarks(startMark);
        performance.clearMarks(endMark);
        performance.clearMeasures(measureName);
        
        return measure?.duration;
      }
    };
  }
  
  // Fallback for browsers without Performance API
  let startTime: number;
  return {
    start() {
      startTime = Date.now();
    },
    end() {
      return Date.now() - startTime;
    }
  };
}

// Check if user has slow connection
export function isSlowConnection(): boolean {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    
    // Check effective type
    if (connection.effectiveType) {
      return ['slow-2g', '2g'].includes(connection.effectiveType);
    }
    
    // Check downlink speed (in Mbps)
    if (connection.downlink) {
      return connection.downlink < 1;
    }
  }
  
  return false;
}

// Optimize based on device capabilities
export function getDeviceCapabilities() {
  const memory = (navigator as any).deviceMemory || 4; // GB
  const cpuCores = navigator.hardwareConcurrency || 2;
  const connection = (navigator as any).connection;
  
  return {
    memory,
    cpuCores,
    isLowEnd: memory <= 2 || cpuCores <= 2,
    isMobile: /Mobi|Android/i.test(navigator.userAgent),
    connectionType: connection?.effectiveType || 'unknown',
    saveData: connection?.saveData || false,
  };
}

// Adaptive loading based on device
export function shouldReduceMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function shouldUseDarkMode(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}