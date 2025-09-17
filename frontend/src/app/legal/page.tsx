'use client'

import { useState } from 'react';
import Link from 'next/link';

interface Contract {
  id: string;
  title: string;
  employer: string;
  startDate: string;
  endDate: string;
  wage: number;
  status: '검토중' | '승인' | '수정요청' | '완료';
  type: '일용직' | '단기' | '프로젝트';
  documents: string[];
  terms: string[];
  createdAt: string;
}

interface LegalCase {
  id: string;
  type: '임금체불' | '부당해고' | '산재' | '계약위반' | '기타';
  title: string;
  status: '접수' | '진행중' | '해결' | '종료';
  priority: '높음' | '중간' | '낮음';
  description: string;
  attachments: string[];
  lawyer?: string;
  createdAt: string;
  updatedAt: string;
}

interface LegalResource {
  id: string;
  category: '노동법' | '계약서작성' | '권리보호' | '분쟁해결';
  title: string;
  content: string;
  views: number;
  helpful: number;
  tags: string[];
}

interface LawyerConsultation {
  id: string;
  lawyer: string;
  specialty: string;
  date: string;
  time: string;
  type: '온라인' | '전화' | '대면';
  status: '예약' | '완료' | '취소';
  topic: string;
  notes: string;
}

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState<'contracts' | 'cases' | 'resources' | 'consultations'>('contracts');
  const [showContractModal, setShowContractModal] = useState(false);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);

  const [contracts] = useState<Contract[]>([
    {
      id: '1',
      title: '건설 현장 일용직 계약',
      employer: '대한건설(주)',
      startDate: '2024-01-15',
      endDate: '2024-01-20',
      wage: 150000,
      status: '승인',
      type: '일용직',
      documents: ['근로계약서', '신분증사본', '통장사본'],
      terms: ['일 8시간 근무', '초과근무 시 1.5배 수당', '중식 제공'],
      createdAt: '2024-01-10'
    },
    {
      id: '2',
      title: '물류센터 단기 알바',
      employer: '한국물류센터',
      startDate: '2024-01-25',
      endDate: '2024-02-25',
      wage: 11000,
      status: '검토중',
      type: '단기',
      documents: ['근로계약서', '4대보험가입확인서'],
      terms: ['시급 11,000원', '주5일 근무', '야간수당 별도'],
      createdAt: '2024-01-20'
    },
    {
      id: '3',
      title: '이사 도우미 프로젝트',
      employer: '김철수 개인',
      startDate: '2024-01-30',
      endDate: '2024-01-30',
      wage: 200000,
      status: '수정요청',
      type: '프로젝트',
      documents: ['간이계약서'],
      terms: ['1일 작업', '2인 1조', '차량 지원'],
      createdAt: '2024-01-25'
    }
  ]);

  const [legalCases] = useState<LegalCase[]>([
    {
      id: '1',
      type: '임금체불',
      title: '12월 급여 미지급 건',
      status: '진행중',
      priority: '높음',
      description: '12월 한 달간 근무한 급여 350만원이 아직 지급되지 않았습니다.',
      attachments: ['근로계약서.pdf', '출퇴근기록.xlsx'],
      lawyer: '김법률 변호사',
      createdAt: '2024-01-05',
      updatedAt: '2024-01-20'
    },
    {
      id: '2',
      type: '산재',
      title: '작업 중 부상 보상 요청',
      status: '접수',
      priority: '높음',
      description: '건설 현장에서 작업 중 낙하물에 의한 부상을 입었습니다.',
      attachments: ['진단서.pdf', '사고경위서.docx'],
      createdAt: '2024-01-18',
      updatedAt: '2024-01-18'
    },
    {
      id: '3',
      type: '계약위반',
      title: '근로조건 불이행',
      status: '해결',
      priority: '중간',
      description: '계약서상 명시된 휴게시간이 제공되지 않았습니다.',
      attachments: ['계약서.pdf'],
      lawyer: '박정의 변호사',
      createdAt: '2023-12-15',
      updatedAt: '2024-01-10'
    }
  ]);

  const [resources] = useState<LegalResource[]>([
    {
      id: '1',
      category: '노동법',
      title: '일용직 근로자의 권리와 의무',
      content: '일용직 근로자도 근로기준법의 보호를 받으며, 최저임금, 주휴수당, 퇴직금 등의 권리가 있습니다.',
      views: 1542,
      helpful: 423,
      tags: ['일용직', '권리', '근로기준법']
    },
    {
      id: '2',
      category: '계약서작성',
      title: '표준 근로계약서 작성 가이드',
      content: '근로계약서에는 임금, 근로시간, 휴일, 근무장소 등이 명확히 기재되어야 합니다.',
      views: 892,
      helpful: 267,
      tags: ['계약서', '작성법', '필수항목']
    },
    {
      id: '3',
      category: '권리보호',
      title: '임금체불 시 대응 방법',
      content: '임금체불 발생 시 고용노동부 신고, 진정, 민사소송 등의 방법으로 권리를 보호할 수 있습니다.',
      views: 2103,
      helpful: 651,
      tags: ['임금체불', '신고', '대응방법']
    },
    {
      id: '4',
      category: '분쟁해결',
      title: '노동위원회 구제신청 절차',
      content: '부당해고나 부당노동행위를 당한 경우 노동위원회에 구제신청을 할 수 있습니다.',
      views: 756,
      helpful: 189,
      tags: ['노동위원회', '구제신청', '절차']
    }
  ]);

  const [consultations] = useState<LawyerConsultation[]>([
    {
      id: '1',
      lawyer: '김법률 변호사',
      specialty: '노동법 전문',
      date: '2024-01-25',
      time: '14:00',
      type: '온라인',
      status: '예약',
      topic: '임금체불 관련 상담',
      notes: '12월 급여 미지급 건에 대한 법적 조치 상담'
    },
    {
      id: '2',
      lawyer: '이정의 변호사',
      specialty: '산재/보상 전문',
      date: '2024-01-20',
      time: '10:00',
      type: '전화',
      status: '완료',
      topic: '산재 보상 절차 문의',
      notes: '산재 신청 서류 준비 완료, 후속 조치 안내받음'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case '승인':
      case '완료':
      case '해결':
        return 'bg-green-100 text-green-800';
      case '검토중':
      case '진행중':
      case '예약':
        return 'bg-blue-100 text-blue-800';
      case '수정요청':
      case '접수':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case '높음':
        return 'text-red-600';
      case '중간':
        return 'text-yellow-600';
      case '낮음':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">법률 & 계약 지원</h1>
          <p className="text-gray-600">근로계약 검토, 법률 상담, 권리 보호를 위한 전문 지원 서비스</p>
        </div>

        {/* Legal Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500">활성 계약</span>
              <span className="text-2xl">📄</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{contracts.filter(c => c.status !== '완료').length}</div>
            <div className="text-sm text-gray-500 mt-1">검토 및 진행중</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500">진행중 사건</span>
              <span className="text-2xl">⚖️</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{legalCases.filter(c => c.status === '진행중' || c.status === '접수').length}</div>
            <div className="text-sm text-gray-500 mt-1">법적 지원 진행</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500">예약 상담</span>
              <span className="text-2xl">👨‍⚖️</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{consultations.filter(c => c.status === '예약').length}</div>
            <div className="text-sm text-gray-500 mt-1">변호사 상담 예정</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500">해결 사건</span>
              <span className="text-2xl">✅</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{legalCases.filter(c => c.status === '해결').length}</div>
            <div className="text-sm text-gray-500 mt-1">성공적 해결</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              {[
                { id: 'contracts', label: '계약 관리', icon: '📋' },
                { id: 'cases', label: '법적 사건', icon: '⚖️' },
                { id: 'resources', label: '법률 자료', icon: '📚' },
                { id: 'consultations', label: '변호사 상담', icon: '👨‍⚖️' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
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
          {activeTab === 'contracts' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">계약서 관리</h2>
                <button
                  onClick={() => setShowContractModal(true)}
                  className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
                >
                  새 계약서 검토 요청
                </button>
              </div>

              <div className="space-y-4">
                {contracts.map((contract) => (
                  <div key={contract.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{contract.title}</h3>
                        <p className="text-gray-600">{contract.employer}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                        {contract.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                      <div>
                        <span className="text-gray-500">계약 기간</span>
                        <p className="font-medium">{contract.startDate} ~ {contract.endDate}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">임금</span>
                        <p className="font-medium">{contract.wage.toLocaleString()}원</p>
                      </div>
                      <div>
                        <span className="text-gray-500">계약 유형</span>
                        <p className="font-medium">{contract.type}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">작성일</span>
                        <p className="font-medium">{contract.createdAt}</p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <span className="text-gray-500 text-sm">주요 조건</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {contract.terms.map((term, idx) => (
                          <span key={idx} className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {term}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        {contract.documents.map((doc, idx) => (
                          <span key={idx} className="text-xs text-gray-500">
                            📎 {doc}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => setSelectedContract(contract)}
                        className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                      >
                        상세보기 →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'cases' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">법적 사건 관리</h2>
                <button
                  onClick={() => setShowCaseModal(true)}
                  className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
                >
                  새 사건 신고
                </button>
              </div>

              <div className="space-y-4">
                {legalCases.map((legalCase) => (
                  <div key={legalCase.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                            {legalCase.type}
                          </span>
                          <span className={`font-medium text-sm ${getPriorityColor(legalCase.priority)}`}>
                            우선순위: {legalCase.priority}
                          </span>
                        </div>
                        <h3 className="font-semibold text-lg">{legalCase.title}</h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(legalCase.status)}`}>
                        {legalCase.status}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-3">{legalCase.description}</p>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {legalCase.lawyer && (
                          <span>담당: {legalCase.lawyer}</span>
                        )}
                        <span>접수: {legalCase.createdAt}</span>
                        <span>최종 업데이트: {legalCase.updatedAt}</span>
                      </div>
                      <button
                        onClick={() => setSelectedCase(legalCase)}
                        className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                      >
                        상세보기 →
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
                <h2 className="text-xl font-semibold mb-4">법률 자료실</h2>
                <div className="flex gap-2 mb-4">
                  {['전체', '노동법', '계약서작성', '권리보호', '분쟁해결'].map((category) => (
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
                {resources.map((resource) => (
                  <div key={resource.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium mb-2 inline-block">
                          {resource.category}
                        </span>
                        <h3 className="font-semibold text-lg">{resource.title}</h3>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>조회 {resource.views}</div>
                        <div>도움 {resource.helpful}</div>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-3">{resource.content}</p>

                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        {resource.tags.map((tag, idx) => (
                          <span key={idx} className="text-xs text-gray-500">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <button className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                        자세히 읽기 →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'consultations' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">변호사 상담</h2>
                <button
                  onClick={() => setShowConsultationModal(true)}
                  className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
                >
                  상담 예약하기
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {consultations.map((consultation) => (
                  <div key={consultation.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">{consultation.lawyer}</h3>
                        <p className="text-sm text-gray-600">{consultation.specialty}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(consultation.status)}`}>
                        {consultation.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">일시</span>
                        <span className="font-medium">{consultation.date} {consultation.time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">상담 방식</span>
                        <span className="font-medium">{consultation.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">상담 주제</span>
                        <span className="font-medium">{consultation.topic}</span>
                      </div>
                    </div>

                    {consultation.notes && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-gray-600">{consultation.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Available Lawyers */}
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">상담 가능 변호사</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { name: '김법률', specialty: '노동법', rating: 4.8, consultations: 156 },
                    { name: '이정의', specialty: '산재/보상', rating: 4.9, consultations: 203 },
                    { name: '박권리', specialty: '계약분쟁', rating: 4.7, consultations: 98 }
                  ].map((lawyer, idx) => (
                    <div key={idx} className="border rounded-lg p-4 text-center">
                      <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3"></div>
                      <h4 className="font-semibold">{lawyer.name} 변호사</h4>
                      <p className="text-sm text-gray-600">{lawyer.specialty} 전문</p>
                      <div className="flex justify-center items-center gap-2 mt-2">
                        <span className="text-yellow-500">⭐</span>
                        <span className="text-sm">{lawyer.rating}</span>
                        <span className="text-gray-400">|</span>
                        <span className="text-sm text-gray-600">상담 {lawyer.consultations}건</span>
                      </div>
                      <button className="mt-3 w-full bg-orange-100 text-orange-600 px-3 py-1 rounded hover:bg-orange-200 text-sm">
                        상담 예약
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        {showContractModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">계약서 검토 요청</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="계약서 제목"
                  className="w-full px-3 py-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="고용주/회사명"
                  className="w-full px-3 py-2 border rounded-md"
                />
                <textarea
                  placeholder="검토 요청 사항"
                  className="w-full px-3 py-2 border rounded-md h-24"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowContractModal(false)}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => setShowContractModal(false)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                  >
                    요청하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showCaseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">법적 사건 신고</h3>
              <div className="space-y-4">
                <select className="w-full px-3 py-2 border rounded-md">
                  <option>사건 유형 선택</option>
                  <option>임금체불</option>
                  <option>부당해고</option>
                  <option>산재</option>
                  <option>계약위반</option>
                  <option>기타</option>
                </select>
                <input
                  type="text"
                  placeholder="사건 제목"
                  className="w-full px-3 py-2 border rounded-md"
                />
                <textarea
                  placeholder="사건 설명"
                  className="w-full px-3 py-2 border rounded-md h-32"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowCaseModal(false)}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => setShowCaseModal(false)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                  >
                    신고하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showConsultationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">변호사 상담 예약</h3>
              <div className="space-y-4">
                <select className="w-full px-3 py-2 border rounded-md">
                  <option>변호사 선택</option>
                  <option>김법률 변호사 (노동법)</option>
                  <option>이정의 변호사 (산재/보상)</option>
                  <option>박권리 변호사 (계약분쟁)</option>
                </select>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-md"
                />
                <select className="w-full px-3 py-2 border rounded-md">
                  <option>상담 방식</option>
                  <option>온라인 화상</option>
                  <option>전화 상담</option>
                  <option>대면 상담</option>
                </select>
                <textarea
                  placeholder="상담 내용"
                  className="w-full px-3 py-2 border rounded-md h-24"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowConsultationModal(false)}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => setShowConsultationModal(false)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                  >
                    예약하기
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