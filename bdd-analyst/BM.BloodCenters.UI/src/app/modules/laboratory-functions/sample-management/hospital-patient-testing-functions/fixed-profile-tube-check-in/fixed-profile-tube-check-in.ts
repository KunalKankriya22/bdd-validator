import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
  effect,
  ViewChild,
  ViewChildren,
  QueryList,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { A11yModule } from '@angular/cdk/a11y';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { ProfileTestsComponent } from '@shared/components/profile-tests/profile-tests';
import { FixedProfileUnitsInBatchComponent } from './components/fixed-profile-units-in-batch';

import { FixedProfileTubeCheckInService } from './services/fixed-profile-tube-check-in.service';
import {
  ContractOption,
  BatchDropdownDto,
  TubeCheckinQueryDto,
  CreateTubeCheckinRequestDto,
  TubeCheckInTableRow,
  FixedProfileTubeCheckinDto,
  TubeAvailability,
  BatchCheckinRequestDto,
} from './models/fixed-profile-tube-check-in.model';
import moment, { Moment } from 'moment';

@Component({
  selector: 'app-fixed-profile-tube-check-in',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    A11yModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
    ProfileTestsComponent,
    FixedProfileUnitsInBatchComponent,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './fixed-profile-tube-check-in.html',
  styleUrls: ['./fixed-profile-tube-check-in.scss'],
})
export class FixedProfileTubeCheckInComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly snackbarService = inject(SnackbarService);
  private readonly service = inject(FixedProfileTubeCheckInService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: 'Fixed Profile Tube Check-In',
    subtitle: 'Patients with a predefined tube profile, enabling quick verification and confirmation without modifying tube details.',
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [{ label: 'Home', link: '/home' }, { label: pageData.title, link: null }],
          title: pageData.title,
          subtitle: pageData.subtitle || this.headerConfig.subtitle,
        };
      }
    });
  }

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly hasRetrieved = signal(false);
  private readonly formValues = signal<any>({});

  readonly contractOptions = signal<ContractOption[]>([]);
  readonly batchOptions = signal<BatchDropdownDto[]>([]);
  readonly selectedContract = signal<ContractOption | null>(null);

  contractSearchCtrl = new FormControl('');
  batchSearchCtrl = new FormControl('');
  filterForm!: FormGroup;

  readonly filteredContracts = computed(() => {
    const search = (this.contractSearchCtrl.value || '').toLowerCase();
    const contracts = this.contractOptions();
    if (!search) return contracts;
    return contracts.filter(
      (c) =>
        c.contractId.toLowerCase().includes(search) ||
        c.description.toLowerCase().includes(search)
    );
  });

  readonly filteredBatches = computed(() => {
    const search = (this.batchSearchCtrl.value || '').toLowerCase();
    const batches = this.batchOptions();
    if (!search) return batches;
    return batches.filter((b) => b.batchId.toLowerCase().includes(search));
  });

  readonly selectedContractDescription = computed(() => {
    const contract = this.selectedContract();
    return contract?.description || '';
  });

  readonly isTubeFieldEnabled = computed<TubeAvailability>(() => {
    const contract = this.selectedContract();
    if (!contract) {
      return { red1: true, red2: true, purple1: true, purple2: true };
    }
    return {
      red1: contract.redTubeAvailable,
      red2: contract.red2TubeAvailable,
      purple1: contract.purpleTubeAvailable,
      purple2: contract.purple2TubeAvailable,
    };
  });

  readonly showProfileTestsPanel = signal(false);
  readonly showUnitsInBatchPanel = signal(false);
  readonly validationErrorMessage = signal('');

  @ViewChildren(UnitIdFieldComponent) unitIdFields!: QueryList<UnitIdFieldComponent>;

  private currentOsUnitId = '';
  private currentTubeFields: Record<string, string> = {};

  private rawData = signal<FixedProfileTubeCheckinDto[]>([]);
  private batchUnitsData = signal<FixedProfileTubeCheckinDto[]>([]);
  private pageSize = 10;
  private pageIndex = 0;
  private sortColumn = '';
  private sortOrder = '';

  readonly tableData = computed<TubeCheckInTableRow[]>(() => {
    return this.rawData().map((dto, index) => ({
      sNo: dto.sequenceNo || dto.unitSeq || (this.pageIndex * this.pageSize + index + 1),
      osUnitId: dto.osUnitId || '',
      unitId: dto.unitId || '',
      red1: this.mapFlag(dto.redTubeFlag),
      red2: this.mapFlag(dto.redTube2),
      purple1: this.mapFlag(dto.purpleTubeFlag),
      purple2: this.mapFlag(dto.serumPlasmaInd),
    }));
  });

  readonly unitsInBatchData = computed(() => {
    return this.batchUnitsData().map((dto, index) => ({
      sequence: dto.sequenceNo || dto.unitSeq || (index + 1),
      unitId: dto.unitId || dto.osUnitId || '',
      red1: this.mapFlag(dto.redTubeFlag),
      red2: this.mapFlag(dto.redTube2),
      purple1: this.mapFlag(dto.purpleTubeFlag),
      purple2: this.mapFlag(dto.serumPlasmaInd),
    }));
  });

  tableConfig: DataTableConfig<TubeCheckInTableRow> = {
    columns: [
      { key: 'sNo', header: 'S.No', width: '70px', sortable: false },
      { key: 'osUnitId', header: 'OS Unit ID', sortable: true },
      { key: 'unitId', header: 'Unit ID', sortable: true },
      { key: 'red1', header: 'Red 1', sortable: false, width: '90px' },
      { key: 'red2', header: 'Red 2', sortable: false, width: '90px' },
      { key: 'purple1', header: 'Purple 1', sortable: false, width: '90px' },
      { key: 'purple2', header: 'Purple 2', sortable: false, width: '90px' },
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
    emptyMessage: 'No tube check-in records found',
    emptySubMessage: 'Try adjusting your filter criteria',
  };


  readonly canSave = computed(() => {
    return !!this.currentOsUnitId && !this.isSaving();
  });

  readonly canRetrieve = computed(() => {
    const f = this.formValues();
    // Contract ID, Collection Date, Receipt Date are required
    // Tube validation happens on RETRIEVE click, not here
    return !!(f.contractId && f.collectionDate && f.receiptDate);
  });

  readonly hasFilterValues = computed(() => {
    const f = this.formValues();
    return !!(f.contractId || f.batchId || f.collectionDate || f.receiptDate);
  });

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initForm();
    this.subscribeToChapterChanges();
    this.loadContracts();
    this.subscribeToContractSearch();
    this.subscribeToBatchSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.filterForm = this.fb.group({
      contractId: [null, Validators.required],
      batchId: [null],
      collectionDate: [null, Validators.required],
      receiptDate: [null, Validators.required],
      red1: [null],
      red2: [null],
      purple1: [null],
      purple2: [null],
    }, {
      validators: [this.dateValidators.bind(this), this.tubeValidators.bind(this)]
    });

    // Track form changes in signal for reactive computed
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((values) => {
        this.formValues.set(values);
        // Trigger validation on tube field changes
        this.filterForm.updateValueAndValidity({ emitEvent: false });
      });

    // Initialize formValues
    this.formValues.set(this.filterForm.value);
  }

  /**
   * Date validators based on FMB analysis
   * Collection Date: Error 0055 (future), 7020 (>9 days old)
   * Receipt Date: Error 5221 (future), 1171 (< collection date)
   *
   * NOTE: Only validates when creating NEW batch (batchId is empty)
   * Existing batches have historical dates that should not be validated
   */
  private dateValidators(group: FormGroup): { [key: string]: any } | null {
    const batchId = group.get('batchId')?.value;
    const collectionDate = group.get('collectionDate')?.value;
    const receiptDate = group.get('receiptDate')?.value;
    const errors: { [key: string]: any } = {};

    // Skip date validations for existing batches (only validate for NEW batches)
    if (batchId) {
      return null;
    }

    // Get today's date in chapter's timezone
    const today = this.chapterTimezoneService.isChapterLocalDateAvailable()
      ? this.chapterTimezoneService.getChapterLocalDate().startOf('day')
      : moment().startOf('day');

    if (collectionDate) {
      const collDate = moment(collectionDate).startOf('day');

      // Error 0055: Collection date cannot be in the future
      if (collDate.isAfter(today)) {
        errors['collectionDateFuture'] = {
          message: 'Error 0055: Collection date cannot be in the future'
        };
      }

      // Error 7020: Collection date cannot be more than 9 days old
      const nineDaysAgo = today.clone().subtract(9, 'days');
      if (collDate.isBefore(nineDaysAgo)) {
        errors['collectionDateTooOld'] = {
          message: 'Error 7020: Collection date cannot be more than 9 days old'
        };
      }
    }

    if (receiptDate) {
      const rcptDate = moment(receiptDate).startOf('day');

      // Error 5221: Receipt date cannot be in the future
      if (rcptDate.isAfter(today)) {
        errors['receiptDateFuture'] = {
          message: 'Error 5221: Receipt date cannot be in the future'
        };
      }

      // Error 1171: Receipt date cannot be before collection date
      if (collectionDate) {
        const collDate = moment(collectionDate).startOf('day');
        if (rcptDate.isBefore(collDate)) {
          errors['receiptDateBeforeCollection'] = {
            message: 'Error 1171: Receipt date cannot be before collection date'
          };
        }
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  /**
   * Tube field validators based on FMB analysis
   * Error codes: 0029 (at least one tube), 9323 (R2 requires R1, P2 requires P1), 2155 (invalid value)
   */
  private tubeValidators(group: FormGroup): { [key: string]: any } | null {
    const red1 = group.get('red1')?.value;
    const red2 = group.get('red2')?.value;
    const purple1 = group.get('purple1')?.value;
    const purple2 = group.get('purple2')?.value;

    const errors: { [key: string]: any } = {};

    // Validation 1: At least one tube must be specified (Error 0029)
    const hasAtLeastOneTube = red1 || red2 || purple1 || purple2;
    if (!hasAtLeastOneTube) {
      errors['atLeastOneTube'] = { message: 'Error 0029: At least one tube must be specified' };
    }

    // Validation 2: R2 requires R1 (Error 9323)
    if (red2 && !red1) {
      errors['r2RequiresR1'] = { message: 'Error 9323: R2 requires R1 to be selected' };
    }

    // Validation 3: P2 requires P1 (Error 9323)
    if (purple2 && !purple1) {
      errors['p2RequiresP1'] = { message: 'Error 9323: P2 requires P1 to be selected' };
    }

    // Validation 4: Tube values must be Y, P, or S (Error 2155)
    const validValues = ['Y', 'P', 'S'];
    if (red1 && !validValues.includes(red1)) {
      errors['invalidRed1'] = { message: 'Error 2155: Red 1 must be Y, P, or S' };
    }
    if (red2 && !validValues.includes(red2)) {
      errors['invalidRed2'] = { message: 'Error 2155: Red 2 must be Y, P, or S' };
    }
    if (purple1 && !validValues.includes(purple1)) {
      errors['invalidPurple1'] = { message: 'Error 2155: Purple 1 must be Y, P, or S' };
    }
    if (purple2 && !validValues.includes(purple2)) {
      errors['invalidPurple2'] = { message: 'Error 2155: Purple 2 must be Y, P, or S' };
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetAll();
        this.loadContracts();
      });
  }

  private subscribeToContractSearch(): void {
    this.contractSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.contractOptions.update((v) => [...v]);
      });
  }

  private subscribeToBatchSearch(): void {
    this.batchSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.batchOptions.update((v) => [...v]);
      });
  }

  private loadContracts(): void {
    this.isLoading.set(true);
    this.service
      .getContracts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contracts) => {
          this.contractOptions.set(contracts);
          this.isLoading.set(false);
        },
        error: () => {
          this.snackbarService.showError('Failed to load contracts');
          this.isLoading.set(false);
        },
      });
  }

  onContractChange(contractId: string): void {
    const contract = this.contractOptions().find((c) => c.contractId === contractId) || null;
    this.selectedContract.set(contract);
    this.filterForm.patchValue({ batchId: null });
    this.batchSearchCtrl.setValue('');
    this.batchOptions.set([]);
    this.hasRetrieved.set(false);
    this.rawData.set([]);

    // Set tube field defaults to null - user must select tube types
    // This ensures proper validation (at least one tube required)
    if (contract) {
      this.filterForm.patchValue({
        red1: null,
        red2: null,
        purple1: null,
        purple2: null,
      });
    }

    this.clearDisabledTubeFields();

    if (!contractId) return;

    this.service
      .getBatches(contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (batches) => {
          this.batchOptions.set(batches || []);
          if (!batches || batches.length === 0) {
            this.snackbarService.showError('Error 1093: No data found for the given contract ID');
          }
        },
        error: (err) => {
          this.snackbarService.showError('Failed to load batches');
        },
      });
  }

  onBatchChange(batchId: string | null): void {
    // Reset data when batch changes
    this.rawData.set([]);
    this.hasRetrieved.set(false);
    this.pageIndex = 0;
    if (this.tableConfig.pagination) {
      this.tableConfig = {
        ...this.tableConfig,
        pagination: {
          ...this.tableConfig.pagination!,
          pageIndex: 0,
          totalRecords: 0,
        },
      };
    }

    if (!batchId) {
      return;
    }

    // Fetch batch details to auto-populate dates and tube flags
    const contractId = this.filterForm.get('contractId')?.value;
    if (contractId) {
      const query: TubeCheckinQueryDto = {
        contractId,
        batchId,
      };

      this.isLoading.set(true);
      this.service
        .getAll(1, 0, query)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading.set(false);
            if (response.data && response.data.length > 0) {
              const batchData = response.data[0];
              // Auto-populate collection date, receipt date, and tube flags
              // Need to parse date strings to moment objects for datepicker
              const collDate = batchData.collDate ? this.parseDateString(batchData.collDate) : null;
              const receiptDate = batchData.receivedDate ? this.parseDateString(batchData.receivedDate) : null;

              this.filterForm.patchValue({
                collectionDate: collDate,
                receiptDate: receiptDate,
                red1: batchData.redTubeFlag || null,
                red2: batchData.redTube2 || null,
                purple1: batchData.purpleTubeFlag || null,
                purple2: batchData.serumPlasmaInd || null,
              });
            }
          },
          error: () => {
            this.isLoading.set(false);
            this.snackbarService.showError('Failed to load batch details');
          },
        });
    }
  }

  onRetrieve(): void {
    // Validate dates and tube configuration before proceeding
    if (this.filterForm.invalid) {
      // Collect all validation errors and show in snackbar
      const errors = this.filterForm.errors || {};
      const errorMessages: string[] = [];

      // Date validation errors
      if (errors['collectionDateFuture']) {
        errorMessages.push(errors['collectionDateFuture'].message);
      }
      if (errors['collectionDateTooOld']) {
        errorMessages.push(errors['collectionDateTooOld'].message);
      }
      if (errors['receiptDateFuture']) {
        errorMessages.push(errors['receiptDateFuture'].message);
      }
      if (errors['receiptDateBeforeCollection']) {
        errorMessages.push(errors['receiptDateBeforeCollection'].message);
      }

      // Tube validation errors
      if (errors['atLeastOneTube']) {
        errorMessages.push(errors['atLeastOneTube'].message);
      }
      if (errors['r2RequiresR1']) {
        errorMessages.push(errors['r2RequiresR1'].message);
      }
      if (errors['p2RequiresP1']) {
        errorMessages.push(errors['p2RequiresP1'].message);
      }
      if (errors['invalidRed1']) {
        errorMessages.push(errors['invalidRed1'].message);
      }
      if (errors['invalidRed2']) {
        errorMessages.push(errors['invalidRed2'].message);
      }
      if (errors['invalidPurple1']) {
        errorMessages.push(errors['invalidPurple1'].message);
      }
      if (errors['invalidPurple2']) {
        errorMessages.push(errors['invalidPurple2'].message);
      }

      // Show all errors in snackbar and aria-live region
      if (errorMessages.length > 0) {
        const combinedMessage = errorMessages.join('\n');
        this.snackbarService.showError(combinedMessage);
        this.validationErrorMessage.set(combinedMessage);
      }
      return;
    }

    this.validationErrorMessage.set('');
    const f = this.filterForm.value;
    const batchIdValue = f.batchId;

    // If batch ID is empty, proceed to entry section
    // Backend will auto-generate batch ID when first unit is saved
    if (!batchIdValue || batchIdValue.trim() === '') {
      this.snackbarService.showInfo('New batch will be created when first unit is saved');
      this.showEntrySection();
    } else {
      // Existing batch - just show the entry section
      this.showEntrySection();
    }
  }

  private showEntrySection(): void {
    // Set hasRetrieved to true to show the data entry section
    // Main table should remain empty - it only shows newly scanned units in current session
    // Previously saved units for the batch are only visible in "View Units in Batch" dialog
    this.rawData.set([]);
    this.hasRetrieved.set(true);
    this.pageIndex = 0;

    if (this.tableConfig.pagination) {
      this.tableConfig = {
        ...this.tableConfig,
        pagination: {
          ...this.tableConfig.pagination!,
          pageIndex: 0,
          totalRecords: 0,
        },
      };
    }
  }

  onPageChange(event: any): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    if (this.tableConfig.pagination) {
      this.tableConfig = {
        ...this.tableConfig,
        pagination: {
          ...this.tableConfig.pagination!,
          pageSize: event.pageSize,
          pageIndex: event.pageIndex,
        },
      };
    }
    this.onRetrieve();
  }

  onSortChange(event: any): void {
    this.sortColumn = event.column || '';
    this.sortOrder = event.direction === 'asc' ? 'ASC' : event.direction === 'desc' ? 'DESC' : '';
    this.pageIndex = 0;
    this.onRetrieve();
  }

  onSave(): void {
    if (!this.currentOsUnitId) {
      this.snackbarService.showError('OS Unit ID is required');
      return;
    }

    // Validate required fields
    if (!this.filterForm.valid) {
      this.filterForm.markAllAsTouched();
      this.snackbarService.showError('Please fill all required fields');
      return;
    }

    const f = this.filterForm.value;
    const rawBatchId = f.batchId;

    // NEW API: Use batch check-in endpoint with BATCH_INPUTS and UTRS scheduling
    const batchRequest: BatchCheckinRequestDto = {
      batchId: rawBatchId || 'NEW', // 'NEW' triggers auto-generation (MMDDYY-TS####)
      contractId: f.contractId || '',
      collDate: f.collectionDate ? this.toIso(f.collectionDate) : '',
      receivedDate: f.receiptDate ? this.toIso(f.receiptDate) : '',
      units: [
        {
          osUnitId: this.currentOsUnitId,
          unitId: this.currentOsUnitId,
          redTubeFlag: this.currentTubeFields['red1'] ? 'Y' : null,
          redTube2: this.currentTubeFields['red2'] ? 'Y' : null,
          purpleTubeFlag: this.currentTubeFields['purple1'] ? 'Y' : null,
          serumPlasmaInd: this.currentTubeFields['purple2'] ? 'Y' : null,
        }
      ]
    };

    this.isSaving.set(true);
    this.service
      .batchCheckin(batchRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSaving.set(false);
          if (response.success && response.item) {
            const { batchId, unitsProcessed, testsScheduled } = response.item;
            this.snackbarService.showSuccess(
              `Batch ${batchId} created! ${unitsProcessed} unit(s) checked in, ${testsScheduled} test(s) scheduled.`
            );

            // Update the batch dropdown with the new batch
            const contractId = f.contractId;
            if (contractId) {
              this.service.getBatches(contractId)
                .pipe(takeUntil(this.destroy$))
                .subscribe((batches) => {
                  this.batchOptions.set(batches);
                  // Set the batchId in the form
                  this.filterForm.patchValue({ batchId }, { emitEvent: false });
                  // Clear entry fields and reload
                  this.clearEntryFields();
                  this.onRetrieve();
                });
            } else {
              // Fallback if no contractId
              this.filterForm.patchValue({ batchId }, { emitEvent: false });
              this.clearEntryFields();
              this.onRetrieve();
            }
          } else {
            this.snackbarService.showError(this.formatErrorMessage(response.message || 'Failed to save'));
          }
        },
        error: (error) => {
          this.isSaving.set(false);
          const msg = error?.error?.message || error?.error?.errorResponse?.error || 'Failed to save tube check-in';
          this.snackbarService.showError(this.formatErrorMessage(msg));
        },
      });
  }

  onClearAll(): void {
    this.resetAll();
  }

  onClearTableEntries(): void {
    this.clearEntryFields();
  }

  onViewProfileTests(): void {
    this.showProfileTestsPanel.set(true);
  }

  onViewUnitsInBatch(): void {
    const batchId = this.filterForm.get('batchId')?.value;
    if (!batchId) {
      this.snackbarService.showError('Please select a Batch ID first');
      return;
    }

    // Fetch all units in the batch from API
    const contractId = this.filterForm.get('contractId')?.value;
    if (contractId) {
      const query: TubeCheckinQueryDto = {
        contractId,
        batchId,
      };

      this.isLoading.set(true);
      this.service
        .getAll(100, 0, query) // Fetch up to 100 units in batch
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading.set(false);
            this.batchUnitsData.set(response.data || []);
            this.showUnitsInBatchPanel.set(true);
          },
          error: () => {
            this.isLoading.set(false);
            this.snackbarService.showError('Failed to load batch units');
          },
        });
    }
  }

  onCloseProfileTests(): void {
    this.showProfileTestsPanel.set(false);
  }

  onCloseUnitsInBatch(): void {
    this.showUnitsInBatchPanel.set(false);
  }

  onOsUnitIdValidated(response: UnitValidationResponse): void {
    this.currentOsUnitId = response.parsedUnitId || '';
  }

  onOsUnitIdCleared(): void {
    this.currentOsUnitId = '';
  }

  onTubeFieldValidated(response: UnitValidationResponse, field: string): void {
    const tubeUnitId = response.parsedUnitId || '';

    // Critical validation: Tube unit ID must match base OS Unit ID (Error 3455)
    if (tubeUnitId && this.currentOsUnitId && tubeUnitId !== this.currentOsUnitId) {
      this.snackbarService.showError(`Error 3455: Tube unit ID must match base unit ID (${this.currentOsUnitId})`);
      // Clear the invalid tube field
      this.currentTubeFields[field] = '';
      return;
    }

    this.currentTubeFields[field] = tubeUnitId;

    // Auto-save when all required tubes are filled
    this.checkAndAutoSave();
  }

  private checkAndAutoSave(): void {
    // Check if OS Unit ID is filled
    if (!this.currentOsUnitId) {
      return;
    }

    // Get selected tubes from main form (not from contract availability)
    const f = this.filterForm.value;
    const selectedTubes = {
      red1: !!f.red1,
      red2: !!f.red2,
      purple1: !!f.purple1,
      purple2: !!f.purple2,
    };

    // Check if at least one tube is selected in main form
    const hasAtLeastOneTubeSelected =
      selectedTubes.red1 || selectedTubes.red2 || selectedTubes.purple1 || selectedTubes.purple2;

    if (!hasAtLeastOneTubeSelected) {
      return;
    }

    // Check if all SELECTED tubes have been scanned
    const allSelectedTubesFilled =
      (!selectedTubes.red1 || this.currentTubeFields['red1']) &&
      (!selectedTubes.red2 || this.currentTubeFields['red2']) &&
      (!selectedTubes.purple1 || this.currentTubeFields['purple1']) &&
      (!selectedTubes.purple2 || this.currentTubeFields['purple2']);

    if (allSelectedTubesFilled) {
      // Add unit to DB and table
      this.addUnitToTable();
    }
  }

  private addUnitToTable(): void {
    // Save unit to database immediately when all required tubes are filled
    if (!this.currentOsUnitId) {
      return;
    }

    // Check for duplicate OS_UNIT_ID in local table (Error 0340)
    const currentData = this.rawData();
    const isDuplicate = currentData.some(row => row.osUnitId === this.currentOsUnitId);
    if (isDuplicate) {
      this.snackbarService.showError(`Error 0340: Duplicate OS Unit ID: ${this.currentOsUnitId}`);
      return;
    }

    const f = this.filterForm.value;
    const rawBatchId = f.batchId;

    // Capture the current OS Unit ID before it gets cleared
    const savedOsUnitId = this.currentOsUnitId;

    // Map tube indicators from form to API values (Y/P/S)
    const redTubeFlag = f.red1 && this.currentTubeFields['red1'] ? f.red1 : null;
    const redTube2 = f.red2 && this.currentTubeFields['red2'] ? f.red2 : null;
    const purpleTubeFlag = f.purple1 && this.currentTubeFields['purple1'] ? f.purple1 : null;
    const serumPlasmaInd = f.purple2 && this.currentTubeFields['purple2'] ? f.purple2 : null;

    // Call API to save unit immediately
    const batchRequest: BatchCheckinRequestDto = {
      batchId: rawBatchId || null, // null = backend auto-generates
      contractId: f.contractId || '',
      collDate: f.collectionDate ? this.toIso(f.collectionDate) : '',
      receivedDate: f.receiptDate ? this.toIso(f.receiptDate) : '',
      units: [
        {
          osUnitId: savedOsUnitId,
          unitId: savedOsUnitId,
          redTubeFlag,
          redTube2,
          purpleTubeFlag,
          serumPlasmaInd,
        }
      ]
    };

    this.isSaving.set(true);
    this.service
      .batchCheckin(batchRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSaving.set(false);
          if (response.success && response.item) {
            const { batchId, unitsProcessed, testsScheduled } = response.item;

            // Update batch ID if it was auto-generated
            if (batchId && batchId !== rawBatchId) {
              // Reload batches to include the newly created batch
              const contractId = f.contractId;
              if (contractId) {
                this.service.getBatches(contractId)
                  .pipe(takeUntil(this.destroy$))
                  .subscribe((batches) => {
                    this.batchOptions.set(batches);
                    this.filterForm.patchValue({ batchId }, { emitEvent: false });
                    this.formValues.set(this.filterForm.value);
                  });
              } else {
                this.filterForm.patchValue({ batchId }, { emitEvent: false });
                this.formValues.set(this.filterForm.value);
              }
            }

            // Fetch the newly saved unit from API to get correct sequence number
            const contractId = f.contractId;
            if (contractId && batchId) {
              const query: TubeCheckinQueryDto = {
                contractId,
                batchId,
              };

              this.service.getAll(100, 0, query)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: (dataResponse) => {
                    // Find the newly added unit by osUnitId (use captured value)
                    const allUnits = dataResponse.data || [];
                    const newlyAddedUnit = allUnits.find(u => u.osUnitId === savedOsUnitId);

                    if (newlyAddedUnit) {
                      const currentData = this.rawData();
                      this.rawData.set([...currentData, newlyAddedUnit]);

                      // Update pagination totalRecords
                      if (this.tableConfig.pagination) {
                        this.tableConfig = {
                          ...this.tableConfig,
                          pagination: {
                            ...this.tableConfig.pagination,
                            totalRecords: currentData.length + 1,
                          },
                        };
                      }
                    }
                  },
                  error: () => {
                    // If reload fails, just add manually without sequence
                    const currentData = this.rawData();
                    const newRow: FixedProfileTubeCheckinDto = {
                      osUnitId: savedOsUnitId,
                      unitId: savedOsUnitId,
                      collDate: f.collectionDate ? this.toIso(f.collectionDate) : null,
                      receivedDate: f.receiptDate ? this.toIso(f.receiptDate) : null,
                      chapterId: null,
                      batchId: batchId,
                      contractId: f.contractId || null,
                      redTubeFlag,
                      purpleTubeFlag,
                      redTube2,
                      serumPlasmaInd,
                      warehouseId: null,
                      programId: null,
                      insertDats: new Date().toISOString(),
                      osChkDigit: null,
                      chkDigit: null,
                      unitSeq: currentData.length + 1,
                    };
                    this.rawData.set([...currentData, newRow]);

                    // Update pagination totalRecords
                    if (this.tableConfig.pagination) {
                      this.tableConfig = {
                        ...this.tableConfig,
                        pagination: {
                          ...this.tableConfig.pagination,
                          totalRecords: currentData.length + 1,
                        },
                      };
                    }
                  }
                });
            }

            // Clear entry fields
            this.clearEntryFields();

            // Show success
            this.snackbarService.showSuccess(
              `Unit ${savedOsUnitId} saved to batch ${batchId}! ${testsScheduled} test(s) scheduled.`
            );
          } else {
            this.snackbarService.showError(response.message || 'Failed to save unit');
          }
        },
        error: (error) => {
          this.isSaving.set(false);
          const msg = error?.error?.message || error?.error?.errorResponse?.error || 'Failed to save unit';
          this.snackbarService.showError(msg);
        },
      });
  }

  onTubeFieldCleared(field: string): void {
    delete this.currentTubeFields[field];
  }

  private clearEntryFields(): void {
    this.currentOsUnitId = '';
    this.currentTubeFields = {};

    // Clear all unit ID input fields
    if (this.unitIdFields) {
      this.unitIdFields.forEach(field => field.clear());
    }
  }

  private clearDisabledTubeFields(): void {
    const enabled = this.isTubeFieldEnabled();
    if (!enabled.red1) delete this.currentTubeFields['red1'];
    if (!enabled.red2) delete this.currentTubeFields['red2'];
    if (!enabled.purple1) delete this.currentTubeFields['purple1'];
    if (!enabled.purple2) delete this.currentTubeFields['purple2'];
  }

  private resetAll(): void {
    this.filterForm.reset();
    this.contractSearchCtrl.setValue('');
    this.batchSearchCtrl.setValue('');
    this.selectedContract.set(null);
    this.batchOptions.set([]);
    this.rawData.set([]);
    this.hasRetrieved.set(false);
    this.pageIndex = 0;
    this.sortColumn = '';
    this.sortOrder = '';
    this.clearEntryFields();
    if (this.tableConfig.pagination) {
      this.tableConfig = {
        ...this.tableConfig,
        pagination: {
          ...this.tableConfig.pagination!,
          pageIndex: 0,
          totalRecords: 0,
        },
      };
    }
  }

  private mapFlag(value: string | null): string {
    if (!value) return '';
    if (value === 'Y') return 'Yes';
    if (value === 'P') return 'Plasma';
    if (value === 'S') return 'Serum';
    return value;
  }

  /**
   * Format error messages to have error code as prefix with "Error" prefix
   * Example: "Unit already exists. Error Code: 0340" -> "Error 0340: Unit already exists"
   * If no error code pattern found, adds "Error" prefix if not already present
   */
  private formatErrorMessage(message: string): string {
    // Match pattern: "message. Error Code: XXXX" or "message Error Code: XXXX"
    const errorCodePattern = /^(.+?)\.?\s*Error Code:\s*(\d+)$/i;
    const match = message.match(errorCodePattern);

    if (match) {
      const errorMessage = match[1].trim();
      const errorCode = match[2];
      return `Error ${errorCode}: ${errorMessage}`;
    }

    // If message already starts with "Error", return as-is
    if (message.startsWith('Error ')) {
      return message;
    }

    // If message starts with a number (error code), add "Error" prefix
    const errorCodePrefixPattern = /^(\d+):\s*(.+)$/;
    const codeMatch = message.match(errorCodePrefixPattern);
    if (codeMatch) {
      return `Error ${codeMatch[1]}: ${codeMatch[2]}`;
    }

    return message;
  }

  private toIso(dateMoment: Moment | string): string {
    if (typeof dateMoment === 'string') return dateMoment;
    return dateMoment.format('YYYY-MM-DDTHH:mm:ss');
  }

  private parseDateString(dateString: string): Moment | null {
    // Parse ISO date string to moment object for datepicker
    if (!dateString) return null;
    return moment(dateString);
  }
}
