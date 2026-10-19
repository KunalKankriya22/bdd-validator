import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  signal,
  computed,
  inject,
  effect,
  TemplateRef,
  ViewChild,
  ViewChildren,
  QueryList,
} from '@angular/core';
import { UnitIdFieldComponent, UnitValidationResponse, UnitIdPostValidateEvent } from '@shared/components/unit-id-field';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Observable, Subject, firstValueFrom, of } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { ScanSelectFieldComponent } from '@shared/components/scan-select-field/scan-select-field.component';
import { ScanSelectOption } from '@shared/components/scan-select-field/scan-select-field.model';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { DialogButton } from '@shared/interfaces/dialog.interface';
import {
  DataTableConfig,
  TablePageEvent,
  TableSortEvent,
} from '@shared/interfaces/data-table.interface';

import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { BagCheckInService } from './services/bag-check-in.service';
import {
  BagBatch,
  BagCatalog,
  BagUnit,
  BagLot,
  TubeFormat,
  TubeCheckInSubmitRequest,
  TubeCheckInEntry as TubeCheckInEntryModel,
  TubeValidateUnitResponse,
} from './models/bag-check-in.model';

// ───────────────────────────────────────────── Interfaces ─────────────────────

export interface BagBatchOption {
  batchId: string;
  displayLabel: string;
}

export interface LotNumberOption {
  lotNumber: string;
  displayLabel: string;
}

export interface CatalogNumberOption {
  catalogNumber: string;
  displayLabel: string;
}

export interface TubeFormatOption {
  formatCode: string;
  description: string;
  tubes: TubeDefinition[];
  /** null = at least one of any; 'red1' / 'purple1' = specific type required */
  requiredControlName: string | null;
}

export interface TubeDefinition {
  controlName: string;
  label: string;
  // required removed — group validator handles "at least one" rule
}

export interface BagCheckInEntry {
  unitId: string;
  catalogNumber: string;
  driveId: string;
  name: string;
  lotNumber: string;
  cue: string;
  protocol: string;
}

export interface TubeCheckInEntry {
  sequence: number;
  redTop1: string;
  redTop2: string;
  purpleTop1: string;
  purpleTop2: string;
}

// ─────────────────────────────────────── Protocol badge helpers ────────────────

export type ProtocolColor = 'green' | 'red' | 'orange' | 'blue' | 'gray' | 'purple';

function getProtocolColor(protocol: string): ProtocolColor {
  const p = (protocol || '').toUpperCase();
  if (p === '3GB') return 'green';
  if (p === 'AL')  return 'red';
  if (p === '2CB') return 'orange';
  if (p === '3C')  return 'blue';
  if (p === '2C')  return 'gray';
  if (p === 'I')   return 'blue';
  if (p === 'A')   return 'orange';
  if (p === 'N')   return 'green';
  if (p === 'C')   return 'gray';
  if (p === '8')   return 'blue';
  if (p === 'X')   return 'gray';
  if (p === 'V')   return 'purple';
  return 'gray';
}

// Fallback tube formats — all codes verified against MCIATUBE FMB navigation triggers.
// Used synchronously before the API response arrives so the screen renders immediately.
// 'PR' removed: not a valid code in master_codes CODE_TYPE='TUBES' or 'TUBE4'.
const DEFAULT_TUBE_FORMATS: Array<{
  formatCode: string;
  description: string;
  fields: Array<{ controlName: string; label: string }>;
  requiredControlName: string | null;
}> = [
  {
    formatCode: 'R1',
    description: 'Red Top 1',
    requiredControlName: 'red1',
    fields: [{ controlName: 'red1', label: 'Red Top 1' }],
  },
  {
    formatCode: 'R2',
    description: 'Red Top 1 and Red Top 2',
    requiredControlName: 'red1',
    fields: [
      { controlName: 'red1', label: 'Red Top 1' },
      { controlName: 'red2', label: 'Red Top 2' },
    ],
  },
  {
    formatCode: 'R*',
    description: 'Red Top 1 or Red Top 2',
    requiredControlName: null,
    fields: [
      { controlName: 'red1', label: 'Red Top 1' },
      { controlName: 'red2', label: 'Red Top 2' },
    ],
  },
  {
    formatCode: 'P1',
    description: 'Red Top 1 and Purple Top 1',
    requiredControlName: 'purple1',
    fields: [
      { controlName: 'red1',    label: 'Red Top 1' },
      { controlName: 'purple1', label: 'Purple Top 1' },
    ],
  },
  {
    formatCode: 'P2',
    description: 'Red Top 1, Red Top 2, Purple Top 1, and Purple Top 2',
    requiredControlName: 'purple1',
    fields: [
      { controlName: 'red1',    label: 'Red Top 1' },
      { controlName: 'red2',    label: 'Red Top 2' },
      { controlName: 'purple1', label: 'Purple Top 1' },
      { controlName: 'purple2', label: 'Purple Top 2' },
    ],
  },
  {
    formatCode: 'P*',
    description: 'Purple Top 1 or Purple Top 2',
    requiredControlName: null,
    fields: [
      { controlName: 'purple1', label: 'Purple Top 1' },
      { controlName: 'purple2', label: 'Purple Top 2' },
    ],
  },
  {
    formatCode: 'A',
    description: 'Any tube combination',
    requiredControlName: null,
    fields: [
      { controlName: 'red1',    label: 'Red Top 1' },
      { controlName: 'red2',    label: 'Red Top 2' },
      { controlName: 'purple1', label: 'Purple Top 1' },
      { controlName: 'purple2', label: 'Purple Top 2' },
    ],
  },
  {
    formatCode: 'PPR',
    description: 'Purple 1, Purple 2, and Red Top 1',
    requiredControlName: 'red1',
    fields: [
      { controlName: 'red1',    label: 'Red Top 1' },
      { controlName: 'purple1', label: 'Purple Top 1' },
      { controlName: 'purple2', label: 'Purple Top 2' },
    ],
  },
];

/**
 * Bag & Tube Check-In Component
 * Mnemonic: BAGS
 * FMB: MCIBAGS
 * Tabs: Bag Check-In | Tube Check-In
 */
