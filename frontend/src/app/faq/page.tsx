'use client'

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState<number[]>([]);

  const categories = [
    { id: 'all', name: '전체' },
    { id: 'payment', name: '급여/정산' },
    { id: 'work', name: '근무' },
    { id: 'account', name: '계정' },
    { id: 'other', name: '기타' },
  ];

  const faqs = [
    {
      id: 1,
      category: 'payment',
      question: '당일정산은 어떻게 받나요?',
      answer: '근무 종료 후 기업에서 현금 또는 계좌이체로 즉시 지급합니다. 당일정산이 가능한 일자리는 공고에 명시되어 있습니다.',
    },
    {
      id: 2,
      category: 'work',
      question: '면접 없이 바로 일할 수 있나요?',
      answer: '대부분의 일용직 일자리는 간단한 전화 통화 후 바로 근무 가능합니다. 다만, 업체에 따라 간단한 면접이 있을 수 있습니다.',
    },
    {
      id: 3,
      category: 'work',
      question: '근무중 사고가 발생하면 어떻게 하나요?',
      answer: '모든 기업은 산재보험에 가입되어 있습니다. 사고 발생 시 즉시 관리자에게 알리고, 일데이 고객센터(1588-1234)로 연락해주세요.',
    },
    {
      id: 4,
      category: 'payment',
      question: '급여가 지급되지 않았어요',
      answer: '급여 미지급 시 일데이 고객센터로 즉시 신고해주세요. 일데이가 직접 중재하여 해결해드립니다.',
    },
    {
      id: 5,
      category: 'account',
      question: '회원탈퇴는 어떻게 하나요?',
      answer: '마이페이지 > 설정 > 회원탈퇴에서 가능합니다. 탈퇴 시 모든 데이터가 삭제되며 복구가 불가능합니다.',
    },
    {
      id: 6,
      category: 'other',
      question: '앱은 어디서 다운로드 하나요?',
      answer: 'iOS는 앱스토어, Android는 구글 플레이에서 "일데이"를 검색하여 다운로드 하실 수 있습니다.',
    },
  ];

  const filteredFAQs = activeCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === activeCategory);

  const toggleExpand = (id: number) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">자주 묻는 질문</h1>

        {/* 카테고리 탭 */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? 'default' : 'ghost'}
              onClick={() => setActiveCategory(category.id)}
              size="sm"
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* FAQ 목록 */}
        <div className="space-y-4">
          {filteredFAQs.map((faq) => (
            <Card key={faq.id} variant="elevated">
              <button
                className="w-full text-left p-6 focus:outline-none"
                onClick={() => toggleExpand(faq.id)}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">
                    Q. {faq.question}
                  </h3>
                  <span className="text-gray-400">
                    {expandedItems.includes(faq.id) ? '▲' : '▼'}
                  </span>
                </div>
                {expandedItems.includes(faq.id) && (
                  <div className="mt-4 text-gray-600">
                    A. {faq.answer}
                  </div>
                )}
              </button>
            </Card>
          ))}
        </div>

        {/* 추가 문의 */}
        <Card variant="gradient" className="mt-8">
          <CardContent className="p-6 text-center text-white">
            <h3 className="text-xl font-bold mb-3">더 궁금하신 점이 있으신가요?</h3>
            <p className="mb-4">고객센터로 문의해주세요</p>
            <div className="flex justify-center gap-4">
              <Button variant="secondary">
                📞 1588-1234
              </Button>
              <Button variant="secondary">
                💬 카카오톡 상담
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}