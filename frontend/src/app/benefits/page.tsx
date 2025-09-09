'use client'

import { useState } from 'react';
import Link from 'next/link';

interface Benefit {
  id: string;
  category: '건강' | '교육' | '문화' | '금융' | '생활' | '가족';
  title: string;
  provider: string;
  description: string;
  discountRate?: number;
  originalPrice?: number;
  discountedPrice?: number;
  eligibility: string[];
  validUntil: string;
  usageLimit?: string;
  isPopular: boolean;
  usageCount: number;
}

interface Insurance {
  id: string;
  type: '산재보험' | '고용보험' | '건강보험' | '국민연금' | '상해보험';
  name: string;
  coverage: string[];
  premium: number;
  status: '가입' | '미가입' | '처리중';
  startDate?: string;
  endDate?: string;
  provider: string;
  benefits: string[];
}

interface WelfarePoint {
  id: string;
  type: '적립' | '사용' | '소멸예정';
  amount: number;
  description: string;
  date: string;
  expiryDate?: string;
  merchant?: string;
}

interface HealthCheckup {
  id: string;
  type: '일반검진' | '특수검진' | '종합검진';
  hospital: string;
  date: string;
  time: string;
  status: '예약' | '완료' | '취소';
  items: string[];
  cost: number;
  subsidizedCost: number;
}

