'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">문의하기</h1>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* 연락처 정보 */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>연락처 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">📞 전화문의</h4>
                  <p className="text-2xl font-bold text-orange-600">1588-1234</p>
                  <p className="text-sm text-gray-600">평일 09:00 - 18:00</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">📧 이메일</h4>
                  <p className="text-gray-700">support@ilday.co.kr</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">📍 주소</h4>
                  <p className="text-gray-700">
                    서울특별시 강남구 테헤란로 123<br />
                    일데이빌딩 4층
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 빠른 연락 */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>빠른 연락</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button variant="secondary" fullWidth>
                  💬 카카오톡 상담
                </Button>
                <Button variant="secondary" fullWidth>
                  📱 네이버 톡톡 상담
                </Button>
                <Button variant="secondary" fullWidth>
                  📨 실시간 채팅 상담
                </Button>
                <div className="text-center text-sm text-gray-600 pt-2">
                  실시간 상담 가능 시간<br />
                  평일 09:00 - 20:00
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 문의 폼 */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>문의 남기기</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="이름"
                  placeholder="이름을 입력하세요"
                  required
                />
                <Input
                  label="연락처"
                  placeholder="010-0000-0000"
                  required
                />
              </div>
              <Input
                label="이메일"
                type="email"
                placeholder="example@email.com"
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  문의 유형
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option>선택해주세요</option>
                  <option>일반 문의</option>
                  <option>급여 관련</option>
                  <option>기업 문의</option>
                  <option>기술 지원</option>
                  <option>기타</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  문의 내용
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={5}
                  placeholder="문의하실 내용을 자세히 작성해주세요"
                  required
                />
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="agree" className="mr-2" />
                <label htmlFor="agree" className="text-sm text-gray-600">
                  개인정보 수집 및 이용에 동의합니다
                </label>
              </div>
              <Button variant="default" fullWidth>
                문의 전송
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}