'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface EmergencyRequest {
  id: string;
  type: '의료' | '재정' | '법률' | '주거' | '교통' | '기타';
  urgency: '긴급' | '높음' | '중간' | '낮음';
  title: string;
  description: string;
  status: '요청' | '처리중' | '지원완료' | '종료';
  requester: string;
  location: string;
  contactNumber: string;
  createdAt: string;
  resolvedAt?: string;
  assignedTo?: string;
  supportProvided?: string;
}

interface EmergencyContact {
  id: string;
  category: '의료' | '경찰' | '소방' | '노동부' | '법률' | '상담';
  name: string;
  number: string;
  available24h: boolean;
  description: string;
  region: string;
}

interface EmergencyFund {
  id: string;
  name: string;
  type: '대출' | '지원금' | '선불';
  amount: number;
  status: '신청가능' | '신청중' | '승인' | '지급완료' | '상환중';
  eligibility: string[];
  interestRate?: number;
  repaymentPeriod?: string;
  appliedAt?: string;
}

interface SupportResource {
  id: string;
  category: '의료' | '심리' | '재정' | '법률' | '교육';
  title: string;
  provider: string;
  description: string;
  eligibility: string;
  howToApply: string;
  contact: string;
  deadline?: string;
}

export default function EmergencyPage() {
  const [activeTab, setActiveTab] = useState<'sos' | 'contacts' | 'funds' | 'resources'>('sos');
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EmergencyRequest | null>(null);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);

  const [emergencyRequests] = useState<EmergencyRequest[]>([
    {
      id: '1',
      type: '의료',
      urgency: '긴급',
      title: '작업 중 부상 - 응급실 이송 필요',
      description: '건설 현장에서 낙상 사고로 다리 부상. 즉시 병원 이송이 필요합니다.',
      status: '처리중',
      requester: '김철수',
      location: '서울시 강남구 건설현장',
      contactNumber: '010-1234-5678',
      createdAt: '2024-01-30 14:30',
      assignedTo: '서울응급의료센터',
      supportProvided: '119 구급차 출동, 병원 이송 중'
    },
    {
      id: '2',
      type: '재정',
      urgency: '높음',
      title: '임금체불로 인한 생활비 부족',
      description: '2개월간 임금을 받지 못해 월세와 생활비가 부족합니다.',
      status: '요청',
      requester: '이영희',
      location: '경기도 수원시',
      contactNumber: '010-2345-6789',
      createdAt: '2024-01-30 10:15'
    },
    {
      id: '3',
      type: '주거',
      urgency: '중간',
      title: '숙소 화재로 임시 거처 필요',
      description: '기숙사 화재로 임시 거처가 필요합니다.',
      status: '지원완료',
      requester: '박민수',
      location: '인천시 부평구',
      contactNumber: '010-3456-7890',
      createdAt: '2024-01-29 18:00',
      resolvedAt: '2024-01-29 20:30',
      assignedTo: '인천시 긴급주거지원센터',
      supportProvided: '임시 숙소 3일 제공'
    }
  ]);

  const [emergencyContacts] = useState<EmergencyContact[]>([
    {
      id: '1',
      category: '의료',
      name: '응급의료정보센터',
      number: '119',
      available24h: true,
      description: '응급 상황 신고 및 의료 상담',
      region: '전국'
    },
    {
      id: '2',
      category: '경찰',
      name: '경찰 긴급신고',
      number: '112',
      available24h: true,
      description: '범죄 신고 및 긴급 구조',
      region: '전국'
    },
    {
      id: '3',
      category: '노동부',
      name: '고용노동부 신고센터',
      number: '1350',
      available24h: false,
      description: '임금체불, 부당해고 등 노동 관련 신고',
      region: '전국'
    },
    {
      id: '4',
      category: '법률',
      name: '대한법률구조공단',
      number: '132',
      available24h: false,
      description: '무료 법률 상담 및 소송 지원',
      region: '전국'
    },
    {
      id: '5',
      category: '상담',
      name: '근로자 심리상담센터',
      number: '1588-0075',
      available24h: false,
      description: '업무 스트레스, 정신건강 상담',
      region: '전국'
    },
    {
      id: '6',
      category: '의료',
      name: '산재병원 응급실',
      number: '02-2001-1234',
      available24h: true,
      description: '산업재해 전문 응급 치료',
      region: '서울'
    }
  ]);

  const [emergencyFunds] = useState<EmergencyFund[]>([
    {
      id: '1',
      name: '긴급생계비 지원',
      type: '지원금',
      amount: 1000000,
      status: '신청가능',
      eligibility: ['임금체불 피해자', '산재 피해자', '실직자'],
      appliedAt: undefined
    },
    {
      id: '2',
      name: '의료비 긴급대출',
      type: '대출',
      amount: 5000000,
      status: '신청중',
      eligibility: ['산재 미승인자', '긴급 의료 필요자'],
      interestRate: 1.5,
      repaymentPeriod: '12개월',
      appliedAt: '2024-01-28'
    },
    {
      id: '3',
      name: '생활안정자금',
      type: '대출',
      amount: 3000000,
      status: '신청가능',
      eligibility: ['3개월 이상 근무자', '신용등급 6등급 이내'],
      interestRate: 3.5,
      repaymentPeriod: '24개월'
    },
    {
      id: '4',
      name: '임금 선지급 제도',
      type: '선불',
      amount: 2000000,
      status: '승인',
      eligibility: ['정규 계약 근로자', '1개월 이상 근무'],
      appliedAt: '2024-01-20'
    }
  ]);

  const [supportResources] = useState<SupportResource[]>([
    {
      id: '1',
      category: '의료',
      title: '산재근로자 의료비 지원',
      provider: '근로복지공단',
      description: '산업재해로 인한 치료비 전액 지원',
      eligibility: '산재 승인 근로자',
      howToApply: '근로복지공단 방문 또는 온라인 신청',
      contact: '1588-0075'
    },
    {
      id: '2',
      category: '심리',
      title: '트라우마 심리치료 프로그램',
      provider: '한국심리상담센터',
      description: '산업재해, 직장 내 폭력 피해자 심리 치료',
      eligibility: '산재 또는 폭력 피해 근로자',
      howToApply: '전화 상담 후 예약',
      contact: '02-1234-5678'
    },
    {
      id: '3',
      category: '재정',
      title: '긴급복지 생계지원',
      provider: '보건복지부',
      description: '갑작스러운 위기상황으로 생계유지가 곤란한 가구 지원',
      eligibility: '중위소득 75% 이하',
      howToApply: '주민센터 방문 신청',
      contact: '129',
      deadline: '2024-12-31'
    },
    {
      id: '4',
      category: '법률',
      title: '무료 노동법률 상담',
      provider: '서울노동권익센터',
      description: '임금체불, 부당해고 등 노동분쟁 무료 상담',
      eligibility: '모든 근로자',
      howToApply: '온라인 예약 또는 방문',
      contact: '02-376-0001'
    }
  ]);

  useEffect(() => {
    const urgentRequests = emergencyRequests.filter(r => r.urgency === '긴급' && r.status === '요청');
    if (urgentRequests.length > 0) {
      setIsEmergencyMode(true);
    }
  }, [emergencyRequests]);

  const getUrgencyColor = (urgency: string) => {
    switch(urgency) {
      case '긴급':
        return 'bg-red-100 text-red-800 animate-pulse';
      case '높음':
        return 'bg-orange-100 text-orange-800';
      case '중간':
        return 'bg-yellow-100 text-yellow-800';
      case '낮음':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case '요청':
        return 'bg-red-100 text-red-800';
      case '처리중':
        return 'bg-blue-100 text-blue-800';
      case '지원완료':
        return 'bg-green-100 text-green-800';
      case '종료':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Emergency Alert Banner */}
        {isEmergencyMode && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚨</span>
                <div>
                  <h3 className="font-bold">긴급 지원 요청 있음</h3>
                  <p className="text-sm">즉시 확인이 필요한 긴급 요청이 있습니다</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('sos')}
                className="bg-white text-red-600 px-4 py-2 rounded-md font-medium hover:bg-red-50"
              >
                확인하기
              </button>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">긴급 지원 시스템</h1>
          <p className="text-gray-600">24시간 긴급 상황 대응 및 지원 서비스</p>
        </div>

        {/* Quick Emergency Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <button 
            onClick={() => {
              setShowSOSModal(true);
              setActiveTab('sos');
            }}
            className="bg-red-600 text-white p-6 rounded-lg shadow-lg hover:bg-red-700 transition-all transform hover:scale-105"
          >
            <div className="text-3xl mb-2">🆘</div>
            <div className="font-bold">긴급 SOS</div>
            <div className="text-xs mt-1">즉시 도움 요청</div>
          </button>
          
          <a 
            href="tel:119"
            className="bg-orange-600 text-white p-6 rounded-lg shadow-lg hover:bg-orange-700 transition-all transform hover:scale-105 text-center"
          >
            <div className="text-3xl mb-2">🚑</div>
            <div className="font-bold">119 응급</div>
            <div className="text-xs mt-1">의료 응급상황</div>
          </a>

          <a 
            href="tel:112"
            className="bg-blue-600 text-white p-6 rounded-lg shadow-lg hover:bg-blue-700 transition-all transform hover:scale-105 text-center"
          >
            <div className="text-3xl mb-2">🚔</div>
            <div className="font-bold">112 신고</div>
            <div className="text-xs mt-1">경찰 신고</div>
          </a>

          <a 
            href="tel:1350"
            className="bg-green-600 text-white p-6 rounded-lg shadow-lg hover:bg-green-700 transition-all transform hover:scale-105 text-center"
          >
            <div className="text-3xl mb-2">📞</div>
            <div className="font-bold">1350 노동</div>
            <div className="text-xs mt-1">노동부 신고</div>
          </a>
        </div>

        {/* Emergency Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500">활성 요청</span>
              <span className="text-2xl">🔴</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {emergencyRequests.filter(r => r.status === '요청' || r.status === '처리중').length}
            </div>
            <div className="text-sm text-gray-500 mt-1">처리 중</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500">긴급 건수</span>
              <span className="text-2xl">🚨</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {emergencyRequests.filter(r => r.urgency === '긴급').length}
            </div>
            <div className="text-sm text-gray-500 mt-1">긴급 대응 필요</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500">지원 완료</span>
              <span className="text-2xl">✅</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {emergencyRequests.filter(r => r.status === '지원완료').length}
            </div>
            <div className="text-sm text-gray-500 mt-1">오늘 해결</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500">평균 응답</span>
              <span className="text-2xl">⏱️</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">12분</div>
            <div className="text-sm text-gray-500 mt-1">응답 시간</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              {[
                { id: 'sos', label: 'SOS 요청', icon: '🆘' },
                { id: 'contacts', label: '긴급 연락처', icon: '📞' },
                { id: 'funds', label: '긴급 자금', icon: '💰' },
                { id: 'resources', label: '지원 자원', icon: '🏥' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'sos' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">긴급 지원 요청</h2>
                <button
                  onClick={() => setShowSOSModal(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-medium"
                >
                  긴급 도움 요청
                </button>
              </div>

              <div className="space-y-4">
                {emergencyRequests.map((request) => (
                  <div key={request.id} className={`border rounded-lg p-4 ${
                    request.urgency === '긴급' ? 'border-red-300 bg-red-50' : 'hover:bg-gray-50'
                  }`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
                            {request.urgency}
                          </span>
                          <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                            {request.type}
                          </span>
                        </div>
                        <h3 className="font-semibold text-lg">{request.title}</h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-3">{request.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                      <div>
                        <span className="text-gray-500">요청자</span>
                        <p className="font-medium">{request.requester}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">위치</span>
                        <p className="font-medium">{request.location}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">연락처</span>
                        <p className="font-medium">{request.contactNumber}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">요청 시간</span>
                        <p className="font-medium">{request.createdAt}</p>
                      </div>
                    </div>

                    {request.supportProvided && (
                      <div className="bg-blue-50 p-3 rounded-md">
                        <span className="text-sm font-medium text-blue-800">지원 내용: </span>
                        <span className="text-sm text-blue-600">{request.supportProvided}</span>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 mt-3">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        상세보기
                      </button>
                      {request.status === '요청' && (
                        <button className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">
                          즉시 대응
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'contacts' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">긴급 연락처</h2>
                <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-yellow-800">
                    💡 긴급 상황 시 해당 번호로 즉시 연락하세요. 생명이 위급한 경우 119를 먼저 연락하세요.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {emergencyContacts.map((contact) => (
                  <div key={contact.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                          {contact.category}
                        </span>
                        <h3 className="font-semibold text-lg mt-2">{contact.name}</h3>
                      </div>
                      {contact.available24h && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                          24시간
                        </span>
                      )}
                    </div>

                    <a 
                      href={`tel:${contact.number}`}
                      className="text-2xl font-bold text-blue-600 hover:text-blue-700 block mb-2"
                    >
                      📞 {contact.number}
                    </a>

                    <p className="text-sm text-gray-600 mb-2">{contact.description}</p>
                    <p className="text-xs text-gray-500">지역: {contact.region}</p>

                    <button className="mt-3 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors">
                      전화 걸기
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'funds' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">긴급 자금 지원</h2>
                <button
                  onClick={() => setShowFundModal(true)}
                  className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
                >
                  자금 신청하기
                </button>
              </div>

              <div className="space-y-4">
                {emergencyFunds.map((fund) => (
                  <div key={fund.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{fund.name}</h3>
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                          {fund.type}
                        </span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        fund.status === '신청가능' ? 'bg-green-100 text-green-800' :
                        fund.status === '신청중' ? 'bg-yellow-100 text-yellow-800' :
                        fund.status === '승인' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {fund.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3 text-sm">
                      <div>
                        <span className="text-gray-500">지원 금액</span>
                        <p className="font-bold text-lg text-orange-600">
                          {fund.amount.toLocaleString()}원
                        </p>
                      </div>
                      {fund.interestRate && (
                        <div>
                          <span className="text-gray-500">이자율</span>
                          <p className="font-medium">연 {fund.interestRate}%</p>
                        </div>
                      )}
                      {fund.repaymentPeriod && (
                        <div>
                          <span className="text-gray-500">상환 기간</span>
                          <p className="font-medium">{fund.repaymentPeriod}</p>
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <span className="text-gray-500 text-sm">지원 자격</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {fund.eligibility.map((item, idx) => (
                          <span key={idx} className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    {fund.appliedAt && (
                      <p className="text-sm text-gray-500">신청일: {fund.appliedAt}</p>
                    )}

                    <div className="flex justify-end gap-2 mt-3">
                      {fund.status === '신청가능' && (
                        <button className="bg-orange-600 text-white px-4 py-1 rounded text-sm hover:bg-orange-700">
                          신청하기
                        </button>
                      )}
                      <button className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                        상세정보 →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">지원 프로그램</h2>
                <div className="flex gap-2 mb-4">
                  {['전체', '의료', '심리', '재정', '법률', '교육'].map((category) => (
                    <button
                      key={category}
                      className="px-3 py-1 rounded-full text-sm border border-gray-300 hover:bg-gray-50"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {supportResources.map((resource) => (
                  <div key={resource.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium mb-2 inline-block">
                          {resource.category}
                        </span>
                        <h3 className="font-semibold text-lg">{resource.title}</h3>
                        <p className="text-sm text-gray-600">{resource.provider}</p>
                      </div>
                      {resource.deadline && (
                        <span className="text-xs text-red-600">
                          마감: {resource.deadline}
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 mb-3">{resource.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">지원 대상</span>
                        <p className="font-medium">{resource.eligibility}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">신청 방법</span>
                        <p className="font-medium">{resource.howToApply}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">문의</span>
                        <p className="font-medium">{resource.contact}</p>
                      </div>
                    </div>

                    <div className="flex justify-end mt-3">
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        자세히 보기 →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SOS Modal */}
        {showSOSModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4 text-red-600">🆘 긴급 도움 요청</h3>
              <div className="space-y-4">
                <select className="w-full px-3 py-2 border rounded-md">
                  <option>긴급 유형 선택</option>
                  <option>의료 응급</option>
                  <option>재정 위기</option>
                  <option>법률 긴급</option>
                  <option>주거 위기</option>
                  <option>교통 사고</option>
                  <option>기타 긴급</option>
                </select>
                <select className="w-full px-3 py-2 border rounded-md">
                  <option>긴급도 선택</option>
                  <option>긴급 - 즉시 대응 필요</option>
                  <option>높음 - 오늘 내 대응 필요</option>
                  <option>중간 - 2-3일 내 대응</option>
                  <option>낮음 - 일주일 내 대응</option>
                </select>
                <input
                  type="text"
                  placeholder="현재 위치"
                  className="w-full px-3 py-2 border rounded-md"
                />
                <input
                  type="tel"
                  placeholder="연락 가능한 전화번호"
                  className="w-full px-3 py-2 border rounded-md"
                />
                <textarea
                  placeholder="상황 설명 (자세히 작성해주세요)"
                  className="w-full px-3 py-2 border rounded-md h-32"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowSOSModal(false)}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => setShowSOSModal(false)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
                  >
                    긴급 요청 보내기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fund Application Modal */}
        {showFundModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">긴급 자금 신청</h3>
              <div className="space-y-4">
                <select className="w-full px-3 py-2 border rounded-md">
                  <option>자금 유형 선택</option>
                  <option>긴급생계비 지원</option>
                  <option>의료비 긴급대출</option>
                  <option>생활안정자금</option>
                  <option>임금 선지급</option>
                </select>
                <input
                  type="number"
                  placeholder="필요 금액 (원)"
                  className="w-full px-3 py-2 border rounded-md"
                />
                <textarea
                  placeholder="신청 사유"
                  className="w-full px-3 py-2 border rounded-md h-24"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowFundModal(false)}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => setShowFundModal(false)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                  >
                    신청하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}