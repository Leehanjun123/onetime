'use client'

import { useEffect } from 'react';
import type { Metric } from 'web-vitals';

// Web Vitals 측정 및 전송
export function WebVitals() {
  useEffect(() => {
    // 동적 import로 번들 크기 최적화
    import('web-vitals').then(({ onCLS, onFCP, onFID, onLCP, onTTFB }) => {
      onCLS(sendToAnalytics);
      onFCP(sendToAnalytics);
      onFID(sendToAnalytics);
      onLCP(sendToAnalytics);
      onTTFB(sendToAnalytics);
    });
  }, []);

  return null;
}

function sendToAnalytics(metric: Metric) {
  // 개발 환경에서는 콘솔 로그
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      delta: metric.delta,
      rating: getWebVitalRating(metric),
    });
  }

  // 프로덕션에서는 분석 서비스로 전송
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    // Google Analytics로 전송
    if (window.gtag) {
      window.gtag('event', metric.name, {
        custom_map: { metric_id: 'dimension1' },
        metric_id: metric.id,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_category: 'Web Vitals',
        event_label: metric.id,
        non_interaction: true,
      });
    }

    // 백엔드로 성능 데이터 전송 (선택적)
    if (shouldSendToBackend(metric)) {
      fetch('/api/analytics/web-vitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: metric.name,
          value: metric.value,
          delta: metric.delta,
          id: metric.id,
          rating: getWebVitalRating(metric),
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      }).catch((error) => {
        console.warn('Failed to send Web Vitals to backend:', error);
      });
    }
  }
}

// Web Vital 점수 평가
function getWebVitalRating(metric: Metric): 'good' | 'needs-improvement' | 'poor' {
  const { name, value } = metric;

  switch (name) {
    case 'LCP': // Largest Contentful Paint
      if (value <= 2500) return 'good';
      if (value <= 4000) return 'needs-improvement';
      return 'poor';

    case 'FID': // First Input Delay
      if (value <= 100) return 'good';
      if (value <= 300) return 'needs-improvement';
      return 'poor';

    case 'CLS': // Cumulative Layout Shift
      if (value <= 0.1) return 'good';
      if (value <= 0.25) return 'needs-improvement';
      return 'poor';

    case 'FCP': // First Contentful Paint
      if (value <= 1800) return 'good';
      if (value <= 3000) return 'needs-improvement';
      return 'poor';

    case 'TTFB': // Time to First Byte
      if (value <= 800) return 'good';
      if (value <= 1800) return 'needs-improvement';
      return 'poor';

    default:
      return 'good';
  }
}

// 백엔드로 전송할 조건 (샘플링)
function shouldSendToBackend(metric: Metric): boolean {
  // 1% 샘플링 (너무 많은 요청 방지)
  if (Math.random() > 0.01) return false;

  // 중요한 지표만 전송
  const importantMetrics = ['LCP', 'FID', 'CLS'];
  if (!importantMetrics.includes(metric.name)) return false;

  // 'poor' 등급이거나 임계값 초과시 반드시 전송
  const rating = getWebVitalRating(metric);
  if (rating === 'poor') return true;

  return true;
}

// 타입 확장 (gtag)
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event',
      targetId: string,
      config?: Record<string, any>
    ) => void;
  }
}