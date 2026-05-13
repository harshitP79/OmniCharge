import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getAccessToken();

  let authReq = req;
  const skipUrls = ['/api/auth/login', '/api/auth/register', '/api/auth/google'];
  const shouldSkip = skipUrls.some(url => req.url.includes(url));

  if (token && !shouldSkip) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      // Standard logging for unexpected errors
      if (error instanceof HttpErrorResponse && error.status !== 401) {
        console.error('API Error:', error.message);
      }
      return throwError(() => error);
    })
  );
};
