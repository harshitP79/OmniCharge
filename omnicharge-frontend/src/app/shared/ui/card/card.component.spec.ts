import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardComponent } from './card.component';
import { Component } from '@angular/core';

@Component({
  standalone: true,
  imports: [CardComponent],
  template: `<app-card><p class="test-content">Projected Content</p></app-card>`
})
class TestHostComponent {}

describe('CardComponent', () => {
  let component: CardComponent;
  let fixture: ComponentFixture<CardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CardComponent);
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
    it('should render the glass-card wrapper div', () => {
      const card = fixture.nativeElement.querySelector('.glass-card');
      expect(card).toBeTruthy();
    });

    it('should have transition and hover classes', () => {
      const card = fixture.nativeElement.querySelector('.glass-card');
      expect(card.className).toContain('transition-all');
    });
  });

  // ==========================================
  // BOUNDARY VALUES — Content Projection
  // ==========================================
  describe('Content Projection', () => {
    let hostFixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
      hostFixture = TestBed.createComponent(TestHostComponent);
      hostFixture.detectChanges();
    });

    it('should project child content inside the card', () => {
      const projected = hostFixture.nativeElement.querySelector('.test-content');
      expect(projected).toBeTruthy();
      expect(projected.textContent).toContain('Projected Content');
    });
  });

  // ==========================================
  // EXCEPTION HANDLING — Empty Content
  // ==========================================
  describe('Exception Handling', () => {
    it('should render correctly even with no projected content', () => {
      const card = fixture.nativeElement.querySelector('.glass-card');
      expect(card).toBeTruthy();
      expect(card.children.length).toBe(0);
    });
  });
});
