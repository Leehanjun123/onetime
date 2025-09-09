'use client'

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface SearchResult {
  id: string;
  type: '일자리' | '사용자' | '게시글' | '교육' | '커뮤니티';
  title: string;
  description: string;
  url: string;
  category?: string;
  location?: string;
  date?: string;
  author?: string;
  matchScore: number;
  tags?: string[];
  metadata?: {
    wage?: string;
    company?: string;
    views?: number;
    likes?: number;
    replies?: number;
    rating?: number;
  };
}

interface SearchFilter {
  type: string[];
  location: string;
  dateRange: {
    start: string;
    end: string;
  };
  wageRange: {
    min: number;
    max: number;
  };
  categories: string[];
  sortBy: 'relevance' | 'date' | 'wage' | 'rating';
}

interface RecentSearch {
  id: string;
  query: string;
  timestamp: string;
  resultCount: number;
}

interface PopularKeyword {
  keyword: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'jobs' | 'users' | 'posts' | 'education'>('all');
  
  const [filters, setFilters] = useState<SearchFilter>({
    type: [],
    location: '',
    dateRange: {
      start: '',
      end: ''
    },
    wageRange: {
      min: 0,
      max: 500000
    },
    categories: [],
    sortBy: 'relevance'
  });

  const [recentSearches] = useState<RecentSearch[]>([
    { id: '1', query: '건설 일용직', timestamp: '2024-01-30 14:00', resultCount: 45 },
    { id: '2', query: '서울 강남구', timestamp: '2024-01-29 16:30', resultCount: 23 },
    { id: '3', query: '지게차 자격증', timestamp: '2024-01-28 09:00', resultCount: 12 },
    { id: '4', query: '일당 20만원 이상', timestamp: '2024-01-27 11:20', resultCount: 67 }
  ]);

  const [popularKeywords] = useState<PopularKeyword[]>([
    { keyword: '건설', count: 1523, trend: 'up' },
    { keyword: '물류', count: 1234, trend: 'up' },
    { keyword: '이사', count: 987, trend: 'stable' },
    { keyword: '전기', count: 876, trend: 'down' },
    { keyword: '목공', count: 654, trend: 'up' },
    { keyword: '일당 20만원', count: 543, trend: 'up' },
    { keyword: '주말 알바', count: 432, trend: 'stable' },
    { keyword: '야간 근무', count: 321, trend: 'down' }
  ]);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Mock search results
  const mockResults: SearchResult[] = [
    {
      id: '1',
      type: '일자리',
      title: '건설현장 일용직 모집',
      description: '서울 강남구 건설현장에서 일용직 근로자를 모집합니다. 경력자 우대',
      url: '/jobs/1',
      category: '건설',
      location: '서울 강남구',
      date: '2024-01-31',
      matchScore: 95,
      tags: ['건설', '일용직', '당일지급'],
      metadata: {
        wage: '180,000원/일',
        company: '대한건설'
      }
    },
    {
      id: '2',
      type: '사용자',
      title: '김철수 (숙련 전기공)',
      description: '전기 분야 10년 경력, 전기기능사 자격증 보유',
      url: '/users/kim',
      matchScore: 88,
      tags: ['전기', '자격증', '숙련자'],
      metadata: {
        rating: 4.8
      }
    },
    {
      id: '3',
      type: '게시글',
      title: '건설현장 안전수칙 공유합니다',
      description: '10년차 현장 근로자가 알려주는 필수 안전수칙',
      url: '/community/posts/123',
      author: '안전제일',
      date: '2024-01-29',
      matchScore: 75,
      metadata: {
        views: 523,
        likes: 45,
        replies: 12
      }
    },
    {
      id: '4',
      type: '교육',
      title: '지게차 운전 기능사 교육',
      description: '4주 완성 지게차 운전 기능사 자격증 취득 과정',
      url: '/education/forklift',
      category: '자격증',
      matchScore: 82,
      tags: ['지게차', '자격증', '교육'],
      metadata: {
        wage: '300,000원'
      }
    },
    {
      id: '5',
      type: '일자리',
      title: '물류센터 야간 상하차',
      description: '용인 물류센터 야간 상하차 인력 모집. 초보자 가능',
      url: '/jobs/2',
      category: '물류',
      location: '경기 용인시',
      date: '2024-02-01',
      matchScore: 90,
      tags: ['물류', '야간', '초보가능'],
      metadata: {
        wage: '150,000원/일',
        company: '한국물류'
      }
    }
  ];

