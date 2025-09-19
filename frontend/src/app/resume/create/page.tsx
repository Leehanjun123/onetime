'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';

// 전문 분야 데이터
const specialties = [
  { id: '1', name: '전기', code: 'ELECTRIC', icon: '⚡', skills: ['전기 배선 작업', '조명기구 설치', '콘센트/스위치 교체', '분전반 작업', 'LED 조명 교체'] },
  { id: '2', name: '목공', code: 'CARPENTRY', icon: '🔨', skills: ['붙박이장 제작', '몰딩 시공', '문/창문 설치', '목재 마루 시공', '천장 작업'] },
  { id: '3', name: '샷시', code: 'SASH', icon: '🪟', skills: ['샷시 교체', '창문 설치', '방음창 시공', '유리 교체', '발코니 확장'] },
  { id: '4', name: '철거', code: 'DEMOLITION', icon: '🏗️', skills: ['인테리어 철거', '벽체 철거', '바닥 철거', '천장 철거', '폐기물 처리'] },
  { id: '5', name: '에어컨', code: 'AIRCON', icon: '❄️', skills: ['에어컨 설치', '에어컨 이전설치', '에어컨 청소', '냉매 충전', '시스템 에어컨'] },
  { id: '6', name: '설비', code: 'PLUMBING', icon: '🔧', skills: ['수도 배관', '하수 배관', '보일러 설치', '욕실 설비', '주방 설비'] },
  { id: '7', name: '마루', code: 'FLOOR', icon: '🪵', skills: ['강화마루 시공', '강마루 시공', '원목마루 시공', '마루 보수', '걸레받이 시공'] },
  { id: '8', name: '타일', code: 'TILE', icon: '🟦', skills: ['바닥 타일 시공', '벽 타일 시공', '욕실 타일', '주방 타일', '줄눈 시공'] },
  { id: '9', name: '장판', code: 'LINOLEUM', icon: '📐', skills: ['장판 시공', '데코타일 시공', 'PVC 바닥재', '거실 장판', '방 장판'] },
  { id: '10', name: '도배', code: 'WALLPAPER', icon: '🎨', skills: ['실크 벽지', '합지 벽지', '방 도배', '거실 도배', '천장 도배'] },
  { id: '11', name: '가구', code: 'FURNITURE', icon: '🪑', skills: ['가구 조립', '붙박이장 설치', '주방가구 설치', '가구 이동', '가구 수리'] },
  { id: '12', name: '미장', code: 'PLASTERING', icon: '🏠', skills: ['벽면 미장', '천장 미장', '페인트 도색', '방수 작업', '균열 보수'] }
];

