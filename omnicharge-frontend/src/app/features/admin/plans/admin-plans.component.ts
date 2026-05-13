import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { Operator, Plan } from '../../../core/models/api.models';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { InputComponent } from '../../../shared/ui/input/input.component';

@Component({
  selector: 'app-admin-plans',
  standalone: true,
  imports: [CommonModule, CardComponent, ButtonComponent, InputComponent, ReactiveFormsModule, FormsModule],
  template: `
    <div class="space-y-10">
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h1 class="text-4xl font-black text-slate-900 tracking-widest uppercase">Plan Architecture</h1>
          <p class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">Recharge Configuration • Tiered Service Packaging</p>
        </div>
        
        <div class="flex flex-wrap items-center gap-4 w-full lg:w-auto">
           <div class="relative flex-grow lg:flex-grow-0">
             <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                placeholder="Search Plan Name..." 
                class="w-full lg:w-64 bg-white border border-slate-200 text-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold focus:outline-none focus:border-purple-500 transition-all shadow-inner">
             <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">🔍</span>
           </div>

           <div class="relative flex-grow lg:flex-none">
              <select 
                (change)="onOperatorChange($event)" 
                class="w-full lg:w-56 appearance-none bg-white border border-slate-200 text-slate-900 rounded-xl pl-4 pr-10 py-2.5 text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all cursor-pointer hover:border-slate-300 hover:shadow-sm">
                <option value="">All Operators</option>
                <option *ngFor="let op of operators()" [value]="op.id">{{ op.name }}</option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
           </div>
           <app-button 
              [disabled]="!selectedOperatorId()" 
              (onClick)="toggleAddForm()" 
              variant="primary">
             {{ showAddForm() ? 'Abort Deployment' : 'New Package' }}
           </app-button>
        </div>
      </div>

      <!-- Most Popular Plan Highlight -->
      <div *ngIf="isStatsLoading()" class="h-24 w-full bg-slate-100 rounded-[32px] animate-pulse glass-panel border-none"></div>
      
      <div *ngIf="!isStatsLoading() && topPlan()" class="glass-panel border-none bg-purple-500/10 p-6 md:p-8 rounded-[32px] flex items-center justify-between shadow-sm relative overflow-hidden">
         <div class="absolute right-0 top-0 w-64 h-64 bg-purple-400/20 blur-[60px] rounded-full pointer-events-none -mt-32 -mr-32"></div>
         
         <div class="relative z-10 flex items-center gap-6">
            <div class="w-16 h-16 rounded-2xl bg-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
               <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <div>
               <p class="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em] mb-1">Most Popular Plan</p>
               <h3 class="text-3xl font-black text-purple-700 tracking-tighter uppercase">{{ topPlan()?.originalName }}</h3>
            </div>
         </div>
         <div class="relative z-10 text-right hidden sm:block">
            <p class="text-4xl font-black text-purple-600 italic tracking-tighter">{{ topPlan()?.percentage | number:'1.0-1' }}%</p>
            <p class="text-[10px] font-bold text-purple-600 uppercase tracking-widest mt-1">Acquisition Share</p>
         </div>
      </div>

      <!-- Add/Edit Plan Modal -->
      <div *ngIf="showAddForm()" class="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4" (click)="resetForm()">
         <!-- Backdrop -->
         <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"></div>

         <!-- Modal Content -->
         <div class="relative w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-8 md:p-10 z-10 animate-modal-in max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <!-- Decorative glow -->
            <div class="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-bl from-purple-400/10 to-transparent blur-[60px] rounded-full pointer-events-none"></div>

            <!-- Close Button -->
            <button type="button" (click)="resetForm()" class="absolute top-6 right-6 z-20 w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all duration-200 hover:rotate-90">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div class="mb-8 border-b border-slate-100 pb-6 relative z-10">
               <h3 class="text-2xl font-black text-slate-900 uppercase tracking-tight">{{ editingPlanId() ? 'Update Plan' : 'Initialize New Package' }}</h3>
               <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Configure catalog entry details</p>
            </div>

            <form [formGroup]="planForm" (ngSubmit)="onSubmit()" class="space-y-6 relative z-10">
               <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                  <app-input label="Target Name" formControlName="planName" placeholder="e.g. Data Core"></app-input>
                  <app-input label="Credit Value (₹)" type="number" formControlName="price"></app-input>
                  <app-input label="Persistence (Days)" type="number" formControlName="validityDays"></app-input>
                  <app-input label="Data Capacity" formControlName="dataLimit" placeholder="e.g. 1.5GB/Day"></app-input>
                  <app-input label="Voice Quota" formControlName="callBenefit"></app-input>
                  
                  <div class="space-y-2">
                    <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest">Digital Category</label>
                    <div class="relative">
                      <select 
                        formControlName="category" 
                        class="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-4 pr-10 py-3 text-xs font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all uppercase tracking-widest cursor-pointer hover:border-slate-300 hover:bg-slate-100/50">
                        <option value="" disabled>Select Category</option>
                        <option *ngFor="let cat of planCategories()" [value]="cat">{{ formatLabel(cat) }}</option>
                      </select>
                      <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </div>
                    </div>
                    <p *ngIf="planForm.get('category')?.touched && planForm.get('category')?.errors?.['required']" class="text-[8px] text-red-500 font-bold uppercase mt-1">Classification is mandatory</p>
                  </div>
               </div>
               
               <div class="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-slate-100">
                  <app-button type="button" variant="secondary" (onClick)="resetForm()">Discard</app-button>
                  <app-button type="submit" [disabled]="planForm.invalid">
                     {{ editingPlanId() ? 'Push Change' : 'Deploy Package' }}
                  </app-button>
               </div>
            </form>
         </div>
      </div>

      <app-card class="border-slate-200 p-0 overflow-hidden shadow-2xl glass-panel">
        <div class="overflow-x-auto min-h-[400px]">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200/60 bg-transparent">
                <th class="px-6 py-4">S.No.</th>
                <th class="px-6 py-4">Provider</th>
                <th class="px-6 py-4">Package Core</th>
                <th class="px-6 py-4">Value</th>
                 <th class="px-6 py-4">Benefits</th>
                <th class="px-5 py-4 text-center">State</th>
                <th class="px-6 py-4 text-right">Modifier</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100/50 text-sm">
              <tr *ngFor="let plan of filteredPlans(); let i = index" class="group hover:bg-slate-50/50 transition-all duration-300">
                <td class="px-6 py-5 font-mono text-slate-400 text-[10px]">#0{{ i + 1 }}</td>
                <td class="px-6 py-5">
                   <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100/50 px-3 py-1.5 rounded-full border border-slate-200/60">
                      {{ plan.operatorName }}
                   </span>
                </td>
                <td class="px-6 py-5">
                   <p class="text-slate-900 font-bold text-sm uppercase tracking-wider leading-none">{{ plan.planName }}</p>
                   <p class="text-[10px] text-slate-400 font-medium tracking-widest mt-1.5 uppercase">{{ plan.category }}</p>
                </td>
                <td class="px-6 py-5 font-black text-slate-900 text-lg">₹{{ plan.price }}</td>
                <td class="px-6 py-5">
                   <div class="flex flex-col gap-1">
                      <span class="text-slate-600 font-bold text-xs">{{ plan.validityDays }} Days Cycle • {{ plan.dataLimit }}</span>
                      <span class="text-slate-400 text-[10px] font-medium tracking-wide italic line-clamp-1 truncate max-w-[150px]">{{ plan.callBenefit }}</span>
                   </div>
                </td>
                <td class="px-5 py-5 text-center">
                   <div class="flex items-center justify-center gap-3">
                      <span class="px-3 py-1.5 rounded-full text-[9px] font-bold tracking-widest border uppercase shadow-sm"
                         [ngClass]="plan.isActive ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'">
                         {{ plan.isActive ? 'ACTIVE' : 'LOCKED' }}
                      </span>
                      
                      <!-- Toggle Switch -->
                      <button 
                         (click)="togglePlanStatus(plan)"
                         [disabled]="processingIds().has(plan.id)"
                         class="relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none shadow-inner"
                         [ngClass]="plan.isActive ? 'bg-blue-600' : 'bg-slate-200'">
                         <span 
                           class="inline-block h-3 w-3 transform rounded-full bg-white transition-transform shadow-sm border border-slate-100"
                           [ngClass]="plan.isActive ? 'translate-x-[22px]' : 'translate-x-[2px]'">
                         </span>
                         <div *ngIf="processingIds().has(plan.id)" class="absolute inset-0 flex items-center justify-center bg-gray-900/40 rounded-full">
                            <div class="w-2 h-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                         </div>
                      </button>
                   </div>
                </td>
                <td class="px-6 py-5 text-right whitespace-nowrap">
                   <button (click)="editPlan(plan)" class="text-purple-500 hover:text-purple-600 hover:bg-purple-50 transition-colors py-1.5 px-3 rounded-md mr-2 text-[9px] font-bold uppercase tracking-widest">Update</button>
                   <button (click)="deletePlan(plan.id)" class="text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors py-1.5 px-3 rounded-md text-[9px] font-bold uppercase tracking-widest">Purge</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="bg-slate-50/50 px-4 md:px-8 py-5 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em]">
            <span class="text-slate-500 font-black text-center">Total Plans: {{ totalElements() }}</span>
           <div class="flex gap-4 w-full md:w-auto justify-center">
              <app-button variant="secondary" [disabled]="currentPage() === 0" (onClick)="prevPage()" class="flex-1 md:flex-none py-2 px-4 border-slate-200 text-slate-600 shadow-sm">Prev</app-button>
              <app-button variant="secondary" [disabled]="currentPage() >= (totalPages() - 1)" (onClick)="nextPage()" class="flex-1 md:flex-none py-2 px-4 border-slate-200 text-slate-600 shadow-sm">Next</app-button>
           </div>
        </div>
        
        <div *ngIf="isLoading()" class="py-20 flex justify-center">
           <div class="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        
        <div *ngIf="!isLoading() && plans().length === 0" class="py-20 text-center text-gray-500">
           <p>No plans registered for this operator.</p>
        </div>
      </app-card>
    </div>
  `
})
export class AdminPlansComponent implements OnInit {
  private api = inject(AdminApiService);
  private fb = inject(FormBuilder);

