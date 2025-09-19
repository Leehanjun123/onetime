'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { jobAPI, JOB_CATEGORIES } from '@/lib/api';

// 실제 백엔드 카테고리 사용
const specialties = JOB_CATEGORIES.map((category, index) => ({
  id: (index + 1).toString(),
  name: category,
  code: category.toUpperCase(),
  icon: ['👔', '⏰', '🛵', '🧹', '📦', '📦', '🎪', '📋'][index] || '📋'
}));


export default function DailyJobsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchLocation, setSearchLocation] = useState('');
  const [minWage, setMinWage] = useState('');
  const [sortBy, setSortBy] = useState('distance');
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      
      if (selectedCategory) {
        params.category = selectedCategory;
      }
      
      if (searchLocation) {
        params.location = searchLocation;
      }
      
      const data = await jobAPI.getJobs(params);
      if (data.success && data.data) {
        let jobs = data.data;
        
        // Client-side filtering for features not supported by API
        if (minWage) {
          jobs = jobs.filter((job: any) => job.wage >= parseInt(minWage));
        }
        
        if (showUrgentOnly) {
          jobs = jobs.filter((job: any) => job.isUrgent);
        }
        
        // Client-side sorting
        jobs.sort((a: any, b: any) => {
          switch(sortBy) {
            case 'wage':
              return b.wage - a.wage;
            case 'rating':
              return (b.rating || 0) - (a.rating || 0);
            default:
              return 0;
          }
        });
        
        setJobs(jobs);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      setJobs([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, [selectedCategory, searchLocation, minWage, sortBy, showUrgentOnly]);

  const getCategoryInfo = (code: string) => {
    return specialties.find(s => s.code === code);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">🔨 당일 일용직 구인</h1>
            <Link
              href="/matching/request"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <span>⚡</span> 빠른 매칭 요청
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
              <h2 className="text-lg font-bold mb-4">필터</h2>

              {/* 날짜 선택 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  작업 날짜
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* 전문 분야 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  전문 분야
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      !selectedCategory 
                        ? 'bg-indigo-500 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    전체
                  </button>
                  {specialties.map(specialty => (
                    <button
                      key={specialty.id}
                      onClick={() => setSelectedCategory(specialty.code)}
                      className={`px-3 py-2 rounded-lg text-sm flex items-center justify-center ${
                        selectedCategory === specialty.code
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <span className="mr-1">{specialty.icon}</span>
                      <span className="text-xs">{specialty.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 지역 검색 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  지역
                </label>
                <input
                  type="text"
                  placeholder="예: 강남, 수원"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* 최소 일당 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  최소 일당
                </label>
                <input
                  type="number"
                  placeholder="150000"
                  value={minWage}
                  onChange={(e) => setMinWage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* 긴급 공고만 */}
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showUrgentOnly}
                    onChange={(e) => setShowUrgentOnly(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">긴급 공고만 보기</span>
                </label>
              </div>

              {/* 정렬 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  정렬
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="distance">거리순</option>
                  <option value="wage">일당 높은순</option>
                  <option value="rating">평점순</option>
                </select>
              </div>
            </div>
          </div>

          {/* Job List */}
          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-600">
                총 <span className="font-bold text-indigo-600">{jobs.length}</span>개의 일자리
              </p>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                  <span>📍</span> 내 위치
                </button>
                <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                  <span>🗺️</span> 지도로 보기
                </button>
              </div>
            </div>

            {loading ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="text-6xl mb-4">⏳</div>
                <p className="text-gray-600">일자리를 불러오는 중...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map(job => {
                const category = getCategoryInfo(job.category);
                return (
                  <div key={job.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-3xl">{category?.icon}</span>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">
                              {job.title}
                              {job.isUrgent && (
                                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                  긴급
                                </span>
                              )}
                            </h3>
                            <p className="text-gray-600">{job.company}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="mr-2">📍</span>
                            {job.location} ({job.distance}km)
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="mr-2">📅</span>
                            {job.workDate}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="mr-2">⏰</span>
                            {job.workTime}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="mr-2">👥</span>
                            {job.applications?.length || 0}/{job.requiredWorkers || 1}명 지원
                          </div>
                        </div>

                        <p className="text-gray-700 mb-4">{job.description}</p>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center">
                            <span className="text-yellow-500 mr-1">⭐</span>
                            <span className="font-medium">{job.rating || 'N/A'}</span>
                            <span className="text-gray-500 text-sm ml-1">
                              ({job.completedJobs || 0}건 완료)
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                              {category?.name}
                            </span>
                            {(job.applications?.length || 0) >= (job.requiredWorkers || 1) && (
                              <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded">
                                마감임박
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right ml-6">
                        <div className="text-2xl font-bold text-indigo-600 mb-1">
                          {job.wage.toLocaleString()}원
                        </div>
                        <div className="text-sm text-gray-500 mb-4">
                          {job.wageType === 'DAILY' ? '일당' : job.wageType === 'HOURLY' ? '시급' : '일당'}
                        </div>
                        <button className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium">
                          지원하기
                        </button>
                        <button className="w-full mt-2 bg-white text-indigo-600 border border-indigo-600 px-6 py-2 rounded-lg hover:bg-indigo-50 text-sm">
                          상세보기
                        </button>
                      </div>
                    </div>
                  </div>
                );
                })}
              </div>
            )}

            {!loading && jobs.length === 0 && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="text-6xl mb-4">😔</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  조건에 맞는 일자리가 없습니다
                </h3>
                <p className="text-gray-600 mb-6">
                  필터 조건을 변경하거나 매칭 요청을 해보세요
                </p>
                <Link
                  href="/matching/request"
                  className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
                >
                  매칭 요청하기
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}