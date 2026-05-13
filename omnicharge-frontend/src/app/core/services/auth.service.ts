import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, of } from 'rxjs';
import { AuthTokens, ApiResponse } from '../models/api.models';
import { Router } from '@angular/router';

export interface AuthState {
  isAuthenticated: boolean;
  role: 'ROLE_USER' | 'ROLE_ADMIN' | null;
  token: string | null;
  email: string | null;
  fullName: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'token';
  private readonly ROLE_KEY = 'role';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly EMAIL_KEY = 'user_email';
  private readonly NAME_KEY = 'user_name';

  private http = inject(HttpClient);
  private router = inject(Router);

  // Central Auth State Signal
  private state = signal<AuthState>({
    isAuthenticated: !!localStorage.getItem(this.TOKEN_KEY),
    role: localStorage.getItem(this.ROLE_KEY) as AuthState['role'],
    token: localStorage.getItem(this.TOKEN_KEY),
    email: localStorage.getItem(this.EMAIL_KEY),
    fullName: localStorage.getItem(this.NAME_KEY)
  });

  // Read-only computed signals for components
  readonly authState = this.state.asReadonly();
  readonly isAuthenticated = computed(() => this.state().isAuthenticated);
  readonly userRole = computed(() => this.state().role);
  readonly userName = computed(() => this.state().fullName);
  readonly userEmail = computed(() => this.state().email);

  login(credentials: { email: string; password: string }): Observable<AuthTokens> {
    return this.http.post<ApiResponse<AuthTokens>>('/api/auth/login', credentials).pipe(
      map(res => res.data),
      tap(tokens => this.storeSession(tokens))
    );
  }

  register(payload: { fullName: string; email: string; password: string; mobileNumber: string }): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>('/api/auth/register', payload);
  }

  refreshToken(refreshToken: string): Observable<AuthTokens> {
    return this.http.post<ApiResponse<AuthTokens>>('/api/auth/refresh-token', { refreshToken }).pipe(
      map(res => res.data),
      tap(tokens => this.storeSession(tokens))
    );
  }

  forgotPassword(email: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>('/api/auth/forgot-password', { email });
  }

  verifyOtp(email: string, otp: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>('/api/auth/verify-otp', { email, otp });
  }

  resetPassword(email: string, otp: string, newPassword: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>('/api/auth/reset-password', { email, otp, newPassword });
  }

  logout(): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>('/api/auth/logout', {}).pipe(
      tap(() => this.clearTokens())
    );
  }

  loginWithGoogle(idToken: string): Observable<AuthTokens> {
    return this.http.post<ApiResponse<AuthTokens>>('/api/auth/google', {
      token: idToken,
      idToken
    }).pipe(
      map(res => res.data),
      tap(tokens => this.storeSession(tokens))
    );
  }

  private storeSession(tokens: AuthTokens) {
    // 1. Clear any existing session to prevent identity leakage during switch
    this.clearTokens();

    // 2. Persist new session to storage
    localStorage.setItem(this.TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken || '');
    localStorage.setItem(this.ROLE_KEY, tokens.role || '');
    localStorage.setItem(this.EMAIL_KEY, tokens.email || '');
    localStorage.setItem(this.NAME_KEY, tokens.fullName || '');

    // 3. Update central state signal atomically
    this.state.set({
      isAuthenticated: true,
      role: tokens.role as AuthState['role'],
      token: tokens.accessToken,
      email: tokens.email,
      fullName: tokens.fullName
    });
  }

  getAccessToken(): string | null {
    return this.state().token || localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getUserRole(): string | null {
    return this.state().role;
  }

  getUserName(): string | null {
    return this.state().fullName;
  }

  clearTokens() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.EMAIL_KEY);
    localStorage.removeItem(this.NAME_KEY);
    
    this.state.set({
      isAuthenticated: false,
      role: null,
      token: null,
      email: null,
      fullName: null
    });
  }

  isAuth(): boolean {
    return this.state().isAuthenticated;
  }

  isAdmin(): boolean {
    return this.state().role === 'ROLE_ADMIN';
  }

  logoutAndRedirect() {
    this.logout().subscribe({
      next: () => this.finalizeLogout(),
      error: () => this.finalizeLogout()
    });
  }

  private finalizeLogout() {
    this.clearTokens();
    this.router.navigate(['/public/landing']);
  }
}
