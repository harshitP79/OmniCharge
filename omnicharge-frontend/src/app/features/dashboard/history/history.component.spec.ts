import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HistoryComponent } from './history.component';
import { UserApiService } from '../../../core/services/user-api.service';
import { of, throwError } from 'rxjs';
import { RechargeResponse } from '../../../core/models/api.models';

describe('HistoryComponent', () => {
  let component: HistoryComponent;
  let fixture: ComponentFixture<HistoryComponent>;
  let userApiSpy: jasmine.SpyObj<UserApiService>;

  beforeEach(async () => {
    userApiSpy = jasmine.createSpyObj('UserApiService', ['getRechargeHistory']);

    await TestBed.configureTestingModule({
      imports: [HistoryComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: UserApiService, useValue: userApiSpy }
      ]
    }).compileComponents();
  });

  const createComponent = () => {
    fixture = TestBed.createComponent(HistoryComponent);
    component = fixture.componentInstance;
  };

  it('should create', () => {
    userApiSpy.getRechargeHistory.and.returnValue(of({ content: [], totalElements: 0 } as any));
    createComponent();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  // ==========================================
  // NORMAL WORKING
  // ==========================================
  describe('Normal Working', () => {
    let mockHistory: Partial<RechargeResponse>[];

    beforeEach(() => {
      const today = new Date();
      const future = new Date(today);
      future.setDate(today.getDate() + 10);
      
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      mockHistory = [
        { id: 1, status: 'SUCCESS', planExpiryDate: future.toISOString(), amount: 100 }, // ACTIVE
        { id: 2, status: 'PROCESSING', planExpiryDate: future.toISOString(), amount: 200 }, // PROCESSING
        { id: 3, status: 'EXPIRED', planExpiryDate: yesterday.toISOString(), amount: 300 }, // EXPIRED
        { id: 4, status: 'INITIATED', planExpiryDate: future.toISOString(), amount: 400 }, // PROCESSING
        { id: 5, status: 'SUCCESS', planExpiryDate: yesterday.toISOString(), amount: 500 } // EXPIRED
      ];

      userApiSpy.getRechargeHistory.and.returnValue(of({ content: mockHistory, totalElements: 5 } as any));
      createComponent();
      fixture.detectChanges();
    });

    it('should map INITIATED and PROCESSING to PROCESSING status', () => {
      expect(component.getMappedStatus(mockHistory[1] as any)).toBe('PROCESSING');
      expect(component.getMappedStatus(mockHistory[3] as any)).toBe('PROCESSING');
    });

    it('should map SUCCESS with future expiry as ACTIVE', () => {
      expect(component.getMappedStatus(mockHistory[0] as any)).toBe('ACTIVE');
    });

    it('should map SUCCESS with past expiry as EXPIRED', () => {
      expect(component.getMappedStatus(mockHistory[4] as any)).toBe('EXPIRED');
    });

    it('should calculate stats correctly across categories', () => {
      const stats = component.stats();
      expect(stats.activeCount).toBe(1); // 1 ACTIVE
      expect(stats.processingCount).toBe(2); // 2 PROCESSING
      expect(stats.expiredCount).toBe(2); // 2 EXPIRED
    });

    it('should default filter to ALL', () => {
      expect(component.filter()).toBe('ALL');
      expect(component.filteredHistory().length).toBe(5);
    });

    it('should filter items properly by ACTIVE', () => {
      component.filter.set('ACTIVE');
      const filtered = component.filteredHistory();
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe(1);
    });

    it('should convert map status into human readable display status', () => {
      expect(component.getDisplayStatus(mockHistory[1] as any)).toBe('Pending');
      expect(component.getDisplayStatus(mockHistory[0] as any)).toBe('Active');
    });

    it('should set isLoading to false after mapping history', () => {
      expect(component.isLoading()).toBeFalse();
    });
  });

  // ==========================================
  // BOUNDARY VALUES
  // ==========================================
  describe('Boundary Values', () => {
    it('should return "Expires Today" for SUCCESS with same-day expiry', () => {
      userApiSpy.getRechargeHistory.and.returnValue(of({ content: [], totalElements: 0 } as any));
      createComponent();

      // Same-day expiry should show "Expires Today" using date-only comparison
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      const diff = component.getDaysLeft({ status: 'SUCCESS', planExpiryDate: endOfToday.toISOString() } as any);
      expect(diff).toBe('Expires Today');
    });

    it('should return "1 Day" (singular) for SUCCESS expiring tomorrow', () => {
      userApiSpy.getRechargeHistory.and.returnValue(of({ content: [], totalElements: 0 } as any));
      createComponent();

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const diff = component.getDaysLeft({ status: 'SUCCESS', planExpiryDate: tomorrow.toISOString() } as any);
      expect(diff).toBe('1 Day');
    });

    it('should return Expired for FAILED items regardless of expiry date', () => {
      userApiSpy.getRechargeHistory.and.returnValue(of({ content: [], totalElements: 0 } as any));
      createComponent();

      const future = new Date();
      future.setDate(future.getDate() + 10);
      const diff = component.getDaysLeft({ status: 'FAILED', planExpiryDate: future.toISOString() } as any);
      expect(diff).toBe('Expired');
    });

    it('should return Expired for days left when status is already EXPIRED', () => {
      userApiSpy.getRechargeHistory.and.returnValue(of({ content: [], totalElements: 0 } as any));
      createComponent();

      const future = new Date();
      future.setDate(future.getDate() + 10);
      const diff = component.getDaysLeft({ status: 'EXPIRED', planExpiryDate: future.toISOString() } as any);
      expect(diff).toBe('Expired');
    });

    it('should identify expiring soon if diff is between 1 and 6 days', () => {
      userApiSpy.getRechargeHistory.and.returnValue(of({ content: [], totalElements: 0 } as any));
      createComponent();

      const future = new Date();
      future.setDate(future.getDate() + 5);
      
      const item = { status: 'SUCCESS', planExpiryDate: future.toISOString() } as any;
      expect(component.isExpiringSoon(item)).toBeTrue();
    });

    it('should NOT identify expiring soon if diff is 7 or more days', () => {
      userApiSpy.getRechargeHistory.and.returnValue(of({ content: [], totalElements: 0 } as any));
      createComponent();

      const future = new Date();
      future.setDate(future.getDate() + 8);
      
      const item = { status: 'SUCCESS', planExpiryDate: future.toISOString() } as any;
      expect(component.isExpiringSoon(item)).toBeFalse();
    });

    it('should map unknown status to itself safely', () => {
      userApiSpy.getRechargeHistory.and.returnValue(of({ content: [], totalElements: 0 } as any));
      createComponent();

      expect(component.getMappedStatus({ status: 'REFUNDED' } as any)).toBe('REFUNDED');
      expect(component.getDisplayStatus({ status: 'REFUNDED' } as any)).toBe('REFUNDED');
    });
  });

  // ==========================================
  // EXCEPTION HANDLING
  // ==========================================
  describe('Exception Handling', () => {
    it('should safely halt loading and handle failed history fetch', () => {
      userApiSpy.getRechargeHistory.and.returnValue(throwError(() => new Error('Db offline')));
      createComponent();
      fixture.detectChanges();

      expect(component.isLoading()).toBeFalse();
      expect(component.history().length).toBe(0);
      expect(component.stats().activeCount).toBe(0);
    });

    it('should safely fall back if planExpiryDate is missing or malformed', () => {
      userApiSpy.getRechargeHistory.and.returnValue(of({ content: [
        { id: 9, status: 'SUCCESS', planExpiryDate: null }
      ], totalElements: 1 } as any));
      createComponent();
      fixture.detectChanges();

      // Given a null date, `new Date(item.planExpiryDate) < new Date()` is usually NOT reliable, 
      // but in Javascript `new Date(null)` is `1970-01-01`.
      // It should be mapped to EXPIRED because 1970 is in the past.
      expect(component.getMappedStatus(component.history()[0])).toBe('EXPIRED');
    });
  });
});
