import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment, { Moment } from 'moment';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, ErrorStateMatcher, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { A11yModule } from '@angular/cdk/a11y';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { HeaderService } from '@shared/services/header.service';

import {
  StandingOrderItemListDto,
  StandingOrderItemDto,
  CreateStandingOrderItemDto,
  UpdateStandingOrderItemDto,
  LovOption,
  SUBSTITUTION_OPTIONS,
  getWeekDayDisplay
} from '../../models/standing-order.model';
import { StandingOrderService } from '../../services/standing-order.service';

@Component({
  selector: 'app-standing-order-item-side-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    A11yModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './standing-order-item-side-panel.html',
  styleUrl: './standing-order-item-side-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StandingOrderItemSidePanelComponent implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() record: StandingOrderItemListDto | null = null;
  @Input() contractId = '';
  @Input() consigneeId = '';
  @Input() weekDay = '';
  @Input() productTypesLookup: LovOption[] = [];

  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<string>();
  @Output() saveAndAddAnother = new EventEmitter<string>();

  private readonly fb = inject(FormBuilder);
  private readonly headerService = inject(HeaderService);
  private readonly service = inject(StandingOrderService);
  private readonly destroy$ = new Subject<void>();

  protected readonly loading = signal(false);
  protected readonly bloodTypes = signal<LovOption[]>([]);
  protected readonly tiers = signal<LovOption[]>([]);
  protected readonly attributeGroups = signal<LovOption[]>([]);
  protected readonly attributeCodes = signal<LovOption[]>([]);

  readonly substitutionOptions = SUBSTITUTION_OPTIONS;
  form!: FormGroup;
  private existingRecord: StandingOrderItemDto | null = null;
  private minDate!: Moment;
  private loadingEditData = false;

  // Searchable dropdown controls
  productTypeSearchCtrl = new FormControl('');
  bloodTypeSearchCtrl = new FormControl('');
  tierSearchCtrl = new FormControl('');
  attribGroupSearchCtrl = new FormControl('');
  attribCodeSearchCtrl = new FormControl('');

  private productTypeSearch = signal('');
  private bloodTypeSearch = signal('');
  private tierSearch = signal('');
  private attribGroupSearch = signal('');
  private attribCodeSearch = signal('');

  readonly filteredProductTypes = computed(() => {
    const s = this.productTypeSearch().toLowerCase();
    const opts = this.productTypesLookup || [];
    return !s ? opts : opts.filter(o =>
      o.code.toLowerCase().includes(s) || o.description.toLowerCase().includes(s));
  });

  readonly filteredBloodTypes = computed(() => {
    const s = this.bloodTypeSearch().toLowerCase();
    const opts = this.bloodTypes();
    return !s ? opts : opts.filter(o =>
      o.code.toLowerCase().includes(s) || o.description.toLowerCase().includes(s));
  });

  readonly filteredTiers = computed(() => {
    const s = this.tierSearch().toLowerCase();
    const opts = this.tiers();
    return !s ? opts : opts.filter(o => o.code.includes(s));
  });

  readonly filteredAttributeGroups = computed(() => {
    const s = this.attribGroupSearch().toLowerCase();
    const opts = this.attributeGroups();
    return !s ? opts : opts.filter(o =>
      o.code.toLowerCase().includes(s) || o.description.toLowerCase().includes(s));
  });

  readonly filteredAttributeCodes = computed(() => {
    const s = this.attribCodeSearch().toLowerCase();
    const opts = this.attributeCodes();
    return !s ? opts : opts.filter(o =>
      o.code.toLowerCase().includes(s) || o.description.toLowerCase().includes(s));
  });

  get isEditMode(): boolean { return this.mode === 'edit'; }

  get panelTitle(): string {
    return this.isEditMode ? 'Edit Previous Product Details' : 'Add New Product Details';
  }

  get lastModifiedDisplay(): string | null {
    if (!this.isEditMode || !this.existingRecord?.lastModifiedDate) return null;
    const tz = this.headerService.chapterTimeZone();
    const m = tz ? moment.utc(this.existingRecord.lastModifiedDate).utcOffset(tz)
                 : moment(this.existingRecord.lastModifiedDate);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : null;
  }

  get productNameDisplay(): string {
    const pt = this.form?.get('productType')?.value;
    if (!pt) return '--';
    const found = (this.productTypesLookup || []).find(o => o.code === pt);
    return found?.description || pt;
  }

  get weekDayDisplay(): string {
    return getWeekDayDisplay(this.weekDay);
  }

  effDateErrorMatcher: ErrorStateMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError()
  );
  termDateErrorMatcher: ErrorStateMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError()
  );

  ngOnInit(): void {
    this.minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
    this.initForm();
    this.setupSearchControls();
    this.setupCascadingDropdowns();
    this.loadAttributeGroups();
    if (this.isEditMode && this.record) {
      this.loadExistingRecord();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['mode'] || changes['record']) && this.form) {
      this.initForm();
      if (this.isEditMode && this.record) {
        this.loadExistingRecord();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.existingRecord = null;
    this.bloodTypes.set([]);
    this.tiers.set([]);
    this.attributeGroups.set([]);
    this.attributeCodes.set([]);

    this.form = this.fb.group({
      productType: [{ value: '', disabled: this.isEditMode }, [Validators.required]],
      bloodType: ['', [Validators.required]],
      tier: ['1'],
      qty: [null, [Validators.required, Validators.min(1)]],
      minQty: [null, [Validators.min(1)]],
      subOk: ['N'],
      attribGroup: [null],
      attribCode: [null],
      effDate: [this.isEditMode ? null : this.minDate.clone(), [Validators.required]],
      termDate: [null]
    }, {
      validators: [
        DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate'),
        this.minQtyValidator
      ]
    });

    if (this.mode === 'add') {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
    } else {
      DateFieldValidationUtility.setupEditModeValidators(this.form);
      const effCtrl = this.form.get('effDate');
      if (effCtrl) {
        effCtrl.enable();
        effCtrl.setValidators([Validators.required]);
        effCtrl.updateValueAndValidity();
      }
    }
  }

  private minQtyValidator(group: AbstractControl): ValidationErrors | null {
    const qty = group.get('qty')?.value;
    const minQty = group.get('minQty')?.value;
    if (qty != null && minQty != null && minQty > qty) {
      return { minQtyExceedsQty: true };
    }
    return null;
  }

  private setupSearchControls(): void {
    this.productTypeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.productTypeSearch.set(v || ''));
    this.bloodTypeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.bloodTypeSearch.set(v || ''));
    this.tierSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.tierSearch.set(v || ''));
    this.attribGroupSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.attribGroupSearch.set(v || ''));
    this.attribCodeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.attribCodeSearch.set(v || ''));
  }

  private setupCascadingDropdowns(): void {
    this.form.get('productType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(productType => {
        if (!this.loadingEditData) {
          this.form.patchValue({ bloodType: '', tier: '1' });
          this.bloodTypes.set([]);
          this.tiers.set([]);
        }

        if (productType) {
          this.service.getBloodTypes(productType)
            .pipe(takeUntil(this.destroy$))
            .subscribe(data => this.bloodTypes.set(data));

          this.service.getTiers(productType)
            .pipe(takeUntil(this.destroy$))
            .subscribe(data => this.tiers.set(data));
        }
      });

    this.form.get('attribGroup')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(attribGroup => {
        if (!this.loadingEditData) {
          this.form.patchValue({ attribCode: null });
          this.attributeCodes.set([]);
        }

        if (attribGroup) {
          this.service.getAttributeCodes(attribGroup)
            .pipe(takeUntil(this.destroy$))
            .subscribe(data => {
              this.attributeCodes.set(data);
              if (!this.loadingEditData && data.length > 0) {
                this.form.patchValue({ attribCode: data[0].code });
              }
            });
        }
      });
  }

  private loadAttributeGroups(): void {
    this.service.getAttributeGroups()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.attributeGroups.set(data));
  }

  private loadExistingRecord(): void {
    if (!this.record) return;
    this.loading.set(true);
    this.loadingEditData = true;

    this.service.getStandingOrderItemById(
      this.contractId, this.consigneeId, this.weekDay, this.record.itemNo
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dto) => {
          if (dto) {
            this.existingRecord = dto;

            this.form.patchValue({
              productType: dto.productType,
              bloodType: dto.bloodType,
              tier: dto.tier?.toString(),
              qty: dto.qty,
              minQty: dto.minQty,
              subOk: dto.subOk || 'N',
              attribGroup: dto.attribGroup || null,
              attribCode: dto.attribCode || null,
              effDate: dto.effDate ? moment(dto.effDate) : null,
              termDate: dto.termDate ? moment(dto.termDate) : null
            });
          }
          this.loadingEditData = false;
          this.loading.set(false);
        },
        error: () => {
          this.loadingEditData = false;
          this.loading.set(false);
        }
      });
  }

  onSave(addAnother: boolean): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const fv = this.form.getRawValue();

    if (this.isEditMode && this.record) {
      const dto: UpdateStandingOrderItemDto = {
        productType: fv.productType,
        bloodType: fv.bloodType,
        tier: fv.tier || '1',
        qty: fv.qty,
        subOk: fv.subOk,
        minQty: fv.minQty,
        attribGroup: fv.attribGroup || undefined,
        attribCode: fv.attribCode || undefined,
        effDate: DateFieldValidationUtility.serializeDateForApi(fv.effDate) ?? undefined,
        termDate: DateFieldValidationUtility.serializeDateForApi(fv.termDate) ?? undefined
      };

      this.service.updateStandingOrderItem(
        this.contractId, this.consigneeId, this.weekDay, this.record.itemNo, dto
      ).pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loading.set(false);
            this.saveSuccess.emit('Product updated successfully');
          },
          error: () => this.loading.set(false)
        });
    } else {
      const dto: CreateStandingOrderItemDto = {
        productType: fv.productType,
        bloodType: fv.bloodType,
        tier: fv.tier || '1',
        qty: fv.qty,
        subOk: fv.subOk,
        minQty: fv.minQty,
        attribGroup: fv.attribGroup || undefined,
        attribCode: fv.attribCode || undefined,
        effDate: DateFieldValidationUtility.serializeDateForApi(fv.effDate) || '',
        termDate: DateFieldValidationUtility.serializeDateForApi(fv.termDate)
      };

      this.service.createStandingOrderItem(
        this.contractId, this.consigneeId, this.weekDay, dto
      ).pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loading.set(false);
            if (addAnother) {
              this.saveAndAddAnother.emit('Product created successfully');
              this.resetFormForAddAnother();
            } else {
              this.saveSuccess.emit('Product created successfully');
            }
          },
          error: () => this.loading.set(false)
        });
    }
  }

  private resetFormForAddAnother(): void {
    this.form.reset({
      productType: '',
      bloodType: '',
      tier: '1',
      qty: null,
      minQty: null,
      subOk: 'N',
      attribGroup: null,
      attribCode: null,
      effDate: this.minDate.clone(),
      termDate: null
    });
    this.bloodTypes.set([]);
    this.tiers.set([]);
    this.attributeCodes.set([]);
    this.form.markAsUntouched();
    this.form.markAsPristine();
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  getEffectiveDateError(): string {
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effDate'), 'Effective Date', 'Termination Date', this.form.errors
    );
  }

  getTerminationDateError(): string {
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('termDate'), 'Termination Date', 'Effective Date', this.form.errors
    );
  }

  getEffectiveDateMin(): Moment | null {
    return this.mode === 'add' ? this.minDate : null;
  }

  getTerminationDateMin(): Moment | null {
    const effValue = this.form.get('effDate')?.value;
    if (effValue && moment.isMoment(effValue) && effValue.isValid()) {
      return effValue.isAfter(this.minDate) ? effValue : this.minDate;
    }
    return this.minDate;
  }

  getMinQtyError(): string {
    const ctrl = this.form.get('minQty');
    if (ctrl?.hasError('min')) return 'Minimum quantity must be at least 1';
    if (this.form.hasError('minQtyExceedsQty')) return 'Cannot exceed order quantity';
    return '';
  }
}
