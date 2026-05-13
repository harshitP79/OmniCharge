import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TransactionsComponent } from './transactions.component';
import { PaymentApiService } from '../../../core/services/payment-api.service';
import { of, throwError } from 'rxjs';
import { TransactionResponse } from '../../../core/models/api.models';

describe('TransactionsComponent', () => {
  let component: TransactionsComponent;
  let fixture: ComponentFixture<TransactionsComponent>;
  let paymentApiSpy: jasmine.SpyObj<PaymentApiService>;

  beforeEach(async () => {
    paymentApiSpy = jasmine.createSpyObj('PaymentApiService', ['getPaymentHistory']);

    await TestBed.configureTestingModule({
      imports: [TransactionsComponent, HttpClientTestingModule],
      providers: [
        { provide: PaymentApiService, useValue: paymentApiSpy }
      ]
    }).compileComponents();
  });

  const createComponent = () => {
    fixture = TestBed.createComponent(TransactionsComponent);
    component = fixture.componentInstance;
  };

  it('should create', () => {
    paymentApiSpy.getPaymentHistory.and.returnValue(of({ content: [], totalElements: 0 } as any));
    createComponent();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  // ==========================================
  // NORMAL WORKING
  // ==========================================
  describe('Normal Working', () => {
    let mockTransactions: Partial<TransactionResponse>[];

    beforeEach(() => {
      mockTransactions = [
        { transactionId: 'TX1', amount: 100, status: 'SUCCESS', createdDate: '2023-01-01', id: 1, rechargeId: '101', paymentMethod: 'UPI' },
        { transactionId: 'TX2', amount: 200, status: 'PENDING', createdDate: '2023-01-02', id: 2, rechargeId: '102', paymentMethod: 'CARD' },
        { transactionId: 'TX3', amount: 300, status: 'FAILED', createdDate: '2023-01-03', id: 3, rechargeId: '103', paymentMethod: 'UPI' }
      ];

      paymentApiSpy.getPaymentHistory.and.returnValue(of({ content: mockTransactions, totalElements: 3 } as any));
      createComponent();
      fixture.detectChanges();
    });

    it('should set transactions list from API response', () => {
      expect(component.transactions().length).toBe(3);
      expect(component.transactions()[0].transactionId).toBe('TX1');
    });

    it('should set isLoading to false after loading', () => {
      expect(component.isLoading()).toBeFalse();
    });

    it('should return success styles for SUCCESS status', () => {
      const styles = component.getPaymentStatusStyles('SUCCESS');
      const dot = component.getPaymentDotClass('SUCCESS');
      expect(styles).toContain('text-green-50');
      expect(dot).toContain('bg-green-500');
    });

    it('should return amber styles for PENDING status', () => {
      const styles = component.getPaymentStatusStyles('PENDING');
      const dot = component.getPaymentDotClass('PENDING');
      expect(styles).toContain('text-amber-500');
      expect(dot).toContain('bg-amber-500');
    });

    it('should return amber styles for INITIATED status', () => {
      const styles = component.getPaymentStatusStyles('INITIATED');
      const dot = component.getPaymentDotClass('INITIATED');
      expect(styles).toContain('text-amber-500');
      expect(dot).toContain('bg-amber-500');
    });
  });

  // ==========================================
  // BOUNDARY VALUES
  // ==========================================
  describe('Boundary Values', () => {
    it('should default unrecognized status to red/error styles', () => {
      paymentApiSpy.getPaymentHistory.and.returnValue(of({ content: [], totalElements: 0 } as any));
      createComponent();

      const styles = component.getPaymentStatusStyles('REFUNDED' as any);
      const dot = component.getPaymentDotClass('UNKNOWN' as any);
      
      expect(styles).toContain('text-red-500');
      expect(dot).toContain('bg-red-500');
    });

    it('should handle exactly zero transactions properly', () => {
      paymentApiSpy.getPaymentHistory.and.returnValue(of({ content: [], totalElements: 0 } as any));
      createComponent();
      fixture.detectChanges();

      expect(component.transactions().length).toBe(0);
      expect(component.isLoading()).toBeFalse();
    });
  });

  // ==========================================
  // EXCEPTION HANDLING
  // ==========================================
  describe('Exception Handling', () => {
    it('should safely halt loading and handle failed history fetch without crashing', () => {
      paymentApiSpy.getPaymentHistory.and.returnValue(throwError(() => new Error('Service down')));
      createComponent();
      fixture.detectChanges();

      expect(component.isLoading()).toBeFalse();
      expect(component.transactions().length).toBe(0);
    });
  });
});
