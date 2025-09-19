'use client'

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'next/navigation';

export default function PortfolioPage() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return <div>로그인이 필요합니다...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-16">
          <div className="text-6xl mb-6">🚧</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            포트폴리오 시스템 개발 중
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            일용직 근로자를 위한 포트폴리오 관리 시스템이 현재 개발 중입니다.
            <br />
            곧 만나보실 수 있습니다.
          </p>
          <a
            href="/jobs"
            className="inline-block bg-orange-600 text-white px-8 py-3 rounded-lg hover:bg-orange-700 text-lg font-medium"
          >
            일자리 찾기
          </a>
        </div>
      </div>
    </div>
  );
}