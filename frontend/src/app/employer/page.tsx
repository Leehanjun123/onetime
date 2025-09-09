'use client'

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function EmployerPage() {
  const [companyName, setCompanyName] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            기업 회원 서비스
          </h1>
          <p className="text-xl text-gray-600">
            검증된 인재를 빠르고 쉽게 채용하세요
          </p>
        </div>

        {/* 주요 기능 카드 */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card variant="elevated" className="hover:shadow-2xl transition-all">
            <CardHeader>
              <div className="text-4xl mb-4">📝</div>
              <CardTitle>간편한 공고 등록</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                5분 만에 채용 공고를 등록하고 즉시 인재를 모집하세요
              </p>
              <Button variant="default" fullWidth>
                공고 등록하기
              </Button>
            </CardContent>
          </Card>

          <Card variant="elevated" className="hover:shadow-2xl transition-all">
            <CardHeader>
              <div className="text-4xl mb-4">🤖</div>
              <CardTitle>AI 매칭 시스템</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                AI가 귀사에 가장 적합한 인재를 자동으로 추천해드립니다
              </p>
              <Button variant="secondary" fullWidth>
                매칭 시작하기
              </Button>
            </CardContent>
          </Card>

          <Card variant="elevated" className="hover:shadow-2xl transition-all">
            <CardHeader>
              <div className="text-4xl mb-4">💰</div>
              <CardTitle>당일 정산 시스템</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                근로자 급여를 당일 자동 정산하는 편리한 시스템
              </p>
              <Button variant="success" fullWidth>
                정산 관리
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 통계 섹션 */}
        <Card variant="gradient" className="mb-12">
          <CardContent className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
              <div>
                <div className="text-3xl font-bold mb-2">8,500+</div>
                <div className="text-white/80">등록 기업</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">127,000+</div>
                <div className="text-white/80">활성 구직자</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">95%</div>
                <div className="text-white/80">매칭 성공률</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">24시간</div>
                <div className="text-white/80">평균 채용 시간</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 문의 폼 */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>기업 회원 가입 문의</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="회사명"
                  placeholder="회사명을 입력하세요"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Input
                  label="연락처"
                  placeholder="010-0000-0000"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="mt-6 flex gap-4">
              <Button variant="default" size="lg">
                가입 문의하기
              </Button>
              <Button variant="ghost" size="lg">
                <Link href="/employer/login">
                  기업 회원 로그인
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 혜택 안내 */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-6">기업 회원 혜택</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-lg shadow">
              <div className="text-2xl mb-2">✅</div>
              <div className="font-semibold">무제한 공고 등록</div>
            </div>
            <div className="p-4 bg-white rounded-lg shadow">
              <div className="text-2xl mb-2">📊</div>
              <div className="font-semibold">채용 통계 리포트</div>
            </div>
            <div className="p-4 bg-white rounded-lg shadow">
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-semibold">맞춤형 인재 추천</div>
            </div>
            <div className="p-4 bg-white rounded-lg shadow">
              <div className="text-2xl mb-2">💳</div>
              <div className="font-semibold">자동 급여 정산</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}