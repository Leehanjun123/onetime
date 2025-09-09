'use client'

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface PaymentData {
  paymentKey: string;
  orderId: string;
  amount: number;
  orderName: string;
  method: string;
  approvedAt: string;
}

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');

    if (!paymentKey || !orderId || !amount) {
      setError('결제 정보가 올바르지 않습니다.');
      setLoading(false);
      return;
    }

    verifyPayment(paymentKey, orderId, parseInt(amount));
  }, [searchParams]);

  const verifyPayment = async (paymentKey: string, orderId: string, amount: number) => {
    try {
      const response = await fetch('https://onetime-production.up.railway.app/api/v1/payment/toss/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount
        })
      });

      const data = await response.json();

      if (data.success) {
        setPaymentData(data.data);
      } else {
        setError(data.message || '결제 승인에 실패했습니다.');
      }
    } catch (error) {
      console.error('결제 승인 실패:', error);
      setError('결제 승인 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold mb-2">결제 승인 중...</h2>
          <p className="text-gray-600">잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h2 className="text-xl font-bold mb-2 text-red-600">결제 실패</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Link
              href="/payment/retry"
              className="block w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              다시 결제하기
            </Link>
            <Link
              href="/"
              className="block w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✅</span>
        </div>
        
        <h2 className="text-2xl font-bold mb-2 text-green-600">결제 완료!</h2>
        <p className="text-gray-600 mb-6">결제가 성공적으로 완료되었습니다.</p>

        {paymentData && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold mb-3">결제 정보</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">주문명</span>
                <span className="font-medium">{paymentData.orderName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">주문번호</span>
                <span className="font-mono text-xs">{paymentData.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">결제금액</span>
                <span className="font-semibold text-orange-600">
                  {new Intl.NumberFormat('ko-KR', {
                    style: 'currency',
                    currency: 'KRW'
                  }).format(paymentData.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">결제수단</span>
                <span>{paymentData.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">승인시간</span>
                <span>{new Date(paymentData.approvedAt).toLocaleString('ko-KR')}</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/jobs/my-applications"
            className="block w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
          >
            내 지원 현황 보기
          </Link>
          <Link
            href="/"
            className="block w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-left">
          <h4 className="font-semibold text-blue-800 mb-2">📧 결제 완료 안내</h4>
          <p className="text-sm text-blue-700">
            결제 완료 안내 문자와 이메일이 발송됩니다.<br/>
            결제 관련 문의는 고객센터(1588-0000)로 연락주세요.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
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
      <PaymentSuccessContent />
    </Suspense>
  );
}