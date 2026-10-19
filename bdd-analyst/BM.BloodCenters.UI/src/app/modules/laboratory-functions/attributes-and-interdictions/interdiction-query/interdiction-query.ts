import { Component, OnInit, OnDestroy, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, ReplaySubject } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { InterdictionQueryApiService } from './services/interdiction-query-api.service';
import {
  InterdictionQueryRequest,
  InterdictionQueryResponse,
  UnitInterdiction,
  ComponentInterdiction,
  UnitAttribute,
  ComponentAttribute,
  ProductCodeOption,
  UnitInterdictionTableRow,
  ComponentInterdictionTableRow
} from './models/interdiction-query.model';
import { ViewUnitAttributeModal } from './components/view-unit-attribute-modal';
import { ViewComponentAttributeModal } from './components/view-component-attribute-modal';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent,
  TableSortEvent
} from '@shared/interfaces/data-table.interface';
import moment from 'moment';

@Component({
  selector: 'app-interdiction-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTabsModule,
    MatTooltipModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
    NgxMatSelectSearchModule,
    SearchBar
  ],
  templateUrl: './interdiction-query.html',
  styleUrls: ['./interdiction-query.scss']
})
export class InterdictionQueryComponent implements OnInit, OnDestroy {

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  form: FormGroup;
  productCodes: ProductCodeOption[] = [];

  // Search control for product dropdown
  productSearchCtrl = new FormControl('');
  filteredProducts$ = new ReplaySubject<ProductCodeOption[]>(1);

  hasData = false;

  // Unit Interdictions
  unitInterdictions: UnitInterdiction[] = [];
  unitInterdictionsFiltered: UnitInterdictionTableRow[] = [];
  unitInterdictionsSearchTerm = '';
  unitInterdictionsSearchConfig: SearchBarConfig = {
    placeholder: 'Search by Code or Description',
    minLength: 2,
    debounceTime: 300,
    searchOnEnterOnly: true
  };
  unitInterdictionsTableConfig: DataTableConfig<UnitInterdictionTableRow> = {
    columns: [],
    rowActions: [],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    sortConfig: {
      column: 'code',
      direction: 'D' // Use 'D' to show down arrow for ascending
    },
    stickyHeader: true,
    stickyActionsColumn: false,
    emptyMessage: 'No Unit Interdictions Available To Display',
    noDataIcon: 'edit',
    loadingMessage: 'Loading data...',
    showPagination: false
  };
  // Component Interdictions
  componentInterdictions: ComponentInterdiction[] = [];
  componentInterdictionsFiltered: ComponentInterdictionTableRow[] = [];
  componentInterdictionsSearchTerm = '';
  componentInterdictionsSearchConfig: SearchBarConfig = {
    placeholder: 'Search by Code or Description',
    minLength: 2,
    debounceTime: 300,
    searchOnEnterOnly: true
  };
  componentInterdictionsTableConfig: DataTableConfig<ComponentInterdictionTableRow> = {
    columns: [],
    rowActions: [],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    sortConfig: {
      column: 'code',
      direction: 'D' // Use 'D' to show down arrow for ascending
    },
    stickyHeader: true,
    stickyActionsColumn: false,
    emptyMessage: 'No Component Interdictions Available To Display',
    noDataIcon: 'edit',
    loadingMessage: 'Loading data...',
    showPagination: false
  };

  // Unit Attributes
  unitAttributes: UnitAttribute[] = [];

  // Component Attributes
  componentAttributes: ComponentAttribute[] = [];

  isLoading = false;
  hasError = false;
  isUnitIdValid = false; // Track if unit ID is valid to enable/disable buttons

  private destroy$ = new Subject<void>();

  private currentUnitId: string = '';
  private currentCollDate: string = '';

