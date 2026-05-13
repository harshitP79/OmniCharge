import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserApiService } from '../../../core/services/user-api.service';
import { RechargeResponse } from '../../../core/models/api.models';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent, ButtonComponent],
  template: `
    <div class="space-y-12">
      <div class="glass-panel flex items-end justify-between rounded-[32px] border-none bg-white/20 p-8 shadow-sm">
        <div>
          <h1 class="text-5xl font-black tracking-tighter italic text-slate-900">Welcome, {{ authService.userName() }}</h1>
          <p class="mt-4 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 opacity-70">Manage your recharges in one place</p>
        </div>
        <div class="hidden sm:block">
          <app-button routerLink="/dashboard/recharge" variant="primary" class="h-14 px-10">
            Start Recharge
          </app-button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
        <app-card class="glass-card group border-none bg-white/40 transition-all duration-500 hover:scale-[1.02]">
          <div class="flex flex-col">
            <span class="mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Total Spend</span>
            <span class="text-5xl font-black tracking-tighter italic text-slate-900">&#8377;{{ totalSpent() | number }}</span>
            <div class="mt-10 flex w-fit items-center gap-3 rounded-full bg-blue-50/50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">
              <span class="h-2 w-2 animate-pulse rounded-full bg-blue-600 shadow-lg shadow-blue-500/50"></span>
              Updated
            </div>
          </div>
        </app-card>

        <app-card class="glass-card border-none bg-white/40 transition-all duration-500 hover:scale-[1.02]">
          <div class="flex flex-col">
            <span class="mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Total Recharges</span>
            <span class="text-5xl font-black tracking-tighter italic text-slate-900">{{ totalCount() }}</span>
            <p class="mt-10 px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Recharge activity</p>
          </div>
        </app-card>

        <app-card class="glass-card border-none bg-white/40 transition-all duration-500 hover:scale-[1.02]">
          <div class="flex flex-col">
            <span class="mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Member Since</span>
            <span class="mt-2 text-2xl font-black uppercase tracking-tight italic text-slate-900">{{ memberSince() | date:'LLLL yyyy' }}</span>
            <p class="mt-12 px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Account started</p>
          </div>
        </app-card>
      </div>

      <div *ngIf="lastRecharge() as last" class="group relative mt-12">
        <div class="absolute inset-0 animate-pulse rounded-[48px] bg-blue-600 opacity-10 blur-[60px] transition-all duration-[4s] group-hover:opacity-20"></div>
        <div class="relative overflow-hidden rounded-[48px] border border-white bg-gradient-to-br from-white/80 to-white/40 p-12 shadow-2xl backdrop-blur-3xl transition-all duration-700">
          <div class="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-blue-400/10 blur-[80px]"></div>
          <div class="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-cyan-400/10 blur-[60px]"></div>

          <div class="relative z-10 flex flex-col justify-between gap-12 lg:flex-row lg:items-center">
            <div class="space-y-6">
              <div class="flex items-center gap-3">
                <span class="rounded-full bg-blue-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.4em] text-blue-600 shadow-sm">Latest Recharge</span>
                <div class="h-1.5 w-1.5 rounded-full bg-slate-200"></div>
                <span class="text-xs font-black italic tracking-tight text-slate-400">{{ last.createdDate | date:'medium' }}</span>
              </div>
              <h3 class="text-6xl font-black uppercase leading-none tracking-tighter italic text-slate-900">
                &#8377;{{ last.amount }} <span class="mx-4 align-middle text-2xl text-slate-200">&#8594;</span> {{ last.mobileNumber }}
              </h3>
              <div class="flex items-center gap-4">
                <div class="rounded-2xl bg-slate-900 px-5 py-2.5 text-white shadow-xl shadow-slate-900/10">
                  <span class="text-[10px] font-black uppercase tracking-[0.2em]">{{ last.operatorName }}</span>
                </div>
                <div class="rounded-2xl border border-slate-100 bg-white px-5 py-2.5 shadow-sm">
                  <span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">{{ last.status }}</span>
                </div>
              </div>
            </div>
            <div class="mt-4 flex items-center gap-6 lg:mt-0">
              <app-button variant="secondary" routerLink="/dashboard/history" class="h-16 px-12 transition-all group-hover:scale-105">
                Recharge History
              </app-button>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="!lastRecharge() && !isLoading()" class="glass-panel mt-12 rounded-[48px] border-none bg-white/30 p-24 text-center">
        <div class="mx-auto mb-10 flex h-24 w-24 items-center justify-center rounded-[32px] border border-white/70 bg-white/55 shadow-[0_22px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <span class="text-[11px] font-black uppercase tracking-[0.34em] text-blue-500">OC</span>
        </div>
        <h4 class="text-3xl font-black uppercase tracking-tighter italic text-slate-900">No recharges yet</h4>
        <p class="mx-auto mt-4 max-w-sm text-lg font-medium leading-relaxed text-slate-500">Start your first recharge to see your recent activity here.</p>
        <app-button routerLink="/dashboard/recharge" variant="primary" class="mt-12 h-16 px-12">Start Recharge</app-button>
      </div>

      <div *ngIf="isLoading()" class="flex flex-col items-center justify-center py-32">
        <div class="h-16 w-16 animate-[spin_1s_ease-in-out_infinite] rounded-full border-4 border-blue-600 border-t-white shadow-xl shadow-blue-500/20"></div>
      </div>
    </div>
  `
})
export class UserDashboardComponent implements OnInit {
  authService = inject(AuthService);
  private api = inject(UserApiService);

  isLoading = signal(true);
  totalSpent = signal(0);
  totalCount = signal(0);
  lastRecharge = signal<RechargeResponse | null>(null);
  memberSince = signal<string | null>(null);

  ngOnInit(): void {
    this.api.getProfile().subscribe(user => this.memberSince.set(user.createdDate));

    this.api.getRechargeHistory(0, 50).subscribe({
      next: (page) => {
        const history = page.content;
        this.totalCount.set(page.totalElements);
        const successful = history.filter(item => item.status === 'SUCCESS');
        this.totalSpent.set(successful.reduce((sum, item) => sum + item.amount, 0));
        this.lastRecharge.set(history.length > 0 ? history[0] : null);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}
