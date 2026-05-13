import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { mockAuthTokens, mockApiResponse, LocalStorageMock } from '../../testing/mock-data';

describe('AuthService', () => {
  let service: AuthService;
  let httpTestingController: HttpTestingController;
  let router: Router;
  let localStorageMock: LocalStorageMock;

  beforeEach(() => {
    localStorageMock = new LocalStorageMock();
    spyOn(localStorage, 'getItem').and.callFake((key: string) => localStorageMock.getItem(key));
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => localStorageMock.setItem(key, value));
    spyOn(localStorage, 'removeItem').and.callFake((key: string) => localStorageMock.removeItem(key));

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService]
    });

    service = TestBed.inject(AuthService);
    httpTestingController = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
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
    it('should login and store tokens', () => {
      const credentials = { email: 'john@example.com', password: 'password123' };

      service.login(credentials).subscribe(tokens => {
        expect(tokens).toEqual(mockAuthTokens);
        expect(service.isAuth()).toBeTrue();
        expect(service.getUserRole()).toEqual('ROLE_USER');
        expect(service.getAccessToken()).toEqual('mock-access-token-12345');
        expect(service.getUserName()).toEqual('John Doe');
      });

      const req = httpTestingController.expectOne('/api/auth/login');
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual(credentials);
      
      const res = mockApiResponse(mockAuthTokens);
      req.flush(res);

      expect(localStorage.setItem).toHaveBeenCalledWith('token', mockAuthTokens.accessToken);
    });

    it('should logout and clear tokens', () => {
      // Simulate active session
      localStorageMock.setItem('token', 'some-token');
      // Re-instantiate or just call storeSession internally (but it's private so we mock localstorage and hope signals update, 
      // but actually signals grab on inject, so let's just clear manually in test to test logic)
      
      service.logout().subscribe(() => {
        expect(service.isAuth()).toBeFalse();
        expect(service.getAccessToken()).toBeNull();
      });

      const req = httpTestingController.expectOne('/api/auth/logout');
      expect(req.request.method).toEqual('POST');
      req.flush(mockApiResponse(null));

      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    });

    it('should refresh token', () => {
      service.refreshToken('mock-refresh').subscribe(tokens => {
        expect(tokens.accessToken).toBe(mockAuthTokens.accessToken);
      });

      const req = httpTestingController.expectOne('/api/auth/refresh-token');
      expect(req.request.method).toEqual('POST');
      req.flush(mockApiResponse(mockAuthTokens));
    });

    it('should accurately identify admin user', () => {
      const adminTokens = { ...mockAuthTokens, role: 'ROLE_ADMIN' };
      service.login({ email: 'admin@test.com', password: 'abc' }).subscribe();
      
      const req = httpTestingController.expectOne('/api/auth/login');
      req.flush(mockApiResponse(adminTokens));

      expect(service.isAdmin()).toBeTrue();
    });
  });

  // ==========================================
  // BOUNDARY VALUES & EDGE CASES
  // ==========================================
  describe('Boundary Values', () => {
    it('should handle login with empty string inputs gracefully inside service', () => {
      service.login({ email: '', password: '' }).subscribe();
      const req = httpTestingController.expectOne('/api/auth/login');
      expect(req.request.body).toEqual({ email: '', password: '' });
      req.flush(mockApiResponse(mockAuthTokens));
      // Doesn't strictly test server validation, but tests service doesn't crash on empty
      expect(service.isAuth()).toBeTrue();
    });

    it('should clear all traces of tokens on logout even if some are already missing', () => {
      localStorageMock.setItem('token', 'some-token');
      service.clearTokens();
      expect(service.isAuth()).toBeFalse();
      expect(localStorage.removeItem).toHaveBeenCalledTimes(5); // 5 token keys
    });
  });

  // ==========================================
  // EXCEPTION HANDLING
  // ==========================================
  describe('Exception Handling', () => {
    it('should handle login failure 401 Unauthorized', fakeAsync(() => {
      const credentials = { email: 'bad@example.com', password: 'wrong' };
      
      let errorResponse: any;
      service.login(credentials).subscribe({
        next: () => fail('Should have failed with 401 error'),
        error: error => { errorResponse = error; }
      });

      const req = httpTestingController.expectOne('/api/auth/login');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
      tick();

      expect(errorResponse.status).toEqual(401);
      expect(service.isAuth()).toBeFalse(); // Assuming default state is false
    }));

    it('should finalize logout and redirect even if server throws 500 on logout', fakeAsync(() => {
      service.logoutAndRedirect();
      
      const req = httpTestingController.expectOne('/api/auth/logout');
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
      tick();

      expect(localStorage.removeItem).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/public/landing']);
    }));
  });
});
