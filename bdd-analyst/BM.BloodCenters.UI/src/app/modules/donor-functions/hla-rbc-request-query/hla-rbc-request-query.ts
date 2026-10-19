import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  TemplateRef,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subject, takeUntil } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TableRowActionEvent,
  TableSortEvent,
  TablePageEvent
} from '@shared/interfaces/data-table.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ROUTES } from 'src/app/core/constants/route.constants';

import { HlaRbcRequestQueryService } from './services/hla-rbc-request-query.service';
import {
  RequestListItem,
  RequestDetails,
  MatchedDonor,
  MatchedUnit,
  TabType,
  FilterValue,
  RequestDetailsDisplay,
  ScheduledDatesDisplay,
  DonorFilterParams,
  UnitFilterParams
} from './models/hla-rbc-request-query.model';
import { DonorFilterPanel } from './components/donor-filter-panel/donor-filter-panel';
import { UnitFilterPanel } from './components/unit-filter-panel/unit-filter-panel';
import { CloseRequestDialog } from './components/close-request-dialog/close-request-dialog';
import { ListGenerationDialog } from './components/list-generation-dialog/list-generation-dialog';
import { UnitAntigenDialog } from './components/unit-antigen-dialog/unit-antigen-dialog';
import { DonorAntigenDialog } from './components/donor-antigen-dialog/donor-antigen-dialog';
import { GenericLookupDialog } from '@shared/components/generic-lookup-dialog/generic-lookup-dialog';
import { LookupDialogConfig } from '@shared/components/generic-lookup-dialog/generic-lookup-dialog.model';
import { HlaRbcFilterChipsUtils } from './utils/filter-chips.utils';

