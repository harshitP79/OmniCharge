import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MascotComponent, MascotState } from './mascot.component';
import { SimpleChange } from '@angular/core';

describe('MascotComponent', () => {
  let component: MascotComponent;
  let fixture: ComponentFixture<MascotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MascotComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MascotComponent);
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
    it('should default to idle state', () => {
      expect(component.state).toBe('idle');
      expect(component.internalState).toBe('idle');
    });

    it('should default to card presence', () => {
      expect(component.presence).toBe('card');
    });

    it('should render mascot image with correct src', () => {
      const img = fixture.nativeElement.querySelector('.mascot-image');
      expect(img).toBeTruthy();
      expect(img.src).toContain('volt-agent-logo.png');
    });

    it('should update internalState on state input change', () => {
      component.ngOnChanges({
        state: new SimpleChange('idle', 'loading', false)
      });
      expect(component.internalState).toBe('loading');
    });

    it('should apply state CSS class to shell', () => {
      fixture.componentRef.setInput('state', 'success');
      fixture.detectChanges();
      const shell = fixture.nativeElement.querySelector('.mascot-shell');
      expect(shell.classList).toContain('state-success');
    });

    it('should apply presence CSS class to shell', () => {
      fixture.componentRef.setInput('presence', 'hero');
      fixture.detectChanges();
      const shell = fixture.nativeElement.querySelector('.mascot-shell');
      expect(shell.classList).toContain('presence-hero');
    });
  });

  // ==========================================
  // BOUNDARY VALUES
  // ==========================================
  describe('Boundary Values', () => {
    it('should auto-transition from error to idle after 2 seconds', fakeAsync(() => {
      component.ngOnChanges({
        state: new SimpleChange('idle', 'error', false)
      });
      expect(component.internalState).toBe('error');

      tick(2000);
      expect(component.internalState).toBe('idle');
    }));

    it('should cancel previous timeout when state changes rapidly', fakeAsync(() => {
      component.ngOnChanges({
        state: new SimpleChange('idle', 'error', false)
      });
      tick(500); // Only 500ms into error timeout

      // Change to loading before the 2s error timeout fires
      component.ngOnChanges({
        state: new SimpleChange('error', 'loading', false)
      });
      expect(component.internalState).toBe('loading');

      tick(2000); // Original timeout would have fired but was cancelled
      expect(component.internalState).toBe('loading'); // Should still be loading
    }));
  });

  // ==========================================
  // EXCEPTION HANDLING
  // ==========================================
  describe('Exception Handling', () => {
    it('should clean up timeout on destroy', fakeAsync(() => {
      component.ngOnChanges({
        state: new SimpleChange('idle', 'error', false)
      });
      component.ngOnDestroy();
      // Should not throw after destroy
      tick(2000);
      // If timeout wasn't cleared, this would attempt to modify a destroyed component
      expect(component.internalState).toBe('error'); // stays error because timeout was cancelled
    }));

    it('should handle ngOnChanges with no state change gracefully', () => {
      // Simulate unrelated input change
      component.ngOnChanges({});
      expect(component.internalState).toBe('idle');
    });
  });
});
