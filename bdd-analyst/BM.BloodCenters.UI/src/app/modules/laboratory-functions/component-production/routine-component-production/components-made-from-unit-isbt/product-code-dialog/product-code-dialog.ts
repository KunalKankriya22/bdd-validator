import { Component, EventEmitter, Input, Output, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { ProductCodeOption } from '../models/components-made-from-unit-isbt.model';

@Component({
  selector: 'app-product-code-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    FormsModule
  ],
  templateUrl: './product-code-dialog.html',
  styleUrl: './product-code-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCodeDialogComponent implements OnInit {
  @Input() options: ProductCodeOption[] = [];
  @Output() save = new EventEmitter<ProductCodeOption>();
  @Output() close = new EventEmitter<void>();

  selectedProductCode = signal<string | null>(null);

  ngOnInit(): void {
    if (this.options.length > 0) {
      this.selectedProductCode.set(this.options[0].productCode);
    }
  }

  onSave(): void {
    const code = this.selectedProductCode();
    if (code) {
      const selected = this.options.find(o => o.productCode === code);
      if (selected) {
        this.save.emit(selected);
      }
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
