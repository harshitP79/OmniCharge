import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { UserProfile } from '../../../core/models/api.models';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, CardComponent, ButtonComponent, FormsModule],
  template: `
    <div class="space-y-8">
      <div class="flex justify-between items-end">
        <div>
          <h1 class="text-3xl font-black text-slate-900 tracking-widest uppercase">User Core</h1>
          <p class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">Manage customer accounts</p>
        </div>
        
        <div class="relative w-full md:w-64">
           <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              placeholder="Search name / email..." 
              class="w-full bg-white border border-slate-200 text-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold focus:outline-none focus:border-purple-500 transition-all shadow-inner">
           <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">🔍</span>
        </div>
      </div>

      <app-card class="border-slate-200 p-0 overflow-hidden shadow-2xl glass-panel">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200/60 bg-transparent">
                <th class="px-6 py-4">User Details</th>
                <th class="px-6 py-4">Role</th>
                <th class="px-6 py-4 text-center">Status</th>
                <th class="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100/50 text-sm">
              <tr *ngFor="let user of filteredUsers()" class="group hover:bg-slate-50/50 transition-all duration-300">
                <td class="px-6 py-5">
                   <div class="flex items-center gap-4">
                      <div class="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-xl shadow-purple-600/10 transition-transform group-hover:scale-110">
                         {{ user.fullName.charAt(0) }}
                      </div>
                      <div>
                         <p class="text-slate-900 font-bold tracking-tight leading-none text-sm">{{ user.fullName }}</p>
                         <p class="text-[10px] text-slate-500 font-medium mt-1">{{ user.email }}</p>
                      </div>
                   </div>
                </td>
                <td class="px-6 py-5">
                   <span class="px-3 py-1.5 rounded-full text-[9px] font-bold tracking-widest border shadow-sm uppercase"
                    [ngClass]="user.role === 'ROLE_ADMIN' ? 'bg-purple-500/10 text-purple-600 border-purple-500/30' : 'bg-slate-50 text-slate-500 border-slate-200/60'">
                    {{ user.role }}
                   </span>
                </td>
                <td class="px-6 py-5">
                   <div class="flex items-center justify-center gap-2">
                       <span class="w-2 h-2 rounded-full" [ngClass]="user.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'"></span>
                       <span class="text-[9px] font-bold uppercase tracking-widest" [ngClass]="user.isActive ? 'text-green-500' : 'text-red-500'">
                          {{ user.isActive ? 'Verified' : 'Locked' }}
                       </span>
                   </div>
                </td>
                <td class="px-6 py-5 text-right">
                   <button 
                      *ngIf="user.role !== 'ROLE_ADMIN'"
                      (click)="toggleUserStatus(user)"
                      class="text-[9px] font-bold uppercase tracking-widest transition-colors py-2 px-4 rounded-full border hover:bg-slate-50"
                      [ngClass]="user.isActive ? 'text-red-500 border-transparent hover:border-red-100 hover:text-red-600 hover:bg-red-50' : 'text-blue-500 border-transparent hover:border-blue-100 hover:text-blue-600 hover:bg-blue-50'">
                      {{ user.isActive ? 'Disable' : 'Enable' }}
                   </button>
                   <span *ngIf="user.role === 'ROLE_ADMIN'" class="text-[9px] font-bold uppercase tracking-widest text-slate-300">Protected</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="bg-slate-50/50 px-4 md:px-8 py-5 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em]">
           <div class="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center">
              <span class="text-slate-500">Total Users</span>
              <span class="bg-slate-200 text-slate-600 px-3 py-1 rounded-md">Records: {{ totalElements() }}</span>
           </div>
           
           <div class="flex gap-4 w-full md:w-auto justify-center">
              <app-button variant="secondary" [disabled]="currentPage() === 0" (onClick)="prevPage()" class="flex-1 md:flex-none py-2.5 px-6 font-black tracking-widest text-[9px] shadow-sm">Prev</app-button>
              <app-button variant="secondary" [disabled]="currentPage() >= (totalPages() - 1)" (onClick)="nextPage()" class="flex-1 md:flex-none py-2.5 px-6 font-black tracking-widest text-[9px] shadow-sm">Next</app-button>
           </div>
        </div>
        
        <div *ngIf="isLoading()" class="flex flex-col items-center justify-center py-20 bg-white/50">
          <div class="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(168,85,247,0.2)]"></div>
          <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4">Authorized Query in Progress</p>
        </div>

        <div *ngIf="!isLoading() && users().length === 0" class="py-32 text-center text-gray-500 flex flex-col items-center gap-4">
           <div class="w-12 h-12 rounded-full border-2 border-gray-800 flex items-center justify-center opacity-30">
              <span class="text-2xl">⚠</span>
           </div>
            <p class="font-black uppercase tracking-[0.3em] text-[10px]">No users found</p>
        </div>
      </app-card>
    </div>
  `
})
export class AdminUsersComponent implements OnInit {
  private api = inject(AdminApiService);
  users = signal<UserProfile[]>([]);
  isLoading = signal(true);
  searchQuery = '';
  currentPage = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  pageSize = 15;

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading.set(true);
    this.api.getUsers(this.currentPage(), this.pageSize).subscribe({
      next: (page) => {
        // Debugging the data structure from backend
        console.log('Admin Registry Query Result:', page);
        
        this.users.set(page.content || []);
        this.totalPages.set(page.totalPages || 0);
        this.totalElements.set(page.totalElements || 0);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Core Registry Query Failure:', err);
        this.isLoading.set(false);
      }
    });
  }

  filteredUsers() {
    if (!this.searchQuery) return this.users();
    const query = this.searchQuery.toLowerCase();
    return this.users().filter(u => 
      u.fullName.toLowerCase().includes(query) || 
      u.email.toLowerCase().includes(query)
    );
  }

  nextPage() {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update(p => p + 1);
      this.loadUsers();
    }
  }

  prevPage() {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
      this.loadUsers();
    }
  }

  toggleUserStatus(user: UserProfile) {
    const newStatus = !user.isActive;
    this.api.toggleUserStatus(user.id, newStatus).subscribe({
      next: () => {
         this.users.set(this.users().map(u => u.id === user.id ? { ...u, isActive: newStatus } : u));
      }
    });
  }
}