  constructor(
    private fb: FormBuilder,
    private interdictionQueryApiService: InterdictionQueryApiService,
    private dialog: MatDialog,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService,
    private snackbarService: SnackbarService
  ) {
    this.form = this.fb.group({
      productCode: [''],
      productDescription: ['']
    });

    this.initializeTableConfigurations();

    // Update header config from menu-items API response
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.pageHeaderConfig = {
          ...this.pageHeaderConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || 'View unit and component interdictions and related attributes in a read-only manner.'
        };
      }
    });
  }

  ngOnInit(): void {
    this.subscribeToChapterChanges();
    this.subscribeToProductCodeChanges();
    this.subscribeToProductSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
      });
  }

  private subscribeToProductCodeChanges(): void {
    this.form.get('productCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(productCode => {
        const selected = this.productCodes.find(p => p.productCode === productCode);
        this.form.patchValue({
          productDescription: selected?.productDesc || '-'
        }, { emitEvent: false });
      });
  }

  private subscribeToProductSearch(): void {
    this.productSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterProducts();
      });
  }

  private filterProducts(): void {
    const search = this.productSearchCtrl.value?.toLowerCase() || '';

    if (!search) {
      this.filteredProducts$.next(this.productCodes);
      return;
    }

    const filtered = this.productCodes.filter(product =>
      product.productCode.toLowerCase().includes(search) ||
      product.productDesc.toLowerCase().includes(search)
    );

    this.filteredProducts$.next(filtered);
  }

  /**
   * Handle unit ID validation from app-unit-id-field component
   */
  onUnitValidated(event: UnitValidationResponse): void {
    this.currentUnitId = event.parsedUnitId;
    this.currentCollDate = event.collectionDate || '';
    this.isUnitIdValid = true; // Enable buttons when unit ID is valid

    // Load products for this unit using the actual collection date
    this.validateUnitAndLoadProducts(event.parsedUnitId, event.collectionDate);
  }

  /**
   * Handle unit ID cleared from app-unit-id-field component
   */
  onUnitCleared(): void {
    this.currentUnitId = '';
    this.currentCollDate = '';
    this.isUnitIdValid = false; // Disable buttons when unit ID is cleared
    this.clearData();
  }

  private validateUnitAndLoadProducts(unitId: string, collDate?: string): void {
    this.isLoading = true;

    // If collection date is provided (from unit-id-field validation), use it directly
    if (collDate) {
      this.loadProductCodesWithCollDate(unitId, collDate);
    } else {
      // Otherwise, query interdictions to get collection date
      const request: InterdictionQueryRequest = {
        unitId: unitId,
        productCode: undefined
      };

      this.interdictionQueryApiService.queryInterdictions(request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            const responseCollDate = response.collectionDate;
            this.currentCollDate = responseCollDate;
            this.loadProductCodesWithCollDate(unitId, responseCollDate);
          },
          error: (error) => {
            console.error('Error validating unit:', error);
            this.productCodes = [];
            this.isLoading = false;

            if (error.status === 404) {
              this.form.patchValue({
                productDescription: 'Unit not found'
              }, { emitEvent: false });
            } else if (error.status === 400) {
              const errorMsg = error.error?.message || 'Invalid unit ID';
              this.form.patchValue({
                productDescription: errorMsg
              }, { emitEvent: false });
            } else {
              this.form.patchValue({
                productDescription: 'Error validating unit'
              }, { emitEvent: false });
            }
          }
        });
    }
  }

  private loadProductCodesWithCollDate(unitId: string, collDate: string): void {
    this.interdictionQueryApiService.getProductsForUnit(unitId, collDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.productCodes = products || [];
          this.filteredProducts$.next(this.productCodes);

          if (this.productCodes.length === 0) {
            // Bug Fix #4: Display error in snackbar instead of description field
            this.snackbarService.showError('Error: 0063 - No components found for this unit');
            this.form.patchValue({
              productDescription: '-'
            }, { emitEvent: false });
          } else {
            this.form.patchValue({
              productCode: '',
              productDescription: '-'
            }, { emitEvent: false });
          }

          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading product codes:', error);
          this.productCodes = [];
          this.filteredProducts$.next([]);
          this.form.patchValue({
            productDescription: 'Error loading components'
          }, { emitEvent: false });
          this.isLoading = false;
        }
      });
  }

  private clearData(): void {
    this.unitInterdictions = [];
    this.componentInterdictions = [];
    this.unitAttributes = [];
    this.componentAttributes = [];
    this.productCodes = [];
    this.filteredProducts$.next([]);
    this.productSearchCtrl.setValue('', { emitEvent: false });

    this.unitInterdictionsFiltered = [];
    this.componentInterdictionsFiltered = [];

    this.updateUnitInterdictionsTable();
    this.updateComponentInterdictionsTable();

    this.hasData = false;
    this.hasError = false;

    this.form.patchValue({
      productCode: '',
      productDescription: '-'
    }, { emitEvent: false });
  }

  private initializeTableConfigurations(): void {
    this.unitInterdictionsTableConfig.columns = this.getUnitInterdictionColumns();
    this.componentInterdictionsTableConfig.columns = this.getComponentInterdictionColumns();
  }

  private getUnitInterdictionColumns(): TableColumn<UnitInterdictionTableRow>[] {
    return [
      {
        key: 'code',
        header: 'Code',
        sortable: true, // Only first column is sortable
        width: '150px'
      },
      {
        key: 'description',
        header: 'Description',
        sortable: false,
        width: '300px'
      },
      {
        key: 'type',
        header: 'Type',
        sortable: false,
        width: '150px'
      },
      {
        key: 'timeStamp',
        header: 'Time Stamp',
        sortable: false,
        width: '200px'
      },
      {
        key: 'user',
        header: 'User',
        sortable: false,
        width: '150px'
      }
    ];
  }

  private getComponentInterdictionColumns(): TableColumn<ComponentInterdictionTableRow>[] {
    return [
      {
        key: 'code',
        header: 'Code',
        sortable: true, // Only first column is sortable
        width: '150px'
      },
      {
        key: 'description',
        header: 'Description',
        sortable: false,
        width: '300px'
      },
      {
        key: 'type',
        header: 'Type',
        sortable: false,
        width: '150px'
      },
      {
        key: 'timeStamp',
        header: 'Time Stamp',
        sortable: false,
        width: '200px'
      },
      {
        key: 'user',
        header: 'User',
        sortable: false,
        width: '150px'
      }
    ];
  }

  onRetrieve(): void {
    if (!this.currentUnitId) {
      this.snackbarService.showError('Unit ID is required');
      return;
    }

    this.isLoading = true;
    this.hasError = false;
    this.hasData = false;

    const request: InterdictionQueryRequest = {
      unitId: this.currentUnitId,
      productCode: this.form.get('productCode')?.value || undefined
    };

    this.interdictionQueryApiService.queryInterdictions(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.unitInterdictions = response.unitInterdictions || [];
          this.componentInterdictions = response.componentInterdictions || [];
          this.unitAttributes = response.unitAttributes || [];
          this.componentAttributes = response.componentAttributes || [];

          this.updateUnitInterdictionsTable();
          this.updateComponentInterdictionsTable();

          this.hasData = true;
          this.isLoading = false;

          if (response.isArchived) {
            this.snackbarService.showError('Warning 0214: This unit has already been archived.');
            return;
          }

          const noUnitInterdictions = this.unitInterdictions.length === 0;
          const noComponentInterdictions = this.componentInterdictions.length === 0;
          if (noUnitInterdictions && noComponentInterdictions) {
            this.snackbarService.showInfo('No interdictions found for this unit (5205).');
          } else if (noUnitInterdictions) {
            this.snackbarService.showInfo('No unit level interdictions found (0208).');
          } else if (noComponentInterdictions) {
            this.snackbarService.showInfo('No component level interdictions found (9002).');
          }
        },
        error: (error) => {
          console.error('Error loading interdiction data:', error);
          let errorMessage = 'Unable to load data. Please try again.';

          if (error.status === 404) {
            errorMessage = 'API endpoint not found. The backend may not be deployed yet.';
          } else if (error.status === 400) {
            errorMessage = error.error?.message || 'Invalid request. Please check the Unit ID.';
          } else if (error.status === 0) {
            errorMessage = 'Cannot connect to server. Please check your network connection.';
          }

          this.snackbarService.showError(errorMessage);
          this.hasError = true;
          this.isLoading = false;
        }
      });
  }

  private updateUnitInterdictionsTable(): void {
    const allRows = this.unitInterdictions.map(ui => ({
      codeAndDescription: `${ui.interCode}  ${ui.interDesc || ''}`,
      code: ui.interCode,
      description: ui.interDesc || '',
      type: ui.interType || '',
      timeStamp: this.formatDate(ui.insertDats),
      user: ui.interUserId || ''
    }));

    // Apply search filter
    if (this.unitInterdictionsSearchTerm) {
      const searchLower = this.unitInterdictionsSearchTerm.toLowerCase();
      this.unitInterdictionsFiltered = allRows.filter(row =>
        row.code.toLowerCase().includes(searchLower) ||
        row.description.toLowerCase().includes(searchLower)
      );
    } else {
      this.unitInterdictionsFiltered = allRows;
    }

    this.unitInterdictionsTableConfig.pagination!.totalRecords = this.unitInterdictionsFiltered.length;
  }

  onUnitInterdictionsSearch(): void {
    this.updateUnitInterdictionsTable();
  }

  private updateComponentInterdictionsTable(): void {
    const allRows = this.componentInterdictions.map(ci => ({
      productCode: ci.productCode,
      code: ci.interCode,
      description: ci.interDesc || '',
      type: ci.interType || '',
      timeStamp: this.formatDate(ci.insertDats),
      user: ci.interUserId || ''
    }));

    // Apply search filter
    if (this.componentInterdictionsSearchTerm) {
      const searchLower = this.componentInterdictionsSearchTerm.toLowerCase();
      this.componentInterdictionsFiltered = allRows.filter(row =>
        row.code.toLowerCase().includes(searchLower) ||
        row.description.toLowerCase().includes(searchLower)
      );
    } else {
      this.componentInterdictionsFiltered = allRows;
    }

    this.componentInterdictionsTableConfig.pagination!.totalRecords = this.componentInterdictionsFiltered.length;
  }

  onComponentInterdictionsSearch(): void {
    this.updateComponentInterdictionsTable();
  }

  /**
   * Format date without timezone conversion to display exact data from response
   * Format: DD-MMM-YYYY HH24:MI
   */
  private formatDate(date: string | null | undefined): string {
    if (!date) return '-';

    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : '-';
  }

  onClearAll(): void {
    this.clearAll();
  }

  private clearAll(): void {
    // Clear form
    this.form.reset();

    // Clear unit ID field
    if (this.unitIdField) {
      this.unitIdField.clear();
    }
    this.currentUnitId = '';
    this.isUnitIdValid = false; // Disable buttons

    // Clear product search
    this.productSearchCtrl.reset();

    // Clear data
    this.productCodes = [];
    this.unitInterdictions = [];
    this.componentInterdictions = [];
    this.unitAttributes = [];
    this.componentAttributes = [];
    this.unitInterdictionsFiltered = [];
    this.componentInterdictionsFiltered = [];

    // Clear search terms
    this.unitInterdictionsSearchTerm = '';
    this.componentInterdictionsSearchTerm = '';

    // Reset state
    this.hasData = false;
    this.hasError = false;
  }


  onViewUnitAttribute(): void {
    this.dialog.open(ViewUnitAttributeModal, {
      width: '900px',
      position: { right: '0' },
      panelClass: 'unit-attribute-modal-panel',
      hasBackdrop: true,
      backdropClass: 'modal-backdrop-gray',
      disableClose: true, // Prevent closing by clicking outside
      data: {
        unitAttributes: this.unitAttributes
      }
    });
  }

  onViewComponentAttribute(): void {
    this.dialog.open(ViewComponentAttributeModal, {
      width: '900px',
      position: { right: '0' },
      panelClass: 'component-attribute-modal-panel',
      hasBackdrop: true,
      backdropClass: 'modal-backdrop-gray',
      disableClose: true, // Prevent closing by clicking outside
      data: {
        componentAttributes: this.componentAttributes
      }
    });
  }

  onUnitInterdictionsPageChange(event: TablePageEvent): void {
    if (this.unitInterdictionsTableConfig.pagination) {
      this.unitInterdictionsTableConfig.pagination.pageIndex = event.pageIndex;
      this.unitInterdictionsTableConfig.pagination.pageSize = event.pageSize;
    }
  }

  onUnitInterdictionsSortChange(event: TableSortEvent): void {
    if (this.unitInterdictionsTableConfig.sortConfig) {
      this.unitInterdictionsTableConfig.sortConfig.column = event.column;
      this.unitInterdictionsTableConfig.sortConfig.direction = event.direction;
    }

    // Sort the data
    this.sortUnitInterdictions(event.column as keyof UnitInterdictionTableRow, event.direction);
  }

  onComponentInterdictionsPageChange(event: TablePageEvent): void {
    if (this.componentInterdictionsTableConfig.pagination) {
      this.componentInterdictionsTableConfig.pagination.pageIndex = event.pageIndex;
      this.componentInterdictionsTableConfig.pagination.pageSize = event.pageSize;
    }
  }

  onComponentInterdictionsSortChange(event: TableSortEvent): void {
    if (this.componentInterdictionsTableConfig.sortConfig) {
      this.componentInterdictionsTableConfig.sortConfig.column = event.column;
      this.componentInterdictionsTableConfig.sortConfig.direction = event.direction;
    }

    // Sort the data
    this.sortComponentInterdictions(event.column as keyof ComponentInterdictionTableRow, event.direction);
  }

  private sortUnitInterdictions(column: keyof UnitInterdictionTableRow, direction: 'A' | 'D' | 'default'): void {
    if (direction === 'default') {
      // Reset to original order
      this.updateUnitInterdictionsTable();
      return;
    }

    // Create a new sorted array to trigger change detection
    // Icons are backwards: 'D' shows down arrow (ascending), 'A' shows up arrow (descending)
    this.unitInterdictionsFiltered = [...this.unitInterdictionsFiltered].sort((a, b) => {
      const aValue = a[column] || '';
      const bValue = b[column] || '';

      if (aValue < bValue) {
        return direction === 'D' ? -1 : 1; // 'D' = down arrow = ascending
      }
      if (aValue > bValue) {
        return direction === 'D' ? 1 : -1; // 'A' = up arrow = descending
      }
      return 0;
    });
  }

  private sortComponentInterdictions(column: keyof ComponentInterdictionTableRow, direction: 'A' | 'D' | 'default'): void {
    if (direction === 'default') {
      // Reset to original order
      this.updateComponentInterdictionsTable();
      return;
    }

    // Create a new sorted array to trigger change detection
    // Icons are backwards: 'D' shows down arrow (ascending), 'A' shows up arrow (descending)
    this.componentInterdictionsFiltered = [...this.componentInterdictionsFiltered].sort((a, b) => {
      const aValue = a[column] || '';
      const bValue = b[column] || '';

      if (aValue < bValue) {
        return direction === 'D' ? -1 : 1; // 'D' = down arrow = ascending
      }
      if (aValue > bValue) {
        return direction === 'D' ? 1 : -1; // 'A' = up arrow = descending
      }
      return 0;
    });
  }
}
