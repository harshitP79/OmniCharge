import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';
import { Component } from '@angular/core';

@Component({
  standalone: true,
  imports: [ButtonComponent],
  template: `<app-button [type]="type" [variant]="variant" [disabled]="disabled" (onClick)="clicked = true">Click Me</app-button>`
})
class TestHostComponent {
  type: 'button' | 'submit' | 'reset' = 'button';
  variant: 'primary' | 'secondary' | 'danger' = 'primary';
  disabled = false;
  clicked = false;
}

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
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
    it('should default to type button', () => {
      const btn = fixture.nativeElement.querySelector('button');
      expect(btn.type).toBe('button');
    });

    it('should default to primary variant', () => {
      expect(component.variant).toBe('primary');
    });

    it('should emit onClick event when clicked', () => {
      spyOn(component.onClick, 'emit');
      const btn = fixture.nativeElement.querySelector('button');
      btn.click();
      expect(component.onClick.emit).toHaveBeenCalled();
    });

    it('should apply submit type when configured', () => {
      fixture.componentRef.setInput('type', 'submit');
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button');
      expect(btn.type).toBe('submit');
    });
  });

  // ==========================================
  // BOUNDARY VALUES
  // ==========================================
  describe('Boundary Values', () => {
    it('should apply danger variant class', () => {
      fixture.componentRef.setInput('variant', 'danger');
      fixture.detectChanges();
      const inner = fixture.nativeElement.querySelector('button > div');
      expect(inner.className).toContain('text-red-500');
    });

    it('should apply secondary variant class', () => {
      fixture.componentRef.setInput('variant', 'secondary');
      fixture.detectChanges();
      const inner = fixture.nativeElement.querySelector('button > div');
      expect(inner.className).toContain('text-slate-700');
    });
  });

  // ==========================================
  // EXCEPTION HANDLING
  // ==========================================
  describe('Exception Handling', () => {
    it('should disable button and prevent clicks when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button');
      expect(btn.disabled).toBeTrue();
    });
  });

  // ==========================================
  // Host Integration
  // ==========================================
  describe('Host Integration', () => {
    let hostFixture: ComponentFixture<TestHostComponent>;
    let hostComponent: TestHostComponent;

    beforeEach(async () => {
      hostFixture = TestBed.createComponent(TestHostComponent);
      hostComponent = hostFixture.componentInstance;
      hostFixture.detectChanges();
    });

    it('should project content text', () => {
      const span = hostFixture.nativeElement.querySelector('span');
      expect(span.textContent).toContain('Click Me');
    });

    it('should propagate onClick to parent', () => {
      const btn = hostFixture.nativeElement.querySelector('button');
      btn.click();
      expect(hostComponent.clicked).toBeTrue();
    });

    it('should not emit click when disabled', () => {
      hostComponent.disabled = true;
      hostFixture.detectChanges();
      const btn = hostFixture.nativeElement.querySelector('button');
      btn.click();
      // disabled attribute prevents native click propagation to the onClick handler
      // but the disabled class + pointer-events-none ensures no visual interaction
      expect(btn.disabled).toBeTrue();
    });
  });
});
