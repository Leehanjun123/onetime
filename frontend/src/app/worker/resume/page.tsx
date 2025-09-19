'use client'

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'next/navigation';
import { resumeAPI } from '@/lib/api';

interface Resume {
  id?: string;
  title?: string;
  summary?: string;
  phone?: string;
  address?: string;
  birthDate?: string;
  workExperiences?: WorkExperience[];
  educations?: Education[];
  skills?: Skill[];
}

interface WorkExperience {
  id?: string;
  company: string;
  position: string;
  description?: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
}

interface Education {
  id?: string;
  school: string;
  major?: string;
  degree: 'HIGH_SCHOOL' | 'ASSOCIATE' | 'BACHELOR' | 'MASTER' | 'DOCTORATE' | 'OTHER';
  startDate: string;
  endDate?: string;
  isGraduated?: boolean;
  gpa?: number;
  maxGpa?: number;
}

interface Skill {
  id?: string;
  name: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  category?: string;
}

export default function WorkerResumePage() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'experience' | 'education' | 'skills'>('basic');
  
  const [resume, setResume] = useState<Resume>({
    title: '',
    summary: '',
    phone: '',
    address: '',
    birthDate: '',
    workExperiences: [],
    educations: [],
    skills: []
  });

  const [newExperience, setNewExperience] = useState<WorkExperience>({
    company: '',
    position: '',
    description: '',
    startDate: '',
    endDate: '',
    isCurrent: false
  });

  const [newEducation, setNewEducation] = useState<Education>({
    school: '',
    major: '',
    degree: 'HIGH_SCHOOL',
    startDate: '',
    endDate: '',
    isGraduated: false,
    gpa: undefined,
    maxGpa: undefined
  });

  const [newSkill, setNewSkill] = useState<Skill>({
    name: '',
    level: 'BEGINNER',
    category: ''
  });

  const [editingExperience, setEditingExperience] = useState<string | null>(null);
  const [editingEducation, setEditingEducation] = useState<string | null>(null);
  const [editingSkill, setEditingSkill] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.userType !== 'WORKER') {
      router.push('/');
      return;
    }
    fetchResume();
  }, [isAuthenticated, user, router]);

  const fetchResume = async () => {
    setLoading(true);
    try {
      const response = await resumeAPI.getResume();
      if (response.data) {
        setResume(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch resume:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBasicInfo = async () => {
    setSaving(true);
    try {
      await resumeAPI.saveResume({
        title: resume.title,
        summary: resume.summary,
        phone: resume.phone,
        address: resume.address,
        birthDate: resume.birthDate
      });
      alert('기본 정보가 저장되었습니다.');
    } catch (error) {
      console.error('Failed to save basic info:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddExperience = async () => {
    if (!newExperience.company || !newExperience.position || !newExperience.startDate) {
      alert('회사명, 직책, 시작일은 필수입니다.');
      return;
    }

    try {
      const response = await resumeAPI.workExperience.add(newExperience);
      setResume(prev => ({
        ...prev,
        workExperiences: [...(prev.workExperiences || []), response.data]
      }));
      setNewExperience({
        company: '',
        position: '',
        description: '',
        startDate: '',
        endDate: '',
        isCurrent: false
      });
      alert('경력이 추가되었습니다.');
    } catch (error) {
      console.error('Failed to add experience:', error);
      alert('경력 추가에 실패했습니다.');
    }
  };

  const handleDeleteExperience = async (id: string) => {
    if (!confirm('이 경력을 삭제하시겠습니까?')) return;

    try {
      await resumeAPI.workExperience.delete(id);
      setResume(prev => ({
        ...prev,
        workExperiences: prev.workExperiences?.filter(exp => exp.id !== id) || []
      }));
      alert('경력이 삭제되었습니다.');
    } catch (error) {
      console.error('Failed to delete experience:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleAddEducation = async () => {
    if (!newEducation.school || !newEducation.startDate) {
      alert('학교명과 시작일은 필수입니다.');
      return;
    }

    try {
      const response = await resumeAPI.education.add(newEducation);
      setResume(prev => ({
        ...prev,
        educations: [...(prev.educations || []), response.data]
      }));
      setNewEducation({
        school: '',
        major: '',
        degree: 'HIGH_SCHOOL',
        startDate: '',
        endDate: '',
        isGraduated: false,
        gpa: undefined,
        maxGpa: undefined
      });
      alert('학력이 추가되었습니다.');
    } catch (error) {
      console.error('Failed to add education:', error);
      alert('학력 추가에 실패했습니다.');
    }
  };

  const handleDeleteEducation = async (id: string) => {
    if (!confirm('이 학력을 삭제하시겠습니까?')) return;

    try {
      await resumeAPI.education.delete(id);
      setResume(prev => ({
        ...prev,
        educations: prev.educations?.filter(edu => edu.id !== id) || []
      }));
      alert('학력이 삭제되었습니다.');
    } catch (error) {
      console.error('Failed to delete education:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.name) {
      alert('스킬명은 필수입니다.');
      return;
    }

    try {
      const response = await resumeAPI.skill.add(newSkill);
      setResume(prev => ({
        ...prev,
        skills: [...(prev.skills || []), response.data]
      }));
      setNewSkill({
        name: '',
        level: 'BEGINNER',
        category: ''
      });
      alert('스킬이 추가되었습니다.');
    } catch (error) {
      console.error('Failed to add skill:', error);
      alert('스킬 추가에 실패했습니다.');
    }
  };

  const handleDeleteSkill = async (id: string) => {
    if (!confirm('이 스킬을 삭제하시겠습니까?')) return;

    try {
      await resumeAPI.skill.delete(id);
      setResume(prev => ({
        ...prev,
        skills: prev.skills?.filter(skill => skill.id !== id) || []
      }));
      alert('스킬이 삭제되었습니다.');
    } catch (error) {
      console.error('Failed to delete skill:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const getDegreeName = (degree: string) => {
    const degreeNames = {
      HIGH_SCHOOL: '고등학교',
      ASSOCIATE: '전문대학',
      BACHELOR: '학사',
      MASTER: '석사',
      DOCTORATE: '박사',
      OTHER: '기타'
    };
    return degreeNames[degree as keyof typeof degreeNames] || degree;
  };

  const getSkillLevelName = (level: string) => {
    const levelNames = {
      BEGINNER: '초급',
      INTERMEDIATE: '중급',
      ADVANCED: '고급',
      EXPERT: '전문가'
    };
    return levelNames[level as keyof typeof levelNames] || level;
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-gray-900">내 이력서</h1>
            <p className="text-gray-600 mt-2">이력서 정보를 작성하고 관리하세요</p>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'basic', label: '기본 정보' },
                { key: 'experience', label: '경력' },
                { key: 'education', label: '학력' },
                { key: 'skills', label: '스킬' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이력서 제목
                  </label>
                  <input
                    type="text"
                    value={resume.title || ''}
                    onChange={(e) => setResume(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="예: 신입 개발자 이력서"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    자기소개
                  </label>
                  <textarea
                    value={resume.summary || ''}
                    onChange={(e) => setResume(prev => ({ ...prev, summary: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="본인의 경력과 강점을 간단히 소개해주세요"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      연락처
                    </label>
                    <input
                      type="tel"
                      value={resume.phone || ''}
                      onChange={(e) => setResume(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="010-0000-0000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      생년월일
                    </label>
                    <input
                      type="date"
                      value={resume.birthDate || ''}
                      onChange={(e) => setResume(prev => ({ ...prev, birthDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    주소
                  </label>
                  <input
                    type="text"
                    value={resume.address || ''}
                    onChange={(e) => setResume(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="서울시 강남구 역삼동"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveBasicInfo}
                    disabled={saving}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>
            )}

            {/* Experience Tab */}
            {activeTab === 'experience' && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">경력 추가</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="회사명 *"
                        value={newExperience.company}
                        onChange={(e) => setNewExperience(prev => ({ ...prev, company: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <input
                        type="text"
                        placeholder="직책 *"
                        value={newExperience.position}
                        onChange={(e) => setNewExperience(prev => ({ ...prev, position: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">시작일 *</label>
                        <input
                          type="date"
                          value={newExperience.startDate}
                          onChange={(e) => setNewExperience(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">종료일</label>
                        <input
                          type="date"
                          value={newExperience.endDate || ''}
                          onChange={(e) => setNewExperience(prev => ({ ...prev, endDate: e.target.value }))}
                          disabled={newExperience.isCurrent}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                        />
                        <label className="flex items-center mt-2">
                          <input
                            type="checkbox"
                            checked={newExperience.isCurrent || false}
                            onChange={(e) => setNewExperience(prev => ({ ...prev, isCurrent: e.target.checked }))}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-600">현재 재직중</span>
                        </label>
                      </div>
                    </div>

                    <textarea
                      placeholder="업무 설명"
                      value={newExperience.description || ''}
                      onChange={(e) => setNewExperience(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />

                    <button
                      onClick={handleAddExperience}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      경력 추가
                    </button>
                  </div>
                </div>

                {/* Experience List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">등록된 경력</h3>
                  {resume.workExperiences && resume.workExperiences.length > 0 ? (
                    resume.workExperiences.map((exp) => (
                      <div key={exp.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{exp.company}</h4>
                            <p className="text-gray-600">{exp.position}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {formatDate(exp.startDate)} ~ {exp.isCurrent ? '재직중' : (exp.endDate ? formatDate(exp.endDate) : '-')}
                            </p>
                            {exp.description && (
                              <p className="text-gray-700 mt-2">{exp.description}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteExperience(exp.id!)}
                            className="text-red-600 hover:text-red-800 ml-4"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">등록된 경력이 없습니다.</p>
                  )}
                </div>
              </div>
            )}

            {/* Education Tab */}
            {activeTab === 'education' && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">학력 추가</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="학교명 *"
                        value={newEducation.school}
                        onChange={(e) => setNewEducation(prev => ({ ...prev, school: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <input
                        type="text"
                        placeholder="전공"
                        value={newEducation.major || ''}
                        onChange={(e) => setNewEducation(prev => ({ ...prev, major: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <select
                        value={newEducation.degree}
                        onChange={(e) => setNewEducation(prev => ({ ...prev, degree: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="HIGH_SCHOOL">고등학교</option>
                        <option value="ASSOCIATE">전문대학</option>
                        <option value="BACHELOR">학사</option>
                        <option value="MASTER">석사</option>
                        <option value="DOCTORATE">박사</option>
                        <option value="OTHER">기타</option>
                      </select>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">입학일 *</label>
                        <input
                          type="date"
                          value={newEducation.startDate}
                          onChange={(e) => setNewEducation(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">졸업일</label>
                        <input
                          type="date"
                          value={newEducation.endDate || ''}
                          onChange={(e) => setNewEducation(prev => ({ ...prev, endDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newEducation.isGraduated || false}
                            onChange={(e) => setNewEducation(prev => ({ ...prev, isGraduated: e.target.checked }))}
                            className="mr-2"
                          />
                          <span className="text-sm">졸업</span>
                        </label>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="학점"
                        value={newEducation.gpa || ''}
                        onChange={(e) => setNewEducation(prev => ({ ...prev, gpa: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="만점"
                        value={newEducation.maxGpa || ''}
                        onChange={(e) => setNewEducation(prev => ({ ...prev, maxGpa: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <button
                      onClick={handleAddEducation}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      학력 추가
                    </button>
                  </div>
                </div>

                {/* Education List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">등록된 학력</h3>
                  {resume.educations && resume.educations.length > 0 ? (
                    resume.educations.map((edu) => (
                      <div key={edu.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{edu.school}</h4>
                            <p className="text-gray-600">{getDegreeName(edu.degree)} {edu.major && `- ${edu.major}`}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {formatDate(edu.startDate)} ~ {edu.endDate ? formatDate(edu.endDate) : '재학중'}
                              {edu.isGraduated && ' (졸업)'}
                            </p>
                            {edu.gpa && edu.maxGpa && (
                              <p className="text-sm text-gray-500">학점: {edu.gpa}/{edu.maxGpa}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteEducation(edu.id!)}
                            className="text-red-600 hover:text-red-800 ml-4"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">등록된 학력이 없습니다.</p>
                  )}
                </div>
              </div>
            )}

            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">스킬 추가</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        placeholder="스킬명 *"
                        value={newSkill.name}
                        onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <select
                        value={newSkill.level}
                        onChange={(e) => setNewSkill(prev => ({ ...prev, level: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="BEGINNER">초급</option>
                        <option value="INTERMEDIATE">중급</option>
                        <option value="ADVANCED">고급</option>
                        <option value="EXPERT">전문가</option>
                      </select>
                      <input
                        type="text"
                        placeholder="카테고리"
                        value={newSkill.category || ''}
                        onChange={(e) => setNewSkill(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <button
                      onClick={handleAddSkill}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      스킬 추가
                    </button>
                  </div>
                </div>

                {/* Skills List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">등록된 스킬</h3>
                  {resume.skills && resume.skills.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {resume.skills.map((skill) => (
                        <div key={skill.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold">{skill.name}</h4>
                              <p className="text-sm text-gray-600">{getSkillLevelName(skill.level)}</p>
                              {skill.category && (
                                <p className="text-xs text-gray-500 mt-1">{skill.category}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteSkill(skill.id!)}
                              className="text-red-600 hover:text-red-800 ml-2"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">등록된 스킬이 없습니다.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}