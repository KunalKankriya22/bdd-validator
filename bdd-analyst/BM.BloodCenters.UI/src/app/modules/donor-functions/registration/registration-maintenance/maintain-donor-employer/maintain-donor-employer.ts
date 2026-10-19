import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  TemplateRef,
  effect,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

import { DonorEmployerService } from './services/donor-employer.service';
import {
  DonorEmployer,
  DonorEmployerSearchRequest
} from './models/donor-employer.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TableSortEvent,
  TableRowActionEvent,
  TablePageEvent
} from '@shared/interfaces/data-table.interface';

import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { RouteKey } from '../../../../../core/constants/route-keys';
import { ROUTE_REGISTRY } from '../../../../../core/constants/route-registry';
import { ROUTES } from '../../../../../core/constants/route.constants';

import { AddEmployerDialog } from './add-employer-dialog/add-employer-dialog';
import { EditEmployerDialog } from './edit-employer-dialog/edit-employer-dialog';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

@Component({
  selector: 'app-maintain-donor-employer',
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
    MatSnackBarModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    AddEmployerDialog,
    EditEmployerDialog
  ],
  templateUrl: './maintain-donor-employer.html',
  styleUrls: ['./maintain-donor-employer.scss']
})
export class MaintainDonorEmployerComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('statusCellTemplate', { static: true }) statusCellTemplate!: TemplateRef<DonorEmployer>;
  private destroy$ = new Subject<void>();
  private donorEmployerService = inject(DonorEmployerService);
  private snackBar = inject(MatSnackBar);
  private headerService = inject(HeaderService);
  private menuService = inject(MenuService);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: ROUTES.HOME },
      { label: 'Maintain Donor Employer', link: null }
    ],
    title: 'Maintain Donor Employer',
    subtitle: 'Activate or deactivate records of donor employers in the database.',
    actions: []
  };

  tableConfig: DataTableConfig<DonorEmployer> = {
    columns: this.getTableColumns(),
    rowActions: this.getRowActions(),
    sortConfig: {
      column: 'employerId',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    showTableOnEmpty: true,
    noDataIcon: 'search',
    emptyMessage: 'Search results will display here.',
    loadingMessage: 'Loading employers...',
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    }
  };

  searchOptions = [
    { value: 'L', label: 'Like' },
    { value: 'M', label: 'Exact' },
    { value: 'S', label: 'Soundex' }
  ];
  selectedSearchOption = '';

  employerSearchControl = new FormControl('');

  dataSource: DonorEmployer[] = [];
  isLoading = false;
  hasSearched = false;

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  employerToEdit: DonorEmployer | null = null;

  private requestState: DonorEmployerSearchRequest = {
    SearchType: 'L',
    SearchName: ''
  };

  constructor() {
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();
      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.MaintainDonorEmployer].path;
        const menuItem = this.menuService.findMenuItemByPath(basePath);
        if (menuItem) {
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: ROUTES.HOME },
              { label: menuItem.label, link: null }
            ],
            title: menuItem.label,
            subtitle: menuItem.remarks || menuItem.subtitle || this.headerConfig.subtitle
          };
        }
      }
    });
  }

  ngOnInit(): void {
    this.subscribeToChapterChanges();
  }

  ngAfterViewInit(): void {
    this.tableConfig = {
      ...this.tableConfig,
      columns: this.tableConfig.columns.map(col =>
        col.key === 'status'
          ? { ...col, cellTemplate: this.statusCellTemplate }
          : col
      )
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearSearch();
      });
  }

  get isRetrieveDisabled(): boolean {
    return !this.selectedSearchOption || !this.employerSearchControl.value?.trim();
  }

  onRetrieve(): void {
    this.requestState = {
      SearchType: this.selectedSearchOption as 'L' | 'M' | 'S',
      SearchName: this.employerSearchControl.value?.trim() || ''
    };
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.hasSearched = true;
    this.loadData();
  }

  private loadData(): void {
    if (this.isLoading) return;

    this.isLoading = true;

    const take = this.tableConfig.pagination?.pageSize || 25;
    const skip = (this.tableConfig.pagination?.pageIndex || 0) * take;

    this.donorEmployerService
      .search(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data.map(employer => ({
            ...employer,
            address: this.buildDomesticAddress(employer),
            internationalAddress: this.buildInternationalAddress(employer),
            status: this.computeStatus(employer.termDate)
          }));
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = response.totalRecords;
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.dataSource = [];
          this.handleError(error);
        }
      });
  }

  private clearSearch(): void {
    this.employerSearchControl.setValue('');
    this.dataSource = [];
    this.hasSearched = false;
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
      this.tableConfig.pagination.totalRecords = 0;
    }
    this.closeSidePanel();
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    if (event.direction === 'default') {
      this.requestState.sortColumn = undefined;
      this.requestState.sortDirection = undefined;
    } else {
      this.requestState.sortColumn = event.column;
      this.requestState.sortDirection = event.direction === 'A' ? 'A' : 'D';
    }

    this.loadData();
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<DonorEmployer>): void {
    if (event.action === 'edit') {
      this.editRecord(event.row);
    }
  }

  addNewEmployer(): void {
    this.sidePanelMode = 'add';
    this.employerToEdit = null;
    this.sidePanelOpen = true;
  }

  editRecord(employer: DonorEmployer): void {
    this.sidePanelMode = 'edit';
    this.employerToEdit = employer;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.employerToEdit = null;
  }

  onSaveSuccess(event: { message: string; employerId?: string; employerName?: string }): void {
    this.snackBar.open(event.message, 'Dismiss', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
    this.closeSidePanel();
    if (this.hasSearched) {
      this.loadData();
    }
  }

  private getTableColumns(): TableColumn<DonorEmployer>[] {
    return [
      {
        key: 'employerId',
        header: 'Employer',
        sortable: true,
        width: '120px'
      },
      {
        key: 'employerName',
        header: 'Name',
        width: '200px'
      },
      {
        key: 'address',
        header: 'Address',
        width: '200px',
        truncate: true,
        valueFormatter: (value) => value || '-'
      },
      {
        key: 'internationalAddress',
        header: 'International Address',
        width: '200px',
        truncate: true,
        valueFormatter: (value) => value || '-'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        width: '130px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        width: '140px',
        valueFormatter: (value) => value ? this.formatDate(value) : '-'
      },
      {
        key: 'status',
        header: 'Status',
        width: '100px'
      }
    ];
  }

  private getRowActions(): RowAction<DonorEmployer>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit employer',
        ariaLabel: 'Edit employer {{employerId}}',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const parts = dateStr.split('T')[0].split('-');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const year = parts[0];
    const month = monthNames[parseInt(parts[1], 10) - 1];
    const day = parts[2];
    return `${day}-${month}-${year}`;
  }

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }

  private buildDomesticAddress(employer: DonorEmployer): string {
    const parts = [employer.city, employer.state, employer.zip].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '';
  }

  private buildInternationalAddress(employer: DonorEmployer): string {
    const parts = [employer.intlCity, employer.intlState, employer.intlCountryName, employer.intlPostalCode].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '';
  }

  private computeStatus(termDate: string | null): 'Active' | 'Inactive' {
    if (!termDate) return 'Active';
    // Use chapter date instead of system date for accurate status
    const chapterDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
    const term = new Date(termDate);
    term.setHours(0, 0, 0, 0);
    // Active if termination date is in the future (after chapter date)
    return term.getTime() > chapterDate.toDate().getTime() ? 'Active' : 'Inactive';
  }

  private handleError(error: HttpErrorResponse): void {
    this.snackBar.open(HttpErrorHandler.extractErrorMessage(error, 'An error occurred. Please try again.'), 'DISMISS', {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
