import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { CheckoutComponent } from './checkout.component';
import { PaymentApiService } from '../../core/services/payment-api.service';
import { RechargeStore } from '../../store/recharge.store';
import { of, throwError } from 'rxjs';

describe('CheckoutComponent', () => {
  let component: CheckoutComponent;
  let fixture: ComponentFixture<CheckoutComponent>;
  let apiSpy: jasmine.SpyObj<PaymentApiService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let storeStr: any;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('PaymentApiService', ['initiateRecharge', 'getPaymentHistory', 'confirmPayment', 'cancelPayment']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    // Mock store to be fully populated so it doesn't redirect
    storeStr = {
      selectedPlan: jasmine.createSpy().and.returnValue({ id: 1, price: 100, planName: 'Test Plan' }),
      mobileNumber: jasmine.createSpy().and.returnValue('9876543210'),
      operator: jasmine.createSpy().and.returnValue({ operatorId: 1, operatorName: 'Airtel', logoUrl: 'airtel.png' }),
      clearFlow: jasmine.createSpy('clearFlow')
    };

    await TestBed.configureTestingModule({
      imports: [CheckoutComponent, HttpClientTestingModule],
      providers: [
        { provide: PaymentApiService, useValue: apiSpy },
        { provide: Router, useValue: routerSpy },
        { provide: RechargeStore, useValue: storeStr }
      ]
    }).compileComponents();
  });

  const createComponent = () => {
    fixture = TestBed.createComponent(CheckoutComponent);
    component = fixture.componentInstance;
  };

  afterEach(() => {
    if ((window as any).Razorpay) delete (window as any).Razorpay;
  });

  it('should create and navigate away if store is not populated', () => {
    storeStr.selectedPlan.and.returnValue(null);
    createComponent();
    fixture.detectChanges();
    
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard/overview']);
  });

  // ==========================================
  // NORMAL WORKING
  // ==========================================
  describe('Normal Working', () => {
    beforeEach(() => {
      // Valid store
      createComponent();
      
      // Override script appending so it doesn't leak into DOM constantly if unmanaged
      spyOn<any>(component, 'loadRazorpayScript').and.stub();
    });

    it('should poll payment history after successful initiation and open Razorpay', fakeAsync(() => {
      // Initiate recharge mocked
      apiSpy.initiateRecharge.and.returnValue(of({ rechargeId: 'RC_1' } as any));
      
      // Poll response mocked
      apiSpy.getPaymentHistory.and.returnValue(of({
        content: [
          { rechargeId: 'RC_1', transactionId: 'TX_1', razorpayOrderId: 'ORDER_1', status: 'INITIATED' }
        ]
      } as any));

      const razorpayOpenSpy = jasmine.createSpy('open');
      (window as any).Razorpay = function(options: any) {
        this.open = razorpayOpenSpy;
      };

      fixture.detectChanges(); // triggers ngOnInit -> startCheckoutSaga -> initiates -> polls
      expect(apiSpy.initiateRecharge).toHaveBeenCalled();
      
      // Fast forward polling
      tick(1000); // Because it polls starting after 1s
      
      expect(apiSpy.getPaymentHistory).toHaveBeenCalled();
      expect(component.statusMessage()).toBe('Payment ready.');
      expect(razorpayOpenSpy).toHaveBeenCalled();

      discardPeriodicTasks();
    }));

    it('should handle verification success correctly', () => {
      apiSpy.confirmPayment.and.returnValue(of({ status: 'SUCCESS' } as any));
      
      // Manually trigger verification
      (component as any).verifyPayment('TX_1', 'PAY_1', 'SIG_1');

      expect(apiSpy.confirmPayment).toHaveBeenCalledWith('TX_1', 'PAY_1', 'SIG_1');
      expect(component.paymentFinalStatus()).toBe('SUCCESS');
      expect(storeStr.clearFlow).toHaveBeenCalled();
      expect(component.isProcessing()).toBeFalse();
    });
  });

  // ==========================================
  // BOUNDARY VALUES
  // ==========================================
  describe('Boundary Values', () => {
    beforeEach(() => {
      createComponent();
      spyOn<any>(component, 'loadRazorpayScript').and.stub();
    });

    it('should stop polling and set failure if history polling returns FAILED status', fakeAsync(() => {
      apiSpy.initiateRecharge.and.returnValue(of({ rechargeId: 'RC_1' } as any));
      
      apiSpy.getPaymentHistory.and.returnValue(of({
        content: [
          { rechargeId: 'RC_1', status: 'FAILED', failureReason: 'Insufficient balance' }
        ]
      } as any));

      fixture.detectChanges();
      tick(1000);

      expect(component.paymentFinalStatus()).toBe('FAILED');
      expect(component.errorMsg()).toBe('Insufficient balance');

      discardPeriodicTasks();
    }));

    it('verifyPayment should handle failure state even if HTTP works', () => {
      apiSpy.confirmPayment.and.returnValue(of({ status: 'FAILED' } as any));
      
      (component as any).verifyPayment('TX_1', 'PAY_1', 'SIG_1');

      expect(component.paymentFinalStatus()).toBe('FAILED');
      expect(component.errorMsg()).toBe('Payment could not be completed.');
    });

    it('should open Razorpay UI and handle manual dismiss via modal configuration', fakeAsync(() => {
      apiSpy.initiateRecharge.and.returnValue(of({ rechargeId: 'RC_1' } as any));
      
      apiSpy.getPaymentHistory.and.returnValue(of({
        content: [
          { rechargeId: 'RC_1', transactionId: 'TX_1', razorpayOrderId: 'ORDER_1', status: 'INITIATED' }
        ]
      } as any));

      let captureOptions: any = null;
      (window as any).Razorpay = function(options: any) {
        captureOptions = options;
        this.open = () => {};
      };

      fixture.detectChanges();
      tick(1000);

      expect(captureOptions).toBeTruthy();
      expect(captureOptions.modal.ondismiss).toBeTruthy();

      // Trigger cancel API mapping
      apiSpy.cancelPayment.and.returnValue(of({} as any));
      
      // Simulate user closing
      captureOptions.modal.ondismiss();
      tick(5000); // Allow HTTP requests limits etc.

      expect(apiSpy.cancelPayment).toHaveBeenCalledWith('TX_1');
      expect(component.paymentFinalStatus()).toBe('FAILED');
      
      discardPeriodicTasks();
    }));
  });

  // ==========================================
  // EXCEPTION HANDLING
  // ==========================================
  describe('Exception Handling', () => {
    beforeEach(() => {
      createComponent();
      spyOn<any>(component, 'loadRazorpayScript').and.stub();
    });

    it('should cleanly halt loading and fail gracefully if initiateRecharge errors out', () => {
      apiSpy.initiateRecharge.and.returnValue(throwError(() => ({ error: { message: 'Plan inactive' } })));
      
      fixture.detectChanges();

      expect(component.isProcessing()).toBeFalse();
      expect(component.paymentFinalStatus()).toBe('FAILED');
      expect(component.errorMsg()).toBe('Plan inactive');
    });

    it('should halt safely if razorpay script throws an error during instantiation', fakeAsync(() => {
      apiSpy.initiateRecharge.and.returnValue(of({ rechargeId: 'RC_1' } as any));
      apiSpy.getPaymentHistory.and.returnValue(of({
        content: [ { rechargeId: 'RC_1', razorpayOrderId: 'ORDER_1' } ]
      } as any));

      // Mock throwing error inside new Razorpay
      (window as any).Razorpay = function() {
        throw new Error('Script blocked');
      };

      fixture.detectChanges();
      tick(1000);

      expect(component.paymentFinalStatus()).toBe('FAILED');
      expect(component.errorMsg()).toBe('Could not open the payment window.');
      
      discardPeriodicTasks();
    }));

    it('should prevent multiple manual cancel calls firing sequentially', fakeAsync(() => {
      // To test this we trigger handleManualCancel while isCancelling is already true
      (component as any).isCancelling = true;
      (component as any).handleManualCancel('TX_1');
      expect(apiSpy.cancelPayment).not.toHaveBeenCalled();
    }));
  });
});
