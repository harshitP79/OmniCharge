import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError, catchError, switchMap, BehaviorSubject, filter, take } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const authEndpoints = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/google',
    '/api/auth/refresh-token',
    '/api/auth/forgot-password',
    '/api/auth/verify-otp',
    '/api/auth/reset-password'
  ];

  return next(req).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        // Don't intercept auth endpoints themselves
        if (authEndpoints.some(url => req.url.includes(url))) {
          return throwError(() => error);
        }

        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          const refreshToken = authService.getRefreshToken();
          if (refreshToken) {
            // AuthService.refreshToken() already unwraps ApiResponse<AuthTokens>
            return authService.refreshToken(refreshToken).pipe(
              switchMap((tokens) => {
                isRefreshing = false;
                refreshTokenSubject.next(tokens.accessToken);
                return next(req.clone({
                  headers: req.headers.set('Authorization', `Bearer ${tokens.accessToken}`)
                }));
              }),
              catchError((err) => {
                isRefreshing = false;
                authService.clearTokens();
                alert('Session expired, please log in again.');
                router.navigate(['/login']);
                return throwError(() => err);
              })
            );
          } else {
            isRefreshing = false;
            authService.clearTokens();
            alert('Session expired, please log in again.');
            router.navigate(['/login']);
            return throwError(() => error);
          }
        } else {
          return refreshTokenSubject.pipe(
            filter(token => token != null),
            take(1),
            switchMap(jwt => {
              return next(req.clone({
                headers: req.headers.set('Authorization', `Bearer ${jwt}`)
              }));
            })
          );
        }
      }
      return throwError(() => error);
    })
  );
};
