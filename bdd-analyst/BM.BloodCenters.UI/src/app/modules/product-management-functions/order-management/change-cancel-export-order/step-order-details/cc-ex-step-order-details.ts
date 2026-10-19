import {
  Component, OnInit, OnDestroy, Input, Output, EventEmitter,
  inject, signal, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil, forkJoin, catchError, of, debounceTime } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { HeaderService } from '@shared/services/header.service';
import { formatTableDateTime } from '@shared/utils/date-format.util';
import { convertUTCToTimezone } from '@shared/date/timezone.util';
import {
  ExportOrderDto,
  ExportOrderItemDto,
  LookupItem,
  ConsigneeDto,
  CustomerContactDto,
  ContractLookupItem,
  PayeeLookupItem
} from '../../enter-export-order/models/export-order.model';
import { ExportOrderApiService } from '../../enter-export-order/services/export-order-api.service';

interface ExportOrderNumberItem {
  orderNo: string;
  customerId?: string;
  customerName?: string;
  orderStatus?: string;
}

@Component({
  selector: 'app-cc-ex-step-order-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './cc-ex-step-order-details.html',
  styleUrls: ['./cc-ex-step-order-details.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CcExStepOrderDetailsComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `cc-ex-step-order-details-${CcExStepOrderDetailsComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;

  @Input() savedOrderData: Partial<ExportOrderDto> | null = null;
  @Output() formDataChange = new EventEmitter<Partial<ExportOrderDto>>();
  @Output() validityChange = new EventEmitter<boolean>();
  @Output() orderLoaded = new EventEmitter<{ order: ExportOrderDto; items: ExportOrderItemDto[] }>();

  private readonly fb = inject(FormBuilder);
  private readonly headerService = inject(HeaderService);
  private readonly apiService = inject(ExportOrderApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  orderForm!: FormGroup;

  orderNumbers = signal<ExportOrderNumberItem[]>([]);
  filteredOrderNumbers = signal<ExportOrderNumberItem[]>([]);
  orderNumberSearchCtrl = new FormControl('');

  contracts = signal<ContractLookupItem[]>([]);
  modes = signal<LookupItem[]>([]);
  contacts = signal<CustomerContactDto[]>([]);
  consignees = signal<ConsigneeDto[]>([]);
  payees = signal<PayeeLookupItem[]>([]);
  loading = signal(false);

  filteredContracts = signal<ContractLookupItem[]>([]);
  filteredModes = signal<LookupItem[]>([]);
  filteredContacts = signal<CustomerContactDto[]>([]);
  filteredConsignees = signal<ConsigneeDto[]>([]);

  contractSearchCtrl = new FormControl('');
  modeSearchCtrl = new FormControl('');
  contactSearchCtrl = new FormControl('');
  consigneeSearchCtrl = new FormControl('');

  orderNumber = signal<string>('--');
  orderType = signal<string>('--');
  orderStatus = signal<string>('--');
  estimatedArrivalTime = signal<string>('--');
  customerName = signal<string>('--');
  customerId = signal<string>('--');
  consigneeName = signal<string>('--');
  consigneeAddress = signal<string>('--');
  billToCustomerId = signal<string>('--');
  billToCustomerName = signal<string>('--');
  billToAddress = signal<string>('--');

  activeSection = signal<string>('order-info');

  /** True when order is in editable status (OR) */
  get isEditable(): boolean {
    const status = this.orderStatus();
    return status === 'OR' || status === '--';
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadOrderNumbers();
    this.loadLookups();
    this.subscribeToSearchFilters();
    if (this.savedOrderData?.orderNo) {
      this.populateFromSavedData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.orderForm = this.fb.group({
      orderNo: ['', [Validators.required]],
      contractId: [{ value: '', disabled: true }],
      orderMode: [{ value: '', disabled: true }],
      contactId: [{ value: '', disabled: true }],
      consigneeId: [{ value: '', disabled: true }]
    });

    this.orderForm.get('orderNo')!.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.validityChange.emit(this.orderForm.valid);
      this.formDataChange.emit(this.getFormData());
    });
  }

  private enableEditableFields(): void {
    if (this.isEditable) {
      this.orderForm.get('orderMode')?.enable();
      this.orderForm.get('contactId')?.enable();
      this.orderForm.get('consigneeId')?.enable();
    }
  }

  private disableEditableFields(): void {
    this.orderForm.get('contractId')?.disable();
    this.orderForm.get('orderMode')?.disable();
    this.orderForm.get('contactId')?.disable();
    this.orderForm.get('consigneeId')?.disable();
  }

  private loadOrderNumbers(): void {
    this.apiService.getExportOrderNumbers().pipe(
      takeUntil(this.destroy$),
      catchError(() => of([]))
    ).subscribe(orders => {
      this.orderNumbers.set(orders);
      this.filteredOrderNumbers.set(orders);
      this.cdr.markForCheck();
    });
  }

  private loadLookups(): void {
    this.apiService.getOrderModesLookup().pipe(
      takeUntil(this.destroy$),
      catchError(() => of([]))
    ).subscribe(modes => {
      this.modes.set(modes);
      this.filteredModes.set(modes);
      this.cdr.markForCheck();
    });
  }

  private populateFromSavedData(): void {
    if (!this.savedOrderData) return;
    const data = this.savedOrderData;
    this.orderForm.patchValue({
      orderNo: data.orderNo || '',
      contractId: data.contractId || '',
      orderMode: data.orderMode || '',
      consigneeId: data.consigneeId || ''
    });
    this.orderNumber.set(data.orderNo || '--');
    this.orderType.set(data.orderType || '--');
    this.orderStatus.set(data.orderStatus || '--');
    this.customerId.set(data.customerId || '--');
    this.customerName.set(data.customerName || '--');
    if (data.estArrivalTime) {
      const timezone = this.headerService.chapterTimeZone();
      if (timezone) {
        const converted = convertUTCToTimezone(new Date(data.estArrivalTime), timezone);
        this.estimatedArrivalTime.set(formatTableDateTime(converted.toISOString()));
      } else {
        this.estimatedArrivalTime.set(formatTableDateTime(data.estArrivalTime));
      }
    } else {
      this.estimatedArrivalTime.set('--');
    }
    this.consigneeName.set(data.consigneeName || '--');
    this.consigneeAddress.set(data.consigneeAddress || '--');
    if (data.payeeId) {
      this.billToCustomerId.set(data.payeeId);
    }
    if (data.customerId) {
      this.loadCustomerDependencies(data.customerId);
    }
    this.enableEditableFields();
  }

  onOrderNumberChange(orderNo: string): void {
    if (!orderNo) {
      this.clearOrderData();
      return;
    }

    this.loading.set(true);
    this.disableEditableFields();

    this.apiService.getOrder(orderNo).pipe(
      takeUntil(this.destroy$),
      catchError(() => of(null))
    ).subscribe(order => {
      if (!order) {
        this.loading.set(false);
        this.clearOrderData();
        this.cdr.markForCheck();
        return;
      }

      this.orderNumber.set(order.orderNo || '--');
      this.orderType.set(order.orderType || '--');
      this.orderStatus.set(order.orderStatus || '--');
      this.customerId.set(order.customerId || '--');

      if (order.estArrivalTime) {
        const timezone = this.headerService.chapterTimeZone();
        if (timezone) {
          const converted = convertUTCToTimezone(new Date(order.estArrivalTime), timezone);
          this.estimatedArrivalTime.set(formatTableDateTime(converted.toISOString()));
        } else {
          this.estimatedArrivalTime.set(formatTableDateTime(order.estArrivalTime));
        }
      } else {
        this.estimatedArrivalTime.set('--');
      }

      this.orderForm.patchValue({
        contractId: order.contractId || '',
        orderMode: order.orderMode || '',
        consigneeId: order.consigneeId || ''
      }, { emitEvent: false });

      if (order.customerId) {
        forkJoin({
          customer: this.apiService.getCustomerById(order.customerId).pipe(catchError(() => of(null))),
          consignees: this.apiService.getConsignees(order.customerId).pipe(catchError(() => of([]))),
          contacts: this.apiService.getContacts(order.customerId).pipe(catchError(() => of([]))),
          contracts: this.apiService.getContracts(order.customerId).pipe(catchError(() => of([]))),
          payees: this.apiService.getPayeesLookup(order.customerId).pipe(catchError(() => of([]))),
          items: this.apiService.getOrderItems(orderNo).pipe(catchError(() => of([])))
        }).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: ({ customer, consignees, contacts, contracts, payees, items }) => {
            if (customer) {
              this.customerName.set(customer.customerName ?? customer.name ?? '--');

              const payeeId = order.payeeId ?? customer.payeeId ?? customer.customerId;
              this.billToCustomerId.set(payeeId ?? '--');

              if (payeeId && payeeId !== order.customerId) {
                this.apiService.getCustomerById(payeeId).pipe(
                  catchError(() => of(null))
                ).subscribe(payee => {
                  if (payee) {
                    this.billToCustomerName.set(payee.customerName ?? payee.name ?? '--');
                    const payeeAddr = [payee.address1, payee.address2, payee.city, payee.state, payee.zipCode, payee.country].filter(Boolean).join(', ');
                    this.billToAddress.set(payeeAddr || '--');
                  }
                  this.cdr.markForCheck();
                });
              } else {
                this.billToCustomerName.set(customer.customerName ?? customer.name ?? '--');
                const addr = [customer.address1, customer.address2, customer.city, customer.state, customer.zipCode, customer.country].filter(Boolean).join(', ');
                this.billToAddress.set(addr || '--');
              }
            }

            this.consignees.set(consignees as ConsigneeDto[]);
            this.filteredConsignees.set(consignees as ConsigneeDto[]);
            this.contacts.set(contacts as CustomerContactDto[]);
            this.filteredContacts.set(contacts as CustomerContactDto[]);
            this.contracts.set(contracts as ContractLookupItem[]);
            this.filteredContracts.set(contracts as ContractLookupItem[]);
            this.payees.set(payees as PayeeLookupItem[]);

            if (order.orderedBy) {
              const orderedByLower = order.orderedBy.toLowerCase().trim();
              const matchingContact = (contacts as CustomerContactDto[]).find(c =>
                `${c.firstName} ${c.lastName}`.trim().toLowerCase() === orderedByLower
              );
              if (matchingContact) {
                this.orderForm.patchValue({ contactId: matchingContact.contactId }, { emitEvent: false });
              }
            }

            const consignee = (consignees as ConsigneeDto[]).find(c => c.consigneeId === order.consigneeId);
            this.consigneeName.set(consignee?.consigneeName || '--');
            this.consigneeAddress.set(consignee?.address || '--');

            this.loading.set(false);
            this.enableEditableFields();

            this.orderLoaded.emit({ order, items: items as ExportOrderItemDto[] });

            this.validityChange.emit(this.orderForm.valid);
            this.formDataChange.emit(this.getFormData());
            this.cdr.markForCheck();
          },
          error: () => {
            this.loading.set(false);
            this.cdr.markForCheck();
          }
        });
      } else {
        this.loading.set(false);
        this.enableEditableFields();
        this.orderLoaded.emit({ order, items: order.items || [] });
        this.validityChange.emit(this.orderForm.valid);
        this.formDataChange.emit(this.getFormData());
        this.cdr.markForCheck();
      }
    });
  }

  private clearOrderData(): void {
    this.orderNumber.set('--');
    this.orderType.set('--');
    this.orderStatus.set('--');
    this.customerId.set('--');
    this.customerName.set('--');
    this.estimatedArrivalTime.set('--');
    this.consigneeName.set('--');
    this.consigneeAddress.set('--');
    this.billToCustomerId.set('--');
    this.billToCustomerName.set('--');
    this.billToAddress.set('--');
    this.contacts.set([]);
    this.filteredContacts.set([]);
    this.consignees.set([]);
    this.filteredConsignees.set([]);
    this.contracts.set([]);
    this.filteredContracts.set([]);
    this.payees.set([]);
    this.disableEditableFields();
    this.orderForm.patchValue({
      contractId: '',
      orderMode: '',
      contactId: '',
      consigneeId: ''
    });
  }

  onConsigneeChange(consigneeId: string): void {
    const consignee = this.consignees().find(c => c.consigneeId === consigneeId);
    this.consigneeName.set(consignee?.consigneeName || '--');
    this.consigneeAddress.set(consignee?.address || '--');
    this.formDataChange.emit(this.getFormData());
  }

  scrollToSection(section: string): void {
    this.activeSection.set(section);
    const element = document.getElementById(`${this.componentId}-section-${section}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private loadCustomerDependencies(custId: string): void {
    forkJoin({
      customer: this.apiService.getCustomerById(custId).pipe(catchError(() => of(null))),
      consignees: this.apiService.getConsignees(custId).pipe(catchError(() => of([]))),
      contacts: this.apiService.getContacts(custId).pipe(catchError(() => of([]))),
      contracts: this.apiService.getContracts(custId).pipe(catchError(() => of([]))),
      payees: this.apiService.getPayeesLookup(custId).pipe(catchError(() => of([])))
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ customer, consignees, contacts, contracts, payees }) => {
        if (customer) {
          this.customerName.set(customer.customerName ?? customer.name ?? '--');
          const payeeId = customer.payeeId ?? customer.customerId;
          this.billToCustomerId.set(payeeId ?? '--');

          if (payeeId && payeeId !== custId) {
            this.apiService.getCustomerById(payeeId).pipe(
              catchError(() => of(null))
            ).subscribe(payee => {
              if (payee) {
                this.billToCustomerName.set(payee.customerName ?? payee.name ?? '--');
                const payeeAddr = [payee.address1, payee.address2, payee.city, payee.state, payee.zipCode, payee.country].filter(Boolean).join(', ');
                this.billToAddress.set(payeeAddr || '--');
              }
              this.cdr.markForCheck();
            });
          } else {
            this.billToCustomerName.set(customer.customerName ?? customer.name ?? '--');
            const addr = [customer.address1, customer.address2, customer.city, customer.state, customer.zipCode, customer.country].filter(Boolean).join(', ');
            this.billToAddress.set(addr || '--');
          }
        }

        this.consignees.set(consignees as ConsigneeDto[]);
        this.filteredConsignees.set(consignees as ConsigneeDto[]);
        this.contacts.set(contacts as CustomerContactDto[]);
        this.filteredContacts.set(contacts as CustomerContactDto[]);
        this.contracts.set(contracts as ContractLookupItem[]);
        this.filteredContracts.set(contracts as ContractLookupItem[]);
        this.payees.set(payees as PayeeLookupItem[]);

        this.enableEditableFields();
        this.cdr.markForCheck();
      },
      error: () => {
        this.cdr.markForCheck();
      }
    });
  }

  private subscribeToSearchFilters(): void {
    this.orderNumberSearchCtrl.valueChanges.pipe(
      debounceTime(200), takeUntil(this.destroy$)
    ).subscribe(term => {
      const search = (term || '').toLowerCase();
      this.filteredOrderNumbers.set(
        this.orderNumbers().filter(o =>
          (o.orderNo || '').toLowerCase().includes(search) ||
          (o.customerName || '').toLowerCase().includes(search) ||
          (o.customerId || '').toLowerCase().includes(search)
        )
      );
    });

    this.contractSearchCtrl.valueChanges.pipe(
      debounceTime(200), takeUntil(this.destroy$)
    ).subscribe(term => {
      const search = (term || '').toLowerCase();
      this.filteredContracts.set(
        this.contracts().filter(c => (c.code || '').toLowerCase().includes(search) || (c.description || '').toLowerCase().includes(search))
      );
    });

    this.modeSearchCtrl.valueChanges.pipe(
      debounceTime(200), takeUntil(this.destroy$)
    ).subscribe(term => {
      const search = (term || '').toLowerCase();
      this.filteredModes.set(
        this.modes().filter(m => (m.code || '').toLowerCase().includes(search) || (m.description || '').toLowerCase().includes(search))
      );
    });

    this.contactSearchCtrl.valueChanges.pipe(
      debounceTime(200), takeUntil(this.destroy$)
    ).subscribe(term => {
      const search = (term || '').toLowerCase();
      this.filteredContacts.set(
        this.contacts().filter(c => (`${c.firstName} ${c.lastName}`).toLowerCase().includes(search))
      );
    });

    this.consigneeSearchCtrl.valueChanges.pipe(
      debounceTime(200), takeUntil(this.destroy$)
    ).subscribe(term => {
      const search = (term || '').toLowerCase();
      this.filteredConsignees.set(
        this.consignees().filter(c => (c.consigneeId || '').toLowerCase().includes(search) || (c.consigneeName || '').toLowerCase().includes(search))
      );
    });
  }

  getFormData(): Partial<ExportOrderDto> {
    const formValue = this.orderForm.getRawValue();

    let orderedBy: string | undefined;
    if (formValue.contactId) {
      const contact = this.contacts().find(c => c.contactId === formValue.contactId);
      if (contact) {
        orderedBy = `${contact.firstName} ${contact.lastName}`.trim();
      }
    }

    return {
      orderNo: formValue.orderNo,
      customerId: this.customerId() !== '--' ? this.customerId() : undefined,
      contractId: formValue.contractId,
      orderMode: formValue.orderMode,
      orderedBy,
      consigneeId: formValue.consigneeId,
      consigneeName: this.consigneeName() !== '--' ? this.consigneeName() : undefined,
      consigneeAddress: this.consigneeAddress() !== '--' ? this.consigneeAddress() : undefined,
      orderType: this.orderType() !== '--' ? this.orderType() : undefined,
      orderStatus: this.orderStatus() !== '--' ? this.orderStatus() : undefined,
      estArrivalTime: this.estimatedArrivalTime() !== '--' ? this.estimatedArrivalTime() : undefined,
      payeeId: this.billToCustomerId() !== '--' ? this.billToCustomerId() : undefined,
      customerName: this.customerName() !== '--' ? this.customerName() : undefined
    };
  }

  get f() { return this.orderForm.controls; }
}
