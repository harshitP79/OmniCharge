import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RechargeApiService } from '../../../core/services/recharge-api.service';
import { RechargeStore } from '../../../store/recharge.store';
import { Plan } from '../../../core/models/api.models';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule, CardComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-12 py-8 relative">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 bg-white/20 p-8 rounded-[32px] glass-panel border-none">
        <div class="flex items-center gap-6">
          <div *ngIf="store.operator()?.logoUrl" class="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center p-3 shadow-lg shadow-blue-500/10">
            <img [src]="store.operator()?.logoUrl" [alt]="store.operator()?.operatorName" class="w-full h-full object-contain">
          </div>
          <div>
            <h2 class="text-5xl font-black text-slate-900 tracking-tighter leading-tight italic">Choose a Plan</h2>
            <p class="text-slate-500 mt-3 font-medium text-lg tracking-tight" *ngIf="store.operator()">
              Recharge offers for <span class="text-blue-600 font-bold">{{ store.operator()?.operatorName }}</span> • <span class="text-slate-400">{{ store.mobileNumber() }}</span>
            </p>
          </div>
        </div>
        <app-button 
           (onClick)="goBack()" 
           variant="secondary" 
           class="h-12">
           Change Number
        </app-button>
      </div>

      <div *ngIf="isLoading()" class="flex flex-col items-center justify-center py-32 glass-card border-none bg-white/40">
        <div class="w-16 h-16 border-4 border-blue-600 border-t-white rounded-full animate-spin mb-8 shadow-xl shadow-blue-500/20"></div>
        <p class="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Loading plans...</p>
      </div>

      <div *ngIf="error()" class="bg-red-50 border border-red-100 rounded-[32px] p-8 text-center glass-panel">
        <p class="text-red-500 font-black tracking-tight text-lg">{{ error() }}</p>
      </div>

      <div *ngIf="!isLoading() && !error()" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
        <app-card *ngFor="let plan of plans()" class="flex flex-col h-full glass-card border-none bg-white/40 hover:scale-[1.03] transition-all duration-500 group">
          <div class="flex-grow p-2">
            <div class="flex justify-between items-start mb-8">
              <div class="relative">
                <span class="text-5xl font-black text-slate-900 tracking-tighter leading-none italic">₹{{ plan.price }}</span>
                <p class="text-[10px] text-slate-400 mt-2 uppercase font-black tracking-[0.2em]">{{ plan.planName }}</p>
              </div>
              <span class="bg-blue-50 text-blue-600 text-[10px] px-4 py-2 rounded-full font-black tracking-widest border border-blue-100 uppercase shadow-sm">
                {{ plan.category }}
              </span>
            </div>
            
            <div class="space-y-5 mb-10">
              <div class="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 transition-all group-hover:bg-blue-50/50 group-hover:border-blue-100/50">
                <span class="text-slate-400 font-black uppercase text-[9px] tracking-widest">Validity</span>
                <span class="text-slate-900 font-black tracking-tight">{{ plan.validityDays }} Days</span>
              </div>
              <div class="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 transition-all group-hover:bg-blue-50/50 group-hover:border-blue-100/50">
                <span class="text-slate-400 font-black uppercase text-[9px] tracking-widest">Data</span>
                <span class="text-blue-600 font-black tracking-tight uppercase">{{ plan.dataLimit }}</span>
              </div>
              <div class="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 transition-all group-hover:bg-blue-50/50 group-hover:border-blue-100/50">
                <span class="text-slate-400 font-black uppercase text-[9px] tracking-widest">Calls</span>
                <span class="text-slate-900 font-bold tracking-tight text-sm">{{ plan.callBenefit }}</span>
              </div>
            </div>
            
            <div class="pt-6 border-t border-slate-100/50" *ngIf="plan.additionalBenefits">
              <p class="text-[12px] text-slate-500 leading-relaxed font-medium italic opacity-70">
                 "{{ plan.additionalBenefits }}"
              </p>
            </div>
          </div>
          
          <app-button 
             variant="primary" 
             class="w-full mt-10 transition-all h-14" 
             (onClick)="selectPlan(plan)">
             Continue to Payment
          </app-button>
        </app-card>
      </div>

      <div *ngIf="!isLoading() && !error() && plans().length === 0" class="text-center py-32 glass-panel border-none bg-white/40 rounded-[48px]">
        <p class="text-slate-400 font-black uppercase tracking-[0.4em] text-[11px] mb-8">No plans available right now</p>
        <app-button variant="secondary" (onClick)="goBack()">Go Back</app-button>
      </div>
    </div>
  `
})
export class PlansComponent implements OnInit {
  store = inject(RechargeStore);
  private api = inject(RechargeApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  plans = signal<Plan[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    const operator = this.store.operator();
    if (!operator) {
      this.goBack();
      return;
    }

    this.api.searchPlans(operator.operatorId).subscribe({
      next: (page) => {
        this.plans.set(page.content);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to load plans.');
        this.isLoading.set(false);
      }
    });
  }

  selectPlan(plan: Plan) {
    this.store.setPlan(plan);
    this.router.navigate(['/dashboard/checkout']);
  }

  goBack() {
    this.router.navigate(['../recharge'], { relativeTo: this.route });
  }
}
