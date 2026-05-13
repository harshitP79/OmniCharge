import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RechargeApiService } from './recharge-api.service';
import { mockApiResponse, mockOperatorDetection, mockOperator, mockPlan } from '../../testing/mock-data';
import { Page, Plan } from '../models/api.models';

describe('RechargeApiService', () => {
  let service: RechargeApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RechargeApiService]
    });
    service = TestBed.inject(RechargeApiService);
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
    it('should detect operator from mobile number', () => {
      service.detectOperator('9876543210').subscribe(res => {
        expect(res).toEqual(mockOperatorDetection);
      });

      const req = httpTestingController.expectOne('/api/operators/detect?mobileNumber=9876543210');
      expect(req.request.method).toEqual('GET');
      req.flush(mockApiResponse(mockOperatorDetection));
    });

    it('should fetch active operators list', () => {
      service.getActiveOperators().subscribe(res => {
        expect(res.length).toBe(1);
        expect(res[0].name).toEqual('Jio');
      });

      const req = httpTestingController.expectOne('/api/operators/active');
      expect(req.request.method).toEqual('GET');
      req.flush(mockApiResponse([mockOperator]));
    });

    it('should search plans by operator with pagination', () => {
      const mockPage: Page<Plan> = {
        content: [mockPlan],
        totalElements: 1,
        totalPages: 1,
        size: 10,
        page: 0,
        first: true,
        last: true
      };

      service.searchPlans(1, 0, 10).subscribe(res => {
        expect(res.content.length).toBe(1);
        expect(res.content[0].planName).toEqual('Daily Data Pack');
      });

      const req = httpTestingController.expectOne('/api/plans/search?operatorId=1&page=0&size=10');
      expect(req.request.method).toEqual('GET');
      req.flush(mockApiResponse(mockPage));
    });
  });

  // ==========================================
  // BOUNDARY VALUES
  // ==========================================
  describe('Boundary Values', () => {
    it('should handle detect operator with country code gracefully (if api handles it)', () => {
      service.detectOperator('+919876543210').subscribe();

      const req = httpTestingController.expectOne('/api/operators/detect?mobileNumber=+919876543210');
      expect(req.request.method).toEqual('GET');
      req.flush(mockApiResponse(mockOperatorDetection));
    });

    it('should handle search plans with negative operator ID gracefully without crashing service', () => {
      service.searchPlans(-1).subscribe();

      const req = httpTestingController.expectOne('/api/plans/search?operatorId=-1&page=0&size=10');
      expect(req.request.method).toEqual('GET');
      req.flush(mockApiResponse({ content: [], totalElements: 0, totalPages: 0, size: 10, page: 0, first: true, last: true }));
    });
  });

  // ==========================================
  // EXCEPTION HANDLING
  // ==========================================
  describe('Exception Handling', () => {
    it('should handle 404 Not Found when operator detection fails', () => {
      service.detectOperator('0000000000').subscribe({
        next: () => fail('Expected error'),
        error: error => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpTestingController.expectOne('/api/operators/detect?mobileNumber=0000000000');
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should catch 500 when active operators list fails', () => {
      service.getActiveOperators().subscribe({
        next: () => fail('Expected error'),
        error: error => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpTestingController.expectOne('/api/operators/active');
      req.flush('Server Error', { status: 500, statusText: 'Server Error' });
    });
  });
});
