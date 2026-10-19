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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil, forkJoin, catchError, of, debounceTime } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { HeaderService } from '@shared/services/header.service';
import { formatTableDateTime } from '@shared/utils/date-format.util';
import { convertUTCToTimezone } from '@shared/date/timezone.util';
import {
  ExportOrderDto,
  LookupItem,
  ConsigneeDto,
  CustomerContactDto,
  OrderClassLookupItem,
  ContractLookupItem,
  PayeeLookupItem,
  StandingOrderItemDto
} from '../models/export-order.model';
import { ExportOrderApiService } from '../services/export-order-api.service';
import { EnterCustomerContactDialogComponent } from '../../enter-regular-order/dialogs/enter-customer-contact-dialog/enter-customer-contact-dialog';
import { EnterConsigneeDialogComponent } from '../../enter-regular-order/dialogs/enter-consignee-dialog/enter-consignee-dialog';

@Component({
  selector: 'app-ex-step-order-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatDialogModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './ex-step-order-details.html',
  styleUrls: ['./ex-step-order-details.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExStepOrderDetailsComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `ex-step-order-details-${ExStepOrderDetailsComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;

  @Input() savedOrderData: Partial<ExportOrderDto> | null = null;
  @Output() formDataChange = new EventEmitter<Partial<ExportOrderDto>>();
  @Output() validityChange = new EventEmitter<boolean>();
  @Output() contractSubstituteFlagChange = new EventEmitter<string | null>();
  @Output() priceChangeFlagChange = new EventEmitter<string | null>();
  @Output() standingOrderItemsFound = new EventEmitter<StandingOrderItemDto[]>();

  private readonly fb = inject(FormBuilder);
  private readonly headerService = inject(HeaderService);
  private readonly dialog = inject(MatDialog);
  private readonly apiService = inject(ExportOrderApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  orderForm!: FormGroup;

  contracts = signal<ContractLookupItem[]>([]);
  priorities = signal<OrderClassLookupItem[]>([]);
  modes = signal<LookupItem[]>([]);
  customers = signal<LookupItem[]>([]);
  contacts = signal<CustomerContactDto[]>([]);
  consignees = signal<ConsigneeDto[]>([]);
  payees = signal<PayeeLookupItem[]>([]);
  loading = signal(false);

  filteredCustomers = signal<LookupItem[]>([]);
  filteredContracts = signal<ContractLookupItem[]>([]);
  filteredPriorities = signal<OrderClassLookupItem[]>([]);
  filteredModes = signal<LookupItem[]>([]);
  filteredContacts = signal<CustomerContactDto[]>([]);
  filteredConsignees = signal<ConsigneeDto[]>([]);
  filteredPayees = signal<PayeeLookupItem[]>([]);

  customerSearchCtrl = new FormControl('');
  contractSearchCtrl = new FormControl('');
  prioritySearchCtrl = new FormControl('');
  modeSearchCtrl = new FormControl('');
  contactSearchCtrl = new FormControl('');
  consigneeSearchCtrl = new FormControl('');
  payeeSearchCtrl = new FormControl('');

  lastStandingOrderKey = signal<string>('');

  orderNumber = signal<string>('--');
  estimatedArrivalTime = signal<string>('--');
  customerName = signal<string>('--');
  consigneeName = signal<string>('--');
  consigneeAddress = signal<string>('--');
  billToCustomerId = signal<string>('--');
  billToCustomerName = signal<string>('--');
  billToAddress = signal<string>('--');

  activeSection = signal<string>('customer-info');

  private calculatedEstArrivalTime: string | undefined;

  ngOnInit(): void {
    this.initializeForm();
    this.loadLookups();
    this.subscribeToSearchFilters();
    if (this.savedOrderData) {
      this.populateFromSavedData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.orderForm = this.fb.group({
      contractId: ['', [Validators.required]],
      priority: ['', [Validators.required]],
      orderMode: ['', [Validators.required]],
      customerId: ['', [Validators.required]],
      contactId: ['', [Validators.required]],
      consigneeId: ['', [Validators.required]],
      payeeId: ['', [Validators.required]],
      codFlag: [false]
    });

    this.orderForm.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.validityChange.emit(this.orderForm.valid);
      this.formDataChange.emit(this.getFormData());
    });
  }

  private loadLookups(): void {
    this.apiService.getCustomersLookup().pipe(
      takeUntil(this.destroy$),
      catchError(() => of([]))
    ).subscribe(customers => {
      this.customers.set(customers);
      this.filteredCustomers.set(customers);
      this.cdr.markForCheck();
    });

    this.apiService.getOrderModesLookup().pipe(
      takeUntil(this.destroy$),
      catchError(() => of([]))
    ).subscribe(modes => {
      this.modes.set(modes);
      this.filteredModes.set(modes);
      this.cdr.markForCheck();
    });

    this.apiService.getOrderClassesLookup().pipe(
      takeUntil(this.destroy$),
      catchError(() => of([]))
    ).subscribe((classes: OrderClassLookupItem[]) => {
      this.priorities.set(classes);
      this.filteredPriorities.set(classes);
      this.cdr.markForCheck();
    });
  }

  private populateFromSavedData(): void {
    if (!this.savedOrderData) return;
    const data = this.savedOrderData;
    this.orderForm.patchValue({
      contractId: data.contractId || '',
      priority: data.priority || '',
      orderMode: data.orderMode || '',
      customerId: data.customerId || '',
      contactId: '',
      consigneeId: data.consigneeId || '',
      payeeId: data.payeeId || '',
      codFlag: data.codFlag === 'Y'
    });
    this.orderNumber.set(data.orderNo || '--');
    if (data.estArrivalTime) {
      this.calculatedEstArrivalTime = data.estArrivalTime;
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
    this.customerName.set(data.customerName || '--');
    if (data.customerId) {
      this.loadCustomerDependencies(data.customerId);
    }
  }

  onCustomerChange(customerId: string): void {
    this.orderForm.patchValue({ contactId: '', consigneeId: '', payeeId: '' });
    this.contracts.set([]);
    this.filteredContracts.set([]);

    if (!customerId) {
      this.customerName.set('--');
      this.consigneeName.set('--');
      this.consigneeAddress.set('--');
      this.billToCustomerId.set('--');
      this.billToCustomerName.set('--');
      this.billToAddress.set('--');
      this.contacts.set([]);
      this.filteredContacts.set([]);
      this.consignees.set([]);
      this.filteredConsignees.set([]);
      this.payees.set([]);
      this.filteredPayees.set([]);
      this.cdr.markForCheck();
      return;
    }

    this.loading.set(true);
    this.loadCustomerDependencies(customerId);
  }

  private loadCustomerDependencies(customerId: string): void {
    forkJoin({
      customer: this.apiService.getCustomerById(customerId).pipe(catchError(() => of(null))),
      consignees: this.apiService.getConsignees(customerId).pipe(catchError(() => of([]))),
      contacts: this.apiService.getContacts(customerId).pipe(catchError(() => of([]))),
      contracts: this.apiService.getContracts(customerId).pipe(catchError(() => of([]))),
      payees: this.apiService.getPayeesLookup(customerId).pipe(catchError(() => of([])))
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ customer, consignees, contacts, contracts, payees }) => {
        if (customer) {
          this.customerName.set(customer.customerName ?? customer.name ?? '--');

          const defaultPayeeId = customer.payeeId ?? customer.customerId;
          this.billToCustomerId.set(defaultPayeeId ?? '--');

          // Set default payeeId in form
          this.orderForm.patchValue({ payeeId: defaultPayeeId || '' });

          // Set default COD flag from customer data
          this.orderForm.patchValue({ codFlag: customer.codFlag === 'Y' });

          // Emit price change flag from customer data
          this.priceChangeFlagChange.emit(customer.priceChangeFlag ?? null);

          if (defaultPayeeId && defaultPayeeId !== customerId) {
            this.apiService.getCustomerById(defaultPayeeId).pipe(
              takeUntil(this.destroy$),
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
        this.filteredPayees.set(payees as PayeeLookupItem[]);

        this.consigneeName.set('--');
        this.consigneeAddress.set('--');

        // Auto-select contract if only one available
        if (contracts.length === 1) {
          this.orderForm.patchValue({ contractId: (contracts[0] as any).code });
          this.onContractChange();
        }
        // Auto-select consignee if only one available
        if (consignees.length === 1) {
          this.orderForm.patchValue({ consigneeId: consignees[0].consigneeId });
          this.onConsigneeChange(consignees[0].consigneeId);
        }
        // Auto-select contact if only one available
        if (contacts.length === 1) {
          this.orderForm.patchValue({ contactId: contacts[0].contactId });
        }

        this.loading.set(false);
        this.formDataChange.emit(this.getFormData());
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  onConsigneeChange(consigneeId: string): void {
    const consignee = this.consignees().find(c => c.consigneeId === consigneeId);
    this.consigneeName.set(consignee?.consigneeName || '--');
    this.consigneeAddress.set(consignee?.address || '--');
    this.checkStandingOrders();
  }

  onPayeeChange(payeeId: string): void {
    if (!payeeId) {
      this.billToCustomerId.set('--');
      this.billToCustomerName.set('--');
      this.billToAddress.set('--');
      return;
    }

    this.billToCustomerId.set(payeeId);
    this.apiService.getCustomerById(payeeId).pipe(
      takeUntil(this.destroy$),
      catchError(() => of(null))
    ).subscribe(payee => {
      if (payee) {
        this.billToCustomerName.set(payee.customerName ?? payee.name ?? '--');
        const addr = [payee.address1, payee.address2, payee.city, payee.state, payee.zipCode, payee.country].filter(Boolean).join(', ');
        this.billToAddress.set(addr || '--');
      } else {
        this.billToCustomerName.set('--');
        this.billToAddress.set('--');
      }
      this.cdr.markForCheck();
    });
  }

  onPriorityChange(): void {
    const priorityCode = this.orderForm.get('priority')?.value;
    const selected = this.priorities().find(p => p.code === priorityCode);
    if (selected?.processHours != null) {
      const arrivalDate = new Date(Date.now() + selected.processHours * 3600000);
      this.calculatedEstArrivalTime = arrivalDate.toISOString();
      const timezone = this.headerService.chapterTimeZone();
      if (timezone) {
        const converted = convertUTCToTimezone(arrivalDate, timezone);
        this.estimatedArrivalTime.set(formatTableDateTime(converted.toISOString()));
      } else {
        this.estimatedArrivalTime.set(formatTableDateTime(arrivalDate.toISOString()));
      }
    } else {
      this.calculatedEstArrivalTime = undefined;
      this.estimatedArrivalTime.set('--');
    }
    this.formDataChange.emit(this.getFormData());
  }

  onContractChange(): void {
    const contractId = this.orderForm.get('contractId')?.value;
    const contract = this.contracts().find(c => c.code === contractId);
    this.contractSubstituteFlagChange.emit(contract?.substituteFlag ?? null);
    this.checkStandingOrders();
  }

  onAddNewConsignee(): void {
    const customerId = this.orderForm.get('customerId')?.value;
    if (!customerId) return;

    const dialogRef = this.dialog.open(EnterConsigneeDialogComponent, {
      position: { right: '0' },
      width: '500px',
      height: '100vh',
      panelClass: 'right-panel-dialog',
      data: { customerId }
    });

    dialogRef.afterClosed().pipe(
      takeUntil(this.destroy$)
    ).subscribe(result => {
      if (result) {
        this.apiService.getConsignees(customerId).pipe(
          takeUntil(this.destroy$),
          catchError(() => of([]))
        ).subscribe(consignees => {
          this.consignees.set(consignees as ConsigneeDto[]);
          this.filteredConsignees.set(consignees as ConsigneeDto[]);
          if (result.consigneeId) {
            this.orderForm.patchValue({ consigneeId: result.consigneeId });
            this.onConsigneeChange(result.consigneeId);
          }
          this.cdr.markForCheck();
        });
      }
    });
  }

  private checkStandingOrders(): void {
    const customerId = this.orderForm.get('customerId')?.value;
    const contractId = this.orderForm.get('contractId')?.value;
    const consigneeId = this.orderForm.get('consigneeId')?.value;

    if (!customerId || !contractId || !consigneeId) return;

    const key = `${customerId}|${contractId}|${consigneeId}`;
    if (key === this.lastStandingOrderKey()) return;

    this.lastStandingOrderKey.set(key);
    this.apiService.getStandingOrderItems(customerId, contractId, consigneeId).pipe(
      takeUntil(this.destroy$),
      catchError(() => of([]))
    ).subscribe(items => {
      if (items && items.length > 0) {
        this.standingOrderItemsFound.emit(items);
      }
    });
  }

  onAddNewContact(): void {
    const customerId = this.orderForm.get('customerId')?.value;
    if (!customerId) return;

    const dialogRef = this.dialog.open(EnterCustomerContactDialogComponent, {
      position: { right: '0' },
      width: '500px',
      height: '100vh',
      panelClass: 'right-panel-dialog',
      data: { customerId }
    });

    dialogRef.afterClosed().pipe(
      takeUntil(this.destroy$)
    ).subscribe(result => {
      if (result) {
        const apiPayload = {
          contactType: result.contactTypeCode,
          firstName: result.firstName,
          lastName: result.lastName,
          dayPhoneNo: result.dayPhone,
          effDate: result.effectiveDate,
          salutation: result.salutation || undefined,
          title: result.title || undefined,
          nightPhoneNo: result.nightPhone || undefined,
          faxNo: result.faxNumber || undefined,
          telexNo: result.telexNumber || undefined,
          termDate: result.terminationDate || undefined
        };

        this.apiService.createContact(customerId, apiPayload).pipe(
          takeUntil(this.destroy$),
          catchError(() => of(null))
        ).subscribe(saved => {
          if (saved) {
            const newContact: CustomerContactDto = {
              contactId: saved.contactType ?? result.contactTypeCode,
              lastName: saved.lastName ?? result.lastName,
              firstName: saved.firstName ?? result.firstName,
              salutation: saved.salutation ?? result.salutation,
              title: saved.title ?? result.title,
              contactType: saved.contactType ?? result.contactTypeCode,
              contactTypeCode: saved.contactType ?? result.contactTypeCode,
              dayPhone: saved.dayPhoneNo ?? result.dayPhone,
              faxNumber: saved.faxNo ?? result.faxNumber,
              nightPhone: saved.nightPhoneNo ?? result.nightPhone,
              telexNumber: saved.telexNo ?? result.telexNumber,
              effectiveDate: saved.effDate ?? result.effectiveDate,
              terminationDate: saved.termDate ?? result.terminationDate
            };
            this.contacts.update(contacts => [...contacts, newContact]);
            this.filteredContacts.update(contacts => [...contacts, newContact]);
            // Auto-select the newly created contact
            this.orderForm.patchValue({ contactId: newContact.contactId });
            this.cdr.markForCheck();
          }
        });
      }
    });
  }

  scrollToSection(section: string): void {
    this.activeSection.set(section);
    const element = document.getElementById(`${this.componentId}-section-${section}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      element.setAttribute('tabindex', '-1');
      setTimeout(() => element.focus(), 300);
    }
  }

  private subscribeToSearchFilters(): void {
    this.customerSearchCtrl.valueChanges.pipe(
      debounceTime(200), takeUntil(this.destroy$)
    ).subscribe(term => {
      const search = (term || '').toLowerCase();
      this.filteredCustomers.set(
        this.customers().filter(c => (c.code || '').toLowerCase().includes(search) || (c.description || '').toLowerCase().includes(search))
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

    this.prioritySearchCtrl.valueChanges.pipe(
      debounceTime(200), takeUntil(this.destroy$)
    ).subscribe(term => {
      const search = (term || '').toLowerCase();
      this.filteredPriorities.set(
        this.priorities().filter(p => (p.code || '').toLowerCase().includes(search) || (p.description || '').toLowerCase().includes(search))
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

    this.payeeSearchCtrl.valueChanges.pipe(
      debounceTime(200), takeUntil(this.destroy$)
    ).subscribe(term => {
      const search = (term || '').toLowerCase();
      this.filteredPayees.set(
        this.payees().filter(p => (p.code || '').toLowerCase().includes(search) || (p.description || '').toLowerCase().includes(search))
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
      customerId: formValue.customerId,
      contractId: formValue.contractId,
      priority: formValue.priority,
      orderMode: formValue.orderMode,
      orderedBy,
      consigneeId: formValue.consigneeId,
      payeeId: formValue.payeeId || (this.billToCustomerId() !== '--' ? this.billToCustomerId() : undefined),
      customerName: this.customerName(),
      orderNo: this.orderNumber() !== '--' ? this.orderNumber() : undefined,
      codFlag: formValue.codFlag ? 'Y' : 'N',
      estArrivalTime: this.calculatedEstArrivalTime || undefined
    };
  }

  get f() { return this.orderForm.controls; }
}
