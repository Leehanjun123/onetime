'use client'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          {/* 건설 테마 로딩 애니메이션 */}
          <div className="w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-orange-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-4 border-red-400 border-b-transparent rounded-full animate-spin-reverse"></div>
          </div>
          
          {/* 건설 아이콘 애니메이션 */}
          <div className="flex justify-center space-x-2 mb-4">
            <span className="text-2xl animate-bounce" style={{ animationDelay: '0ms' }}>🔨</span>
            <span className="text-2xl animate-bounce" style={{ animationDelay: '150ms' }}>👷</span>
            <span className="text-2xl animate-bounce" style={{ animationDelay: '300ms' }}>🏗️</span>
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          일자리를 찾는 중...
        </h2>
        
        <p className="text-gray-600">
          잠시만 기다려주세요
        </p>
        
        {/* 프로그레스 바 */}
        <div className="mt-6 w-48 mx-auto">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full animate-progress"></div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }
        
        @keyframes progress {
          0% {
            width: 0%;
            margin-left: 0%;
          }
          50% {
            width: 60%;
            margin-left: 0%;
          }
          100% {
            width: 30%;
            margin-left: 70%;
          }
        }
        
        .animate-spin-reverse {
          animation: spin-reverse 1.5s linear infinite;
        }
        
        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}