export default function BenefitsPage() {
  const [activeTab, setActiveTab] = useState<'benefits' | 'insurance' | 'points' | 'health'>('benefits');
  const [showBenefitModal, setShowBenefitModal] = useState(false);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);
  const [totalPoints] = useState(45800);
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');

  const [benefits] = useState<Benefit[]>([
    {
      id: '1',
      category: '건강',
      title: '연간 건강검진 무료 지원',
      provider: '서울노동자건강센터',
      description: '일용직 근로자 대상 무료 종합검진 지원',
      eligibility: ['6개월 이상 근무', '만 20세 이상'],
      validUntil: '2024-12-31',
      isPopular: true,
      usageCount: 1523
    },
    {
      id: '2',
      category: '교육',
      title: '자격증 교육비 50% 지원',
      provider: '한국산업인력공단',
      description: '기술 자격증 취득 교육비 최대 50% 지원',
      discountRate: 50,
      originalPrice: 600000,
      discountedPrice: 300000,
      eligibility: ['1년 이상 근무', '월 15일 이상 근무자'],
      validUntil: '2024-06-30',
      usageLimit: '연 1회',
      isPopular: true,
      usageCount: 892
    },
    {
      id: '3',
      category: '문화',
      title: '영화관람권 40% 할인',
      provider: 'CGV, 롯데시네마',
      description: '주말 영화 관람료 40% 할인',
      discountRate: 40,
      originalPrice: 15000,
      discountedPrice: 9000,
      eligibility: ['모든 등록 근로자'],
      validUntil: '2024-12-31',
      usageLimit: '월 2회',
      isPopular: false,
      usageCount: 456
    },
    {
      id: '4',
      category: '금융',
      title: '저금리 생활안정자금 대출',
      provider: '근로복지공단',
      description: '연 2.5% 저금리 생활자금 대출',
      eligibility: ['6개월 이상 근무', '신용등급 6등급 이내'],
      validUntil: '2024-12-31',
      isPopular: true,
      usageCount: 2103
    },
    {
      id: '5',
      category: '생활',
      title: '대형마트 5% 추가 할인',
      provider: '이마트, 홈플러스',
      description: '생필품 구매 시 5% 추가 할인',
      discountRate: 5,
      eligibility: ['모든 등록 근로자'],
      validUntil: '2024-12-31',
      usageLimit: '월 50만원 한도',
      isPopular: false,
      usageCount: 3421
    },
    {
      id: '6',
      category: '가족',
      title: '자녀 학원비 20% 지원',
      provider: '교육복지재단',
      description: '자녀 학원 수강료 20% 지원',
      discountRate: 20,
      eligibility: ['자녀 보유 근로자', '월 20일 이상 근무'],
      validUntil: '2024-08-31',
      usageLimit: '자녀 1인당 월 20만원',
      isPopular: false,
      usageCount: 567
    }
  ]);

  const [insurances] = useState<Insurance[]>([
    {
      id: '1',
      type: '산재보험',
      name: '산업재해보상보험',
      coverage: ['업무상 재해', '출퇴근 재해', '직업병'],
      premium: 0,
      status: '가입',
      startDate: '2024-01-01',
      provider: '근로복지공단',
      benefits: ['치료비 전액', '휴업급여 지급', '장해급여']
    },
    {
      id: '2',
      type: '고용보험',
      name: '고용보험',
      coverage: ['실업급여', '직업능력개발', '모성보호'],
      premium: 11000,
      status: '가입',
      startDate: '2024-01-01',
      provider: '고용노동부',
      benefits: ['구직급여', '취업촉진수당', '육아휴직급여']
    },
    {
      id: '3',
      type: '건강보험',
      name: '국민건강보험',
      coverage: ['질병 치료', '건강검진', '예방접종'],
      premium: 45000,
      status: '가입',
      startDate: '2024-01-01',
      provider: '국민건강보험공단',
      benefits: ['의료비 지원', '건강검진', '본인부담 상한제']
    },
    {
      id: '4',
      type: '상해보험',
      name: '단체상해보험',
      coverage: ['상해사망', '상해후유장해', '골절진단비'],
      premium: 15000,
      status: '처리중',
      provider: 'KB손해보험',
      benefits: ['사망보험금 1억', '후유장해 최대 1억', '골절 진단비 50만원']
    }
  ]);

  const [welfarePoints] = useState<WelfarePoint[]>([
    {
      id: '1',
      type: '적립',
      amount: 5000,
      description: '월간 근무 보너스 포인트',
      date: '2024-01-25',
      expiryDate: '2025-01-25'
    },
    {
      id: '2',
      type: '사용',
      amount: -3000,
      description: '온라인 교육 수강료',
      date: '2024-01-20',
      merchant: '한국산업인력공단'
    },
    {
      id: '3',
      type: '적립',
      amount: 2000,
      description: '안전교육 이수 포인트',
      date: '2024-01-15',
      expiryDate: '2025-01-15'
    },
    {
      id: '4',
      type: '소멸예정',
      amount: 8000,
      description: '2023년 연말 보너스 포인트',
      date: '2023-12-31',
      expiryDate: '2024-02-28'
    }
  ]);

  const [healthCheckups] = useState<HealthCheckup[]>([
    {
      id: '1',
      type: '일반검진',
      hospital: '서울노동자건강센터',
      date: '2024-02-15',
      time: '09:00',
      status: '예약',
      items: ['기본 혈액검사', '흉부 X-ray', '시력검사', '청력검사'],
      cost: 150000,
      subsidizedCost: 0
    },
    {
      id: '2',
      type: '특수검진',
      hospital: '산업보건센터',
      date: '2024-01-10',
      time: '14:00',
      status: '완료',
      items: ['소음성 난청검사', '진폐검사', '근골격계 검사'],
      cost: 200000,
      subsidizedCost: 0
    }
  ]);

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case '건강': return '🏥';
      case '교육': return '📚';
      case '문화': return '🎬';
      case '금융': return '💳';
      case '생활': return '🛒';
      case '가족': return '👨‍👩‍👧‍👦';
      default: return '🎁';
    }
  };

  const getInsuranceIcon = (type: string) => {
    switch(type) {
      case '산재보험': return '🛡️';
      case '고용보험': return '💼';
      case '건강보험': return '🏥';
      case '국민연금': return '👴';
      case '상해보험': return '🚑';
      default: return '📋';
    }
  };

  const filteredBenefits = selectedCategory === '전체' 
    ? benefits 
    : benefits.filter(b => b.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">복지 & 혜택</h1>
          <p className="text-gray-600">근로자를 위한 다양한 복지 혜택과 보험 서비스</p>
        </div>

        {/* Welfare Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500">복지 포인트</span>
              <span className="text-2xl">💰</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">{totalPoints.toLocaleString()}P</div>
            <div className="text-sm text-red-500 mt-1">2월말 8,000P 소멸예정</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500">이용 가능 혜택</span>
              <span className="text-2xl">🎁</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{benefits.length}개</div>
            <div className="text-sm text-gray-500 mt-1">신규 3개 추가</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500">가입 보험</span>
              <span className="text-2xl">🛡️</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{insurances.filter(i => i.status === '가입').length}개</div>
            <div className="text-sm text-gray-500 mt-1">4대보험 가입완료</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500">예정 검진</span>
              <span className="text-2xl">🏥</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{healthCheckups.filter(h => h.status === '예약').length}건</div>
            <div className="text-sm text-gray-500 mt-1">2월 15일 예약</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              {[
                { id: 'benefits', label: '복지 혜택', icon: '🎁' },
                { id: 'insurance', label: '보험', icon: '🛡️' },
                { id: 'points', label: '포인트', icon: '💰' },
                { id: 'health', label: '건강검진', icon: '🏥' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'benefits' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2">
                  {['전체', '건강', '교육', '문화', '금융', '생활', '가족'].map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedCategory === category
                          ? 'bg-orange-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {category === '전체' ? category : `${getCategoryIcon(category)} ${category}`}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowBenefitModal(true)}
                  className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
                >
                  혜택 신청
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredBenefits.map((benefit) => (
                  <div key={benefit.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getCategoryIcon(benefit.category)}</span>
                        <div>
                          <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                            {benefit.category}
                          </span>
                          {benefit.isPopular && (
                            <span className="ml-2 bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-medium">
                              인기
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {benefit.usageCount.toLocaleString()}명 이용
                      </span>
                    </div>

                    <h3 className="font-semibold text-lg mb-1">{benefit.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{benefit.description}</p>

                    {benefit.discountRate && (
                      <div className="mb-3">
                        <span className="text-2xl font-bold text-orange-600">{benefit.discountRate}%</span>
                        <span className="text-gray-500 line-through ml-2">
                          {benefit.originalPrice?.toLocaleString()}원
                        </span>
                        <span className="text-lg font-semibold ml-1">
                          → {benefit.discountedPrice?.toLocaleString()}원
                        </span>
                      </div>
                    )}

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">자격: </span>
                        <span className="text-gray-700">{benefit.eligibility.join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">유효기간: </span>
                        <span className="text-gray-700">{benefit.validUntil}</span>
                      </div>
                      {benefit.usageLimit && (
                        <div>
                          <span className="text-gray-500">이용한도: </span>
                          <span className="text-gray-700">{benefit.usageLimit}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm text-gray-500">제공: {benefit.provider}</span>
                      <button
                        onClick={() => setSelectedBenefit(benefit)}
                        className="bg-orange-100 text-orange-600 px-3 py-1 rounded hover:bg-orange-200 text-sm font-medium"
                      >
                        상세보기
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'insurance' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">보험 가입 현황</h2>
                <button
                  onClick={() => setShowInsuranceModal(true)}
                  className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
                >
                  보험 가입 상담
                </button>
              </div>

              <div className="space-y-4">
                {insurances.map((insurance) => (
                  <div key={insurance.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{getInsuranceIcon(insurance.type)}</span>
                        <div>
                          <h3 className="font-semibold text-lg">{insurance.name}</h3>
                          <p className="text-sm text-gray-600">{insurance.provider}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        insurance.status === '가입' ? 'bg-green-100 text-green-800' :
                        insurance.status === '처리중' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {insurance.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <span className="text-gray-500 text-sm">월 보험료</span>
                        <p className="font-semibold">{insurance.premium.toLocaleString()}원</p>
                      </div>
                      {insurance.startDate && (
                        <div>
                          <span className="text-gray-500 text-sm">가입일</span>
                          <p className="font-semibold">{insurance.startDate}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500 text-sm">보장 항목</span>
                        <p className="font-semibold">{insurance.coverage.length}개</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-500 text-sm">주요 보장</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {insurance.coverage.map((item, idx) => (
                            <span key={idx} className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 text-sm">혜택</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {insurance.benefits.map((benefit, idx) => (
                            <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                              {benefit}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 4대보험 요약 */}
              <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">4대보험 납부 요약</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">국민연금</span>
                    <p className="font-semibold">45,000원/월</p>
                  </div>
                  <div>
                    <span className="text-gray-600">건강보험</span>
                    <p className="font-semibold">35,000원/월</p>
                  </div>
                  <div>
                    <span className="text-gray-600">고용보험</span>
                    <p className="font-semibold">11,000원/월</p>
                  </div>
                  <div>
                    <span className="text-gray-600">산재보험</span>
                    <p className="font-semibold">사업주 부담</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'points' && (
            <div>
              <div className="mb-6">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">복지 포인트</h2>
                      <p className="text-3xl font-bold">{totalPoints.toLocaleString()} P</p>
                      <p className="text-sm mt-2 text-orange-100">이번달 적립: +7,000P | 사용: -3,000P</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-orange-100 mb-1">소멸 예정</p>
                      <p className="text-xl font-semibold">8,000 P</p>
                      <p className="text-xs text-orange-100">2024.02.28</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-3">포인트 사용처</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { name: '교육수강', icon: '📚', points: '5,000P~' },
                    { name: '건강검진', icon: '🏥', points: '10,000P~' },
                    { name: '문화상품권', icon: '🎬', points: '1,000P~' },
                    { name: '생활용품', icon: '🛒', points: '3,000P~' }
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      className="border rounded-lg p-3 hover:bg-gray-50 text-center"
                    >
                      <div className="text-2xl mb-1">{item.icon}</div>
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.points}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">포인트 내역</h3>
                <div className="space-y-3">
                  {welfarePoints.map((point) => (
                    <div key={point.id} className="flex justify-between items-center border-b pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          point.type === '적립' ? 'bg-green-100' :
                          point.type === '사용' ? 'bg-red-100' :
                          'bg-yellow-100'
                        }`}>
                          {point.type === '적립' ? '➕' :
                           point.type === '사용' ? '➖' : '⏰'}
                        </div>
                        <div>
                          <p className="font-medium">{point.description}</p>
                          <p className="text-xs text-gray-500">
                            {point.date}
                            {point.merchant && ` • ${point.merchant}`}
                            {point.expiryDate && ` • 유효기간: ${point.expiryDate}`}
                          </p>
                        </div>
                      </div>
                      <div className={`text-lg font-semibold ${
                        point.type === '적립' ? 'text-green-600' :
                        point.type === '사용' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {point.amount > 0 ? '+' : ''}{point.amount.toLocaleString()}P
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'health' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">건강검진 관리</h2>
                <button
                  onClick={() => setShowHealthModal(true)}
                  className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
                >
                  검진 예약하기
                </button>
              </div>

              <div className="space-y-4 mb-6">
                {healthCheckups.map((checkup) => (
                  <div key={checkup.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{checkup.type}</h3>
                        <p className="text-sm text-gray-600">{checkup.hospital}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        checkup.status === '예약' ? 'bg-blue-100 text-blue-800' :
                        checkup.status === '완료' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {checkup.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                      <div>
                        <span className="text-gray-500">검진일</span>
                        <p className="font-medium">{checkup.date}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">시간</span>
                        <p className="font-medium">{checkup.time}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">검진비용</span>
                        <p className="font-medium">{checkup.cost.toLocaleString()}원</p>
                      </div>
                      <div>
                        <span className="text-gray-500">본인부담</span>
                        <p className="font-medium text-orange-600">
                          {checkup.subsidizedCost.toLocaleString()}원
                        </p>
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-500 text-sm">검진 항목</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {checkup.items.map((item, idx) => (
                          <span key={idx} className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    {checkup.status === '예약' && (
                      <div className="flex justify-end gap-2 mt-3">
                        <button className="text-gray-600 hover:text-gray-700 text-sm">
                          일정 변경
                        </button>
                        <button className="text-red-600 hover:text-red-700 text-sm">
                          예약 취소
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 건강 관리 팁 */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">💡 건강검진 안내</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• 일반건강검진: 2년마다 1회 (사무직), 1년마다 1회 (비사무직)</li>
                  <li>• 특수건강검진: 유해인자 노출 근로자 대상 정기 검진</li>
                  <li>• 검진 전 8시간 이상 금식 필요 (일반검진)</li>
                  <li>• 검진 결과는 2주 내 우편 또는 온라인으로 확인 가능</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        {showBenefitModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">혜택 신청</h3>
              <div className="space-y-4">
                <select className="w-full px-3 py-2 border rounded-md">
                  <option>혜택 선택</option>
                  {benefits.map(b => (
                    <option key={b.id}>{b.title}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="신청자명"
                  className="w-full px-3 py-2 border rounded-md"
                />
                <textarea
                  placeholder="신청 사유 및 요청사항"
                  className="w-full px-3 py-2 border rounded-md h-24"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowBenefitModal(false)}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => setShowBenefitModal(false)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                  >
                    신청하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showInsuranceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">보험 가입 상담</h3>
              <div className="space-y-4">
                <select className="w-full px-3 py-2 border rounded-md">
                  <option>보험 종류 선택</option>
                  <option>단체상해보험</option>
                  <option>실손의료보험</option>
                  <option>소득보상보험</option>
                </select>
                <input
                  type="tel"
                  placeholder="연락처"
                  className="w-full px-3 py-2 border rounded-md"
                />
                <textarea
                  placeholder="상담 내용"
                  className="w-full px-3 py-2 border rounded-md h-24"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowInsuranceModal(false)}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => setShowInsuranceModal(false)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                  >
                    상담 신청
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showHealthModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">건강검진 예약</h3>
              <div className="space-y-4">
                <select className="w-full px-3 py-2 border rounded-md">
                  <option>검진 유형</option>
                  <option>일반건강검진</option>
                  <option>특수건강검진</option>
                  <option>종합건강검진</option>
                </select>
                <select className="w-full px-3 py-2 border rounded-md">
                  <option>검진기관 선택</option>
                  <option>서울노동자건강센터</option>
                  <option>산업보건센터</option>
                  <option>대한산업보건협회</option>
                </select>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-md"
                />
                <select className="w-full px-3 py-2 border rounded-md">
                  <option>시간 선택</option>
                  <option>09:00</option>
                  <option>10:00</option>
                  <option>14:00</option>
                  <option>15:00</option>
                </select>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowHealthModal(false)}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => setShowHealthModal(false)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                  >
                    예약하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}