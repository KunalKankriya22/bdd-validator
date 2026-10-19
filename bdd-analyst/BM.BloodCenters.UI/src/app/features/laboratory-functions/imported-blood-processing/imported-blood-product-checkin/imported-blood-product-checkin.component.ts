import {
  Component,
  ElementRef,
  Injector,
  OnInit,
  OnDestroy,
  ViewChild,
  effect,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import moment from 'moment';
import { Observable, Subject, forkJoin, of } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, map, switchMap, catchError } from 'rxjs/operators';

import { ImportedBloodCheckinService } from './services/imported-blood-checkin.service';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { UnitIdFieldComponent, UnitIdPostValidateEvent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import { ScanSelectFieldComponent } from '@shared/components/scan-select-field/scan-select-field.component';
import { ScanSelectOption } from '@shared/components/scan-select-field/scan-select-field.model';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';
import { SCAN_PATTERNS, matchesScanPattern } from '@shared/utils/scan-pattern.util';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';

import { CreateBatchInputDto, BatchResponse, BatchQueryDto } from './models/batch.model';
import { CreateComponentDto, ComponentResponse, ComponentGridItem } from './models/component.model';
import { CartonGridItem } from './models/carton.model';
import { ContractLovDto, ProductTypeLovDto, ContractTestDto } from './models/contract.model';
import { AttributeGridItem } from './models/attribute.model';

/**
 * Imported Blood Product Check-In Component
 * Oracle Forms: IMCHKIN (MLT-12611)
 *
 * Manages the check-in process for imported blood products including:
 * - Batch creation with contract, shipment, and temperature tracking
 * - Carton tracking
 * - Component (unit) check-in with barcode support
 * - Attribute management (PHER/DON)
 */
@Component({
  selector: 'app-imported-blood-product-checkin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDatepickerModule,
    MatTableModule,
    MatPaginatorModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    UnitIdFieldComponent,
    ScanSelectFieldComponent,
    PageHeaderWithBreadcrumb
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './imported-blood-product-checkin.component.html',
  styleUrl: './imported-blood-product-checkin.component.scss'
})
export class ImportedBloodProductCheckinComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `imported-blood-checkin-${ImportedBloodProductCheckinComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId  = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId  = (name: string) => `${this.componentId}-${name}-label`;

  @ViewChild('externalUnitIdField') externalUnitIdField!: UnitIdFieldComponent;
  @ViewChild('internalUnitIdField') internalUnitIdField!: UnitIdFieldComponent;
  @ViewChild('productCodeField') productCodeField!: ScanSelectFieldComponent;
  @ViewChild('aboField') aboField!: ScanSelectFieldComponent;

  private readonly fb                  = inject(FormBuilder);
  private readonly injector            = inject(Injector);
  private readonly bloodCheckinService = inject(ImportedBloodCheckinService);
  private readonly snackbarService     = inject(SnackbarService);
  private readonly dialog              = inject(MatDialog);
  private readonly labelScanService    = inject(DonorLibLabelScanService);
  private readonly headerService       = inject(HeaderService);
  private readonly pageHeaderService   = inject(PageHeaderService);
  private readonly destroy$            = new Subject<void>();

  // Scan patterns exposed for template
  protected readonly SCAN_PATTERNS = SCAN_PATTERNS;

  // Loading states
  protected readonly loading             = signal<boolean>(false);
  protected readonly batchLoading        = signal<boolean>(false);
  protected readonly batchSearchLoading  = signal<boolean>(false);
  protected readonly componentLoading    = signal<boolean>(false);
  protected readonly error               = signal<string | null>(null);
  protected readonly submitted           = signal<boolean>(false);
  protected readonly aboRhExists         = signal<boolean>(true);
  protected readonly batchesForContract  = signal<BatchResponse[]>([]);

  // LOV data
  protected readonly contracts    = signal<ContractLovDto[]>([]);
  protected readonly productTypes = signal<ProductTypeLovDto[]>([]);

  // Search controls for dropdowns
  readonly contractSearchCtrl    = new FormControl('');
  readonly batchSearchCtrl       = new FormControl('');
  readonly productTypeSearchCtrl = new FormControl('');
  readonly attrGroupSearchCtrl   = new FormControl('');
  readonly attrCodeSearchCtrl    = new FormControl('');

  // Filtered options for searchable dropdowns
  protected readonly filteredContracts    = signal<ContractLovDto[]>([]);
  protected readonly filteredBatches      = signal<BatchResponse[]>([]);
  protected readonly filteredProductTypes = signal<ProductTypeLovDto[]>([]);

  // ABO LOV options (loaded from service when product code changes) — FE-1
  protected readonly aboLovOptions = signal<ScanSelectOption[]>([]);

  // Product code LOV options — FE-2
  protected readonly productCodeLovOptions = signal<ScanSelectOption[]>([]);

  // Attribute LOV options (loaded dynamically from service) — FE-8
  protected readonly attrGroupLovOptions = signal<{value: string, label: string}[]>([]);
  protected readonly attrCodeLovOptions  = signal<{value: string, label: string}[]>([]);
  protected readonly filteredAttrGroups  = signal<{value: string, label: string}[]>([]);
  protected readonly filteredAttrCodes   = signal<{value: string, label: string}[]>([]);
  protected readonly attrCodeDisabled    = signal<boolean>(true);

  /**
   * Auto-scan handler for plain mat-form-field inputs (abo-labeling-isbt pattern).
   * Called on (input) event. If the typed/scanned value matches a scan pattern, auto-blurs
   * the field to trigger the (blur) handler immediately — mimics barcode scanner behavior.
   */
  protected onAutoScan(event: Event, patterns: typeof SCAN_PATTERNS[keyof typeof SCAN_PATTERNS]): void {
    const value = (event.target as HTMLInputElement).value;
    if (matchesScanPattern(value, patterns)) {
      (event.target as HTMLInputElement).blur();
    }
  }

  // Field dependency chain signals — FE-7
  protected readonly unitIdsValidated     = signal<boolean>(false);
  protected readonly productCodeValidated = signal<boolean>(false);
  protected readonly aboValidated         = signal<boolean>(false);
  protected readonly expiryValidated      = signal<boolean>(false);
  protected readonly isIsbt              = signal<boolean>(false);
  protected readonly codeScheme          = signal<string>('I');
  protected readonly allowExpiredProduct   = signal<boolean>(false);
  protected readonly pendingAttributeChoice = signal<boolean>(false);
  private lastCommittedUnitId: string | null = null;
  private lastCommittedProductCode: string | null = null;

  // Field processing flags — tracks which fields have pending API calls (abo-labeling-isbt pattern)
  protected fieldProcessing: Record<string, boolean> = {};
  protected get isAnyFieldProcessing(): boolean {
    return Object.values(this.fieldProcessing).some(v => v);
  }

  // Batch data
  protected readonly currentBatch   = signal<BatchResponse | null>(null);
  protected readonly batches        = signal<BatchResponse[]>([]);
  protected readonly contractTests  = signal<ContractTestDto[]>([]);

  // Batch list pagination
  protected readonly batchesTotal     = signal<number>(0);
  protected readonly batchesPageSize  = signal<number>(10);
  protected readonly batchesPageIndex = signal<number>(0);

  // Batch filter model values
  protected batchFilterContractId    = '';
  protected batchFilterFromDate: any = null;
  protected batchFilterToDate: any   = null;
  protected batchFilterIncompleteOnly = false;

  protected selectedBatchId = '';

  // Component data
  protected readonly components        = signal<ComponentGridItem[]>([]);
  protected readonly componentsTotal   = signal<number>(0);
  protected readonly componentsPageSize  = signal<number>(25);
  protected readonly componentsPageIndex = signal<number>(0);

  // Component status update
  protected readonly selectedComponentForStatus = signal<string | null>(null);
  protected componentStatusValue = 'L';

  // Carton data
  protected readonly cartons        = signal<CartonGridItem[]>([]);
  protected readonly cartonsChanged = signal<boolean>(false);

  // Carton gate — FE-10
  protected readonly allCartonsEntered = computed(() => {
    const list = this.cartons();
    return list.length > 0 && list.every(c => c.cartonNo != null && c.cartonNo > 0);
  });

  // Attribute data
  protected readonly selectedComponentAttributes = signal<AttributeGridItem[]>([]);
  protected readonly selectedComponentUnitId     = signal<string | null>(null);
  protected readonly selectedComponentProductCode = signal<string | null>(null);

  // Attribute section — always visible when batch exists, active only when a component row is selected
  protected readonly selectedComponentHasAttributes = signal(false);
  protected readonly attributeSectionActive = computed(() =>
    this.selectedComponentUnitId() !== null
  );

  // Computed values
  protected readonly today = moment().startOf('day').toDate();
  protected readonly isBatchCreated = computed(() => this.currentBatch() !== null);
  protected readonly isNewBatchFlow = signal<boolean>(false);
  protected readonly batchFormDirty    = signal<boolean>(false);
  protected readonly hasPendingChanges = computed(() => this.batchFormDirty() || this.cartonsChanged());
  protected readonly contractDescription = signal<string>('');

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: ''
  };

  batchForm!: FormGroup;
  componentForm!: FormGroup;
  cartonForm!: FormGroup;
  attributeForm!: FormGroup;

  batchListColumns: string[] = ['batchId', 'contractId', 'airwayBillNo', 'receivedDate', 'productType', 'numberOfUnits'];
  componentColumns: string[] = ['externalUnitId', 'internalUnitId', 'productCode', 'abo', 'label', 'expirationDate', 'attributes'];
  cartonColumns: string[] = ['sequence', 'cartonNo'];
  attributeColumns: string[] = ['attribGroup', 'attributeGroupDesc', 'attribCode', 'attributeCodeDesc'];

  ngOnInit(): void {
    this.initForms();
    this.loadLovData();
    this.setupSearchFilters();
    this.setupFieldDisableEffects();
    this.setupCartonCountListener();
    this.setupBatchDirtyListener();

    // Chapter change: reset everything and reload LOVs
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearBatch();
        this.loadLovData();
      });
  }

  // Dynamic header from PageHeaderService (codebase pattern: ag, pagq, undext)
  private readonly headerEffect = effect(() => {
    const pageData = this.pageHeaderService.pageHeaderData();
    if (pageData) {
      this.headerConfig = {
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: pageData.title, link: null }
        ],
        title: pageData.title,
        subtitle: pageData.subtitle || ''
      };
    }
  });

  /**
   * When user changes Carton Count during new batch flow,
   * dynamically add/remove empty carton input rows.
   */
  private setupBatchDirtyListener(): void {
    this.batchForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.isBatchCreated() && !this.isNewBatchFlow()) {
          this.batchFormDirty.set(this.batchForm.dirty);
        }
      });
  }

  private setupCartonCountListener(): void {
    this.batchForm.get('cartonCount')?.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(count => {
        const n = Number(count) || 0;
        if (n > 0 && n <= 99) {
          this.resizeCartons(n);
        } else {
          this.cartons.set([]);
        }
      });
  }

  /**
   * Reactively disable/enable form controls based on dependency chain signals.
   * Reactive forms ignore [attr.disabled] on inputs — must use formControl.disable()/enable().
   */
  private setupFieldDisableEffects(): void {
    effect(() => {
      const expiryCtrl = this.componentForm?.get('expiryDate');
      if (!expiryCtrl) return;
      if (this.aboValidated()) {
        expiryCtrl.enable({ emitEvent: false });
      } else {
        expiryCtrl.disable({ emitEvent: false });
      }
    }, { injector: this.injector });

    effect(() => {
      const attrsCtrl = this.componentForm?.get('hasAttributes');
      if (!attrsCtrl) return;
      if (this.expiryValidated() || this.pendingAttributeChoice()) {
        attrsCtrl.enable({ emitEvent: false });
      } else {
        attrsCtrl.disable({ emitEvent: false });
      }
    }, { injector: this.injector });
  }

  private setupSearchFilters(): void {
    this.contractSearchCtrl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term: string | null) => {
        const t = (term || '').toLowerCase();
        this.filteredContracts.set(!t ? this.contracts() :
          this.contracts().filter(c => c.contractId.toLowerCase().includes(t) || (c.company || '').toLowerCase().includes(t)));
      });

    this.batchSearchCtrl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term: string | null) => {
        const t = (term || '').toLowerCase();
        this.filteredBatches.set(!t ? this.batchesForContract() :
          this.batchesForContract().filter(b => b.batchId.toLowerCase().includes(t)));
      });

    this.productTypeSearchCtrl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term: string | null) => {
        const t = (term || '').toLowerCase();
        this.filteredProductTypes.set(!t ? this.productTypes() :
          this.productTypes().filter(p => p.productType.toLowerCase().includes(t) || (p.productTypeDesc || '').toLowerCase().includes(t)));
      });

    // Attribute group search filter — FE-8
    this.attrGroupSearchCtrl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term: string | null) => {
        const t = (term || '').toLowerCase();
        this.filteredAttrGroups.set(!t ? this.attrGroupLovOptions() :
          this.attrGroupLovOptions().filter(o => o.label.toLowerCase().includes(t) || o.value.toLowerCase().includes(t)));
      });

    // Attribute code search filter — FE-8
    this.attrCodeSearchCtrl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term: string | null) => {
        const t = (term || '').toLowerCase();
        this.filteredAttrCodes.set(!t ? this.attrCodeLovOptions() :
          this.attrCodeLovOptions().filter(o => o.label.toLowerCase().includes(t)));
      });
  }

  private loadLovData(): void {
    this.loading.set(true);
    forkJoin({
      contracts: this.bloodCheckinService.getContracts(),
      productTypes: this.bloodCheckinService.getProductTypes(),
      attrGroups: this.bloodCheckinService.getAttributeGroups()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ contracts, productTypes, attrGroups }) => {
          this.contracts.set(contracts);
          this.filteredContracts.set(contracts);
          this.productTypes.set(productTypes);
          this.filteredProductTypes.set(productTypes);
          // FE-8: Load attribute groups from service
          const groups = (attrGroups ?? []).map((g: any) => ({ value: g.code, label: g.description }));
          this.attrGroupLovOptions.set(groups);
          this.filteredAttrGroups.set(groups);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.snackbarService.showError('Failed to load lookup data');
        }
      });
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms(): void {
    this.batchForm = this.fb.group({
      contractId:    ['', [Validators.required]],
      batchId:       [''],
      airwayBillNo:  ['', [Validators.required, Validators.maxLength(14)]],
      shippedDate:   [null, [Validators.required]],
      receivedDate:  [null, [Validators.required]],
      productType:   ['PHER', [Validators.required]],
      minTemp:       [null, [Validators.required]],
      maxTemp:       [null, [Validators.required]],
      cartonCount:   [0, [Validators.required, Validators.min(1)]],
      numberOfUnits: [0, [Validators.required, Validators.min(1)]],
      licenseFlag:   ['Y', [Validators.required]]
    }, { validators: this.batchFormValidator });

    this.componentForm = this.fb.group({
      unitId:              [''],
      productCode:         ['', [Validators.required]],
      osUnitId:            [''],
      abo:                 ['', [Validators.required]],
      rh:                  [''],
      barcodeProtocol:     ['8', [Validators.required]],
      systemLabelDecision: ['Y'],
      hasAttributes:       [''],
      expiryDate:          [''],
      collDate:            [''],
      productLabel:        ['']
    });

    this.cartonForm = this.fb.group({
      cartonNumber: [null, [Validators.required, Validators.min(1)]],
      seqNo: [1, [Validators.required, Validators.min(1)]]
    });

    this.attributeForm = this.fb.group({
      attribGroup: ['', [Validators.required]],
      attribCode:  ['', [Validators.required]]
    });

    // FE-8: Reload attribute codes when group changes
    this.attributeForm.get('attribGroup')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(group => {
        this.attributeForm.get('attribCode')?.reset('', { emitEvent: false });
        if (group) {
          this.attrCodeDisabled.set(false);
          this.bloodCheckinService.getAttributeCodes(group, this.codeScheme())
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (codes) => {
                const mapped = (codes as any[]).map((c: any) => ({ value: c.code, label: c.description }));
                this.attrCodeLovOptions.set(mapped);
                this.filteredAttrCodes.set(mapped);
              },
              error: () => this.snackbarService.showError('Failed to load attribute codes')
            });
        } else {
          this.attrCodeDisabled.set(true);
          this.attrCodeLovOptions.set([]);
          this.filteredAttrCodes.set([]);
        }
      });

    this.batchForm.get('contractId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(contractId => {
        const contract = this.contracts().find(c => c.contractId === contractId);
        this.contractDescription.set(contract?.company || '');
        // Store contract's barcode protocol — this is what the sender uses
        if (contract?.barCodeProtocol) {
          this.componentForm.get('barcodeProtocol')?.setValue(contract.barCodeProtocol, { emitEvent: false });
        }
        this.selectedBatchId = '';
        this.currentBatch.set(null);
        this.components.set([]);
        this.cartons.set([]);
        this.contractTests.set([]);
        if (contractId) {
          this.loadBatchesForContract(contractId);
        } else {
          this.batchesForContract.set([]);
          this.filteredBatches.set([]);
          this.batchSearchCtrl.setValue('', { emitEvent: false });
        }
      });
  }

  private batchFormValidator = (group: FormGroup): { [key: string]: boolean } | null => {
    const shippedDate  = group.get('shippedDate')?.value;
    const receivedDate = group.get('receivedDate')?.value;
    const minTemp      = group.get('minTemp')?.value;
    const maxTemp      = group.get('maxTemp')?.value;

    const errors: { [key: string]: boolean } = {};

    if (shippedDate && receivedDate && moment(receivedDate).isBefore(moment(shippedDate))) {
      errors['receivedBeforeShipped'] = true;
    }
    if (minTemp != null && maxTemp != null && maxTemp < minTemp) {
      errors['maxTempLessThanMin'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  // ── Batch Search ──────────────────────────────────────────────────

  onSearchBatches(): void {
    this.batchSearchLoading.set(true);
    const filters: BatchQueryDto = {
      contractId:     this.batchFilterContractId || undefined,
      fromDate:       this.batchFilterFromDate ? moment(this.batchFilterFromDate).toISOString() : undefined,
      toDate:         this.batchFilterToDate ? moment(this.batchFilterToDate).toISOString() : undefined,
      incompleteOnly: this.batchFilterIncompleteOnly || undefined
    };
    const pageSize  = this.batchesPageSize();
    const pageIndex = this.batchesPageIndex();

    this.bloodCheckinService.getBatches(pageSize, pageIndex * pageSize, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ data, totalCount }) => {
          this.batches.set(data);
          this.batchesTotal.set(totalCount);
          this.batchSearchLoading.set(false);
        },
        error: () => {
          this.batchSearchLoading.set(false);
          this.snackbarService.showError('Failed to search batches');
        }
      });
  }

  onClearBatchSearch(): void {
    this.batchFilterContractId     = '';
    this.batchFilterFromDate       = null;
    this.batchFilterToDate         = null;
    this.batchFilterIncompleteOnly = false;
    this.batches.set([]);
    this.batchesTotal.set(0);
    this.batchesPageIndex.set(0);
  }

  onSelectBatch(batch: BatchResponse): void {
    this.currentBatch.set(batch);
    this.batchForm.patchValue({
      contractId:    batch.contractId,
      batchId:       batch.batchId,
      airwayBillNo:  batch.airwayBillNo,
      shippedDate:   batch.shippedDate  ? moment(batch.shippedDate)  : null,
      receivedDate:  batch.receivedDate ? moment(batch.receivedDate) : null,
      productType:   batch.productType,
      minTemp:       batch.minTemp,
      maxTemp:       batch.maxTemp,
      cartonCount:   batch.cartonCount,
      numberOfUnits: batch.numberOfUnits,
      licenseFlag:   batch.licenseFlag || 'Y'
    }, { emitEvent: false });

    this.componentsPageIndex.set(0);
    this.selectedComponentForStatus.set(null);
    this.selectedComponentUnitId.set(null);
    this.selectedComponentProductCode.set(null);
    this.selectedComponentAttributes.set([]);

    this.batchFormDirty.set(false);
    this.cartonsChanged.set(false);
    this.batchForm.markAsPristine();
    this.loadComponents();
    this.loadCartons(batch.batchId);
    this.loadContractTests(batch.contractId);
  }

  onBatchPageChange(event: any): void {
    this.batchesPageSize.set(event.pageSize);
    this.batchesPageIndex.set(event.pageIndex);
    this.onSearchBatches();
  }

  // ── Batch Create ──────────────────────────────────────────────────

  onCreateBatch(): void {
    this.submitted.set(true);

    if (this.batchForm.invalid || !this.allCartonsEntered()) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) (firstInvalid as HTMLElement).focus();
      return;
    }

    this.batchLoading.set(true);

    const formValue = this.batchForm.value;
    const dto: CreateBatchInputDto = {
      batchId:       formValue.batchId || null,
      contractId:    formValue.contractId,
      airwayBillNo:  formValue.airwayBillNo,
      shippedDate:   moment(formValue.shippedDate).format('YYYY-MM-DD'),
      receivedDate:  moment(formValue.receivedDate).format('YYYY-MM-DD'),
      productType:   formValue.productType,
      minTemp:       formValue.minTemp,
      maxTemp:       formValue.maxTemp,
      cartonCount:   formValue.cartonCount,
      numberOfUnits: formValue.numberOfUnits,
      licenseFlag:   formValue.licenseFlag
    };

    this.bloodCheckinService.createBatch(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (batch) => {
          this.currentBatch.set(batch);
          this.isNewBatchFlow.set(false);
          this.selectedBatchId = batch.batchId;
          this.loadContractTests(batch.contractId);
          this.loadBatchesForContract(batch.contractId);

          // Chain carton save — batch + cartons saved together
          const cartonList = this.cartons();
          const cartonDto = cartonList.map(c => ({
            batchId:      batch.batchId,
            chapterId:    batch.chapterId,
            airwayBillNo: batch.airwayBillNo,
            cartonNumber: c.cartonNo,
            seqNo:        c.sequence
          }));

          this.bloodCheckinService.addCartons(batch.batchId, cartonList.length, cartonDto)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.batchLoading.set(false);
                this.snackbarService.showSuccess(`Batch ${batch.batchId} created with ${cartonList.length} cartons.`);
                this.loadCartons(batch.batchId);
              },
              error: (err) => {
                this.batchLoading.set(false);
                this.snackbarService.showError(err.error?.message || 'Batch created but failed to save cartons');
              }
            });
        },
        error: (err) => {
          this.batchLoading.set(false);
          this.snackbarService.showError(err.error?.message || 'Failed to create batch');
        }
      });
  }

  onUpdateBatch(): void {
    if (this.batchForm.invalid || !this.currentBatch()) return;
    if (this.cartonsChanged() && !this.allCartonsEntered()) return;

    this.batchLoading.set(true);
    const batch = this.currentBatch()!;
    const formValue = this.batchForm.value;

    const dto: CreateBatchInputDto = {
      batchId:       batch.batchId,
      contractId:    formValue.contractId,
      airwayBillNo:  formValue.airwayBillNo,
      shippedDate:   moment(formValue.shippedDate).format('YYYY-MM-DD'),
      receivedDate:  moment(formValue.receivedDate).format('YYYY-MM-DD'),
      productType:   formValue.productType,
      minTemp:       formValue.minTemp,
      maxTemp:       formValue.maxTemp,
      cartonCount:   formValue.cartonCount,
      numberOfUnits: formValue.numberOfUnits,
      licenseFlag:   formValue.licenseFlag
    };

    this.bloodCheckinService.updateBatch(batch.batchId, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.currentBatch.set(updated);
          this.batchFormDirty.set(false);
          this.batchForm.markAsPristine();

          if (this.cartonsChanged()) {
            const cartonList = this.cartons();
            const cartonDto = cartonList.map(c => ({
              batchId:      batch.batchId,
              chapterId:    batch.chapterId,
              airwayBillNo: batch.airwayBillNo,
              cartonNumber: c.cartonNo,
              seqNo:        c.sequence
            }));

            this.bloodCheckinService.addCartons(batch.batchId, cartonList.length, cartonDto)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: () => {
                  this.batchLoading.set(false);
                  this.cartonsChanged.set(false);
                  this.snackbarService.showSuccess('Batch and cartons updated successfully.');
                  this.loadCartons(batch.batchId);
                },
                error: (err) => {
                  this.batchLoading.set(false);
                  this.snackbarService.showError(err.error?.message || 'Batch updated but failed to save cartons');
                }
              });
          } else {
            this.batchLoading.set(false);
            this.snackbarService.showSuccess('Batch updated successfully.');
          }
        },
        error: (err) => {
          this.batchLoading.set(false);
          this.snackbarService.showError(err.error?.message || 'Failed to update batch');
        }
      });
  }

  onAddCartons(): void {
    const batch = this.currentBatch();
    if (!batch || !this.allCartonsEntered()) return;

    const cartonList = this.cartons();
    const dto = cartonList.map(c => ({
      batchId:      batch.batchId,
      chapterId:    batch.chapterId,
      airwayBillNo: batch.airwayBillNo,
      cartonNumber: c.cartonNo,
      seqNo:        c.sequence
    }));

    this.batchLoading.set(true);
    this.bloodCheckinService.addCartons(batch.batchId, cartonList.length, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.batchLoading.set(false);
          this.snackbarService.showSuccess('Cartons added successfully.');
          this.loadCartons(batch.batchId);
        },
        error: (err) => {
          this.batchLoading.set(false);
          this.snackbarService.showError(err.error?.message || 'Failed to add cartons');
        }
      });
  }

  private loadCartons(batchId: string): void {
    this.bloodCheckinService.getCartonsByBatch(batchId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cartons) => {
          const savedCartons = cartons
            .filter(c => c.cartonNumber != null && c.cartonNumber > 0)
            .map((c, i) => ({ sequence: i + 1, cartonNo: c.cartonNumber }));

          if (savedCartons.length > 0) {
            this.cartons.set(savedCartons);
          } else {
            // No cartons in DB yet — initialize empty rows from batch.cartonCount
            const count = this.currentBatch()?.cartonCount ?? 0;
            if (count > 0) {
              this.initializeCartons(count);
            }
          }
        },
        error: () => this.snackbarService.showError('Failed to load cartons')
      });
  }

  private loadContractTests(contractId: string): void {
    this.bloodCheckinService.getContractTests(contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tests) => {
          this.contractTests.set(tests);
          this.aboRhExists.set(tests.some(t => t.testId === 'ABORH'));
        },
        error: () => { /* Non-critical: contract tests panel stays empty */ }
      });
  }

  private initializeCartons(count: number): void {
    const cartonList: CartonGridItem[] = [];
    for (let i = 1; i <= count; i++) {
      cartonList.push({ sequence: i, cartonNo: null as any });
    }
    this.cartons.set(cartonList);
  }

  private resizeCartons(newCount: number): void {
    const current = this.cartons();
    if (newCount === current.length) return;

    if (newCount > current.length) {
      const extended = [...current];
      for (let i = current.length + 1; i <= newCount; i++) {
        extended.push({ sequence: i, cartonNo: null as any });
      }
      this.cartons.set(extended);
    } else {
      this.cartons.set(current.slice(0, newCount).map((c, i) => ({ ...c, sequence: i + 1 })));
    }
    this.cartonsChanged.set(true);
  }

  private loadBatchesForContract(contractId: string): void {
    this.bloodCheckinService.getBatches(100, 0, { contractId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ data }) => {
          this.batchesForContract.set(data);
          this.filteredBatches.set(data);
          this.batchSearchCtrl.setValue('', { emitEvent: false });
        },
        error: () => this.snackbarService.showError('Failed to load batches')
      });
  }

  onBatchSelect(batchId: string): void {
    if (batchId === '__NEW__') {
      // New batch creation flow
      this.isNewBatchFlow.set(true);
      this.currentBatch.set(null);
      this.components.set([]);
      this.cartons.set([]);
      // Reset batch header fields to defaults for entry
      this.batchForm.patchValue({
        airwayBillNo: '', shippedDate: null, receivedDate: null,
        productType: '', minTemp: null, maxTemp: null,
        cartonCount: 0, numberOfUnits: 0, licenseFlag: ''
      });
      this.batchForm.markAsUntouched();
      this.batchForm.markAsPristine();
      return;
    }

    this.isNewBatchFlow.set(false);

    if (!batchId) {
      this.currentBatch.set(null);
      this.components.set([]);
      this.cartons.set([]);
      return;
    }
    const batch = this.batchesForContract().find(b => b.batchId === batchId);
    if (batch) this.onSelectBatch(batch);
  }

  /**
   * Auto-save new batch when License Flag is selected (last header field).
   * Matches legacy FMB: COMMIT_FORM fires on S_LICENSE_FLAG KEY-NEXT-ITEM.
   */
  onLicenseFlagChange(): void {
    // No auto-save — user must click SAVE BATCH button
  }

  onClearComponent(): void {
    this.resetComponentForm();
    this.pendingAttributeChoice.set(false);
    this.lastCommittedUnitId = null;
    this.lastCommittedProductCode = null;
  }

  onClearBatch(): void {
    this.selectedBatchId = '';
    this.isNewBatchFlow.set(false);
    this.productCodesLoaded = false;
    this.productCodeLovOptions.set([]);
    this.batchForm.reset({ productType: '', licenseFlag: '' });
    this.currentBatch.set(null);
    this.components.set([]);
    this.cartons.set([]);
    this.cartonsChanged.set(false);
    this.selectedComponentAttributes.set([]);
    this.contractTests.set([]);
    this.selectedComponentForStatus.set(null);
    this.selectedComponentUnitId.set(null);
    this.selectedComponentProductCode.set(null);
    this.submitted.set(false);
  }

  // ── Unit ID field events ──────────────────────────────────────────

  onExternalUnitIdPostValidate(event: UnitIdPostValidateEvent): void {
    const parsedId = event.data.parsedUnitId ?? '';
    const contractId = this.currentBatch()?.contractId ?? this.batchForm.get('contractId')?.value;
    if (!parsedId || !contractId) { event.confirm(); return; }

    this.fieldProcessing['externalUnitId'] = true;
    this.bloodCheckinService.checkDuplicateExternalUnit(parsedId, contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (exists) => {
          this.fieldProcessing['externalUnitId'] = false;
          if (exists) {
            event.reject('External unit ID already checked in for this contract');
          } else {
            event.confirm();
          }
        },
        error: () => {
          this.fieldProcessing['externalUnitId'] = false;
          event.confirm();
        }
      });
  }

  onExternalUnitIdValidated(data: UnitValidationResponse): void {
    this.componentForm.get('osUnitId')?.setValue(data.parsedUnitId ?? '', { emitEvent: false });

    // FE-4: ISBT auto-skip — if parsed unit ID >= 13 chars, it's ISBT
    const parsedId = data.parsedUnitId ?? '';
    // Set codeScheme from unit validation response (drives LOV filtering)
    // barcodeProtocol is already set from contract selection — don't override here
    const detectedScheme = data.codeScheme ?? (parsedId.length >= 13 ? 'I' : 'C');
    this.codeScheme.set(detectedScheme);

    if (parsedId.length >= 13) {
      // ISBT: copy external → internal, skip internal, focus product code
      this.isIsbt.set(true);
      this.internalUnitIdField?.setValue(parsedId);
      this.componentForm.get('unitId')?.setValue(parsedId, { emitEvent: false });
      this.unitIdsValidated.set(true);
      this.tryAutoCheckIn();
    } else {
      // Codabar: enable internal, focus it
      this.isIsbt.set(false);
      // FE-12: Focus internal unit ID
      setTimeout(() => this.internalUnitIdField?.focus());
    }
  }

  onExternalUnitIdCleared(): void {
    this.componentForm.get('osUnitId')?.setValue('', { emitEvent: false });
    this.unitIdsValidated.set(false);
    this.productCodeValidated.set(false);
    this.aboValidated.set(false);
    this.isIsbt.set(false);
  }

  onInternalUnitIdPostValidate(event: UnitIdPostValidateEvent): void {
    const parsedId = event.data.parsedUnitId ?? '';
    const contractId = this.currentBatch()?.contractId ?? this.batchForm.get('contractId')?.value;
    if (!parsedId || !contractId) { event.confirm(); return; }

    this.fieldProcessing['internalUnitId'] = true;
    this.bloodCheckinService.checkUnitContractConflict(parsedId, contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (conflict) => {
          this.fieldProcessing['internalUnitId'] = false;
          if (conflict) {
            event.reject('Unit exists under a different contract');
          } else {
            event.confirm();
          }
        },
        error: () => {
          this.fieldProcessing['internalUnitId'] = false;
          event.confirm();
        }
      });
  }

  onInternalUnitIdValidated(data: UnitValidationResponse): void {
    this.componentForm.get('unitId')?.setValue(data.parsedUnitId ?? '', { emitEvent: false });

    // FE-5: Identical unit ID check
    const externalId = this.componentForm.get('osUnitId')?.value;
    const internalId = data.parsedUnitId ?? '';
    if (externalId && internalId && externalId === internalId && this.codeScheme() !== 'I') {
      const dialogData: ConfirmActionDialogData = {
        title: 'Identical Unit IDs',
        message: 'The external and internal unit IDs are the same. Do you want to continue?',
        confirmText: 'YES, CONTINUE',
        cancelText: 'NO, RE-ENTER'
      };
      this.dialog.open(ConfirmActionDialogComponent, { width: '500px', data: dialogData })
        .afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe(confirmed => {
          if (confirmed) {
            this.unitIdsValidated.set(true);
            this.tryAutoCheckIn();
          } else {
            this.internalUnitIdField?.clear();
            this.componentForm.get('unitId')?.setValue('', { emitEvent: false });
          }
        });
    } else {
      this.unitIdsValidated.set(true);
      this.tryAutoCheckIn();
    }
  }

  onInternalUnitIdCleared(): void {
    this.componentForm.get('unitId')?.setValue('', { emitEvent: false });
    if (!this.isIsbt()) {
      this.unitIdsValidated.set(false);
    }
  }

  // FE-1: Parse ABO scan via label scan service
  parseAbo = (scan: string): Observable<ScanSelectOption | null> => {
    return this.labelScanService.validateAboScan(scan, this.codeScheme()).pipe(
      map(response => {
        if (response.success && response.item?.isValid) {
          const code = response.item.aboCode ?? '';
          const lovMatch = this.aboLovOptions().find(o => o.code === code);
          return { code, description: lovMatch?.description ?? response.item.aboLabel ?? code };
        }
        return null;
      })
    );
  };

  // FE-2: Parse product code — barcode scan via shared API, manual entry via IMCHKIN validation API
  parseProductCode = (scan: string): Observable<ScanSelectOption | null> => {
    // Try shared parse API first (handles barcode scans)
    return this.labelScanService.validateProductScan(scan, this.codeScheme()).pipe(
      map(response => {
        if (response.success && response.item?.isValid) {
          return { code: response.item.productCode ?? '', description: response.item.productDescription ?? response.item.productCode ?? '' };
        }
        return null;
      }),
      switchMap(result => {
        if (result) return of(result);
        // Shared parse API failed (not a barcode format) — manually typed product code
        // Chain to field-level validation API (matches FMB: validate_product runs on KEY-NEXT-ITEM)
        const trimmed = scan.trim();
        const productType = this.currentBatch()?.productType;
        const scheme = this.codeScheme();
        if (!productType || !scheme) return of(null);

        // ISBT: must be 8 chars. Codabar: must be 5 chars. (FMB KEY-NEXT-ITEM length check)
        if (scheme === 'I' && trimmed.length !== 8) return of(null);
        if (scheme === 'C' && trimmed.length !== 5) return of(null);

        return this.bloodCheckinService.validateProductCodeField(trimmed, productType, scheme).pipe(
          map(valid => valid ? { code: trimmed, description: trimmed } : null),
          catchError(() => of(null))
        );
      })
    );
  };

  // FE-1: ABO value changed
  @ViewChild('expiryInput') expiryInput!: ElementRef<HTMLInputElement>;

  onAboChanged(option: ScanSelectOption | null): void {
    if (option) {
      this.componentForm.get('abo')?.setValue(option.code, { emitEvent: false });
      this.componentForm.get('systemLabelDecision')?.setValue(option.code, { emitEvent: false });
      this.componentForm.get('productLabel')?.setValue(option.description, { emitEvent: false });
      this.aboValidated.set(true);
      this.tryAutoCheckIn();
    }
  }

  // FE-1: ABO cleared
  onAboCleared(): void {
    this.componentForm.get('abo')?.setValue('', { emitEvent: false });
    this.componentForm.get('productLabel')?.setValue('', { emitEvent: false });
    this.aboValidated.set(false);
  }

  // FE-2: Product code value changed
  onProductCodeChanged(option: ScanSelectOption | null): void {
    if (option) {
      this.componentForm.get('productCode')?.setValue(option.code, { emitEvent: false });
      this.productCodeValidated.set(true);
      // Reload ABO LOV from service based on product code
      this.fieldProcessing['aboLov'] = true;
      this.bloodCheckinService.getAboValues(option.code, this.codeScheme())
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (aboValues) => {
            this.fieldProcessing['aboLov'] = false;
            this.aboLovOptions.set(
              aboValues.map(v => ({ code: v.code, description: v.description }))
            );
            this.tryAutoCheckIn();
          },
          error: () => {
            this.fieldProcessing['aboLov'] = false;
            this.snackbarService.showError('Failed to load ABO values');
          }
        });
    }
  }

  // FE-2: Product code cleared
  onProductCodeCleared(): void {
    this.componentForm.get('productCode')?.setValue('', { emitEvent: false });
    this.productCodeValidated.set(false);
    this.aboValidated.set(false);
    this.aboLovOptions.set([]);
  }

  /**
   * Expiry date scan/blur handler (abo-labeling-isbt onScanExpDateBlur pattern).
   * Plain text input — user scans barcode or types DD-MMM-YYYY.
   * On blur: parse via API if scan, or validate format if typed.
   */
  onScanExpiryBlur(): void {
    const scanValue = this.componentForm.get('expiryDate')?.value?.trim?.() ?? '';
    if (!scanValue) return;

    this.fieldProcessing['expiryDate'] = true;

    this.labelScanService.validateExpiryScan(scanValue, this.codeScheme())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.fieldProcessing['expiryDate'] = false;
          if (res.success && res.item?.expiryDate) {
            const parsedExpiry = this.formatExpiryDisplay(res.item.expiryDate);
            this.componentForm.patchValue({ expiryDate: parsedExpiry }, { emitEvent: false });
            this.checkExpiredAndProceed(res.item.expiryDate);
          } else {
            this.snackbarService.showError(
              res.errorResponse?.error || res.message || 'Invalid expiry date'
            );
          }
        },
        error: () => {
          this.fieldProcessing['expiryDate'] = false;
          this.snackbarService.showError('Failed to validate expiry date scan');
        }
      });
  }

  /**
   * After expiry is parsed/entered, check if product is expired → show NFT dialog if so.
   */
  private checkExpiredAndProceed(isoDate: string): void {
    const expiryDate = moment(isoDate);
    if (!expiryDate.isValid()) return;

    if (expiryDate.isBefore(moment().startOf('day'))) {
      const dialogData: ConfirmActionDialogData = {
        title: 'Expired Product',
        message: 'This product has expired. Store as NFT (Not Fit for Transfusion)?',
        confirmText: 'YES, STORE AS NFT',
        cancelText: 'NO, CANCEL'
      };
      this.dialog.open(ConfirmActionDialogComponent, { width: '500px', data: dialogData })
        .afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe(confirmed => {
          if (confirmed) {
            this.allowExpiredProduct.set(true);
            this.expiryValidated.set(true);
            this.onCheckInComponent();
          } else {
            this.componentForm.patchValue({ expiryDate: '' }, { emitEvent: false });
            this.allowExpiredProduct.set(false);
            this.expiryValidated.set(false);
          }
        });
    } else {
      this.expiryValidated.set(true);
      this.allowExpiredProduct.set(false);
      this.onCheckInComponent();
    }
  }

  /**
   * Format expiry date for display (abo-labeling-isbt formatExpiryDisplay pattern).
   * Input: ISO date string. Output: DD-MMM-YYYY or DD-MMM-YYYY HH:MM
   */
  private formatExpiryDisplay(value: string | null): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const mon = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = d.getHours();
    const minutes = d.getMinutes();
    if (hours === 0 && minutes === 0) {
      return `${day}-${mon}-${year}`;
    }
    return `${day}-${mon}-${year} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  /**
   * Load product code LOV — Codabar only (matches FMB: LOV blocked for ISBT).
   * ISBT products are 8-char (5-char base + 3-char barcode suffix) — LOV has 5-char codes
   * so it can't match typed 8-char values. User must scan or type full code for ISBT.
   * Codabar products are 5-char — LOV matches directly.
   */
  private productCodesLoaded = false;
  private loadProductCodesIfNeeded(): void {
    // ISBT: no LOV — scan or type only (FMB: "listval not available for ISBT")
    if (this.codeScheme() === 'I') {
      this.productCodeLovOptions.set([]);
      return;
    }

    if (this.productCodesLoaded && this.productCodeLovOptions().length > 0) return;

    const productType = this.currentBatch()?.productType;
    const codeScheme = this.codeScheme();
    if (!productType || !codeScheme) return;

    this.bloodCheckinService.getProductCodes(productType, codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.productCodeLovOptions.set(
            codes.map(c => ({ code: c.code, description: c.description ?? c.code }))
          );
          this.productCodesLoaded = true;
        },
        error: () => this.snackbarService.showError('Failed to load product codes')
      });
  }

  // ── Auto Check-In (abo-labeling-isbt tryAutoVerify pattern) ──────

  /**
   * Central focus + auto-commit controller (abo-labeling-isbt tryAutoVerify pattern).
   * Checks required fields in scan order, focuses the first incomplete one.
   *
   * Legacy FMB flow:
   *   scan fields → COMMIT_FORM → cursor at S_ATTRIB_FLAG → user picks Y or blank
   *
   * Modern flow:
   *   scan fields → expiry validates → Attributes dropdown ENABLES → user picks
   *   → '-' selected → auto-commit → clear for next unit
   *   → 'Yes' selected → auto-commit → show attribute section for the committed unit
   *
   * Guard: won't run if any field API is in-flight (fieldProcessing).
   */
  private tryAutoCheckIn(): void {
    if (this.isAnyFieldProcessing) return;

    if (!this.unitIdsValidated()) {
      this.internalUnitIdField?.focus();
      return;
    }

    if (!this.productCodeValidated()) {
      this.loadProductCodesIfNeeded();
      this.productCodeField?.focus();
      return;
    }

    if (!this.aboValidated()) {
      this.aboField?.focus();
      return;
    }

    if (!this.expiryValidated()) {
      setTimeout(() => this.expiryInput?.nativeElement?.focus());
      return;
    }

    // Expiry validated — auto-commit is triggered from checkExpiredAndProceed.
    // This point is reached only during the scan chain, not post-commit.
  }

  /**
   * Attributes flag selected — triggers commit.
   * Legacy FMB: S_ATTRIB_FLAG KEY-NEXT-ITEM fires AFTER COMMIT_FORM (commit already done).
   * Modern: Attributes is the last field before commit. User picks '-' or 'Yes', then we commit.
   */
  onAttributesFlagChange(): void {
    const value = this.componentForm.get('hasAttributes')?.value;
    if (!this.pendingAttributeChoice()) return;
    this.pendingAttributeChoice.set(false);

    // Capture before reset
    const committedUnitId = this.lastCommittedUnitId;
    const committedProductCode = this.lastCommittedProductCode;

    // Clear the component form
    this.resetComponentForm();
    this.lastCommittedUnitId = null;
    this.lastCommittedProductCode = null;

    // Defer attribute activation to next tick — let reset + cleared events settle first
    setTimeout(() => {
      if (value === 'Y' && committedUnitId && committedProductCode) {
        // Grid may use displayUnitId (with check digit suffix) — match by prefix
        const gridMatch = this.components().find(c =>
          c.internalUnitId === committedUnitId || c.internalUnitId.startsWith(committedUnitId)
        );
        const resolvedUnitId = gridMatch?.internalUnitId ?? committedUnitId;

        this.selectedComponentUnitId.set(resolvedUnitId);
        this.selectedComponentProductCode.set(committedProductCode);
        this.selectedComponentForStatus.set(resolvedUnitId);
        this.selectedComponentHasAttributes.set(true);
        this.bloodCheckinService.getComponentAttributes(resolvedUnitId, committedProductCode)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (attrs) => this.selectedComponentAttributes.set(attrs),
            error: () => this.snackbarService.showError('Failed to load component attributes')
          });
      } else {
        this.selectedComponentUnitId.set(null);
        this.selectedComponentProductCode.set(null);
        this.selectedComponentForStatus.set(null);
        this.selectedComponentHasAttributes.set(false);
        setTimeout(() => this.externalUnitIdField?.focus());
      }
    });
  }

  private resetComponentForm(): void {
    this.componentForm.reset({
      barcodeProtocol: '8', systemLabelDecision: 'Y', hasAttributes: '', abo: '', rh: ''
    });
    this.unitIdsValidated.set(false);
    this.productCodeValidated.set(false);
    this.aboValidated.set(false);
    this.expiryValidated.set(false);
    this.allowExpiredProduct.set(false);
    this.isIsbt.set(false);
    this.aboLovOptions.set([]);
    this.productCodeField?.clear();
    this.aboField?.clear();
    this.externalUnitIdField?.clear();
    this.internalUnitIdField?.clear();
  }

  // ── Component Check-In ────────────────────────────────────────────

  onCheckInComponent(): void {
    if (this.pendingAttributeChoice()) return;
    const extValid = this.externalUnitIdField?.isValid;
    const intValid = this.isIsbt() || this.internalUnitIdField?.isValid;
    if (!extValid || !intValid || this.componentForm.invalid || !this.currentBatch()) return;

    this.componentLoading.set(true);
    // Disable hasAttributes during API call — only enable after success via pendingAttributeChoice
    this.expiryValidated.set(false);
    const formValue = this.componentForm.value;
    const batch     = this.currentBatch()!;

    const dto: CreateComponentDto = {
      unitId:              this.internalUnitIdField.parsedUnitId ?? formValue.unitId,
      productCode:         formValue.productCode,
      batchId:             batch.batchId,
      contractId:          batch.contractId,
      osUnitId:            this.externalUnitIdField.parsedUnitId ?? formValue.osUnitId,
      barcodeProtocol:     formValue.barcodeProtocol,
      systemLabelDecision: formValue.systemLabelDecision,
      expiryDate:          formValue.expiryDate  ? moment(formValue.expiryDate, ['DD-MMM-YYYY HH:mm', 'DD-MMM-YYYY', moment.ISO_8601]).format('YYYY-MM-DD')  : undefined,
      productLabel:        formValue.productLabel,
      licenseFlag:         batch.licenseFlag || 'Y',
      abo:                 formValue.abo  || undefined,
      rh:                  formValue.rh   || undefined,
      allowExpiredProduct: this.allowExpiredProduct() || undefined
    };

    this.bloodCheckinService.checkInComponent(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.componentLoading.set(false);
          this.snackbarService.showSuccess('Component checked in successfully.');

          // Capture committed unit identifiers for post-commit attribute routing
          this.lastCommittedUnitId = this.internalUnitIdField?.parsedUnitId
            ?? this.componentForm.get('unitId')?.value;
          this.lastCommittedProductCode = this.componentForm.get('productCode')?.value;

          // Reload grid to show the just-committed component
          this.loadComponents();

          // Keep form filled — user sees what was just committed.
          // Enable attributes dropdown for post-commit choice, then focus it.
          this.pendingAttributeChoice.set(true);
          this.componentForm.get('hasAttributes')?.setValue('', { emitEvent: false });
        },
        error: (err) => {
          this.componentLoading.set(false);
          this.snackbarService.showError(err.error?.message || 'Failed to check in component');
        }
      });
  }

  private loadComponents(): void {
    const batch = this.currentBatch();
    if (!batch) return;

    const pageSize  = this.componentsPageSize();
    const pageIndex = this.componentsPageIndex();

    this.bloodCheckinService.getComponentsByBatch(batch.batchId, pageSize, pageIndex * pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ data, totalCount }) => {
          this.components.set(data.map(c => ({
            externalUnitId: c.displayOsUnitId || c.osUnitId  || '',
            internalUnitId: c.displayUnitId || c.unitId,
            productCode:    c.productCode,
            abo:            c.systemLabelDecision || c.aboRh,
            label:          c.productLabel,
            expirationDate: c.expiryDate,
            attributes:     c.hasAttributes ? 'Yes' : '-'
          })));
          this.componentsTotal.set(totalCount);
        },
        error: () => this.snackbarService.showError('Failed to load components')
      });
  }

  onPageChange(event: any): void {
    this.componentsPageSize.set(event.pageSize);
    this.componentsPageIndex.set(event.pageIndex);
    this.loadComponents();
  }

  onSelectComponentForStatus(component: ComponentGridItem): void {
    this.selectedComponentForStatus.set(component.internalUnitId);
    this.selectedComponentUnitId.set(component.internalUnitId);
    this.selectedComponentProductCode.set(component.productCode);
    this.selectedComponentHasAttributes.set(!!component.attributes && component.attributes !== '-');
    this.selectedComponentAttributes.set([]);

    this.bloodCheckinService.getComponentAttributes(component.internalUnitId, component.productCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (attrs) => this.selectedComponentAttributes.set(attrs),
        error: () => this.snackbarService.showError('Failed to load component attributes')
      });
  }

  onUpdateComponentStatus(): void {
    const unitId = this.selectedComponentForStatus();
    if (!unitId) return;

    this.componentLoading.set(true);
    this.bloodCheckinService.updateComponentStatus(unitId, this.componentStatusValue)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.componentLoading.set(false);
          this.snackbarService.showSuccess(`Status updated to ${this.componentStatusValue} for unit ${unitId}.`);
          this.loadComponents();
        },
        error: (err) => {
          this.componentLoading.set(false);
          this.snackbarService.showError(err.error?.message || 'Failed to update component status');
        }
      });
  }

  // ── Attribute Management ──────────────────────────────────────────

  onAddAttribute(): void {
    if (this.attributeForm.invalid) return;

    const unitId      = this.selectedComponentUnitId();
    const productCode = this.selectedComponentProductCode();
    const batch       = this.currentBatch();

    if (!unitId || !productCode || !batch) {
      this.snackbarService.showError('Select a component first');
      return;
    }

    const { attribGroup, attribCode } = this.attributeForm.value;
    const dto = [{ unitId, productCode, attribGroup, attribCode, chapterId: batch.chapterId }];

    this.bloodCheckinService.addComponentAttributes(unitId, productCode, batch.productType, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackbarService.showSuccess('Attribute added.');
          this.attributeForm.reset();
          // Reload attributes for the selected row
          this.bloodCheckinService.getComponentAttributes(unitId, productCode)
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (attrs) => this.selectedComponentAttributes.set(attrs) });
          // Update grid row: '-' → 'Yes'
          this.components.update(rows =>
            rows.map(r => r.internalUnitId === unitId && r.productCode === productCode
              ? { ...r, attributes: 'Yes' }
              : r)
          );
        },
        error: (err) => this.snackbarService.showError(err.error?.message || 'Failed to add attribute')
      });
  }

  // ── Carton ────────────────────────────────────────────────────────

  onCartonIdChange(index: number, value: string): void {
    const updated = [...this.cartons()];
    updated[index] = { ...updated[index], cartonNo: +value || updated[index].cartonNo };
    this.cartons.set(updated);
    this.cartonsChanged.set(true);
  }

  // ── Accessors ─────────────────────────────────────────────────────

  get f()  { return this.batchForm.controls; }
  get cf() { return this.componentForm.controls; }

  get attributeGroupDescription(): string {
    const groupValue = this.attributeForm?.get('attribGroup')?.value;
    const match = this.attrGroupLovOptions().find(o => o.value === groupValue);
    return match?.label || '';
  }

  get attributeCodeDescription(): string {
    const codeValue = this.attributeForm?.get('attribCode')?.value;
    const match = this.attrCodeLovOptions().find(o => o.value === codeValue);
    return match?.label || '';
  }
}
