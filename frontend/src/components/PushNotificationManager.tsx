'use client'

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';

interface PushNotificationManagerProps {
  onPermissionChange?: (permission: NotificationPermission) => void;
}

export default function PushNotificationManager({ onPermissionChange }: PushNotificationManagerProps) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isInstallPromptAvailable, setIsInstallPromptAvailable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // 브라우저 지원 여부 확인
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      // Service Worker 일시 비활성화 (자동 새로고침 문제 해결 중)
      // registerServiceWorker();
    }

    // PWA 설치 프롬프트 이벤트 리스너
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallPromptAvailable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 앱 설치 후 이벤트
    window.addEventListener('appinstalled', () => {
      console.log('PWA가 설치되었습니다');
      setIsInstallPromptAvailable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    if (onPermissionChange) {
      onPermissionChange(permission);
    }
  }, [permission, onPermissionChange]);

  const registerServiceWorker = async () => {
    // Service Worker 일시 비활성화 (자동 새로고침 문제 해결 중)
    console.log('Service Worker 등록이 일시적으로 비활성화되었습니다');
    return null;
    
    // try {
    //   const registration = await navigator.serviceWorker.register('/sw.js', {
    //     scope: '/'
    //   });

    //   console.log('Service Worker 등록 성공:', registration);

    //   // Service Worker 업데이트 확인
    //   registration.addEventListener('updatefound', () => {
    //     const newWorker = registration.installing;
    //     if (newWorker) {
    //       newWorker.addEventListener('statechange', () => {
    //         if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
    //           console.log('새로운 Service Worker 버전이 사용 가능합니다');
    //           // 사용자에게 새로고침 안내 (선택적)
    //         }
    //       });
    //     }
    //   });

    //   return registration;
    // } catch (error) {
    //   console.error('Service Worker 등록 실패:', error);
    // }
  };

  const requestNotificationPermission = async () => {
    if (!isSupported) {
      alert('이 브라우저는 푸시 알림을 지원하지 않습니다.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        await subscribeToPush();
        
        // 테스트 알림 표시
        new Notification('일데이 알림이 활성화되었습니다!', {
          body: '새로운 일자리와 채팅 메시지를 실시간으로 받아보세요.',
          icon: '/icons/icon-192x192.png',
          tag: 'welcome'
        });
      } else if (permission === 'denied') {
        alert('알림 권한이 거부되었습니다. 브라우저 설정에서 알림을 허용해주세요.');
      }
    } catch (error) {
      console.error('알림 권한 요청 실패:', error);
      alert('알림 권한 요청 중 오류가 발생했습니다.');
    }
  };

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // VAPID 공개 키 (실제 프로덕션에서는 백엔드에서 제공받아야 함)
      const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI80YmqRcXzSuS8lm79ahK6_n_wJ7AoDT2MqX6iuZBV9n9NqbNWOZwCwFk';
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      console.log('푸시 구독 성공:', subscription);

      // 구독 정보를 백엔드에 전송
      await savePushSubscription(subscription);
    } catch (error) {
      console.error('푸시 구독 실패:', error);
    }
  };

  const savePushSubscription = async (subscription: PushSubscription) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/v1/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      });

      if (response.ok) {
        console.log('푸시 구독 정보 저장 성공');
      } else {
        console.error('푸시 구독 정보 저장 실패');
      }
    } catch (error) {
      console.error('푸시 구독 정보 전송 실패:', error);
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        console.log('푸시 구독 해제 성공');

        // 백엔드에 구독 해제 알림
        const token = localStorage.getItem('token');
        if (token) {
          await fetch('http://localhost:5000/api/v1/push/unsubscribe', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        }
      }
    } catch (error) {
      console.error('푸시 구독 해제 실패:', error);
    }
  };

  const installPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('사용자가 PWA 설치를 선택했습니다');
      } else {
        console.log('사용자가 PWA 설치를 거부했습니다');
      }
      
      setDeferredPrompt(null);
      setIsInstallPromptAvailable(false);
    }
  };

  const testPushNotification = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      const response = await fetch('http://localhost:5000/api/v1/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: '테스트 푸시 알림',
          message: '푸시 알림이 정상적으로 작동하고 있습니다! 🎉',
          type: 'TEST'
        })
      });

      if (response.ok) {
        console.log('테스트 알림 전송 성공');
      } else {
        console.error('테스트 알림 전송 실패');
      }
    } catch (error) {
      console.error('테스트 알림 전송 오류:', error);
    }
  };

  // VAPID 키 변환 유틸리티
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  if (!isAuthenticated) return null;

  return (
    <>
      {/* PWA 설치 배너 */}
      {isInstallPromptAvailable && (
        <div className="fixed top-0 left-0 right-0 bg-orange-600 text-white p-3 z-50">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className="flex items-center gap-3">
              <span className="text-xl">📱</span>
              <div>
                <div className="font-semibold text-sm">앱으로 설치하기</div>
                <div className="text-xs opacity-90">더 빠르고 편리하게 이용하세요</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={installPWA}
                className="bg-white text-orange-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100"
              >
                설치
              </button>
              <button
                onClick={() => setIsInstallPromptAvailable(false)}
                className="text-white opacity-70 hover:opacity-100 text-lg"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 알림 권한 요청 플로팅 버튼 */}
      {isSupported && permission === 'default' && (
        <div className="fixed bottom-20 right-4 z-40">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔔</span>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  실시간 알림 받기
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  새로운 일자리와 채팅 메시지를 놓치지 마세요
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={requestNotificationPermission}
                    className="bg-orange-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-orange-700"
                  >
                    허용
                  </button>
                  <button
                    onClick={() => setPermission('denied')}
                    className="text-gray-500 hover:text-gray-700 px-3 py-1.5 text-sm"
                  >
                    나중에
                  </button>
                </div>
              </div>
              <button
                onClick={() => setPermission('denied')}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 개발용 테스트 버튼들 (프로덕션에서는 제거) */}
      {process.env.NODE_ENV === 'development' && permission === 'granted' && (
        <div className="fixed top-20 right-4 z-50 bg-white p-4 rounded-lg shadow-lg border">
          <h4 className="font-semibold mb-2">알림 테스트</h4>
          <div className="space-y-2">
            <button
              onClick={testPushNotification}
              className="block w-full bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              테스트 알림 전송
            </button>
            <button
              onClick={unsubscribeFromPush}
              className="block w-full bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              알림 구독 해제
            </button>
          </div>
        </div>
      )}
    </>
  );
}