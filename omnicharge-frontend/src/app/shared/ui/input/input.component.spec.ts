import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputComponent } from './input.component';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { ChangeDetectorRef } from '@angular/core';

// Host component to test ControlValueAccessor integration
@Component({
  standalone: true,
  imports: [InputComponent, ReactiveFormsModule],
  template: `<app-input [formControl]="ctrl" label="Test" id="test-input"></app-input>`
})
class TestHostComponent {
  ctrl = new FormControl('');
}

describe('InputComponent', () => {
  let component: InputComponent;
  let fixture: ComponentFixture<InputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(InputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ==========================================
  // NORMAL WORKING
  // ==========================================
  describe('Normal Working', () => {
    it('should render label when provided', () => {
      fixture.componentRef.setInput('label', 'Email Address');
      fixture.detectChanges();
      const label = fixture.nativeElement.querySelector('label');
      expect(label.textContent).toContain('Email Address');
    });

    it('should render input with correct type', () => {
      fixture.componentRef.setInput('type', 'password');
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('input');
      expect(input.type).toBe('password');
    });

    it('should render placeholder text', () => {
      fixture.componentRef.setInput('placeholder', 'Enter email');
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('input');
      expect(input.placeholder).toBe('Enter email');
    });

    it('should emit value changes via ControlValueAccessor', () => {
      const spy = jasmine.createSpy('onChange');
      component.registerOnChange(spy);

      const input = fixture.nativeElement.querySelector('input');
      input.value = 'hello@test.com';
      input.dispatchEvent(new Event('input'));

      expect(spy).toHaveBeenCalledWith('hello@test.com');
      expect(component.value).toBe('hello@test.com');
    });

    it('should call onTouched on blur', () => {
      const spy = jasmine.createSpy('onTouched');
      component.registerOnTouched(spy);

      const input = fixture.nativeElement.querySelector('input');
      input.dispatchEvent(new Event('blur'));

      expect(spy).toHaveBeenCalled();
    });

    it('should write value programmatically', () => {
      component.writeValue('preset-value');
      expect(component.value).toBe('preset-value');
    });
  });

  // ==========================================
  // BOUNDARY VALUES
  // ==========================================
  describe('Boundary Values', () => {
    it('should handle writeValue with null gracefully', () => {
      component.writeValue(null);
      expect(component.value).toBe('');
    });

    it('should handle writeValue with undefined gracefully', () => {
      component.writeValue(undefined);
      expect(component.value).toBe('');
    });

    it('should not render label when label is empty string', () => {
      fixture.componentRef.setInput('label', '');
      fixture.detectChanges();
      const label = fixture.nativeElement.querySelector('label');
      expect(label).toBeNull();
    });

    it('should display error message when error input is provided', () => {
      fixture.componentRef.setInput('error', 'Field is required');
      fixture.detectChanges();
      const errorEl = fixture.nativeElement.querySelector('span');
      expect(errorEl.textContent).toContain('Field is required');
    });
  });

  // ==========================================
  // EXCEPTION HANDLING
  // ==========================================
  describe('Exception Handling', () => {
    it('should disable input when setDisabledState is called with true', () => {
      component.setDisabledState(true);
      const cdr = fixture.debugElement.injector.get(ChangeDetectorRef);
      cdr.markForCheck();
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('input');
      expect(input.disabled).toBeTrue();
      expect(component.disabled).toBeTrue();
    });

    it('should re-enable input when setDisabledState is called with false', () => {
      component.setDisabledState(true);
      component.setDisabledState(false);
      const cdr = fixture.debugElement.injector.get(ChangeDetectorRef);
      cdr.markForCheck();
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('input');
      expect(input.disabled).toBeFalse();
    });
  });

  // ==========================================
  // Integration with FormControl
  // ==========================================
  describe('FormControl Integration', () => {
    let hostFixture: ComponentFixture<TestHostComponent>;
    let hostComponent: TestHostComponent;

    beforeEach(async () => {
      hostFixture = TestBed.createComponent(TestHostComponent);
      hostComponent = hostFixture.componentInstance;
      hostFixture.detectChanges();
    });

    it('should sync FormControl value to input', () => {
      hostComponent.ctrl.setValue('synced-value');
      hostFixture.detectChanges();
      const inputComp = hostFixture.debugElement.children[0].componentInstance as InputComponent;
      expect(inputComp.value).toBe('synced-value');
    });
  });
});
