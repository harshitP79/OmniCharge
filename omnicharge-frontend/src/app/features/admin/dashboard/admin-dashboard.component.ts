import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApiService, RechargeStats } from '../../../core/services/admin-api.service';
import { CardComponent } from '../../../shared/ui/card/card.component';

import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, CardComponent, RouterModule],
  template: `
    <div class="space-y-12 animate-in fade-in duration-700">
      <div class="bg-white/20 p-8 rounded-[32px] glass-panel border-none shadow-sm">
        <h1 class="text-5xl font-black text-slate-900 tracking-tighter italic">Admin Dashboard</h1>
        <p class="text-slate-500 font-bold text-[11px] uppercase tracking-[0.3em] mt-3 opacity-60">See users, recharges, and overall activity</p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        
        <app-card class="glass-card border-none bg-white/40 hover:scale-[1.05] transition-all duration-500">
           <div class="flex flex-col">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Total Users</span>
              <span class="text-5xl font-black text-slate-900 tracking-tighter italic">{{ stats()?.totalUsers || 0 }}</span>
              <p class="text-[11px] text-slate-400 mt-10 font-black uppercase tracking-[0.2em] bg-slate-50/50 py-2 px-4 rounded-full w-fit">Accounts Active</p>
           </div>
        </app-card>

        <app-card class="glass-card border-none bg-white/40 hover:scale-[1.05] transition-all duration-500">
           <div class="flex flex-col relative">
              <div class="absolute -right-2 -top-2 w-12 h-12 bg-green-400 blur-[30px] opacity-20"></div>
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Gross Revenue</span>
              <span class="text-5xl font-black text-slate-900 tracking-tighter italic">₹{{ (stats()?.totalRevenue || 0) | number }}</span>
              <div class="mt-10 flex items-center gap-3 text-[11px] text-green-600 font-black tracking-[0.2em] bg-green-50/50 w-fit px-4 py-2 rounded-full border border-green-100/50">
                 <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                 LIVE
              </div>
           </div>
        </app-card>

        <app-card class="glass-card border-none bg-white/40 hover:scale-[1.05] transition-all duration-500">
           <div class="flex flex-col">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Success Rate</span>
              <span class="text-5xl font-black text-green-600 tracking-tighter italic">{{ calculateSuccessRate() }}%</span>
              <p class="text-[11px] text-slate-400 mt-10 font-black uppercase tracking-[0.2em] bg-slate-50/50 py-2 px-4 rounded-full w-fit italic">Completed Successfully</p>
           </div>
        </app-card>

        <app-card class="glass-card border-none bg-white/40 hover:scale-[1.05] transition-all duration-500">
           <div class="flex flex-col">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Failed Recharges</span>
              <span class="text-5xl font-black text-red-500 tracking-tighter italic">{{ stats()?.failedCount || 0 }}</span>
              <p class="text-[11px] text-slate-400 mt-10 font-black uppercase tracking-[0.2em] bg-red-50/50 py-2 px-4 rounded-full w-fit">Needs Attention</p>
           </div>
        </app-card>
      </div>

      <!-- Syncing State -->
      <div *ngIf="isLoading()" class="flex flex-col items-center justify-center py-32 bg-white/20 rounded-[48px] glass-panel border-none">
        <div class="w-16 h-16 border-4 border-blue-600 border-t-white rounded-full animate-[spin_1s_ease-in-out_infinite] shadow-xl shadow-blue-500/20 mb-8"></div>
        <p class="text-[11px] text-slate-400 font-black uppercase tracking-[0.5em] animate-pulse">Loading Dashboard...</p>
      </div>

      <!-- Live Activity Feed -->
      <div *ngIf="!isLoading()" class="glass-panel border-none bg-white/40 rounded-[48px] p-8 lg:p-12 overflow-hidden relative">
         <div class="absolute top-0 right-0 w-64 h-64 bg-blue-400/20 blur-[80px] rounded-full pointer-events-none"></div>

         <div class="flex items-center justify-between mb-8 relative z-10">
            <div>
               <h3 class="text-2xl font-black text-slate-900 tracking-tight italic flex items-center gap-3">
                  <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  Recent Network Activity
               </h3>
               <p class="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] mt-1">Real-time recharge flow</p>
            </div>
            <a routerLink="/admin/recharges" class="text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-sm">View All</a>
         </div>

         <div class="relative z-10 bg-white/60 rounded-3xl overflow-hidden border border-white/50 shadow-sm">
            <div *ngFor="let row of recentActivity(); let isLast = last" 
                 class="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-white/80 transition-colors"
                 [ngClass]="{'border-b border-slate-100/50': !isLast}">
               
               <div class="flex items-center gap-4 mb-3 sm:mb-0">
                  <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm border border-white"
                       [ngClass]="{
                           'bg-emerald-100 text-emerald-600': row.status === 'SUCCESS',
                           'bg-amber-100 text-amber-600': row.status === 'PROCESSING' || row.status === 'INITIATED',
                           'bg-red-100 text-red-600': row.status === 'FAILED',
                           'bg-slate-100 text-slate-600': row.status === 'EXPIRED'
                       }">
                     <svg *ngIf="row.status === 'SUCCESS'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                     <svg *ngIf="row.status === 'PROCESSING' || row.status === 'INITIATED'" class="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                     <svg *ngIf="row.status === 'FAILED'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                     <svg *ngIf="row.status === 'EXPIRED'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <div>
                     <p class="font-black text-sm text-slate-900 tracking-tight">{{ row.mobileNumber }}</p>
                     <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{{ row.operatorName }} • {{ row.planName }}</p>
                  </div>
               </div>

               <div class="flex items-center justify-between sm:justify-end gap-6 sm:w-1/2">
                  <div class="text-left sm:text-right">
                     <p class="font-black text-slate-900">₹{{ row.amount }}</p>
                     <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{{ row.createdDate | date:'MMM d, h:mm a' }}</p>
                  </div>
                  <div class="w-24 text-right">
                     <span class="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full"
                         [ngClass]="{
                           'bg-emerald-50 text-emerald-600': row.status === 'SUCCESS',
                           'bg-amber-50 text-amber-600': row.status === 'PROCESSING' || row.status === 'INITIATED',
                           'bg-red-50 text-red-600': row.status === 'FAILED',
                           'bg-slate-50 text-slate-600': row.status === 'EXPIRED'
                         }">
                        {{ row.status }}
                     </span>
                  </div>
               </div>

            </div>
            
            <div *ngIf="recentActivity().length === 0" class="p-8 text-center text-slate-400 font-bold text-sm">
               No recent recharges found.
            </div>
         </div>
      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  private api = inject(AdminApiService);
  stats = signal<RechargeStats | null>(null);
  recentActivity = signal<any[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.api.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        
        // Resilience: Fallback to compute Total Registers directly if backend Feign query drops mapping
        if (data && (!data.totalUsers || data.totalUsers === 0)) {
           this.api.getUsers(0, 1).subscribe({
              next: (page) => {
                 this.stats.update(current => current ? { ...current, totalUsers: page.totalElements } : current);
              }
           });
        }
        
        // Fetch recent activity feed
        this.api.getAllRecharges(0, 5).subscribe({
           next: (page) => {
              this.recentActivity.set(page.content);
              this.isLoading.set(false);
           },
           error: () => this.isLoading.set(false)
        });
      },
      error: () => this.isLoading.set(false)
    });
  }

  calculateSuccessRate(): number {
    const s = this.stats();
    if (!s || s.totalRecharges === 0) return 0;
    return Math.round((s.successCount / s.totalRecharges) * 100);
  }
}
