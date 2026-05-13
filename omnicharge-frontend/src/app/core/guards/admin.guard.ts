import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.isAdmin()) {
    return true;
  }

  // Redirect non-admins to dashboard or landing
  if (authService.isAuthenticated()) {
    router.navigate(['/dashboard/history']);
  } else {
    router.navigate(['/auth/login'], { queryParams: { returnUrl: '/admin/dashboard' } });
  }
  
  return false;
};
