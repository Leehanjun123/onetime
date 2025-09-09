'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import { SidebarAd } from '@/components/AdSense';

// 타입 정의
interface QuickStat {
  label: string;
  value: string | number;
  change?: string;
  icon: string;
  link: string;
  color: string;
  bgGradient: string;
}

interface TodayJob {
  id: string;
  title: string;
  company: string;
  location: string;
  time: string;
  wage: string;
  status: '출근전' | '근무중' | '완료' | '취소';
  statusColor: string;
}

interface WeeklySchedule {
  date: string;
  day: string;
  jobs: number;
  income: string;
  isToday: boolean;
}

interface SafetyAlert {
  id: string;
  type: 'warning' | 'info' | 'success';
  message: string;
  icon: string;
}

export default function DashboardPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weatherInfo] = useState({ temp: 3, condition: '맑음', icon: '☀️', dust: '좋음' });
  const [isWorking, setIsWorking] = useState(false);
  const [workStartTime, setWorkStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      if (workStartTime) {
        const elapsed = new Date().getTime() - workStartTime.getTime();
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        setElapsedTime(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [workStartTime]);

  // 상태 데이터
  const [quickStats] = useState<QuickStat[]>([
    {
      label: '이번 달 수입',
      value: '3,450,000원',
      change: '+12%',
      icon: '💰',
      link: '/payments',
      color: 'text-green-600',
      bgGradient: 'from-green-400 to-emerald-500'
    },
    {
      label: '이번 주 근무',
      value: '5일',
      change: '40시간',
      icon: '📅',
      link: '/work-tracking',
      color: 'text-blue-600',
      bgGradient: 'from-blue-400 to-cyan-500'
    },
    {
      label: '평균 일당',
      value: '180,000원',
      change: '+5,000원',
      icon: '📈',
      link: '/payments',
      color: 'text-purple-600',
      bgGradient: 'from-purple-400 to-pink-500'
    },
    {
      label: '안전 점수',
      value: '92점',
      change: '상위 10%',
      icon: '🛡️',
      link: '/safety',
      color: 'text-orange-600',
      bgGradient: 'from-orange-400 to-red-500'
    }
  ]);

  const [todayJobs] = useState<TodayJob[]>([
    {
      id: '1',
      title: '아파트 신축 현장',
      company: '대한건설',
      location: '서울 강남구',
      time: '08:00 - 17:00',
      wage: '180,000원',
      status: '근무중',
      statusColor: 'bg-green-500'
    }
  ]);

  const [weeklySchedule] = useState<WeeklySchedule[]>([
    { date: '01.27', day: '월', jobs: 1, income: '180,000', isToday: false },
    { date: '01.28', day: '화', jobs: 1, income: '150,000', isToday: false },
    { date: '01.29', day: '수', jobs: 0, income: '0', isToday: false },
    { date: '01.30', day: '목', jobs: 1, income: '200,000', isToday: true },
    { date: '01.31', day: '금', jobs: 1, income: '180,000', isToday: false },
    { date: '02.01', day: '토', jobs: 1, income: '250,000', isToday: false },
    { date: '02.02', day: '일', jobs: 0, income: '0', isToday: false }
  ]);

  const [safetyAlerts] = useState<SafetyAlert[]>([
    {
      id: '1',
      type: 'warning',
      message: '오늘 미세먼지 나쁨 - 마스크 착용 필수',
      icon: '😷'
    },
    {
      id: '2',
      type: 'info',
      message: '안전모, 안전화 착용 확인',
      icon: '⛑️'
    },
    {
      id: '3',
      type: 'success',
      message: '무사고 근무 30일 달성!',
      icon: '🎉'
    }
  ]);

  const handleWorkToggle = () => {
    if (!isWorking) {
      setWorkStartTime(new Date());
      setIsWorking(true);
    } else {
      setWorkStartTime(null);
      setIsWorking(false);
      setElapsedTime('00:00:00');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', { 
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 모바일 최적화 헤더 */}
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                안녕하세요, {user?.firstName}{user?.lastName}님! 
                <span className="animate-wave">👋</span>
              </h1>
              <p className="text-orange-100 mt-1">
                {formatDate(currentTime)} • {formatTime(currentTime)}
              </p>
            </div>
            
            {/* 날씨 및 현장 정보 */}
            <div className="flex gap-4 text-sm">
              <div className="bg-white/20 backdrop-blur rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{weatherInfo.icon}</span>
                  <div>
                    <div className="font-semibold">{weatherInfo.temp}°C</div>
                    <div className="text-xs">미세먼지: {weatherInfo.dust}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 출퇴근 체크 카드 - 모바일 최적화 */}
        <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span>⏰</span> 근무 시간 관리
            </h2>
          </div>
          <div className="p-4">
            {todayJobs.length > 0 ? (
              <div className="space-y-4">
                {todayJobs.map((job) => (
                  <div key={job.id} className="border rounded-xl p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg">{job.title}</h3>
                        <p className="text-sm text-gray-600">{job.company}</p>
                        <p className="text-xs text-gray-500 mt-1">📍 {job.location}</p>
                      </div>
                      <span className={`${job.statusColor} text-white px-3 py-1 rounded-full text-sm font-medium`}>
                        {job.status}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <span className="text-gray-600">근무시간: </span>
                        <span className="font-semibold">{job.time}</span>
                      </div>
                      <div className="text-lg font-bold text-orange-600">{job.wage}</div>
                    </div>
                  </div>
                ))}
                
                {/* 출퇴근 버튼 - 큼직하게 */}
                <div className="flex gap-3">
                  <button
                    onClick={handleWorkToggle}
                    className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all transform active:scale-95 ${
                      isWorking 
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg' 
                        : 'bg-green-500 hover:bg-green-600 text-white shadow-lg'
                    }`}
                  >
                    {isWorking ? '🔴 퇴근하기' : '🟢 출근하기'}
                  </button>
                  <button className="px-6 py-4 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                    <span className="text-2xl">📷</span>
                  </button>
                </div>
                
                {isWorking && (
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600 mb-1">근무 시간</p>
                    <p className="text-3xl font-bold text-blue-600">{elapsedTime}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">😴</div>
                <p className="text-gray-600 mb-4">오늘은 예정된 근무가 없습니다</p>
                <Link 
                  href="/jobs"
                  className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  일자리 찾기 →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 주요 지표 - 모바일 스크롤 가능 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {quickStats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.link}
              className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all transform hover:scale-105 overflow-hidden group"
            >
              <div className={`h-2 bg-gradient-to-r ${stat.bgGradient}`}></div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">{stat.icon}</span>
                  {stat.change && (
                    <span className="text-xs font-medium text-gray-500">
                      {stat.change}
                    </span>
                  )}
                </div>
                <div className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 컨텐츠 영역 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 주간 일정 */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span>📅</span> 이번 주 일정
                </h2>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-7 gap-2">
                  {weeklySchedule.map((day) => (
                    <div
                      key={day.date}
                      className={`text-center p-3 rounded-lg transition-all ${
                        day.isToday 
                          ? 'bg-orange-500 text-white shadow-lg transform scale-105' 
                          : day.jobs > 0 
                          ? 'bg-blue-50 hover:bg-blue-100' 
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="text-xs font-medium mb-1">{day.day}</div>
                      <div className="text-sm font-bold mb-1">{day.date}</div>
                      {day.jobs > 0 && (
                        <>
                          <div className="text-xs">💼 {day.jobs}건</div>
                          <div className="text-xs font-semibold mt-1">{day.income}원</div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">주간 총 수입</p>
                      <p className="text-2xl font-bold text-gray-900">960,000원</p>
                    </div>
                    <Link 
                      href="/work-tracking"
                      className="bg-white px-4 py-2 rounded-lg text-sm font-medium text-purple-600 hover:bg-purple-50 transition-colors"
                    >
                      상세 보기 →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* 안전 알림 */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span>🛡️</span> 오늘의 안전 체크
                </h2>
              </div>
              <div className="p-4 space-y-3">
                {safetyAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      alert.type === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-400' :
                      alert.type === 'info' ? 'bg-blue-50 border-l-4 border-blue-400' :
                      'bg-green-50 border-l-4 border-green-400'
                    }`}
                  >
                    <span className="text-2xl">{alert.icon}</span>
                    <p className="text-sm font-medium">{alert.message}</p>
                  </div>
                ))}
                
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <button className="bg-gray-100 hover:bg-gray-200 p-3 rounded-lg text-center transition-colors">
                    <span className="text-2xl block mb-1">📋</span>
                    <span className="text-xs">체크리스트</span>
                  </button>
                  <button className="bg-gray-100 hover:bg-gray-200 p-3 rounded-lg text-center transition-colors">
                    <span className="text-2xl block mb-1">🚨</span>
                    <span className="text-xs">긴급 신고</span>
                  </button>
                  <button className="bg-gray-100 hover:bg-gray-200 p-3 rounded-lg text-center transition-colors">
                    <span className="text-2xl block mb-1">📚</span>
                    <span className="text-xs">안전 교육</span>
                  </button>
                </div>
              </div>
            </div>

            {/* AI 추천 일자리 */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span>🤖</span> AI 맞춤 일자리
                </h2>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {[
                    { title: '타워크레인 신호수', company: '삼성물산', location: '강남구', wage: '200,000원', match: 95 },
                    { title: '철근공', company: 'GS건설', location: '송파구', wage: '220,000원', match: 88 },
                    { title: '방수공', company: '현대건설', location: '서초구', wage: '190,000원', match: 82 }
                  ].map((job, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:border-orange-300 hover:bg-orange-50 transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold">{job.title}</h3>
                          <p className="text-sm text-gray-600">{job.company} • {job.location}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-orange-600">{job.wage}</div>
                          <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            매칭률 {job.match}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link 
                  href="/smart-matching"
                  className="block mt-4 text-center bg-orange-100 hover:bg-orange-200 text-orange-600 font-medium py-3 rounded-lg transition-colors"
                >
                  더 많은 추천 보기 →
                </Link>
              </div>
            </div>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 빠른 메뉴 - 건설현장 특화 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold mb-4">⚡ 빠른 메뉴</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: '🔍', label: '일자리', link: '/jobs' },
                  { icon: '💰', label: '급여', link: '/payments' },
                  { icon: '📊', label: '근무기록', link: '/work-tracking' },
                  { icon: '💬', label: '메시지', link: '/messages' },
                  { icon: '🏥', label: '건강검진', link: '/health' },
                  { icon: '📚', label: '자격증', link: '/certifications' },
                  { icon: '🎁', label: '복지', link: '/benefits' },
                  { icon: '⭐', label: '평가', link: '/reviews' },
                  { icon: '🆘', label: 'SOS', link: '/emergency' }
                ].map((menu) => (
                  <Link
                    key={menu.label}
                    href={menu.link}
                    className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-50 hover:bg-orange-50 hover:shadow-md transition-all group"
                  >
                    <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                      {menu.icon}
                    </span>
                    <span className="text-xs text-center font-medium">{menu.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* 실시간 알림 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">🔔 실시간 알림</h2>
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                  3 NEW
                </span>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                  <p className="text-sm font-medium">💼 긴급 모집</p>
                  <p className="text-xs text-gray-600 mt-1">강남 현장 내일 3명 추가 모집</p>
                  <p className="text-xs text-gray-500 mt-1">방금 전</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                  <p className="text-sm font-medium">💰 급여 입금</p>
                  <p className="text-xs text-gray-600 mt-1">어제 근무 급여 180,000원</p>
                  <p className="text-xs text-gray-500 mt-1">10분 전</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <p className="text-sm font-medium">📋 서류 완료</p>
                  <p className="text-xs text-gray-600 mt-1">4대보험 가입 처리 완료</p>
                  <p className="text-xs text-gray-500 mt-1">1시간 전</p>
                </div>
              </div>
              <button className="w-full mt-4 text-center text-sm text-orange-600 hover:text-orange-700 font-medium">
                모든 알림 보기 →
              </button>
            </div>

            {/* 내 프로필 요약 */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{user?.firstName}{user?.lastName}</h3>
                  <p className="text-sm text-gray-300">숙련 기술자</p>
                </div>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">경력</span>
                  <span className="font-medium">8년 3개월</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">완료 건수</span>
                  <span className="font-medium">342건</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">평점</span>
                  <span className="font-medium">⭐ 4.8 / 5.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">자격증</span>
                  <span className="font-medium">12개 보유</span>
                </div>
              </div>
              
              <Link 
                href="/profile"
                className="block mt-4 bg-white/20 backdrop-blur text-center py-2 rounded-lg hover:bg-white/30 transition-colors"
              >
                프로필 관리 →
              </Link>
            </div>

            {/* 광고 */}
            <SidebarAd />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(20deg); }
          75% { transform: rotate(-20deg); }
        }
        
        .animate-wave {
          animation: wave 1s ease-in-out infinite;
          display: inline-block;
        }
      `}</style>
    </div>
  );
}