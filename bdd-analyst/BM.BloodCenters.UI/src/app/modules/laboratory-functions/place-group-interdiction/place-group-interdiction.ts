import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableColumn, TablePageEvent } from '@shared/interfaces/data-table.interface';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule, MatDrawer } from '@angular/material/sidenav';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';
import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';

import { GroupInterdictionApiService } from './services/group-interdiction-api.service';
import {
  ControlMode,
  InterdictionDto,
  ValidInterdictionDto,
  GroupInterdictionFilterValue,
  PlaceGroupInterdictionRequestDto,
  DriveDto,
  BatchDto,
  LotNumberDto,
  CollectionDateDto,
} from './models/group-interdiction.model';
import { AddInterdictionPanel } from './add-interdiction-panel/add-interdiction-panel';
import { EditInterdictionPanel } from './edit-interdiction-panel/edit-interdiction-panel';
import { ViewUnitsDialog } from './view-units-dialog/view-units-dialog';
import { FilterChipsUtils } from './utils/filter-chips.utils';
import { GroupInterdictionFilterPanel } from './filter-panel/filter-panel';

/**
 * Place Group Interdiction or Hold Component
 * JIRA: MLT-12686
 * Mnemonic: EGRPINT
 *
 * Apply or release interdictions/holds on groups of blood units based on:
 * DRIVE, BATCH, COLL DATE, LOT, TBID, ITBID
 */
