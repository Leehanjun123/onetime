'use client'

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  instructor: {
    name: string;
    tier: string;
    rating: number;
  };
  duration: string;
  price: number;
  enrolledCount: number;
  rating: number;
  modules: {
    id: string;
    title: string;
    duration: string;
    completed: boolean;
  }[];
  tags: string[];
  certificateOffered: boolean;
  thumbnail?: string;
}

interface MentoringSession {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorTier: string;
  topic: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  type: '1:1' | 'group';
  maxParticipants?: number;
  currentParticipants: number;
  price: number;
  status: 'upcoming' | 'ongoing' | 'completed';
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  targetRole: string;
  estimatedDuration: string;
  courses: string[];
  completionRate: number;
  benefits: string[];
}

const SAMPLE_COURSES: Course[] = [
  {
    id: 'course1',
    title: '전기작업 기초부터 실무까지',
    description: '전기작업의 기본 이론부터 현장 실무까지 체계적으로 배우는 과정',
    category: '전기작업',
    level: 'beginner',
    instructor: {
      name: '김전기',
      tier: '전문가',
      rating: 4.9
    },
    duration: '30시간',
    price: 150000,
    enrolledCount: 234,
    rating: 4.8,
    modules: [
      { id: 'm1', title: '전기 기초 이론', duration: '3시간', completed: true },
      { id: 'm2', title: '안전 수칙과 장비', duration: '2시간', completed: true },
      { id: 'm3', title: '배선 작업 실습', duration: '5시간', completed: false },
      { id: 'm4', title: '고장 진단과 수리', duration: '4시간', completed: false }
    ],
    tags: ['전기작업', '자격증', '실무'],
    certificateOffered: true
  },
  {
    id: 'course2',
    title: '마감작업 전문가 되기',
    description: '타일, 도배, 목공 등 마감작업의 모든 것',
    category: '마감작업',
    level: 'intermediate',
    instructor: {
      name: '이마감',
      tier: '전문가',
      rating: 4.7
    },
    duration: '40시간',
    price: 200000,
    enrolledCount: 189,
    rating: 4.7,
    modules: [
      { id: 'm5', title: '타일 시공 기법', duration: '8시간', completed: false },
      { id: 'm6', title: '도배 기술', duration: '6시간', completed: false },
      { id: 'm7', title: '목공 작업', duration: '10시간', completed: false }
    ],
    tags: ['마감작업', '타일', '도배', '목공'],
    certificateOffered: true
  },
  {
    id: 'course3',
    title: '안전관리자 실무 교육',
    description: '현장 안전관리자가 되기 위한 필수 교육 과정',
    category: '안전관리',
    level: 'advanced',
    instructor: {
      name: '박안전',
      tier: '전문가',
      rating: 4.9
    },
    duration: '50시간',
    price: 300000,
    enrolledCount: 156,
    rating: 4.9,
    modules: [
      { id: 'm8', title: '산업안전보건법', duration: '10시간', completed: false },
      { id: 'm9', title: '위험성 평가', duration: '8시간', completed: false },
      { id: 'm10', title: '응급처치와 대응', duration: '6시간', completed: false }
    ],
    tags: ['안전관리', '자격증', '법규'],
    certificateOffered: true
  }
];

const SAMPLE_MENTORING: MentoringSession[] = [
  {
    id: 'ment1',
    mentorId: 'mentor1',
    mentorName: '김전문',
    mentorTier: '전문가',
    topic: '전기작업 실무 Q&A',
    description: '전기작업 현장에서 겪는 실제 문제들을 함께 해결합니다',
    date: '2025-01-10',
    time: '19:00',
    duration: '2시간',
    type: 'group',
    maxParticipants: 10,
    currentParticipants: 7,
    price: 30000,
    status: 'upcoming'
  },
  {
    id: 'ment2',
    mentorId: 'mentor2',
    mentorName: '이숙련',
    mentorTier: '숙련자',
    topic: '경력 개발 상담',
    description: '일용직에서 전문가로 성장하는 방법을 1:1로 상담합니다',
    date: '2025-01-12',
    time: '14:00',
    duration: '1시간',
    type: '1:1',
    currentParticipants: 1,
    price: 50000,
    status: 'upcoming'
  }
];

