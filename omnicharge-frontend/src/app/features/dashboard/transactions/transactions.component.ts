import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentApiService } from '../../../core/services/payment-api.service';
import { TransactionResponse } from '../../../core/models/api.models';
import { CardComponent } from '../../../shared/ui/card/card.component';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-10 animate-in fade-in duration-700">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white/20 p-8 rounded-[32px] glass-panel border-none">
        <div>
          <h2 class="text-5xl font-black text-slate-900 tracking-tighter italic">Payment History</h2>
          <p class="text-slate-500 font-bold text-[11px] uppercase tracking-[0.3em] mt-3 opacity-60">Your recent payment records</p>
        </div>
      </div>

      <app-card class="p-0 glass-card border-none bg-white/40 overflow-hidden shadow-2xl rounded-[32px]">
        <div class="px-6 py-5 border-b border-slate-200/60 bg-white/30">
          <h3 class="text-lg font-black text-slate-900 tracking-tight">Payments</h3>
          <p class="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Payment ID, amount, status, and date</p>
        </div>
        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200/60 bg-transparent">
                <th class="px-6 py-4">Payment ID</th>
                <th class="px-6 py-4">Amount</th>
                <th class="px-6 py-4">Status</th>
                <th class="px-6 py-4">Date / Time</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100/50 text-sm">
              <tr *ngFor="let tx of transactions()" class="group hover:bg-blue-50/20 transition-all duration-300">
                <td class="px-6 py-5 font-semibold text-slate-900 text-xs">{{ tx.transactionId }}</td>
                <td class="px-6 py-5 font-black text-slate-900 text-sm italic">₹{{ tx.amount }}</td>
                <td class="px-6 py-5">
                  <span class="px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 w-fit border border-slate-100 shadow-sm"
                        [ngClass]="getPaymentStatusStyles(tx.status)">
                    <span class="w-1.5 h-1.5 rounded-full" [ngClass]="getPaymentDotClass(tx.status)"></span>
                    {{ tx.status }}
                  </span>
                </td>
                <td class="px-6 py-5 font-medium text-slate-600 text-xs">{{ tx.createdDate | date:'dd MMM yyyy, hh:mm a' }}</td>
              </tr>

              <tr *ngIf="!isLoading() && transactions().length === 0">
                <td colspan="4" class="py-20 text-center bg-white/20">
                  <div class="flex flex-col items-center justify-center gap-4">
                    <div class="flex h-16 w-16 items-center justify-center rounded-[24px] border border-white/70 bg-white/60 shadow-sm">
                      <span class="text-[10px] font-black uppercase tracking-[0.28em] text-blue-500">OC</span>
                    </div>
                    <p class="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">No payment records found</p>
                  </div>
                </td>
              </tr>

              <tr *ngIf="isLoading()">
                <td colspan="4" class="py-20 text-center bg-white/20">
                  <p class="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Loading payments...</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </app-card>
    </div>
  `
})
export class TransactionsComponent implements OnInit {
  private paymentApi = inject(PaymentApiService);

  transactions = signal<TransactionResponse[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.paymentApi.getPaymentHistory(0, 50).subscribe({
      next: (page) => {
        this.transactions.set(page.content);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  getPaymentStatusStyles(status: TransactionResponse['status']): string {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'PENDING':
      case 'INITIATED':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default:
        return 'bg-red-500/10 text-red-500 border-red-500/20';
    }
  }

  getPaymentDotClass(status: TransactionResponse['status']): string {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]';
      case 'PENDING':
      case 'INITIATED':
        return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]';
      default:
        return 'bg-red-500';
    }
  }
}
