'use client'

import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100"></div>
        <div className="absolute top-10 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="text-center">
          {/* Main headline */}
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-8">
            <span className="block">나에게 딱 맞는</span>
            <span className="block text-indigo-600">원데이 알바</span>
            <span className="block">쉽고 빠르게!</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl lg:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            AI 매칭으로 스케줄에 맞는 알바를 찾고,<br />
            간편 결제로 당일 정산까지! 👑
          </p>

          {/* Key features */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="bg-white rounded-full px-6 py-3 shadow-md">
              <span className="text-sm font-medium text-gray-700">⚡ 즉시매칭</span>
            </div>
            <div className="bg-white rounded-full px-6 py-3 shadow-md">
              <span className="text-sm font-medium text-gray-700">💰 당일정산</span>
            </div>
            <div className="bg-white rounded-full px-6 py-3 shadow-md">
              <span className="text-sm font-medium text-gray-700">🛡️ 안전보장</span>
            </div>
            <div className="bg-white rounded-full px-6 py-3 shadow-md">
              <span className="text-sm font-medium text-gray-700">📱 실시간알림</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register/worker" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              🚀 알바 찾기 시작하기
            </Link>
            <Link 
              href="/register/employer" 
              className="bg-white hover:bg-gray-50 text-indigo-600 border-2 border-indigo-600 font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              💼 인력 구하기
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">10,000+</div>
              <div className="text-sm text-gray-600 mt-1">활성 사용자</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">500+</div>
              <div className="text-sm text-gray-600 mt-1">파트너 기업</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">50,000+</div>
              <div className="text-sm text-gray-600 mt-1">매칭 완료</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">98%</div>
              <div className="text-sm text-gray-600 mt-1">만족도</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}