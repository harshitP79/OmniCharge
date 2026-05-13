import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { UserApiService } from '../../../core/services/user-api.service';
import { RechargeResponse, UserRechargeStats } from '../../../core/models/api.models';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, CardComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-10 animate-in fade-in duration-700">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white/20 p-8 rounded-[32px] glass-panel border-none">
        <div>
          <h2 class="text-5xl font-black text-slate-900 tracking-tighter italic">Recharge History</h2>
          <p class="text-slate-500 font-bold text-[11px] uppercase tracking-[0.3em] mt-3 opacity-60">See your recent and active recharges</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <app-card class="glass-card border-none bg-white/40 group hover:scale-[1.02] transition-all duration-500">
          <div class="flex items-center gap-6">
            <div class="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-600 shadow-xl shadow-green-500/5 group-hover:scale-110 group-hover:bg-green-500 group-hover:text-white transition-all duration-500">
               <span class="text-xl">✓</span>
            </div>
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Active</p>
              <h3 class="text-4xl font-black text-slate-900 tracking-tighter italic">{{ stats().activeCount || 0 }}</h3>
            </div>
          </div>
        </app-card>

        <app-card class="glass-card border-none bg-white/40 group hover:scale-[1.02] transition-all duration-500">
          <div class="flex items-center gap-6">
            <div class="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-xl shadow-amber-500/5 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-500">
               <span class="text-xl">↻</span>
            </div>
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Pending</p>
              <h3 class="text-4xl font-black text-slate-900 tracking-tighter italic">{{ stats().processingCount || 0 }}</h3>
            </div>
          </div>
        </app-card>

        <app-card class="glass-card border-none bg-white/40 group hover:scale-[1.02] transition-all duration-500">
          <div class="flex items-center gap-6">
            <div class="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shadow-xl shadow-slate-500/5 group-hover:scale-110 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
               <span class="text-xl">⌛</span>
            </div>
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Expired</p>
              <h3 class="text-4xl font-black text-slate-900 tracking-tighter italic">{{ stats().expiredCount || 0 }}</h3>
            </div>
          </div>
        </app-card>
      </div>

      <div class="flex flex-wrap gap-3 p-2 bg-white/30 rounded-[24px] border border-white/50 w-fit backdrop-blur-xl shadow-lg">
        <button 
          (click)="filter.set('ALL')"
          [class]="filter() === 'ALL' ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'text-slate-400 hover:text-slate-600'"
          class="px-8 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300">
          All
        </button>
        <button 
          (click)="filter.set('ACTIVE')"
          [class]="filter() === 'ACTIVE' ? 'bg-green-600 text-white shadow-xl shadow-green-500/20' : 'text-slate-400 hover:text-slate-600'"
          class="px-8 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300">
          Active
        </button>
        <button 
          (click)="filter.set('PROCESSING')"
          [class]="filter() === 'PROCESSING' ? 'bg-amber-600 text-white shadow-xl shadow-amber-500/20' : 'text-slate-400 hover:text-slate-600'"
          class="px-8 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300">
          Pending
        </button>
        <button 
          (click)="filter.set('EXPIRED')"
          [class]="filter() === 'EXPIRED' ? 'bg-slate-400 text-white shadow-xl shadow-slate-400/20' : 'text-slate-400 hover:text-slate-600'"
          class="px-8 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300">
          Expired
        </button>
      </div>

      <app-card class="p-0 glass-card border-none bg-white/40 overflow-hidden shadow-2xl rounded-[32px]">
        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200/60 bg-transparent">
                <th class="px-6 py-4">Date</th>
                <th class="px-6 py-4">Mobile Number</th>
                <th class="px-6 py-4">Operator</th>
                <th class="px-6 py-4">Plan</th>
                <th class="px-6 py-4">Amount</th>
                <th class="px-6 py-4">Expiry Date</th>
                <th class="px-6 py-4">Days Left</th>
                <th class="px-6 py-4">Status</th>
                <th class="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100/50 text-sm">
              <tr *ngFor="let item of filteredHistory()" class="group hover:bg-blue-50/20 transition-all duration-300">
                <td class="px-6 py-5 font-medium text-slate-500 text-xs">{{ item.createdDate | date:'dd MMM yyyy' }}</td>
                <td class="px-6 py-5 font-semibold text-slate-900 text-sm">{{ item.mobileNumber }}</td>
                <td class="px-6 py-5">
                   <span class="text-slate-700 font-medium text-xs">{{ item.operatorName }}</span>
                </td>
                <td class="px-6 py-5">
                   <span class="text-slate-800 font-medium text-xs">{{ item.planName }}</span>
                </td>
                <td class="px-6 py-5 font-black text-slate-900 text-sm italic">₹{{ item.amount }}</td>
                <td class="px-6 py-5">
                   <div class="flex items-center gap-2">
                      <span class="font-medium text-xs" [ngClass]="isExpiringSoon(item) ? 'text-red-500' : 'text-slate-500'">
                        {{ item.planExpiryDate | date:'dd MMM yyyy' }}
                      </span>
                      <div *ngIf="isExpiringSoon(item)" class="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></div>
                   </div>
                </td>
                <td class="px-6 py-5">
                   <span class="font-bold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/60" [ngClass]="getDaysLeftClass(item)">
                      {{ getDaysLeft(item) }}
                   </span>
                </td>
                <td class="px-6 py-5">
                   <span class="px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 w-fit border border-slate-100 shadow-sm"
                    [ngClass]="getStatusStyles(item)">
                     <span class="w-1.5 h-1.5 rounded-full shadow-lg" [ngClass]="getDotClass(item)"></span>
                     {{ getDisplayStatus(item) }}
                   </span>
                </td>
                <td class="px-6 py-5 text-right">
                   <a 
                     routerLink="/dashboard/recharge"
                     class="text-[9px] font-bold uppercase tracking-widest text-blue-600 bg-white border border-blue-100 px-4 py-2 rounded-full hover:bg-blue-600 hover:text-white hover:shadow-md transition-all duration-300">
                     Recharge Again
                   </a>
                </td>
              </tr>

              <tr *ngIf="filteredHistory().length === 0">
                <td colspan="9" class="py-24 text-center bg-white/20">
                  <div class="flex flex-col items-center justify-center opacity-70">
                    <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-[24px] border border-white/70 bg-white/60 shadow-sm">
                      <span class="text-[10px] font-black uppercase tracking-[0.28em] text-blue-500">OC</span>
                    </div>
                    <p class="text-slate-400 font-black uppercase tracking-[0.5em] text-[11px]">No matching recharges found</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </app-card>

      <div *ngIf="isLoading()" class="flex flex-col items-center justify-center py-32 bg-white/20 rounded-[48px] glass-panel border-none shadow-sm">
        <div class="w-16 h-16 border-4 border-blue-600 border-t-white rounded-full animate-[spin_1s_ease-in-out_infinite] shadow-xl shadow-blue-500/20 mb-8"></div>
        <p class="text-[11px] text-slate-400 font-black uppercase tracking-[0.5em] animate-pulse">Loading recharge history...</p>
      </div>
    </div>
  `
})
export class HistoryComponent implements OnInit {
  private userApi = inject(UserApiService);

  history = signal<RechargeResponse[]>([]);
  filter = signal<'ALL' | 'ACTIVE' | 'PROCESSING' | 'EXPIRED'>('ALL');
  isLoading = signal(true);
  stats = signal<UserRechargeStats>({ activeCount: 0, processingCount: 0, expiredCount: 0 });

  filteredHistory = computed(() => {
    const list = this.history();
    const currentFilter = this.filter();
    
    if (currentFilter === 'ALL') return list;
    
    return list.filter(item => {
      const status = this.getMappedStatus(item);
      return status === currentFilter;
    });
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loadRechargeHistory();
    this.loadStats();
  }

  private loadRechargeHistory() {
    this.isLoading.set(true);
    this.userApi.getRechargeHistory(0, 50).subscribe({
      next: (page) => {
        this.history.set(page.content);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  private loadStats() {
    this.userApi.getDashboardStats().subscribe({
      next: (s) => this.stats.set(s),
      error: () => {} // keep defaults on error
    });
  }

  getMappedStatus(item: RechargeResponse): string {
    if (item.status === 'PROCESSING' || item.status === 'INITIATED') return 'PROCESSING';
    if (item.status === 'EXPIRED' || item.status === 'FAILED') return 'EXPIRED';
    if (item.status === 'SUCCESS') {
      const expiryDate = new Date(item.planExpiryDate);
      return expiryDate >= new Date() ? 'ACTIVE' : 'EXPIRED';
    }
    return item.status;
  }

  getDisplayStatus(item: RechargeResponse): string {
    if (item.status === 'FAILED') return 'Failed';
    const status = this.getMappedStatus(item);
    if (status === 'PROCESSING') return 'Pending';
    if (status === 'ACTIVE') return 'Active';
    if (status === 'EXPIRED') return 'Expired';
    return status;
  }

  getDaysLeft(item: RechargeResponse): string {
    // FAILED and EXPIRED items are always shown as Expired
    if (item.status === 'FAILED' || item.status === 'EXPIRED') {
      return 'Expired';
    }

    // For SUCCESS items with past expiry
    const expiry = new Date(item.planExpiryDate);
    const today = new Date();

    // Compare dates only (strip time) to avoid time-of-day race conditions
    const expiryDate = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffDays = Math.round((expiryDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires Today';
    return `${diffDays} ${diffDays === 1 ? 'Day' : 'Days'}`;
  }

  getDaysLeftClass(item: RechargeResponse): string {
    const days = this.getDaysLeft(item);
    if (days === 'Expired') return 'text-gray-600 uppercase text-[9px]';
    if (days.includes('Day')) {
      const num = parseInt(days);
      return num < 7 ? 'text-red-500' : 'text-green-500';
    }
    return 'text-amber-500';
  }

  isExpiringSoon(item: RechargeResponse): boolean {
    const days = this.getDaysLeft(item);
    if (days.includes('Day')) {
      return parseInt(days) < 7;
    }
    return false;
  }

  getStatusStyles(item: RechargeResponse): string {
    if (item.status === 'FAILED') return 'bg-red-500/10 text-red-500 border-red-500/20';
    const status = this.getMappedStatus(item);
    switch(status) {
      case 'ACTIVE': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'EXPIRED': return 'bg-gray-800 text-gray-500 border-gray-700/50';
      case 'PROCESSING': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-red-500/10 text-red-500 border-red-500/20';
    }
  }

  getDotClass(item: RechargeResponse): string {
    if (item.status === 'FAILED') return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]';
    const status = this.getMappedStatus(item);
    switch(status) {
      case 'ACTIVE': return 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]';
      case 'EXPIRED': return 'bg-gray-500';
      case 'PROCESSING': return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]';
      default: return 'bg-red-500';
    }
  }
}
