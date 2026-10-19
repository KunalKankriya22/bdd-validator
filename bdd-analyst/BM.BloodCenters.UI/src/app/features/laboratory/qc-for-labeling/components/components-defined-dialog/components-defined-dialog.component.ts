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
import { ComponentDto } from '../../models/component.model';
import { UnitTestResultDto } from '../../models/unit-test-result.model';
import { UnitTestBaseDto } from '../../models/unit-test-base.model';
import { SnackbarService } from '@shared/services/snackbar.service';

/**
 * Dialog Data Interface
 */
export interface ComponentsDefinedDialogData {
  unitId: string;
  collDate: string;
}

/**
 * Component row for the Reviewing Components tab
 */
interface ComponentRow {
  productCode: string | null;
  bag: string | null;
  expirationDate: string | null;
  sld: string | null;
  reject: string | null;
  insertDate: string | null;
  labelDate: string | null;
}

/**
 * Components Defined Dialog Component
 * Shows components defined for a specific unit with two tabs:
 * 1. Reviewing Components - List of components with product code, dates, etc.
 * 2. Reviewing Scheduled/Unscheduled Tests for a Unit - Test results
 */
@NgComponent({
  selector: 'app-components-defined-dialog',
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
  templateUrl: './components-defined-dialog.component.html',
  styleUrl: './components-defined-dialog.component.scss'
})
export class ComponentsDefinedDialogComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `components-defined-dialog-${ComponentsDefinedDialogComponent.nextId++}`;

  // Generate unique IDs for elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private readonly destroy$ = new Subject<void>();

  // Dependency injection
  private readonly dialogRef = inject(MatDialogRef<ComponentsDefinedDialogComponent>);
  protected readonly data = inject<ComponentsDefinedDialogData>(MAT_DIALOG_DATA);
  private readonly labQcService = inject(LabQcService);
  private readonly snackbarService = inject(SnackbarService);

  // Signal-based state
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly components = signal<ComponentDto[]>([]);
  protected readonly testResults = signal<UnitTestResultDto[]>([]);
  protected readonly testBase = signal<UnitTestBaseDto[]>([]);
  protected readonly componentRows = signal<ComponentRow[]>([]);

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
   * Load component data and test results
   */
  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    const collDateFormatted = moment(this.data.collDate).format('YYYY-MM-DD');

    this.labQcService.getQcSummary(this.data.unitId, collDateFormatted)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (summary) => {
          this.components.set(summary.components || []);
          this.testResults.set(summary.testResults);
          this.testBase.set(summary.testBase);
          this.transformComponentData(summary.components || []);
          this.loading.set(false);
        },
        error: (err) => {
          this.showError(err.message || 'Failed to load component details.');
          this.loading.set(false);
        }
      });
  }

  private transformComponentData(components: ComponentDto[]): void {
    const rows: ComponentRow[] = components.map(c => ({
      productCode: c.productCode,
      bag: c.bagId,
      expirationDate: c.expDate,
      sld: c.systemLabelDecision,
      reject: c.rejectReasonCode,
      insertDate: c.insertDate,
      labelDate: c.labelDats
    }));

    this.componentRows.set(rows);
  }

  /**
   * Format date for display (DD-MMM-YYYY)
   */
  formatDate(date: string | null | undefined): string {
    if (!date) {
      return '-';
    }
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : '-';
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
