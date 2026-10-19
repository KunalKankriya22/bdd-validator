import { Component, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import { ProductCombinationsApiService } from './services/product-combinations-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import {
  ProductCombinationTableModel,
  ProductCombinationDto,
  ProductTypeDetailDto,
  ProductCombinationQueryDto,
  getErrorMessage
} from './models/product-combinations.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { AddProductCombinationComponent } from './components/add-product-combination/add-product-combination';
import { DeleteConfirmationDialog } from './components/delete-confirmation-dialog/delete-confirmation-dialog';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ROUTES } from '@core/constants/route.constants';

@Component({
  selector: 'app-product-combinations',
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
    PageHeaderWithBreadcrumb,
    NgxMatSelectSearchModule
  ],
  templateUrl: './product-combinations.component.html',
  styleUrls: ['./product-combinations.component.scss']
})
export class ProductCombinationsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Dialog state
  isDialogOpen = false;
  private isDeleteDialogOpen = false;

  // Header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: 'Configure Product Type Combinations',
    subtitle: 'Define and manage valid product combinations used during blood product processing and distribution.',
    actions: [
      {
        label: 'ADD NEW BAG PRODUCT COMBINATIONS',
        icon: 'add',
        color: 'primary',
        onClick: () => this.openAddDialog()
      }
    ]
  };

  // Filter options
  bagCodeOptions: string[] = [];
  matrixProductTypes: ProductTypeDetailDto[] = [];

  // Form controls
  bagCodeControl = new FormControl('');
  productTypeControl = new FormControl('');

  // Search controls
  bagCodeSearchControl = new FormControl('');
  productTypeSearchControl = new FormControl('');

  // Filtered options
  filteredBagCodeOptions: string[] = [];
  filteredMatrixProductTypes: ProductTypeDetailDto[] = [];

  // Computed property for description based on selected product type
  get selectedProductTypeDescription(): string {
    const value = this.productTypeControl.value;
    if (!value) {
      return '';
    }
    const selectedType = this.matrixProductTypes.find(
      pt => pt.productTypeCode === value
    );
    return selectedType?.productTypeDesc || '';
  }

  /**
   * Get display text for product type dropdown using FormControl value
   */
  getProductTypeDisplayForControl(): string {
    const value = this.productTypeControl.value;
    if (value === null || value === undefined || value === '') {
      return '';
    }
    const selectedType = this.matrixProductTypes.find(
      pt => pt.productTypeCode === value
    );
    if (selectedType && selectedType.productTypeDesc) {
      return `${selectedType.productTypeCode} - ${selectedType.productTypeDesc}`;
    }
    // Fallback: just show the code if description not available
    return value;
  }

  // Data
  dataSource: ProductCombinationTableModel[] = [];
  activeProductTypes: ProductTypeDetailDto[] = []; // For Add dialog only
  selectedItem: ProductCombinationTableModel | null = null; // Selected row for detail view

  // State
  isLoading = false;
  hasError = false;
  errorMessage = '';
  hasSearched = false; // Track if user has clicked RETRIEVE

  constructor(
    private apiService: ProductCombinationsApiService,
    private snackbar: SnackbarService,
    private logging: LoggingService,
    private dialog: MatDialog,
    private headerService: HeaderService,
    private pageHeaderService: PageHeaderService
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
  }

  ngOnInit(): void {
    this.loadActiveProductTypes(); // For Add dialog
    this.loadBagCodes(); // For filter dropdown
    this.loadMatrixProductTypes(); // For filter dropdown
    // Don't load data on init - wait for user to click RETRIEVE
    this.setupSearchFilters();
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reset state on chapter change
        this.bagCodeControl.reset();
        this.productTypeControl.reset();
        this.dataSource = [];
        this.selectedItem = null;
        this.hasSearched = false;
        this.isLoading = false;
        this.hasError = false;
        this.errorMessage = '';
      });
  }

  /**
   * Load bag codes for filter dropdown
   */
  loadBagCodes(): void {
    this.apiService.getBagCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.bagCodeOptions = codes;
          this.filteredBagCodeOptions = codes.slice();
        },
        error: (error) => {
          this.logging.error('Failed to load bag codes', error);
        }
      });
  }

  /**
   * Load matrix product types for filter dropdown
   */
  loadMatrixProductTypes(): void {
    this.apiService.getMatrixProductTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.matrixProductTypes = types;
          this.filteredMatrixProductTypes = types.slice();
        },
        error: (error) => {
          this.logging.error('Failed to load matrix product types', error);
        }
      });
  }

  private setupSearchFilters(): void {
    // Initialize filtered arrays
    this.filteredBagCodeOptions = this.bagCodeOptions.slice();
    this.filteredMatrixProductTypes = this.matrixProductTypes.slice();

    // Bag code search
    this.bagCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterBagCodes();
      });

    // Product type search
    this.productTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterProductTypes();
      });
  }

  private filterBagCodes(): void {
    const search = this.bagCodeSearchControl.value?.toLowerCase() || '';
    if (!search) {
      this.filteredBagCodeOptions = this.bagCodeOptions.slice();
      return;
    }
    this.filteredBagCodeOptions = this.bagCodeOptions.filter(code =>
      code.toLowerCase().includes(search)
    );
  }

  private filterProductTypes(): void {
    const search = this.productTypeSearchControl.value?.toLowerCase() || '';
    if (!search) {
      this.filteredMatrixProductTypes = this.matrixProductTypes.slice();
      return;
    }
    this.filteredMatrixProductTypes = this.matrixProductTypes.filter(type =>
      type.productTypeCode?.toLowerCase().includes(search) ||
      type.productTypeDesc?.toLowerCase().includes(search)
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load active product types for dropdown
   */
  loadActiveProductTypes(): void {
    this.apiService.getActiveProductTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.activeProductTypes = types;
        },
        error: (error) => {
          this.logging.error('Failed to load product types', error);
        }
      });
  }

  /**
   * Load data with current filters (no pagination - load all)
   */
  loadData(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    const filters: ProductCombinationQueryDto = {
      bagCode: this.bagCodeControl.value || null,
      productType: this.productTypeControl.value || null
    };

    // Load all records - use large page size
    this.apiService
      .searchProductCombinations(10000, 0, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.dataSource = this.transformData(response.data || []);

          // Auto-select first row after data loads
          if (this.dataSource.length > 0) {
            this.selectedItem = this.dataSource[0];
          }
        },
        error: (error) => {
          this.hasError = true;
          this.isLoading = false;
          this.dataSource = [];
        }
      });
  }

  /**
   * Transform API response to table model
   */
  private transformData(data: ProductCombinationDto[]): ProductCombinationTableModel[] {
    return data.map(item => {
      return {
        bagCode: item.bagCode,
        setId: item.setId,
        bagCount: item.productTypes.length, // Count of product types = bag count
        productTypesDisplay: item.productTypes.map(pt => `${pt.productType} - ${pt.productTypeDesc || ''}`).join(', '),
        productTypes: item.productTypes.map(pt => {
          return {
            productTypeCode: pt.productType,
            productTypeDesc: pt.productTypeDesc || ''
          };
        })
      };
    });
  }

  /**
   * Handle RETRIEVE button click
   */
  onRetrieve(): void {
    if (!this.isRetrieveEnabled()) {
      return;
    }
    this.hasSearched = true;
    this.selectedItem = null; // Clear selection when retrieving new data
    this.loadData();
  }

  /**
   * Check if RETRIEVE button should be enabled (always enabled)
   */
  isRetrieveEnabled(): boolean {
    return true;
  }

  /**
   * Check if any filters are applied
   */
  get hasFiltersApplied(): boolean {
    return (this.bagCodeControl.value !== null && this.bagCodeControl.value !== '') ||
           (this.productTypeControl.value !== null && this.productTypeControl.value !== '');
  }

  /**
   * Handle CLEAR ALL button click
   */
  onClearAll(): void {
    this.bagCodeControl.reset();
    this.productTypeControl.reset();
    this.dataSource = [];
    this.selectedItem = null;
    this.hasSearched = false;
  }

  /**
   * Get total number of products for selected item or all
   */
  getTotalProducts(): number {
    if (this.selectedItem) {
      return this.selectedItem.productTypes.length;
    }
    return this.dataSource.reduce((total, item) => total + item.productTypes.length, 0);
  }

  /**
   * Select a bag code set row to view its products
   */
  selectItem(item: ProductCombinationTableModel): void {
    // Always select the item, don't toggle on double-click
    this.selectedItem = item;
  }

  /**
   * Check if a row is selected
   */
  isSelected(item: ProductCombinationTableModel): boolean {
    return this.selectedItem?.setId === item.setId;
  }

  /**
   * Open Add New side panel
   */
  openAddDialog(): void {
    this.isDialogOpen = true;

    const dialogRef = this.dialog.open(AddProductCombinationComponent, {
      width: '600px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: true,
      position: { right: '0', top: '64px' },
      panelClass: 'add-product-combination-drawer',
      hasBackdrop: false,
      autoFocus: false
    });

    dialogRef.componentInstance.activeProductTypes = this.activeProductTypes;

    dialogRef.afterClosed().subscribe((result) => {
      this.isDialogOpen = false;
      if (result) {
        this.loadData();
      }
    });
  }

  /**
   * Delete selected product combination
   */
  onDelete(setId?: number): void {
    // Prevent multiple dialogs from opening
    if (this.isDeleteDialogOpen) {
      return;
    }

    // Use selected item's setId if not provided
    const idToDelete = setId ?? this.selectedItem?.setId;

    if (!idToDelete) {
      this.snackbar.showError('Please select a product combination to delete');
      return;
    }

    this.isDeleteDialogOpen = true;

    const dialogRef = this.dialog.open(DeleteConfirmationDialog, {
      width: '420px',
      maxWidth: '90vw',
      disableClose: true,
      autoFocus: false,
      panelClass: 'delete-confirmation-dialog',
      data: {
        setId: idToDelete
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      this.isDeleteDialogOpen = false;
      if (confirmed) {
        this.deleteProductCombination(idToDelete);
      }
    });
  }

  private deleteProductCombination(setId: number): void {
    this.apiService.deleteProductCombination(setId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackbar.showSuccess('Product combination deleted successfully');
          this.loadData();
        },
        error: (error) => {
          const errorCode = error?.error?.errorResponse?.errorCode || error?.error?.errorCode;
          const message = errorCode ? getErrorMessage(errorCode) : 'Failed to delete product combination';
          this.snackbar.showError(message);
          this.logging.error('Failed to delete product combination', error);
        }
      });
  }
}