export default function CreateResumePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // 기본 정보
    title: '',
    summary: '',
    totalExperience: 0,
    desiredWage: '',
    workableArea: [] as string[],
    availableDays: [] as string[],
    availableTime: '',
    ownedEquipment: [] as string[],
    
    // 전문 분야
    selectedSpecialties: [] as any[],
    
    // 경력사항
    experiences: [] as any[],
    
    // 자격증
    certifications: [] as any[]
  });

  const [currentExperience, setCurrentExperience] = useState({
    companyName: '',
    position: '',
    jobType: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
    achievements: [] as string[]
  });

  const [currentCertification, setCurrentCertification] = useState({
    name: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    certNumber: ''
  });

  const areas = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
  const days = ['월', '화', '수', '목', '금', '토', '일'];
  const equipments = ['전동드릴', '그라인더', '용접기', '컴프레서', '사다리', '안전장비', '측정도구', '전동톱', '타일커터', '미장도구'];

  const handleSpecialtyToggle = (specialty: any) => {
    const isSelected = formData.selectedSpecialties.find(s => s.id === specialty.id);
    if (isSelected) {
      setFormData(prev => ({
        ...prev,
        selectedSpecialties: prev.selectedSpecialties.filter(s => s.id !== specialty.id)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        selectedSpecialties: [...prev.selectedSpecialties, {
          ...specialty,
          experienceYears: 0,
          proficiency: 'BASIC',
          selectedSkills: []
        }]
      }));
    }
  };

  const handleSkillToggle = (specialtyId: string, skill: string) => {
    setFormData(prev => ({
      ...prev,
      selectedSpecialties: prev.selectedSpecialties.map(s => {
        if (s.id === specialtyId) {
          const hasSkill = s.selectedSkills?.includes(skill);
          return {
            ...s,
            selectedSkills: hasSkill 
              ? s.selectedSkills.filter((sk: string) => sk !== skill)
              : [...(s.selectedSkills || []), skill]
          };
        }
        return s;
      })
    }));
  };

  const addExperience = () => {
    if (currentExperience.companyName && currentExperience.position) {
      setFormData(prev => ({
        ...prev,
        experiences: [...prev.experiences, currentExperience]
      }));
      setCurrentExperience({
        companyName: '',
        position: '',
        jobType: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        description: '',
        achievements: []
      });
    }
  };

  const addCertification = () => {
    if (currentCertification.name && currentCertification.issuer) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, currentCertification]
      }));
      setCurrentCertification({
        name: '',
        issuer: '',
        issueDate: '',
        expiryDate: '',
        certNumber: ''
      });
    }
  };

  const handleSubmit = async () => {
    try {
      // 이력서 데이터 준비
      const resumeData = {
        title: formData.title || '일용직 이력서',
        summary: formData.summary,
        totalExperience: formData.totalExperience,
        desiredWage: formData.desiredWage,
        workableArea: formData.workableArea,
        availableDays: formData.availableDays
      };

      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        router.push('/login');
        return;
      }

      const response = await fetch('https://onetime-production.up.railway.app/api/v1/resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(resumeData)
      });

      const result = await response.json();

      if (result.success) {
        alert('일용직 이력서가 성공적으로 등록되었습니다!');
        router.push('/jobs/daily');
      } else {
        alert(result.message || '이력서 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('이력서 등록 오류:', error);
      alert('이력서 등록 중 오류가 발생했습니다.');
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">기본 정보</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이력서 제목 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="예: 20년 경력 전기 기술자"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                자기소개
              </label>
              <textarea
                rows={4}
                value={formData.summary}
                onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="본인의 경력과 강점을 간단히 소개해주세요"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  총 경력 (년)
                </label>
                <input
                  type="number"
                  value={formData.totalExperience}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalExperience: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  희망 일당 (원)
                </label>
                <input
                  type="text"
                  value={formData.desiredWage}
                  onChange={(e) => setFormData(prev => ({ ...prev, desiredWage: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="150,000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                근무 가능 지역
              </label>
              <div className="grid grid-cols-4 gap-2">
                {areas.map(area => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => {
                      const isSelected = formData.workableArea.includes(area);
                      setFormData(prev => ({
                        ...prev,
                        workableArea: isSelected 
                          ? prev.workableArea.filter(a => a !== area)
                          : [...prev.workableArea, area]
                      }));
                    }}
                    className={`px-3 py-2 rounded-lg border text-sm ${
                      formData.workableArea.includes(area)
                        ? 'bg-indigo-500 text-white border-indigo-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                근무 가능 요일
              </label>
              <div className="flex gap-2">
                {days.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      const isSelected = formData.availableDays.includes(day);
                      setFormData(prev => ({
                        ...prev,
                        availableDays: isSelected
                          ? prev.availableDays.filter(d => d !== day)
                          : [...prev.availableDays, day]
                      }));
                    }}
                    className={`px-4 py-2 rounded-full ${
                      formData.availableDays.includes(day)
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">전문 분야 선택</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {specialties.map(specialty => {
                const isSelected = formData.selectedSpecialties.find(s => s.id === specialty.id);
                return (
                  <div
                    key={specialty.id}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSpecialtyToggle(specialty)}
                  >
                    <div className="text-3xl mb-2">{specialty.icon}</div>
                    <h3 className="font-bold text-lg">{specialty.name}</h3>
                    <p className="text-sm text-gray-600">{specialty.code}</p>
                    
                    {isSelected && (
                      <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                        <div>
                          <label className="text-xs text-gray-600">경력</label>
                          <select
                            value={isSelected.experienceYears || 0}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                selectedSpecialties: prev.selectedSpecialties.map(s =>
                                  s.id === specialty.id 
                                    ? { ...s, experienceYears: parseInt(e.target.value) }
                                    : s
                                )
                              }));
                            }}
                            className="w-full mt-1 px-2 py-1 text-sm border rounded"
                          >
                            <option value="0">신입</option>
                            <option value="1">1년</option>
                            <option value="3">3년</option>
                            <option value="5">5년</option>
                            <option value="10">10년+</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="text-xs text-gray-600">숙련도</label>
                          <select
                            value={isSelected.proficiency || 'BASIC'}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                selectedSpecialties: prev.selectedSpecialties.map(s =>
                                  s.id === specialty.id 
                                    ? { ...s, proficiency: e.target.value }
                                    : s
                                )
                              }));
                            }}
                            className="w-full mt-1 px-2 py-1 text-sm border rounded"
                          >
                            <option value="BASIC">초급</option>
                            <option value="INTERMEDIATE">중급</option>
                            <option value="ADVANCED">고급</option>
                            <option value="EXPERT">전문가</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs text-gray-600">보유 스킬</label>
                          <div className="mt-1 space-y-1">
                            {specialty.skills.map(skill => (
                              <label key={skill} className="flex items-center text-xs">
                                <input
                                  type="checkbox"
                                  checked={isSelected.selectedSkills?.includes(skill) || false}
                                  onChange={() => handleSkillToggle(specialty.id, skill)}
                                  className="mr-2"
                                />
                                {skill}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">경력사항</h2>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="회사명"
                  value={currentExperience.companyName}
                  onChange={(e) => setCurrentExperience(prev => ({ ...prev, companyName: e.target.value }))}
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="직책/직무"
                  value={currentExperience.position}
                  onChange={(e) => setCurrentExperience(prev => ({ ...prev, position: e.target.value }))}
                  className="px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-600">시작일</label>
                  <input
                    type="date"
                    value={currentExperience.startDate}
                    onChange={(e) => setCurrentExperience(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">종료일</label>
                  <input
                    type="date"
                    value={currentExperience.endDate}
                    onChange={(e) => setCurrentExperience(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={currentExperience.isCurrent}
                  />
                  <label className="flex items-center mt-1 text-sm">
                    <input
                      type="checkbox"
                      checked={currentExperience.isCurrent}
                      onChange={(e) => setCurrentExperience(prev => ({ ...prev, isCurrent: e.target.checked }))}
                      className="mr-2"
                    />
                    현재 재직중
                  </label>
                </div>
              </div>

              <textarea
                placeholder="주요 업무 내용"
                value={currentExperience.description}
                onChange={(e) => setCurrentExperience(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
              />

              <button
                type="button"
                onClick={addExperience}
                className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600"
              >
                경력 추가
              </button>
            </div>

            {formData.experiences.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-bold">등록된 경력</h3>
                {formData.experiences.map((exp, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg border">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{exp.companyName}</p>
                        <p className="text-sm text-gray-600">{exp.position}</p>
                        <p className="text-xs text-gray-500">
                          {exp.startDate} ~ {exp.isCurrent ? '재직중' : exp.endDate}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            experiences: prev.experiences.filter((_, i) => i !== index)
                          }));
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">자격증 및 장비</h2>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h3 className="font-bold">자격증 추가</h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="자격증명"
                  value={currentCertification.name}
                  onChange={(e) => setCurrentCertification(prev => ({ ...prev, name: e.target.value }))}
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="발급기관"
                  value={currentCertification.issuer}
                  onChange={(e) => setCurrentCertification(prev => ({ ...prev, issuer: e.target.value }))}
                  className="px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  placeholder="발급일"
                  value={currentCertification.issueDate}
                  onChange={(e) => setCurrentCertification(prev => ({ ...prev, issueDate: e.target.value }))}
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="자격증 번호"
                  value={currentCertification.certNumber}
                  onChange={(e) => setCurrentCertification(prev => ({ ...prev, certNumber: e.target.value }))}
                  className="px-3 py-2 border rounded-lg"
                />
              </div>

              <button
                type="button"
                onClick={addCertification}
                className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600"
              >
                자격증 추가
              </button>
            </div>

            {formData.certifications.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-bold">등록된 자격증</h3>
                {formData.certifications.map((cert, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg border flex justify-between">
                    <div>
                      <p className="font-medium">{cert.name}</p>
                      <p className="text-sm text-gray-600">{cert.issuer}</p>
                    </div>
                    <button
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          certifications: prev.certifications.filter((_, i) => i !== index)
                        }));
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div>
              <h3 className="font-bold mb-3">보유 장비</h3>
              <div className="grid grid-cols-3 gap-2">
                {equipments.map(equipment => (
                  <button
                    key={equipment}
                    type="button"
                    onClick={() => {
                      const isSelected = formData.ownedEquipment.includes(equipment);
                      setFormData(prev => ({
                        ...prev,
                        ownedEquipment: isSelected
                          ? prev.ownedEquipment.filter(e => e !== equipment)
                          : [...prev.ownedEquipment, equipment]
                      }));
                    }}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      formData.ownedEquipment.includes(equipment)
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {equipment}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      step >= stepNumber
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {stepNumber}
                  </div>
                  {stepNumber < 4 && (
                    <div
                      className={`w-20 h-0.5 ${
                        step > stepNumber ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>기본정보</span>
              <span>전문분야</span>
              <span>경력사항</span>
              <span>자격/장비</span>
            </div>
          </div>

          {/* Form Content */}
          {renderStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className={`px-6 py-3 rounded-lg font-medium ${
                step === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              이전
            </button>

            {step < 4 ? (
              <button
                onClick={() => setStep(Math.min(4, step + 1))}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
              >
                다음
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
              >
                이력서 등록
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}