import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, switchMap, debounceTime } from 'rxjs/operators';
import moment from 'moment';

import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';
import { UppercaseInputDirective } from '@shared/directives/uppercase-input.directive';

import { PreparePooledComponentsService } from './services/prepare-pooled-components.service';
import {
  PoolHeader,
  PoolUnit,
  ValidProduct,
  UnitProduct,
  ValidAbo,
  ValidLot,
  ValidCatalog,
  CreatePoolRequest,
  UpdatePoolRequest,
  CommitPoolRequest,
  CommitPoolResponse,
  LabelVerification,
  AttributeLookup,
  WeightInfo,
  UnitValidationResponse,
} from './models/prepare-pooled-components.model';
import { LabelVerificationDialogComponent, LabelVerificationDialogData } from './label-verification-dialog/label-verification-dialog.component';
import {
  ConfirmActionDialogComponent,
  ConfirmActionDialogData,
} from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import {
  UnitIdFieldComponent,
  UnitValidationResponse as UnitIdValidationData,
  UnitIdPostValidateEvent,
} from '@shared/components/unit-id-field';

@Component({
  selector: 'app-prepare-pooled-components',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatAutocompleteModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    NgxMatSelectSearchModule,
    UnitIdFieldComponent,
    UppercaseInputDirective,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './prepare-pooled-components.component.html',
  styleUrls: ['./prepare-pooled-components.component.scss'],
})
export class PreparePooledComponentsComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `prepare-pooled-components-${PreparePooledComponentsComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly service = inject(PreparePooledComponentsService);
  private readonly labelScanService = inject(DonorLibLabelScanService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('poolIdField') poolIdField!: UnitIdFieldComponent;
  @ViewChild('componentUnitIdField') componentUnitIdField!: UnitIdFieldComponent;

  private readonly defaultTitle = 'Prepare Pooled Components';

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: this.defaultTitle, link: null },
    ],
    title: this.defaultTitle,
    subtitle: 'Create, update and manage pooled components records for donor communication',
    actions: [],
  };

  // Forms
  poolForm!: FormGroup;
  productLineForm!: FormGroup;

  // Signals
  loading = signal<boolean>(false);
  currentPool = signal<PoolHeader | null>(null);
  unitsInPool = signal<PoolUnit[]>([]);
  validProducts = signal<ValidProduct[]>([]);
  validAbo = signal<ValidAbo[]>([]);
  validLots = signal<ValidLot[]>([]);
  validCatalogs = signal<ValidCatalog[]>([]);

  poolCodeScheme = signal<'I' | 'C' | null>(null);
  productExpiryDate = signal<moment.Moment | null>(null);
  weightRequired = signal<string>('N');
  specificGravity = signal<number | null>(null);
  freezeTimeRequired = signal<string>('N');
  validAttribGroups = signal<AttributeLookup[]>([]);
  attribCodesByIndex = signal<Map<number, AttributeLookup[]>>(new Map());
  unitProducts = signal<UnitProduct[]>([]);

  // Search controls for searchable dropdowns
  productCodeSearchControl = new FormControl('');
  aboSearchControl = new FormControl('');
  attribGroupSearchControl = new FormControl('');
  unitProductSearchControl = new FormControl('');

  // Filtered signals for searchable dropdowns
  filteredProducts = signal<ValidProduct[]>([]);
  filteredCatalogs = signal<ValidCatalog[]>([]);
  filteredLots = signal<ValidLot[]>([]);
  filteredAbo = signal<ValidAbo[]>([]);
  filteredAttribGroups = signal<AttributeLookup[]>([]);
  filteredUnitProducts = signal<UnitProduct[]>([]);
  filteredAttribCodesByIndex = signal<Map<number, AttributeLookup[]>>(new Map());
  attribCodeSearchControls = new Map<number, FormControl>();

  freezeTimeErrorMatcher = {
    isErrorState: (control: { invalid: boolean; touched: boolean; dirty: boolean } | null): boolean => {
      if (!control) return false;
      return (control.invalid && (control.touched || control.dirty));
    },
  };

  poolingTimeErrorMatcher = {
    isErrorState: (control: { invalid: boolean; touched: boolean; dirty: boolean } | null): boolean => {
      if (!control) return false;
      return (control.invalid && (control.touched || control.dirty));
    },
  };

  // Computed
  hasPool = computed(() => this.currentPool() !== null);
  poolIdReadonly = computed(() => this.currentPool() !== null);
  unitsTableEmpty = computed(() => this.unitsInPool().length === 0);
  catalogSelected = signal<boolean>(false);

  private readonly CMV_ATTRIBUTE_CODES = ['CMVN', 'CMV-', 'CMVNEG'];
  private clearing = false;

  fieldErrors: Record<string, string> = {};
  fieldProcessing: Record<string, boolean> = {};
  private catalogOptionJustSelected = false;
  private lotOptionJustSelected = false;

  // Data table config
  unitsTableConfig: DataTableConfig<PoolUnit> = {
    columns: [
      { key: 'sequenceNumber', header: 'Sequence Number', width: '120px' },
      { key: 'unitId', header: 'Unit ID' },
      { key: 'productCode', header: 'Product Code' },
      { key: 'productDescription', header: 'Description' },
      { key: 'expiryDate', header: 'Expiration Date',
        valueFormatter: (value: string) => {
          if (!value) return '';
          const m = moment(value);
          return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').replace(/-([a-z]{3})-/i, (_, mon) => `-${mon.toUpperCase()}-`) : value;
        },
      },
      { key: 'sldDescription', header: 'System Label Decision',
        valueFormatter: (value: string, row: PoolUnit) => value || row.systemLabelDecision || '',
      },
    ],
    rowActions: [
      { icon: 'delete', action: 'delete', label: 'Delete', color: 'default',
        ariaLabel: 'Delete unit {{unitId}}' },
    ],
    emptyMessage: 'No units in pool',
    emptySubMessage: 'Add units using the product line search above',
    noDataIcon: 'inventory_2',
    showTableOnEmpty: true,
    stickyHeader: true,
  };


  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title || this.defaultTitle, link: null },
          ],
          title: pageData.title || this.defaultTitle,
          subtitle: pageData.subtitle || this.headerConfig.subtitle,
        };
      }
    });
  }

  ngOnInit(): void {
    this.initializeForms();
    this.loadLookups();
    this.subscribeToChapterChanges();
    this.setupSearchFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.handleChapterChange();
      });
  }

  private handleChapterChange(): void {
    this.clearAll();
    this.loadLookups();
  }

  private setupSearchFilters(): void {
    this.productCodeSearchControl.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((term) => {
        const search = (term || '').toLowerCase();
        this.filteredProducts.set(
          this.validProducts().filter(
            (p) => p.code.toLowerCase().includes(search) || p.description.toLowerCase().includes(search),
          ),
        );
      });

    this.poolForm.get('catalogNumber')?.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((term) => {
        const search = (term || '').toLowerCase();
        this.filteredCatalogs.set(
          this.validCatalogs().filter((c) => c.code.toLowerCase().includes(search)),
        );
      });

    this.poolForm.get('lotNumber')?.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((term) => {
        const search = (term || '').toLowerCase();
        this.filteredLots.set(
          this.validLots().filter((l) => l.code.toLowerCase().includes(search)),
        );
      });

    this.aboSearchControl.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((term) => {
        const search = (term || '').toLowerCase();
        this.filteredAbo.set(
          this.validAbo().filter(
            (a) => a.code.toLowerCase().includes(search) || a.description.toLowerCase().includes(search),
          ),
        );
      });

    this.attribGroupSearchControl.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((term) => {
        const search = (term || '').toLowerCase();
        this.filteredAttribGroups.set(
          this.validAttribGroups().filter(
            (g) => g.code.toLowerCase().includes(search) || g.description.toLowerCase().includes(search),
          ),
        );
      });

    this.productLineForm.get('productCode')?.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((term) => {
        const search = (term || '').toLowerCase();
        this.filteredUnitProducts.set(
          this.unitProducts().filter(
            (p) => p.code.toLowerCase().includes(search) || p.description.toLowerCase().includes(search),
          ),
        );
      });
  }

  getAttribCodeSearchControl(index: number): FormControl {
    if (!this.attribCodeSearchControls.has(index)) {
      const ctrl = new FormControl('');
      ctrl.valueChanges
        .pipe(debounceTime(200), takeUntil(this.destroy$))
        .subscribe((term) => {
          const search = (term || '').toLowerCase();
          const allCodes = this.attribCodesByIndex().get(index) || [];
          const filtered = allCodes.filter(
            (c) => c.code.toLowerCase().includes(search) || c.description.toLowerCase().includes(search),
          );
          const map = new Map(this.filteredAttribCodesByIndex());
          map.set(index, filtered);
          this.filteredAttribCodesByIndex.set(map);
        });
      this.attribCodeSearchControls.set(index, ctrl);
    }
    return this.attribCodeSearchControls.get(index)!;
  }

  getFilteredAttribCodesForRow(index: number): AttributeLookup[] {
    return this.filteredAttribCodesByIndex().get(index) || this.getAttribCodesForRow(index);
  }

  private initializeForms(): void {
    this.poolForm = this.fb.group({
      poolId: [''],
      patientId: ['', [Validators.maxLength(10)]],
      poolUnitId: [{ value: '', disabled: true }],
      patientLastName: ['', [Validators.maxLength(50)]],
      patientFirstName: ['', [Validators.maxLength(50)]],
      facility: ['', [Validators.maxLength(50)]],
      numberOfUnits: ['', [Validators.min(1), Validators.max(999), Validators.pattern(/^\d+$/)]],
      poolProductCode: ['', [Validators.required, Validators.maxLength(8)]],
      productDescription: [{ value: '', disabled: true }],
      catalogNumber: ['', [Validators.required, Validators.maxLength(12)]],
      lotNumber: ['', [Validators.required, Validators.maxLength(30)]],
      pooledAboRh: ['', [Validators.required]],
      aboDescription: [{ value: '', disabled: true }],
      freezeTime: ['', [this.dateTimeFormatValidator.bind(this)]],
      poolingTime: ['', [Validators.required, this.dateTimeFormatValidator.bind(this)]],
      expirationDate: [{ value: null, disabled: true }],
      poolWeight: ['', [Validators.min(1), Validators.max(999.99)]],
      attributes: this.fb.array([]),
    });

    this.productLineForm = this.fb.group({
      productCode: [''],
      description: [{ value: '', disabled: true }],
      expirationDate: [''],
      systemLabelDecision: [''],
    });

    // Watch product code changes to update description and load attribute groups
    this.poolForm.get('poolProductCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((code) => {
        const product = this.validProducts().find((p) => p.code === code);
        this.poolForm.patchValue(
          { productDescription: product?.description || '' },
          { emitEvent: false }
        );
        if (code) {
          this.loadAttribGroups(code);
          this.loadWeightInfo(code);
          this.loadProductExpiry(code);
        } else {
          this.validAttribGroups.set([]);
          this.resetWeightState();
          this.productExpiryDate.set(null);
          this.poolForm.patchValue({ expirationDate: '' }, { emitEvent: false });
        }
      });

    // Watch ABO changes to update description
    this.poolForm.get('pooledAboRh')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((code) => {
        const abo = this.validAbo().find((a) => a.code === code);
        this.poolForm.patchValue(
          { aboDescription: abo?.description || '' },
          { emitEvent: false }
        );
      });

    // When pooling time changes, revalidate freeze time and recalculate expiry
    this.poolForm.get('poolingTime')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const freezeCtrl = this.poolForm.get('freezeTime');
        if (freezeCtrl?.value) {
          this.validateFreezeTime();
        }
        const productCode = this.poolForm.get('poolProductCode')?.value;
        if (productCode) {
          this.loadProductExpiry(productCode);
        }
      });
  }

  validatePoolingTime(): void {
    const ctrl = this.poolForm.get('poolingTime');
    if (!ctrl?.value) return;

    const parsed = this.parseDateTimeString(ctrl.value);
    if (!parsed) return;

    if (parsed.hour() === 0 && parsed.minute() === 0) {
      ctrl.setErrors({ midnightNotAllowed: true });
      return;
    }

    const now = this.getChapterNow();
    if (parsed.isAfter(now)) {
      ctrl.setErrors({ poolingTimeFuture: true });
      return;
    }

    if (parsed.isBefore(now.clone().subtract(3, 'days'))) {
      ctrl.setErrors({ poolingTimeRange: true });
    }
  }

  validateFreezeTime(): void {
    const freezeCtrl = this.poolForm.get('freezeTime');
    if (!freezeCtrl?.value) return;

    const freezeDt = this.parseDateTimeString(freezeCtrl.value);
    if (!freezeDt) return;

    const poolingVal = this.poolForm.get('poolingTime')?.value;
    if (poolingVal) {
      const poolDt = this.parseDateTimeString(poolingVal);
      if (poolDt && freezeDt.isBefore(poolDt)) {
        freezeCtrl.setErrors({ freezeBeforePool: true });
      }
    }
  }

  onPoolingTimeInput(): void {
    const ctrl = this.poolForm.get('poolingTime');
    ctrl?.markAsTouched();
    ctrl?.markAsDirty();
    this.poolForm.updateValueAndValidity({ emitEvent: false });
    this.validatePoolingTime();
  }

  onFreezeTimeInput(): void {
    const ctrl = this.poolForm.get('freezeTime');
    ctrl?.markAsTouched();
    ctrl?.markAsDirty();
    this.poolForm.updateValueAndValidity({ emitEvent: false });
  }

  getPoolingTimeError(): string {
    const ctrl = this.poolForm.get('poolingTime');
    if (!ctrl || !ctrl.errors) return '';
    if (ctrl.hasError('required')) return 'Pooling time is required';
    if (ctrl.hasError('invalidFormat')) return 'Invalid format. Use DD-MMM-YYYY HH:mm';
    if (ctrl.hasError('invalidDateTime')) return 'Invalid date or time value';
    if (ctrl.hasError('midnightNotAllowed')) return 'Time cannot be exactly midnight (00:00)';
    if (ctrl.hasError('poolingTimeFuture')) return 'Pooling time cannot be in the future';
    if (ctrl.hasError('poolingTimeRange')) return 'Pooling time must be within the last 3 days';
    return '';
  }

  getFreezeTimeError(): string {
    const ctrl = this.poolForm.get('freezeTime');
    if (!ctrl || !ctrl.errors) return '';
    if (ctrl.hasError('invalidFormat')) return 'Invalid format. Use DD-MMM-YYYY HH:mm';
    if (ctrl.hasError('invalidDateTime')) return 'Invalid date or time value';
    if (ctrl.hasError('freezeBeforePool')) return 'Freeze time cannot be before pooling time';
    return '';
  }

  private dateTimeFormatValidator(control: any): { [key: string]: boolean } | null {
    const value = control.value as string;
    if (!value || value.trim() === '') return null;

    const regex = /^(\d{2})-([A-Za-z]{3})-(\d{4})\s(\d{2}):(\d{2})$/;
    const match = value.match(regex);
    if (!match) return { invalidFormat: true };

    const [, day, monthStr, year, hours, minutes] = match;
    const validMonths = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    if (!validMonths.includes(monthStr.toUpperCase())) return { invalidDateTime: true };

    const normalizedValue = `${day}-${monthStr.toUpperCase()}-${year} ${hours}:${minutes}`;
    const parsed = moment(normalizedValue, 'DD-MMM-YYYY HH:mm', true);
    if (!parsed.isValid()) return { invalidDateTime: true };

    const hoursNum = parseInt(hours, 10);
    const minutesNum = parseInt(minutes, 10);
    if (hoursNum < 0 || hoursNum > 23 || minutesNum < 0 || minutesNum > 59) return { invalidDateTime: true };

    if (value !== normalizedValue) {
      setTimeout(() => {
        control.setValue(normalizedValue, { emitEvent: false });
      });
    }

    return null;
  }

  private parseDateTimeString(value: string): moment.Moment | null {
    if (!value) return null;
    const parsed = moment(value, 'DD-MMM-YYYY HH:mm', true);
    return parsed.isValid() ? parsed : null;
  }

  private formatDateTimeForInput(dateTime: string | null | undefined): string {
    if (!dateTime) return '';
    const m = moment(dateTime);
    if (!m.isValid()) return '';
    const formatted = m.format('DD-MMM-YYYY HH:mm');
    const parts = formatted.split('-');
    if (parts.length === 3) {
      parts[1] = parts[1].toUpperCase();
      return parts.join('-');
    }
    return formatted.toUpperCase();
  }

  private getChapterNow(): moment.Moment {
    const tz = this.headerService.chapterTimeZone();
    if (!tz || tz === 'UTC') return moment();
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
      });
      const parts = formatter.formatToParts(new Date());
      const get = (t: string) => parseInt(parts.find(p => p.type === t)!.value, 10);
      return moment([get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second')]);
    } catch {
      return moment();
    }
  }

  private autoPopulatePoolingTime(): void {
    const poolingTimeCtrl = this.poolForm.get('poolingTime');
    if (poolingTimeCtrl && !poolingTimeCtrl.value) {
      const chapterNow = this.getChapterNow();
      const formatted = chapterNow.format('DD-MMM-YYYY HH:mm').replace(/-([a-z]{3})-/i, (_, m) => `-${m.toUpperCase()}-`);
      poolingTimeCtrl.setValue(formatted);
      poolingTimeCtrl.markAsTouched();
    }
  }

  private loadLookups(): void {
    this.service
      .getValidProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.validProducts.set(products);
          this.filteredProducts.set(products);
        },
        error: (error) => this.handleError(error, 'Error loading valid products'),
      });

    this.service
      .getValidAbo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (aboList) => {
          this.validAbo.set(aboList);
          this.filteredAbo.set(aboList);
        },
        error: (error) => this.handleError(error, 'Error loading valid ABO'),
      });

    this.service
      .getValidCatalogs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (catalogs) => {
          this.validCatalogs.set(catalogs);
          this.filteredCatalogs.set(catalogs);
        },
        error: (error) => this.handleError(error, 'Error loading valid catalogs'),
      });
  }

  get attributes(): FormArray {
    return this.poolForm.get('attributes') as FormArray;
  }

  addAttribute(): void {
    const attributeGroup = this.fb.group({
      attributeGroup: [''],
      attributeCode: [''],
    });
    this.attributes.push(attributeGroup);
  }

  removeAttribute(index: number): void {
    this.attributes.removeAt(index);
    const codesMap = new Map(this.attribCodesByIndex());
    codesMap.delete(index);
    const reindexed = new Map<number, AttributeLookup[]>();
    let newIdx = 0;
    for (const [key, val] of codesMap) {
      reindexed.set(key < index ? key : newIdx, val);
      newIdx++;
    }
    this.attribCodesByIndex.set(reindexed);

    const filteredMap = new Map(this.filteredAttribCodesByIndex());
    filteredMap.delete(index);
    const reindexedFiltered = new Map<number, AttributeLookup[]>();
    let newFIdx = 0;
    for (const [key, val] of filteredMap) {
      reindexedFiltered.set(key < index ? key : newFIdx, val);
      newFIdx++;
    }
    this.filteredAttribCodesByIndex.set(reindexedFiltered);

    this.attribCodeSearchControls.delete(index);
    const reindexedCtrls = new Map<number, FormControl>();
    let ctrlIdx = 0;
    for (const [key, val] of this.attribCodeSearchControls) {
      reindexedCtrls.set(key < index ? key : ctrlIdx, val);
      ctrlIdx++;
    }
    this.attribCodeSearchControls = reindexedCtrls;
  }

  private loadAttribGroups(productCode: string): void {
    this.service.getAttribGroups(productCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (groups) => {
          this.validAttribGroups.set(groups);
          this.filteredAttribGroups.set(groups);
          this.attribGroupSearchControl.setValue('', { emitEvent: false });
        },
        error: () => {
          this.validAttribGroups.set([]);
          this.filteredAttribGroups.set([]);
        },
      });
  }

  private loadWeightInfo(productCode: string): void {
    this.service.getWeightInfo(productCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (info) => {
          this.weightRequired.set(info.weightRequired);
          this.specificGravity.set(info.specificGravity);
          this.freezeTimeRequired.set(info.freezeTimeRequired || 'N');
          const weightCtrl = this.poolForm.get('poolWeight');
          if (info.weightRequired === 'Y') {
            weightCtrl?.setValidators([Validators.required, Validators.min(1), Validators.max(999.99)]);
          } else {
            weightCtrl?.setValidators([Validators.min(1), Validators.max(999.99)]);
          }
          weightCtrl?.updateValueAndValidity();

          const freezeCtrl = this.poolForm.get('freezeTime');
          if (info.freezeTimeRequired === 'Y') {
            freezeCtrl?.setValidators([Validators.required]);
          } else {
            freezeCtrl?.setValue('', { emitEvent: false });
            freezeCtrl?.clearValidators();
          }
          freezeCtrl?.updateValueAndValidity();
        },
        error: () => this.resetWeightState(),
      });
  }

  private loadProductExpiry(productCode: string): void {
    const poolingTimeVal = this.poolForm.get('poolingTime')?.value;
    if (!poolingTimeVal) return;

    const poolDate = this.parseDateTimeString(poolingTimeVal);
    if (!poolDate) return;

    this.service.calculateExpiry(productCode, poolDate.format('YYYY-MM-DDTHH:mm:ss'))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.expiryDate) {
            const expiry = moment(result.expiryDate);
            this.productExpiryDate.set(expiry);
            this.recalculatePoolExpiry();
          } else {
            this.productExpiryDate.set(null);
          }
        },
        error: () => this.productExpiryDate.set(null),
      });
  }

  private resetWeightState(): void {
    this.weightRequired.set('N');
    this.specificGravity.set(null);
    this.freezeTimeRequired.set('N');
    const weightCtrl = this.poolForm.get('poolWeight');
    weightCtrl?.setValidators([Validators.min(1), Validators.max(999.99)]);
    weightCtrl?.updateValueAndValidity();
  }

  onAttribGroupChange(index: number): void {
    const group = this.attributes.at(index)?.get('attributeGroup')?.value;
    const productCode = this.poolForm.get('poolProductCode')?.value;
    this.attributes.at(index)?.patchValue({ attributeCode: '' }, { emitEvent: false });

    const searchCtrl = this.attribCodeSearchControls.get(index);
    if (searchCtrl) {
      searchCtrl.setValue('', { emitEvent: false });
    }

    if (group && productCode) {
      this.service.getAttribCodes(productCode, group)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (codes) => {
            const codesMap = new Map(this.attribCodesByIndex());
            codesMap.set(index, codes);
            this.attribCodesByIndex.set(codesMap);
            const filteredMap = new Map(this.filteredAttribCodesByIndex());
            filteredMap.set(index, codes);
            this.filteredAttribCodesByIndex.set(filteredMap);
          },
          error: () => {
            const codesMap = new Map(this.attribCodesByIndex());
            codesMap.set(index, []);
            this.attribCodesByIndex.set(codesMap);
            const filteredMap = new Map(this.filteredAttribCodesByIndex());
            filteredMap.set(index, []);
            this.filteredAttribCodesByIndex.set(filteredMap);
          },
        });
    }
  }

  getAttribCodesForRow(index: number): AttributeLookup[] {
    return this.attribCodesByIndex().get(index) || [];
  }

  hasDuplicateAttributes(): boolean {
    const attrs = this.attributes.value as { attributeGroup: string; attributeCode: string }[];
    const seen = new Set<string>();
    for (const a of attrs) {
      if (a.attributeGroup && a.attributeCode) {
        const key = `${a.attributeGroup}|${a.attributeCode}`;
        if (seen.has(key)) return true;
        seen.add(key);
      }
    }
    return false;
  }

  isPoolIsbt(): boolean {
    return this.poolCodeScheme() === 'I';
  }

  private getExpectedAboLabel(): string {
    const poolAbo = this.poolForm.get('pooledAboRh')?.value;
    if (!poolAbo) return '';
    const match = this.validAbo().find((a) => a.code === poolAbo);
    return match?.label || '';
  }

  hasCmvNegativeAttribute(): boolean {
    const attrs = this.attributes?.value as { attributeGroup: string; attributeCode: string }[];
    if (!attrs || attrs.length === 0) return false;
    return attrs.some(a =>
      a.attributeGroup?.toUpperCase() === 'CMV' ||
      this.CMV_ATTRIBUTE_CODES.includes(a.attributeCode?.toUpperCase())
    );
  }

  onPoolIdPostValidate(event: UnitIdPostValidateEvent): void {
    const poolId = event.data.parsedUnitId;
    this.poolForm.patchValue({ poolId }, { emitEvent: false });

    this.service
      .getPoolById(poolId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (!response.success || !response.data) {
            this.autoPopulatePoolingTime();
            this.snackBar.open(response.message || 'Pool not found. Enter details to create a new pool.', 'Close', {
              duration: 5000, horizontalPosition: 'end', verticalPosition: 'top',
              panelClass: [response.success ? 'info-snackbar' : 'error-snackbar'],
            });
            event.confirm();
            return;
          }
          const pool = response.data;
          this.currentPool.set(pool);
          this.weightRequired.set(response.weightRequired || 'N');
          this.specificGravity.set(response.specificGravity ?? null);
          this.freezeTimeRequired.set(response.freezeTimeRequired || 'N');
          this.patchPoolForm(pool);
          this.loadUnitsInPool(poolId);

          if (pool.productCode) {
            this.loadAttribGroups(pool.productCode);
          }

          if (response.attributes?.length) {
            while (this.attributes.length > 0) {
              this.attributes.removeAt(0);
            }
            response.attributes.forEach((attr, idx) => {
              this.addAttribute();
              this.attributes.at(idx).patchValue({
                attributeGroup: attr.attribGroup,
                attributeCode: attr.attribCode,
              });
              if (attr.attribGroup && pool.productCode) {
                this.service.getAttribCodes(pool.productCode, attr.attribGroup)
                  .pipe(takeUntil(this.destroy$))
                  .subscribe((codes) => {
                    const codesMap = new Map(this.attribCodesByIndex());
                    codesMap.set(idx, codes);
                    this.attribCodesByIndex.set(codesMap);
                    const filteredMap = new Map(this.filteredAttribCodesByIndex());
                    filteredMap.set(idx, codes);
                    this.filteredAttribCodesByIndex.set(filteredMap);
                  });
              }
            });
          }

          event.confirm();
        },
        error: (error) => {
          const body = error?.error;
          event.reject(body?.message || body?.errorResponse?.error || 'Error loading pool');
        },
      });
  }

  onPoolIdValidated(data: UnitIdValidationData): void {
    this.poolCodeScheme.set(data.codeScheme);
    this.poolForm.patchValue({ poolUnitId: data.parsedUnitId }, { emitEvent: false });
  }

  onPoolIdCleared(): void {
    this.clearAll();
  }

  onComponentUnitValidated(data: UnitIdValidationData): void {
    const unitId = data.parsedUnitId;
    if (!unitId) return;
    this.productLineForm.patchValue({ productCode: '', description: '', expirationDate: '', systemLabelDecision: '' });
    this.unitProductSearchControl.setValue('', { emitEvent: false });
    this.service.getValidProductsForUnit(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.unitProducts.set(products);
          this.filteredUnitProducts.set(products);
        },
        error: () => {
          this.unitProducts.set([]);
          this.filteredUnitProducts.set([]);
        },
      });
  }

  onComponentUnitCleared(): void {
    this.productLineForm.patchValue({ productCode: '', description: '', expirationDate: '', systemLabelDecision: '' });
    this.unitProducts.set([]);
    this.filteredUnitProducts.set([]);
    this.unitProductSearchControl.setValue('', { emitEvent: false });
  }

  onUnitProductSelected(code: string): void {
    const product = this.unitProducts().find((p) => p.code === code);
    if (!product) return;
    const expiryFormatted = product.expiryDate
      ? moment(product.expiryDate).format('DD-MMM-YYYY HH:mm').replace(/-([a-z]{3})-/i, (_, m) => `-${m.toUpperCase()}-`)
      : '';
    this.productLineForm.patchValue({
      productCode: code,
      description: product.description || '',
      expirationDate: expiryFormatted,
      systemLabelDecision: product.sldDescription || product.systemLabelDecision || '',
    });
  }

  onUnitProductScanBlur(trigger: MatAutocompleteTrigger): void {
    if (trigger.panelOpen) return;
    const scanValue = this.productLineForm.get('productCode')?.value?.trim();
    if (!scanValue) {
      this.clearFieldError('unitProductCode');
      this.productLineForm.patchValue({ description: '' }, { emitEvent: false });
      return;
    }
    const matched = this.unitProducts().find((p) => p.code === scanValue);
    if (matched) {
      const expiryFormatted = matched.expiryDate
        ? moment(matched.expiryDate).format('DD-MMM-YYYY HH:mm').replace(/-([a-z]{3})-/i, (_, m) => `-${m.toUpperCase()}-`)
        : '';
      this.productLineForm.patchValue({
        description: matched.description || '',
        expirationDate: expiryFormatted,
        systemLabelDecision: matched.sldDescription || matched.systemLabelDecision || '',
      }, { emitEvent: false });
      this.clearFieldError('unitProductCode');
      return;
    }
    const codeScheme = this.poolCodeScheme() || 'I';
    this.clearFieldError('unitProductCode');
    this.fieldProcessing['unitProductCode'] = true;
    this.labelScanService.validateProductScan(scanValue, codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.fieldProcessing['unitProductCode'] = false;
          if (res.success && res.item?.isValid && res.item.productCode) {
            const parsed = res.item.productCode;
            const inList = this.unitProducts().find((p) => p.code === parsed);
            if (inList) {
              const expiryFormatted = inList.expiryDate
                ? moment(inList.expiryDate).format('DD-MMM-YYYY HH:mm').replace(/-([a-z]{3})-/i, (_, m) => `-${m.toUpperCase()}-`)
                : '';
              this.productLineForm.patchValue({
                productCode: parsed,
                description: inList.description || '',
                expirationDate: expiryFormatted,
                systemLabelDecision: inList.sldDescription || inList.systemLabelDecision || '',
              }, { emitEvent: false });
              this.clearFieldError('unitProductCode');
            } else {
              this.productLineForm.patchValue({ productCode: parsed, description: '' }, { emitEvent: false });
              this.setFieldError('unitProductCode', 'Product not available for this unit');
            }
          } else {
            this.setFieldError('unitProductCode',
              res.message || 'Invalid product scan');
          }
        },
        error: (err) => {
          this.fieldProcessing['unitProductCode'] = false;
          const body = err?.error;
          this.setFieldError('unitProductCode',
            body?.errorResponse?.error || body?.message || 'Failed to validate product scan.');
        },
      });
  }

  private patchPoolForm(pool: PoolHeader): void {
    this.poolForm.patchValue({
      poolId: pool.poolId,
      patientId: pool.patientId,
      poolUnitId: pool.poolId,
      patientLastName: pool.patientLastName,
      patientFirstName: pool.patientFirstName,
      facility: pool.facility,
      numberOfUnits: pool.numberOfUnits,
      poolProductCode: pool.productCode,
      productDescription: pool.productDescription,
      catalogNumber: pool.catalogNumber,
      lotNumber: pool.lotNumber,
      pooledAboRh: pool.pooledAboRh,
      aboDescription: pool.aboDescription,
      poolingTime: this.formatDateTimeForInput(pool.poolDats),
      freezeTime: '',
      expirationDate: this.formatDateTimeForInput(pool.poolExpiryDats),
      poolWeight: pool.poolWeight ?? '',
    });

    if (pool.poolExpiryDats) {
      this.productExpiryDate.set(moment(pool.poolExpiryDats));
    }

    this.catalogSelected.set(!!pool.catalogNumber);
    if (pool.catalogNumber) {
      this.loadLotsForCatalog(pool.catalogNumber);
    }
  }

  private loadUnitsInPool(poolId: string): void {
    this.service
      .getUnitsInPool(poolId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (units) => this.unitsInPool.set(
          units.map((u, i) => ({ ...u, sequenceNumber: i + 1 }))
        ),
        error: (error) => this.handleError(error, 'Error loading units in pool'),
      });
  }

  clearAllProductLine(): void {
    this.componentUnitIdField?.clear();
    this.productLineForm.reset();
    this.unitProducts.set([]);
    this.filteredUnitProducts.set([]);
    this.unitProductSearchControl.setValue('', { emitEvent: false });
    this.clearFieldError('unitProductCode');
  }

  onRowAction(event: TableRowActionEvent<PoolUnit>): void {
    if (event.action === 'delete') {
      this.removeUnitFromPool(event.row);
    }
  }

  private removeUnitFromPool(unit: PoolUnit): void {
    const poolId = this.poolForm.get('poolId')?.value;
    if (!poolId) return;

    if (this.hasPool()) {
      this.loading.set(true);
      this.service.removeUnitFromPool(poolId, {
        unitId: unit.unitId,
        productCode: unit.productCode,
        componentPrefix: unit.componentPrefix,
      }).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          const units = this.unitsInPool()
            .filter(u => u.unitId !== unit.unitId || u.productCode !== unit.productCode)
            .map((u, i) => ({ ...u, sequenceNumber: i + 1 }));
          this.unitsInPool.set(units);
          this.loading.set(false);
          // P0-5: Recalculate pool expiry after unit removal
          this.recalculatePoolExpiry();
          // Clear weight/volume since composition changed (legacy behavior)
          this.poolForm.patchValue({ poolWeight: '' }, { emitEvent: false });
        },
        error: (error) => {
          this.loading.set(false);
          this.handleError(error, 'Error removing unit from pool');
        },
      });
    } else {
      const units = this.unitsInPool()
        .filter(u => u.unitId !== unit.unitId || u.productCode !== unit.productCode)
        .map((u, i) => ({ ...u, sequenceNumber: i + 1 }));
      this.unitsInPool.set(units);
      // P0-5: Recalculate pool expiry after unit removal
      this.recalculatePoolExpiry();
      this.poolForm.patchValue({ poolWeight: '' }, { emitEvent: false });
    }
  }

  removeUnit(index: number): void {
    const unit = this.unitsInPool()[index];
    if (unit) {
      this.removeUnitFromPool(unit);
    }
  }

  clearAll(): void {
    if (this.clearing) return;
    this.clearing = true;
    this.poolIdField?.clear();
    this.componentUnitIdField?.clear();
    this.poolForm.reset();
    this.productLineForm.reset();
    this.currentPool.set(null);
    this.unitsInPool.set([]);
    this.poolCodeScheme.set(null);
    this.productExpiryDate.set(null);
    this.resetWeightState();
    this.validAttribGroups.set([]);
    this.filteredAttribGroups.set([]);
    this.attribCodesByIndex.set(new Map());
    this.filteredAttribCodesByIndex.set(new Map());
    this.attribCodeSearchControls.clear();
    while (this.attributes.length > 0) {
      this.attributes.removeAt(0);
    }
    this.fieldErrors = {};
    this.fieldProcessing = {};
    this.catalogSelected.set(false);
    this.productCodeSearchControl.setValue('', { emitEvent: false });
    this.aboSearchControl.setValue('', { emitEvent: false });
    this.attribGroupSearchControl.setValue('', { emitEvent: false });
    this.unitProductSearchControl.setValue('', { emitEvent: false });
    this.filteredProducts.set([...this.validProducts()]);
    this.filteredCatalogs.set([...this.validCatalogs()]);
    this.filteredLots.set([...this.validLots()]);
    this.filteredAbo.set([...this.validAbo()]);
    this.unitProducts.set([]);
    this.filteredUnitProducts.set([]);
    this.clearing = false;
  }

  onSave(): void {
    this.validatePoolingTime();
    this.validateFreezeTime();

    if (this.hasDuplicateAttributes()) {
      this.snackBar.open('Duplicate attribute group/code pairs are not allowed', 'Close', {
        duration: 3000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'],
      });
      return;
    }

    if (!this.poolIdField?.isValid) {
      this.snackBar.open('Please enter and validate a Pool ID first', 'Close', {
        duration: 3000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'],
      });
      return;
    }

    if (this.poolForm.invalid) {
      this.poolForm.markAllAsTouched();
      this.snackBar.open('Please correct the errors before saving', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar'],
      });
      return;
    }

    if (this.unitsInPool().length === 0) {
      this.snackBar.open('At least one unit must be added before saving', 'Close', {
        duration: 3000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'],
      });
      return;
    }

    if (this.poolForm.get('poolingTime')?.errors || this.poolForm.get('freezeTime')?.errors) {
      this.snackBar.open('Please correct date errors before saving', 'Close', {
        duration: 3000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'],
      });
      return;
    }

    const dialogRef = this.dialog.open(LabelVerificationDialogComponent, {
      width: '50vw',
      height: 'calc(100vh - 64px)',
      maxWidth: '90vw',
      disableClose: true,
      panelClass: 'right-side-dialog',
      position: { right: '0', top: '64px' },
      data: {
        poolId: this.poolForm.get('poolId')?.value || '',
        productCode: this.poolForm.get('poolProductCode')?.value || '',
        pooledAboRh: this.poolForm.get('pooledAboRh')?.value || '',
        expectedAboLabel: this.getExpectedAboLabel(),
        expiryDate: this.poolForm.get('expirationDate')?.value || '',
        isIsbt: this.isPoolIsbt(),
        hasCmvNegative: this.hasCmvNegativeAttribute(),
        aboOptions: this.validAbo(),
      } as LabelVerificationDialogData,
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (result) {
        this.onVerified(result);
      }
    });
  }

  onReprint(): void {
    const poolId = this.poolForm.get('poolId')?.value;
    const productCode = this.poolForm.get('poolProductCode')?.value;

    if (!poolId || !productCode || !this.hasPool()) {
      this.snackBar.open('Pool ID and Product Code are required for reprint', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar'],
      });
      return;
    }

    this.snackBar.open('Label reprint has been queued.', 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['info-snackbar'],
    });
  }

  // ── Catalog/Lot Scan Handlers ──

  onCatalogScanBlur(trigger: MatAutocompleteTrigger): void {
    if (trigger.panelOpen) return;

    setTimeout(() => {
      if (this.catalogOptionJustSelected) {
        this.catalogOptionJustSelected = false;
        return;
      }

      const scanValue = this.poolForm.get('catalogNumber')?.value?.trim();
      if (!scanValue) {
        this.clearFieldError('catalogNumber');
        this.catalogSelected.set(false);
        this.validLots.set([]);
        this.filteredLots.set([]);
        return;
      }

      const exactMatch = this.validCatalogs().find((c) => c.code === scanValue);
      if (exactMatch) {
        this.catalogSelected.set(true);
        this.loadLotsForCatalog(scanValue);
        return;
      }

    this.clearFieldError('catalogNumber');
    this.fieldProcessing['catalogNumber'] = true;

    this.labelScanService.validateCatalogScan(scanValue, 'CPIPOOL2')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.fieldProcessing['catalogNumber'] = false;
          if (res.success && res.item) {
            this.poolForm.patchValue({ catalogNumber: res.item.catalogNumber || '' }, { emitEvent: false });
            this.catalogSelected.set(!!res.item.catalogNumber);
            this.loadLotsForCatalog(res.item.catalogNumber || '');

            if (res.item.lotScanPortion) {
              this.validateAndSetLotFromCombinedScan(res.item.lotScanPortion);
            } else if (res.item.autoPopulatedLot) {
              this.poolForm.patchValue({ lotNumber: res.item.autoPopulatedLot }, { emitEvent: false });
            }
          } else {
            this.setFieldError('catalogNumber',
              res.errorResponse?.error || res.message || 'Invalid catalog number.');
          }
        },
        error: (err) => {
          this.fieldProcessing['catalogNumber'] = false;
          const body = err?.error;
          this.setFieldError('catalogNumber',
            body?.errorResponse?.error || body?.message || 'Failed to validate catalog scan.');
        },
      });
    });
  }

  private validateAndSetLotFromCombinedScan(lotPortion: string): void {
    const catalogNumber = this.poolForm.get('catalogNumber')?.value;
    if (!catalogNumber) return;

    this.fieldProcessing['lotNumber'] = true;
    this.clearFieldError('lotNumber');

    this.labelScanService.validateLotScan('&)' + lotPortion, catalogNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.fieldProcessing['lotNumber'] = false;
          if (res.success && res.item) {
            this.poolForm.patchValue({ lotNumber: res.item.lotNumber || '' }, { emitEvent: false });
          } else {
            this.setFieldError('lotNumber',
              res.errorResponse?.error || res.message || 'Lot from combined scan not valid.');
          }
        },
        error: (err) => {
          this.fieldProcessing['lotNumber'] = false;
          const body = err?.error;
          this.setFieldError('lotNumber',
            body?.errorResponse?.error || body?.message || 'Failed to validate lot from combined scan.');
        },
      });
  }

  onCatalogSelected(value: string): void {
    this.catalogOptionJustSelected = true;
    this.clearFieldError('catalogNumber');
    this.poolForm.patchValue({ catalogNumber: value, lotNumber: '' }, { emitEvent: false });
    this.catalogSelected.set(!!value);
    this.loadLotsForCatalog(value);
  }

  private loadLotsForCatalog(catalogNumber: string): void {
    this.validLots.set([]);
    this.filteredLots.set([]);
    if (!catalogNumber) return;

    this.service.getValidLots(catalogNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lots) => {
          this.validLots.set(lots);
          this.filteredLots.set(lots);
        },
        error: (error) => this.handleError(error, 'Error loading lots for catalog'),
      });
  }

  onLotScanBlur(trigger: MatAutocompleteTrigger): void {
    if (trigger.panelOpen) return;

    setTimeout(() => {
      if (this.lotOptionJustSelected) {
        this.lotOptionJustSelected = false;
        return;
      }

      const scanValue = this.poolForm.get('lotNumber')?.value?.trim();
      if (!scanValue) {
        this.clearFieldError('lotNumber');
        return;
      }

      const catalogNumber = this.poolForm.get('catalogNumber')?.value;
      if (!catalogNumber) {
        this.setFieldError('lotNumber', 'Select a catalog number first.');
        return;
      }

      const exactMatch = this.validLots().find((l) => l.code === scanValue);
      if (exactMatch) return;

      this.clearFieldError('lotNumber');
      this.fieldProcessing['lotNumber'] = true;

      this.labelScanService.validateLotScan(scanValue, catalogNumber)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.fieldProcessing['lotNumber'] = false;
            if (res.success && res.item) {
              this.poolForm.patchValue({ lotNumber: res.item.lotNumber || '' }, { emitEvent: false });
            } else {
              this.setFieldError('lotNumber',
                res.errorResponse?.error || res.message || 'Invalid lot number.');
            }
          },
          error: (err) => {
            this.fieldProcessing['lotNumber'] = false;
            const body = err?.error;
            this.setFieldError('lotNumber',
              body?.errorResponse?.error || body?.message || 'Failed to validate lot scan.');
          },
        });
    });
  }

  onLotSelected(value: string): void {
    this.lotOptionJustSelected = true;
    this.clearFieldError('lotNumber');
    this.poolForm.patchValue({ lotNumber: value }, { emitEvent: false });
  }

  private setFieldError(controlName: string, message: string): void {
    this.fieldErrors[controlName] = message;
    const control = this.poolForm.get(controlName) || this.productLineForm.get(controlName === 'unitProductCode' ? 'productCode' : controlName);
    if (control) {
      control.setErrors({ serverError: true });
      control.markAsTouched();
    }
  }

  private clearFieldError(controlName: string): void {
    this.fieldErrors[controlName] = '';
    const control = this.poolForm.get(controlName) || this.productLineForm.get(controlName === 'unitProductCode' ? 'productCode' : controlName);
    if (control) {
      control.setErrors(null);
    }
  }

  onDelete(): void {
    const poolId = this.poolForm.get('poolId')?.value;
    if (!poolId || !this.hasPool()) {
      return;
    }

    this.router.navigate(
      ['/laboratory-functions/component-production/delete-pooled-components'],
      { queryParams: { poolId } }
    );
  }

  onAddUnit(): void {
    if (this.loading()) return;

    const unitId = this.componentUnitIdField?.parsedUnitId;
    const productCode = this.productLineForm.get('productCode')?.value?.trim();
    if (!unitId || !this.componentUnitIdField?.isValid) {
      this.snackBar.open('Please enter and validate a Unit ID first', 'Close', {
        duration: 3000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'],
      });
      return;
    }
    if (!productCode) {
      this.snackBar.open('Product Code is required', 'Close', {
        duration: 3000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'],
      });
      return;
    }

    const poolId = this.poolForm.get('poolId')?.value;
    if (!poolId) return;

    const alreadyAdded = this.unitsInPool().some(
      u => u.unitId === unitId && u.productCode === productCode,
    );
    if (alreadyAdded) {
      this.snackBar.open('This unit has already been added to the pool', 'Close', {
        duration: 3000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'],
      });
      return;
    }

    // P0-4: Auto-derive componentPrefix for ISBT units (positions 7-8 of product code)
    let componentPrefix: string | undefined;
    if (unitId.length === 13 && productCode.length >= 8) {
      componentPrefix = productCode.substring(6, 8);
    }

    const poolingTimeVal = this.poolForm.get('poolingTime')?.value;
    const poolDats = poolingTimeVal ? this.parseDateTimeString(poolingTimeVal)?.format('YYYY-MM-DDTHH:mm:ss') : undefined;

    this.loading.set(true);
    this.service.validateUnit(poolId, { unitId, productCode, componentPrefix, poolDats })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (validatedUnit) => {
          this.loading.set(false);

          const unitExpiry = validatedUnit.expiryDate ? new Date(validatedUnit.expiryDate) : null;
          const poolExpiry = validatedUnit.poolExpiryDate
            ? new Date(validatedUnit.poolExpiryDate)
            : this.poolForm.get('expirationDate')?.value
              ? new Date(this.poolForm.get('expirationDate')!.value)
              : null;

          if (unitExpiry && poolExpiry && unitExpiry < poolExpiry) {
            this.showExpiryWarningDialog(validatedUnit, productCode);
          } else {
            this.addUnitToPool(validatedUnit, productCode);
          }
        },
        error: (error) => {
          this.loading.set(false);
          this.handleError(error, 'Unit validation failed');
        },
      });
  }

  private showExpiryWarningDialog(validatedUnit: UnitValidationResponse, productCode: string): void {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '450px',
      maxWidth: '90vw',
      disableClose: true,
      data: {
        title: 'Warning',
        message: 'Product expiration precedes the Pool expiration date/time',
        confirmText: 'OK',
        cancelText: 'CANCEL',
      } as ConfirmActionDialogData,
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (result === true) {
        this.addUnitToPool(validatedUnit, productCode);
      }
    });
  }

  private addUnitToPool(validatedUnit: UnitValidationResponse, productCode: string): void {
    const product = this.unitProducts().find(p => p.code === (validatedUnit.productCode || productCode));
    const units = [...this.unitsInPool(), {
      unitId: validatedUnit.unitId,
      productCode: validatedUnit.productCode || productCode,
      productDescription: product?.description || '',
      componentPrefix: validatedUnit.componentPrefix,
      expiryDate: validatedUnit.expiryDate,
      systemLabelDecision: validatedUnit.systemLabelDecision,
      sldDescription: validatedUnit.sldDescription,
      sequenceNumber: this.unitsInPool().length + 1,
    } as PoolUnit & { sequenceNumber: number }];
    this.unitsInPool.set(units);

    // P0-5: Recalculate pool expiry as minimum across all unit expiry dates
    this.recalculatePoolExpiry();

    this.clearAllProductLine();
  }

  private recalculatePoolExpiry(): void {
    let minExpiry: moment.Moment | null = this.productExpiryDate() ? this.productExpiryDate()!.clone() : null;

    for (const unit of this.unitsInPool()) {
      if (unit.expiryDate) {
        const unitExp = moment(unit.expiryDate);
        if (unitExp.isValid() && (!minExpiry || unitExp.isBefore(minExpiry))) {
          minExpiry = unitExp;
        }
      }
    }

    if (minExpiry) {
      this.poolForm.patchValue({
        expirationDate: this.formatDateTimeForInput(minExpiry.toISOString()),
      }, { emitEvent: false });
    }
  }

  onVerified(verification: LabelVerification): void {
    const formValue = this.poolForm.getRawValue();

    const normalizedVerification: LabelVerification = {
      ...verification,
      scannedUnitId: verification.scannedUnitId?.includes('-')
        ? verification.scannedUnitId.substring(0, verification.scannedUnitId.lastIndexOf('-'))
        : verification.scannedUnitId,
    };

    const poolRequest: CreatePoolRequest = {
      poolId: formValue.poolId,
      patientId: formValue.patientId,
      patientFirstName: formValue.patientFirstName,
      patientLastName: formValue.patientLastName,
      facility: formValue.facility,
      productCode: formValue.poolProductCode,
      bagId: '99',
      catalogNumber: formValue.catalogNumber,
      lotNumber: formValue.lotNumber,
      pooledAboRh: formValue.pooledAboRh,
      poolDats: formValue.poolingTime ? this.parseDateTimeString(formValue.poolingTime)?.format('YYYY-MM-DDTHH:mm:ss') : undefined,
      poolExpiryDats: formValue.expirationDate ? this.parseDateTimeString(formValue.expirationDate)?.format('YYYY-MM-DDTHH:mm:ss') : undefined,
      poolWeight: formValue.poolWeight ? parseFloat(formValue.poolWeight) : undefined,
      numberOfUnits: formValue.numberOfUnits ? parseInt(formValue.numberOfUnits, 10) : undefined,
    };

    const commitRequest: CommitPoolRequest = {
      units: this.unitsInPool().map(u => ({
        unitId: u.unitId,
        productCode: u.productCode,
        componentPrefix: u.componentPrefix,
      })),
      attributes: this.attributes.value.map((a: { attributeGroup: string; attributeCode: string }) => ({
        attribGroup: a.attributeGroup,
        attribCode: a.attributeCode,
      })).filter((a: { attribGroup: string; attribCode: string }) => a.attribGroup && a.attribCode),
      expectedUnitCount: formValue.numberOfUnits ? parseInt(formValue.numberOfUnits, 10) : undefined,
      poolWeight: formValue.poolWeight ? parseFloat(formValue.poolWeight) : undefined,
      freezeTime: formValue.freezeTime ? this.parseDateTimeString(formValue.freezeTime)?.format('YYYY-MM-DDTHH:mm:ss') : undefined,
      verification: normalizedVerification,
    };

    this.loading.set(true);

    const saveObservable = this.hasPool()
      ? this.service.updatePool(formValue.poolId, poolRequest)
      : this.service.createPool(poolRequest);

    saveObservable.pipe(
      switchMap((pool) => {
        this.currentPool.set(pool);
        return this.service.commitPool(formValue.poolId, commitRequest);
      }),
      takeUntil(this.destroy$),
    ).subscribe({
      next: (response) => {
        this.loading.set(false);
        const interMsg = response.interdictionsPlaced?.length
          ? ` Interdictions placed: ${response.interdictionsPlaced.join(', ')}.`
          : '';
        this.snackBar.open(
          `Pool saved and committed successfully. SLD: ${response.systemLabelDecision}.${interMsg}`,
          'DISMISS',
          { duration: 8000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['success-snackbar'] }
        );
        this.clearAll();
      },
      error: (error) => {
        this.loading.set(false);
        this.handleError(error, 'Error saving pool');
      },
    });
  }

  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  onPasteNumbers(event: ClipboardEvent, controlName: string): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const numericOnly = pastedText.replace(/[^0-9]/g, '');
    this.poolForm.get(controlName)?.setValue(numericOnly);
  }

  private handleError(error: unknown, defaultMessage: string): void {
    let errorMessage = defaultMessage;

    if (error && typeof error === 'object') {
      const err = error as { error?: { message?: string; errorResponse?: { error?: string } } };
      if (err.error?.message) {
        errorMessage = err.error.message;
      } else if (err.error?.errorResponse?.error) {
        errorMessage = err.error.errorResponse.error;
      }
    }

    this.snackBar.open(errorMessage, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }

  get poolWeightDisplay(): string {
    const weight = this.poolForm.get('poolWeight')?.value;
    return weight ? weight.toString() : '';
  }

  get volDisplay(): string {
    const weight = this.poolForm.get('poolWeight')?.value;
    const sg = this.specificGravity();
    if (weight && sg && sg > 0) {
      return (weight / sg).toFixed(2);
    }
    if (weight && (!sg || sg <= 0)) {
      return 'N/A';
    }
    return '';
  }

  getRemainingCharacters(controlName: string, maxLength: number): string {
    const value = this.poolForm.get(controlName)?.value || '';
    const remaining = maxLength - value.length;
    return `Characters Remaining: ${remaining}/${maxLength}`;
  }
}
