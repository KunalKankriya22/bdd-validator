import { Component, OnInit, OnDestroy, signal, computed, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, NgModel } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule, MatSelect } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, finalize } from 'rxjs';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field';
import type { UnitIdPostValidateEvent, UnitValidationResponse } from '@shared/components/unit-id-field';

import { ComponentInterdictionApiService } from './services/component-interdiction-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import {
  ComponentInterdictionTableRow,
  ComponentInterdictionFormState,
  InterdictionOption,
  BARCODE_SCHEMES,
  FIELD_LENGTHS,
  getErrorMessage
} from './models/component-interdiction.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ROUTES } from '@core/constants/route.constants';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';

@Component({
  selector: 'app-enter-component-interdiction',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
    DataTable
  ],
  templateUrl: './enter-component-interdiction.html',
  styleUrls: ['./enter-component-interdiction.scss']
})
export class EnterComponentInterdictionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;
  @ViewChild('interdictionSelect') interdictionSelect!: MatSelect;
  @ViewChild('interdictionModel') interdictionModel!: NgModel;

  // Signals for reactive state management
  formState = signal<ComponentInterdictionFormState>({
    scannedUnitId: '',
    scannedProductCode: '',
    unitId: '',
    collectionDate: '',
    chapterId: '',
    productCode: '',
    productDescription: '',
    interdictionCode: '',
    interdictionDescription: '',
    interdictionType: '',
    barcodeScheme: BARCODE_SCHEMES.CODABAR, // Default to Codabar
    isUnitValidated: false,
    isProductValidated: false,
    isInterdictionValidated: false
  });

  // Loading states
  isValidatingUnit = signal(false);
  isValidatingProduct = signal(false);
  isLoadingInterdictions = signal(false);
  isSubmitting = signal(false);

  // Data
  validProducts = signal<Array<{productCode: string; productDescription: string}>>([]);
  filteredProducts = signal<Array<{productCode: string; productDescription: string}>>([]);
  productSearchControl = new FormControl('');
  validInterdictions = signal<InterdictionOption[]>([]);
  filteredInterdictions = signal<InterdictionOption[]>([]);
  interdictionSearchControl = new FormControl('');
  interdictionCodeControl = new FormControl('', []);
  dataSource = signal<ComponentInterdictionTableRow[]>([]);

  // Table configuration
  tableConfig: DataTableConfig<ComponentInterdictionTableRow> = {
    columns: [
      { key: 'unitId', header: 'Unit ID', sortable: false, width: '220px', valueFormatter: (v: string, row: ComponentInterdictionTableRow) => row.checkDigit ? `${v}-${row.checkDigit}` : v },
      { key: 'productCode', header: 'Product Code', sortable: false, width: '140px' },
      { key: 'productDescription', header: 'Product Description', sortable: false },
      { key: 'interdiction', header: 'Interdiction', sortable: false, width: '120px' },
      { key: 'interdictionDescription', header: 'Interdiction Description', sortable: false, width: '220px' },
      { key: 'type', header: 'Type', sortable: false, width: '100px' },
    ],
    showPagination: false,
    sortConfig: {
      column: 'unitId',
      direction: 'default',
    },
    stickyHeader: true,
    noDataIcon: 'search',
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Use the fields to get started.',
  };

  // Computed signals
  isFormReady = computed(() => {
    const state = this.formState();
    return state.isUnitValidated && state.isProductValidated && state.isInterdictionValidated;
  });

  canSubmit = computed(() => {
    return this.isFormReady() && !this.isSubmitting();
  });

  isFormDirty = computed(() => {
    const state = this.formState();
    return state.isUnitValidated || !!state.productCode || !!state.interdictionCode;
  });

  // Field length constants for template
  readonly FIELD_LENGTHS = FIELD_LENGTHS;

  // Header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  constructor(
    private apiService: ComponentInterdictionApiService,
    private snackbar: SnackbarService,
    private logging: LoggingService,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService
  ) {
    // Update header config from menu-items API response
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: ROUTES.HOME },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });

    // Setup product search filter
    this.productSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        const allProducts = this.validProducts();
        this.filteredProducts.set(
          allProducts.filter(product =>
            product.productCode.toLowerCase().includes(term) ||
            product.productDescription.toLowerCase().includes(term)
          )
        );
      });

    // Setup interdiction search filter
    this.interdictionSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        const allInterdictions = this.validInterdictions();
        this.filteredInterdictions.set(
          allInterdictions.filter(option =>
            option.code.toLowerCase().includes(term) ||
            option.description.toLowerCase().includes(term)
          )
        );
      });
  }

  ngOnInit(): void {
    this.subscribeToChapterChanges();
  }

  /**
   * Subscribe to chapter changes and reset the form
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.formState.set({
          scannedUnitId: '',
          scannedProductCode: '',
          unitId: '',
          collectionDate: '',
          chapterId: '',
          productCode: '',
          productDescription: '',
          interdictionCode: '',
          interdictionDescription: '',
          interdictionType: '',
          barcodeScheme: BARCODE_SCHEMES.CODABAR,
          isUnitValidated: false,
          isProductValidated: false,
          isInterdictionValidated: false
        });

        // Clear search controls
        this.productSearchControl.setValue('', { emitEvent: false });
        this.interdictionSearchControl.setValue('', { emitEvent: false });

        // Clear data lists
        this.validProducts.set([]);
        this.filteredProducts.set([]);
        this.validInterdictions.set([]);
        this.filteredInterdictions.set([]);
        this.dataSource.set([]);

        // Reset loading states
        this.isValidatingUnit.set(false);
        this.isValidatingProduct.set(false);
        this.isLoadingInterdictions.set(false);
        this.isSubmitting.set(false);

        // Clear unit ID field if it exists
        if (this.unitIdField) {
          this.unitIdField.clear();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle Unit ID post-validation event from UnitIdFieldComponent
   * This is triggered after the shared component validates the unit format
   */
  onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    const unitId = event.data.parsedUnitId;
    const codeScheme = event.data.codeScheme;

    this.isValidatingUnit.set(true);

    this.apiService.validateUnit({
      scannedValue: unitId,
      barcodeScheme: codeScheme
    })
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isValidatingUnit.set(false))
    )
    .subscribe({
      next: (response) => {
        this.formState.update(s => ({
          ...s,
          scannedUnitId: unitId,
          unitId: response.unitId,
          collectionDate: response.collectionDate,
          chapterId: response.chapterId,
          barcodeScheme: codeScheme,
          isUnitValidated: true,
          scannedProductCode: '',
          productCode: '',
          productDescription: '',
          interdictionCode: '',
          interdictionDescription: '',
          interdictionType: '',
          isProductValidated: false,
          isInterdictionValidated: false
        }));

        this.validInterdictions.set([]);
        this.logging.log('Unit validated successfully', response);

        // Load available products for this unit
        this.loadValidProducts();

        event.confirm(); // Confirm validation success to UnitIdFieldComponent
      },
      error: (error) => {
        const errorCode = error?.error?.errorCode;
        const message = errorCode ? getErrorMessage(errorCode) : error?.error?.message || 'Unit validation failed';
        event.reject(message); // Reject and show error in UnitIdFieldComponent
        this.logging.error('Unit validation error', error);

        this.formState.update(s => ({
          ...s,
          unitId: '',
          collectionDate: '',
          chapterId: '',
          isUnitValidated: false
        }));
      }
    });
  }

  /**
   * Handle unit validated event (called after successful validation)
   */
  onUnitValidated(_data: UnitValidationResponse): void {
    // Optional: Additional logic after unit is validated
  }

  /**
   * Handle unit cleared event (called when unit field is cleared)
   */
  onUnitCleared(): void {
    this.resetForm();
  }


  /**
   * Load valid products for the validated unit
   */
  private loadValidProducts(): void {
    const state = this.formState();

    if (!state.unitId || !state.collectionDate) {
      return;
    }

    this.isValidatingProduct.set(true);

    this.apiService.getValidProducts(state.unitId, state.collectionDate, state.barcodeScheme)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isValidatingProduct.set(false))
      )
      .subscribe({
        next: (products: Array<{productCode: string; productDescription: string}>) => {
          this.validProducts.set(products);
          this.filteredProducts.set(products);
          this.productSearchControl.setValue('');
          this.logging.log(`Loaded ${products.length} product codes`);

          if (products.length === 0) {
            this.snackbar.showInfo('No products available for this unit');
          }
        },
        error: (error: any) => {
          this.snackbar.showError('Failed to load product codes');
          this.logging.error('Load products error', error);
          this.validProducts.set([]);
          this.filteredProducts.set([]);
        }
      });
  }

  /**
   * Handle Product Code selection change
   */
  onProductCodeChange(selectedCode: string): void {
    const products = this.validProducts();
    const selected = products.find(p => p.productCode === selectedCode);

    if (selected) {
      this.formState.update(s => ({
        ...s,
        productCode: selected.productCode,
        productDescription: selected.productDescription,
        isProductValidated: true,
        // Reset interdiction when product changes
        interdictionCode: '',
        interdictionDescription: '',
        interdictionType: '',
        isInterdictionValidated: false
      }));

      // Load valid interdictions for this component
      this.loadValidInterdictions();
    } else {
      this.formState.update(s => ({
        ...s,
        productCode: '',
        productDescription: '',
        isProductValidated: false
      }));
    }
  }

  /**
   * Load valid interdiction codes for the validated component
   */
  private loadValidInterdictions(): void {
    const state = this.formState();

    this.isLoadingInterdictions.set(true);

    this.apiService.getValidInterdictions(
      state.unitId,
      state.collectionDate,
      state.productCode
    )
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoadingInterdictions.set(false))
    )
    .subscribe({
      next: (interdictions) => {
        this.validInterdictions.set(interdictions);
        this.filteredInterdictions.set(interdictions);
        this.interdictionSearchControl.setValue('');
        this.logging.log(`Loaded ${interdictions.length} valid interdictions`);

        if (interdictions.length === 0) {
          this.snackbar.showInfo('No valid interdictions available for this component');
        }
      },
      error: (error) => {
        this.snackbar.showError('Failed to load interdiction codes');
        this.logging.error('Load interdictions error', error);
        this.validInterdictions.set([]);
        this.filteredInterdictions.set([]);
      }
    });
  }

  /**
   * Load existing interdictions for the validated unit
   * Displays all current interdictions in the table
   */
  private loadExistingInterdictions(): void {
    const state = this.formState();

    if (!state.unitId) {
      return;
    }

    this.apiService.getInterdictionsByUnit(state.unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (interdictions) => {
          // Convert to table row format
          const tableRows: ComponentInterdictionTableRow[] = interdictions.map(item => ({
            unitId: item.unitId,
            checkDigit: item.checkDigit || '',
            productCode: item.productCode,
            productDescription: item.productDescription,
            interdiction: item.interdictionCode,
            interdictionDescription: item.interdictionDescription,
            type: item.interdictionType
          }));

          this.dataSource.set(tableRows);
          this.logging.log(`Loaded ${interdictions.length} existing interdictions for unit ${state.unitId}`);
        },
        error: (error) => {
          this.logging.error('Load existing interdictions error', error);
          this.dataSource.set([]);
        }
      });
  }

  /**
   * Handle interdiction code selection
   */
  onInterdictionCodeChange(selectedCode: string): void {
    const interdictions = this.validInterdictions();
    const selected = interdictions.find(i => i.code === selectedCode);

    if (selected) {
      this.formState.update(s => ({
        ...s,
        interdictionCode: selected.code,
        interdictionDescription: selected.description,
        interdictionType: selected.type,
        isInterdictionValidated: true
      }));

      this.loadExistingInterdictions();
    } else {
      this.formState.update(s => ({
        ...s,
        interdictionCode: '',
        interdictionDescription: '',
        interdictionType: '',
        isInterdictionValidated: false
      }));
    }
  }

  /**
   * Handle ENTER key on interdiction code field
   * Auto-save when user presses ENTER after selecting interdiction
   */
  onInterdictionKeyEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (this.canSubmit()) {
      keyboardEvent.preventDefault();
      this.interdictionSelect?.close();
      this.onSubmit();
    }
  }

  /**
   * Handle TAB key on interdiction code field
   * Auto-save when user presses TAB after selecting interdiction
   */
  onInterdictionKeyTab(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (this.canSubmit()) {
      keyboardEvent.preventDefault();
      this.interdictionSelect?.close();
      this.onSubmit();
    }
  }

  /**
   * Submit the form to create a new component interdiction
   */
  onSubmit(): void {
    if (!this.canSubmit()) {
      this.snackbar.showError('Please complete all required fields');
      return;
    }

    const state = this.formState();
    this.isSubmitting.set(true);

    this.apiService.createInterdiction({
      unitId: state.unitId,
      collectionDate: state.collectionDate,
      productCode: state.productCode,
      interdictionCode: state.interdictionCode
    })
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isSubmitting.set(false))
    )
    .subscribe({
      next: (response) => {
        // Success message
        this.snackbar.showSuccess('1 Entry saved');
        this.logging.log('Interdiction created successfully', response);

        // Add the newly saved record to the table
        const newRow: ComponentInterdictionTableRow = {
          unitId: response.unitId,
          checkDigit: response.checkDigit || '',
          productCode: response.productCode,
          productDescription: response.productDescription,
          interdiction: response.interdictionCode,
          interdictionDescription: response.interdictionDescription,
          type: response.interdictionType
        };

        // Add new row to existing data
        const currentData = this.dataSource();
        this.dataSource.set([...currentData, newRow]);

        // Only clear interdiction code fields (keep unit and product for next entry)
        this.formState.update(s => ({
          ...s,
          interdictionCode: '',
          interdictionDescription: '',
          interdictionType: '',
          isInterdictionValidated: false
        }));

        // Clear interdiction search and reload interdictions
        this.interdictionSearchControl.setValue('', { emitEvent: false });

        // Reset the ngModel validation state to prevent showing "required" error
        if (this.interdictionModel) {
          this.interdictionModel.control.markAsUntouched();
          this.interdictionModel.control.markAsPristine();
        }

        // Reload valid interdictions for the same product
        this.loadValidInterdictions();
      },
      error: (error) => {
        const errorCode = error?.error?.errorCode;
        const message = errorCode ? getErrorMessage(errorCode) : error?.error?.message || 'Failed to create interdiction';
        this.snackbar.showError(message);
        this.logging.error('Create interdiction error', error);
      }
    });
  }

  /**
   * Clear all form fields and reset state
   */
  onClearAll(): void {
    this.resetForm();

    // Clear the Unit ID field
    if (this.unitIdField) {
      this.unitIdField.clear();
    }
  }

  /**
   * Reset form to initial state
   */
  private resetForm(): void {
    this.formState.set({
      scannedUnitId: '',
      scannedProductCode: '',
      unitId: '',
      collectionDate: '',
      chapterId: '',
      productCode: '',
      productDescription: '',
      interdictionCode: '',
      interdictionDescription: '',
      interdictionType: '',
      barcodeScheme: BARCODE_SCHEMES.CODABAR,
      isUnitValidated: false,
      isProductValidated: false,
      isInterdictionValidated: false
    });

    this.validProducts.set([]);
    this.filteredProducts.set([]);
    this.productSearchControl.setValue('', { emitEvent: false });
    this.validInterdictions.set([]);
    this.filteredInterdictions.set([]);
    this.interdictionSearchControl.setValue('', { emitEvent: false });
    this.dataSource.set([]);
  }
}
