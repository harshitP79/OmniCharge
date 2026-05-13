import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { PaymentApiService } from '../../core/services/payment-api.service';
import { RechargeStore } from '../../store/recharge.store';
import { timer, Subject, takeUntil, switchMap, map, filter, Subscription, catchError, of, retry, timeout, finalize } from 'rxjs';
import { CardComponent } from '../../shared/ui/card/card.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

declare var Razorpay: any;

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, CardComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-12 py-12 relative overflow-hidden">
      <div class="max-w-xl mx-auto relative z-10">
        <app-card class="bg-white/40 border-none shadow-2xl p-0 overflow-hidden rounded-[48px]">
          <div class="bg-gradient-to-br from-blue-50 to-blue-100/50 p-10 text-center border-b border-white/50">
            <h1 class="text-4xl font-black text-slate-900 tracking-tighter italic leading-none">Payment Review</h1>
            <p class="text-slate-400 font-black uppercase text-[10px] tracking-[0.4em] mt-4 opacity-70">Confirm your recharge details</p>
          </div>

          <div class="p-10">
            <div *ngIf="store.selectedPlan() as plan" class="space-y-2 mb-12">
              <div class="flex justify-between items-center p-5 rounded-2xl hover:bg-white/50 transition-all duration-300">
                <span class="text-slate-400 font-black uppercase text-[9px] tracking-widest">Mobile Number</span>
                <span class="text-slate-900 font-black tracking-tight text-lg">{{ store.mobileNumber() }}</span>
              </div>
              <div class="flex justify-between items-center p-5 rounded-2xl hover:bg-white/50 transition-all duration-300">
                <span class="text-slate-400 font-black uppercase text-[9px] tracking-widest">Operator</span>
                <div class="flex items-center gap-3">
                  <div *ngIf="store.operator()?.logoUrl" class="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center p-1.5 shadow-sm">
                    <img [src]="store.operator()?.logoUrl" [alt]="store.operator()?.operatorName" class="w-full h-full object-contain">
                  </div>
                  <span class="text-slate-900 font-black tracking-tight">{{ store.operator()?.operatorName }}</span>
                </div>
              </div>
              <div class="flex justify-between items-center p-5 rounded-2xl hover:bg-white/50 transition-all duration-300">
                <span class="text-slate-400 font-black uppercase text-[9px] tracking-widest">Selected Plan</span>
                <span class="text-slate-700 font-bold text-sm tracking-tight italic">"{{ plan.planName }}"</span>
              </div>
              
              <div class="relative mt-8 group">
                <div class="absolute inset-0 bg-blue-600 blur-[40px] opacity-10 rounded-[32px] transition-all group-hover:opacity-20"></div>
                <div class="relative flex justify-between items-center p-8 bg-white/70 rounded-[32px] border border-white shadow-xl">
                  <span class="text-blue-600 font-black uppercase text-[11px] tracking-[0.3em]">Total Amount</span>
                  <span class="text-5xl font-black text-slate-900 tracking-tighter italic">₹{{ plan.price }}</span>
                </div>
              </div>
            </div>

            <div class="text-center py-12" *ngIf="isProcessing()">
               <div class="relative w-24 h-24 mx-auto mb-10">
                  <div class="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                  <div class="absolute inset-0 border-4 border-blue-600 border-t-white rounded-full animate-[spin_0.8s_ease-in-out_infinite] shadow-xl shadow-blue-500/20"></div>
               </div>
              <p class="text-slate-400 font-black uppercase text-[10px] tracking-[0.5em] animate-pulse">{{ statusMessage() }}</p>
            </div>

            <div class="text-center py-12 animate-in fade-in zoom-in-95 duration-500" *ngIf="paymentFinalStatus() === 'SUCCESS'">
              <div class="relative w-24 h-24 mx-auto mb-10">
                <div class="absolute inset-0 bg-green-500 blur-[40px] opacity-20 rounded-full"></div>
                <div class="relative h-24 w-24 bg-green-50 border-4 border-white rounded-full flex items-center justify-center mx-auto shadow-2xl">
                  <svg class="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
              </div>
              <h2 class="text-4xl font-black text-slate-900 tracking-tighter italic mb-4">Recharge Complete</h2>
              <p class="text-slate-500 font-medium text-lg leading-relaxed px-8">Your recharge was completed successfully.</p>
              <app-button class="mt-12 h-16 w-full" (onClick)="goToDashboard()">VIEW HISTORY</app-button>
            </div>
            
            <div class="text-center py-12 animate-in fade-in zoom-in-95 duration-500" *ngIf="paymentFinalStatus() === 'FAILED'">
              <div class="relative w-24 h-24 mx-auto mb-10">
                <div class="absolute inset-0 bg-red-500 blur-[40px] opacity-20 rounded-full"></div>
                <div class="relative h-24 w-24 bg-red-50 border-4 border-white rounded-full flex items-center justify-center mx-auto shadow-2xl">
                  <svg class="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                </div>
              </div>
              <h2 class="text-4xl font-black text-slate-900 tracking-tighter italic mb-4">Payment Failed</h2>
              <p class="text-red-500 font-black uppercase text-[11px] tracking-[0.3em] bg-red-50 py-3 px-6 rounded-full inline-block">
                {{ errorMsg() || 'Payment timed out' }}
              </p>
              <app-button class="mt-12 h-16 w-full" variant="danger" (onClick)="retryPayment()">TRY AGAIN</app-button>
            </div>

            <div class="mt-8" *ngIf="!isProcessing() && !paymentFinalStatus()">
              <app-button class="w-full h-18" (onClick)="startCheckoutSaga()">
                 PAY NOW
              </app-button>
            </div>
          </div>
        </app-card>
      </div>
    </div>
  `
})
export class CheckoutComponent implements OnInit, OnDestroy {
  store = inject(RechargeStore);
  private api = inject(PaymentApiService);
  private router = inject(Router);
  private zone = inject(NgZone);

  isProcessing = signal(false);
  statusMessage = signal('Preparing payment...');
  paymentFinalStatus = signal<'SUCCESS' | 'FAILED' | null>(null);
  errorMsg = signal<string | null>(null);
  
  private destroy$ = new Subject<void>();
  private pollingSub?: Subscription;

  ngOnInit() {
    this.loadRazorpayScript();

    if (!this.store.selectedPlan() || !this.store.mobileNumber() || !this.store.operator()) {
      this.router.navigate(['/dashboard/overview']);
      return;
    }

    this.startCheckoutSaga();
  }

  private loadRazorpayScript() {
    if (!document.getElementById('razorpay-js')) {
      const script = document.createElement('script');
      script.id = 'razorpay-js';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);
    }
  }

  startCheckoutSaga() {
    this.isProcessing.set(true);
    this.paymentFinalStatus.set(null);
    this.errorMsg.set(null);
    this.statusMessage.set('Starting your recharge...');

    const payload = {
      mobileNumber: this.store.mobileNumber()!,
      operatorId: this.store.operator()!.operatorId,
      planId: this.store.selectedPlan()!.id,
      paymentMethod: 'RAZORPAY'
    };

    this.api.initiateRecharge(payload).pipe(
      catchError(err => {
        this.handleFailure(err?.error?.message || 'Could not start the payment.');
        return of(null);
      })
    ).subscribe((res) => {
      if (res) {
        this.statusMessage.set('Waiting for payment details...');
        this.pollPaymentHistory(res.rechargeId);
      }
    });
  }

  private pollPaymentHistory(rechargeId: string) {
    this.statusMessage.set('Waiting for payment confirmation...');
    
    this.pollingSub = timer(1000, 3000).pipe(
      switchMap(() => this.api.getPaymentHistory(0, 50).pipe(
        retry(2), 
        catchError(() => of({ content: [] }))
      )),
      map((page) => page.content.find(tx => tx.rechargeId === rechargeId)),
      filter(tx => !!tx && (!!tx.razorpayOrderId || tx.status === 'FAILED')),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (transaction) => {
        if (!transaction) return;
        
        this.stopPolling();
        
        if (transaction.status === 'FAILED') {
          this.handleFailure(transaction.failureReason || 'Payment could not be completed.');
          return;
        }

        if (transaction.razorpayOrderId) {
           this.statusMessage.set('Payment ready.');
           this.openRazorpay(transaction.razorpayOrderId, transaction.transactionId);
        }
      },
      error: () => {
        this.stopPolling();
        this.handleFailure('The payment check timed out. Please try again.');
      }
    });
  }

  private stopPolling() {
     if (this.pollingSub) {
        this.pollingSub.unsubscribe();
        this.pollingSub = undefined;
     }
  }

  private isCancelling = false;

  private openRazorpay(orderId: string, transactionId: string) {
    const options = {
      key: environment.razorpayKeyId,
      amount: this.store.selectedPlan()!.price * 100,
      currency: 'INR',
      name: 'OmniCharge',
      description: `Mobile: ${this.store.mobileNumber()}`,
      order_id: orderId,
      handler: (response: any) => {
        this.zone.run(() => {
          this.verifyPayment(transactionId, response.razorpay_payment_id, response.razorpay_signature);
        });
      },
      modal: {
        ondismiss: () => {
          this.zone.run(() => {
            this.handleManualCancel(transactionId);
          });
        },
        escape: true,
        backdropclose: false
      },
      theme: { color: '#2563eb' }
    };
    
    try {
      const rzp = new Razorpay(options);
      rzp.open();
    } catch {
      this.handleFailure('Could not open the payment window.');
    }
  }

  private handleManualCancel(transactionId: string) {
    if (this.isCancelling) return;
    this.isCancelling = true;
    this.isProcessing.set(true);
    this.statusMessage.set('Cancelling payment...');

    this.api.cancelPayment(transactionId).pipe(
      timeout(5000),
      retry(1),
      finalize(() => {
        this.isCancelling = false;
        this.isProcessing.set(false);
      })
    ).subscribe({
      next: () => {
        this.paymentFinalStatus.set('FAILED');
        this.errorMsg.set('Payment cancelled. You can try again anytime.');
      },
      error: () => {
        this.paymentFinalStatus.set('FAILED');
        this.errorMsg.set('Payment cancelled. You can try again anytime.');
      }
    });
  }

  private verifyPayment(transactionId: string, paymentId: string, signature: string) {
    this.statusMessage.set('Finalizing payment...');
    
    this.api.confirmPayment(transactionId, paymentId, signature).pipe(
      catchError(err => {
        this.handleFailure(err?.error?.message || 'Payment verification failed.');
        return of(null);
      }),
      finalize(() => {
        this.isProcessing.set(false);
      })
    ).subscribe((res) => {
      if (res) {
        if (res.status === 'SUCCESS') {
           this.paymentFinalStatus.set('SUCCESS');
           this.store.clearFlow();
        } else {
           this.handleFailure('Payment could not be completed.');
        }
      }
    });
  }

  private handleFailure(message: string) {
    this.isProcessing.set(false);
    this.errorMsg.set(message);
    this.paymentFinalStatus.set('FAILED');
  }

  retryPayment() {
    this.startCheckoutSaga();
  }

  goToDashboard() {
    this.router.navigate(['/dashboard/history']);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopPolling();
  }
}
