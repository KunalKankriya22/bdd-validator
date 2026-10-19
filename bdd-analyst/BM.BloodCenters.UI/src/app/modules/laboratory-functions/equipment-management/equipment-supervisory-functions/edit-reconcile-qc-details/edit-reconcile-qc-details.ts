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
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  AbstractControl,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelect } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { dateFormatValidator } from '@core/utils/date-adapter.util';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';

import {
  EditReconcileQcDetailsService,
  EquipmentTypeLookupDto,
  EquipmentLookupDto,
  QcEventDto,
  QcHeaderDto,
  QcDetailDto,
  QcTypeLookupDto,
  QcResultLookupDto,
  UserLookupDto,
  BarcodeParseResponseDto,
} from './edit-reconcile-qc-details.service';

// ── UI row model ──────────────────────────────────────────────────────────────

export interface QcProcedureRow {
  qcId: string;
  arrangeBy: number;
  qcProcedure: string;
  target: string;
  data: string;
  validRange: string;
  minValue: string;
  maxValue: string;
  value: string;
  tech1: string;
  tech2: string;
  resultInterpretation: string;
}

// ── Validators ────────────────────────────────────────────────────────────────

function timeFormatValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const value = control.value.toString().trim();
  return /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(value) ? null : { invalidTimeFormat: true };
}

function sameTechValidator(group: AbstractControl): ValidationErrors | null {
  const tech1 = group.get('qcTech1')?.value as string | null;
  const tech2 = group.get('qcTech2')?.value as string | null;
  if (tech1 && tech2 && tech1.toLowerCase() === tech2.toLowerCase()) {
    return { sameTech: true };
  }
  return null;
}

function tech2Result2Validator(group: AbstractControl): ValidationErrors | null {
  const tech2 = group.get('qcTech2')?.value as string | null;
  const result2 = group.get('result2')?.value as string | null;
  if (tech2 && !result2) return { result2Required: true };
  return null;
}

