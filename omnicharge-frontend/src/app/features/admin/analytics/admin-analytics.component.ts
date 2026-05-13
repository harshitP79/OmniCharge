import { Component, ChangeDetectionStrategy, OnInit, ElementRef, ViewChild, AfterViewInit, inject, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import Chart from 'chart.js/auto';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .glass-card {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 24px;
      padding: 24px;
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .glass-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.4);
    }
    
    .gradient-text {
      background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .fade-in-up {
      animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      opacity: 0;
      transform: translateY(20px);
    }
    
    .chart-container {
      position: relative;
      height: 350px;
      width: 100%;
    }

    @keyframes fadeInUp {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `],
  template: `
    <div class="p-6 lg:p-10 min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      <!-- Decorative Orbs -->
      <div class="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div class="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none"></div>

      <div class="relative z-10 max-w-7xl mx-auto space-y-8">
        
        <!-- Header Section -->
        <header class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 fade-in-up" style="animation-delay: 0.1s;">
          <div>
            <h1 class="text-4xl font-black tracking-tight text-white mb-2">Platform Analytics</h1>
            <p class="text-slate-400 font-medium text-lg">Real-time revenue & transaction insights.</p>
          </div>
          
          <div *ngIf="isLoading()" class="flex items-center gap-3 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50">
            <div class="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
            <span class="text-sm font-semibold text-slate-300">Syncing Data...</span>
          </div>
        </header>

        <ng-container *ngIf="!isLoading()">
          
          <!-- Key Metrics / Success Rate Card -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 fade-in-up" style="animation-delay: 0.2s;">
            
            <div class="glass-card relative overflow-hidden group">
              <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 19H11V17H13V19ZM15.07 11.25L14.17 12.17C13.45 12.9 13 13.5 13 15H11V14.5C11 13.4 11.45 12.4 12.17 11.67L13.41 10.41C13.78 10.05 14 9.55 14 9C14 7.9 13.1 7 12 7C10.9 7 10 7.9 10 9H8C8 6.79 9.79 5 12 5C14.21 5 16 6.79 16 9C16 9.88 15.64 10.68 15.07 11.25Z"/></svg>
              </div>
              <h3 class="text-slate-400 font-semibold mb-2 text-sm uppercase tracking-wider">Total Transactions</h3>
              <p class="text-4xl font-black text-white">{{ paymentStats()?.totalTransactions | number }}</p>
              <div class="mt-4 flex items-center gap-2">
                <span class="text-emerald-400 text-sm font-bold bg-emerald-400/10 px-2 py-1 rounded-md">Live</span>
                <span class="text-slate-500 text-sm">processed through system</span>
              </div>
            </div>

            <div class="glass-card flex flex-col justify-between">
              <div>
                <h3 class="text-slate-400 font-semibold mb-2 text-sm uppercase tracking-wider text-emerald-400">Success Rate</h3>
                <div class="flex items-end gap-3 border-b border-white/5 pb-4">
                  <span class="text-5xl font-black text-white">{{ successRate() | number:'1.0-1' }}%</span>
                </div>
              </div>
              <div class="mt-4">
                <div class="w-full bg-slate-800 rounded-full h-2 mb-2">
                  <div class="bg-emerald-500 h-2 rounded-full" [style.width.%]="successRate()"></div>
                </div>
                <p class="text-slate-400 text-sm">{{ paymentStats()?.successfulTransactions | number }} successful requests</p>
              </div>
            </div>

            <div class="glass-card flex flex-col justify-between">
              <div>
                <h3 class="text-slate-400 font-semibold mb-2 text-sm uppercase tracking-wider text-rose-400">Failure Rate</h3>
                <div class="flex items-end gap-3 border-b border-white/5 pb-4">
                  <span class="text-5xl font-black text-white">{{ failedRate() | number:'1.0-1' }}%</span>
                </div>
              </div>
              <div class="mt-4">
                <div class="w-full bg-slate-800 rounded-full h-2 mb-2">
                  <div class="bg-rose-500 h-2 rounded-full" [style.width.%]="failedRate()"></div>
                </div>
                <p class="text-slate-400 text-sm">{{ paymentStats()?.failedTransactions | number }} failed requests</p>
              </div>
            </div>

          </div>

          <!-- Charts Section -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in-up" style="animation-delay: 0.3s;">
            <!-- Main Revenue Chart -->
            <div class="glass-card lg:col-span-2">
              <h3 class="text-lg font-bold text-white mb-6 flex items-center gap-3">
                <span class="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                </span>
                Revenue Growth Timeline
              </h3>
              <div class="chart-container">
                <canvas #revenueChart></canvas>
              </div>
            </div>

            <!-- Distribution Pie Chart -->
            <div class="glass-card">
              <h3 class="text-lg font-bold text-white mb-6 flex items-center gap-3">
                <span class="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>
                </span>
                Transaction Status
              </h3>
              <div class="chart-container flex items-center justify-center">
                <canvas #distributionChart></canvas>
              </div>
            </div>
          </div>

          <!-- Operator Performance Section -->
          <div class="grid grid-cols-1 lg:grid-cols-1 gap-6 fade-in-up mt-6" style="animation-delay: 0.4s;">
            <div class="glass-card">
              <h3 class="text-lg font-bold text-white mb-6 flex items-center gap-3">
                <span class="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                </span>
                Operator Utilization (Top 5)
              </h3>
              <div class="chart-container" style="height: 300px;">
                <div *ngIf="aggregatedStats()?.operators?.length === 0" class="flex items-center justify-center h-full text-slate-500 font-bold uppercase tracking-widest text-sm">
                   No recent data found
                </div>
                <canvas #operatorChart [hidden]="aggregatedStats()?.operators?.length === 0"></canvas>
              </div>
            </div>
          </div>

        </ng-container>
      </div>
    </div>
  `
})
export class AdminAnalyticsComponent implements OnInit, AfterViewInit {
  private adminApi = inject(AdminApiService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('revenueChart') revenueChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('distributionChart') distributionChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('operatorChart') operatorChartRef!: ElementRef<HTMLCanvasElement>;

  isLoading = signal(true);
  paymentStats = signal<any>(null);
  rechargeStats = signal<any>(null);
  aggregatedStats = signal<any>(null);

  successRate = signal<number>(0);
  failedRate = signal<number>(0);

  private revChartInstance: Chart | null = null;
  private distChartInstance: Chart | null = null;
  private opChartInstance: Chart | null = null;

  ngOnInit() {
    this.fetchAnalytics();
  }

  ngAfterViewInit() {
    // Wait until loading is done so canvas elements exist in the DOM
  }

  private fetchAnalytics() {
    forkJoin({
      payments: this.adminApi.getPaymentStats(),
      recharges: this.adminApi.getStats(),
      performance: this.adminApi.getAggregatedPerformanceStats(500)
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (data) => {
        this.paymentStats.set(data.payments);
        this.rechargeStats.set(data.recharges);
        this.aggregatedStats.set(data.performance);
        
        const stats = data.payments;
        const total = stats.totalTransactions || 1; // Prevent div by zero
        this.successRate.set((stats.successfulTransactions / total) * 100);
        this.failedRate.set((stats.failedTransactions / total) * 100);

        this.isLoading.set(false);
        
        // Wait a macro-tick for *ngIf to render canvas
        setTimeout(() => this.initializeCharts(stats, data.performance), 50);
      },
      error: (err) => {
        console.error('Failed to load analytics', err);
        this.isLoading.set(false);
      }
    });
  }

  private initializeCharts(stats: any, perfStats: any) {
    if (!this.revenueChartRef || !this.distributionChartRef) return;

    // Destroy existing instances if any
    if (this.revChartInstance) this.revChartInstance.destroy();
    if (this.distChartInstance) this.distChartInstance.destroy();
    if (this.opChartInstance) this.opChartInstance.destroy();

    // Setup global defaults for charts to match premium glassmorphism
    Chart.defaults.color = 'rgba(148, 163, 184, 0.8)';
    Chart.defaults.font.family = "'Inter', 'Roboto', sans-serif";

    // Prepare Revenue Chart Data
    const revData = stats.revenueByDate || [];
    const labels = revData.map((d: any) => d.date);
    const amounts = revData.map((d: any) => d.revenue);

    const ctxRev = this.revenueChartRef.nativeElement.getContext('2d');
    if (ctxRev) {
      // Create a majestic blue gradient for the line chart background fill
      const gradient = ctxRev.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)'); // Blue 500
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

      this.revChartInstance = new Chart(ctxRev, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Daily Revenue (₹)',
            data: amounts,
            borderColor: '#3b82f6', // Blue 500
            backgroundColor: gradient,
            borderWidth: 3,
            fill: true,
            tension: 0.4, // Smooth curve
            pointBackgroundColor: '#1e293b', // Slate 800
            pointBorderColor: '#60a5fa', // Blue 400
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              titleFont: { size: 14, weight: 'bold' },
              padding: 12,
              cornerRadius: 8,
              displayColors: false,
              callbacks: {
                label: (context: any) => '₹ ' + context.parsed.y.toLocaleString()
              }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { maxTicksLimit: 7 }
            },
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              border: { dash: [5, 5] },
              ticks: {
                callback: (value) => '₹' + value
              }
            }
          }
        }
      });
    }

    // Prepare Distribution Chart Data
    const ctxDist = this.distributionChartRef.nativeElement.getContext('2d');
    if (ctxDist) {
      this.distChartInstance = new Chart(ctxDist, {
        type: 'doughnut',
        data: {
          labels: ['Successful', 'Failed', 'Pending'],
          datasets: [{
            data: [stats.successfulTransactions, stats.failedTransactions, stats.pendingTransactions],
            backgroundColor: [
              '#10b981', // Emerald 500
              '#f43f5e', // Rose 500
              '#f59e0b', // Amber 500
            ],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '75%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              padding: 12,
              cornerRadius: 8
            }
          }
        }
      });
    }

    // Prepare Operator Bar Chart Data (Top 5)
    if (this.operatorChartRef && perfStats?.operators?.length > 0) {
      const ctxOp = this.operatorChartRef.nativeElement.getContext('2d');
      if (ctxOp) {
        const top5 = perfStats.operators.slice(0, 5);
        this.opChartInstance = new Chart(ctxOp, {
          type: 'bar',
          data: {
            labels: top5.map((o: any) => o.originalName),
            datasets: [{
              label: 'Transaction Volume',
              data: top5.map((o: any) => o.count),
              backgroundColor: '#10b981', // Emerald 500
              borderRadius: 6,
              barThickness: 40
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                padding: 12,
                cornerRadius: 8
              }
            },
            scales: {
              x: { grid: { display: false } },
              y: { 
                beginAtZero: true, 
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                border: { dash: [5, 5] }
              }
            }
          }
        });
      }
    }
  }
}
