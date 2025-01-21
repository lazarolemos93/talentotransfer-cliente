export type PaymentMethod = 'bank' | 'stripe' | 'dlocal';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface PaymentAttempt {
  id: string;
  deliveryId: string;
  method: PaymentMethod;
  amount: number;
  currency: string;
  status: PaymentStatus;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface CompanyBillingInfo {
  id: string;
  name: string;
  taxId: string;
  address: string;
  billingEmail: string;
  currency: string;
  bankDetails?: {
    accountHolder: string;
    iban: string;
    swift: string;
    bankName: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentRequest {
  deliveryId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  companyId: string;
  metadata?: Record<string, any>;
}
