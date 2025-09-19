// 모든 캐시와 Service Worker를 완전히 지우는 스크립트
(async function clearAllCache() {
  console.log('🧹 캐시 및 Service Worker 완전 초기화 시작...');
  
  try {
    // 1. Service Worker 등록 해제
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        console.log('🔄 Service Worker 등록 해제:', registration.scope);
        await registration.unregister();
      }
    }
    
    // 2. 모든 캐시 삭제
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        console.log('🗑️ 캐시 삭제:', cacheName);
        await caches.delete(cacheName);
      }
    }
    
    // 3. localStorage 클리어
    localStorage.clear();
    console.log('🧽 localStorage 초기화 완료');
    
    // 4. sessionStorage 클리어
    sessionStorage.clear();
    console.log('🧽 sessionStorage 초기화 완료');
    
    // 5. IndexedDB 클리어 (있는 경우)
    if ('indexedDB' in window) {
      try {
        await new Promise((resolve, reject) => {
          const deleteRequest = indexedDB.deleteDatabase('onetime-db');
          deleteRequest.onsuccess = () => resolve(true);
          deleteRequest.onerror = () => reject(deleteRequest.error);
        });
        console.log('🧽 IndexedDB 초기화 완료');
      } catch (err) {
        console.log('ℹ️ IndexedDB 없음 또는 초기화 불필요');
      }
    }
    
    console.log('✅ 모든 캐시 및 데이터 초기화 완료!');
    console.log('🔄 페이지를 새로고침합니다...');
    
    // 6. 페이지 새로고침
    setTimeout(() => {
      window.location.reload(true);
    }, 1000);
    
  } catch (error) {
    console.error('❌ 캐시 초기화 중 오류:', error);
  }
})();