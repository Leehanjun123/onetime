'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function EventsPage() {
  const events = [
    {
      id: 1,
      title: '🎉 신규 회원 가입 이벤트',
      description: '지금 가입하면 5만원 상당 포인트 증정!',
      period: '2025.01.01 - 2025.01.31',
      status: 'ongoing',
      badge: 'HOT',
    },
    {
      id: 2,
      title: '💰 당일정산 프리미엄 서비스',
      description: '프리미엄 가입시 당일정산 수수료 무료',
      period: '상시 진행',
      status: 'ongoing',
      badge: 'NEW',
    },
    {
      id: 3,
      title: '⭐ 베스트 근로자 선발',
      description: '매월 베스트 근로자 10명 선발, 10만원 상품권',
      period: '매월 말일 발표',
      status: 'ongoing',
      badge: null,
    },
    {
      id: 4,
      title: '🎁 친구 추천 이벤트',
      description: '친구 추천시 두 비동시 3만원 포인트',
      period: '2024.12.01 - 2024.12.31',
      status: 'ended',
      badge: null,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">이벤트</h1>

        {/* 진행중 이벤트 */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">🔥 진행중인 이벤트</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events
              .filter(event => event.status === 'ongoing')
              .map((event) => (
                <Card key={event.id} variant="elevated" className="hover:shadow-xl transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      {event.badge && (
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          event.badge === 'HOT' 
                            ? 'bg-red-100 text-red-600' 
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {event.badge}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-3">{event.description}</p>
                    <p className="text-sm text-gray-500 mb-4">{event.period}</p>
                    <Button variant="default" fullWidth size="sm">
                      참여하기
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        {/* 종료된 이벤트 */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-gray-600">종료된 이벤트</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events
              .filter(event => event.status === 'ended')
              .map((event) => (
                <Card key={event.id} variant="default" className="opacity-60">
                  <CardHeader>
                    <CardTitle className="text-lg line-through">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-3">{event.description}</p>
                    <p className="text-sm text-gray-500">{event.period}</p>
                    <div className="mt-4 text-center text-gray-500 font-semibold">
                      종료됨
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        {/* 이벤트 안내 */}
        <Card variant="gradient" className="mt-8">
          <CardContent className="p-6 text-white">
            <h3 className="text-xl font-bold mb-3">🎆 이벤트 참여 안내</h3>
            <ul className="space-y-2 text-sm">
              <li>• 모든 이벤트는 일데이 회원만 참여 가능합니다</li>
              <li>• 이벤트 중복 참여는 불가능합니다</li>
              <li>• 부정 참여 시 혜택이 회수될 수 있습니다</li>
              <li>• 자세한 내용은 각 이벤트 상세 페이지를 확인해주세요</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}