import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { HeaderService } from '@shared/services/header.service';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';

import { CollectionGoalsByDateQueryService } from './services/collection-goals-by-date-query.service';
import {
  GoalTypeOption,
  CustodianOption,
  CollectionGoalTableRow,
  CollectionGoalsSummaryItem,
} from './models/collection-goals-by-date-query.model';

@Component({
  selector: 'app-collection-goals-by-date-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    PageHeaderWithBreadcrumb,
    DataTable,
  ],
  providers: [
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
  templateUrl: './collection-goals-by-date-query.html',
  styleUrls: ['./collection-goals-by-date-query.scss'],
})
export class CollectionGoalsByDateQuery implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly collectionGoalsService = inject(CollectionGoalsByDateQueryService);
  private readonly destroy$ = new Subject<void>();
  private readonly headerService = inject(HeaderService);

  filterForm!: FormGroup;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Define Collection Goals by Month', link: null },
    ],
    title: 'Collection Goals by Date Query',
    subtitle: 'Use this to query goals for any time frame.',
    actions: [],
  };

  tableConfig: DataTableConfig<CollectionGoalTableRow> = {
    columns: [
      {
        key: 'day',
        header: 'Day',
        sortable: false,
        type: 'text',
        width: '120px',
      },
      {
        key: 'startDate',
        header: 'Start Date',
        sortable: true,
        type: 'text',
        width: '140px',
        valueFormatter: (value) => this.formatDate(value),
      },
      {
        key: 'endDate',
        header: 'End Date',
        sortable: false,
        type: 'text',
        width: '140px',
        valueFormatter: (value) => this.formatDate(value),
      },
      {
        key: 'donationType',
        header: 'Donation Type',
        sortable: false,
        type: 'text',
        width: '140px',
      },
      {
        key: 'procedureCode',
        header: 'Procedure Code',
        sortable: false,
        type: 'text',
        width: '160px',
      },
      {
        key: 'aboTypeDescription',
        header: 'ABO Type Description',
        sortable: false,
        type: 'text',
        width: '180px',
      },
      {
        key: 'goalCount',
        header: 'Goal Count',
        sortable: false,
        type: 'text',
        width: '100px',
      },
    ],
    sortConfig: {
      column: '',
      direction: 'default',
    },
    stickyHeader: true,
    showPagination: false,
    emptyMessage: 'No collection goals found for the selected criteria.',
  };

  goalTypes: GoalTypeOption[] = [];
  custodians: CustodianOption[] = [];
  dataSource: CollectionGoalTableRow[] = [];
  summaryItems: CollectionGoalsSummaryItem[] = [];
  territoryName = '';
  goalTypeLabel = '';

  isLoadingGoalTypes = false;
  isLoadingCustodians = false;
  isLoadingData = false;
  showEmptyState = true;
  hasRetrievedData = false;

  get isRetrieveDisabled(): boolean {
    const formValue = this.filterForm?.value;
    return (
      !formValue?.goalType ||
      !formValue?.goalsFor ||
      !formValue?.fromDate ||
      !formValue?.toDate ||
      this.filterForm?.get('toDate')?.hasError('dateRangeInvalid') ||
      this.isLoadingData
    );
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadGoalTypes();
    this.setupGoalTypeChangeListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group(
      {
        goalType: [''],
        goalsFor: [{ value: '', disabled: true }],
        fromDate: [null],
        toDate: [null],
      },
      { validators: this.dateRangeValidator() }
    );
  }

  private dateRangeValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const fromDateControl = group.get('fromDate');
      const toDateControl = group.get('toDate');
      const fromDate = fromDateControl?.value;
      const toDate = toDateControl?.value;

      if (!fromDate || !toDate) {
        if (toDateControl?.hasError('dateRangeInvalid')) {
          toDateControl.setErrors(null);
        }
        return null;
      }

      const from = fromDate.toDate ? fromDate.toDate() : new Date(fromDate);
      const to = toDate.toDate ? toDate.toDate() : new Date(toDate);

      if (to < from) {
        toDateControl?.setErrors({ dateRangeInvalid: true });
        return { dateRangeInvalid: true };
      }

      if (toDateControl?.hasError('dateRangeInvalid')) {
        toDateControl.setErrors(null);
      }
      return null;
    };
  }

  private loadGoalTypes(): void {
    this.isLoadingGoalTypes = true;
    this.collectionGoalsService
      .getGoalTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (goalTypes) => {
          this.goalTypes = goalTypes;
          this.isLoadingGoalTypes = false;
        },
        error: (error) => {
          this.showError(this.getErrorMessage(error, 'Failed to load goal types'));
          this.isLoadingGoalTypes = false;
        },
      });
  }

  private setupGoalTypeChangeListener(): void {
    this.filterForm
      .get('goalType')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((goalType) => {
        const goalsForControl = this.filterForm.get('goalsFor');
        if (goalType) {
          goalsForControl?.enable();
          goalsForControl?.setValue('');
          this.loadCustodians(goalType);
        } else {
          goalsForControl?.disable();
          goalsForControl?.setValue('');
          this.custodians = [];
        }
      });
  }

  private loadCustodians(goalType: string): void {
    this.isLoadingCustodians = true;
    this.custodians = [];

    const chapterId = this.headerService.getCurrentChapterId()

    this.collectionGoalsService
      .getCustodians(goalType, chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (custodians) => {
          this.custodians = custodians;
          this.isLoadingCustodians = false;
        },
        error: (error) => {
          this.showError(this.getErrorMessage(error, 'Failed to load custodians'));
          this.isLoadingCustodians = false;
        },
      });
  }

  onRetrieve(): void {
    if (this.isRetrieveDisabled) {
      return;
    }

    const formValue = this.filterForm.getRawValue();
    this.isLoadingData = true;
    this.showEmptyState = false;

    const request = {
      goalType: formValue.goalType,
      custodian: formValue.goalsFor,
      startDate: this.formatDateForApi(formValue.fromDate),
      endDate: this.formatDateForApi(formValue.toDate),
      chapterId: this.headerService.getCurrentChapterId(),
      sortDirection: '',
      sortField: '',
    };

    this.collectionGoalsService
      .queryCollectionGoals(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.summaryItems = items;

          // Get territory name from selected custodian (Goals For)
          const selectedCustodian = this.custodians.find(
            (c) => c.custodianId === formValue.goalsFor
          );
          this.territoryName = selectedCustodian?.custodianName || '';

          // Get goal type label from selected goal type
          const selectedGoalType = this.goalTypes.find(
            (g) => g.code === formValue.goalType
          );
          this.goalTypeLabel = selectedGoalType?.description || '';

          // Transform summary items to table rows
          this.dataSource = this.buildTableData(items);
          this.hasRetrievedData = true;
          this.isLoadingData = false;

          if (this.dataSource.length === 0) {
            this.showInfo('No collection goals found for the selected criteria.');
          }
        },
        error: (error) => {
          this.showError(this.getErrorMessage(error, 'Failed to retrieve collection goals'));
          this.isLoadingData = false;
          this.dataSource = [];
          this.summaryItems = [];
        },
      });
  }

  private buildTableData(items: CollectionGoalsSummaryItem[]): CollectionGoalTableRow[] {
    const rows: CollectionGoalTableRow[] = [];

    for (const item of items) {
      // Create rows by combining breakdown data
      // Each row shows: Day, Start Date, End Date, Donation Type, Procedure Code, ABO Type, Goal Count
      const donationTypes = item.byDonationType || [];
      const procedureCodes = item.byProcedureCode || [];
      const bloodTypes = item.byBloodType || [];

      // Determine the max length to iterate
      const maxLength = Math.max(
        donationTypes.length,
        procedureCodes.length,
        bloodTypes.length,
        1
      );

      for (let i = 0; i < maxLength; i++) {
        const donation = donationTypes[i];
        const procedure = procedureCodes[i];
        const blood = bloodTypes[i];

        rows.push({
          day: this.formatDayOfWeek(item.dayOfWeek),
          startDate: item.startDate,
          endDate: item.endDate,
          donationType: donation?.donationTypeDescription || donation?.donationType || '',
          procedureCode: procedure?.procedureCodeDescription || procedure?.procedureCode || '',
          aboTypeDescription: blood?.bloodTypeDescription || blood?.bloodType || '',
          goalCount: donation?.goalCount || procedure?.goalCount || blood?.goalCount || 0,
        });
      }
    }

    return rows;
  }

  private formatDayOfWeek(dayOfWeek: string): string {
    if (!dayOfWeek) return '';
    // Convert WEDNESDAY to Wednesday
    return dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1).toLowerCase();
  }

  onSortChange(event: TableSortEvent): void {
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }

    this.sortDataLocally(event.column, event.direction);
  }

  private sortDataLocally(column: string, direction: 'A' | 'D' | 'default'): void {
    if (direction === 'default') {
      return;
    }

    this.dataSource = [...this.dataSource].sort((a, b) => {
      const aValue = a[column as keyof CollectionGoalTableRow];
      const bValue = b[column as keyof CollectionGoalTableRow];

      if (aValue === null || aValue === undefined) return direction === 'A' ? 1 : -1;
      if (bValue === null || bValue === undefined) return direction === 'A' ? -1 : 1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return direction === 'A' ? comparison : -comparison;
      }

      if (aValue < bValue) return direction === 'A' ? -1 : 1;
      if (aValue > bValue) return direction === 'A' ? 1 : -1;
      return 0;
    });
  }

  private formatDate(value: string | null): string {
    if (!value) return '';
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return value;

      const day = date.getDate().toString().padStart(2, '0');
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return value;
    }
  }

  private formatDateForApi(date: any): string {
    if (!date) return '';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  }

  private getErrorMessage(error: any, fallback: string): string {
    return error?.error?.errorResponse?.error || error?.error?.message || error?.message || fallback;
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }

  private showInfo(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}