const SAMPLE_PATHS: LearningPath[] = [
  {
    id: 'path1',
    title: '전기작업 전문가 과정',
    description: '초보자부터 전문가까지 단계별 학습 경로',
    targetRole: '전기작업 전문가',
    estimatedDuration: '6개월',
    courses: ['course1', 'course3'],
    completionRate: 35,
    benefits: [
      '전기기능사 자격증 취득',
      '평균 시급 30% 상승',
      '대형 프로젝트 참여 기회'
    ]
  },
  {
    id: 'path2',
    title: '종합 마감작업 마스터',
    description: '모든 마감작업을 마스터하는 종합 과정',
    targetRole: '마감작업 팀장',
    estimatedDuration: '8개월',
    courses: ['course2'],
    completionRate: 20,
    benefits: [
      '다양한 마감작업 스킬 습득',
      '팀장급 진급 가능',
      '독립 창업 준비'
    ]
  }
];

export default function EducationPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [courses, setCourses] = useState<Course[]>(SAMPLE_COURSES);
  const [mentoringSessions, setMentoringSessions] = useState<MentoringSession[]>(SAMPLE_MENTORING);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>(SAMPLE_PATHS);
  const [selectedTab, setSelectedTab] = useState<'courses' | 'mentoring' | 'paths' | 'my-learning'>('courses');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const categories = [
    { key: 'all', label: '전체' },
    { key: '전기작업', label: '전기작업' },
    { key: '마감작업', label: '마감작업' },
    { key: '안전관리', label: '안전관리' },
    { key: '철거작업', label: '철거작업' },
    { key: '도색작업', label: '도색작업' }
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'text-green-700 bg-green-100';
      case 'intermediate': return 'text-blue-700 bg-blue-100';
      case 'advanced': return 'text-purple-700 bg-purple-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'beginner': return '초급';
      case 'intermediate': return '중급';
      case 'advanced': return '고급';
      default: return '전체';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case '전문가': return 'text-purple-700 bg-purple-100';
      case '숙련자': return 'text-blue-700 bg-blue-100';
      case '경험자': return 'text-green-700 bg-green-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">교육 센터</h1>
          <p className="text-gray-600">전문 기술을 배우고 경력을 발전시키세요</p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'courses', label: '교육 과정', icon: '📚' },
                { key: 'mentoring', label: '멘토링', icon: '👨‍🏫' },
                { key: 'paths', label: '학습 경로', icon: '🎯' },
                { key: 'my-learning', label: '내 학습', icon: '📖' }
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

        {/* 교육 과정 */}
        {selectedTab === 'courses' && (
          <div>
            {/* 카테고리 필터 */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
              {categories.map(category => (
                <button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    selectedCategory === category.key
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>

            {/* 과정 목록 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses
                .filter(course => selectedCategory === 'all' || course.category === selectedCategory)
                .map(course => (
                  <div key={course.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="h-40 bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center">
                      <span className="text-4xl">📚</span>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(course.level)}`}>
                          {getLevelText(course.level)}
                        </span>
                        {course.certificateOffered && (
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-medium">
                            수료증
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
                      
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center justify-between">
                          <span>👨‍🏫 {course.instructor.name}</span>
                          <span>⭐ {course.rating}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>⏱️ {course.duration}</span>
                          <span>👥 {course.enrolledCount}명</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xl font-bold text-gray-900">
                          {course.price.toLocaleString()}원
                        </span>
                        <div className="flex gap-1">
                          {course.modules.filter(m => m.completed).length}/{course.modules.length} 완료
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setSelectedCourse(course)}
                        className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700"
                      >
                        상세보기
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 멘토링 */}
        {selectedTab === 'mentoring' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">예정된 멘토링</h3>
              <div className="space-y-4">
                {mentoringSessions.map(session => (
                  <div key={session.id} className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{session.topic}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            session.type === '1:1' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {session.type === '1:1' ? '1:1 멘토링' : '그룹 멘토링'}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{session.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="block text-gray-500">멘토</span>
                            <span className="font-medium">{session.mentorName}</span>
                          </div>
                          <div>
                            <span className="block text-gray-500">일시</span>
                            <span className="font-medium">{session.date} {session.time}</span>
                          </div>
                          <div>
                            <span className="block text-gray-500">시간</span>
                            <span className="font-medium">{session.duration}</span>
                          </div>
                          <div>
                            <span className="block text-gray-500">참가자</span>
                            <span className="font-medium">
                              {session.currentParticipants}
                              {session.maxParticipants && `/${session.maxParticipants}`}명
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">
                        {session.price.toLocaleString()}원
                      </span>
                      <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                        신청하기
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">멘토링 안내</h3>
              <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">📚 기술 멘토링</h4>
                  <p className="text-sm text-blue-700">실무 기술과 노하우를 전수받으세요</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">💼 경력 개발</h4>
                  <p className="text-sm text-green-700">경력 계획과 성장 전략을 상담받으세요</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">🎯 목표 달성</h4>
                  <p className="text-sm text-purple-700">구체적인 목표 달성을 위한 코칭</p>
                </div>
                
                <button className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700">
                  멘토 지원하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 학습 경로 */}
        {selectedTab === 'paths' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {learningPaths.map(path => (
              <div key={path.id} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{path.title}</h3>
                  <p className="text-gray-600">{path.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-500">목표 역할</span>
                    <div className="font-medium text-gray-900">{path.targetRole}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">예상 기간</span>
                    <div className="font-medium text-gray-900">{path.estimatedDuration}</div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">진행률</span>
                    <span className="font-medium text-gray-900">{path.completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${path.completionRate}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">기대 효과</h4>
                  <ul className="space-y-1">
                    {path.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-green-600">✓</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <button className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700">
                  학습 시작하기
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 내 학습 */}
        {selectedTab === 'my-learning' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">진행 중인 과정</h3>
              {courses.slice(0, 2).map(course => (
                <div key={course.id} className="bg-white rounded-lg p-6 shadow-sm mb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>👨‍🏫 {course.instructor.name}</span>
                        <span>⏱️ {course.duration}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(course.level)}`}>
                      {getLevelText(course.level)}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {course.modules.map(module => (
                      <div key={module.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={module.completed}
                            className="text-orange-600"
                            readOnly
                          />
                          <span className={module.completed ? 'line-through text-gray-500' : 'text-gray-900'}>
                            {module.title}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">{module.duration}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">전체 진행률</span>
                      <span className="font-medium text-gray-900">
                        {Math.round((course.modules.filter(m => m.completed).length / course.modules.length) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ 
                          width: `${(course.modules.filter(m => m.completed).length / course.modules.length) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                    이어서 학습하기
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              {/* 학습 통계 */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">학습 통계</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">총 학습 시간</span>
                    <span className="font-medium text-gray-900">45시간</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">완료한 과정</span>
                    <span className="font-medium text-gray-900">3개</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">획득한 수료증</span>
                    <span className="font-medium text-gray-900">2개</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">멘토링 참여</span>
                    <span className="font-medium text-gray-900">5회</span>
                  </div>
                </div>
              </div>

              {/* 추천 과정 */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">추천 과정</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-orange-50 rounded">
                    <h5 className="font-medium text-orange-900">고급 전기작업</h5>
                    <p className="text-sm text-orange-700">현재 학습 경로에 추천</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded">
                    <h5 className="font-medium text-blue-900">팀 리더십</h5>
                    <p className="text-sm text-blue-700">경력 발전을 위한 추천</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 과정 상세 모달 */}
        {selectedCourse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{selectedCourse.title}</h3>
                  <button
                    onClick={() => setSelectedCourse(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">과정 소개</h4>
                    <p className="text-gray-700">{selectedCourse.description}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">강사 정보</h4>
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{selectedCourse.instructor.name}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getTierColor(selectedCourse.instructor.tier)}`}>
                            {selectedCourse.instructor.tier}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">평점: ⭐ {selectedCourse.instructor.rating}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">커리큘럼</h4>
                    <div className="space-y-2">
                      {selectedCourse.modules.map((module, index) => (
                        <div key={module.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </span>
                            <span className="text-gray-900">{module.title}</span>
                          </div>
                          <span className="text-sm text-gray-600">{module.duration}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {selectedCourse.price.toLocaleString()}원
                      </div>
                      <div className="text-sm text-gray-600">
                        {selectedCourse.duration} • {selectedCourse.enrolledCount}명 수강 중
                      </div>
                    </div>
                    <button className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700">
                      수강 신청하기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}