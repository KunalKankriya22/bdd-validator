import {
  Component, OnInit, OnDestroy, signal, computed, inject, effect, ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subject, takeUntil, catchError, of, forkJoin } from 'rxjs';
import moment, { Moment } from 'moment';

import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { UnitIdFieldComponent, UnitIdFieldService } from '@shared/components/unit-id-field';
import type { UnitValidationResponse } from '@shared/components/unit-id-field';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';

import { SampleTransferInApiService } from './services/sample-transfer-in-api.service';
import { SampleTransferInUnitValidationService } from './services/sample-transfer-in-unit-validation.service';
import {
  TransferMode, BoxDropdownItem, BoxValidationResult, SampleTransferInDetail,
  ContractDropdownItem, ProfileSetDropdownItem, BatchDropdownItem,
  SampleTypeDropdownItem, TestDropdownItem, OverrideCodeItem, CheckInRequest,
  ContractValidationResult, SampleDataResult, UpdateSampleDetailRequest,
} from './models/sample-transfer-in.model';
import { SampleWarningDialogComponent, SampleWarningDialogData } from './dialogs/sample-warning-dialog';
import { OverrideDialogComponent, OverrideDialogData, OverrideDialogResult } from './dialogs/override-dialog';
import { SampleNotationDialogComponent, SampleNotationDialogData } from './dialogs/sample-notation-dialog';
import { AdhocTestsDialogComponent, AdhocTestsDialogData, AdhocTestsDialogResult } from './dialogs/adhoc-tests-dialog';
import {
  DateTimePickerDialogComponent, DateTimePickerData,
} from '../../../../component-production/special-component-processing/convert-component-into-spiked-bag/datetime-picker-dialog/datetime-picker-dialog.component';

@Component({
  selector: 'app-sample-transfer-in',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, NgxMatSelectSearchModule,
    MatFormFieldModule, MatSelectModule, MatInputModule, MatButtonModule,
    MatIconModule, MatDatepickerModule, MatMomentDateModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule,
    PageHeaderWithBreadcrumb, DataTable, UnitIdFieldComponent,
  ],
  templateUrl: './sample-transfer-in.html',
  styleUrls: ['./sample-transfer-in.scss'],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: UnitIdFieldService, useClass: SampleTransferInUnitValidationService },
  ],
})
export class SampleTransferInComponent implements OnInit, OnDestroy {
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly api = inject(SampleTransferInApiService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: 'Sample Transfer In',
    subtitle: 'Record discarded empty bags and the reason for rejection.',
  };

  private readonly _headerEffect = effect(() => {
    const d = this.pageHeaderService.pageHeaderData();
    if (d) {
      this.headerConfig = {
        breadcrumbs: [{ label: 'Home', link: '/home' }, { label: d.title, link: null }],
        title: d.title,
        subtitle: d.subtitle || this.headerConfig.subtitle,
      };
    }
  });

