import {
  Component as NgComponent,
  OnInit,
  OnDestroy,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import moment from 'moment';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { LabQcService } from '../../services/lab-qc.service';
import { UnitTestResultDto } from '../../models/unit-test-result.model';
import { UnitTestBaseDto } from '../../models/unit-test-base.model';
import { SnackbarService } from '@shared/services/snackbar.service';

/**
 * Dialog Data Interface
 */
export interface UnitTestsDialogData {
  unitId: string;
  collDate: string;
}

/**
 * Unit Tests Dialog Component
 * Shows unit test results (scheduled and unscheduled) in tabs
 */
@NgComponent({
  selector: 'app-unit-tests-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule
  ],
  templateUrl: './unit-tests-dialog.component.html',
  styleUrl: './unit-tests-dialog.component.scss'
})
export class UnitTestsDialogComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `unit-tests-dialog-${UnitTestsDialogComponent.nextId++}`;

  // Generate unique IDs for elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private readonly destroy$ = new Subject<void>();

  // Dependency injection
  private readonly dialogRef = inject(MatDialogRef<UnitTestsDialogComponent>);
  protected readonly data = inject<UnitTestsDialogData>(MAT_DIALOG_DATA);
  private readonly labQcService = inject(LabQcService);
  private readonly snackbarService = inject(SnackbarService);

  // Signal-based state
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly scheduledTests = signal<UnitTestResultDto[]>([]);
  protected readonly unscheduledTests = signal<UnitTestResultDto[]>([]);
  protected readonly testBase = signal<UnitTestBaseDto[]>([]);

  // Tab index
  protected readonly selectedTabIndex = signal<number>(0);

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load unit test data
   */
  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    const collDateFormatted = moment(this.data.collDate).format('YYYY-MM-DD');

    this.labQcService.getQcSummary(this.data.unitId, collDateFormatted)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (summary) => {
          this.testBase.set(summary.testBase);

          // Separate scheduled and unscheduled tests
          const scheduled: UnitTestResultDto[] = [];
          const unscheduled: UnitTestResultDto[] = [];

          summary.testResults.forEach(result => {
            // Check if this test is in the test base (scheduled)
            const isScheduled = summary.testBase.some(
              base => base.testId === result.testId && base.testSeqNo === result.testSeqNo
            );

            if (isScheduled) {
              scheduled.push(result);
            } else {
              unscheduled.push(result);
            }
          });

          this.scheduledTests.set(scheduled);
          this.unscheduledTests.set(unscheduled);
          this.loading.set(false);
        },
        error: (err) => {
          this.showError(err.message || 'Failed to load unit test results.');
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
   * Show error message
   */
  private showError(message: string): void {
    this.error.set(message);
    this.snackbarService.showError(message);
  }
}
