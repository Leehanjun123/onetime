'use client'

export default function HowItWorks() {
  const steps = [
    {
      step: '01',
      title: '간편 회원가입',
      description: '5분만에 회원가입하고 프로필을 작성하세요. 스케줄과 선호 업종도 미리 설정할 수 있어요.',
      icon: '👤',
      color: 'from-blue-400 to-blue-600'
    },
    {
      step: '02',
      title: 'AI 맞춤 매칭',
      description: '인공지능이 당신의 조건, 위치, 스케줄을 분석해서 가장 적합한 알바를 추천해드려요.',
      icon: '🤖',
      color: 'from-purple-400 to-purple-600'
    },
    {
      step: '03',
      title: '즉시 지원 & 승인',
      description: '마음에 드는 알바에 원클릭 지원! 기업이 빠르게 검토하고 실시간으로 결과를 알려드려요.',
      icon: '⚡',
      color: 'from-green-400 to-green-600'
    },
    {
      step: '04',
      title: '안전한 근무',
      description: '출입 QR체크, GPS 출퇴근 인증, 실시간 알림으로 안전하고 투명하게 근무하세요.',
      icon: '🛡️',
      color: 'from-orange-400 to-orange-600'
    },
    {
      step: '05',
      title: '당일 정산',
      description: '근무 완료 즉시 급여가 계산되고, 원하는 시간에 바로 출금할 수 있어요. 수수료는 무료!',
      icon: '💰',
      color: 'from-pink-400 to-pink-600'
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            원데이는 이렇게 작동해요
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            복잡한 절차 없이 간편하게! 가입부터 정산까지 모든 과정이 자동화되어 있어요
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Timeline line - visible on larger screens */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 via-purple-400 via-green-400 via-orange-400 to-pink-400"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-4">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Step Card */}
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                  {/* Step Number */}
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${step.color} text-white font-bold text-lg flex items-center justify-center mx-auto mb-4 relative z-10`}>
                    {step.step}
                  </div>
                  
                  {/* Icon */}
                  <div className="text-4xl text-center mb-4">
                    {step.icon}
                  </div>
                  
                  {/* Content */}
                  <div className="text-center">
                    <h3 className="font-bold text-lg text-gray-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Arrow - visible on larger screens */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-24 -right-2 transform -translate-y-1/2 z-20">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              지금 시작해서 내일부터 일하세요!
            </h3>
            <p className="text-lg mb-6 opacity-90">
              회원가입 후 24시간 내에 첫 번째 알바를 매칭해드릴게요
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white hover:bg-gray-100 text-indigo-600 font-bold py-3 px-8 rounded-xl transition-colors duration-200">
                🚀 지금 시작하기
              </button>
              <button className="border-2 border-white hover:bg-white hover:text-indigo-600 text-white font-bold py-3 px-8 rounded-xl transition-colors duration-200">
                📱 앱 다운로드
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}