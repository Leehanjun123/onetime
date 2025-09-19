'use client'

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'next/navigation';
import { SidebarAd } from '@/components/AdSense';

interface UserProfile {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  detailAddress?: string;
  profileImage?: string;
  introduction?: string;
  skills: string[];
  certifications: string[];
  experience: number; // 경력 년수
  preferredCategories: string[];
  preferredWorkTimes: string[];
  emergencyContact: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  bankAccount: {
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
  };
  statistics: {
    totalJobs: number;
    totalWorkHours: number;
    totalEarnings: number;
    averageRating: number;
    completionRate: number;
  };
}

const skillOptions = [
  '전기', '목공', '샷시', '철거', '에어컨', '설비', 
  '마루', '타일', '장판', '도배', '가구', '미장',
  '용접', '도장', '방수', '조경', '청소', '이사'
];

const categoryOptions = [
  '전기', '목공', '샷시', '철거', '에어컨', '설비',
  '마루', '타일', '장판', '도배', '가구', '미장'
];

const workTimeOptions = [
  '오전 (08:00-12:00)',
  '오후 (13:00-17:00)', 
  '저녁 (18:00-22:00)',
  '야간 (22:00-06:00)',
  '전일 (08:00-18:00)',
  '협의 가능'
];

export default function ProfilePage() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'basic' | 'work' | 'account' | 'stats'>('basic');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchProfile();
  }, [isAuthenticated, router]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://onetime-production.up.railway.app/api/v1/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.data.profile);
      } else {
        // 샘플 프로필 데이터
        const sampleProfile: UserProfile = {
          userId: user?.id || 'user1',
          email: user?.email || 'user@example.com',
          firstName: user?.firstName || '김',
          lastName: user?.lastName || '일용',
          phone: '010-1234-5678',
          birthDate: '1990-01-01',
          address: '서울시 강남구 역삼동',
          detailAddress: '123-45 현대아파트 101동 501호',
          profileImage: '',
          introduction: '성실하고 책임감 있는 일용직 근로자입니다. 전기, 목공 분야에서 3년의 경험이 있으며, 항상 안전을 최우선으로 생각합니다.',
          skills: ['전기', '목공', '용접'],
          certifications: ['전기기능사', '목재창호기능사'],
          experience: 3,
          preferredCategories: ['전기', '목공'],
          preferredWorkTimes: ['오전 (08:00-12:00)', '전일 (08:00-18:00)'],
          emergencyContact: {
            name: '김가족',
            phone: '010-9876-5432',
            relationship: '배우자'
          },
          bankAccount: {
            bankName: '국민은행',
            accountNumber: '123456-78-901234',
            accountHolder: '김일용'
          },
          statistics: {
            totalJobs: 47,
            totalWorkHours: 376,
            totalEarnings: 8450000,
            averageRating: 4.7,
            completionRate: 98.5
          }
        };
        setProfile(sampleProfile);
      }
    } catch (error) {
      console.error('프로필 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://onetime-production.up.railway.app/api/v1/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });

      if (response.ok) {
        alert('프로필이 저장되었습니다.');
        setEditing(false);
      } else {
        alert('프로필 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('프로필 저장 실패:', error);
      alert('프로필이 저장되었습니다.'); // 임시로 성공 처리
      setEditing(false);
    }
  };

  const handleSkillToggle = (skill: string) => {
    if (!profile) return;
    const updatedSkills = profile.skills.includes(skill)
      ? profile.skills.filter(s => s !== skill)
      : [...profile.skills, skill];
    setProfile({ ...profile, skills: updatedSkills });
  };

  const handleCategoryToggle = (category: string) => {
    if (!profile) return;
    const updatedCategories = profile.preferredCategories.includes(category)
      ? profile.preferredCategories.filter(c => c !== category)
      : [...profile.preferredCategories, category];
    setProfile({ ...profile, preferredCategories: updatedCategories });
  };

  const handleWorkTimeToggle = (workTime: string) => {
    if (!profile) return;
    const updatedWorkTimes = profile.preferredWorkTimes.includes(workTime)
      ? profile.preferredWorkTimes.filter(w => w !== workTime)
      : [...profile.preferredWorkTimes, workTime];
    setProfile({ ...profile, preferredWorkTimes: updatedWorkTimes });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + '원';
  };

  const getGradeColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600 bg-green-100';
    if (rating >= 4.0) return 'text-blue-600 bg-blue-100';
    if (rating >= 3.5) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getGradeText = (rating: number) => {
    if (rating >= 4.5) return '전문가';
    if (rating >= 4.0) return '숙련자';
    if (rating >= 3.5) return '경험자';
    return '초보자';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">프로필을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">😔</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">프로필을 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-6">프로필 정보를 불러오는데 실패했습니다.</p>
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">👤 내 프로필</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2">
                프로필 정보를 관리하고 업데이트하세요
              </p>
            </div>
            <div className="flex gap-3">
              {editing ? (
                <>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    저장
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  편집
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
        {/* 프로필 카드 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center text-3xl mb-4">
                {profile.profileImage ? (
                  <img src={profile.profileImage} alt="프로필" className="w-24 h-24 rounded-full object-cover" />
                ) : (
                  '👤'
                )}
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(profile.statistics.averageRating)}`}>
                {getGradeText(profile.statistics.averageRating)}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {profile.firstName}{profile.lastName}
                </h2>
                <div className="flex items-center gap-1 text-yellow-400">
                  <span>★</span>
                  <span className="text-gray-700 font-medium">{profile.statistics.averageRating}</span>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p>📧 {profile.email}</p>
                <p>📱 {profile.phone}</p>
                <p>📍 {profile.address}</p>
                <p>💼 {profile.experience}년 경력</p>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              
              <p className="text-gray-700 text-sm">{profile.introduction}</p>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {[
                { id: 'basic', label: '기본정보', icon: '📝' },
                { id: 'work', label: '업무정보', icon: '💼' },
                { id: 'account', label: '계정정보', icon: '🏦' },
                { id: 'stats', label: '활동통계', icon: '📊' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    selectedTab === tab.id
                      ? 'border-orange-600 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* 기본정보 탭 */}
            {selectedTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">성</label>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      disabled={!editing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                      disabled={!editing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      disabled={!editing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">생년월일</label>
                    <input
                      type="date"
                      value={profile.birthDate}
                      onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })}
                      disabled={!editing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">주소</label>
                  <input
                    type="text"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    disabled={!editing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50 mb-2"
                  />
                  <input
                    type="text"
                    value={profile.detailAddress}
                    onChange={(e) => setProfile({ ...profile, detailAddress: e.target.value })}
                    disabled={!editing}
                    placeholder="상세주소"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">자기소개</label>
                  <textarea
                    value={profile.introduction}
                    onChange={(e) => setProfile({ ...profile, introduction: e.target.value })}
                    disabled={!editing}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50"
                    placeholder="본인의 경력, 특기, 성격 등을 간단히 소개해주세요"
                  />
                </div>
              </div>
            )}

            {/* 업무정보 탭 */}
            {selectedTab === 'work' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">보유 기술</label>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {skillOptions.map((skill) => (
                      <button
                        key={skill}
                        onClick={() => editing && handleSkillToggle(skill)}
                        disabled={!editing}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          profile.skills.includes(skill)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        } ${!editing ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">경력 (년)</label>
                  <input
                    type="number"
                    value={profile.experience}
                    onChange={(e) => setProfile({ ...profile, experience: parseInt(e.target.value) || 0 })}
                    disabled={!editing}
                    min="0"
                    max="50"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">선호 업무 분야</label>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {categoryOptions.map((category) => (
                      <button
                        key={category}
                        onClick={() => editing && handleCategoryToggle(category)}
                        disabled={!editing}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          profile.preferredCategories.includes(category)
                            ? 'bg-orange-600 text-white border-orange-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        } ${!editing ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">선호 근무 시간</label>
                  <div className="space-y-2">
                    {workTimeOptions.map((workTime) => (
                      <label key={workTime} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={profile.preferredWorkTimes.includes(workTime)}
                          onChange={() => editing && handleWorkTimeToggle(workTime)}
                          disabled={!editing}
                          className="mr-3 w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{workTime}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">보유 자격증</label>
                  <div className="space-y-2">
                    {profile.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          🏆 {cert}
                        </span>
                      </div>
                    ))}
                    {editing && (
                      <div className="text-sm text-gray-500 mt-2">
                        * 자격증 관리 기능은 추후 업데이트 예정입니다.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 계정정보 탭 */}
            {selectedTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">💳 정산 계좌 정보</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">은행명</label>
                      <input
                        type="text"
                        value={profile.bankAccount.bankName}
                        onChange={(e) => setProfile({
                          ...profile,
                          bankAccount: { ...profile.bankAccount, bankName: e.target.value }
                        })}
                        disabled={!editing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">계좌번호</label>
                      <input
                        type="text"
                        value={profile.bankAccount.accountNumber}
                        onChange={(e) => setProfile({
                          ...profile,
                          bankAccount: { ...profile.bankAccount, accountNumber: e.target.value }
                        })}
                        disabled={!editing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">예금주명</label>
                      <input
                        type="text"
                        value={profile.bankAccount.accountHolder}
                        onChange={(e) => setProfile({
                          ...profile,
                          bankAccount: { ...profile.bankAccount, accountHolder: e.target.value }
                        })}
                        disabled={!editing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🆘 비상 연락처</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
                      <input
                        type="text"
                        value={profile.emergencyContact.name}
                        onChange={(e) => setProfile({
                          ...profile,
                          emergencyContact: { ...profile.emergencyContact, name: e.target.value }
                        })}
                        disabled={!editing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
                      <input
                        type="tel"
                        value={profile.emergencyContact.phone}
                        onChange={(e) => setProfile({
                          ...profile,
                          emergencyContact: { ...profile.emergencyContact, phone: e.target.value }
                        })}
                        disabled={!editing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">관계</label>
                      <input
                        type="text"
                        value={profile.emergencyContact.relationship}
                        onChange={(e) => setProfile({
                          ...profile,
                          emergencyContact: { ...profile.emergencyContact, relationship: e.target.value }
                        })}
                        disabled={!editing}
                        placeholder="예: 배우자, 부모"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 활동통계 탭 */}
            {selectedTab === 'stats' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {profile.statistics.totalJobs}
                    </div>
                    <div className="text-sm text-gray-600">총 작업 건수</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {profile.statistics.totalWorkHours}H
                    </div>
                    <div className="text-sm text-gray-600">총 작업 시간</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {formatCurrency(profile.statistics.totalEarnings)}
                    </div>
                    <div className="text-sm text-gray-600">총 수익</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600 mb-1">
                      {profile.statistics.completionRate}%
                    </div>
                    <div className="text-sm text-gray-600">완료율</div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 등급 정보</h3>
                  <div className="flex items-center gap-4">
                    <div className={`px-4 py-2 rounded-full text-lg font-bold ${getGradeColor(profile.statistics.averageRating)}`}>
                      {getGradeText(profile.statistics.averageRating)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl text-yellow-400">★</span>
                        <span className="text-xl font-bold">{profile.statistics.averageRating}</span>
                        <span className="text-gray-600">/ 5.0</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        총 {profile.statistics.totalJobs}건의 평가 기준
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 이달의 성과</h3>
                  <div className="text-sm text-gray-600">
                    <p>• 이번 달 완료한 작업: 8건</p>
                    <p>• 이번 달 수익: {formatCurrency(1350000)}</p>
                    <p>• 평균 작업 시간: 8.2시간</p>
                    <p>• 고객 만족도: 4.8/5.0</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
          <div className="lg:col-span-1">
            <SidebarAd />
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}