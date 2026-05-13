import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { NotificationBellComponent } from '../../../shared/components/notification-bell/notification-bell.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationBellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative flex h-screen overflow-hidden bg-transparent font-sans text-slate-900">
      <div class="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div class="cosmic-orb right-[-10%] top-[-20%] h-[500px] w-[500px] bg-blue-300/60 blur-[120px]"></div>
        <div class="cosmic-orb bottom-[-10%] left-[-5%] h-[380px] w-[380px] bg-sky-300/60 blur-[100px]"></div>
        <div class="star left-[10%] top-[15%]"></div>
        <div class="star left-[85%] top-[40%] animation-delay-1000"></div>
        <div class="star left-[25%] top-[80%] animation-delay-2000"></div>
      </div>

      <div
        *ngIf="isMobileSidebarOpen()"
        class="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden"
        (click)="isMobileSidebarOpen.set(false)"
      ></div>

      <aside
        class="fixed inset-y-0 left-0 z-50 w-72 lg:static bg-white/70 backdrop-blur-xl border-r border-white/50 flex flex-col shrink-0 transition-transform duration-300 lg:translate-x-0"
        [class.-translate-x-full]="!isMobileSidebarOpen()"
        [class.translate-x-0]="isMobileSidebarOpen()"
      >
        <div class="h-20 px-8 flex items-center justify-between border-b border-slate-200/50">
          <a routerLink="/dashboard" class="text-lg font-bold tracking-tight text-slate-900 transition-colors hover:text-blue-700" (click)="isMobileSidebarOpen.set(false)">
            OmniCharge
          </a>
          <button (click)="isMobileSidebarOpen.set(false)" class="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav class="custom-scrollbar mt-6 flex-grow space-y-1 overflow-y-auto px-4">
          <p class="mb-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Overview</p>

          <a
            routerLink="/dashboard/overview"
            #dashboardLink="routerLinkActive"
            routerLinkActive=""
            (click)="isMobileSidebarOpen.set(false)"
            [ngClass]="dashboardLink.isActive ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-900'"
            class="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200"
          >
            <svg class="w-5 h-5 flex-shrink-0" [ngClass]="dashboardLink.isActive ? 'text-blue-600' : 'text-slate-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Dashboard
          </a>
          <a
            routerLink="/dashboard/history"
            #historyLink="routerLinkActive"
            routerLinkActive=""
            (click)="isMobileSidebarOpen.set(false)"
            [ngClass]="historyLink.isActive ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-900'"
            class="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 mt-1"
          >
            <svg class="w-5 h-5 flex-shrink-0" [ngClass]="historyLink.isActive ? 'text-blue-600' : 'text-slate-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recharge History
          </a>
          <a
            routerLink="/dashboard/transactions"
            #transLink="routerLinkActive"
            routerLinkActive=""
            (click)="isMobileSidebarOpen.set(false)"
            [ngClass]="transLink.isActive ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-900'"
            class="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 mt-1"
          >
            <svg class="w-5 h-5 flex-shrink-0" [ngClass]="transLink.isActive ? 'text-blue-600' : 'text-slate-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Payment History
          </a>

          <p class="mb-3 mt-8 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Recharge</p>

          <a
            routerLink="/dashboard/recharge"
            #rechargeLink="routerLinkActive"
            routerLinkActive=""
            (click)="isMobileSidebarOpen.set(false)"
            [ngClass]="rechargeLink.isActive ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-900'"
            class="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200"
          >
            <svg class="w-5 h-5 flex-shrink-0" [ngClass]="rechargeLink.isActive ? 'text-blue-600' : 'text-slate-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            New Recharge
          </a>

          <p class="mb-3 mt-8 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Account</p>

          <a
            routerLink="/dashboard/profile"
            #profileLink="routerLinkActive"
            routerLinkActive=""
            (click)="isMobileSidebarOpen.set(false)"
            [ngClass]="profileLink.isActive ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-900'"
            class="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200"
          >
            <svg class="w-5 h-5 flex-shrink-0" [ngClass]="profileLink.isActive ? 'text-blue-600' : 'text-slate-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            My Profile
          </a>
          <a
            routerLink="/dashboard/change-password"
            #settingsLink="routerLinkActive"
            routerLinkActive=""
            (click)="isMobileSidebarOpen.set(false)"
            [ngClass]="settingsLink.isActive ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-900'"
            class="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 mt-1"
          >
            <svg class="w-5 h-5 flex-shrink-0" [ngClass]="settingsLink.isActive ? 'text-blue-600' : 'text-slate-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </a>
        </nav>

        <div class="p-6 border-t border-slate-200/50">
          <div class="mb-4 flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full border border-blue-200 bg-blue-100">
              <span class="text-sm font-bold text-blue-600">{{ authService.userName()?.charAt(0) || 'U' }}</span>
            </div>
            <div class="flex-grow overflow-hidden">
              <p class="truncate text-sm font-semibold text-slate-800">{{ authService.userName() }}</p>
              <p class="truncate text-[10px] font-bold uppercase tracking-widest text-slate-400">User</p>
            </div>
          </div>
          <button
            (click)="logout()"
            class="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sign Out
          </button>
        </div>
      </aside>

      <div class="relative my-4 mr-4 ml-4 flex flex-grow flex-col overflow-hidden rounded-[32px] lg:ml-0">
        <header class="z-10 flex h-20 shrink-0 items-center justify-between rounded-t-[32px] border border-slate-200/80 border-b-0 bg-white/88 px-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] lg:px-10">
          <div class="flex items-center gap-4">
            <button (click)="isMobileSidebarOpen.set(true)" class="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition-all hover:bg-slate-50 lg:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <h2 class="hidden text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 sm:block lg:text-sm">{{ activeRouteTitle() }}</h2>
          </div>

          <div class="relative flex items-center gap-3 lg:gap-6">
            <app-notification-bell></app-notification-bell>

            <div *ngIf="authService.isAdmin()" class="hidden h-6 w-[1px] bg-slate-200 lg:block"></div>
            <a
              *ngIf="authService.isAdmin()"
              routerLink="/admin"
              class="rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-semibold text-blue-700 transition-all hover:border-blue-200 hover:bg-blue-50 lg:px-6 lg:py-2.5"
            >
              <span class="hidden sm:inline">Admin Dashboard</span>
              <span class="sm:hidden">Admin</span>
            </a>
          </div>
        </header>

        <main class="custom-scrollbar flex-grow overflow-y-auto rounded-b-[32px] border border-slate-200/80 border-t-0 bg-white/78 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)] lg:p-10">
          <div class="mx-auto max-w-6xl">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `
})
export class DashboardLayoutComponent {
  authService = inject(AuthService);
  private router = inject(Router);
  isMobileSidebarOpen = signal(false);

  activeRouteTitle() {
    const url = this.router.url;
    if (url.includes('overview')) return 'Dashboard';
    if (url.includes('transactions')) return 'Payment History';
    if (url.includes('history')) return 'Recharge History';
    if (url.includes('profile')) return 'Profile';
    if (url.includes('recharge')) return 'New Recharge';
    if (url.includes('plans')) return 'Plans';
    if (url.includes('checkout')) return 'Checkout';
    return 'OmniCharge';
  }

  logout() {
    this.authService.logoutAndRedirect();
  }
}
