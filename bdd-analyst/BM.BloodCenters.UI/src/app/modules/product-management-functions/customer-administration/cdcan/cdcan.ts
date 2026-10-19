import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  ViewChild,
  ElementRef,
  Injector,
  afterNextRender
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Third-party
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

// Shared components
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';

// Local
import { CdcanService } from './cdcan.service';
import { CustomerDbcrAdjustDto, CustomerLOV, AdviceLOV } from './cdcan.model';

/**
 * Cancel Debit/Credit Advice Component (CDCAN)
 * Allows users to retrieve and cancel customer debit/credit advice records
 */
@Component({
  selector: 'app-cdcan',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb
  ],
  templateUrl: './cdcan.html',
  styleUrls: ['./cdcan.scss']
})
export class CdcanComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `cdcan-${CdcanComponent.nextId++}`;

  @ViewChild('resultsPanel') resultsPanel?: ElementRef<HTMLElement>;

  // Generate unique IDs for form elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly cdcanService = inject(CdcanService);
  private readonly dialog = inject(MatDialog);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();
  private readonly injector = inject(Injector);

  // Signal-based state
  protected readonly customerOptions = signal<CustomerLOV[]>([]);
  protected readonly adviceOptions = signal<AdviceLOV[]>([]);
  protected readonly adviceDetails = signal<CustomerDbcrAdjustDto | null>(null);
  protected readonly loading = signal<boolean>(false);
  protected readonly loadingCustomers = signal<boolean>(false);
  protected readonly loadingAdvices = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly submitted = signal<boolean>(false);
  private readonly selectedCustomerId = signal<string | null>(null);
  private readonly customerSearch = signal('');
  private readonly adviceSearch = signal('');

  // Search controls for ngx-mat-select-search
  readonly customerSearchCtrl = new FormControl<string>('');
  readonly adviceSearchCtrl = new FormControl<string>('');

  // Filtered options for dropdowns
  protected readonly filteredCustomerOptions = computed(() => {
    const search = this.customerSearch().toLowerCase();
    const options = this.customerOptions();
    if (!search) return options;
    return options.filter(c =>
      c.customerId.toLowerCase().includes(search) ||
      c.customerName.toLowerCase().includes(search)
    );
  });

  protected readonly filteredAdviceOptions = computed(() => {
    const search = this.adviceSearch().toLowerCase();
    const options = this.adviceOptions();
    if (!search) return options;
    return options.filter(a =>
      a.adviceId.toLowerCase().includes(search)
    );
  });

  // Computed values
  protected readonly hasResults = computed(() => this.adviceDetails() !== null);
  protected readonly isEmpty = computed(() => !this.hasResults() && !this.loading());
  protected readonly customerDescription = computed(() => {
    const customerId = this.selectedCustomerId();
    if (!customerId) return '-';
    const customer = this.customerOptions().find(c => c.customerId === customerId);
    return customer?.customerName || '-';
  });

  // Form
  form!: FormGroup;

  // Page configuration
  protected pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' }
    ],
    title: '',
    subtitle: ''
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.pageHeaderConfig = {
          ...this.pageHeaderConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.loadCustomers();
    this.setupCustomerChangeListener();
    this.setupSearchListeners();
    this.setupChapterChangeListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the search form
   */
  private initForm(): void {
    this.form = this.fb.group({
      customerId: ['', Validators.required],
      adviceId: [{ value: '', disabled: true }, Validators.required]
    });
  }

  /**
   * Load customer dropdown options
   */
  private loadCustomers(): void {
    this.loadingCustomers.set(true);
    this.cdcanService.getCustomers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (customers) => {
          this.customerOptions.set(customers);
          this.loadingCustomers.set(false);
        },
        error: (err) => {
          console.error('Error loading customers:', err);
          this.snackbarService.showError('Failed to load customer list. Please try again.');
          this.loadingCustomers.set(false);
        }
      });
  }

  /**
   * Listen for customer ID changes and load advice options
   */
  private setupCustomerChangeListener(): void {
    this.form.get('customerId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(customerId => {
        this.selectedCustomerId.set(customerId);
        // Reset advice selection and search when customer changes
        this.form.get('adviceId')?.setValue('', { emitEvent: false });
        this.adviceSearchCtrl.setValue('', { emitEvent: false });
        this.adviceSearch.set('');
        this.adviceOptions.set([]);
        this.adviceDetails.set(null);

        if (customerId) {
          this.form.get('adviceId')?.enable({ emitEvent: false });
          this.loadAdvicesByCustomer(customerId);
        } else {
          this.form.get('adviceId')?.disable({ emitEvent: false });
        }
      });
  }

  private setupChapterChangeListener(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadCustomers();
      });
  }

  private setupSearchListeners(): void {
    this.customerSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.customerSearch.set(value || ''));

    this.adviceSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.adviceSearch.set(value || ''));
  }

  /**
   * Load advice dropdown options for selected customer
   */
  private loadAdvicesByCustomer(customerId: string): void {
    this.loadingAdvices.set(true);
    this.cdcanService.getAdvicesByCustomer(customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (advices) => {
          this.adviceOptions.set(advices);
          this.loadingAdvices.set(false);
        },
        error: (err) => {
          console.error('Error loading advice options:', err);
          this.snackbarService.showError('Failed to load advice list. Please try again.');
          this.loadingAdvices.set(false);
        }
      });
  }

  /**
   * Form accessor for template
   */
  get f() {
    return this.form.controls;
  }

  /**
   * Handle RETRIEVE button click
   */
  onRetrieve(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      const firstInvalidField = Object.keys(this.form.controls)
        .find(key => this.form.controls[key].invalid);
      if (firstInvalidField) {
        const el = document.getElementById(this.elementId(firstInvalidField));
        if (el) {
          setTimeout(() => (el as HTMLElement).focus(), 0);
        }
      }
      return;
    }

    const adviceId = this.form.get('adviceId')?.value;
    if (!adviceId) return;

    this.loading.set(true);
    this.error.set(null);

    this.cdcanService.getAdviceById(adviceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (advice) => {
          if (advice) {
            this.adviceDetails.set(advice);
            this.loading.set(false);
            afterNextRender(() => this.resultsPanel?.nativeElement.focus(), { injector: this.injector });
          } else {
            this.snackbarService.showError('Advice record not found.');
            this.loading.set(false);
          }
        },
        error: (err) => {
          console.error('Error retrieving advice:', err);
          const errorMessage = err.error?.message || 'Failed to retrieve advice details. Please try again.';
          this.snackbarService.showError(errorMessage);
          this.loading.set(false);
        }
      });
  }

  /**
   * Handle CLEAR ALL button click
   */
  onClearAll(): void {
    this.form.reset();
    this.selectedCustomerId.set(null);
    this.customerSearchCtrl.setValue('', { emitEvent: false });
    this.adviceSearchCtrl.setValue('', { emitEvent: false });
    this.customerSearch.set('');
    this.adviceSearch.set('');
    this.adviceOptions.set([]);
    this.adviceDetails.set(null);
    this.submitted.set(false);
    this.error.set(null);
  }

  /**
   * Handle CANCEL THIS ADVICE button click
   */
  onCancelAdvice(): void {
    const advice = this.adviceDetails();
    if (!advice) return;

    // Open confirmation dialog
    const dialogData: ConfirmActionDialogData = {
      title: 'Cancel this Advice',
      message: 'Are you sure you want to cancel this advice?',
      confirmText: 'YES, CONFIRM',
      cancelText: 'NO, CANCEL'
    };

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '400px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result === true) {
          this.performCancellation(advice.adviceId, advice.customerId);
        }
      });
  }

  /**
   * Perform the actual cancellation API call
   */
  private performCancellation(adviceId: string, customerId: string): void {
    this.loading.set(true);

    this.cdcanService.cancelAdvice(adviceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Cancel response:', JSON.stringify(response));
          this.loading.set(false);
          if (response.success) {
            this.snackbarService.showSuccess(
              `Advice for Customer ID ${customerId} has been cancelled.`
            );
            this.onClearAll();
          } else {
            const errorMsg = response.errorCode
              ? `${response.errorCode}: ${response.message}`
              : (response.message || 'Failed to cancel advice. Please try again.');
            this.snackbarService.showError(errorMsg);
          }
        },
        error: (err) => {
          console.error('Error cancelling advice:', err);
          const errorMessage = err.error?.message || 'Failed to cancel advice. Please try again.';
          this.snackbarService.showError(errorMessage);
          this.loading.set(false);
        }
      });
  }

  /**
   * Format date for display (DD-MON-YYYY)
   */
  protected formatDate(dateValue: string | null): string {
    if (!dateValue) return '-';
    // Backend returns chapter-local time via Lifetrack_timezone_convert.get_local_time.
    // Append Z so JS parses it as UTC, preserving the value without browser-tz shift.
    const normalized = dateValue.endsWith('Z') || dateValue.includes('+') ? dateValue : dateValue + 'Z';
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return '-';

    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC'
    };

    try {
      const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date);
      const get = (type: string) => parts.find(p => p.type === type)?.value || '';
      return `${get('day')}-${get('month').toUpperCase()}-${get('year')} ${get('hour')}:${get('minute')}`;
    } catch {
      const day = date.getUTCDate().toString().padStart(2, '0');
      const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      return `${day}-${months[date.getUTCMonth()]}-${date.getUTCFullYear()} ${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}`;
    }
  }

  protected formatDateOnly(dateValue: string | null): string {
    if (!dateValue) return '-';
    const normalized = dateValue.endsWith('Z') || dateValue.includes('+') ? dateValue : dateValue + 'Z';
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return '-';

    try {
      const parts = new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).formatToParts(date);
      const get = (type: string) => parts.find(p => p.type === type)?.value || '';
      return `${get('day')}-${get('month').toUpperCase()}-${get('year')}`;
    } catch {
      const day = date.getUTCDate().toString().padStart(2, '0');
      const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      return `${day}-${months[date.getUTCMonth()]}-${date.getUTCFullYear()}`;
    }
  }

  /**
   * Format currency for display
   */
  protected formatCurrency(amount: number | null): string {
    if (amount === null || amount === undefined) return '-';
    return `$${amount.toFixed(2)}`;
  }

  /**
   * Format quantity for display
   */
  protected formatQuantity(quantity: number | null): string {
    if (quantity === null || quantity === undefined) return '-';
    return quantity.toString();
  }

  /**
   * Format a MM-DD-YY LOV date (e.g. '06-21-26') to DD-MON-YYYY (e.g. '21-JUN-2026')
   */
  protected formatAdviceDate(insertDate: string | undefined): string {
    if (!insertDate) return '';
    const parts = insertDate.split('-');
    if (parts.length !== 3) return insertDate;
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const month = months[parseInt(parts[0], 10) - 1] || parts[0];
    return `${parts[1]}-${month}-20${parts[2]}`;
  }

  /**
   * Display helper for nullable string values
   */
  protected displayValue(value: string | null | undefined): string {
    return value?.trim() || '-';
  }
}
