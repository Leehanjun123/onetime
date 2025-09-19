// 고급 Service Worker - 건설업 특화 캐싱 전략

const CACHE_NAME = 'onetime-v1.0.3';
const STATIC_CACHE = 'onetime-static-v1.0.3';
const DYNAMIC_CACHE = 'onetime-dynamic-v1.0.3';
const IMAGE_CACHE = 'onetime-images-v1.0.3';

// 캐시할 정적 자산들 (존재하는 파일들만)
const STATIC_ASSETS = [
  '/',
  '/manifest.json'
];

// 중요한 API 엔드포인트 (오프라인에서도 필요한 것들)
const CRITICAL_API_ROUTES = [
  '/api/v1/jobs',
  '/api/v1/auth/me',
  '/api/v1/user/profile',
];

// 네트워크 우선 캐시 전략을 사용할 경로들
const NETWORK_FIRST_ROUTES = [
  '/api/v1/jobs',
  '/api/v1/chat',
  '/api/v1/work-session',
];

// 캐시 우선 전략을 사용할 경로들  
const CACHE_FIRST_ROUTES = [
  '/icons/',
  '/images/',
  '/_next/static/',
];

// Service Worker 설치
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  
  event.waitUntil(
    Promise.all([
      // 정적 자산 미리 캐시 (오류 시 개별 처리)
      caches.open(STATIC_CACHE).then(async (cache) => {
        console.log('[SW] Precaching static assets');
        try {
          return await cache.addAll(STATIC_ASSETS);
        } catch (error) {
          console.warn('[SW] Failed to cache some assets, trying individually:', error);
          // 개별적으로 캐시 시도
          const promises = STATIC_ASSETS.map(async (asset) => {
            try {
              await cache.add(asset);
            } catch (err) {
              console.warn(`[SW] Failed to cache ${asset}:`, err);
            }
          });
          return Promise.all(promises);
        }
      }),
      
      // 바로 활성화
      self.skipWaiting()
    ])
  );
});

// Service Worker 활성화
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  
  event.waitUntil(
    Promise.all([
      // 기존 캐시 정리
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => 
              cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE &&
              cacheName !== IMAGE_CACHE
            )
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      
      // 모든 클라이언트에서 새 SW 적용
      self.clients.claim()
    ])
  );
});

// Fetch 이벤트 처리 - 고급 캐싱 전략
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 건설업 특화: GPS 위치 요청은 항상 네트워크
  if (request.url.includes('geolocation') || request.url.includes('/location')) {
    return; // 네트워크만 사용
  }

  // 이미지 요청 처리
  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/)) {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // API 요청 처리
  if (url.pathname.startsWith('/api/') || url.hostname !== location.hostname) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // 정적 자산 처리
  if (CACHE_FIRST_ROUTES.some(route => url.pathname.startsWith(route))) {
    event.respondWith(handleCacheFirstRequest(request));
    return;
  }

  // 일반 페이지 요청 처리
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigateRequest(request));
    return;
  }

  // 기본 처리
  event.respondWith(handleDefaultRequest(request));
});

// 이미지 캐시 우선 전략
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // 백그라운드에서 업데이트 확인
    fetchAndCache(request, cache);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Image fetch failed:', error);
    // 기본 이미지 반환
    return new Response(
      '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" font-family="Arial" font-size="14" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">이미지 로드 실패</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

// API 요청 - 네트워크 우선, 실패시 캐시
async function handleApiRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // GET 요청만 캐시
      if (request.method === 'GET') {
        cache.put(request, networkResponse.clone());
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] API request failed, trying cache:', error);
    
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      // 오프라인 헤더 추가
      const response = cachedResponse.clone();
      response.headers.set('X-Served-By', 'ServiceWorker-Cache');
      return response;
    }

    // 중요한 API의 경우 오프라인 응답 제공
    if (CRITICAL_API_ROUTES.some(route => request.url.includes(route))) {
      return handleOfflineApiResponse(request);
    }

    throw error;
  }
}

// 캐시 우선 전략 (정적 자산)
async function handleCacheFirstRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Static asset fetch failed:', error);
    throw error;
  }
}

// 페이지 네비게이션 처리
async function handleNavigateRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Page fetch failed, trying cache:', error);
    
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // 오프라인 페이지 제공
    return caches.match('/offline');
  }
}

// 기본 요청 처리
async function handleDefaultRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// 백그라운드 캐시 업데이트
function fetchAndCache(request, cache) {
  fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
    })
    .catch(() => {
      // 백그라운드 업데이트 실패는 무시
    });
}

// 오프라인 API 응답 생성
function handleOfflineApiResponse(request) {
  const url = new URL(request.url);

  // 일자리 목록 오프라인 응답
  if (url.pathname.includes('/jobs')) {
    return new Response(JSON.stringify({
      success: true,
      data: {
        jobs: [
          {
            id: 'offline-1',
            title: '오프라인 모드 - 네트워크 연결을 확인하세요',
            company: '시스템 알림',
            location: '현재 위치',
            hourlyPay: 0,
            category: '알림',
            description: '인터넷 연결이 복구되면 최신 일자리 정보를 불러옵니다.',
            isOffline: true
          }
        ]
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Served-By': 'ServiceWorker-Offline'
      }
    });
  }

  // 사용자 정보 오프라인 응답
  if (url.pathname.includes('/auth/me')) {
    return new Response(JSON.stringify({
      success: false,
      message: '오프라인 모드: 사용자 정보를 확인할 수 없습니다.',
      isOffline: true
    }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Served-By': 'ServiceWorker-Offline'
      }
    });
  }

  // 기본 오프라인 응답
  return new Response(JSON.stringify({
    success: false,
    message: '인터넷 연결을 확인하고 다시 시도해주세요.',
    isOffline: true
  }), {
    status: 503,
    headers: {
      'Content-Type': 'application/json',
      'X-Served-By': 'ServiceWorker-Offline'
    }
  });
}

// 푸시 알림 처리
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body || '새로운 알림이 있습니다.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200], // 건설 현장 소음 고려
    tag: data.tag || 'general',
    requireInteraction: data.urgent || false,
    actions: [
      {
        action: 'view',
        title: '확인',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: '닫기',
        icon: '/icons/action-dismiss.png'
      }
    ],
    data: {
      url: data.url || '/',
      timestamp: Date.now()
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '일데이', options)
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // 이미 열린 탭이 있으면 포커스
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }

      // 새 탭 열기
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// 백그라운드 동기화 (추후 구현)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'job-application') {
    event.waitUntil(syncJobApplication());
  }
});

// 일자리 지원 동기화 (오프라인에서 지원한 것들)
async function syncJobApplication() {
  // IndexedDB에서 대기중인 지원 데이터 가져오기
  // 네트워크 복구시 서버로 전송
  console.log('[SW] Syncing job applications...');
}