'use client'

export default function FeaturedJobs() {
  const featuredJobs = [
    {
      id: 1,
      title: '스타벅스 바리스타',
      company: '스타벅스 강남역점',
      location: '서울 강남구',
      hourlyPay: '10,000',
      duration: '4시간',
      date: '오늘',
      tags: ['당일정산', '즉시매칭'],
      urgent: true,
      image: '☕'
    },
    {
      id: 2,
      title: '편의점 야간 알바',
      company: 'CU 편의점',
      location: '서울 홍대',
      hourlyPay: '11,500',
      duration: '8시간',
      date: '내일',
      tags: ['야간수당', '장기가능'],
      urgent: false,
      image: '🏪'
    },
    {
      id: 3,
      title: '배달라이더 (오토바이)',
      company: '배달의민족',
      location: '서울 전지역',
      hourlyPay: '15,000',
      duration: '자유',
      date: '상시',
      tags: ['고수익', '자유근무'],
      urgent: true,
      image: '🏍️'
    },
    {
      id: 4,
      title: '이벤트 도우미',
      company: '프로모션 에이전시',
      location: '코엑스',
      hourlyPay: '12,000',
      duration: '6시간',
      date: '주말',
      tags: ['단기', '높은시급'],
      urgent: false,
      image: '🎪'
    },
    {
      id: 5,
      title: '카페 홀서빙',
      company: '투썸플레이스',
      location: '서울 신촌',
      hourlyPay: '9,620',
      duration: '4시간',
      date: '평일',
      tags: ['주3일', '유연근무'],
      urgent: false,
      image: '🥤'
    },
    {
      id: 6,
      title: '패스트푸드 주방 보조',
      company: '맥도날드',
      location: '서울 잠실',
      hourlyPay: '10,500',
      duration: '5시간',
      date: '매일',
      tags: ['빠른적응', '팀워크'],
      urgent: true,
      image: '🍔'
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            🔥 인기 급상승 알바
          </h2>
          <p className="text-lg text-gray-600">
            지금 가장 많이 지원하는 인기 알바를 확인하세요
          </p>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredJobs.map((job) => (
            <div 
              key={job.id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer"
            >
              {/* Job Card Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="text-3xl mr-3">{job.image}</div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-1">
                        {job.title}
                        {job.urgent && (
                          <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            긴급
                          </span>
                        )}
                      </h3>
                      <p className="text-gray-600 text-sm">{job.company}</p>
                    </div>
                  </div>
                </div>

                {/* Job Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {job.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {job.duration} • {job.date}
                  </div>
                </div>

                {/* Pay and Tags */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-2xl font-bold text-indigo-600">
                    시급 {job.hourlyPay}원
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {job.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="bg-indigo-100 text-indigo-800 text-xs px-3 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Action Button */}
                <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors duration-200">
                  지원하기
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* View More Button */}
        <div className="text-center mt-12">
          <button className="bg-white hover:bg-gray-50 text-indigo-600 border-2 border-indigo-600 font-bold py-3 px-8 rounded-lg transition-colors duration-200">
            더 많은 알바 보기 →
          </button>
        </div>
      </div>
    </section>
  );
}