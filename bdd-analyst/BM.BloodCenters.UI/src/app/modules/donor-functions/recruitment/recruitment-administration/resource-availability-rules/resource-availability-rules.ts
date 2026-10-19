import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ViewChild,
  ElementRef,
  effect,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MAT_DATE_FORMATS } from '@angular/material/core';
import { MatMomentDateModule, provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { ResourceAvailabilityRulesService } from './services/resource-availability-rules.service';
import {
  ResourceAvailabilityRuleModel,
  ValidResourceModel,
  ResourceAvailabilitySummaryModel,
  ResourceAvailabilityFilterValue
} from './models/resource-availability-rules.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TableRowActionEvent,
  TableSortEvent
} from '@shared/interfaces/data-table.interface';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { AddEditResourceRule } from './add-edit-resource-rule/add-edit-resource-rule';
import { ViewResourceAvailability } from './view-resource-availability/view-resource-availability';

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ResourceAvailabilityFilterPanel } from './resource-availability-filter-panel/resource-availability-filter-panel';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ResourceAvailabilityFilterChipsUtils } from './utils/resource-availability-filter-chips.utils';

@Component({
  selector: 'app-resource-availability-rules',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatSnackBarModule,
    MatMomentDateModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditResourceRule,
    ViewResourceAvailability
  ],
  providers: [
    provideMomentDateAdapter(),
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './resource-availability-rules.html',
  styleUrls: ['./resource-availability-rules.scss']
})
export class ResourceAvailabilityRulesComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;

  headerConfig!: PageHeaderConfig;
  tableConfig!: DataTableConfig<ResourceAvailabilityRuleModel>;

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Day or Availability',
    minLength: 1,
    ariaLabel: 'Search by Day or Availability',
    searchOnEnterOnly: true
  };

  // Filter controls
  showTerminated: 'YES' | 'NO' = 'NO';
  resourceCode = '';
  resourceDescription = '';
  isResourceTerminated = false;

  // Filter state
  appliedFilters: ResourceAvailabilityFilterValue | null = null;
  filterChips: FilterChip[] = [];
  isFilterOpen = false;
  searchText = '';
  sortDirection: 'ASC' | 'DESC' | '' = '';

  // Data
  dataSource: ResourceAvailabilityRuleModel[] = [];
  validResources = signal<ValidResourceModel[]>([]);
  weekDays = signal<string[]>([]);

  // State
  isLoading = false;
  hasError = false;
  errorMessage = '';
  retrieveButtonDisabled = true;

  // Side panel state
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: ResourceAvailabilityRuleModel | null = null;

  // View panel state
  viewPanelOpen = false;
  viewPanelRow: ResourceAvailabilityRuleModel | null = null;

  // Chapter info
  chapterId = '';
  minDate!: moment.Moment;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  constructor(
    private resourceAvailabilityService: ResourceAvailabilityRulesService,
    private router: Router,
    private snackBar: MatSnackBar,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService,
    private overlay: Overlay
  ) {
    this.initializeConfigurations();

    // Get chapter timezone and set minDate based on chapter date
    const chapterTimezone = this.headerService.chapterTimeZone();
    this.minDate = DateFieldValidationUtility.getMinDate(chapterTimezone);

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
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  /* -------------------------------- CONFIG -------------------------------- */

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' }
      ],
      title: '',
      subtitle: ''
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No resource availability rules available to display',
      loadingMessage: 'Loading resource availability data...',
      showPagination: false, // As per requirement: no pagination
      sortConfig: {
        column: '',
        direction: 'default'
      }
    };
  }

  private getTableColumns(): TableColumn<ResourceAvailabilityRuleModel>[] {
    return [
      {
        key: 'weekDay',
        header: 'Day',
        sortable: true,
        width: '100px',
        valueFormatter: (v) => this.formatWeekDay(v)
      },
      { key: 'maxAvailable', header: 'Availability', sortable: false, width: '120px' },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        sortable: false,
        width: '150px',
        valueFormatter: (v) => this.formatDate(v)
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        sortable: false,
        width: '150px',
        valueFormatter: (v) => this.formatDate(v)
      }
    ];
  }

  private getRowActions(): RowAction<ResourceAvailabilityRuleModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit availability rule',
        ariaLabel: 'Edit availability rule',
        color: 'default',
        action: 'edit',
        visible: () => this.canEdit()
      },
      {
        icon: 'visibility',
        label: 'View availability rule',
        ariaLabel: 'View availability rule',
        color: 'default',
        action: 'view',
        visible: () => true
      }
    ];
  }

  /* -------------------------------- LOAD DATA -------------------------------- */

  private loadInitialData(): void {
    // Get chapter ID
    this.chapterId = this.headerService.chapterId();

    // Load valid resources for LOV
    this.resourceAvailabilityService
      .getValidResources()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resources) => {
          this.validResources.set(resources);
        },
        error: () => {
          // Error handling is managed globally via Auth Interceptor
        }
      });

    // Load week days from API
    this.resourceAvailabilityService
      .getWeekDays()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (days) => {
          this.weekDays.set(days);
        },
        error: () => {
          // Fallback to default values
          this.weekDays.set(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);
        }
      });
  }

  loadData(): void {
    if (!this.resourceCode) {
      this.snackBar.open(
        'Please enter a Resource Code',
        'DISMISS',
        {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        }
      );
      return;
    }

    this.isLoading = true;
    this.hasError = false;

    // Build filter parameters from applied filters
    let day = '';
    let effectiveDate = '';
    let terminationDate = '';
    let periodEffDate = '';
    let periodTermDate = '';

    if (this.appliedFilters) {
      // Convert 'ALL' to empty string for API
      day = this.appliedFilters.day === 'ALL' ? '' : (this.appliedFilters.day || '');

      if (this.appliedFilters.effectiveDateFrom) {
        periodEffDate = 'AFTER';
        effectiveDate = this.appliedFilters.effectiveDateFrom;
      } else if (this.appliedFilters.effectiveDateTo) {
        periodEffDate = 'BEFORE';
        effectiveDate = this.appliedFilters.effectiveDateTo;
      }

      if (this.appliedFilters.terminationDateFrom) {
        periodTermDate = 'AFTER';
        terminationDate = this.appliedFilters.terminationDateFrom;
      } else if (this.appliedFilters.terminationDateTo) {
        periodTermDate = 'BEFORE';
        terminationDate = this.appliedFilters.terminationDateTo;
      }
    }

    this.resourceAvailabilityService
      .getResourceAvailabilityRules({
        chapterId: this.chapterId,
        resourceCode: this.resourceCode,
        day,
        showTerminated: this.showTerminated,
        effectiveDate,
        terminationDate,
        periodEffDate,
        periodTermDate,
        sortDirection: this.sortDirection
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          // Apply client-side search filter if searchText exists
          let filteredData = res.data;
          if (this.searchText && this.searchText.trim().length >= 1) {
            const searchLower = this.searchText.toLowerCase().trim();
            filteredData = res.data.filter(item => {
              const fullWeekDayName = this.formatWeekDay(item.weekDay).toLowerCase();
              const maxAvailable = (item.maxAvailable?.toString() || '').toLowerCase();
              return fullWeekDayName.includes(searchLower) || maxAvailable.includes(searchLower);
            });
          }
          this.dataSource = filteredData;
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.hasError = true;
          this.errorMessage =
            err?.error?.message ||
            'Failed to load resource availability data.';
        }
      });
  }

  /* -------------------------------- EVENTS -------------------------------- */

  onResourceCodeChange(): void {
    // Enable/disable retrieve button
    this.retrieveButtonDisabled = !this.resourceCode?.trim();

    // Validate resource code
    if (this.resourceCode?.trim()) {
      this.validateResourceCode();
    } else {
      this.resourceDescription = '';
      this.isResourceTerminated = false;
    }
  }

  onShowTerminatedChange(): void {
    // Reload data if resource code is already selected
    if (this.resourceCode) {
      this.loadData();
    }
  }

  onRetrieve(): void {
    this.loadData();
  }

  /* -------------------------------- VALIDATIONS -------------------------------- */

  private validateResourceCode(): void {
    const resource = this.validResources().find(
      r => r.resourceCode === this.resourceCode
    );

    if (resource) {
      this.resourceDescription = resource.resourceDescription || '';
      this.isResourceTerminated = resource.isTerminated || false;
    } else {
      this.resourceDescription = '';
      this.isResourceTerminated = false;
    }
  }

  /* -------------------------------- PERMISSIONS -------------------------------- */

  canEdit(): boolean {
    return !this.isResourceTerminated && this.showTerminated === 'NO';
  }

  canAddNew(): boolean {
    return this.canEdit() && !!this.resourceCode;
  }

  /* -------------------------------- ROW ACTIONS -------------------------------- */

  onRowAction(event: TableRowActionEvent<ResourceAvailabilityRuleModel>): void {
    if (event.action === 'edit') {
      this.editRule(event.row);
    } else if (event.action === 'view') {
      this.viewActiveResources(event.row);
    }
  }

  onSearch(searchText: string): void {
    this.searchText = searchText;
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    // Only handle sorting for weekDay column
    if (event.column === 'weekDay') {
      // Manually cycle through sort states: '' -> 'ASC' -> 'DESC' -> ''
      if (this.sortDirection === '') {
        this.sortDirection = 'ASC';
      } else if (this.sortDirection === 'ASC') {
        this.sortDirection = 'DESC';
      } else {
        this.sortDirection = '';
      }

      // Update tableConfig sortConfig for visual feedback
      this.tableConfig.sortConfig = {
        column: this.sortDirection ? 'weekDay' : '',
        direction: this.sortDirection === 'ASC' ? 'A' : this.sortDirection === 'DESC' ? 'D' : 'default'
      };

      this.loadData();
    }
  }

  /* -------------------------------- ACTIONS -------------------------------- */

  addNewRule(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  editRule(rule: ResourceAvailabilityRuleModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = rule;
    this.sidePanelOpen = true;
  }

  viewActiveResources(rule: ResourceAvailabilityRuleModel): void {
    // Pass the entire row data to the view panel
    this.viewPanelRow = rule;
    this.viewPanelOpen = true;
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      return;
    }

    this.isFilterOpen = true;

    const positionStrategy: FlexibleConnectedPositionStrategy =
      this.overlay.position()
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

    const portal = new ComponentPortal(ResourceAvailabilityFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

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

  applyFilters(filters: ResourceAvailabilityFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = ResourceAvailabilityFilterChipsUtils.convertFiltersToChips(filters);
    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = ResourceAvailabilityFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );
    this.filterChips = ResourceAvailabilityFilterChipsUtils.convertFiltersToChips(this.appliedFilters);
    this.loadData();
  }

  hasActiveFilters(): boolean {
    return ResourceAvailabilityFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    this.loadData();
  }

  /* -------------------------------- SIDE PANEL -------------------------------- */

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSaveSuccess(): void {
    this.loadData();
  }

  closeViewPanel(): void {
    this.viewPanelOpen = false;
    this.viewPanelRow = null;
  }

  /* -------------------------------- UTILITIES -------------------------------- */

  private formatWeekDay(code: string | undefined | null): string {
    if (!code) return '';

    const dayMap: Record<string, string> = {
      'MON': 'Monday',
      'TUE': 'Tuesday',
      'WED': 'Wednesday',
      'THU': 'Thursday',
      'FRI': 'Friday',
      'SAT': 'Saturday',
      'SUN': 'Sunday'
    };

    return dayMap[code.toUpperCase()] || code;
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';

    const d = moment(date);
    if (!d.isValid()) return '-';

    return d.format('DD-MMM-YYYY').toUpperCase();
  }

  /* -------------------------------- KEYBOARD SHORTCUTS -------------------------------- */

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    // Alt+R: Focus retrieve button
    if (event.altKey && event.key.toLowerCase() === 'r') {
      event.preventDefault();
      const retrieveBtn = document.querySelector<HTMLButtonElement>('button[aria-label="Retrieve data"]');
      retrieveBtn?.click();
    }

    // Alt+A: Add new rule
    if (event.altKey && event.key.toLowerCase() === 'a' && this.canAddNew()) {
      event.preventDefault();
      this.addNewRule();
    }

    // Alt+F: Open filter
    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.openFilter();
    }

    // Alt+S: Focus search
    if (event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.searchBarComponent?.focus();
    }

    // Escape: Close filter panel
    if (event.key === 'Escape' && this.overlayRef) {
      event.preventDefault();
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
    } else if (event.key === 'Escape' && this.sidePanelOpen) {
      // Escape: Close side panel if open
      event.preventDefault();
      this.closeSidePanel();
    } else if (event.key === 'Escape' && this.viewPanelOpen) {
      // Escape: Close view panel if open
      event.preventDefault();
      this.closeViewPanel();
    }
  }
}
