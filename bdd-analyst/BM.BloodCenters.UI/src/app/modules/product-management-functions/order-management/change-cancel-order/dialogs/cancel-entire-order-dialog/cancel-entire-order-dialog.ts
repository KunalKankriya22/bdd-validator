import { Component, inject, signal, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Subject, takeUntil } from 'rxjs';

import { LookupItem } from '../../../enter-regular-order/models/regular-order.model';
import { RegularOrderApiService } from '../../../enter-regular-order/services/regular-order-api.service';

@Component({
  selector: 'app-cancel-entire-order-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  templateUrl: './cancel-entire-order-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .dialog-message {
      color: #37474f;
      font-size: 14px;
      line-height: 1.5;
      margin: 0 0 16px;
    }

    .full-width {
      width: 100%;
    }

    .cancel-btn {
      color: #228189;
    }

    .confirm-btn {
      background-color: #228189;
      color: #ffffff;
    }
  `]
})
export class CancelEntireOrderDialogComponent implements OnInit, OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<CancelEntireOrderDialogComponent>);
  private readonly apiService = inject(RegularOrderApiService);
  private readonly destroy$ = new Subject<void>();

  cancelCodes = signal<LookupItem[]>([]);
  cancelCodeCtrl = new FormControl<string | null>(null, Validators.required);

  ngOnInit(): void {
    this.apiService.getCancelCodesLookup()
      .pipe(takeUntil(this.destroy$))
      .subscribe(codes => this.cancelCodes.set(codes));
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onConfirm(): void {
    this.dialogRef.close({ cancelCode: this.cancelCodeCtrl.value });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
