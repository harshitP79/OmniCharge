import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { UserDashboardComponent } from './user-dashboard.component';
import { UserApiService } from '../../../core/services/user-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { of, throwError } from 'rxjs';

describe('UserDashboardComponent', () => {
  let component: UserDashboardComponent;
  let fixture: ComponentFixture<UserDashboardComponent>;
  let userApiSpy: jasmine.SpyObj<UserApiService>;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    userApiSpy = jasmine.createSpyObj('UserApiService', ['getProfile', 'getRechargeHistory']);
    authSpy = jasmine.createSpyObj('AuthService', [], {
      userName: jasmine.createSpy().and.returnValue('Test User')
    });

    await TestBed.configureTestingModule({
      imports: [UserDashboardComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: UserApiService, useValue: userApiSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    }).compileComponents();
  });

  // Helper to create the component
  const createComponent = () => {
    fixture = TestBed.createComponent(UserDashboardComponent);
    component = fixture.componentInstance;
  };

  it('should create', () => {
    userApiSpy.getProfile.and.returnValue(of({ createdDate: '2023-01-01T10:00:00Z' } as any));
    userApiSpy.getRechargeHistory.and.returnValue(of({ content: [], totalElements: 0 } as any));
    createComponent();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  // ==========================================
  // NORMAL WORKING
  // ==========================================
  describe('Normal Working', () => {
    beforeEach(() => {
      userApiSpy.getProfile.and.returnValue(of({ createdDate: '2023-01-01T10:00:00Z' } as any));
      const mockHistory = [
        { id: 2, amount: 500, status: 'SUCCESS', createdDate: '2023-02-01' },
        { id: 1, amount: 200, status: 'SUCCESS', createdDate: '2023-01-15' },
        { id: 3, amount: 100, status: 'FAILED', createdDate: '2023-01-10' }
      ];
      userApiSpy.getRechargeHistory.and.returnValue(of({ content: mockHistory, totalElements: 10 } as any));
      
      createComponent();
      fixture.detectChanges();
    });

    it('should set memberSince from profile data', () => {
      expect(component.memberSince()).toBe('2023-01-01T10:00:00Z');
      expect(userApiSpy.getProfile).toHaveBeenCalled();
    });

    it('should calculate totalCount from page.totalElements', () => {
      expect(component.totalCount()).toBe(10);
    });

    it('should calculate totalSpent dynamically by summing SUCCESS recharges only', () => {
      // 500 + 200 = 700. The 100 FAILED should be ignored.
      expect(component.totalSpent()).toBe(700);
    });

    it('should set lastRecharge to the first item in the history array', () => {
      expect(component.lastRecharge()?.id).toBe(2);
      expect(component.lastRecharge()?.amount).toBe(500);
    });

    it('should set isLoading to false after data is loaded', () => {
      expect(component.isLoading()).toBeFalse();
    });
  });

  // ==========================================
  // BOUNDARY VALUES
  // ==========================================
  describe('Boundary Values', () => {
    it('should handle completely empty history gracefully', () => {
      userApiSpy.getProfile.and.returnValue(of({ createdDate: '2023-01-01T10:00:00Z' } as any));
      userApiSpy.getRechargeHistory.and.returnValue(of({ content: [], totalElements: 0 } as any));
      
      createComponent();
      fixture.detectChanges();

      expect(component.totalCount()).toBe(0);
      expect(component.totalSpent()).toBe(0);
      expect(component.lastRecharge()).toBeNull();
      expect(component.isLoading()).toBeFalse();
    });

    it('should calculate 0 totalSpent if history contains items but none are SUCCESS', () => {
      userApiSpy.getProfile.and.returnValue(of({ createdDate: '2023-01-01' } as any));
      const mockHistory = [
        { id: 1, amount: 500, status: 'FAILED' },
        { id: 2, amount: 200, status: 'PROCESSING' }
      ];
      userApiSpy.getRechargeHistory.and.returnValue(of({ content: mockHistory, totalElements: 2 } as any));
      
      createComponent();
      fixture.detectChanges();

      expect(component.totalSpent()).toBe(0);
      expect(component.lastRecharge()?.id).toBe(1); // The first item is still the last recharge attempt
    });
  });

  // ==========================================
  // EXCEPTION HANDLING
  // ==========================================
  describe('Exception Handling', () => {
    it('should set isLoading to false if getRechargeHistory throws an error', () => {
      userApiSpy.getProfile.and.returnValue(of({ createdDate: '2023-01-01T10:00:00Z' } as any));
      userApiSpy.getRechargeHistory.and.returnValue(throwError(() => new Error('Server error')));
      
      createComponent();
      fixture.detectChanges();

      expect(component.isLoading()).toBeFalse();
      expect(component.totalCount()).toBe(0); // Kept default
      expect(component.totalSpent()).toBe(0); // Kept default
      expect(component.lastRecharge()).toBeNull(); // Kept default
    });

    it('should handle getProfile error gracefully without crashing', () => {
      userApiSpy.getProfile.and.returnValue(throwError(() => new Error('Profile error')));
      userApiSpy.getRechargeHistory.and.returnValue(of({ content: [], totalElements: 0 } as any));
      
      createComponent();
      fixture.detectChanges(); // Should not throw

      expect(component.memberSince()).toBeNull();
      expect(component.isLoading()).toBeFalse(); // History still loaded
    });
  });
});
