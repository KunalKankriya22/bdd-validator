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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil, forkJoin, catchError, of, debounceTime } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { HeaderService } from '@shared/services/header.service';
import {
  RegularOrderDto,
  OrderItemDto,
  LookupItem,
  ConsigneeDto,
  CustomerContactDto,
  OrderNumberLookupItem,
  PickSlipLookupItem
} from '../../enter-regular-order/models/regular-order.model';
import { RegularOrderApiService } from '../../enter-regular-order/services/regular-order-api.service';
import { EnterCustomerContactDialogComponent } from '../../enter-regular-order/dialogs/enter-customer-contact-dialog/enter-customer-contact-dialog';

@Component({
  selector: 'app-cc-step-order-details',
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
  templateUrl: './step-order-details.html',
  styleUrls: ['./step-order-details.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CcStepOrderDetailsComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `cc-step-order-details-${CcStepOrderDetailsComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;

  @Input() savedOrderData: Partial<RegularOrderDto> | null = null;
  @Output() formDataChange = new EventEmitter<Partial<RegularOrderDto>>();
  @Output() validityChange = new EventEmitter<boolean>();
  @Output() orderLoaded = new EventEmitter<{ order: RegularOrderDto; items: OrderItemDto[] }>();

  private readonly fb = inject(FormBuilder);
  private readonly headerService = inject(HeaderService);
  private readonly dialog = inject(MatDialog);
  private readonly apiService = inject(RegularOrderApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  orderForm!: FormGroup;

  orderNumbers = signal<OrderNumberLookupItem[]>([]);
  filteredOrderNumbers = signal<OrderNumberLookupItem[]>([]);
  orderNumberSearchCtrl = new FormControl('');

  contracts = signal<LookupItem[]>([]);
  priorities = signal<LookupItem[]>([]);
  modes = signal<LookupItem[]>([]);
  contacts = signal<CustomerContactDto[]>([]);
  consignees = signal<ConsigneeDto[]>([]);
  loading = signal(false);

  filteredContracts = signal<LookupItem[]>([]);
  filteredPriorities = signal<LookupItem[]>([]);
  filteredModes = signal<LookupItem[]>([]);
  filteredContacts = signal<CustomerContactDto[]>([]);
  filteredConsignees = signal<ConsigneeDto[]>([]);

  contractSearchCtrl = new FormControl('');
  prioritySearchCtrl = new FormControl('');
  modeSearchCtrl = new FormControl('');
  contactSearchCtrl = new FormControl('');
  consigneeSearchCtrl = new FormControl('');

  pickSlips = signal<PickSlipLookupItem[]>([]);
  selectedPickSlipId = new FormControl('');

  orderNumber = signal<string>('--');
  orderType = signal<string>('--');
  estimatedArrivalTime = signal<string>('--');
  customerName = signal<string>('--');
  customerId = signal<string>('--');
  consigneeName = signal<string>('--');
  consigneeAddress = signal<string>('--');
  billToCustomerId = signal<string>('--');
  billToCustomerName = signal<string>('--');
  billToAddress = signal<string>('--');

  activeSection = signal<string>('order-info');

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
      contractId: [''],
      priority: [''],
      orderMode: [''],
      contactId: [''],
      consigneeId: ['']
    });

    this.orderForm.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.validityChange.emit(this.orderForm.valid);
      this.formDataChange.emit(this.getFormData());
    });
  }

  private loadOrderNumbers(): void {
    this.apiService.getOrderNumbersLookup().pipe(
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

    this.apiService.getOrderClassesLookup().pipe(
      takeUntil(this.destroy$),
      catchError(() => of([]))
    ).subscribe(classes => {
      this.priorities.set(classes);
      this.filteredPriorities.set(classes);
      this.cdr.markForCheck();
    });
  }

  private populateFromSavedData(): void {
    if (!this.savedOrderData) return;
    const data = this.savedOrderData;
    this.orderForm.patchValue({
      orderNo: data.orderNo || '',
      contractId: data.contractId || '',
      priority: data.priority || '',
      orderMode: data.orderMode || '',
      contactId: data.contactId || '',
      consigneeId: data.consigneeId || ''
    });
    this.orderNumber.set(data.orderNo || '--');
    this.orderType.set(data.orderType || '--');
    this.customerId.set(data.customerId || '--');
    this.customerName.set(data.customerName || '--');
    this.estimatedArrivalTime.set(data.estArrivalTime || '--');
    this.consigneeName.set(data.consigneeName || '--');
    this.consigneeAddress.set(data.consigneeAddress || '--');
    if (data.payeeId) {
      this.billToCustomerId.set(data.payeeId);
    }
    if (data.customerId) {
      this.loadCustomerDependencies(data.customerId);
    }
  }

  onOrderNumberChange(orderNo: string): void {
    if (!orderNo) {
      this.clearOrderData();
      return;
    }

    this.loading.set(true);
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
      this.customerId.set(order.customerId || '--');
      this.estimatedArrivalTime.set(order.estArrivalTime || '--');

      this.orderForm.patchValue({
        contractId: order.contractId || '',
        priority: order.priority || '',
        orderMode: order.orderMode || '',
        consigneeId: order.consigneeId || ''
      }, { emitEvent: false });

      if (order.customerId) {
        forkJoin({
          customer: this.apiService.getCustomerById(order.customerId).pipe(catchError(() => of(null))),
          consignees: this.apiService.getConsignees(order.customerId).pipe(catchError(() => of([]))),
          contacts: this.apiService.getContacts(order.customerId).pipe(catchError(() => of([]))),
          contracts: this.apiService.getContracts(order.customerId).pipe(catchError(() => of([]))),
          items: this.apiService.getOrderItems(orderNo).pipe(catchError(() => of([]))),
          pickSlips: this.apiService.getPickSlips(orderNo).pipe(catchError(() => of([])))
        }).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: ({ customer, consignees, contacts, contracts, items, pickSlips }) => {
            if (customer) {
              this.customerName.set(customer.customerName ?? customer.name ?? '--');

              const payeeId = customer.payeeId ?? customer.customerId;
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
            this.contracts.set(contracts as LookupItem[]);
            this.filteredContracts.set(contracts as LookupItem[]);

            this.pickSlips.set(pickSlips as PickSlipLookupItem[]);

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

            this.orderLoaded.emit({ order, items: items as OrderItemDto[] });

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
    this.pickSlips.set([]);
    this.selectedPickSlipId.setValue('');
    this.orderForm.patchValue({
      contractId: '',
      priority: '',
      orderMode: '',
      contactId: '',
      consigneeId: ''
    });
  }

  onConsigneeChange(consigneeId: string): void {
    const consignee = this.consignees().find(c => c.consigneeId === consigneeId);
    this.consigneeName.set(consignee?.consigneeName || '--');
    this.consigneeAddress.set(consignee?.address || '--');
  }

  onAddNewContact(): void {
    const custId = this.customerId();
    if (!custId || custId === '--') return;

    const dialogRef = this.dialog.open(EnterCustomerContactDialogComponent, {
      position: { right: '0' },
      width: '500px',
      height: '100vh',
      panelClass: 'right-panel-dialog',
      data: { customerId: custId }
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

        this.apiService.createContact(custId, apiPayload).pipe(
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
            this.cdr.markForCheck();
          }
        });
      }
    });
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
      contracts: this.apiService.getContracts(custId).pipe(catchError(() => of([])))
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ customer, consignees, contacts, contracts }) => {
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
        this.contracts.set(contracts as LookupItem[]);
        this.filteredContracts.set(contracts as LookupItem[]);

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
  }

  getFormData(): Partial<RegularOrderDto> {
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
      priority: formValue.priority,
      orderMode: formValue.orderMode,
      orderedBy,
      contactId: formValue.contactId || undefined,
      consigneeId: formValue.consigneeId,
      consigneeName: this.consigneeName() !== '--' ? this.consigneeName() : undefined,
      consigneeAddress: this.consigneeAddress() !== '--' ? this.consigneeAddress() : undefined,
      orderType: this.orderType() !== '--' ? this.orderType() : undefined,
      estArrivalTime: this.estimatedArrivalTime() !== '--' ? this.estimatedArrivalTime() : undefined,
      payeeId: this.billToCustomerId() !== '--' ? this.billToCustomerId() : undefined,
      customerName: this.customerName() !== '--' ? this.customerName() : undefined
    };
  }

  get f() { return this.orderForm.controls; }
}
