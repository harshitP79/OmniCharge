import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { RechargeInputComponent } from './recharge-input.component';
import { RechargeApiService } from '../../../core/services/recharge-api.service';
import { RechargeStore } from '../../../store/recharge.store';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';

describe('RechargeInputComponent', () => {
  let component: RechargeInputComponent;
  let fixture: ComponentFixture<RechargeInputComponent>;
  let apiSpy: jasmine.SpyObj<RechargeApiService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let storeMock: any;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('RechargeApiService', ['detectOperator']);

    routerSpy = jasmine.createSpyObj('Router', ['navigate'], {
      url: '/dashboard/recharge'
    });

    storeMock = {
      setMobileNumber: jasmine.createSpy('setMobileNumber'),
      setOperator: jasmine.createSpy('setOperator')
    };

    await TestBed.configureTestingModule({
      imports: [RechargeInputComponent, HttpClientTestingModule, ReactiveFormsModule],
      providers: [
        { provide: RechargeApiService, useValue: apiSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: {} },
        { provide: RechargeStore, useValue: storeMock }
      ]
    }).compileComponents();
  });

  const createComponent = () => {
    fixture = TestBed.createComponent(RechargeInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  // ==========================================
  // NORMAL WORKING
  // ==========================================
  describe('Normal Working', () => {
    beforeEach(() => {
      createComponent();
    });

    it('should compute mascot state based on current interaction state', () => {
      expect(component.mascotState()).toBe('idle');

      component.isLoading.set(true);
      expect(component.mascotState()).toBe('loading');

      component.isLoading.set(false);
      component.error.set('Bad Error');
      expect(component.mascotState()).toBe('error');

      component.isSuccess.set(true); // Takes precedence
      expect(component.mascotState()).toBe('success');
    });

    it('should validate mobile number with required and pattern validators', () => {
      const mobileCtrl = component.rechargeForm.get('mobileNumber')!;

      // Initially empty → required error
      expect(mobileCtrl.hasError('required')).toBeTrue();
      expect(mobileCtrl.valid).toBeFalse();

      // Invalid starting digit → pattern error
      mobileCtrl.setValue('1234567890');
      expect(mobileCtrl.hasError('pattern')).toBeTrue();
      expect(mobileCtrl.valid).toBeFalse();

      // Valid number starting with 6-9
      mobileCtrl.setValue('9876543210');
      expect(mobileCtrl.valid).toBeTrue();
      expect(mobileCtrl.errors).toBeNull();
    });

    it('should detect operator successfully and navigate to dashboard plans', fakeAsync(() => {
      apiSpy.detectOperator.and.returnValue(of({ operatorId: 1, operatorName: 'Jio' } as any));

      component.rechargeForm.setValue({ mobileNumber: '9876543210' });
      component.onSubmit();

      expect(component.isLoading()).toBeFalse();
      expect(component.isSuccess()).toBeTrue();
      expect(component.mascotState()).toBe('success');

      // The router navigation is delayed by 800ms
      expect(routerSpy.navigate).not.toHaveBeenCalled();

      tick(800);

      expect(storeMock.setMobileNumber).toHaveBeenCalledWith('9876543210');
      expect(storeMock.setOperator).toHaveBeenCalledWith({ operatorId: 1, operatorName: 'Jio' });
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/', 'dashboard', 'plans']);
    }));

    it('should derive basePath from router.url for navigation', () => {
      // Test the basePath logic directly: router.url.split('/')[1] || 'public'
      const dashboardPath = '/dashboard/recharge'.split('/')[1] || 'public';
      expect(dashboardPath).toBe('dashboard');

      const publicPath = '/public/recharge'.split('/')[1] || 'public';
      expect(publicPath).toBe('public');

      const emptyPath = ''.split('/')[1] || 'public';
      expect(emptyPath).toBe('public');
    });
  });

  // ==========================================
  // BOUNDARY VALUES
  // ==========================================
  describe('Boundary Values', () => {
    beforeEach(() => {
      createComponent();
    });

    it('should stop submission and touch all controls if form is invalid', () => {
      component.onSubmit();
      expect(apiSpy.detectOperator).not.toHaveBeenCalled();
      expect(component.rechargeForm.get('mobileNumber')?.touched).toBeTrue();
    });

    it('should handle api success with invalid structural operator gracefully', () => {
      apiSpy.detectOperator.and.returnValue(of(null as any)); // Null result

      component.rechargeForm.setValue({ mobileNumber: '9988776655' });
      component.onSubmit();

      expect(component.isLoading()).toBeFalse();
      expect(component.isSuccess()).toBeFalse();
      expect(component.error()).toBe('Could not detect operator for this number.');
    });

    it('should handle api success with missing operatorId gracefully', () => {
      apiSpy.detectOperator.and.returnValue(of({ } as any)); // Empty object

      component.rechargeForm.setValue({ mobileNumber: '9988776655' });
      component.onSubmit();

      expect(component.error()).toBe('Could not detect operator for this number.');
    });
  });

  // ==========================================
  // Public URL Navigation (separate TestBed)
  // ==========================================
  describe('Public URL Navigation', () => {
    it('should navigate to public plans if on public base URL', fakeAsync(() => {
      const publicRouterSpy = jasmine.createSpyObj('Router', ['navigate'], { url: '/public/recharge' });
      const publicApiSpy = jasmine.createSpyObj('RechargeApiService', ['detectOperator']);
      const publicStoreMock = {
        setMobileNumber: jasmine.createSpy('setMobileNumber'),
        setOperator: jasmine.createSpy('setOperator')
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [RechargeInputComponent, HttpClientTestingModule, ReactiveFormsModule],
        providers: [
          { provide: RechargeApiService, useValue: publicApiSpy },
          { provide: Router, useValue: publicRouterSpy },
          { provide: ActivatedRoute, useValue: {} },
          { provide: RechargeStore, useValue: publicStoreMock }
        ]
      });

      const localFixture = TestBed.createComponent(RechargeInputComponent);
      const localComponent = localFixture.componentInstance;
      localFixture.detectChanges();

      publicApiSpy.detectOperator.and.returnValue(of({ operatorId: 2, operatorName: 'Airtel' } as any));

      localComponent.rechargeForm.setValue({ mobileNumber: '9988776655' });
      localComponent.onSubmit();
      tick(800);

      expect(publicRouterSpy.navigate).toHaveBeenCalledWith(['/', 'public', 'plans']);
    }));
  });

  // ==========================================
  // EXCEPTION HANDLING
  // ==========================================
  describe('Exception Handling', () => {
    beforeEach(() => {
      createComponent();
    });

    it('should cleanly halt loading and propagate api error messages', () => {
      apiSpy.detectOperator.and.returnValue(throwError(() => ({ error: { message: 'Network failed' } })));

      component.rechargeForm.setValue({ mobileNumber: '9988776655' });
      component.onSubmit();

      expect(component.isLoading()).toBeFalse();
      expect(component.isSuccess()).toBeFalse();
      expect(component.error()).toBe('Network failed');
      expect(component.mascotState()).toBe('error');
    });

    it('should cleanly halt loading and propagate generic error message', () => {
      apiSpy.detectOperator.and.returnValue(throwError(() => new Error('Offline')));

      component.rechargeForm.setValue({ mobileNumber: '9988776655' });
      component.onSubmit();

      expect(component.error()).toBe('Failed to detect operator. Please check the number and try again.');
    });
  });
});
