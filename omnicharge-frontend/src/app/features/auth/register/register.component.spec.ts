import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { mockAuthTokens } from '../../../testing/mock-data';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['register', 'loginWithGoogle']);

    // Prevent Google Sign-In initialization
    (window as any).google = undefined;

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ==========================================
  // NORMAL WORKING
  // ==========================================
  describe('Normal Working', () => {
    it('should initialize with empty register form', () => {
      expect(component.registerForm.value.fullName).toBe('');
      expect(component.registerForm.value.email).toBe('');
      expect(component.registerForm.value.mobileNumber).toBe('');
      expect(component.registerForm.value.password).toBe('');
    });

    it('should be invalid when empty', () => {
      expect(component.registerForm.valid).toBeFalse();
    });

    it('should be valid with proper inputs', () => {
      component.registerForm.setValue({
        fullName: 'John Doe',
        email: 'john@example.com',
        mobileNumber: '9876543210',
        password: 'password12'
      });
      expect(component.registerForm.valid).toBeTrue();
    });

    it('should call authService.register on valid submit', fakeAsync(() => {
      const mockRes = { success: true, message: 'Account created!', data: null, timestamp: '' };
      authServiceSpy.register.and.returnValue(of(mockRes as any));

      component.registerForm.setValue({
        fullName: 'John Doe',
        email: 'john@example.com',
        mobileNumber: '9876543210',
        password: 'password12'
      });

      component.onSubmit();
      tick(1500); // flush setTimeout in success handler

      expect(authServiceSpy.register).toHaveBeenCalled();
      expect(component.success()).toBe('Account created!');
      expect(component.isLoading()).toBeFalse();
    }));

    it('should redirect to login after successful registration', fakeAsync(() => {
      const mockRes = { success: true, message: 'OK', data: null, timestamp: '' };
      authServiceSpy.register.and.returnValue(of(mockRes as any));

      component.registerForm.setValue({
        fullName: 'John',
        email: 'j@e.com',
        mobileNumber: '9876543210',
        password: 'password12'
      });

      component.onSubmit();
      tick(1500);

      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    }));
  });

  // ==========================================
  // BOUNDARY VALUES
  // ==========================================
  describe('Boundary Values', () => {
    it('should not submit when form is invalid', () => {
      component.registerForm.setValue({
        fullName: '',
        email: '',
        mobileNumber: '',
        password: ''
      });
      component.onSubmit();
      expect(authServiceSpy.register).not.toHaveBeenCalled();
    });

    it('should invalidate name shorter than 2 characters', () => {
      component.registerForm.controls.fullName.setValue('A');
      expect(component.registerForm.controls.fullName.valid).toBeFalse();
    });

    it('should accept name with exactly 2 characters', () => {
      component.registerForm.controls.fullName.setValue('AB');
      expect(component.registerForm.controls.fullName.valid).toBeTrue();
    });

    it('should invalidate mobile number not starting with 6-9', () => {
      component.registerForm.controls.mobileNumber.setValue('1234567890');
      expect(component.registerForm.controls.mobileNumber.valid).toBeFalse();
    });

    it('should invalidate mobile number with less than 10 digits', () => {
      component.registerForm.controls.mobileNumber.setValue('98765');
      expect(component.registerForm.controls.mobileNumber.valid).toBeFalse();
    });

    it('should accept valid Indian mobile number', () => {
      component.registerForm.controls.mobileNumber.setValue('9876543210');
      expect(component.registerForm.controls.mobileNumber.valid).toBeTrue();
    });

    it('should invalidate password shorter than 8 characters', () => {
      component.registerForm.controls.password.setValue('1234567');
      expect(component.registerForm.controls.password.valid).toBeFalse();
    });

    it('should accept password with exactly 8 characters', () => {
      component.registerForm.controls.password.setValue('12345678');
      expect(component.registerForm.controls.password.valid).toBeTrue();
    });
  });

  // ==========================================
  // EXCEPTION HANDLING
  // ==========================================
  describe('Exception Handling', () => {
    beforeEach(() => {
      component.registerForm.setValue({
        fullName: 'John Doe',
        email: 'john@example.com',
        mobileNumber: '9876543210',
        password: 'password12'
      });
    });

    it('should show duplicate account error on 409 Conflict', fakeAsync(() => {
      authServiceSpy.register.and.returnValue(throwError(() => ({ status: 409 })));

      component.onSubmit();
      tick();

      expect(component.error()).toBe('An account with this email already exists.');
    }));

    it('should show validation error on 400 Bad Request', fakeAsync(() => {
      authServiceSpy.register.and.returnValue(throwError(() => ({ status: 400, error: { message: 'Email format invalid' } })));

      component.onSubmit();
      tick();

      expect(component.error()).toBe('Email format invalid');
    }));

    it('should show server unreachable on status 0', fakeAsync(() => {
      authServiceSpy.register.and.returnValue(throwError(() => ({ status: 0 })));

      component.onSubmit();
      tick();

      expect(component.error()).toBe('Cannot connect to server. Please ensure the backend is running.');
    }));

    it('should show generic error on 500', fakeAsync(() => {
      authServiceSpy.register.and.returnValue(throwError(() => ({ status: 500, error: {} })));

      component.onSubmit();
      tick();

      expect(component.error()).toBe('Registration failed. Please try again.');
    }));

    it('should clear error and success on new submit attempt', fakeAsync(() => {
      component.error.set('Previous error');
      component.success.set('Previous success');

      authServiceSpy.register.and.returnValue(of({ success: true, message: 'Done', data: null, timestamp: '' } as any));
      component.onSubmit();
      tick(1500); // flush setTimeout in success handler

      expect(component.error()).toBeNull();
    }));
  });
});
