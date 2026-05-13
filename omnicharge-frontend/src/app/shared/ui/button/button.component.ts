import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type"
      [disabled]="disabled"
      (click)="onClick.emit($event)"
      class="w-full relative group transition-all duration-500 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
    >
      <div 
        [ngClass]="[
          'relative isolate overflow-hidden px-6 py-3.5 rounded-full text-[11px] font-black uppercase tracking-[0.24em] transition-all duration-500 border hover:shadow-xl',
          variant === 'primary' ? 'bg-white text-blue-600 border-blue-100 shadow-[0_14px_30px_rgba(37,99,235,0.12)] hover:text-white hover:shadow-blue-500/20' : '',
          variant === 'secondary' ? 'bg-white text-slate-700 border-slate-200 shadow-[0_12px_24px_rgba(15,23,42,0.06)] hover:text-slate-900 hover:shadow-slate-300/30' : '',
          variant === 'danger' ? 'bg-white text-red-500 border-red-100 shadow-[0_14px_30px_rgba(239,68,68,0.12)] hover:text-white hover:shadow-red-500/20' : ''
        ]"
      >
        <div
          [ngClass]="[
            'absolute inset-0 translate-y-full transition-transform duration-500',
            variant === 'primary' ? 'bg-blue-600 group-hover:translate-y-0' : '',
            variant === 'secondary' ? 'bg-slate-100 group-hover:translate-y-0' : '',
            variant === 'danger' ? 'bg-red-500 group-hover:translate-y-0' : ''
          ]"
        ></div>
        <span class="relative z-10 flex items-center justify-center gap-2 text-inherit">
          <ng-content></ng-content>
        </span>
      </div>
      <div class="absolute inset-0 rounded-full border border-white/10 pointer-events-none opacity-50"></div>
    </button>
  `
})
export class ButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() variant: 'primary' | 'secondary' | 'danger' = 'primary';
  @Input() disabled = false;
  @Output() onClick = new EventEmitter<Event>();
}
