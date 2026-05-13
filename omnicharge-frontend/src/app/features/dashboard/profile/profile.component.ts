import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserApiService } from '../../../core/services/user-api.service';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { InputComponent } from '../../../shared/ui/input/input.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardComponent, InputComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-12 py-8 relative">
      <div class="max-w-xl relative z-10">
        <div class="mb-12 bg-white/20 p-8 rounded-[32px] glass-panel border-none shadow-sm">
          <h2 class="text-4xl font-black text-slate-900 tracking-tighter italic">Profile</h2>
          <p class="text-slate-500 font-bold text-[11px] uppercase tracking-[0.3em] mt-3 opacity-60">Update your personal details</p>
        </div>

        <app-card class="glass-card border-none bg-white/40 shadow-2xl p-0 overflow-hidden rounded-[48px]">
          <div class="bg-gradient-to-br from-blue-50 to-blue-100/50 p-10 flex items-center gap-10 border-b border-white/50">
            <div class="relative group">
              <div class="absolute inset-0 bg-blue-600 blur-[30px] opacity-20 rounded-full group-hover:opacity-40 transition-all duration-700"></div>
              <div class="relative w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-2xl overflow-hidden transition-transform duration-700 group-hover:scale-105">
                <span class="text-blue-600 font-black text-4xl italic">{{ profileForm.get('fullName')?.value?.charAt(0) || 'U' }}</span>
              </div>
            </div>
            <div>
              <p class="text-slate-900 font-black text-3xl tracking-tighter italic leading-none">{{ profileForm.get('fullName')?.value }}</p>
              <div class="flex items-center gap-3 mt-4">
                <span class="px-4 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100 shadow-sm">{{ profileForm.get('email')?.value }}</span>
              </div>
            </div>
          </div>

          <div class="p-10">
            <div *ngIf="isLoading()" class="flex flex-col items-center justify-center py-20">
              <div class="w-12 h-12 border-4 border-blue-600 border-t-white rounded-full animate-[spin_1s_ease-in-out_infinite] shadow-xl shadow-blue-500/20 mb-6"></div>
              <p class="text-slate-400 font-black uppercase tracking-[0.4em] text-[10px]">Loading profile...</p>
            </div>

            <form *ngIf="!isLoading()" [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="space-y-8">
              <div class="space-y-2">
                <app-input
                  id="fullName"
                  label="Full Name"
                  formControlName="fullName"
                  placeholder="e.g. Harshit Panwar"
                ></app-input>
              </div>

              <div class="space-y-2">
                <app-input
                  id="email"
                  type="email"
                  label="Email Address"
                  formControlName="email"
                  class="opacity-70"
                ></app-input>
              </div>
              
              <div class="space-y-2">
                <app-input
                  id="mobileNumber"
                  type="tel"
                  label="Mobile Number"
                  formControlName="mobileNumber"
                  placeholder="e.g. 9876543210"
                ></app-input>
              </div>

              <div *ngIf="message()" class="bg-green-50/50 border border-green-100 rounded-[20px] p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <p class="text-green-600 text-[11px] font-black uppercase tracking-widest text-center">{{ message() }}</p>
              </div>
              <div *ngIf="error()" class="bg-red-50/50 border border-red-100 rounded-[20px] p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <p class="text-red-500 text-[11px] font-black uppercase tracking-widest text-center">{{ error() }}</p>
              </div>

              <div class="pt-8 border-t border-slate-100/50">
                <app-button type="submit" class="w-full h-18" [disabled]="profileForm.invalid || isSaving()">
                   <div class="flex items-center justify-center gap-4">
                      <span *ngIf="isSaving()" class="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
                      {{ isSaving() ? 'SAVING...' : 'SAVE CHANGES' }}
                   </div>
                </app-button>
              </div>
            </form>
          </div>
        </app-card>

        <div class="flex items-center justify-center gap-6 mt-12 bg-white/20 py-4 px-8 rounded-full border border-white/50 w-fit mx-auto shadow-sm">
           <span class="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Created {{ signupDate() | date:'mediumDate' }}</span>
           <div class="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
           <span class="text-blue-600 font-black text-[10px] uppercase tracking-[0.2em]">{{ authProvider() }} sign-in</span>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(UserApiService);

  isLoading = signal(true);
  isSaving = signal(false);
  message = signal<string | null>(null);
  error = signal<string | null>(null);
  
  signupDate = signal<string | null>(null);
  authProvider = signal<string | null>(null);

  profileForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: [{value: '', disabled: true}],
    mobileNumber: ['', [Validators.required, Validators.pattern('^[6-9]\\d{9}$')]]
  });

  ngOnInit() {
    this.api.getProfile().subscribe({
      next: (user) => {
        this.profileForm.patchValue({
          fullName: user.fullName,
          email: user.email,
          mobileNumber: user.mobileNumber
        });
        this.signupDate.set(user.createdDate);
        this.authProvider.set(user.authProvider);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to load profile.');
        this.isLoading.set(false);
      }
    });
  }

  onSubmit() {
    if (this.profileForm.invalid) return;

    this.isSaving.set(true);
    this.message.set(null);
    this.error.set(null);

    this.api.updateProfile({
      fullName: this.profileForm.value.fullName!,
      mobileNumber: this.profileForm.value.mobileNumber || undefined
    }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.message.set('Profile updated successfully!');
      },
      error: (err) => {
        this.isSaving.set(false);
        this.error.set(err?.error?.message || 'Failed to update profile.');
      }
    });
  }
}
