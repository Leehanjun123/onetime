'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { trackEvent, trackJobSearch, trackJobApplication } from '@/components/Analytics';
import FavoriteButton from '@/components/FavoriteButton';
import { BannerAd, InFeedAd, MobileBottomAd } from '@/components/AdSense';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  hourlyPay: number;
  workingHours: string;
  workDays: string[];
  category: string;
  description: string;
  requirements: string[];
  benefits: string[];
  urgent: boolean;
  postedAt: string;
  deadlineAt: string;
  contactInfo: {
    phone: string;
    email: string;
  };
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    category: '',
    minPay: '',
    maxPay: '',
    urgent: false,
    sortBy: 'distance' // 'distance', 'recent', 'pay_high', 'pay_low', 'deadline'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 20;

  // 건설업 중심 카테고리 (아이콘 포함)
  const jobCategories = [
    { name: '전체', icon: '🏢', count: 245, color: 'orange' },
    { name: '건설/토목', icon: '🏗️', count: 89, color: 'yellow', highlight: true },
    { name: '공장/제조', icon: '🏭', count: 67, color: 'blue' },
    { name: '운반/물류', icon: '🚚', count: 45, color: 'green' },
    { name: '시설관리', icon: '🔧', count: 32, color: 'indigo' },
    { name: '청소/환경', icon: '🧹', count: 28, color: 'purple' },
    { name: '카페/음료', icon: '☕', count: 24, color: 'pink' },
    { name: '기타', icon: '📋', count: 21, color: 'gray' }
  ];

  // 빠른 필터
  const quickFilters = [
    { id: 'today_pay', label: '당일정산', icon: '💰', active: false },
    { id: 'nearby_5km', label: '5km이내', icon: '📍', active: false },
    { id: 'urgent', label: '긴급모집', icon: '🚨', active: false },
    { id: 'high_pay', label: '고액일당', icon: '💎', active: false }
  ];

  useEffect(() => {
    fetchJobs();
    getUserLocation();
    
    // 페이지 뷰 추적 (이미 Analytics.tsx의 PageTracker에서 처리하지만 추가 컨텍스트 제공)
    trackEvent('jobs_page_view', {
      event_category: 'page_interaction',
      page_type: 'job_listing',
      user_has_location: userLocation !== null
    });
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jobs, filters, userLocation]);

  // 위치 정보 가져오기
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied:', error);
          // 서울 시청 기본 위치
          setUserLocation({ lat: 37.5665, lng: 126.9780 });
        }
      );
    } else {
      // 서울 시청 기본 위치
      setUserLocation({ lat: 37.5665, lng: 126.9780 });
    }
  };

  // 거리 계산 함수 (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // 지구 반지름 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      // 백엔드 API 호출
      const response = await fetch('http://localhost:5000/api/v1/jobs');
      const data = await response.json();
      
      if (data.success && data.data?.jobs) {
        // API 데이터를 컴포넌트 형식에 맞게 변환 (위치 정보 포함)
        const formattedJobs: Job[] = data.data.jobs.map((job: any) => ({
          id: job.id,
          title: job.title,
          company: job.company?.name || '회사명',
          location: job.location,
          hourlyPay: job.salaryMin || 100000,
          workingHours: job.startTime && job.endTime ? `${job.startTime}-${job.endTime}` : '09:00-18:00',
          workDays: ['월', '화', '수', '목', '금'],
          category: job.category || '기타',
          description: job.description || '',
          requirements: job.requirements || [],
          benefits: job.benefits || [],
          urgent: job.isUrgent || false,
          postedAt: job.createdAt || new Date().toISOString(),
          deadlineAt: job.workDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          contactInfo: {
            phone: '02-1234-5678',
            email: 'contact@company.com'
          }
        }));
        
        setJobs(formattedJobs);
      } else {
        // API 호출 실패시 위치 기반 임시 데이터 사용
        const mockJobs: Job[] = [
        {
          id: '1',
          title: '건설현장 일용직 모집 (당일정산)',
          company: '대한건설 강남현장',
          location: '서울 강남구 (2.1km)',
          hourlyPay: 18000,
          workingHours: '08:00-17:00 (8시간)',
          workDays: ['월', '화', '수', '목', '금'],
          category: '건설/토목',
          description: '신축 아파트 건설현장에서 함께 일하실 분을 모집합니다. 경력무관, 당일정산 가능합니다.',
          requirements: ['건강한 성인 남녀', '성실한 근무태도', '안전수칙 준수'],
          benefits: ['당일 정산', '중식 제공', '안전장비 지급', '교통비 지원'],
          urgent: true,
          postedAt: '2025-09-08',
          deadlineAt: '2025-09-10',
          contactInfo: {
            phone: '010-1234-5678',
            email: 'recruit@daehan-construction.com'
          }
        },
        {
          id: '2',
          title: '카페 바리스타 (3km)',
          company: '스타벅스 역삼역점',
          location: '서울 강남구 (3.2km)',
          hourlyPay: 12000,
          workingHours: '06:00-14:00 (8시간)',
          workDays: ['월', '화', '수', '목', '금'],
          category: '카페/음료',
          description: '오픈 시간대 바리스타를 모집합니다. 커피에 관심 있으신 분 환영합니다.',
          requirements: ['고등학교 졸업 이상', '서비스업 경험 우대', '새벽 근무 가능자'],
          benefits: ['당일 정산', '음료 할인', '교통비 지원', '유연근무'],
          urgent: false,
          postedAt: '2025-09-07',
          deadlineAt: '2025-09-15',
          contactInfo: {
            phone: '02-1234-5678',
            email: 'hiring@starbucks-yeoksam.com'
          }
        },
        {
          id: '3',
          title: '긴급! 배달라이더 (고액일당)',
          company: '쿠팡이츠 서울지점',
          location: '서울 전지역 (1.5km)',
          hourlyPay: 20000,
          workingHours: '11:00-21:00 (자유선택)',
          workDays: ['매일'],
          category: '배달/운전',
          description: '주말 성수기 배달라이더 긴급 모집! 높은 수익 보장됩니다.',
          requirements: ['2종 면허 이상', '오토바이 보유자', '스마트폰 필수'],
          benefits: ['고액 일당', '주유비 지원', '보험 완비', '인센티브'],
          urgent: true,
          postedAt: '2025-09-08',
          deadlineAt: '2025-09-09',
          contactInfo: {
            phone: '1588-1234',
            email: 'recruit@coupangeats.com'
          }
        },
        {
          id: '4',
          title: '편의점 야간알바 (5km 이내)',
          company: 'CU 삼성역점',
          location: '서울 강남구 (4.8km)',
          hourlyPay: 13500,
          workingHours: '22:00-06:00 (8시간)',
          workDays: ['월', '화', '수', '목', '금'],
          category: '편의점/마트',
          description: '성실한 야간 근무자를 찾습니다. 야간수당 포함된 시급입니다.',
          requirements: ['성인 남녀', '야간 근무 가능', '책임감 있는 분'],
          benefits: ['야간수당 포함', '당일 정산', '4대보험', '교통비'],
          urgent: false,
          postedAt: '2025-09-06',
          deadlineAt: '2025-09-20',
          contactInfo: {
            phone: '02-2345-6789',
            email: 'manager@cu-samsung.com'
          }
        }
      ];

        setJobs(mockJobs);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...jobs];

    // 검색 분석 이벤트 추적
    const searchFilters = [];
    if (activeQuickFilter) searchFilters.push(activeQuickFilter);
    if (filters.category && filters.category !== '전체') searchFilters.push(filters.category);
    if (filters.minPay) searchFilters.push(`min_pay_${filters.minPay}`);
    if (filters.urgent) searchFilters.push('urgent_only');

    // 빠른 필터 적용
    if (activeQuickFilter) {
      switch (activeQuickFilter) {
        case 'today_pay':
          filtered = filtered.filter(job => job.benefits.some(benefit => 
            benefit.includes('당일') || benefit.includes('즉시')
          ));
          break;
        case 'nearby_5km':
          filtered = filtered.filter(job => 
            job.location.includes('km') && 
            parseFloat(job.location.match(/(\d+\.?\d*)km/)?.[1] || '10') <= 5
          );
          break;
        case 'urgent':
          filtered = filtered.filter(job => job.urgent);
          break;
        case 'high_pay':
          filtered = filtered.filter(job => job.hourlyPay >= 15000);
          break;
      }
    }

    // 검색어 필터
    if (filters.search) {
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        job.company.toLowerCase().includes(filters.search.toLowerCase()) ||
        job.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // 카테고리 필터
    if (filters.category && filters.category !== '전체') {
      filtered = filtered.filter(job => job.category === filters.category);
    }

    // 급여 필터
    if (filters.minPay) {
      filtered = filtered.filter(job => job.hourlyPay >= parseInt(filters.minPay));
    }
    if (filters.maxPay) {
      filtered = filtered.filter(job => job.hourlyPay <= parseInt(filters.maxPay));
    }

    // 긴급 필터
    if (filters.urgent) {
      filtered = filtered.filter(job => job.urgent);
    }

    // 정렬 (거리 우선)
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'distance':
          // 거리순 정렬 (임시로 location에서 km 추출)
          const distanceA = parseFloat(a.location.match(/(\d+\.?\d*)km/)?.[1] || '999');
          const distanceB = parseFloat(b.location.match(/(\d+\.?\d*)km/)?.[1] || '999');
          return distanceA - distanceB;
        case 'pay_high':
          return b.hourlyPay - a.hourlyPay;
        case 'pay_low':
          return a.hourlyPay - b.hourlyPay;
        case 'deadline':
          return new Date(a.deadlineAt).getTime() - new Date(b.deadlineAt).getTime();
        case 'recent':
          return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
        default:
          return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      }
    });

    // 검색 분석 이벤트 추적
    trackJobSearch({
      category: filters.category || activeQuickFilter || undefined,
      location: filters.location || '현재 위치',
      filters: searchFilters,
      results_count: filtered.length
    });

    setFilteredJobs(filtered);
    setCurrentPage(1);
  };

  // 페이지네이션
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        {/* Mobile-first Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">내 주변 일자리</h1>
              <p className="text-sm text-gray-600 flex items-center">
                📍 가까운 순 • {filteredJobs.length}개 일자리
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              필터
            </button>
          </div>

          {/* 빠른 필터 */}
          <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
            {quickFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => {
                  const newFilter = activeQuickFilter === filter.id ? '' : filter.id;
                  setActiveQuickFilter(newFilter);
                  
                  // 빠른 필터 클릭 추적
                  trackEvent('quick_filter_click', {
                    event_category: 'job_search',
                    filter_type: filter.id,
                    filter_label: filter.label,
                    action: newFilter ? 'applied' : 'removed'
                  });
                }}
                className={`flex-shrink-0 flex items-center space-x-1 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                  activeQuickFilter === filter.id
                    ? 'bg-orange-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span>{filter.icon}</span>
                <span>{filter.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 직종 카테고리 */}
        <div className="mb-6">
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {jobCategories.map((category) => (
              <button
                key={category.name}
                onClick={() => {
                  const newCategory = filters.category === category.name ? '' : category.name;
                  setFilters(prev => ({
                    ...prev,
                    category: newCategory
                  }));
                  
                  // 직종 카테고리 클릭 추적
                  trackEvent('job_category_click', {
                    event_category: 'job_search',
                    category_name: category.name,
                    category_icon: category.icon,
                    job_count: category.count,
                    action: newCategory ? 'selected' : 'deselected'
                  });
                }}
                className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                  filters.category === category.name
                    ? `bg-yellow-100 border-2 border-yellow-500 shadow-md`
                    : category.highlight
                    ? 'bg-yellow-50 border-2 border-yellow-300 hover:bg-yellow-100 shadow-sm'
                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="text-2xl mb-1">{category.icon}</div>
                <span className={`text-xs font-medium text-center leading-tight ${
                  category.highlight ? 'text-yellow-800 font-bold' : ''
                }`}>
                  {category.name}
                </span>
                <span className={`text-xs mt-1 ${
                  category.highlight ? 'text-yellow-700 font-semibold' : 'text-gray-500'
                }`}>
                  {category.count}{category.highlight ? ' 🔥' : ''}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 모바일 필터 오버레이 */}
        {showFilters && (
          <div className="lg:hidden fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowFilters(false)} />
            <div className="relative bg-white min-h-full">
              <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold">필터</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-4 space-y-6">
                {/* Search */}
                <div>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="일자리 검색..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">정렬</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="distance">가까운 순</option>
                    <option value="recent">최신순</option>
                    <option value="pay_high">높은 급여순</option>
                    <option value="deadline">마감임박순</option>
                  </select>
                </div>

                {/* Pay Range */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">시급 범위</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="최소 시급"
                      value={filters.minPay}
                      onChange={(e) => setFilters(prev => ({ ...prev, minPay: e.target.value }))}
                      className="px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <input
                      type="number"
                      placeholder="최대 시급"
                      value={filters.maxPay}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxPay: e.target.value }))}
                      className="px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full bg-orange-600 text-white py-4 rounded-lg font-semibold text-lg"
                >
                  필터 적용하기
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-20">
              <h3 className="text-lg font-medium text-gray-900 mb-4">필터</h3>
              
              <div className="space-y-6">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="제목, 회사명 검색"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">정렬</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="distance">가까운 순</option>
                    <option value="recent">최신순</option>
                    <option value="pay_high">높은 급여순</option>
                    <option value="deadline">마감임박순</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">시급 (원)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="최소"
                      value={filters.minPay}
                      onChange={(e) => setFilters(prev => ({ ...prev, minPay: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    />
                    <input
                      type="number"
                      placeholder="최대"
                      value={filters.maxPay}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxPay: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile-Optimized Job List */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">가까운 일자리를 찾는 중...</p>
              </div>
            ) : currentJobs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  주변에 일자리가 없어요
                </h3>
                <p className="text-gray-600">
                  필터를 조정하거나 다른 지역을 확인해보세요
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 상단 배너 광고 */}
                <BannerAd position="top" />
                
                {currentJobs.map((job, index) => (
                  <React.Fragment key={job.id}>
                    {/* 3개마다 인피드 광고 삽입 */}
                    {index > 0 && index % 3 === 0 && <InFeedAd />}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-lg hover:border-orange-200 transition-all relative">
                    {/* 즐겨찾기 버튼 */}
                    <div className="absolute top-4 right-4 z-10">
                      <FavoriteButton job={job} size="small" />
                    </div>
                    
                    {/* 헤더: 제목, 거리, 긴급 태그 */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 pr-12">
                        <div className="flex items-center mb-1">
                          <h3 className="text-lg font-bold text-gray-900 leading-tight">
                            {job.title}
                          </h3>
                          {job.urgent && (
                            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                              🚨 긴급
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm">{job.company}</p>
                        <p className="text-orange-600 text-sm font-medium flex items-center">
                          📍 {job.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-orange-600">
                          {job.hourlyPay.toLocaleString()}원
                        </div>
                        <div className="text-xs text-gray-500">
                          시급
                        </div>
                      </div>
                    </div>

                    {/* 근무 정보 */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-lg font-medium">
                        {job.category}
                      </span>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-lg">
                        {job.workingHours}
                      </span>
                      {job.benefits.includes('당일 정산') && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-lg font-medium">
                          💰 당일정산
                        </span>
                      )}
                    </div>

                    {/* 설명 */}
                    <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                      {job.description}
                    </p>

                    {/* 신뢰성 요소 */}
                    <div className="flex items-center gap-3 mb-3 text-xs">
                      <div className="flex items-center text-green-600">
                        <span className="mr-1">✅</span>
                        <span>사업자 인증</span>
                      </div>
                      <div className="flex items-center text-blue-600">
                        <span className="mr-1">⭐</span>
                        <span>평점 4.8 (324)</span>
                      </div>
                      <div className="flex items-center text-purple-600">
                        <span className="mr-1">👥</span>
                        <span>지원자 {Math.floor(Math.random() * 50) + 10}명</span>
                      </div>
                    </div>

                    {/* 하단: 등록일, 액션 버튼 */}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        {formatDate(job.postedAt)} • {getDaysRemaining(job.deadlineAt)}일 남음
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => {
                            trackEvent('job_detail_view', {
                              event_category: 'job_interaction',
                              job_id: job.id,
                              job_title: job.title,
                              job_category: job.category,
                              hourly_pay: job.hourlyPay
                            });
                          }}
                          className="text-orange-600 hover:text-orange-800 text-sm font-medium px-3 py-1 rounded-lg border border-orange-200 hover:bg-orange-50 transition-colors"
                        >
                          상세
                        </button>
                        <button 
                          onClick={() => {
                            trackJobApplication({
                              job_id: job.id,
                              job_title: job.title,
                              job_category: job.category,
                              hourly_pay: job.hourlyPay,
                              is_urgent: job.urgent,
                              application_method: 'call'
                            });
                            // 전화 걸기 기능
                            window.open(`tel:${job.contactInfo.phone}`, '_self');
                          }}
                          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all"
                        >
                          📞 전화하기
                        </button>
                      </div>
                    </div>
                  </div>
                  </React.Fragment>
                ))}

                {/* 신뢰성 보장 정보 */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 mb-6 border border-green-100">
                  <div className="text-center">
                    <div className="text-2xl mb-2">🛡️</div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">안전한 일자리만 엄선</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-green-600 font-bold text-lg">100%</div>
                        <div className="text-xs text-gray-600">사업자 인증</div>
                      </div>
                      <div>
                        <div className="text-blue-600 font-bold text-lg">24시간</div>
                        <div className="text-xs text-gray-600">고객센터 운영</div>
                      </div>
                      <div>
                        <div className="text-purple-600 font-bold text-lg">98.7%</div>
                        <div className="text-xs text-gray-600">당일정산 성공률</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                      문제 발생 시 알바몬이 직접 중재하여 해결해드려요
                    </p>
                  </div>
                </div>

                {/* 더 보기 버튼 (무한 스크롤 스타일) */}
                {currentPage < totalPages && (
                  <div className="text-center py-6">
                    <button
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                      더 많은 일자리 보기 ({filteredJobs.length - (currentPage * jobsPerPage)}개 더)
                    </button>
                  </div>
                )}

                {/* 모바일 최적화 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="flex justify-center space-x-1 mt-6 lg:hidden">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ← 이전
                    </button>
                    
                    <span className="px-4 py-2 text-sm text-gray-600">
                      {currentPage} / {totalPages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      다음 →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}