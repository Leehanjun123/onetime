'use client'

import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<'worker' | 'employer'>('worker');
  const [formData, setFormData] = useState({
    // 기본 정보
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    
    // 구직자 정보
    birthDate: '',
    gender: '',
    address: '',
    preferredCategories: [] as string[],
    availableDays: [] as string[],
    availableTime: '',
    
    // 기업 정보
    companyName: '',
    businessNumber: '',
    industry: '',
    companySize: '',
    description: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    '카페/음료', '레스토랑/주방', '편의점/마트', '배달/운전',
    '사무/관리', '판매/영업', '교육/강사', '이벤트/프로모션',
    '청소/시설관리', '제조/생산', 'IT/디자인', '기타'
  ];

  const days = ['월', '화', '수', '목', '금', '토', '일'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Railway 백엔드 API 호출 로직
      const response = await fetch('https://onetime-production.up.railway.app/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          userType: userType === 'worker' ? 'WORKER' : 'EMPLOYER',
        }),
      });

      if (!response.ok) {
        throw new Error('회원가입에 실패했습니다.');
      }

      const result = await response.json();
      
      // 회원가입 성공 시 자동 로그인
      if (result.token) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        alert('회원가입이 완료되었습니다!');
        window.location.href = '/';
      } else {
        alert('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
        window.location.href = '/login';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    console.log('nextStep called, current step:', step);
    
    if (step === 2) {
      // Step 2에서 기본 정보 유효성 검사
      if (!formData.email || !formData.password || !formData.name || !formData.phone) {
        setError('모든 필수 정보를 입력해주세요.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('비밀번호가 일치하지 않습니다.');
        return;
      }
    }
    
    setError('');
    console.log('Moving to step:', step + 1);
    setStep(step + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-indigo-600">
            원데이
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            계정 만들기
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            이미 계정이 있나요?{' '}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              로그인하기
            </Link>
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div
                    className={`w-20 h-0.5 ${
                      step > stepNumber ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>사용자 유형</span>
            <span>기본 정보</span>
            <span>상세 정보</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          {/* Step 1: User Type */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  어떤 유형의 계정을 만드시겠어요?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setUserType('worker')}
                    className={`p-6 rounded-lg border-2 transition-colors ${
                      userType === 'worker'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-4xl mb-2">🙋‍♂️</div>
                    <h4 className="text-lg font-medium text-gray-900">구직자</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      일자리를 찾고 있어요
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUserType('employer')}
                    className={`p-6 rounded-lg border-2 transition-colors ${
                      userType === 'employer'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-4xl mb-2">💼</div>
                    <h4 className="text-lg font-medium text-gray-900">기업/고용주</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      인력을 채용하고 있어요
                    </p>
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  다음
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Basic Info */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                기본 정보를 입력해주세요
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    이메일 주소 *
                  </label>
                  <input
                    type="email"
                    required
                    data-testid="register-email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    placeholder="example@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    이름 *
                  </label>
                  <input
                    type="text"
                    required
                    data-testid="register-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    placeholder="홍길동"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    비밀번호 *
                  </label>
                  <input
                    type="password"
                    required
                    data-testid="register-password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    placeholder="8자 이상 입력"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    비밀번호 확인 *
                  </label>
                  <input
                    type="password"
                    required
                    data-testid="register-confirm-password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    placeholder="비밀번호 재입력"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    전화번호 *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    placeholder="010-1234-5678"
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg font-medium"
                >
                  이전
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  다음
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Detailed Info */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                {userType === 'worker' ? '구직 정보를 입력해주세요' : '기업 정보를 입력해주세요'}
              </h3>

              {userType === 'worker' ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        생년월일
                      </label>
                      <input
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        성별
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      >
                        <option value="">선택안함</option>
                        <option value="male">남성</option>
                        <option value="female">여성</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      선호 업종 (복수선택 가능)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {categories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => {
                            const newCategories = formData.preferredCategories.includes(category)
                              ? formData.preferredCategories.filter(c => c !== category)
                              : [...formData.preferredCategories, category];
                            setFormData(prev => ({ ...prev, preferredCategories: newCategories }));
                          }}
                          className={`p-2 text-sm rounded-md border ${
                            formData.preferredCategories.includes(category)
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      근무 가능 요일
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {days.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const newDays = formData.availableDays.includes(day)
                              ? formData.availableDays.filter(d => d !== day)
                              : [...formData.availableDays, day];
                            setFormData(prev => ({ ...prev, availableDays: newDays }));
                          }}
                          className={`px-4 py-2 rounded-full border ${
                            formData.availableDays.includes(day)
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        회사명 *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.companyName}
                        onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        placeholder="(주)원데이"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        사업자등록번호
                      </label>
                      <input
                        type="text"
                        value={formData.businessNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, businessNumber: e.target.value }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        placeholder="123-45-67890"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        업종
                      </label>
                      <select
                        value={formData.industry}
                        onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      >
                        <option value="">선택해주세요</option>
                        <option value="food">음식점/카페</option>
                        <option value="retail">소매업</option>
                        <option value="service">서비스업</option>
                        <option value="it">IT/기술</option>
                        <option value="manufacturing">제조업</option>
                        <option value="education">교육</option>
                        <option value="other">기타</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        회사 규모
                      </label>
                      <select
                        value={formData.companySize}
                        onChange={(e) => setFormData(prev => ({ ...prev, companySize: e.target.value }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      >
                        <option value="">선택해주세요</option>
                        <option value="1-10">1-10명</option>
                        <option value="11-50">11-50명</option>
                        <option value="51-200">51-200명</option>
                        <option value="201-1000">201-1000명</option>
                        <option value="1000+">1000명 이상</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      회사 소개
                    </label>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      placeholder="회사에 대해 간단히 소개해주세요"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg font-medium"
                >
                  이전
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  data-testid="register-submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '회원가입 중...' : '계정 만들기'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}