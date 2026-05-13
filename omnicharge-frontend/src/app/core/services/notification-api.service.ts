import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, Page, NotificationResponse } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class NotificationApiService {
  private http = inject(HttpClient);

  getNotifications(page = 0, size = 10): Observable<Page<NotificationResponse>> {
    return this.http.get<ApiResponse<Page<NotificationResponse>>>(
      `/api/notifications?page=${page}&size=${size}&sortBy=createdDate&sortDir=DESC`
    ).pipe(map(res => res.data));
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<ApiResponse<number>>('/api/notifications/unread-count').pipe(
      map(res => res.data)
    );
  }

  markAsRead(id: number): Observable<void> {
    return this.http.put<ApiResponse<void>>(`/api/notifications/${id}/read`, {}).pipe(
      map(res => res.data)
    );
  }
}
