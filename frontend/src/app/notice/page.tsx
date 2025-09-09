'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function NoticePage() {
  const notices = [
    {
      id: 1,
      title: '[중요] 서비스 점검 안내 (1/15 새벽 2시-4시)',
      date: '2025-01-10',
      important: true,
      content: '서비스 안정화를 위해 시스템 점검을 진행합니다.',
    },
    {
      id: 2,
      title: '신규 기능 ‘AI 매칭’ 오픈 안내',
      date: '2025-01-08',
      important: false,
      content: 'AI가 최적의 일자리를 추천해드립니다.',
    },
    {
      id: 3,
      title: '개인정보처리방침 변경 안내',
      date: '2025-01-05',
      important: true,
      content: '개인정보보호를 위한 정책이 업데이트 되었습니다.',
    },
    {
      id: 4,
      title: '연말연시 특별 이벤트 당첨자 발표',
      date: '2025-01-02',
      important: false,
      content: '이벤트 당첨자분들께 축하드립니다.',
    },
    {
      id: 5,
      title: '새해 인사말씀',
      date: '2025-01-01',
      important: false,
      content: '2025년 새해 복 많이 받으세요!',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">공지사항</h1>

        {/* 공지사항 목록 */}
        <div className="space-y-4">
          {notices.map((notice) => (
            <Card key={notice.id} variant="elevated" className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {notice.important && (
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-semibold">
                        중요
                      </span>
                    )}
                    <h3 className="font-semibold text-gray-900">
                      {notice.title}
                    </h3>
                  </div>
                  <span className="text-sm text-gray-500">
                    {notice.date}
                  </span>
                </div>
                <p className="text-gray-600 text-sm">
                  {notice.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 페이지네이션 */}
        <div className="flex justify-center gap-2 mt-8">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            이전
          </button>
          <button className="px-4 py-2 bg-orange-600 text-white rounded-lg">
            1
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            2
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            3
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            다음
          </button>
        </div>
      </div>
    </div>
  );
}