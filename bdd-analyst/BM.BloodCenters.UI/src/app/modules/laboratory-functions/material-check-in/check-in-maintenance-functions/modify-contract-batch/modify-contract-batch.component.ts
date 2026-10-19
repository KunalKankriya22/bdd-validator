import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';

import { ModifyContractBatchApiService } from './services/modify-contract-batch-api.service';
import {
  UnitDto,
  QueryContractBatchResponseDto,
  ContractOption,
  BatchOption,
  ProfileSetOption,
  ReceivedDateOption,
} from './models/modify-contract-batch.model';

@Component({
  selector: 'app-modify-contract-batch',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatCheckboxModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
  ],
  providers: [
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
  templateUrl: './modify-contract-batch.component.html',
  styleUrl: './modify-contract-batch.component.scss',
})
export class ModifyContractBatchComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `modify-contract-batch-${ModifyContractBatchComponent.nextId++}`;

  // Generate unique IDs for form elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Dependency injection
  private readonly apiService = inject(ModifyContractBatchApiService);
  private readonly fb = inject(FormBuilder);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  private readonly defaultTitle = 'Modify Contract for Hospital/Patient Batch';

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: this.defaultTitle, link: null },
    ],
    title: this.defaultTitle,
    subtitle: 'A flexible check-in process that allows users to manually select and configure tube details at the time of check-in.',
    actions: [],
  };

  // Forms
  oldContractForm!: FormGroup;
  newContractForm!: FormGroup;

  // Signal-based state
  private selectedOldContractId = signal('');
  private selectedNewContractId = signal('');
  oldContractData = signal<QueryContractBatchResponseDto | null>(null);
  units = signal<UnitDto[]>([]);
  selectedUnits = signal<Set<string>>(new Set());
  loading = signal(false);
  error = signal<string | null>(null);
  newContractValid = signal(false);

  // Dropdown options
  contractOptions = signal<ContractOption[]>([]);
  oldReceivedDateOptions = signal<ReceivedDateOption[]>([]);
  oldBatchOptions = signal<BatchOption[]>([]);
  newBatchOptions = signal<BatchOption[]>([]);
  newProfileSetOptions = signal<ProfileSetOption[]>([]);

  // Search controls for dropdowns
  readonly oldContractSearchControl = new FormControl('');
  readonly oldRcvdCollDateSearchControl = new FormControl('');
  readonly oldBatchSearchControl = new FormControl('');
  readonly newContractSearchControl = new FormControl('');
  readonly newBatchSearchControl = new FormControl('');
  readonly newProfileSetSearchControl = new FormControl('');

  private readonly oldContractSearch = signal('');
  private readonly oldRcvdCollDateSearch = signal('');
  private readonly oldBatchSearch = signal('');
  private readonly newContractSearch = signal('');
  private readonly newBatchSearch = signal('');
  private readonly newProfileSetSearch = signal('');

  // Computed signals
  filteredOldContracts = computed(() => {
    const search = this.oldContractSearch().toUpperCase();
    const contracts = this.contractOptions();
    if (!search) return contracts;
    return contracts.filter(
      (c) =>
        c.contractId.toUpperCase().includes(search) ||
        (c.description && c.description.toUpperCase().includes(search)),
    );
  });

  filteredOldReceivedDates = computed(() => {
    const search = this.oldRcvdCollDateSearch().toUpperCase();
    const dates = this.oldReceivedDateOptions();
    if (!search) return dates;
    return dates.filter((d) => {
      const formatted = this.formatDate(d.receivedDate).toUpperCase();
      return formatted.includes(search);
    });
  });

  filteredOldBatches = computed(() => {
    const search = this.oldBatchSearch().toUpperCase();
    const batches = this.oldBatchOptions();
    if (!search) return batches;
    return batches.filter((b) => b.batchId.toUpperCase().includes(search));
  });

  filteredNewContracts = computed(() => {
    const search = this.newContractSearch().toUpperCase();
    const oldContractId = this.selectedOldContractId();
    const contracts = this.contractOptions().filter(
      (c) => c.contractId !== oldContractId && (c.contractType === 'TS' || c.contractType === 'CU'),
    );
    if (!search) return contracts;
    return contracts.filter(
      (c) =>
        c.contractId.toUpperCase().includes(search) ||
        (c.description && c.description.toUpperCase().includes(search)),
    );
  });

  filteredNewBatches = computed(() => {
    const search = this.newBatchSearch().toUpperCase();
    const batches = this.newBatchOptions();
    if (!search) return batches;
    return batches.filter((b) => b.batchId.toUpperCase().includes(search));
  });

  filteredNewProfileSets = computed(() => {
    const search = this.newProfileSetSearch().toUpperCase();
    const profileSets = this.newProfileSetOptions();
    if (!search) return profileSets;
    return profileSets.filter((p) => p.profileSetId.toUpperCase().includes(search));
  });

  oldContractDescription = computed(() => {
    const contractId = this.selectedOldContractId();
    const contract = this.contractOptions().find((c) => c.contractId === contractId);
    return contract?.description || '---';
  });

  newContractDescription = computed(() => {
    const contractId = this.selectedNewContractId();
    const contract = this.contractOptions().find((c) => c.contractId === contractId);
    return contract?.description || '---';
  });

  hasRetrievedData = computed(() => this.oldContractData() !== null);

  allSelected = computed(() => {
    const units = this.units();
    const selected = this.selectedUnits();
    return units.length > 0 && selected.size === units.length;
  });

  someSelected = computed(() => {
    const selected = this.selectedUnits();
    return selected.size > 0 && selected.size < this.units().length;
  });

  canModify = computed(() => {
    return this.selectedUnits().size > 0;
  });

  displayedColumns: string[] = [
    'select',
    'externalUnitId',
    'internalUnitId',
    'oldProfile',
    'newProfile',
  ];

  constructor() {
    // Subscribe to search controls
    this.oldContractSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.oldContractSearch.set(value || '');
    });

    this.oldRcvdCollDateSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.oldRcvdCollDateSearch.set(value || '');
    });

    this.oldBatchSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.oldBatchSearch.set(value || '');
    });

    this.newContractSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.newContractSearch.set(value || '');
    });

    this.newBatchSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.newBatchSearch.set(value || '');
    });

    this.newProfileSetSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.newProfileSetSearch.set(value || '');
    });

    // Page header effect
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
          subtitle: pageData.subtitle || 'A flexible check-in process that allows users to manually select and configure tube details at the time of check-in.',
        };
      }
    });
  }

  ngOnInit(): void {
    this.initializeForms();
    this.loadContractOptions();
    this.subscribeToChapterChanges();
    this.setupFormListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.oldContractForm = this.fb.group({
      oldContractId: ['', [Validators.required, Validators.maxLength(10)]],
      oldRcvdCollDate: [null],
      oldBatchId: ['', [Validators.maxLength(20)]],
      oldProfileSetId: [{ value: '', disabled: true }],
    });

    this.newContractForm = this.fb.group({
      newContractId: ['', [Validators.required, Validators.maxLength(10)]],
      newRcvdCollDate: [null],
      newBatchId: ['', [Validators.maxLength(20)]],
      newProfileSetId: [''],
    });
  }

  private setupFormListeners(): void {
    // Old Contract ID change → clear all dependent data and load received dates
    this.oldContractForm.get('oldContractId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((contractId) => {
        this.selectedOldContractId.set(contractId || '');
        this.oldContractForm.get('oldRcvdCollDate')?.reset();
        this.oldContractForm.get('oldBatchId')?.reset();
        this.oldContractForm.get('oldProfileSetId')?.reset();
        this.oldBatchOptions.set([]);
        this.oldContractData.set(null);
        this.units.set([]);
        this.selectedUnits.set(new Set());
        this.error.set(null);
        this.newContractForm.reset();
        this.newContractValid.set(false);
        this.selectedNewContractId.set('');
        this.newBatchOptions.set([]);
        this.newProfileSetOptions.set([]);
        if (contractId) {
          this.loadOldReceivedDates(contractId);
        } else {
          this.oldReceivedDateOptions.set([]);
        }
      });

    // Old Rcvd/Coll Date change → load batch IDs
    this.oldContractForm.get('oldRcvdCollDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((rcvdDate) => {
        this.oldContractForm.get('oldBatchId')?.reset();
        const contractId = this.oldContractForm.get('oldContractId')?.value;
        if (contractId && rcvdDate) {
          this.loadOldBatchOptions(contractId);
        } else {
          this.oldBatchOptions.set([]);
        }
      });

    // New Contract ID change
    this.newContractForm.get('newContractId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((contractId) => {
        this.selectedNewContractId.set(contractId || '');
        if (contractId) {
          this.loadNewBatchOptions(contractId);
          this.loadNewProfileSetOptions(contractId);
          this.validateNewContract();
        } else {
          this.newBatchOptions.set([]);
          this.newProfileSetOptions.set([]);
          this.newContractValid.set(false);
        }
      });

    // New Received/Collection Date change
    this.newContractForm.get('newRcvdCollDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateNewContract();
      });

    // New Profile Set ID change → reload new profile tests
    this.newContractForm.get('newProfileSetId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((profileSetId) => {
        const newContractId = this.newContractForm.get('newContractId')?.value;
        if (newContractId && profileSetId) {
          const contract = this.contractOptions().find((c) => c.contractId === newContractId);
          this.loadNewProfileTests(newContractId, contract?.contractType, profileSetId);
        }
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadContractOptions();
      });
  }

  private loadContractOptions(): void {
    this.apiService.getContractOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.contractOptions.set(options);
        },
        error: (error) => {
          console.error('Error loading contract options:', error);
          this.snackbarService.showError('Failed to load contract options. Please try again.');
        },
      });
  }

  private loadOldReceivedDates(contractId: string): void {
    this.apiService.getReceivedDates(contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dates) => this.oldReceivedDateOptions.set(dates),
        error: (error) => console.error('Error loading received dates:', error),
      });
  }

  private loadOldBatchOptions(contractId: string): void {
    const rcvdDate = this.oldContractForm.get('oldRcvdCollDate')?.value;
    this.apiService.getBatchOptions(contractId, rcvdDate ? moment(rcvdDate).toDate() : undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => this.oldBatchOptions.set(options),
        error: (error) => console.error('Error loading batch options:', error),
      });
  }

  private loadNewBatchOptions(contractId: string): void {
    const rcvdDate = this.newContractForm.get('newRcvdCollDate')?.value;
    const contractType = this.newContractForm.get('newContractType')?.value;
    const profileSetId = this.newContractForm.get('newProfileSetId')?.value;
    this.apiService.getBatchOptions(contractId, rcvdDate ? moment(rcvdDate).toDate() : undefined, contractType, profileSetId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => this.newBatchOptions.set(options),
        error: (error) => console.error('Error loading batch options:', error),
      });
  }

  private loadNewProfileSetOptions(contractId: string): void {
    this.apiService.getProfileSetOptions(contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => this.newProfileSetOptions.set(options),
        error: (error) => console.error('Error loading profile set options:', error),
      });
  }

  private validateNewContract(): void {
    const newContractId = this.newContractForm.get('newContractId')?.value;
    const newRcvdCollDate = this.newContractForm.get('newRcvdCollDate')?.value;

    if (!newContractId || !newRcvdCollDate) {
      this.newContractValid.set(false);
      return;
    }

    const contract = this.contractOptions().find((c) => c.contractId === newContractId);
    if (!contract) {
      this.newContractValid.set(false);
      return;
    }

    this.apiService.validateContract({
      newContractId,
      newRcvdCollDate,
      newContractType: contract.contractType,
      newBatchId: this.newContractForm.get('newBatchId')?.value,
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.newContractValid.set(response.isValid);
          if (response.isValid && response.profileSetId) {
            this.newContractForm.get('newProfileSetId')?.setValue(response.profileSetId);
          } else if (response.isValid) {
            this.loadNewProfileTests(newContractId, response.contractType);
          }
          if (!response.isValid) {
            this.snackbarService.showError(response.message || 'Invalid contract configuration');
          }
        },
        error: (error) => {
          console.error('Error validating contract:', error);
          this.newContractValid.set(false);
          const errorResponse = error?.error?.errorResponse;
          const errorMessage = (errorResponse?.errorCode && errorResponse?.error)
            ? `Error ${errorResponse.errorCode}: ${errorResponse.error}`
            : error?.error?.message || 'Failed to validate contract';
          this.snackbarService.showError(errorMessage);
        },
      });
  }

  private loadNewProfileTests(contractId: string, contractType?: string, profileSetId?: string): void {
    this.apiService.getContractTests(contractId, contractType, profileSetId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newTests) => {
          const profileString = newTests.join(', ');
          const currentUnits = this.units();
          const updatedUnits = currentUnits.map((unit) => ({
            ...unit,
            newProfile: profileString,
          }));
          this.units.set(updatedUnits);
        },
        error: (error) => console.error('Error loading new profile tests:', error),
      });
  }

  onRetrieve(): void {
    if (this.oldContractForm.invalid) {
      Object.keys(this.oldContractForm.controls).forEach((key) => {
        this.oldContractForm.get(key)?.markAsTouched();
      });
      return;
    }

    const oldContractId = this.oldContractForm.get('oldContractId')?.value;
    const oldBatchId = this.oldContractForm.get('oldBatchId')?.value;
    const oldRcvdCollDate = this.oldContractForm.get('oldRcvdCollDate')?.value;

    if (!oldContractId) {
      this.snackbarService.showError('Old Contract ID is required');
      return;
    }

    if (!oldBatchId && !oldRcvdCollDate) {
      this.snackbarService.showError('Either Batch ID or Received/Collection Date is required');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.apiService.queryContractBatch({
      oldContractId,
      oldBatchId: oldBatchId || '',
      oldRcvdCollDate: oldRcvdCollDate || new Date(),
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          this.oldContractData.set(response);
          this.units.set(response.units || []);
          this.oldContractForm.get('oldProfileSetId')?.setValue(response.oldProfileSetId);

          this.newContractForm.patchValue({
            newContractId: '',
            newRcvdCollDate: response.oldRcvdCollDate,
          });

          if (response.units.length === 0) {
            this.snackbarService.showInfo('No units found for the specified criteria');
          }
        },
        error: (error) => {
          this.loading.set(false);
          console.error('Error retrieving contract batch:', error);
          const errorResponse = error?.error?.errorResponse;
          const errorMessage = (errorResponse?.errorCode && errorResponse?.error)
            ? `Error ${errorResponse.errorCode}: ${errorResponse.error}`
            : error?.error?.message || 'Failed to retrieve contract batch. Please try again.';
          this.error.set(errorMessage);
          this.snackbarService.showError(errorMessage);
        },
      });
  }

  onClearAll(): void {
    this.oldContractForm.reset();
    this.newContractForm.reset();
    this.oldContractData.set(null);
    this.units.set([]);
    this.selectedUnits.set(new Set());
    this.error.set(null);
    this.newContractValid.set(false);
    this.selectedOldContractId.set('');
    this.selectedNewContractId.set('');
    this.oldReceivedDateOptions.set([]);
    this.oldBatchOptions.set([]);
    this.newBatchOptions.set([]);
    this.newProfileSetOptions.set([]);
    this.oldContractSearchControl.setValue('');
    this.oldRcvdCollDateSearchControl.setValue('');
    this.oldBatchSearchControl.setValue('');
    this.newContractSearchControl.setValue('');
    this.newBatchSearchControl.setValue('');
    this.newProfileSetSearchControl.setValue('');
  }

  onCancel(): void {
    this.onClearAll();
  }

  onModifyRecords(): void {
    if (this.selectedUnits().size === 0) {
      this.snackbarService.showError('Please select at least one unit to modify');
      return;
    }

    const oldData = this.oldContractData();
    if (!oldData) {
      this.snackbarService.showError('No old contract data available');
      return;
    }

    const newContractId = this.newContractForm.get('newContractId')?.value;
    if (!newContractId) {
      this.snackbarService.showError('New Contract ID must be entered');
      return;
    }

    const newRcvdCollDate = this.newContractForm.get('newRcvdCollDate')?.value;
    if (!newRcvdCollDate) {
      this.snackbarService.showError('New Received/Collection Date must be entered');
      return;
    }

    const contract = this.contractOptions().find((c) => c.contractId === newContractId);
    if (oldData.oldContractId === newContractId) {
      this.snackbarService.showError('Error 1131: Old and New contracts must be different');
      return;
    }

    const selectedUnitIds = Array.from(this.selectedUnits());
    const selectedUnits = this.units().filter((unit) => selectedUnitIds.includes(unit.unitId));

    if (selectedUnits.some((u) => !u.collDate)) {
      this.snackbarService.showError('Some selected units are missing collection dates and cannot be modified');
      return;
    }

    const unitsToModify = selectedUnits.map((unit) => ({
      unitId: unit.unitId,
      collDate: unit.collDate as Date,
      chapterId: unit.chapterId,
      changeFlag: 'Y',
    }));

    this.loading.set(true);

    this.apiService.modifyContractBatch({
      oldContractInfo: {
        oldContractId: oldData.oldContractId,
        oldBatchId: oldData.oldBatchId,
        oldRcvdCollDate: oldData.oldRcvdCollDate,
        oldContractType: oldData.oldContractType,
        oldProfileSetId: oldData.oldProfileSetId,
      },
      newContractInfo: {
        newContractId: this.newContractForm.get('newContractId')?.value,
        newBatchId: this.newContractForm.get('newBatchId')?.value,
        newRcvdCollDate: this.newContractForm.get('newRcvdCollDate')?.value,
        newContractType: contract?.contractType || '',
        newProfileSetId: this.newContractForm.get('newProfileSetId')?.value,
      },
      units: unitsToModify,
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          if (response.success) {
            const count = response.unitsModified;
            const message = `${count} selected Contract for Hospital/Patient Batch record${count > 1 ? 's have' : ' has'} been modified successfully`;
            this.snackbarService.showSuccess(message);

            if (response.warnings && response.warnings.length > 0) {
              response.warnings.forEach((warning) => {
                this.snackbarService.showInfo(warning);
              });
            }

            // Reset after successful modification
            setTimeout(() => {
              this.onClearAll();
            }, 2000);
          } else {
            this.snackbarService.showError(response.message || 'Failed to modify records');
          }
        },
        error: (error) => {
          this.loading.set(false);
          console.error('Error modifying contract batch:', error);
          const errorResponse = error?.error?.errorResponse;
          const errorMessage = (errorResponse?.errorCode && errorResponse?.error)
            ? `Error ${errorResponse.errorCode}: ${errorResponse.error}`
            : error?.error?.message || 'Failed to modify records. Please try again.';
          this.snackbarService.showError(errorMessage);
        },
      });
  }

  toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selectedUnits.set(new Set());
    } else {
      const allUnitIds = this.units().map((unit) => unit.unitId);
      this.selectedUnits.set(new Set(allUnitIds));
    }
  }

  toggleUnit(unitId: string): void {
    const selected = new Set(this.selectedUnits());
    if (selected.has(unitId)) {
      selected.delete(unitId);
    } else {
      selected.add(unitId);
    }
    this.selectedUnits.set(selected);
  }

  isUnitSelected(unitId: string): boolean {
    return this.selectedUnits().has(unitId);
  }

  formatDate(date: Date | string | null): string {
    if (!date) return '---';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '---';
  }

  get ocf() {
    return this.oldContractForm.controls;
  }

  get ncf() {
    return this.newContractForm.controls;
  }
}
