import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { DonationDetailsApiService } from '../services/donation-details-api.service';
import { DonationAttribute, ShowAttributesDialogData } from '../models/donation-details.model';

@Component({
  selector: 'app-show-attributes-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    DatePipe,
  ],
  templateUrl: './show-attributes-dialog.html',
  styleUrls: ['./show-attributes-dialog.scss'],
})
export class ShowAttributesDialogComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(DonationDetailsApiService);
  private readonly dialogRef = inject(MatDialogRef<ShowAttributesDialogComponent>);
  readonly data: ShowAttributesDialogData = inject(MAT_DIALOG_DATA);
  private readonly destroy$ = new Subject<void>();

  loading = signal(true);
  attributes = signal<DonationAttribute[]>([]);

  displayedColumns = ['attribCode', 'attribValue', 'attribDesc', 'insertUser', 'insertDate'];

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.apiService.getAttributes(this.data.transactionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.attributes.set(response.data ?? []);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
  }

  onBack(): void {
    this.dialogRef.close();
  }

  onClose(): void {
    this.dialogRef.close('closeAll');
  }
}
