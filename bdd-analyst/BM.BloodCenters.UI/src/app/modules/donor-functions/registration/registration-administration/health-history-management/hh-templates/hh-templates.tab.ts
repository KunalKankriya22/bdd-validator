import { Component, OnInit, OnDestroy, AfterViewInit, Output, EventEmitter, inject, signal, ViewChild, ElementRef, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { Overlay, OverlayRef, FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import moment from 'moment';
import { Subject, takeUntil } from 'rxjs';

import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterChip, FilterChips } from '@shared/components/filter-chips/filter-chips';
import { HeaderService } from '@shared/services/header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';

import { ROUTE_REGISTRY } from 'src/app/core/constants/route-registry';
import { RouteKey } from 'src/app/core/constants/route-keys';
import { HealthHistoryService } from '../services/health-history.service';
import {
  HHTemplateModel,
  HHTemplateDetailModel,
  HHTemplateQuestionDto,
  HHTemplateFilterValue,
  HHTemplateSearchParams,
  DropdownOption
} from '../models/health-history.model';
import { HHTemplatesFilterPanel } from './hh-templates-filter-panel/hh-templates-filter-panel';

@Component({
  selector: 'app-hh-templates-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSnackBarModule,
    SearchBar,
    FilterChips,
    DataTable
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './hh-templates.tab.html',
  styleUrls: ['./hh-templates.tab.scss']
})
export class HHTemplatesTab implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('headerCard', { read: ElementRef }) headerCard!: ElementRef<HTMLElement>;
  @ViewChild('filterButton', { read: ElementRef }) filterButton!: ElementRef<HTMLElement>;
  @ViewChild('statusCellTemplate', { static: true }) statusCellTemplate!: TemplateRef<unknown>;

  private destroy$ = new Subject<void>();
  private hhService = inject(HealthHistoryService);
  private snackBar = inject(MatSnackBar);
  private headerService = inject(HeaderService);
  private overlay = inject(Overlay);
  private router = inject(Router);
  private overlayRef: OverlayRef | null = null;

  dataSource: HHTemplateModel[] = [];
  isLoading = false;
  totalRecords = 0;
  searchText = '';

  isFilterOpen = false;
  appliedFilters: HHTemplateFilterValue | null = null;
  filterChips: FilterChip[] = [];

  @Output() viewModeChange = new EventEmitter<{ mode: 'list' | 'detail' | 'add'; templateId?: string }>();

  viewMode: 'list' | 'detail' | 'add' = 'list';
  selectedTemplate: HHTemplateDetailModel | null = null;

  donationTypes = signal<DropdownOption[]>([]);

  @ViewChild(SearchBar) searchBarComponent!: SearchBar;

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Template ID',
    minLength: 1,
    ariaLabel: 'Search health history templates',
    searchOnEnterOnly: true
  };

  tableConfig: DataTableConfig<HHTemplateModel> = {
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
      column: 'templateId',
      direction: 'default'
    },
    stickyHeader: true,
    emptyMessage: 'No templates found',
    loadingMessage: 'Loading templates...',
    showPagination: true
  };

  detailTableConfig: DataTableConfig = {
    columns: this.getDetailColumns(),
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    stickyHeader: true,
    showPagination: true,
    emptyMessage: 'No questions assigned'
  };

  ngOnInit(): void {
    this.loadDonationTypes();
    this.loadTemplates();
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
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.searchText = '';
        if (this.searchBarComponent) {
          this.searchBarComponent.clearSearch();
        }
        this.appliedFilters = null;
        this.filterChips = [];
        this.isFilterOpen = false;
        this.setViewMode('list');
        this.selectedTemplate = null;
        this.dataSource = [];
        this.totalRecords = 0;
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
        }
        this.tableConfig = {
          ...this.tableConfig,
          pagination: { ...this.tableConfig.pagination!, pageIndex: 0, totalRecords: 0 }
        };
        this.loadDonationTypes();
        this.loadTemplates();
      });
  }

  private loadDonationTypes(): void {
    this.hhService.getDonationTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe(types => this.donationTypes.set(types));
  }

  private getTableColumns(): TableColumn<HHTemplateModel>[] {
    return [
      { key: 'templateId', header: 'Template ID', sortable: true, width: '150px' },
      {
        key: 'donationTypeDescription', header: 'Donation Type', width: '180px',
        valueFormatter: (_val, row) => `${row.donationType} - ${row.donationTypeDescription || row.donationType}`
      },
      { key: 'randomizeFlag', header: 'Randomize Flag', width: '130px' },
      { key: 'status', header: 'Status', width: '110px' },
      {
        key: 'effectiveDate', header: 'Effective Date', width: '140px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'terminationDate', header: 'Termination Date', width: '150px',
        valueFormatter: (value) => value ? this.formatDate(value) : '-'
      }
    ];
  }

  private getRowActions(): RowAction<HHTemplateModel>[] {
    return [
      {
        icon: 'visibility',
        label: 'View template',
        ariaLabel: 'View template details',
        color: 'default',
        action: 'view'
      }
    ];
  }

  private getDetailColumns(): TableColumn[] {
    return [
      { key: 'questionCode', header: 'Question Code', sortable: true, width: '110px' },
      { key: 'screenerAsk', header: 'Ask', width: '60px' },
      { key: 'abbrFlag', header: 'Abbreviation Flag', width: '120px' },
      { key: 'abbrDispSeq', header: 'Abbreviated Sequence', width: '140px' },
      { key: 'repeatHhFlag', header: 'Repeated', width: '90px' },
      { key: 'gender', header: 'Sex', width: '60px' },
      { key: 'displayOrder', header: 'Sequence', width: '90px' },
      { key: 'sortSequence', header: 'Question number', width: '120px' },
      { key: 'parentQuestionCode', header: 'Parent Question', width: '130px' },
      { key: 'parentRespFlag', header: 'Response', width: '80px' },
      { key: 'subQuestionFlag', header: 'Sub Flag', width: '80px' },
      { key: 'gotoNotes', header: 'Go To Notes', width: '140px' },
      {
        key: 'effDate', header: 'Effective Date', width: '120px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'termDate', header: 'Termination Date', width: '130px',
        valueFormatter: (value) => value ? this.formatDate(value) : ''
      }
    ];
  }

  private loadTemplates(): void {
    this.isLoading = true;
    const pageSize = this.tableConfig.pagination!.pageSize;
    const skip = this.tableConfig.pagination!.pageIndex * pageSize;

    const params: HHTemplateSearchParams = {
      includeTerminated: true
    };
    if (this.searchText) {
      params.templateId = this.searchText;
    }
    if (this.appliedFilters) {
      if (this.appliedFilters.donationType) params.donationType = this.appliedFilters.donationType;
      if (this.appliedFilters.status) params.status = this.appliedFilters.status;
      if (this.appliedFilters.effectiveDate) {
        params.effectiveDate = this.appliedFilters.effectiveDate;
        params.effectiveDatePeriod = this.appliedFilters.effectiveDatePeriod;
      }
      if (this.appliedFilters.terminationDate) {
        params.terminationDate = this.appliedFilters.terminationDate;
        params.terminationDatePeriod = this.appliedFilters.terminationDatePeriod;
      }
    }
    if (this.tableConfig.sortConfig) {
      const dir = this.tableConfig.sortConfig.direction;
      if (dir === 'A' || dir === 'D') {
        params.sortBy = this.tableConfig.sortConfig.column;
        params.sortDir = dir === 'A' ? 'asc' : 'desc';
      }
    }

    this.hhService.searchTemplates(pageSize, skip, params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data.map(dto => this.mapDtoToTemplateModel(dto));
          this.totalRecords = response.totalRecords;
          this.tableConfig = {
            ...this.tableConfig,
            pagination: { ...this.tableConfig.pagination!, totalRecords: response.totalRecords }
          };
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.dataSource = [];
          const errResp = error.error?.errorResponse;
          const errorMessage = errResp?.error
            ? `Error: ${errResp.errorCode ? errResp.errorCode + ' ' : ''}${errResp.error}`
            : (error.error?.message || error.error?.error || error.message || 'Error loading templates');
          this.snackBar.open(errorMessage, 'DISMISS', {
            duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar']
          });
        }
      });
  }

  private mapDtoToTemplateModel(dto: HHTemplateQuestionDto): HHTemplateModel {
    const dt = this.donationTypes().find(d => d.code === dto.donationType);
    return {
      templateId: dto.templateId,
      donationType: dto.donationType,
      donationTypeDescription: dt?.description || dto.donationType,
      randomizeFlag: dto.randomizationFlag || '',
      status: this.deriveStatus(dto.effDate, dto.termDate),
      effectiveDate: dto.effDate,
      terminationDate: dto.termDate || undefined
    };
  }

  private deriveStatus(effDate: string, termDate: string | null): string {
    const chapterToday = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
    const eff = moment(effDate).startOf('day');
    const effDay = eff.format('YYYY-MM-DD');
    const todayDay = chapterToday.format('YYYY-MM-DD');

    if (effDay > todayDay) return 'Future';
    if (termDate) {
      const term = moment(termDate).startOf('day');
      const termDay = term.format('YYYY-MM-DD');
      if (termDay <= todayDay) return 'Inactive';
    }
    return 'Active';
  }

  onPageChange(event: TablePageEvent): void {
    this.tableConfig = {
      ...this.tableConfig,
      pagination: { ...this.tableConfig.pagination!, pageIndex: event.pageIndex, pageSize: event.pageSize }
    };
    this.loadTemplates();
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: event.column, direction: event.direction }
    };
    this.loadTemplates();
  }

  onRowAction(event: TableRowActionEvent<HHTemplateModel>): void {
    if (event.action === 'view') {
      this.viewTemplate(event.row);
    }
  }

  viewTemplate(template: HHTemplateModel): void {
    this.router.navigate(
      [ROUTE_REGISTRY[RouteKey.ViewHealthHistoryTemplate].path],
      { state: { data: template } }
    );
  }

  private setViewMode(mode: 'list' | 'detail' | 'add', templateId?: string): void {
    this.viewMode = mode;
    this.viewModeChange.emit({ mode, templateId });
  }

  onAddNew(): void {
    this.router.navigate(
      [ROUTE_REGISTRY[RouteKey.AddHealthHistoryTemplate].path],
      { state: { mode: 'add' } }
    );
  }

  onBackToList(): void {
    this.setViewMode('list');
    this.selectedTemplate = null;
  }

  onTemplateSaved(): void {
    this.snackBar.open('Template saved successfully', 'DISMISS', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
    this.setViewMode('list');
    this.loadTemplates();
  }

  onSearch(searchText: string): void {
    this.searchText = searchText || '';
    this.tableConfig = {
      ...this.tableConfig,
      pagination: { ...this.tableConfig.pagination!, pageIndex: 0 }
    };
    this.loadTemplates();
  }

  // --- Filter Overlay (same pattern as HH Questions) ---
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
      .flexibleConnectedTo(this.filterButton)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetX: 0,
          offsetY: 4
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

    const portal = new ComponentPortal(HHTemplatesFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;
    componentRef.instance.donationTypes = this.donationTypes();

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        this.disposeOverlay();
      });

    componentRef.instance.clearAll
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAllFilters();
        this.disposeOverlay();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.disposeOverlay();
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.disposeOverlay();
      });
  }

  private disposeOverlay(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
    }
  }

  applyFilters(filters: HHTemplateFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = this.convertFiltersToChips(filters);
    this.tableConfig = {
      ...this.tableConfig,
      pagination: { ...this.tableConfig.pagination!, pageIndex: 0 }
    };
    this.loadTemplates();
  }

  onRemoveFilterChip(chipKey: string): void {
    if (!this.appliedFilters) return;
    const updated = { ...this.appliedFilters };
    switch (chipKey) {
      case 'status': delete updated.status; break;
      case 'donationType': delete updated.donationType; break;
      case 'effectiveDate': delete updated.effectiveDate; delete updated.effectiveDatePeriod; break;
      case 'terminationDate': delete updated.terminationDate; delete updated.terminationDatePeriod; break;
    }
    const hasFilters = Object.keys(updated).length > 0;
    this.appliedFilters = hasFilters ? updated : null;
    this.filterChips = hasFilters ? this.convertFiltersToChips(updated) : [];
    this.tableConfig = {
      ...this.tableConfig,
      pagination: { ...this.tableConfig.pagination!, pageIndex: 0 }
    };
    this.loadTemplates();
  }

  hasActiveFilters(): boolean {
    if (!this.appliedFilters) return false;
    return Object.values(this.appliedFilters).some(v => v !== undefined && v !== null && v !== '');
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    this.tableConfig = {
      ...this.tableConfig,
      pagination: { ...this.tableConfig.pagination!, pageIndex: 0 }
    };
    this.loadTemplates();
  }

  private convertFiltersToChips(filters: HHTemplateFilterValue): FilterChip[] {
    const chips: FilterChip[] = [];
    if (filters.status) {
      chips.push({ key: 'status', label: `Status: ${filters.status}`, value: filters.status });
    }
    if (filters.donationType) {
      const dt = this.donationTypes().find(d => d.code === filters.donationType);
      const displayVal = dt ? `${dt.code} - ${dt.description}` : filters.donationType;
      chips.push({ key: 'donationType', label: `Donation Type: ${displayVal}`, value: filters.donationType });
    }
    if (filters.effectiveDate) {
      const operator = filters.effectiveDatePeriod === 'Before' ? '≤' : '≥';
      const formattedDate = moment(filters.effectiveDate).format('DD-MMM-YYYY').toUpperCase();
      chips.push({ key: 'effectiveDate', label: `Effective Date ${operator} ${formattedDate}`, value: filters.effectiveDate });
    }
    if (filters.terminationDate) {
      const operator = filters.terminationDatePeriod === 'Before' ? '≤' : '≥';
      const formattedDate = moment(filters.terminationDate).format('DD-MMM-YYYY').toUpperCase();
      chips.push({ key: 'terminationDate', label: `Termination Date ${operator} ${formattedDate}`, value: filters.terminationDate });
    }
    return chips;
  }

  getStatusClass(status: string): string {
    return status?.toLowerCase() || '';
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Active': return 'check_circle';
      case 'Future': return 'schedule';
      default: return 'cancel';
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return moment.utc(dateStr).format('DD-MMM-YYYY').toUpperCase();
  }
}
