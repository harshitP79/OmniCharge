import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-screen bg-transparent text-slate-900 overflow-hidden font-sans relative">
      
      <!-- Galaxy Background Overlay -->
      <div class="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div class="cosmic-orb w-[600px] h-[600px] top-[-10%] left-[-10%] bg-purple-400/10 blur-[150px]"></div>
        <div class="cosmic-orb w-[500px] h-[500px] bottom-[-20%] right-[-10%] bg-blue-400/10 blur-[130px]"></div>
      </div>

      <!-- Mobile Backdrop Overlay -->
      <div *ngIf="isMobileSidebarOpen()" 
           class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden animate-in fade-in"
           (click)="isMobileSidebarOpen.set(false)"></div>

      <!-- Admin Sidebar -->
      <aside 
        class="fixed inset-y-0 left-0 z-50 w-72 lg:static bg-white/70 backdrop-blur-xl border-r border-white/50 flex flex-col shrink-0 transition-transform duration-300 lg:translate-x-0"
        [class.-translate-x-full]="!isMobileSidebarOpen()"
        [class.translate-x-0]="isMobileSidebarOpen()">
        
        <div class="h-20 px-8 flex items-center justify-between border-b border-slate-200/50">
          <a routerLink="/admin" class="text-lg font-bold tracking-tight text-slate-900 transition-colors hover:text-blue-700" (click)="isMobileSidebarOpen.set(false)">
             OmniCharge
          </a>
          <button (click)="isMobileSidebarOpen.set(false)" class="lg:hidden text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav class="flex-grow px-4 space-y-1 mt-6 overflow-y-auto custom-scrollbar">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-3">Overview</p>
          
          <a routerLink="/admin/dashboard" 
             #dashboardLink="routerLinkActive"
             routerLinkActive=""
             (click)="isMobileSidebarOpen.set(false)"
             [ngClass]="dashboardLink.isActive ? 'bg-white shadow-sm text-purple-600' : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-900'"
             class="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200">
             <svg class="w-5 h-5 flex-shrink-0" [ngClass]="dashboardLink.isActive ? 'text-purple-600' : 'text-slate-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
             </svg>
             Dashboard
          </a>

          <a routerLink="/admin/analytics" 
             #analyticsLink="routerLinkActive"
             routerLinkActive=""
             (click)="isMobileSidebarOpen.set(false)"
             [ngClass]="analyticsLink.isActive ? 'bg-white shadow-sm text-purple-600' : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-900'"
             class="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 mt-1">
             <svg class="w-5 h-5 flex-shrink-0" [ngClass]="analyticsLink.isActive ? 'text-purple-600' : 'text-slate-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
             </svg>
             Analytics
          </a>

          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mt-8 mb-3">Management</p>
          
          <a routerLink="/admin/users" 
             #usersLink="routerLinkActive"
             routerLinkActive=""
             (click)="isMobileSidebarOpen.set(false)"
             [ngClass]="usersLink.isActive ? 'bg-white shadow-sm text-purple-600' : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-900'"
             class="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200">
             <svg class="w-5 h-5 flex-shrink-0" [ngClass]="usersLink.isActive ? 'text-purple-600' : 'text-slate-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
             </svg>
             Users
          </a>

          <a routerLink="/admin/operators" 
             #operatorsLink="routerLinkActive"
             routerLinkActive=""
             (click)="isMobileSidebarOpen.set(false)"
             [ngClass]="operatorsLink.isActive ? 'bg-white shadow-sm text-purple-600' : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-900'"
             class="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 mt-1">
             <svg class="w-5 h-5 flex-shrink-0" [ngClass]="operatorsLink.isActive ? 'text-purple-600' : 'text-slate-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
             </svg>
             Operators
          </a>

          <a routerLink="/admin/plans" 
             #plansLink="routerLinkActive"
             routerLinkActive=""
             (click)="isMobileSidebarOpen.set(false)"
             [ngClass]="plansLink.isActive ? 'bg-white shadow-sm text-purple-600' : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-900'"
             class="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 mt-1">
             <svg class="w-5 h-5 flex-shrink-0" [ngClass]="plansLink.isActive ? 'text-purple-600' : 'text-slate-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
             </svg>
             Plans
          </a>

          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mt-8 mb-3">Activity</p>
          <a routerLink="/admin/recharges" 
             #rechargesLink="routerLinkActive"
             routerLinkActive=""
             (click)="isMobileSidebarOpen.set(false)"
             [ngClass]="rechargesLink.isActive ? 'bg-white shadow-sm text-purple-600' : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-900'"
             class="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200">
             <svg class="w-5 h-5 flex-shrink-0" [ngClass]="rechargesLink.isActive ? 'text-purple-600' : 'text-slate-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
             </svg>
             Recharge History
          </a>
        </nav>


        <div class="p-6 border-t border-slate-200/50">
           <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center">
                 <span class="text-purple-600 font-bold text-sm">{{ authService.userName()?.charAt(0) || 'A' }}</span>
              </div>
              <div class="flex-grow overflow-hidden">
                 <p class="text-sm font-semibold text-slate-800 truncate">{{ authService.userName() }}</p>
                 <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin</p>
              </div>
           </div>
           <button (click)="authService.logoutAndRedirect()" 
              class="w-full text-xs font-bold text-slate-500 hover:text-red-500 hover:bg-red-50 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Sign Out
           </button>
        </div>
      </aside>

      <div class="flex flex-col flex-grow overflow-hidden relative mr-4 ml-4 lg:ml-0 my-4 rounded-[48px]">
        <!-- Topbar -->
        <header class="h-20 glass-panel border-none bg-white/30 flex items-center justify-between px-6 lg:px-10 z-10 shrink-0 rounded-t-[48px]">
           <div class="flex items-center gap-4">
             <button (click)="isMobileSidebarOpen.set(true)" class="lg:hidden text-slate-600 bg-white/50 p-2 rounded-xl hover:bg-white/80 transition-all shadow-sm">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
               </svg>
             </button>
             <div class="hidden sm:block w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
             <h2 class="text-[9px] lg:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] lg:tracking-[0.4em] hidden sm:block">Admin Access</h2>
           </div>
           
           <div class="flex items-center gap-6">
              <a routerLink="/dashboard" 
                 class="group relative overflow-hidden text-[9px] lg:text-[10px] font-black uppercase tracking-widest lg:tracking-[0.3em] text-blue-600 bg-white border border-blue-100 px-4 py-2 lg:px-8 lg:py-3 rounded-full hover:text-white hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-500">
                 <span class="relative z-10 italic hidden sm:inline transition-colors duration-300 group-hover:text-white">Go to User App</span>
                 <span class="relative z-10 italic sm:hidden transition-colors duration-300 group-hover:text-white">User App</span>
                 <div class="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              </a>
           </div>
        </header>

        <!-- Main Content Area -->
        <main class="flex-grow overflow-y-auto glass-panel border-none bg-white/20 p-4 lg:p-12 rounded-b-[48px] custom-scrollbar">
           <div class="max-w-7xl mx-auto">
              <router-outlet></router-outlet>
           </div>
        </main>
      </div>
    </div>
  `
})
export class AdminLayoutComponent {
  authService = inject(AuthService);
  isMobileSidebarOpen = signal(false);
}
