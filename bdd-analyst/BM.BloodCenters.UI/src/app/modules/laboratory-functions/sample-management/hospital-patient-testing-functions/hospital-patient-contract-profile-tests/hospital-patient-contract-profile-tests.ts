import { Component, OnInit, OnDestroy, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Subject, takeUntil, finalize } from 'rxjs';

import { HospitalPatientContractProfileTestsService } from './services/hospital-patient-contract-profile-tests.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import {
  ContractProfileTestTableModel,
  ContractProfileTestFormValue,
  CreateContractTestRequest,
  UpdateContractTestRequest,
  ContractLookup,
  ContractTestQueryDto
} from './models/hospital-patient-contract-profile-tests.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent,
  TableSortEvent,
  RowAction,
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';

import { AddEditContractProfileTestComponent } from './add-edit-contract-profile-test/add-edit-contract-profile-test';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { RouteKey } from '@core/constants/route-keys';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { formatTableDate } from '@shared/utils/date-format.util';

@Component({
  selector: 'app-hospital-patient-contract-profile-tests',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    SearchBar,
    AddEditContractProfileTestComponent
  ],
  templateUrl: './hospital-patient-contract-profile-tests.html',
  styleUrls: ['./hospital-patient-contract-profile-tests.scss']
})
export class HospitalPatientContractProfileTestsComponent implements OnInit, OnDestroy {
  @ViewChild('addEditComponent') addEditComponent?: AddEditContractProfileTestComponent;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  tableConfig: DataTableConfig<ContractProfileTestTableModel> = {
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
      column: 'testId',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  // Form controls
  // Based on FMB (lticntst_fmb.xml line 17): CONTRACT_ID is Required="true"
  contractIdControl = new FormControl<string>('', Validators.required);
  selectedContractDescription = '';

  // Contract search control
  contractSearchCtrl = new FormControl('');
  filteredContracts: ContractLookup[] = [];

  // Search configuration
  searchBarConfig: SearchBarConfig = {
    placeholder: 'Search',
    minLength: 0,
    ariaLabel: 'Search contract profile tests',
    debounceTime: 300,
    searchOnEnterOnly: true
  };
  searchText = '';

  // Data
  contracts: ContractLookup[] = [];
  dataSource: ContractProfileTestTableModel[] = [];
  sortDirection: 'ASC' | 'DESC' = 'ASC';
  currentPageSize = 25;
  currentPageIndex = 0;

  isLoading = false;
  hasError = false;
  errorMessage = '';

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: ContractProfileTestTableModel | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private service: HospitalPatientContractProfileTestsService,
    private loggingService: LoggingService,
    private snackbarService: SnackbarService,
    private headerService: HeaderService,
    private menuService: MenuService
  ) {
    this.initializeConfigurations();

    // Update page header config when menu data is loaded
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.HospitalPatientContractProfileTests].path;
        const menuItem = this.menuService.findMenuItemByPath(basePath);

