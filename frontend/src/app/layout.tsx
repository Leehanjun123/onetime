import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ReduxProvider } from "@/store/provider";
import SimpleNavigation from "@/components/SimpleNavigation";
import MobileNavigation from "@/components/MobileNavigation";
import ChatList from "@/components/ChatList";
import WorkTimeTracker from "@/components/WorkTimeTracker";
import PushNotificationManager from "@/components/PushNotificationManager";
import PWAInstaller from "@/components/PWAInstaller";
import NotificationSystem from "@/components/NotificationSystem";
import ServiceWorkerCleanup from "@/components/ServiceWorkerCleanup";
import { WebVitals } from "@/components/WebVitals";
import Analytics from "@/components/Analytics";
import AnalyticsDashboard, { AnalyticsDashboardToggle } from "@/components/AnalyticsDashboard";
import { ABTestDashboardToggle } from "@/components/ABTestDashboard";
import { AdSenseScript, MobileBottomAd } from "@/components/AdSense";
import { AdSenseToggle } from "@/components/AdSenseManager";
import "./globals.css";

// Inter 폰트 최적화 설정
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  fallback: [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif'
  ]
});

export const metadata: Metadata = {
  title: "원데이 - 당일 일용직 전문 매칭 플랫폼",
  description: "리모델링·인테리어 전문 일용직 매칭! 당일 정산, AI 매칭으로 쉽고 빠르게 일자리를 찾으세요.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "원데이",
  },
  icons: [
    { rel: "icon", url: "/icons/icon-192x192.png" },
    { rel: "apple-touch-icon", url: "/icons/icon-192x192.png" },
  ],
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "원데이",
    "application-name": "원데이",
    "msapplication-TileColor": "#ea580c",
    "msapplication-config": "/browserconfig.xml"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ea580c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={inter.variable}>
      <head>
        {/* Performance optimization meta tags */}
        <link rel="preconnect" href="https://onetime-production.up.railway.app" />
        <link rel="dns-prefetch" href="https://onetime-production.up.railway.app" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Critical resource hints */}
        <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        
        {/* Early performance monitoring */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.performanceStartTime = performance.now();
              
              // Early Core Web Vitals tracking
              if ('PerformanceObserver' in window) {
                try {
                  const observer = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                      if (entry.entryType === 'largest-contentful-paint') {
                        console.log('🎯 LCP:', Math.round(entry.startTime) + 'ms');
                      }
                    });
                  });
                  observer.observe({entryTypes: ['largest-contentful-paint']});
                } catch (e) {}
              }
            `
          }}
        />
      </head>
      
      <body className={`${inter.className} antialiased`}>
        <ReduxProvider>
          <Analytics />
          <WebVitals />
          <ServiceWorkerCleanup />
          
          {/* Critical above-the-fold content */}
          <SimpleNavigation />
          {children}
          
          {/* Non-critical components loaded after main content */}
          <WorkTimeTracker />
          <ChatList />
          <PushNotificationManager />
          <PWAInstaller />
          <AnalyticsDashboard />
          <AnalyticsDashboardToggle />
          <ABTestDashboardToggle />
          <AdSenseScript />
          <MobileBottomAd />
          <AdSenseToggle />
          <NotificationSystem />
        </ReduxProvider>
        
        {/* Performance tracking script at the end */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('load', () => {
                const loadTime = performance.now() - window.performanceStartTime;
                console.log('📊 Page Load Time:', Math.round(loadTime) + 'ms');
                
                // Track navigation timing
                setTimeout(() => {
                  const nav = performance.getEntriesByType('navigation')[0];
                  if (nav) {
                    console.log('🚀 Navigation Details:', {
                      'DNS': Math.round(nav.domainLookupEnd - nav.domainLookupStart) + 'ms',
                      'TCP': Math.round(nav.connectEnd - nav.connectStart) + 'ms',
                      'TTFB': Math.round(nav.responseStart - nav.requestStart) + 'ms',
                      'DOM': Math.round(nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart) + 'ms'
                    });
                  }
                }, 100);
              });
            `
          }}
        />
      </body>
    </html>
  );
}