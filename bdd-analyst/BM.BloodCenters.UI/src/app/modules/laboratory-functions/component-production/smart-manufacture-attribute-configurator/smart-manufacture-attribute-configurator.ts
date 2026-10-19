import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  HostListener,
  inject,
  ChangeDetectorRef,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { SnackbarService } from '@shared/services/snackbar.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { HeaderService } from '@shared/services/header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';
import moment from 'moment';

import { AddEditAttributeConfigComponent } from './add-edit-attribute-config/add-edit-attribute-config';
import {
  AttributeConfigDto,
  FunctionNameOption,
  LabProductTypeOption,
  AttributeClassOption,
  AttributeCodeOption,
  ModifierOption,
  SaveAttributeConfigRequest,
} from './models/attribute-configurator.model';
import { AttributeConfiguratorService } from './services/attribute-configurator.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-smart-manufacture-attribute-configurator',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    SearchBar,
    DataTable,
    AddEditAttributeConfigComponent,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './smart-manufacture-attribute-configurator.html',
  styleUrls: ['./smart-manufacture-attribute-configurator.scss'],
})
export class SmartManufactureAttributeConfiguratorComponent implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly snackbarService = inject(SnackbarService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly service = inject(AttributeConfiguratorService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('sideDrawer') sideDrawerComponent?: AddEditAttributeConfigComponent;
  @ViewChild(DataTable) dataTableComponent!: DataTable<AttributeConfigDto>;

  pageHeaderConfig: PageHeaderConfig = this.getPageHeaderConfig();

  functionNames: FunctionNameOption[] = [];
  selectedFunctionName = '';
  selectedFunctionNameObj: FunctionNameOption | null = null;
  isDataLoaded = false;

  // Function name search
  functionNameSearchControl = new FormControl<string>('');
  filteredFunctionNames = signal<FunctionNameOption[]>([]);

  labProductTypes: LabProductTypeOption[] = [];
  attributeClasses: AttributeClassOption[] = [];
  attributeCodes: AttributeCodeOption[] = [];
  modifiers: ModifierOption[] = [];

  searchBarConfig: SearchBarConfig = {
    placeholder: 'Search by Lab Product Type, Product Description, Attribute Class or Attribute Code',
    ariaLabel: 'Search by Lab Product Type, Product Description, Attribute Class or Attribute Code',
    minLength: 2,
    searchOnEnterOnly: true,
    alwaysShowTooltip: true,
    tooltip: 'Search by Lab Product Type, Product Description, Attribute Class or Attribute Code',
  };

  dataTableConfig: DataTableConfig<AttributeConfigDto> = {
    columns: [
      { key: 'labProductType', header: 'Lab Product Type', width: '140px' },
      { key: 'productDescription', header: 'Product Description', width: '180px' },
      { key: 'attributeClass', header: 'Attribute Class', width: '140px' },
      { key: 'attributeCode', header: 'Attribute Code', width: '140px' },
      { key: 'modifier', header: 'Modifier', width: '120px' },
      { key: 'effectiveDate', header: 'Effective Date', width: '140px' },
      { key: 'terminationDate', header: 'Termination Date', width: '160px' },
    ],
    rowActions: [
      {
        icon: 'edit',
        label: 'Edit',
        ariaLabel: 'Edit attribute configuration',
        action: 'edit',
      },
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    sortConfig: {
      column: 'labProductType',
      direction: 'default',
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    showPagination: true,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Please enter Search criteria to view Results.',
    loadingMessage: 'Loading attribute configurations...',
  };

  dataSource: AttributeConfigDto[] = [];
  allData: AttributeConfigDto[] = [];
  isLoading = false;
  searchKeyword = '';

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: AttributeConfigDto | null = null;

  ngOnInit(): void {
    this.subscribeToChapterChanges();
    this.loadDropdownData();
    this.setupFunctionNameSearch();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetState();
        this.loadDropdownData();
      });
  }

  private loadDropdownData(): void {
    forkJoin({
      functionNames: this.service.getFunctionNames(),
      labProductTypes: this.service.getLabProductTypes(),
      attributeClasses: this.service.getAttributeClasses(),
      attributeCodes: this.service.getAttributeCodes(),
      modifiers: this.service.getModifiers()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.functionNames = result.functionNames || [];
          this.filteredFunctionNames.set([...this.functionNames]);
          this.labProductTypes = result.labProductTypes || [];
          this.attributeClasses = result.attributeClasses || [];
          this.attributeCodes = result.attributeCodes || [];
          this.modifiers = result.modifiers || [];
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.snackBar.open('Failed to load dropdown data', 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          });
        }
      });
  }

  private setupFunctionNameSearch(): void {
    this.functionNameSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredFunctionNames.set(!term
          ? [...this.functionNames]
          : this.functionNames.filter(fn =>
              fn.code.toLowerCase().includes(term) ||
              fn.description.toLowerCase().includes(term)
            ));
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getPageHeaderConfig(showAddButton = false): PageHeaderConfig {
    const pageData = this.pageHeaderService.pageHeaderData();
    const breadcrumbLabel = pageData?.title || 'Smart Manufacture Attribute Configurator';
    const config: PageHeaderConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: breadcrumbLabel, link: null },
      ],
    };
    if (showAddButton) {
      config.actions = [
        {
          label: 'ADD NEW',
          variant: 'filled',
          ariaLabel: 'Add new attribute configuration',
          onClick: () => this.openAddDrawer(),
        },
      ];
    }
    return config;
  }

  onRetrieve(): void {
    if (!this.selectedFunctionName) return;

    // Find the selected function name object to get the description
    this.selectedFunctionNameObj = this.functionNames.find(fn => fn.code === this.selectedFunctionName) || null;
    if (!this.selectedFunctionNameObj) return;

    this.isLoading = true;
    this.isDataLoaded = false;
    this.searchKeyword = '';

    this.loadData();
  }

  private loadData(): void {
    if (!this.selectedFunctionNameObj) return;

    this.isLoading = true;

    const pageSize = this.dataTableConfig.pagination?.pageSize ?? 25;
    const pageIndex = this.dataTableConfig.pagination?.pageIndex ?? 0;
    const skip = pageIndex * pageSize;

    // Pass the description to the API with pagination and search
    this.service.getAttributeConfigurations(
      this.selectedFunctionNameObj.description,
      pageSize,
      skip,
      this.searchKeyword
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.allData = response.data.map((item) => ({
            ...item,
            effectiveDate: this.formatDateForDisplay(item.effectiveDate),
            terminationDate: this.formatDateForDisplay(item.terminationDate),
          }));

          if (this.dataTableConfig.pagination) {
            this.dataTableConfig.pagination.totalRecords = response.total;
          }
          this.dataTableConfig = { ...this.dataTableConfig };
          this.dataSource = this.allData;

          this.isDataLoaded = true;
          this.isLoading = false;
          this.pageHeaderConfig = this.getPageHeaderConfig(true);
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.snackBar.open('Failed to load attribute configurations', 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          });
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  onClearAll(): void {
    this.selectedFunctionName = '';
    this.selectedFunctionNameObj = null;
    this.resetState();
  }

  private resetState(): void {
    this.isDataLoaded = false;
    this.dataSource = [];
    this.allData = [];
    this.searchKeyword = '';
    this.selectedFunctionName = '';
    this.selectedFunctionNameObj = null;
    this.functionNameSearchControl.setValue('');
    this.closeSideDrawer();
    this.pageHeaderConfig = this.getPageHeaderConfig(false);
    if (this.dataTableConfig.pagination) {
      this.dataTableConfig.pagination.pageIndex = 0;
      this.dataTableConfig.pagination.totalRecords = 0;
    }
    if (this.dataTableConfig.sortConfig) {
      this.dataTableConfig.sortConfig.column = 'labProductType';
      this.dataTableConfig.sortConfig.direction = 'default';
    }
    this.dataTableConfig = { ...this.dataTableConfig };
    this.cdr.detectChanges();
  }

  private formatDateForDisplay(date: string | null): string | null {
    if (!date) return null;
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : date;
  }

  onSearch(keyword: string): void {
    const trimmed = keyword?.trim() || '';

    // Clear search and reload all data if search is empty
    if (trimmed === '') {
      this.searchKeyword = '';
      if (this.dataTableConfig.pagination) {
        this.dataTableConfig.pagination.pageIndex = 0;
      }
      this.loadData();
      return;
    }

    // Perform search with API call
    this.searchKeyword = trimmed;
    if (this.dataTableConfig.pagination) {
      this.dataTableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  onPageChange(event: TablePageEvent): void {
    if (this.dataTableConfig.pagination) {
      this.dataTableConfig.pagination.pageIndex = event.pageIndex;
      this.dataTableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    if (this.dataTableConfig.sortConfig) {
      this.dataTableConfig.sortConfig.column = event.column;
      this.dataTableConfig.sortConfig.direction = event.direction;
    }
    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<AttributeConfigDto>): void {
    if (event.action === 'edit') {
      if (this.dataTableComponent) {
        this.dataTableComponent.activeRow = event.row;
      }
      this.openEditDrawer(event.row);
    }
  }

  // Side panel
  openAddDrawer(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = null;
    }
    this.cdr.detectChanges();
  }

  openEditDrawer(data: AttributeConfigDto): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = data;
    this.sidePanelOpen = true;
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = data;
    }
    this.cdr.detectChanges();
  }

  closeSideDrawer(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = null;
    }
    this.cdr.detectChanges();
  }

  onSave(data: SaveAttributeConfigRequest): void {
    const saveObservable = this.sidePanelMode === 'add'
      ? this.service.create(data)
      : this.service.update(
          this.sidePanelData?.labProductType || '',
          this.sidePanelData?.functionName || '',
          data,
          this.sidePanelData?.attributeClass ?? undefined,
          this.sidePanelData?.attributeCode ?? undefined
        );

    saveObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.handleSaveResponse(response, (apiMessage) => {
            this.showSnackbar(apiMessage);
            this.closeSideDrawer();
            this.sideDrawerComponent?.resetSubmissionState();
            this.onRetrieve();
          });
        },
        error: () => {
          this.snackBar.open('Failed to save attribute configuration', 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          });
          this.sideDrawerComponent?.resetSubmissionState();
        }
      });
  }

  onSaveAndCreateAnother(data: SaveAttributeConfigRequest): void {
    const saveObservable = this.sidePanelMode === 'add'
      ? this.service.create(data)
      : this.service.update(
          this.sidePanelData?.labProductType || '',
          this.sidePanelData?.functionName || '',
          data,
          this.sidePanelData?.attributeClass ?? undefined,
          this.sidePanelData?.attributeCode ?? undefined
        );

    saveObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.handleSaveResponse(response, (apiMessage) => {
            this.showSnackbar(apiMessage);
            this.sideDrawerComponent?.resetForm();
            this.sidePanelMode = 'add';
            this.sidePanelData = null;
            this.onRetrieve(); // Reload data to refresh dropdown values
            this.cdr.detectChanges();
          });
        },
        error: () => {
          this.snackBar.open('Failed to save attribute configuration', 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          });
          this.sideDrawerComponent?.resetSubmissionState();
        }
      });
  }

  private handleSaveResponse(
    response: { success: true; message: string; data: AttributeConfigDto | null } | { success: false; errorCode?: string; error?: string; message?: string; errorResponse?: { errorCode?: string; error?: string } },
    onSuccess: (apiMessage: string) => void
  ): void {
    if (response.success === false) {
      const errorCode = response?.errorCode || response?.errorResponse?.errorCode;
      const errorMessage = response?.error ||
                           response?.errorResponse?.error ||
                           response?.message ||
                           'Failed to save attribute configuration.';
      const displayMessage = errorCode ? `Error ${errorCode}: ${errorMessage}` : errorMessage;

      this.snackBar.open(displayMessage, 'DISMISS', {
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar'],
      });

      this.sideDrawerComponent?.resetSubmissionState();
      return;
    }

    onSuccess(response.message);
  }

  private showSnackbar(message: string): void {
    this.snackbarService.showSuccess(message);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 'c' && !this.sidePanelOpen && this.isDataLoaded) {
      event.preventDefault();
      this.openAddDrawer();
    }

    if (event.key === 'Escape' && this.sidePanelOpen) {
      this.closeSideDrawer();
    }
  }
}
