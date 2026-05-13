import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, Page, Plan, OperatorDetection, Operator } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class RechargeApiService {
  private http = inject(HttpClient);

  detectOperator(mobileNumber: string): Observable<OperatorDetection> {
    return this.http.get<ApiResponse<OperatorDetection>>(`/api/operators/detect?mobileNumber=${mobileNumber}`).pipe(
      map(res => res.data)
    );
  }

  getActiveOperators(): Observable<Operator[]> {
    return this.http.get<ApiResponse<Operator[]>>('/api/operators/active').pipe(
      map(res => res.data)
    );
  }

  searchPlans(operatorId: number, page = 0, size = 10): Observable<Page<Plan>> {
    return this.http.get<ApiResponse<Page<Plan>>>(`/api/plans/search?operatorId=${operatorId}&page=${page}&size=${size}`).pipe(
      map(res => res.data)
    );
  }
}
