'use client'

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const [errorInfo, setErrorInfo] = useState({
    code: '',
    message: '결제에 실패했습니다.',
    orderId: ''
  });

  useEffect(() => {
    const code = searchParams.get('code') || '';
    const message = searchParams.get('message') || '결제에 실패했습니다.';
    const orderId = searchParams.get('orderId') || '';

    setErrorInfo({ code, message, orderId });
  }, [searchParams]);

  const getErrorMessage = (code: string) => {
    const errorMessages: { [key: string]: string } = {
      'PAY_PROCESS_CANCELED': '사용자가 결제를 취소했습니다.',
      'PAY_PROCESS_ABORTED': '결제가 중단되었습니다.',
      'EXCEED_MAX_CARD_INSTALLMENT_PLAN': '설정 가능한 최대 할부 개월 수를 초과했습니다.',
      'EXCEED_MAX_DAILY_PAYMENT_COUNT': '일일 결제 한도를 초과했습니다.',
      'NOT_SUPPORTED_INSTALLMENT_PLAN_CARD_OR_MERCHANT': '할부가 지원되지 않는 카드 또는 가맹점입니다.',
      'INVALID_CARD_EXPIRATION': '유효하지 않은 카드 유효기간입니다.',
      'INVALID_STOPPED_CARD': '정지된 카드입니다.',
      'EXCEED_MAX_ONE_DAY_WITHDRAW_AMOUNT': '일일 출금 한도를 초과했습니다.',
      'INVALID_CARD_INSTALLMENT_PLAN': '유효하지 않은 할부 개월 수입니다.',
      'NOT_SUPPORTED_MONTHLY_INSTALLMENT_PLAN': '할부가 지원되지 않습니다.',
      'EXCEED_MAX_PAYMENT_AMOUNT': '거래금액 한도를 초과했습니다.',
      'NOT_FOUND_TERMINAL_ID': '단말기 정보를 찾을 수 없습니다.',
      'INVALID_AUTHORIZE_AUTH': '유효하지 않은 인증정보입니다.',
      'INVALID_CARD_LOST_OR_STOLEN': '분실/도난 카드입니다.',
      'RESTRICTED_TRANSFER_ACCOUNT': '출금 제한 계좌입니다.',
      'INVALID_CARD_NUMBER': '유효하지 않은 카드번호입니다.',
      'INVALID_UNREGISTERED_SUBMALL': '등록되지 않은 서브몰입니다.',
      'NOT_SUPPORTED_BANK': '지원하지 않는 은행입니다.',
      'INVALID_PASSWORD': '유효하지 않은 비밀번호입니다.',
      'INCORRECT_BASIC_AUTH': '잘못된 기본 인증 정보입니다.',
      'FDS_ERROR': 'FDS 에러가 발생했습니다.',
      'Default': '결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.'
    };

    return errorMessages[code] || errorMessages['Default'];
  };

  const getSolution = (code: string) => {
    const solutions: { [key: string]: string[] } = {
      'PAY_PROCESS_CANCELED': [
        '결제를 다시 시도해보세요.',
        '다른 결제 수단을 이용해보세요.'
      ],
      'INVALID_CARD_EXPIRATION': [
        '카드 유효기간을 다시 확인해주세요.',
        '다른 카드로 결제를 시도해보세요.'
      ],
      'INVALID_STOPPED_CARD': [
        '카드사에 문의하여 카드 상태를 확인해주세요.',
        '다른 카드를 사용해주세요.'
      ],
      'EXCEED_MAX_ONE_DAY_WITHDRAW_AMOUNT': [
        '은행에 문의하여 일일 한도를 확인해주세요.',
        '다른 결제 수단을 이용해주세요.'
      ],
      'NOT_SUPPORTED_BANK': [
        '지원되는 다른 은행 계좌를 이용해주세요.',
        '카드 결제를 시도해보세요.'
      ],
      'Default': [
        '잠시 후 다시 시도해주세요.',
        '문제가 지속되면 고객센터로 문의해주세요.'
      ]
    };

    return solutions[code] || solutions['Default'];
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">❌</span>
        </div>
        
        <h2 className="text-2xl font-bold mb-2 text-red-600">결제 실패</h2>
        <p className="text-gray-600 mb-6">{getErrorMessage(errorInfo.code)}</p>

        {errorInfo.orderId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold mb-2">주문 정보</h3>
            <div className="text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">주문번호</span>
                <span className="font-mono text-xs">{errorInfo.orderId}</span>
              </div>
              {errorInfo.code && (
                <div className="flex justify-between mt-1">
                  <span className="text-gray-600">오류 코드</span>
                  <span className="font-mono text-xs text-red-600">{errorInfo.code}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-yellow-50 rounded-lg p-4 mb-6 text-left">
          <h4 className="font-semibold text-yellow-800 mb-2">💡 해결 방법</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            {getSolution(errorInfo.code).map((solution, index) => (
              <li key={index}>• {solution}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => window.history.back()}
            className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
          >
            다시 결제하기
          </button>
          <Link
            href="/"
            className="block w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-left">
          <h4 className="font-semibold text-blue-800 mb-2">📞 고객 지원</h4>
          <p className="text-sm text-blue-700">
            결제 관련 문의는 고객센터로 연락주세요.<br/>
            <span className="font-semibold">전화: 1588-0000</span><br/>
            <span className="font-semibold">이메일: support@onetime.co.kr</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFail() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold mb-2">로딩 중...</h2>
          <p className="text-gray-600">잠시만 기다려주세요.</p>
        </div>
      </div>
    }>
      <PaymentFailContent />
    </Suspense>
  );
}