import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OverlayModule } from '@angular/cdk/overlay';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';

import { AssociateLetterService } from './services/associate-letter.service';
import {
  LetterInterdictionAssociation,
  AssociationFilterCriteria,
  InterdictionCodeOption,
  DonationTypeOption,
  LetterCodeOption,
  CreateAssociationRequest,
  UpdateAssociationRequest
} from './models/associate-letter.model';
import { FilterPanelComponent } from './panels/filter-panel/filter-panel.component';
import { LinkLetterPanelComponent } from './panels/link-letter-panel/link-letter-panel.component';
import { EditRulePanelComponent } from './panels/edit-rule-panel/edit-rule-panel.component';

@Component({
  selector: 'app-associate-letter-to-interdiction',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    OverlayModule,
    PageHeaderWithBreadcrumb,
    FilterChips,
    SearchBar,
    DataTable,
    FilterPanelComponent,
    LinkLetterPanelComponent,
    EditRulePanelComponent
  ],
  templateUrl: './associate-letter-to-interdiction.component.html',
  styleUrls: ['./associate-letter-to-interdiction.component.scss']
})
export class AssociateLetterToInterdictionComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;

  // Panel state
  filterPanelOpen = false;
  sidePanelOpen = false;
  sidePanelMode: 'link' | 'edit' = 'link';

  // Data
  dataSource: LetterInterdictionAssociation[] = [];
  isLoading = false;
  hasError = false;
  editingRow: LetterInterdictionAssociation | null = null;
  totalRecords = 0;
  pageSize = 25;
  currentPage = 0;

  // Dropdown data
  interdictionCodeOptions: InterdictionCodeOption[] = [];
  donationTypeOptions: DonationTypeOption[] = [];
  letterCodeOptions: LetterCodeOption[] = [];

  // Filters
  activeFilters: AssociationFilterCriteria = {};
  filterChips: FilterChip[] = [];

  // Search
  searchTerm = '';

  // Page header configuration
  pageHeaderConfig: PageHeaderConfig = {
    title: 'Associate Letter to Interdiction',
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Donor Functions' },
      { label: 'Donor Notification' },
      { label: 'Notification Administration' },
      { label: 'Associate Letter to Interdiction' }
    ],
    actions: [{
      label: 'LINK LETTER',
      color: 'accent',
      ariaLabel: 'Link new letter to interdiction',
      onClick: () => this.openLinkLetterPanel()
    }]
  };

  // Search bar configuration
  searchBarConfig: SearchBarConfig = {
    placeholder: 'Search by code or donation type',
    debounceTime: 300,
    searchOnEnterOnly: true
  };

  // Table configuration
  tableConfig: DataTableConfig<LetterInterdictionAssociation> = {
    columns: [],
    rowActions: [],
    sortConfig: {
      column: 'interdictionCode',
      direction: 'default'
    },
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [25, 50, 100]
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No Letter to Interdiction Associations Available To Display',
    noDataIcon: 'edit',
    loadingMessage: 'Loading association data...',
    showPagination: true
  };

  constructor(
    private associateLetterService: AssociateLetterService,
    private snackBar: MatSnackBar
  ) {
    this.initializeTableConfig();
  }

  ngOnInit(): void {
    this.loadDropdownData();
    this.loadAssociations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeTableConfig(): void {
    this.tableConfig.columns = this.getTableColumns();
    this.tableConfig.rowActions = this.getRowActions();
  }

  private getTableColumns(): TableColumn<LetterInterdictionAssociation>[] {
    return [
      {
        key: 'interdictionCode',
        header: 'Interdiction Code',
        sortable: true,
        width: '150px'
      },
      {
        key: 'interdictionDescription',
        header: 'Interdiction Description',
        sortable: false,
        width: '250px'
      },
      {
        key: 'donationType',
        header: 'Donation Type',
        sortable: true,
        width: '150px'
      },
      {
        key: 'donationDescription',
        header: 'Donation Description',
        sortable: false,
        width: '200px'
      },
      {
        key: 'letterId',
        header: 'Letter ID',
        sortable: true,
        width: '150px'
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        sortable: false,
        width: '150px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        sortable: false,
        width: '150px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  private getRowActions(): RowAction<LetterInterdictionAssociation>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit association',
        ariaLabel: 'Edit association {{interdictionCode}}',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  private loadDropdownData(): void {
    this.associateLetterService.getDropdownData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.interdictionCodeOptions = response.interdictionCodes;
          this.donationTypeOptions = response.donationTypes;
          this.letterCodeOptions = response.letterCodes;
        },
        error: (error) => {
          console.error('Error loading dropdown data:', error);
          this.showError('Failed to load dropdown data');
        }
      });
  }

  loadAssociations(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip = this.currentPage * this.pageSize;

    this.associateLetterService.getAssociations(
      this.pageSize,
      skip,
      this.activeFilters
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        this.dataSource = response.data;
        this.totalRecords = response.totalCount;

        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.totalRecords = response.totalCount;
          this.tableConfig.pagination.pageIndex = this.currentPage;
          this.tableConfig.pagination.pageSize = this.pageSize;
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading associations:', error);
        this.hasError = true;
        this.isLoading = false;
        this.showError('Failed to load association data');
      }
    });
  }

  onSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.currentPage = 0;
    this.loadAssociations();
  }

  onSortChange(event: TableSortEvent): void {
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }
    this.loadAssociations();
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadAssociations();
  }

  onRowAction(event: TableRowActionEvent<LetterInterdictionAssociation>): void {
    if (event.action === 'edit') {
      this.openEditRulePanel(event.row);
    }
  }

  toggleFilterPanel(): void {
    this.filterPanelOpen = !this.filterPanelOpen;
  }

  closeFilterPanel(): void {
    this.filterPanelOpen = false;
  }

  /* -------------------------------- SIDE PANEL -------------------------------- */

  openLinkLetterPanel(): void {
    this.sidePanelMode = 'link';
    this.editingRow = null;
    this.sidePanelOpen = true;
  }

  openEditRulePanel(association: LetterInterdictionAssociation): void {
    this.sidePanelMode = 'edit';
    this.editingRow = association;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.editingRow = null;
  }

  /* -------------------------------- FILTERS -------------------------------- */

  onFilterApply(filters: AssociationFilterCriteria): void {
    this.activeFilters = filters;
    this.updateFilterChips();
    this.closeFilterPanel();
    this.currentPage = 0;
    this.loadAssociations();
  }

  onFilterClear(): void {
    this.activeFilters = {};
    this.filterChips = [];
    this.closeFilterPanel();
    this.currentPage = 0;
    this.loadAssociations();
  }

  onRemoveFilter(chipKey: string): void {
    const [filterKey] = chipKey.split(':');
    delete (this.activeFilters as any)[filterKey];
    this.updateFilterChips();
    this.currentPage = 0;
    this.loadAssociations();
  }

  onClearAllFilters(): void {
    this.activeFilters = {};
    this.filterChips = [];
    this.currentPage = 0;
    this.loadAssociations();
  }

  /* -------------------------------- SAVE HANDLERS -------------------------------- */

  onLinkLetterSave(request: CreateAssociationRequest): void {
    this.associateLetterService.createAssociation(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Association created successfully');
          this.loadAssociations();
        },
        error: (error) => {
          console.error('Error creating association:', error);
          this.showError('Failed to create association');
        }
      });
  }

  onEditRuleSave(request: UpdateAssociationRequest): void {
    if (!this.editingRow) return;

    const updateData: LetterInterdictionAssociation = {
      ...this.editingRow,
      terminationDate: request.terminationDate
    };

    this.associateLetterService.updateAssociation(updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Association updated successfully');
          this.closeSidePanel();
          this.loadAssociations();
        },
        error: (error) => {
          console.error('Error updating association:', error);
          this.showError('Failed to update association');
        }
      });
  }

  private updateFilterChips(): void {
    const chips: FilterChip[] = [];

    if (this.activeFilters.interdictionCode && this.activeFilters.interdictionCode !== '') {
      const option = this.interdictionCodeOptions.find(o => o.code === this.activeFilters.interdictionCode);
      chips.push({
        key: 'interdictionCode',
        label: `Interdiction Code: ${option?.code || this.activeFilters.interdictionCode}`,
        value: this.activeFilters.interdictionCode
      });
    }

    if (this.activeFilters.donationType && this.activeFilters.donationType !== '') {
      const option = this.donationTypeOptions.find(o => o.code === this.activeFilters.donationType);
      chips.push({
        key: 'donationType',
        label: `Donation Type: ${option?.code || this.activeFilters.donationType}`,
        value: this.activeFilters.donationType
      });
    }

    if (this.activeFilters.letterId && this.activeFilters.letterId !== '') {
      chips.push({
        key: 'letterId',
        label: `Letter ID: ${this.activeFilters.letterId}`,
        value: this.activeFilters.letterId
      });
    }

    this.filterChips = chips;
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
