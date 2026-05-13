import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const rootGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // If authenticated, navigate to dashboard
    return router.parseUrl('/dashboard');
  } else {
    // If not authenticated, navigate to landing page
    return router.parseUrl('/public/landing');
  }
};
