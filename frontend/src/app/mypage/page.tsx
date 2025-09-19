'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { userAPI } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  userType: 'worker' | 'employer';
  profileImage?: string;
  createdAt: string;
  
  // Worker specific
  birthDate?: string;
  gender?: string;
  address?: string;
  preferredCategories?: string[];
  availableDays?: string[];
  
  // Employer specific
  companyName?: string;
  businessNumber?: string;
  industry?: string;
}

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  appliedAt: string;
  hourlyPay: number;
  workDate?: string;
  workHours?: string;
}

interface WorkHistory {
  id: string;
  jobTitle: string;
  company: string;
  workDate: string;
  workHours: string;
  hourlyPay: number;
  totalPay: number;
  status: 'completed' | 'pending_payment' | 'paid';
  rating?: number;
  review?: string;
}

export default function MyPage() {
  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [workHistory, setWorkHistory] = useState<WorkHistory[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});

  useEffect(() => {
    fetchUserData();
    fetchApplications();
    fetchWorkHistory();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await userAPI.getProfile();
      const userData = response.data.user;
      
      // API 응답을 프론트엔드 인터페이스에 맞게 변환
      const user: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '',
        userType: userData.userType?.toLowerCase() as 'worker' | 'employer',
        profileImage: userData.profileImage || '/api/placeholder/150/150',
        createdAt: userData.createdAt,
        // 추가 프로필 정보는 별도 API나 확장 필요
        birthDate: userData.birthDate,
        gender: userData.gender,
        address: userData.address,
        preferredCategories: userData.preferredCategories || [],
        availableDays: userData.availableDays || [],
        // 고용주 정보
        companyName: userData.companyName,
        businessNumber: userData.businessNumber,
        industry: userData.industry
      };
      
      setUser(user);
      setEditForm(user);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await userAPI.getApplications();
      const applicationsData = response.data;
      
      // API 응답을 프론트엔드 인터페이스에 맞게 변환
      const applications: Application[] = applicationsData.map((app: any) => ({
        id: app.id,
        jobId: app.job.id,
        jobTitle: app.job.title,
        company: app.job.employer?.name || '회사명 미제공',
        status: app.status?.toLowerCase() as 'pending' | 'approved' | 'rejected' | 'completed',
        appliedAt: app.createdAt,
        hourlyPay: app.job.wage,
        workDate: app.job.workDate,
        workHours: app.job.workHours || '시간 미정'
      }));
      
      setApplications(applications);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      // 에러 시 빈 배열로 설정
      setApplications([]);
    }
  };

  const fetchWorkHistory = async () => {
    try {
      // 완료된 지원 내역에서 근무 이력 생성
      const response = await userAPI.getApplications();
      const applicationsData = response.data;
      
      // 완료된(ACCEPTED) 지원만 근무 이력으로 변환
      const workHistory: WorkHistory[] = applicationsData
        .filter((app: any) => app.status === 'ACCEPTED')
        .map((app: any) => {
          const workHours = app.job.workHours || '시간 미정';
          const hourlyPay = app.job.wage;
          // 간단한 총 급여 계산 (실제로는 더 복잡한 로직 필요)
          const hoursWorked = parseFloat(workHours.replace(/[^0-9.]/g, '')) || 8;
          const totalPay = hourlyPay * hoursWorked;
          
          return {
            id: app.id,
            jobTitle: app.job.title,
            company: app.job.employer?.name || '회사명 미제공',
            workDate: app.job.workDate,
            workHours: workHours,
            hourlyPay: hourlyPay,
            totalPay: totalPay,
            status: 'completed' as 'completed' | 'pending_payment' | 'paid',
            rating: undefined, // 평가 시스템이 구현되면 추가
            review: undefined
          };
        });
      
      setWorkHistory(workHistory);
    } catch (error) {
      console.error('Failed to fetch work history:', error);
      // 에러 시 빈 배열로 설정
      setWorkHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const updateData = {
        name: editForm.name,
        userType: editForm.userType?.toUpperCase() as 'WORKER' | 'EMPLOYER'
      };
      
      await userAPI.updateProfile(updateData);
      
      setUser({ ...user, ...editForm } as User);
      setIsEditing(false);
      alert('프로필이 업데이트되었습니다.');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('프로필 업데이트에 실패했습니다.');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      pending_payment: 'bg-orange-100 text-orange-800'
    };
    
    const labels = {
      pending: '대기중',
      approved: '승인됨',
      rejected: '거절됨',
      completed: '완료',
      paid: '지급완료',
      pending_payment: '지급대기'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + '원';
  };

  const totalEarnings = workHistory
    .filter(work => work.status === 'paid')
    .reduce((sum, work) => sum + work.totalPay, 0);

  const pendingPayments = workHistory
    .filter(work => work.status === 'pending_payment')
    .reduce((sum, work) => sum + work.totalPay, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="text-center py-12">
          <p className="text-gray-600">사용자 정보를 불러올 수 없습니다.</p>
          <Link href="/login" className="text-indigo-600 hover:underline">
            로그인하기
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 rounded-full bg-indigo-100 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-indigo-600">
                    {user.name.charAt(0)}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
                <div className="mt-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.userType === 'worker' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {user.userType === 'worker' ? '구직자' : '기업'}
                  </span>
                </div>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'dashboard'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  📊 대시보드
                </button>
                <button
                  onClick={() => setActiveTab('applications')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'applications'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  📝 지원 현황
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'history'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  💼 근무 이력
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'profile'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  ⚙️ 프로필 설정
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Dashboard */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">대시보드</h2>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                          <span className="text-green-600 font-semibold">₩</span>
                        </div>
                      </div>
                      <div className="ml-5">
                        <p className="text-sm font-medium text-gray-500">총 수익</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {formatCurrency(totalEarnings)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">#</span>
                        </div>
                      </div>
                      <div className="ml-5">
                        <p className="text-sm font-medium text-gray-500">완료한 일</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {workHistory.filter(w => w.status === 'paid').length}개
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                          <span className="text-yellow-600 font-semibold">⏳</span>
                        </div>
                      </div>
                      <div className="ml-5">
                        <p className="text-sm font-medium text-gray-500">정산 대기</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {formatCurrency(pendingPayments)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">최근 활동</h3>
                    <div className="space-y-4">
                      {[...applications.slice(0, 2), ...workHistory.slice(0, 3)].map((item, index) => (
                        <div key={index} className="flex items-center justify-between border-b pb-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.jobTitle}
                            </p>
                            <p className="text-sm text-gray-500">
                              {item.company}
                            </p>
                          </div>
                          <div className="text-right">
                            {'status' in item && getStatusBadge(item.status)}
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate('appliedAt' in item ? item.appliedAt : item.workDate)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Applications */}
            {activeTab === 'applications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">지원 현황</h2>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      총 {applications.length}건의 지원
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {applications.map((application) => (
                      <div key={application.id} className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-medium text-gray-900">
                              {application.jobTitle}
                            </h4>
                            <p className="text-gray-600">{application.company}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              시급 {formatCurrency(application.hourlyPay)}
                            </p>
                            {application.workDate && (
                              <p className="text-sm text-gray-500">
                                근무일: {formatDate(application.workDate)} ({application.workHours})
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            {getStatusBadge(application.status)}
                            <p className="text-xs text-gray-500 mt-2">
                              {formatDate(application.appliedAt)} 지원
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Work History */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">근무 이력</h2>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      총 {workHistory.length}건의 근무 완료
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {workHistory.map((work) => (
                      <div key={work.id} className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="text-lg font-medium text-gray-900">
                              {work.jobTitle}
                            </h4>
                            <p className="text-gray-600">{work.company}</p>
                            <p className="text-sm text-gray-500">
                              {formatDate(work.workDate)} • {work.workHours}
                            </p>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(work.status)}
                            <p className="text-lg font-semibold text-gray-900 mt-1">
                              {formatCurrency(work.totalPay)}
                            </p>
                          </div>
                        </div>
                        {work.rating && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <div className="flex items-center mb-2">
                              <span className="text-sm font-medium text-gray-700 mr-2">
                                기업 평가:
                              </span>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <span
                                    key={i}
                                    className={`text-sm ${
                                      i < work.rating! ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                            </div>
                            {work.review && (
                              <p className="text-sm text-gray-600">"{work.review}"</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">프로필 설정</h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    {isEditing ? '취소' : '편집'}
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <form onSubmit={(e) => { e.preventDefault(); handleUpdateProfile(); }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          이름
                        </label>
                        <input
                          type="text"
                          value={isEditing ? editForm.name || '' : user.name}
                          onChange={(e) => isEditing && setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          disabled={!isEditing}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          이메일
                        </label>
                        <input
                          type="email"
                          value={user.email}
                          disabled
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          전화번호
                        </label>
                        <input
                          type="tel"
                          value={isEditing ? editForm.phone || '' : user.phone}
                          onChange={(e) => isEditing && setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                          disabled={!isEditing}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
                        />
                      </div>

                      {user.userType === 'worker' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              주소
                            </label>
                            <input
                              type="text"
                              value={isEditing ? editForm.address || '' : user.address || ''}
                              onChange={(e) => isEditing && setEditForm(prev => ({ ...prev, address: e.target.value }))}
                              disabled={!isEditing}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              선호 업종
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {user.preferredCategories?.map((category) => (
                                <span
                                  key={category}
                                  className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full"
                                >
                                  {category}
                                </span>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {isEditing && (
                      <div className="mt-6 flex justify-end">
                        <button
                          type="submit"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          저장하기
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}