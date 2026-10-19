import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule, MatSelect } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { Moment } from 'moment';

import { UnitIdFieldComponent, UnitIdPostValidateEvent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { UppercaseMomentDateAdapter, DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableSortEvent, TableRowActionEvent } from '@shared/interfaces/data-table.interface';

import { ROUTE_REGISTRY } from 'src/app/core/constants/route-registry';
import { RouteKey } from 'src/app/core/constants/route-keys';
import { BloodProductCreditService } from './services/blood-product-credit.service';
import { EnterNotesDialog, EnterNotesDialogData, EnterNotesDialogResult } from './enter-notes-dialog/enter-notes-dialog';
import {
  BloodProductCreditDto,
  CustomerLovOption,
  LovOption,
  ProductCodeOption,
  ReasonCodeOption,
  TRAN_TYPE_OPTIONS,
} from './models/blood-product-credit.model';

/**
 * Blood Product Credit Component
 * Navigation: Product Management Functions → Customer Debit/Credit → Blood Product Credit
 * FMB: CSIUDBCR | Menu Mnemonic: CDPROD
 */
@Component({
  selector: 'app-blood-product-credit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
    DataTable,
    UnitIdFieldComponent,
    PageHeaderWithBreadcrumb,
  ],
  providers: [
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
  templateUrl: './blood-product-credit.html',
  styleUrl: './blood-product-credit.scss',
})
export class BloodProductCredit implements OnInit, OnDestroy {
  private static nextId = 0;
  readonly componentId = `blood-product-credit-${BloodProductCredit.nextId++}`;
  readonly elementId = (name: string) => `${this.componentId}-${name}`;

  @ViewChild(UnitIdFieldComponent) unitIdField?: UnitIdFieldComponent;
  @ViewChild('reasonCodeSelect') reasonCodeSelectRef?: MatSelect;

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(BloodProductCreditService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly chapterTimezone = inject(ChapterTimezoneService);
  private readonly destroy$ = new Subject<void>();

  // ── Page header ───────────────────────────────────────────────────────────
  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Blood Product Credit', link: null },
    ],
  };

  // ── State signals ─────────────────────────────────────────────────────────
  readonly loading = signal(false);
  readonly loadingRecords = signal(false);
  readonly customers = signal<CustomerLovOption[]>([]);
  readonly reasonCodes = signal<ReasonCodeOption[]>([]);
  readonly productCodes = signal<ProductCodeOption[]>([]);
  readonly records = signal<BloodProductCreditDto[]>([]);
  readonly unitValidated = signal(false);
  readonly parsedUnitId = signal<string | null>(null);
  readonly parsedOrderNo = signal<string | null>(null);
  readonly selectedCustomerName = signal<string | null>(null);
  readonly selectedReasonDesc = signal<string | null>(null);

  // ── Tran type options ─────────────────────────────────────────────────────
  readonly tranTypeOptions: LovOption[] = TRAN_TYPE_OPTIONS;

  // ── Filtered dropdown options ─────────────────────────────────────────────
  readonly filteredCustomers = signal<CustomerLovOption[]>([]);
  readonly filteredProductCodes = signal<ProductCodeOption[]>([]);
  readonly filteredReasonCodes = signal<ReasonCodeOption[]>([]);
  readonly filteredTranTypes = signal<LovOption[]>([...TRAN_TYPE_OPTIONS]);

  // ── Search controls ───────────────────────────────────────────────────────
  customerSearchCtrl = new FormControl('');
  tranTypeSearchCtrl = new FormControl('');
  productCodeSearchCtrl = new FormControl('');
  reasonCodeSearchCtrl = new FormControl('');

  readonly showEntrySection = signal(false);

  // ── Table configuration ───────────────────────────────────────────────────
  tableConfig: DataTableConfig<BloodProductCreditDto> = {
    columns: [
      { key: 'unitId', header: 'Unit ID (0)', sortable: true, width: '160px' },
      { key: 'productCode', header: 'Product Code' },
      { key: 'requestedBy', header: 'By' },
      { key: 'requestDate', header: 'Date', valueFormatter: (value: any) => this.formatDate(value) },
      { key: 'reasonCode', header: 'Reason' },
      { key: 'reasonDescription', header: 'Reason Description' },
    ],
    rowActions: [
      { action: 'enter-notes', label: 'Enter Notes', icon: 'note_add' },
      { action: 'product-history', label: 'Product History', icon: 'history' },
    ],
    sortConfig: { column: 'unitId', direction: 'D' },
    stickyHeader: true,
    showActionsAsMenu: true,
    stickyActionsColumn: true,
    showPagination: true,
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Enter details to begin.',
    noDataIcon: 'search',
  };

  // ── Max date for date picker (today per chapter timezone — future dates blocked) ──
  readonly maxDate = computed<Moment>(() => this.chapterTimezone.getChapterLocalDate());

  // ── Forms ──────────────────────────────────────────────────────────────────
  filterForm!: FormGroup;
  entryForm!: FormGroup;

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.pageHeaderConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle,
        };
      }
    });
  }

  ngOnInit(): void {
    this.initForms();
    this.fullReset();           // always start with a clean slate
    this.loadCustomers();
    this.loadReasonCodes();
    this.setupSearchFilters();
    this.subscribeToChapterChanges();
    this.subscribeToRouteActivation();
  }

  /** Resets every piece of state — grid, pagination, filter form, entry section. */
  private fullReset(): void {
    // Do not interrupt an in-progress save.
    if (this.loading()) return;

    this.records.set([]);
    this.updateRecordCount(0);
    this.tableConfig.pagination!.pageIndex = 0;
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: 'unitId', direction: 'D' },
    };
    this.showEntrySection.set(false);
    this.selectedCustomerName.set(null);

    if (this.filterForm) {
      this.filterForm.reset();
    }
    this.resetEntrySection();
  }

  /**
   * ActivatedRoute.url re-emits every time Angular activates this route,
   * including same-URL navigation and route-reuse re-activation.
   * This guarantees the grid is always clear when the user arrives here,
   * except when a save is in progress.
   */
  private subscribeToRouteActivation(): void {
    this.route.url
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.fullReset());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Initialization ─────────────────────────────────────────────────────────

  private initForms(): void {
    this.filterForm = this.fb.group({
      customerId: [null, Validators.required],
      tranType: [null, Validators.required],
    });

    this.entryForm = this.fb.group({
      productCode: [null, Validators.required],
      requestedBy: [''],
      requestDate: [this.chapterTimezone.getChapterLocalDate(), Validators.required],
      reasonCode: [null, Validators.required],
    });

    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(values => {
        this.showEntrySection.set(!!values['customerId'] && !!values['tranType']);
      });
  }

  private loadCustomers(): void {
    this.service.getCustomers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.customers.set(data);
          this.filteredCustomers.set(data);
        },
        error: () => {},
      });
  }

  private loadReasonCodes(): void {
    this.service.getReasonCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.reasonCodes.set(data);
        },
        error: () => {},
      });
  }

  private setupSearchFilters(): void {
    this.customerSearchCtrl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term ?? '').toLowerCase();
        this.filteredCustomers.set(
          !t ? this.customers() :
            this.customers().filter(c =>
              c.code.toLowerCase().includes(t) || c.description.toLowerCase().includes(t)
            )
        );
      });

    this.tranTypeSearchCtrl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term ?? '').toLowerCase();
        this.filteredTranTypes.set(
          !t ? [...TRAN_TYPE_OPTIONS] :
            TRAN_TYPE_OPTIONS.filter(o =>
              o.code.toLowerCase().includes(t) || o.description.toLowerCase().includes(t)
            )
        );
      });

    this.productCodeSearchCtrl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term ?? '').toLowerCase();
        this.filteredProductCodes.set(
          !t ? this.productCodes() :
            this.productCodes().filter(p =>
              p.productCode.toLowerCase().includes(t) || p.productDescription.toLowerCase().includes(t)
            )
        );
      });

    this.reasonCodeSearchCtrl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term ?? '').toLowerCase();
        const tranType = this.filterForm.get('tranType')?.value;
        const base = this.reasonCodes().filter(r => !tranType || r.tranType === tranType);
        this.filteredReasonCodes.set(
          !t ? base : base.filter(r =>
            r.reasonCode.toLowerCase().includes(t) || r.reasonDescription.toLowerCase().includes(t)
          )
        );
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
        // Reload dropdowns for the new chapter — fix #3
        this.loadCustomers();
        this.loadReasonCodes();
      });
  }

  // ── Filter section handlers ────────────────────────────────────────────────

  onCustomerChange(): void {
    const customerId = this.filterForm.get('customerId')?.value as string | null;
    const customer = this.customers().find(c => c.code === customerId);
    this.selectedCustomerName.set(customer?.description ?? null);
    this.filterForm.get('tranType')?.reset();
    this.showEntrySection.set(false);
    this.resetEntrySection();
    this.records.set([]);
    this.updateRecordCount(0);
    this.tableConfig.pagination!.pageIndex = 0;
  }

  onTranTypeChange(): void {
    this.resetEntrySection();
    this.updateReasonCodesFilter();
    this.records.set([]);
    this.updateRecordCount(0);
    this.tableConfig.pagination!.pageIndex = 0;
    const customerId = this.filterForm.get('customerId')?.value;
    const tranType = this.filterForm.get('tranType')?.value;
  }

  private updateReasonCodesFilter(): void {
    const tranType = this.filterForm.get('tranType')?.value;
    const base = this.reasonCodes().filter(r => !tranType || r.tranType === tranType);
    this.filteredReasonCodes.set(base);
    const current = this.entryForm.get('reasonCode')?.value;
    if (current && !base.some(r => r.reasonCode === current)) {
      this.entryForm.get('reasonCode')?.setValue(null);
      this.selectedReasonDesc.set(null);
    }
  }


  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: event.column, direction: event.direction },
    };
    if (event.direction === 'default') return;

    const sorted = [...this.records()].sort((a, b) => {
      const valA = String((a as any)[event.column] ?? '');
      const valB = String((b as any)[event.column] ?? '');
      const cmp = valA.localeCompare(valB);
      return event.direction === 'A' ? cmp : -cmp;
    });
    this.records.set(sorted);
  }

  onRowAction(event: TableRowActionEvent<BloodProductCreditDto>): void {
    switch (event.action) {
      case 'enter-notes':
        this.onEnterNotes(event.row);
        break;
      case 'product-history':
        this.onProductHistory(event.row);
        break;
    }
  }

  // ── Unit ID handlers ──────────────────────────────────────────────────────

  onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    const customerId = this.filterForm.get('customerId')?.value;
    if (!customerId) {
      event.reject('Please select a Customer ID first');
      return;
    }

    this.service.validateUnit(event.data.parsedUnitId, customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.parsedUnitId.set(response.unitId);
          this.parsedOrderNo.set(response.orderNo ?? null);
          this.unitValidated.set(true);

          const option: ProductCodeOption = {
            productCode: response.productCode,
            productDescription: response.productCode,
          };
          this.productCodes.set([option]);
          this.filteredProductCodes.set([option]);
          this.entryForm.get('productCode')?.setValue(response.productCode);

          event.confirm();
        },
        error: (err) => {
          this.unitValidated.set(false);
          this.parsedUnitId.set(null);
          this.parsedOrderNo.set(null);
          this.productCodes.set([]);
          event.reject(err.message || 'Unit not found or not eligible for this customer');
        },
      });
  }

  onUnitIdValidated(_response: UnitValidationResponse): void {}

  onUnitIdCleared(): void {
    this.parsedUnitId.set(null);
    this.parsedOrderNo.set(null);
    this.unitValidated.set(false);
    this.productCodes.set([]);
    this.filteredProductCodes.set([]);
    this.entryForm.get('productCode')?.setValue(null);
  }

  // ── Entry form handlers ───────────────────────────────────────────────────

  onReasonCodeChange(): void {
    const reasonCode = this.entryForm.get('reasonCode')?.value as string | null;
    const reason = this.reasonCodes().find(r => r.reasonCode === reasonCode);
    this.selectedReasonDesc.set(reason?.reasonDescription ?? null);
  }

  /** Tab on Reason dropdown triggers auto-save — fix #4 */
  onReasonKeydown(event: KeyboardEvent): void {
    if (event.key === 'Tab' && !this.reasonCodeSelectRef?.panelOpen) {
      this.onSave();
    }
  }

  onSave(): void {
    if (!this.parsedUnitId() || !this.unitValidated()) {
      this.snackbarService.showError('Please scan or enter a valid Unit ID');
      return;
    }

    if (this.entryForm.invalid) {
      this.entryForm.markAllAsTouched();
      return;
    }

    const tranType = this.filterForm.get('tranType')?.value;
    const tranTypeLabel = tranType === 'CR' ? 'Credited' : 'Debited';
    const customerName = this.selectedCustomerName() || '';

    const ref = this.dialog.open(ConfirmActionDialogComponent, {
      data: {
        title: 'Save Entry',
        message: `The product will be ${tranTypeLabel} to ${customerName}. Are you sure you want to confirm?`,
        confirmText: 'YES, CONFIRM',
        cancelText: 'NO, CANCEL',
      } as ConfirmActionDialogData,
      width: '440px',
      disableClose: true,
    });

    ref.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) {
          this.executeSave();
        }
      });
  }

  private executeSave(): void {
    const customerId = this.filterForm.get('customerId')?.value;
    const tranType = this.filterForm.get('tranType')?.value;
    const { productCode, requestedBy, requestDate, reasonCode } = this.entryForm.value;

    this.loading.set(true);
    this.service.create({
      customerId,
      tranType,
      unitId: this.parsedUnitId()!,
      productCode: productCode ?? null,
      requestedBy: requestedBy || null,
      requestDate: requestDate ? this.toIsoDate(requestDate) : null,
      reasonCode: reasonCode ?? null,
      aliquot: null,
      amount: null,
      orderNo: this.parsedOrderNo(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (saved) => {
          this.loading.set(false);
          const enriched: BloodProductCreditDto = {
            ...saved,
            reasonDescription: this.selectedReasonDesc(),
          };
          this.records.update(prev => [enriched, ...prev]);
          this.updateRecordCount((this.tableConfig.pagination?.totalRecords ?? 0) + 1);
          const count = this.records().length;
          this.snackbarService.showSuccess(
            `${count} Product credit for Customer ID ${customerId} has been saved.`
          );
          this.resetEntryForm();
        },
        error: (err) => {
          this.loading.set(false);
          this.snackbarService.showError(err.message || 'Failed to save record');
        },
      });
  }

  onClearEntry(): void {
    this.resetEntryForm();
  }

  clearAll(): void {
    this.fullReset();
  }

  private resetEntrySection(): void {
    this.resetEntryForm();
    this.unitIdField?.clear();
    this.parsedUnitId.set(null);
    this.parsedOrderNo.set(null);
    this.unitValidated.set(false);
    this.productCodes.set([]);
    this.filteredProductCodes.set([]);
  }

  private resetEntryForm(): void {
    this.entryForm.reset(
      {
        productCode: null,
        requestedBy: '',
        requestDate: this.chapterTimezone.getChapterLocalDate(),
        reasonCode: null,
      },
      { emitEvent: false }
    );
    this.entryForm.markAsPristine();
    this.entryForm.markAsUntouched();
    this.entryForm.get('reasonCode')?.setErrors(null);
    this.selectedReasonDesc.set(null);
    this.unitIdField?.clear();
    this.parsedUnitId.set(null);
    this.parsedOrderNo.set(null);
    this.unitValidated.set(false);
    this.productCodes.set([]);
    this.filteredProductCodes.set([]);
    setTimeout(() => this.unitIdField?.focus());
  }

  // ── Row actions ────────────────────────────────────────────────────────────

  onEnterNotes(row: BloodProductCreditDto): void {
    this.loading.set(true);
    this.service.getNote(row.unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (existingNote) => {
          this.loading.set(false);
          this.openNotesDialog(row, existingNote);
        },
        error: () => {
          this.loading.set(false);
          this.openNotesDialog(row, null);
        },
      });
  }

  private openNotesDialog(row: BloodProductCreditDto, existingNote: string | null): void {
    const data: EnterNotesDialogData = { unitId: row.unitId, existingNote: existingNote ?? undefined };
    const ref = this.dialog.open<EnterNotesDialog, EnterNotesDialogData, EnterNotesDialogResult | null>(
      EnterNotesDialog,
      { data, width: '560px', disableClose: false }
    );

    ref.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (!result?.note) return;
        this.service.addNote(row.unitId, result.note)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => this.snackbarService.showSuccess('Note saved successfully'),
            error: (err) => this.snackbarService.showError(err.message || 'Failed to save note'),
          });
      });
  }

  onProductHistory(row: BloodProductCreditDto): void {
    const path = ROUTE_REGISTRY[RouteKey.UnitAndProductHistory].path;
    this.router.navigate([path], { queryParams: { unitId: row.unitId } });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private updateRecordCount(count: number): void {
    this.tableConfig = {
      ...this.tableConfig,
      columns: this.tableConfig.columns.map(c =>
        c.key === 'unitId' ? { ...c, header: `Unit ID (${count})` } : c
      ),
      pagination: {
        ...this.tableConfig.pagination!,
        totalRecords: count,
      },
    };
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${day}-${months[date.getMonth()]}-${date.getFullYear()}`;
  }

  private toIsoDate(date: any): string {
    if (typeof date === 'string') return date;
    // Moment object (from UppercaseMomentDateAdapter)
    if (date && typeof date.format === 'function') {
      return (date as Moment).format('YYYY-MM-DD');
    }
    if (date instanceof Date) {
      const d = date;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    return '';
  }
}
