'use client'

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-1">
            <h3 className="text-2xl font-bold text-white mb-4">
              일데이
            </h3>
            <p className="text-gray-300 mb-6">
              AI 기술로 더 스마트하고 안전한 아르바이트 매칭 플랫폼
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Instagram</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.348-1.051-2.348-2.348 0-1.297 1.051-2.348 2.348-2.348 1.297 0 2.348 1.051 2.348 2.348 0 1.297-1.051 2.348-2.348 2.348zm7.718 0c-1.297 0-2.348-1.051-2.348-2.348 0-1.297 1.051-2.348 2.348-2.348 1.297 0 2.348 1.051 2.348 2.348 0 1.297-1.051 2.348-2.348 2.348z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">서비스</h4>
            <ul className="space-y-3">
              <li><Link href="/jobs" className="text-gray-300 hover:text-white transition-colors">구인공고</Link></li>
              <li><Link href="/companies" className="text-gray-300 hover:text-white transition-colors">기업정보</Link></li>
              <li><Link href="/community" className="text-gray-300 hover:text-white transition-colors">커뮤니티</Link></li>
              <li><Link href="/events" className="text-gray-300 hover:text-white transition-colors">이벤트</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4">고객지원</h4>
            <ul className="space-y-3">
              <li><Link href="/support" className="text-gray-300 hover:text-white transition-colors">고객센터</Link></li>
              <li><Link href="/faq" className="text-gray-300 hover:text-white transition-colors">자주하는질문</Link></li>
              <li><Link href="/notice" className="text-gray-300 hover:text-white transition-colors">공지사항</Link></li>
              <li><Link href="/contact" className="text-gray-300 hover:text-white transition-colors">문의하기</Link></li>
            </ul>
          </div>

          {/* Contact & App */}
          <div>
            <h4 className="text-lg font-semibold mb-4">다운로드</h4>
            <div className="space-y-3">
              <a href="#" className="flex items-center text-gray-300 hover:text-white transition-colors">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center mr-3">
                  🍎
                </div>
                App Store
              </a>
              <a href="#" className="flex items-center text-gray-300 hover:text-white transition-colors">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                  🤖
                </div>
                Google Play
              </a>
            </div>
            
            <div className="mt-6">
              <h5 className="font-semibold mb-2">고객센터</h5>
              <p className="text-gray-300">📞 1588-1234</p>
              <p className="text-gray-300 text-sm">평일 9:00-18:00</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-wrap justify-center md:justify-start space-x-6 mb-4 md:mb-0">
              <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                이용약관
              </Link>
              <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors font-semibold">
                개인정보처리방침
              </Link>
              <Link href="/business" className="text-gray-400 hover:text-white text-sm transition-colors">
                사업자정보확인
              </Link>
            </div>
            <div className="text-gray-400 text-sm">
              © 2025 일데이. All rights reserved.
            </div>
          </div>
          
          <div className="mt-4 text-center md:text-left">
            <p className="text-gray-500 text-xs">
              (주)일데이 | 대표이사: 홍길동 | 사업자등록번호: 123-45-67890<br />
              서울특별시 강남구 테헤란로 123, 4층 | 통신판매업신고번호: 2025-서울강남-1234
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}