@Component({
  selector: 'app-place-group-interdiction',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DataTable,
    MatSidenavModule,
    PageHeaderWithBreadcrumb,
    AddInterdictionPanel,
    EditInterdictionPanel,
    ViewUnitsDialog,
    SearchBar,
    FilterChips,
  ],
  templateUrl: './place-group-interdiction.html',
  styleUrl: './place-group-interdiction.scss',
})
export class PlaceGroupInterdiction implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `place-group-interdiction-${PlaceGroupInterdiction.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Dependencies
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly apiService = inject(GroupInterdictionApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly overlay = inject(Overlay);
  private readonly destroy$ = new Subject<void>();

  // ViewChild references
  @ViewChild('sidePanel') sidePanel!: MatDrawer;
  @ViewChild('tableCard') tableCard!: ElementRef;

  // Flag for breadcrumb state and return URL
  protected readonly fromVerifyControlValues = signal<boolean>(false);
  protected readonly returnUrl = signal<string | null>(null);

  /**
   * Navigate back to Verify Control Values with preserved query params
   */
  protected readonly navigateBack = (): void => {
    const returnUrl = this.returnUrl();
    console.log('navigateBack called, returnUrl:', returnUrl);

    if (returnUrl) {
      console.log('Navigating to full URL:', returnUrl);
      // Use navigateByUrl to navigate with the complete URL including query params
      this.router.navigateByUrl(returnUrl);
    } else {
      console.log('No returnUrl found, navigating to default Verify Control Values page');
      // Fallback to default Verify Control Values page (use registered route path)
      this.router.navigate(['/laboratory-functions/testing-modules/test-staging-parameters/verify-control-values']);
    }
  };

  // Page header configuration
  protected readonly pageHeaderConfig = computed<PageHeaderConfig>(() => {
    const breadcrumbs: Array<{ label: string; link: string | null }> = [
      { label: 'Home', link: '/' }
    ];

    // Add intermediate breadcrumb when navigated from Verify Control Values
    if (this.fromVerifyControlValues()) {
      breadcrumbs.push({
        label: 'Verify Control Values for Test Batch',
        // Use registered route path to show chevron arrow, back button handles navigation with query params
        link: '/laboratory-functions/testing-modules/test-staging-parameters/verify-control-values'
      });
    }

    breadcrumbs.push({ label: 'Place Group Interdiction or Hold', link: null });

    return {
      title: 'Place Group Interdiction or Hold',
      subtitle: 'Apply or release an interdiction or hold on a defined group of units simultaneously.',
      breadcrumbs,
      // Show back button when navigated from Verify Control Values
      showBackButton: this.fromVerifyControlValues(),
      onBackClick: () => this.navigateBack(),
      actions: (!!this.selectedMode() && !!this.selectedValue()) ? [{
        label: 'ADD INTERDICTION',
        icon: 'add',
        color: 'primary' as const,
        onClick: () => this.onAddInterdiction(),
      }] : [],
    };
  });

  // Form
  form!: FormGroup;

  // Signal-based state
  protected readonly interdictions = signal<InterdictionDto[]>([]);
  protected readonly activeInterdictionCodes = signal<ValidInterdictionDto[]>([]);
  protected readonly driveOptions = signal<DriveDto[]>([]);
  protected readonly batchOptions = signal<BatchDto[]>([]);
  protected readonly lotNumberOptions = signal<LotNumberDto[]>([]);
  protected readonly collectionDateOptions = signal<CollectionDateDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly loadingDropdowns = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly selectedMode = signal<ControlMode | null>(null);
  protected readonly selectedValue = signal<string | null>(null);
  protected readonly searchText = signal<string>('');

  // Filter state
  private overlayRef: OverlayRef | null = null;
  isFilterOpen = false;
  appliedFilters: GroupInterdictionFilterValue | null = null;
  filterChips: FilterChip[] = [];
  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Interdiction Code',
    minLength: 1,
    ariaLabel: 'Search interdictions',
    debounceTime: 300
  };

  // Selection state for Place functionality
  protected readonly selectedInterdictions = signal<InterdictionDto[]>([]);
  protected readonly externalSelectedIds = signal<Set<string>>(new Set());
  protected readonly placing = signal<boolean>(false);
  protected readonly hasSelection = computed(() => this.selectedInterdictions().length > 0);

  // Drawer state
  protected readonly activeSidePanel = signal<'add' | 'edit' | 'viewUnits' | null>(null);
  protected readonly editingInterdiction = signal<InterdictionDto | null>(null);

  // Search controls for value dropdowns
  protected readonly driveSearchCtrl = new FormControl('');
  protected readonly batchSearchCtrl = new FormControl('');
  protected readonly lotSearchCtrl = new FormControl('');
  protected readonly collDateSearchCtrl = new FormControl('');

  private readonly driveSearch = signal('');
  private readonly batchSearch = signal('');
  private readonly lotSearch = signal('');
  private readonly collDateSearch = signal('');

  protected readonly filteredDriveOptions = computed(() => {
    const search = this.driveSearch().toLowerCase();
    const all = [...this.driveOptions()].sort((a, b) => b.driveId.localeCompare(a.driveId));
    if (!search) return all;
    return all.filter(d => d.driveId.toLowerCase().startsWith(search));
  });

  protected readonly filteredBatchOptions = computed(() => {
    const search = this.batchSearch().toLowerCase();
    const all = [...this.batchOptions()].sort((a, b) => b.batchId.localeCompare(a.batchId));
    if (!search) return all;
    return all.filter(b => b.batchId.toLowerCase().startsWith(search));
  });

  protected readonly filteredLotOptions = computed(() => {
    const search = this.lotSearch().toLowerCase();
    const all = [...this.lotNumberOptions()].sort((a, b) => b.lotNumber.localeCompare(a.lotNumber));
    if (!search) return all;
    return all.filter(l => l.lotNumber.toLowerCase().startsWith(search));
  });

  protected readonly filteredCollectionDateOptions = computed(() => {
    const search = this.collDateSearch().toLowerCase();
    const all = [...this.collectionDateOptions()].sort((a, b) => new Date(b.collDate).getTime() - new Date(a.collDate).getTime());
    if (!search) return all;
    return all.filter(d => d.formattedDate.toLowerCase().startsWith(search));
  });

  // Computed values
  protected readonly hasData = computed(() => this.interdictions().length > 0);
  protected readonly isEmpty = computed(() => !this.loading() && this.interdictions().length === 0);
  protected readonly isReady = computed(() => !this.loading() && !this.error());
  protected readonly canViewUnits = computed(() => this.hasData());

  // Filtered interdictions based on search and filters
  protected readonly filteredInterdictions = computed(() => {
    const search = this.searchText().toLowerCase().trim();
    let interdictions = this.interdictions();

    if (this.appliedFilters) {
      if (this.appliedFilters.interType) {
        interdictions = interdictions.filter(
          (item) => item.interType.toUpperCase() === this.appliedFilters!.interType!.toUpperCase()
        );
      }
      if (this.appliedFilters.interCode) {
        interdictions = interdictions.filter(
          (item) => item.interCode === this.appliedFilters!.interCode
        );
      }
    }

    if (!search) {
      return interdictions;
    }

    return interdictions.filter((item) =>
      item.interCode.toLowerCase().includes(search),
    );
  });

  // Table configuration
  tableConfig: DataTableConfig<InterdictionDto> = {
    columns: [
      { key: 'interCode', header: 'Interdiction Code', sortable: false },
      { key: 'interDesc', header: 'Description', sortable: false },
      { key: 'interType', header: 'Type', sortable: false },
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    enableSelection: true,
    selectionPosition: 'first',
    selectionKey: 'interCode',
    stickyHeader: true,
    showPagination: true,
    emptyMessage: 'No interdictions found',
    loadingMessage: 'Loading interdictions...',
    caption: 'Interdictions list',
    rowLabelKey: 'interCode',
  };

  protected tableData: InterdictionDto[] = [];

  private readonly syncTableData = effect(() => {
    const filtered = this.filteredInterdictions();
    this.tableData = filtered;
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        totalRecords: filtered.length,
        pageIndex: 0,
      },
    };
  });

  // Mode options
  protected readonly modeOptions: ControlMode[] = ['BATCH', 'COLL DATE', 'DRIVE', 'TBID', 'ITBID', 'LOT'];

  // Dynamic value field type
  protected readonly valueFieldType = computed(() => {
    const mode = this.selectedMode();
    if (!mode) return 'none';
    if (mode === 'COLL DATE') return 'dropdown';
    if (mode === 'DRIVE' || mode === 'BATCH' || mode === 'LOT') return 'dropdown';
    if (mode === 'TBID' || mode === 'ITBID') return 'text';
    return 'none';
  });

  protected formattedSelectionValue(): string {
    const value = this.form?.get('value')?.value;
    if (!value) return '';
    return value;
  }


  ngOnInit(): void {
    this.initForm();
    this.setupFormListeners();
    this.loadActiveInterdictions();

    // Pre-populate form and read return URL from query params
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      console.log('Place Group Interdiction queryParams:', params);

      // Store return URL and show back button if returnUrl is present
      if (params['returnUrl']) {
        console.log('Setting returnUrl to:', params['returnUrl']);
        this.returnUrl.set(params['returnUrl']);
        this.fromVerifyControlValues.set(true);
      } else {
        console.log('No returnUrl in params');
      }

      // Pre-populate form with mode and value
      if (params['mode'] && params['value']) {
        const mode = params['mode'] as ControlMode;
        const value = params['value'];

        // Set mode first
        this.form.patchValue({ mode }, { emitEvent: false });
        this.selectedMode.set(mode);

        // Then set value after a brief delay to ensure mode setup is complete
        setTimeout(() => {
          this.form.patchValue({ value });
        }, 100);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      mode: [null, [Validators.required]],
      value: [null],
    });
  }

  private setupFormListeners(): void {
    this.driveSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.driveSearch.set(v || ''));
    this.batchSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.batchSearch.set(v || ''));
    this.lotSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.lotSearch.set(v || ''));
    this.collDateSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.collDateSearch.set(v || ''));

    // When mode changes, load appropriate dropdown options and reset value
    this.form.get('mode')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((mode: ControlMode) => {
      this.selectedMode.set(mode);
      this.selectedValue.set(null);
      this.form.get('value')?.reset();
      this.interdictions.set([]);
      this.driveSearchCtrl.setValue('');
      this.batchSearchCtrl.setValue('');
      this.lotSearchCtrl.setValue('');
      this.collDateSearchCtrl.setValue('');

      if (mode === 'DRIVE') {
        this.loadDrives();
      } else if (mode === 'BATCH') {
        this.loadBatches();
      } else if (mode === 'LOT') {
        this.loadLotNumbers();
      } else if (mode === 'COLL DATE') {
        this.loadCollectionDates();
      }

      // Update value field validators
      this.updateValueValidators();
    });

    // When value changes, load interdictions for the selected group
    this.form.get('value')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.selectedValue.set(value || null);
      if (value) {
        this.loadInterdictionsForGroup();
      } else {
        this.interdictions.set([]);
      }
    });

  }

  private updateValueValidators(): void {
    const valueControl = this.form.get('value');
    if (!valueControl) return;

    valueControl.setValidators([Validators.required]);
    valueControl.updateValueAndValidity();
  }

  private loadActiveInterdictions(): void {
    this.apiService
      .getActiveInterdictions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.activeInterdictionCodes.set(codes);
        },
        error: (err) => {
          console.error('Error loading active interdictions:', err);
          this.snackbarService.showError('Failed to load active interdiction codes.');
        },
      });
  }

  private loadDrives(): void {
    this.loadingDropdowns.set(true);
    this.apiService
      .getDrives()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (drives) => {
          this.driveOptions.set(drives);
          this.loadingDropdowns.set(false);
        },
        error: (err) => {
          console.error('Error loading drives:', err);
          this.snackbarService.showError('Failed to load drives.');
          this.loadingDropdowns.set(false);
        },
      });
  }

  private loadBatches(): void {
    this.loadingDropdowns.set(true);
    this.apiService
      .getBatches()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (batches) => {
          this.batchOptions.set(batches);
          this.loadingDropdowns.set(false);
        },
        error: (err) => {
          console.error('Error loading batches:', err);
          this.snackbarService.showError('Failed to load batches.');
          this.loadingDropdowns.set(false);
        },
      });
  }


  private loadCollectionDates(): void {
    this.loadingDropdowns.set(true);
    this.apiService
      .getCollectionDates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dates) => {
          this.collectionDateOptions.set(dates);
          this.loadingDropdowns.set(false);
        },
        error: (err) => {
          console.error('Error loading collection dates:', err);
          this.snackbarService.showError('Failed to load collection dates.');
          this.loadingDropdowns.set(false);
        },
      });
  }

  private loadLotNumbers(): void {
    this.loadingDropdowns.set(true);
    this.apiService
      .getLotNumbers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lots) => {
          this.lotNumberOptions.set(lots);
          this.loadingDropdowns.set(false);
        },
        error: (err) => {
          console.error('Error loading lot numbers:', err);
          this.snackbarService.showError('Failed to load lot numbers.');
          this.loadingDropdowns.set(false);
        },
      });
  }

  protected loadInterdictionsForGroup(): void {
    // The table starts empty - user adds interdictions manually via the Add Interdiction panel
    this.interdictions.set([]);
  }

  protected get f() {
    return this.form.controls;
  }

  protected onAddInterdiction(): void {
    this.loadActiveInterdictions();
    this.activeSidePanel.set('add');
    this.sidePanel?.open();
  }

  protected onEditInterdiction(interdiction: InterdictionDto): void {
    this.loadActiveInterdictions();
    this.editingInterdiction.set(interdiction);
    this.activeSidePanel.set('edit');
    this.sidePanel?.open();
  }

  protected onViewUnits(): void {
    const mode = this.form.get('mode')?.value;
    const value = this.formattedSelectionValue();

    if (!mode || (!value && mode !== 'COLL DATE')) {
      this.snackbarService.showError('Please select both Mode and Value to view units.');
      return;
    }

    this.activeSidePanel.set('viewUnits');
    this.sidePanel?.open();
  }

  protected onViewUnitsPanelClosed(): void {
    this.sidePanel?.close();
    this.activeSidePanel.set(null);
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      return;
    }

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
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });

    this.isFilterOpen = true;

    const portal = new ComponentPortal(GroupInterdictionFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;
    componentRef.instance.interdictionCodes = this.activeInterdictionCodes();
    componentRef.changeDetectorRef.detectChanges();

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

  applyFilters(filters: GroupInterdictionFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = FilterChipsUtils.convertFiltersToChips(filters);
    this.interdictions.set([...this.interdictions()]);
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = FilterChipsUtils.removeFilterByChipKey(this.appliedFilters, chipKey);
    this.filterChips = FilterChipsUtils.convertFiltersToChips(this.appliedFilters);
    this.interdictions.set([...this.interdictions()]);
  }

  hasActiveFilters(): boolean {
    return FilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    this.interdictions.set([...this.interdictions()]);
  }

  onSearch(searchText: string): void {
    this.searchText.set(searchText);
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
  }

  protected onSelectionChange(selected: InterdictionDto[]): void {
    this.selectedInterdictions.set(selected);
  }

  protected onPlace(): void {
    const selected = this.selectedInterdictions();
    const mode = this.selectedMode();
    if (!selected.length || !mode) return;

    this.placing.set(true);

    const request: PlaceGroupInterdictionRequestDto = {
      controlMode: mode,
      interdictionCodes: selected.map(s => s.interCode),
    };
    if (mode === 'COLL DATE') {
      request.collectionDate = this.formattedSelectionValue();
    } else {
      request.selectionValue = this.formattedSelectionValue();
    }

    this.apiService
      .placeInterdictions(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.placing.set(false);
          this.snackbarService.showSuccess('Interdictions placed successfully.');

          // Reset to initial screen
          this.form.reset();
          this.selectedMode.set(null);
          this.selectedValue.set(null);
          this.interdictions.set([]);
          this.selectedInterdictions.set([]);
          this.externalSelectedIds.set(new Set());
        },
        error: (err) => {
          this.placing.set(false);
          console.error('Error placing interdictions:', err);
          this.snackbarService.showError('Failed to place interdictions.');
        },
      });
  }

  protected onClearAllSelections(): void {
    this.selectedInterdictions.set([]);
    this.externalSelectedIds.set(new Set());
  }

  protected onInterdictionPlaced(interdiction: InterdictionDto): void {
    const current = this.interdictions();
    if (!current.some(i => i.interCode === interdiction.interCode)) {
      this.interdictions.set([...current, interdiction]);
    }
  }

  protected onPanelClosed(): void {
    const wasEdit = this.activeSidePanel() === 'edit';
    this.activeSidePanel.set(null);
    this.editingInterdiction.set(null);
  }

  protected onAddPanelClosed(saved: boolean): void {
    this.sidePanel?.close();
    this.activeSidePanel.set(null);
  }

  protected onEditPanelClosed(saved: boolean): void {
    this.sidePanel?.close();
    this.activeSidePanel.set(null);
    this.editingInterdiction.set(null);

    if (saved) {
      this.loadInterdictionsForGroup();
    }
  }

  protected formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    const m = moment(dateStr);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateStr;
  }
}
