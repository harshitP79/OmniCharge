import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { UserApiService } from '../../../core/services/user-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { InputComponent } from '../../../shared/ui/input/input.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

export function matchValidator(matchTo: string, reverse?: boolean): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.parent && reverse) {
      const c = (control.parent.controls as any)[matchTo] as AbstractControl;
      if (c) {
        c.updateValueAndValidity();
      }
      return null;
    }
    return !!control.parent &&
      !!control.parent.value &&
      control.value === (control.parent.controls as any)[matchTo].value
      ? null
      : { matching: true };
  };
}

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardComponent, InputComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-xl mx-auto py-12 relative">
      <div class="mb-12 bg-white/20 p-8 rounded-[32px] glass-panel border-none shadow-sm text-center">
        <h1 class="text-4xl font-black text-slate-900 tracking-tighter italic">Change Password</h1>
        <p class="text-slate-500 font-bold text-[11px] uppercase tracking-[0.3em] mt-3 opacity-60">Update your password</p>
      </div>

      <app-card class="glass-card border-none bg-white/40 shadow-2xl p-10 rounded-[48px] overflow-hidden relative">
        <div class="absolute -right-10 -top-10 w-40 h-40 bg-blue-500 blur-[60px] opacity-10"></div>
        
        <form [formGroup]="passwordForm" (ngSubmit)="onSubmit()" class="space-y-10 relative z-10">
          <div class="space-y-2">
            <app-input
              id="oldPassword"
              type="password"
              label="Current Password"
              formControlName="oldPassword"
              placeholder="Enter your current password"
              [error]="getErrorMessage('oldPassword')"
            ></app-input>
          </div>

          <div class="space-y-8 pt-6 border-t border-slate-100/50">
            <app-input
              id="newPassword"
              type="password"
              label="New Password"
              formControlName="newPassword"
              placeholder="At least 8 characters and one number"
              [error]="getErrorMessage('newPassword')"
            ></app-input>

            <app-input
              id="confirmPassword"
              type="password"
              label="Confirm Password"
              formControlName="confirmPassword"
              placeholder="Repeat your new password"
              [error]="getErrorMessage('confirmPassword')"
            ></app-input>
          </div>

          <div *ngIf="statusError()" class="bg-red-50/50 border border-red-100 rounded-[20px] p-4 animate-in fade-in slide-in-from-top-2 duration-300">
             <p class="text-red-500 text-[11px] font-black uppercase tracking-widest text-center">{{ statusError() }}</p>
          </div>

          <div *ngIf="statusSuccess()" class="bg-green-50/50 border border-green-100 rounded-[20px] p-4 animate-in fade-in slide-in-from-top-2 duration-300">
             <p class="text-green-600 text-[11px] font-black uppercase tracking-widest text-center">{{ statusSuccess() }}</p>
          </div>

          <div class="pt-6">
            <app-button
              type="submit"
              class="w-full h-18 shadow-2xl shadow-blue-500/10"
              [disabled]="passwordForm.invalid || isLoading()"
            >
              <div class="flex items-center justify-center gap-4">
                <span *ngIf="isLoading()" class="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
                {{ isLoading() ? 'UPDATING...' : 'UPDATE PASSWORD' }}
              </div>
            </app-button>
          </div>
        </form>
      </app-card>

      <div class="mt-12 flex items-center justify-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] opacity-50">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        Your session is secure
      </div>
    </div>
  `
})
export class ChangePasswordComponent {
  private fb = inject(FormBuilder);
  private api = inject(UserApiService);
  private auth = inject(AuthService);

  isLoading = signal(false);
  statusError = signal<string | null>(null);
  statusSuccess = signal<string | null>(null);

  passwordForm = this.fb.group({
    oldPassword: ['', [Validators.required]],
    newPassword: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern('^(?=.*[0-9]).+$')
    ]],
    confirmPassword: ['', [Validators.required, matchValidator('newPassword')]]
  });

  getErrorMessage(controlName: string): string {
    const control = this.passwordForm.get(controlName);
    if (!control || !control.touched || !control.errors) return '';

    if (control.errors['required']) return 'This field is required';
    if (control.errors['minlength']) return 'Use at least 8 characters';
    if (control.errors['pattern']) return 'Include at least one number';
    if (control.errors['matching']) return 'Passwords do not match';

    return 'Please check this field';
  }

  onSubmit() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { oldPassword, newPassword } = this.passwordForm.value;
    if (!oldPassword || !newPassword) return;

    this.isLoading.set(true);
    this.statusError.set(null);
    this.statusSuccess.set(null);

    this.api.changePassword({ currentPassword: oldPassword, newPassword }).subscribe({
      next: () => {
        this.statusSuccess.set('Password updated. Signing you out...');
        this.passwordForm.reset();

        setTimeout(() => {
          this.auth.logoutAndRedirect();
        }, 2000);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.statusError.set(err?.error?.message || 'Current password is incorrect');
      }
    });
  }
}
