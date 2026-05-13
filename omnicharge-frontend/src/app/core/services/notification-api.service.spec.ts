import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NotificationApiService } from './notification-api.service';
import { mockApiResponse, mockNotificationResponse } from '../../testing/mock-data';
import { Page, NotificationResponse } from '../models/api.models';

describe('NotificationApiService', () => {
  let service: NotificationApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NotificationApiService]
    });
    service = TestBed.inject(NotificationApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
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
    it('should fetch notifications with default pagination', () => {
      const mockPage: Page<NotificationResponse> = {
        content: [mockNotificationResponse],
        totalElements: 1,
        totalPages: 1,
        size: 10,
        page: 0,
        first: true,
        last: true
      };

      service.getNotifications().subscribe(res => {
        expect(res.content.length).toBe(1);
        expect(res.content[0].id).toBe(1);
      });

      const req = httpTestingController.expectOne('/api/notifications?page=0&size=10&sortBy=createdDate&sortDir=DESC');
      expect(req.request.method).toEqual('GET');
      req.flush(mockApiResponse(mockPage));
    });

    it('should get unread notification count', () => {
      service.getUnreadCount().subscribe(count => {
        expect(count).toBe(5);
      });

      const req = httpTestingController.expectOne('/api/notifications/unread-count');
      expect(req.request.method).toEqual('GET');
      req.flush(mockApiResponse(5));
    });

    it('should mark notification as read', () => {
      service.markAsRead(1).subscribe();

      const req = httpTestingController.expectOne('/api/notifications/1/read');
      expect(req.request.method).toEqual('PUT');
      expect(req.request.body).toEqual({});
      req.flush(mockApiResponse(null));
    });
  });

  // ==========================================
  // BOUNDARY VALUES & EXCEPTION HANDLING
  // ==========================================
  describe('Boundary Values & Exceptions', () => {
    it('should handle unread count returning 0 correctly', () => {
      service.getUnreadCount().subscribe(count => {
        expect(count).toBe(0);
      });

      const req = httpTestingController.expectOne('/api/notifications/unread-count');
      req.flush(mockApiResponse(0));
    });

    it('should catch 400 Bad Request if notification does not exist when marking as read', () => {
      service.markAsRead(999).subscribe({
        next: () => fail('Expected error'),
        error: error => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpTestingController.expectOne('/api/notifications/999/read');
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });
  });
});
