'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SupportPage() {
  const faqs = [
    {
      question: '당일 정산은 어떻게 받나요?',
      answer: '근무 종료 후 기업에서 현금 또는 계좌이체로 즉시 지급합니다.',
    },
    {
      question: '면접 없이 바로 일할 수 있나요?',
      answer: '대부분의 일자리는 간단한 전화 통화 후 바로 근무 가능합니다.',
    },
    {
      question: '근무중 사고가 발생하면 어떻게 하나요?',
      answer: '모든 기업은 산재보험에 가입되어 있으며, 고객센터로 즉시 연락해주세요.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">고객지원</h1>

        {/* 문의 양식 */}
        <Card variant="elevated" className="mb-8">
          <CardHeader>
            <CardTitle>1:1 문의하기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  문의내용
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={4}
                  placeholder="문의하실 내용을 입력해주세요"
                />
              </div>
              <Button variant="default" fullWidth>
                문의 전송
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 고객센터 정보 */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card variant="elevated">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-4xl mb-4">📞</div>
                <h3 className="text-xl font-bold mb-2">전화 문의</h3>
                <p className="text-2xl font-bold text-orange-600 mb-1">1588-1234</p>
                <p className="text-sm text-gray-600">
                  평일 09:00 - 18:00<br />
                  주말/공휴일 휴무
                </p>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-xl font-bold mb-2">카카오톡 상담</h3>
                <p className="text-lg font-semibold mb-2">@일데이</p>
                <Button variant="secondary" size="sm">
                  카카오톡 바로가기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 자주 묻는 질문 */}
        <Card variant="default">
          <CardHeader>
            <CardTitle>자주 묻는 질문</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b pb-4 last:border-0">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Q. {faq.question}
                  </h4>
                  <p className="text-gray-600 text-sm">
                    A. {faq.answer}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Button variant="ghost">
                더 많은 FAQ 보기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}