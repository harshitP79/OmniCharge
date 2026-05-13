import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { rootGuard } from './core/guards/root.guard';

export const routes: Routes = [
  { path: '', canActivate: [rootGuard], children: [] },
  {
    path: 'auth',
    loadComponent: () => import('./core/layouts/public-layout/public-layout.component').then(m => m.PublicLayoutComponent),
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
      { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) }
    ]
  },
  {
    path: 'public',
    loadComponent: () => import('./core/layouts/public-layout/public-layout.component').then(m => m.PublicLayoutComponent),
    children: [
      { path: 'landing', loadComponent: () => import('./features/public/landing/landing.component').then(m => m.LandingComponent) },
      { path: 'plans', loadComponent: () => import('./features/public/plans/plans.component').then(m => m.PlansComponent) }
    ]
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layouts/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', loadComponent: () => import('./features/dashboard/overview/user-dashboard.component').then(m => m.UserDashboardComponent) },
      { path: 'history', loadComponent: () => import('./features/dashboard/history/history.component').then(m => m.HistoryComponent) },
      { path: 'transactions', loadComponent: () => import('./features/dashboard/transactions/transactions.component').then(m => m.TransactionsComponent) },
      { path: 'profile', loadComponent: () => import('./features/dashboard/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'change-password', loadComponent: () => import('./features/dashboard/change-password/change-password.component').then(m => m.ChangePasswordComponent) },
      { path: 'recharge', loadComponent: () => import('./features/recharge/recharge-input/recharge-input.component').then(m => m.RechargeInputComponent) },
      { path: 'plans', loadComponent: () => import('./features/public/plans/plans.component').then(m => m.PlansComponent) },
      { path: 'checkout', loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent) }
    ]
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'users', loadComponent: () => import('./features/admin/users/admin-users.component').then(m => m.AdminUsersComponent) },
      { path: 'operators', loadComponent: () => import('./features/admin/operators/admin-operators.component').then(m => m.AdminOperatorsComponent) },
      { path: 'plans', loadComponent: () => import('./features/admin/plans/admin-plans.component').then(m => m.AdminPlansComponent) },
      { path: 'recharges', loadComponent: () => import('./features/admin/recharges/admin-recharges.component').then(m => m.AdminRechargesComponent) },
      { path: 'analytics', loadComponent: () => import('./features/admin/analytics/admin-analytics.component').then(m => m.AdminAnalyticsComponent) },
      { path: 'system', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'public/landing' }
];
