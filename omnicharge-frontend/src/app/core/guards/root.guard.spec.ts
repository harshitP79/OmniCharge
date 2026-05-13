import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { rootGuard } from './root.guard';
import { AuthService } from '../services/auth.service';

describe('rootGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    routerSpy = jasmine.createSpyObj('Router', ['parseUrl']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
  });

  // ==========================================
  // NORMAL WORKING
  // ==========================================
  describe('Normal Working', () => {
    it('should redirect authenticated users to /dashboard', () => {
      authServiceSpy.isAuthenticated.and.returnValue(true);
      const mockUrlTree = {} as any;
      routerSpy.parseUrl.and.returnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() => rootGuard({} as any, {} as any));

      expect(routerSpy.parseUrl).toHaveBeenCalledWith('/dashboard');
      expect(result).toBe(mockUrlTree);
    });

    it('should redirect unauthenticated users to /public/landing', () => {
      authServiceSpy.isAuthenticated.and.returnValue(false);
      const mockUrlTree = {} as any;
      routerSpy.parseUrl.and.returnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() => rootGuard({} as any, {} as any));

      expect(routerSpy.parseUrl).toHaveBeenCalledWith('/public/landing');
      expect(result).toBe(mockUrlTree);
    });
  });
});
