import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { RechargeResponse } from '../../../core/models/api.models';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { InputComponent } from '../../../shared/ui/input/input.component';

@Component({
  selector: 'app-admin-recharges',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, ButtonComponent],
  template: `
    <div class="space-y-8">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 class="text-3xl font-black text-slate-900 tracking-tight uppercase">Recharge History</h1>
          <p class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">Real-time monitoring of all system-wide transactions</p>
        </div>
        
        <div class="flex flex-wrap items-center gap-4 w-full md:w-auto">
           <select 
              [(ngModel)]="statusFilter"
              (change)="loadRecharges()"
              class="bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all">
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Success Only</option>
              <option value="FAILED">Failed Only</option>
              <option value="INITIATED">Initiated Only</option>
              <option value="PROCESSING">Processing Only</option>
           </select>
           
           <div class="relative flex-grow md:flex-grow-0">
             <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                (input)="onSearchChange()"
                placeholder="Search Mobile / ID..." 
                class="w-full md:w-64 bg-white border border-slate-200 text-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold focus:outline-none focus:border-purple-500 transition-all shadow-inner">
             <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">🔍</span>
           </div>
        </div>
      </div>

      <app-card class="border-slate-200 p-0 overflow-hidden shadow-2xl glass-panel">
        <div class="overflow-x-auto min-h-[400px]">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200/60 bg-transparent">
                <th class="px-6 py-4">Transaction Core</th>
                <th class="px-6 py-4">Target Asset</th>
                <th class="px-6 py-4">Provider</th>
                <th class="px-6 py-4">Value</th>
                <th class="px-5 py-4 text-center">Status</th>
                <th class="px-6 py-4 text-right">Audit</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100/50 text-sm">
              <tr *ngFor="let audit of filteredRecharges()" class="group hover:bg-slate-50/50 transition-all duration-300">
                <td class="px-6 py-5">
                   <div class="flex flex-col">
                      <span class="text-slate-900 font-bold font-mono text-xs">{{ audit.rechargeId }}</span>
                      <span class="text-[10px] text-slate-400 mt-1 uppercase font-medium tracking-widest">{{ audit.createdDate | date:'medium' }}</span>
                   </div>
                </td>
                <td class="px-6 py-5">
                   <span class="text-slate-700 font-bold tracking-wide text-sm">{{ audit.mobileNumber }}</span>
                </td>
                <td class="px-6 py-5">
                   <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100/50 px-3 py-1.5 rounded-full border border-slate-200/60">
                      {{ audit.operatorName }}
                   </span>
                </td>
                <td class="px-6 py-5 font-black text-slate-900 text-lg">
                   ₹{{ audit.amount }}
                </td>
                <td class="px-5 py-5 text-center">
                   <span class="inline-block px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border shadow-sm"
                      [ngClass]="{
                        'bg-green-500/10 text-green-600 border-green-500/20': audit.status === 'SUCCESS',
                        'bg-red-500/10 text-red-600 border-red-500/20': audit.status === 'FAILED',
                        'bg-yellow-500/10 text-yellow-600 border-yellow-500/20': audit.status === 'INITIATED' || audit.status === 'PROCESSING'
                      }">
                      {{ audit.status }}
                   </span>
                </td>
                <td class="px-6 py-5 text-right">
                   <button (click)="viewDetails(audit)" class="text-purple-500 hover:text-purple-600 hover:bg-purple-50 transition-all font-bold uppercase text-[9px] tracking-widest py-1.5 px-3 rounded-md">
                      Detail View
                   </button>
                </td>
              </tr>
            </tbody>
          </table>
          
          <!-- Loading Overlay -->
          <div *ngIf="isLoading()" class="h-64 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm">
             <div class="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
             <p class="text-slate-500 text-[10px] font-black uppercase tracking-widest">Querying System Ledger...</p>
          </div>

          <!-- Empty State -->
          <div *ngIf="!isLoading() && filteredRecharges().length === 0" class="py-24 text-center">
             <div class="text-slate-400 mb-6 flex justify-center">
                <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
             </div>
             <h3 class="text-xl font-black text-slate-500 uppercase tracking-tighter">No Audit Data Recorded</h3>
             <p class="text-slate-400 text-xs mt-2 font-medium">Verify your filter criteria or system connectivity.</p>
          </div>
        </div>

        <!-- Pagination -->
        <div class="bg-slate-50/50 px-4 md:px-8 py-5 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
           <span class="text-slate-500 font-bold uppercase tracking-widest text-center">Total Entries: {{ totalElements() }}</span>
           <div class="flex gap-4 w-full md:w-auto justify-center">
              <app-button variant="secondary" [disabled]="currentPage() === 0" (onClick)="prevPage()" class="flex-1 md:flex-none text-[10px] px-4">Prev</app-button>
              <app-button variant="secondary" [disabled]="currentPage() >= (totalPages() - 1)" (onClick)="nextPage()" class="flex-1 md:flex-none text-[10px] px-4">Next</app-button>
           </div>
        </div>
      </app-card>

      <!-- Detail Modal -->
      <div *ngIf="selectedAudit()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
         <app-card class="max-w-xl w-full border-slate-200 bg-white shadow-3xl p-10 relative">
            <button (click)="selectedAudit.set(null)" class="absolute top-6 right-6 text-slate-400 hover:text-slate-600 text-xl">✕</button>
            
            <div class="text-center mb-10">
               <h3 class="text-2xl font-black text-slate-900 uppercase tracking-tighter">Transaction Profile</h3>
               <p class="text-slate-500 text-[10px] font-black uppercase mt-1">{{ selectedAudit()?.rechargeId }}</p>
            </div>

            <div class="space-y-6">
               <div class="grid grid-cols-2 gap-8 border-b border-slate-200 pb-6">
                  <div>
                    <p class="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Target Number</p>
                    <p class="text-xl font-black text-slate-900">{{ selectedAudit()?.mobileNumber }}</p>
                  </div>
                  <div>
                    <p class="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Amount</p>
                    <p class="text-xl font-black text-blue-600">₹{{ selectedAudit()?.amount }}</p>
                  </div>
               </div>
               
               <div class="grid grid-cols-2 gap-8 border-b border-slate-200 pb-6">
                  <div>
                    <p class="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">System User ID</p>
                    <p class="text-sm font-bold text-slate-700">#{{ selectedAudit()?.userId || 'GUEST' }}</p>
                  </div>
                  <div>
                    <p class="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Gateway ID</p>
                    <p class="text-[10px] font-mono text-slate-700 truncate">{{ selectedAudit()?.transactionId || 'NOT_AUTHORIZED' }}</p>
                  </div>
               </div>

               <div class="pt-4 flex justify-center">
                  <span class="px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] border"
                    [ngClass]="{
                      'bg-green-500/10 text-green-500 border-green-500/20': selectedAudit()?.status === 'SUCCESS',
                      'bg-red-500/10 text-red-500 border-red-500/20': selectedAudit()?.status === 'FAILED',
                      'bg-yellow-500/10 text-yellow-500 border-yellow-500/20': selectedAudit()?.status === 'INITIATED' || selectedAudit()?.status === 'PROCESSING'
                    }">
                      Status: {{ selectedAudit()?.status }}
                  </span>
               </div>
            </div>

            <app-button variant="primary" class="w-full mt-10 py-4 shadow-xl shadow-purple-600/20" (onClick)="selectedAudit.set(null)">Close Audit</app-button>
         </app-card>
      </div>
    </div>
  `
})
export class AdminRechargesComponent implements OnInit {
  private api = inject(AdminApiService);

  recharges = signal<RechargeResponse[]>([]);
  isLoading = signal(true);
  currentPage = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  pageSize = 15;

  statusFilter = 'ALL';
  searchQuery = '';
  selectedAudit = signal<RechargeResponse | null>(null);

  ngOnInit() {
    this.loadRecharges();
  }

  loadRecharges() {
    this.isLoading.set(true);
    this.api.getAllRecharges(this.currentPage(), this.pageSize).subscribe({
      next: (page) => {
        this.recharges.set(page.content);
        this.totalPages.set(page.totalPages);
        this.totalElements.set(page.totalElements);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  filteredRecharges() {
    return this.recharges().filter(r => {
      const matchStatus = this.statusFilter === 'ALL' || r.status === this.statusFilter;
      const matchSearch = r.mobileNumber.includes(this.searchQuery) || 
                          r.rechargeId.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }

  onSearchChange() {
    // Immediate filtering for UX, server-side search would go here globally
  }

  viewDetails(audit: RechargeResponse) {
    this.selectedAudit.set(audit);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update(p => p + 1);
      this.loadRecharges();
    }
  }

  prevPage() {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
      this.loadRecharges();
    }
  }
}
