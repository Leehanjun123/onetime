'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { clearAuth, setCredentials } from '@/store/slices/authSlice';
import NotificationSystem from './NotificationSystem';

export default function SimpleNavigation() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData && !isAuthenticated) {
      dispatch(setCredentials({
        user: JSON.parse(userData),
        token: token
      }));
    }
  }, [pathname, dispatch, isAuthenticated]);

  const handleLogout = () => {
    dispatch(clearAuth());
    window.location.href = '/';
  };

  // 주요 메뉴 아이템 (가로로 표시)
  const mainMenuItems = [
    { href: '/jobs', label: '일자리', icon: '💼' },
    { href: '/smart-matching', label: '스마트매칭', icon: '🤖' },
    { href: '/work/attendance', label: '출퇴근', icon: '⏰' },
    { href: '/profile', label: '프로필', icon: '👤' },
    { href: '/payments', label: '급여', icon: '💰' },
  ];

  // 추가 메뉴 아이템 (드롭다운으로 표시)
  const moreMenuItems = [
    { href: '/jobs/nearby', label: '근처 일자리', icon: '📍' },
    { href: '/reviews', label: '리뷰', icon: '⭐' },
    { href: '/portfolio', label: '포트폴리오', icon: '📋' },
    { href: '/certifications', label: '인증', icon: '🏅' },
    { href: '/tiers', label: '등급', icon: '🏆' },
    { href: '/messages', label: '메시지', icon: '💬' },
    { href: '/work-tracking', label: '업무추적', icon: '📊' },
    { href: '/analytics', label: '분석', icon: '📈' },
    { href: '/trends', label: '트렌드', icon: '🗺️' },
    { href: '/earnings-forecast', label: '예측', icon: '💹' },
    { href: '/reports', label: '리포트', icon: '📄' },
    { href: '/community', label: '커뮤니티', icon: '👥' },
    { href: '/legal', label: '법률지원', icon: '⚖️' },
    { href: '/emergency', label: '긴급지원', icon: '🆘' },
    { href: '/benefits', label: '복지혜택', icon: '🎁' },
    { href: '/teams', label: '팀관리', icon: '👨‍👩‍👧‍👦' },
    { href: '/education', label: '교육', icon: '🎓' },
    { href: '/safety', label: '안전', icon: '🛡️' },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-2xl">🔨</span>
            <span className="text-xl font-bold text-orange-600">일데이</span>
          </Link>

          {/* Desktop Menu */}
          {isAuthenticated && (
            <div className="hidden lg:flex items-center gap-1 flex-1 mx-8">
              {/* 주요 메뉴 */}
              {mainMenuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all whitespace-nowrap ${
                    pathname === item.href
                      ? 'bg-orange-100 text-orange-700 rounded-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}

              {/* 더보기 드롭다운 */}
              <div className="relative">
                <button
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  onBlur={() => setTimeout(() => setIsMoreMenuOpen(false), 200)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-all"
                >
                  <span className="text-base">⋯</span>
                  <span>더보기</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${isMoreMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* 드롭다운 메뉴 */}
                {isMoreMenuOpen && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 max-h-96 overflow-y-auto">
                    {moreMenuItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                          pathname === item.href
                            ? 'bg-orange-50 text-orange-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-base">{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <NotificationSystem userId={user?.id} />
                <div className="hidden sm:flex items-center gap-3">
                  <div className="text-sm text-gray-700">
                    {user?.firstName}{user?.lastName}님
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 text-sm font-medium transition-colors"
                  >
                    로그아웃
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-gray-700 px-3 py-2 rounded-md hover:bg-gray-100 text-sm transition-colors"
                >
                  로그인
                </Link>
                <Link
                  href="/register"
                  className="bg-orange-600 text-white px-3 py-2 rounded-md hover:bg-orange-700 text-sm transition-colors"
                >
                  회원가입
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            {isAuthenticated && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && isAuthenticated && (
          <div className="lg:hidden border-t border-gray-200 py-3 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="space-y-1">
              {/* 주요 메뉴 */}
              <div className="px-2 pb-2 border-b border-gray-100">
                <div className="text-xs text-gray-500 font-semibold px-3 py-2">주요 메뉴</div>
                {mainMenuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                      pathname === item.href
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>

              {/* 추가 메뉴 */}
              <div className="px-2 pt-2">
                <div className="text-xs text-gray-500 font-semibold px-3 py-2">추가 메뉴</div>
                {moreMenuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                      pathname === item.href
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>

              {/* 모바일 유저 메뉴 */}
              <div className="px-2 pt-3 mt-3 border-t border-gray-200 sm:hidden">
                <div className="px-3 py-2 text-sm text-gray-700 font-medium">
                  {user?.firstName}{user?.lastName}님
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}