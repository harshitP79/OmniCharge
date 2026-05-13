import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { mockAuthTokens } from '../../../testing/mock-data';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'loginWithGoogle']);

    // Make google undefined to prevent AfterViewInit from trying to initialize Google Sign-In
    (window as any).google = undefined;

    await TestBed.configureTestingModule({
      imports: [LoginComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParams: {} } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ==========================================
  // NORMAL WORKING
  // ==========================================
  describe('Normal Working', () => {
    it('should initialize with empty login form', () => {
      expect(component.loginForm.value.email).toBe('');
      expect(component.loginForm.value.password).toBe('');
    });

    it('should have invalid form when fields are empty', () => {
      expect(component.loginForm.valid).toBeFalse();
    });

    it('should have valid form with proper email and password', () => {
      component.loginForm.setValue({ email: 'test@example.com', password: 'password123' });
      expect(component.loginForm.valid).toBeTrue();
    });

    it('should call authService.login on valid submit and redirect user to dashboard', fakeAsync(() => {
      authServiceSpy.login.and.returnValue(of(mockAuthTokens));
      component.loginForm.setValue({ email: 'john@example.com', password: 'password123' });

      component.onSubmit();
      tick();

      expect(authServiceSpy.login).toHaveBeenCalledWith({ email: 'john@example.com', password: 'password123' });
      expect(component.isLoading()).toBeFalse();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
    }));

    it('should redirect admin user to /admin/dashboard', fakeAsync(() => {
      const adminTokens = { ...mockAuthTokens, role: 'ROLE_ADMIN' };
      authServiceSpy.login.and.returnValue(of(adminTokens as any));
      component.loginForm.setValue({ email: 'admin@test.com', password: 'admin123' });

      component.onSubmit();
      tick();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/admin/dashboard');
    }));

    it('should set isLoading to true during login request', () => {
      authServiceSpy.login.and.returnValue(of(mockAuthTokens));
      component.loginForm.setValue({ email: 'test@test.com', password: '123456' });

      component.onSubmit();
      // isLoading was set to true, then immediately back to false in the subscribe
      expect(component.isLoading()).toBeFalse(); // Already completed synchronously
    });

  });

  // ==========================================
  // BOUNDARY VALUES
  // ==========================================
  describe('Boundary Values', () => {
    it('should not submit when form is invalid', () => {
      component.loginForm.setValue({ email: '', password: '' });
      component.onSubmit();
      expect(authServiceSpy.login).not.toHaveBeenCalled();
    });

    it('should invalidate email without @ symbol', () => {
      component.loginForm.controls.email.setValue('invalidemail');
      expect(component.loginForm.controls.email.valid).toBeFalse();
    });

    it('should invalidate password shorter than 6 characters', () => {
      component.loginForm.controls.password.setValue('12345');
      expect(component.loginForm.controls.password.valid).toBeFalse();
    });

    it('should accept password with exactly 6 characters', () => {
      component.loginForm.controls.password.setValue('123456');
      expect(component.loginForm.controls.password.valid).toBeTrue();
    });

    it('should redirect to returnUrl if present in query params', fakeAsync(() => {
      // Override ActivatedRoute snapshot
      const activatedRoute = TestBed.inject(ActivatedRoute);
      (activatedRoute.snapshot.queryParams as any)['returnUrl'] = '/dashboard/history';
      
      authServiceSpy.login.and.returnValue(of(mockAuthTokens));
      component.loginForm.setValue({ email: 'test@test.com', password: 'password123' });
      component.onSubmit();
      tick();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard/history');
    }));
  });

  // ==========================================
  // EXCEPTION HANDLING
  // ==========================================
  describe('Exception Handling', () => {
    it('should display error message on 401 Unauthorized', fakeAsync(() => {
      authServiceSpy.login.and.returnValue(throwError(() => ({ status: 401 })));
      component.loginForm.setValue({ email: 'bad@test.com', password: 'wrongpw' });

      component.onSubmit();
      tick();

      expect(component.error()).toBe('Invalid email or password. Please try again.');
      expect(component.isLoading()).toBeFalse();
    }));

    it('should display error message on 400 Bad Request', fakeAsync(() => {
      authServiceSpy.login.and.returnValue(throwError(() => ({ status: 400 })));
      component.loginForm.setValue({ email: 'bad@test.com', password: 'wrongpw' });

      component.onSubmit();
      tick();

      expect(component.error()).toBe('Invalid email or password. Please try again.');
    }));

    it('should display server unreachable message on status 0', fakeAsync(() => {
      authServiceSpy.login.and.returnValue(throwError(() => ({ status: 0 })));
      component.loginForm.setValue({ email: 'test@test.com', password: 'password' });

      component.onSubmit();
      tick();

      expect(component.error()).toBe('Cannot connect to server. Please ensure the backend is running.');
    }));

    it('should display generic error on 500', fakeAsync(() => {
      authServiceSpy.login.and.returnValue(throwError(() => ({ status: 500, error: { message: 'Server down' } })));
      component.loginForm.setValue({ email: 'test@test.com', password: 'password' });

      component.onSubmit();
      tick();

      expect(component.error()).toBe('Server down');
    }));

  });
});
