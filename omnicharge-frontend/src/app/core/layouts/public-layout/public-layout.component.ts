import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopbarComponent } from '../../components/topbar/topbar.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, TopbarComponent],
  template: `
    <div class="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
      <div class="cosmic-orb w-[420px] h-[420px] top-[-12%] left-[-6%] bg-blue-400/70"></div>
      <div class="cosmic-orb w-[320px] h-[320px] bottom-[8%] right-[-5%] bg-sky-300/70"></div>
      <div class="star top-[12%] left-[18%]"></div>
      <div class="star top-[34%] left-[78%] animation-delay-1000"></div>
      <div class="star top-[74%] left-[38%] animation-delay-2000"></div>
    </div>
    <app-topbar></app-topbar>
    <main class="min-h-screen pt-16">
      <router-outlet></router-outlet>
    </main>
  `
})
export class PublicLayoutComponent {}
