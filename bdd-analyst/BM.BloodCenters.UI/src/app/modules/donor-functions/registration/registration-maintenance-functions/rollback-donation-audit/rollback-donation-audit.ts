import { Component, OnInit, OnDestroy, inject, signal, computed, effect, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { RollbackDonationAuditService } from './services/rollback-donation-audit.service';
import {
  DonorProfile,
  HealthHistoryItem,
  PhysicalFinding,
  RetrieveResponse,
  CollectionDateInfo
} from './models/rollback-donation-audit.model';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { DataTable } from '@shared/components/data-table/data-table';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { normalizeDeferralId } from '@shared/utils/deferral-id.util';

@Component({
  selector: 'app-rollback-donation-audit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatSortModule,
    MatDialogModule,
    MatTooltipModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent
  ],
  templateUrl: './rollback-donation-audit.html',
  styleUrl: './rollback-donation-audit.scss'
})
export class RollbackDonationAuditComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(RollbackDonationAuditService);
  private readonly dialog = inject(MatDialog);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly snackbar = inject(SnackbarService);
  private readonly viewportScroller = inject(ViewportScroller);
  private readonly elementRef = inject(ElementRef);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(UnitIdFieldComponent) unitIdField?: UnitIdFieldComponent;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Rollback Donation Audit', link: null }
    ],
    title: 'Rollback Donation Audit',
    subtitle: 'Review and rollback donation or deferral audits.'
  };

  // Signal-based state
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly donorProfile = signal<DonorProfile | null>(null);
  protected readonly healthHistory = signal<HealthHistoryItem[]>([]);
  protected readonly physicalFindings = signal<PhysicalFinding[]>([]);
  protected readonly filteredPhysicalFindings = signal<PhysicalFinding[]>([]);
  protected readonly collectionDate = signal<string>('');
  protected readonly collectionDates = signal<CollectionDateInfo[]>([]);
  protected readonly okToDonate = signal<boolean>(false);
  protected readonly expandedRows = signal<Set<number>>(new Set());
  protected readonly selectedType = signal<string>('');
  private readonly healthHistorySort = signal<Sort>({ active: '', direction: '' });
  private readonly retrievedType = signal<string>('');
  private readonly retrievedId = signal<string>('');

  private static readonly UNIT_ID_MAX_LENGTH = 15;
  private static readonly DEFERRAL_ID_MAX_LENGTH = 10;
  private static readonly GENDER_MAP: Record<string, string> = { M: 'Male', F: 'Female' };
  private static readonly MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  // Computed values
  protected readonly isDataLoaded = computed(() => this.donorProfile() !== null);
  protected readonly isDonationMode = computed(() => this.selectedType() === 'Donation');
  protected readonly isDeferralMode = computed(() => this.selectedType() === 'Deferral');
  protected readonly idMaxLength = computed(() =>
    this.isDeferralMode()
      ? RollbackDonationAuditComponent.DEFERRAL_ID_MAX_LENGTH
      : RollbackDonationAuditComponent.UNIT_ID_MAX_LENGTH
  );

  protected readonly formattedGender = computed(() => {
    const gender = this.donorProfile()?.gender ?? '';
    return RollbackDonationAuditComponent.GENDER_MAP[gender.toUpperCase()] ?? gender;
  });

  protected readonly formattedDob = computed(() => {
    const dob = this.donorProfile()?.dob ?? '';
    const parts = dob.split('-');
    if (parts.length !== 3) return dob;
    const monthIndex = parseInt(parts[0], 10) - 1;
    if (monthIndex < 0 || monthIndex > 11) return dob;
    return `${parts[1]}-${RollbackDonationAuditComponent.MONTH_NAMES[monthIndex]}-${parts[2]}`;
  });

  protected readonly formattedCollectionDate = computed(() => {
    const date = this.collectionDate();
    if (!date) return '';
    const parts = date.split('-');
    if (parts.length !== 3) return date;
    const monthIndex = parseInt(parts[0], 10) - 1;
    if (monthIndex < 0 || monthIndex > 11) return date;
    return `${parts[1]}-${RollbackDonationAuditComponent.MONTH_NAMES[monthIndex]}-${parts[2]}`;
  });

  protected readonly hasMultipleCollectionDates = computed(() => {
    return this.collectionDates().length > 1;
  });

  protected readonly formattedCollectionDates = computed(() => {
    return this.collectionDates().map(dateInfo => {
      const dateStr = dateInfo.collectionDateFormatted; // MM-DD-YYYY
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const monthIndex = parseInt(parts[0], 10) - 1;
        if (monthIndex >= 0 && monthIndex <= 11) {
          // Convert MM-DD-YYYY to DD-MMM-YYYY
          return {
            value: dateStr, // Keep original for API call
            display: `${parts[1]}-${RollbackDonationAuditComponent.MONTH_NAMES[monthIndex]}-${parts[2]}`
          };
        }
      }
      return { value: dateStr, display: dateStr };
    });
  });

  protected readonly sortedHealthHistory = computed(() => {
    const data = this.healthHistory();
    const sort = this.healthHistorySort();
    if (!sort.active || sort.direction === '') return data;
    return [...data].sort((a, b) => {
      const valA = (a[sort.active as keyof HealthHistoryItem] ?? '').toString().toLowerCase();
      const valB = (b[sort.active as keyof HealthHistoryItem] ?? '').toString().toLowerCase();
      const comparison = valA.localeCompare(valB, undefined, { numeric: true });
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  });

  // Forms
  searchForm!: FormGroup;
  physicalFindingsSearchControl!: FormGroup;

  // Table columns
  healthHistoryColumns: string[] = ['expand', 'question', 'response', 'answer', 'description', 'interdiction', 'incident', 'deferredThru'];

  physicalFindingsTableConfig: DataTableConfig<PhysicalFinding> = {
    columns: [
      { key: 'code', header: 'Code', sortable: true },
      { key: 'description', header: 'Description', sortable: false },
      { key: 'value', header: 'Value', sortable: false },
      { key: 'interdiction', header: 'Interdiction', sortable: false },
      { key: 'interdictionDescription', header: 'Interdiction Description', sortable: false }
    ],
    sortConfig: { column: '', direction: 'default' },
    stickyHeader: true,
    showPagination: false,
    enableRowHighlight: false,
    emptyMessage: 'No physical findings available'
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title || 'Rollback Donation Audit', link: null }
          ],
          title: pageData.title || 'Rollback Donation Audit',
          subtitle: pageData.subtitle || 'Review and rollback donation or deferral audits.'
        };
      }
    });
  }

  ngOnInit(): void {
    this.initForms();
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.resetForm());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms(): void {
    this.searchForm = this.fb.group({
      type: ['', Validators.required],
      id: ['', [Validators.required, Validators.maxLength(RollbackDonationAuditComponent.UNIT_ID_MAX_LENGTH), Validators.pattern('^([0-9]{8}|[Cc][0-9]{8}[Cc])$')]]
    });

    this.physicalFindingsSearchControl = this.fb.group({
      search: ['']
    });

    this.searchForm.get('type')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((type) => {
        this.selectedType.set(type || '');
        const idControl = this.searchForm.get('id') as AbstractControl;
        idControl.reset('');

        // Set validators based on type
        if (type === 'Deferral') {
          // Deferral mode: pattern validator for C########C or ########
          idControl.setValidators([
            Validators.required,
            Validators.maxLength(RollbackDonationAuditComponent.DEFERRAL_ID_MAX_LENGTH),
            Validators.pattern('^([0-9]{8}|[Cc][0-9]{8}[Cc])$')
          ]);
        } else {
          // Donation mode: just required and maxLength (Unit ID field handles validation)
          idControl.setValidators([
            Validators.required,
            Validators.maxLength(RollbackDonationAuditComponent.UNIT_ID_MAX_LENGTH)
          ]);
        }

        idControl.updateValueAndValidity();
        this.resetData();

        // Clear unit ID field when switching modes
        if (this.unitIdField) {
          this.unitIdField.clear();
        }
      });

    this.physicalFindingsSearchControl.get('search')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.filterPhysicalFindings(searchTerm);
      });
  }

  onUnitValidated(data: UnitValidationResponse): void {
    // Unit ID is validated - fetch collection dates
    const unitId = data.parsedUnitId;
    if (!unitId) return;

    this.loading.set(true);
    this.error.set(null);

    this.service.getCollectionDates(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Backend returns array in response.item
          const dates = response.item || [];

          if (response.success && dates.length > 0) {
            this.collectionDates.set(dates);

            if (dates.length === 1) {
              // Auto-select single collection date (use formatted version)
              this.collectionDate.set(dates[0].collectionDateFormatted);
            } else {
              // Multiple dates - clear selection and let user choose
              this.collectionDate.set('');
            }
          } else {
            this.collectionDates.set([]);
            this.collectionDate.set('');
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.collectionDates.set([]);
          this.collectionDate.set('');
          this.error.set(err.error?.message || 'Failed to fetch collection dates');
          this.loading.set(false);
        }
      });
  }

  onUnitCleared(): void {
    // Unit ID field was cleared
    this.collectionDates.set([]);
    this.collectionDate.set('');
    this.resetData();
  }

  onCollectionDateChange(collectionDate: string): void {
    this.collectionDate.set(collectionDate);
  }

  onRetrieve(): void {
    const type = this.searchForm.get('type')?.value as 'Donation' | 'Deferral';

    // Validate based on type
    if (type === 'Donation') {
      // For Donation mode, check if Unit ID field is valid
      if (!this.unitIdField?.isValid) {
        this.error.set('Please enter a valid Unit ID');
        return;
      }

      // Check if collection date is selected when multiple dates exist
      if (this.collectionDates().length > 1 && !this.collectionDate()) {
        this.error.set('Please select a collection date');
        return;
      }
    } else if (type === 'Deferral') {
      const idControl = this.searchForm.get('id');

      // For Deferral mode, validate form (pattern validator will catch invalid format)
      if (this.searchForm.invalid) {
        this.searchForm.markAllAsTouched();
        return;
      }

      // Normalize deferral ID
      const deferralIdInput = idControl?.value as string;
      const normalizedDeferralId = normalizeDeferralId(deferralIdInput);

      // Check if trying to retrieve the same deferral that's already loaded
      if (normalizedDeferralId === this.retrievedId() && this.isDataLoaded()) {
        return; // Already loaded, no need to retrieve again
      }
    } else {
      this.searchForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // Get the ID and collection date based on type
    let id: string;
    let collectionDate: string | undefined;

    if (type === 'Donation') {
      id = this.unitIdField!.parsedUnitId!;

      // Convert collection date from MM-DD-YYYY to YYYY-MM-DD for backend
      const dateStr = this.collectionDate();
      if (dateStr) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          // Convert MM-DD-YYYY to YYYY-MM-DD
          collectionDate = `${parts[2]}-${parts[0]}-${parts[1]}`;
        }
      }
    } else {
      const deferralIdInput = this.searchForm.get('id')?.value as string;
      id = normalizeDeferralId(deferralIdInput)!;
      // Deferral mode: collection date is returned from backend, not sent
    }

    this.service.retrieve({ type, id, collectionDate })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Preserve collection date in Donation mode before resetting
          const preservedCollectionDate = type === 'Donation' ? this.collectionDate() : '';
          const preservedCollectionDates = type === 'Donation' ? this.collectionDates() : [];

          this.resetData();

          // Restore collection date in Donation mode
          if (type === 'Donation') {
            this.collectionDate.set(preservedCollectionDate);
            this.collectionDates.set(preservedCollectionDates);
          }

          if (response.success && response.item) {
            this.retrievedType.set(type);
            this.retrievedId.set(id);
            this.loadData(response.item);

            // Update the form field with the normalized ID (like update-deferral does)
            if (type === 'Deferral') {
              this.searchForm.get('id')?.setValue(id, { emitEvent: false });
            }
          } else {
            this.error.set(response.message || 'Failed to retrieve data');
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.resetData();
          this.error.set(err.error?.message || err.message || 'Failed to retrieve data');
          this.loading.set(false);
        }
      });
  }

  private loadData(data: RetrieveResponse): void {
    this.donorProfile.set(data.donorProfile);
    this.healthHistory.set(data.healthHistory);
    this.physicalFindings.set(data.physicalFindings);
    this.filteredPhysicalFindings.set(data.physicalFindings);

    // Only set collection date from response in Deferral mode
    // In Donation mode, collection date comes from the collection dates API
    if (this.isDeferralMode()) {
      this.collectionDate.set(data.collectionDate || '');
    }

    this.okToDonate.set(data.okToDonate);
  }

  private filterPhysicalFindings(searchTerm: string): void {
    if (!searchTerm) {
      this.filteredPhysicalFindings.set(this.physicalFindings());
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = this.physicalFindings().filter(item =>
      item.code.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term)
    );
    this.filteredPhysicalFindings.set(filtered);
  }

  toggleRow(index: number): void {
    const newSet = new Set(this.expandedRows());
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    this.expandedRows.set(newSet);
  }

  isRowExpanded(index: number): boolean {
    return this.expandedRows().has(index);
  }

  protected readonly allRowsExpanded = computed(() => {
    const history = this.healthHistory();
    const expanded = this.expandedRows();
    return history.length > 0 && history.every((_, i) => expanded.has(i));
  });

  toggleAllRows(): void {
    if (this.allRowsExpanded()) {
      this.expandedRows.set(new Set());
    } else {
      const allIndices = new Set(this.healthHistory().map((_, i) => i));
      this.expandedRows.set(allIndices);
    }
  }

  onHealthHistorySort(sort: Sort): void {
    this.healthHistorySort.set(sort);
  }

  onPhysicalFindingsTableSort(event: TableSortEvent): void {
    this.physicalFindingsTableConfig = {
      ...this.physicalFindingsTableConfig,
      sortConfig: { column: event.column, direction: event.direction }
    };
    const dir = event.direction === 'D' ? -1 : 1;
    const sorted = [...this.filteredPhysicalFindings()].sort((a, b) => {
      const valA = (a[event.column as keyof PhysicalFinding] ?? '').toString().toLowerCase();
      const valB = (b[event.column as keyof PhysicalFinding] ?? '').toString().toLowerCase();
      return valA.localeCompare(valB, undefined, { numeric: true }) * dir;
    });
    this.filteredPhysicalFindings.set(sorted);
  }

  onRollback(): void {
    const dialogData: ConfirmActionDialogData = {
      title: 'Are you sure you want to rollback this audit?',
      message: 'Audit Information on the unit/deferral will be rolled back. Do you want to proceed?',
      confirmText: 'ROLLBACK',
      cancelText: 'CANCEL'
    };

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '500px',
      panelClass: 'rollback-confirm-dialog',
      data: dialogData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.performRollback();
        }
      });
  }

  private performRollback(): void {
    const type = this.retrievedType() as 'Donation' | 'Deferral';
    const id = this.retrievedId();
    const transactionId = this.donorProfile()?.transactionId || '';

    this.loading.set(true);
    this.error.set(null);

    this.service.rollback({ type, id, transactionId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackbar.showSuccess('Rollback completed successfully. Please audit again.');
            this.resetForm();
          } else {
            this.error.set(response.message || 'Failed to rollback audit');
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || err.message || 'Failed to rollback audit');
          this.loading.set(false);
        }
      });
  }

  onCancel(): void {
    this.resetForm();
    this.viewportScroller.scrollToPosition([0, 0]);
    this.elementRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private resetForm(): void {
    this.searchForm.reset({ type: '' });
    this.physicalFindingsSearchControl.reset();
    if (this.unitIdField) {
      this.unitIdField.clear();
    }
    this.resetData();
  }

  private resetData(): void {
    this.donorProfile.set(null);
    this.healthHistory.set([]);
    this.physicalFindings.set([]);
    this.filteredPhysicalFindings.set([]);
    this.collectionDate.set('');
    this.collectionDates.set([]);
    this.okToDonate.set(false);
    this.expandedRows.set(new Set());
    this.error.set(null);
    this.retrievedType.set('');
    this.retrievedId.set('');
  }

  get f() {
    return this.searchForm.controls;
  }
}
