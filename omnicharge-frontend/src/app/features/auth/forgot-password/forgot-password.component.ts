import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { InputComponent } from '../../../shared/ui/input/input.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { CommonModule } from '@angular/common';

type Step = 'email' | 'otp' | 'reset' | 'done';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CardComponent, InputComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex items-center justify-center p-4 pt-24">
      <div class="w-full max-w-md">
        <app-card>

          <!-- Step 1: Enter Email -->
          <ng-container *ngIf="step() === 'email'">
            <div class="text-center mb-8">
              <h2 class="text-2xl font-bold text-white mb-2">Forgot Password</h2>
              <p class="text-gray-400 text-sm">Enter your registered email. We'll send you an OTP.</p>
            </div>
            <form [formGroup]="emailForm" (ngSubmit)="sendOtp()" class="space-y-5">
              <app-input id="fp-email" type="email" label="Email Address" formControlName="email" placeholder="you@example.com"></app-input>
              <ng-container *ngTemplateOutlet="alerts"></ng-container>
              <app-button type="submit" class="w-full" [disabled]="emailForm.invalid || isLoading()">
                {{ isLoading() ? 'Sending OTP...' : 'Send OTP' }}
              </app-button>
              <p class="text-center text-sm text-gray-400">
                <a routerLink="/auth/login" class="text-blue-400 hover:text-blue-300 transition-colors">Back to Login</a>
              </p>
            </form>
          </ng-container>

          <!-- Step 2: Verify OTP -->
          <ng-container *ngIf="step() === 'otp'">
            <div class="text-center mb-8">
              <h2 class="text-2xl font-bold text-white mb-2">Enter OTP</h2>
              <p class="text-gray-400 text-sm">We sent a 6-digit OTP to <strong class="text-white">{{ pendingEmail }}</strong></p>
            </div>
            <form [formGroup]="otpForm" (ngSubmit)="verifyOtp()" class="space-y-5">
              <app-input id="fp-otp" type="text" label="6-digit OTP" formControlName="otp" placeholder="123456"></app-input>
              <ng-container *ngTemplateOutlet="alerts"></ng-container>
              <app-button type="submit" class="w-full" [disabled]="otpForm.invalid || isLoading()">
                {{ isLoading() ? 'Verifying...' : 'Verify OTP' }}
              </app-button>
              <p class="text-center text-sm text-gray-400 mt-2">
                Didn't receive it?
                <button type="button" (click)="resendOtp()" class="text-blue-400 hover:text-blue-300 ml-1 transition-colors">Resend</button>
              </p>
            </form>
          </ng-container>

          <!-- Step 3: Set New Password -->
          <ng-container *ngIf="step() === 'reset'">
            <div class="text-center mb-8">
              <h2 class="text-2xl font-bold text-white mb-2">Reset Password</h2>
              <p class="text-gray-400 text-sm">Set a new password for your account.</p>
            </div>
            <form [formGroup]="resetForm" (ngSubmit)="resetPassword()" class="space-y-5">
              <app-input id="fp-newpwd" type="password" label="New Password" formControlName="newPassword" placeholder="Minimum 8 characters"></app-input>
              <app-input id="fp-confirmpwd" type="password" label="Confirm Password" formControlName="confirmPassword" placeholder="Repeat password"></app-input>
              <div *ngIf="passwordMismatch()" class="text-red-400 text-sm">Passwords do not match.</div>
              <ng-container *ngTemplateOutlet="alerts"></ng-container>
              <app-button type="submit" class="w-full" [disabled]="resetForm.invalid || passwordMismatch() || isLoading()">
                {{ isLoading() ? 'Resetting...' : 'Reset Password' }}
              </app-button>
            </form>
          </ng-container>

          <!-- Step 4: Success -->
          <ng-container *ngIf="step() === 'done'">
            <div class="text-center py-6">
              <div class="h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-white mb-2">Password Reset!</h2>
              <p class="text-gray-400 mb-6">Your password has been updated. You can now sign in.</p>
              <a routerLink="/auth/login" class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                Go to Login
              </a>
            </div>
          </ng-container>

          <!-- Shared alert template -->
          <ng-template #alerts>
            <div *ngIf="error()" class="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p class="text-red-400 text-sm text-center">{{ error() }}</p>
            </div>
            <div *ngIf="info()" class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p class="text-blue-400 text-sm text-center">{{ info() }}</p>
            </div>
          </ng-template>
        </app-card>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  step = signal<Step>('email');
  isLoading = signal(false);
  error = signal<string | null>(null);
  info = signal<string | null>(null);

  pendingEmail = '';
  pendingOtp = '';

  emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  otpForm = this.fb.group({
    otp: ['', [Validators.required, Validators.pattern('^\\d{6}$')]]
  });

  resetForm = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  });

  passwordMismatch() {
    const { newPassword, confirmPassword } = this.resetForm.value;
    return newPassword && confirmPassword && newPassword !== confirmPassword;
  }

  sendOtp() {
    if (this.emailForm.invalid) return;
    this.isLoading.set(true);
    this.clearAlerts();
    this.pendingEmail = this.emailForm.value.email!;

    this.authService.forgotPassword(this.pendingEmail).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.info.set(res.message || 'OTP sent to your email.');
        this.step.set('otp');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(err?.error?.message || 'Failed to send OTP. Check your email and try again.');
      }
    });
  }

  resendOtp() {
    this.info.set(null);
    this.error.set(null);
    this.authService.forgotPassword(this.pendingEmail).subscribe({
      next: () => this.info.set('OTP resent to your email.'),
      error: () => this.error.set('Failed to resend OTP.')
    });
  }

  verifyOtp() {
    if (this.otpForm.invalid) return;
    this.isLoading.set(true);
    this.clearAlerts();
    this.pendingOtp = this.otpForm.value.otp!;

    this.authService.verifyOtp(this.pendingEmail, this.pendingOtp).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.data) {
          this.step.set('reset');
        } else {
          this.error.set('Invalid OTP. Please check and try again.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(err?.error?.message || 'OTP verification failed.');
      }
    });
  }

  resetPassword() {
    if (this.resetForm.invalid || this.passwordMismatch()) return;
    this.isLoading.set(true);
    this.clearAlerts();

    this.authService.resetPassword(
      this.pendingEmail,
      this.pendingOtp,
      this.resetForm.value.newPassword!
    ).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.step.set('done');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(err?.error?.message || 'Password reset failed. Please try again.');
      }
    });
  }

  private clearAlerts() {
    this.error.set(null);
    this.info.set(null);
  }
}
