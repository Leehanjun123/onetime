'use client'

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';

interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    tier: string;
    avatar?: string;
  };
  category: string;
  tags: string[];
  likes: number;
  comments: number;
  views: number;
  createdAt: string;
  isPinned: boolean;
  isLiked: boolean;
}

interface Comment {
  id: string;
  postId: string;
  author: {
    id: string;
    name: string;
    tier: string;
  };
  content: string;
  likes: number;
  createdAt: string;
  replies?: Comment[];
}

interface Network {
  id: string;
  name: string;
  role: string;
  company?: string;
  tier: string;
  skills: string[];
  rating: number;
  connectionStatus: 'connected' | 'pending' | 'none';
  mutualConnections?: number;
}

const SAMPLE_POSTS: Post[] = [
  {
    id: '1',
    title: '강남구 마감작업 팁 공유합니다',
    content: '안녕하세요! 강남구에서 3년째 마감작업 하고 있는 사람입니다. 초보자분들을 위한 몇 가지 팁을 공유하려고 합니다...',
    author: {
      id: 'user1',
      name: '김철수',
      tier: '숙련자'
    },
    category: '노하우',
    tags: ['마감작업', '강남구', '팁'],
    likes: 45,
    comments: 12,
    views: 234,
    createdAt: '2024-12-30T10:00:00Z',
    isPinned: true,
    isLiked: false
  },
  {
    id: '2',
    title: '전기작업 인증 시험 후기',
    content: '어제 전기기능사 시험 봤습니다. 생각보다 어려웠지만 합격했네요! 준비하시는 분들을 위해 경험 공유합니다...',
    author: {
      id: 'user2',
      name: '이영희',
      tier: '경험자'
    },
    category: '자격증',
    tags: ['전기작업', '자격증', '시험후기'],
    likes: 67,
    comments: 23,
    views: 456,
    createdAt: '2024-12-29T14:00:00Z',
    isPinned: false,
    isLiked: true
  },
  {
    id: '3',
    title: '마포구 팀작업 인원 구합니다',
    content: '다음주 월요일부터 3일간 마포구 대형 현장 작업입니다. 철거작업 경험 있으신 분 2명 구합니다.',
    author: {
      id: 'user3',
      name: '박대호',
      tier: '전문가'
    },
    category: '구인구직',
    tags: ['마포구', '철거작업', '팀작업'],
    likes: 12,
    comments: 8,
    views: 189,
    createdAt: '2024-12-30T08:00:00Z',
    isPinned: false,
    isLiked: false
  },
  {
    id: '4',
    title: '안전사고 예방 체크리스트',
    content: '현장에서 꼭 확인해야 할 안전 체크리스트입니다. 매일 작업 전 한 번씩 확인하세요!',
    author: {
      id: 'user4',
      name: '정안전',
      tier: '전문가'
    },
    category: '안전',
    tags: ['안전', '체크리스트', '필독'],
    likes: 89,
    comments: 15,
    views: 567,
    createdAt: '2024-12-28T09:00:00Z',
    isPinned: true,
    isLiked: false
  }
];

const SAMPLE_NETWORKS: Network[] = [
  {
    id: 'net1',
    name: '김현수',
    role: '팀장',
    company: '프리미엄홈',
    tier: '전문가',
    skills: ['마감작업', '타일시공', '도배'],
    rating: 4.9,
    connectionStatus: 'connected',
    mutualConnections: 12
  },
  {
    id: 'net2',
    name: '박미영',
    role: '실장',
    company: '대한건설',
    tier: '전문가',
    skills: ['철거작업', '안전관리'],
    rating: 4.8,
    connectionStatus: 'pending',
    mutualConnections: 8
  },
  {
    id: 'net3',
    name: '이준호',
    role: '기술자',
    tier: '숙련자',
    skills: ['전기작업', '배관작업'],
    rating: 4.7,
    connectionStatus: 'none',
    mutualConnections: 5
  }
];

const CATEGORIES = [
  { key: 'all', label: '전체', icon: '📋' },
  { key: '노하우', label: '노하우', icon: '💡' },
  { key: '자격증', label: '자격증', icon: '📜' },
  { key: '구인구직', label: '구인구직', icon: '👥' },
  { key: '안전', label: '안전', icon: '⚠️' },
  { key: '질문', label: '질문', icon: '❓' },
  { key: '자유', label: '자유', icon: '💬' }
];

