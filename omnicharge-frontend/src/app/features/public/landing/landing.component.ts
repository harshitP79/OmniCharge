import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RechargeInputComponent } from '../../recharge/recharge-input/recharge-input.component';

type QuickFeature = {
  title: string;
  description: string;
  accentClass: string;
};

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RechargeInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
    }

    .intro-orb {
      animation: intro-drift 10s ease-in-out infinite alternate;
    }

    .feature-card {
      animation: feature-rise 0.7s ease forwards;
      opacity: 0;
      transform: translateY(16px);
    }

    .feature-card:nth-child(2) {
      animation-delay: 0.12s;
    }

    .feature-card:nth-child(3) {
      animation-delay: 0.24s;
    }

    .hero-agent-frame {
      position: relative;
      width: min(100%, 28rem);
      min-height: 24rem;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2.25rem;
      border-radius: 2.5rem;
      overflow: hidden;
      background:
        linear-gradient(155deg, rgba(255, 255, 255, 0.92), rgba(240, 247, 255, 0.55)),
        radial-gradient(circle at 50% 30%, rgba(125, 211, 252, 0.2), transparent 58%);
      border: 1px solid rgba(255, 255, 255, 0.7);
      box-shadow:
        0 24px 80px rgba(15, 23, 42, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(24px);
      transform: rotateY(-7deg) rotateX(5deg);
    }

    .hero-agent-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(96, 165, 250, 0.12) 1px, transparent 1px),
        linear-gradient(90deg, rgba(96, 165, 250, 0.12) 1px, transparent 1px);
      background-size: 2.75rem 2.75rem;
      mask-image: linear-gradient(180deg, rgba(15, 23, 42, 0.5), transparent 90%);
      opacity: 0.6;
    }

    .hero-agent-beam {
      position: absolute;
      width: 13rem;
      height: 13rem;
      border-radius: 999px;
      filter: blur(48px);
      opacity: 0.45;
    }

    .hero-agent-beam-top {
      top: -3rem;
      right: -2rem;
      background: rgba(59, 130, 246, 0.32);
    }

    .hero-agent-beam-bottom {
      bottom: -4rem;
      left: -2rem;
      background: rgba(34, 211, 238, 0.28);
    }

    .hero-kpi {
      border-radius: 1.4rem;
      border: 1px solid rgba(255, 255, 255, 0.8);
      background: rgba(255, 255, 255, 0.72);
      backdrop-filter: blur(18px);
      box-shadow: 0 14px 30px rgba(15, 23, 42, 0.06);
    }

    @keyframes intro-drift {
      from {
        transform: translate3d(-10px, -8px, 0) scale(1);
      }
      to {
        transform: translate3d(10px, 8px, 0) scale(1.06);
      }
    }

    @keyframes feature-rise {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `],
  template: `
    <div *ngIf="showIntro(); else rechargeView" class="relative min-h-[calc(100vh-4rem)] overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
      <div class="intro-orb absolute left-[-6rem] top-8 h-56 w-56 rounded-full bg-blue-400/20 blur-3xl pointer-events-none"></div>
      <div class="intro-orb absolute bottom-[-3rem] right-[-4rem] h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl pointer-events-none"></div>

      <div class="mx-auto flex min-h-[calc(100vh-8rem)] max-w-5xl flex-col items-center justify-center">
        <div class="rounded-full border border-white/70 bg-white/80 px-5 py-2 text-[11px] font-black uppercase tracking-[0.35em] text-slate-500 shadow-lg shadow-slate-200/50 backdrop-blur z-10">
          Quick Recharge Highlights
        </div>

        <div class="flex flex-col md:flex-row items-center justify-between gap-12 w-full mt-8">
          <div class="flex-1 text-center md:text-left z-10">
            <h1 class="max-w-4xl text-4xl font-black tracking-[-0.05em] text-slate-950 sm:text-6xl">
              Fast recharge, simple plans, and a smooth checkout.
            </h1>
            <p class="mt-5 max-w-2xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
              We will take you to the recharge screen automatically in {{ countdown() }} second{{ countdown() === 1 ? '' : 's' }}.
            </p>
          </div>

          <div class="hidden md:flex flex-1 items-center justify-center">
            <div class="hero-agent-frame">
              <div class="hero-agent-grid"></div>
              <div class="hero-agent-beam hero-agent-beam-top"></div>
              <div class="hero-agent-beam hero-agent-beam-bottom"></div>

              <div class="relative z-10 w-full max-w-[20rem]">
                <p class="text-[11px] font-black uppercase tracking-[0.38em] text-blue-500">Recharge Flow</p>
                <h2 class="mt-5 text-3xl font-black tracking-tight text-slate-950">
                  Faster input, instant operator detection, and a cleaner checkout path.
                </h2>
                <div class="mt-8 grid gap-4">
                  <div class="hero-kpi px-5 py-4">
                    <p class="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Detection</p>
                    <p class="mt-2 text-sm font-semibold text-slate-600">Operator lookup begins as soon as the mobile number is valid.</p>
                  </div>
                  <div class="hero-kpi px-5 py-4">
                    <p class="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Plans</p>
                    <p class="mt-2 text-sm font-semibold text-slate-600">Users move directly into matching recharge plans without extra friction.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-10 grid w-full gap-4 md:grid-cols-3">
          <div *ngFor="let feature of quickFeatures" class="feature-card rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur">
            <div class="h-1.5 w-14 rounded-full bg-gradient-to-r" [ngClass]="feature.accentClass"></div>
            <h2 class="mt-5 text-2xl font-black tracking-tight text-slate-950">{{ feature.title }}</h2>
            <p class="mt-3 text-sm font-medium leading-7 text-slate-500">{{ feature.description }}</p>
          </div>
        </div>

        <button
          type="button"
          (click)="skipIntro()"
          class="mt-10 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black uppercase tracking-[0.25em] text-white shadow-xl shadow-slate-900/10 transition duration-300 hover:-translate-y-0.5 hover:bg-slate-800"
        >
          Recharge Now
        </button>
      </div>
    </div>

    <ng-template #rechargeView>
      <app-recharge-input></app-recharge-input>
    </ng-template>
  `
})
export class LandingComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly showIntro = signal(true);
  readonly countdown = signal(5);

  readonly quickFeatures: QuickFeature[] = [
    {
      title: 'Instant Detection',
      description: 'Enter your number and we quickly identify the operator for you.',
      accentClass: 'from-cyan-400 to-blue-500'
    },
    {
      title: 'Quick Plans',
      description: 'Move straight to the matching recharge plans without extra steps.',
      accentClass: 'from-emerald-400 to-teal-500'
    },
    {
      title: 'Secure Payment',
      description: 'Recharge with a simple and protected checkout experience.',
      accentClass: 'from-amber-400 to-orange-500'
    }
  ];

  constructor() {
    const intervalId = window.setInterval(() => {
      if (!this.showIntro()) {
        window.clearInterval(intervalId);
        return;
      }

      const next = this.countdown() - 1;
      this.countdown.set(next);

      if (next <= 0) {
        this.skipIntro();
      }
    }, 1000);

    this.destroyRef.onDestroy(() => window.clearInterval(intervalId));
  }

  skipIntro() {
    this.showIntro.set(false);
  }
}