  operators = signal<Operator[]>([]);
  plans = signal<Plan[]>([]);
  selectedOperatorId = signal<number | null>(null);
  
  planCategories = signal<string[]>([]);
  isLoading = signal(false);
  showAddForm = signal(false);
  
  topPlan = signal<any>(null);
  isStatsLoading = signal(true);
  editingPlanId = signal<number | null>(null);
  searchQuery = '';
  processingIds = signal<Set<number>>(new Set());
  currentPage = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  pageSize = 15;

  planForm = this.fb.group({
    planName: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(1)]],
    validityDays: [28, [Validators.required, Validators.min(1)]],
    dataLimit: ['1.5GB/Day', [Validators.required]],
    callBenefit: ['Unlimited', [Validators.required]],
    smsBenefit: ['100/Day'],
    category: ['', [Validators.required]],
    isActive: [true]
  });

  ngOnInit() {
    this.api.getAllOperators('ALL').subscribe(data => this.operators.set(data));
    this.api.getPlanCategories().subscribe(cats => this.planCategories.set(cats));
    this.loadPlans();
    
    this.api.getAggregatedPerformanceStats(500).subscribe({
      next: (data) => {
        this.topPlan.set(data.topPlan);
        this.isStatsLoading.set(false);
      },
      error: () => this.isStatsLoading.set(false)
    });
  }

  loadPlans() {
    this.isLoading.set(true);
    this.api.getPlans(this.selectedOperatorId() || undefined, this.currentPage(), this.pageSize).subscribe({
      next: (page) => {
        this.plans.set(page.content);
        this.totalPages.set(page.totalPages);
        this.totalElements.set(page.totalElements);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  filteredPlans() {
    if (!this.searchQuery) return this.plans();
    const query = this.searchQuery.toLowerCase();
    return this.plans().filter(p => p.planName.toLowerCase().includes(query));
  }

  nextPage() {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update(p => p + 1);
      this.loadPlans();
    }
  }

  prevPage() {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
      this.loadPlans();
    }
  }

  onOperatorChange(event: any) {
    const val = event.target.value;
    this.selectedOperatorId.set(val ? Number(val) : null);
    this.loadPlans();
  }

  onSubmit() {
    if (this.planForm.invalid || !this.selectedOperatorId()) return;

    const formVal = this.planForm.value;
    const planData: Partial<Plan> = {
      planName: formVal.planName || '',
      price: formVal.price || 0,
      validityDays: formVal.validityDays || 28,
      dataLimit: formVal.dataLimit || '',
      callBenefit: formVal.callBenefit || '',
      smsBenefit: formVal.smsBenefit || '100/Day',
      additionalBenefits: '',
      category: formVal.category || ''
    };

    if (this.editingPlanId()) {
      this.api.updatePlan(this.editingPlanId()!, planData).subscribe({
        next: () => {
          this.loadPlans();
          this.resetForm();
        }
      });
    } else {
      this.api.createPlan(this.selectedOperatorId()!, planData).subscribe({
        next: () => {
          this.loadPlans();
          this.resetForm();
        }
      });
    }
  }

  togglePlanStatus(plan: Plan) {
    const originalStatus = plan.isActive;
    const newStatus = !originalStatus;
    
    // Optimistic Update: Update the signal immutably
    this.plans.update(current => 
      current.map(p => p.id === plan.id ? { ...p, isActive: newStatus } : p)
    );
    
    this.processingIds.update(ids => {
      const next = new Set(ids);
      next.add(plan.id);
      return next;
    });
    
    const request = newStatus ? 
      this.api.activatePlan(plan.id) : 
      this.api.deactivatePlan(plan.id);
      
    request.subscribe({
      next: (updatedPlan: Plan) => {
        this.processingIds.update(ids => {
          const next = new Set(ids);
          next.delete(plan.id);
          return next;
        });
        // Ensure accurate server state is reflected
        this.plans.update(current => 
          current.map(p => p.id === plan.id ? { ...p, ...updatedPlan } : p)
        );
      },
      error: (err: any) => {
        this.processingIds.update(ids => {
          const next = new Set(ids);
          next.delete(plan.id);
          return next;
        });
        // Rollback on failure
        this.plans.update(current => 
          current.map(p => p.id === plan.id ? { ...p, isActive: originalStatus } : p)
        );
        alert(err?.error?.message || 'Failed to update plan status. Note: You cannot activate a plan if the operator is inactive.');
      }
    });
  }

  editPlan(plan: Plan) {
    this.editingPlanId.set(plan.id);
    this.selectedOperatorId.set(plan.operatorId);
    this.planForm.patchValue({
      planName: plan.planName,
      price: plan.price,
      validityDays: plan.validityDays,
      dataLimit: plan.dataLimit,
      callBenefit: plan.callBenefit,
      smsBenefit: plan.smsBenefit,
      category: plan.category,
      isActive: plan.isActive
    });
    this.showAddForm.set(true);
    document.body.classList.add('modal-open');
  }

  deletePlan(id: number) {
    if (confirm('Delete this plan package permanently?')) {
      this.api.deletePlan(id).subscribe({
        next: () => this.loadPlans()
      });
    }
  }

  formatLabel(str: string): string {
    if (!str) return '';
    return str.charAt(0) + str.slice(1).toLowerCase();
  }

  toggleAddForm() {
    if (this.showAddForm()) {
      this.resetForm();
    } else {
      this.showAddForm.set(true);
      document.body.classList.add('modal-open');
    }
  }

  resetForm() {
    this.showAddForm.set(false);
    this.editingPlanId.set(null);
    this.planForm.reset({ 
      price: 0, 
      validityDays: 28, 
      dataLimit: '1.5GB/Day', 
      callBenefit: 'Unlimited', 
      category: '',
      isActive: true 
    });
    document.body.classList.remove('modal-open');
  }
}