@Component({
  selector: 'app-bag-check-in',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    SidePanelBase,
    UnitIdFieldComponent,
    NgxMatSelectSearchModule,
    RouterModule,
    ScanSelectFieldComponent,
  ],
  templateUrl: './bag-check-in.html',
  styleUrls: ['./bag-check-in.scss'],
})
export class BagCheckInComponent implements OnInit, AfterViewInit, OnDestroy {
  // ── dependency injection ──────────────────────────────────────────────────
  private readonly fb = inject(FormBuilder);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly bagCheckInService = inject(BagCheckInService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // ── Tab definitions — id matches URL slug and @switch discriminator ───────
  readonly tabs = [
    { id: 'bag',  label: 'Bag Check-In'  },
    { id: 'tube', label: 'Tube Check-In' },
  ] as const;
  readonly basePath = '/laboratory-functions/material-check-in/general-check-in-functions/bag-check-in';

  private readonly WARNING_CUES = new Set(['N', 'A', 'O', 'T']);

  // ── cell template ref assigned in ngAfterViewInit ────────────────────────
  @ViewChild('protocolCellTpl') protocolCellTemplate!: TemplateRef<unknown>;
  @ViewChild(UnitIdFieldComponent) unitIdField?: UnitIdFieldComponent;
  @ViewChildren('tubeField') tubeFields!: QueryList<UnitIdFieldComponent>;
  @ViewChild('catalogField') catalogField?: ScanSelectFieldComponent;
  @ViewChild('lotField') lotField?: ScanSelectFieldComponent;

  // ── page header config — populated from menu API via PageHeaderService ───
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [{ label: 'Home', link: '/home' }, { label: pageData.title, link: null }],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  // ── active tab (0 = Bag Check-In, 1 = Tube Check-In) ─────────────────────
  readonly activeTabIndex = signal<number>(0);

  // ── loading signals ───────────────────────────────────────────────────────
  readonly isLoading = signal<boolean>(false);
  readonly isCheckingIn = signal<boolean>(false);

  // ────────────────────────────────────── Bag Check-In state ────────────────

  readonly batchOptions = signal<BagBatchOption[]>([]);
  readonly filteredBatchOptions = signal<BagBatchOption[]>([]);
  readonly batchSearchControl = new FormControl('');

  // True when no batch is selected — MIN/MAX TEMP fields are editable for new batch
  readonly isNewBatch = signal<boolean>(true);

  // Read-only info row (auto-populated after Unit ID validation)
  readonly bagCatalogNumber = signal<string>('');
  readonly bagDriveId = signal<string>('');
  readonly bagName = signal<string>('');
  readonly bagCue = signal<string>('');

  readonly catalogOptions = signal<CatalogNumberOption[]>([]);
  readonly filteredCatalogOptions = signal<CatalogNumberOption[]>([]);
  readonly catalogSearchControl = new FormControl('');

  readonly lotOptions = signal<LotNumberOption[]>([]);
  readonly lotSearchControl = new FormControl('');
  readonly filteredLotOptions = signal<LotNumberOption[]>([]);
  readonly unitCodeScheme = signal<'I' | 'C' | null>(null);

  readonly hasCatalogIssue = computed(() => false);

  // Derived ScanSelectOption arrays for app-scan-select-field
  readonly catalogScanOptions = computed<ScanSelectOption[]>(() =>
    this.catalogOptions().map(c => ({ code: c.catalogNumber, description: c.displayLabel }))
  );
  readonly lotScanOptions = computed<ScanSelectOption[]>(() =>
    this.lotOptions().map(l => ({ code: l.lotNumber, description: l.displayLabel }))
  );

  // Pending lot scan from concatenated catalog+lot barcode (=)CATALOG&)LOT)
  private _pendingLotScan: string | null = null;

  // parseFn for catalog scan-select: validates against BE; handles ISBT concatenated scan
  parseCatalog = (rawValue: string): Observable<ScanSelectOption | null> => {
    const lotSepIdx = rawValue.indexOf('&)');
    let catalogPart = rawValue;
    if (lotSepIdx !== -1) {
      catalogPart = rawValue.substring(0, lotSepIdx);
      this._pendingLotScan = rawValue.substring(lotSepIdx + 2);
    }
    if (catalogPart.startsWith('=)')) {
      catalogPart = catalogPart.substring(2);
    }
    return this.bagCheckInService.validateCatalog(catalogPart).pipe(
      map(isValid => isValid ? { code: catalogPart, description: catalogPart } : null)
    );
  };

  // parseFn for lot scan-select: matches against already-loaded lot options (no extra BE call)
  parseLot = (rawValue: string): Observable<ScanSelectOption | null> => {
    const lotPart = rawValue.startsWith('&)') ? rawValue.substring(2) : rawValue;
    const match = this.lotOptions().find(l => l.lotNumber.toLowerCase() === lotPart.toLowerCase());
    return of(match ? { code: match.lotNumber, description: match.lotNumber } : null);
  };

  readonly entriesCount = signal<number>(0);

  // ── Check Units in Batch side panel ───────────────────────────────────────
  readonly showCheckUnitsPanel = signal<boolean>(false);
  readonly panelBatchId = signal<string>('');
  lastTouchedTempField: 'minTemp' | 'maxTemp' | null = null;
  readonly panelMinTemp = signal<string>('');
  readonly panelMaxTemp = signal<string>('');
  readonly panelUnits = signal<BagUnit[]>([]);
  readonly isPanelLoading = signal<boolean>(false);

  readonly checkUnitsPanelButtons: DialogButton[] = [
    { label: 'CLOSE', action: 'close', variant: 'secondary' }
  ];

  // Bag Check-In form — minTemp/maxTemp editable when no batch selected (new batch)
  bagFilterForm!: FormGroup;
  bagEntryForm!: FormGroup;

  // ── Bag table data & config ────────────────────────────────────────────────
  readonly bagTableData = signal<BagCheckInEntry[]>([]);
  private _allBagEntries: BagCheckInEntry[] = [];

  bagTableConfig!: DataTableConfig<BagCheckInEntry>;
  bagSortConfig: { column: string; direction: 'A' | 'D' | 'default' } = { column: '', direction: 'default' };
  bagPageSize = 25;
  bagPageIndex = 0;
  bagTotalRecords = 0;

  // ────────────────────────────────────── Tube Check-In state ───────────────

  readonly tubeFormatOptions = signal<TubeFormatOption[]>([]);
  readonly filteredTubeFormatOptions = signal<TubeFormatOption[]>([]);
  readonly tubeFormatSearchCtrl = new FormControl('');
  readonly selectedTubeFormat = signal<TubeFormatOption | null>(null);
  readonly tubeFormatDescription = signal<string>('');
  readonly activeTubeFields = signal<TubeDefinition[]>([]);
  /** Which control name carries the mandatory asterisk for the active format. null = at least one of any. */
  readonly tubeRequiredControlName = signal<string | null>(null);
  readonly isSubmittingTube = signal<boolean>(false);
  /** parsedUnitId keyed by controlName — populated by app-unit-id-field (validated) events */
  readonly tubeValues = signal<Record<string, string>>({});
  /** True after a failed submit attempt — triggers group-level error for PPR/PR/A formats */
  readonly tubeSubmitAttempted = signal<boolean>(false);
  /** True after the user clicks RETRIEVE — gates the tube barcode input panel */
  readonly tubeRetrieved = signal<boolean>(false);

  readonly hasAnyTubeValue = computed(() =>
    Object.values(this.tubeValues()).some(v => !!v)
  );

  tubeFilterForm!: FormGroup;

  private _tubeSequence = 0;
  private _allTubeEntries: TubeCheckInEntry[] = [];
  readonly tubeEntryCount = signal<number>(0);

  readonly tubeTableData = signal<TubeCheckInEntry[]>([]);

  readonly tubeTableConfig = signal<DataTableConfig<TubeCheckInEntry> | null>(null);
  tubeSortConfig: { column: string; direction: 'A' | 'D' | 'default' } = { column: '', direction: 'default' };
  tubePageSize = 25;
  tubePageIndex = 0;
  tubeTotalRecords = 0;

  private readonly destroy$ = new Subject<void>();

  private _lastCheckedInUnitId = '';
  private _autoCheckInInProgress = false;
  private _showEntriesSnackbarOnRetrieve = false;
  private _tubeAutoSubmitPending = false;
  private _tubeValidatingCount = 0;

  // ─────────────────────────────────── Lifecycle ────────────────────────────

  ngOnInit(): void {
    this.initBagForms();
    this.initTubeForms();
    this.buildBagTableConfig();
    this.buildTubeTableConfig();
    this.loadBatches();
    this.loadCatalogs();
    this.loadTubeFormats();
    this.subscribeToChapterChanges();

    // Set active tab from URL slug (matches antigen-rarity pattern)
    const urlPath = this.route.snapshot.url.map(s => s.path).join('/');
    if (urlPath.includes('tube')) {
      this.activeTabIndex.set(1);
    } else {
      this.activeTabIndex.set(0);
    }

    // Batch ID search filtering
    this.batchSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term ?? '').toLowerCase();
        const all = this.batchOptions();
        this.filteredBatchOptions.set(
          t ? all.filter(b => b.displayLabel.toLowerCase().includes(t)) : all
        );
      });

    // Reset lot number when catalog selection changes
    this.bagEntryForm.get('catalogNumber')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const lotCtrl = this.bagEntryForm.get('lotNumber');
        lotCtrl?.removeValidators(Validators.required);
        lotCtrl?.setErrors(null);
        lotCtrl?.updateValueAndValidity({ emitEvent: false });
        this.lotOptions.set([]);
        this.bagEntryForm.get('lotNumber')?.setValue(null, { emitEvent: false });
      });

    // Catalog number search filtering
    this.catalogSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term ?? '').toLowerCase();
        this.filteredCatalogOptions.set(
          t ? this.catalogOptions().filter(c => c.catalogNumber.toLowerCase().includes(t)) : this.catalogOptions()
        );
      });

    // Cross-field validation — track last touched field for error display
    this.bagFilterForm.get('minTemp')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastTouchedTempField = 'minTemp'; this.validateMinMax(); });

    this.bagFilterForm.get('maxTemp')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastTouchedTempField = 'maxTemp'; this.validateMinMax(); });

    // Tube format search filtering
    this.tubeFormatSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term ?? '').toLowerCase();
        const all = this.tubeFormatOptions();
        this.filteredTubeFormatOptions.set(
          t ? all.filter(f => f.formatCode.toLowerCase().includes(t) || f.description.toLowerCase().includes(t)) : all
        );
      });

    // Lot number search — single subscription, reads live lotOptions() signal (no stale closure)
    this.lotSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term ?? '').toLowerCase();
        this.filteredLotOptions.set(t ? this.lotOptions().filter(l => l.lotNumber.toLowerCase().includes(t)) : this.lotOptions());
      });

    // Pre-populate tube formats synchronously so initial render and tests work without waiting for API
    const defaultOpts: TubeFormatOption[] = DEFAULT_TUBE_FORMATS.map(f => ({
      formatCode:          f.formatCode,
      description:         f.description,
      tubes:               this.buildTubeDefinitionsFromFields(f.fields),
      requiredControlName: f.requiredControlName,
    }));
    this.tubeFormatOptions.set(defaultOpts);
    this.filteredTubeFormatOptions.set(defaultOpts);
    const firstDefault = defaultOpts[0];
    this.tubeFilterForm.get('tubeFormat')?.setValue(firstDefault.formatCode);
    this.applyTubeFormat(firstDefault);
  }

  ngAfterViewInit(): void {
    const protocolCol = this.bagTableConfig.columns.find(c => c.key === 'protocol');
    if (protocolCol && this.protocolCellTemplate) {
      protocolCol.cellTemplate = this.protocolCellTemplate;
    }
    this.bagTableConfig = { ...this.bagTableConfig };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─────────────────────────────────── Form init ────────────────────────────

  private initBagForms(): void {
    // minTemp required, maxTemp defaults to 37.5 (old app default)
    this.bagFilterForm = this.fb.group({
      batchId: [null],
      minTemp: [null, [Validators.required]],
      maxTemp: [37.5, [Validators.required]],
    });

    this.bagEntryForm = this.fb.group({
      catalogNumber: [null, [Validators.required]],
      lotNumber: [null],
    });
  }

  private initTubeForms(): void {
    this.tubeFilterForm = this.fb.group({ tubeFormat: [null] });
  }

  // Cross-field MIN > MAX validation — error shown on last-touched field only
  private validateMinMax(): void {
    if (!this.isNewBatch()) return;
    const minCtrl = this.bagFilterForm.get('minTemp');
    const maxCtrl = this.bagFilterForm.get('maxTemp');
    if (!minCtrl || !maxCtrl) return;

    const minVal = parseFloat(minCtrl.value);
    const maxVal = parseFloat(maxCtrl.value);

    // Clear cross-field error from both
    const clearErr = (ctrl: typeof minCtrl) => {
      if (ctrl?.hasError('tempExceedsRange')) {
        const errs = { ...ctrl.errors };
        delete errs['tempExceedsRange'];
        ctrl.setErrors(Object.keys(errs).length ? errs : null);
      }
    };
    clearErr(minCtrl);
    clearErr(maxCtrl);

    if (!isNaN(minVal) && !isNaN(maxVal) && minVal > maxVal) {
      // Put error only on last-touched field
      const errCtrl = this.lastTouchedTempField === 'maxTemp' ? maxCtrl : minCtrl;
      errCtrl?.setErrors({ ...errCtrl.errors, tempExceedsRange: true });
    }
  }

  // ─────────────────────────────── API calls ────────────────────────────────

  private loadCatalogs(): void {
    this.bagCheckInService.getCatalogNumbers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (catalogs: BagCatalog[]) => {
          const opts = catalogs.map(c => ({ catalogNumber: c.catalogNumber, displayLabel: c.catalogNumber }));
          this.catalogOptions.set(opts);
          this.filteredCatalogOptions.set(opts);
        },
        error: () => this.showError('Failed to load catalog numbers.')
      });
  }

  private loadBatches(): void {
    this.bagCheckInService.getBatches()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (batches: BagBatch[]) => {
          const opts = batches.map(b => ({ batchId: b.batchId, displayLabel: b.batchId }));
          this.batchOptions.set(opts);
          this.filteredBatchOptions.set(opts);
        },
        error: () => this.showError('Failed to load batch list.')
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reset bag state
        this.bagFilterForm.reset({ minTemp: null, maxTemp: 37.5 });
        this.bagFilterForm.get('minTemp')?.enable();
        this.bagFilterForm.get('maxTemp')?.enable();
        this.isNewBatch.set(true);
        this.bagEntryForm.reset();
        const lotCtrlReset = this.bagEntryForm.get('lotNumber');
        lotCtrlReset?.removeValidators(Validators.required);
        lotCtrlReset?.setErrors(null);
        lotCtrlReset?.updateValueAndValidity({ emitEvent: false });
        this.batchOptions.set([]);
        this.filteredBatchOptions.set([]);
        this.batchSearchControl.setValue('', { emitEvent: false });
        this.bagCatalogNumber.set('');
        this.bagDriveId.set('');
        this.bagName.set('');
        this.bagCue.set('');
        this.catalogOptions.set([]);
        this.filteredCatalogOptions.set([]);
        this.catalogSearchControl.setValue('', { emitEvent: false });
        this.lotOptions.set([]);
        this.entriesCount.set(0);
        this.bagTableData.set([]);
        this.bagPageIndex = 0;
        this.bagTotalRecords = 0;
        this._lastCheckedInUnitId = '';
        this._autoCheckInInProgress = false;
        this._showEntriesSnackbarOnRetrieve = false;
        this.showCheckUnitsPanel.set(false);
        // Reset tube state
        this.tubeFilterForm.reset();
        this.tubeFormatSearchCtrl.setValue('', { emitEvent: false });
        this.tubeValues.set({});
        this.tubeSubmitAttempted.set(false);
        this.tubeRetrieved.set(false);
        this._allTubeEntries = [];
        this._tubeSequence = 0;
        this.tubeEntryCount.set(0);
        this.tubeTableData.set([]);
        this.tubePageIndex = 0;
        this.tubeTotalRecords = 0;
        this._tubeAutoSubmitPending = false;
        this._tubeValidatingCount = 0;
        // Reset tab and clear unit field
        this.activeTabIndex.set(0);
        this.clearUnitInfoRow();
        // Reload batches and catalog numbers for the new chapter
        this.loadBatches();
        this.loadCatalogs();
      });
  }

  onLotNumberSelected(): void {
    this.tryAutoCheckIn(true);
  }

  onMinTempTab(): void {
    this.tryAutoCheckIn(true);
  }

  // Called by app-scan-select-field (valueChanged) for catalog
  onCatalogValueChanged(opt: ScanSelectOption | null): void {
    this.bagEntryForm.get('catalogNumber')?.setValue(opt?.code ?? null, { emitEvent: false });
    this.onCatalogSelected(opt?.code ?? '');
  }

  // Called by app-scan-select-field (valueChanged) for lot
  onLotValueChanged(opt: ScanSelectOption | null): void {
    this.bagEntryForm.get('lotNumber')?.setValue(opt?.code ?? null, { emitEvent: false });
    if (opt) this.tryAutoCheckIn(true);
  }

  onCatalogSelected(catalogNumber: string): void {
    if (!catalogNumber) return;
    this.lotOptions.set([]);
    this.filteredLotOptions.set([]);
    this.bagEntryForm.get('lotNumber')?.setValue(null, { emitEvent: false });
    this.lotField?.clear();

    this.bagCheckInService.getLotNumbers(catalogNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lots: BagLot[]) => {
          const mapped = lots.map(l => ({ lotNumber: l.lotNumber, displayLabel: l.lotNumber }));
          this.lotOptions.set(mapped);
          this.filteredLotOptions.set(mapped);

          // Auto-populate lot from concatenated catalog+lot barcode scan
          if (this._pendingLotScan) {
            const found = mapped.find(l => l.lotNumber.toLowerCase() === this._pendingLotScan!.toLowerCase());
            if (found) {
              this.lotField?.setValue(found.lotNumber, found.lotNumber);
              this.bagEntryForm.get('lotNumber')?.setValue(found.lotNumber, { emitEvent: false });
            }
            this._pendingLotScan = null;
          }

          const lotCtrl = this.bagEntryForm.get('lotNumber');
          if (this.unitCodeScheme() === 'I') {
            lotCtrl?.addValidators(Validators.required);
            lotCtrl?.updateValueAndValidity({ emitEvent: false });
          }
          this.tryAutoCheckIn();
        },
        error: () => {
          this.lotOptions.set([]);
          this.filteredLotOptions.set([]);
          this._pendingLotScan = null;
          this.tryAutoCheckIn();
        }
      });
  }

  async onUnitPostValidate(event: UnitIdPostValidateEvent): Promise<void> {
    const parsedUnitId = event.data.parsedUnitId;
    this.unitCodeScheme.set(event.data.codeScheme ?? null);

    this.bagCheckInService.validateUnit(parsedUnitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (res) => {
          if (res.alreadyCheckedIn) {
            event.reject('This unit has already been checked in.');
            return;
          }

          this.bagDriveId.set(res.driveId ?? '');
          this.bagName.set(res.name ?? '');
          this.bagCue.set(res.cue ?? '');

          // Error 8011 — CUE warning: old app pop_error (user must press Y to continue, N to abort)
          // Matches old MCIBAGS: pop_error('8011') before allowing check-in
          if (res.warningCode && this.WARNING_CUES.has(res.warningCode)) {
            const confirmed = await firstValueFrom(
              this.dialog.open(ConfirmActionDialogComponent, {
                width: '400px',
                disableClose: true,
                data: {
                  title: 'Alert',
                  message: 'Remove this bag from further component production.',
                  confirmText: 'Yes',
                  cancelText: 'No'
                }
              }).afterClosed()
            );
            if (!confirmed) {
              this.resetUnitInfoSignals();
              event.reject('');
              return;
            }
          }

          // Errors 9211 / 9001 — Y/N confirmation (old app: show_error opens ERROR form, user types Y=proceed N=block)
          if (res.bleedWarningCode) {
            const bleedConfirmed = await firstValueFrom(
              this.dialog.open(ConfirmActionDialogComponent, {
                width: '400px',
                disableClose: true,
                data: {
                  title: 'Bleed Time Warning',
                  message: res.bleedWarningMessage ?? 'Bleed time greater than limits - confirm entry.',
                  confirmText: 'Yes',
                  cancelText: 'No'
                }
              }).afterClosed()
            );
            if (!bleedConfirmed) {
              this.resetUnitInfoSignals();
              event.reject('');
              return;
            }
          }

          event.confirm();
        },
        error: (err) => {
          // 9211 / 9001 / 0170 return 400 from BE — HARD BLOCK (matches old show_error in MCIBAGS)
          this.resetUnitInfoSignals();
          const raw = err?.error?.message || err?.error?.error || 'Unit not valid for check-in.';
          event.reject(this.stripErrorCode(raw));
        }
      });
  }

  onUnitValidated(_data: UnitValidationResponse): void {
    // Wait for catalog / lot before auto-submitting
  }

  // Fires on any click in the tab content area.
  // Skip only when clicking directly ON a form control — everything else triggers check-in.
  onTabContentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('mat-form-field, app-unit-id-field, button, mat-option, .mat-mdc-select, ngx-mat-select-search')) return;
    this.tryAutoCheckIn(true);
  }

  onUnitCleared(): void {
    this.resetUnitInfoSignals();
    this.unitCodeScheme.set(null);
    this.catalogField?.clear();
    this.bagEntryForm.get('catalogNumber')?.setValue(null, { emitEvent: false });
    this.lotField?.clear();
    this.lotOptions.set([]);
    this._pendingLotScan = null;
    const lotCtrlOnClear = this.bagEntryForm.get('lotNumber');
    lotCtrlOnClear?.removeValidators(Validators.required);
    lotCtrlOnClear?.setErrors(null);
    lotCtrlOnClear?.updateValueAndValidity({ emitEvent: false });
    this.bagEntryForm.get('lotNumber')?.setValue(null, { emitEvent: false });
    this._lastCheckedInUnitId = '';
    this._autoCheckInInProgress = false;
  }

  private tryAutoCheckIn(showErrors = false): void {
    if (this._autoCheckInInProgress || this.isCheckingIn()) return;
    const parsedUnitId = this.unitIdField?.parsedUnitId ?? '';
    if (!parsedUnitId || !this.unitIdField?.isValid) return;
    if (parsedUnitId === this._lastCheckedInUnitId) return;
    if (this.hasCatalogIssue()) return;

    const catalogCtrl = this.bagEntryForm.get('catalogNumber');
    if (!catalogCtrl?.value?.trim()) {
      if (showErrors) catalogCtrl?.markAsTouched();
      return;
    }

    if (this.unitCodeScheme() === 'I' && !this.bagEntryForm.get('lotNumber')?.value) {
      if (showErrors) this.bagEntryForm.get('lotNumber')?.markAsTouched();
      return;
    }

    // For new batch, require min temp before check-in
    if (this.isNewBatch()) {
      const minVal = this.bagFilterForm.get('minTemp')?.value;
      if (minVal === null || minVal === undefined || minVal === '') {
        this.bagFilterForm.get('minTemp')?.markAsTouched();
        this.showError('Min temperature is required before checking in a new batch.');
        return;
      }
      if (this.bagFilterForm.get('minTemp')?.hasError('minExceedsMax')) {
        this.showError('Min temperature cannot exceed max temperature.');
        return;
      }
    }

    this._autoCheckInInProgress = true;
    this.isCheckingIn.set(true);
    this.onBagCheckIn();
  }

  private clearUnitInfoRow(): void {
    this.unitIdField?.clear();
  }

  private resetUnitInfoSignals(): void {
    this.bagDriveId.set('');
    this.bagName.set('');
    this.bagCue.set('');
    this.bagCatalogNumber.set('');
  }

  // ─────────────────────────────── Bag Check-In actions ────────────────────

  onBatchSelected(batchId: string): void {
    const minTempCtrl = this.bagFilterForm.get('minTemp');
    const maxTempCtrl = this.bagFilterForm.get('maxTemp');

    if (!batchId) {
      // New batch: enable and reset temps to defaults
      this.isNewBatch.set(true);
      minTempCtrl?.setValue(null, { emitEvent: false });
      maxTempCtrl?.setValue(37.5, { emitEvent: false });
      minTempCtrl?.enable();
      maxTempCtrl?.enable();
      return;
    }

    // Existing batch: disable temp controls, load from batch detail
    this.isNewBatch.set(false);
    this.bagCheckInService.getBatchDetail(batchId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (batch) => {
          if (batch) {
            minTempCtrl?.setValue(batch.minTemp, { emitEvent: false });
            maxTempCtrl?.setValue(batch.maxTemp, { emitEvent: false });
          }
          minTempCtrl?.disable();
          maxTempCtrl?.disable();
        },
        error: () => {
          minTempCtrl?.disable();
          maxTempCtrl?.disable();
          this.showError('Failed to load batch details.');
        }
      });
  }

  onBagRetrieve(): void {
    const batchId = this.bagFilterForm.get('batchId')?.value;
    if (!batchId) {
      this.showError('Please select a Batch ID before retrieving.');
      return;
    }
    this.isLoading.set(true);
    const bagSortColumn = this.bagSortConfig.direction !== 'default' ? this.bagSortConfig.column : undefined;
    const bagSortOrder = this.bagSortConfig.direction === 'A' ? 'ASC' : this.bagSortConfig.direction === 'D' ? 'DESC' : undefined;
    this.bagCheckInService.getBatchUnits(batchId, bagSortColumn, bagSortOrder)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (units: BagUnit[]) => {
          this.isLoading.set(false);
          const entries = units.map(u => this.mapUnitToEntry(u));
          this._allBagEntries = entries;
          this.bagTotalRecords = entries.length;
          this.bagPageIndex = 0;
          this.entriesCount.set(entries.length);
          this.applyBagPage();
          this.updateBagPagination();
          if (this._showEntriesSnackbarOnRetrieve) {
            this._showEntriesSnackbarOnRetrieve = false;
            this.showEntriesCount(entries.length);
          }
        },
        error: () => {
          this.isLoading.set(false);
          this.showError('Failed to retrieve batch units.');
        }
      });
  }

  onCheckUnitsInBatch(): void {
    const batchId = this.bagFilterForm.get('batchId')?.value;
    if (!batchId) return;

    this.panelBatchId.set(batchId);
    // Display formatted temps from current form values
    const minVal = this.bagFilterForm.get('minTemp')?.value;
    const maxVal = this.bagFilterForm.get('maxTemp')?.value;
    this.panelMinTemp.set(this.formatTemp(minVal));
    this.panelMaxTemp.set(this.formatTemp(maxVal));

    this.panelUnits.set([]);
    this.isPanelLoading.set(true);
    this.showCheckUnitsPanel.set(true);

    this.bagCheckInService.getBatchUnits(batchId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (units) => {
          this.panelUnits.set(units);
          this.isPanelLoading.set(false);
        },
        error: () => {
          this.isPanelLoading.set(false);
          this.showError('Failed to load batch units.');
        }
      });
  }

  onCheckUnitsPanelClose(): void {
    this.showCheckUnitsPanel.set(false);
  }

  onCheckUnitsPanelButton(action: string): void {
    if (action === 'close') this.showCheckUnitsPanel.set(false);
  }

  formatCollDate(date?: string): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  }

  formatTemp(value: number | null | undefined): string {
    if (value == null) return '—';
    return `${Number(value).toFixed(2)} °C`;
  }

  onBagCheckIn(): void {
    this._autoCheckInInProgress = false;
    this.isCheckingIn.set(true);

    const parsedUnitId = this.unitIdField?.parsedUnitId ?? '';
    if (!parsedUnitId || !this.unitIdField?.isValid) {
      this.isCheckingIn.set(false); return;
    }

    if (this.hasCatalogIssue()) {
      this.isCheckingIn.set(false);
      this.showError('Please enter a valid catalog number before checking in.');
      return;
    }

    if (this.unitCodeScheme() === 'I' && !this.bagEntryForm.get('lotNumber')?.value) {
      this.isCheckingIn.set(false);
      this.bagEntryForm.get('lotNumber')?.markAsTouched();
      return;
    }

    // Validate min/max temp for new batch
    if (this.isNewBatch()) {
      const minVal = this.bagFilterForm.get('minTemp')?.value;
      if (minVal === null || minVal === undefined || minVal === '') {
        this.isCheckingIn.set(false);
        this.bagFilterForm.get('minTemp')?.markAsTouched();
        this.showError('Min temperature is required for a new batch.');
        return;
      }
      if (this.bagFilterForm.get('minTemp')?.hasError('minExceedsMax')) {
        this.isCheckingIn.set(false);
        this.showError('Min temperature cannot exceed max temperature.');
        return;
      }
    }

    if (this.bagEntryForm.invalid) {
      this.isCheckingIn.set(false);
      this.bagEntryForm.markAllAsTouched();
      return;
    }

    const formVal = this.bagEntryForm.value;
    const batchId = this.bagFilterForm.get('batchId')?.value ?? undefined;
    const minTemp = parseFloat(this.bagFilterForm.get('minTemp')?.value ?? '0') || 0;
    const maxTemp = parseFloat(this.bagFilterForm.get('maxTemp')?.value ?? '0') || 0;
    this.bagCheckInService.checkIn({
      batchId,
      unitId: parsedUnitId,
      catalogNumber: formVal.catalogNumber ?? '',
      lotNumber: formVal.lotNumber ?? '',
      minTemp,
      maxTemp,
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this._lastCheckedInUnitId = parsedUnitId;
          this._autoCheckInInProgress = false;
          this._showEntriesSnackbarOnRetrieve = true;
          this.isCheckingIn.set(false);

          // Show expired lot warning (informational — check-in already completed)
          if (res.expiredLotWarning && res.expiredLotMessage) {
            this.dialog.open(ConfirmActionDialogComponent, {
              width: '420px',
              disableClose: false,
              data: {
                title: 'Expired Lot Warning',
                message: res.expiredLotMessage,
                confirmText: 'OK',
                cancelText: ''
              }
            });
          }

          // Auto-update batch ID if new batch was generated
          if (!batchId && res.batchId) {
            const current = this.batchOptions();
            if (!current.some(b => b.batchId === res.batchId)) {
              const updated = [{ batchId: res.batchId, displayLabel: res.batchId }, ...current];
              this.batchOptions.set(updated);
              this.filteredBatchOptions.set(updated);
            }
            this.bagFilterForm.get('batchId')?.setValue(res.batchId);
            this.onBatchSelected(res.batchId);
          }

          // Reset entry row and refresh table
          this.bagEntryForm.reset();
          this.clearUnitInfoRow();
          this.onBagRetrieve();
        },
        error: (err) => {
          this._autoCheckInInProgress = false;
          this.isCheckingIn.set(false);
          const msg = err?.error?.message || err?.error?.error || 'Failed to check in unit.';
          this.showError(msg);
        }
      });
  }

  private mapUnitToEntry(u: BagUnit): BagCheckInEntry {
    return {
      unitId: u.unitId,
      catalogNumber: u.catalogNumber ?? '',
      driveId: u.driveId ?? '',
      name: u.name ?? '',
      lotNumber: u.lotNumber ?? '-',
      cue: u.donorDecisionCode ?? u.cue ?? '-',
      protocol: u.protocol ?? '',
    };
  }

  // ─────────────────────────────── Tube Check-In actions ───────────────────

  private loadTubeFormats(): void {
    this.bagCheckInService.getTubeFormats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (formats: TubeFormat[]) => {
          const opts = formats.map(f => ({
            formatCode:          f.formatCode,
            description:         f.description,
            tubes:               this.buildTubeDefinitionsFromFields(f.fields ?? []),
            requiredControlName: this.resolveRequiredControlName(f.formatCode, f.requiredControlName),
          }));
          this.tubeFormatOptions.set(opts);
          this.filteredTubeFormatOptions.set(opts);
          if (opts.length > 0) {
            this.tubeFilterForm.get('tubeFormat')?.setValue(opts[0].formatCode);
            this.applyTubeFormat(opts[0]);
          }
        },
        error: () => this.showError('Failed to load tube check-in formats.')
      });
  }

  /** Falls back to format-code inference when the API doesn't yet return requiredControlName. */
  private resolveRequiredControlName(formatCode: string, apiValue?: string | null): string | null {
    if (apiValue != null) return apiValue;
    const code = (formatCode ?? '').toUpperCase();
    if (code === 'R*') return 'red1';
    if (code === 'P*') return 'purple1';
    return null;
  }

  private buildTubeDefinitionsFromFields(fields: Array<{ controlName: string; label: string }>): TubeDefinition[] {
    return fields.map(f => ({
      controlName: f.controlName,
      label:       f.label,
    }));
  }

  onTubeFormatChange(formatCode: string): void {
    const found = this.tubeFormatOptions().find(f => f.formatCode === formatCode);
    if (found) this.applyTubeFormat(found);
  }

  /**
   * Called by each app-unit-id-field (postValidate) after donor-lib format check passes.
   * Runs two chained checks before confirming the field as valid:
   *   1. Error 0111 — all tube IDs on the row must be the same unit
   *   2. tube-checkin/validate-unit — checks if this tube type is already checked in (0150/0160)
   */
  onTubePostValidate(event: UnitIdPostValidateEvent, controlName: string): void {
    const newId = event.data.parsedUnitId!;

    // 0111: cross-field match — all already-validated tubes must share the same unit ID
    const existingIds = Object.values(this.tubeValues()).filter(v => !!v);
    const uniqueIds = new Set([...existingIds, newId].map(id => id.toUpperCase()));
    if (uniqueIds.size > 1) {
      this._tubeAutoSubmitPending = false;
      event.reject('All tube IDs on a single row must be the same unit ID.');
      return;
    }

    // 0150/0160: check if this specific tube type has already been checked in
    this._tubeValidatingCount++;
    this.bagCheckInService.validateTubeUnit(newId, controlName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: TubeValidateUnitResponse) => {
          this._tubeValidatingCount = Math.max(0, this._tubeValidatingCount - 1);
          if (result.errorCode) {
            this._tubeAutoSubmitPending = false;
            event.reject(this.stripErrorCode(result.errorMessage)
              || 'Tube already checked in for this unit.');
          } else {
            event.confirm();
          }
        },
        error: (err) => {
          this._tubeValidatingCount = Math.max(0, this._tubeValidatingCount - 1);
          this._tubeAutoSubmitPending = false;
          const body = err?.error;
          const msg = this.stripErrorCode(body?.message || body?.error) || 'Failed to validate tube unit.';
          event.reject(msg);
        }
      });
  }

  onTubeValidated(data: UnitValidationResponse, controlName: string): void {
    this.tubeValues.update(s => ({ ...s, [controlName]: data.parsedUnitId! }));
    this.tubeSubmitAttempted.set(false);
    // Auto-submit only when ALL fields have finished their full validation pipeline:
    //   - _tubeValidatingCount === 0: no validateTubeUnit calls in flight
    //   - !anyFieldValidating(): no field stuck in validateUnitId (the first async call)
    if (this._tubeAutoSubmitPending && !this.isSubmittingTube()
        && this._tubeValidatingCount === 0 && !this.anyFieldValidating()) {
      this._tubeAutoSubmitPending = false;
      this.onTubeSubmit();
    }
  }

  onTubeCleared(controlName: string): void {
    this.tubeValues.update(s => { const n = { ...s }; delete n[controlName]; return n; });
    this._tubeAutoSubmitPending = false;
  }

  private applyTubeFormat(format: TubeFormatOption): void {
    this.selectedTubeFormat.set(format);
    this.tubeFormatDescription.set(format.description);
    this.activeTubeFields.set(format.tubes);
    this.tubeRequiredControlName.set(format.requiredControlName ?? null);
    this.tubeValues.set({});
    this.tubeSubmitAttempted.set(false);
    this.tubeRetrieved.set(false);
    this._tubeAutoSubmitPending = false;
    this._tubeValidatingCount = 0;
  }

  onTubeRetrieve(): void {
    const format = this.tubeFilterForm.get('tubeFormat')?.value;
    if (!format) {
      this.showError('Please select a Tube Check-In Format.');
      return;
    }
    this.isLoading.set(true);
    const tubeSortColumn = this.tubeSortConfig.direction !== 'default' ? this.tubeSortConfig.column : undefined;
    const tubeSortOrder = this.tubeSortConfig.direction === 'A' ? 'ASC' : this.tubeSortConfig.direction === 'D' ? 'DESC' : undefined;
    setTimeout(() => {
      this.isLoading.set(false);
      this.bagCheckInService.getTubeEntries(tubeSortColumn, tubeSortOrder)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (entries: TubeCheckInEntryModel[]) => {
            this._allTubeEntries = entries.map((e, i) => ({
              sequence:   i + 1,
              redTop1:    e.redTop1    || '',
              redTop2:    e.redTop2    || '',
              purpleTop1: e.purpleTop1 || '',
              purpleTop2: e.purpleTop2 || '',
            }));
            this._tubeSequence = this._allTubeEntries.length;
            this.tubeTotalRecords = this._allTubeEntries.length;
            this.tubeEntryCount.set(this._allTubeEntries.length);
            this.tubePageIndex = 0;
            this.applyTubePage();
            this.tubeRetrieved.set(true);
            this.tubeValues.set({});
          },
          error: () => {
            this.showError('Failed to retrieve tube check-in entries.');
          }
        });
    }, 300);
  }

  onTubeSubmit(): void {
    const format = this.selectedTubeFormat();
    if (!format) {
      this.showError('Please select a Tube Check-In Format.');
      return;
    }

    if (!this.hasAnyTubeValue()) {
      this.tubeSubmitAttempted.set(true);
      return;
    }

    const vals = this.tubeValues();
    const request: TubeCheckInSubmitRequest = {
      formatCode: format.formatCode,
      unitId:   vals['red1']    || undefined,
      unitId1:  vals['red2']    || undefined,
      sunitId:  vals['purple1'] || undefined,
      sunitId2: vals['purple2'] || undefined,
    };

    this.isSubmittingTube.set(true);
    this.bagCheckInService.submitTubeCheckIn(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSubmittingTube.set(false);
          this.snackbarService.showSuccess('Tube checked in successfully.');
          this._tubeSequence++;
          this.tubeEntryCount.set(this._tubeSequence);
          const entry: TubeCheckInEntry = {
            sequence:    this._tubeSequence,
            redTop1:     vals['red1']    || '',
            redTop2:     vals['red2']    || '',
            purpleTop1:  vals['purple1'] || '',
            purpleTop2:  vals['purple2'] || '',
          };
          this._allTubeEntries.push(entry);
          this.tubeTotalRecords = this._allTubeEntries.length;
          this.tubePageIndex = Math.max(0, Math.ceil(this.tubeTotalRecords / this.tubePageSize) - 1);
          this.tubeRetrieved.set(true);
          this.applyTubePage();
          this.tubeValues.set({});
          this.tubeSubmitAttempted.set(false);
          this.clearTubeInputFields();
        },
        error: (err) => {
          this.isSubmittingTube.set(false);
          const msg = err?.error?.message || err?.error?.error || 'Tube check-in failed.';
          this.showError(msg);
        }
      });
  }

  private applyTubePage(): void {
    const sorted = this.sortRecords(this._allTubeEntries, this.tubeSortConfig.column, this.tubeSortConfig.direction);
    const start = this.tubePageIndex * this.tubePageSize;
    this.tubeTableData.set(sorted.slice(start, start + this.tubePageSize));
    this.updateTubeTableConfig();
  }

  private updateTubeTableConfig(): void {
    this.tubeTableConfig.update(cfg => ({
      ...cfg!,
      columns: this.buildTubeColumns(),
      pagination: {
        ...cfg!.pagination!,
        pageIndex: this.tubePageIndex,
        totalRecords: this.tubeTotalRecords,
      },
    }));
  }

  // ─────────────────────────────── Table config builders ────────────────────

  private buildBagTableConfig(): void {
    this.bagTableConfig = {
      columns: [
        { key: 'unitId', header: 'Unit ID', sortable: true, minWidth: '180px' },
        { key: 'catalogNumber', header: 'Catalog Number', sortable: false, minWidth: '140px' },
        { key: 'driveId', header: 'Drive ID', sortable: false, minWidth: '100px' },
        { key: 'name', header: 'Name', sortable: false, minWidth: '200px', truncate: true, truncateLength: 40 },
        { key: 'lotNumber', header: 'Lot Number', sortable: false, minWidth: '130px' },
        { key: 'cue', header: 'CUE', sortable: false, minWidth: '100px' },
        { key: 'protocol', header: 'Protocol', sortable: false, minWidth: '100px' },
      ],
      sortConfig: { column: '', direction: 'default' },
      sortIconMap: { default: 'unfold_more', ascending: 'arrow_upward', descending: 'arrow_downward' },
      pagination: {
        pageSize: this.bagPageSize,
        pageIndex: this.bagPageIndex,
        totalRecords: this.bagTotalRecords,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true,
      },
      stickyHeader: true,
      emptyMessage: 'No bag check-in entries found.',
      emptySubMessage: 'Use the filter panel above to retrieve or add entries.',
      noDataIcon: 'inventory_2',
      enableRowHighlight: true,
    };
  }

  // Stable object references so *ngFor reuses existing matColumnDef views (no destroy/recreate).
  // We mutate .header in place and return a new array so Angular CD picks up the change.
  private readonly _tubeColumnDefs = [
    { key: 'sequence',   header: 'Sequence',         sortable: true,  minWidth: '110px' },
    { key: 'redTop1',    header: 'Red Top 1 (0)',    sortable: false, minWidth: '180px' },
    { key: 'redTop2',    header: 'Red Top 2 (0)',    sortable: false, minWidth: '180px' },
    { key: 'purpleTop1', header: 'Purple Top 1 (0)', sortable: false, minWidth: '180px' },
    { key: 'purpleTop2', header: 'Purple Top 2 (0)', sortable: false, minWidth: '180px' },
  ];

  private buildTubeColumns() {
    const n = this.tubeEntryCount();
    this._tubeColumnDefs[1].header = `Red Top 1 (${n})`;
    this._tubeColumnDefs[2].header = `Red Top 2 (${n})`;
    this._tubeColumnDefs[3].header = `Purple Top 1 (${n})`;
    this._tubeColumnDefs[4].header = `Purple Top 2 (${n})`;
    return [...this._tubeColumnDefs];
  }

  private buildTubeTableConfig(): void {
    this.tubeTableConfig.set({
      columns: this.buildTubeColumns(),
      sortConfig: { column: '', direction: 'default' },
      sortIconMap: { default: 'unfold_more', ascending: 'arrow_upward', descending: 'arrow_downward' },
      pagination: {
        pageSize: this.tubePageSize,
        pageIndex: this.tubePageIndex,
        totalRecords: this.tubeTotalRecords,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true,
      },
      stickyHeader: true,
      emptyMessage: 'No Results to Display',
      noDataIcon: 'search',
      enableRowHighlight: true,
    });
  }

  private updateBagPagination(): void {
    this.bagTableConfig = {
      ...this.bagTableConfig,
      pagination: {
        ...this.bagTableConfig.pagination!,
        totalRecords: this.bagTotalRecords,
        pageIndex: this.bagPageIndex,
        pageSize: this.bagPageSize,
      },
    };
  }

  // ─────────────────────────────── Tab switching ────────────────────────────

  onTabChange(index: number): void {
    const wasOnTubeTab = this.activeTabIndex() === 1;
    this.activeTabIndex.set(index);
    const slug = this.tabs[index]?.id ?? 'bag';
    const target = slug === 'bag' ? this.basePath : `${this.basePath}/${slug}`;
    this.router.navigate([target]);
    const pageData = this.pageHeaderService.pageHeaderData();
    this.headerConfig = {
      ...this.headerConfig,
      subtitle: pageData?.subtitle || '',
    };
    if (wasOnTubeTab && index !== 1 && this.tubeRetrieved() && this.hasAnyTubeValue() && !this.isSubmittingTube()) {
      if (this._tubeValidatingCount > 0 || this.anyFieldValidating()) {
        this._tubeAutoSubmitPending = true;
      } else {
        this.onTubeSubmit();
      }
    }
  }

  onTubeTabContentClick(event: MouseEvent): void {
    if (!this.tubeRetrieved() || !this.hasAnyTubeValue() || this.isSubmittingTube()) return;
    const target = event.target as HTMLElement;
    if (target.closest('.filter-panel--tube-inputs')) return;
    if (this._tubeValidatingCount > 0 || this.anyFieldValidating()) {
      // Fields still in the validation pipeline — defer submit until all resolve.
      this._tubeAutoSubmitPending = true;
      return;
    }
    this.onTubeSubmit();
  }

  onTubeEnterSubmit(): void {
    if (this.isSubmittingTube()) return;
    if (this._tubeValidatingCount > 0) {
      this._tubeAutoSubmitPending = true;
      return;
    }
    if (this.hasAnyTubeValue()) {
      this._tubeAutoSubmitPending = false;
      this.onTubeSubmit();
    } else {
      this._tubeAutoSubmitPending = true;
    }
  }

  // Called on keydown.enter and keydown.tab on tube input fields (via template).
  // isLast=true means the event originated from the final field in the active format.
  onTubeFieldKeyAction(isLast: boolean): void {
    if (!isLast || this.isSubmittingTube()) return;
    // Set pending immediately — onTubeValidated will pick this up when all validations finish.
    this._tubeAutoSubmitPending = true;
    // setTimeout(0) is required (not Promise.resolve / microtask) so that the Tab key's
    // default action (move focus → blur → start validateUnitId) executes BEFORE we check
    // validationState. With a microtask the blur hasn't fired yet and we'd submit early.
    setTimeout(() => {
      if (!this._tubeAutoSubmitPending || this.isSubmittingTube()) return;
      // If any field is still in its validation pipeline (validateUnitId OR validateTubeUnit),
      // onTubeValidated will fire the submit once the last one completes.
      if (this.anyFieldValidating() || this._tubeValidatingCount > 0) return;
      if (this.hasAnyTubeValue()) {
        this._tubeAutoSubmitPending = false;
        this.onTubeSubmit();
      }
      // No value yet at all — keep pending; onTubeValidated will submit when the first value arrives.
    }, 0);
  }

  private anyFieldValidating(): boolean {
    return this.tubeFields?.some(f => f.validationState === 'validating') ?? false;
  }

  private clearTubeInputFields(): void {
    this.tubeFields?.forEach(f => f.clear());
  }

  // ─────────────────────────────── Table events ─────────────────────────────

  private applyBagPage(): void {
    const sorted = this.sortRecords(this._allBagEntries, this.bagSortConfig.column, this.bagSortConfig.direction);
    const start = this.bagPageIndex * this.bagPageSize;
    this.bagTableData.set(sorted.slice(start, start + this.bagPageSize));
    this.updateBagPagination();
  }

  private sortRecords<T>(arr: T[], column: string, direction: 'A' | 'D' | 'default'): T[] {
    if (direction === 'default' || !column) return [...arr];
    return [...arr].sort((a, b) => {
      const aVal = String((a as Record<string, unknown>)[column] ?? '');
      const bVal = String((b as Record<string, unknown>)[column] ?? '');
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' });
      return direction === 'A' ? cmp : -cmp;
    });
  }

  onBagPageChange(event: TablePageEvent): void {
    this.bagPageIndex = event.pageIndex;
    this.bagPageSize = event.pageSize;
    this.applyBagPage();
  }

  onBagSortChange(event: TableSortEvent): void {
    this.bagSortConfig = { column: event.column, direction: event.direction as 'A' | 'D' | 'default' };
    this.bagTableConfig = { ...this.bagTableConfig, sortConfig: { column: event.column, direction: event.direction } };
    this.bagPageIndex = 0;
    this.applyBagPage();
  }

  onTubePageChange(event: TablePageEvent): void {
    this.tubePageIndex = event.pageIndex;
    this.tubePageSize = event.pageSize;
    this.applyTubePage();
  }

  onTubeSortChange(event: TableSortEvent): void {
    this.tubeSortConfig = { column: event.column, direction: event.direction as 'A' | 'D' | 'default' };
    this.tubeTableConfig.update(cfg => ({ ...cfg!, sortConfig: { column: event.column, direction: event.direction } }));
    this.tubePageIndex = 0;
    this.applyTubePage();
  }

  // ─────────────────────────────── Protocol helpers ─────────────────────────

  getProtocolColor(protocol: string): ProtocolColor { return getProtocolColor(protocol); }

  isWarningCue(cue: string): boolean {
    const c = (cue || '').toLowerCase();
    return c === 'ambiguous' || c === 'nft' || c === 'no cue' || c === 'therapeutic';
  }

  onCueWarningClick(): void {
    this.dialog.open(ConfirmActionDialogComponent, {
      width: '400px',
      disableClose: false,
      data: {
        title: 'Alert',
        message: 'Remove this bag from further component production.',
        confirmText: 'OK'
      }
    });
  }

  onProtocolBadgeSpaceKey(event: Event, cue: string): void {
    if (this.isWarningCue(cue)) {
      event.preventDefault();
      this.onCueWarningClick();
    }
  }

  // ─────────────────────────────── Form accessors ───────────────────────────

  get bagFilterF() { return this.bagFilterForm.controls; }
  get bagF() { return this.bagEntryForm.controls; }

  // ─────────────────────────────── Snackbar helpers ─────────────────────────

  private showError(message: string): void {
    this.snackbarService.showError(message);
  }

  private showEntriesCount(count: number): void {
    this.snackbarService.showSuccess(`Entries Added: ${count}`);
  }

  private stripErrorCode(msg: string | undefined | null): string {
    if (!msg) return '';
    return msg.replace(/\s*\((?:Error|error)\s*\d+\)\.?/g, '').trim();
  }
}
