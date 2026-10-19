import { Component, OnInit, OnDestroy, ViewChild, ElementRef, effect, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { LicensedProductsService } from './services/licensed-products.service';
import {
  LicensedProduct,
  LicensedProductParamsDto,
  Chapter,
  ValidProduct
} from './models/licensed-products.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent,
  RowAction,
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';
import { AddEditLicensedProductDialog } from './add-edit-licensed-product-dialog/add-edit-licensed-product-dialog';

@Component({
  selector: 'app-licensed-products',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    AddEditLicensedProductDialog
  ],
  templateUrl: './licensed-products.html',
  styleUrls: ['./licensed-products.scss']
})
export class LicensedProductsComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('filterSection', { read: ElementRef }) filterSection!: ElementRef<HTMLElement>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by product code',
    minLength: 1,
    ariaLabel: 'Search licensed products by product code',
    searchOnEnterOnly: true,
    debounceTime: 300
  };

  tableConfig: DataTableConfig<LicensedProduct> = {
    columns: [],
    rowActions: [],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No Results to Display',
    noDataIcon: 'edit',
    loadingMessage: 'Loading licensed products data...',
    showPagination: true
  };

  filterForm!: FormGroup;

  // Chapter options loaded from API
  chapters: Chapter[] = [];

  // Chapter search control
  chapterSearchControl = new FormControl('');
  filteredChapters: Chapter[] = [];
  dataSource: LicensedProduct[] = [];
  requestState: LicensedProductParamsDto = {};

  isLoading = false;
  hasError = false;
  searchText = '';
  selectedChapterId: string | null = null;
  hasLoadedData = false;

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: LicensedProduct | null = null;
  validProductsCache: ValidProduct[] = [];

  // Keep for backward compatibility with template
  get isDialogOpen(): boolean {
    return this.sidePanelOpen;
  }

  private destroy$ = new Subject<void>();

  get isSearchDisabled(): boolean {
    return this.isLoading || this.hasError || !this.selectedChapterId;
  }

  get isAddNewDisabled(): boolean {
    return !this.selectedChapterId || this.sidePanelOpen;
  }

  constructor(
    private fb: FormBuilder,
    private licensedProductsService: LicensedProductsService,
    private snackBar: MatSnackBar,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeConfigurations();

    // Update header config from menu-items API response
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  ngOnInit(): void {
    this.initializeFilterForm();
    this.setupChapterSearch();
    this.loadChapters();
    this.loadValidProducts(); // Pre-load product codes LOV
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reset everything on chapter change
        this.filterForm.reset();
        this.selectedChapterId = null;
        this.searchText = '';
        this.requestState = {};
        this.dataSource = [];
        this.sidePanelOpen = false;
        this.hasLoadedData = false;

        // Reset search bar
        if (this.searchBarComponent) {
          this.searchBarComponent.searchText = '';
        }

        // Reset pagination
        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.pageIndex = 0;
          this.tableConfig.pagination.totalRecords = 0;
        }

        // Reload chapters
        this.loadChapters();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' }
      ],
      title: 'Licensed Products',
      subtitle: '',
      actions: []  // Start with no actions - button will appear after RETRIEVE
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: [
        {
          icon: 'edit',
          ariaLabel: 'Edit licensed product',
          action: 'edit'
        }
      ],
      pagination: {
        pageSize: 25,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No Results to Display',
      emptySubMessage: 'No products found for the selected criteria',
      noDataIcon: 'edit',
      loadingMessage: 'Loading licensed products...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<LicensedProduct>[] {
    return [
      {
        key: 'productCode',
        header: 'Product Code',
        sortable: false,
        width: '150px'
      },
      {
        key: 'productDescription',
        header: 'Product Description',
        sortable: false,
        width: '200px'
      },
      {
        key: 'osokFlag',
        header: 'OSOK',
        sortable: false,
        width: '100px',
        valueFormatter: (value) => value === 'Y' ? 'Yes' : 'No'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        sortable: false,
        width: '160px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        sortable: false,
        width: '160px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '--';
    return moment(date).format('DD-MMM-YYYY').toUpperCase();
  }

  private initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      chapterId: ['', Validators.required]
    });

    // Subscribe to chapterId changes to update chapter description
    this.filterForm.get('chapterId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(chapterId => {
        this.selectedChapterId = chapterId || null;
        this.updateHeaderActions();
      });
  }

  /**
   * Setup chapter search filtering
   */
  private setupChapterSearch(): void {
    this.chapterSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterChapterOptions();
      });
  }

  /**
   * Filter chapter options based on search text
   */
  private filterChapterOptions(): void {
    const searchTerm = (this.chapterSearchControl.value || '').toLowerCase().trim();
    if (!searchTerm) {
      this.filteredChapters = this.chapters;
    } else {
      this.filteredChapters = this.chapters.filter(chapter =>
        chapter.chapterId.toLowerCase().includes(searchTerm) ||
        chapter.chapterName?.toLowerCase().includes(searchTerm)
      );
    }
  }

  private loadChapters(): void {
    this.licensedProductsService.getChapters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (chapters) => {
          this.chapters = chapters;
          this.filteredChapters = chapters;
        },
        error: () => {
          this.showError('Failed to load chapters');
        }
      });
  }

  get selectedChapterName(): string {
    if (!this.selectedChapterId) return '';
    const chapter = this.chapters.find(c => c.chapterId === this.selectedChapterId);
    return chapter?.chapterName || '';
  }

  /**
   * Pre-load valid products LOV on page load
   */
  private loadValidProducts(): void {
    this.licensedProductsService.getValidProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.validProductsCache = products;
        },
        error: () => {
          this.showError('Failed to pre-load valid products');
        }
      });
  }

  /**
   * Update header actions (show/hide and enable/disable ADD NEW PRODUCT button)
   */
  private updateHeaderActions(): void {
    if (this.hasLoadedData) {
      // Show button only after data is loaded
      this.headerConfig = {
        ...this.headerConfig,
        actions: [
          {
            label: 'ADD NEW PRODUCT',
            matButton: 'raised',
            color: 'accent',
            disabled: this.isAddNewDisabled,
            onClick: () => this.createRecord()
          }
        ]
      };
    } else {
      // Hide button before data is loaded
      this.headerConfig = {
        ...this.headerConfig,
        actions: []
      };
    }
  }

  /**
   * Handle RETRIEVE button click
   */
  onRetrieve(): void {
    if (!this.selectedChapterId) {
      return;
    }

    // Reset search and pagination
    this.searchText = '';
    this.requestState = {};
    if (this.searchBarComponent) {
      this.searchBarComponent.searchText = '';
    }
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.hasLoadedData = true;
    this.updateHeaderActions();
    this.loadData();
  }

  /**
   * Handle CLEAR ALL button click
   */
  onClearAll(): void {
    this.closeSidePanel();
    this.filterForm.reset();
    this.selectedChapterId = null;
    this.searchText = '';
    this.requestState = {};
    this.dataSource = [];
    this.hasLoadedData = false;
    this.updateHeaderActions();

    if (this.searchBarComponent) {
      this.searchBarComponent.searchText = '';
    }

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
      this.tableConfig.pagination.totalRecords = 0;
    }
  }

  /**
   * Load data from API
   */
  loadData(): void {
    if (!this.selectedChapterId) return;

    this.isLoading = true;
    this.hasError = false;

    const pageSize = this.tableConfig.pagination?.pageSize || 25;
    const pageIndex = this.tableConfig.pagination?.pageIndex || 0;
    const skip = pageIndex * pageSize;

    const params: LicensedProductParamsDto = {
      ...this.requestState
    };

    this.licensedProductsService.getLicensedProducts(this.selectedChapterId, pageSize, skip, params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = response.total;
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.hasError = true;
          this.isLoading = false;
          this.showError('Failed to load licensed products');
        }
      });
  }

  /**
   * Handle search
   */
  onSearch(searchText: string): void {
    this.searchText = searchText;
    this.requestState.searchKeyword = searchText || undefined;

    // Reset to first page when searching
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  /**
   * Handle pagination
   */
  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadData();
  }

  /**
   * Handle row action
   */
  onRowAction(event: TableRowActionEvent<LicensedProduct>): void {
    if (event.action === 'edit') {
      this.editRecord(event.row);
    }
  }

  /**
   * Create new record
   */
  createRecord(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.validProductsCache = this.licensedProductsService.getCachedValidProducts();
    this.sidePanelOpen = true;
  }

  /**
   * Edit existing record
   */
  editRecord(product: LicensedProduct): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = product;
    this.sidePanelOpen = true;
  }

  /**
   * Close side panel
   */
  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  /**
   * Handle save success from side panel
   */
  onSaveSuccess(): void {
    this.loadData();
  }

  /**
   * Handle mode change from side panel (e.g., "Add and Create Another" switches back to add mode)
   */
  onModeChange(newMode: 'add' | 'edit'): void {
    this.sidePanelMode = newMode;
    if (newMode === 'add') {
      this.sidePanelData = null;
    }
  }


  /**
   * Show error message
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
