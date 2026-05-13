import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, Page, RechargeResponse, TransactionResponse, RechargeRequest } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class PaymentApiService {
  private http = inject(HttpClient);

  /**
   * POST /api/recharges 
   * Returns ApiResponse<RechargeResponse>
   */
  initiateRecharge(payload: RechargeRequest): Observable<RechargeResponse> {
    return this.http.post<ApiResponse<RechargeResponse>>('/api/recharges', payload).pipe(
      map(res => res.data)
    );
  }

  /**
   * GET /api/payments/history
   * Returns ApiResponse<Page<TransactionResponse>>
   */
  getPaymentHistory(page = 0, size = 50): Observable<Page<TransactionResponse>> {
    return this.http.get<ApiResponse<Page<TransactionResponse>>>(`/api/payments/history?page=${page}&size=${size}`).pipe(
      map(res => res.data)
    );
  }

  /**
   * POST /api/payments/webhook/confirm/{transactionId}
   * Uses @RequestParam for razorpay fields
   */
  confirmPayment(transactionId: string, razorpayPaymentId: string, razorpaySignature: string): Observable<TransactionResponse> {
    const params = {
      razorpayPaymentId,
      razorpaySignature
    };
    return this.http.post<ApiResponse<TransactionResponse>>(`/api/payments/webhook/confirm/${transactionId}`, null, {
      params
    }).pipe(
      map(res => res.data)
    );
  }

  /**
   * POST /api/payments/webhook/cancel/{transactionId}
   * Formally signals that the user has aborted the payment process
   */
  cancelPayment(transactionId: string): Observable<{ status: string }> {
    return this.http.post<ApiResponse<{ status: string }>>(`/api/payments/webhook/cancel/${transactionId}`, null).pipe(
      map(res => res.data)
    );
  }
}
