import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpHandler, HttpResponse, HttpErrorResponse, HttpHandlerFn } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

describe('authInterceptor', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getAccessToken']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
  });

  function runInterceptor(req: HttpRequest<unknown>, nextFn: HttpHandlerFn) {
    return TestBed.runInInjectionContext(() => authInterceptor(req, nextFn));
  }

  // ==========================================
  // NORMAL WORKING
  // ==========================================
  describe('Normal Working', () => {
    it('should add Authorization header when token exists and URL is not skipped', (done) => {
      authServiceSpy.getAccessToken.and.returnValue('mock-token-123');
      const req = new HttpRequest('GET', '/api/users/profile');
      const mockNext: HttpHandlerFn = (r) => {
        expect(r.headers.get('Authorization')).toEqual('Bearer mock-token-123');
        return of(new HttpResponse({ status: 200 }));
      };

      runInterceptor(req, mockNext).subscribe({
        next: () => done(),
        error: done.fail
      });
    });

    it('should NOT add Authorization header for login endpoint', (done) => {
      authServiceSpy.getAccessToken.and.returnValue('mock-token-123');
      const req = new HttpRequest('POST', '/api/auth/login', {});
      const mockNext: HttpHandlerFn = (r) => {
        expect(r.headers.has('Authorization')).toBeFalse();
        return of(new HttpResponse({ status: 200 }));
      };

      runInterceptor(req, mockNext).subscribe({
        next: () => done(),
        error: done.fail
      });
    });

    it('should NOT add Authorization header for register endpoint', (done) => {
      authServiceSpy.getAccessToken.and.returnValue('mock-token-123');
      const req = new HttpRequest('POST', '/api/auth/register', {});
      const mockNext: HttpHandlerFn = (r) => {
        expect(r.headers.has('Authorization')).toBeFalse();
        return of(new HttpResponse({ status: 200 }));
      };

      runInterceptor(req, mockNext).subscribe({
        next: () => done(),
        error: done.fail
      });
    });

    it('should NOT add Authorization header for google auth endpoint', (done) => {
      authServiceSpy.getAccessToken.and.returnValue('mock-token-123');
      const req = new HttpRequest('POST', '/api/auth/google', {});
      const mockNext: HttpHandlerFn = (r) => {
        expect(r.headers.has('Authorization')).toBeFalse();
        return of(new HttpResponse({ status: 200 }));
      };

      runInterceptor(req, mockNext).subscribe({
        next: () => done(),
        error: done.fail
      });
    });
  });

  // ==========================================
  // BOUNDARY VALUES
  // ==========================================
  describe('Boundary Values', () => {
    it('should NOT add header when token is null', (done) => {
      authServiceSpy.getAccessToken.and.returnValue(null);
      const req = new HttpRequest('GET', '/api/users/profile');
      const mockNext: HttpHandlerFn = (r) => {
        expect(r.headers.has('Authorization')).toBeFalse();
        return of(new HttpResponse({ status: 200 }));
      };

      runInterceptor(req, mockNext).subscribe({
        next: () => done(),
        error: done.fail
      });
    });

    it('should NOT add header when token is empty string', (done) => {
      authServiceSpy.getAccessToken.and.returnValue('');
      const req = new HttpRequest('GET', '/api/users/profile');
      const mockNext: HttpHandlerFn = (r) => {
        expect(r.headers.has('Authorization')).toBeFalse();
        return of(new HttpResponse({ status: 200 }));
      };

      runInterceptor(req, mockNext).subscribe({
        next: () => done(),
        error: done.fail
      });
    });
  });

  // ==========================================
  // EXCEPTION HANDLING
  // ==========================================
  describe('Exception Handling', () => {
    it('should pass through non-401 errors and log them', (done) => {
      authServiceSpy.getAccessToken.and.returnValue('mock-token');
      const req = new HttpRequest('GET', '/api/users/profile');
      const serverError = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
      const mockNext: HttpHandlerFn = () => throwError(() => serverError);

      spyOn(console, 'error');

      runInterceptor(req, mockNext).subscribe({
        next: () => done.fail('Expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
          expect(console.error).toHaveBeenCalled();
          done();
        }
      });
    });

    it('should pass through 401 errors WITHOUT logging them', (done) => {
      authServiceSpy.getAccessToken.and.returnValue('mock-token');
      const req = new HttpRequest('GET', '/api/users/profile');
      const unauthorizedError = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
      const mockNext: HttpHandlerFn = () => throwError(() => unauthorizedError);

      spyOn(console, 'error');

      runInterceptor(req, mockNext).subscribe({
        next: () => done.fail('Expected error'),
        error: (err) => {
          expect(err.status).toBe(401);
          expect(console.error).not.toHaveBeenCalled();
          done();
        }
      });
    });
  });
});
