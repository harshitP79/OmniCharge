import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RechargeApiService } from '../../../core/services/recharge-api.service';
import { RechargeStore } from '../../../store/recharge.store';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { InputComponent } from '../../../shared/ui/input/input.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { MascotComponent, MascotState } from '../../../shared/components/mascot/mascot.component';

@Component({
  selector: 'app-recharge-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardComponent, InputComponent, ButtonComponent, MascotComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-xl mx-auto py-12 px-4 relative overflow-hidden">
      <!-- Glow effect -->
      <div class="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-blue-400/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div class="text-center mb-12 relative z-10">
        <h1 class="text-5xl font-black text-slate-900 mb-4 tracking-tighter leading-tight bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Recharge in Seconds
        </h1>
        <p class="text-slate-500 font-medium tracking-tight text-lg max-w-sm mx-auto">
          Enter your mobile number to detect the operator and continue to the right plans.
        </p>
      </div>

      <app-card class="relative z-10 overflow-visible">
        <div class="absolute right-5 top-5 hidden sm:flex items-center rounded-[30px] border border-white/75 bg-white/68 pl-16 pr-5 py-4 shadow-[0_22px_54px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div class="pointer-events-none absolute left-2 top-1/2 h-24 w-16 -translate-y-1/2">
            <app-mascot [state]="mascotState()" presence="compact"></app-mascot>
          </div>
          <div class="pr-1">
            <p class="text-[10px] font-black uppercase tracking-[0.34em] text-blue-500">Volt Agent</p>
            <p class="mt-1 max-w-[8rem] text-[11px] font-medium leading-5 text-slate-500">
              Tracking your recharge state in real time.
            </p>
          </div>
        </div>
        
        <form [formGroup]="rechargeForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-8 p-2 sm:pr-52">
          <app-input
            id="mobileNumber"
            type="tel"
            label="Mobile Access"
            formControlName="mobileNumber"
            placeholder="9876543210"
            [error]="mobileError()"
          ></app-input>

          <div *ngIf="error()" class="bg-red-50 border border-red-100 rounded-2xl p-4">
            <p class="text-red-500 text-xs font-bold text-center leading-relaxed">{{ error() }}</p>
          </div>

          <app-button type="submit" class="w-full h-16" [disabled]="rechargeForm.invalid || isLoading()">
            <div class="flex items-center justify-center gap-4">
              <span *ngIf="isLoading()" class="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
              {{ isLoading() ? 'IDENTIFYING...' : 'INITIATE RECHARGE' }}
            </div>
          </app-button>
        </form>
      </app-card>

      <div class="flex items-center justify-center gap-8 mt-12 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
        <span class="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Secure</span>
        <div class="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
        <span class="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Instant</span>
        <div class="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
        <span class="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Reliable</span>
      </div>
    </div>
  `
})
export class RechargeInputComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(RechargeApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(RechargeStore);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly isSuccess = signal(false);

  readonly mascotState = computed<MascotState>(() => {
    if (this.isSuccess()) return 'success';
    if (this.isLoading()) return 'loading';
    if (this.error()) return 'error';
    return 'idle';
  });

  readonly rechargeForm = this.fb.group({
    mobileNumber: ['', [Validators.required, Validators.pattern('^[6-9]\\d{9}$')]]
  });

  readonly mobileError = computed(() => {
    const control = this.rechargeForm.controls.mobileNumber;

    if (!control.touched && !control.dirty) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Enter your 10-digit mobile number.';
    }

    if (control.hasError('pattern')) {
      return 'Use a valid mobile number starting with 6, 7, 8, or 9.';
    }

    return '';
  });

  onSubmit() {
    if (this.rechargeForm.invalid) {
      this.rechargeForm.markAllAsTouched();
      return;
    }

    const mobile = this.rechargeForm.value.mobileNumber!;
    this.isLoading.set(true);
    this.error.set(null);

    this.api.detectOperator(mobile).subscribe({
      next: (operator) => {
        this.isLoading.set(false);

        if (operator && operator.operatorId) {
          this.isSuccess.set(true);
          
          setTimeout(() => {
            this.store.setMobileNumber(mobile);
            this.store.setOperator(operator);
            // Determine if we are in public or dashboard to navigate relative to parent route correctly.
            const basePath = this.router.url.split('/')[1] || 'public';
            this.router.navigate(['/', basePath, 'plans']);
          }, 800);
          return;
        }

        this.error.set('Could not detect operator for this number.');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.isSuccess.set(false);
        this.error.set(err?.error?.message || 'Failed to detect operator. Please check the number and try again.');
      }
    });
  }
}
