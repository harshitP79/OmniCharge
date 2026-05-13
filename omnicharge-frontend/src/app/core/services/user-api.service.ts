import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, Page, RechargeResponse, UserProfile, UserRechargeStats } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class UserApiService {
  private http = inject(HttpClient);

  getRechargeHistory(page = 0, size = 10): Observable<Page<RechargeResponse>> {
    return this.http.get<ApiResponse<Page<RechargeResponse>>>(`/api/recharges/history?page=${page}&size=${size}`).pipe(
      map(res => res.data)
    );
  }

  getDashboardStats(): Observable<UserRechargeStats> {
    return this.http.get<ApiResponse<UserRechargeStats>>('/api/recharges/stats/me').pipe(
      map(res => res.data)
    );
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<ApiResponse<UserProfile>>('/api/users/profile').pipe(
      map(res => res.data)
    );
  }

  updateProfile(profile: { fullName: string, mobileNumber?: string }): Observable<UserProfile> {
    return this.http.put<ApiResponse<UserProfile>>('/api/users/profile', profile).pipe(
      map(res => res.data)
    );
  }

  changePassword(passwords: { currentPassword: string, newPassword: string }): Observable<void> {
    return this.http.put<ApiResponse<void>>('/api/users/change-password', passwords).pipe(
      map(() => void 0)
    );
  }
}
