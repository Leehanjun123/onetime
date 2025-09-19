'use client'

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';

interface Review {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  reviewerId: string;
  reviewerName: string;
  targetUserId: string;
  targetUserName: string;
  targetUserType: 'WORKER' | 'EMPLOYER';
  rating: number;
  comment: string;
  workQuality: number;
  communication: number;
  punctuality: number;
  safety: number;
  workDate: string;
  createdAt: string;
  isAnonymous: boolean;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
  categoryAverages: {
    workQuality: number;
    communication: number;
    punctuality: number;
    safety: number;
  };
}

export default function ReviewsPage() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myStats, setMyStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'received' | 'written'>('received');
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [newReview, setNewReview] = useState({
    jobTitle: '',
    company: '',
    targetUserName: '',
    rating: 5,
    comment: '',
    workQuality: 5,
    communication: 5,
    punctuality: 5,
    safety: 5,
    workDate: new Date().toISOString().split('T')[0],
    isAnonymous: false
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchReviews();
      fetchMyStats();
    }
  }, [isAuthenticated, selectedTab]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = selectedTab === 'received' 
        ? '/api/v1/reviews/received'
        : '/api/v1/reviews/written';
      
      const response = await fetch(`https://onetime-production.up.railway.app${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(data.data.reviews);
      } else {
        // 리뷰 시스템은 현재 개발 중입니다
        setReviews([]);
      }
    } catch (error) {
      console.error('리뷰 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://onetime-production.up.railway.app/api/v1/reviews/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMyStats(data.data);
      } else {
        // 리뷰 시스템은 현재 개발 중입니다
        setMyStats(null);
      }
    } catch (error) {
      console.error('통계 조회 실패:', error);
    }
  };

  const handleSubmitReview = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://onetime-production.up.railway.app/api/v1/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newReview,
          reviewerId: user?.id,
          reviewerName: newReview.isAnonymous ? '익명' : `${user?.firstName}${user?.lastName}`,
          targetUserType: 'EMPLOYER'
        })
      });

      if (response.ok) {
        alert('리뷰가 작성되었습니다.');
        setShowWriteModal(false);
        setNewReview({
          jobTitle: '',
          company: '',
          targetUserName: '',
          rating: 5,
          comment: '',
          workQuality: 5,
          communication: 5,
          punctuality: 5,
          safety: 5,
          workDate: new Date().toISOString().split('T')[0],
          isAnonymous: false
        });
        fetchReviews();
      } else {
        alert('리뷰 작성에 실패했습니다.');
      }
    } catch (error) {
      console.error('리뷰 작성 실패:', error);
      alert('리뷰 작성 중 오류가 발생했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg'
    };

    return (
      <div className={`flex items-center ${sizeClasses[size]}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`${
              star <= rating 
                ? 'text-yellow-400' 
                : star - 0.5 <= rating 
                  ? 'text-yellow-300' 
                  : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
        <span className="ml-2 text-gray-600 text-sm">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  const renderCategoryRating = (label: string, value: number) => (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`text-xs ${star <= value ? 'text-yellow-400' : 'text-gray-300'}`}
            >
              ★
            </span>
          ))}
        </div>
        <span className="text-xs text-gray-500 w-8">{value}</span>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h2>
          <p className="text-gray-600 mb-6">리뷰를 확인하려면 로그인해주세요.</p>
          <a 
            href="/login"
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700"
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">⭐ 평점 & 리뷰</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            일용직 작업에 대한 평가와 후기를 확인하세요
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* 내 평점 통계 */}
        {myStats && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">내 평점 통계</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-center mb-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-orange-600 mb-2">
                      {myStats.averageRating.toFixed(1)}
                    </div>
                    {renderStars(myStats.averageRating, 'lg')}
                    <div className="text-sm text-gray-500 mt-2">
                      총 {myStats.totalReviews}개의 리뷰
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-4">{rating}</span>
                      <span className="text-yellow-400">★</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{ 
                            width: `${(myStats.ratingDistribution[rating] / myStats.totalReviews) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-8">
                        {myStats.ratingDistribution[rating]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">세부 평가</h3>
                <div className="space-y-3">
                  {renderCategoryRating('작업 품질', myStats.categoryAverages.workQuality)}
                  {renderCategoryRating('소통', myStats.categoryAverages.communication)}
                  {renderCategoryRating('시간 준수', myStats.categoryAverages.punctuality)}
                  {renderCategoryRating('안전 의식', myStats.categoryAverages.safety)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 탭 선택 */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setSelectedTab('received')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  selectedTab === 'received'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                받은 리뷰
              </button>
              <button
                onClick={() => setSelectedTab('written')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  selectedTab === 'written'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                작성한 리뷰
              </button>
            </nav>
            <div className="px-6 py-3 border-b border-gray-100">
              <button
                onClick={() => setShowWriteModal(true)}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm font-medium"
              >
                + 리뷰 작성하기
              </button>
            </div>
          </div>

          {/* 리뷰 목록 */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">리뷰를 불러오는 중...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🚧</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  리뷰 시스템 개발 중
                </h3>
                <p className="text-gray-600 mb-6">
                  리뷰 및 평가 시스템이 현재 개발 중입니다. 곧 만나보실 수 있습니다.
                </p>
                <a
                  href="/jobs"
                  className="inline-block bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700"
                >
                  일자리 찾기
                </a>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {review.jobTitle}
                          </h3>
                          <span className="text-sm text-gray-500">
                            {review.company}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>
                            {selectedTab === 'received' ? '작성자' : '대상'}: {
                              review.isAnonymous ? '익명' : 
                              selectedTab === 'received' ? review.reviewerName : review.targetUserName
                            }
                          </span>
                          <span>작업일: {formatDate(review.workDate)}</span>
                          <span>작성일: {formatDate(review.createdAt)}</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {renderStars(review.rating)}
                        <div className="text-xs text-gray-500 mt-1">
                          종합 평점
                        </div>
                      </div>
                    </div>

                    {/* 세부 평가 */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{review.workQuality}</div>
                        <div className="text-xs text-gray-500">작업 품질</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{review.communication}</div>
                        <div className="text-xs text-gray-500">소통</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{review.punctuality}</div>
                        <div className="text-xs text-gray-500">시간 준수</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{review.safety}</div>
                        <div className="text-xs text-gray-500">안전 의식</div>
                      </div>
                    </div>

                    {/* 리뷰 내용 */}
                    <div className="bg-white p-4 rounded-lg border border-gray-100">
                      <p className="text-gray-700 leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-3">⭐ 리뷰 시스템 안내</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• 작업 완료 후 <strong>48시간 이내</strong>에 서로 리뷰를 작성할 수 있습니다</p>
            <p>• 리뷰는 <strong>작업 품질, 소통, 시간 준수, 안전 의식</strong> 4가지 항목으로 평가됩니다</p>
            <p>• 높은 평점을 유지하면 <strong>더 많은 일자리 기회</strong>를 얻을 수 있습니다</p>
            <p>• <strong>정직하고 건설적인 리뷰</strong>를 작성해 건전한 플랫폼 문화를 만들어주세요</p>
          </div>
        </div>
      </div>

      {/* 리뷰 작성 모달 */}
      {showWriteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">리뷰 작성하기</h2>
                <button
                  onClick={() => setShowWriteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSubmitReview(); }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      작업명
                    </label>
                    <input
                      type="text"
                      value={newReview.jobTitle}
                      onChange={(e) => setNewReview({...newReview, jobTitle: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      회사명
                    </label>
                    <input
                      type="text"
                      value={newReview.company}
                      onChange={(e) => setNewReview({...newReview, company: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      평가 대상
                    </label>
                    <input
                      type="text"
                      value={newReview.targetUserName}
                      onChange={(e) => setNewReview({...newReview, targetUserName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      작업일
                    </label>
                    <input
                      type="date"
                      value={newReview.workDate}
                      onChange={(e) => setNewReview({...newReview, workDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                </div>

                {/* 세부 평가 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    세부 평가 (1-5점)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'workQuality', label: '작업 품질' },
                      { key: 'communication', label: '소통' },
                      { key: 'punctuality', label: '시간 준수' },
                      { key: 'safety', label: '안전 의식' }
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{label}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={newReview[key as keyof typeof newReview] as number}
                            onChange={(e) => setNewReview({...newReview, [key]: parseInt(e.target.value)})}
                            className="w-20"
                          />
                          <span className="text-sm font-medium w-4">
                            {newReview[key as keyof typeof newReview] as number}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 종합 평점 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    종합 평점
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.5"
                      value={newReview.rating}
                      onChange={(e) => setNewReview({...newReview, rating: parseFloat(e.target.value)})}
                      className="flex-1"
                    />
                    <span className="font-medium">{newReview.rating}점</span>
                  </div>
                </div>

                {/* 리뷰 내용 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    리뷰 내용
                  </label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={4}
                    placeholder="작업 경험을 상세히 작성해주세요..."
                    required
                  />
                </div>

                {/* 익명 옵션 */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={newReview.isAnonymous}
                      onChange={(e) => setNewReview({...newReview, isAnonymous: e.target.checked})}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label htmlFor="anonymous" className="text-sm font-medium text-gray-700">
                      익명으로 리뷰 작성하기
                    </label>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    익명으로 작성하면 리뷰에서 내 이름이 '익명'으로 표시됩니다.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowWriteModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                  >
                    리뷰 작성
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}