import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { ApiResponse, Page, UserProfile, Operator, Plan, RechargeResponse } from '../models/api.models';

export interface PerformanceItem {
  id: string; 
  originalName: string;
  count: number;
  percentage: number; 
}

export interface AggregatedPerformanceStats {
  totalAnalyzed: number;
  operators: PerformanceItem[]; 
  plans: PerformanceItem[]; 
  topOperator: PerformanceItem | null;
  topPlan: PerformanceItem | null;
}

export interface RechargeStats {
  totalRecharges: number;
  totalAmount: number;
  totalRevenue: number;
  totalUsers: number;
  successCount: number;
  failedCount: number;
  processingCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminApiService {
  private http = inject(HttpClient);

  // ─── User Management ───────────────────────────────────────────────
  
  getUsers(page = 0, size = 10): Observable<Page<UserProfile>> {
    // Backend uses PagedResponse wrapper for users
    return this.http.get<ApiResponse<Page<UserProfile>>>(`/api/admin/users?page=${page}&size=${size}`).pipe(
      map(res => res.data)
    );
  }

  toggleUserStatus(userId: number, active: boolean): Observable<void> {
    return this.http.put<ApiResponse<void>>(`/api/admin/users/${userId}/status?active=${active}`, {}).pipe(
      map(res => res.data)
    );
  }

  // ─── Operator Management ───────────────────────────────────────────

  getAllOperators(status?: 'ACTIVE' | 'INACTIVE' | 'ALL'): Observable<Operator[]> {
    const url = status ? `/api/admin/operators?status=${status}` : '/api/admin/operators';
    return this.http.get<ApiResponse<Operator[]>>(url).pipe(
      map(res => res.data)
    );
  }

  createOperator(operator: { name: string, code: string, category: string, logoUrl?: string }): Observable<Operator> {
    return this.http.post<ApiResponse<Operator>>('/api/admin/operators', operator).pipe(
      map(res => res.data)
    );
  }

  updateOperator(id: number, operator: { name: string, code: string, category: string, logoUrl?: string }): Observable<Operator> {
    return this.http.put<ApiResponse<Operator>>(`/api/admin/operators/${id}`, operator).pipe(
      map(res => res.data)
    );
  }

  deleteOperator(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`/api/admin/operators/${id}`).pipe(
      map(res => res.data)
    );
  }

  activateOperator(id: number): Observable<Operator> {
    return this.http.patch<ApiResponse<Operator>>(`/api/admin/operators/${id}/activate`, {}).pipe(
      map(res => res.data)
    );
  }

  deactivateOperator(id: number): Observable<Operator> {
    return this.http.patch<ApiResponse<Operator>>(`/api/admin/operators/${id}/deactivate`, {}).pipe(
      map(res => res.data)
    );
  }

  // ─── Plan Management ───────────────────────────────────────────────
  
  private _categories$?: Observable<string[]>;

  getPlanCategories(): Observable<string[]> {
    if (!this._categories$) {
      this._categories$ = this.http.get<ApiResponse<{ categories: string[] }>>('/api/admin/operators/plans/categories').pipe(
        map(res => res.data.categories),
        shareReplay(1)
      );
    }
    return this._categories$;
  }

  getPlans(operatorId?: number, page = 0, size = 10): Observable<Page<Plan>> {
    let url = `/api/admin/operators/plans?page=${page}&size=${size}`;
    if (operatorId) url += `&operatorId=${operatorId}`;
    
    return this.http.get<ApiResponse<Page<Plan>>>(url).pipe(
      map(res => res.data)
    );
  }

  createPlan(operatorId: number, plan: Partial<Plan>): Observable<Plan> {
    return this.http.post<ApiResponse<Plan>>(`/api/admin/operators/${operatorId}/plans`, plan).pipe(
      map(res => res.data)
    );
  }

