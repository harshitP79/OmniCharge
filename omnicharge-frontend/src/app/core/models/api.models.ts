// ─── Generic API wrapper — ALL backend responses use this ───────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// Spring Page wrapper
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  page: number; // Matches backend PagedResponse 'page'
  first: boolean;
  last: boolean;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
// Matches Java AuthResponse DTO exactly
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  role: 'ROLE_USER' | 'ROLE_ADMIN';
  fullName: string;
  email: string;
  isProfileComplete: boolean;
}

// ─── User ────────────────────────────────────────────────────────────────────
// Matches Java UserProfileResponse DTO
export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  mobileNumber: string;
  role: 'ROLE_USER' | 'ROLE_ADMIN';
  authProvider: string;
  isActive: boolean;
  createdDate: string;
}

// ─── Operator ────────────────────────────────────────────────────────────────
// Matches Java OperatorDetectionResponse DTO
export interface OperatorDetection {
  operatorId: number;
  operatorName: string;
  operatorCode: string;
  logoUrl: string;
  plans: Plan[];
}

// Matches Java OperatorResponse DTO
export interface Operator {
  id: number;
  name: string;
  code: string;
  category: string; // matches OperatorCategory enum
  logoUrl: string;
  isActive: boolean;
  planCount: number;
}

// ─── Plan ────────────────────────────────────────────────────────────────────
// Matches Java PlanResponse DTO exactly
export interface Plan {
  id: number;
  operatorId: number;
  operatorName: string;
  planName: string;
  price: number;           // BigDecimal → number
  validityDays: number;
  dataLimit: string;
  callBenefit: string;
  smsBenefit: string;
  additionalBenefits: string;
  category: string;        // PlanCategory enum
  isActive: boolean;
}

// ─── Recharge ────────────────────────────────────────────────────────────────
// Matches Java RechargeRequest DTO
export interface RechargeRequest {
  mobileNumber: string;
  operatorId: number;
  planId: number;
  paymentMethod: string;   // Backend requires this field
}

// Matches Java RechargeResponse DTO
export interface RechargeResponse {
  id: number;
  rechargeId: string;
  userId: number;
  mobileNumber: string;
  operatorId: number;
  operatorName: string;
  planId: number;
  planName: string;
  amount: number;
  planValidityDays: number;
  planExpiryDate: string;
  status: 'INITIATED' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';
  failureReason?: string;
  transactionId?: string;
  createdDate: string;
}

export interface UserRechargeStats {
  activeCount: number;
  processingCount: number;
  expiredCount: number;
}

// ─── Payment / Transaction ────────────────────────────────────────────────────
// Matches Java TransactionResponse DTO exactly
export interface TransactionResponse {
  id: number;
  transactionId: string;
  rechargeId: string;       // String (matches RechargeResponse.rechargeId)
  userId: number;
  amount: number;
  paymentMethod: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'INITIATED'; // INITIATED if needed, but backend said PENDING
  failureReason: string;
  razorpayOrderId: string;
  userEmail: string;
  userMobile: string;
  mobileNumber: string;
  operatorName: string;
  planName: string;
  createdDate: string;
}

export interface PaymentStats {
  totalPayments: number;
  totalVolume: number;
  successRate: number;
  methodDistribution: Record<string, number>;
}

// ─── Notification ────────────────────────────────────────────────────────────
// Matches Java NotificationResponse DTO
export interface NotificationResponse {
  id: number;
  userId: number;
  type: 'EMAIL' | 'SMS';
  category: 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'PLAN_EXPIRY_REMINDER' | 'PLAN_EXPIRED';
  subject: string;
  message: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  referenceId: string;
  isRead: boolean;
  createdDate: string;
}
