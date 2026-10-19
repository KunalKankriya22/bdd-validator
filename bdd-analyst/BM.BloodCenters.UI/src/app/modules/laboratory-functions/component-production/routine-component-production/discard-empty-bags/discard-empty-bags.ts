import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';

import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { DiscardBagService } from './services/discard-bag.service';
import {
  RejectReasonDto,
  DiscardedBagDisplay,
  DiscardBagRequestDto
} from './models/discard-bag.model';

/**
 * Discard Empty Bags Component
 * Laboratory Functions > Component Production Modules > Routine Component Production > Discard Empty Bags
 *
 * Migrated from Oracle Forms CPIDISCA (DISMTBAG)
 * Mnemonic: DISMTBAG
 *
 * Functionality:
 * 1. User scans/enters Unit ID
 * 2. User selects Reason for Rejection → Description auto-populated
 * 3. User selects Catalog Number → Bag discarded, added to table, snackbar shown
 * 4. Form resets, process repeats for next bag
 */
@Component({
  selector: 'app-discard-empty-bags',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule,
    DataTable,
    UnitIdFieldComponent,
    PageHeaderWithBreadcrumb
  ],
  templateUrl: './discard-empty-bags.html',
  styleUrl: './discard-empty-bags.scss'
})
export class DiscardEmptyBagsComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `discard-empty-bags-${DiscardEmptyBagsComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Injected services
  private readonly discardService = inject(DiscardBagService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  // ViewChild references
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  // Default title (fallback if API doesn't return it)
  private readonly defaultTitle = 'Discard Empty Bags';

  // Header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  // Form controls (start disabled, will enable based on computed signals)
  protected readonly rejectReasonControl = new FormControl<string | null>(
    { value: null, disabled: true },
    { validators: [Validators.required] }
  );
  protected readonly catalogNumberControl = new FormControl<string | null>(
    { value: null, disabled: true },
    { validators: [Validators.required] }
  );

  // Search controls for ngx-mat-select-search
  protected readonly rejectReasonSearchCtrl = new FormControl('');
  protected readonly catalogSearchCtrl = new FormControl('');
  private readonly rejectReasonSearch = signal('');
  private readonly catalogSearch = signal('');

  // Signals for reactive state
  protected readonly rejectReasons = signal<RejectReasonDto[]>([]);
  protected readonly availableCatalogs = signal<string[]>([]);
  protected readonly discardedBags = signal<DiscardedBagDisplay[]>([]);
  protected readonly totalDiscarded = signal(0);
  protected readonly isProcessing = signal(false);

  // Current form state signals
  protected readonly unitIdValid = signal(false);
  protected readonly currentUnitId = signal<string | null>(null);
  protected readonly collectionDate = signal<string | null>(null);
  protected readonly selectedRejectReason = signal<RejectReasonDto | null>(null);

  // Computed signals for field enabling (sequential workflow)
  protected readonly reasonFieldEnabled = computed(() => this.unitIdValid());
  protected readonly catalogFieldEnabled = computed(() =>
    this.unitIdValid() && this.selectedRejectReason() !== null
  );

  // Computed signal for filtered reject reasons (reactive to search text)
  protected readonly filteredRejectReasons = computed(() => {
    const search = this.rejectReasonSearch().toLowerCase();
    const reasons = this.rejectReasons();
    if (!search) return reasons;
    return reasons.filter(r =>
      r.code.toLowerCase().includes(search) || r.description.toLowerCase().includes(search)
    );
  });

  // Computed signal for filtered catalogs (reactive to search text)
  protected readonly filteredCatalogs = computed(() => {
    const search = this.catalogSearch().toLowerCase();
    const catalogs = this.availableCatalogs();
    if (!search) return catalogs;
    return catalogs.filter(c => c.toLowerCase().includes(search));
  });

  // Shared data table configuration
  protected dataTableConfig: DataTableConfig<DiscardedBagDisplay> = {
    columns: [
      { key: 'unitId', header: 'Unit ID', sortable: true },
      { key: 'rejectReasonCode', header: 'Reason for Rejection', sortable: false },
      { key: 'rejectReasonDescription', header: 'Rejection Description', sortable: false },
      { key: 'catalogNumber', header: 'Catalog Number', sortable: false },
    ],
    pagination: {
      pageSize: 10,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    sortConfig: { column: 'unitId', direction: 'default' },
    stickyHeader: true,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Scan or enter a Unit ID to begin',
    noDataIcon: 'search',
  };

  constructor() {
    this.initializeHeaderConfig();

    // Watch for page header data from API and update header config dynamically
    // Use API values directly (including null/empty subtitle)
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title || this.defaultTitle, link: null }
          ],
          title: pageData.title || this.defaultTitle,
          subtitle: pageData.subtitle || ''  // Use API subtitle directly, empty string if null
        };
      }
    });

    // Enable/disable Reject Reason field based on Unit ID validation
    effect(() => {
      if (this.reasonFieldEnabled()) {
        this.rejectReasonControl.enable({ emitEvent: false });
      } else {
        this.rejectReasonControl.disable({ emitEvent: false });
      }
    });

    // Enable/disable Catalog Number field based on Unit ID and Reject Reason
    effect(() => {
      if (this.catalogFieldEnabled()) {
        this.catalogNumberControl.enable({ emitEvent: false });
      } else {
        this.catalogNumberControl.disable({ emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.loadRejectReasons();
    this.setupSearchSubscriptions();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize header configuration with default values
   */
  private initializeHeaderConfig(): void {
    this.headerConfig = {
      breadcrumbs: [
        {
          label: 'Home',
          link: '/home'
        },
        {
          label: this.defaultTitle,
          link: null
        }
      ],
      title: this.defaultTitle,
      subtitle: '',  // Will be populated from API
      actions: []
    };
  }

  /**
   * Subscribe to chapter change events from HeaderService
   * When chapter changes, reset the page state and reload data
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.handleChapterChange();
      });
  }

  /**
   * Handle chapter change event
   * Resets all state and reloads data for new chapter
   */
  private handleChapterChange(): void {
    // Reset form completely
    this.resetForm();

    // Clear the unit ID field
    if (this.unitIdField) {
      this.unitIdField.clear();
    }

    // Clear discarded bags table
    this.discardedBags.set([]);
    this.totalDiscarded.set(0);

    // Reset data table pagination, sorting, and column header
    const unitIdCol = this.dataTableConfig.columns.find(c => c.key === 'unitId');
    if (unitIdCol) {
      unitIdCol.header = 'Unit ID';
    }
    this.dataTableConfig = {
      ...this.dataTableConfig,
      pagination: { ...this.dataTableConfig.pagination!, pageIndex: 0, totalRecords: 0 },
      sortConfig: { column: 'unitId', direction: 'default' },
    };

    // Clear and reload reject reasons for new chapter
    this.rejectReasons.set([]);
    this.rejectReasonSearchCtrl.setValue('', { emitEvent: false });
    this.catalogSearchCtrl.setValue('', { emitEvent: false });
    this.loadRejectReasons();
  }

  /**
   * Load active rejection reason codes from API
   */
  private loadRejectReasons(): void {
    this.discardService.getRejectReasons()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reasons) => {
          this.rejectReasons.set(reasons);
        },
        error: () => {
          this.showError('Failed to load rejection reasons');
        }
      });
  }

  private setupSearchSubscriptions(): void {
    this.rejectReasonSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.rejectReasonSearch.set(value || ''));

    this.catalogSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.catalogSearch.set(value || ''));
  }

  protected onRejectReasonSelected(): void {
    const code = this.rejectReasonControl.value;
    if (code) {
      const reason = this.rejectReasons().find(r => r.code === code) || null;
      this.selectedRejectReason.set(reason);
    } else {
      this.selectedRejectReason.set(null);
      this.availableCatalogs.set([]);
    }
  }

  /**
   * Handle Unit ID validation success
   */
  protected onUnitValidated(data: UnitValidationResponse): void {
    // Unit format is already validated by UnitIdFieldComponent via donor-lib
    // Now validate unit existence and bag availability (EARLY VALIDATION)

    // Store unit ID but DON'T set unitIdValid yet (race condition fix)
    // unitIdValid will be set only after backend confirms validity
    this.currentUnitId.set(data.parsedUnitId);

    // Call early validation endpoint
    this.validateUnitExistence(data.parsedUnitId);
  }

  /**
   * Handle Unit ID field cleared
   */
  protected onUnitCleared(): void {
    this.resetForm();
  }

  /**
   * Validate unit exists in database and has bags available.
   * Implements legacy UNIT_ID.VALIDATE_FIELD + reconcile_bags() logic.
   * Shows Error 0063 or 0134 if validation fails.
   */
  private validateUnitExistence(unitId: string): void {
    this.discardService.validateUnitForDiscard(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (!result.isValid) {
            // Validation failed - show specific error and clear unit
            const errorMessage = result.errorCode
              ? `Error ${result.errorCode}: ${result.errorMessage}`
              : result.errorMessage || 'Validation failed';
            this.showError(errorMessage);
            this.unitIdField.clear();
            this.unitIdValid.set(false);
            this.currentUnitId.set(null);
          } else {
            // Validation passed - unit exists and has bags available
            // SUCCESS - Only NOW enable downstream fields (race condition fix)
            this.unitIdValid.set(true);

            // Store collection date for later use (audit trail)
            if (result.collectionDate) {
              this.collectionDate.set(result.collectionDate);
            }

            // Pre-load available catalogs since we already know they exist
            // This optimizes UX - catalogs will be ready when user focuses field
            this.loadAvailableCatalogs(unitId);
          }
        },
        error: (error) => {
          // API call failed - extract error message from response

          // Extract error code and message from API response
          const errorCode = error?.error?.errorCode || error?.error?.errorResponse?.errorCode;
          const errorText = error?.error?.errorResponse?.error
            || error?.error?.message
            || error?.message
            || 'Failed to validate unit. Please try again.';

          // Format: "Error {code}: {message}" to match application standard
          const errorMessage = errorCode
            ? `Error ${errorCode}: ${errorText}`
            : errorText;

          this.showError(errorMessage);
          this.unitIdField.clear();
          this.unitIdValid.set(false);
          this.currentUnitId.set(null);
        }
      });
  }

  /**
   * Load available catalog numbers for the current unit
   */
  private loadAvailableCatalogs(unitId: string): void {
    // Only load if not already loaded
    if (this.availableCatalogs().length > 0) {
      return;
    }

    this.discardService.getAvailableCatalogs(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (catalogs) => {
          if (catalogs.length === 0) {
            // This should not happen if validateUnitForDiscard passed
            // But defensive programming - show error
            this.showError('No bags available to discard for this unit');
            this.availableCatalogs.set([]);
            return;
          }
          this.availableCatalogs.set(catalogs);
        },
        error: (error) => {
          // DON'T clear unit ID - it was already validated by donor-lib
          this.showError('Failed to load available catalogs. Please try again.');
          this.availableCatalogs.set([]); // Set to empty array so retry is possible
        }
      });
  }

  protected onCatalogSelected(): void {
    const value = this.catalogNumberControl.value;
    if (value && this.currentUnitId() && this.selectedRejectReason()) {
      this.discardBag(value);
    }
  }

  /**
   * Discard a bag (create COMPONENTS record)
   * Call POST API, add to table, reset form
   */
  private discardBag(catalogNumber: string): void {
    const currentReason = this.selectedRejectReason();
    if (!this.currentUnitId() || !currentReason) {
      return;
    }

    this.isProcessing.set(true);

    const request: DiscardBagRequestDto = {
      unitId: this.currentUnitId()!,
      catalogNumber: catalogNumber,
      rejectReasonCode: currentReason.code
    };

    this.discardService.discardBag(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Add to table
          const discardedBag: DiscardedBagDisplay = {
            unitId: response.unitId,
            rejectReasonCode: response.rejectReasonCode,
            rejectReasonDescription: currentReason.description,
            catalogNumber: response.catalogNumber,
            collectionDate: response.collectionDate,
            timestamp: new Date()
          };

          this.discardedBags.update(bags => [...bags, discardedBag]);
          this.updateDataTableConfig();

          // Increment counter
          const newCount = this.totalDiscarded() + 1;
          this.totalDiscarded.set(newCount);

          // Show success snackbar
          this.showSuccess(`${newCount} ${newCount === 1 ? 'bag' : 'bags'} discarded successfully`);

          // Reset form for next bag
          this.resetFormForNextBag();
        },
        error: (error) => {
          this.isProcessing.set(false);

          // Show error message from backend
          const errorMessage = error.error?.message || 'Failed to discard bag';
          this.showError(errorMessage);
        }
      });
  }

  /**
   * Reset form to initial state (after clearing)
   */
  private resetForm(): void {
    this.unitIdValid.set(false);
    this.currentUnitId.set(null);
    this.collectionDate.set(null);
    this.selectedRejectReason.set(null);
    this.availableCatalogs.set([]);

    this.rejectReasonControl.setValue(null);
    this.catalogNumberControl.setValue(null);
    this.rejectReasonControl.markAsUntouched();
    this.catalogNumberControl.markAsUntouched();
    this.rejectReasonSearchCtrl.setValue('', { emitEvent: false });
    this.catalogSearchCtrl.setValue('', { emitEvent: false });

    this.isProcessing.set(false);
  }

  private resetFormForNextBag(): void {
    this.unitIdField.clear();

    this.unitIdValid.set(false);
    this.currentUnitId.set(null);
    this.availableCatalogs.set([]);

    this.catalogNumberControl.setValue(null);
    this.catalogNumberControl.markAsUntouched();
    this.catalogSearchCtrl.setValue('', { emitEvent: false });

    this.isProcessing.set(false);
  }

  protected onSortChange(event: TableSortEvent): void {
    this.dataTableConfig = {
      ...this.dataTableConfig,
      sortConfig: { column: event.column, direction: event.direction },
    };
    this.sortDiscardedBags(event.column, event.direction);
  }

  protected onPageChange(event: TablePageEvent): void {
    this.dataTableConfig = {
      ...this.dataTableConfig,
      pagination: { ...this.dataTableConfig.pagination!, pageIndex: event.pageIndex, pageSize: event.pageSize },
    };
  }

  private updateDataTableConfig(): void {
    const count = this.discardedBags().length;
    const unitIdCol = this.dataTableConfig.columns.find(c => c.key === 'unitId');
    if (unitIdCol) {
      unitIdCol.header = count > 0 ? `Unit ID (${count})` : 'Unit ID';
    }
    this.dataTableConfig = {
      ...this.dataTableConfig,
      pagination: { ...this.dataTableConfig.pagination!, pageIndex: 0, totalRecords: count },
    };
    this.cdr.detectChanges();
  }

  private sortDiscardedBags(column: string, direction: 'A' | 'D' | 'default'): void {
    if (direction === 'default') return;
    const sorted = this.discardedBags().slice().sort((a, b) => {
      const valA = (a as any)[column] ?? '';
      const valB = (b as any)[column] ?? '';
      return direction === 'A' ? (valA < valB ? -1 : 1) : (valA > valB ? -1 : 1);
    });
    this.discardedBags.set(sorted);
  }

  /**
   * Show success snackbar (top right)
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Show error snackbar (top right)
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 7000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

}
