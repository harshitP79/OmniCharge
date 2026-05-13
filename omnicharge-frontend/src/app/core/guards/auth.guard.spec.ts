import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
  });

  it('should allow access if user is authenticated', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    
    // Using TestBed.runInInjectionContext to run a functional guard
    const result = TestBed.runInInjectionContext(() => {
      return authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
    });

    expect(result).toBeTrue();
  });

  it('should redirect to login if user is NOT authenticated', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);
    const mockUrlTree = {} as any;
    routerSpy.createUrlTree.and.returnValue(mockUrlTree);
    
    const result = TestBed.runInInjectionContext(() => {
      return authGuard({} as ActivatedRouteSnapshot, { url: '/dashboard' } as RouterStateSnapshot);
    });

    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/auth/login'], { queryParams: { returnUrl: '/dashboard' }});
    expect(result).toBe(mockUrlTree);
  });
});
