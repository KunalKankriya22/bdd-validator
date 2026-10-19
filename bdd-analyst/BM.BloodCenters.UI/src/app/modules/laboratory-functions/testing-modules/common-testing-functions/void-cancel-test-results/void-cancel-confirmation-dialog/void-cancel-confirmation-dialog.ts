import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  VoidCancelConfirmationDialogData,
  VoidCancelConfirmationDialogResult,
} from '../models/void-cancel-test-results.model';

@Component({
  selector: 'app-void-cancel-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
  ],
  templateUrl: './void-cancel-confirmation-dialog.html',
  styleUrl: './void-cancel-confirmation-dialog.scss',
})
export class VoidCancelConfirmationDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<VoidCancelConfirmationDialogComponent>);
  protected readonly data: VoidCancelConfirmationDialogData = inject(MAT_DIALOG_DATA);
  private destroy$ = new Subject<void>();

  reasonCodeCtrl = new FormControl(this.data.voidReasonCode);
  reasonSearchCtrl = new FormControl('');

  private readonly reasonSearchText = signal('');

  protected readonly selectedDescription = signal<string>(this.data.voidReasonDescription || '-');

  protected readonly filteredReasonCodes = computed(() => {
    const s = this.reasonSearchText().toLowerCase();
    const codes = this.data.voidReasonCodes || [];
    return !s ? codes : codes.filter(c =>
      c.code.toLowerCase().includes(s) || c.codeDesc.toLowerCase().includes(s)
    );
  });

  constructor() {
    this.reasonSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.reasonSearchText.set(v || ''));

    this.reasonCodeCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(code => {
        if (code) {
          const found = (this.data.voidReasonCodes || []).find(c => c.code === code);
          this.selectedDescription.set(found?.codeDesc || '-');
        } else {
          this.selectedDescription.set('-');
        }
      });
  }

  onCancel(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.dialogRef.close(null);
  }

  onConfirm(): void {
    const result: VoidCancelConfirmationDialogResult = {
      confirmed: true,
      voidReasonCode: this.reasonCodeCtrl.value || this.data.voidReasonCode,
    };
    this.destroy$.next();
    this.destroy$.complete();
    this.dialogRef.close(result);
  }
}