  updatePlan(planId: number, plan: Partial<Plan>): Observable<Plan> {
    return this.http.put<ApiResponse<Plan>>(`/api/admin/operators/plans/${planId}`, plan).pipe(
      map(res => res.data)
    );
  }

  deletePlan(planId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`/api/admin/operators/plans/${planId}`).pipe(
      map(res => res.data)
    );
  }

  activatePlan(planId: number): Observable<Plan> {
    return this.http.patch<ApiResponse<Plan>>(`/api/admin/operators/plans/${planId}/activate`, {}).pipe(
      map(res => res.data)
    );
  }

  deactivatePlan(planId: number): Observable<Plan> {
    return this.http.patch<ApiResponse<Plan>>(`/api/admin/operators/plans/${planId}/deactivate`, {}).pipe(
      map(res => res.data)
    );
  }

  // ─── Recharge & Stats ──────────────────────────────────────────────

  getAllRecharges(page = 0, size = 10): Observable<Page<RechargeResponse>> {
    return this.http.get<ApiResponse<Page<RechargeResponse>>>(`/api/admin/recharges?page=${page}&size=${size}`).pipe(
      map(res => res.data)
    );
  }

  getStats(): Observable<RechargeStats> {
    return this.http.get<ApiResponse<RechargeStats>>('/api/admin/recharges/stats').pipe(
      map(res => res.data)
    );
  }

  getPaymentStats(): Observable<any> {
    return this.http.get<ApiResponse<any>>('/api/admin/payments/stats').pipe(
      map(res => res.data)
    );
  }

  rebuildCache(): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>('/api/admin/cache/rebuild', {});
  }

  // ─── Frontend Aggregation Analytics ────────────────────────────────

  private _performanceStatsCache = new Map<number, Observable<AggregatedPerformanceStats>>();

  getAggregatedPerformanceStats(limit = 500): Observable<AggregatedPerformanceStats> {
    if (!this._performanceStatsCache.has(limit)) {
      const stats$ = this.getAllRecharges(0, limit).pipe(
        map(page => {
          const recharges = page.content;
          const totalAnalyzed = recharges.length;

          if (totalAnalyzed === 0) {
            return {
              totalAnalyzed: 0,
              operators: [],
              plans: [],
              topOperator: null,
              topPlan: null
            };
          }

          // Aggregation using reduce
          const { opMap, planMap } = recharges.reduce((acc, curr) => {
            if (curr.operatorName) {
              const opName = curr.operatorName.trim().toLowerCase();
              if (!acc.opMap[opName]) acc.opMap[opName] = { id: opName, originalName: curr.operatorName, count: 0, percentage: 0 };
              acc.opMap[opName].count++;
            }
            if (curr.planName) {
              const pName = curr.planName.trim().toLowerCase();
              if (!acc.planMap[pName]) acc.planMap[pName] = { id: pName, originalName: curr.planName, count: 0, percentage: 0 };
              acc.planMap[pName].count++;
            }
            return acc;
          }, { 
            opMap: {} as Record<string, PerformanceItem>, 
            planMap: {} as Record<string, PerformanceItem> 
          });

          // Calculate formatting and sorting
          const formatAndSort = (mapObj: Record<string, PerformanceItem>) => {
            return Object.values(mapObj)
              .map(item => ({
                ...item,
                percentage: (item.count / totalAnalyzed) * 100
              }))
              .sort((a, b) => b.count - a.count); // sort descending
          };

          const sortedOperators = formatAndSort(opMap);
          const sortedPlans = formatAndSort(planMap);

          return {
            totalAnalyzed,
            operators: sortedOperators,
            plans: sortedPlans,
            topOperator: sortedOperators.length > 0 ? sortedOperators[0] : null,
            topPlan: sortedPlans.length > 0 ? sortedPlans[0] : null
          };
        }),
        shareReplay({ bufferSize: 1, refCount: true })
      );
      this._performanceStatsCache.set(limit, stats$);
    }
    return this._performanceStatsCache.get(limit)!;
  }

}
