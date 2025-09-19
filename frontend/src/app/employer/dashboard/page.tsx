'use client'

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'next/navigation';
import { userAPI, applicationAPI } from '@/lib/api';

interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  wage: number;
  workDate: string;
  status: string;
  createdAt: string;
  applications?: Application[];
}

interface Application {
  id: string;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  worker: {
    id: string;
    name: string;
    email: string;
  };
}

export default function EmployerDashboard() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.userType !== 'EMPLOYER') {
      router.push('/');
      return;
    }
    fetchMyJobs();
  }, [isAuthenticated, user, router]);

  const fetchMyJobs = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getJobs();
      setJobs(response.data || []);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobApplications = async (jobId: string) => {
    setApplicationsLoading(true);
    try {
      const response = await applicationAPI.getJobApplications(jobId);
      setApplications(response.data || []);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      setApplications([]);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const handleSelectJob = (job: Job) => {
    setSelectedJob(job);
    fetchJobApplications(job.id);
  };

  const handleApplicationStatusUpdate = async (applicationId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      await applicationAPI.updateStatus(applicationId, status);
      alert(`지원서가 ${status === 'ACCEPTED' ? '승인' : '거절'}되었습니다.`);
      // 지원자 목록 새로고침
      if (selectedJob) {
        fetchJobApplications(selectedJob.id);
      }
    } catch (error) {
      console.error('Failed to update application status:', error);
      alert('지원서 상태 업데이트에 실패했습니다.');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      PENDING: '대기중',
      ACCEPTED: '승인됨',
      REJECTED: '거절됨'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">고용주 대시보드</h1>
          <p className="text-gray-600 mt-2">등록한 일자리와 지원자를 관리하세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 내 일자리 목록 */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">내 일자리</h2>
                <button
                  onClick={() => router.push('/jobs/create')}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm"
                >
                  새 일자리 등록
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {jobs.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  등록된 일자리가 없습니다.
                </div>
              ) : (
                jobs.map((job) => (
                  <div
                    key={job.id}
                    className={`p-6 cursor-pointer hover:bg-gray-50 ${
                      selectedJob?.id === job.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
                    }`}
                    onClick={() => handleSelectJob(job)}
                  >
                    <h3 className="font-semibold text-gray-900">{job.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{job.location}</p>
                    <p className="text-sm text-gray-600">시급 {formatCurrency(job.wage)}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">
                        {formatDate(job.workDate)}
                      </span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {job.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 지원자 목록 */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                지원자 목록
                {selectedJob && ` - ${selectedJob.title}`}
              </h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {!selectedJob ? (
                <div className="p-6 text-center text-gray-500">
                  일자리를 선택하여 지원자를 확인하세요
                </div>
              ) : applicationsLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                </div>
              ) : applications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  아직 지원자가 없습니다
                </div>
              ) : (
                applications.map((application) => (
                  <div key={application.id} className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {application.worker.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {application.worker.email}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(application.createdAt)} 지원
                        </p>
                      </div>
                      <div>
                        {getStatusBadge(application.status)}
                      </div>
                    </div>
                    
                    {application.message && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700">{application.message}</p>
                      </div>
                    )}

                    {application.status === 'PENDING' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApplicationStatusUpdate(application.id, 'ACCEPTED')}
                          className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 text-sm"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => handleApplicationStatusUpdate(application.id, 'REJECTED')}
                          className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 text-sm"
                        >
                          거절
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}