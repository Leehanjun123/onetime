'use client'

import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'next/navigation';
import { jobAPI, JOB_CATEGORIES } from '@/lib/api';

export default function CreateJobPage() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    wage: '',
    workDate: '',
    workHours: ''
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // 폼 검증
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.title.trim()) {
      newErrors.title = '일자리 제목을 입력해주세요';
    }
    if (!formData.description.trim()) {
      newErrors.description = '일자리 설명을 입력해주세요';
    }
    if (!formData.category) {
      newErrors.category = '카테고리를 선택해주세요';
    }
    if (!formData.location.trim()) {
      newErrors.location = '근무 위치를 입력해주세요';
    }
    if (!formData.wage || parseInt(formData.wage) < 9620) {
      newErrors.wage = '시급은 최소 9,620원 이상이어야 합니다';
    }
    if (!formData.workDate) {
      newErrors.workDate = '근무일을 선택해주세요';
    }

    // 근무일이 오늘 이후인지 확인
    const today = new Date();
    const selectedDate = new Date(formData.workDate);
    if (selectedDate <= today) {
      newErrors.workDate = '근무일은 오늘 이후여야 합니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || user?.userType !== 'EMPLOYER') {
      alert('고용주만 일자리를 등록할 수 있습니다.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await jobAPI.createJob({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        location: formData.location,
        wage: parseInt(formData.wage),
        workDate: formData.workDate,
        workHours: formData.workHours
      });

      alert('일자리가 성공적으로 등록되었습니다!');
      router.push('/employer/dashboard');
    } catch (error) {
      console.error('일자리 등록 실패:', error);
      alert('일자리 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 에러 제거
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h1>
          <button
            onClick={() => router.push('/login')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  if (user?.userType !== 'EMPLOYER') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">고용주만 접근 가능합니다</h1>
          <button
            onClick={() => router.push('/')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            홈으로 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">새 일자리 등록</h1>
            <p className="text-gray-600 mt-2">필요한 정보를 입력하여 일자리를 등록하세요</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 일자리 제목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                일자리 제목 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="예: 카페 바리스타 모집"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            {/* 카테고리 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카테고리 *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">카테고리를 선택하세요</option>
                {JOB_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
            </div>

            {/* 근무 위치 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                근무 위치 *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="예: 서울시 강남구 역삼동"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.location ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
            </div>

            {/* 시급 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시급 (원) *
              </label>
              <input
                type="number"
                value={formData.wage}
                onChange={(e) => handleInputChange('wage', e.target.value)}
                placeholder="9620"
                min="9620"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.wage ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">최저시급: 9,620원</p>
              {errors.wage && <p className="text-red-500 text-sm mt-1">{errors.wage}</p>}
            </div>

            {/* 근무일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                근무일 *
              </label>
              <input
                type="date"
                value={formData.workDate}
                onChange={(e) => handleInputChange('workDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.workDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.workDate && <p className="text-red-500 text-sm mt-1">{errors.workDate}</p>}
            </div>

            {/* 근무 시간 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                근무 시간 (선택사항)
              </label>
              <input
                type="text"
                value={formData.workHours}
                onChange={(e) => handleInputChange('workHours', e.target.value)}
                placeholder="예: 09:00-18:00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* 일자리 설명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                일자리 설명 *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="일자리에 대한 자세한 설명을 입력하세요"
                rows={5}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            {/* 버튼 */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                disabled={loading}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? '등록 중...' : '일자리 등록'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}