export default function CommunityPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [posts, setPosts] = useState<Post[]>(SAMPLE_POSTS);
  const [networks, setNetworks] = useState<Network[]>(SAMPLE_NETWORKS);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTab, setSelectedTab] = useState<'posts' | 'network' | 'mentoring' | 'events'>('posts');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = posts.filter(post => {
    if (selectedCategory !== 'all' && post.category !== selectedCategory) return false;
    if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !post.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case '전문가': return 'text-purple-700 bg-purple-100';
      case '숙련자': return 'text-blue-700 bg-blue-100';
      case '경험자': return 'text-green-700 bg-green-100';
      case '초보자': return 'text-gray-700 bg-gray-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const handleLike = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  const handleConnect = (networkId: string) => {
    setNetworks(prev => prev.map(net => 
      net.id === networkId 
        ? { ...net, connectionStatus: net.connectionStatus === 'none' ? 'pending' : net.connectionStatus }
        : net
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">커뮤니티</h1>
          <p className="text-gray-600">동료들과 경험을 공유하고 네트워크를 확장하세요</p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'posts', label: '게시판', icon: '📝' },
                { key: 'network', label: '네트워크', icon: '🤝' },
                { key: 'mentoring', label: '멘토링', icon: '👨‍🏫' },
                { key: 'events', label: '이벤트', icon: '🎉' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key as any)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === tab.key
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 게시판 */}
        {selectedTab === 'posts' && (
          <div className="flex gap-8">
            {/* 메인 콘텐츠 */}
            <div className="flex-1">
              {/* 검색 및 작성 */}
              <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="검색어를 입력하세요..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    onClick={() => setIsWriting(true)}
                    className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
                  >
                    글쓰기
                  </button>
                </div>
              </div>

              {/* 카테고리 필터 */}
              <div className="flex gap-2 mb-6 overflow-x-auto">
                {CATEGORIES.map(category => (
                  <button
                    key={category.key}
                    onClick={() => setSelectedCategory(category.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                      selectedCategory === category.key
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {category.icon} {category.label}
                  </button>
                ))}
              </div>

              {/* 게시글 목록 */}
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <div key={post.id} className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {post.isPinned && (
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">
                              📌 고정
                            </span>
                          )}
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            {post.category}
                          </span>
                        </div>
                        <h3 
                          className="text-lg font-semibold text-gray-900 mb-2 cursor-pointer hover:text-orange-600"
                          onClick={() => setSelectedPost(post)}
                        >
                          {post.title}
                        </h3>
                        <p className="text-gray-700 mb-3 line-clamp-2">{post.content}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getTierColor(post.author.tier)}`}>
                                {post.author.tier}
                              </span>
                              <span>{post.author.name}</span>
                            </div>
                            <span>
                              {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-sm">
                            <button
                              onClick={() => handleLike(post.id)}
                              className={`flex items-center gap-1 ${
                                post.isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                              }`}
                            >
                              {post.isLiked ? '❤️' : '🤍'} {post.likes}
                            </button>
                            <span className="text-gray-600">💬 {post.comments}</span>
                            <span className="text-gray-600">👁️ {post.views}</span>
                          </div>
                        </div>
                        
                        {post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {post.tags.map((tag, index) => (
                              <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 사이드바 */}
            <div className="w-80 space-y-6">
              {/* 인기 태그 */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🔥 인기 태그</h3>
                <div className="flex flex-wrap gap-2">
                  {['마감작업', '전기작업', '강남구', '안전', '자격증', '팁공유'].map((tag) => (
                    <button
                      key={tag}
                      className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm hover:bg-orange-100"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* 주간 베스트 */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 주간 베스트</h3>
                <div className="space-y-3">
                  {posts.slice(0, 3).map((post, index) => (
                    <div key={post.id} className="flex items-start gap-3">
                      <span className="text-lg font-bold text-orange-600">{index + 1}</span>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
                          {post.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                          <span>❤️ {post.likes}</span>
                          <span>💬 {post.comments}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 활동 통계 */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 내 활동</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">작성 글</span>
                    <span className="font-medium">12개</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">댓글</span>
                    <span className="font-medium">45개</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">받은 좋아요</span>
                    <span className="font-medium">234개</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">팔로워</span>
                    <span className="font-medium">89명</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 네트워크 */}
        {selectedTab === 'network' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 연결 추천 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">추천 연결</h3>
              <div className="space-y-4">
                {networks.map((network) => (
                  <div key={network.id} className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{network.name}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getTierColor(network.tier)}`}>
                            {network.tier}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {network.role} {network.company && `@ ${network.company}`}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                          <span>⭐ {network.rating}</span>
                          {network.mutualConnections && (
                            <span>👥 공통 연결 {network.mutualConnections}명</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {network.skills.map((skill, index) => (
                            <span key={index} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {network.connectionStatus === 'connected' ? (
                        <button className="flex-1 bg-gray-100 text-gray-600 py-2 rounded text-sm" disabled>
                          ✓ 연결됨
                        </button>
                      ) : network.connectionStatus === 'pending' ? (
                        <button className="flex-1 bg-orange-100 text-orange-700 py-2 rounded text-sm" disabled>
                          대기중
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnect(network.id)}
                          className="flex-1 bg-orange-600 text-white py-2 rounded text-sm hover:bg-orange-700"
                        >
                          연결 요청
                        </button>
                      )}
                      <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
                        프로필 보기
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 내 네트워크 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">내 네트워크</h3>
              <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">156</div>
                    <div className="text-sm text-gray-600">전체 연결</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">12</div>
                    <div className="text-sm text-gray-600">이번 주 신규</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">45</div>
                    <div className="text-sm text-gray-600">팀 멤버</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-4">최근 활동</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-green-600">🟢</span>
                    <span className="text-gray-700">김현수님이 연결을 수락했습니다</span>
                    <span className="text-gray-500 text-xs">2시간 전</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-blue-600">💬</span>
                    <span className="text-gray-700">박미영님이 메시지를 보냈습니다</span>
                    <span className="text-gray-500 text-xs">5시간 전</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-orange-600">👥</span>
                    <span className="text-gray-700">이준호님이 팀에 초대했습니다</span>
                    <span className="text-gray-500 text-xs">1일 전</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 멘토링 */}
        {selectedTab === 'mentoring' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">멘토 찾기</h3>
              <div className="space-y-4">
                {[
                  {
                    name: '김전문',
                    tier: '전문가',
                    specialty: '전기작업',
                    experience: '15년',
                    mentees: 45,
                    rating: 4.9
                  },
                  {
                    name: '이숙련',
                    tier: '숙련자',
                    specialty: '마감작업',
                    experience: '8년',
                    mentees: 23,
                    rating: 4.8
                  }
                ].map((mentor, index) => (
                  <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{mentor.name}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getTierColor(mentor.tier)}`}>
                            {mentor.tier}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                          <div>전문분야: {mentor.specialty}</div>
                          <div>경력: {mentor.experience}</div>
                          <div>멘티: {mentor.mentees}명</div>
                          <div>평점: ⭐ {mentor.rating}</div>
                        </div>
                        <p className="text-gray-700 mb-4">
                          {mentor.specialty} 분야의 전문가로 실무 노하우와 기술을 전수합니다.
                        </p>
                      </div>
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                      멘토링 신청
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">멘토링 프로그램</h3>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-medium text-orange-900 mb-2">🎯 1:1 멘토링</h4>
                    <p className="text-sm text-orange-700">개인 맞춤형 지도와 상담</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">👥 그룹 멘토링</h4>
                    <p className="text-sm text-blue-700">동료들과 함께하는 학습</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">📚 온라인 강의</h4>
                    <p className="text-sm text-green-700">언제 어디서나 학습 가능</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 이벤트 */}
        {selectedTab === 'events' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              {
                title: '전기작업 안전교육',
                date: '2025-01-15',
                time: '14:00 - 17:00',
                location: '강남 교육센터',
                type: '교육',
                participants: 25
              },
              {
                title: '일용직 네트워킹 데이',
                date: '2025-01-20',
                time: '18:00 - 21:00',
                location: '서울 컨벤션센터',
                type: '네트워킹',
                participants: 150
              },
              {
                title: '신규 자격증 설명회',
                date: '2025-01-25',
                time: '10:00 - 12:00',
                location: '온라인',
                type: '설명회',
                participants: 80
              }
            ].map((event, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="mb-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    event.type === '교육' ? 'bg-blue-100 text-blue-700' :
                    event.type === '네트워킹' ? 'bg-green-100 text-green-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {event.type}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{event.title}</h3>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div>📅 {event.date}</div>
                  <div>⏰ {event.time}</div>
                  <div>📍 {event.location}</div>
                  <div>👥 {event.participants}명 참가 예정</div>
                </div>
                <button className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700">
                  참가 신청
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 글쓰기 모달 */}
        {isWriting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">새 글 작성</h3>
                <button
                  onClick={() => setIsWriting(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <select className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="">카테고리 선택</option>
                  {CATEGORIES.slice(1).map(cat => (
                    <option key={cat.key} value={cat.key}>{cat.label}</option>
                  ))}
                </select>
                
                <input
                  type="text"
                  placeholder="제목을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                
                <textarea
                  placeholder="내용을 입력하세요"
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                
                <input
                  type="text"
                  placeholder="태그 (쉼표로 구분)"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div className="flex gap-3 mt-6">
                <button className="flex-1 bg-orange-600 text-white py-2 rounded hover:bg-orange-700">
                  작성 완료
                </button>
                <button
                  onClick={() => setIsWriting(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}