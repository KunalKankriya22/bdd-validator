import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { LiveAnnouncer, A11yModule } from '@angular/cdk/a11y';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { DebitCreditQueryService } from './services/debit-credit-query.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import {
  CustomerDebitCreditQueryDto,
  CustomerDebitCreditQueryFilterDto,
  LovOption
} from './models/debit-credit-query.model';

/**
 * Debit/Credit Query Component
 * READ-ONLY query component for viewing customer debit/credit adjustment records
 * Navigation: Distribution → Customer Debit/Credit → Debit/Credit Query
 */
@Component({
  selector: 'app-debit-credit-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    A11yModule
  ],
  templateUrl: './debit-credit-query.html',
  styleUrl: './debit-credit-query.scss'
})
export class DebitCreditQuery implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  readonly componentId = `debit-credit-query-${DebitCreditQuery.nextId++}`;

  // Generate unique IDs for elements
  readonly elementId = (name: string) => `${this.componentId}-${name}`;
  readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly debitCreditService = inject(DebitCreditQueryService);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly destroy$ = new Subject<void>();

  // Signal-based state
  readonly allRecords = signal<CustomerDebitCreditQueryDto[]>([]);
  readonly selectedRecord = signal<CustomerDebitCreditQueryDto | null>(null);
  readonly customerOptions = signal<LovOption[]>([]);
  readonly orderOptions = signal<LovOption[]>([]);
  readonly adviceOptions = signal<LovOption[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly isRetrieved = signal<boolean>(false);

  // Filtered options for searchable dropdowns
  readonly filteredCustomerOptions = signal<LovOption[]>([]);
  readonly filteredOrderOptions = signal<LovOption[]>([]);
  readonly filteredAdviceOptions = signal<LovOption[]>([]);

  // Search controls for dropdowns
  customerSearchCtrl = new FormControl('');
  orderSearchCtrl = new FormControl('');
  adviceSearchCtrl = new FormControl('');

  // Selected customer ID signal for reactive description
  readonly selectedCustomerId = signal<string | null>(null);

  // Computed values
  readonly hasRecords = computed(() => this.allRecords().length > 0);
  readonly isEmpty = computed(() => !this.loading() && !this.hasRecords() && !this.isRetrieved());
  readonly showEmptyState = computed(() => !this.loading() && !this.hasRecords() && this.isRetrieved());
  readonly showResults = computed(() => !this.loading() && this.hasRecords());

  // True when Order-only search returned multiple Advice IDs — results Advice ID should be a dropdown
  readonly showAdviceIdDropdownInResults = computed(() => {
    if (!this.isRetrieved()) return false;
    const adviceId = this.filterForm?.get('adviceId')?.value;
    return !adviceId && this.allRecords().length > 1;
  });

  // Unique advice ID records for the results dropdown — deduplicates allRecords() by adviceId
  readonly uniqueAdviceRecords = computed(() => {
    const seen = new Set<string>();
    return this.allRecords().filter(r => {
      if (seen.has(r.adviceId)) return false;
      seen.add(r.adviceId);
      return true;
    });
  });
  readonly customerDescription = computed(() => {
    const customerId = this.selectedCustomerId();
    if (!customerId) return '';

    const option = this.customerOptions().find(opt => opt.code === customerId);
    return option?.description || '';
  });

  // Page header configuration
  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Debit/Credit Query', link: null }
    ]
  };

  // Forms
  filterForm!: FormGroup;

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.pageHeaderConfig = {
          ...this.pageHeaderConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          subtitle: pageData.subtitle
        };
      }
    });
  }

  ngOnInit(): void {
    this.initFilterForm();
    this.loadCustomerLov();
    this.subscribeToChapterChanges();
    this.setupSearchFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize filter form
   * Either adviceId OR orderNo is required (not both)
   */
  private initFilterForm(): void {
    this.filterForm = this.fb.group({
      customerId: [null, Validators.required],
      orderNo: [null],
      adviceId: [null]
    });
  }

  /**
   * Check if either Order No or Advice ID is selected
   */
  readonly isOrderOrAdviceSelected = computed(() => {
    const orderNo = this.filterForm?.get('orderNo')?.value;
    const adviceId = this.filterForm?.get('adviceId')?.value;
    return !!(orderNo || adviceId);
  });

  /**
   * Load customer LOV for dropdown
   */
  private loadCustomerLov(): void {
    this.debitCreditService.getCustomerLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.customerOptions.set(data);
          this.filteredCustomerOptions.set(data);
        },
        error: (err) => {
          console.error('Failed to load customer LOV:', err);
        }
      });
  }

  /**
   * Setup search filters for dropdowns
   */
  private setupSearchFilters(): void {
    // Customer search filter
    this.customerSearchCtrl.valueChanges
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        const term = (searchTerm || '').toLowerCase();
        if (!term) {
          this.filteredCustomerOptions.set(this.customerOptions());
        } else {
          const filtered = this.customerOptions().filter(opt =>
            opt.code.toLowerCase().includes(term) ||
            (opt.description && opt.description.toLowerCase().includes(term))
          );
          this.filteredCustomerOptions.set(filtered);
        }
      });

    // Order search filter
    this.orderSearchCtrl.valueChanges
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        const term = (searchTerm || '').toLowerCase();
        if (!term) {
          this.filteredOrderOptions.set(this.orderOptions());
        } else {
          const filtered = this.orderOptions().filter(opt =>
            opt.code.toLowerCase().includes(term) ||
            (opt.description && opt.description.toLowerCase().includes(term))
          );
          this.filteredOrderOptions.set(filtered);
        }
      });

    // Advice ID search filter
    this.adviceSearchCtrl.valueChanges
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        const term = (searchTerm || '').toLowerCase();
        if (!term) {
          this.filteredAdviceOptions.set(this.adviceOptions());
        } else {
          const filtered = this.adviceOptions().filter(opt =>
            opt.code.toLowerCase().includes(term) ||
            (opt.description && opt.description.toLowerCase().includes(term))
          );
          this.filteredAdviceOptions.set(filtered);
        }
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
        this.customerOptions.set([]);
        this.filteredCustomerOptions.set([]);
        this.customerSearchCtrl.setValue('');
        this.orderSearchCtrl.setValue('');
        this.adviceSearchCtrl.setValue('');
        this.loadCustomerLov();
      });
  }

  /**
   * Handle customer ID selection
   * Loads order numbers and advice IDs for the selected customer
   */
  onCustomerChange(): void {
    const customerId = this.filterForm.get('customerId')?.value;

    // Update selected customer ID signal for reactive description
    this.selectedCustomerId.set(customerId);

    // Clear dependent dropdowns
    this.filterForm.patchValue({
      orderNo: null,
      adviceId: null
    });

    // Clear previous results
    this.allRecords.set([]);
    this.selectedRecord.set(null);
    this.orderOptions.set([]);
    this.filteredOrderOptions.set([]);
    this.adviceOptions.set([]);
    this.filteredAdviceOptions.set([]);
    this.isRetrieved.set(false);

    if (!customerId) {
      return;
    }

    // Load order numbers for selected customer
    this.debitCreditService.getOrderNoLov(customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.orderOptions.set(data);
          this.filteredOrderOptions.set(data);
        },
        error: (err) => {
          console.error('Failed to load order numbers:', err);
        }
      });

    // Load advice IDs for selected customer
    this.debitCreditService.getAdviceIdLov(customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.adviceOptions.set(data);
          this.filteredAdviceOptions.set(data);
        },
        error: (err) => {
          console.error('Failed to load advice IDs:', err);
        }
      });
  }

  onOrderChange(): void {
    const customerId = this.filterForm.get('customerId')?.value;
    const orderNo = this.filterForm.get('orderNo')?.value;

    this.filterForm.patchValue({ adviceId: null });

    // Always reload the advice LOV to match the selected order
    if (customerId && orderNo) {
      this.debitCreditService.getAdviceIdByOrderLov(customerId, orderNo)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.adviceOptions.set(data);
            this.filteredAdviceOptions.set(data);
          },
          error: (err) => {
            console.error('Failed to load advice IDs for order:', err);
          }
        });
    } else if (customerId && !orderNo) {
      // Order cleared — reload all advice IDs for customer
      this.debitCreditService.getAdviceIdLov(customerId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.adviceOptions.set(data);
            this.filteredAdviceOptions.set(data);
          },
          error: (err) => {
            console.error('Failed to load advice IDs:', err);
          }
        });
    }

    // After retrieval: also update the displayed record if it matches
    if (this.isRetrieved() && orderNo) {
      const record = this.allRecords().find(r => r.orderNo === orderNo);
      if (record) {
        this.selectedRecord.set(record);
        this.filterForm.patchValue({ adviceId: record.adviceId });
      }
    }
  }

  /**
   * Retrieve records based on filter criteria
   */
  retrieveRecords(): void {
    const customerId = this.filterForm.get('customerId')?.value;
    const orderNo = this.filterForm.get('orderNo')?.value;
    const adviceId = this.filterForm.get('adviceId')?.value;

    if (!customerId) {
      this.snackbarService.showError('Please select a Customer ID');
      return;
    }

    if (!orderNo && !adviceId) {
      this.snackbarService.showError('Please select either Order No or Advice ID');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const filterDto: CustomerDebitCreditQueryFilterDto = {
      customerId: customerId,
      orderNo: this.filterForm.get('orderNo')?.value || null,
      adviceId: this.filterForm.get('adviceId')?.value || null
    };

    this.debitCreditService.getDebitCreditRecords(100, 0, filterDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          this.isRetrieved.set(true);
          this.allRecords.set(response.data);

          if (response.data.length > 0) {
            this.selectedRecord.set(response.data[0]);
            const count = response.data.length;
            this.liveAnnouncer.announce(
              `${count} record${count !== 1 ? 's' : ''} loaded.`,
              'polite'
            );
          } else {
            this.selectedRecord.set(null);
            this.liveAnnouncer.announce('No records found for the selected criteria.', 'polite');
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.isRetrieved.set(true);
          this.error.set(err.message || 'Failed to retrieve records');
          this.snackbarService.showError('Failed to retrieve records. Please try again.');
        }
      });
  }

  onAdviceIdChange(adviceId: string): void {
    if (!adviceId || !this.isRetrieved()) return;

    const record = this.allRecords().find(r => r.adviceId === adviceId);
    if (record) {
      this.selectedRecord.set(record);
      return;
    }

    // After retrieval: selected advice ID not in current results — fetch it
    this.loading.set(true);
    this.debitCreditService.getByAdviceId(adviceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.loading.set(false);
          if (data) {
            this.selectedRecord.set(data);
            this.allRecords.set([data]);
          }
        },
        error: () => {
          this.loading.set(false);
          this.snackbarService.showError('Failed to retrieve record for selected Advice ID.');
        }
      });
  }

  /**
   * Clear all filters and results
   */
  clearAll(): void {
    this.filterForm.reset();
    this.selectedCustomerId.set(null);
    this.allRecords.set([]);
    this.selectedRecord.set(null);
    this.orderOptions.set([]);
    this.filteredOrderOptions.set([]);
    this.adviceOptions.set([]);
    this.filteredAdviceOptions.set([]);
    this.isRetrieved.set(false);
    this.error.set(null);
  }

  /**
   * Format date for display in DD-MON-YYYY format
   * Parses ISO date string directly - API returns dates already in chapter local time
   */
  formatDate(value: string | null | undefined): string {
    if (!value) return '';

    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    // Parse ISO date string directly (e.g., "2018-01-12T21:07:02")
    // to avoid browser timezone conversion
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = match[1];
      const monthIndex = parseInt(match[2], 10) - 1;
      const day = match[3];
      return `${day}-${months[monthIndex]}-${year}`;
    }

    return value;
  }

  /**
   * Format date and time for display in DD-MON-YYYY HH:MM format
   * Parses ISO datetime string directly - API returns dates already in chapter local time
   */
  formatDateTime(value: string | null | undefined): string {
    if (!value) return '';

    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    // Parse ISO datetime string directly (e.g., "2018-01-12T21:07:02")
    // to avoid browser timezone conversion
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (match) {
      const year = match[1];
      const monthIndex = parseInt(match[2], 10) - 1;
      const day = match[3];
      const hours = match[4];
      const minutes = match[5];
      return `${day}-${months[monthIndex]}-${year} ${hours}:${minutes}`;
    }

    return value;
  }

  /**
   * Format currency for display with $ symbol
   */
  formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return '';
    return `$${value.toFixed(2)}`;
  }

  /**
   * Format boolean Yes/No display
   */
  formatYesNo(value: string | null | undefined): string {
    if (!value) return 'No';
    return value.toUpperCase() === 'Y' ? 'Yes' : 'No';
  }
}
