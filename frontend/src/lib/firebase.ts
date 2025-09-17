import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Messaging 초기화 (브라우저 환경에서만)
let messaging: Messaging | null = null;

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  messaging = getMessaging(app);
}

export { app, messaging };

/**
 * FCM 토큰 가져오기
 */
export async function getFCMToken(): Promise<string | null> {
  if (!messaging) {
    console.warn('Firebase messaging is not available');
    return null;
  }

  try {
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      throw new Error('VAPID key is not configured');
    }

    const token = await getToken(messaging, {
      vapidKey
    });

    if (token) {
      console.log('FCM Token generated:', token);
      return token;
    } else {
      console.log('No registration token available.');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
    return null;
  }
}

/**
 * 포그라운드 메시지 리스너 설정
 */
export function setupMessageListener(callback: (payload: any) => void): void {
  if (!messaging) {
    console.warn('Firebase messaging is not available');
    return;
  }

  onMessage(messaging, (payload) => {
    console.log('Message received in foreground:', payload);
    callback(payload);
  });
}

/**
 * 알림 권한 요청
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('Notification permission is denied.');
    return false;
  }

  // 권한 요청
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * 브라우저 알림 표시
 */
export function showBrowserNotification(title: string, options?: NotificationOptions): void {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications.');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission is not granted.');
    return;
  }

  const notification = new Notification(title, {
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    ...options
  });

  // 클릭 이벤트 처리
  notification.onclick = function(event) {
    event.preventDefault();
    window.focus();
    notification.close();
    
    // 액션 URL이 있으면 해당 페이지로 이동
    if (options?.data?.actionUrl) {
      window.location.href = options.data.actionUrl;
    }
  };
}

/**
 * Service Worker 등록 - 일시적으로 비활성화
 */
export async function registerServiceWorker(): Promise<void> {
  // Service Worker 일시적으로 비활성화 (자동 새로고침 문제 해결)
  console.log('Service Worker registration is temporarily disabled');
  return;
  
  // if (!('serviceWorker' in navigator)) {
  //   console.warn('Service Worker is not supported in this browser.');
  //   return;
  // }

  // try {
  //   const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  //   console.log('Service Worker registered successfully:', registration);
  // } catch (error) {
  //   console.error('Service Worker registration failed:', error);
  // }
}