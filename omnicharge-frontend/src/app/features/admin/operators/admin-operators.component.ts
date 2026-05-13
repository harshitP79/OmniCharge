import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { Operator } from '../../../core/models/api.models';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { InputComponent } from '../../../shared/ui/input/input.component';

@Component({
  selector: 'app-admin-operators',
  standalone: true,
  imports: [CommonModule, CardComponent, ButtonComponent, InputComponent, ReactiveFormsModule, FormsModule],
  template: `
    <div class="space-y-10">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 class="text-4xl font-black text-slate-900 tracking-widest uppercase">Operator Assets</h1>
          <p class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">Manage the available service providers</p>
        </div>
        
        <div class="flex flex-wrap items-center gap-4 w-full md:w-auto">
           <div class="relative flex-grow md:flex-grow-0">
             <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                placeholder="Search Provider..." 
                class="w-full md:w-64 bg-white border border-slate-200 text-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold focus:outline-none focus:border-purple-500 transition-all shadow-inner">
             <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">🔍</span>
           </div>

           <app-button 
              (onClick)="toggleAddForm()" 
              variant="primary">
              {{ showAddForm() ? 'Abort Registration' : 'Initialize Provider' }}
           </app-button>
        </div>
      </div>

      <!-- Top Operator Highlight -->
      <div *ngIf="isStatsLoading()" class="h-24 w-full bg-slate-100 rounded-[32px] animate-pulse glass-panel border-none"></div>
      
      <div *ngIf="!isStatsLoading() && topOperator()" class="glass-panel border-none bg-emerald-500/10 p-6 md:p-8 rounded-[32px] flex items-center justify-between shadow-sm relative overflow-hidden">
         <div class="absolute right-0 top-0 w-64 h-64 bg-emerald-400/20 blur-[60px] rounded-full pointer-events-none -mt-32 -mr-32"></div>
         
         <div class="relative z-10 flex items-center gap-6">
            <div class="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center p-3 shadow-lg shadow-emerald-500/20 group transition-transform hover:scale-105">
               <img *ngIf="getOperatorLogo(topOperator()?.originalName)" [src]="getOperatorLogo(topOperator()?.originalName)" [alt]="topOperator()?.originalName" class="w-full h-full object-contain">
               <svg *ngIf="!getOperatorLogo(topOperator()?.originalName)" class="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            </div>
            <div>
               <p class="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-1">Top Performing Operator</p>
               <h3 class="text-3xl font-black text-emerald-700 tracking-tighter uppercase">{{ topOperator()?.originalName }}</h3>
            </div>
         </div>
         <div class="relative z-10 text-right hidden sm:block">
            <p class="text-4xl font-black text-emerald-600 italic tracking-tighter">{{ topOperator()?.percentage | number:'1.0-1' }}%</p>
            <p class="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Utilization Share</p>
         </div>
      </div>

      <!-- Registration Modal -->
      <div *ngIf="showAddForm()" class="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4" (click)="resetForm()">
         <!-- Backdrop -->
         <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"></div>

         <!-- Modal Content -->
         <div class="relative w-full max-w-3xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-8 md:p-10 z-10 animate-modal-in max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <!-- Decorative glow -->
            <div class="absolute top-0 right-0 w-[250px] h-[250px] bg-gradient-to-bl from-blue-400/10 to-transparent blur-[60px] rounded-full pointer-events-none"></div>

            <!-- Close Button -->
            <button type="button" (click)="resetForm()" class="absolute top-6 right-6 z-20 w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all duration-200 hover:rotate-90">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div class="mb-8 border-b border-slate-100 pb-6 relative z-10">
               <h3 class="text-2xl font-black text-slate-900 uppercase tracking-tight">{{ editingId() ? 'Update Provider' : 'Initialize Provider' }}</h3>
               <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Add or update operator details</p>
            </div>

            <form [formGroup]="operatorForm" (ngSubmit)="onSubmit()" class="space-y-8 relative z-10">
               <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <app-input
                      id="name"
                      label="Provider Name"
                      placeholder="e.g. Airtel"
                      formControlName="name"
                  ></app-input>

                  <app-input
                      id="code"
                      label="Network Code"
                      placeholder="e.g. AIRTEL_IN"
                      formControlName="code"
                  ></app-input>

                  <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Asset Class</label>
                    <div class="relative">
                      <select formControlName="category" class="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-4 pr-10 py-3 text-xs font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer hover:border-slate-300 hover:bg-slate-100/50">
                        <option value="PREPAID">Prepaid Mobile</option>
                        <option value="POSTPAID">Postpaid Mobile</option>
                        <option value="DTH">Direct-To-Home</option>
                        <option value="ELECTRICITY">Electricity Utilities</option>
                        <option value="GAS">Gas Pipeline</option>
                        <option value="WATER">Water Authority</option>
                      </select>
                      <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </div>
                    </div>
                  </div>

                   <div class="space-y-4">
                      <app-input
                          id="logoUrl"
                          label="Asset Logo URL"
                          placeholder="e.g. https://logo.com/img.png"
                          formControlName="logoUrl"
                      ></app-input>
                      
                      <!-- Logo Preview -->
                      <div class="h-16 w-16 border rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden p-2" *ngIf="operatorForm.value.logoUrl">
                         <img [src]="operatorForm.value.logoUrl" class="max-w-full max-h-full object-contain" alt="Preview">
                      </div>
                   </div>
               </div>
               
               <div class="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-slate-100">
                  <app-button type="button" variant="secondary" (onClick)="resetForm()">Discard</app-button>
                  <app-button type="submit" [disabled]="operatorForm.invalid">
                    {{ editingId() ? 'Push Change' : 'Authorize Provider' }}
                  </app-button>
               </div>
            </form>
         </div>
      </div>

      <app-card class="border-slate-200 p-0 overflow-hidden shadow-2xl glass-panel">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200/60 bg-transparent">
                <th class="px-6 py-4">S.No.</th>
                <th class="px-6 py-4 text-center">Visual ID</th>
                <th class="px-6 py-4">Provider Core</th>
                <th class="px-6 py-4">Code</th>
                <th class="px-6 py-4 text-center">State</th>
                <th class="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100/50 text-sm">
              <tr *ngFor="let op of filteredOperators(); let i = index" class="group hover:bg-slate-50/50 transition-all duration-300">
                <td class="px-6 py-5 font-mono text-slate-400 text-[10px]">#0{{ i + 1 }}</td>
                <td class="px-6 py-5 flex justify-center">
                   <div class="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center p-2 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all overflow-hidden">
                      <img *ngIf="op.logoUrl" [src]="op.logoUrl" [alt]="op.name" class="w-full h-full object-contain">
                      <span *ngIf="!op.logoUrl" class="text-[9px] font-bold text-slate-300 uppercase">Void</span>
                   </div>
                </td>
                <td class="px-6 py-5">
                   <p class="text-slate-900 font-bold uppercase tracking-wider text-sm leading-none">{{ op.name }}</p>
                   <p class="text-[10px] text-slate-500 font-medium mt-1 uppercase">{{ op.category }} Hub</p>
                </td>
                <td class="px-6 py-5 font-mono text-xs text-blue-500 font-semibold">{{ op.code }}</td>
                <td class="px-6 py-5 text-center">
                   <div class="flex items-center justify-center gap-3">
                      <span class="px-3 py-1.5 rounded-full text-[9px] font-bold tracking-widest border uppercase shadow-sm"
                         [ngClass]="op.isActive ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'">
                         {{ op.isActive ? 'Active' : 'Deactivated' }}
                      </span>
                      <!-- Toggle Switch -->
                      <button 
                         (click)="toggleOperatorStatus(op)"
                         [disabled]="processingIds().has(op.id)"
                         class="relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none shadow-inner"
                         [ngClass]="op.isActive ? 'bg-blue-600' : 'bg-slate-200'">
                          <span 
                           class="inline-block h-3 w-3 transform rounded-full bg-white transition-transform shadow-sm border border-slate-100"
                           [ngClass]="op.isActive ? 'translate-x-[22px]' : 'translate-x-[2px]'">
                         </span>
                         <div *ngIf="processingIds().has(op.id)" class="absolute inset-0 flex items-center justify-center bg-white/40 rounded-full">
                            <div class="w-2 h-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                         </div>
                      </button>
                   </div>
                </td>
                <td class="px-6 py-5 text-right whitespace-nowrap">
                   <button (click)="editOperator(op)" class="text-purple-500 hover:text-purple-600 hover:bg-purple-50 transition-colors py-1.5 px-3 rounded-md mr-2 text-[9px] font-bold uppercase tracking-widest">Modifier</button>
                   <button (click)="deleteOperator(op.id)" class="text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors py-1.5 px-3 rounded-md text-[9px] font-bold uppercase tracking-widest">Purge</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div *ngIf="isLoading()" class="py-20 flex justify-center">
           <div class="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <div *ngIf="!isLoading() && operators().length === 0" class="py-20 text-center">
           <p class="text-slate-500 font-black uppercase tracking-widest text-xs">No operators found</p>
        </div>
      </app-card>
    </div>
  `
})
export class AdminOperatorsComponent implements OnInit {
  private api = inject(AdminApiService);
  private fb = inject(FormBuilder);

