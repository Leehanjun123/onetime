'use client'

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { HeroABTest } from '@/components/ABTest';
import { trackExperimentConversion } from '@/lib/abtest';
import { Button } from '@/components/ui/Button';
import { Card, JobCard, StatsCard } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { BannerAd, NativeAd } from '@/components/AdSense';
import { cn } from '@/lib/utils';

// 인터페이스 정의
interface JobCategory {
  id: string;
  name: string;
  icon: string;
  count: string;
  avgPay: string;
  demand: 'high' | 'medium' | 'low';
  description: string;
}

interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  content: string;
  rating: number;
  location: string;
  earnings: string;
}

interface FeaturedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  wage: string;
  urgent: boolean;
  tags: string[];
}

export default function Home() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
      return;
    }
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, router]);

  // 위치 기반 일자리 검색
  const handleQuickSearch = async () => {
    setIsLoading(true);
    
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        
        trackExperimentConversion('hero_location_search', {
          method: 'geolocation',
          query: searchQuery,
          location: searchLocation
        });
        
        router.push(`/jobs?lat=${position.coords.latitude}&lng=${position.coords.longitude}&q=${encodeURIComponent(searchQuery)}`);
      } catch (error) {
        router.push(`/jobs?location=${encodeURIComponent(searchLocation)}&q=${encodeURIComponent(searchQuery)}`);
      }
    } else {
      router.push(`/jobs?location=${encodeURIComponent(searchLocation)}&q=${encodeURIComponent(searchQuery)}`);
    }
    
    setIsLoading(false);
  };

  // 데이터
  const heroSlides = [
    {
      title: "오늘 일하고 오늘 받자",
      subtitle: "당일 정산 보장 플랫폼",
      highlight: "100% 당일 정산",
      description: "일 끝나면 바로 계좌 입금. 기다릴 필요 없어요.",
      bgGradient: "from-orange-500 via-red-500 to-pink-500",
      ctaText: "지금 일자리 찾기"
    },
    {
      title: "AI가 추천하는 맞춤 일자리",
      subtitle: "스마트 매칭 시스템",
      highlight: "95% 매칭 성공률",
      description: "당신의 경험과 위치를 분석해서 최적의 일자리를 찾아드려요.",
      bgGradient: "from-blue-600 via-purple-600 to-indigo-600",
      ctaText: "AI 매칭 시작"
    },
    {
      title: "안전한 건설 현장만",
      subtitle: "검증된 업체 보장",
      highlight: "100% 사업자 인증",
      description: "안전교육, 4대보험, 산재보험까지. 안심하고 일할 수 있어요.",
      bgGradient: "from-green-500 via-emerald-500 to-teal-500",
      ctaText: "안전한 일터 보기"
    }
  ];

  const jobCategories: JobCategory[] = [
    {
      id: 'construction',
      name: '건설·토목',
      icon: '🏗️',
      count: '1,234',
      avgPay: '180,000',
      demand: 'high',
      description: '아파트, 빌딩 신축 및 인테리어'
    },
    {
      id: 'interior',
      name: '인테리어·리모델링',
      icon: '🔨',
      count: '856',
      avgPay: '200,000',
      demand: 'high',
      description: '타일, 도배, 페인팅 등 마감 작업'
    },
    {
      id: 'logistics',
      name: '물류·운송',
      icon: '🚚',
      count: '642',
      avgPay: '150,000',
      demand: 'medium',
      description: '택배, 이사, 창고 상하차'
    },
    {
      id: 'factory',
      name: '공장·제조',
      icon: '🏭',
      count: '389',
      avgPay: '160,000',
      demand: 'medium',
      description: '조립, 포장, 품질검사'
    },
    {
      id: 'cleaning',
      name: '청소·환경',
      icon: '🧹',
      count: '267',
      avgPay: '130,000',
      demand: 'low',
      description: '사무실, 건물 청소 및 방역'
    },
    {
      id: 'delivery',
      name: '배달·서비스',
      icon: '🛵',
      count: '445',
      avgPay: '140,000',
      demand: 'high',
      description: '음식배달, 퀵서비스, 대행업무'
    }
  ];

  const stats = [
    { title: '누적 구직자', value: '127,000+', change: '+12%', icon: '👷', trend: 'up' as const },
    { title: '검증된 업체', value: '8,500+', change: '+25%', icon: '🏢', trend: 'up' as const },
    { title: '성공 매칭', value: '45,000+', change: '+18%', icon: '🤝', trend: 'up' as const },
    { title: '평균 만족도', value: '4.8/5.0', change: '+0.2', icon: '⭐', trend: 'up' as const }
  ];

  const featuredJobs: FeaturedJob[] = [
    {
      id: '1',
      title: '아파트 신축현장 철근공',
      company: '삼성물산',
      location: '강남구 논현동',
      wage: '220,000원',
      urgent: true,
      tags: ['당일정산', '4대보험', '중식제공']
    },
    {
      id: '2',
      title: '오피스텔 인테리어 타일공',
      company: 'GS건설',
      location: '서초구 서초동',
      wage: '190,000원',
      urgent: false,
      tags: ['주급정산', '교통비지급', '안전장비지급']
    },
    {
      id: '3',
      title: '물류센터 상하차 작업',
      company: '쿠팡물류',
      location: '송파구 문정동',
      wage: '160,000원',
      urgent: true,
      tags: ['당일정산', '야간수당', '주차가능']
    }
  ];

  const testimonials: Testimonial[] = [
    {
      id: '1',
      name: '김철수',
      role: '타일공 15년차',
      avatar: '👷‍♂️',
      content: '일데이 덕분에 매월 안정적으로 일감을 구할 수 있게 되었어요. 특히 당일 정산이 정말 큰 도움이 됩니다.',
      rating: 5,
      location: '서울 강남구',
      earnings: '월 580만원'
    },
    {
      id: '2',
      name: '박영희',
      role: '청소 전문가',
      avatar: '👩‍🔧',
      content: 'AI 매칭으로 집 근처 일자리를 쉽게 찾을 수 있어서 좋아요. 시간 절약이 엄청나게 됩니다.',
      rating: 5,
      location: '경기 성남시',
      earnings: '월 420만원'
    },
    {
      id: '3',
      name: '이민호',
      role: '인테리어 기술자',
      avatar: '🔨',
      content: '검증된 업체들만 있어서 안심이 되고, 급여도 제때 받을 수 있어서 만족합니다.',
      rating: 5,
      location: '서울 마포구',
      earnings: '월 650만원'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section - 업계 최고 수준 디자인 */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 배경 그라데이션 애니메이션 */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br transition-all duration-1000",
          heroSlides[currentSlide].bgGradient
        )}>
          {/* 패턴 오버레이 */}
          <div className="absolute inset-0 bg-black/20" />
          <div 
            className="absolute inset-0 opacity-10" 
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.5'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }}
          />
        </div>

        {/* Hero 컨텐츠 */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* 텍스트 섹션 */}
            <div className="text-white space-y-8">
              <div className="space-y-4">
                <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-semibold">
                  {heroSlides[currentSlide].subtitle}
                </div>
                <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                  {heroSlides[currentSlide].title}
                </h1>
                <p className="text-xl md:text-2xl text-white/90 leading-relaxed">
                  {heroSlides[currentSlide].description}
                </p>
              </div>

              {/* 강조 포인트 */}
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">✨</span>
                </div>
                <div>
                  <div className="text-sm text-white/80">특별혜택</div>
                  <div className="text-lg font-bold">{heroSlides[currentSlide].highlight}</div>
                </div>
              </div>

              {/* CTA 버튼 */}
              <div className="flex gap-4">
                <Button 
                  size="xl" 
                  variant="secondary"
                  onClick={handleQuickSearch}
                  loading={isLoading}
                  className="bg-white text-gray-900 hover:bg-gray-100 shadow-xl"
                >
                  {heroSlides[currentSlide].ctaText} →
                </Button>
                <Button 
                  size="xl" 
                  variant="ghost"
                  className="text-white border-white/30 hover:bg-white/10"
                >
                  서비스 알아보기
                </Button>
              </div>

              {/* 소셜 프루프 */}
              <div className="flex items-center gap-6 text-white/80">
                <div className="flex -space-x-2">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="w-8 h-8 bg-white/20 rounded-full border-2 border-white/30" />
                  ))}
                </div>
                <div className="text-sm">
                  <div className="font-semibold">12만+ 구직자가 선택</div>
                  <div>⭐ 4.8/5.0 만족도</div>
                </div>
              </div>
            </div>

            {/* 검색 폼 섹션 */}
            <div className="bg-white rounded-3xl p-8 shadow-2xl">
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">일자리 찾기</h3>
                  <p className="text-gray-600">원하는 조건을 입력해보세요</p>
                </div>

                <div className="space-y-4">
                  <Input
                    placeholder="어떤 일자리를 찾으시나요?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="lg"
                    leftIcon={<span>🔍</span>}
                  />
                  <Input
                    placeholder="어디서 일하고 싶으세요?"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    size="lg"
                    leftIcon={<span>📍</span>}
                  />
                  <Button
                    fullWidth
                    size="lg"
                    onClick={handleQuickSearch}
                    loading={isLoading}
                  >
                    일자리 검색하기
                  </Button>
                </div>

                {/* 인기 검색어 */}
                <div className="border-t pt-4">
                  <div className="text-sm text-gray-500 mb-2">인기 검색어</div>
                  <div className="flex flex-wrap gap-2">
                    {['타일공', '철근공', '인테리어', '물류', '청소'].map(tag => (
                      <button 
                        key={tag}
                        className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-orange-100 hover:text-orange-700 transition-colors"
                        onClick={() => setSearchQuery(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 슬라이드 인디케이터 */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-300",
                  index === currentSlide ? "bg-white w-8" : "bg-white/50"
                )}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>

        {/* 스크롤 인디케이터 */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2"></div>
          </div>
        </div>
      </section>

      {/* 통계 섹션 */}
      <section ref={statsRef} className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <StatsCard
                key={index}
                title={stat.title}
                value={stat.value}
                change={stat.change}
                icon={stat.icon}
                trend={stat.trend}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 상단 배너 광고 */}
      <div className="max-w-6xl mx-auto px-4">
        <BannerAd position="top" />
      </div>

      {/* 일자리 카테고리 */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">어떤 일자리가 있나요?</h2>
            <p className="text-xl text-gray-600">전문 기술자부터 단순 작업까지, 다양한 기회</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobCategories.map((category) => (
              <Card
                key={category.id}
                variant="interactive"
                className="group h-full"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-5xl group-hover:scale-110 transition-transform">
                      {category.icon}
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "inline-block px-2 py-1 rounded-full text-xs font-medium",
                        category.demand === 'high' ? "bg-red-100 text-red-700" :
                        category.demand === 'medium' ? "bg-yellow-100 text-yellow-700" :
                        "bg-green-100 text-green-700"
                      )}>
                        {category.demand === 'high' ? '🔥 인기' : 
                         category.demand === 'medium' ? '📊 보통' : '💚 여유'}
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2 group-hover:text-orange-600 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">{category.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">{category.count}개 채용중</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-600">
                        {parseInt(category.avgPay).toLocaleString()}원
                      </div>
                      <div className="text-xs text-gray-500">평균 일당</div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/jobs">
              <Button size="lg" variant="secondary">
                모든 카테고리 보기 →
              </Button>
            </Link>
          </div>

          {/* 네이티브 광고 */}
          <div className="mt-12">
            <NativeAd />
          </div>
        </div>
      </section>

      {/* 추천 일자리 */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">지금 가장 인기있는 일자리</h2>
            <p className="text-xl text-gray-600">실시간으로 업데이트되는 추천 일자리</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredJobs.map((job) => (
              <JobCard
                key={job.id}
                title={job.title}
                company={job.company}
                location={job.location}
                wage={job.wage}
                urgent={job.urgent}
                className="h-full"
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/jobs">
              <Button size="lg">
                더 많은 일자리 보기 →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 사용자 후기 */}
      <section className="py-20 bg-gradient-to-r from-orange-50 to-red-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">실제 이용자 이야기</h2>
            <p className="text-xl text-gray-600">일데이와 함께한 성공 스토리</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} variant="elevated" className="h-full">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="text-4xl mr-3">{testimonial.avatar}</div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                    </div>
                  </div>
                  
                  <div className="flex mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span key={i} className="text-yellow-400">⭐</span>
                    ))}
                  </div>
                  
                  <p className="text-gray-700 mb-4 leading-relaxed">"{testimonial.content}"</p>
                  
                  <div className="border-t pt-4 text-sm text-gray-500">
                    <div className="flex justify-between">
                      <span>📍 {testimonial.location}</span>
                      <span className="font-semibold text-green-600">{testimonial.earnings}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-red-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-6">지금 바로 시작하세요</h2>
          <p className="text-xl mb-8 text-orange-100">
            수천 개의 검증된 일자리가 당신을 기다립니다
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="xl" variant="secondary" className="bg-white text-gray-900 hover:bg-gray-100">
                구직자 회원가입
              </Button>
            </Link>
            <Link href="/employer">
              <Button size="xl" variant="ghost" className="text-white border-white/30 hover:bg-white/10">
                기업 서비스 알아보기
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 text-orange-200">
            <div className="text-sm">이미 회원이신가요?</div>
            <Link href="/login" className="text-white underline font-semibold">
              로그인하기 →
            </Link>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}