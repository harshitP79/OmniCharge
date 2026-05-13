import { Component, inject, signal, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationApiService } from '../../../core/services/notification-api.service';
import { NotificationResponse } from '../../../core/models/api.models';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Bell Button -->
    <button 
      (click)="togglePanel($event)"
      class="relative p-2.5 rounded-xl bg-white/60 hover:bg-white border border-slate-100 hover:border-slate-200 transition-all duration-200 hover:shadow-md group"
      aria-label="Notifications">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" 
           class="w-5 h-5 text-slate-500 group-hover:text-slate-700 transition-colors">
        <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
      
      <!-- Badge -->
      <span *ngIf="unreadCount() > 0" 
            class="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[9px] font-black rounded-full px-1 shadow-lg shadow-red-500/30 animate-pulse">
        {{ unreadCount() > 99 ? '99+' : unreadCount() }}
      </span>
    </button>

    <!-- Notification Panel -->
    <div *ngIf="isPanelOpen()" 
         class="absolute right-0 top-full mt-2 w-[360px] sm:w-[400px] max-h-[480px] bg-white rounded-2xl shadow-2xl border border-slate-100 z-[9999] overflow-hidden animate-modal-in">
      
      <!-- Panel Header -->
      <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
        <div>
          <h3 class="text-sm font-black text-slate-900 uppercase tracking-wider">Notifications</h3>
          <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            {{ unreadCount() }} unread alert{{ unreadCount() !== 1 ? 's' : '' }}
          </p>
        </div>
        <button *ngIf="notifications().length > 0" 
                (click)="markAllAsRead()" 
                class="text-[10px] font-black text-blue-500 hover:text-blue-700 uppercase tracking-wider transition-colors px-2 py-1 rounded-lg hover:bg-blue-50">
          Mark All Read
        </button>
      </div>

      <!-- Notification List -->
      <div class="overflow-y-auto max-h-[360px] custom-scrollbar">
        <!-- Empty State -->
        <div *ngIf="!isLoading() && notifications().length === 0" class="py-16 text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-50 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-slate-300">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </div>
          <p class="text-xs font-black text-slate-400 uppercase tracking-widest">No Notifications</p>
          <p class="text-[10px] text-slate-300 mt-1">You're all caught up</p>
        </div>

        <!-- Loading -->
        <div *ngIf="isLoading()" class="py-12 flex justify-center">
          <div class="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <!-- Items -->
        <div *ngFor="let n of notifications(); trackBy: trackById"
             (click)="markRead(n)"
             class="px-5 py-4 border-b border-slate-50 cursor-pointer transition-all duration-200 hover:bg-slate-50/80 group"
             [ngClass]="{'bg-blue-50': !n.isRead, 'border-l-2 border-l-blue-500': !n.isRead}">
          
          <div class="flex items-start gap-3">
            <!-- Category Icon -->
            <div class="shrink-0 mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center text-sm"
                 [ngClass]="getCategoryStyle(n.category)">
              {{ getCategoryIcon(n.category) }}
            </div>

            <div class="flex-grow min-w-0">
              <div class="flex items-center justify-between gap-2">
                <p class="text-xs font-black text-slate-900 truncate leading-tight">{{ n.subject }}</p>
                <span *ngIf="!n.isRead" class="shrink-0 w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></span>
              </div>
              <p class="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{{ n.message }}</p>
              <div class="flex items-center gap-2 mt-2">
                <span class="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                      [ngClass]="getCategoryBadgeStyle(n.category)">
                  {{ formatCategory(n.category) }}
                </span>
                <span class="text-[9px] text-slate-300 font-bold">{{ getTimeAgo(n.createdDate) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Load More -->
        <div *ngIf="hasMore()" class="p-3 text-center border-t border-slate-100">
          <button (click)="loadMore()" 
                  [disabled]="isLoadingMore()"
                  class="text-[10px] font-black text-blue-500 hover:text-blue-700 uppercase tracking-widest py-2 px-4 rounded-lg hover:bg-blue-50 transition-all">
            {{ isLoadingMore() ? 'Loading...' : 'Load More' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private api = inject(NotificationApiService);
  private elementRef = inject(ElementRef);

  isPanelOpen = signal(false);
  notifications = signal<NotificationResponse[]>([]);
  unreadCount = signal(0);
  isLoading = signal(false);
  isLoadingMore = signal(false);
  currentPage = signal(0);
  totalPages = signal(0);
  hasMore = signal(false);

  private pollingInterval: any;

  ngOnInit() {
    this.pollUnreadCount();
    this.pollingInterval = setInterval(() => this.pollUnreadCount(), 30000); // Every 30s
  }

  ngOnDestroy() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (this.isPanelOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.isPanelOpen.set(false);
    }
  }

  togglePanel(event: Event) {
    event.stopPropagation();
    if (!this.isPanelOpen()) {
      this.isPanelOpen.set(true);
      this.loadNotifications();
    } else {
      this.isPanelOpen.set(false);
    }
  }

  private pollUnreadCount() {
    this.api.getUnreadCount().subscribe({
      next: (count) => this.unreadCount.set(count),
      error: () => {} // Silently fail polling
    });
  }

  loadNotifications() {
    this.isLoading.set(true);
    this.currentPage.set(0);
    this.api.getNotifications(0, 15).subscribe({
      next: (page) => {
        this.notifications.set(page.content);
        this.totalPages.set(page.totalPages);
        this.hasMore.set(!page.last);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadMore() {
    const nextPage = this.currentPage() + 1;
    this.isLoadingMore.set(true);
    this.api.getNotifications(nextPage, 15).subscribe({
      next: (page) => {
        this.notifications.update(curr => [...curr, ...page.content]);
        this.currentPage.set(nextPage);
        this.hasMore.set(!page.last);
        this.isLoadingMore.set(false);
      },
      error: () => this.isLoadingMore.set(false)
    });
  }

  markRead(n: NotificationResponse) {
    if (n.isRead) return;
    this.api.markAsRead(n.id).subscribe({
      next: () => {
        this.notifications.update(list =>
          list.map(item => item.id === n.id ? { ...item, isRead: true } : item)
        );
        this.unreadCount.update(c => Math.max(0, c - 1));
      }
    });
  }

  markAllAsRead() {
    const unread = this.notifications().filter(n => !n.isRead);
    unread.forEach(n => {
      this.api.markAsRead(n.id).subscribe({
        next: () => {
          this.notifications.update(list =>
            list.map(item => item.id === n.id ? { ...item, isRead: true } : item)
          );
        }
      });
    });
    this.unreadCount.set(0);
  }

  trackById(_: number, item: NotificationResponse) {
    return item.id;
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'PAYMENT_SUCCESS': return '✅';
      case 'PAYMENT_FAILED': return '❌';
      case 'PLAN_EXPIRY_REMINDER': return '⏰';
      case 'PLAN_EXPIRED': return '📅';
      default: return '🔔';
    }
  }

  getCategoryStyle(category: string): Record<string, boolean> {
    return {
      'bg-green-50 border border-green-100': category === 'PAYMENT_SUCCESS',
      'bg-red-50 border border-red-100': category === 'PAYMENT_FAILED',
      'bg-amber-50 border border-amber-100': category === 'PLAN_EXPIRY_REMINDER',
      'bg-slate-100 border border-slate-200': category === 'PLAN_EXPIRED'
    };
  }

  getCategoryBadgeStyle(category: string): Record<string, boolean> {
    return {
      'bg-green-50 text-green-600': category === 'PAYMENT_SUCCESS',
      'bg-red-50 text-red-500': category === 'PAYMENT_FAILED',
      'bg-amber-50 text-amber-600': category === 'PLAN_EXPIRY_REMINDER',
      'bg-slate-100 text-slate-500': category === 'PLAN_EXPIRED'
    };
  }

  formatCategory(category: string): string {
    return category.replace(/_/g, ' ');
  }

  getTimeAgo(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
}
