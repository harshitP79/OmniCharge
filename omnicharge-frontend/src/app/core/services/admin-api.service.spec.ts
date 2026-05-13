import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminApiService } from './admin-api.service';
import { mockApiResponse, mockUserProfile, mockOperator, mockPlan, mockRechargeResponse } from '../../testing/mock-data';
import { Page, UserProfile, Operator, Plan, RechargeResponse } from '../models/api.models';

describe('AdminApiService', () => {
  let service: AdminApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdminApiService]
    });
    service = TestBed.inject(AdminApiService);
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
    
    // User Management
    it('should fetch users', () => {
      const mockPage: Page<UserProfile> = {
        content: [mockUserProfile], totalElements: 1, totalPages: 1, size: 10, page: 0, first: true, last: true
      };
      
      service.getUsers(0, 10).subscribe(res => {
        expect(res.content.length).toBe(1);
      });

      const req = httpTestingController.expectOne('/api/admin/users?page=0&size=10');
      expect(req.request.method).toEqual('GET');
      req.flush(mockApiResponse(mockPage));
    });

    it('should toggle user status', () => {
      service.toggleUserStatus(1, false).subscribe();
      const req = httpTestingController.expectOne('/api/admin/users/1/status?active=false');
      expect(req.request.method).toEqual('PUT');
      req.flush(mockApiResponse(null));
    });

    // Operator Management
    it('should get all operators without status filter', () => {
      service.getAllOperators().subscribe(res => {
        expect(res.length).toBe(1);
      });
      const req = httpTestingController.expectOne('/api/admin/operators');
      expect(req.request.method).toEqual('GET');
      req.flush(mockApiResponse([mockOperator]));
    });

    it('should create operator', () => {
      const newOp = { name: 'Airtel', code: 'AIR', category: 'PREPAID' };
      service.createOperator(newOp).subscribe(res => {
        expect(res.name).toBe('Jio'); // mocked response
      });
      const req = httpTestingController.expectOne('/api/admin/operators');
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual(newOp);
      req.flush(mockApiResponse(mockOperator));
    });

    it('should update operator', () => {
      const updateOp = { name: 'Jio Updated', code: 'JIO', category: 'PREPAID' };
      service.updateOperator(1, updateOp).subscribe();
      const req = httpTestingController.expectOne('/api/admin/operators/1');
      expect(req.request.method).toEqual('PUT');
      expect(req.request.body).toEqual(updateOp);
      req.flush(mockApiResponse(mockOperator));
    });

    it('should toggle operator activation map (activate/deactivate)', () => {
      service.activateOperator(1).subscribe();
      const req1 = httpTestingController.expectOne('/api/admin/operators/1/activate');
      expect(req1.request.method).toEqual('PATCH');
      req1.flush(mockApiResponse(mockOperator));

      service.deactivateOperator(1).subscribe();
      const req2 = httpTestingController.expectOne('/api/admin/operators/1/deactivate');
      expect(req2.request.method).toEqual('PATCH');
      req2.flush(mockApiResponse(mockOperator));
    });

    it('should delete operator', () => {
      service.deleteOperator(1).subscribe();
      const req = httpTestingController.expectOne('/api/admin/operators/1');
      expect(req.request.method).toEqual('DELETE');
      req.flush(mockApiResponse(null));
    });

    // Plan Management
    it('should get plan categories and cache them', () => {
      service.getPlanCategories().subscribe(res => {
        expect(res).toEqual(['Popular', 'Data']);
      });

      const req = httpTestingController.expectOne('/api/admin/operators/plans/categories');
      expect(req.request.method).toEqual('GET');
      req.flush(mockApiResponse({ categories: ['Popular', 'Data'] }));

      // Second call should not trigger HTTP request due to caching
      service.getPlanCategories().subscribe();
      httpTestingController.expectNone('/api/admin/operators/plans/categories');
    });

    it('should get plans with or without operatorId', () => {
      const mockPage: Page<Plan> = {
        content: [mockPlan], totalElements: 1, totalPages: 1, size: 10, page: 0, first: true, last: true
      };

      service.getPlans(1, 0, 10).subscribe();
      const req1 = httpTestingController.expectOne('/api/admin/operators/plans?page=0&size=10&operatorId=1');
      expect(req1.request.method).toEqual('GET');
      req1.flush(mockApiResponse(mockPage));

      service.getPlans(undefined, 0, 10).subscribe();
      const req2 = httpTestingController.expectOne('/api/admin/operators/plans?page=0&size=10');
      expect(req2.request.method).toEqual('GET');
      req2.flush(mockApiResponse(mockPage));
    });
    
    it('should rebuild cache', () => {
      service.rebuildCache().subscribe();
      const req = httpTestingController.expectOne('/api/admin/cache/rebuild');
      expect(req.request.method).toEqual('POST');
      req.flush(mockApiResponse(null));
    });
  });

  // ==========================================
  // BOUNDARY VALUES & EDGE CASES
  // ==========================================
  describe('Boundary Values', () => {
    it('should handle getAggregatedPerformanceStats properly with zero results', () => {
      const emptyPage: Page<RechargeResponse> = {
        content: [], totalElements: 0, totalPages: 0, size: 10, page: 0, first: true, last: true
      };

      service.getAggregatedPerformanceStats(500).subscribe(stats => {
        expect(stats.totalAnalyzed).toBe(0);
        expect(stats.operators.length).toBe(0);
        expect(stats.topOperator).toBeNull();
      });

      const req = httpTestingController.expectOne('/api/admin/recharges?page=0&size=500');
      req.flush(mockApiResponse(emptyPage));
    });

    it('should accurately aggregate performance stats with duplicate plan names', () => {
       const mockRecharge1 = { ...mockRechargeResponse, operatorName: 'Jio', planName: 'Data Pack' };
       const mockRecharge2 = { ...mockRechargeResponse, operatorName: 'Airtel', planName: 'Voice Pack' };
       const mockRecharge3 = { ...mockRechargeResponse, operatorName: 'Jio', planName: 'Data Pack' };

       const mockPage: Page<RechargeResponse> = {
         content: [mockRecharge1, mockRecharge2 as any, mockRecharge3 as any], 
         totalElements: 3, totalPages: 1, size: 10, page: 0, first: true, last: true
       };

       service.getAggregatedPerformanceStats(100).subscribe(stats => {
         expect(stats.totalAnalyzed).toBe(3);
         expect(stats.operators.length).toBe(2);
         expect(stats.topOperator?.originalName).toBe('Jio');
         expect(stats.topOperator?.count).toBe(2);
         expect(stats.topOperator?.percentage).toBeCloseTo(66.67, 1);
         expect(stats.plans.length).toBe(2);
         expect(stats.topPlan?.originalName).toBe('Data Pack');
       });

       const req = httpTestingController.expectOne('/api/admin/recharges?page=0&size=100');
       req.flush(mockApiResponse(mockPage));
    });
  });

  // ==========================================
  // EXCEPTION HANDLING
  // ==========================================
  describe('Exception Handling', () => {
    it('should catch 403 Forbidden if not admin', () => {
      service.getStats().subscribe({
        next: () => fail('Expected error'),
        error: error => {
          expect(error.status).toBe(403);
        }
      });

      const req = httpTestingController.expectOne('/api/admin/recharges/stats');
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });
  });
});
