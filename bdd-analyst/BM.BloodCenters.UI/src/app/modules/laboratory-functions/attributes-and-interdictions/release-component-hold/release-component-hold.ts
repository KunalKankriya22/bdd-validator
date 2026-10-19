import { Component, OnInit, OnDestroy, signal, computed, ViewChild, inject, TemplateRef, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule, MatSelect } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableDataSource } from '@angular/material/table';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, finalize } from 'rxjs';

import { UnitIdFieldComponent } from '@shared/components/unit-id-field';
import type { UnitValidationResponse } from '@shared/components/unit-id-field';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { LoggingService } from '@shared/services/logging.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';

import { ComponentHoldApiService } from './services/component-hold-api.service';
import {
  ComponentHoldRow,
  ReleaseComponentHoldFormState,
  ProductOption,
  FIELD_LENGTHS
} from './models/component-hold.model';

@Component({
  selector: 'app-release-component-hold',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatCheckboxModule,
    MatDialogModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
    SearchBar,
    DataTable,
    LoadingSpinnerComponent
  ],
  templateUrl: './release-component-hold.html',
  styleUrls: ['./release-component-hold.scss']
})
export class ReleaseComponentHoldComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private apiService = inject(ComponentHoldApiService);
  private snackbarService = inject(SnackbarService);
  private loggingService = inject(LoggingService);
  private pageHeaderService = inject(PageHeaderService);
  private dialog = inject(MatDialog);

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;
  @ViewChild('productSelect') productSelect!: MatSelect;

  // Page header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Release Component Hold', link: null }
    ],
    title: 'Release Component Hold',
    subtitle: 'Allows authorised users to remove a component hold once conditions are met.',
    showBackButton: false
  };

  constructor() {
    // Update header config from menu-items API response
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        untracked(() => {
          this.headerConfig = {
            breadcrumbs: [
              { label: 'Home', link: '/home' },
              { label: pageData.title, link: null }
            ],
            title: pageData.title,
            subtitle: pageData.subtitle || '',
            showBackButton: false
          };
        });
      }
    });
  }

  // Form state signals
  formState = signal<ReleaseComponentHoldFormState>({
    unitId: '',
    collectionDate: '',
    chapterId: '',
    productCode: '',
    productDescription: '',
    isUnitValidated: false,
    isProductValidated: false
  });

  // Loading states
  isValidatingUnit = signal(false);
  isRetrievingHolds = signal(false);
  isReleasingHolds = signal(false);

  // Data signals
  availableProducts = signal<ProductOption[]>([]);
  filteredProducts = signal<ProductOption[]>([]);
  productCodeControl = new FormControl('', Validators.required);
  productSearchControl = new FormControl('');

  componentHolds = signal<ComponentHoldRow[]>([]);
  dataSource = new MatTableDataSource<ComponentHoldRow>([]);
  isLoadingHolds = signal(false);
  selectedHolds = signal<ComponentHoldRow[]>([]);
  searchKeyword = '';
  hasRetrievedData = signal(false); // Track if we've called retrieve at least once

  // Search bar configuration
  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Interdiction Code',
    ariaLabel: 'Search component holds by interdiction code',
    tooltip: 'Search by interdiction code',
    searchOnEnterOnly: true
  };

  // Data table configuration
  tableConfig: DataTableConfig<ComponentHoldRow> = {
    columns: [
      {
        key: 'interdictionCode',
        header: 'Interdiction Code',
        sortable: false,
        width: '200px'
      },
      {
        key: 'interdictionDescription',
        header: 'Description',
        sortable: false
      }
    ],
    enableSelection: true,
    selectionPosition: 'first',
    selectionKey: 'interdictionCode',
    isRowSelectable: () => true,
    stickyHeader: true,
    emptyMessage: 'No Results to Display',
    noDataIcon: 'edit',
    showPagination: false,
    showTableOnEmpty: false,
    enableRowHighlight: false
  };

  // Computed properties
  unitFound = computed(() => this.formState().isUnitValidated);
  holdsRetrieved = computed(() => this.componentHolds().length > 0);
  hasSelectedHolds = computed(() => this.selectedHolds().length > 0);
  selectedCount = computed(() => this.selectedHolds().length);

  // Field lengths for validation
  readonly FIELD_LENGTHS = FIELD_LENGTHS;

  ngOnInit(): void {
    this.setupProductSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Setup product search filter
   */
  private setupProductSearch(): void {
    this.productSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        this.filterProducts(searchTerm || '');
      });
  }

  /**
   * Filter products based on search term
   */
  private filterProducts(searchTerm: string): void {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredProducts.set(this.availableProducts());
      return;
    }

    const filtered = this.availableProducts().filter(product =>
      product.productCode.toLowerCase().includes(term) ||
      product.productDescription.toLowerCase().includes(term)
    );
    this.filteredProducts.set(filtered);
  }

  /**
   * Handle search from search-bar component
   * Filters data on UI (client-side filtering)
   */
  onSearch(searchTerm: string): void {
    const term = searchTerm.toLowerCase().trim();

    if (!term) {
      // No search term - show all holds
      this.dataSource.data = this.componentHolds();
      return;
    }

    // Filter holds based on search term (client-side filtering)
    const filtered = this.componentHolds().filter(hold =>
      hold.interdictionCode.toLowerCase().includes(term) ||
      hold.interdictionDescription.toLowerCase().includes(term)
    );

    this.dataSource.data = filtered;
  }

  /**
   * Handle unit validation success
   * Two-step process:
   * 1. Validate unit and get collection date
   * 2. Get products with holds for that unit
   */
  onUnitValidated(event: UnitValidationResponse): void {
    this.loggingService.debug('Unit validated', event);
    this.isValidatingUnit.set(true);

    // Step 1: Validate unit
    this.apiService.validateUnit(event.parsedUnitId)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (unitData) => {
          this.loggingService.debug('Unit validated, fetching products with holds', unitData);

          // Step 2: Get products with holds for this unit
          this.apiService.getProductsWithHolds(unitData.unitId, unitData.collectionDate)
            .pipe(
              takeUntil(this.destroy$),
              finalize(() => this.isValidatingUnit.set(false))
            )
            .subscribe({
              next: (products) => {
                this.formState.update(state => ({
                  ...state,
                  unitId: unitData.unitId,
                  collectionDate: unitData.collectionDate,
                  chapterId: unitData.chapterId || state.chapterId,
                  isUnitValidated: true,
                  productCode: '',
                  productDescription: '',
                  isProductValidated: false
                }));

                this.availableProducts.set(products);
                this.filteredProducts.set(products);
                this.componentHolds.set([]);
                this.selectedHolds.set([]);
                this.dataSource.data = [];
                this.hasRetrievedData.set(false); // Reset to hide table section until RETRIEVE is clicked

                this.loggingService.debug('Products with holds retrieved', { count: products.length });

                if (products.length === 0) {
                  this.snackbarService.showInfo('No products with holds found for this unit');
                }
              },
              error: (error) => {
                this.loggingService.error('Failed to get products with holds', error);
                this.snackbarService.showError('Failed to retrieve products for this unit');
                this.isValidatingUnit.set(false);
              }
            });
        },
        error: (error) => {
          this.loggingService.error('Unit validation failed', error);

          // Extract error message from API response if available
          const errorMessage = error?.error?.message || error?.message || 'Failed to validate unit';
          const errorCode = error?.error?.errorCode;

          // Show error with code if available
          const displayMessage = errorCode
            ? `${errorCode}: ${errorMessage}`
            : errorMessage;

          this.snackbarService.showError(displayMessage);

          this.isValidatingUnit.set(false);
          this.clearForm();
        }
      });
  }

  /**
   * Handle unit field cleared
   */
  onUnitCleared(): void {
    this.clearForm();
  }

  /**
   * Handle product selection change
   */
  onProductChange(productCode: string): void {
    const product = this.availableProducts().find(p => p.productCode === productCode);
    if (product) {
      this.productCodeControl.setValue(product.productCode);
      this.formState.update(state => ({
        ...state,
        productCode: product.productCode,
        productDescription: product.productDescription,
        isProductValidated: true
      }));
    }
  }

  /**
   * Format collection date for display (DD-MON-YYYY uppercase)
   */
  formatCollectionDate(): string {
    const date = this.formState().collectionDate;
    if (!date) return '';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Retrieve holds for selected product
   */
  onRetrieve(): void {
    if (!this.formState().isUnitValidated || !this.formState().isProductValidated) {
      this.snackbarService.showError('Please select a Unit ID and Product Code');
      return;
    }

    const state = this.formState();
    this.hasRetrievedData.set(true); // Set this first so table section shows
    this.isRetrievingHolds.set(true);
    this.isLoadingHolds.set(true);

    this.apiService.retrieveComponentHolds({
      unitId: state.unitId,
      collectionDate: state.collectionDate,
      chapterId: state.chapterId,
      productCode: state.productCode,
      searchKeyword: this.searchKeyword || undefined
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isRetrievingHolds.set(false);
          this.isLoadingHolds.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          this.loggingService.debug('GetHolds response received:', response);

          const holds: ComponentHoldRow[] = response.holds.map(hold => ({
            unitId: response.unitId,
            collectionDate: response.collectionDate,
            chapterId: response.chapterId,
            productCode: response.productCode,
            interdictionCode: hold.interdictionCode,
            interdictionDescription: hold.interdictionDescription,
            selected: false
          }));

          this.loggingService.debug('Mapped holds:', holds);

          this.componentHolds.set(holds);
          this.dataSource.data = holds;
          this.hasRetrievedData.set(true);

          this.loggingService.debug('componentHolds after set:', this.componentHolds());
          this.loggingService.debug('dataSource.data after set:', this.dataSource.data);
          this.loggingService.debug('holdsRetrieved():', this.holdsRetrieved());

          if (holds.length === 0) {
            // Don't show snackbar for empty results - show empty state instead
            this.loggingService.debug('No holds found for this component');
          } else {
            this.loggingService.debug(`Retrieved ${holds.length} hold(s)`);
          }
        },
        error: (error) => {
          this.loggingService.error('Failed to retrieve holds', error);

          // Extract error message from API response if available
          const errorMessage = error?.error?.message || error?.message || 'Failed to retrieve component holds';
          const errorCode = error?.error?.errorCode;

          // If error code is 0064 (no holds found), show empty state instead of error
          if (errorCode === '0064') {
            this.componentHolds.set([]);
            this.dataSource.data = [];
            this.hasRetrievedData.set(true);
            this.loggingService.debug('No holds found - showing empty state');
          } else {
            // Show error for other errors
            const displayMessage = errorCode
              ? `${errorCode}: ${errorMessage}`
              : errorMessage;

            this.snackbarService.showError(displayMessage);
          }
        }
      });
  }

  /**
   * Handle selection change from data table
   */
  onSelectionChange(selectedRows: ComponentHoldRow[]): void {
    // Update the selectedHolds signal
    this.selectedHolds.set(selectedRows);

    // Update the selected state in componentHolds and dataSource for consistency
    const selectedCodes = new Set(selectedRows.map(r => r.interdictionCode));

    this.componentHolds.update(holds =>
      holds.map(h => ({
        ...h,
        selected: selectedCodes.has(h.interdictionCode)
      }))
    );

    this.dataSource.data = this.dataSource.data.map(h => ({
      ...h,
      selected: selectedCodes.has(h.interdictionCode)
    }));
  }


  /**
   * Clear all selections
   */
  onClearAll(): void {
    // Reset form state (this will automatically update computed signals like unitFound)
    this.formState.set({
      unitId: '',
      collectionDate: '',
      chapterId: '',
      productCode: '',
      productDescription: '',
      isUnitValidated: false,
      isProductValidated: false
    });

    // Reset writable signals
    this.isValidatingUnit.set(false);
    this.isRetrievingHolds.set(false);
    this.selectedHolds.set([]);
    this.componentHolds.set([]); // This will automatically update holdsRetrieved computed signal
    this.availableProducts.set([]);
    this.filteredProducts.set([]);
    this.hasRetrievedData.set(false); // Reset to hide table section until RETRIEVE is clicked

    // Clear data source
    this.dataSource.data = [];

    // Clear product controls
    this.productCodeControl.reset();
    this.productSearchControl.setValue('');

    // Clear Unit ID field component and return focus
    if (this.unitIdField) {
      this.unitIdField.clear();
      setTimeout(() => {
        const unitInput = document.querySelector<HTMLElement>('app-unit-id-field input');
        unitInput?.focus();
      }, 100);
    }

    this.loggingService.debug('Form and selections cleared');
  }

  /**
   * Release selected holds - show confirmation dialog first
   */
  onRelease(): void {
    if (!this.hasSelectedHolds()) {
      this.snackbarService.showError('Please select at least one hold to release');
      return;
    }

    const selectedHolds = this.componentHolds().filter(hold => hold.selected);
    const holdDescriptions = selectedHolds.map(h => h.interdictionDescription).join(', ');

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '400px',
      data: {
        title: 'Release Component Hold ?',
        message: `Do you want to release Component Hold`,
        confirmText: 'YES, RELEASE',
        cancelText: 'NO'
      } as ConfirmActionDialogData
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.releaseHolds(selectedHolds);
      }
    });
  }

  /**
   * Execute release holds API call
   */
  private releaseHolds(selectedHolds: ComponentHoldRow[]): void {
    const state = this.formState();
    this.isReleasingHolds.set(true);

    this.apiService.releaseHolds({
      unitId: state.unitId,
      collectionDate: state.collectionDate,
      chapterId: state.chapterId,
      productCode: state.productCode,
      interdictionCodes: selectedHolds.map(h => h.interdictionCode)
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isReleasingHolds.set(false))
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Show success message matching Figma design
            const holdDesc = selectedHolds[0].interdictionDescription;
            this.snackbarService.showSuccess(
              `${holdDesc} Component has been released`,
              'DISMISS'
            );

            // Reset the entire form after successful release
            this.onClearAll();
          } else {
            // Show error message when success is false
            this.snackbarService.showError(response.message);
          }
        },
        error: (error) => {
          this.loggingService.error('Failed to release holds', error);

          // Extract error code and message
          // Error code can be on error object itself (from API service) or nested in error.error (from HTTP error)
          const errorCode = error?.errorCode || error?.error?.errorCode;
          const errorMessage = error?.message || error?.error?.message || 'Failed to release component holds';

          // Show error with code if available (format: "ErrorCode: Message")
          const displayMessage = errorCode
            ? `${errorCode}: ${errorMessage}`
            : errorMessage;

          this.snackbarService.showError(displayMessage);
        }
      });
  }

  /**
   * Clear the entire form
   */
  clearForm(): void {
    this.formState.set({
      unitId: '',
      collectionDate: '',
      chapterId: '',
      productCode: '',
      productDescription: '',
      isUnitValidated: false,
      isProductValidated: false
    });
    this.availableProducts.set([]);
    this.filteredProducts.set([]);
    this.componentHolds.set([]);
    this.selectedHolds.set([]);
    this.dataSource.data = [];
    this.productCodeControl.reset();
    this.productSearchControl.setValue('');
  }
}
