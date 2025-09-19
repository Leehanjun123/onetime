'use client'

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'next/navigation';
import { jobAPI, applicationAPI } from '@/lib/api';

interface JobDetail {
  id: string;
  title: string;
  company: string;
  location: string;
  wage: number;
  category: string;
  workDate: string;
  workTime: string;
  description: string;
  employer?: {
    name: string;
    phone?: string;
  };
  applications?: any[];
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const [jobDetail, setJobDetail] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');

  useEffect(() => {
    fetchJobDetail();
  }, [params.id]);

  const fetchJobDetail = async () => {
    setLoading(true);
    try {
      const response = await jobAPI.getJobById(params.id);
      if (response.success && response.data) {
        const jobData = response.data;
        const jobDetail: JobDetail = {
          id: jobData.id,
          title: jobData.title,
          company: jobData.employer?.name || '회사명 미제공',
          location: jobData.location,
          wage: jobData.wage,
          category: jobData.category,
          workDate: jobData.workDate,
          workTime: jobData.workHours || '시간 미정',
          description: jobData.description,
          employer: jobData.employer,
          applications: jobData.applications
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
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const handleApply = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setApplying(true);
    try {
      await applicationAPI.applyToJob(params.id, {
        message: applicationMessage
      });
      
      alert('지원이 완료되었습니다!');
      setShowApplyModal(false);
      setApplicationMessage('');
      // 페이지 새로고침하여 지원 상태 업데이트
      fetchJobDetail();
    } catch (error) {
      console.error('지원 실패:', error);
      alert('지원에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setApplying(false);
    }
  };

  const canApply = () => {
    if (!isAuthenticated || !user || !jobDetail) return false;
    if (user.userType !== 'WORKER') return false;
    if (jobDetail.employer?.id === user.id) return false;
    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!jobDetail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">일자리를 찾을 수 없습니다</h1>
          <button
            onClick={() => router.push('/jobs')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            일자리 목록으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{jobDetail.title}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">기본 정보</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">회사</dt>
                    <dd className="text-sm text-gray-900">{jobDetail.company}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">위치</dt>
                    <dd className="text-sm text-gray-900">{jobDetail.location}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">카테고리</dt>
                    <dd className="text-sm text-gray-900">{jobDetail.category}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">근무 조건</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">시급</dt>
                    <dd className="text-sm text-gray-900 font-semibold">{formatCurrency(jobDetail.wage)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">근무일</dt>
                    <dd className="text-sm text-gray-900">{formatDate(jobDetail.workDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">근무시간</dt>
                    <dd className="text-sm text-gray-900">{jobDetail.workTime}</dd>
                  </div>
                </dl>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">상세 설명</h3>
              <p className="text-gray-700">{jobDetail.description}</p>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => router.push('/jobs')}
                className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
              >
                목록으로 돌아가기
              </button>
              
              {canApply() && (
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 font-semibold"
                >
                  지원하기
                </button>
              )}
              
              {!isAuthenticated && (
                <button
                  onClick={() => router.push('/login')}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
                >
                  로그인 후 지원하기
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 지원 모달 */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">일자리 지원</h3>
            <p className="text-gray-600 mb-4">
              <strong>{jobDetail?.title}</strong>에 지원하시겠습니까?
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                지원 메시지 (선택사항)
              </label>
              <textarea
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                placeholder="자기소개나 특별한 사항이 있으면 작성해주세요."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowApplyModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                disabled={applying}
              >
                취소
              </button>
              <button
                onClick={handleApply}
                disabled={applying}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {applying ? '지원 중...' : '지원하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}