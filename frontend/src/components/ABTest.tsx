'use client'

import { ReactNode, useEffect, useState } from 'react';
import { useABTest, trackExperimentConversion, Variant } from '@/lib/abtest';

interface ABTestProps {
  experimentId: string;
  children: (variant: Variant | null) => ReactNode;
  onImpression?: (variant: Variant) => void;
}

export function ABTest({ experimentId, children, onImpression }: ABTestProps) {
  const [variant, setVariant] = useState<Variant | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const assignedVariant = useABTest(experimentId);
    setVariant(assignedVariant);
    
    if (assignedVariant && onImpression) {
      onImpression(assignedVariant);
    }
  }, [experimentId]);

  // SSR 방지
  if (!mounted) {
    return null;
  }

  return <>{children(variant)}</>;
}

// 홈페이지 히어로 섹션 A/B 테스트
export function HeroABTest() {
  return (
    <ABTest 
      experimentId="homepage_hero_v2"
      onImpression={(variant) => {
        // 노출 추적
        console.log('Hero variant shown:', variant.name);
      }}
    >
      {(variant) => {
        if (!variant) return <DefaultHeroSection />;
        
        const { headline, cta, image } = variant.changes;
        
        return (
          <div className="relative bg-gradient-to-br from-orange-500 to-red-600 text-white py-20 px-4">
            <div className="container mx-auto max-w-6xl">
              <div className="flex flex-col lg:flex-row items-center gap-12">
                <div className="flex-1 text-center lg:text-left">
                  <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                    {headline}
                  </h1>
                  <p className="text-xl mb-8 opacity-95">
                    건설현장 일용직 전문 플랫폼
                  </p>
                  <button
                    onClick={() => {
                      // CTA 클릭 추적
                      trackExperimentConversion('homepage_hero_v2', 'cta_click');
                    }}
                    className="bg-white text-orange-600 px-8 py-4 rounded-xl text-lg font-bold hover:bg-gray-100 transition-colors shadow-xl"
                  >
                    {cta}
                  </button>
                </div>
                <div className="flex-1">
                  <img 
                    src="/images/placeholder.svg"
                    alt="건설 근로자"
                    className="rounded-2xl shadow-2xl w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      }}
    </ABTest>
  );
}

// 기본 히어로 섹션 (폴백)
function DefaultHeroSection() {
  return (
    <div className="relative bg-gradient-to-br from-orange-500 to-red-600 text-white py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              오늘 일하고 오늘 받자
            </h1>
            <p className="text-xl mb-8 opacity-95">
              건설현장 일용직 전문 플랫폼
            </p>
            <button className="bg-white text-orange-600 px-8 py-4 rounded-xl text-lg font-bold hover:bg-gray-100 transition-colors shadow-xl">
              일자리 찾기
            </button>
          </div>
          <div className="flex-1">
            <img 
              src="/images/placeholder.svg"
              alt="건설 근로자"
              className="rounded-2xl shadow-2xl w-full h-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// 일자리 카드 레이아웃 A/B 테스트
export function JobCardABTest({ job }: { job: any }) {
  return (
    <ABTest experimentId="job_card_layout">
      {(variant) => {
        if (!variant) return <DefaultJobCard job={job} />;
        
        const { layout, ctaButton, showSalary } = variant.changes;
        
        switch (layout) {
          case 'list':
            return <JobListView job={job} ctaButton={ctaButton} showSalary={showSalary} />;
          case 'large_card':
            return <LargeJobCard job={job} ctaButton={ctaButton} showSalary={showSalary} />;
          default:
            return <DefaultJobCard job={job} />;
        }
      }}
    </ABTest>
  );
}

// 리스트 뷰 스타일
function JobListView({ job, ctaButton, showSalary }: any) {
  return (
    <div className="border-b border-gray-200 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{job.title}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
            <span>{job.company}</span>
            <span>{job.location}</span>
            {showSalary && <span className="font-bold text-orange-600">{job.hourlyPay}원/시</span>}
          </div>
        </div>
        <div>
          {ctaButton === 'quick_apply' ? (
            <button 
              onClick={() => trackExperimentConversion('job_card_layout', 'quick_apply_click')}
              className="bg-orange-600 text-white px-6 py-2 rounded-lg font-medium"
            >
              빠른 지원
            </button>
          ) : (
            <button 
              onClick={() => trackExperimentConversion('job_card_layout', 'call_click')}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium"
            >
              📞 전화
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// 큰 카드 스타일
function LargeJobCard({ job, ctaButton, showSalary }: any) {
  return (
    <div className="border-2 border-orange-200 rounded-2xl p-6 hover:shadow-xl transition-all bg-gradient-to-br from-orange-50 to-white">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{job.title}</h3>
          <p className="text-lg text-gray-700 mt-1">{job.company}</p>
        </div>
        {job.urgent && (
          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
            긴급
          </span>
        )}
      </div>
      
      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-gray-600">📍</span>
          <span>{job.location}</span>
        </div>
        {showSalary && (
          <div className="flex items-center gap-2">
            <span className="text-gray-600">💰</span>
            <span className="text-2xl font-bold text-orange-600">{job.hourlyPay.toLocaleString()}원/시</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-gray-600">⏰</span>
          <span>{job.workingHours}</span>
        </div>
      </div>

      <div className="flex gap-3">
        {ctaButton === 'quick_apply' ? (
          <>
            <button 
              onClick={() => trackExperimentConversion('job_card_layout', 'quick_apply_click')}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-bold text-lg hover:shadow-lg transition-all"
            >
              ⚡ 빠른 지원
            </button>
            <button 
              onClick={() => trackExperimentConversion('job_card_layout', 'detail_view')}
              className="px-6 py-3 rounded-xl border-2 border-gray-300 font-medium hover:bg-gray-50"
            >
              상세
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={() => trackExperimentConversion('job_card_layout', 'call_click')}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-bold text-lg hover:shadow-lg transition-all"
            >
              📞 전화하기
            </button>
            <button 
              onClick={() => trackExperimentConversion('job_card_layout', 'detail_view')}
              className="px-6 py-3 rounded-xl border-2 border-gray-300 font-medium hover:bg-gray-50"
            >
              상세
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// 기본 일자리 카드
function DefaultJobCard({ job }: any) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow">
      <h3 className="text-xl font-bold mb-2">{job.title}</h3>
      <p className="text-gray-600 mb-4">{job.company}</p>
      <div className="flex justify-between items-center">
        <span className="text-lg font-semibold text-orange-600">{job.hourlyPay}원/시</span>
        <button className="bg-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-700">
          지원하기
        </button>
      </div>
    </div>
  );
}

// 회원가입 플로우 A/B 테스트
export function RegistrationABTest() {
  return (
    <ABTest experimentId="registration_flow">
      {(variant) => {
        if (!variant) return <DefaultRegistrationFlow />;
        
        const { steps, socialLogin, phoneFirst } = variant.changes;
        
        if (steps === 1 && phoneFirst) {
          return <OneStepPhoneRegistration enableSocial={socialLogin} />;
        }
        
        return <DefaultRegistrationFlow />;
      }}
    </ABTest>
  );
}

// 원스텝 전화번호 가입
function OneStepPhoneRegistration({ enableSocial }: { enableSocial: boolean }) {
  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold text-center mb-6">10초 회원가입</h2>
      
      <div className="space-y-4">
        <input
          type="tel"
          placeholder="전화번호 입력"
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-orange-500 focus:outline-none"
        />
        
        <button
          onClick={() => trackExperimentConversion('registration_flow', 'phone_submit')}
          className="w-full bg-orange-600 text-white py-4 rounded-xl text-lg font-bold hover:bg-orange-700"
        >
          인증번호 받기
        </button>

        {enableSocial && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">또는</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => trackExperimentConversion('registration_flow', 'kakao_login')}
                className="w-full bg-yellow-400 text-gray-900 py-3 rounded-xl font-medium hover:bg-yellow-500 flex items-center justify-center gap-2"
              >
                <span>💬</span> 카카오로 시작하기
              </button>
              
              <button
                onClick={() => trackExperimentConversion('registration_flow', 'naver_login')}
                className="w-full bg-green-500 text-white py-3 rounded-xl font-medium hover:bg-green-600 flex items-center justify-center gap-2"
              >
                <span>N</span> 네이버로 시작하기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// 기본 회원가입 플로우
function DefaultRegistrationFlow() {
  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold text-center mb-6">회원가입</h2>
      <div className="space-y-4">
        <input type="text" placeholder="이름" className="w-full px-4 py-3 border rounded-lg" />
        <input type="tel" placeholder="전화번호" className="w-full px-4 py-3 border rounded-lg" />
        <input type="email" placeholder="이메일" className="w-full px-4 py-3 border rounded-lg" />
        <button className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium">
          가입하기
        </button>
      </div>
    </div>
  );
}