  useEffect(() => {
    if (query) {
      handleSearch();
    }
  }, []);

  useEffect(() => {
    // Generate suggestions based on query
    if (query.length > 0) {
      const newSuggestions = [
        `${query} 일자리`,
        `${query} 서울`,
        `${query} 경기`,
        `${query} 자격증`,
        `${query} 교육`
      ].filter(s => s.toLowerCase().includes(query.toLowerCase()));
      setSuggestions(newSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const handleSearch = () => {
    setIsSearching(true);
    setShowSuggestions(false);
    
    // Simulate search delay
    setTimeout(() => {
      const filtered = mockResults.filter(result => {
        // Filter by search query
        const matchesQuery = query === '' || 
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.description.toLowerCase().includes(query.toLowerCase()) ||
          result.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()));

        // Filter by type (tab)
        const matchesType = activeTab === 'all' || 
          (activeTab === 'jobs' && result.type === '일자리') ||
          (activeTab === 'users' && result.type === '사용자') ||
          (activeTab === 'posts' && result.type === '게시글') ||
          (activeTab === 'education' && result.type === '교육');

        // Apply additional filters
        const matchesFilters = 
          (filters.type.length === 0 || filters.type.includes(result.type)) &&
          (!filters.location || result.location?.includes(filters.location));

        return matchesQuery && matchesType && matchesFilters;
      });

      // Sort results
      const sorted = [...filtered].sort((a, b) => {
        switch(filters.sortBy) {
          case 'date':
            return (b.date || '').localeCompare(a.date || '');
          case 'wage':
            return (parseInt(b.metadata?.wage || '0') - parseInt(a.metadata?.wage || '0'));
          case 'rating':
            return (b.metadata?.rating || 0) - (a.metadata?.rating || 0);
          default: // relevance
            return b.matchScore - a.matchScore;
        }
      });

      setSearchResults(sorted);
      setIsSearching(false);

      // Add to recent searches
      if (query) {
        const newSearch = {
          id: Date.now().toString(),
          query,
          timestamp: new Date().toLocaleString('ko-KR'),
          resultCount: sorted.length
        };
        // In real app, save to localStorage or backend
      }
    }, 500);
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case '일자리': return '💼';
      case '사용자': return '👤';
      case '게시글': return '📝';
      case '교육': return '🎓';
      case '커뮤니티': return '👥';
      default: return '🔍';
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case '일자리': return 'bg-blue-100 text-blue-800';
      case '사용자': return 'bg-green-100 text-green-800';
      case '게시글': return 'bg-purple-100 text-purple-800';
      case '교육': return 'bg-yellow-100 text-yellow-800';
      case '커뮤니티': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch(trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Search Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">통합 검색</h1>
          
          {/* Search Bar */}
          <div className="relative mb-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="일자리, 사용자, 게시글, 교육 과정 검색..."
                  className="w-full px-4 py-3 pr-10 border rounded-lg focus:outline-none focus:border-orange-500"
                />
                <span className="absolute right-3 top-3.5 text-gray-400">
                  🔍
                </span>

                {/* Search Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg mt-1 z-10">
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setQuery(suggestion);
                          setShowSuggestions(false);
                          handleSearch();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50"
                      >
                        🔍 {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {isSearching ? '검색중...' : '검색'}
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-3 border rounded-lg hover:bg-gray-50"
              >
                ⚙️ 필터
              </button>
            </div>
          </div>

          {/* Quick Keywords */}
          <div className="flex flex-wrap gap-2">
            {popularKeywords.slice(0, 6).map((keyword) => (
              <button
                key={keyword.keyword}
                onClick={() => {
                  setQuery(keyword.keyword);
                  handleSearch();
                }}
                className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200"
              >
                {keyword.keyword} {getTrendIcon(keyword.trend)}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="font-semibold mb-4">상세 필터</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">유형</label>
                <div className="space-y-2">
                  {['일자리', '사용자', '게시글', '교육'].map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.type.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({ ...prev, type: [...prev.type, type] }));
                          } else {
                            setFilters(prev => ({ 
                              ...prev, 
                              type: prev.type.filter(t => t !== type) 
                            }));
                          }
                        }}
                        className="mr-2"
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">지역</label>
                <select
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">전체 지역</option>
                  <option value="서울">서울</option>
                  <option value="경기">경기</option>
                  <option value="인천">인천</option>
                  <option value="부산">부산</option>
                  <option value="대구">대구</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">정렬</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    sortBy: e.target.value as SearchFilter['sortBy'] 
                  }))}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="relevance">관련도순</option>
                  <option value="date">최신순</option>
                  <option value="wage">급여순</option>
                  <option value="rating">평점순</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setFilters({
                    type: [],
                    location: '',
                    dateRange: { start: '', end: '' },
                    wageRange: { min: 0, max: 500000 },
                    categories: [],
                    sortBy: 'relevance'
                  });
                  handleSearch();
                }}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                초기화
              </button>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              >
                필터 적용
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search Results */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm mb-4">
              <div className="border-b border-gray-200">
                <div className="flex space-x-6 px-6">
                  {[
                    { id: 'all', label: '전체', count: searchResults.length },
                    { id: 'jobs', label: '일자리', count: searchResults.filter(r => r.type === '일자리').length },
                    { id: 'users', label: '사용자', count: searchResults.filter(r => r.type === '사용자').length },
                    { id: 'posts', label: '게시글', count: searchResults.filter(r => r.type === '게시글').length },
                    { id: 'education', label: '교육', count: searchResults.filter(r => r.type === '교육').length }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        handleSearch();
                      }}
                      className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-orange-500 text-orange-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.label}
                      {tab.count > 0 && (
                        <span className="ml-1 text-xs">({tab.count})</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results List */}
            <div className="space-y-4">
              {isSearching ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">검색 중...</p>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <Link
                    key={result.id}
                    href={result.url}
                    className="block bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getTypeIcon(result.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg hover:text-orange-600">
                              {result.title}
                            </h3>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getTypeColor(result.type)}`}>
                              {result.type}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              매칭도 {result.matchScore}%
                            </div>
                            {result.metadata?.wage && (
                              <div className="text-orange-600 font-semibold">
                                {result.metadata.wage}
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="text-gray-600 mb-2">{result.description}</p>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          {result.location && (
                            <span>📍 {result.location}</span>
                          )}
                          {result.date && (
                            <span>📅 {result.date}</span>
                          )}
                          {result.author && (
                            <span>✍️ {result.author}</span>
                          )}
                          {result.metadata?.company && (
                            <span>🏢 {result.metadata.company}</span>
                          )}
                          {result.metadata?.rating && (
                            <span>⭐ {result.metadata.rating}</span>
                          )}
                          {result.metadata?.views && (
                            <span>👁️ {result.metadata.views}</span>
                          )}
                          {result.metadata?.likes && (
                            <span>❤️ {result.metadata.likes}</span>
                          )}
                        </div>

                        {result.tags && result.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {result.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="bg-gray-100 px-2 py-1 rounded text-xs"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              ) : query ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-lg font-semibold mb-2">검색 결과가 없습니다</h3>
                  <p className="text-gray-500">다른 검색어를 시도해보세요</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-lg font-semibold mb-2">검색어를 입력하세요</h3>
                  <p className="text-gray-500">일자리, 사용자, 게시글 등을 검색할 수 있습니다</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Searches */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold mb-4">최근 검색</h3>
              <div className="space-y-2">
                {recentSearches.map((search) => (
                  <button
                    key={search.id}
                    onClick={() => {
                      setQuery(search.query);
                      handleSearch();
                    }}
                    className="w-full text-left px-3 py-2 rounded hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{search.query}</span>
                      <span className="text-xs text-gray-500">
                        {search.resultCount}건
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">{search.timestamp}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Keywords */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold mb-4">인기 검색어</h3>
              <div className="space-y-2">
                {popularKeywords.map((keyword, idx) => (
                  <button
                    key={keyword.keyword}
                    onClick={() => {
                      setQuery(keyword.keyword);
                      handleSearch();
                    }}
                    className="w-full text-left px-3 py-2 rounded hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm">{idx + 1}</span>
                        <span className="text-sm font-medium">{keyword.keyword}</span>
                        <span>{getTrendIcon(keyword.trend)}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {keyword.count.toLocaleString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Tips */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="font-semibold mb-3">검색 팁</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• 여러 단어로 검색하면 더 정확한 결과를 얻을 수 있습니다</li>
                <li>• 지역명을 포함하면 해당 지역 결과를 우선 표시합니다</li>
                <li>• 필터를 사용하여 원하는 결과만 볼 수 있습니다</li>
                <li>• 인기 검색어를 참고하여 트렌드를 파악하세요</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}