/**
 * Main Component: Manage Matrix - Pheresis
 * JIRA: MLT-12847
 * Oracle Forms: VPROCPRD.fmb
 * Route: /lab/manage-matrix-pheresis
 */

import { Component, OnInit, OnDestroy, ViewChild, inject, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, startWith, map } from 'rxjs/operators';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableRowActionEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { MatrixPheresisService } from '../services/matrix-pheresis.service';
import { AddEditMatrixPanelComponent } from './add-edit-matrix-panel/add-edit-matrix-panel';
import { AttributeEquipmentMatrixTabComponent } from './attribute-equipment-matrix-tab/attribute-equipment-matrix-tab';
import { EquipmentProductCgmpMatrixTabComponent } from './equipment-product-cgmp-matrix-tab/equipment-product-cgmp-matrix-tab';
import {
  ProcProdMatrix,
  ProcedureDropdown,
  ProductTypeDropdown,
  MatrixQueryDto
} from '../models/matrix-pheresis.model';

@Component({
  selector: 'app-manage-matrix-pheresis',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    AddEditMatrixPanelComponent,
    AttributeEquipmentMatrixTabComponent,
    EquipmentProductCgmpMatrixTabComponent
  ],
  templateUrl: './manage-matrix-pheresis.html',
  styleUrls: ['./manage-matrix-pheresis.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManageMatrixPheresisComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly service = inject(MatrixPheresisService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly pageHeaderService = inject(PageHeaderService);

  // Reference to the attribute equipment matrix tab
  @ViewChild(AttributeEquipmentMatrixTabComponent) attributeEquipmentTab?: AttributeEquipmentMatrixTabComponent;
  @ViewChild(EquipmentProductCgmpMatrixTabComponent) cgmpTab?: EquipmentProductCgmpMatrixTabComponent;

  // Header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' }
    ],
    title: '',
    subtitle: '',
    actions: [
      {
        label: 'ADD NEW MATRIX',
        icon: 'add',
        color: 'primary',
        matButton: 'raised',
        ariaLabel: 'Add new matrix entry',
        disabled: false,
        onClick: () => this.onAddNew()
      }
    ]
  };

  // Filter form
  filterForm!: FormGroup;

  // Search controls for dropdowns
  procedureSearchControl = new FormControl('');
  productTypeSearchControl = new FormControl('');

  // Filtered lists
  filteredProcedures = signal<ProcedureDropdown[]>([]);
  filteredProductTypes = signal<ProductTypeDropdown[]>([]);

  // Loading states
  isLoading = signal<boolean>(false);
  isLoadingFilters = signal<boolean>(false);

  // Data
  matrixRecords = signal<ProcProdMatrix[]>([]);
  totalRecords = signal<number>(0);

  // Dropdowns
  procedures = signal<ProcedureDropdown[]>([]);
  productTypes = signal<ProductTypeDropdown[]>([]);

  // Pagination
  currentPage = signal<number>(0);
  pageSize = signal<number>(25);
  pageSizeOptions = [10, 25, 50, 100];

  // Error
  errorMessage = signal<string | null>(null);

  // Panel state
  showPanel = signal<boolean>(false);
  panelMode = signal<'add' | 'edit'>('add');
  selectedRecord = signal<ProcProdMatrix | null>(null);
  childPanelOpen = signal<boolean>(false);
  isAnyPanelOpen = computed(() => this.showPanel() || this.childPanelOpen());

  // Active tab index
  activeTabIndex = signal<number>(0);

  // CRIT-2: stores the element that triggered the panel so focus can be restored on close
  private panelTrigger: HTMLElement | null = null;

  // Selected descriptions for display
  selectedProductTypeDescription = signal<string>('');
  selectedProcedureDescription = signal<string>('');

  // Data table configuration
  tableConfig = signal<DataTableConfig<ProcProdMatrix>>({
    columns: [
      {
        key: 'proc',
        header: 'Procedure',
        sortable: true,
        valueFormatter: (value) => this.formatValue(value)
      },
      {
        key: 'procDesc',
        header: 'Procedure Description',
        sortable: false,
        valueFormatter: (value) => this.formatValue(value)
      },
      {
        key: 'productType',
        header: 'Product Type',
        sortable: false,
        valueFormatter: (value) => this.formatValue(value)
      },
      {
        key: 'productDesc',
        header: 'Product Description',
        sortable: false,
        valueFormatter: (value) => this.formatValue(value)
      },
      {
        key: 'numberProducts',
        header: 'No. of Products',
        sortable: false,
        valueFormatter: (value) => this.formatValue(value)
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        sortable: false,
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        sortable: false,
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'lastModifyDate',
        header: 'Modification Date',
        sortable: false,
        valueFormatter: (value) => this.formatDate(value)
      }
    ],
    rowActions: [
      {
        icon: 'edit',
        label: 'Edit',
        ariaLabel: 'Edit matrix entry for {{proc}} - {{productType}}',
        action: 'edit',
        color: 'primary'
      }
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    sortConfig: {
      column: 'proc',
      direction: 'A'
    },
    showPagination: true,
    stickyHeader: true,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Please enter Search criteria to view Results.',
    noDataIcon: 'search'
  });

  // Computed
  hasFilters = computed(() => {
    if (!this.filterForm) return false;
    const proc = this.filterForm.get('proc')?.value;
    const productType = this.filterForm.get('productType')?.value;
    return !!proc || !!productType;
  });

  hasData = computed(() => this.matrixRecords().length > 0);

  constructor() {
    // Update header config with title and subtitle from menu-items API
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.updateHeaderConfig(pageData.title, pageData.subtitle || '');
      }
    });

    // Update header actions when tab changes and close any open panels
    effect(() => {
      this.activeTabIndex(); // Track dependency

      // Close panels when switching tabs
      this.showPanel.set(false);
      this.childPanelOpen.set(false);
      if (this.attributeEquipmentTab) {
        this.attributeEquipmentTab.showPanel.set(false);
      }
      if (this.cgmpTab) {
        this.cgmpTab.showPanel.set(false);
      }

      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.updateHeaderConfig(pageData.title, pageData.subtitle || '');
      }
    });
  }

  /**
   * Update header configuration based on active tab
   */
  private updateHeaderConfig(title: string, subtitle: string): void {
    const actions: PageHeaderConfig['actions'] = [];

    // Show "ADD NEW MATRIX" button for tab 0 (Product/Procedure Matrix)
    if (this.activeTabIndex() === 0) {
      actions.push({
        label: 'ADD NEW MATRIX',
        icon: 'add',
        color: 'primary' as const,
        matButton: 'raised',
        ariaLabel: 'Add new matrix entry',
        disabled: false,
        onClick: () => this.onAddNew()
      });
    }

    // Show "NEW MATRIX" button for tab 1 (Attribute/Equipment Matrix)
    if (this.activeTabIndex() === 1) {
      actions.push({
        label: 'ADD NEW MATRIX',
        icon: 'add',
        color: 'primary' as const,
        matButton: 'raised',
        ariaLabel: 'Add new attribute equipment matrix entry',
        disabled: false,
        onClick: () => this.onAddAttributeEquipmentMatrix()
      });
    }

    // Show "ADD NEW MATRIX" button for tab 2 (Equipment/Product cGMP Matrix)
    if (this.activeTabIndex() === 2) {
      actions.push({
        label: 'ADD NEW MATRIX',
        icon: 'add',
        color: 'primary' as const,
        matButton: 'raised',
        ariaLabel: 'Add new equipment/product cGMP matrix entry',
        disabled: false,
        onClick: () => this.onAddEquipmentCgmpMatrix()
      });
    }

    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: title, link: null }
      ],
      title,
      subtitle,
      actions
    };
  }

  ngOnInit(): void {
    this.initializeFilterForm();
    this.loadDropdowns();
    this.setupSearchFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize filter form
   */
  private initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      productType: [null],
      proc: [null]
    });
  }

  /**
   * Setup search filters for dropdowns
   */
  private setupSearchFilters(): void {
    // Procedure search filter
    this.procedureSearchControl.valueChanges
      .pipe(
        startWith(''),
        takeUntil(this.destroy$)
      )
      .subscribe(searchValue => {
        const search = (searchValue || '').toLowerCase();
        if (!search) {
          this.filteredProcedures.set(this.procedures());
        } else {
          const filtered = this.procedures().filter(p =>
            p.code.toLowerCase().includes(search) ||
            p.codeDesc.toLowerCase().includes(search)
          );
          this.filteredProcedures.set(filtered);
        }
      });

    // Product type search filter
    this.productTypeSearchControl.valueChanges
      .pipe(
        startWith(''),
        takeUntil(this.destroy$)
      )
      .subscribe(searchValue => {
        const search = (searchValue || '').toLowerCase();
        if (!search) {
          this.filteredProductTypes.set(this.productTypes());
        } else {
          const filtered = this.productTypes().filter(pt =>
            pt.productCode.toLowerCase().includes(search) ||
            pt.productDesc.toLowerCase().includes(search)
          );
          this.filteredProductTypes.set(filtered);
        }
      });
  }

  /**
   * Load dropdown data (procedures and product types)
   */
  private loadDropdowns(): void {
    this.isLoadingFilters.set(true);

    // Load procedures
    this.service
      .getProcedures()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (procedures) => {
          this.procedures.set(procedures);
          this.checkDropdownsLoaded();
        },
        error: (error) => {
          console.error('Error loading procedures:', error);
          this.handleError('Failed to load procedures');
          this.isLoadingFilters.set(false);
        }
      });

    // Load product types
    this.service
      .getProductTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (productTypes) => {
          this.productTypes.set(productTypes);
          this.checkDropdownsLoaded();
        },
        error: (error) => {
          console.error('Error loading product types:', error);
          this.handleError('Failed to load product types');
          this.isLoadingFilters.set(false);
        }
      });
  }

  /**
   * Check if both dropdowns are loaded
   */
  private checkDropdownsLoaded(): void {
    if (this.procedures().length > 0 && this.productTypes().length > 0) {
      this.filteredProcedures.set(this.procedures());
      this.filteredProductTypes.set(this.productTypes());
      this.isLoadingFilters.set(false);
    }
  }

  /**
   * Execute search with filters and pagination
   */
  onRetrieve(): void {
    this.currentPage.set(0); // Reset to first page
    this.loadMatrixRecords();
  }

  /**
   * Reset filters and clear data table
   */
  onClearAll(): void {
    this.filterForm.reset();
    this.selectedProductTypeDescription.set('');
    this.selectedProcedureDescription.set('');
    this.currentPage.set(0);
    this.matrixRecords.set([]);
    this.totalRecords.set(0);

    // Update table config to reflect cleared state
    this.tableConfig.update(config => ({
      ...config,
      pagination: {
        ...config.pagination!,
        totalRecords: 0,
        pageIndex: 0,
        pageSize: this.pageSize()
      }
    }));
  }

  /**
   * Handle product type selection change
   */
  onProductTypeChange(): void {
    const selectedValue = this.filterForm.get('productType')?.value;
    if (selectedValue) {
      const selected = this.productTypes().find(pt => pt.productCode === selectedValue);
      this.selectedProductTypeDescription.set(selected?.productDesc || '');
    } else {
      this.selectedProductTypeDescription.set('');
    }
  }

  /**
   * Handle procedure selection change
   */
  onProcedureChange(): void {
    const selectedValue = this.filterForm.get('proc')?.value;
    if (selectedValue) {
      const selected = this.procedures().find(p => p.code === selectedValue);
      this.selectedProcedureDescription.set(selected?.codeDesc || '');
    } else {
      this.selectedProcedureDescription.set('');
    }
  }

  /**
   * Load matrix records with current filters and pagination
   */
  private loadMatrixRecords(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const sortDir = this.tableConfig().sortConfig?.direction;
    const sortColumn = sortDir && sortDir !== 'default' ? 'PROC' : undefined;
    const sortOrder = sortDir === 'A' ? 'ASC' as const : sortDir === 'D' ? 'DESC' as const : undefined;

    const filters: MatrixQueryDto = {
      proc: this.filterForm.get('proc')?.value || undefined,
      productType: this.filterForm.get('productType')?.value || undefined,
      sortColumn,
      sortOrder
    };

    const take = this.pageSize();
    const skip = this.currentPage() * this.pageSize();

    this.service
      .getMatrixRecords(take, skip, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.matrixRecords.set(response.data);
          this.totalRecords.set(response.totalCount);

          // Update table config with new total
          this.tableConfig.update(config => ({
            ...config,
            pagination: {
              ...config.pagination!,
              totalRecords: response.totalCount,
              pageIndex: this.currentPage(),
              pageSize: this.pageSize()
            }
          }));

          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading matrix records:', error);
          this.handleError('Failed to load matrix records');
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Handle pagination change
   */
  onSortChange(event: TableSortEvent): void {
    this.tableConfig.update(config => ({
      ...config,
      sortConfig: {
        column: event.column,
        direction: event.direction
      }
    }));
    this.currentPage.set(0);
    this.loadMatrixRecords();
  }

  onPageChange(event: TablePageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadMatrixRecords();
  }

  /**
   * Handle table row actions
   */
  onRowAction(event: TableRowActionEvent<ProcProdMatrix>): void {
    this.panelTrigger = document.activeElement as HTMLElement;
    if (event.action === 'edit') {
      this.onEdit(event.row);
    }
  }

  onChildPanelToggled(isOpen: boolean): void {
    this.childPanelOpen.set(isOpen);
  }

  /**
   * Open add panel for Product/Procedure Matrix (Tab 0)
   */
  onAddNew(): void {
    this.panelTrigger = document.activeElement as HTMLElement;
    this.panelMode.set('add');
    this.selectedRecord.set(null);
    this.showPanel.set(true);
    this.focusPanelCloseButton();
  }

  /**
   * Open add panel for Attribute/Equipment Matrix (Tab 1)
   */
  onAddAttributeEquipmentMatrix(): void {
    this.attributeEquipmentTab?.onAddNew();
  }

  /**
   * Open add panel for Equipment/Product cGMP Matrix (Tab 2)
   */
  onAddEquipmentCgmpMatrix(): void {
    this.cgmpTab?.onAddNew();
  }


  /**
   * Open edit panel with selected record
   */
  onEdit(record: ProcProdMatrix): void {
    this.panelMode.set('edit');
    this.selectedRecord.set(record);
    this.showPanel.set(true);
    this.focusPanelCloseButton();
  }


  /**
   * Handle panel close event
   */
  onPanelClose(): void {
    this.showPanel.set(false);
    this.selectedRecord.set(null);
    const trigger = this.panelTrigger;
    this.panelTrigger = null;
    setTimeout(() => trigger?.focus());
  }

  private focusPanelCloseButton(): void {
    setTimeout(() => {
      const closeBtn = document.querySelector<HTMLElement>(
        '.side-panel-container button[aria-label="Close panel"]'
      );
      closeBtn?.focus();
    }, 50);
  }

  /**
   * Handle panel save success event
   */
  onPanelSaveSuccess(): void {
    this.showPanel.set(false);
    this.selectedRecord.set(null);
    this.loadMatrixRecords();
  }

  onRecordAdded(): void {
    this.loadMatrixRecords();
  }

  /**
   * Format value for display (show '-' for blank/null/undefined)
   */
  formatValue(value?: any): string {
    if (value === null || value === undefined || value === '') return '-';
    return String(value);
  }

  /**
   * Format date for display (DD-MMM-YYYY)
   */
  formatDate(dateString?: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Show success snackbar
   */
  private handleSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Show error snackbar
   */
  private handleError(message: string): void {
    this.errorMessage.set(message);
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
