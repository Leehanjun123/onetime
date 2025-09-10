'use client'

import { useState } from 'react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  contractInfo: {
    title: string;
    date: string;
    otherPartyName: string;
    userType: 'WORKER' | 'EMPLOYER';
  };
  onSubmit: (review: any) => void;
}

const reviewTags = {
  WORKER: [
    '성실함', '숙련됨', '시간엄수', '깔끔함', '친절함', 
    '전문적', '빠른작업', '꼼꼼함', '협조적', '책임감'
  ],
  EMPLOYER: [
    '정확한설명', '약속준수', '친절함', '정산빠름', '작업환경좋음',
    '명확한지시', '협조적', '전문적', '안전중시', '공정함'
  ]
};

export default function ReviewModal({ isOpen, onClose, contractId, contractInfo, onSubmit }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [detailRatings, setDetailRatings] = useState({
    punctuality: 5,
    workQuality: 5,
    communication: 5,
    attitude: 5
  });
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const tags = contractInfo.userType === 'WORKER' ? reviewTags.EMPLOYER : reviewTags.WORKER;

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const reviewData = {
        contractId,
        rating,
        punctuality: detailRatings.punctuality,
        workQuality: detailRatings.workQuality,
        communication: detailRatings.communication,
        attitude: detailRatings.attitude,
        comment,
        tags: selectedTags
      };

      const response = await fetch('http://localhost:4000/api/v1/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(reviewData)
      });

      const data = await response.json();
      
      if (data.success) {
        alert('리뷰가 익명으로 등록되었습니다.');
        onSubmit(reviewData);
        onClose();
      } else {
        alert(data.message || '리뷰 등록 실패');
      }
    } catch (error) {
      console.error('리뷰 제출 오류:', error);
      alert('리뷰 제출 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, size = 'lg' }: any) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`${size === 'lg' ? 'text-3xl' : 'text-xl'} transition-colors`}
          >
            <span className={star <= value ? 'text-yellow-500' : 'text-gray-300'}>
              ★
            </span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-indigo-600 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">익명 리뷰 작성</h2>
              <p className="text-indigo-100">
                {contractInfo.title} - {contractInfo.date}
              </p>
              <p className="text-sm text-indigo-200 mt-1">
                대상: {contractInfo.otherPartyName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-indigo-200 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 익명성 안내 */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🔒</span>
              <div>
                <p className="text-blue-800 font-medium">완전 익명 보장</p>
                <p className="text-blue-600 text-sm">
                  귀하의 신원은 절대 공개되지 않습니다. 솔직한 평가를 남겨주세요.
                </p>
              </div>
            </div>
          </div>

          {/* 종합 평점 */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">종합 평점</h3>
            <div className="flex items-center gap-4">
              <StarRating value={rating} onChange={setRating} size="lg" />
              <span className="text-2xl font-bold text-gray-700">{rating}.0</span>
            </div>
          </div>

          {/* 세부 평점 */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">세부 평가</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 w-24">시간 준수</span>
                <StarRating 
                  value={detailRatings.punctuality} 
                  onChange={(v: number) => setDetailRatings(prev => ({ ...prev, punctuality: v }))}
                  size="sm"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 w-24">작업 품질</span>
                <StarRating 
                  value={detailRatings.workQuality} 
                  onChange={(v: number) => setDetailRatings(prev => ({ ...prev, workQuality: v }))}
                  size="sm"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 w-24">의사소통</span>
                <StarRating 
                  value={detailRatings.communication} 
                  onChange={(v: number) => setDetailRatings(prev => ({ ...prev, communication: v }))}
                  size="sm"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 w-24">태도/매너</span>
                <StarRating 
                  value={detailRatings.attitude} 
                  onChange={(v: number) => setDetailRatings(prev => ({ ...prev, attitude: v }))}
                  size="sm"
                />
              </div>
            </div>
          </div>

          {/* 태그 선택 */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              키워드 선택 <span className="text-sm font-normal text-gray-500">(최대 5개)</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  disabled={!selectedTags.includes(tag) && selectedTags.length >= 5}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 상세 리뷰 */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              상세 리뷰 <span className="text-sm font-normal text-gray-500">(선택)</span>
            </h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="작업 경험에 대한 솔직한 평가를 남겨주세요. (최대 500자)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-sm text-gray-500 mt-1 text-right">
              {comment.length}/500
            </p>
          </div>

          {/* 주의사항 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">📌 리뷰 작성 가이드</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 객관적이고 공정한 평가를 부탁드립니다</li>
              <li>• 욕설이나 비방은 자제해 주세요</li>
              <li>• 개인정보는 절대 포함하지 마세요</li>
              <li>• 한 번 작성한 리뷰는 수정할 수 없습니다</li>
            </ul>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-6 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-3 px-6 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 font-medium"
            >
              {isSubmitting ? '제출 중...' : '익명으로 리뷰 등록'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}