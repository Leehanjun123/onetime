'use client'

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';

// 정산 상태 타입
type SettlementStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

// 정산 정보 타입
interface DailySettlement {
  id: string;
  workDate: string;
  jobTitle: string;
  company: string;
  workHours: number;
  hourlyWage: number;
  totalAmount: number;
  status: SettlementStatus;
  completedAt?: string;
  paidAt?: string;
}

// 샘플 데이터
const sampleSettlements: DailySettlement[] = [
  {
    id: '1',
    workDate: '2025-08-30',
    jobTitle: '아파트 전기 배선 작업',
    company: '한빛전기',
    workHours: 8,
    hourlyWage: 22500,
    totalAmount: 180000,
    status: 'COMPLETED',
    completedAt: '2025-08-30T18:00:00Z',
    paidAt: '2025-08-30T18:30:00Z'
  },
  {
    id: '2',
    workDate: '2025-08-29',
    jobTitle: '원룸 도배 작업',
    company: '청솔도배',
    workHours: 9,
    hourlyWage: 16667,
    totalAmount: 150000,
    status: 'COMPLETED',
    completedAt: '2025-08-29T18:00:00Z',
    paidAt: '2025-08-29T18:15:00Z'
  },
  {
    id: '3',
    workDate: '2025-08-28',
    jobTitle: '상가 철거 작업',
    company: '대한철거',
    workHours: 10,
    hourlyWage: 20000,
    totalAmount: 200000,
    status: 'PROCESSING',
    completedAt: '2025-08-28T17:00:00Z'
  }
];

export default function DailyPaymentPage() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [settlements, setSettlements] = useState<DailySettlement[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // 'today', 'week', 'month'
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettlements();
    }
  }, [selectedPeriod, isAuthenticated]);

  const fetchSettlements = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:4000/api/v1/settlements', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const apiSettlements = data.data.settlements.map((s: any) => ({
            id: s.id,
            workDate: new Date(s.createdAt).toISOString().split('T')[0],
            jobTitle: s.jobPosting?.title || '일용직 작업',
            company: s.jobPosting?.description || '정산 요청',
            workHours: 8, // 기본값
            hourlyWage: Math.round(s.amount / 8),
            totalAmount: s.amount,
            status: s.status,
            completedAt: s.createdAt,
            paidAt: s.processedAt
          }));
          
          // 샘플 데이터와 API 데이터를 합쳐서 표시
          const combinedSettlements = [...sampleSettlements, ...apiSettlements];
          setSettlements(combinedSettlements);
          calculateTotalEarnings(combinedSettlements);
        }
      }
    } catch (error) {
      console.error('정산 내역 조회 실패:', error);
      // API 실패 시 샘플 데이터만 표시
      setSettlements(sampleSettlements);
      calculateTotalEarnings(sampleSettlements);
    }
  };

  const calculateTotalEarnings = (settlements: DailySettlement[]) => {
    const total = settlements
      .filter(s => s.status === 'COMPLETED')
      .reduce((sum, s) => sum + s.totalAmount, 0);
    setTotalEarnings(total);
  };

  const getStatusBadge = (status: SettlementStatus) => {
    const statusConfig = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '대기중' },
      PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-800', label: '정산중' },
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', label: '완료' },
      FAILED: { bg: 'bg-red-100', text: 'text-red-800', label: '실패' }
    };
    
    const config = statusConfig[status];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + '원';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h2>
          <p className="text-gray-600 mb-6">당일 정산 내역을 확인하려면 로그인해주세요.</p>
          <a 
            href="/login"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
          >
            로그인하기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">💰 당일 정산</h1>
            <div className="text-right">
              <p className="text-sm text-gray-600">총 수익</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalEarnings)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 기간 선택 */}
        <div className="mb-8">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-lg font-bold mb-4">정산 기간</h2>
            <div className="flex space-x-4">
              {[
                { key: 'today', label: '오늘' },
                { key: 'week', label: '이번 주' },
                { key: 'month', label: '이번 달' }
              ].map((period) => (
                <button
                  key={period.key}
                  onClick={() => setSelectedPeriod(period.key)}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    selectedPeriod === period.key
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 정산 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md text-center">
            <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-2">
              {settlements.filter(s => s.status === 'COMPLETED').length}건
            </div>
            <div className="text-xs sm:text-sm text-gray-600">완료된 작업</div>
          </div>
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-600 mb-2">
              {formatCurrency(totalEarnings)}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">총 수익</div>
          </div>
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md text-center">
            <div className="text-xl sm:text-2xl font-bold text-orange-600 mb-2">
              {settlements.filter(s => s.status === 'PROCESSING').length}건
            </div>
            <div className="text-xs sm:text-sm text-gray-600">정산 대기</div>
          </div>
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-600 mb-2">
              {settlements.reduce((sum, s) => sum + s.workHours, 0)}시간
            </div>
            <div className="text-xs sm:text-sm text-gray-600">총 근무시간</div>
          </div>
        </div>

        {/* 정산 내역 */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">정산 내역</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {settlements.map((settlement) => (
              <div key={settlement.id} className="p-4 sm:p-6 hover:bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2">
                        {settlement.jobTitle}
                      </h3>
                      {getStatusBadge(settlement.status)}
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      {settlement.company}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <span>📅 {formatDate(settlement.workDate)}</span>
                      <span>⏰ {settlement.workHours}시간</span>
                      <span>💵 시급 {formatCurrency(settlement.hourlyWage)}</span>
                    </div>
                    
                    {settlement.paidAt && (
                      <div className="text-xs sm:text-sm text-green-600 mt-1">
                        ✅ {new Date(settlement.paidAt).toLocaleString('ko-KR')} 정산 완료
                      </div>
                    )}
                  </div>
                  
                  <div className="text-left sm:text-right">
                    <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                      {formatCurrency(settlement.totalAmount)}
                    </div>
                    <div className="text-sm text-gray-500">일당</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {settlements.length === 0 && (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                정산 내역이 없습니다
              </h3>
              <p className="text-gray-600 mb-6">
                일용직 작업을 완료하면 당일 정산 내역을 확인할 수 있습니다
              </p>
              <a
                href="/jobs/daily"
                className="inline-block bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700"
              >
                일자리 찾기
              </a>
            </div>
          )}
        </div>

        {/* 정산 안내 */}
        <div className="mt-8 bg-orange-50 border border-orange-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-orange-900 mb-3">⚡ 당일 정산 안내</h3>
          <div className="space-y-2 text-sm text-orange-800">
            <p>• 작업 완료 확인 후 <strong>30분 이내</strong>에 자동 정산됩니다</p>
            <p>• 정산은 <strong>현금, 계좌이체, 앱 내 포인트</strong>로 가능합니다</p>
            <p>• 고용주와 근로자 양측 확인 후 정산이 진행됩니다</p>
            <p>• 정산 관련 문의는 고객센터(1588-0000)로 연락주세요</p>
          </div>
        </div>
      </div>
    </div>
  );
}