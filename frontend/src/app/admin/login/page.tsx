'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('https://onetime-production.up.railway.app/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 관리자 권한 확인 (실제로는 백엔드에서 role 체크 필요)
        if (email === 'admin@onetime.com') {
          localStorage.setItem('adminToken', data.data.token);
          localStorage.setItem('adminUser', JSON.stringify(data.data.user));
          router.push('/admin/dashboard');
        } else {
          setError('관리자 권한이 없습니다.');
        }
      } else {
        setError(data.message || '로그인에 실패했습니다.');
      }
    } catch (error) {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4 relative overflow-hidden">
      {/* 배경 애니메이션 */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <Card variant="glass" className="max-w-md w-full relative z-10 border-gray-700 bg-gray-900/90 backdrop-blur-xl">
        <CardContent className="p-8">
          {/* 로고 및 헤더 */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-2xl">
              <span className="text-white text-3xl font-bold">A</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              OneTime Admin
            </h1>
            <p className="text-gray-400 mt-2">관리자 대시보드 로그인</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="이메일"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@onetime.com"
              leftIcon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              }
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20"
            />

            <Input
              label="비밀번호"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              showPasswordToggle
              leftIcon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20"
            />

            {/* 로그인 옵션 */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-600 text-orange-500 focus:ring-orange-500 bg-gray-800" />
                <span className="ml-2 text-sm text-gray-400">로그인 상태 유지</span>
              </label>
              <a href="#" className="text-sm text-orange-400 hover:text-orange-300 transition-colors">
                비밀번호 찾기
              </a>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {loading ? '로그인 중...' : '관리자 로그인'}
            </Button>
          </form>

          {/* 보안 정보 */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-3">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>보안 연결됨 · SSL 암호화</span>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">테스트 계정</p>
              <p className="text-sm text-gray-300 font-mono">
                admin@onetime.com / Admin1234!
              </p>
            </div>
          </div>

          {/* 푸터 */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              © 2024 OneTime. All rights reserved.
            </p>
            <div className="flex items-center justify-center gap-4 mt-2">
              <a href="#" className="text-xs text-gray-500 hover:text-gray-400 transition-colors">
                이용약관
              </a>
              <span className="text-gray-600">·</span>
              <a href="#" className="text-xs text-gray-500 hover:text-gray-400 transition-colors">
                개인정보처리방침
              </a>
              <span className="text-gray-600">·</span>
              <a href="#" className="text-xs text-gray-500 hover:text-gray-400 transition-colors">
                지원
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}