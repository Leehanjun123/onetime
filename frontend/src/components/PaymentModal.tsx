'use client'

import { useState } from 'react';
import { paymentService, PaymentInfo, PaymentResult } from '@/lib/payment';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentInfo: PaymentInfo;
  onPaymentSuccess: (result: PaymentResult) => void;
  onPaymentFail: (error: string) => void;
}

type PaymentMethod = 'toss_card' | 'toss_transfer' | 'kakao' | 'naver';

export default function PaymentModal({
  isOpen,
  onClose,
  paymentInfo,
  onPaymentSuccess,
  onPaymentFail
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('toss_card');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePayment = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    
    try {
      let result: PaymentResult;

      switch (selectedMethod) {
        case 'toss_card':
          result = await paymentService.payWithTossCard(paymentInfo);
          break;
        case 'toss_transfer':
          result = await paymentService.payWithTossTransfer(paymentInfo);
          break;
        case 'kakao':
          result = await paymentService.payWithKakaoPay(paymentInfo);
          break;
        case 'naver':
          result = await paymentService.payWithNaverPay(paymentInfo);
          break;
        default:
          throw new Error('지원하지 않는 결제 방법입니다.');
      }

      if (result.success) {
        onPaymentSuccess(result);
      } else {
        onPaymentFail(result.error || '결제에 실패했습니다.');
      }
    } catch (error: any) {
      onPaymentFail(error.message || '결제 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const feeAmount = paymentService.calculateFee(paymentInfo.amount);
  const totalAmount = paymentInfo.amount + feeAmount;

  const paymentMethods = [
    {
      id: 'toss_card' as PaymentMethod,
      name: '신용/체크카드',
      icon: '💳',
      description: '토스페이먼츠',
      available: true
    },
    {
      id: 'toss_transfer' as PaymentMethod,
      name: '계좌이체',
      icon: '🏦',
      description: '토스페이먼츠',
      available: true
    },
    {
      id: 'kakao' as PaymentMethod,
      name: '카카오페이',
      icon: '💛',
      description: '간편결제',
      available: true
    },
    {
      id: 'naver' as PaymentMethod,
      name: '네이버페이',
      icon: '🟢',
      description: '준비 중',
      available: false
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">결제하기</h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-gray-600 text-2xl disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* 결제 정보 */}
        <div className="p-6 border-b bg-gray-50">
          <h3 className="font-semibold text-lg mb-2">{paymentInfo.orderName}</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>결제 금액</span>
              <span>{paymentService.formatAmount(paymentInfo.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span>수수료 (3.3%)</span>
              <span>{paymentService.formatAmount(feeAmount)}</span>
            </div>
            <div className="flex justify-between font-semibold text-black text-base pt-2 border-t">
              <span>총 결제금액</span>
              <span className="text-orange-600">{paymentService.formatAmount(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* 결제 방법 선택 */}
        <div className="p-6">
          <h4 className="font-semibold mb-4">결제 방법을 선택하세요</h4>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                disabled={!method.available || isProcessing}
                className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-colors ${
                  selectedMethod === method.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${
                  !method.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <span className="text-2xl">{method.icon}</span>
                <div className="flex-1 text-left">
                  <div className="font-medium">{method.name}</div>
                  <div className="text-sm text-gray-500">{method.description}</div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 ${
                  selectedMethod === method.id
                    ? 'border-orange-500 bg-orange-500'
                    : 'border-gray-300'
                }`}>
                  {selectedMethod === method.id && (
                    <div className="w-full h-full rounded-full bg-white border-2 border-orange-500"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 결제 버튼 */}
        <div className="p-6 pt-0">
          <button
            onClick={handlePayment}
            disabled={isProcessing || !paymentMethods.find(m => m.id === selectedMethod)?.available}
            className="w-full bg-orange-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                결제 처리 중...
              </div>
            ) : (
              `${paymentService.formatAmount(totalAmount)} 결제하기`
            )}
          </button>
          
          <div className="mt-4 text-xs text-gray-500 text-center">
            • 결제 정보는 안전하게 암호화되어 처리됩니다<br/>
            • 결제 완료 후 취소/환불은 고객센터를 통해 처리됩니다
          </div>
        </div>
      </div>
    </div>
  );
}