@Component({
  selector: 'app-hla-rbc-request-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatTabsModule,
    MatInputModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    FilterChips,
    SearchBar
  ],
  templateUrl: './hla-rbc-request-query.html',
  styleUrls: ['./hla-rbc-request-query.scss']
})
export class HlaRbcRequestQueryComponent implements OnInit, AfterViewInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  public readonly componentId = `hla-rbc-request-query-${HlaRbcRequestQueryComponent.nextId++}`;

  public readonly elementId = (name: string) => `${this.componentId}-${name}`;
  public readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  public readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  @ViewChild(DataTable) dataTableComponent!: DataTable<MatchedDonor | MatchedUnit>;
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('unitAntigenTemplate') private unitAntigenTemplate!: TemplateRef<unknown>;
  @ViewChild('donorAntigenTemplate') private donorAntigenTemplate!: TemplateRef<unknown>;

  // Services
  private service = inject(HlaRbcRequestQueryService);
  private headerService = inject(HeaderService);
  private pageHeaderService = inject(PageHeaderService);
  private snackbarService = inject(SnackbarService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private overlay = inject(Overlay);
  private cdr = inject(ChangeDetectorRef);

  private destroy$ = new Subject<void>();
  private donorFilterOverlayRef: OverlayRef | null = null;
  private unitFilterOverlayRef: OverlayRef | null = null;
  private requestChange$ = new Subject<void>();

  // Page header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  // Search bar configuration for donors
  donorSearchConfig: SearchBarConfig = {
    placeholder: 'Search by Donor ID',
    minLength: 3,
    ariaLabel: 'Search by Donor ID',
    searchOnEnterOnly: true
  };

  // Search bar configuration for units
  unitSearchConfig: SearchBarConfig = {
    placeholder: 'Search by unit ID',
    minLength: 3,
    ariaLabel: 'Search units by ID',
    searchOnEnterOnly: true
  };

  // Form controls
  requestIdControl = new FormControl<string>('', [Validators.required]);
  inventorySearchControl = new FormControl<boolean>({ value: false, disabled: true });
  exactMatchControl = new FormControl<boolean>({ value: false, disabled: true });

  // State signals
  requestDetails = signal<RequestDetailsDisplay | null>(null);
  isLoadingDetails = signal(false);
  isLoadingDonors = signal(false);
  isLoadingUnits = signal(false);
  activeTab = signal<TabType>('donors');
  appliedFilters = signal<FilterValue | null>(null);
  isDonorFilterPanelOpen = signal(false);
  isUnitFilterPanelOpen = signal(false);

  // Data signals
  allDonors = signal<MatchedDonor[]>([]);
  allUnits = signal<MatchedUnit[]>([]);
  filteredDonors = signal<MatchedDonor[]>([]);
  filteredUnits = signal<MatchedUnit[]>([]);
  selectedDonors = signal<MatchedDonor[]>([]);
  selectedUnits = signal<MatchedUnit[]>([]);

  // Base data (API result before sorting, used to restore default order)
  private baseDonors = signal<MatchedDonor[]>([]);
  private baseUnits = signal<MatchedUnit[]>([]);

  // Three-state sort tracking
  private donorSortState: 'default' | 'A' | 'D' = 'default';
  private unitSortState: 'default' | 'A' | 'D' = 'default';

  // Computed properties
  isRequestClosed = computed(() => this.requestDetails()?.status === 'CLOSE');
  hasRequestDetails = computed(() => this.requestDetails() !== null);
  showEmptyState = computed(() => this.isRequestClosed() || !this.hasRequestDetails());

  donorGradeOptions = computed(() =>
    [...new Set(this.allDonors().map(d => d.grade).filter(Boolean))]
      .sort()
      .map(g => ({ value: g, label: g }))
  );

  donorLevelOptions = computed(() =>
    [...new Set(this.allDonors().map(d => d.gradeLevel).filter(l => l != null))]
      .sort((a, b) => a - b)
  );

  unitGradeOptions = computed(() =>
    [...new Set(this.allUnits().map(u => u.grade).filter(Boolean))]
      .sort()
      .map(g => ({ value: g, label: g }))
  );

  unitPatternOptions = computed(() =>
    [...new Set(this.allUnits().map(u => u.match).filter(Boolean))].sort()
  );

  unitAboOptions = computed(() =>
    [...new Set(this.allUnits().map(u => u.bloodType).filter(Boolean))].sort()
  );

  unitAntigenOptions = computed(() =>
    [...new Set(this.allUnits().map(u => u.antigenString).filter(Boolean))].sort()
  );

  unitLevelOptions = computed(() =>
    [...new Set(this.allUnits().map(u => u.gradeLevel).filter(l => l != null))]
      .sort((a, b) => a - b)
  );

  // Donors table configuration
  donorsTableConfig: DataTableConfig<MatchedDonor> = {
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
      column: 'grade',
      direction: 'default'
    },
    stickyHeader: true,
    emptyMessage: 'No donors found',
    loadingMessage: 'Loading donors...',
    showPagination: false,
    enableSelection: true,
    selectionKey: 'donorId',
    selectionPosition: 'first'
  };

  // Units table configuration
  unitsTableConfig: DataTableConfig<MatchedUnit> = {
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
      column: 'unitId',
      direction: 'default'
    },
    stickyHeader: true,
    emptyMessage: 'No units found',
    loadingMessage: 'Loading units...',
    showPagination: false,
    enableSelection: true,
    selectionKey: 'unitId',
    selectionPosition: 'first'
  };

  // Filter chips
  filterChips = signal<FilterChip[]>([]);

  // Reactive breadcrumb update
  private readonly breadcrumbEffect = effect(() => {
    const pageData = this.pageHeaderService.pageHeaderData();
    if (pageData) {
      this.headerConfig = {
        ...this.headerConfig,
        breadcrumbs: [
          { label: 'Home', link: ROUTES.HOME },
          { label: pageData.title, link: null }
        ],
        title: pageData.title,
        subtitle: pageData.subtitle || 'View donor and inventory matches for an HLA/RBC request and generate call lists for selected matches.'
      };
    }
  });

  // Detail card table configs
  private readonly detailTableBase: Partial<DataTableConfig<Record<string, string>>> = {
    rowActions: [],
    showPagination: false,
    enableSelection: false,
    emptyMessage: '-',
    showTableOnEmpty: true
  };

  hlaPhenoConfig: DataTableConfig<Record<string, string>> = {
    ...this.detailTableBase,
    columns: [
      { key: 'a1', header: 'A1', sortable: false },
      { key: 'a2', header: 'A2', sortable: false },
      { key: 'b1', header: 'B1', sortable: false },
      { key: 'b2', header: 'B2', sortable: false }
    ]
  } as DataTableConfig<Record<string, string>>;

  hlaAntiConfig: DataTableConfig<Record<string, string>> = {
    ...this.detailTableBase,
    columns: [
      { key: 'locus', header: 'Locus', sortable: false },
      { key: 'antigen', header: 'Antigen', sortable: false }
    ]
  } as DataTableConfig<Record<string, string>>;

  rbcAntiConfig: DataTableConfig<Record<string, string>> = {
    ...this.detailTableBase,
    columns: [{ key: 'antibody', header: 'Antibody', sortable: false }]
  } as DataTableConfig<Record<string, string>>;

  rbcPhenoConfig: DataTableConfig<Record<string, string>> = {
    ...this.detailTableBase,
    columns: [
      { key: 'antigen', header: 'Antigen', sortable: false },
      { key: 'testResult', header: 'Test Result', sortable: false }
    ]
  } as DataTableConfig<Record<string, string>>;

  scheduledDatesConfig: DataTableConfig<Record<string, string>> = {
    ...this.detailTableBase,
    columns: [
      {
        key: 'targetDate',
        header: 'Target Date',
        sortable: false,
        type: 'date',
        valueFormatter: (value) => this.formatDate(value)
      },
      { key: 'units', header: 'Units', sortable: false }
    ]
  } as DataTableConfig<Record<string, string>>;

  // Detail card computed data
  hlaPhenoData = computed((): Record<string, string>[] => {
    const p = this.requestDetails()?.hlaPheno;
    if (p) return [{ a1: String(p.a1 ?? '-'), a2: String(p.a2 ?? '-'), b1: String(p.b1 ?? '-'), b2: String(p.b2 ?? '-') }];
    return [{ a1: '-', a2: '-', b1: '-', b2: '-' }];
  });

  hlaAntiData = computed((): Record<string, string>[] => {
    const list = this.requestDetails()?.hlaAntiList ?? [];
    if (list.length) return list.map(a => ({ locus: a.locus ?? '-', antigen: a.antigen ?? '-' }));
    return [{ locus: '-', antigen: '-' }];
  });

  rbcAntiData = computed((): Record<string, string>[] => {
    const list = this.requestDetails()?.rbcAntiList ?? [];
    if (list.length) return list.map(r => ({ antibody: r.antibody ?? '-' }));
    return [{ antibody: '-' }];
  });

  rbcPhenoData = computed((): Record<string, string>[] => {
    const list = this.requestDetails()?.rbcPhenoList ?? [];
    if (list.length) return list.map(r => ({ antigen: r.antigen ?? '-', testResult: r.testResult ?? '-' }));
    return [{ antigen: '-', testResult: '-' }];
  });

  scheduledDatesData = computed((): Record<string, string>[] =>
    (this.requestDetails()?.scheduledDates ?? []).map(d => ({
      targetDate: d.targetDate ?? '-',
      units: String(d.units)
    }))
  );

  ngOnInit(): void {
    this.loadPageHeader();
    this.initializeTableColumns();
    this.subscribeToChapterChanges();
    this.subscribeToRequestIdChanges();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.unitsTableConfig = {
        ...this.unitsTableConfig,
        columns: this.unitsTableConfig.columns.map(col =>
          col.key === 'antigenString'
            ? { ...col, cellTemplate: this.unitAntigenTemplate }
            : col
        )
      };
      this.donorsTableConfig = {
        ...this.donorsTableConfig,
        columns: this.donorsTableConfig.columns.map(col =>
          col.key === 'antigens'
            ? { ...col, cellTemplate: this.donorAntigenTemplate }
            : col
        )
      };
    });
  }

  ngOnDestroy(): void {
    this.requestChange$.next();
    this.requestChange$.complete();
    this.destroy$.next();
    this.destroy$.complete();
    this.closeFilterPanel();
  }

  private loadPageHeader(): void {
    const pageData = this.pageHeaderService.pageHeaderData();
    if (pageData) {
      this.headerConfig = {
        ...this.headerConfig,
        breadcrumbs: [
          { label: 'Home', link: ROUTES.HOME },
          { label: pageData.title, link: null }
        ],
        title: pageData.title,
        subtitle: pageData.subtitle || 'View donor and inventory matches for an HLA/RBC request and generate call lists for selected matches.'
      };
    }
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClear();
      });
  }

  private subscribeToRequestIdChanges(): void {
    this.requestIdControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        // If request ID is manually cleared or becomes empty, reset the screen
        if (!value || value.trim() === '') {
          this.resetScreenState();
        }
      });
  }

  private resetScreenState(): void {
    // Only reset if there's data to clear (avoid unnecessary resets)
    if (this.requestDetails() !== null || this.allDonors().length > 0 || this.allUnits().length > 0) {
      this.inventorySearchControl.reset({ value: false, disabled: true });
      this.exactMatchControl.reset({ value: false, disabled: true });
      this.requestDetails.set(null);
      this.allDonors.set([]);
      this.allUnits.set([]);
      this.baseDonors.set([]);
      this.baseUnits.set([]);
      this.filteredDonors.set([]);
      this.filteredUnits.set([]);
      this.selectedDonors.set([]);
      this.selectedUnits.set([]);
      this.appliedFilters.set(null);
      this.filterChips.set([]);
      this.activeTab.set('donors');
      this.donorSortState = 'default';
      this.unitSortState = 'default';
      this.donorsTableConfig = {
        ...this.donorsTableConfig,
        sortConfig: { column: 'grade', direction: 'default' }
      };
      this.unitsTableConfig = {
        ...this.unitsTableConfig,
        sortConfig: { column: 'unitId', direction: 'default' }
      };
      this.closeFilterPanel();
    }
  }

  private initializeTableColumns(): void {
    // Donors table columns
    this.donorsTableConfig.columns = [
      { key: 'grade', header: 'Grade', sortable: true, width: '80px' },
      { key: 'gradeLevel', header: 'Level', sortable: false, width: '80px', type: 'number' },
      { key: 'pattern', header: 'Pattern', sortable: false, width: '150px' },
      { key: 'donorId', header: 'Donor ID', sortable: false, width: '120px' },
      { key: 'lastName', header: 'Last Name', sortable: false, width: '150px' },
      { key: 'firstName', header: 'First Name', sortable: false, width: '150px' },
      { key: 'bloodType', header: 'ABO', sortable: false, width: '80px' },
      { key: 'antigens', header: 'Antigens', sortable: false, width: '150px' },
      { key: 'cmvStatus', header: 'CMV Status', sortable: false, width: '100px' }
    ];

    // Units table columns
    this.unitsTableConfig.columns = [
      { key: 'unitId', header: 'Unit ID', sortable: true, width: '140px' },
      {
        key: 'collectionDate',
        header: 'Collection Date',
        sortable: false,
        width: '140px',
        type: 'date',
        valueFormatter: (value) => this.formatDate(value)
      },
      { key: 'grade', header: 'Grade', sortable: false, width: '80px' },
      { key: 'gradeLevel', header: 'Level', sortable: false, width: '70px', type: 'number' },
      { key: 'match', header: 'Pattern', sortable: false, width: '120px' },
      { key: 'bloodType', header: 'ABO', sortable: false, width: '100px' },
      { key: 'antigenString', header: 'Antigens', sortable: false, width: '160px' },
      { key: 'warehouseCode', header: 'Inventory Warehouse', sortable: false, width: '150px' },
      { key: 'inventoryClass', header: 'Inventory Class', sortable: false, width: '120px' },
      { key: 'productType', header: 'Product Type', sortable: false, width: '110px' },
      { key: 'cmvStatus', header: 'CMV Status', sortable: false, width: '100px' }
    ];
  }

  onRetrieve(): void {
    const requestId = this.requestIdControl.value;
    if (!requestId) {
      this.snackbarService.showError('Please select a request ID');
      return;
    }

    this.requestChange$.next();
    this.isLoadingDetails.set(true);
    this.service.getRequestDetails(requestId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          if (details) {
            const displayDetails = this.mapRequestDetailsToDisplay(details);
            this.requestDetails.set(displayDetails);
            this.inventorySearchControl.setValue(displayDetails.inventorySearch);
            this.exactMatchControl.setValue(displayDetails.exactMatch);
            this.loadMatchingResults(requestId);
            this.loadPatientAntigenData(details.patientId, displayDetails);
          } else {
            this.snackbarService.showError('Request not found');
          }
          this.isLoadingDetails.set(false);
        },
        error: (error) => {
          console.error('Failed to load request details:', error);
          this.snackbarService.showError('Failed to load request details');
          this.isLoadingDetails.set(false);
        }
      });
  }

  private loadPatientAntigenData(patientId: string, displayDetails: RequestDetailsDisplay): void {
    this.service.getPatientDetail(patientId)
      .pipe(takeUntil(this.destroy$), takeUntil(this.requestChange$))
      .subscribe({
        next: (patientDetail) => {
          if (patientDetail) {
            const updated: RequestDetailsDisplay = {
              ...displayDetails,
              hlaPheno: patientDetail.hlaAntigens
                ? {
                    a1: patientDetail.hlaAntigens.a1,
                    a2: patientDetail.hlaAntigens.a2,
                    b1: patientDetail.hlaAntigens.b1,
                    b2: patientDetail.hlaAntigens.b2
                  }
                : null,
              hlaAntiList: (patientDetail.hlaAntibodies ?? []).map(ab => ({
                locus: ab.locus,
                antigen: ab.epitopeId
              })),
              rbcAntiList: (patientDetail.rbcAntibodies ?? []).map(ab => ({
                antibody: ab.testId
              })),
              rbcPhenoList: (patientDetail.rbcAntigens ?? []).map(ag => ({
                antigen: ag.testId,
                testResult: ag.resultCode === 'P' ? '+' : ag.resultCode === 'N' ? '-' : ag.resultCode
              }))
            };
            this.requestDetails.set(updated);
          }
        },
        error: () => {
          this.snackbarService.showError('Failed to load patient antigen data');
        }
      });
  }

  private loadMatchingResults(requestId: string): void {
    // Load donors
    this.isLoadingDonors.set(true);
    this.service.getMatchedDonors(requestId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (donors) => {
          this.allDonors.set(donors);
          this.baseDonors.set(donors);
          this.filteredDonors.set(donors);
          this.donorSortState = 'default';
          this.donorsTableConfig = {
            ...this.donorsTableConfig,
            sortConfig: { column: 'grade', direction: 'default' }
          };
          this.updateDonorsTablePagination();
          this.isLoadingDonors.set(false);
        },
        error: (error) => {
          console.error('Failed to load donors:', error);
          this.snackbarService.showError('Failed to load matched donors');
          this.isLoadingDonors.set(false);
        }
      });

    // Load units
    this.isLoadingUnits.set(true);
    this.service.getMatchedUnits(requestId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (units) => {
          this.allUnits.set(units.map(u => ({ ...u, selected: false })));
          this.baseUnits.set(this.allUnits());
          this.filteredUnits.set(this.allUnits());
          this.unitSortState = 'default';
          this.unitsTableConfig = {
            ...this.unitsTableConfig,
            sortConfig: { column: 'unitId', direction: 'default' }
          };
          this.updateUnitsTablePagination();
          this.isLoadingUnits.set(false);
        },
        error: (error) => {
          console.error('Failed to load units:', error);
          this.snackbarService.showError('Failed to load matched units');
          this.isLoadingUnits.set(false);
        }
      });
  }

  private mapRequestDetailsToDisplay(details: RequestDetails): RequestDetailsDisplay {
    return {
      requestId: details.requestId,
      patientName: details.patientName,
      hospital: details.hospital,
      matchType: details.requestType,
      lastSearch: this.formatDateTime(details.lastSearchDateTime),
      inventorySearch: details.unitRequest === 'Y',
      exactMatch: details.exactMatch === 'Y',
      hlaPhenoEnabled: details.hlaPheno === 'Y',
      hlaAntiEnabled: details.hlaAnti === 'Y',
      rbcAntiEnabled: details.rbcAnti === 'Y',
      rbcPhenoEnabled: details.rbcPheno === 'Y',
      hlaPheno: null,
      hlaAntiList: [],
      rbcAntiList: [],
      rbcPhenoList: [],
      scheduledDates: details.expectedTransfusionDates.map(d => ({
        targetDate: d.date,
        units: d.quantity
      })),
      status: details.status
    };
  }

  onTabChange(index: number): void {
    // Close any open filter panels when switching tabs
    this.closeFilterPanel();

    this.activeTab.set(index === 0 ? 'donors' : 'units');

    // Clear applied filters when switching tabs
    this.appliedFilters.set(null);
    this.filterChips.set([]);
  }

  onOpenFilterPanel(event: MouseEvent): void {
    const buttonEl = event.currentTarget as HTMLElement;
    const currentTab = this.activeTab();

    // Close if already open
    if (currentTab === 'donors' && this.donorFilterOverlayRef) {
      this.closeDonorFilterPanel();
      return;
    }
    if (currentTab === 'units' && this.unitFilterOverlayRef) {
      this.closeUnitFilterPanel();
      return;
    }

    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo(buttonEl)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetY: 4
        }
      ]);

    if (currentTab === 'donors') {
      this.openDonorFilterPanel(positionStrategy);
    } else {
      this.openUnitFilterPanel(positionStrategy);
    }
  }

  private openDonorFilterPanel(positionStrategy: any): void {
    this.donorFilterOverlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      width: 335
    });

    const filterPortal = new ComponentPortal(DonorFilterPanel);
    const filterRef = this.donorFilterOverlayRef.attach(filterPortal);

    filterRef.instance.gradeOptions = this.donorGradeOptions();
    filterRef.instance.levelOptions = this.donorLevelOptions();

    if (this.appliedFilters()) {
      filterRef.instance.setFilters(this.appliedFilters()!);
    }

    // Set panel as open
    this.isDonorFilterPanelOpen.set(true);

    filterRef.instance.filtersApplied
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        this.closeDonorFilterPanel();
      });

    filterRef.instance.filtersCanceled
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeDonorFilterPanel();
      });

    this.donorFilterOverlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeDonorFilterPanel();
      });
  }

  private openUnitFilterPanel(positionStrategy: any): void {
    this.unitFilterOverlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      width: 335
    });

    const filterPortal = new ComponentPortal(UnitFilterPanel);
    const filterRef = this.unitFilterOverlayRef.attach(filterPortal);

    filterRef.instance.gradeOptions = this.unitGradeOptions();
    filterRef.instance.levelOptions = this.unitLevelOptions();
    filterRef.instance.patternOptions = this.unitPatternOptions();
    filterRef.instance.aboOptions = this.unitAboOptions();
    filterRef.instance.antigenOptions = this.unitAntigenOptions();

    if (this.appliedFilters()) {
      filterRef.instance.setFilters(this.appliedFilters()!);
    }

    // Set panel as open
    this.isUnitFilterPanelOpen.set(true);

    filterRef.instance.filtersApplied
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        this.closeUnitFilterPanel();
      });

    filterRef.instance.filtersCanceled
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeUnitFilterPanel();
      });

    this.unitFilterOverlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeUnitFilterPanel();
      });
  }

  private closeDonorFilterPanel(): void {
    if (this.donorFilterOverlayRef) {
      this.donorFilterOverlayRef.dispose();
      this.donorFilterOverlayRef = null;
    }
    this.isDonorFilterPanelOpen.set(false);
  }

  private closeUnitFilterPanel(): void {
    if (this.unitFilterOverlayRef) {
      this.unitFilterOverlayRef.dispose();
      this.unitFilterOverlayRef = null;
    }
    this.isUnitFilterPanelOpen.set(false);
  }

  private closeFilterPanel(): void {
    this.closeDonorFilterPanel();
    this.closeUnitFilterPanel();
  }

  private applyFilters(filters: FilterValue): void {
    this.appliedFilters.set(filters);
    this.updateFilterChips(filters);

    const requestId = this.requestIdControl.value;
    if (!requestId) return;

    if (this.activeTab() === 'donors') {
      const filterParams: DonorFilterParams = {
        grades: filters.grades?.join(','),
        maxGradeLevel: filters.level,
        sortBy: 'gradeLevel',
        sortOrder: 'DESC'
      };
      this.isLoadingDonors.set(true);
      this.service.getMatchedDonors(requestId, filterParams)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (donors) => {
            this.baseDonors.set(donors);
            this.donorSortState = 'default';
            this.filteredDonors.set(donors);
            this.updateDonorsTablePagination();
            this.isLoadingDonors.set(false);
          },
          error: (error) => {
            console.error('Failed to filter donors:', error);
            this.snackbarService.showError('Failed to apply filters');
            this.isLoadingDonors.set(false);
          }
        });
    } else {
      const filterParams: UnitFilterParams = {
        grades: filters.grades?.join(','),
        maxGradeLevel: filters.level,
        pattern: filters.pattern,
        abo: filters.abo,
        antigens: filters.antigens,
        sortBy: 'gradeLevel',
        sortOrder: 'DESC'
      };
      this.isLoadingUnits.set(true);
      this.service.getMatchedUnits(requestId, filterParams)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (units) => {
            const mapped = units.map(u => ({ ...u, selected: false }));
            this.baseUnits.set(mapped);
            this.unitSortState = 'default';
            this.filteredUnits.set(mapped);
            this.updateUnitsTablePagination();
            this.isLoadingUnits.set(false);
          },
          error: (error) => {
            console.error('Failed to filter units:', error);
            this.snackbarService.showError('Failed to apply filters');
            this.isLoadingUnits.set(false);
          }
        });
    }
  }

  private updateFilterChips(filters: FilterValue | null): void {
    this.filterChips.set(HlaRbcFilterChipsUtils.createChipsFromFilters(filters));
  }

  onRemoveFilterChip(chipKey: string): void {
    const currentFilters = this.appliedFilters();
    if (!currentFilters) return;

    const updatedFilters = HlaRbcFilterChipsUtils.removeFilterByChipKey(currentFilters, chipKey);

    if (!updatedFilters) {
      // No filters left, clear all
      this.onClearAllFilters();
      return;
    }

    this.applyFilters(updatedFilters);
  }

  onClearAllFilters(): void {
    this.appliedFilters.set(null);
    this.filterChips.set([]);

    const requestId = this.requestIdControl.value;
    if (requestId) {
      this.loadMatchingResults(requestId);
    }
  }

  hasActiveFilters(): boolean {
    return HlaRbcFilterChipsUtils.hasActiveFilters(this.appliedFilters());
  }

  onCreateCallList(): void {
    const requestId = this.requestIdControl.value;
    if (!requestId) return;

    const selectedDonorIds = this.selectedDonors().map(d => d.donorId);

    if (selectedDonorIds.length === 0) {
      this.snackbarService.showError('Please select at least one donor');
      return;
    }

    // Dismiss any existing snackbar messages before opening the dialog
    this.snackBar.dismiss();

    const dialogRef = this.dialog.open(ListGenerationDialog, {
      data: selectedDonorIds,
      width: '520px',
      disableClose: true,
      position: {
        right: '0'
      },
      panelClass: 'list-generation-drawer',
      autoFocus: 'dialog'
    });

    dialogRef.afterClosed().subscribe(payload => {
      // Remove focus from the button to prevent hover state
      (document.activeElement as HTMLElement)?.blur();

      if (!payload) return;
      this.service.createCallList(requestId, payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result) => {
            this.snackbarService.showSuccess('List generated successfully.');
          }
        });
    });
  }

  onPrint(): void {
    const requestId = this.requestIdControl.value;
    if (!requestId) return;

    const printCall = this.activeTab() === 'donors'
      ? this.service.printDonors(requestId)
      : this.service.printUnits(requestId);

    printCall.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        const message = this.activeTab() === 'donors'
          ? 'Donor list has been generated successfully.'
          : 'Unit list has been generated successfully.';
        this.snackbarService.showSuccess(message);
      },
      error: (error) => {
        const message = error?.error?.message || 'Failed to generate print report';
        console.error('Print failed:', error);
        this.snackbarService.showError(message);
      }
    });
  }

  onDonorSearch(searchText: string): void {
    if (!searchText) {
      this.filteredDonors.set(this.allDonors());
      this.updateDonorsTablePagination();
      return;
    }

    const filtered = this.allDonors().filter(donor =>
      donor.donorId.toLowerCase().includes(searchText.toLowerCase())
    );
    this.filteredDonors.set(filtered);
    this.updateDonorsTablePagination();
  }

  onDonorSearchCleared(): void {
    this.filteredDonors.set(this.allDonors());
    this.updateDonorsTablePagination();
  }

  onUnitSearch(searchText: string): void {
    if (!searchText) {
      this.filteredUnits.set(this.allUnits());
      this.updateUnitsTablePagination();
      return;
    }

    const filtered = this.allUnits().filter(unit =>
      unit.unitId.toLowerCase().includes(searchText.toLowerCase())
    );
    this.filteredUnits.set(filtered);
    this.updateUnitsTablePagination();
  }

  onUnitSearchCleared(): void {
    this.filteredUnits.set(this.allUnits());
    this.updateUnitsTablePagination();
  }

  onCloseRequest(): void {
    const requestId = this.requestIdControl.value;
    if (!requestId) return;

    const dialogRef = this.dialog.open(CloseRequestDialog, {
      width: '500px',
      disableClose: true,
      panelClass: 'close-request-dialog-container'
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.service.closeRequest(requestId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.snackbarService.showSuccess(
                `Request ID ${requestId} has been closed successfully`
              );
              this.onClear();
            },
            error: (error) => {
              console.error('Failed to close request:', error);
              this.snackbarService.showError('Failed to close request');
            }
          });
      }
    });
  }

  onDonorAntigenClick(donor: MatchedDonor): void {
    this.dialog.open(DonorAntigenDialog, {
      data: donor,
      width: '900px',
      height: '339px',
      autoFocus: 'dialog',
      disableClose: true,
      position: this.getDialogCenterPosition(900, 339)
    });
  }

  onUnitRowClick(unit: MatchedUnit): void {
    this.dialog.open(UnitAntigenDialog, {
      data: unit,
      width: '900px',
      height: '339px',
      autoFocus: 'dialog',
      disableClose: true,
      position: this.getDialogCenterPosition(900, 339)
    });
  }

  onDonorSelectionChange(rows: MatchedDonor[]): void {
    this.selectedDonors.set(rows);
    // Auto-blur checkbox after selection
    setTimeout(() => (document.activeElement as HTMLElement)?.blur(), 0);
  }

  onUnitSelectionChange(rows: MatchedUnit[]): void {
    this.selectedUnits.set(rows);
    // Auto-blur checkbox after selection
    setTimeout(() => (document.activeElement as HTMLElement)?.blur(), 0);
  }

  onDonorSortChange(event: TableSortEvent): void {
    const nextDirection = this.getNextSortDirection(this.donorSortState);
    this.donorSortState = nextDirection;
    this.donorsTableConfig = {
      ...this.donorsTableConfig,
      sortConfig: { column: event.column, direction: nextDirection }
    };

    const requestId = this.requestIdControl.value;
    if (!requestId) return;

    const currentFilters = this.appliedFilters();
    const params: DonorFilterParams = {
      grades: currentFilters?.grades?.join(','),
      maxGradeLevel: currentFilters?.level,
      sortBy: nextDirection !== 'default' ? 'grade' : undefined,
      sortOrder: nextDirection === 'A' ? 'ASC' : nextDirection === 'D' ? 'DESC' : undefined
    };

    this.isLoadingDonors.set(true);
    this.service.getMatchedDonors(requestId, params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (donors) => {
          this.baseDonors.set(donors);
          this.filteredDonors.set(donors);
          this.updateDonorsTablePagination();
          this.isLoadingDonors.set(false);
        },
        error: (error) => {
          console.error('Failed to sort donors:', error);
          this.snackbarService.showError('Failed to sort donors');
          this.isLoadingDonors.set(false);
        }
      });
  }

  onUnitSortChange(event: TableSortEvent): void {
    const nextDirection = this.getNextSortDirection(this.unitSortState);
    this.unitSortState = nextDirection;
    this.unitsTableConfig = {
      ...this.unitsTableConfig,
      sortConfig: { column: event.column, direction: nextDirection }
    };

    const requestId = this.requestIdControl.value;
    if (!requestId) return;

    const currentFilters = this.appliedFilters();
    const params: UnitFilterParams = {
      grades: currentFilters?.grades?.join(','),
      maxGradeLevel: currentFilters?.level,
      sortBy: nextDirection !== 'default' ? 'unitId' : undefined,
      sortOrder: nextDirection === 'A' ? 'ASC' : nextDirection === 'D' ? 'DESC' : undefined
    };

    this.isLoadingUnits.set(true);
    this.service.getMatchedUnits(requestId, params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (units) => {
          const mapped = units.map(u => ({ ...u, selected: false }));
          this.baseUnits.set(mapped);
          this.filteredUnits.set(mapped);
          this.updateUnitsTablePagination();
          this.isLoadingUnits.set(false);
        },
        error: (error) => {
          console.error('Failed to sort units:', error);
          this.snackbarService.showError('Failed to sort units');
          this.isLoadingUnits.set(false);
        }
      });
  }

  private getDialogCenterPosition(dialogWidth: number, dialogHeight: number): { left: string; top: string } {
    const sidebar = document.querySelector('.sidenav-container') as HTMLElement;
    const sidebarWidth = sidebar ? sidebar.offsetWidth : 0;
    const left = sidebarWidth + (window.innerWidth - sidebarWidth - dialogWidth) / 2;
    const top = (window.innerHeight - dialogHeight) / 2;
    return { left: `${Math.max(0, left)}px`, top: `${Math.max(0, top)}px` };
  }

  private getNextSortDirection(current: 'default' | 'A' | 'D'): 'default' | 'A' | 'D' {
    if (current === 'default') return 'A';
    if (current === 'A') return 'D';
    return 'default';
  }

  private sortData<T>(data: T[], event: TableSortEvent): T[] {
    return data.sort((a, b) => {
      const valA = (a as Record<string, unknown>)[event.column] ?? '';
      const valB = (b as Record<string, unknown>)[event.column] ?? '';
      const aNum = Number(valA);
      const bNum = Number(valB);
      const isNumeric = !isNaN(aNum) && !isNaN(bNum);
      let cmp: number;
      if (isNumeric) {
        cmp = aNum - bNum;
      } else {
        cmp = String(valA).localeCompare(String(valB));
      }
      return event.direction === 'D' ? -cmp : cmp;
    });
  }

  onOpenRequestLookup(): void {
    const config: LookupDialogConfig<RequestListItem> = {
      title: 'Request ID',
      columns: [
        { key: 'patientName', header: 'Patient Name', width: '200px' },
        {
          key: 'insertDate',
          header: 'Request Date',
          width: '140px',
          type: 'date'
        },
        { key: 'requestId', header: 'Request ID', width: '120px' },
        { key: 'requestType', header: 'Match Type', width: '140px' },
        { key: 'patientId', header: 'Patient ID', width: '120px' },
        { key: 'status', header: 'Status', width: '100px' }
      ],
      data: this.service.getRequestList({ status: 'OPEN' }),
      selectionMode: 'single',
      selectionKey: 'requestId',
      searchFields: ['requestId', 'requestType', 'patientId', 'status'],
      searchConfig: {
        placeholder: 'Search by Request ID, Type, Patient ID, or Status',
        minLength: 2,
        ariaLabel: 'Search requests'
      },
      formatters: {
        insertDate: (value) => this.formatDate(value)
      },
      enablePagination: false,
      initialSearchTerm: this.requestIdControl.value || ''
    };

    const dialogRef = this.dialog.open(GenericLookupDialog<RequestListItem>, {
      width: '900px',
      height: '100vh',
      maxWidth: '90vw',
      data: config,
      disableClose: true,
      autoFocus: false,
      position: {
        right: '0',
        top: '0'
      },
      panelClass: 'right-side-panel-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && !result.cancelled && result.selectedItem) {
        this.requestIdControl.setValue(result.selectedItem.requestId);
        this.onRetrieve();
      }
    });
  }

  onClear(): void {
    this.requestIdControl.reset();
    this.inventorySearchControl.reset({ value: false, disabled: true });
    this.exactMatchControl.reset({ value: false, disabled: true });
    this.requestDetails.set(null);
    this.allDonors.set([]);
    this.allUnits.set([]);
    this.baseDonors.set([]);
    this.baseUnits.set([]);
    this.filteredDonors.set([]);
    this.filteredUnits.set([]);
    this.selectedDonors.set([]);
    this.selectedUnits.set([]);
    this.appliedFilters.set(null);
    this.filterChips.set([]);
    this.activeTab.set('donors');
    this.donorSortState = 'default';
    this.unitSortState = 'default';
    this.donorsTableConfig = {
      ...this.donorsTableConfig,
      sortConfig: { column: 'grade', direction: 'default' }
    };
    this.unitsTableConfig = {
      ...this.unitsTableConfig,
      sortConfig: { column: 'unitId', direction: 'default' }
    };
    this.closeFilterPanel();
  }

  private updateDonorsTablePagination(): void {
    if (this.donorsTableConfig.pagination) {
      this.donorsTableConfig.pagination.totalRecords = this.filteredDonors().length;
    }
  }

  private updateUnitsTablePagination(): void {
    if (this.unitsTableConfig.pagination) {
      this.unitsTableConfig.pagination.totalRecords = this.filteredUnits().length;
    }
  }

  private formatDateTime(value: any): string {
    if (!value) return '-';

    const date = new Date(value);
    if (isNaN(date.getTime())) return value;

    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  }

  private formatDate(value: any): string {
    if (!value) return '-';

    const date = new Date(value);
    if (isNaN(date.getTime())) return value;

    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }
}