  maxDate: Moment = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());

  // ── Header form ──────────────────────────────────────────────────
  headerForm = new FormGroup({
    transferMode: new FormControl<TransferMode | null>(null, [Validators.required]),
    boxId: new FormControl<string | null>(null, [Validators.required]),
    contractId: new FormControl<string | null>(null),
    profileSetId: new FormControl<string | null>(null),
    shipmentNo: new FormControl<string>('', [Validators.pattern(/^[a-zA-Z0-9_-]*$/)]),
    shipmentDate: new FormControl<Moment | null>(null, [
      DateFieldValidationUtility.validDateValidator(),
    ]),
    receivedDate: new FormControl<Moment | null>(null, [
      DateFieldValidationUtility.validDateValidator(),
    ]),
    batchId: new FormControl<string | null>(null),
  }, { validators: [SampleTransferInComponent.shipDateBeforeRecvDate] });

  // ── Detail entry form ────────────────────────────────────────────
  detailForm = new FormGroup({
    extUnitId: new FormControl<string>(''),
    intUnitId: new FormControl<string>('', [Validators.required]),
    collDate: new FormControl<Moment | null>(null, [
      DateFieldValidationUtility.validDateValidator(),
    ]),
    contractId: new FormControl<string>({ value: '', disabled: true }),
    sampleType: new FormControl<string | null>(null, [Validators.required]),
    newSampleType: new FormControl<string | null>(null),
    frozenFlag: new FormControl<string | null>(null),
    thawFlag: new FormControl<string | null>(null),
  });

  static shipDateBeforeRecvDate(group: AbstractControl): ValidationErrors | null {
    const ship = group.get('shipmentDate')?.value as Moment | null;
    const recv = group.get('receivedDate')?.value as Moment | null;
    if (!ship || !recv) return null;
    return ship.isAfter(recv) ? { shipAfterRecv: true } : null;
  }

  // ── Search controls for dropdowns ────────────────────────────────
  boxSearchCtrl = new FormControl<string>('');
  contractSearchCtrl = new FormControl<string>('');
  profileSearchCtrl = new FormControl<string>('');
  batchSearchCtrl = new FormControl<string>('');
  sampleTypeSearchCtrl = new FormControl<string>('');
  newSampleTypeSearchCtrl = new FormControl<string>('');

  // ── Search term signals (drive computed filters) ────────────────
  private boxSearchTerm = signal('');
  private contractSearchTerm = signal('');
  private profileSearchTerm = signal('');
  private batchSearchTerm = signal('');
  private sampleTypeSearchTerm = signal('');
  private newSampleTypeSearchTerm = signal('');

  // ── State signals ────────────────────────────────────────────────
  isLoading = signal(false);
  boxOptions = signal<BoxDropdownItem[]>([]);
  selectedBox = signal<BoxValidationResult | null>(null);
  boxSamples = signal<SampleTransferInDetail[]>([]);
  contractOptions = signal<ContractDropdownItem[]>([]);
  profileOptions = signal<ProfileSetDropdownItem[]>([]);
  batchOptions = signal<BatchDropdownItem[]>([]);
  sampleTypeOptions = signal<SampleTypeDropdownItem[]>([]);
  overrideReasons = signal<OverrideCodeItem[]>([]);
  overrideHolds = signal<OverrideCodeItem[]>([]);
  overrideComments = signal<OverrideCodeItem[]>([]);
  totalCheckedIn = signal(0);

  contractValidation = signal<ContractValidationResult | null>(null);
  barcodeScheme = signal<string | null>(null);
  copyUnitsFlag = signal<string | null>(null);
  selectedProfileType = signal<string | null>(null);
  selectedProfileSeqNo = signal<number | null>(null);
  testOptions = signal<TestDropdownItem[]>([]);
  selectedAdhocTestIds = signal<string[]>([]);
  sampleDataLoaded = signal(false);
  isMultiSampleMode = signal(false);
  multiSampleTypes = signal<string[]>([]);
  loadedSampleSnapshot = signal<{ sampleType: string | null; frozenFlag: string | null; thawFlag: string | null; aliquot: string } | null>(null);

  // ── Data table config ───────────────────────────────────────────
  tableConfig: DataTableConfig<SampleTransferInDetail> = {
    columns: [
      { key: 'extUnitId', header: 'Ext Unit ID', sortable: true, minWidth: '130px' },
      { key: 'intUnitId', header: 'Int Unit ID', sortable: false, minWidth: '130px' },
      { key: 'collDate', header: 'Coll. Date/Time', sortable: false, minWidth: '150px',
        valueFormatter: (v: string) => this.formatDate(v) },
      { key: 'contractId', header: 'Contract ID', sortable: false, minWidth: '110px' },
      { key: 'sampleType', header: 'Sample Type', sortable: false, minWidth: '100px' },
      { key: 'frozenFlag', header: 'Frozen', sortable: false, minWidth: '70px', width: '80px',
        valueFormatter: (v: string) => v === 'Y' ? 'Yes' : '' },
      { key: 'thawFlag', header: 'Thaw', sortable: false, minWidth: '70px', width: '80px',
        valueFormatter: (v: string) => v === 'Y' ? 'Yes' : '' },
      { key: 'verifyFlag', header: 'Verify', sortable: false, minWidth: '70px', width: '80px',
        valueFormatter: (v: string, row: SampleTransferInDetail) =>
          v === 'Y' || row.acceptFlag === 'Y' ? 'Yes' : '' },
    ],
    pagination: {
      pageSize: 10,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50],
      showFirstLastButtons: true,
    },
    stickyHeader: true,
    showPagination: true,
    showTableOnEmpty: true,
    emptyMessage: 'No samples loaded.',
    emptySubMessage: 'Select a Box ID to view samples.',
  };

  // ── Filtered dropdown options ────────────────────────────────────
  filteredBoxOptions = computed(() => {
    const s = this.boxSearchTerm().toLowerCase().trim();
    const all = this.boxOptions();
    return s ? all.filter(b => b.boxId.toLowerCase().includes(s) || b.shipmentNo?.toLowerCase().includes(s)) : all;
  });

  filteredContractOptions = computed(() => {
    const s = this.contractSearchTerm().toLowerCase().trim();
    const all = this.contractOptions();
    return s ? all.filter(c => c.contractId.toLowerCase().includes(s) || c.company.toLowerCase().includes(s)) : all;
  });

  filteredProfileOptions = computed(() => {
    const s = this.profileSearchTerm().toLowerCase().trim();
    const all = this.profileOptions();
    return s ? all.filter(p => p.profileSetId.toLowerCase().includes(s) || p.profileDesc.toLowerCase().includes(s)) : all;
  });

  filteredBatchOptions = computed(() => {
    const s = this.batchSearchTerm().toLowerCase().trim();
    const all = this.batchOptions();
    return s ? all.filter(b => b.batchId.toLowerCase().includes(s)) : all;
  });

  filteredSampleTypeOptions = computed(() => {
    const s = this.sampleTypeSearchTerm().toLowerCase().trim();
    let all = this.sampleTypeOptions();
    if (this.isMultiSampleMode()) {
      const allowed = new Set(this.multiSampleTypes());
      all = all.filter(t => allowed.has(t.code));
    }
    return s ? all.filter(t => t.code.toLowerCase().includes(s) || t.codeDesc.toLowerCase().includes(s)) : all;
  });

  filteredNewSampleTypeOptions = computed(() => {
    const s = this.newSampleTypeSearchTerm().toLowerCase().trim();
    const current = this.detailForm.get('sampleType')?.value;
    const all = this.sampleTypeOptions().filter(t => t.code !== current);
    return s ? all.filter(t => t.code.toLowerCase().includes(s) || t.codeDesc.toLowerCase().includes(s)) : all;
  });

  get transferMode(): TransferMode | null {
    return this.headerForm.get('transferMode')?.value ?? null;
  }

  get isInternal(): boolean { return this.transferMode === 'I'; }
  get isExternal(): boolean { return this.transferMode === 'E'; }

  // ── Validation error messages ─────────────────────────────────────
  shipmentNoError = signal('');
  frozenThawError = signal('');
  newSampleTypeError = signal('');
  shipRecvDateError = signal('');
  shipRecvDateErrorField = signal<'shipmentDate' | 'receivedDate' | null>(null);
  shipDateFutureError = signal('');
  recvDateFutureError = signal('');
  collDateFutureError = signal('');
  extUnitIdError = signal('');
  intUnitIdError = signal('');
  extUnitIdValidating = signal(false);
  intUnitIdValidating = signal(false);

  // ── Unit ID field references ────────────────────────────────────
  @ViewChild('extUnitIdField') extUnitIdField?: UnitIdFieldComponent;
  @ViewChild('intUnitIdField') intUnitIdField?: UnitIdFieldComponent;
  private extUnitIdData = signal<UnitValidationResponse | null>(null);
  private intUnitIdData = signal<UnitValidationResponse | null>(null);

  // ── Lifecycle ────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadSampleTypes();
    this.headerForm.patchValue({
      receivedDate: this.chapterTimezoneService.getChapterLocalDateTime(),
    }, { emitEvent: false });
    this.headerService.chapterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.clearAll();
      this.maxDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
    });

    this.boxSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.boxSearchTerm.set(v || ''));
    this.contractSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.contractSearchTerm.set(v || ''));
    this.profileSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.profileSearchTerm.set(v || ''));
    this.batchSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.batchSearchTerm.set(v || ''));
    this.sampleTypeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.sampleTypeSearchTerm.set(v || ''));
    this.newSampleTypeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.newSampleTypeSearchTerm.set(v || ''));

    this.detailForm.get('thawFlag')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.validateFrozenThaw());
    this.detailForm.get('frozenFlag')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.validateFrozenThaw());

    this.detailForm.get('newSampleType')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {
      const current = this.detailForm.get('sampleType')?.value;
      this.newSampleTypeError.set(val && val === current ? 'New sample type cannot be the same as current sample type.' : '');
    });

    this.headerForm.get('shipmentNo')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const ctrl = this.headerForm.get('shipmentNo');
      this.shipmentNoError.set(ctrl?.hasError('pattern') ? 'Shipment number can only contain letters, numbers, hyphens, and underscores.' : '');
    });

    this.headerForm.get('shipmentDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.validateDateCrossFields('shipmentDate'));
    this.headerForm.get('receivedDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.validateDateCrossFields('receivedDate'));
    this.detailForm.get('collDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.validateCollDateFuture());
  }

  private validateFrozenThaw(): void {
    const frozen = this.detailForm.get('frozenFlag')?.value;
    const thaw = this.detailForm.get('thawFlag')?.value;
    const thawCtrl = this.detailForm.get('thawFlag');
    if (thaw === 'Y' && frozen !== 'Y') {
      this.frozenThawError.set('Thaw cannot be set without Frozen.');
      thawCtrl?.setErrors({ frozenThaw: true });
      thawCtrl?.markAsTouched();
    } else {
      this.frozenThawError.set('');
      if (thawCtrl?.hasError('frozenThaw')) {
        thawCtrl.setErrors(null);
      }
    }
  }

  private validateDateCrossFields(changedField?: 'shipmentDate' | 'receivedDate'): void {
    const ship = this.headerForm.get('shipmentDate')?.value as Moment | null;
    const recv = this.headerForm.get('receivedDate')?.value as Moment | null;
    const chpNow = this.chapterTimezoneService.getChapterLocalDateTime();

    this.shipDateFutureError.set(
      ship && ship.isAfter(chpNow) ? 'Shipment date/time cannot be in the future.' : '',
    );
    this.recvDateFutureError.set(
      recv && recv.isAfter(chpNow) ? 'Received date/time cannot be in the future.' : '',
    );

    const hasError = !!(ship && recv && ship.isAfter(recv));
    this.shipRecvDateError.set(hasError ? 'Shipment date cannot be later than received date.' : '');
    if (changedField) {
      this.shipRecvDateErrorField.set(hasError ? changedField : null);
    } else if (!hasError) {
      this.shipRecvDateErrorField.set(null);
    }
  }

  private validateCollDateFuture(): void {
    if (this.isInternal) { this.collDateFutureError.set(''); return; }
    const collDate = this.detailForm.get('collDate')?.value as Moment | null;
    if (!collDate || !collDate.isValid()) { this.collDateFutureError.set(''); return; }
    const chpNow = this.chapterTimezoneService.getChapterLocalDateTime();
    this.collDateFutureError.set(collDate.isAfter(chpNow) ? 'Collection date/time cannot be in the future.' : '');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Transfer Mode change ─────────────────────────────────────────
  onTransferModeChange(mode: TransferMode): void {
    this.resetAfterModeChange();
    this.setFieldStates(mode);
    this.loadBoxes(mode);
    if (mode === 'E') {
      this.loadContracts();
    }
  }

  private setFieldStates(mode: TransferMode): void {
    const h = this.headerForm;
    const d = this.detailForm;
    if (mode === 'I') {
      h.get('contractId')?.clearValidators();
      h.get('contractId')?.disable();
      h.get('profileSetId')?.clearValidators();
      h.get('profileSetId')?.disable();
      h.get('batchId')?.disable();
      d.get('extUnitId')?.disable();
      d.get('intUnitId')?.enable();
      d.get('collDate')?.disable();
      d.get('sampleType')?.enable();
      d.get('newSampleType')?.enable();
      d.get('frozenFlag')?.disable();
      d.get('thawFlag')?.enable();
    } else {
      h.get('contractId')?.setValidators([Validators.required]);
      h.get('contractId')?.enable();
      h.get('profileSetId')?.setValidators([Validators.required]);
      h.get('profileSetId')?.enable();
      h.get('batchId')?.enable();
      d.get('extUnitId')?.enable();
      d.get('intUnitId')?.disable();
      d.get('collDate')?.enable();
      d.get('sampleType')?.enable();
      d.get('newSampleType')?.disable();
      d.get('frozenFlag')?.enable();
      d.get('thawFlag')?.enable();
    }
    h.get('contractId')?.updateValueAndValidity();
    h.get('profileSetId')?.updateValueAndValidity();
  }

  // ── Box ID change ────────────────────────────────────────────────
  onBoxIdChange(boxId: string): void {
    if (!boxId || !this.transferMode) return;
    this.isLoading.set(true);
    this.api.validateBox(boxId, this.transferMode).pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        if (this.isExternal) {
          this.isLoading.set(false);
          this.selectedBox.set(null);
          return of(null);
        }
        const body = err?.error;
        this.showError(this.formatApiError(body?.errorCode || '0254', body?.errorResponse?.error || body?.message || 'Invalid Box ID.'));
        return of(null);
      }),
    ).subscribe(result => {
      this.isLoading.set(false);
      if (!result) {
        if (this.isExternal) {
          this.boxSamples.set([]);
          this.totalCheckedIn.set(0);
        }
        return;
      }
      this.selectedBox.set(result);
      const shipMoment = result.shipmentDate ? moment(result.shipmentDate, 'MM-DD-YYYY HH:mm') : null;
      const recvMoment = result.receivedDate ? moment(result.receivedDate, 'MM-DD-YYYY HH:mm') : this.chapterTimezoneService.getChapterLocalDateTime();
      this.headerForm.patchValue({
        contractId: result.contractId,
        profileSetId: result.profileSetId,
        shipmentNo: result.shipmentNo ?? '',
        shipmentDate: shipMoment,
        receivedDate: recvMoment,
        batchId: result.batchId,
      }, { emitEvent: false });
      if (result.contractId && this.isExternal) {
        this.loadProfiles(result.contractId);
        this.loadBatches(result.contractId);
      }
      this.loadBoxSamples(boxId);
    });
  }

  private loadBoxSamples(boxId: string): void {
    this.api.getBoxSamples(boxId, this.transferMode!).pipe(
      takeUntil(this.destroy$),
      catchError(() => of([])),
    ).subscribe(samples => {
      this.boxSamples.set(samples);
      this.totalCheckedIn.set(samples.filter(s => s.verifyFlag === 'Y' || s.acceptFlag === 'Y').length);
      this.tableConfig = {
        ...this.tableConfig,
        pagination: { ...this.tableConfig.pagination!, totalRecords: samples.length, pageIndex: 0 },
      };
    });
  }

  // ── Contract change ──────────────────────────────────────────────
  onContractChange(contractId: string): void {
    if (!contractId) return;
    this.loadProfiles(contractId);
    this.loadBatches(contractId);
    this.validateAndLoadContractInfo(contractId);
  }

  onProfileSetChange(profileSetId: string): void {
    if (!profileSetId) return;
    const match = this.profileOptions().find(p => p.profileSetId === profileSetId);
    this.selectedProfileType.set(match?.profileType ?? null);
    this.selectedProfileSeqNo.set(match?.profileSeqNo ?? null);
    if (match?.profileType === 'A') {
      this.selectedAdhocTestIds.set([]);
      this.openAdhocTestsDialog();
    }
  }

  openAdhocTestsDialog(): void {
    if (!this.testOptions().length) {
      this.api.getTests().pipe(takeUntil(this.destroy$), catchError(() => of([]))).subscribe(tests => {
        this.testOptions.set(tests);
        this.showAdhocDialog();
      });
    } else {
      this.showAdhocDialog();
    }
  }

  private showAdhocDialog(): void {
    const ref = this.dialog.open(AdhocTestsDialogComponent, {
      width: '550px',
      maxHeight: '80vh',
      disableClose: true,
      data: {
        tests: this.testOptions(),
        previouslySelected: this.selectedAdhocTestIds(),
      } as AdhocTestsDialogData,
    });
    ref.afterClosed().subscribe((result: AdhocTestsDialogResult | null) => {
      if (result) {
        this.selectedAdhocTestIds.set(result.selectedTestIds);
      }
    });
  }

  private validateAndLoadContractInfo(contractId: string): void {
    this.api.validateContract(contractId).pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        const body = err?.error;
        this.showError(this.formatApiError(body?.errorCode || '1147', body?.errorResponse?.error || body?.message || 'Invalid contract ID.'));
        this.contractValidation.set(null);
        this.barcodeScheme.set(null);
        this.copyUnitsFlag.set(null);
        return of(null);
      }),
    ).subscribe(result => {
      if (!result) return;
      this.contractValidation.set(result);
      this.barcodeScheme.set(result.barCodeProtocol ?? null);
      this.copyUnitsFlag.set(result.unitIdType ?? null);
    });
  }

  // ── Data loaders ─────────────────────────────────────────────────
  private loadBoxes(mode: TransferMode): void {
    this.api.getBoxes(mode).pipe(takeUntil(this.destroy$), catchError(() => of([]))).subscribe(b => this.boxOptions.set(b));
  }

  private loadContracts(): void {
    this.api.getContracts().pipe(takeUntil(this.destroy$), catchError(() => of([]))).subscribe(c => this.contractOptions.set(c));
  }

  private loadProfiles(contractId: string): void {
    this.api.getProfiles(contractId).pipe(takeUntil(this.destroy$), catchError(() => of([]))).subscribe(p => this.profileOptions.set(p));
  }

  private loadBatches(contractId: string): void {
    this.api.getBatches(contractId).pipe(takeUntil(this.destroy$), catchError(() => of([]))).subscribe(b => {
      this.batchOptions.set(b);
    });
  }

  onBatchIdChange(batchId: string): void {
    if (batchId === '__NEW__') {
      this.generateNewBatch();
    }
  }

  private generateNewBatch(): void {
    this.isLoading.set(true);
    const h = this.headerForm.getRawValue();
    const contractId = h.contractId ?? undefined;
    const receivedDate = h.receivedDate ? h.receivedDate.format('YYYY-MM-DDTHH:mm:ss') : undefined;

    this.api.generateBatch(contractId, receivedDate).pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        this.isLoading.set(false);
        const body = err?.error;
        if (body?.errorCode === '1083') {
          this.showError(`Error 1083: ${body?.message || 'An incomplete batch already exists for this contract and received date.'}`);
        } else {
          this.showError('Failed to generate batch ID.');
        }
        return of('');
      }),
    ).subscribe(newBatchId => {
      this.isLoading.set(false);
      if (newBatchId) {
        this.headerForm.patchValue({ batchId: newBatchId });
        this.showSuccess(`New batch ID generated: ${newBatchId}`);
      }
    });
  }

  private loadSampleTypes(): void {
    this.api.getSampleTypes().pipe(takeUntil(this.destroy$), catchError(() => of([]))).subscribe(t => this.sampleTypeOptions.set(t));
  }

  // ── Save (check-in) ─────────────────────────────────────────────
  onSave(): void {
    const h = this.headerForm.getRawValue();
    if (!h.transferMode) {
      this.showError('Error 2319: Transfer mode is required. Enter I for Internal or E for External.');
      return;
    }
    if (!h.boxId) {
      this.showError('Error 0080: Box ID is required.');
      return;
    }

    if (this.intUnitIdField?.validationState === 'validating' || this.extUnitIdField?.validationState === 'validating') {
      this.showError('Unit ID validation is still in progress. Please wait.');
      return;
    }

    if (this.isExternal && this.extUnitIdField && !this.extUnitIdField.unitIdControl.value) {
      this.showError('Error 0080: External Unit ID is required.');
      return;
    }
    if (this.extUnitIdField?.validationState === 'invalid') {
      this.showError(`Error 1230: ${this.extUnitIdField.validationError || 'External Unit ID validation failed.'}`);
      return;
    }
    if (this.isInternal && this.intUnitIdField && !this.intUnitIdField.unitIdControl.value) {
      this.showError('Error 0080: Internal Unit ID is required.');
      return;
    }
    if (this.intUnitIdField?.validationState === 'invalid') {
      this.showError(`Error 1230: ${this.intUnitIdField.validationError || 'Internal Unit ID validation failed.'}`);
      return;
    }

    this.syncUnitIdFieldsToForm();

    // External-mode required fields (matching FMB nullchk)
    if (this.isExternal) {
      if (!h.contractId) { this.showError('Error 0080: Contract ID must be entered.'); return; }
      if (!h.profileSetId) { this.showError('Error 0080: Profile Set ID must be entered.'); return; }
      if (!h.shipmentDate) { this.showError('Error 0080: Shipment Date must be entered.'); return; }
      if (!h.receivedDate) { this.showError('Error 0080: Received Date must be entered.'); return; }
    }

    const d = this.detailForm.getRawValue();
    if (this.isExternal && !d.collDate) { this.showError('Error 0080: Collection Date must be entered.'); return; }
    if (!d.sampleType && this.detailForm.get('sampleType')?.enabled) { this.showError('Error 0080: Sample Type must be entered.'); return; }

    this.headerForm.markAllAsTouched();
    this.detailForm.markAllAsTouched();

    if (this.headerForm.invalid || this.detailForm.invalid) {
      const specificError = this.getFirstValidationError();
      this.showError(`Error 0080: ${specificError}`);
      return;
    }

    this.validateDateCrossFields();
    this.validateCollDateFuture();

    if (this.shipmentNoError()) {
      this.showError(`Error 5193: ${this.shipmentNoError()}`);
      return;
    }
    if (this.shipDateFutureError()) {
      this.showError(`Error 8030: ${this.shipDateFutureError()}`);
      return;
    }
    if (this.recvDateFutureError()) {
      this.showError(`Error 5221: ${this.recvDateFutureError()}`);
      return;
    }
    if (this.shipRecvDateError()) {
      this.showError(`Error 8040: ${this.shipRecvDateError()}`);
      return;
    }
    if (this.collDateFutureError()) {
      this.showError(`Error 8030: ${this.collDateFutureError()}`);
      return;
    }
    if (this.frozenThawError()) {
      this.showError(`Error 1385: ${this.frozenThawError()}`);
      return;
    }
    if (this.newSampleTypeError()) {
      this.showError(`Error 1382: ${this.newSampleTypeError()}`);
      return;
    }

    if (this.checkDuplicateSampleLocal()) {
      this.showError('Error 1386: Duplicate sample type for this unit in this box.');
      return;
    }

    const unitId = this.isInternal ? (d.intUnitId || '') : (this.extUnitIdField?.parsedUnitId || d.extUnitId || d.intUnitId || '');
    const sampleType = d.newSampleType || d.sampleType || '';

    if (h.boxId && unitId && sampleType) {
      this.checkDuplicateSampleServer(h.boxId, unitId, sampleType, () => this.buildAndSubmitCheckIn());
    } else {
      this.buildAndSubmitCheckIn();
    }
  }

  private buildAndSubmitCheckIn(): void {
    const h = this.headerForm.getRawValue();
    const d = this.detailForm.getRawValue();

    const dto: CheckInRequest = {
      transferMode: h.transferMode!,
      boxId: h.boxId!,
      contractId: h.contractId ?? undefined,
      profileSetId: h.profileSetId ?? undefined,
      shipmentNo: h.shipmentNo ?? undefined,
      shipmentDate: h.shipmentDate ? h.shipmentDate.format('YYYY-MM-DDTHH:mm:ss') : undefined,
      receivedDate: h.receivedDate
        ? h.receivedDate.format('YYYY-MM-DDTHH:mm:ss')
        : this.chapterTimezoneService.getChapterLocalDateTime().format('YYYY-MM-DDTHH:mm:ss'),
      batchId: h.batchId ?? undefined,
      extUnitId: this.extUnitIdField?.parsedUnitId || d.extUnitId || undefined,
      intUnitId: this.intUnitIdField?.parsedUnitId || d.intUnitId || undefined,
      collDate: d.collDate ? d.collDate.format('YYYY-MM-DDTHH:mm:ss') : undefined,
      sampleType: d.sampleType ?? undefined,
      newSampleType: d.newSampleType ?? undefined,
      frozenFlag: d.frozenFlag ?? undefined,
      thawFlag: d.thawFlag ?? undefined,
      thawStartTime: d.thawFlag === 'Y' ? this.chapterTimezoneService.getChapterLocalDateTime().toISOString() : undefined,
      acceptFlag: undefined,
      adhocTestIds: this.selectedAdhocTestIds().length ? this.selectedAdhocTestIds() : undefined,
    };

    this.executeCheckIn(dto);
  }

  private executeCheckIn(dto: CheckInRequest): void {
    this.isLoading.set(true);
    this.api.checkIn(dto).pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        this.isLoading.set(false);
        const body = err?.error;
        const errorCode = body?.errorCode || body?.errorResponse?.errorCode;
        const errorMsg = body?.errorResponse?.error || body?.message || 'Check-in failed.';
        const formatted = this.formatApiError(errorCode, errorMsg);
        if (formatted.includes('1389')) {
          this.handleWarning1389(dto, formatted);
          return of(null);
        }
        this.showError(formatted);
        return of(null);
      }),
    ).subscribe(res => {
      this.isLoading.set(false);
      if (!res) return;
      if (res.success) {
        this.showSuccess('Error 8010: Sample checked in successfully.');
        this.totalCheckedIn.update(n => n + 1);
        this.loadBoxSamples(dto.boxId);
        this.detailForm.reset();
      } else if (res.message?.includes('1389') || res.errorCode === '1389') {
        const msg = this.formatApiError(res.errorCode, res.errorResponse?.error || res.message);
        this.handleWarning1389(dto, msg);
      } else {
        this.showError(this.formatApiError(res.errorCode, res.errorResponse?.error || res.message));
      }
    });
  }

  private syncUnitIdFieldsToForm(): void {
    if (this.isExternal && this.extUnitIdField?.parsedUnitId) {
      this.detailForm.patchValue({ extUnitId: this.extUnitIdField.parsedUnitId });
    }
    if (this.isInternal && this.intUnitIdField?.parsedUnitId) {
      this.detailForm.patchValue({ intUnitId: this.intUnitIdField.parsedUnitId });
    }
  }

  private getFirstValidationError(): string {
    const h = this.headerForm;
    const d = this.detailForm;
    if (h.get('contractId')?.enabled && h.get('contractId')?.hasError('required')) return 'Contract ID is required for external transfer.';
    if (h.get('profileSetId')?.enabled && h.get('profileSetId')?.hasError('required')) return 'Profile Set ID is required for external transfer.';
    if (h.get('shipmentDate')?.hasError('invalidDate')) return 'Shipment date is invalid.';
    if (h.get('receivedDate')?.hasError('invalidDate')) return 'Received date is invalid.';
    if (h.get('shipmentNo')?.hasError('pattern')) return 'Shipment number contains invalid characters.';
    if (h.hasError('shipAfterRecv')) return 'Shipment date cannot be later than received date.';
    if (d.get('intUnitId')?.enabled && d.get('intUnitId')?.hasError('required')) return 'Internal Unit ID is required.';
    if (d.get('sampleType')?.enabled && d.get('sampleType')?.hasError('required')) return 'Sample Type is required.';
    if (d.get('collDate')?.hasError('invalidDate')) return 'Collection date is invalid.';
    return 'Please fix all required field errors before saving.';
  }

  private formatApiError(errorCode: string | undefined | null, message: string | undefined | null): string {
    const msg = message || 'An unexpected error occurred.';
    if (errorCode) {
      return `Error ${errorCode}: ${msg}`;
    }
    return msg;
  }

  private handleWarning1389(dto: CheckInRequest, message: string): void {
    this.isLoading.set(false);
    const ref = this.dialog.open(SampleWarningDialogComponent, {
      width: '450px',
      disableClose: true,
      data: { type: 'warning', message } as SampleWarningDialogData,
    });
    ref.afterClosed().subscribe((yes: boolean) => {
      if (yes) {
        this.openOverrideDialog(dto);
      } else {
        this.clearAll();
      }
    });
  }

  private openOverrideDialog(dto: CheckInRequest): void {
    if (!this.overrideReasons().length || !this.overrideHolds().length) {
      forkJoin({
        reasons: this.api.getOverrideReasons().pipe(catchError(() => of([]))),
        holds: this.api.getOverrideHolds().pipe(catchError(() => of([]))),
        comments: this.api.getOverrideComments().pipe(catchError(() => of([]))),
      }).pipe(takeUntil(this.destroy$)).subscribe(({ reasons, holds, comments }) => {
        this.overrideReasons.set(reasons);
        this.overrideHolds.set(holds);
        this.overrideComments.set(comments);
        this.showOverrideDialog(dto);
      });
    } else {
      this.showOverrideDialog(dto);
    }
  }

  private showOverrideDialog(dto: CheckInRequest): void {
    const ref = this.dialog.open(OverrideDialogComponent, {
      width: '600px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'side-panel-right',
      disableClose: true,
      data: {
        extUnitId: dto.extUnitId || dto.intUnitId || '',
        reasonCodes: this.overrideReasons(),
        holdCodes: this.overrideHolds(),
        commentCodes: this.overrideComments(),
      } as OverrideDialogData,
    });
    ref.afterClosed().subscribe((result: OverrideDialogResult | null) => {
      if (result) {
        dto.acceptFlag = 'Y';
        dto.ovrUserId = result.userId;
        dto.ovrReasonCode = result.reasonCode;
        dto.ovrHoldCode = result.holdCode;
        dto.ovrComments = result.comments;
        this.executeCheckIn(dto);
      } else {
        this.clearAll();
      }
    });
  }

  onExtUnitIdValidated(data: UnitValidationResponse): void {
    this.extUnitIdData.set(data);
    this.extUnitIdError.set('');
    this.detailForm.patchValue({ extUnitId: data.parsedUnitId || '' }, { emitEvent: false });

    if (this.isExternal && this.contractValidation()?.copyIsbtFlag === 'Y') {
      const extUnit = data.parsedUnitId || '';
      if (extUnit) {
        this.detailForm.patchValue({ intUnitId: extUnit }, { emitEvent: false });
      }
    }
  }

  onExtUnitIdCleared(): void {
    this.extUnitIdData.set(null);
    this.extUnitIdError.set('');
    this.detailForm.patchValue({ extUnitId: '' }, { emitEvent: false });
    if (this.isExternal && this.contractValidation()?.copyIsbtFlag === 'Y') {
      this.detailForm.patchValue({ intUnitId: '' }, { emitEvent: false });
    }
  }

  private lookupBoxSample(unitId: string): void {
    if (!this.isInternal || !this.headerForm.get('boxId')?.value) return;
    this.sampleDataLoaded.set(false);

    const matches = this.boxSamples().filter(s => s.intUnitId === unitId);

    if (matches.length === 1) {
      this.applyMatchedSample(matches[0], false);
    } else if (matches.length > 1) {
      this.handleMultipleSamplesSelection(unitId, matches);
    } else {
      this.loadSampleDataFromServer(unitId);
    }
  }

  private applyMatchedSample(match: SampleTransferInDetail, isNewSample: boolean): void {
    this.isMultiSampleMode.set(false);
    this.multiSampleTypes.set([]);
    this.sampleDataLoaded.set(true);
    this.loadedSampleSnapshot.set(isNewSample ? null : {
      sampleType: match.sampleType || null,
      frozenFlag: match.frozenFlag || null,
      thawFlag: match.thawFlag || null,
      aliquot: match.aliquot || '01',
    });
    this.detailForm.patchValue({
      collDate: match.collDate ? moment(match.collDate, ['MM-DD-YYYY HH:mm', 'YYYY-MM-DDTHH:mm:ss', moment.ISO_8601]).startOf('day') : null,
      contractId: match.contractId || '',
      sampleType: match.sampleType || null,
      frozenFlag: match.frozenFlag || null,
    }, { emitEvent: false });

    if (isNewSample) {
      this.detailForm.get('collDate')?.enable();
      this.detailForm.get('sampleType')?.enable();
      this.detailForm.get('frozenFlag')?.enable();
      this.detailForm.get('newSampleType')?.disable();
    } else {
      this.detailForm.get('collDate')?.disable();
      this.detailForm.get('sampleType')?.disable();
      this.detailForm.get('frozenFlag')?.disable();
      this.detailForm.get('newSampleType')?.enable();
      this.detailForm.get('thawFlag')?.enable();
    }
  }

  private handleMultipleSamplesSelection(unitId: string, matches: SampleTransferInDetail[]): void {
    const uncheckedMatches = matches.filter(m =>
      !this.boxSamples().some(s =>
        s.intUnitId === unitId && s.sampleType === m.sampleType && (s.verifyFlag === 'Y' || s.acceptFlag === 'Y'),
      ),
    );

    if (uncheckedMatches.length === 0) {
      this.showWarning('Error 1383: All samples for this unit have already been checked in.');
      const first = matches[0];
      this.detailForm.patchValue({
        collDate: first.collDate ? moment(first.collDate, ['MM-DD-YYYY HH:mm', 'YYYY-MM-DDTHH:mm:ss', moment.ISO_8601]).startOf('day') : null,
        contractId: first.contractId || '',
      }, { emitEvent: false });
      this.detailForm.get('collDate')?.enable();
      this.detailForm.get('sampleType')?.enable();
      this.detailForm.get('frozenFlag')?.enable();
      return;
    }

    if (uncheckedMatches.length === 1) {
      this.applyMatchedSample(uncheckedMatches[0], false);
      return;
    }

    this.sampleDataLoaded.set(true);
    this.isMultiSampleMode.set(true);
    this.multiSampleTypes.set(uncheckedMatches.map(m => m.sampleType));
    const first = matches[0];
    this.detailForm.patchValue({
      collDate: first.collDate ? moment(first.collDate, ['MM-DD-YYYY HH:mm', 'YYYY-MM-DDTHH:mm:ss', moment.ISO_8601]).startOf('day') : null,
      contractId: first.contractId || '',
      sampleType: null,
      frozenFlag: null,
    }, { emitEvent: false });
    this.detailForm.get('collDate')?.disable();
    this.detailForm.get('sampleType')?.enable();
    this.detailForm.get('newSampleType')?.enable();
    this.detailForm.get('frozenFlag')?.disable();
  }

  private loadSampleDataFromServer(unitId: string): void {
    const boxId = this.headerForm.get('boxId')?.value;
    if (!boxId) return;
    this.isLoading.set(true);
    this.api.getSampleData(unitId, boxId).pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        this.isLoading.set(false);
        const body = err?.error;
        if (body?.errorCode === '1230' || body?.errorCode === '1391') {
          this.intUnitIdError.set(this.formatApiError(body.errorCode, body.errorResponse?.error || body.message));
        }
        return of(null);
      }),
    ).subscribe(result => {
      this.isLoading.set(false);
      if (!result) return;
      this.sampleDataLoaded.set(true);
      this.showWarning('Error 1384: Sample not found in box. Proceeding with unit data.');
      this.detailForm.patchValue({
        collDate: result.collDate ? moment(result.collDate, ['MM-DD-YYYY HH:mm', 'YYYY-MM-DDTHH:mm:ss', moment.ISO_8601]).startOf('day') : null,
        contractId: result.contractId || '',
        sampleType: result.sampleType || null,
        frozenFlag: result.frozenFlag || null,
      }, { emitEvent: false });
      this.detailForm.get('collDate')?.enable();
      this.detailForm.get('sampleType')?.enable();
      this.detailForm.get('frozenFlag')?.enable();
      this.detailForm.get('newSampleType')?.disable();
    });
  }

  onIntUnitIdValidated(data: UnitValidationResponse): void {
    this.intUnitIdData.set(data);
    this.intUnitIdError.set('');
    const unitId = data.parsedUnitId || '';
    this.detailForm.patchValue({ intUnitId: unitId }, { emitEvent: false });
    this.lookupBoxSample(unitId);
  }

  onIntUnitIdCleared(): void {
    this.intUnitIdData.set(null);
    this.intUnitIdError.set('');
    this.detailForm.patchValue({ intUnitId: '' }, { emitEvent: false });
  }

  private checkDuplicateSampleLocal(): boolean {
    const d = this.detailForm.getRawValue();
    const boxId = this.headerForm.get('boxId')?.value;
    const unitId = d.intUnitId || d.extUnitId;
    const sampleType = d.newSampleType || d.sampleType;
    if (!boxId || !unitId || !sampleType) return false;
    return this.boxSamples().some(s =>
      (s.intUnitId === unitId || s.extUnitId === unitId) && s.sampleType === sampleType && s.verifyFlag === 'Y',
    );
  }

  private checkDuplicateSampleServer(boxId: string, unitId: string, sampleType: string, onPass: () => void): void {
    this.isLoading.set(true);
    this.api.checkDuplicateSample(boxId, unitId, sampleType).pipe(
      takeUntil(this.destroy$),
      catchError(() => of(null)),
    ).subscribe(result => {
      this.isLoading.set(false);
      if (result?.isDuplicate) {
        this.showError('Error 1386: Duplicate sample type for this unit in this box.');
        return;
      }
      onPass();
    });
  }

  onNotation(): void {
    const unitId = this.detailForm.get('intUnitId')?.value || this.detailForm.get('extUnitId')?.value;
    if (!unitId) {
      this.showError('Error 0903: Please enter a Unit ID before opening the notation window.');
      return;
    }
    this.dialog.open(SampleNotationDialogComponent, {
      panelClass: 'side-panel-right',
      position: { right: '0px', bottom: '0px' },
      width: '65vw',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: false,
      data: {
        unitId,
        transferMode: this.transferMode || '',
      } as SampleNotationDialogData,
    });
  }

  isDetailDirty(): boolean {
    const snap = this.loadedSampleSnapshot();
    if (!snap) return false;
    const d = this.detailForm.getRawValue();
    const norm = (v: string | null | undefined) => (v === 'Y' ? 'Y' : '');
    const newType = d.newSampleType || null;
    return newType !== null
      || norm(d.frozenFlag) !== norm(snap.frozenFlag)
      || norm(d.thawFlag) !== norm(snap.thawFlag);
  }

  onUpdate(): void {
    const boxId = this.headerForm.get('boxId')?.value;
    if (!boxId) {
      this.showError('Error 0080: Box ID is required.');
      return;
    }

    const snap = this.loadedSampleSnapshot();
    if (!snap) {
      this.showError('Please select an existing checked-in sample to update.');
      return;
    }

    const d = this.detailForm.getRawValue();
    const intUnitId = this.intUnitIdField?.parsedUnitId || d.intUnitId;
    if (!intUnitId) {
      this.showError('Error 0080: Internal Unit ID is required.');
      return;
    }

    if (this.frozenThawError()) {
      this.showError(`Error 1385: ${this.frozenThawError()}`);
      return;
    }
    if (this.newSampleTypeError()) {
      this.showError(`Error 1382: ${this.newSampleTypeError()}`);
      return;
    }

    if (!this.isDetailDirty()) {
      this.showWarning('No changes detected to update.');
      return;
    }

    const dto: UpdateSampleDetailRequest = {
      boxId,
      intUnitId,
      aliquot: snap.aliquot,
      sampleType: d.sampleType ?? undefined,
      newSampleType: d.newSampleType ?? undefined,
      frozenFlag: d.frozenFlag ?? undefined,
      thawFlag: d.thawFlag ?? undefined,
    };

    this.isLoading.set(true);
    this.api.updateSampleDetail(dto).pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        this.isLoading.set(false);
        const body = err?.error;
        this.showError(body?.message || 'Failed to update sample detail.');
        return of(null);
      }),
    ).subscribe(res => {
      this.isLoading.set(false);
      if (!res) return;
      if (res.success) {
        this.showSuccess('Sample detail updated successfully.');
        this.loadBoxSamples(boxId);
        this.resetDetailForm();
      } else {
        this.showError(res.message || 'Failed to update sample detail.');
      }
    });
  }

  onTablePageChange(e: TablePageEvent): void {
    this.tableConfig = {
      ...this.tableConfig,
      pagination: { ...this.tableConfig.pagination!, pageSize: e.pageSize, pageIndex: e.pageIndex },
    };
  }

  onTableSortChange(e: TableSortEvent): void {
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: e.column, direction: e.direction },
    };
    if (e.direction === 'default') {
      this.loadBoxSamples(this.headerForm.get('boxId')!.value!);
      return;
    }
    const sorted = [...this.boxSamples()];
    sorted.sort((a, b) => {
      const valA = (a as any)[e.column] ?? '';
      const valB = (b as any)[e.column] ?? '';
      const cmp = String(valA).localeCompare(String(valB));
      return e.direction === 'A' ? cmp : -cmp;
    });
    this.boxSamples.set(sorted);
  }

  // ── DateTime picker dialog ────────────────────────────────────────
  openShipmentDateTimePicker(): void {
    this.openDateTimePicker(
      this.headerForm.get('shipmentDate')?.value ?? null,
      (result) => this.headerForm.patchValue({ shipmentDate: result }),
    );
  }

  openReceivedDateTimePicker(): void {
    this.openDateTimePicker(
      this.headerForm.get('receivedDate')?.value ?? null,
      (result) => this.headerForm.patchValue({ receivedDate: result }),
    );
  }

  openCollDateTimePicker(): void {
    this.openDateTimePicker(
      this.detailForm.get('collDate')?.value ?? null,
      (result) => this.detailForm.patchValue({ collDate: result }),
    );
  }

  private openDateTimePicker(current: Moment | null, onConfirm: (result: Moment) => void): void {
    const chpNow = this.chapterTimezoneService.getChapterLocalDateTime();
    const ref = this.dialog.open(DateTimePickerDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        currentDateTime: current ?? chpNow,
        minDate: moment('1900-01-01'),
      } as DateTimePickerData,
    });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result: Moment | undefined) => {
      if (result) {
        onConfirm(result);
      }
    });
  }

  getFormattedDateTime(controlName: string): string {
    const ctrl = controlName === 'collDate'
      ? this.detailForm.get(controlName)
      : this.headerForm.get(controlName);
    const val = ctrl?.value as Moment | null;
    if (!val || !moment.isMoment(val) || !val.isValid()) return '';
    return val.format('DD-MMM-YYYY HH:mm').toUpperCase();
  }

  getDateError(controlName: string, label: string): string {
    const ctrl = controlName === 'collDate'
      ? this.detailForm.get(controlName)
      : this.headerForm.get(controlName);
    if (!ctrl || !(ctrl.touched || ctrl.dirty)) return '';
    if (ctrl.hasError('invalidDate')) {
      return `${label} is invalid.`;
    }
    return '';
  }

  clearAll(): void {
    this.headerForm.reset();
    this.headerForm.patchValue({
      receivedDate: this.chapterTimezoneService.getChapterLocalDateTime(),
    }, { emitEvent: false });
    this.detailForm.reset();
    this.extUnitIdField?.clear();
    this.intUnitIdField?.clear();
    this.boxOptions.set([]);
    this.boxSamples.set([]);
    this.selectedBox.set(null);
    this.contractOptions.set([]);
    this.profileOptions.set([]);
    this.batchOptions.set([]);
    this.totalCheckedIn.set(0);
    this.contractValidation.set(null);
    this.barcodeScheme.set(null);
    this.copyUnitsFlag.set(null);
    this.selectedProfileType.set(null);
    this.selectedProfileSeqNo.set(null);
    this.selectedAdhocTestIds.set([]);
    this.sampleDataLoaded.set(false);
    this.isMultiSampleMode.set(false);
    this.multiSampleTypes.set([]);
    this.tableConfig = {
      ...this.tableConfig,
      pagination: { ...this.tableConfig.pagination!, totalRecords: 0, pageIndex: 0 },
    };
  }

  private resetDetailForm(): void {
    this.detailForm.reset();
    this.extUnitIdField?.clear();
    this.intUnitIdField?.clear();
    this.sampleDataLoaded.set(false);
    this.isMultiSampleMode.set(false);
    this.multiSampleTypes.set([]);
    this.loadedSampleSnapshot.set(null);
    this.extUnitIdData.set(null);
    this.intUnitIdData.set(null);
    this.extUnitIdError.set('');
    this.intUnitIdError.set('');
    this.frozenThawError.set('');
    this.newSampleTypeError.set('');
    this.collDateFutureError.set('');
    this.selectedAdhocTestIds.set([]);
    if (this.transferMode) {
      this.setFieldStates(this.transferMode);
    }
  }

  private resetAfterModeChange(): void {
    this.headerForm.patchValue({
      boxId: null, contractId: null, profileSetId: null,
      shipmentNo: '', shipmentDate: null, receivedDate: this.chapterTimezoneService.getChapterLocalDateTime(), batchId: null,
    }, { emitEvent: false });
    this.detailForm.reset();
    this.boxSamples.set([]);
    this.selectedBox.set(null);
    this.contractOptions.set([]);
    this.profileOptions.set([]);
    this.batchOptions.set([]);
    this.totalCheckedIn.set(0);
  }

  formatDate(v: string | null | undefined): string {
    if (!v) return '';
    const m = moment(v, ['MM-DD-YYYY HH:mm', 'YYYY-MM-DDTHH:mm:ss', moment.ISO_8601]);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : v;
  }

  private showWarningDialog(type: 'warning' | 'error', message: string): void {
    this.dialog.open(SampleWarningDialogComponent, {
      width: '450px', disableClose: true,
      data: { type, message } as SampleWarningDialogData,
    });
  }

  private showSuccess(msg: string): void {
    this.snackBar.open(msg, 'DISMISS', { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['success-snackbar'] });
  }
  private showWarning(msg: string): void {
    this.snackBar.open(msg, 'Close', { duration: 7000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['warning-snackbar'] });
  }
  private showError(msg: string): void {
    this.snackBar.open(msg, 'Close', { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'] });
  }
}
