import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule, MatSelect } from '@angular/material/select';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { Moment } from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { UppercaseMomentDateAdapter, DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent, TablePageEvent } from '@shared/interfaces/data-table.interface';

import { OrderServicesDebitCreditService } from './services/order-services-debit-credit.service';
import {
  CreateAdjustmentDto,
  LovOption,
  PatientLovDto,
  RequestedByLovDto
} from './models/order-services-debit-credit.model';
import { EnterNotesDialogComponent } from './components/enter-notes-dialog/enter-notes-dialog';
import { SaveConfirmDialogComponent, SaveConfirmData } from './components/save-confirm-dialog/save-confirm-dialog';

const TRAN_TYPE_OPTIONS: LovOption[] = [
  { code: 'CR', description: 'Credit' },
  { code: 'DB', description: 'Debit' }
];

@Component({
  selector: 'app-order-services-debit-credit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable
  ],
  providers: [
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './order-services-debit-credit.html',
  styleUrl: './order-services-debit-credit.scss'
})
export class OrderServicesDebitCreditComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  readonly componentId = `osdbcr-${OrderServicesDebitCreditComponent.nextId++}`;
  readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(OrderServicesDebitCreditService);
  private readonly dialog = inject(MatDialog);

  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly chapterTimezone = inject(ChapterTimezoneService);
  private readonly destroy$ = new Subject<void>();

  // ── Page header ──────────────────────────────────────────────────────────
  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }, { label: 'Order and Services Debit/Credit', link: null }]
  };

  // ── State ────────────────────────────────────────────────────────────────
  readonly loading = signal(false);
  readonly showEntrySection = signal(false);

  // ── Grid (client-side accumulation) ─────────────────────────────────────
  readonly records = signal<any[]>([]);
  readonly pageSize = signal(10);
  readonly pageIndex = signal(0);
  tableConfig: DataTableConfig<any> = {
    columns: [
      { key: 'orderNo', header: 'Order Number' },
      { key: 'serviceCode', header: 'Service Code' },
      { key: 'quantity', header: 'Qty' },
      { key: 'requestedBy', header: 'By' },
      { key: 'requestDate', header: 'Date', valueFormatter: (v: any) => this.formatDate(v) },
      { key: 'amount', header: 'Amount', valueFormatter: (v: any) => v != null ? Number(v).toFixed(2) : '-' },
      { key: 'reasonCode', header: 'Reason' },
      { key: 'reasonDescription', header: 'Reason Description' },
    ],
    rowActions: [
      { action: 'enterNotes', label: 'Enter Notes', icon: 'note_add' }
    ],
    showActionsAsMenu: true,
    stickyHeader: true,
    showPagination: true,
    pagination: {
      pageSize: 10,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    emptyMessage: 'No Records Yet',
    emptySubMessage: 'Fill in the entry form and press Tab on Reason to add a record.',
    noDataIcon: 'inbox',
    enableRowHighlight: false,
  };
  readonly paginatedRecords = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.records().slice(start, start + this.pageSize());
  });

  // ── LOV data ─────────────────────────────────────────────────────────────
  readonly customers = signal<LovOption[]>([]);
  readonly filteredCustomers = signal<LovOption[]>([]);
  readonly filteredTranTypes = signal<LovOption[]>([...TRAN_TYPE_OPTIONS]);
  readonly orderNos = signal<LovOption[]>([]);
  readonly filteredOrderNos = signal<LovOption[]>([]);
  readonly serviceCodes = signal<LovOption[]>([]);
  readonly filteredServiceCodes = signal<LovOption[]>([]);
  readonly reasonCodes = signal<LovOption[]>([]);
  readonly filteredReasonCodes = signal<LovOption[]>([]);

  // ── Derived display values ────────────────────────────────────────────────
  readonly selectedCustomerName = signal<string | null>(null);
  readonly selectedReasonDesc = signal<string | null>(null);

  // ── H2: Amount editability controlled by edit_charge ─────────────────────
  readonly amountEditable = signal(true);

  // ── H3: Patient name LOV ────────────────────────────────────────────────
  readonly filteredPatients = signal<PatientLovDto[]>([]);

  // ── H4: Requested By LOV ────────────────────────────────────────────────
  readonly requestedByOptions = signal<RequestedByLovDto[]>([]);
  readonly filteredRequestedBy = signal<RequestedByLovDto[]>([]);

  // ── Focus targets ────────────────────────────────────────────────────────
  @ViewChild('customerIdTrigger') customerIdTrigger?: MatSelect;
  @ViewChild('orderNoTrigger') orderNoTrigger?: MatSelect;

  // ── Search controls ───────────────────────────────────────────────────────
  customerSearchCtrl = new FormControl('');
  tranTypeSearchCtrl = new FormControl('');
  orderNoSearchCtrl = new FormControl('');
  serviceCodeSearchCtrl = new FormControl('');
  reasonCodeSearchCtrl = new FormControl('');
  patientSearchCtrl = new FormControl('');
  requestedBySearchCtrl = new FormControl('');

  // ── Forms ─────────────────────────────────────────────────────────────────
  filterForm!: FormGroup;
  entryForm!: FormGroup;

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.pageHeaderConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle
        };
      }
    });

    effect(() => {
      if (this.tableConfig.pagination) {
        this.tableConfig.pagination.totalRecords = this.records().length;
      }
    });
  }

  ngOnInit(): void {
    this.initForms();
    this.loadCustomers();
    this.loadServiceCodes();
    this.setupSearchFilters();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  private initForms(): void {
    this.filterForm = this.fb.group({
      customerId: [null, Validators.required],
      tranType: [null, Validators.required],
      patient: [null]
    });

    this.entryForm = this.fb.group({
      orderNo:     [null],
      serviceCode: [null, Validators.required],
      quantity:    [1, [Validators.required, Validators.min(1), Validators.max(999)]],
      requestedBy: [null],
      requestDate: [this.chapterTimezone.getChapterLocalDate(), Validators.required],
      amount:      [null, [Validators.required, Validators.min(0.01)]],
      reasonCode:  [null, Validators.required]
    });

    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => {
        this.showEntrySection.set(!!v['customerId'] && !!v['tranType']);
      });

    // Reload order numbers when patient name changes — the SQL switches
    // between patient-linked orders (Part 1) and all-customer orders (Part 2).
    this.filterForm.get('patient')!.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((val) => {
        const customerId = this.filterForm.get('customerId')?.value as string | null;
        const tranType   = this.filterForm.get('tranType')?.value as string | null;
        const patient    = val as string | null;
        if (customerId && tranType) this.loadOrderNos(customerId, tranType, patient);
        if (customerId && tranType && patient && patient.length >= 2) {
          this.loadPatientLov(customerId, tranType, patient);
        } else {
          this.filteredPatients.set([]);
        }
      });

    // H4: Filter requested-by autocomplete on typing
    this.requestedBySearchCtrl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term ?? '').toLowerCase();
        this.filteredRequestedBy.set(
          !t ? this.requestedByOptions() : this.requestedByOptions().filter(o => o.contactName.toLowerCase().includes(t))
        );
      });
  }

  private fullReset(): void {
    this.showEntrySection.set(false);
    this.selectedCustomerName.set(null);
    this.records.set([]);
    this.pageIndex.set(0);
    if (this.tableConfig.pagination) this.tableConfig.pagination.pageIndex = 0;
    if (this.filterForm) this.filterForm.reset();
    this.resetEntrySection();
  }


  // ── LOV loaders ───────────────────────────────────────────────────────────

  private loadCustomers(): void {
    this.service.getCustomerLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => { this.customers.set(data); this.filteredCustomers.set(data); },
        error: () => {}
      });
  }

  private loadServiceCodes(tranType?: string | null, orderNo?: string | null): void {
    this.service.getServiceCodeLov(tranType, orderNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => { this.serviceCodes.set(data); this.filteredServiceCodes.set(data); },
        error: () => {}
      });
  }

  private loadOrderNos(customerId: string, tranType: string, patientName?: string | null): void {
    this.service.getOrderNoLov(customerId, tranType, patientName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => { this.orderNos.set(data); this.filteredOrderNos.set(data); },
        error: () => {}
      });
  }

  private loadReasonCodes(tranType: string): void {
    this.service.getReasonCodeLov(tranType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => { this.reasonCodes.set(data); this.filteredReasonCodes.set(data); },
        error: () => {}
      });
  }

  private loadPatientLov(customerId: string, tranType: string, searchTerm: string): void {
    this.service.getPatientLov(customerId, tranType, searchTerm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => this.filteredPatients.set(data),
        error: () => this.filteredPatients.set([])
      });
  }

  private loadRequestedByLov(customerId: string): void {
    this.service.getRequestedByLov(customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => { this.requestedByOptions.set(data); this.filteredRequestedBy.set(data); },
        error: () => { this.requestedByOptions.set([]); this.filteredRequestedBy.set([]); }
      });
  }

  // ── Search filters ────────────────────────────────────────────────────────

  private setupSearchFilters(): void {
    const wire = (ctrl: FormControl, src: () => LovOption[], set: (v: LovOption[]) => void) =>
      ctrl.valueChanges.pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$))
        .subscribe(t => {
          const term = (t ?? '').toLowerCase();
          set(!term ? src() : src().filter(o =>
            o.code.toLowerCase().includes(term) || o.description.toLowerCase().includes(term)
          ));
        });

    wire(this.customerSearchCtrl,    () => this.customers(),   v => this.filteredCustomers.set(v));
    wire(this.tranTypeSearchCtrl,    () => TRAN_TYPE_OPTIONS,  v => this.filteredTranTypes.set(v));
    wire(this.orderNoSearchCtrl,     () => this.orderNos(),    v => this.filteredOrderNos.set(v));
    wire(this.serviceCodeSearchCtrl, () => this.serviceCodes(), v => this.filteredServiceCodes.set(v));
    wire(this.reasonCodeSearchCtrl,  () => this.reasonCodes(),  v => this.filteredReasonCodes.set(v));
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
        this.loadCustomers();
        this.loadServiceCodes();
      });
  }

  // ── Filter section handlers ───────────────────────────────────────────────

  onCustomerChange(): void {
    const id = this.filterForm.get('customerId')?.value as string | null;
    const tranType = this.filterForm.get('tranType')?.value as string | null;
    const patientName = this.filterForm.get('patient')?.value as string | null;
    const customer = this.customers().find(c => c.code === id);
    this.selectedCustomerName.set(customer?.description ?? null);
    this.resetEntrySection();
    this.records.set([]);
    this.pageIndex.set(0);
    if (this.tableConfig.pagination) this.tableConfig.pagination.pageIndex = 0;
    if (id && tranType) this.loadOrderNos(id, tranType, patientName);
    if (id) this.loadRequestedByLov(id);
  }

  onTranTypeChange(): void {
    const tranType = this.filterForm.get('tranType')?.value as string | null;
    const customerId = this.filterForm.get('customerId')?.value as string | null;
    const patientName = this.filterForm.get('patient')?.value as string | null;
    this.resetEntrySection();
    this.records.set([]);
    this.pageIndex.set(0);
    if (this.tableConfig.pagination) this.tableConfig.pagination.pageIndex = 0;
    this.updateOrderNoValidation(tranType);
    this.loadServiceCodes(tranType);
    if (tranType) this.loadReasonCodes(tranType);
    if (customerId && tranType) this.loadOrderNos(customerId, tranType, patientName);
  }

  onOrderNoChange(): void {
    const tranType = this.filterForm.get('tranType')?.value as string | null;
    const orderNo = this.entryForm.get('orderNo')?.value as string | null;
    if (tranType === 'CR' && orderNo) {
      this.loadServiceCodes(tranType, orderNo);
    }
  }

  // ── Entry handlers ────────────────────────────────────────────────────────

  onServiceCodeChange(): void {
    const code = this.entryForm.get('serviceCode')?.value as string | null;
    const amountCtrl = this.entryForm.get('amount');
    if (!code) {
      this.amountEditable.set(true);
      amountCtrl?.enable({ emitEvent: false });
      return;
    }
    const svc = this.serviceCodes().find(s => s.code === code);
    if (svc?.charge != null && svc.charge > 0) {
      amountCtrl?.setValue(svc.charge, { emitEvent: false });
    }
    if (svc?.editCharge === false) {
      this.amountEditable.set(false);
      amountCtrl?.disable({ emitEvent: false });
    } else {
      this.amountEditable.set(true);
      amountCtrl?.enable({ emitEvent: false });
    }
  }

  onReasonCodeChange(): void {
    const code = this.entryForm.get('reasonCode')?.value as string | null;
    const reason = this.reasonCodes().find(r => r.code === code);
    this.selectedReasonDesc.set(reason?.description ?? null);
    // Do NOT auto-commit here — Down Arrow / keyboard navigation also fires selectionChange.
    // Row is committed only when Tab is pressed (onReasonTabPress).
  }

  // Tab on Reason Code saves the single record to DB immediately, then resets the form.
  onReasonTabPress(event: Event): void {
    if (this.loading()) return;
    if (this.entryForm.invalid) { this.entryForm.markAllAsTouched(); return; }
    event.preventDefault();
    this.saveCurrentEntry();
  }

  private saveCurrentEntry(): void {
    if (this.entryForm.invalid) { this.entryForm.markAllAsTouched(); return; }

    const customerId  = this.filterForm.get('customerId')?.value as string;
    const tranType    = this.filterForm.get('tranType')?.value as string;
    const patientName = this.filterForm.get('patient')?.value || null;

    const tranTypeLabel = tranType === 'CR' ? 'Credited' : 'Debited';
    const customerName  = this.selectedCustomerName() ?? customerId;
    const data: SaveConfirmData = { tranTypeLabel, customerName };

    const ref = this.dialog.open(SaveConfirmDialogComponent, { data, width: '400px', disableClose: true, restoreFocus: false });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.loading.set(true);
      const rawValues = this.entryForm.getRawValue();
      const dto: CreateAdjustmentDto = {
        customerId,
        tranType,
        patientName,
        orderNo:     rawValues.orderNo || null,
        serviceCode: rawValues.serviceCode,
        quantity:    rawValues.quantity ?? 1,
        requestedBy: rawValues.requestedBy || null,
        requestDate: this.toIsoDate(rawValues.requestDate),
        amount:      rawValues.amount != null ? +rawValues.amount : 0,
        reasonCode:  rawValues.reasonCode || null
      };

      this.service.create(dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.loading.set(false);
            if (res?.success === false) {
              this.snackbarService.showError(res?.message || 'Failed to save record');
              return;
            }
            const tranLabel = tranType === 'CR' ? 'Credit' : 'Debit';
            this.snackbarService.showSuccess(
              `${tranLabel} record for Customer ID ${customerId} has been saved.`
            );
            const adviceId = (res as any)?.data?.[0]?.adviceId ?? null;
            this.records.update(prev => [...prev, {
              adviceId,
              orderNo: rawValues.orderNo || null,
              serviceCode: rawValues.serviceCode,
              quantity: rawValues.quantity ?? 1,
              requestedBy: rawValues.requestedBy || null,
              requestDate: this.toIsoDate(rawValues.requestDate),
              amount: rawValues.amount != null ? +rawValues.amount : 0,
              reasonCode: rawValues.reasonCode || null,
              reasonDescription: this.selectedReasonDesc() || null
            }]);
            this.resetEntrySection();
            setTimeout(() => this.orderNoTrigger?.focus(), 50);
          },
          error: err => {
            this.loading.set(false);
            this.snackbarService.showError(err?.error?.message || 'Failed to save record');
          }
        });
    });
  }

  onRowEnterNotes(row: any): void {
    if (!row.adviceId) {
      this.snackbarService.showError('Cannot add notes: record has no Advice ID yet');
      return;
    }
    this.service.getNote(row.adviceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (existing) => this.openNoteDialog(row.adviceId, existing?.noteText ?? ''),
        error: () => this.openNoteDialog(row.adviceId, '')
      });
  }

  private openNoteDialog(adviceId: string, existingNote: string): void {
    const ref = this.dialog.open(EnterNotesDialogComponent, {
      width: '520px',
      data: { noteText: existingNote }
    });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((note: string | null) => {
      if (note === null || note === undefined) return;
      if (!adviceId) {
        this.snackbarService.showError('Cannot save note: record has no Advice ID yet');
        return;
      }
      this.service.addNote(adviceId, note)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => this.snackbarService.showSuccess('Note saved successfully.'),
          error: err => this.snackbarService.showError(err?.error?.message || 'Failed to save note')
        });
    });
  }

  onClearEntry(): void { this.resetEntrySection(); }

  clearAll(): void { this.fullReset(); }

  onClearAll(): void {
    this.fullReset();
    setTimeout(() => this.customerIdTrigger?.focus(), 50);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private updateOrderNoValidation(tranType: string | null): void {
    const orderNoCtrl = this.entryForm?.get('orderNo');
    if (!orderNoCtrl) return;

    if (tranType === 'CR') {
      orderNoCtrl.setValidators(Validators.required);
    } else {
      orderNoCtrl.clearValidators();
    }
    orderNoCtrl.updateValueAndValidity();
  }

  private resetEntrySection(): void {
    const tranType = this.filterForm?.get('tranType')?.value as string | null;
    this.entryForm = this.fb.group({
      orderNo:     [null],
      serviceCode: [null, Validators.required],
      quantity:    [1, [Validators.required, Validators.min(1), Validators.max(999)]],
      requestedBy: [null],
      requestDate: [this.chapterTimezone.getChapterLocalDate(), Validators.required],
      amount:      [null, [Validators.required, Validators.min(0.01)]],
      reasonCode:  [null, Validators.required]
    });
    this.updateOrderNoValidation(tranType);
    this.selectedReasonDesc.set(null);
    this.amountEditable.set(true);
  }

  private toIsoDate(date: any): string {
    if (!date) return '';
    if (typeof date === 'string') return date;
    if (typeof date.format === 'function') return (date as Moment).format('YYYY-MM-DD');
    if (date instanceof Date) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    return '';
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    return `${String(date.getDate()).padStart(2,'0')}-${months[date.getMonth()]}-${date.getFullYear()}`;
  }

  onPageChange(event: TablePageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
  }

  onRowAction(event: TableRowActionEvent<any>): void {
    if (event.action === 'enterNotes') {
      this.onRowEnterNotes(event.row);
    }
  }

}
