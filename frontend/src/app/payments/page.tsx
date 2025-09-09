'use client'

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';

interface Payment {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  workDate: string;
  hours: number;
  hourlyRate: number;
  totalAmount: number;
  status: 'pending' | 'approved' | 'paid' | 'disputed';
  approvedAt?: string;
  paidAt?: string;
  paymentMethod: 'bank_transfer' | 'mobile_pay' | 'cash';
  taxDeduction: number;
  netAmount: number;
  disputeReason?: string;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isDefault: boolean;
}

const SAMPLE_PAYMENTS: Payment[] = [
  {
    id: 'pay1',
    jobId: '1',
    jobTitle: '아파트 리모델링 마감재 시공',
    company: '(주)프리미엄홈',
    workDate: '2024-12-29',
    hours: 8,
    hourlyRate: 25000,
    totalAmount: 200000,
    status: 'paid',
    approvedAt: '2024-12-29T18:00:00Z',
    paidAt: '2024-12-29T18:30:00Z',
    paymentMethod: 'bank_transfer',
    taxDeduction: 10000,
    netAmount: 190000
  },
  {
    id: 'pay2',
    jobId: '2',
    jobTitle: '상가 인테리어 철거 작업',
    company: '대한건설',
    workDate: '2024-12-28',
    hours: 9,
    hourlyRate: 20000,
    totalAmount: 180000,
    status: 'approved',
    approvedAt: '2024-12-28T17:00:00Z',
    paymentMethod: 'bank_transfer',
    taxDeduction: 9000,
    netAmount: 171000
  },
  {
    id: 'pay3',
    jobId: '3',
    jobTitle: '펜션 외벽 도색 작업',
    company: '코리아페인트',
    workDate: '2024-12-27',
    hours: 7,
    hourlyRate: 22000,
    totalAmount: 154000,
    status: 'pending',
    paymentMethod: 'bank_transfer',
    taxDeduction: 7700,
    netAmount: 146300
  },
  {
    id: 'pay4',
    jobId: '4',
    jobTitle: '오피스텔 전기배선 보조',
    company: '서울전기',
    workDate: '2024-12-26',
    hours: 8,
    hourlyRate: 21250,
    totalAmount: 170000,
    status: 'disputed',
    paymentMethod: 'bank_transfer',
    taxDeduction: 8500,
    netAmount: 161500,
    disputeReason: '실제 근무 시간과 다름'
  },
  {
    id: 'pay5',
    jobId: '5',
    jobTitle: '카페 인테리어 설치',
    company: '인테리어플러스',
    workDate: '2024-12-25',
    hours: 6,
    hourlyRate: 23000,
    totalAmount: 138000,
    status: 'paid',
    approvedAt: '2024-12-25T16:00:00Z',
    paidAt: '2024-12-26T09:00:00Z',
    paymentMethod: 'mobile_pay',
    taxDeduction: 6900,
    netAmount: 131100
  }
];

const SAMPLE_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'bank1',
    bankName: '국민은행',
    accountNumber: '123456-01-123456',
    accountHolder: '이철수',
    isDefault: true
  },
  {
    id: 'bank2',
    bankName: '신한은행',
    accountNumber: '110-123-123456',
    accountHolder: '이철수',
    isDefault: false
  }
];

