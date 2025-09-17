'use client'

import Link from 'next/link';

export default function BusinessInfoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">사업자정보확인</h1>
          
          <div className="space-y-6">
            {/* 회사 정보 */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">회사 개요</h2>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">회사명</dt>
                  <dd className="text-sm text-gray-900">(주)일데이</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">대표이사</dt>
                  <dd className="text-sm text-gray-900">홍길동</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">사업자등록번호</dt>
                  <dd className="text-sm text-gray-900">123-45-67890</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">법인등록번호</dt>
                  <dd className="text-sm text-gray-900">110111-0123456</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">설립일</dt>
                  <dd className="text-sm text-gray-900">2023년 3월 15일</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">업종</dt>
                  <dd className="text-sm text-gray-900">인력공급업, 소프트웨어 개발업</dd>
                </div>
              </dl>
            </div>

            {/* 소재지 정보 */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">소재지 정보</h2>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">본사 주소</dt>
                  <dd className="text-sm text-gray-900">
                    서울특별시 강남구 테헤란로 123, 4층 (역삼동, 일데이빌딩)
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">대표전화</dt>
                  <dd className="text-sm text-gray-900">02-1588-1234</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">팩스</dt>
                  <dd className="text-sm text-gray-900">02-1588-1235</dd>
                </div>
              </dl>
            </div>

            {/* 신고번호 */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">신고 및 허가번호</h2>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">통신판매업신고번호</dt>
                  <dd className="text-sm text-gray-900">제2025-서울강남-1234호</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">직업소개사업신고번호</dt>
                  <dd className="text-sm text-gray-900">제2025-서울강남-노-1234호</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">인력공급업신고번호</dt>
                  <dd className="text-sm text-gray-900">제2025-서울강남-인-1234호</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">개인정보보호책임자</dt>
                  <dd className="text-sm text-gray-900">김개인 (privacy@ilday.co.kr)</dd>
                </div>
              </dl>
            </div>

            {/* 외부 링크 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">외부 확인 링크</h2>
              <div className="space-y-3">
                <div>
                  <a 
                    href="http://www.ftc.go.kr/bizCommPop.do?wrkr_no=1234567890" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    공정거래위원회 사업자정보확인 
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
                <div>
                  <a 
                    href="https://www.hometax.go.kr" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    국세청 홈택스 사업자등록번호 확인
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* 마지막 업데이트 */}
            <div className="pt-6 text-center">
              <p className="text-xs text-gray-500">
                마지막 업데이트: 2025년 1월 15일
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}