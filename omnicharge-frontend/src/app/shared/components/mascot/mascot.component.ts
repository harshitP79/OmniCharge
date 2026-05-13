import { ChangeDetectionStrategy, Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export type MascotState = 'idle' | 'loading' | 'success' | 'error';
export type MascotPresence = 'hero' | 'card' | 'compact' | 'minimal';

@Component({
  selector: 'app-mascot',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mascot.component.html',
  styleUrls: ['./mascot.component.scss']
})
export class MascotComponent implements OnChanges, OnDestroy {
  @Input() state: MascotState = 'idle';
  @Input() presence: MascotPresence = 'card';

  internalState: MascotState = 'idle';
  readonly imageSrc = 'assets/volt-agent-logo.png';
  private transitionTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['state']) {
      this.handleStateTransition(changes['state'].currentValue);
    }
  }

  ngOnDestroy(): void {
    this.clearTransitionTimeout();
  }

  private handleStateTransition(newState: MascotState): void {
    this.clearTransitionTimeout();

    this.internalState = newState;

    if (newState === 'error') {
      this.transitionTimeout = setTimeout(() => {
        if (this.internalState === 'error') {
          this.internalState = 'idle';
        }
      }, 2000);
    }
  }

  private clearTransitionTimeout(): void {
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
      this.transitionTimeout = null;
    }
  }
}
