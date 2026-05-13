import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NotificationBellComponent } from './notification-bell.component';
import { NotificationApiService } from '../../../core/services/notification-api.service';
import { of, throwError } from 'rxjs';
import { mockNotificationResponse } from '../../../testing/mock-data';
import { Page, NotificationResponse } from '../../../core/models/api.models';

describe('NotificationBellComponent', () => {
  let component: NotificationBellComponent;
  let fixture: ComponentFixture<NotificationBellComponent>;
  let apiSpy: jasmine.SpyObj<NotificationApiService>;

  const mockPage: Page<NotificationResponse> = {
    content: [mockNotificationResponse],
    totalElements: 1,
    totalPages: 1,
    size: 15,
    page: 0,
    first: true,
    last: true
  };

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('NotificationApiService', ['getUnreadCount', 'getNotifications', 'markAsRead']);
    apiSpy.getUnreadCount.and.returnValue(of(3));
    apiSpy.getNotifications.and.returnValue(of(mockPage));
    apiSpy.markAsRead.and.returnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [NotificationBellComponent],
      providers: [
        { provide: NotificationApiService, useValue: apiSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationBellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy(); // Clean up polling interval
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ==========================================
  // NORMAL WORKING
  // ==========================================
  describe('Normal Working', () => {
    it('should poll unread count on init', () => {
      expect(apiSpy.getUnreadCount).toHaveBeenCalled();
      expect(component.unreadCount()).toBe(3);
    });

    it('should display unread badge when count > 0', () => {
      fixture.detectChanges();
      const badge = fixture.nativeElement.querySelector('span');
      expect(badge).toBeTruthy();
      expect(badge.textContent.trim()).toBe('3');
    });

    it('should toggle panel open on button click', () => {
      expect(component.isPanelOpen()).toBeFalse();
      
      const btn = fixture.nativeElement.querySelector('button');
      btn.click();
      fixture.detectChanges();

      expect(component.isPanelOpen()).toBeTrue();
      expect(apiSpy.getNotifications).toHaveBeenCalled();
    });

    it('should close panel on second click', () => {
      const btn = fixture.nativeElement.querySelector('button');
      btn.click(); // open
      btn.click(); // close
      expect(component.isPanelOpen()).toBeFalse();
    });

    it('should load notifications when panel is opened', () => {
      component.togglePanel(new Event('click'));
      expect(apiSpy.getNotifications).toHaveBeenCalledWith(0, 15);
      expect(component.notifications().length).toBe(1);
    });

    it('should mark a notification as read', () => {
      component.togglePanel(new Event('click'));
      const unreadNotification = { ...mockNotificationResponse, isRead: false };
      component.notifications.set([unreadNotification]);
      component.unreadCount.set(1);

      component.markRead(unreadNotification);
      expect(apiSpy.markAsRead).toHaveBeenCalledWith(unreadNotification.id);
    });

    it('should not call markAsRead if notification is already read', () => {
      const readNotification = { ...mockNotificationResponse, isRead: true };
      component.markRead(readNotification);
      expect(apiSpy.markAsRead).not.toHaveBeenCalled();
    });

    it('should mark all as read', () => {
      const unread1 = { ...mockNotificationResponse, id: 1, isRead: false };
      const unread2 = { ...mockNotificationResponse, id: 2, isRead: false };
      component.notifications.set([unread1, unread2]);
      component.unreadCount.set(2);

      component.markAllAsRead();
      expect(apiSpy.markAsRead).toHaveBeenCalledTimes(2);
      expect(component.unreadCount()).toBe(0);
    });
  });

  // ==========================================
  // BOUNDARY VALUES
  // ==========================================
  describe('Boundary Values', () => {
    it('should display 99+ when unread count exceeds 99', () => {
      component.unreadCount.set(150);
      fixture.detectChanges();
      const badge = fixture.nativeElement.querySelector('span');
      expect(badge.textContent.trim()).toBe('99+');
    });

    it('should not display badge when unread count is 0', () => {
      component.unreadCount.set(0);
      fixture.detectChanges();
      // The *ngIf="unreadCount() > 0" should hide the badge
      const allSpans = fixture.nativeElement.querySelectorAll('span');
      // No badge span should be rendered with the animate-pulse class
      const badge = fixture.nativeElement.querySelector('.animate-pulse');
      expect(badge).toBeNull();
    });

    it('should show empty state when no notifications exist', () => {
      apiSpy.getNotifications.and.returnValue(of({
        content: [], totalElements: 0, totalPages: 0, size: 15, page: 0, first: true, last: true
      }));
      component.togglePanel(new Event('click'));
      fixture.detectChanges();
      expect(component.notifications().length).toBe(0);
    });

    it('should format category correctly', () => {
      expect(component.formatCategory('PAYMENT_SUCCESS')).toBe('PAYMENT SUCCESS');
      expect(component.formatCategory('PLAN_EXPIRY_REMINDER')).toBe('PLAN EXPIRY REMINDER');
    });

    it('should return correct category icons', () => {
      expect(component.getCategoryIcon('PAYMENT_SUCCESS')).toBe('✅');
      expect(component.getCategoryIcon('PAYMENT_FAILED')).toBe('❌');
      expect(component.getCategoryIcon('PLAN_EXPIRY_REMINDER')).toBe('⏰');
      expect(component.getCategoryIcon('PLAN_EXPIRED')).toBe('📅');
      expect(component.getCategoryIcon('UNKNOWN')).toBe('🔔');
    });

    it('should calculate time ago correctly', () => {
      const now = new Date();
      expect(component.getTimeAgo(new Date(now.getTime() - 120000).toISOString())).toContain('m ago');
      expect(component.getTimeAgo('')).toBe('');
    });

    it('should handle "Just now" time ago', () => {
      const now = new Date();
      const result = component.getTimeAgo(new Date(now.getTime() - 10000).toISOString()); // 10 seconds ago
      expect(result).toBe('Just now');
    });
  });

  // ==========================================
  // EXCEPTION HANDLING
  // ==========================================
  describe('Exception Handling', () => {
    it('should silently handle polling error', () => {
      apiSpy.getUnreadCount.and.returnValue(throwError(() => new Error('Network error')));
      // Should not throw
      expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should handle notification load error gracefully', () => {
      apiSpy.getNotifications.and.returnValue(throwError(() => new Error('Server down')));
      component.togglePanel(new Event('click'));
      expect(component.isLoading()).toBeFalse();
    });

    it('should close panel on outside click', () => {
      component.isPanelOpen.set(true);
      // Simulate document click outside the component
      const outsideEvent = new Event('click');
      Object.defineProperty(outsideEvent, 'target', { value: document.body });
      component.onClickOutside(outsideEvent);
      expect(component.isPanelOpen()).toBeFalse();
    });

    it('should clean up polling interval on destroy', fakeAsync(() => {
      spyOn(window, 'clearInterval');
      component.ngOnDestroy();
      expect(window.clearInterval).toHaveBeenCalled();
    }));
  });
});
