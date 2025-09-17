'use client'

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';

interface SafetyIncident {
  id: string;
  type: 'accident' | 'near_miss' | 'hazard';
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  location: string;
  date: string;
  time: string;
  description: string;
  reportedBy: string;
  status: 'reported' | 'investigating' | 'resolved';
  category: string;
  preventiveMeasures?: string[];
}

interface SafetyChecklistItem {
  id: string;
  category: string;
  item: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  checked: boolean;
  lastChecked?: string;
}

interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  availability: string;
  priority: number;
}

interface SafetyResource {
  id: string;
  title: string;
  type: 'document' | 'video' | 'guide';
  category: string;
  description: string;
  url?: string;
  downloadCount: number;
  lastUpdated: string;
}

const SAMPLE_INCIDENTS: SafetyIncident[] = [
  {
    id: 'inc1',
    type: 'near_miss',
    severity: 'moderate',
    location: '강남구 현장 A',
    date: '2024-12-28',
    time: '14:30',
    description: '사다리 작업 중 미끄러짐 발생, 부상은 없음',
    reportedBy: '김철수',
    status: 'resolved',
    category: '추락',
    preventiveMeasures: [
      '미끄럼 방지 장치 설치',
      '안전 장비 착용 의무화',
      '2인 1조 작업 시행'
    ]
  },
  {
    id: 'inc2',
    type: 'hazard',
    severity: 'minor',
    location: '서초구 현장 B',
    date: '2024-12-29',
    time: '10:15',
    description: '전기 배선 노출 발견',
    reportedBy: '이영희',
    status: 'investigating',
    category: '전기'
  },
  {
    id: 'inc3',
    type: 'accident',
    severity: 'severe',
    location: '마포구 현장 C',
    date: '2024-12-27',
    time: '16:45',
    description: '중장비 작업 중 손가락 부상',
    reportedBy: '박대호',
    status: 'resolved',
    category: '장비',
    preventiveMeasures: [
      '장비 사용 교육 강화',
      '보호 장갑 착용 의무화'
    ]
  }
];

const SAMPLE_CHECKLIST: SafetyChecklistItem[] = [
  {
    id: 'check1',
    category: '개인보호장비',
    item: '안전모 착용',
    description: '작업 전 안전모 착용 및 턱끈 체결 확인',
    priority: 'high',
    checked: true,
    lastChecked: '2024-12-30T08:00:00Z'
  },
  {
    id: 'check2',
    category: '개인보호장비',
    item: '안전화 착용',
    description: '안전화 착용 및 끈 체결 확인',
    priority: 'high',
    checked: true,
    lastChecked: '2024-12-30T08:00:00Z'
  },
  {
    id: 'check3',
    category: '작업환경',
    item: '작업장 정리정돈',
    description: '작업 공간 내 장애물 제거 및 정리',
    priority: 'medium',
    checked: false
  },
  {
    id: 'check4',
    category: '작업환경',
    item: '조명 상태',
    description: '충분한 조명 확보 여부 확인',
    priority: 'medium',
    checked: false
  },
  {
    id: 'check5',
    category: '장비점검',
    item: '전동공구 절연 상태',
    description: '전동공구 전선 및 플러그 손상 여부 점검',
    priority: 'high',
    checked: false
  },
  {
    id: 'check6',
    category: '응급',
    item: '구급함 위치 확인',
    description: '현장 구급함 위치 및 내용물 확인',
    priority: 'medium',
    checked: true,
    lastChecked: '2024-12-30T08:00:00Z'
  }
];

const SAMPLE_EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: 'em1',
    name: '119 구급대',
    role: '응급의료',
    phone: '119',
    availability: '24시간',
    priority: 1
  },
  {
    id: 'em2',
    name: '산업안전보건공단',
    role: '산재 신고',
    phone: '1644-4544',
    availability: '평일 09:00-18:00',
    priority: 2
  },
  {
    id: 'em3',
    name: '현장 안전관리자',
    role: '현장 안전',
    phone: '010-1234-5678',
    availability: '24시간',
    priority: 1
  },
  {
    id: 'em4',
    name: '회사 대표',
    role: '긴급 연락',
    phone: '010-9876-5432',
    availability: '24시간',
    priority: 2
  }
];

const SAMPLE_RESOURCES: SafetyResource[] = [
  {
    id: 'res1',
    title: '건설현장 안전수칙 가이드',
    type: 'document',
    category: '기본안전',
    description: '건설현장에서 꼭 지켜야 할 기본 안전수칙',
    downloadCount: 456,
    lastUpdated: '2024-12-01'
  },
  {
    id: 'res2',
    title: '추락사고 예방 동영상',
    type: 'video',
    category: '추락예방',
    description: '추락사고 예방을 위한 교육 동영상',
    downloadCount: 234,
    lastUpdated: '2024-11-15'
  },
  {
    id: 'res3',
    title: '전기작업 안전 매뉴얼',
    type: 'guide',
    category: '전기안전',
    description: '전기작업 시 안전 절차와 주의사항',
    downloadCount: 189,
    lastUpdated: '2024-12-10'
  }
];

