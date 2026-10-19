import { Component, OnInit, OnDestroy, signal, computed, effect, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';

import { FinanceInterfaceDetailsApiService } from './services/finance-interface-details-api.service';
import {
  OrderLookupDto,
  InsertDateLookupDto,
  FinanceInterfaceHeaderDto,
  FinanceInterfaceDetailDto,
} from './models/finance-interface-details.model';

@Component({
  selector: 'app-finance-interface-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './finance-interface-details.html',
  styleUrl: './finance-interface-details.scss',
})
export class FinanceInterfaceDetailsComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(FinanceInterfaceDetailsApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || 'View financial interface logs and transaction mapping details.',
        };
      }
    });
  }

  filterForm: FormGroup = this.fb.group({
    orderNo: [''],
    insertDateUtc: [''],
  });

  orderNoOptions = signal<OrderLookupDto[]>([]);
  insertDateOptions = signal<InsertDateLookupDto[]>([]);

  orderNoSearchCtrl = new FormControl('');
  insertDateSearchCtrl = new FormControl('');

  orderNoSearch = signal('');
  insertDateSearch = signal('');

  filteredOrderNos = computed(() => {
    const options = this.orderNoOptions();
    const search = this.orderNoSearch();
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(o =>
      o.orderNo?.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q),
    );
  });

  filteredInsertDates = computed(() => {
    const options = this.insertDateOptions();
    const search = this.insertDateSearch();
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(o => o.insertDateDisplay?.toLowerCase().includes(q));
  });

  customerDescription = signal('--');

  isLoadingOrders = false;
  isLoadingInsertDates = false;
  isLoading = false;
  hasSearched = false;

  headerRecord = signal<FinanceInterfaceHeaderDto | null>(null);
  detailRecords = signal<FinanceInterfaceDetailDto[]>([]);
  currentDetailIndex = signal(0);

  currentDetail = computed(() => {
    const records = this.detailRecords();
    const index = this.currentDetailIndex();
    return records.length > 0 ? records[index] : null;
  });

  currentDetailDisplay = computed(() => {
    const index = this.currentDetailIndex();
    const total = this.detailRecords().length;
    return total > 0 ? `Record Type ${index + 1} of ${total}` : '';
  });

  canNavigatePrev = computed(() => this.currentDetailIndex() > 0);
  canNavigateNext = computed(() => this.currentDetailIndex() < this.detailRecords().length - 1);

  @HostListener('window:keydown.arrowLeft')
  onArrowLeft(): void {
    if (this.hasSearched && this.detailRecords().length > 0) {
      this.onPreviousRecord();
    }
  }

  @HostListener('window:keydown.arrowRight')
  onArrowRight(): void {
    if (this.hasSearched && this.detailRecords().length > 0) {
      this.onNextRecord();
    }
  }

  ngOnInit(): void {
    this.loadOrders();

    this.orderNoSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.orderNoSearch.set(v || ''));

    this.insertDateSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.insertDateSearch.set(v || ''));

    this.filterForm.get('orderNo')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((orderNo: string) => {
        this.filterForm.patchValue({ insertDateUtc: '' });
        this.insertDateSearchCtrl.setValue('');
        this.clearResults();
        if (orderNo) {
          const selected = this.orderNoOptions().find(o => o.orderNo === orderNo);
          this.customerDescription.set(selected?.customerName ?? '--');
          this.loadInsertDates(orderNo);
        } else {
          this.customerDescription.set('--');
          this.insertDateOptions.set([]);
        }
      });

    this.filterForm.get('insertDateUtc')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((insertDateUtcVal: string) => {
        if (insertDateUtcVal && this.filterForm.value.orderNo) {
          this.onRetrieve();
        }
      });

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClear();
        this.loadOrders();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRetrieve(): void {
    const orderNo = this.filterForm.get('orderNo')?.value;
    const insertDateUtc = this.filterForm.get('insertDateUtc')?.value;
    if (!orderNo || !insertDateUtc) {
      return;
    }

    this.isLoading = true;
    this.hasSearched = true;

    this.apiService.search({ orderNo, insertDateUtc })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success && response.item) {
            this.customerDescription.set(response.item.customerName || '--');
            this.headerRecord.set(response.item.header);
            this.detailRecords.set(response.item.details ?? []);
            this.currentDetailIndex.set(0);
          } else {
            this.headerRecord.set(null);
            this.detailRecords.set([]);
            if (!response.success) {
              const errorMsg = response.errorResponse?.error || response.message || 'Failed to retrieve data.';
              this.snackbarService.showError(errorMsg);
            }
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.headerRecord.set(null);
          this.detailRecords.set([]);
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'An error occurred while retrieving finance interface details.'),
          );
        },
      });
  }

  onClear(): void {
    this.filterForm.reset({ orderNo: '', insertDateUtc: '' });
    this.orderNoSearchCtrl.setValue('');
    this.insertDateSearchCtrl.setValue('');
    this.customerDescription.set('--');
    this.clearResults();
  }

  hasAnyFieldValue(): boolean {
    const values = this.filterForm.value;
    return !!(values.orderNo || values.insertDateUtc);
  }

  onPreviousRecord(): void {
    if (this.canNavigatePrev()) {
      this.currentDetailIndex.update(i => i - 1);
    }
  }

  onNextRecord(): void {
    if (this.canNavigateNext()) {
      this.currentDetailIndex.update(i => i + 1);
    }
  }

  displayValue(value: string | number | null | undefined): string {
    if (value == null || value === '') return '--';
    return String(value);
  }

  formatDate(value: string | null | undefined): string {
    if (!value || value === '--') return '--';
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const parts = value.split(' ');
    const dateParts = parts[0].split('-');
    if (dateParts.length !== 3) return value;
    const month = parseInt(dateParts[0], 10);
    const day = dateParts[1];
    const year = dateParts[2];
    if (isNaN(month) || month < 1 || month > 12) return value;
    const monthName = months[month - 1];
    if (parts.length > 1) {
      const timeParts = parts[1].split(':');
      return `${day}-${monthName}-${year}, ${timeParts[0]}:${timeParts[1]}`;
    }
    return `${day}-${monthName}-${year}`;
  }

  private clearResults(): void {
    this.headerRecord.set(null);
    this.detailRecords.set([]);
    this.currentDetailIndex.set(0);
    this.hasSearched = false;
  }

  private loadOrders(): void {
    this.isLoadingOrders = true;
    this.apiService.getOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingOrders = false;
          if (response.success) {
            this.orderNoOptions.set(response.data ?? []);
          }
        },
        error: () => {
          this.isLoadingOrders = false;
        },
      });
  }

  private loadInsertDates(orderNo: string): void {
    this.isLoadingInsertDates = true;
    this.apiService.getInsertDates(orderNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingInsertDates = false;
          if (response.success) {
            this.insertDateOptions.set(response.data ?? []);
          }
        },
        error: () => {
          this.isLoadingInsertDates = false;
        },
      });
  }
}
