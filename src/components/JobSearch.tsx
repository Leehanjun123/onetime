'use client'

import { useState } from 'react';

export default function JobSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');

  const categories = [
    '전체',
    '카페/음료',
    '레스토랑/주방',
    '편의점/마트',
    '배달/운전',
    '사무/관리',
    '판매/영업',
    '교육/강사',
    '이벤트/프로모션',
    '기타'
  ];

  const locations = [
    '전체',
    '서울',
    '경기',
    '인천',
    '부산',
    '대구',
    '광주',
    '대전',
    '울산',
    '세종'
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            원하는 알바를 찾아보세요
          </h2>
          <p className="text-lg text-gray-600">
            AI가 당신의 조건에 맞는 완벽한 일자리를 찾아드립니다
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-gray-50 rounded-2xl p-8 shadow-inner">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                키워드 검색
              </label>
              <input
                type="text"
                placeholder="예) 카페 알바, 단기 아르바이트"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Location Select */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                지역
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Select */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카테고리
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <div className="md:col-span-1 flex items-end">
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                검색하기
              </button>
            </div>
          </div>
        </div>

        {/* Popular Keywords */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-4">인기 검색어:</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              '스타벅스',
              '편의점',
              '단기알바',
              '주말알바',
              '배달',
              '이벤트도우미',
              '카페알바',
              '당일정산'
            ].map((keyword) => (
              <button
                key={keyword}
                className="bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 px-4 py-2 rounded-full text-sm transition-colors"
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}