        if (menuItem) {
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: '/home' },
              { label: menuItem.label, link: null }
            ],
            title: menuItem.label,
            subtitle: menuItem.remarks || menuItem.subtitle || 'Manage required clinical tests for active hospital profiles.'
          };
        }
      }
    });
  }

  ngOnInit(): void {
    this.loadContracts();
    this.subscribeToChapterChanges();
    this.setupContractSearch();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Close side panel when chapter changes
        this.closeSidePanel();

        // Clear selection and reload contracts
        this.contractIdControl.setValue('');
        this.selectedContractDescription = '';
        this.dataSource = [];
        this.loadContracts();
      });
  }

  private loadContracts(): void {
    this.service.getActiveContracts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contracts: ContractLookup[]) => {
          this.contracts = contracts;
          this.filteredContracts = contracts;
        },
        error: (error: Error) => {
          this.loggingService.error('Error loading contracts', error);
          this.snackbarService.showError('Failed to load contracts');
        }
      });
  }

  private setupContractSearch(): void {
    this.contractSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredContracts = this.filterContracts(this.contracts, search);
      });
  }

  private filterContracts(contracts: ContractLookup[], search: string | null): ContractLookup[] {
    if (!search) return contracts;
    const term = search.toLowerCase();
    return contracts.filter((contract) =>
      `${contract.contractId} - ${contract.description}`.toLowerCase().includes(term)
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [],
      title: '',
      subtitle: '',
      actions: []
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      pagination: {
        pageSize: 25,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true
      },
      sortConfig: {
        column: 'testId',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No contract profile tests available to display',
      loadingMessage: 'Loading contract profile tests...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<ContractProfileTestTableModel>[] {
    return [
      {
        key: 'testId',
        header: 'Test ID',
        sortable: true,
        width: '150px'
      },
      {
        key: 'testDesc',
        header: 'Description',
        width: '300px'
      },
      {
        key: 'stopLabelFlag',
        header: 'Report Results',
        width: '150px',
        valueFormatter: (value) => {
          if (value === 'Y') return 'Yes';
          if (value === 'N') return 'No';
          return '-';
        }
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        width: '150px',
        valueFormatter: (value) => formatTableDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        width: '180px',
        valueFormatter: (value) => formatTableDate(value)
      },
      {
        key: 'lastModifiedDate',
        header: 'Last Modified',
        width: '180px',
        valueFormatter: (value) => formatTableDate(value)
      }
    ];
  }

  private getRowActions(): RowAction<ContractProfileTestTableModel>[] {
    return [
      {
        icon: 'edit',
        label: 'Edit contract profile test',
        ariaLabel: 'Edit contract profile test',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  onContractChange(): void {
    const contractId = this.contractIdControl.value;
    if (contractId) {
      const contract = this.contracts.find(c => c.contractId === contractId);
      this.selectedContractDescription = contract?.description || '';
      this.currentPageIndex = 0;
      this.loadData();
    } else {
      this.selectedContractDescription = '';
      this.dataSource = [];
    }
  }

  getSelectedContractTooltip(): string {
    const contractId = this.contractIdControl.value;
    if (!contractId) {
      return '';
    }
    const contract = this.contracts.find(c => c.contractId === contractId);
    return contract ? `${contract.contractId} - ${contract.description}` : contractId;
  }

  clearAll(): void {
    this.contractIdControl.setValue('');
    this.selectedContractDescription = '';
    this.searchText = '';
    this.dataSource = [];
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.totalRecords = 0;
      this.tableConfig.pagination.pageIndex = 0;
    }
  }

  onSearch(searchText: string): void {
    this.searchText = searchText;
    // Reset to first page when searching
    this.currentPageIndex = 0;
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    // Reload data with search filter
    if (this.contractIdControl.value) {
      this.loadData();
    }
  }

  loadData(): void {
    const contractId = this.contractIdControl.value;
    if (!contractId) {
      return;
    }

    this.isLoading = true;
    this.hasError = false;

    const take = this.currentPageSize;
    const skip = this.currentPageIndex * this.currentPageSize;

    const filters: ContractTestQueryDto = {
      searchKeyword: this.searchText || undefined,
      sortColumn: this.tableConfig.sortConfig?.column === 'testId' ? 'TestId' :
                   this.tableConfig.sortConfig?.column === 'effDate' ? 'EffDate' :
                   this.tableConfig.sortConfig?.column === 'termDate' ? 'TermDate' : 'TestId',
      sortOrder: this.sortDirection
    };

    this.service
      .searchContractTests(contractId, take, skip, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data || [];

          // Update pagination config
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = response.total || 0;
            this.tableConfig.pagination.pageIndex = this.currentPageIndex;
            this.tableConfig.pagination.pageSize = this.currentPageSize;
          }

          this.isLoading = false;
        },
        error: (error: unknown) => {
          this.loggingService.error('Error loading contract profile tests', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load data. Please try again.';
        }
      });
  }

  onPageChange(event: TablePageEvent): void {
    this.currentPageIndex = event.pageIndex;
    this.currentPageSize = event.pageSize;
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    // Toggle sort direction ('A' = ascending, 'D' = descending)
    if (event.direction === 'A') {
      this.sortDirection = 'ASC';
    } else if (event.direction === 'D') {
      this.sortDirection = 'DESC';
    } else {
      this.sortDirection = 'ASC';
    }

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<ContractProfileTestTableModel>): void {
    switch (event.action) {
      case 'edit':
        this.openEditPanel(event.row);
        break;
    }
  }

  openAddPanel(): void {
    const contractId = this.contractIdControl.value;
    if (!contractId) {
      this.snackbarService.showError('Please select a contract first');
      return;
    }
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  openEditPanel(row: ContractProfileTestTableModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = row;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSave(formValue: ContractProfileTestFormValue): void {
    if (this.sidePanelMode === 'add') {
      this.handleAdd(formValue, false);
    } else {
      this.handleUpdate(formValue);
    }
  }

  onSaveAndCreateAnother(formValue: ContractProfileTestFormValue): void {
    this.handleAdd(formValue, true);
  }

  private handleAdd(formValue: ContractProfileTestFormValue, createAnother: boolean): void {
    const contractId = this.contractIdControl.value;
    if (!contractId) {
      return;
    }

    // Convert Moment to YYYY-MM-DD format to avoid timezone shift issues
    const effDate = DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '';
    const termDate = DateFieldValidationUtility.serializeDateForApi(formValue.termDate) || undefined;

    const payload: CreateContractTestRequest = {
      contractId,
      testId: formValue.testId,
      stopLabelFlag: formValue.stopLabelFlag!,
      effDate,
      termDate
    };

    this.service.createContractTest(payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.addEditComponent?.resetSubmittingState();
        })
      )
      .subscribe({
        next: () => {
          this.snackbarService.showSuccess('Contract test created successfully');
          this.loadData();

          if (createAnother) {
            this.addEditComponent?.resetForm();
          } else {
            this.closeSidePanel();
          }
        },
        error: (error) => {
          const errorMessage = this.formatErrorMessage(error);
          this.snackbarService.showError(errorMessage);
        }
      });
  }

  private handleUpdate(formValue: ContractProfileTestFormValue): void {
    if (!this.sidePanelData) return;

    const contractId = this.contractIdControl.value;
    if (!contractId) {
      return;
    }

    // Convert Moment to YYYY-MM-DD format to avoid timezone shift issues
    const effDate = DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '';
    const termDate = DateFieldValidationUtility.serializeDateForApi(formValue.termDate) || undefined;

    const payload: UpdateContractTestRequest = {
      stopLabelFlag: formValue.stopLabelFlag!,
      effDate,
      termDate
    };

    // contractId and testId are URL params (immutable)
    this.service.updateContractTest(contractId, this.sidePanelData.testId, payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.addEditComponent?.resetSubmittingState();
        })
      )
      .subscribe({
        next: () => {
          this.snackbarService.showSuccess('Contract test updated successfully');
          this.loadData();
          this.closeSidePanel();
        },
        error: (error) => {
          const errorMessage = this.formatErrorMessage(error);
          this.snackbarService.showError(errorMessage);
        }
      });
  }

  /**
   * Formats error message from API response
   * @param error - Error object from API
   * @returns Formatted error message with error code
   */
  private formatErrorMessage(error: any): string {
    // Check if error has errorResponse object
    if (error?.errorResponse) {
      const errorCode = error.errorResponse.errorCode || error.errorCode;
      const errorMsg = error.errorResponse.error || error.error;

      if (errorCode && errorMsg) {
        return `Error ${errorCode}: ${errorMsg}`;
      }
      if (errorMsg) {
        return errorMsg;
      }
    }

    // Fallback to checking direct properties
    if (error?.errorCode && error?.error) {
      return `Error ${error.errorCode}: ${error.error}`;
    }

    // Fallback to message property
    if (error?.message) {
      return error.message;
    }

    // Default fallback
    return 'An error occurred. Please try again.';
  }
}
