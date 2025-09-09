'use client'

import { useEffect } from 'react';

export default function ServiceWorkerCleanup() {
  useEffect(() => {
    // 모든 Service Worker 제거
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister().then(function(success) {
            if (success) {
              console.log('Service Worker unregistered:', registration);
            }
          });
        }
      });
      
      // 캐시 삭제
      if ('caches' in window) {
        caches.keys().then(function(names) {
          for (let name of names) {
            caches.delete(name);
            console.log('Cache deleted:', name);
          }
        });
      }
    }
  }, []);

  return null;
}