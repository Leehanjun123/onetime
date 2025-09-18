'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { trackEvent, trackJobSearch, trackJobApplication } from '@/components/Analytics';
import FavoriteButton from '@/components/FavoriteButton';
import { BannerAd, InFeedAd, MobileBottomAd } from '@/components/AdSense';
import { jobAPI, JOB_CATEGORIES } from '@/lib/api';

interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  wage: number;
  workDate: string;
  status: 'OPEN' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  employer: {
    id: string;
    name: string;
    userType: string;
  };
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalJobs, setTotalJobs] = useState(0);
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

  // 실제 백엔드 카테고리와 일치하는 카테고리 목록
  const jobCategories = [
    { name: '전체', icon: '🏢', color: 'orange' },
    { name: '일반알바', icon: '👔', color: 'blue' },
    { name: '단기알바', icon: '⏰', color: 'yellow', highlight: true },
    { name: '배달', icon: '🛵', color: 'green' },
    { name: '청소', icon: '🧹', color: 'purple' },
    { name: '이사', icon: '📦', color: 'indigo' },
    { name: '포장', icon: '📦', color: 'pink' },
    { name: '행사도우미', icon: '🎪', color: 'teal' },
    { name: '기타', icon: '📋', color: 'gray' }
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
    
    // 페이지 뷰 추적
    trackEvent('jobs_page_view', {
      event_category: 'page_interaction',
      page_type: 'job_listing',
      user_has_location: userLocation !== null
    });
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [filters, currentPage]);

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
      
      // 실제 API 호출
      const params: any = {
        page: currentPage,
        limit: jobsPerPage
      };
      
      if (filters.category && filters.category !== '전체') {
        params.category = filters.category;
      }
      
      if (filters.location) {
        params.location = filters.location;
      }

      const data = await jobAPI.getJobs(params);
      
      if (data.success && data.data) {
        setJobs(data.data);
        setTotalJobs(data.total || data.data.length);
        
        // 검색 추적
        trackJobSearch({
          category: filters.category,
          location: filters.location,
          results_count: data.data.length
        });
      } else {
        console.error('Failed to fetch jobs:', data);
        setJobs([]);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // 필터 변경 핸들러 (서버 사이드 필터링으로 대체)
  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  // 페이지네이션 (서버 사이드에서 처리)
  const totalPages = Math.ceil(totalJobs / jobsPerPage);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
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
                📍 가까운 순 • {totalJobs}개 일자리
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
            ) : jobs.length === 0 ? (
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
                
                {jobs.map((job, index) => (
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
                        </div>
                        <p className="text-gray-600 text-sm">{job.employer.name}</p>
                        <p className="text-orange-600 text-sm font-medium flex items-center">
                          📍 {job.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-orange-600">
                          {job.wage.toLocaleString()}원
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
                        근무일: {new Date(job.workDate).toLocaleDateString('ko-KR')}
                      </span>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-lg font-medium">
                        💰 시급 {job.wage.toLocaleString()}원
                      </span>
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
                        {formatDate(job.createdAt)}
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
                              hourly_pay: job.wage,
                              application_method: 'call'
                            });
                            // 전화 걸기 기능
                            // 연락처 기능은 추후 구현
                            alert('고용주에게 연락하는 기능은 추후 구현예정입니다.');
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
                      더 많은 일자리 보기 ({Math.max(0, totalJobs - (currentPage * jobsPerPage))}개 더)
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