export default function PaymentsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [payments, setPayments] = useState<Payment[]>(SAMPLE_PAYMENTS);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(SAMPLE_BANK_ACCOUNTS);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'paid' | 'disputed'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const filteredPayments = payments.filter(payment => 
    filter === 'all' ? true : payment.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-700 bg-yellow-100';
      case 'approved': return 'text-blue-700 bg-blue-100';
      case 'paid': return 'text-green-700 bg-green-100';
      case 'disputed': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '승인 대기';
      case 'approved': return '승인 완료';
      case 'paid': return '정산 완료';
      case 'disputed': return '이의 제기';
      default: return '알 수 없음';
    }
  };

  const calculateStats = () => {
    const stats = {
      totalEarnings: 0,
      pendingAmount: 0,
      paidAmount: 0,
      disputedAmount: 0,
      completedJobs: 0
    };

    filteredPayments.forEach(payment => {
      stats.totalEarnings += payment.netAmount;
      
      switch (payment.status) {
        case 'pending':
          stats.pendingAmount += payment.netAmount;
          break;
        case 'paid':
          stats.paidAmount += payment.netAmount;
          stats.completedJobs += 1;
          break;
        case 'disputed':
          stats.disputedAmount += payment.netAmount;
          break;
      }
    });

    return stats;
  };

  const stats = calculateStats();

  const requestPayment = (paymentId: string) => {
    setPayments(prev => prev.map(p => 
      p.id === paymentId 
        ? { ...p, status: 'approved', approvedAt: new Date().toISOString() }
        : p
    ));
  };

  const disputePayment = (paymentId: string, reason: string) => {
    setPayments(prev => prev.map(p => 
      p.id === paymentId 
        ? { ...p, status: 'disputed', disputeReason: reason }
        : p
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">급여 관리</h1>
          <p className="text-gray-600">일자리 완료 후 급여 승인 및 정산을 관리합니다</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 수익</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(stats.totalEarnings / 10000).toFixed(0)}만원
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                💰
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">승인 대기</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {(stats.pendingAmount / 10000).toFixed(0)}만원
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                ⏳
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">정산 완료</p>
                <p className="text-2xl font-bold text-green-600">
                  {(stats.paidAmount / 10000).toFixed(0)}만원
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                ✅
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">완료된 일자리</p>
                <p className="text-2xl font-bold text-blue-600">{stats.completedJobs}개</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                📊
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 급여 내역 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <h2 className="text-xl font-semibold text-gray-900">급여 내역</h2>
                  
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { key: 'all', label: '전체' },
                      { key: 'pending', label: '승인대기' },
                      { key: 'approved', label: '승인완료' },
                      { key: 'paid', label: '정산완료' },
                      { key: 'disputed', label: '이의제기' }
                    ].map(option => (
                      <button
                        key={option.key}
                        onClick={() => setFilter(option.key as any)}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          filter === option.key
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <div key={payment.id} className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{payment.jobTitle}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(payment.status)}`}>
                            {getStatusText(payment.status)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>🏢 {payment.company}</div>
                          <div>📅 {payment.workDate} • {payment.hours}시간</div>
                          <div>💳 시급 {(payment.hourlyRate / 10000).toFixed(1)}만원</div>
                        </div>
                        
                        {payment.disputeReason && (
                          <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                            이의 사유: {payment.disputeReason}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {(payment.netAmount / 10000).toFixed(0)}만원
                        </div>
                        <div className="text-sm text-gray-500">
                          (세전 {(payment.totalAmount / 10000).toFixed(0)}만원)
                        </div>
                        
                        <div className="mt-3 flex gap-2">
                          {payment.status === 'pending' && (
                            <button
                              onClick={() => requestPayment(payment.id)}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                            >
                              승인 요청
                            </button>
                          )}
                          {payment.status === 'approved' && (
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs">
                              정산 예정
                            </span>
                          )}
                          {payment.status === 'paid' && (
                            <span className="text-xs text-gray-500">
                              {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('ko-KR') : ''}
                            </span>
                          )}
                          <button
                            onClick={() => setSelectedPayment(payment)}
                            className="text-gray-500 hover:text-gray-700 text-xs"
                          >
                            상세보기
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredPayments.length === 0 && (
                  <div className="p-12 text-center">
                    <div className="text-4xl mb-4">💸</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">급여 내역이 없습니다</h3>
                    <p className="text-gray-600">일자리를 완료하면 급여 내역이 표시됩니다</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 계좌 정보 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">계좌 정보</h3>
                <button
                  onClick={() => setIsAddingAccount(!isAddingAccount)}
                  className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                >
                  + 추가
                </button>
              </div>
              
              <div className="space-y-3">
                {bankAccounts.map((account) => (
                  <div key={account.id} className={`p-3 rounded-lg border ${
                    account.isDefault ? 'border-orange-200 bg-orange-50' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{account.bankName}</div>
                        <div className="text-sm text-gray-600">{account.accountNumber}</div>
                        <div className="text-xs text-gray-500">{account.accountHolder}</div>
                      </div>
                      {account.isDefault && (
                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs">
                          기본계좌
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {isAddingAccount && (
                <div className="mt-4 p-4 border border-gray-200 rounded-lg">
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="은행명"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <input
                      type="text"
                      placeholder="계좌번호"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <input
                      type="text"
                      placeholder="예금주"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <div className="flex gap-2">
                      <button className="flex-1 bg-orange-600 text-white py-2 rounded hover:bg-orange-700">
                        저장
                      </button>
                      <button 
                        onClick={() => setIsAddingAccount(false)}
                        className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 정산 일정 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">정산 일정</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded">
                  <div>
                    <div className="font-medium text-blue-900">다음 정산</div>
                    <div className="text-sm text-blue-700">2025년 1월 1일</div>
                  </div>
                  <div className="text-blue-600">📅</div>
                </div>
                <div className="text-sm text-gray-600">
                  • 매월 1일, 15일 정산<br/>
                  • 승인 완료 후 1-2일 내 입금<br/>
                  • 공휴일의 경우 다음 영업일
                </div>
              </div>
            </div>

            {/* 세금 정보 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">세금 정보</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>소득세 (3.3%)</span>
                  <span className="font-medium">자동 계산</span>
                </div>
                <div className="flex justify-between">
                  <span>지방소득세</span>
                  <span className="font-medium">포함</span>
                </div>
                <hr className="my-2"/>
                <div className="text-xs text-gray-500">
                  연말정산 시 원천징수영수증 제공
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 결제 상세 모달 */}
        {selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">급여 상세</h3>
                  <button
                    onClick={() => setSelectedPayment(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">{selectedPayment.jobTitle}</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>🏢 {selectedPayment.company}</div>
                      <div>📅 {selectedPayment.workDate}</div>
                      <div>⏰ {selectedPayment.hours}시간</div>
                      <div>💳 시급 {selectedPayment.hourlyRate.toLocaleString()}원</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span>총 급여</span>
                      <span>{selectedPayment.totalAmount.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>세금 (3.3%)</span>
                      <span>-{selectedPayment.taxDeduction.toLocaleString()}원</span>
                    </div>
                    <hr/>
                    <div className="flex justify-between font-bold">
                      <span>실수령액</span>
                      <span>{selectedPayment.netAmount.toLocaleString()}원</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    {selectedPayment.status === 'paid' && (
                      <button className="flex-1 bg-gray-100 text-gray-600 py-2 rounded">
                        정산 완료
                      </button>
                    )}
                    {selectedPayment.status !== 'disputed' && selectedPayment.status !== 'paid' && (
                      <button
                        onClick={() => {
                          const reason = prompt('이의 사유를 입력해주세요:');
                          if (reason) {
                            disputePayment(selectedPayment.id, reason);
                            setSelectedPayment(null);
                          }
                        }}
                        className="flex-1 bg-red-100 text-red-700 py-2 rounded hover:bg-red-200"
                      >
                        이의 제기
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}