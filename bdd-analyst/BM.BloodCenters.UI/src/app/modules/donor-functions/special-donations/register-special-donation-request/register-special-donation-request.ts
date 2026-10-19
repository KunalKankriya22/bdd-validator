import { Component, OnInit, OnDestroy, AfterViewInit, signal, effect, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { OverlayModule } from '@angular/cdk/overlay';
import { Subject, takeUntil } from 'rxjs';

import { RegisterSpecialDonationRequestService } from './register-special-donation-request.service';
import { SpecialPatientListItem, SpecialDonationSearchRequest, SpecialDonationFilterValue } from './register-special-donation-request.models';
import { AddRequestDialogComponent } from './add-request-dialog/add-request-dialog';
import { EditPatientDialogComponent } from './edit-patient-dialog/edit-patient-dialog';
import { SurgeryDialogComponent } from './surgery-dialog/surgery-dialog';
import { SpecialDonationFilterPanel } from './filter-panel/filter-panel';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableSortEvent, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import { formatTableDate } from '@shared/utils/date-format.util';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { SpecialDonationFilterChipsUtils } from './utils/filter-chips.utils';

@Component({
  selector: 'app-register-special-donation-request',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    OverlayModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    SpecialDonationFilterPanel,
    FilterChips,
  ],
  templateUrl: './register-special-donation-request.html',
  styleUrls: ['./register-special-donation-request.scss'],
})
export class RegisterSpecialDonationRequestComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  @ViewChild('patientNameCellTemplate', { static: true }) patientNameCellTemplate!: TemplateRef<any>;
  @ViewChild('statusCellTemplate', { static: true }) statusCellTemplate!: TemplateRef<any>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Register Special Donation Request', link: null },
    ],
    title: 'Register Special Donation Request',
    subtitle: 'Register and manage a special donation request for a patient.',
    actions: [
      {
        label: 'ADD NEW REQUEST',
        icon: 'add',
        color: 'primary',
        onClick: () => this.openAddRequestDialog(),
      },
    ],
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by patient name or ID',
    minLength: 1,
    ariaLabel: 'Search by patient name or ID',
    searchOnEnterOnly: true,
  };

  tableConfig: DataTableConfig<SpecialPatientListItem> = {
    columns: [
      {
        key: 'patientName',
        header: 'Patient Name',
        sortable: true,
        width: '14%',
      },
      {
        key: 'patId',
        header: 'Patient ID',
        width: '10%',
      },
      {
        key: 'dob',
        header: 'Date of Birth',
        width: '11%',
        valueFormatter: (value: string) => formatTableDate(value),
      },
      {
        key: 'sex',
        header: 'Sex',
        width: '7%',
        valueFormatter: (value: string) => {
          if (value === 'M') return 'Male';
          if (value === 'F') return 'Female';
          return value || '-';
        },
      },
      {
        key: 'surgDate',
        header: 'Surgery Date',
        width: '11%',
        valueFormatter: (value: string) => formatTableDate(value),
      },
      {
        key: 'dateNeededBy',
        header: 'Needed By',
        width: '11%',
        valueFormatter: (value: string) => formatTableDate(value),
      },
      {
        key: 'shipLocnName',
        header: 'Ship to',
        width: '25%',
        truncate: true,
      },
      {
        key: 'status',
        header: 'Status',
        width: '9%',
        minWidth: '110px',
      },
    ],
    rowActions: [
      {
        icon: 'edit',
        label: 'Edit Patient Details',
        ariaLabel: 'Edit patient details for {{patLastName}}',
        action: 'edit-patient',
      },
      {
        icon: 'medical_services',
        label: 'Edit Surgery Details',
        ariaLabel: 'Edit surgery details for {{patLastName}}',
        action: 'edit-surgery',
      },
      {
        icon: 'add',
        label: 'Add New Surgery Details',
        ariaLabel: 'Add new surgery for {{patLastName}}',
        action: 'add-surgery',
      },
      {
        icon: 'description',
        label: 'View Patient Document',
        ariaLabel: 'View patient document for {{patLastName}}',
        action: 'view-patient-doc',
      },
      {
        icon: 'folder',
        label: 'View Surgery Document',
        ariaLabel: 'View surgery document for {{patLastName}}',
        action: 'view-surgery-doc',
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
      column: 'patientName',
      direction: 'A',
    },
    stickyHeader: true,
    showActionsAsMenu: true,
    noDataIcon: 'search',
    emptyMessage: 'No patients found',
    loadingMessage: 'Loading patients...',
    showPagination: true,
  };

  patients = signal<SpecialPatientListItem[]>([]);
  isLoading = signal(false);
  searchText = '';

  isFilterOpen = false;
  appliedFilters: SpecialDonationFilterValue | null = null;
  filterChips: FilterChip[] = [];

  constructor(
    private service: RegisterSpecialDonationRequestService,
    private dialog: MatDialog,
    private router: Router,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService,
  ) {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || 'Register and manage a special donation request for a patient.',
        };
      }
    });
  }

  ngOnInit(): void {
    this.restoreStateIfPresent();
    this.loadData();
    this.headerService.chapterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadData();
    });
    this.checkReturnAction();
  }

  private restoreStateIfPresent(): void {
    const saved = (history.state as any)?.restoreState;
    if (!saved) return;
    this.searchText = saved.searchText || '';
    this.appliedFilters = saved.appliedFilters || null;
    this.filterChips = saved.filterChips || [];
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: saved.pageIndex ?? 0,
        pageSize: saved.pageSize ?? 25,
      },
      sortConfig: {
        column: saved.sortColumn || 'patientName',
        direction: saved.sortDirection || 'A',
      },
    };
    history.replaceState({}, '');
  }

  private checkReturnAction(): void {
    const state = (history.state as any);
    if (state?.returnAction === 'reopen-add-request-dialog') {
      const dialogData = state.addRequestDialogData;
      history.replaceState({}, '');
      const dialogRef = this.dialog.open(AddRequestDialogComponent, {
        width: '55vw',
        minWidth: '700px',
        height: 'calc(100vh - 64px)',
        maxWidth: '100vw',
        maxHeight: 'calc(100vh - 64px)',
        disableClose: false,
        panelClass: 'code-dialog-panel-right',
        position: { right: '0', top: '64px' },
        hasBackdrop: true,
        backdropClass: 'code-dialog-backdrop',
        data: dialogData,
      });
      dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result) => {
        if (result) this.loadData();
      });
    }
  }

  ngAfterViewInit(): void {
    const patientNameCol = this.tableConfig.columns.find(c => c.key === 'patientName');
    if (patientNameCol && this.patientNameCellTemplate) {
      patientNameCol.cellTemplate = this.patientNameCellTemplate;
    }
    const statusCol = this.tableConfig.columns.find(c => c.key === 'status');
    if (statusCol && this.statusCellTemplate) {
      statusCol.cellTemplate = this.statusCellTemplate;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.isLoading.set(true);

    const sortDir = this.tableConfig.sortConfig?.direction;
    const sortDirection = sortDir === 'A' ? 'ASC' : sortDir === 'D' ? 'DESC' : 'ASC';
    const uiColumn = this.tableConfig.sortConfig?.column || 'patientName';
    const sortColumn = uiColumn === 'patientName' ? 'patLastName' : uiColumn;

    const request: SpecialDonationSearchRequest = {
      searchText: this.searchText || undefined,
      status: this.appliedFilters?.status || 'B',
      shipTo: this.appliedFilters?.shipTo || undefined,
      surgeryDate: this.appliedFilters?.surgeryDate || undefined,
      surgeryDatePeriod: this.appliedFilters?.surgeryDatePeriod || undefined,
      neededByDate: this.appliedFilters?.neededBy || undefined,
      neededByPeriod: this.appliedFilters?.neededByPeriod || undefined,
      sortColumn,
      sortDirection,
      pageNumber: (this.tableConfig.pagination?.pageIndex || 0) + 1,
      pageSize: this.tableConfig.pagination?.pageSize || 25,
    };

    this.service
      .search(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.patients.set(response?.data || []);
          this.tableConfig = {
            ...this.tableConfig,
            pagination: {
              ...this.tableConfig.pagination!,
              totalRecords: response?.total || 0,
            },
          };
          this.isLoading.set(false);
        },
        error: () => {
          this.patients.set([]);
          this.isLoading.set(false);
        },
      });
  }

  onSearch(searchText: string): void {
    this.searchText = searchText;
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: 0,
      },
    };
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: event.column, direction: event.direction },
    };
    this.loadData();
  }

  onPageChange(event: TablePageEvent): void {
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: event.pageIndex,
        pageSize: event.pageSize,
      },
    };
    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<SpecialPatientListItem>): void {
    switch (event.action) {
      case 'edit-patient':
        this.openEditPatientDialog(event.row);
        break;
      case 'edit-surgery':
        this.openEditSurgeryDialog(event.row);
        break;
      case 'add-surgery':
        this.openAddSurgeryDialog(event.row);
        break;
      case 'view-patient-doc':
        this.viewPatientDocument(event.row);
        break;
      case 'view-surgery-doc':
        this.viewSurgeryDocument(event.row);
        break;
    }
  }

  getPatientName(row: SpecialPatientListItem): string {
    return `${row.patLastName || ''}, ${row.patFirstName || ''}`.replace(/^, |, $/, '');
  }

  navigateToDetail(patId: string): void {
    this.router.navigate(['/donor-functions/special-donations/register-special-donation-request', patId]);
  }

  openAddRequestDialog(): void {
    const dialogRef = this.dialog.open(AddRequestDialogComponent, {
      width: '55vw',
      minWidth: '700px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (result) this.loadData();
    });
  }

  private openEditPatientDialog(row: SpecialPatientListItem): void {
    const dialogRef = this.dialog.open(EditPatientDialogComponent, {
      width: '55vw',
      minWidth: '700px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: { patId: row.patId },
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (result) this.loadData();
    });
  }

  private openAddSurgeryDialog(row: SpecialPatientListItem): void {
    const dialogRef = this.dialog.open(SurgeryDialogComponent, {
      width: '55vw',
      minWidth: '700px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: { patId: row.patId, mode: 'add' },
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (result) this.loadData();
    });
  }

  private openEditSurgeryDialog(row: SpecialPatientListItem): void {
    const dialogRef = this.dialog.open(SurgeryDialogComponent, {
      width: '55vw',
      minWidth: '700px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: { patId: row.patId, mode: 'edit' },
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (result) this.loadData();
    });
  }

  private viewPatientDocument(row: SpecialPatientListItem): void {
    this.saveStateAndNavigateToDocLibrary(row.patId);
  }

  private viewSurgeryDocument(row: SpecialPatientListItem): void {
    if (!row.surgId) return;
    this.saveStateAndNavigateToDocLibrary(row.surgId);
  }

  private saveStateAndNavigateToDocLibrary(linkedValue: string): void {
    history.replaceState({
      restoreState: {
        searchText: this.searchText,
        appliedFilters: this.appliedFilters,
        filterChips: this.filterChips,
        pageIndex: this.tableConfig.pagination?.pageIndex || 0,
        pageSize: this.tableConfig.pagination?.pageSize || 25,
        sortColumn: this.tableConfig.sortConfig?.column,
        sortDirection: this.tableConfig.sortConfig?.direction,
      },
    }, '');
    this.router.navigate(['/system-administration/user-admin/lab-dist-user-admin/user-utilities/document-library'], {
      queryParams: { linkedValue },
    });
  }

  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  onApplyFilters(filters: SpecialDonationFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = SpecialDonationFilterChipsUtils.convertFiltersToChips(filters);
    this.isFilterOpen = false;
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: 0,
      },
    };
    this.loadData();
  }

  hasActiveFilters(): boolean {
    return SpecialDonationFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = SpecialDonationFilterChipsUtils.removeFilterByChipKey(this.appliedFilters, chipKey);
    this.filterChips = SpecialDonationFilterChipsUtils.convertFiltersToChips(this.appliedFilters);
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: 0,
      },
    };
    this.loadData();
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: 0,
      },
    };
    this.loadData();
  }

}

