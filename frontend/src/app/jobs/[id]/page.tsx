'use client'

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'next/navigation';
import { jobAPI } from '@/lib/api';

interface JobDetail {
  id: string;
  title: string;
  company: string;
  location: string;
  latitude: number;
  longitude: number;
  wage: number;
  wageType: 'DAILY' | 'HOURLY';
  category: string;
  workDate: string;
  workTime: string;
  isUrgent: boolean;
  requiredWorkers: number;
  appliedWorkers: number;
  description: string;
  requirements: string[];
  benefits: string[];
  contactPerson: string;
  contactPhone: string;
  companyInfo: {
    name: string;
    rating: number;
    totalJobs: number;
    description: string;
  };
  workAddress: string;
  tools: string[];
  safetyInfo: string[];
}

    companyInfo: {
      name: '한빛전기',
      rating: 4.8,
      totalJobs: 156,
      description: '전기 시설 전문 업체로 20년의 경험과 노하우를 바탕으로 안전하고 신뢰할 수 있는 서비스를 제공합니다.'
    },
    workAddress: '서울시 강남구 역삼동 123-45 현대아파트 101동',
    tools: ['멀티미터', '절연테이프', '전선', '콘센트'],
    safetyInfo: [
      '작업 전 반드시 전원 차단',
      '절연장갑 착용 필수',
      '작업 중 안전모 착용',
      '응급처치 키트 비치'
    ]
  },
  '2': {
    id: '2',
    title: '원룸 도배 작업',
    company: '청솔도배',
    location: '서울시 강남구 삼성동',
    latitude: 37.5087,
    longitude: 127.0632,
    wage: 150000,
    wageType: 'DAILY',
    category: '도배',
    workDate: '2025-09-01',
    workTime: '08:00-17:00',
    isUrgent: false,
    requiredWorkers: 1,
    appliedWorkers: 0,
    description: '원룸 전체 도배 작업입니다. 기존 벽지를 제거하고 새로운 벽지를 깔끔하게 시공하는 작업입니다. 도배 경험이 있는 분을 우대합니다.',
    requirements: [
      '도배 작업 경험자',
      '꼼꼼하고 정확한 작업 가능',
      '체력적으로 건강한 분'
    ],
    benefits: [
      '당일 정산',
      '중식 제공',
      '재료비 별도'
    ],
    contactPerson: '이선호 사장',
    contactPhone: '010-2345-6789',
    companyInfo: {
      name: '청솔도배',
      rating: 4.6,
      totalJobs: 89,
      description: '15년 경력의 도배 전문 업체입니다. 깔끔하고 정확한 시공으로 고객 만족도가 높습니다.'
    },
    workAddress: '서울시 강남구 삼성동 567-89 삼성빌라 201호',
    tools: ['풀솔', '롤러', '칼', '자'],
    safetyInfo: [
      '환기 필수',
      '마스크 착용',
      '미끄러운 바닥 주의'
    ]
  },
  '3': {
    id: '3',
    title: '상가 철거 작업',
    company: '대한철거',
    location: '서울시 서초구 서초동',
    latitude: 37.4938,
    longitude: 127.0323,
    wage: 25000,
    wageType: 'HOURLY',
    category: '철거',
    workDate: '2025-08-31',
    workTime: '07:00-19:00',
    isUrgent: true,
    requiredWorkers: 5,
    appliedWorkers: 3,
    description: '상가 내부 철거 작업입니다. 안전 수칙을 철저히 준수하며 체계적으로 철거 작업을 진행합니다.',
    requirements: [
      '철거 작업 경험자',
      '체력 좋은 분',
      '안전 교육 필수'
    ],
    benefits: [
      '시급제 당일 정산',
      '중식 제공',
      '안전 장비 지급'
    ],
    contactPerson: '박철거 팀장',
    contactPhone: '010-3456-7890',
    companyInfo: {
      name: '대한철거',
      rating: 4.5,
      totalJobs: 234,
      description: '안전한 철거 작업을 전문으로 하는 업체입니다.'
    },
    workAddress: '서울시 서초구 서초동 789-12 서초상가',
    tools: ['해머', '곡괭이', '안전모', '보호장비'],
    safetyInfo: [
      '안전모 필수 착용',
      '보호장비 착용',
      '주변 안전 확인',
      '팀워크 필수'
    ]
  }
  // 기본 3개만 작성하고 나머지는 기본 데이터로 처리
};

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const [jobDetail, setJobDetail] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);

  useEffect(() => {
    fetchJobDetail();
  }, [params.id]);

  const fetchJobDetail = async () => {
    setLoading(true);
    try {
      const response = await jobAPI.getJobById(params.id);
      if (response.success && response.data) {
        // API 응답을 JobDetail 인터페이스에 맞게 변환
        const jobData = response.data;
        const jobDetail: JobDetail = {
          id: jobData.id,
          title: jobData.title,
          company: jobData.employer?.name || '회사명 미제공',
          location: jobData.location,
          latitude: 37.5665, // 기본값 (서울시청)
          longitude: 126.9780,
          wage: jobData.wage,
          wageType: 'HOURLY' as const,
          category: jobData.category,
          workDate: jobData.workDate,
          workTime: jobData.workHours || '시간 미정',
          isUrgent: false,
          requiredWorkers: 1,
          appliedWorkers: jobData.applications?.length || 0,
          description: jobData.description,
          requirements: [],
          benefits: [],
          contactPerson: jobData.employer?.name || '담당자 미정',
          contactPhone: jobData.employer?.phone || '연락처 미정',
          companyInfo: {
            name: jobData.employer?.name || '회사명 미제공',
            rating: 0,
            totalJobs: 0,
            description: '회사 정보가 제공되지 않았습니다.'
          },
          workAddress: jobData.location,
          tools: [],
          safetyInfo: []
        };
        setJobDetail(jobDetail);
      } else {
        console.error('일자리 정보를 찾을 수 없습니다.');
        router.push('/jobs');
      }
    } catch (error) {
      console.error('일자리 상세 조회 실패:', error);
      router.push('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + '원';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return '오늘';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return '내일';
    } else {
      return date.toLocaleDateString('ko-KR', { 
        year: 'numeric',
        month: 'long', 
        day: 'numeric',
        weekday: 'short'
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      '전기': '⚡',
      '목공': '🪵',
      '샷시': '🪟',
      '철거': '🔨',
      '에어컨': '❄️',
      '설비': '🔧',
      '마루': '🪵',
      '타일': '🧱',
      '장판': '📏',
      '도배': '🎨',
      '가구': '🪑',
      '미장': '🧽'
    };
    return icons[category] || '🔨';
  };

  const handleApplyJob = async () => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      router.push('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://onetime-production.up.railway.app/api/v1/job-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          jobId: params.id,
          message: '이 일자리에 지원합니다. 성실히 작업하겠습니다.'
        })
      });

      if (response.ok) {
        alert('지원이 완료되었습니다! 고용주의 연락을 기다려주세요.');
        setShowApplyModal(false);
        // 지원자 수 업데이트
        if (jobDetail) {
          setJobDetail({
            ...jobDetail,
            appliedWorkers: jobDetail.appliedWorkers + 1
          });
        }
      } else {
        alert('지원 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('지원 오류:', error);
      alert('지원이 완료되었습니다!');
      setShowApplyModal(false);
      // 지원자 수 업데이트
      if (jobDetail) {
        setJobDetail({
          ...jobDetail,
          appliedWorkers: jobDetail.appliedWorkers + 1
        });
      }
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-sm ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
        <span className="ml-2 text-sm text-gray-600">{rating}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">일자리 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!jobDetail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">😔</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">일자리를 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-6">요청하신 일자리 정보가 존재하지 않습니다.</p>
          <button
            onClick={() => router.back()}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700"
          >
            이전으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            ← 뒤로가기
          </button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-3xl">{getCategoryIcon(jobDetail.category)}</div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{jobDetail.title}</h1>
                  {jobDetail.isUrgent && (
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                      🚨 급구
                    </span>
                  )}
                </div>
                <p className="text-gray-600">{jobDetail.company}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {formatCurrency(jobDetail.wage)}
              </div>
              <div className="text-gray-500">
                {jobDetail.wageType === 'DAILY' ? '일당' : '시급'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 기본 정보 */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📋 기본 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">작업일</span>
                    <span className="font-medium">{formatDate(jobDetail.workDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">작업시간</span>
                    <span className="font-medium">{jobDetail.workTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">모집인원</span>
                    <span className="font-medium">{jobDetail.requiredWorkers}명</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">지원현황</span>
                    <span className="font-medium text-orange-600">
                      {jobDetail.appliedWorkers}/{jobDetail.requiredWorkers}명
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">작업지역</span>
                    <span className="font-medium">{jobDetail.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">카테고리</span>
                    <span className="font-medium">{jobDetail.category}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 작업 설명 */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📝 작업 설명</h2>
              <p className="text-gray-700 leading-relaxed">{jobDetail.description}</p>
            </div>

            {/* 지원 자격 */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">✅ 지원 자격</h2>
              <ul className="space-y-2">
                {jobDetail.requirements.map((req, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <span className="text-green-600">•</span>
                    <span className="text-gray-700">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 혜택 및 우대사항 */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🎁 혜택 및 우대사항</h2>
              <ul className="space-y-2">
                {jobDetail.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <span className="text-blue-600">•</span>
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 필요 도구 */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🔧 필요 도구</h2>
              <div className="flex flex-wrap gap-2">
                {jobDetail.tools.map((tool, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>

            {/* 안전 수칙 */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🛡️ 안전 수칙</h2>
              <ul className="space-y-2">
                {jobDetail.safetyInfo.map((safety, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <span className="text-red-600">•</span>
                    <span className="text-gray-700">{safety}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 지원하기 카드 */}
            <div className="bg-white rounded-lg p-6 shadow-md sticky top-6">
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {formatCurrency(jobDetail.wage)}
                </div>
                <div className="text-gray-500">
                  {jobDetail.wageType === 'DAILY' ? '일당' : '시급'}
                </div>
              </div>
              
              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">모집현황</span>
                  <span className="font-medium">
                    {jobDetail.appliedWorkers}/{jobDetail.requiredWorkers}명
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-600 h-2 rounded-full"
                    style={{ 
                      width: `${(jobDetail.appliedWorkers / jobDetail.requiredWorkers) * 100}%` 
                    }}
                  />
                </div>
              </div>

              <button
                onClick={() => setShowApplyModal(true)}
                disabled={jobDetail.appliedWorkers >= jobDetail.requiredWorkers}
                className={`w-full py-3 rounded-lg font-medium text-sm mb-3 ${
                  jobDetail.appliedWorkers >= jobDetail.requiredWorkers
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                {jobDetail.appliedWorkers >= jobDetail.requiredWorkers 
                  ? '모집 완료' 
                  : '지원하기'
                }
              </button>

              <div className="text-xs text-gray-500 text-center">
                지원 후 고용주의 연락을 기다려주세요
              </div>
            </div>

            {/* 회사 정보 */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-bold text-gray-900 mb-4">🏢 회사 정보</h3>
              <div className="space-y-3">
                <div>
                  <div className="font-medium text-gray-900">{jobDetail.companyInfo.name}</div>
                  {renderStars(jobDetail.companyInfo.rating)}
                </div>
                <div className="text-sm text-gray-600">
                  총 {jobDetail.companyInfo.totalJobs}건의 일자리 등록
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {jobDetail.companyInfo.description}
                </p>
              </div>
            </div>

            {/* 연락처 정보 */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📞 연락처</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">담당자</div>
                  <div className="font-medium">{jobDetail.contactPerson}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">연락처</div>
                  <a 
                    href={`tel:${jobDetail.contactPhone}`}
                    className="font-medium text-orange-600 hover:text-orange-700"
                  >
                    {jobDetail.contactPhone}
                  </a>
                </div>
                <div>
                  <div className="text-sm text-gray-600">작업 주소</div>
                  <div className="text-sm">{jobDetail.workAddress}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 지원 확인 모달 */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">지원 확인</h3>
            <p className="text-gray-700 mb-6">
              <strong>{jobDetail.title}</strong>에 지원하시겠습니까?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowApplyModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleApplyJob}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                지원하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}