  operators = signal<Operator[]>([]);
  isLoading = signal(true);
  showAddForm = signal(false);
  editingId = signal<number | null>(null);
  searchQuery = '';
  processingIds = signal<Set<number>>(new Set());

  topOperator = signal<any>(null);
  isStatsLoading = signal(true);

  getOperatorLogo(name: string): string | null {
    if (!name) return null;
    const op = this.operators().find(o => o.name.toLowerCase() === name.toLowerCase());
    return op ? op.logoUrl : null;
  }

  operatorForm = this.fb.group({
    name: ['', [Validators.required]],
    code: ['', [Validators.required]],
    category: ['PREPAID', [Validators.required]],
    logoUrl: ['']
  });

  ngOnInit() {
    this.loadOperators();
    this.api.getAggregatedPerformanceStats(500).subscribe({
      next: (data) => {
        this.topOperator.set(data.topOperator);
        this.isStatsLoading.set(false);
      },
      error: () => this.isStatsLoading.set(false)
    });
  }

  loadOperators() {
    this.isLoading.set(true);
    this.api.getAllOperators('ALL').subscribe({
      next: (data) => {
        this.operators.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  filteredOperators() {
    if (!this.searchQuery) return this.operators();
    const query = this.searchQuery.toLowerCase();
    return this.operators().filter(op => 
      op.name.toLowerCase().includes(query) || 
      op.code.toLowerCase().includes(query)
    );
  }

  toggleAddForm() {
    if (this.showAddForm()) {
      this.resetForm();
    } else {
      this.showAddForm.set(true);
      document.body.classList.add('modal-open');
    }
  }

  onSubmit() {
    if (this.operatorForm.invalid) return;

    const opData = {
      name: this.operatorForm.value.name!,
      code: this.operatorForm.value.code!,
      category: this.operatorForm.value.category!,
      logoUrl: this.operatorForm.value.logoUrl || undefined
    };

    if (this.editingId()) {
      this.api.updateOperator(this.editingId()!, opData).subscribe({
        next: () => {
          this.loadOperators();
          this.resetForm();
        }
      });
    } else {
      this.api.createOperator(opData).subscribe({
        next: () => {
          this.loadOperators();
          this.resetForm();
        }
      });
    }
  }

  toggleOperatorStatus(op: Operator) {
    const originalStatus = op.isActive;
    const newStatus = !originalStatus;
    
    // Optimistic Update: Update the signal immutably
    this.operators.update(current => 
      current.map(o => o.id === op.id ? { ...o, isActive: newStatus } : o)
    );
    
    this.processingIds.update(ids => {
      const next = new Set(ids);
      next.add(op.id);
      return next;
    });
    
    const request = newStatus ? 
      this.api.activateOperator(op.id) : 
      this.api.deactivateOperator(op.id);
      
    request.subscribe({
      next: (updatedOp: Operator) => {
        this.processingIds.update(ids => {
          const next = new Set(ids);
          next.delete(op.id);
          return next;
        });
        // Ensure accurate server state is reflected
        this.operators.update(current => 
          current.map(o => o.id === op.id ? { ...o, ...updatedOp } : o)
        );
      },
      error: (err: any) => {
        this.processingIds.update(ids => {
          const next = new Set(ids);
          next.delete(op.id);
          return next;
        });
        // Rollback on failure
        this.operators.update(current => 
          current.map(o => o.id === op.id ? { ...o, isActive: originalStatus } : o)
        );
        alert(err?.error?.message || 'Failed to update operator status. Please try again.');
      }
    });
  }

  editOperator(op: Operator) {
    this.editingId.set(op.id);
    this.operatorForm.patchValue({
      name: op.name,
      code: op.code,
      category: op.category,
      logoUrl: op.logoUrl
    });
    this.showAddForm.set(true);
    document.body.classList.add('modal-open');
  }

  deleteOperator(id: number) {
    if (confirm('Critical: Are you sure you want to purge this provider? All associated plans will be deactivated.')) {
      this.api.deleteOperator(id).subscribe({
        next: () => this.loadOperators()
      });
    }
  }

  resetForm() {
    this.showAddForm.set(false);
    this.editingId.set(null);
    this.operatorForm.reset({ category: 'PREPAID' });
    document.body.classList.remove('modal-open');
  }
}