@Component({
  selector: 'app-edit-reconcile-qc-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule,
    DataTable,
    PageHeaderWithBreadcrumb,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './edit-reconcile-qc-details.html',
  styleUrls: ['./edit-reconcile-qc-details.scss'],
})
export class EditReconcileQcDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly service = inject(EditReconcileQcDetailsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);

  private navigatedFrom: string | null = null;
  private initialLovsLoaded = false;
  private readonly initialLovsLoaded$ = new Subject<void>();

  @ViewChild('equipTypeSelect') equipTypeSelect?: MatSelect;
  @ViewChild('equipIdSelect') equipIdSelect?: MatSelect;
  @ViewChild('equipRefSelect') equipRefSelect?: MatSelect;
  @ViewChild('qcRefSelect') qcRefSelect?: MatSelect;
  @ViewChild('result1Select') result1Select?: MatSelect;
  @ViewChild('result2Select') result2Select?: MatSelect;
  @ViewChild('valueCellTpl') valueCellTemplate!: TemplateRef<unknown>;

  // ── Table config ──────────────────────────────────────────────────────────────

  tableConfig: DataTableConfig<QcProcedureRow> = {
    columns: [
      { key: 'qcProcedure', header: 'QC Procedure', width: '110px', minWidth: '90px' },
      { key: 'target', header: 'Target', width: '130px', minWidth: '110px' },
      { key: 'data', header: 'Data', width: '130px', minWidth: '110px' },
      { key: 'validRange', header: 'Valid Range', width: '160px', minWidth: '140px' },
      { key: 'value', header: 'Value', width: '160px', minWidth: '140px' },
      { key: 'tech1', header: 'Tech 1', width: '130px', minWidth: '110px' },
      { key: 'tech2', header: 'Tech 2', width: '130px', minWidth: '110px' },
      { key: 'resultInterpretation', header: 'Result Interpretation', width: '110px', minWidth: '90px' },
    ],
    stickyHeader: true,
    showPagination: false,
    emptyMessage: 'No QC procedures found.',
    showTableOnEmpty: true,
  };

  // ── Page header ────────────────────────────────────────────────────────────────

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
  };

  // ── State ──────────────────────────────────────────────────────────────────────

  isLoading = false;
  isSaving = false;
  hasRetrieved = false;

  currentQcReference = '';
  qcHeaderData: QcHeaderDto | null = null;
  qcProcedureRows: QcProcedureRow[] = [];
  currentQcTypeDescription = '';
  maxQcDate: Moment | null = moment();

  // ── Barcode ────────────────────────────────────────────────────────────────────

  barcodeControl = new FormControl<string | null>(null);
  barcodeError = '';
  isScanningBarcode = false;

  // ── Review code (determines dual-review rules) ─────────────────────────────────

  reviewCode = signal<string | null>(null);

  // ── Filter form controls ───────────────────────────────────────────────────────

  equipmentTypeControl = new FormControl<string | null>(null, Validators.required);
  equipmentIdControl = new FormControl<string | null>({ value: null, disabled: true });
  equipmentRefControl = new FormControl<string | null>({ value: null, disabled: true });
  qcRefNoControl = new FormControl<string | null>({ value: null, disabled: true });

  // ── Search controls ────────────────────────────────────────────────────────────

  equipTypeSearchCtrl = new FormControl('');
  equipIdSearchCtrl = new FormControl('');
  equipRefSearchCtrl = new FormControl('');
  qcRefSearchCtrl = new FormControl('');
  result1SearchCtrl = new FormControl('');
  result2SearchCtrl = new FormControl('');

  // ── Loading flags ──────────────────────────────────────────────────────────────

  isLoadingEquipTypes = false;
  isLoadingEquipIds = false;
  isLoadingEquipRefs = false;
  isLoadingQcRefs = false;

  // ── LOV signals ────────────────────────────────────────────────────────────────

  allEquipTypes = signal<EquipmentTypeLookupDto[]>([]);
  allEquipIds = signal<EquipmentLookupDto[]>([]);
  allEquipRefs = signal<EquipmentLookupDto[]>([]);
  allQcRefs = signal<QcEventDto[]>([]);
  allQcTypes = signal<QcTypeLookupDto[]>([]);
  allQcResults = signal<QcResultLookupDto[]>([]);
  allUsers = signal<UserLookupDto[]>([]);

  equipmentTypeDescription = '';

  // Result 2 cannot be 'S' (Scheduled) or 'C' (Cancelled) — API error 1306
  result2Options = computed(() =>
    this.allQcResults().filter(r => r.code !== 'S' && r.code !== 'C')
  );

  filteredEquipTypes = computed(() => {
    const q = (this.equipTypeSearchCtrl.value || '').toLowerCase();
    const items = this.allEquipTypes();
    return q
      ? items.filter(o => o.code?.toLowerCase().includes(q) || o.description?.toLowerCase().includes(q))
      : items;
  });

  filteredEquipIds = computed(() => {
    const q = (this.equipIdSearchCtrl.value || '').toLowerCase();
    const items = this.allEquipIds();
    return q
      ? items.filter(o => o.equipId?.toLowerCase().includes(q) || o.equipReference?.toLowerCase().includes(q))
      : items;
  });

  filteredEquipRefs = computed(() => {
    const q = (this.equipRefSearchCtrl.value || '').toLowerCase();
    const items = this.allEquipRefs();
    return q ? items.filter(o => o.equipReference?.toLowerCase().includes(q)) : items;
  });

  filteredQcRefs = computed(() => {
    const q = (this.qcRefSearchCtrl.value || '').toLowerCase();
    const items = this.allQcRefs();
    return q
      ? items.filter(o =>
          o.qcReference?.toLowerCase().includes(q) ||
          o.qcType?.toLowerCase().includes(q) ||
          this.formatQcDate(o.qcDate ?? '').toLowerCase().includes(q))
      : items;
  });

  filteredResult1Options = computed(() => {
    const q = (this.result1SearchCtrl.value || '').toLowerCase();
    const items = this.allQcResults();
    return q
      ? items.filter(o => o.code?.toLowerCase().includes(q) || o.description?.toLowerCase().includes(q))
      : items;
  });

  filteredResult2Options = computed(() => {
    const q = (this.result2SearchCtrl.value || '').toLowerCase();
    const items = this.result2Options();
    return q
      ? items.filter(o => o.code?.toLowerCase().includes(q) || o.description?.toLowerCase().includes(q))
      : items;
  });

  // ── QC Date/Time controls ──────────────────────────────────────────────────────

  qcDateControl = new FormControl<Moment | null>(null, [
    dateFormatValidator(),
    DateFieldValidationUtility.validDateValidator(),
  ]);
  qcTimeControl = new FormControl<string | null>(null, timeFormatValidator);

  readonly qcDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getQcDateError()
  );

  // ── QC Details form (Card 2 — editable fields) ────────────────────────────────

  qcDetailsForm = new FormGroup(
    {
      qcType: new FormControl<string | null>(null, Validators.required),
      qcTech1: new FormControl<string | null>(null),
      qcTech2: new FormControl<string | null>(null),
      result1: new FormControl<string | null>(null, Validators.required),
      result2: new FormControl<string | null>(null),
    },
    { validators: [sameTechValidator, tech2Result2Validator] }
  );

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        if (!this.navigatedFrom) {
          this.headerConfig = {
            breadcrumbs: [
              { label: 'Home', link: '/home' },
              { label: pageData.title, link: null },
            ],
            title: pageData.title,
            subtitle: pageData.subtitle || '',
          };
        } else {
          this.headerConfig = {
            ...this.headerConfig,
            title: pageData.title,
            subtitle: pageData.subtitle || '',
          };
        }
      }
    });

    effect(() => {
      this.filteredEquipTypes();
      this.filteredEquipIds();
      this.filteredEquipRefs();
      this.filteredQcRefs();
      this.filteredResult1Options();
      this.filteredResult2Options();
      requestAnimationFrame(() => {
        [this.equipTypeSelect, this.equipIdSelect, this.equipRefSelect, this.qcRefSelect,
         this.result1Select, this.result2Select]
          .forEach(s => this.resetSelectActiveItem(s, 1));
      });
    });
  }

  ngOnInit(): void {
    this.setupSearchListeners();
    this.setupResult1Listener();
    this.subscribeToChapterChanges();
    this.loadInitialLovs();
    this.processQueryParams();
  }

  ngAfterViewInit(): void {
    const valueCol = this.tableConfig.columns.find(c => c.key === 'value');
    if (valueCol) {
      valueCol.cellTemplate = this.valueCellTemplate;
      this.tableConfig = { ...this.tableConfig };
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Computed flags ─────────────────────────────────────────────────────────────

  get isClearAllDisabled(): boolean {
    return (
      !this.equipmentTypeControl.value &&
      !this.equipmentIdControl.value &&
      !this.equipmentRefControl.value &&
      !this.qcRefNoControl.value &&
      !this.hasRetrieved
    );
  }

  // ── Initial LOV load ───────────────────────────────────────────────────────────

  private loadInitialLovs(): void {
    this.isLoadingEquipTypes = true;

    forkJoin([
      this.service.getEquipmentTypes(),
      this.service.getQcResults(),
      this.service.getUsers(),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([types, results, users]) => {
          this.allEquipTypes.set(types);
          this.allQcResults.set(results);
          this.allUsers.set(users);
          this.isLoadingEquipTypes = false;
          this.initialLovsLoaded = true;
          this.initialLovsLoaded$.next();
          this.initialLovsLoaded$.complete();
        },
        error: () => {
          this.isLoadingEquipTypes = false;
          this.initialLovsLoaded = true;
          this.initialLovsLoaded$.next();
          this.initialLovsLoaded$.complete();
        },
      });
  }

  // ── Query param navigation ─────────────────────────────────────────────────────

  private processQueryParams(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const equipType = params['equipType'];
        const equipId = params['equipId'];
        const equipRef = params['equipRef'];
        const qcRef = params['qcRef'];
        const from = params['from'];

        if (!equipType || !equipId || !equipRef || !qcRef) return;

        this.navigatedFrom = from || null;
        if (from) {
          this.updateBreadcrumbsForNavigation();
        }

        this.waitForEquipTypesLoaded(() => {
          this.autoCascadeFromParams(equipType, equipId, equipRef, qcRef);
        });
      });
  }

  private waitForEquipTypesLoaded(callback: () => void): void {
    if (this.initialLovsLoaded) {
      callback();
    } else {
      this.initialLovsLoaded$
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => callback());
    }
  }

  private autoCascadeFromParams(
    equipType: string, equipId: string, equipRef: string, qcRef: string
  ): void {
    this.allEquipIds.set([]);
    this.allEquipRefs.set([]);
    this.allQcRefs.set([]);
    this.allQcTypes.set([]);
    this.clearResults();

    this.equipmentTypeControl.setValue(equipType, { emitEvent: false });
    const typeObj = this.allEquipTypes().find(t => t.code === equipType);
    this.equipmentTypeDescription = typeObj?.description ?? '';

    this.isLoadingEquipIds = true;
    forkJoin([
      this.service.getEquipmentIds(equipType),
      this.service.getQcTypes(equipType),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([ids, qcTypes]) => {
          this.allEquipIds.set(ids);
          this.allQcTypes.set(qcTypes);
          this.equipmentIdControl.enable({ emitEvent: false });
          this.equipmentIdControl.setValue(equipId, { emitEvent: false });
          this.isLoadingEquipIds = false;

          this.isLoadingEquipRefs = true;
          this.service.getEquipmentReferences(equipType, equipId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: refs => {
                this.allEquipRefs.set(refs);
                this.equipmentRefControl.enable({ emitEvent: false });
                this.equipmentRefControl.setValue(equipRef, { emitEvent: false });
                this.isLoadingEquipRefs = false;

                this.isLoadingQcRefs = true;
                this.service.getQcEvents(equipRef)
                  .pipe(takeUntil(this.destroy$))
                  .subscribe({
                    next: events => {
                      this.allQcRefs.set(events);
                      this.qcRefNoControl.enable({ emitEvent: false });
                      this.isLoadingQcRefs = false;

                      const matchingEvent = events.find(e => e.qcReference === qcRef);
                      if (matchingEvent) {
                        this.qcRefNoControl.setValue(qcRef, { emitEvent: false });
                        this.onRetrieve(qcRef);
                      } else {
                        this.snackBar.open(
                          `QC Reference "${qcRef}" was not found. Please select manually.`,
                          'Close', { duration: 5000 }
                        );
                      }
                    },
                    error: () => { this.isLoadingQcRefs = false; },
                  });
              },
              error: () => { this.isLoadingEquipRefs = false; },
            });
        },
        error: () => { this.isLoadingEquipIds = false; },
      });
  }

  private updateBreadcrumbsForNavigation(): void {
    this.headerConfig = {
      ...this.headerConfig,
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: 'QC History Query', link: '/laboratory-functions/qc-history-query' },
        { label: this.headerConfig.title || 'Edit or Reconcile QC Details', link: null },
      ],
      showBackButton: true,
      onBackClick: () => this.location.back(),
    };
  }

  // ── Cascading dropdown handlers ────────────────────────────────────────────────

  onEquipmentTypeChange(value: string | null): void {
    this.equipmentIdControl.setValue(null, { emitEvent: false });
    this.equipmentRefControl.setValue(null, { emitEvent: false });
    this.qcRefNoControl.setValue(null, { emitEvent: false });
    this.allEquipIds.set([]);
    this.allEquipRefs.set([]);
    this.allQcRefs.set([]);
    this.allQcTypes.set([]);
    this.clearResults();

    if (!value) {
      this.equipmentTypeDescription = '';
      this.equipmentIdControl.disable({ emitEvent: false });
      this.equipmentRefControl.disable({ emitEvent: false });
      this.qcRefNoControl.disable({ emitEvent: false });
      return;
    }

    const selected = this.allEquipTypes().find(t => t.code === value);
    this.equipmentTypeDescription = selected?.description || '';

    this.isLoadingEquipIds = true;
    forkJoin([
      this.service.getEquipmentIds(value),
      this.service.getQcTypes(value),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([ids, qcTypes]) => {
          this.allEquipIds.set(ids);
          this.allQcTypes.set(qcTypes);
          this.equipmentIdControl.enable({ emitEvent: false });
          this.isLoadingEquipIds = false;
        },
        error: () => { this.isLoadingEquipIds = false; },
      });
  }

  onEquipmentIdChange(value: string | null): void {
    this.equipmentRefControl.setValue(null, { emitEvent: false });
    this.qcRefNoControl.setValue(null, { emitEvent: false });
    this.allEquipRefs.set([]);
    this.allQcRefs.set([]);
    this.clearResults();

    if (!value) {
      this.equipmentRefControl.disable({ emitEvent: false });
      this.qcRefNoControl.disable({ emitEvent: false });
      return;
    }

    const equipType = this.equipmentTypeControl.value!;
    this.isLoadingEquipRefs = true;
    this.service.getEquipmentReferences(equipType, value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: refs => {
          this.allEquipRefs.set(refs);
          this.equipmentRefControl.enable({ emitEvent: false });
          this.isLoadingEquipRefs = false;
          if (refs.length === 1) {
            this.equipmentRefControl.setValue(refs[0].equipReference, { emitEvent: false });
            this.onEquipmentRefChange(refs[0].equipReference);
          }
        },
        error: () => { this.isLoadingEquipRefs = false; },
      });
  }

  onEquipmentRefChange(value: string | null): void {
    this.qcRefNoControl.setValue(null, { emitEvent: false });
    this.allQcRefs.set([]);
    this.clearResults();

    if (!value) {
      this.qcRefNoControl.disable({ emitEvent: false });
      return;
    }

    this.isLoadingQcRefs = true;
    this.service.getQcEvents(value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: events => {
          this.allQcRefs.set(events);
          this.qcRefNoControl.enable({ emitEvent: false });
          this.isLoadingQcRefs = false;
          if (events.length === 1) {
            this.qcRefNoControl.setValue(events[0].qcReference, { emitEvent: false });
            this.onQcRefChange(events[0].qcReference);
          }
        },
        error: () => { this.isLoadingQcRefs = false; },
      });
  }

  onQcRefChange(value: string | null): void {
    this.clearResults();
    if (value) {
      this.onRetrieve(value);
    }
  }

  // ── QC Type change ─────────────────────────────────────────────────────────────

  onQcTypeChange(qcType: string | null): void {
    const selected = this.allQcTypes().find(t => t.qcType === qcType);
    this.currentQcTypeDescription = selected?.description ?? '';
    this.reviewCode.set(null);

    if (qcType && this.equipmentTypeControl.value) {
      this.service.getReviewCode(this.equipmentTypeControl.value, qcType)
        .pipe(takeUntil(this.destroy$))
        .subscribe({ next: code => this.reviewCode.set(code ?? null) });
    }
  }

  // ── Retrieve (load header + details) ──────────────────────────────────────────

  onRetrieve(qcReference: string): void {
    if (this.isLoading) return;
    this.isLoading = true;
    this.currentQcReference = qcReference;

    forkJoin([
      this.service.getQcHeader(qcReference),
      this.service.getQcDetails(qcReference),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([header, details]) => {
          this.qcHeaderData = header;
          this.qcProcedureRows = this.mapDetailRows(details, header);
          this.patchDetailsForm(header);

          // Fetch review code — determines whether dual review is required
          const equipType = this.equipmentTypeControl.value;
          const qcType = header?.qcType;
          if (equipType && qcType) {
            this.service.getReviewCode(equipType, qcType)
              .pipe(takeUntil(this.destroy$))
              .subscribe({ next: code => this.reviewCode.set(code ?? null) });
          }

          this.hasRetrieved = true;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.showError('Failed to load QC data. Please try again.');
        },
      });
  }

  private mapDetailRows(details: QcDetailDto[], header: QcHeaderDto | null): QcProcedureRow[] {
    const resultsMap = new Map(this.allQcResults().map(r => [r.code, r.description]));

    return details.map(d => {
      const minVal = d.minimumValue ?? '';
      const maxVal = d.maximumValue ?? '';
      const hasRange = minVal !== '' || maxVal !== '';
      const validRange = hasRange ? `${minVal} - ${maxVal}`.trim() : '';
      const dataType = hasRange ? 'NUM' : 'CHAR';
      const interpCode = d.interpretation ?? '';
      const resultInterpretation = resultsMap.get(interpCode) || interpCode;

      return {
        qcId: d.qcId,
        arrangeBy: d.arrangeBy,
        qcProcedure: d.qcId,
        target: d.expectedValue ?? '',
        data: dataType,
        validRange,
        minValue: minVal,
        maxValue: maxVal,
        value: d.actualValue ?? '',
        tech1: header?.qcTech1 ?? d.insertedBy ?? '',
        tech2: header?.qcTech2 ?? '',
        resultInterpretation,
      };
    });
  }

  private patchDetailsForm(header: QcHeaderDto | null): void {
    if (!header) return;

    if (header.qcDate) {
      const m = moment(header.qcDate);
      this.qcDateControl.setValue(m.isValid() ? m : null, { emitEvent: false });
      this.qcTimeControl.setValue(m.isValid() ? m.format('HH:mm') : null, { emitEvent: false });
    } else {
      this.qcDateControl.setValue(null, { emitEvent: false });
      this.qcTimeControl.setValue(null, { emitEvent: false });
    }

    this.qcDetailsForm.patchValue({
      qcType: header.qcType ?? null,
      qcTech1: header.qcTech1 ?? null,
      qcTech2: header.qcTech2 ?? null,
      result1: header.qcResult1 ?? null,
      result2: header.qcResult2 ?? null,
    });

    this.currentQcTypeDescription = header.qcTypeDescription ?? '';
    this.updateMaxQcDate();
  }

  // ── Save ───────────────────────────────────────────────────────────────────────

  onSave(): void {
    if (this.isSaving || !this.currentQcReference) return;

    const formVal = this.qcDetailsForm.value;
    const result1 = formVal.result1;
    const dateVal = this.qcDateControl.value;
    const timeVal = this.qcTimeControl.value?.trim() || null;
    const isActiveResult = result1 !== 'S' && result1 !== 'C';

    if (!formVal.qcType) {
      this.qcDetailsForm.get('qcType')?.markAsTouched();
      this.showError('QC Type is required.');
      return;
    }

    if (!result1) {
      this.qcDetailsForm.get('result1')?.markAsTouched();
      this.showError('Result 1 is required.');
      return;
    }

    if (isActiveResult && !dateVal) {
      this.qcDateControl.markAsTouched();
      this.showError('QC Date is required for this result type.');
      return;
    }

    if (isActiveResult && dateVal && dateVal.isAfter(moment(), 'day')) {
      this.qcDateControl.markAsTouched();
      this.showError('QC Date cannot be a future date.');
      return;
    }

    if (isActiveResult && !formVal.qcTech1) {
      this.qcDetailsForm.get('qcTech1')?.markAsTouched();
      this.showError('QC Tech 1 is required for this result type.');
      return;
    }

    if (formVal.qcTech1 && formVal.qcTech2 &&
        formVal.qcTech1.toLowerCase() === formVal.qcTech2.toLowerCase()) {
      this.qcDetailsForm.get('qcTech2')?.markAsTouched();
      this.showError('QC Tech 1 and QC Tech 2 cannot be the same user.');
      return;
    }

    if (formVal.qcTech2 && !formVal.result2) {
      this.qcDetailsForm.get('result2')?.markAsTouched();
      this.showError('Result 2 is required when QC Tech 2 is provided.');
      return;
    }

    if (formVal.result2 === 'S' || formVal.result2 === 'C') {
      this.showError('Result 2 cannot be Scheduled or Cancelled.');
      return;
    }

    // Dual review rules (review code 2 or 2D)
    const rc = this.reviewCode();
    if ((rc === '2' || rc === '2D') && result1 === 'A') {
      if (!formVal.qcTech2 || !formVal.result2) {
        this.showError('Dual review required: QC Tech 2 and Result 2 are mandatory when Result 1 is Acceptable.');
        return;
      }
      if (rc === '2D') {
        const hasMismatch = this.qcProcedureRows.some(
          row => (row.value ?? '').trim().toLowerCase() !== (row.target ?? '').trim().toLowerCase()
        );
        if (hasMismatch) {
          this.showError('Strict dual review (2D): all actual values must exactly match their expected values.');
          return;
        }
      }
    }

    let qcDate: string | null = null;
    if (dateVal) {
      const isoDate = dateVal.format('YYYY-MM-DD');
      qcDate = isoDate + (timeVal ? `T${timeVal}:00` : 'T00:00:00');
    }

    const details = this.qcProcedureRows.map(row => ({
      qcId: row.qcId,
      arrangeBy: row.arrangeBy,
      actualValue: row.value ?? '',
    }));

    this.isSaving = true;

    this.service.updateQcDetails(this.currentQcReference, { details })
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() =>
          this.service.updateQcHeader(this.currentQcReference, {
            qcType: formVal.qcType!,
            qcDate,
            qcTech1: formVal.qcTech1 ?? null,
            qcTech2: formVal.qcTech2 ?? null,
            qcResult1: result1!,
            qcResult2: formVal.result2 ?? null,
          })
        )
      )
      .subscribe({
        next: (res) => {
          this.isSaving = false;
          // Refresh QC status from server-calculated value in response
          const newStatus = (res as any)?.item?.qcStatus as string | undefined;
          if (newStatus && this.qcHeaderData) {
            const statusDesc = this.allQcResults().find(r => r.code === newStatus)?.description ?? newStatus;
            this.qcHeaderData = { ...this.qcHeaderData, qcStatus: newStatus, qcStatusDescription: statusDesc };
          }
          this.snackBar.open('QC record saved successfully.', 'DISMISS', {
            duration: 4000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
        },
        error: (err) => {
          this.isSaving = false;
          this.showError(this.extractErrorMessage(err, 'Failed to save QC record. Please try again.'));
        },
      });
  }

  // ── Clear / Cancel ─────────────────────────────────────────────────────────────

  onClearAll(): void {
    this.equipmentTypeControl.setValue(null, { emitEvent: false });
    this.equipmentTypeControl.markAsUntouched();
    this.equipmentIdControl.setValue(null, { emitEvent: false });
    this.equipmentRefControl.setValue(null, { emitEvent: false });
    this.qcRefNoControl.setValue(null, { emitEvent: false });

    this.equipmentTypeDescription = '';
    this.allEquipIds.set([]);
    this.allEquipRefs.set([]);
    this.allQcRefs.set([]);

    this.equipmentIdControl.disable({ emitEvent: false });
    this.equipmentRefControl.disable({ emitEvent: false });
    this.qcRefNoControl.disable({ emitEvent: false });

    this.barcodeControl.setValue(null, { emitEvent: false });
    this.barcodeError = '';

    this.clearResults();
    setTimeout(() => this.equipTypeSelect?.focus(), 0);
  }

  onCancel(): void {
    this.onClearAll();
  }

  private clearResults(): void {
    this.qcDateControl.reset(null, { emitEvent: false });
    this.qcTimeControl.reset(null, { emitEvent: false });
    this.qcDetailsForm.reset();
    this.qcProcedureRows = [];
    this.qcHeaderData = null;
    this.currentQcReference = '';
    this.currentQcTypeDescription = '';
    this.hasRetrieved = false;
    this.isLoading = false;
    this.reviewCode.set(null);
    this.maxQcDate = moment();
    this.result1SearchCtrl.setValue('', { emitEvent: false });
    this.result2SearchCtrl.setValue('', { emitEvent: false });
  }

  onProcedureValueChange(row: QcProcedureRow, value: string): void {
    row.value = value;
    const resultsMap = new Map(this.allQcResults().map(r => [r.code, r.description]));
    row.resultInterpretation = resultsMap.get(value) || (value === 'Y' ? 'Acceptable' : value === 'N' ? 'Unacceptable' : '');
  }

  onNumericValueInput(row: QcProcedureRow, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    row.value = value;

    if (!value || value.trim() === '') {
      row.resultInterpretation = '';
      return;
    }

    const numVal = parseFloat(value);
    if (isNaN(numVal)) {
      row.resultInterpretation = '';
      return;
    }

    const min = row.minValue ? parseFloat(row.minValue) : null;
    const max = row.maxValue ? parseFloat(row.maxValue) : null;

    if (min != null && max != null && !isNaN(min) && !isNaN(max)) {
      row.resultInterpretation = (numVal >= min && numVal <= max) ? 'Acceptable' : 'Unacceptable';
    } else {
      row.resultInterpretation = '';
    }
  }

  // ── QC Date/Time helpers ───────────────────────────────────────────────────────

  getQcDateError(): string {
    const ctrl = this.qcDateControl;
    if (!(ctrl.touched || ctrl.dirty)) return '';
    if (ctrl.hasError('matDatepickerParse') || ctrl.hasError('invalidDateFormat') || ctrl.hasError('invalidDate')) {
      return 'QC date is invalid.';
    }
    return '';
  }

  onQcDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.qcDateControl
    );
  }

  onQcTimeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/[^0-9]/g, '');
    const formatted = digits.length <= 2 ? digits : digits.substring(0, 2) + ':' + digits.substring(2, 4);
    this.qcTimeControl.setValue(formatted, { emitEvent: false });
    this.qcTimeControl.markAsTouched();
    input.value = formatted;
    setTimeout(() => {
      if (document.activeElement === input) {
        input.setSelectionRange(formatted.length, formatted.length);
      }
    }, 0);
  }

  onQcTimeBlur(): void {
    this.qcTimeControl.markAsTouched();
  }

  // ── Barcode scanning ───────────────────────────────────────────────────────────

  onBarcodeInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.barcodeError = '';
    this.barcodeControl.setErrors(null);
    if (value.length === 8) {
      this.processBarcodeInput(value);
    }
  }

  onBarcodeScan(): void {
    const value = this.barcodeControl.value?.trim() ?? '';
    if (!value) return;
    this.processBarcodeInput(value);
  }

  private processBarcodeInput(barcode: string): void {
    if (this.isScanningBarcode) return;
    this.isScanningBarcode = true;
    this.barcodeError = '';

    this.service.parseBarcode(barcode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: BarcodeParseResponseDto | null) => {
          this.isScanningBarcode = false;
          if (!result || !result.isValid) {
            this.barcodeError = result?.errorMessage ?? 'Invalid barcode.';
            this.barcodeControl.setErrors({ scanError: true });
            this.barcodeControl.markAsTouched();
            return;
          }

          const { equipmentType, equipmentId, equipmentReference } = result;

          this.allEquipIds.set([]);
          this.allEquipRefs.set([]);
          this.allQcRefs.set([]);
          this.allQcTypes.set([]);
          this.clearResults();

          this.equipmentTypeControl.setValue(equipmentType, { emitEvent: false });
          const typeObj = this.allEquipTypes().find(t => t.code === equipmentType);
          this.equipmentTypeDescription = typeObj?.description ?? '';
          this.barcodeControl.setValue(null, { emitEvent: false });

          forkJoin([
            this.service.getEquipmentIds(equipmentType),
            this.service.getQcTypes(equipmentType),
          ])
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: ([ids, qcTypes]) => {
                this.allEquipIds.set(ids);
                this.allQcTypes.set(qcTypes);
                this.equipmentIdControl.enable({ emitEvent: false });
                this.equipmentIdControl.setValue(equipmentId, { emitEvent: false });

                this.service.getEquipmentReferences(equipmentType, equipmentId)
                  .pipe(takeUntil(this.destroy$))
                  .subscribe({
                    next: refs => {
                      this.allEquipRefs.set(refs);
                      this.equipmentRefControl.enable({ emitEvent: false });
                      this.equipmentRefControl.setValue(equipmentReference, { emitEvent: false });

                      this.service.getQcEvents(equipmentReference)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                          next: events => {
                            this.allQcRefs.set(events);
                            this.qcRefNoControl.enable({ emitEvent: false });
                            if (events.length === 1) {
                              this.qcRefNoControl.setValue(events[0].qcReference, { emitEvent: false });
                              this.onRetrieve(events[0].qcReference);
                            }
                          },
                          error: () => {},
                        });
                    },
                    error: () => {},
                  });
              },
              error: () => {},
            });
        },
        error: (err: unknown) => {
          this.isScanningBarcode = false;
          this.barcodeError = this.extractErrorMessage(err, 'Barcode scan failed.');
          this.barcodeControl.setErrors({ scanError: true });
          this.barcodeControl.markAsTouched();
        },
      });
  }

  // ── Chapter change ─────────────────────────────────────────────────────────────

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadInitialLovs();
      });
  }

  // ── Result 1 listener (keeps maxQcDate in sync) ────────────────────────────────

  private setupResult1Listener(): void {
    this.qcDetailsForm.get('result1')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateMaxQcDate());
  }

  private updateMaxQcDate(): void {
    const result1 = this.qcDetailsForm.get('result1')?.value as string | null;
    this.maxQcDate = (result1 === 'S' || result1 === 'C') ? null : moment();
  }

  // ── Error helpers ─────────────────────────────────────────────────────────────

  private extractErrorMessage(error: unknown, defaultMessage: string): string {
    const err = error as any;
    if (err?.error?.error?.errorCode && err?.error?.error?.errorDescription) {
      return `Error ${err.error.error.errorCode}: ${err.error.error.errorDescription}`;
    }
    if (err?.error?.errorResponse?.errorCode && err?.error?.errorResponse?.error) {
      return `Error ${err.error.errorResponse.errorCode}: ${err.error.errorResponse.error}`;
    }
    if (err?.error?.errorCode && err?.error?.message) {
      return `Error ${err.error.errorCode}: ${err.error.message}`;
    }
    if (err?.error?.message) {
      return err.error.message;
    }
    return defaultMessage;
  }

  // ── Search listeners ───────────────────────────────────────────────────────────

  private setupSearchListeners(): void {
    this.equipTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.allEquipTypes.update(v => [...v]));

    this.equipIdSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.allEquipIds.update(v => [...v]));

    this.equipRefSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.allEquipRefs.update(v => [...v]));

    this.qcRefSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.allQcRefs.update(v => [...v]));

    this.result1SearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.allQcResults.update(v => [...v]));

    this.result2SearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.allQcResults.update(v => [...v]));
  }

  // ── Select helpers ─────────────────────────────────────────────────────────────

  onSelectOpened(opened: boolean, selectRef?: MatSelect): void {
    if (opened && selectRef) this.resetSelectActiveItem(selectRef, -1);
  }

  private resetSelectActiveItem(select: MatSelect | undefined, index: number): void {
    if (!select?.panelOpen) return;
    try {
      (select as unknown as { _keyManager?: { setActiveItem(i: number): void } })
        ._keyManager?.setActiveItem(index);
    } catch {
      // CDK internal API — no-op if unavailable
    }
  }

  get currentQcStatusDescription(): string {
    const result1 = this.qcDetailsForm.get('result1')?.value as string | null;
    if (result1) {
      const found = this.allQcResults().find(r => r.code === result1);
      if (found) return found.description;
    }
    return this.qcHeaderData?.qcStatusDescription || '-';
  }

  getResultDescription(code: string | null | undefined): string {
    if (!code) return '';
    const found = this.allQcResults().find(r => r.code === code);
    return found?.description ?? code;
  }

  formatQcDate(isoDate: string): string {
    const m = moment(isoDate);
    return m.isValid() ? m.format('DD-MMM-YYYY') : isoDate;
  }

  getTechName(userId: string | null): string {
    if (!userId) return '-';
    const user = this.allUsers().find(u => u.userId === userId);
    return user?.userName ?? userId;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  private showError(message: string): void {
    this.snackBar.open(message, 'CLOSE', {
      duration: 6000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}
