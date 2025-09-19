'use client'

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'next/navigation';

interface WorkExperience {
  id: string;
  jobTitle: string;
  company: string;
  category: string;
  startDate: string;
  endDate: string;
  duration: number; // 작업 시간 (hours)
  wage: number;
  location: string;
  description: string;
  skills: string[];
  rating: number;
  images: string[];
  isCompleted: boolean;
  employerName: string;
  employerRating?: number;
  workType: 'DAILY' | 'HOURLY';
}

interface Portfolio {
  userId: string;
  totalExperience: number; // 총 경력 (months)
  totalProjects: number;
  totalEarnings: number;
  averageRating: number;
  specialties: string[];
  workExperiences: WorkExperience[];
  achievements: {
    id: string;
    title: string;
    description: string;
    date: string;
    type: 'CERTIFICATE' | 'AWARD' | 'MILESTONE';
  }[];
  skills: {
    name: string;
    level: number; // 1-5
    projectCount: number;
  }[];
}

export default function PortfolioPage() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showAddExperience, setShowAddExperience] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchPortfolio();
  }, [isAuthenticated, router]);

  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://onetime-production.up.railway.app/api/v1/portfolio', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPortfolio(data.data.portfolio);
      } else {
        // 포트폴리오 시스템은 현재 개발 중입니다
        setPortfolio(null);
      }
            {
              id: '1',
              jobTitle: '아파트 전기 배선 작업',
              company: '한빛전기',
              category: '전기',
              startDate: '2025-08-20',
              endDate: '2025-08-22',
              duration: 24,
              wage: 180000,
              location: '서울시 강남구 역삼동',
              description: '아파트 리모델링을 위한 전기 배선 작업을 담당했습니다. 기존 배선을 안전하게 제거하고 새로운 배선을 설치했으며, 모든 안전 수칙을 준수하여 작업을 완료했습니다.',
              skills: ['전기배선', '안전관리', '배전반작업'],
              rating: 4.8,
              images: [],
              isCompleted: true,
              employerName: '김현수 팀장',
              employerRating: 4.8,
              workType: 'DAILY'
            },
            {
              id: '2',
              jobTitle: '사무실 목공 인테리어',
              company: '프리미엄우드',
              category: '목공',
              startDate: '2025-08-15',
              endDate: '2025-08-17',
              duration: 21,
              wage: 22000,
              location: '서울시 강남구 논현동',
              description: '사무실 인테리어를 위한 목공 작업입니다. 파티션 설치와 데스크 제작을 담당했으며, 정밀한 치수로 고품질 마감을 완성했습니다.',
              skills: ['목공', '파티션설치', '가구제작'],
              rating: 4.6,
              images: [],
              isCompleted: true,
              employerName: '이사장',
              employerRating: 4.6,
              workType: 'HOURLY'
            },
            {
              id: '3',
              jobTitle: '카페 마루 재시공',
              company: '프리미엄마루',
              category: '마루',
              startDate: '2025-08-10',
              endDate: '2025-08-14',
              duration: 32,
              wage: 210000,
              location: '서울시 강남구 도곡동',
              description: '카페 바닥 마루 재시공 작업입니다. 기존 마루를 제거하고 새로운 원목 마루를 정교하게 시공했습니다.',
              skills: ['마루시공', '바닥작업', '목재가공'],
              rating: 4.9,
              images: [],
              isCompleted: true,
              employerName: '박사장',
              employerRating: 4.9,
              workType: 'DAILY'
            }
          ],
          achievements: [
            {
              id: '1',
              title: '전기기능사 자격증 취득',
              description: '전기 분야 국가기술자격증을 취득하여 전문성을 인정받았습니다.',
              date: '2023-03-15',
              type: 'CERTIFICATE'
            },
            {
              id: '2',
              title: '100회 작업 완료 달성',
              description: '총 100회의 일용직 작업을 성공적으로 완료했습니다.',
              date: '2024-12-20',
              type: 'MILESTONE'
            },
            {
              id: '3',
              title: '우수 작업자 선정',
              description: '고품질 작업과 성실한 태도로 이달의 우수 작업자로 선정되었습니다.',
              date: '2024-08-01',
              type: 'AWARD'
            }
          ],
          skills: [
            { name: '전기', level: 5, projectCount: 18 },
            { name: '목공', level: 4, projectCount: 15 },
            { name: '용접', level: 3, projectCount: 8 },
            { name: '마루', level: 4, projectCount: 6 }
          ]
        };
        setPortfolio(samplePortfolio);
      }
    } catch (error) {
      console.error('포트폴리오 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + '원';
  };

  const formatDuration = (hours: number) => {
    if (hours < 24) return `${hours}시간`;
    const days = Math.floor(hours / 8);
    return `${days}일`;
  };

  const getSkillLevel = (level: number) => {
    const levels = ['초급', '중급', '고급', '전문가', '마스터'];
    return levels[level - 1] || '초급';
  };

  const getSkillColor = (level: number) => {
    const colors = [
      'bg-gray-100 text-gray-600',
      'bg-blue-100 text-blue-600',
      'bg-green-100 text-green-600',
      'bg-orange-100 text-orange-600',
      'bg-purple-100 text-purple-600'
    ];
    return colors[level - 1] || colors[0];
  };

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'CERTIFICATE': return '🏆';
      case 'AWARD': return '🥇';
      case 'MILESTONE': return '🎯';
      default: return '⭐';
    }
  };

  const categories = ['ALL', '전기', '목공', '마루', '철거', '도배', '샷시'];

  const filteredExperiences = portfolio?.workExperiences.filter(exp => 
    selectedCategory === 'ALL' || exp.category === selectedCategory
  ) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">포트폴리오를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">포트폴리오를 찾을 수 없습니다</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">📋 포트폴리오</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2">
                작업 경험과 성취를 한눈에 확인하세요
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {Math.floor(portfolio.totalExperience / 12)}년 {portfolio.totalExperience % 12}개월
            </div>
            <div className="text-sm text-gray-600">총 경력</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {portfolio.totalProjects}
            </div>
            <div className="text-sm text-gray-600">완료 프로젝트</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {formatCurrency(portfolio.totalEarnings)}
            </div>
            <div className="text-sm text-gray-600">총 수익</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {portfolio.averageRating}
            </div>
            <div className="text-sm text-gray-600">평균 평점</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 작업 경험 */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <h2 className="text-xl font-bold text-gray-900">💼 작업 경험</h2>
                  
                  {/* 카테고리 필터 */}
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                          selectedCategory === category
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {category === 'ALL' ? '전체' : category}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {filteredExperiences.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="text-4xl mb-4">📝</div>
                    <p>해당 카테고리의 작업 경험이 없습니다.</p>
                  </div>
                ) : (
                  filteredExperiences.map((experience) => (
                    <div key={experience.id} className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {experience.jobTitle}
                            </h3>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {experience.category}
                            </span>
                            {experience.isCompleted && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                완료
                              </span>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-600 mb-3">
                            <p className="mb-1">{experience.company} • {experience.location}</p>
                            <p>{experience.startDate} - {experience.endDate} ({formatDuration(experience.duration)})</p>
                          </div>
                          
                          <p className="text-gray-700 mb-3">{experience.description}</p>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            {experience.skills.map((skill) => (
                              <span
                                key={skill}
                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900 mb-1">
                            {formatCurrency(experience.wage)}
                          </div>
                          <div className="text-sm text-gray-500 mb-2">
                            {experience.workType === 'DAILY' ? '일당' : '시급'}
                          </div>
                          <div className="flex items-center gap-1 text-yellow-400">
                            <span>★</span>
                            <span className="text-gray-700 font-medium">{experience.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 보유 기술 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">🛠️ 보유 기술</h3>
              <div className="space-y-3">
                {portfolio.skills.map((skill) => (
                  <div key={skill.name} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">{skill.name}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getSkillColor(skill.level)}`}>
                          {getSkillLevel(skill.level)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-600 h-2 rounded-full"
                            style={{ width: `${(skill.level / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{skill.projectCount}건</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 성취 및 인증 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">🏆 성취 및 인증</h3>
              <div className="space-y-4">
                {portfolio.achievements.map((achievement) => (
                  <div key={achievement.id} className="flex items-start gap-3">
                    <div className="text-xl">{getAchievementIcon(achievement.type)}</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{achievement.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                      <p className="text-xs text-gray-500">{achievement.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 전문 분야 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">⭐ 전문 분야</h3>
              <div className="flex flex-wrap gap-2">
                {portfolio.specialties.map((specialty) => (
                  <span
                    key={specialty}
                    className="px-3 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}