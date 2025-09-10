import { PaymentStatus } from './common';

export interface Payment {
  id: string;
  jobId: string;
  payerId: string;
  payeeId: string;
  amount: number;
  fee: number;
  netAmount: number;
  currency: string;
  paymentMethod: string;
  status: PaymentStatus;
  transactionId?: string;
  failureReason?: string;
  processedAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentRequest {
  jobId: string;
  payeeId: string;
  amount: number;
  paymentMethod: string;
  description?: string;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  type: 'CARD' | 'BANK_ACCOUNT' | 'E_WALLET';
  provider: string;
  lastFour: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
}

export interface BankAccount {
  id: string;
  userId: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  accountHolder: string;
  isVerified: boolean;
  isDefault: boolean;
  createdAt: Date;
}

export interface Settlement {
  id: string;
  userId: string;
  amount: number;
  fee: number;
  netAmount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  scheduledDate: Date;
  completedDate?: Date;
  failureReason?: string;
  paymentIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentStats {
  totalEarned: number;
  totalPaid: number;
  pendingPayments: number;
  completedPayments: number;
  failedPayments: number;
  monthlyEarnings: Record<string, number>;
  paymentMethods: number;
}

export interface TransactionHistory {
  id: string;
  userId: string;
  type: 'PAYMENT_RECEIVED' | 'PAYMENT_SENT' | 'SETTLEMENT' | 'REFUND' | 'FEE';
  amount: number;
  currency: string;
  description: string;
  relatedId?: string;
  status: PaymentStatus;
  createdAt: Date;
}