import { Component, ChangeDetectionStrategy, inject, signal, OnInit, AfterViewInit, NgZone } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { InputComponent } from '../../../shared/ui/input/input.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';

declare var google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CardComponent, InputComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex items-center justify-center p-6 pt-24 relative overflow-hidden">
      <!-- Decorative Glow -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div class="w-full max-w-[440px] relative z-10">
        <app-card>
          <div class="text-center mb-10">
            <div class="inline-flex items-center justify-center rounded-full border border-blue-100 bg-white px-5 py-2 shadow-sm shadow-blue-100/70 mb-6">
              <span class="text-[11px] font-black uppercase tracking-[0.34em] text-blue-600">OmniCharge</span>
            </div>
            <h1 class="text-4xl font-black text-slate-900 mb-3 tracking-tighter">Welcome Back</h1>
            <p class="text-slate-500 font-medium tracking-tight px-4">Sign in to your premium OmniCharge account</p>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <app-input
              id="login-email"
              type="email"
              label="Email Address"
              formControlName="email"
              placeholder="you@omnicharge.com"
            ></app-input>

            <div>
              <app-input
                id="login-password"
                type="password"
                label="Password"
                formControlName="password"
                placeholder="Enter your password"
              ></app-input>
              <div class="text-right mt-1">
                <a routerLink="/auth/forgot-password" class="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  Forgot password?
                </a>
              </div>
            </div>

            <div *ngIf="error()" class="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p class="text-red-400 text-sm text-center">{{ error() }}</p>
            </div>

            <app-button type="submit" class="w-full" [disabled]="loginForm.invalid || isLoading()">
              {{ isLoading() ? 'Signing In...' : 'Sign In' }}
            </app-button>

            <div class="relative flex items-center py-3">
              <div class="flex-grow border-t border-gray-700"></div>
              <span class="flex-shrink-0 mx-4 text-gray-500 text-sm">Or</span>
              <div class="flex-grow border-t border-gray-700"></div>
            </div>

            <div id="google-btn-container" class="flex justify-center w-full min-h-[40px]"></div>

            <p class="text-center text-sm text-gray-400 mt-6">
              Don't have an account?
              <a routerLink="/auth/register" class="text-blue-400 hover:text-blue-300 ml-1 transition-colors">Sign up</a>
            </p>
          </form>
        </app-card>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private ngZone = inject(NgZone);

  isLoading = signal(false);
  error = signal<string | null>(null);
  private isGoogleInitialized = false;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
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
      document.getElementById('google-btn-container'),
      { 
        theme: 'filled_black', 
        size: 'large', 
        width: 350,
        shape: 'rectangular',
        text: 'signin_with',
        logo_alignment: 'center'
      }
    );
  }

  private handleGoogleResponse(response: any) {
    if (!response.credential) return;

    this.isLoading.set(true);
    this.error.set(null);

    this.authService.loginWithGoogle(response.credential).subscribe({
      next: (tokens) => {
        this.isLoading.set(false);
        if (tokens.role === 'ROLE_ADMIN') {
          this.router.navigateByUrl('/admin/dashboard');
        } else {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
          this.router.navigateByUrl(returnUrl);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(err?.error?.message || 'Google login failed. Please try again.');
      }
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.error.set(null);

    this.authService.login({
      email: this.loginForm.value.email!,
      password: this.loginForm.value.password!
    }).subscribe({
      next: (tokens) => {
        this.isLoading.set(false);
        
        // Role-based redirection
        if (tokens.role === 'ROLE_ADMIN') {
          this.router.navigateByUrl('/admin/dashboard');
        } else {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
          this.router.navigateByUrl(returnUrl);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const status = err?.status;
        if (status === 401 || status === 400) {
          this.error.set('Invalid email or password. Please try again.');
        } else if (status === 0) {
          this.error.set('Cannot connect to server. Please ensure the backend is running.');
        } else {
          this.error.set(err?.error?.message || 'Login failed. Please try again.');
        }
      }
    });
  }
}
