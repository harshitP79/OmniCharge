import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserApiService } from './user-api.service';
import { mockApiResponse, mockUserProfile, mockRechargeResponse } from '../../testing/mock-data';
import { Page, UserProfile, UserRechargeStats, RechargeResponse } from '../models/api.models';

describe('UserApiService', () => {
  let service: UserApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserApiService]
    });
    service = TestBed.inject(UserApiService);
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
    it('should fetch user recharge history', () => {
      const mockPage: Page<RechargeResponse> = {
        content: [mockRechargeResponse],
        totalElements: 1,
        totalPages: 1,
        size: 10,
        page: 0,
        first: true,
        last: true
      };

      service.getRechargeHistory(0, 10).subscribe(res => {
        expect(res.content.length).toBe(1);
        expect(res.content[0].rechargeId).toBe('REC-12345');
      });

      const req = httpTestingController.expectOne('/api/recharges/history?page=0&size=10');
      expect(req.request.method).toEqual('GET');
      req.flush(mockApiResponse(mockPage));
    });

    it('should fetch dashboard stats', () => {
      const mockStats: UserRechargeStats = { activeCount: 5, processingCount: 1, expiredCount: 2 };
      
      service.getDashboardStats().subscribe(stats => {
        expect(stats).toEqual(mockStats);
      });

      const req = httpTestingController.expectOne('/api/recharges/stats/me');
      expect(req.request.method).toEqual('GET');
      req.flush(mockApiResponse(mockStats));
    });

    it('should get user profile', () => {
      service.getProfile().subscribe(profile => {
        expect(profile).toEqual(mockUserProfile);
      });

      const req = httpTestingController.expectOne('/api/users/profile');
      expect(req.request.method).toEqual('GET');
      req.flush(mockApiResponse(mockUserProfile));
    });

    it('should update user profile', () => {
      const updateData = { fullName: 'Will Smith', mobileNumber: '9999999999' };
      const updatedProfile: UserProfile = { ...mockUserProfile, ...updateData };

      service.updateProfile(updateData).subscribe(profile => {
        expect(profile.fullName).toBe('Will Smith');
      });

      const req = httpTestingController.expectOne('/api/users/profile');
      expect(req.request.method).toEqual('PUT');
      expect(req.request.body).toEqual(updateData);
      req.flush(mockApiResponse(updatedProfile));
    });

    it('should change password successfully', () => {
      service.changePassword({ currentPassword: 'old', newPassword: 'new' }).subscribe();

      const req = httpTestingController.expectOne('/api/users/change-password');
      expect(req.request.method).toEqual('PUT');
      req.flush(mockApiResponse(null));
    });
  });

  // ==========================================
  // BOUNDARY VALUES & EXCEPTION HANDLING
  // ==========================================
  describe('Boundary Values & Exceptions', () => {
    it('should handle profile update with only partial fields', () => {
      service.updateProfile({ fullName: 'Just Name' }).subscribe();

      const req = httpTestingController.expectOne('/api/users/profile');
      expect(req.request.body).toEqual({ fullName: 'Just Name' });
      req.flush(mockApiResponse({ ...mockUserProfile, fullName: 'Just Name' }));
    });

    it('should handle 404 when profile not found', () => {
      service.getProfile().subscribe({
        next: () => fail('Expected error'),
        error: error => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpTestingController.expectOne('/api/users/profile');
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });
});
