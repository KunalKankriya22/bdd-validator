import { Component, OnInit, OnDestroy, inject, signal, computed, effect, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subject, takeUntil, finalize } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';

import { ConfirmatoryExtractionApiService } from './services/confirmatory-extraction-api.service';
import {
  ExtractIdDropdownDto,
  ContractDropdownDto,
  ConfirmatoryExtractUnitDto,
  ScheduleExtractionRequestDto,
  ExecuteExtractionRequestDto,
  ExtractResultsDialogData,
  ExtractResultsDialogResult,
  CrxtractFilterValue
} from './models/confirmatory-extraction.model';
import { ExtractResultsDialogComponent } from './dialogs/extract-results-dialog/extract-results-dialog';
import { CrxtractFilterComponent } from './components/crxtract-filter/crxtract-filter.component';

@Component({
  selector: 'app-re-extract-confirmatory-test-results',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    FilterChips,
    DataTable
  ],
  templateUrl: './re-extract-confirmatory-test-results.html',
  styleUrl: './re-extract-confirmatory-test-results.scss'
})
export class ReExtractConfirmatoryTestResultsComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `re-extract-confirmatory-${ReExtractConfirmatoryTestResultsComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ConfirmatoryExtractionApiService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);

  @ViewChild('resultsSection', { read: ElementRef }) resultsSection!: ElementRef;
  private overlayRef: OverlayRef | null = null;
  isFilterOpen = false;
  appliedFilters: CrxtractFilterValue | null = null;

  // Searchable dropdown controls
  protected readonly extractIdSearchCtrl = new FormControl('');
  protected readonly contractIdSearchCtrl = new FormControl('');
  private readonly extractIdSearchText = signal('');
  private readonly contractIdSearchText = signal('');

  protected readonly filteredExtractIds = computed(() => {
    const s = this.extractIdSearchText().toLowerCase();
    return !s ? this.extractIds() : this.extractIds().filter(e => e.extractId.toLowerCase().includes(s));
  });

  protected readonly filteredContracts = computed(() => {
    const s = this.contractIdSearchText().toLowerCase();
    return !s ? this.contracts() : this.contracts().filter(c =>
      c.contractId.toLowerCase().includes(s) || c.company.toLowerCase().includes(s)
    );
  });

  protected readonly extractIds = signal<ExtractIdDropdownDto[]>([]);
  protected readonly contracts = signal<ContractDropdownDto[]>([]);
  protected readonly units = signal<ConfirmatoryExtractUnitDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly loadingExtractIds = signal<boolean>(false);
  protected readonly loadingContracts = signal<boolean>(false);
  protected readonly loadingUnits = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly hasRetrieved = signal<boolean>(false);
  protected readonly filterText = signal<string>('');
  protected readonly selectedUnitIds = signal<Set<string>>(new Set());

  protected readonly dateFilters = signal<CrxtractFilterValue | null>(null);

  // Computed values
  protected readonly filteredUnits = computed(() => {
    const filter = this.filterText().toLowerCase();
    if (!filter) return this.units();

    return this.units().filter(unit =>
      unit.unitId.toLowerCase().includes(filter) ||
      unit.osUnitId?.toLowerCase().includes(filter) ||
      unit.testSeriesId?.toLowerCase().includes(filter) ||
      unit.testId?.toLowerCase().includes(filter) ||
      unit.batchId?.toLowerCase().includes(filter)
    );
  });

  protected readonly hasUnits = computed(() => this.units().length > 0);
  protected readonly hasFilteredUnits = computed(() => this.filteredUnits().length > 0);
  protected readonly selectedCount = computed(() => this.selectedUnitIds().size);

  filterChips: FilterChip[] = [];

  hasActiveFilters(): boolean {
    return this.filterChips.length > 0;
  }

  private updateFilterChips(): void {
    const f = this.appliedFilters;
    if (!f) { this.filterChips = []; return; }

    const chips: FilterChip[] = [];
    if (f.qcDateFrom) {
      const date = moment(f.qcDateFrom).format('DD-MMM-YYYY').toUpperCase();
      chips.push({ key: 'qcDateFrom', label: `QC Date ≥ ${date}`, value: f.qcDateFrom, removable: true });
    }
    if (f.qcDateTo) {
      const date = moment(f.qcDateTo).format('DD-MMM-YYYY').toUpperCase();
      chips.push({ key: 'qcDateTo', label: `QC Date ≤ ${date}`, value: f.qcDateTo, removable: true });
    }
    if (f.receivedDateFrom) {
      const date = moment(f.receivedDateFrom).format('DD-MMM-YYYY').toUpperCase();
      chips.push({ key: 'receivedDateFrom', label: `Received Date ≥ ${date}`, value: f.receivedDateFrom, removable: true });
    }
    if (f.receivedDateTo) {
      const date = moment(f.receivedDateTo).format('DD-MMM-YYYY').toUpperCase();
      chips.push({ key: 'receivedDateTo', label: `Received Date ≤ ${date}`, value: f.receivedDateTo, removable: true });
    }
    this.filterChips = chips;
  }

  onRemoveFilterChip(key: string): void {
    if (!this.appliedFilters) return;
    this.appliedFilters = { ...this.appliedFilters, [key]: null };
    this.dateFilters.set(this.appliedFilters);
    this.updateFilterChips();
    this.onRetrieve();
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.dateFilters.set(null);
    this.filterChips = [];
    this.onRetrieve();
  }

  // Table configuration
  tableConfig: DataTableConfig<ConfirmatoryExtractUnitDto> = {
    columns: [
      { key: 'unitId', header: 'Unit ID' },
      { key: 'osUnitId', header: 'Outside Unit ID' },
      { key: 'testSeriesId', header: 'Series ID' },
      { key: 'testId', header: 'Test ID' },
      { key: 'qcDate', header: 'QC Date', valueFormatter: (v) => this.formatDateTime(v) },
      { key: 'batchId', header: 'Batch ID' },
      { key: 'receivedDate', header: 'Received Date', valueFormatter: (v) => this.formatDate(v) }
    ],
    enableSelection: true,
    selectionPosition: 'first',
    selectionKey: 'unitId',
    stickyHeader: true,
    emptyMessage: 'No units found for the applied filters',
    showTableOnEmpty: true,
    caption: 'Confirmatory extract units'
  };

  // Page header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: 'Re-Extract Confirmatory Test Results',
    subtitle: 'Extract test series or test results for an extract ID when the original extract file was damaged or must otherwise be regenerated.'
  };

  // Search configuration
  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Unit ID, Series ID, Test ID, Batch...',
    minLength: 1,
    ariaLabel: 'Search units',
    searchOnEnterOnly: false,
    alwaysShowTooltip: false
  };

  // Form
  filterForm!: FormGroup;

  private destroy$ = new Subject<void>();

  constructor() {
    // Update header config when page header data changes
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
          subtitle: pageData.subtitle || this.headerConfig.subtitle
        };
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.loadExtractIds();
    this.setupFormListeners();
    this.subscribeToChapterChanges();
    this.setupDropdownSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.filterForm = this.fb.group({
      extractId: ['', Validators.required],
      contractId: [''],
      contractDescription: [{ value: '', disabled: true }]
    });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadExtractIds();
      });
  }

  private setupDropdownSearch(): void {
    this.extractIdSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.extractIdSearchText.set(v || ''));

    this.contractIdSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.contractIdSearchText.set(v || ''));
  }

  private setupFormListeners(): void {
    // When Extract ID changes, load contracts and clear units
    this.filterForm.get('extractId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(extractId => {
        this.contracts.set([]);
        this.units.set([]);
        this.selectedUnitIds.set(new Set());
        this.filterForm.patchValue({ contractId: '', contractDescription: '' }, { emitEvent: false });

        if (extractId) {
          this.loadContracts(extractId);
        }
      });

    // When Contract ID changes, update description
    this.filterForm.get('contractId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(contractId => {
        const contract = this.contracts().find(c => c.contractId === contractId);
        this.filterForm.patchValue({
          contractDescription: contract?.company || ''
        }, { emitEvent: false });
      });
  }

  /**
   * Load Extract IDs dropdown (last 14 days)
   */
  private loadExtractIds(): void {
    this.loadingExtractIds.set(true);
    this.error.set(null);

    this.apiService.getExtractIds()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingExtractIds.set(false))
      )
      .subscribe({
        next: (data) => {
          this.extractIds.set(data);
          if (data.length === 0) {
            this.error.set('No extract IDs found in the last 14 days');
          }
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to load extract IDs');
          this.snackbarService.showError('Failed to load extract IDs');
        }
      });
  }

  /**
   * Load Contracts for selected Extract ID
   */
  private loadContracts(extractId: string): void {
    this.loadingContracts.set(true);

    this.apiService.getContracts(extractId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingContracts.set(false))
      )
      .subscribe({
        next: (data) => {
          this.contracts.set(data);
        },
        error: (err) => {
          this.snackbarService.showError('Failed to load contracts');
        }
      });
  }

  /**
   * Load Units for extraction
   */
  onRetrieve(): void {
    if (this.filterForm.invalid) {
      return;
    }

    const extractId = this.filterForm.get('extractId')?.value;
    const contractId = this.filterForm.get('contractId')?.value;
    const df = this.appliedFilters;

    this.loadingUnits.set(true);
    this.error.set(null);

    this.apiService.getUnits(extractId, contractId, df?.qcDateFrom, df?.qcDateTo, df?.receivedDateFrom, df?.receivedDateTo)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingUnits.set(false))
      )
      .subscribe({
        next: (data) => {
          this.units.set(data);
          this.hasRetrieved.set(true);
          const selectedIds = new Set(data.map(u => u.unitId));
          this.selectedUnitIds.set(selectedIds);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to load units');
          this.snackbarService.showError('Failed to load units');
        }
      });
  }

  /**
   * Clear all filters and results
   */
  onClearAll(): void {
    this.filterForm.reset();
    this.contracts.set([]);
    this.units.set([]);
    this.selectedUnitIds.set(new Set());
    this.filterText.set('');
    this.error.set(null);
    this.hasRetrieved.set(false);
    this.appliedFilters = null;
    this.dateFilters.set(null);
  }

  /**
   * Handle search text change
   */
  onSearch(searchText: string): void {
    this.filterText.set(searchText);
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      return;
    }

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.resultsSection)
      .withPositions([{
        originX: 'start', originY: 'top',
        overlayX: 'start', overlayY: 'top',
        offsetX: 0, offsetY: 56
      }])
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    this.isFilterOpen = true;

    const portal = new ComponentPortal(CrxtractFilterComponent);
    const componentRef = this.overlayRef.attach(portal);
    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.appliedFilters = filters;
        this.dateFilters.set(filters);
        this.updateFilterChips();
        this.disposeOverlay();
        this.onRetrieve();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.disposeOverlay());

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.disposeOverlay());
  }

  private disposeOverlay(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.overlayRef) {
      event.preventDefault();
      this.disposeOverlay();
    }
  }

  onSelectionChange(selectedRows: ConfirmatoryExtractUnitDto[]): void {
    this.selectedUnitIds.set(new Set(selectedRows.map(r => r.unitId)));
  }

  /**
   * Open Extract Results dialog and handle extraction
   */
  onExtract(): void {
    if (this.selectedUnitIds().size === 0) {
      this.snackbarService.showError('Please select at least one unit for extraction');
      return;
    }

    const extractId = this.filterForm.get('extractId')?.value;
    const dialogData: ExtractResultsDialogData = {
      extractId,
      selectedUnitIds: Array.from(this.selectedUnitIds()),
      unitsCount: this.selectedUnitIds().size
    };

    const dialogRef = this.dialog.open(ExtractResultsDialogComponent, {
      width: '560px',
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().subscribe((result: ExtractResultsDialogResult | null) => {
      if (result) {
        this.performExtraction(extractId, Array.from(this.selectedUnitIds()), result);
      }
    });
  }

  /**
   * Perform extraction (scheduled or immediate)
   */
  private performExtraction(extractId: string, selectedUnitIds: string[], dialogResult: ExtractResultsDialogResult): void {
    this.loading.set(true);

    if (dialogResult.afterTime) {
      // Schedule extraction for future time
      const request: ScheduleExtractionRequestDto = {
        extractId,
        selectedUnitIds,
        afterTime: dialogResult.afterTime,
        generateSeriesReport: dialogResult.generateSeriesReport
      };

      this.apiService.scheduleExtraction(request)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.loading.set(false))
        )
        .subscribe({
          next: (result) => {
            const msg = result.reportGenerated
              ? `${result.unitsProcessed} units scheduled for re-extraction with series report for '${result.extractId}'`
              : `${result.unitsProcessed} units scheduled for re-extraction for '${result.extractId}'`;
            this.snackbarService.showSuccess(msg);
            this.onClearAll();
          },
          error: (err) => {
            this.snackbarService.showError(err.error?.message || 'Failed to schedule extraction');
          }
        });
    } else {
      // Execute immediate extraction
      const request: ExecuteExtractionRequestDto = {
        extractId,
        selectedUnitIds,
        generateSeriesReport: dialogResult.generateSeriesReport
      };

      this.apiService.executeExtraction(request)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.loading.set(false))
        )
        .subscribe({
          next: (result) => {
            const msg = result.reportGenerated
              ? `${result.unitsProcessed} units are Re-extracted with series report for '${result.extractId}'`
              : `${result.unitsProcessed} units are Re-extracted for '${result.extractId}'`;
            this.snackbarService.showSuccess(msg);
            this.onClearAll();
          },
          error: (err) => {
            this.snackbarService.showError(err.error?.message || 'Failed to execute extraction');
          }
        });
    }
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    return DateFieldValidationUtility.formatDateForUI(date) || '-';
  }

  formatDateTime(dateStr: string | null): string {
    if (!dateStr) return '-';
    const m = moment(dateStr);
    if (!m.isValid()) return '-';
    return m.format('DD-MMM-YYYY, HH:mm').replace(/(\w{3})/, match => match.toUpperCase());
  }
}
