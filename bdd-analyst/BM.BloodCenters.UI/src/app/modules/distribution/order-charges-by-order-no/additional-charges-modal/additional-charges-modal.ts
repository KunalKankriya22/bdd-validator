import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  OtherCharge,
  AntigenCharge,
  AttributeCharge
} from '../models/order-charges.model';

@Component({
  selector: 'app-additional-charges-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './additional-charges-modal.html',
  styleUrls: ['./additional-charges-modal.scss']
})
export class AdditionalChargesPanel {
  @Input() otherCharges: OtherCharge[] = [];
  @Input() antigens: AntigenCharge[] = [];
  @Input() attributes: AttributeCharge[] = [];
  @Output() closePanel = new EventEmitter<void>();

  close(): void {
    this.closePanel.emit();
  }

  formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return '$0.00';
    return `$${value.toFixed(2)}`;
  }
}
