import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PaymentApiService } from './payment-api.service';
import { mockApiResponse, mockRechargeResponse, mockTransactionResponse } from '../../testing/mock-data';
import { RechargeRequest, Page, TransactionResponse } from '../models/api.models';

describe('PaymentApiService', () => {
  let service: PaymentApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PaymentApiService]
    });
    service = TestBed.inject(PaymentApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ==========================================
  // NORMAL WORKING
  // ==========================================
  describe('Normal Working', () => {
    it('should initiate recharge successfully', () => {
      const payload: RechargeRequest = {
        mobileNumber: '9876543210',
        operatorId: 1,
        planId: 1,
        paymentMethod: 'UPI'
      };

      service.initiateRecharge(payload).subscribe(res => {
        expect(res).toEqual(mockRechargeResponse);
        expect(res.rechargeId).toEqual('REC-12345');
      });

      const req = httpTestingController.expectOne('/api/recharges');
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual(payload);
      
      req.flush(mockApiResponse(mockRechargeResponse));
    });

    it('should fetch payment history with default pagination', () => {
      const mockPage: Page<TransactionResponse> = {
        content: [mockTransactionResponse],
        totalElements: 1,
        totalPages: 1,
        size: 50,
        page: 0,
        first: true,
        last: true
      };

      service.getPaymentHistory().subscribe(res => {
        expect(res.content.length).toBe(1);
        expect(res.content[0].transactionId).toBe('TXN-98765');
      });

      const req = httpTestingController.expectOne('/api/payments/history?page=0&size=50');
      expect(req.request.method).toEqual('GET');
      req.flush(mockApiResponse(mockPage));
    });

    it('should confirm payment with razorpay details', () => {
      service.confirmPayment('TXN-123', 'pay_abc123', 'sig_xyz789').subscribe(res => {
        expect(res).toEqual(mockTransactionResponse);
      });

      const req = httpTestingController.expectOne('/api/payments/webhook/confirm/TXN-123?razorpayPaymentId=pay_abc123&razorpaySignature=sig_xyz789');
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toBeNull(); // It sends null body
      req.flush(mockApiResponse(mockTransactionResponse));
    });

    it('should cancel payment via webhook', () => {
      service.cancelPayment('TXN-123').subscribe(res => {
        expect(res.status).toEqual('CANCELLED');
      });

      const req = httpTestingController.expectOne('/api/payments/webhook/cancel/TXN-123');
      expect(req.request.method).toEqual('POST');
      req.flush(mockApiResponse({ status: 'CANCELLED' }));
    });
  });

  // ==========================================
  // BOUNDARY VALUES
  // ==========================================
  describe('Boundary Values', () => {
    it('should fetch payment history with custom extreme pagination', () => {
      service.getPaymentHistory(9999, 1).subscribe();

      const req = httpTestingController.expectOne('/api/payments/history?page=9999&size=1');
      expect(req.request.method).toEqual('GET');
      req.flush(mockApiResponse({ content: [], totalElements: 0, totalPages: 0, size: 1, page: 9999, first: false, last: true }));
    });

    it('should properly encode special characters in signature', () => {
      const signature = 'sig+xyz=789%&';
      service.confirmPayment('TXN-123', 'pay', signature).subscribe();

      // Angular HttpClient automatically encodes params
      const req = httpTestingController.expectOne(request => request.url === '/api/payments/webhook/confirm/TXN-123');
      expect(req.request.params.get('razorpaySignature')).toEqual(signature);
      req.flush(mockApiResponse({}));
    });
  });

  // ==========================================
  // EXCEPTION HANDLING
  // ==========================================
  describe('Exception Handling', () => {
    it('should handle 400 Bad Request on initiate recharge (e.g. invalid plan, expired plan)', () => {
      const payload: RechargeRequest = {
        mobileNumber: '1111111111', 
        operatorId: -1, 
        planId: 0, 
        paymentMethod: 'INVALID'
      };

      service.initiateRecharge(payload).subscribe({
        next: () => fail('Expected error'),
        error: error => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpTestingController.expectOne('/api/recharges');
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });

    it('should handle 500 internal server error during payment confirmation', () => {
      service.confirmPayment('TXN-123', 'pay_abc', 'sig_abc').subscribe({
        next: () => fail('Expected error'),
        error: error => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpTestingController.expectOne(request => request.url === '/api/payments/webhook/confirm/TXN-123');
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
