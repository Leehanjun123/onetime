import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <span className="text-9xl">🚧</span>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          404 - 페이지를 찾을 수 없습니다
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
          공사 중인 페이지일 수도 있어요!
        </p>
        
        <div className="space-y-4">
          <Link
            href="/"
            className="block w-full bg-orange-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-700 transition-colors"
          >
            🏠 홈으로 돌아가기
          </Link>
          
          <Link
            href="/jobs"
            className="block w-full bg-white text-orange-600 py-3 px-6 rounded-lg font-medium border-2 border-orange-600 hover:bg-orange-50 transition-colors"
          >
            💼 일자리 둘러보기
          </Link>
        </div>
        
        <div className="mt-12 text-sm text-gray-500">
          <p>도움이 필요하신가요?</p>
          <p className="font-medium text-orange-600">1588-1234</p>
        </div>
      </div>
    </div>
  );
}