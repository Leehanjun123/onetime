'use client'

import { useState } from 'react';
import PaymentModal from '@/components/PaymentModal';
import { PaymentInfo, PaymentResult, paymentService } from '@/lib/payment';

export default function PaymentTest() {
  const [showModal, setShowModal] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    orderId: '',
    orderName: '',
    amount: 0,
    customerName: '김철수',
    customerEmail: 'test@example.com',
    customerMobilePhone: '010-1234-5678'
  });
  const [result, setResult] = useState<string>('');

  const testCases = [
    {
      name: '일자리 지원 수수료',
      amount: 5000,
      description: '아파트 전기 배선 작업 지원 수수료'
    },
    {
      name: '긴급 일자리 수수료',
      amount: 10000,
      description: '당일 긴급 일자리 우선 매칭 수수료'
    },
    {
      name: '프리미엄 매칭 서비스',
      amount: 20000,
      description: '1주일 프리미엄 매칭 서비스 이용료'
    },
    {
      name: '고액 결제 테스트',
      amount: 100000,
      description: '한 달 프리미엄 플랜 결제'
    }
  ];

  const handleTestPayment = (testCase: typeof testCases[0]) => {
    const orderId = paymentService.generateOrderId('TEST');
    
    setPaymentInfo({
      orderId,
      orderName: testCase.description,
      amount: testCase.amount,
      customerName: '김철수',
      customerEmail: 'test@onetime.co.kr',
      customerMobilePhone: '010-1234-5678'
    });
    
    setShowModal(true);
  };

  const handlePaymentSuccess = (paymentResult: PaymentResult) => {
    setResult(`✅ 결제 성공!\n${JSON.stringify(paymentResult, null, 2)}`);
    setShowModal(false);
  };

  const handlePaymentFail = (error: string) => {
    setResult(`❌ 결제 실패: ${error}`);
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h1 className="text-3xl font-bold mb-2">💳 결제 시스템 테스트</h1>
          <p className="text-gray-600 mb-8">
            토스페이먼츠와 카카오페이를 이용한 결제 시스템을 테스트해보세요.
          </p>

          {/* 테스트 안내 */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h2 className="font-semibold text-blue-800 mb-3">🔍 테스트 안내</h2>
            <ul className="text-sm text-blue-700 space-y-2">
              <li>• <strong>토스페이먼츠</strong>: 테스트 모드로 실제 결제되지 않습니다</li>
              <li>• <strong>테스트 카드번호</strong>: 4242-4242-4242-4242 (유효기간: 12/25, CVC: 123)</li>
              <li>• <strong>카카오페이</strong>: 샌드박스 환경에서 테스트됩니다</li>
              <li>• 결제 완료 후 성공/실패 페이지로 이동합니다</li>
            </ul>
          </div>

          {/* 테스트 케이스들 */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {testCases.map((testCase, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6 hover:border-orange-300 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{testCase.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{testCase.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-600">
                      {paymentService.formatAmount(testCase.amount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      +수수료 {paymentService.formatAmount(paymentService.calculateFee(testCase.amount))}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleTestPayment(testCase)}
                  className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                >
                  결제 테스트하기
                </button>
              </div>
            ))}
          </div>

          {/* 결과 표시 영역 */}
          {result && (
            <div className="bg-gray-900 text-green-400 p-6 rounded-lg font-mono text-sm overflow-x-auto">
              <h3 className="text-white font-semibold mb-3">💬 결제 결과</h3>
              <pre className="whitespace-pre-wrap">{result}</pre>
              <button
                onClick={() => setResult('')}
                className="mt-4 bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                결과 지우기
              </button>
            </div>
          )}

          {/* 기능 설명 */}
          <div className="mt-12 space-y-6">
            <h2 className="text-2xl font-bold">🚀 구현된 기능</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
                <div className="text-3xl mb-3">💳</div>
                <h3 className="font-semibold mb-2">토스페이먼츠</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• 신용/체크카드</li>
                  <li>• 계좌이체</li>
                  <li>• 간편결제</li>
                  <li>• 결제 승인/취소</li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-lg">
                <div className="text-3xl mb-3">💛</div>
                <h3 className="font-semibold mb-2">카카오페이</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• QR 코드 결제</li>
                  <li>• 카카오 간편결제</li>
                  <li>• 모바일 최적화</li>
                  <li>• 결제 준비 API</li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
                <div className="text-3xl mb-3">🔒</div>
                <h3 className="font-semibold mb-2">보안 & 관리</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• 결제 정보 암호화</li>
                  <li>• 거래 내역 추적</li>
                  <li>• 환불/취소 처리</li>
                  <li>• 실시간 알림</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 결제 모달 */}
      <PaymentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        paymentInfo={paymentInfo}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentFail={handlePaymentFail}
      />
    </div>
  );
}