import { Component, Input, forwardRef, ChangeDetectionStrategy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ],
  template: `
    <div class="flex flex-col space-y-2">
      <label *ngIf="label" [for]="id" class="px-1 text-[12px] font-semibold tracking-[0.02em] text-slate-600">{{ label }}</label>
      <div class="relative group">
        <input
          [id]="id"
          [type]="type"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [value]="value"
          (input)="onInput($event)"
          (blur)="onTouched()"
          class="w-full rounded-2xl border border-slate-300/80 bg-white text-slate-900 px-5 py-4 text-[15px] font-medium placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-700 transition-all duration-200 disabled:opacity-50"
        />
        <div class="absolute inset-0 rounded-2xl pointer-events-none border border-transparent group-hover:border-slate-300 transition-all"></div>
      </div>
      <span *ngIf="error" class="px-1 text-[12px] font-medium text-red-600">{{ error }}</span>
    </div>
  `
})
export class InputComponent implements ControlValueAccessor {
  @Input() id = Math.random().toString(36).substring(2, 9);
  @Input() label = '';
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() error = '';
  
  value = '';
  disabled = false;
  
  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: any): void {
    this.value = value || '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.value = val;
    this.onChange(val);
  }
}
