import { Component, OnInit, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TestBatchDetailsApiService } from '../../services/test-batch-details-api.service';
import { TestBatchParmDto } from '../../models/test-batch-details.model';
import { LoggingService } from '@shared/services/logging.service';

export interface TestBatchParametersDialogData {
  worksheetId: string;
  testId: string;
}

@Component({
  selector: 'app-test-batch-parameters-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './test-batch-parameters-dialog.html',
  styleUrl: './test-batch-parameters-dialog.scss'
})
export class TestBatchParametersDialog implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<TestBatchParametersDialog>);
  private readonly apiService = inject(TestBatchDetailsApiService);
  private readonly loggingService = inject(LoggingService);

  // Unique ID generation
  private static nextId = 0;
  protected readonly componentId = `test-batch-parameters-dialog-${TestBatchParametersDialog.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  worksheetId: string;
  testId: string;

  loading = false;
  error: string | null = null;

  // Table
  dataSource = new MatTableDataSource<TestBatchParmDto>([]);
  displayedColumns = ['parmCode', 'description', 'parmValue', 'acceptFlag', 'firstTech', 'firstDate'];

  constructor(@Inject(MAT_DIALOG_DATA) public data: TestBatchParametersDialogData) {
    this.worksheetId = data.worksheetId;
    this.testId = data.testId;
  }

  ngOnInit(): void {
    this.loadParameters();
  }

  private loadParameters(): void {
    this.loading = true;
    this.error = null;

    this.apiService.getParameters(this.worksheetId, this.testId).subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.loading = false;
      },
      error: (err) => {
        this.loggingService.error('Error loading test batch parameters', err);
        this.error = 'Failed to load parameters. Please try again.';
        this.loading = false;
      }
    });
  }

  onRetry(): void {
    this.loadParameters();
  }

  onClose(): void {
    this.dialogRef.close();
  }

  formatValue(value: string | null | undefined): string {
    return value || '-';
  }

  private readonly monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  // Parse ISO string parts directly — the API returns dates in chapter local time,
  // so using new Date() would re-apply browser timezone and produce a wrong result.
  formatDate(date: string | null): string {
    if (!date) return '-';
    const [datePart, timePart] = date.split('T');
    const parts = datePart?.split('-');
    if (!parts || parts.length !== 3) return date;
    const month = this.monthNames[parseInt(parts[1], 10) - 1];
    const dateStr = `${parts[2]}-${month}-${parts[0]}`;
    if (timePart) {
      const time = timePart.substring(0, 5);
      return `${dateStr} ${time}`;
    }
    return dateStr;
  }
}
