import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="glass-card p-8 transition-all duration-300 hover:-translate-y-0.5">
      <ng-content></ng-content>
    </div>
  `
})
export class CardComponent {}
