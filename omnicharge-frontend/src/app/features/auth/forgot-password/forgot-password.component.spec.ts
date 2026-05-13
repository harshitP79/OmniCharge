import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../../../core/services/auth.service';
import { of, throwError } from 'rxjs';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['forgotPassword', 'verifyOtp', 'resetPassword']);

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ==========================================
  // NORMAL WORKING
  // ==========================================
  describe('Normal Working', () => {
    it('should start at email step', () => {
      expect(component.step()).toBe('email');
    });

    it('should send OTP and transition to otp step', fakeAsync(() => {
      authServiceSpy.forgotPassword.and.returnValue(of({ success: true, message: 'OTP sent', data: undefined as any, timestamp: '' }));
      component.emailForm.setValue({ email: 'john@example.com' });

      component.sendOtp();
      tick();

      expect(authServiceSpy.forgotPassword).toHaveBeenCalledWith('john@example.com');
      expect(component.step()).toBe('otp');
      expect(component.pendingEmail).toBe('john@example.com');
      expect(component.info()).toBe('OTP sent');
    }));

    it('should verify OTP and transition to reset step', fakeAsync(() => {
      component.pendingEmail = 'john@example.com';
      component.step.set('otp');
      authServiceSpy.verifyOtp.and.returnValue(of({ success: true, message: '', data: true, timestamp: '' }));
      component.otpForm.setValue({ otp: '123456' });

      component.verifyOtp();
      tick();

      expect(authServiceSpy.verifyOtp).toHaveBeenCalledWith('john@example.com', '123456');
      expect(component.step()).toBe('reset');
    }));

    it('should reset password and transition to done step', fakeAsync(() => {
      component.pendingEmail = 'john@example.com';
      component.pendingOtp = '123456';
      component.step.set('reset');
      authServiceSpy.resetPassword.and.returnValue(of({ success: true, message: '', data: undefined as any, timestamp: '' }));
      component.resetForm.setValue({ newPassword: 'newPass123', confirmPassword: 'newPass123' });

      component.resetPassword();
      tick();

      expect(authServiceSpy.resetPassword).toHaveBeenCalledWith('john@example.com', '123456', 'newPass123');
      expect(component.step()).toBe('done');
    }));

    it('should resend OTP successfully', fakeAsync(() => {
      component.pendingEmail = 'john@example.com';
      authServiceSpy.forgotPassword.and.returnValue(of({ success: true, message: '', data: undefined as any, timestamp: '' }));

      component.resendOtp();
      tick();

      expect(authServiceSpy.forgotPassword).toHaveBeenCalledWith('john@example.com');
      expect(component.info()).toBe('OTP resent to your email.');
    }));
  });

  // ==========================================
  // BOUNDARY VALUES
  // ==========================================
  describe('Boundary Values', () => {
    it('should not send OTP when email form is invalid', () => {
      component.emailForm.setValue({ email: '' });
      component.sendOtp();
      expect(authServiceSpy.forgotPassword).not.toHaveBeenCalled();
    });

    it('should invalidate email without @ symbol', () => {
      component.emailForm.controls.email.setValue('bademail');
      expect(component.emailForm.controls.email.valid).toBeFalse();
    });

    it('should not verify OTP when otp form is invalid', () => {
      component.otpForm.setValue({ otp: '12' }); // Too short
      component.verifyOtp();
      expect(authServiceSpy.verifyOtp).not.toHaveBeenCalled();
    });

    it('should invalidate OTP that is not exactly 6 digits', () => {
      component.otpForm.controls.otp.setValue('12345');
      expect(component.otpForm.controls.otp.valid).toBeFalse();

      component.otpForm.controls.otp.setValue('1234567');
      expect(component.otpForm.controls.otp.valid).toBeFalse();

      component.otpForm.controls.otp.setValue('abcdef');
      expect(component.otpForm.controls.otp.valid).toBeFalse();
    });

    it('should accept exactly 6-digit OTP', () => {
      component.otpForm.controls.otp.setValue('123456');
      expect(component.otpForm.controls.otp.valid).toBeTrue();
    });

    it('should detect password mismatch', () => {
      component.resetForm.setValue({ newPassword: 'password1', confirmPassword: 'password2' });
      expect(component.passwordMismatch()).toBeTrue();
    });

    it('should pass when passwords match', () => {
      component.resetForm.setValue({ newPassword: 'password1', confirmPassword: 'password1' });
      expect(component.passwordMismatch()).toBeFalse();
    });

    it('should not reset password when form is invalid', () => {
      component.resetForm.setValue({ newPassword: '', confirmPassword: '' });
      component.resetPassword();
      expect(authServiceSpy.resetPassword).not.toHaveBeenCalled();
    });

    it('should not reset password when passwords mismatch', () => {
      component.step.set('reset');
      component.resetForm.setValue({ newPassword: 'aaaaaaaa', confirmPassword: 'bbbbbbbb' });
      component.resetPassword();
      expect(authServiceSpy.resetPassword).not.toHaveBeenCalled();
    });

    it('should invalidate new password shorter than 8 characters', () => {
      component.resetForm.controls.newPassword.setValue('short');
      expect(component.resetForm.controls.newPassword.valid).toBeFalse();
    });

    it('should show invalid OTP error when verifyOtp returns false', fakeAsync(() => {
      component.pendingEmail = 'john@example.com';
      component.step.set('otp');
      authServiceSpy.verifyOtp.and.returnValue(of({ success: true, message: '', data: false, timestamp: '' }));
      component.otpForm.setValue({ otp: '000000' });

      component.verifyOtp();
      tick();

      expect(component.error()).toBe('Invalid OTP. Please check and try again.');
      expect(component.step()).toBe('otp'); // Should NOT advance
    }));
  });

  // ==========================================
  // EXCEPTION HANDLING
  // ==========================================
  describe('Exception Handling', () => {
    it('should show error when sendOtp API fails', fakeAsync(() => {
      authServiceSpy.forgotPassword.and.returnValue(throwError(() => ({ error: { message: 'User not found' } })));
      component.emailForm.setValue({ email: 'notfound@test.com' });

      component.sendOtp();
      tick();

      expect(component.error()).toBe('User not found');
      expect(component.isLoading()).toBeFalse();
    }));

    it('should show error when verifyOtp API fails', fakeAsync(() => {
      component.pendingEmail = 'test@test.com';
      component.step.set('otp');
      authServiceSpy.verifyOtp.and.returnValue(throwError(() => ({ error: { message: 'OTP expired' } })));
      component.otpForm.setValue({ otp: '123456' });

      component.verifyOtp();
      tick();

      expect(component.error()).toBe('OTP expired');
    }));

    it('should show error when resetPassword API fails', fakeAsync(() => {
      component.pendingEmail = 'test@test.com';
      component.pendingOtp = '123456';
      component.step.set('reset');
      authServiceSpy.resetPassword.and.returnValue(throwError(() => ({ error: {} })));
      component.resetForm.setValue({ newPassword: 'newpass12', confirmPassword: 'newpass12' });

      component.resetPassword();
      tick();

      expect(component.error()).toBe('Password reset failed. Please try again.');
    }));

    it('should show error when resend OTP fails', fakeAsync(() => {
      component.pendingEmail = 'test@test.com';
      authServiceSpy.forgotPassword.and.returnValue(throwError(() => new Error('fail')));

      component.resendOtp();
      tick();

      expect(component.error()).toBe('Failed to resend OTP.');
    }));
  });
});
