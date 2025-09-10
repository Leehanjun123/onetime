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
      <body className={`${inter.className} antialiased`}>
        <ReduxProvider>
          <Analytics />
          <WebVitals />
          <ServiceWorkerCleanup />
          <SimpleNavigation />
          {children}
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
        </ReduxProvider>
      </body>
    </html>
  );
}