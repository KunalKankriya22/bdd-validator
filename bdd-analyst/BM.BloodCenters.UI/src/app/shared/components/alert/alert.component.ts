import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.scss'
})
export class AlertComponent {
  @Input() type: AlertType = 'info';
  @Input() ariaLive: 'polite' | 'assertive' = 'polite';
  @Input() dismissible: boolean = false;
  @Output() dismissed = new EventEmitter<void>();

  onDismiss(): void {
    this.dismissed.emit();
  }
}
