import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="fixed top-0 z-50 w-full border-b border-slate-200/80 bg-white/88 backdrop-blur-xl shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-12">
            <a routerLink="/dashboard" class="text-xl font-bold tracking-[-0.03em] text-slate-900 transition-colors hover:text-blue-700 group">
              Omni<span class="text-blue-700">Charge</span>
            </a>
          </div>

          <!-- Mobile Toggle Button -->
          <div class="flex md:hidden items-center">
            <button (click)="isMobileMenuOpen.set(!isMobileMenuOpen())" class="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path *ngIf="!isMobileMenuOpen()" stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                <path *ngIf="isMobileMenuOpen()" stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Desktop Menu -->
          <div class="hidden md:flex gap-2 items-center">
            <ng-container *ngIf="authService.isAuthenticated(); else unauthDesktop">
              <span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-slate-600">
                {{ authService.isAdmin() ? 'ADMIN' : 'CUSTOMER' }}
              </span>
              
              <a *ngIf="authService.isAdmin()" 
                 routerLink="/admin/dashboard" 
                 class="group relative overflow-hidden rounded-full border border-blue-100 bg-white px-5 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-blue-600 shadow-[0_14px_30px_rgba(37,99,235,0.12)] transition-all duration-500 hover:text-white hover:shadow-xl hover:shadow-blue-500/20">
                <span class="relative z-10 transition-colors duration-300 group-hover:text-white">Admin Panel</span>
                <span class="absolute inset-0 translate-y-full bg-blue-600 transition-transform duration-500 group-hover:translate-y-0"></span>
              </a>

              <a routerLink="/dashboard/history"
                 class="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
                Recharge History
              </a>
              <a routerLink="/dashboard/transactions"
                 class="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
                Payment History
              </a>
              <a routerLink="/dashboard/profile"
                 class="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
                Profile
              </a>
              <button (click)="logout()"
                class="ml-2 rounded-xl px-4 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-50">
                Logout
              </button>
            </ng-container>
            <ng-template #unauthDesktop>
              <a routerLink="/auth/login"
                 class="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
                Login
              </a>
              <a routerLink="/auth/register"
                 class="group relative overflow-hidden rounded-full border border-blue-100 bg-white px-5 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-blue-600 shadow-[0_14px_30px_rgba(37,99,235,0.12)] transition-all duration-500 hover:text-white hover:shadow-xl hover:shadow-blue-500/20">
                <span class="relative z-10 transition-colors duration-300 group-hover:text-white">Sign Up</span>
                <span class="absolute inset-0 translate-y-full bg-blue-600 transition-transform duration-500 group-hover:translate-y-0"></span>
              </a>
            </ng-template>
          </div>
        </div>

        <!-- Mobile Menu Dropdown -->
        <div *ngIf="isMobileMenuOpen()" class="md:hidden flex flex-col gap-3 border-t border-slate-200 pb-4 pt-3">
          <ng-container *ngIf="authService.isAuthenticated(); else unauthMobile">
            <div class="px-2 mb-2">
              <span class="inline-block rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-slate-600">
                {{ authService.isAdmin() ? 'ADMIN' : 'CUSTOMER' }}
              </span>
            </div>
            
            <a *ngIf="authService.isAdmin()" 
               routerLink="/admin/dashboard" 
               (click)="isMobileMenuOpen.set(false)"
               class="group relative mx-2 overflow-hidden rounded-full border border-blue-100 bg-white px-4 py-2.5 text-center text-[11px] font-black uppercase tracking-[0.2em] text-blue-600 shadow-[0_14px_30px_rgba(37,99,235,0.12)] transition-all duration-500 hover:text-white hover:shadow-xl hover:shadow-blue-500/20">
              <span class="relative z-10 transition-colors duration-300 group-hover:text-white">Admin Panel</span>
              <span class="absolute inset-0 translate-y-full bg-blue-600 transition-transform duration-500 group-hover:translate-y-0"></span>
            </a>

            <a routerLink="/dashboard/history"
               (click)="isMobileMenuOpen.set(false)"
               class="block rounded-xl px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
              Recharge History
            </a>
            <a routerLink="/dashboard/transactions"
               (click)="isMobileMenuOpen.set(false)"
               class="block rounded-xl px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
              Payment History
            </a>
            <a routerLink="/dashboard/profile"
               (click)="isMobileMenuOpen.set(false)"
               class="block rounded-xl px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
              Profile
            </a>
            <button (click)="logout()"
              class="mx-2 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-50">
              Logout
            </button>
          </ng-container>
          <ng-template #unauthMobile>
            <a routerLink="/auth/login"
               (click)="isMobileMenuOpen.set(false)"
               class="block rounded-xl px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
              Login
            </a>
            <a routerLink="/auth/register"
               (click)="isMobileMenuOpen.set(false)"
               class="group relative mx-2 overflow-hidden rounded-full border border-blue-100 bg-white px-4 py-2.5 text-center text-[11px] font-black uppercase tracking-[0.2em] text-blue-600 shadow-[0_14px_30px_rgba(37,99,235,0.12)] transition-all duration-500 hover:text-white hover:shadow-xl hover:shadow-blue-500/20">
              <span class="relative z-10 transition-colors duration-300 group-hover:text-white">Sign Up</span>
              <span class="absolute inset-0 translate-y-full bg-blue-600 transition-transform duration-500 group-hover:translate-y-0"></span>
            </a>
          </ng-template>
        </div>
      </div>
    </nav>
  `
})
export class TopbarComponent {
  authService = inject(AuthService);
  private router = inject(Router);
  isMobileMenuOpen = signal(false);

  logout() {
    this.isMobileMenuOpen.set(false);
    this.authService.logoutAndRedirect();
  }
}
