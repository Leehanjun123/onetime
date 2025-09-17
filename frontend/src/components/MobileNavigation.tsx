'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
}

export default function MobileNavigation() {
  const pathname = usePathname();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('home');
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const mainNavItems: NavItem[] = [
    { id: 'home', label: '홈', icon: '🏠', path: '/dashboard' },
    { id: 'jobs', label: '일자리', icon: '💼', path: '/jobs/nearby', badge: 5 },
    { id: 'attendance', label: '출퇴근', icon: '⏰', path: '/work/attendance' },
    { id: 'messages', label: '메시지', icon: '💬', path: '/messages', badge: 3 },
    { id: 'profile', label: '내정보', icon: '👤', path: '/profile' }
  ];

  useEffect(() => {
    // Update active tab based on current path
    const currentItem = mainNavItems.find(item => pathname.startsWith(item.path));
    if (currentItem) {
      setActiveTab(currentItem.id);
    }
  }, [pathname]);

  useEffect(() => {
    // PWA install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  if (!isAuthenticated) return null;

  // Hide on admin pages
  if (pathname.startsWith('/admin')) return null;

  return (
    <>
      {/* PWA Install Banner */}
      {showInstallPrompt && (
        <div className="fixed top-0 left-0 right-0 bg-orange-600 text-white p-3 z-50 md:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">📱</span>
              <div>
                <p className="font-semibold text-sm">일데이 앱 설치</p>
                <p className="text-xs opacity-90">홈 화면에 추가하고 더 빠르게 이용하세요</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                className="bg-white text-orange-600 px-3 py-1 rounded text-sm font-medium"
              >
                설치
              </button>
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="text-white opacity-80"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="grid grid-cols-5 h-16">
          {mainNavItems.map((item) => (
            <Link
              key={item.id}
              href={item.path}
              className={`flex flex-col items-center justify-center relative ${
                activeTab === item.id 
                  ? 'text-orange-600' 
                  : 'text-gray-500'
              }`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="absolute top-1 right-4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* Quick Action Button (FAB) */}
      <button
        className="md:hidden fixed bottom-20 right-4 bg-orange-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg z-40 hover:bg-orange-700 transition-all transform hover:scale-110"
        onClick={() => {
          // Open quick actions menu
          document.getElementById('quickActionsModal')?.classList.remove('hidden');
        }}
      >
        <span className="text-2xl">➕</span>
      </button>

      {/* Quick Actions Modal */}
      <div
        id="quickActionsModal"
        className="hidden fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            e.currentTarget.classList.add('hidden');
          }
        }}
      >
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6">
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>
          <h3 className="text-lg font-semibold mb-4">빠른 작업</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: '📍', label: '근처 일자리', path: '/jobs/nearby' },
              { icon: '🤖', label: '스마트매칭', path: '/smart-matching' },
              { icon: '🆘', label: '긴급지원', path: '/emergency' },
              { icon: '📚', label: '교육신청', path: '/education' },
              { icon: '💰', label: '급여확인', path: '/payments' },
              { icon: '🏅', label: '자격증', path: '/certifications' }
            ].map((action) => (
              <Link
                key={action.label}
                href={action.path}
                className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                onClick={() => {
                  document.getElementById('quickActionsModal')?.classList.add('hidden');
                }}
              >
                <span className="text-2xl mb-2">{action.icon}</span>
                <span className="text-xs text-center">{action.label}</span>
              </Link>
            ))}
          </div>
          <button
            onClick={() => {
              document.getElementById('quickActionsModal')?.classList.add('hidden');
            }}
            className="w-full mt-4 py-3 bg-gray-100 rounded-lg text-gray-600"
          >
            닫기
          </button>
        </div>
      </div>

      {/* Pull to Refresh Indicator */}
      <div className="md:hidden fixed top-16 left-1/2 transform -translate-x-1/2 z-30">
        <div
          id="refreshIndicator"
          className="hidden bg-white rounded-full shadow-lg p-3"
        >
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30 transform -translate-y-full transition-transform duration-300" id="mobileSearchBar">
        <div className="flex items-center gap-2 p-3">
          <button
            onClick={() => {
              document.getElementById('mobileSearchBar')?.classList.add('-translate-y-full');
            }}
            className="text-gray-500"
          >
            ←
          </button>
          <input
            type="search"
            placeholder="일자리, 사용자, 게시글 검색..."
            className="flex-1 px-3 py-2 bg-gray-100 rounded-lg focus:outline-none focus:bg-white focus:border focus:border-orange-500"
          />
          <button className="text-orange-600 font-medium">검색</button>
        </div>
      </div>

      <style jsx>{`
        /* Add padding to main content to account for bottom navigation */
        :global(main) {
          padding-bottom: 80px !important;
        }

        @media (min-width: 768px) {
          :global(main) {
            padding-bottom: 0 !important;
          }
        }
      `}</style>
    </>
  );
}