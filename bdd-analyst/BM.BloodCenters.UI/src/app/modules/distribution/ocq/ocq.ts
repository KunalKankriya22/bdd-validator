import { Component, OnInit, OnDestroy, ViewChild, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormGroupDirective,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import moment, { Moment } from 'moment';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { OcqService } from './services/ocq.service';
import {
  CustomerOrderDto,
  CustomerLookupDto,
  OrderItemDto,
  CustomerOrderSearchRequest,
  DropdownOption,
} from './models/ocq.model';

import { AttributesAntigensDialog } from './dialogs/attributes-antigens-dialog';

/**
 * Customer Orders Query Component
 * JIRA: MLT-14025
 * Mnemonic: OCQ
 * Legacy FMB: OEQPDORD
 * Path: Product Management Functions => Order Module => Transfer Orders => Close Hospital Transfer
 */
@Component({
  selector: 'app-ocq',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    NgxMatSelectSearchModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatChipsModule,
    PageHeaderWithBreadcrumb,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './ocq.html',
  styleUrls: ['./ocq.scss'],
})
export class OcqComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `ocq-${OcqComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Dependencies
  private readonly fb = inject(FormBuilder);
  private readonly ocqService = inject(OcqService);
  private readonly dialog = inject(MatDialog);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);

  // Page header configuration
  protected readonly headerConfig = computed<PageHeaderConfig>(() => {
    const pageData = this.pageHeaderService.pageHeaderData();
    return {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: pageData?.title || 'Customer Orders Query', link: null },
      ],
      title: pageData?.title || 'Customer Orders Query',
      subtitle: pageData?.subtitle || 'Search and view customer order records.',
    };
  });
  private readonly destroy$ = new Subject<void>();

  // Signal-based state
  protected readonly orders = signal<CustomerOrderDto[]>([]);
  protected readonly selectedOrder = signal<CustomerOrderDto | null>(null);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly hasSearched = signal<boolean>(false);
  protected readonly priorities = signal<DropdownOption[]>([]);
  protected readonly orderTypes = signal<DropdownOption[]>([]);
  protected readonly orderStatuses = signal<DropdownOption[]>([]);
  protected readonly customers = signal<CustomerLookupDto[]>([]);
  protected readonly filteredCustomers = signal<CustomerLookupDto[]>([]);
  readonly customerSearchCtrl = new FormControl('');

  // Computed values
  protected readonly isEmpty = computed(() => this.orders().length === 0 && !this.hasSearched());
  protected readonly isReady = computed(() => !this.loading() && !this.error());
  protected readonly hasResults = computed(() => this.hasSearched() && this.orders().length > 0);
  protected readonly noResults = computed(() => this.hasSearched() && this.orders().length === 0);
  protected readonly showOrderItems = computed(() => this.selectedOrder() !== null);

  // Form
  @ViewChild(FormGroupDirective) private formDirective!: FormGroupDirective;
  searchForm!: FormGroup;

  // Today's date for date validation
  protected readonly today = this.chapterTimezoneService.getChapterLocalDateTime().startOf('day');
  protected readonly maxFromDate = signal<Moment | null>(null);

  ngOnInit(): void {
    this.initForm();
    this.loadDropdowns();
    this.setupDateValidation();
    this.setupCustomerSearch();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize search form
   */
  private initForm(): void {
    this.searchForm = this.fb.group(
      {
        customerId: [null, [Validators.required]],
        priority: [null],
        orderType: [null],
        state: [null],
        fromDate: [null, [Validators.required]],
        toDate: [this.chapterTimezoneService.getChapterLocalDateTime(), [Validators.required]],
      },
      {
        validators: [this.dateRangeValidator()],
      }
    );
  }

  /**
   * Custom validator to ensure To Date >= From Date
   */
  private dateRangeValidator() {
    return (formGroup: FormGroup) => {
      const fromDate = formGroup.get('fromDate')?.value;
      const toDate = formGroup.get('toDate')?.value;

      if (!fromDate || !toDate) {
        return null;
      }

      const from = moment.isMoment(fromDate) ? fromDate : moment(fromDate);
      const to = moment.isMoment(toDate) ? toDate : moment(toDate);

      if (to.isBefore(from, 'day')) {
        return { dateRangeInvalid: true };
      }

      return null;
    };
  }

  get f() {
    return this.searchForm.controls;
  }

  /**
   * Load dropdown options
   */
  private loadDropdowns(): void {
    // Load priorities
    this.ocqService
      .getPriorityOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => this.priorities.set(options),
        error: (err) => {
          console.error('Failed to load priorities:', err);
          this.priorities.set([]);
        },
      });

    // Load order types
    this.ocqService
      .getOrderTypeOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => this.orderTypes.set(options),
        error: (err) => {
          console.error('Failed to load order types:', err);
          this.orderTypes.set([]);
        },
      });

    // Load order statuses
    this.ocqService
      .getOrderStatusOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => this.orderStatuses.set(options),
        error: (err) => {
          console.error('Failed to load order statuses:', err);
          this.orderStatuses.set([]);
        },
      });

    // Load customers for dropdown
    this.ocqService
      .getAllCustomers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (customers) => {
          this.customers.set(customers);
          this.filteredCustomers.set(customers);
        },
        error: (err) => {
          console.error('Failed to load customers:', err);
          this.customers.set([]);
          this.filteredCustomers.set([]);
        },
      });
  }

  /**
   * Set up date validation listeners
   */
  private setupDateValidation(): void {
    this.searchForm
      .get('fromDate')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value && moment.isMoment(value)) {
          this.maxFromDate.set(value);
        } else if (value) {
          this.maxFromDate.set(moment(value));
        } else {
          this.maxFromDate.set(null);
        }
        this.searchForm.get('toDate')?.updateValueAndValidity();
      });

    this.searchForm
      .get('toDate')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.searchForm.updateValueAndValidity();
      });
  }

  private setupCustomerSearch(): void {
    this.customerSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((term) => {
        this.filterCustomers(term ?? '');
      });
  }

  private filterCustomers(term: string): void {
    const search = term.trim().toUpperCase();
    if (!search) {
      this.filteredCustomers.set(this.customers());
      return;
    }
    this.filteredCustomers.set(
      this.customers().filter(
        (c) =>
          c.customerId.toUpperCase().includes(search) ||
          c.name.toUpperCase().includes(search)
      )
    );
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClear();
        this.loadDropdowns();
      });
  }

  /**
   * Execute search query
   */
  onSearch(): void {
    if (this.searchForm.invalid) {
      this.markFormGroupTouched(this.searchForm);
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.hasSearched.set(true);
    this.selectedOrder.set(null);

    const formValue = this.searchForm.value;

    const request: CustomerOrderSearchRequest = {
      customerId: formValue.customerId,
      orderClass: formValue.priority || undefined,
      orderType: formValue.orderType || undefined,
      orderStatus: formValue.state || undefined,
      fromDate: formValue.fromDate ? this.convertToISOString(formValue.fromDate, false) : undefined,
      toDate: formValue.toDate ? this.convertToISOString(formValue.toDate, true) : undefined,
    };

    this.ocqService
      .search(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orders) => {
          this.orders.set(orders);
          this.loading.set(false);
        },
        error: (error) => {
          this.error.set(this.getErrorMessage(error));
          this.loading.set(false);
          this.snackbarService.showError(this.getErrorMessage(error));
        },
      });
  }

  /**
   * Convert Moment to ISO string for API
   */
  private convertToISOString(date: Moment | string, endOfDay: boolean = false): string {
    const m = moment.isMoment(date) ? date : moment(date);
    if (endOfDay) {
      return m.endOf('day').toISOString();
    }
    return m.startOf('day').toISOString();
  }

  /**
   * Clear search form and results
   */
  onClear(): void {
    this.formDirective?.resetForm();
    this.searchForm.reset({
      customerId: null,
      priority: null,
      orderType: null,
      state: null,
      fromDate: null,
      toDate: this.chapterTimezoneService.getChapterLocalDateTime(),
    });
    this.filteredCustomers.set(this.customers());
    this.customerSearchCtrl.setValue('');

    this.orders.set([]);
    this.selectedOrder.set(null);
    this.error.set(null);
    this.hasSearched.set(false);
    this.maxFromDate.set(null);
  }

  /**
   * Handle order row selection
   */
  onOrderSelect(order: CustomerOrderDto): void {
    this.selectedOrder.set(order);
  }

  /**
   * Handle order item click - open attributes & antigens dialog
   */
  onOrderItemClick(item: OrderItemDto): void {
    const order = this.selectedOrder();
    if (!order) return;

    this.dialog.open(AttributesAntigensDialog, {
      width: '600px',
      maxWidth: '100vw',
      height: '100vh',
      maxHeight: '100vh',
      position: { top: '0', right: '0' },
      data: {
        orderNo: order.orderNo,
        itemNo: item.itemNo,
        orderStatus: order.orderStatus,
        orderStatusDesc: order.orderStatusDesc,
      },
      panelClass: 'side-panel-dialog',
      disableClose: false,
    });
  }

  /**
   * Get status badge color class
   */
  getStatusColorClass(status: string): string {
    const normalizedStatus = status?.toLowerCase() || '';
    if (normalizedStatus.includes('order')) return 'status-ordered';
    if (normalizedStatus.includes('cancel')) return 'status-canceled';
    if (normalizedStatus.includes('close')) return 'status-closed';
    return 'status-default';
  }

  /**
   * Format date for display (DD-MMM-YYYY)
   */
  formatDate(dateString: string | undefined): string {
    if (!dateString) return '–';
    const m = moment(dateString);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateString;
  }

  /**
   * Format date-time for display (DD-MMM-YYYY, HH:mm AM/PM)
   */
  formatDateTime(dateString: string | undefined): string {
    if (!dateString) return '–';
    const m = moment(dateString);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : dateString;
  }

  /**
   * Extract error message from error response
   */
  private getErrorMessage(error: any): string {
    // Handle specific error codes from API documentation
    if (error?.error?.errorResponse?.errorCode === '0302') {
      return 'Invalid customer';
    }
    if (error?.error?.errorResponse?.errorCode === '0325') {
      return 'Invalid priority';
    }
    if (error?.error?.errorResponse?.errorCode === '1705') {
      return 'Invalid order type';
    }
    if (error?.error?.errorResponse?.errorCode === '1711') {
      return 'Invalid order status';
    }
    if (error?.error?.errorResponse?.errorCode === '0503') {
      return 'From date cannot be in future';
    }
    if (error?.error?.errorResponse?.errorCode === '7502') {
      return 'To date must be >= from date';
    }

    if (error?.error?.errorResponse?.error) {
      return error.error.errorResponse.error;
    }

    if (error?.error?.message) {
      return error.error.message;
    }

    if (error?.message) {
      return error.message;
    }

    return 'An error occurred while searching orders';
  }

  /**
   * Mark all form controls as touched
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}
