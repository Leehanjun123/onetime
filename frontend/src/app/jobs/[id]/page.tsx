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
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const [jobDetail, setJobDetail] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);

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

            {isAuthenticated && (
              <div className="flex justify-end">
                <button
                  onClick={() => router.push('/jobs')}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
                >
                  목록으로 돌아가기
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}