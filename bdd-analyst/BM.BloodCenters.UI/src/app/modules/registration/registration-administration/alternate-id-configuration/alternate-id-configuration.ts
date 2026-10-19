import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { DeleteConfirmationDialog } from './delete-confirmation-dialog/delete-confirmation-dialog';

import { AlternateIdService } from './services/alternate-id.service';
import {
  AlternateIdDonorGrade,
  AlternateIdSearchParams,
  DropdownOption,
  ALTID_MATCH_TYPE_OPTIONS,
} from './models/alternate-id.model';
import { HeaderService } from '@shared/services/header.service';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { AlternateIdFilterChipsUtils } from './utils/filter-chips.utils';
import { AlternateIdFilterPanel } from './alternate-id-filter-panel/alternate-id-filter-panel';
import { AddEditAlternateId } from './add-edit-alternate-id/add-edit-alternate-id';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { PageHeaderService } from '@shared/services/page-header.service';
import moment from 'moment';

@Component({
  selector: 'app-alternate-id-configuration',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditAlternateId,
    DeleteConfirmationDialog
  ],
  templateUrl: './alternate-id-configuration.html',
  styleUrls: ['./alternate-id-configuration.scss'],
})
export class AlternateIdConfiguration implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 1,
    ariaLabel: ''
  };

  tableConfig: DataTableConfig<AlternateIdDonorGrade> = {
    columns: [],
    rowActions: [],
    sortConfig: {
      column: 'keyDataGrade',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: false
  };

  appliedFilters: AlternateIdSearchParams | null = null;
  filterChips: FilterChip[] = [];

  allData: AlternateIdDonorGrade[] = [];
  dataSource: AlternateIdDonorGrade[] = [];
  searchText = '';

  isLoading = false;

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: AlternateIdDonorGrade | null = null;

  // Filter Panel State
  isFilterOpen = false;

  // Filter options derived from table data
  filterKeyGradeOptions: DropdownOption[] = [];
  filterAltIdMatchOptions: DropdownOption[] = [];
  filterFinalGradeOptions: DropdownOption[] = [];

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  constructor(
    private service: AlternateIdService,
    private overlay: Overlay,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initializeConfigurations();

    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        const navigation = this.router.getCurrentNavigation();
        const state = navigation?.extras?.state || window.history.state;

        const breadcrumbs = state?.['fromDonorDetailQuery']
          ? [
              { label: 'Home', link: '/home' },
              { label: 'Donor Detail Query', link: '/donor-functions/donor-profile/donor-detail-query' },
              { label: pageData.title, link: null }
            ]
          : [
              { label: 'Home', link: '/home' },
              { label: pageData.title, link: null }
            ];
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs,
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' }
      ],
      title: '',
      subtitle: '',
      actions: [{
        label: 'ADD ALTERNATE ID',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Add new alternate ID configuration',
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search by Key Grade, Alternate ID Match or Final Grade',
      minLength: 1,
      ariaLabel: 'Search alternate ID configurations',
      searchOnEnterOnly: true
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      sortConfig: {
        column: 'keyDataGrade',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No records found matching the current criteria',
      loadingMessage: 'Loading alternate ID configuration data...',
      showPagination: false
    };
  }

  private getTableColumns(): TableColumn<AlternateIdDonorGrade>[] {
    return [
      {
        key: 'keyDataGrade',
        header: 'Key Grade',
        sortable: true,
        width: '120px'
      },
      {
        key: 'altidMatchType',
        header: 'Alternate ID Match',
        width: '180px',
        valueFormatter: (value) => {
          const option = ALTID_MATCH_TYPE_OPTIONS.find(opt => opt.value === value);
          return option ? option.label : value;
        }
      },
      {
        key: 'finalGrade',
        header: 'Final Grade',
        width: '120px'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        width: '150px',
        valueFormatter: (value) => value ? DateFieldValidationUtility.formatDateForUI(moment(value)) : '-'
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        width: '150px',
        valueFormatter: (value) => value ? DateFieldValidationUtility.formatDateForUI(moment(value)) : '-'
      }
    ];
  }

  private getRowActions(): RowAction<AlternateIdDonorGrade>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit configuration',
        ariaLabel: 'Edit configuration {{keyDataGrade}}',
        color: 'default',
        action: 'edit'
      },
      {
        icon: 'delete',
        iconSvg: 'assets/images/icons/delete.svg',
        label: 'Delete configuration',
        ariaLabel: 'Delete configuration {{keyDataGrade}}',
        color: 'default',
        action: 'delete'
      }
    ];
  }

  loadData(showLoading: boolean = true): void {
    if (showLoading) {
      this.isLoading = true;
    }

    this.service
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: AlternateIdDonorGrade[]) => {
          this.allData = data;
          this.updateFilterOptionsFromData();
          this.applyClientFilters();
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.allData = [];
          this.dataSource = [];
          this.snackBar.open('Failed to load alternate ID configuration data. Please try again.', 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  private applyClientFilters(): void {
    let filtered = [...this.allData];

    // Search text filter
    if (this.searchText) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(item => {
        const matchLabel = ALTID_MATCH_TYPE_OPTIONS.find(opt => opt.value === item.altidMatchType)?.label || item.altidMatchType;
        return item.keyDataGrade?.toLowerCase().includes(search) ||
          matchLabel?.toLowerCase().includes(search) ||
          item.finalGrade?.toLowerCase().includes(search);
      });
    }

    // Dropdown filters
    if (this.appliedFilters) {
      if (this.appliedFilters.keyDataGrade) {
        filtered = filtered.filter(item => item.keyDataGrade === this.appliedFilters!.keyDataGrade);
      }
      if (this.appliedFilters.altidMatchType) {
        filtered = filtered.filter(item => item.altidMatchType === this.appliedFilters!.altidMatchType);
      }
      if (this.appliedFilters.finalGrade) {
        filtered = filtered.filter(item => item.finalGrade === this.appliedFilters!.finalGrade);
      }

      // Effective date filter
      if (this.appliedFilters.effDate && this.appliedFilters.effDatePeriod) {
        const filterDate = moment(this.appliedFilters.effDate).startOf('day');
        filtered = filtered.filter(item => {
          if (!item.effDate) return false;
          const itemDate = moment(item.effDate).startOf('day');
          return this.appliedFilters!.effDatePeriod === 'After'
            ? itemDate.isSameOrAfter(filterDate)
            : itemDate.isSameOrBefore(filterDate);
        });
      }

      // Termination date filter
      if (this.appliedFilters.termDate && this.appliedFilters.termDatePeriod) {
        const filterDate = moment(this.appliedFilters.termDate).startOf('day');
        filtered = filtered.filter(item => {
          if (!item.termDate) return false;
          const itemDate = moment(item.termDate).startOf('day');
          return this.appliedFilters!.termDatePeriod === 'After'
            ? itemDate.isSameOrAfter(filterDate)
            : itemDate.isSameOrBefore(filterDate);
        });
      }
    }

    this.dataSource = filtered;

    // Apply current sort
    const sortConfig = this.tableConfig.sortConfig;
    if (sortConfig?.column && sortConfig.direction !== 'default') {
      this.sortDataLocally(sortConfig.column, sortConfig.direction);
    }
  }

  onSearch(searchText: string): void {
    this.searchText = searchText || '';
    this.applyClientFilters();
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;
    if (event.direction !== 'default') {
      this.sortDataLocally(event.column, event.direction);
    }
  }

  private sortDataLocally(column: string, direction: 'A' | 'D'): void {
    this.dataSource = [...this.dataSource].sort((a: AlternateIdDonorGrade, b: AlternateIdDonorGrade) => {
      const valA = a[column as keyof AlternateIdDonorGrade] ?? '';
      const valB = b[column as keyof AlternateIdDonorGrade] ?? '';

      let comparison = 0;
      if (valA < valB) comparison = -1;
      else if (valA > valB) comparison = 1;

      return direction === 'A' ? comparison : -comparison;
    });
  }

  onRowAction(event: TableRowActionEvent<AlternateIdDonorGrade>): void {
    switch (event.action) {
      case 'edit':
        this.editRecord(event.row);
        break;
      case 'delete':
        this.deleteRecord(event.row);
        break;
    }
  }

  createRecord(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  editRecord(record: AlternateIdDonorGrade): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
  }

  deleteRecord(record: AlternateIdDonorGrade): void {
    const dialogRef = this.dialog.open(DeleteConfirmationDialog, {
      width: '400px',
      data: {
        title: 'Delete Alternate ID',
        message: 'Are you sure you want to delete Alternate ID? This action will proceed with deleting selected Alternate ID record.',
        confirmText: 'YES, DELETE',
        cancelText: 'NO, CANCEL'
      },
      disableClose: true
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;

        this.service.delete(record.auditKey)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.snackBar.open('Alternate ID configuration deleted successfully', 'Close', {
                duration: 3000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['success-snackbar']
              });
              this.loadData();
            },
            error: () => {
              // Handled globally by authInterceptor
            }
          });
      });
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSaveSuccess(): void {
    this.loadData();
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      return;
    }

    this.isFilterOpen = true;

    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.tableCard)
      .withPositions([
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'top',
          offsetX: 0,
          offsetY: 56
        }
      ])
      .withPush(true)
      .withViewportMargin(16)
      .withFlexibleDimensions(false)
      .withGrowAfterOpen(false);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
      width: '320px',
      minWidth: '320px',
      maxWidth: '320px'
    });

    const portal = new ComponentPortal(AlternateIdFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;
    componentRef.instance.keyGradeOptions = this.filterKeyGradeOptions;
    componentRef.instance.altIdMatchOptions = this.filterAltIdMatchOptions;
    componentRef.instance.finalGradeOptions = this.filterFinalGradeOptions;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });
  }

  applyFilters(filters: AlternateIdSearchParams): void {
    this.appliedFilters = filters;
    this.filterChips = AlternateIdFilterChipsUtils.convertFiltersToChips(filters);
    this.applyClientFilters();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = AlternateIdFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );
    this.filterChips = AlternateIdFilterChipsUtils.convertFiltersToChips(this.appliedFilters);
    this.applyClientFilters();
  }

  hasActiveFilters(): boolean {
    return AlternateIdFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    this.applyClientFilters();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.handleChapterChange();
      });
  }

  private handleChapterChange(): void {
    this.searchText = '';
    if (this.searchBarComponent) {
      this.searchBarComponent.searchText = '';
    }

    this.appliedFilters = null;
    this.filterChips = [];

    this.closeSidePanel();

    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
    }

    this.allData = [];
    this.dataSource = [];
    this.loadData();
  }

  private updateFilterOptionsFromData(): void {
    const keyGrades = [...new Set(this.allData.map(d => d.keyDataGrade).filter(Boolean))].sort();
    this.filterKeyGradeOptions = keyGrades.map(g => ({ value: g, label: g }));

    const altIdMatches = [...new Set(this.allData.map(d => d.altidMatchType).filter(Boolean))].sort();
    this.filterAltIdMatchOptions = altIdMatches.map(m => {
      const opt = ALTID_MATCH_TYPE_OPTIONS.find(o => o.value === m);
      return { value: m, label: opt ? opt.label : m };
    });

    const finalGrades = [...new Set(this.allData.map(d => d.finalGrade).filter(Boolean))].sort();
    this.filterFinalGradeOptions = finalGrades.map(g => ({ value: g, label: g }));
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 'n') {
      event.preventDefault();
      this.createRecord();
    }

    if (event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.searchBarComponent?.focus();
    }

    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.openFilter();
    }

    if (event.key === 'Escape' && this.overlayRef) {
      event.preventDefault();
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
    }

    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }
}