export default function SafetyPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [incidents, setIncidents] = useState<SafetyIncident[]>(SAMPLE_INCIDENTS);
  const [checklist, setChecklist] = useState<SafetyChecklistItem[]>(SAMPLE_CHECKLIST);
  const [emergencyContacts] = useState<EmergencyContact[]>(SAMPLE_EMERGENCY_CONTACTS);
  const [resources] = useState<SafetyResource[]>(SAMPLE_RESOURCES);
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'checklist' | 'incidents' | 'emergency' | 'resources'>('dashboard');
  const [isReporting, setIsReporting] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-900 bg-red-100';
      case 'severe': return 'text-red-700 bg-red-100';
      case 'moderate': return 'text-orange-700 bg-orange-100';
      case 'minor': return 'text-yellow-700 bg-yellow-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'critical': return '매우 심각';
      case 'severe': return '심각';
      case 'moderate': return '보통';
      case 'minor': return '경미';
      default: return '알 수 없음';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'accident': return '🚨';
      case 'near_miss': return '⚠️';
      case 'hazard': return '⚡';
      default: return '📋';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-700';
      case 'medium': return 'text-orange-700';
      case 'low': return 'text-gray-700';
      default: return 'text-gray-700';
    }
  };

  const handleChecklistToggle = (itemId: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, checked: !item.checked, lastChecked: new Date().toISOString() }
        : item
    ));
  };

  const calculateSafetyScore = () => {
    const checkedItems = checklist.filter(item => item.checked).length;
    return Math.round((checkedItems / checklist.length) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">안전 관리</h1>
          <p className="text-gray-600">작업 현장의 안전을 최우선으로 관리합니다</p>
        </div>

        {/* 긴급 알림 */}
        {incidents.filter(i => i.severity === 'critical' || i.severity === 'severe').length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🚨</span>
              <div>
                <h3 className="text-red-900 font-semibold">중요 안전 알림</h3>
                <p className="text-red-700">최근 심각한 안전 사고가 보고되었습니다. 주의하시기 바랍니다.</p>
              </div>
            </div>
          </div>
        )}

        {/* 탭 네비게이션 */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'dashboard', label: '대시보드', icon: '📊' },
                { key: 'checklist', label: '안전 체크리스트', icon: '✅' },
                { key: 'incidents', label: '사고 보고', icon: '📝' },
                { key: 'emergency', label: '비상 연락망', icon: '📞' },
                { key: 'resources', label: '안전 자료', icon: '📚' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key as any)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === tab.key
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 대시보드 */}
        {selectedTab === 'dashboard' && (
          <div className="space-y-8">
            {/* 안전 점수 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">안전 점수</h3>
                  <span className="text-3xl">🛡️</span>
                </div>
                <div className="text-3xl font-bold text-green-600">{calculateSafetyScore()}%</div>
                <p className="text-sm text-gray-600 mt-1">체크리스트 준수율</p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">무사고 일수</h3>
                  <span className="text-3xl">📅</span>
                </div>
                <div className="text-3xl font-bold text-blue-600">15일</div>
                <p className="text-sm text-gray-600 mt-1">연속 무사고</p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">이번 달 사고</h3>
                  <span className="text-3xl">⚠️</span>
                </div>
                <div className="text-3xl font-bold text-orange-600">3건</div>
                <p className="text-sm text-gray-600 mt-1">전월 대비 -2건</p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">위험 신고</h3>
                  <span className="text-3xl">🚨</span>
                </div>
                <div className="text-3xl font-bold text-red-600">5건</div>
                <p className="text-sm text-gray-600 mt-1">처리 중 2건</p>
              </div>
            </div>

            {/* 최근 사고 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 안전 사고</h3>
              <div className="space-y-3">
                {incidents.slice(0, 3).map(incident => (
                  <div key={incident.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getTypeIcon(incident.type)}</span>
                      <div>
                        <div className="font-medium text-gray-900">{incident.description}</div>
                        <div className="text-sm text-gray-600">
                          {incident.location} • {incident.date} {incident.time}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                      {getSeverityText(incident.severity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 안전 팁 */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 오늘의 안전 팁</h3>
              <ul className="space-y-2 text-blue-800">
                <li>• 작업 전 반드시 안전 체크리스트를 확인하세요</li>
                <li>• 개인보호장비는 항상 올바르게 착용하세요</li>
                <li>• 위험 요소를 발견하면 즉시 보고하세요</li>
                <li>• 2인 1조로 작업하여 서로의 안전을 확인하세요</li>
              </ul>
            </div>
          </div>
        )}

        {/* 안전 체크리스트 */}
        {selectedTab === 'checklist' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">작업 전 안전 체크리스트</h3>
                    <div className="text-sm text-gray-600">
                      완료: {checklist.filter(item => item.checked).length}/{checklist.length}
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {['개인보호장비', '작업환경', '장비점검', '응급'].map(category => (
                    <div key={category} className="mb-6 last:mb-0">
                      <h4 className="font-medium text-gray-900 mb-3">{category}</h4>
                      <div className="space-y-3">
                        {checklist
                          .filter(item => item.category === category)
                          .map(item => (
                            <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                              <input
                                type="checkbox"
                                checked={item.checked}
                                onChange={() => handleChecklistToggle(item.id)}
                                className="mt-1 text-orange-600 focus:ring-orange-500"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">{item.item}</span>
                                  <span className={`text-xs ${getPriorityColor(item.priority)}`}>
                                    {item.priority === 'high' ? '필수' : item.priority === 'medium' ? '권장' : '선택'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                {item.lastChecked && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    마지막 확인: {new Date(item.lastChecked).toLocaleString('ko-KR')}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-6 border-t border-gray-200">
                  <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
                    체크리스트 완료 확인
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">체크리스트 진행률</h4>
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                        진행률
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-green-600">
                        {calculateSafetyScore()}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
                    <div 
                      style={{ width: `${calculateSafetyScore()}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-6">
                <h4 className="font-semibold text-yellow-900 mb-3">⚠️ 주의사항</h4>
                <ul className="space-y-2 text-sm text-yellow-800">
                  <li>• 모든 필수 항목은 반드시 확인</li>
                  <li>• 체크리스트는 매일 갱신</li>
                  <li>• 미준수 시 작업 중단 가능</li>
                  <li>• 허위 체크 시 법적 책임</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 사고 보고 */}
        {selectedTab === 'incidents' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">사고 및 위험 보고</h3>
              <button
                onClick={() => setIsReporting(true)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                🚨 긴급 보고
              </button>
            </div>

            <div className="space-y-4">
              {incidents.map(incident => (
                <div key={incident.id} className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getTypeIcon(incident.type)}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">
                            {incident.type === 'accident' ? '사고' : 
                             incident.type === 'near_miss' ? '아차사고' : '위험요소'}
                          </h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                            {getSeverityText(incident.severity)}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            incident.status === 'resolved' ? 'bg-green-100 text-green-700' :
                            incident.status === 'investigating' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {incident.status === 'resolved' ? '해결' :
                             incident.status === 'investigating' ? '조사중' : '접수'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {incident.location} • {incident.date} {incident.time} • 보고자: {incident.reportedBy}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4">{incident.description}</p>
                  
                  {incident.preventiveMeasures && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h5 className="font-medium text-blue-900 mb-2">예방 조치</h5>
                      <ul className="space-y-1">
                        {incident.preventiveMeasures.map((measure, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm text-blue-800">
                            <span className="text-green-600">✓</span>
                            {measure}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 비상 연락망 */}
        {selectedTab === 'emergency' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {emergencyContacts.map(contact => (
              <div key={contact.id} className={`bg-white rounded-lg p-6 shadow-sm ${
                contact.priority === 1 ? 'border-2 border-red-300' : ''
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{contact.name}</h3>
                  {contact.priority === 1 && (
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">
                      긴급
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600">역할:</span>
                    <span className="font-medium">{contact.role}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600">전화:</span>
                    <a href={`tel:${contact.phone}`} className="font-medium text-blue-600 hover:text-blue-800">
                      {contact.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600">가능시간:</span>
                    <span className="font-medium">{contact.availability}</span>
                  </div>
                </div>
                <button className="w-full mt-4 bg-red-600 text-white py-2 rounded hover:bg-red-700">
                  📞 긴급 전화
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 안전 자료 */}
        {selectedTab === 'resources' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map(resource => (
              <div key={resource.id} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">
                    {resource.type === 'document' ? '📄' :
                     resource.type === 'video' ? '🎥' : '📖'}
                  </span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                    {resource.category}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{resource.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{resource.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>📥 {resource.downloadCount}회</span>
                  <span>업데이트: {resource.lastUpdated}</span>
                </div>
                <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                  다운로드
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 사고 보고 모달 */}
        {isReporting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">안전 사고 보고</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">사고 유형</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="">선택하세요</option>
                    <option value="accident">사고</option>
                    <option value="near_miss">아차사고</option>
                    <option value="hazard">위험요소</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">심각도</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="">선택하세요</option>
                    <option value="minor">경미</option>
                    <option value="moderate">보통</option>
                    <option value="severe">심각</option>
                    <option value="critical">매우 심각</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">발생 위치</label>
                  <input
                    type="text"
                    placeholder="예: 강남구 현장 A동"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">상세 설명</label>
                  <textarea
                    rows={4}
                    placeholder="사고 경위를 상세히 설명해주세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2 text-orange-600" />
                  <span className="text-sm text-gray-700">응급 상황입니다 (119 자동 연락)</span>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700">
                  보고하기
                </button>
                <button
                  onClick={() => setIsReporting(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}