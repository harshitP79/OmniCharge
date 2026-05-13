import { AuthTokens, UserProfile, Operator, Plan, RechargeResponse, TransactionResponse, NotificationResponse, OperatorDetection, ApiResponse } from '../core/models/api.models';

// ============================================
// Shared API Response Wrapper
// ============================================
export function mockApiResponse<T>(data: T, success = true, message = 'Success'): ApiResponse<T> {
  return {
    success,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

// ============================================
// Auth Mocks
// ============================================
export const mockAuthTokens: AuthTokens = {
  accessToken: 'mock-access-token-12345',
  refreshToken: 'mock-refresh-token-54321',
  tokenType: 'Bearer',
  expiresIn: 3600,
  role: 'ROLE_USER',
  fullName: 'John Doe',
  email: 'john@example.com',
  isProfileComplete: true
};

// ============================================
// User Mocks
// ============================================
export const mockUserProfile: UserProfile = {
  id: 1,
  email: 'john@example.com',
  fullName: 'John Doe',
  mobileNumber: '9876543210',
  role: 'ROLE_USER',
  authProvider: 'LOCAL',
  isActive: true,
  createdDate: new Date().toISOString()
};

// ============================================
// Operator Mocks
// ============================================
export const mockOperator: Operator = {
  id: 1,
  name: 'Jio',
  code: 'JIO',
  category: 'PREPAID',
  logoUrl: 'assets/logos/jio.png',
  isActive: true,
  planCount: 15
};

export const mockOperatorDetection: OperatorDetection = {
  operatorId: 1,
  operatorName: 'Jio',
  operatorCode: 'JIO',
  logoUrl: 'assets/logos/jio.png',
  plans: [] // Mock plans added later if needed
};

// ============================================
// Plan Mocks
// ============================================
export const mockPlan: Plan = {
  id: 1,
  operatorId: 1,
  operatorName: 'Jio',
  planName: 'Daily Data Pack',
  price: 299,
  validityDays: 28,
  dataLimit: '1.5GB/day',
  callBenefit: 'Unlimited',
  smsBenefit: '100/day',
  additionalBenefits: 'Jio Apps',
  category: 'Popular',
  isActive: true
};

// ============================================
// Recharge Mocks
// ============================================
export const mockRechargeResponse: RechargeResponse = {
  id: 1,
  rechargeId: 'REC-12345',
  userId: 1,
  mobileNumber: '9876543210',
  operatorId: 1,
  operatorName: 'Jio',
  planId: 1,
  planName: 'Daily Data Pack',
  amount: 299,
  planValidityDays: 28,
  planExpiryDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'SUCCESS',
  createdDate: new Date().toISOString()
};

// ============================================
// Transaction Mocks
// ============================================
export const mockTransactionResponse: TransactionResponse = {
  id: 1,
  transactionId: 'TXN-98765',
  rechargeId: 'REC-12345',
  userId: 1,
  amount: 299,
  paymentMethod: 'UPI',
  status: 'SUCCESS',
  failureReason: '',
  razorpayOrderId: 'RPAY-ORD-111',
  userEmail: 'john@example.com',
  userMobile: '9876543210',
  mobileNumber: '9876543210',
  operatorName: 'Jio',
  planName: 'Daily Data Pack',
  createdDate: new Date().toISOString()
};

// ============================================
// Notification Mocks
// ============================================
export const mockNotificationResponse: NotificationResponse = {
  id: 1,
  userId: 1,
  type: 'EMAIL',
  category: 'PAYMENT_SUCCESS',
  subject: 'Payment Successful',
  message: 'Your recharge of ₹299 was successful.',
  status: 'SENT',
  referenceId: 'REC-12345',
  isRead: false,
  createdDate: new Date().toISOString()
};

// ============================================
// LocalStorage Mock Configuration
// ============================================
export class LocalStorageMock {
  store: { [key: string]: string } = {};

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}
