import { Component, OnInit, inject, signal, Inject, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TestBatchDetailsApiService } from '../../services/test-batch-details-api.service';
import { LoggingService } from '@shared/services/logging.service';

export type ViewTestsType = 'scheduled' | 'unscheduled' | 'holding';

export interface ViewTestsDialogData {
  worksheetId: string;
  testId: string;
  type: ViewTestsType;
}

const DIALOG_CONFIG: Record<ViewTestsType, { title: string; columns: string[] }> = {
  scheduled: {
    title: 'Scheduled Tests',
    columns: ['unitId', 'testSeqNo', 'resultStatus1', 'tbId', 'absorbance', 'ratio']
  },
  unscheduled: {
    title: 'Unscheduled Tests',
    // interpCode is BR-6 derived; shown instead of raw resultStatus1
    columns: ['unitId', 'testSeqNo', 'interpCode', 'tbId', 'absorbance', 'ratio']
  },
  holding: {
    title: 'Holding Area Tests',
    columns: ['unitId', 'collDate', 'resultStatus1', 'interpDesc', 'tbSeqNo', 'wellNumber', 'absorbance', 'ratio', 'resultDats', 'testingLabCode', 'resultUserId']
  }
};

@Component({
  selector: 'app-view-tests-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './view-tests-dialog.html',
  styleUrl: './view-tests-dialog.scss'
})
export class ViewTestsDialog implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<ViewTestsDialog>);
  private readonly apiService = inject(TestBatchDetailsApiService);
  private readonly loggingService = inject(LoggingService);

  private static nextId = 0;
  protected readonly componentId = `view-tests-dialog-${ViewTestsDialog.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  worksheetId: string;
  testId: string;
  type: ViewTestsType;
  title: string;
  columns: string[];

  protected readonly allTests = signal<any[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly totalCount = computed(() => this.allTests().length);

  pageSize = 14;
  pageIndex = 0;
  pageSizeOptions = [14, 25, 50];
  dataSource = new MatTableDataSource<any>([]);

  constructor(@Inject(MAT_DIALOG_DATA) public data: ViewTestsDialogData) {
    this.worksheetId = data.worksheetId;
    this.testId = data.testId;
    this.type = data.type;
    this.title = DIALOG_CONFIG[data.type].title;
    this.columns = DIALOG_CONFIG[data.type].columns;
  }

  ngOnInit(): void {
    this.loadTests();
  }

  private loadTests(): void {
    this.loading.set(true);
    this.error.set(null);

    const call$: Observable<any[]> = this.type === 'scheduled'
      ? this.apiService.getScheduledTests(this.worksheetId, this.testId)
      : this.type === 'unscheduled'
        ? this.apiService.getUnscheduledTests(this.worksheetId, this.testId)
        : this.apiService.getHoldingTests(this.worksheetId, this.testId);

    call$.subscribe({
      next: (data: any[]) => {
        this.allTests.set(data);
        this.pageIndex = 0;
        this.applyPage();
        this.loading.set(false);
      },
      error: (err: any) => {
        this.loggingService.error(`Error loading ${this.type} tests`, err);
        this.error.set(`Failed to load ${this.title.toLowerCase()}. Please try again.`);
        this.loading.set(false);
      }
    });
  }

  private applyPage(): void {
    const start = this.pageIndex * this.pageSize;
    this.dataSource.data = this.allTests().slice(start, start + this.pageSize);
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.applyPage();
  }

  onRetry(): void {
    this.loadTests();
  }

  onClose(): void {
    this.dialogRef.close();
  }

  formatUnitId(unitId: string | null, chkDigit: string | null): string {
    if (!unitId) return '-';
    return chkDigit ? `${unitId} - ${chkDigit}` : unitId;
  }

  formatValue(value: string | null | undefined): string {
    return value || '-';
  }

  private readonly monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  formatDate(date: string | null): string {
    if (!date) return '-';
    const parts = date.split('T')[0]?.split('-');
    if (!parts || parts.length !== 3) return date;
    const month = this.monthNames[parseInt(parts[1], 10) - 1];
    return `${parts[2]}-${month}-${parts[0]}`;
  }
}
