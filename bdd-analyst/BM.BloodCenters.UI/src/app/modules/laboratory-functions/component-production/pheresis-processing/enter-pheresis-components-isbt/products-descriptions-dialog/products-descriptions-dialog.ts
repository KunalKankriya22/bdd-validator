import { Component, EventEmitter, Input, Output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { ProductCodeOption } from '../models/pheresis-component.model';

@Component({
  selector: 'app-products-descriptions-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
  ],
  templateUrl: './products-descriptions-dialog.html',
  styleUrls: ['./products-descriptions-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsDescriptionsDialogComponent {
  @Input() options: ProductCodeOption[] = [];
  @Output() commit = new EventEmitter<ProductCodeOption[]>();
  @Output() close = new EventEmitter<void>();

  readonly selectedCode = signal<string | null>(null);

  selectProduct(code: string): void {
    this.selectedCode.set(code);
  }

  onCommit(): void {
    const code = this.selectedCode();
    if (code) {
      const selected = this.options.find((o) => o.productCode === code);
      if (selected) {
        this.commit.emit([selected]);
      }
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
