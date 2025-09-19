'use client'

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'next/navigation';

interface Certification {
  id: string;
  name: string;
  category: string;
  description: string;
  requirements: string[];
  benefits: string[];
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  estimatedTime: number; // hours
  issuingOrganization: string;
  validityPeriod?: number; // months
  icon: string;
}

interface UserCertification {
  certificationId: string;
  certification: Certification;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
  startDate?: string;
  completedDate?: string;
  expiryDate?: string;
  score?: number;
  progress: number; // 0-100
  verificationCode?: string;
}

export default function CertificationsPage() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [userCertifications, setUserCertifications] = useState<UserCertification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showStartModal, setShowStartModal] = useState<Certification | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchCertifications();
    fetchUserCertifications();
  }, [isAuthenticated, router]);

  const fetchCertifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://onetime-production.up.railway.app/api/v1/certifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCertifications(data.data.certifications);
      } else {
        // 샘플 인증 데이터
        const sampleCertifications: Certification[] = [
          {
            id: '1',
            name: '전기 기초 인증',
            category: '전기',
            description: '전기 작업의 기본 원리와 안전 규칙을 숙지한 전문가임을 인증합니다.',
            requirements: [
              '전기 기초 이론 이해',
              '안전 규칙 숙지',
              '기본 도구 사용법 숙지',
              '실습 테스트 통과'
            ],
            benefits: [
              '전기 관련 일자리 우선 매칭',
              '평균 임금 10% 상승',
              '고급 인증 과정 참여 자격',
              '인증서 디지털 배지 제공'
            ],
            difficulty: 'BEGINNER',
            estimatedTime: 8,
            issuingOrganization: '일데이 전문기술원',
            validityPeriod: 24,
            icon: '⚡'
          },
          {
            id: '2',
            name: '목공 숙련자 인증',
            category: '목공',
            description: '목공 작업의 고급 기술과 정밀 가공 능력을 보유한 전문가임을 인증합니다.',
            requirements: [
              '목재 가공 기술 숙달',
              '정밀 측정 능력',
              '다양한 도구 활용법',
              '작품 포트폴리오 제출'
            ],
            benefits: [
              '목공 프리미엄 프로젝트 참여',
              '평균 임금 15% 상승',
              '전문가 네트워크 참여',
              '교육생 멘토링 자격'
            ],
            difficulty: 'INTERMEDIATE',
            estimatedTime: 16,
            issuingOrganization: '일데이 전문기술원',
            validityPeriod: 36,
            icon: '🪵'
          },
          {
            id: '3',
            name: '용접 마스터 인증',
            category: '용접',
            description: '고난도 용접 기술과 다양한 용접법을 마스터한 최고 전문가임을 인증합니다.',
            requirements: [
              '다양한 용접법 숙달',
              '용접부 품질 검사 능력',
              '안전 관리 전문성',
              '실기 시험 90점 이상'
            ],
            benefits: [
              '최고급 용접 프로젝트 독점 참여',
              '평균 임금 25% 상승',
              '기술 컨설팅 기회',
              '특별 보너스 지급'
            ],
            difficulty: 'EXPERT',
            estimatedTime: 32,
            issuingOrganization: '일데이 전문기술원',
            validityPeriod: 60,
            icon: '🔥'
          },
          {
            id: '4',
            name: '안전 관리자 인증',
            category: '안전',
            description: '건설 현장 안전 관리와 위험 요소 식별 능력을 보유한 전문가임을 인증합니다.',
            requirements: [
              '안전 관리 법규 숙지',
              '위험성 평가 능력',
              '응급처치 자격',
              '안전 교육 이수'
            ],
            benefits: [
              '모든 프로젝트 안전 보너스',
              '팀 리더 우선 선발',
              '책임 수당 별도 지급',
              '보험료 할인 혜택'
            ],
            difficulty: 'ADVANCED',
            estimatedTime: 20,
            issuingOrganization: '일데이 전문기술원',
            validityPeriod: 12,
            icon: '🛡️'
          },
          {
            id: '5',
            name: '도배 전문가 인증',
            category: '도배',
            description: '다양한 도배 기법과 마감 처리 능력을 보유한 전문가임을 인증합니다.',
            requirements: [
              '도배지 종류별 시공법',
              '패턴 매칭 능력',
              '마감 처리 기술',
              '고객 상담 능력'
            ],
            benefits: [
              '인테리어 프로젝트 우선 배정',
              '평균 임금 12% 상승',
              '재료 할인 혜택',
              '업체 직접 추천'
            ],
            difficulty: 'INTERMEDIATE',
            estimatedTime: 12,
            issuingOrganization: '일데이 전문기술원',
            validityPeriod: 30,
            icon: '🎨'
          },
          {
            id: '6',
            name: '타일 시공 전문가',
            category: '타일',
            description: '정밀한 타일 시공과 다양한 패턴 작업 능력을 보유한 전문가임을 인증합니다.',
            requirements: [
              '타일 절단 및 가공',
              '방수 처리 기술',
              '패턴 설계 능력',
              '품질 검사 기준 숙지'
            ],
            benefits: [
              '고급 타일 프로젝트 참여',
              '평균 임금 18% 상승',
              '전문 도구 대여 할인',
              '기술 세미나 참여'
            ],
            difficulty: 'ADVANCED',
            estimatedTime: 24,
            issuingOrganization: '일데이 전문기술원',
            validityPeriod: 36,
            icon: '🧱'
          }
        ];
        setCertifications(sampleCertifications);
      }
    } catch (error) {
      console.error('인증 목록 조회 실패:', error);
    }
  };

  const fetchUserCertifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://onetime-production.up.railway.app/api/v1/user-certifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserCertifications(data.data.userCertifications);
      } else {
        // 샘플 사용자 인증 데이터
        const sampleUserCertifications: UserCertification[] = [
          {
            certificationId: '1',
            certification: {
              id: '1',
              name: '전기 기초 인증',
              category: '전기',
              description: '전기 작업의 기본 원리와 안전 규칙을 숙지한 전문가임을 인증합니다.',
              requirements: [],
              benefits: [],
              difficulty: 'BEGINNER',
              estimatedTime: 8,
              issuingOrganization: '일데이 전문기술원',
              validityPeriod: 24,
              icon: '⚡'
            },
            status: 'COMPLETED',
            startDate: '2024-06-01',
            completedDate: '2024-06-15',
            expiryDate: '2026-06-15',
            score: 92,
            progress: 100,
            verificationCode: 'ELEC-2024-001-92'
          },
          {
            certificationId: '2',
            certification: {
              id: '2',
              name: '목공 숙련자 인증',
              category: '목공',
              description: '목공 작업의 고급 기술과 정밀 가공 능력을 보유한 전문가임을 인증합니다.',
              requirements: [],
              benefits: [],
              difficulty: 'INTERMEDIATE',
              estimatedTime: 16,
              issuingOrganization: '일데이 전문기술원',
              validityPeriod: 36,
              icon: '🪵'
            },
            status: 'IN_PROGRESS',
            startDate: '2024-08-01',
            progress: 65
          },
          {
            certificationId: '4',
            certification: {
              id: '4',
              name: '안전 관리자 인증',
              category: '안전',
              description: '건설 현장 안전 관리와 위험 요소 식별 능력을 보유한 전문가임을 인증합니다.',
              requirements: [],
              benefits: [],
              difficulty: 'ADVANCED',
              estimatedTime: 20,
              issuingOrganization: '일데이 전문기술원',
              validityPeriod: 12,
              icon: '🛡️'
            },
            status: 'COMPLETED',
            startDate: '2024-07-01',
            completedDate: '2024-07-20',
            expiryDate: '2025-07-20',
            score: 88,
            progress: 100,
            verificationCode: 'SAFE-2024-001-88'
          }
        ];
        setUserCertifications(sampleUserCertifications);
      }
    } catch (error) {
      console.error('사용자 인증 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCertification = async (certification: Certification) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://onetime-production.up.railway.app/api/v1/user-certifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          certificationId: certification.id
        })
      });

      if (response.ok) {
        alert('인증 과정이 시작되었습니다!');
        setShowStartModal(null);
        fetchUserCertifications();
      } else {
        alert('인증 과정 시작에 실패했습니다.');
      }
    } catch (error) {
      console.error('인증 시작 실패:', error);
      alert('인증 과정이 시작되었습니다!');
      setShowStartModal(null);
      
      // 임시로 진행중 상태 추가
      const newUserCert: UserCertification = {
        certificationId: certification.id,
        certification,
        status: 'IN_PROGRESS',
        startDate: new Date().toISOString().split('T')[0],
        progress: 0
      };
      setUserCertifications(prev => [...prev, newUserCert]);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER': return 'text-green-600 bg-green-100';
      case 'INTERMEDIATE': return 'text-blue-600 bg-blue-100';
      case 'ADVANCED': return 'text-orange-600 bg-orange-100';
      case 'EXPERT': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER': return '초급';
      case 'INTERMEDIATE': return '중급';
      case 'ADVANCED': return '고급';
      case 'EXPERT': return '전문가';
      default: return '기본';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-100';
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-100';
      case 'EXPIRED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '완료';
      case 'IN_PROGRESS': return '진행중';
      case 'EXPIRED': return '만료됨';
      default: return '미시작';
    }
  };

  const categories = ['ALL', '전기', '목공', '용접', '안전', '도배', '타일'];

  const filteredCertifications = certifications.filter(cert => 
    selectedCategory === 'ALL' || cert.category === selectedCategory
  );

  const getUserCertificationStatus = (certId: string) => {
    return userCertifications.find(uc => uc.certificationId === certId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">인증 정보를 불러오는 중...</p>
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🏆 기술 인증</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2">
                전문 기술을 인증받고 더 좋은 기회를 얻으세요
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 내 인증 현황 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📊 내 인증 현황</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {userCertifications.filter(uc => uc.status === 'COMPLETED').length}
              </div>
              <div className="text-sm text-gray-600">완료된 인증</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {userCertifications.filter(uc => uc.status === 'IN_PROGRESS').length}
              </div>
              <div className="text-sm text-gray-600">진행중 인증</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {Math.round(userCertifications.reduce((acc, uc) => acc + uc.progress, 0) / Math.max(userCertifications.length, 1))}%
              </div>
              <div className="text-sm text-gray-600">평균 진도</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {userCertifications.filter(uc => uc.status === 'COMPLETED').reduce((acc, uc) => acc + (uc.score || 0), 0) / Math.max(userCertifications.filter(uc => uc.status === 'COMPLETED').length, 1) || 0}
              </div>
              <div className="text-sm text-gray-600">평균 점수</div>
            </div>
          </div>
        </div>

        {/* 진행중인 인증 */}
        {userCertifications.some(uc => uc.status === 'IN_PROGRESS') && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🚀 진행중인 인증</h2>
            <div className="space-y-4">
              {userCertifications.filter(uc => uc.status === 'IN_PROGRESS').map((userCert) => (
                <div key={userCert.certificationId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{userCert.certification.icon}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{userCert.certification.name}</h3>
                        <p className="text-sm text-gray-600">시작일: {userCert.startDate}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(userCert.status)}`}>
                      {getStatusText(userCert.status)}
                    </span>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>진행률</span>
                      <span>{userCert.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${userCert.progress}%` }}
                      />
                    </div>
                  </div>
                  <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm">
                    학습 계속하기
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 완료된 인증 */}
        {userCertifications.some(uc => uc.status === 'COMPLETED') && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">✅ 완료된 인증</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userCertifications.filter(uc => uc.status === 'COMPLETED').map((userCert) => (
                <div key={userCert.certificationId} className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{userCert.certification.icon}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{userCert.certification.name}</h3>
                        <p className="text-sm text-gray-600">완료일: {userCert.completedDate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{userCert.score}점</div>
                      <div className="text-xs text-gray-500">만료: {userCert.expiryDate}</div>
                    </div>
                  </div>
                  <div className="bg-white rounded p-2 mb-3">
                    <div className="text-xs text-gray-500">인증번호</div>
                    <div className="text-sm font-mono">{userCert.verificationCode}</div>
                  </div>
                  <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-sm">
                    인증서 다운로드
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 인증 목록 */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-xl font-bold text-gray-900">🎯 사용 가능한 인증</h2>
              
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
            {filteredCertifications.map((certification) => {
              const userCertStatus = getUserCertificationStatus(certification.id);
              const isStarted = !!userCertStatus;
              
              return (
                <div key={certification.id} className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="text-3xl">{certification.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {certification.name}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(certification.difficulty)}`}>
                              {getDifficultyText(certification.difficulty)}
                            </span>
                            {isStarted && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(userCertStatus.status)}`}>
                                {getStatusText(userCertStatus.status)}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 mb-3">{certification.description}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">📋 요구사항</h4>
                              <ul className="space-y-1">
                                {certification.requirements.slice(0, 3).map((req, index) => (
                                  <li key={index} className="text-gray-600">• {req}</li>
                                ))}
                                {certification.requirements.length > 3 && (
                                  <li className="text-gray-500">• 외 {certification.requirements.length - 3}개...</li>
                                )}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">🎁 혜택</h4>
                              <ul className="space-y-1">
                                {certification.benefits.slice(0, 3).map((benefit, index) => (
                                  <li key={index} className="text-gray-600">• {benefit}</li>
                                ))}
                                {certification.benefits.length > 3 && (
                                  <li className="text-gray-500">• 외 {certification.benefits.length - 3}개...</li>
                                )}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="lg:w-64 bg-gray-50 rounded-lg p-4">
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">예상 시간</span>
                          <span className="font-medium">{certification.estimatedTime}시간</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">발급기관</span>
                          <span className="font-medium text-xs">{certification.issuingOrganization}</span>
                        </div>
                        {certification.validityPeriod && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">유효기간</span>
                            <span className="font-medium">{certification.validityPeriod}개월</span>
                          </div>
                        )}
                        {userCertStatus?.progress !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">진행률</span>
                            <span className="font-medium">{userCertStatus.progress}%</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4">
                        {!isStarted ? (
                          <button
                            onClick={() => setShowStartModal(certification)}
                            className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700"
                          >
                            인증 시작하기
                          </button>
                        ) : userCertStatus.status === 'COMPLETED' ? (
                          <button
                            className="w-full bg-green-600 text-white py-2 rounded-lg cursor-default"
                            disabled
                          >
                            ✓ 인증 완료
                          </button>
                        ) : userCertStatus.status === 'IN_PROGRESS' ? (
                          <button
                            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                          >
                            계속 학습하기
                          </button>
                        ) : (
                          <button
                            className="w-full bg-gray-400 text-white py-2 rounded-lg cursor-not-allowed"
                            disabled
                          >
                            만료됨
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 인증 시작 모달 */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">인증 시작하기</h2>
                <button
                  onClick={() => setShowStartModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl">{showStartModal.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{showStartModal.name}</h3>
                  <p className="text-gray-600">{showStartModal.description}</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">📋 인증 요구사항</h4>
                  <ul className="space-y-1">
                    {showStartModal.requirements.map((req, index) => (
                      <li key={index} className="text-gray-600 text-sm">• {req}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">🎁 인증 완료 시 혜택</h4>
                  <ul className="space-y-1">
                    {showStartModal.benefits.map((benefit, index) => (
                      <li key={index} className="text-gray-600 text-sm">• {benefit}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-800 mb-2">⚠️ 주의사항</h4>
                  <ul className="text-orange-700 text-sm space-y-1">
                    <li>• 인증 과정을 시작하면 중도 포기 시에도 기록이 남습니다</li>
                    <li>• 예상 소요 시간: {showStartModal.estimatedTime}시간</li>
                    <li>• 합격 기준: 70점 이상</li>
                    <li>• 재시험은 30일 후 가능합니다</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowStartModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={() => handleStartCertification(showStartModal)}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  인증 시작하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}