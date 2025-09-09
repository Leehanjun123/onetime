'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { clearAuth, setCredentials } from '@/store/slices/authSlice';
import NotificationCenter from './NotificationCenter';

export default function Navigation() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // 로그인 상태 확인
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData && !isAuthenticated) {
      dispatch(setCredentials({
        user: JSON.parse(userData),
        token: token
      }));
    }
  }, [pathname, dispatch, isAuthenticated]); // 경로 변경 시 재확인

  const handleLogout = () => {
    dispatch(clearAuth());
    window.location.href = '/';
  };

  const handleTestNotification = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:4000/api/v1/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: '매칭 완료',
          message: '새로운 일용직 매칭이 완료되었습니다!',
          type: 'MATCH_FOUND'
        })
      });

      if (response.ok) {
        console.log('테스트 알림 전송 완료');
      }
    } catch (error) {
      console.error('테스트 알림 전송 실패:', error);
    }
  };

  const menuItems = [
    { label: '홈', href: '/', icon: '🏠' },
    { label: '일용직 구인', href: '/jobs/daily', icon: '🔨' },
    { label: '근처 일자리', href: '/jobs/nearby', icon: '📍', requireAuth: true },
    { label: '당일 매칭', href: '/matching/request', icon: '⚡' },
    { label: '일용직 이력서', href: '/resume/create', icon: '📝', requireAuth: true },
    { label: '당일 정산', href: '/payment/daily', icon: '💰', requireAuth: true },
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🔨</span>
              <span className="text-xl font-bold text-orange-600">일데이</span>
              <span className="text-sm text-gray-500 hidden sm:inline">당일 일용직</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {menuItems.map((item) => {
              if (item.requireAuth && !isAuthenticated) return null;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <NotificationCenter />
                <div className="hidden sm:block">
                  <span className="text-sm text-gray-700">
                    안녕하세요, <span className="font-medium">{user?.firstName}{user?.lastName}님</span>
                  </span>
                </div>
                <button
                  onClick={handleTestNotification}
                  className="hidden sm:inline-flex bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 text-xs font-medium items-center"
                >
                  🔔 테스트
                </button>
                <button
                  onClick={handleTestNotification}
                  className="sm:hidden bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 text-xs"
                  title="테스트 알림"
                >
                  🔔
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm font-medium"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 text-sm font-medium"
                >
                  로그인
                </Link>
                <Link
                  href="/register"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium"
                >
                  회원가입
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {menuItems.map((item) => {
              if (item.requireAuth && !isAuthenticated) return null;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                    pathname === item.href
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}