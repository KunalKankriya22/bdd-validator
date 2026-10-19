import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

// Angular Material imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';

// Shared components and services
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

// Validators
import {
  effectiveDateNotPastValidator,
  terminationDateNotPastValidator,
  terminationAfterEffectiveValidator,
  getEffectiveDateErrorMessage,
  getTerminationDateErrorMessage
} from '@shared/validators/date.validators';

// Local services and models
import { RegionalTestingContractApiService } from './services/regional-testing-contract-api.service';
import {
  RegionalTestingContractDto,
  CreateRegionalTestingContractDto,
  UpdateRegionalTestingContractDto,
  RegionalTestingContractQueryDto,
  ContractTypeOption
} from './models/regional-testing-contract.model';

@Component({
  selector: 'app-enter-regional-testing-contract',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatTooltipModule,
    PageHeaderWithBreadcrumb
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './enter-regional-testing-contract.html',
  styleUrl: './enter-regional-testing-contract.scss'
})
export class EnterRegionalTestingContractComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `regional-testing-contract-${EnterRegionalTestingContractComponent.nextId++}`;

  // Generate unique IDs for form elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(RegionalTestingContractApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);

  // Lifecycle
  private readonly destroy$ = new Subject<void>();

  // Signal-based state
  protected readonly contracts = signal<RegionalTestingContractDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly saving = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly submitted = signal<boolean>(false);
  protected readonly totalRecords = signal<number>(0);
  protected readonly editMode = signal<boolean>(false);
  protected readonly selectedContractId = signal<string | null>(null);

  // Computed values
  protected readonly isEmpty = computed(() => this.contracts().length === 0);
  protected readonly isReady = computed(() => !this.loading() && !this.error());
  protected readonly today = moment().startOf('day');

  // Form
  form!: FormGroup;
  searchForm!: FormGroup;

  // Contract type options
  protected readonly contractTypeOptions: ContractTypeOption[] = [
    { value: 'R', label: 'Regional (R)' },
    { value: 'T', label: 'Testing (T)' },
    { value: 'S', label: 'Supplier (S)' }
  ];

  // Table configuration
  protected readonly displayedColumns = [
    'contractId',
    'contractType',
    'customerName',
    'customerId',
    'exportCode',
    'effDate',
    'termDate',
    'actions'
  ];

  protected readonly columnHeaders: Record<string, string> = {
    contractId: 'Contract ID',
    contractType: 'Type',
    customerName: 'Customer Name',
    customerId: 'Customer ID',
    exportCode: 'Export Code',
    effDate: 'Effective Date',
    termDate: 'Termination Date',
    actions: 'Actions'
  };

  // Pagination
  protected pageSize = signal(10);
  protected pageIndex = signal(0);
  protected readonly pageSizeOptions = [10, 25, 50, 100];

  // Expose Math for template
  protected readonly Math = Math;

  ngOnInit(): void {
    this.initForms();
    this.loadContracts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize reactive forms
   */
  private initForms(): void {
    // Main contract form
    this.form = this.fb.group({
      contractType: ['', [Validators.required]],
      customerName: ['', [Validators.required, Validators.maxLength(100)]],
      customerId: ['', [Validators.required, Validators.maxLength(50)]],
      exportCode: ['', [Validators.required, Validators.maxLength(10)]],
      agreementDate: [null],
      effDate: [null, [Validators.required, effectiveDateNotPastValidator(this.chapterTimezoneService)]],
      termDate: [null, [terminationDateNotPastValidator(this.chapterTimezoneService)]],
      addressId: [null]
    }, {
      validators: [terminationAfterEffectiveValidator()]
    });

    // Search/filter form
    this.searchForm = this.fb.group({
      contractType: [''],
      searchKeyword: [''],
      showTerminated: [false]
    });
  }

  /**
   * Load contracts from API
   */
  loadContracts(): void {
    this.loading.set(true);
    this.error.set(null);

    const query: RegionalTestingContractQueryDto = {
      contractType: this.searchForm.get('contractType')?.value || null,
      searchKeyword: this.searchForm.get('searchKeyword')?.value || null,
      showTerminated: this.searchForm.get('showTerminated')?.value || false,
      sortColumn: 'EffDate',
      sortOrder: 'DESC'
    };

    const take = this.pageSize();
    const skip = this.pageIndex() * this.pageSize();

    this.apiService.getAllContracts(query, take, skip)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.contracts.set(response.data);
          this.totalRecords.set(response.total);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to load regional testing contracts');
          this.loading.set(false);
          this.snackbarService.showError(this.error() || 'Failed to load contracts');
        }
      });
  }

  /**
   * Handle search input
   */
  onSearch(keyword: string): void {
    this.searchForm.patchValue({ searchKeyword: keyword });
    this.pageIndex.set(0);
    this.loadContracts();
  }

  /**
   * Handle filter changes
   */
  onFilterChange(): void {
    this.pageIndex.set(0);
    this.loadContracts();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.searchForm.reset({
      contractType: '',
      searchKeyword: '',
      showTerminated: false
    });
    this.pageIndex.set(0);
    this.loadContracts();
  }

  /**
   * Handle pagination changes
   */
  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadContracts();
  }

  /**
   * Form field getters
   */
  get f() {
    return this.form.controls;
  }

  /**
   * Get effective date error message
   */
  getEffectiveDateError(): string {
    return getEffectiveDateErrorMessage(this.form.get('effDate'), this.form.errors);
  }

  /**
   * Get termination date error message
   */
  getTerminationDateError(): string {
    return getTerminationDateErrorMessage(this.form.get('termDate'), this.form.errors);
  }

  /**
   * Handle date change events (for validation)
   */
  onEffectiveDateChange(): void {
    this.form.get('termDate')?.updateValueAndValidity();
    this.form.get('effDate')?.markAsTouched();
  }

  onTerminationDateChange(): void {
    this.form.get('termDate')?.markAsTouched();
  }

  /**
   * Submit form (create or update)
   */
  onSubmit(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    if (this.editMode()) {
      this.updateContract();
    } else {
      this.createContract();
    }
  }

  /**
   * Create new contract
   */
  private createContract(): void {
    this.saving.set(true);

    const formValue = this.form.value;
    const dto: CreateRegionalTestingContractDto = {
      contractType: formValue.contractType,
      customerName: formValue.customerName,
      customerId: formValue.customerId,
      exportCode: formValue.exportCode,
      agreementDate: formValue.agreementDate ? moment(formValue.agreementDate).format('YYYY-MM-DD') : null,
      effDate: moment(formValue.effDate).format('YYYY-MM-DD'),
      termDate: formValue.termDate ? moment(formValue.termDate).format('YYYY-MM-DD') : null,
      addressId: formValue.addressId || null
    };

    this.apiService.createContract(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.snackbarService.showSuccess(`Contract ${result.contractId} created successfully`);
          this.resetForm();
          this.loadContracts();
          this.saving.set(false);
        },
        error: (err) => {
          this.snackbarService.showError(err.error?.message || 'Failed to create contract');
          this.saving.set(false);
        }
      });
  }

  /**
   * Update existing contract
   */
  private updateContract(): void {
    const contractId = this.selectedContractId();
    if (!contractId) return;

    this.saving.set(true);

    const formValue = this.form.value;
    const dto: UpdateRegionalTestingContractDto = {
      contractType: formValue.contractType,
      customerName: formValue.customerName,
      customerId: formValue.customerId,
      exportCode: formValue.exportCode,
      agreementDate: formValue.agreementDate ? moment(formValue.agreementDate).format('YYYY-MM-DD') : null,
      effDate: moment(formValue.effDate).format('YYYY-MM-DD'),
      termDate: formValue.termDate ? moment(formValue.termDate).format('YYYY-MM-DD') : null,
      addressId: formValue.addressId || null
    };

    this.apiService.updateContract(contractId, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackbarService.showSuccess(`Contract ${contractId} updated successfully`);
          this.resetForm();
          this.loadContracts();
          this.saving.set(false);
        },
        error: (err) => {
          this.snackbarService.showError(err.error?.message || 'Failed to update contract');
          this.saving.set(false);
        }
      });
  }

  /**
   * Edit contract
   */
  onEdit(contract: RegionalTestingContractDto): void {
    this.editMode.set(true);
    this.selectedContractId.set(contract.contractId);

    this.form.patchValue({
      contractType: contract.contractType,
      customerName: contract.customerName,
      customerId: contract.customerId,
      exportCode: contract.exportCode,
      agreementDate: contract.agreementDate ? moment(contract.agreementDate) : null,
      effDate: moment(contract.effDate),
      termDate: contract.termDate ? moment(contract.termDate) : null,
      addressId: contract.addressId
    });

    // Scroll to form
    document.getElementById(this.elementId('form-section'))?.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Delete contract (soft delete)
   */
  onDelete(contract: RegionalTestingContractDto): void {
    if (!confirm(`Are you sure you want to delete contract ${contract.contractId}?`)) {
      return;
    }

    this.apiService.deleteContract(contract.contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (deleted) => {
          if (deleted) {
            this.snackbarService.showSuccess(`Contract ${contract.contractId} deleted successfully`);
            this.loadContracts();
          } else {
            this.snackbarService.showError('Contract not found or already deleted');
          }
        },
        error: (err) => {
          this.snackbarService.showError(err.error?.message || 'Failed to delete contract');
        }
      });
  }

  /**
   * Cancel edit/create
   */
  onCancel(): void {
    this.resetForm();
  }

  /**
   * Reset form to initial state
   */
  private resetForm(): void {
    this.form.reset();
    this.submitted.set(false);
    this.editMode.set(false);
    this.selectedContractId.set(null);
  }

  /**
   * Format date for display (DD-MMM-YYYY)
   */
  formatDate(date: string | null | undefined): string {
    if (!date) return '-';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '-';
  }
}
