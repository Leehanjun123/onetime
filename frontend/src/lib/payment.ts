'use client'

import { v4 as uuidv4 } from 'uuid';

// 결제 정보 타입
export interface PaymentInfo {
  orderId: string;
  orderName: string;
  amount: number;
  customerName?: string;
  customerEmail?: string;
  customerMobilePhone?: string;
  jobId?: string;
  employerId?: string;
  workerId?: string;
}

// 결제 결과 타입
export interface PaymentResult {
  success: boolean;
  paymentKey?: string;
  orderId?: string;
  amount?: number;
  method?: string;
  error?: string;
  code?: string;
}

// 토스페이먼츠 설정
const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';

// 카카오페이 설정
const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;

class PaymentService {
  private tossPayments: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeTossPayments();
    }
  }

  private async initializeTossPayments() {
    try {
      // 토스페이먼츠 SDK 동적 로드
      if (!window.TossPayments) {
        await this.loadTossPaymentsScript();
      }
      this.tossPayments = window.TossPayments(TOSS_CLIENT_KEY);
    } catch (error) {
      console.error('토스페이먼츠 초기화 실패:', error);
    }
  }

  private loadTossPaymentsScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src*="tosspayments"]')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.tosspayments.com/v1/payment';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('토스페이먼츠 스크립트 로드 실패'));
      document.head.appendChild(script);
    });
  }

  // 토스페이먼츠 카드 결제
  async payWithTossCard(paymentInfo: PaymentInfo): Promise<PaymentResult> {
    try {
      if (!this.tossPayments) {
        await this.initializeTossPayments();
      }

      const result = await this.tossPayments.requestPayment('카드', {
        amount: paymentInfo.amount,
        orderId: paymentInfo.orderId,
        orderName: paymentInfo.orderName,
        customerName: paymentInfo.customerName,
        customerEmail: paymentInfo.customerEmail,
        customerMobilePhone: paymentInfo.customerMobilePhone,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });

      return {
        success: true,
        ...result
      };
    } catch (error: any) {
      console.error('토스페이먼츠 카드 결제 실패:', error);
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  // 토스페이먼츠 계좌이체
  async payWithTossTransfer(paymentInfo: PaymentInfo): Promise<PaymentResult> {
    try {
      if (!this.tossPayments) {
        await this.initializeTossPayments();
      }

      const result = await this.tossPayments.requestPayment('계좌이체', {
        amount: paymentInfo.amount,
        orderId: paymentInfo.orderId,
        orderName: paymentInfo.orderName,
        customerName: paymentInfo.customerName,
        customerEmail: paymentInfo.customerEmail,
        customerMobilePhone: paymentInfo.customerMobilePhone,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });

      return {
        success: true,
        ...result
      };
    } catch (error: any) {
      console.error('토스페이먼츠 계좌이체 실패:', error);
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  // 카카오페이 결제
  async payWithKakaoPay(paymentInfo: PaymentInfo): Promise<PaymentResult> {
    try {
      // 카카오페이는 백엔드 API를 통해 처리
      const response = await fetch('/api/v1/payment/kakaopay/ready', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          cid: 'TC0ONETIME',
          partner_order_id: paymentInfo.orderId,
          partner_user_id: paymentInfo.employerId || paymentInfo.workerId,
          item_name: paymentInfo.orderName,
          quantity: 1,
          total_amount: paymentInfo.amount,
          vat_amount: Math.floor(paymentInfo.amount / 11),
          tax_free_amount: 0,
          approval_url: `${window.location.origin}/payment/kakao/success`,
          fail_url: `${window.location.origin}/payment/kakao/fail`,
          cancel_url: `${window.location.origin}/payment/kakao/cancel`,
        })
      });

      const data = await response.json();

      if (data.success) {
        // 카카오페이 결제 페이지로 리다이렉트
        window.location.href = data.data.next_redirect_pc_url;
        return { success: true };
      } else {
        throw new Error(data.message || '카카오페이 결제 준비 실패');
      }
    } catch (error: any) {
      console.error('카카오페이 결제 실패:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 네이버페이 결제 (추후 확장)
  async payWithNaverPay(paymentInfo: PaymentInfo): Promise<PaymentResult> {
    // TODO: 네이버페이 구현
    return {
      success: false,
      error: '네이버페이는 준비 중입니다'
    };
  }

  // 결제 검증
  async verifyPayment(paymentKey: string, orderId: string, amount: number): Promise<boolean> {
    try {
      const response = await fetch('/api/v1/payment/verify', {
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
      return data.success;
    } catch (error) {
      console.error('결제 검증 실패:', error);
      return false;
    }
  }

  // 주문 ID 생성
  generateOrderId(prefix: string = 'ORDER'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}_${timestamp}_${random}`;
  }

  // 결제 금액 포맷
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  }

  // 수수료 계산
  calculateFee(amount: number, feeRate: number = 0.033): number {
    return Math.floor(amount * feeRate);
  }
}

// PaymentService 싱글톤 인스턴스
export const paymentService = new PaymentService();

// 전역 타입 선언
declare global {
  interface Window {
    TossPayments: any;
    Kakao: any;
  }
}