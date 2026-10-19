import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Reusable loading spinner component
 *
 * Usage: <app-loading-spinner [size]="'large'" [message]="'Loading...'" [color]="'#228189'"></app-loading-spinner>
 */
@Component({
    selector: 'app-loading-spinner',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="spinner-container" role="status" aria-live="polite" aria-atomic="true">
      <div class="spinner" [ngClass]="'spinner-' + size" [ngStyle]="{'border-left-color': color}"></div>
      <p *ngIf="message" class="spinner-message">{{ message }}</p>
      <span *ngIf="!message" class="cdk-visually-hidden">Loading, please wait</span>
    </div>
  `,
    styles: [`
    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .spinner {
      border: 4px solid rgba(0, 0, 0, 0.1);
      border-left-color: #1976d2;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .spinner-small {
      width: 24px;
      height: 24px;
      border-width: 2px;
    }

    .spinner-medium {
      width: 40px;
      height: 40px;
      border-width: 3px;
    }

    .spinner-large {
      width: 60px;
      height: 60px;
      border-width: 4px;
    }

    .spinner-message {
      margin-top: 12px;
      color: #757575;
      font-size: 14px;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `]
})
export class LoadingSpinnerComponent {
    @Input() size: 'small' | 'medium' | 'large' = 'medium';
    @Input() message: string = '';
    @Input() color: string = '#1976d2';
}
