'use client'

import { useEffect, useState } from 'react';

export default function PWAInstaller() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if iOS
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    );

    // Check if standalone
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);

    // Enhanced Service Worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration);
          
          // Check for updates periodically (every 5 minutes)
          setInterval(() => {
            registration.update();
          }, 300000);

          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker?.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available
                showUpdateNotification();
              }
            });
          });
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    }

    // Listen for beforeinstallprompt event (Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show Android install prompt after delay
      const hasSeenPrompt = localStorage.getItem('androidInstallPromptSeen');
      if (!hasSeenPrompt && !isStandalone) {
        setTimeout(() => {
          setShowAndroidPrompt(true);
        }, 5000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Enable offline support
    if ('onLine' in navigator) {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      setTimeout(() => {
        Notification.requestPermission();
      }, 10000); // Request after 10 seconds
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    // Show iOS install prompt if applicable
    const isIOSDevice = isIOS && !isStandalone;
    const hasSeenPrompt = localStorage.getItem('iosInstallPromptSeen');
    
    if (isIOSDevice && !hasSeenPrompt) {
      setTimeout(() => {
        setShowIOSPrompt(true);
      }, 3000); // Show after 3 seconds
    }
  }, [isIOS, isStandalone]);

  const handleOnline = async () => {
    console.log('Back online');
    // Sync any offline data
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && 'sync' in registration) {
        (registration as any).sync.register('sync-data');
      }
    } catch (error) {
      console.error('Failed to sync data:', error);
    }
  };

  const handleOffline = () => {
    console.log('Gone offline');
    // Show offline notification
    showNotification('오프라인 모드', '인터넷 연결이 끊어졌습니다. 일부 기능이 제한될 수 있습니다.');
  };

  const showNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png'
      });
    }
  };

  const showUpdateNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('업데이트 사용 가능', {
        body: '새로운 기능이 추가되었습니다. 페이지를 새로고침해주세요.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: 'app-update',
        requireInteraction: true,
        actions: [
          { action: 'refresh', title: '새로고침' },
          { action: 'dismiss', title: '나중에' }
        ]
      });
    }
  };

  const handleIOSInstallDismiss = () => {
    setShowIOSPrompt(false);
    localStorage.setItem('iosInstallPromptSeen', 'true');
  };

  const handleAndroidInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
      } else {
        console.log('[PWA] User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowAndroidPrompt(false);
      localStorage.setItem('androidInstallPromptSeen', 'true');
    }
  };

  const handleAndroidInstallDismiss = () => {
    setShowAndroidPrompt(false);
    localStorage.setItem('androidInstallPromptSeen', 'true');
  };

  // iOS Install Instructions
  if (showIOSPrompt) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 md:hidden">
        <div className="bg-white rounded-t-2xl p-6 w-full max-w-lg animate-slide-up">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">일데이 앱 설치하기</h3>
              <p className="text-sm text-gray-600 mt-1">
                홈 화면에 추가하여 앱처럼 사용하세요
              </p>
            </div>
            <button
              onClick={handleIOSInstallDismiss}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 rounded-lg p-2">
                <span className="text-xl">1️⃣</span>
              </div>
              <div>
                <p className="font-medium">공유 버튼 탭하기</p>
                <p className="text-sm text-gray-600">
                  Safari 하단의 공유 버튼 
                  <span className="inline-block mx-1 bg-gray-100 px-2 py-1 rounded">
                    <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326" />
                    </svg>
                  </span>
                  을 탭하세요
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-blue-100 rounded-lg p-2">
                <span className="text-xl">2️⃣</span>
              </div>
              <div>
                <p className="font-medium">홈 화면에 추가</p>
                <p className="text-sm text-gray-600">
                  메뉴에서 '홈 화면에 추가' 선택
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-blue-100 rounded-lg p-2">
                <span className="text-xl">3️⃣</span>
              </div>
              <div>
                <p className="font-medium">추가 버튼 탭</p>
                <p className="text-sm text-gray-600">
                  우측 상단의 '추가' 버튼을 탭하여 설치 완료
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleIOSInstallDismiss}
            className="w-full mt-6 bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700"
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  // Android Install Prompt
  if (showAndroidPrompt && deferredPrompt) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-fade-in">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📱</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              일데이 앱 설치하기
            </h3>
            <p className="text-gray-600 text-sm">
              더 빠르고 편리하게 일자리를 찾아보세요!
            </p>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-orange-800 mb-2">🚀 앱의 장점</h4>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• 오프라인에서도 일자리 확인</li>
              <li>• 즉시 알림으로 놓치지 않는 기회</li>
              <li>• 빠른 로딩으로 시간 절약</li>
              <li>• 홈 화면에서 바로 접근</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleAndroidInstall}
              className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              📥 앱 설치하기
            </button>
            
            <button
              onClick={handleAndroidInstallDismiss}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              나중에
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Add animation styles
const styles = `
  @keyframes slide-up {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .animate-fade-in {
    animation: fade-in 0.2s ease-out;
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}