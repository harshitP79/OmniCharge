import { Component, ChangeDetectionStrategy, inject, signal, OnInit, AfterViewInit, NgZone } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { InputComponent } from '../../../shared/ui/input/input.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';

declare var google: any;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CardComponent, InputComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex items-center justify-center p-6 pt-24 relative overflow-hidden">
      <div class="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-purple-400/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div class="w-full max-w-[480px] relative z-10">
        <app-card>
          <div class="text-center mb-10">
            <div class="inline-flex items-center justify-center rounded-full border border-blue-100 bg-white px-5 py-2 shadow-sm shadow-blue-100/70 mb-6">
              <span class="text-[11px] font-black uppercase tracking-[0.34em] text-blue-600">OmniCharge</span>
            </div>
            <h1 class="text-4xl font-black text-slate-900 mb-3 tracking-tighter">Create Account</h1>
            <p class="text-slate-500 font-medium tracking-tight px-4">Create your account to start recharging</p>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            <div class="md:col-span-2">
              <app-input
                id="reg-fullname"
                type="text"
                label="Full Name"
                formControlName="fullName"
                placeholder="E.g. Harshit Panwar"
              ></app-input>
            </div>

            <app-input
              id="reg-email"
              type="email"
              label="Email Address"
              formControlName="email"
              placeholder="you@example.com"
            ></app-input>

            <app-input
              id="reg-mobile"
              type="tel"
              label="Mobile Number"
              formControlName="mobileNumber"
              placeholder="9876543210"
            ></app-input>

            <div class="md:col-span-2">
              <app-input
                id="reg-password"
                type="password"
                label="Password"
                formControlName="password"
                placeholder="Enter a strong password"
              ></app-input>
            </div>

            <div class="md:col-span-2 space-y-4">
              <div *ngIf="error()" class="bg-red-50 border border-red-100 rounded-2xl p-4">
                <p class="text-red-500 text-xs font-bold text-center">{{ error() }}</p>
              </div>

              <div *ngIf="success()" class="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <p class="text-blue-600 text-xs font-bold text-center">{{ success() }}</p>
              </div>

              <app-button type="submit" class="w-full h-14" [disabled]="registerForm.invalid || isLoading()">
                {{ isLoading() ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT' }}
              </app-button>

              <div class="relative flex items-center py-2">
                <div class="flex-grow border-t border-slate-100"></div>
                <span class="flex-shrink-0 mx-4 text-slate-300 text-[10px] font-black uppercase tracking-widest">Or sign up faster</span>
                <div class="flex-grow border-t border-slate-100"></div>
              </div>

              <div id="google-signup-container" class="flex justify-center w-full min-h-[44px] transition-opacity hover:opacity-90"></div>

              <p class="text-center text-sm font-medium text-slate-500 mt-6">
                Already registered?
                <a routerLink="/auth/login" class="text-blue-600 font-black ml-1 hover:text-blue-700 transition-colors">Sign In</a>
              </p>
            </div>
          </form>
        </app-card>
      </div>
    </div>
  `
})
export class RegisterComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  isLoading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  private isGoogleInitialized = false;

  registerForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    mobileNumber: ['', [Validators.required, Validators.pattern('^[6-9]\\d{9}$')]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  ngOnInit() {}

  ngAfterViewInit() {
    this.initializeGoogleSignIn();
  }

  private initializeGoogleSignIn() {
    if (typeof google === 'undefined') {
      setTimeout(() => this.initializeGoogleSignIn(), 500);
      return;
    }

    if (!this.isGoogleInitialized && !(window as any).google_initialized) {
      google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: (response: any) => this.ngZone.run(() => this.handleGoogleResponse(response)),
        auto_select: false,
        cancel_on_tap_outside: true
      });
      this.isGoogleInitialized = true;
      (window as any).google_initialized = true;
    }

    google.accounts.id.renderButton(
      document.getElementById('google-signup-container'),
      { 
        theme: 'filled_black', 
        size: 'large', 
        width: 350,
        shape: 'rectangular',
        text: 'signup_with',
        logo_alignment: 'center'
      }
    );
  }

  private handleGoogleResponse(response: any) {
    if (!response.credential) return;

    this.isLoading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.authService.loginWithGoogle(response.credential).subscribe({
      next: (tokens) => {
        this.isLoading.set(false);
        this.success.set('Google sign-up successful!');
        setTimeout(() => {
          if (tokens.role === 'ROLE_ADMIN') {
            this.router.navigateByUrl('/admin/dashboard');
          } else {
            this.router.navigateByUrl('/dashboard');
          }
        }, 1000);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(err?.error?.message || 'Google sign-up failed. Please try email registration.');
      }
    });
  }

  onSubmit() {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.authService.register({
      fullName: this.registerForm.value.fullName!,
      email: this.registerForm.value.email!,
      mobileNumber: this.registerForm.value.mobileNumber!,
      password: this.registerForm.value.password!
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.success.set(res.message || 'Account created! Please sign in.');
        setTimeout(() => this.router.navigate(['/auth/login']), 1500);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err?.status === 409) {
          this.error.set('An account with this email already exists.');
        } else if (err?.status === 400) {
          this.error.set(err?.error?.message || 'Invalid details. Please check your inputs.');
        } else if (err?.status === 0) {
          this.error.set('Cannot connect to server. Please ensure the backend is running.');
        } else {
          this.error.set(err?.error?.message || 'Registration failed. Please try again.');
        }
      }
    });
  }
}
