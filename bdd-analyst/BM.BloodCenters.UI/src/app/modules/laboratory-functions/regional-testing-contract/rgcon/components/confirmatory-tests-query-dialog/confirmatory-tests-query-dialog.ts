import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

import { RegionalTestingContractApiService } from '../../services/regional-testing-contract-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';

export interface ConfirmatoryTestsQueryDialogData {
  contractId: string;
  reactiveTestId: string;
}

interface ReactiveTestRow {
  testId: string;
  testRes: string;
  seq: string;
}

interface ConfirmatoryTestRow {
  testId: string;
  description: string;
  effDate: string;
  termDate: string;
}

@Component({
  selector: 'app-confirmatory-tests-query-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DataTable
  ],
  templateUrl: './confirmatory-tests-query-dialog.html',
  styleUrls: ['./confirmatory-tests-query-dialog.scss']
})
export class ConfirmatoryTestsQueryDialogComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly dialogRef = inject(MatDialogRef<ConfirmatoryTestsQueryDialogComponent>);
  readonly data = inject<ConfirmatoryTestsQueryDialogData>(MAT_DIALOG_DATA);
  private readonly apiService = inject(RegionalTestingContractApiService);
  private readonly snackbarService = inject(SnackbarService);

  // Signals
  protected readonly loading = signal(false);
  protected readonly reactiveTests = signal<ReactiveTestRow[]>([]);
  protected readonly confirmatoryTests = signal<ConfirmatoryTestRow[]>([]);

  // Table configurations
  protected readonly reactiveTestsTableConfig: DataTableConfig<ReactiveTestRow> = {
    columns: [
      { key: 'testId', header: 'Test ID', sortable: false, width: '120px' },
      { key: 'testRes', header: 'Test Results', sortable: false, width: '150px' },
      { key: 'seq', header: 'Sequence', sortable: false, width: '150px' }
    ],
    showPagination: false,
    stickyHeader: true,
    emptyMessage: 'No reactive tests'
  };

  protected readonly confirmatoryTestsTableConfig: DataTableConfig<ConfirmatoryTestRow> = {
    columns: [
      { key: 'testId', header: 'Test ID', sortable: false, width: '120px' },
      { key: 'description', header: 'Description', sortable: false },
      { key: 'effDate', header: 'Effective Date', sortable: false, width: '150px' },
      { key: 'termDate', header: 'Termination Date', sortable: false, width: '150px' }
    ],
    showPagination: false,
    stickyHeader: true,
    emptyMessage: 'No confirmatory tests'
  };

  ngOnInit(): void {
    this.loadConfirmatoryTestsQuery();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load confirmatory tests query data from API
   */
  private loadConfirmatoryTestsQuery(): void {
    this.loading.set(true);

    this.apiService.getConfirmatoryQueryData(this.data.contractId, this.data.reactiveTestId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // Map reactive tests with full descriptions
          const reactiveTests = data.reactiveTests?.map(test => ({
            testId: test.testId,
            testRes: this.getTestResultDescription(test.testResults),
            seq: this.getSequenceDescription(test.sequence)
          })) || [];

          // Map confirmatory tests with formatted dates (date only, no time)
          const confirmatoryTests = data.confirmatoryTests?.map(test => ({
            testId: test.testId,
            description: test.description || '',
            effDate: this.formatDateOnly(test.effectiveDate),
            termDate: this.formatDateOnly(test.terminationDate)
          })) || [];

          this.reactiveTests.set(reactiveTests);
          this.confirmatoryTests.set(confirmatoryTests);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading confirmatory tests query:', error);
          this.snackbarService.showError('Failed to load confirmatory tests query');
          this.loading.set(false);
        }
      });
  }

  /**
   * Close dialog
   */
  onClose(): void {
    this.dialogRef.close();
  }

  /**
   * Get full description for test result code in format "R - Reactive"
   */
  private getTestResultDescription(code: string): string {
    const resultMap: { [key: string]: string } = {
      'R': 'Reactive',
      'P': 'Positive',
      'N': 'Negative',
      'NR': 'Non-Reactive',
      'I': 'Indeterminate',
      'NT': 'Not Tested'
    };
    const description = resultMap[code];
    return description ? `${code} - ${description}` : code;
  }

  /**
   * Get full description for sequence code
   */
  private getSequenceDescription(code: string): string {
    const sequenceMap: { [key: string]: string } = {
      'I': 'Initial tests',
      'R': 'Repeat tests'
    };
    return sequenceMap[code] || code;
  }

  /**
   * Format date to show only date part (no time)
   * Input: "2026-06-29T00:00:00" or "2026-06-29T00:00:00Z"
   * Output: "29-JUN-2026"
   */
  private formatDateOnly(dateString: string | null): string {
    if (!dateString) return '-';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;

      const day = String(date.getDate()).padStart(2, '0');
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();

      return `${day}-${month}-${year}`;
    } catch (error) {
      return dateString;
    }
  }
}
