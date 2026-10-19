import { Component, ElementRef, EventEmitter, Input, Output, OnInit, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, switchMap } from 'rxjs';
import moment from 'moment';

import { CustomerPayeeApiService } from './services/customer-payee-api.service';
import { CustomerProfileApiService } from '../customer-profile/services/customer-profile-api.service';
import { UpdateCustomerProfileRequestDto } from '../customer-profile/models/customer-profile.model';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

import {
  PayeeCustomerDto,
  PayeeCustomerQueryDto
} from './models/customer-payee.model';

import { CustomerProfileDto } from '../customer-profile/models/customer-profile.model';
import { CustomerPayeeCardComponent } from './customer-payee-card/customer-payee-card.component';
import { AddEditPayeeComponent } from './add-edit-payee/add-edit-payee.component';

@Component({
  selector: 'app-customer-payee-details',
  standalone: true,
  imports: [
    CommonModule,
    A11yModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CustomerPayeeCardComponent,
    AddEditPayeeComponent
  ],
  templateUrl: './customer-payee-details.component.html',
  styleUrls: ['./customer-payee-details.component.scss']
})
export class CustomerPayeeDetailsComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `customer-payee-details-${CustomerPayeeDetailsComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  @ViewChild('addBtn') addBtnRef!: ElementRef<HTMLButtonElement>;

  @Input() customerId: string = '';
  @Input() customerName: string = '';
  @Input() customerCity: string = '';
  @Input() customerProfile: CustomerProfileDto | null = null;
  @Output() activePayeeCount = new EventEmitter<number>();
  @Output() payeeLinked = new EventEmitter<string>();

  private service = inject(CustomerPayeeApiService);
  private customerProfileApi = inject(CustomerProfileApiService);
  private loggingService = inject(LoggingService);
  private snackbarService = inject(SnackbarService);
  private headerService = inject(HeaderService);

  readonly payees = signal<PayeeCustomerDto[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly hasError = signal<boolean>(false);
  readonly errorMessage = signal<string>('');
  readonly totalRecords = signal<number>(0);

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: PayeeCustomerDto | null = null;
  private lastFocusedElement: HTMLElement | null = null;

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    if (this.customerId) {
      this.loadPayees();
    }
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isEmpty(): boolean {
    return this.payees().length === 0 && !this.isLoading() && !this.hasError();
  }

  loadPayees(): void {
    const payeeId = this.customerProfile?.payeeId;
    if (!payeeId) {
      this.payees.set([]);
      this.totalRecords.set(0);
      this.activePayeeCount.emit(0);
      return;
    }

    this.isLoading.set(true);
    this.hasError.set(false);

    const query: PayeeCustomerQueryDto = {
      customerId: payeeId,
      includeTerminated: true,
      sortColumn: 'customerId',
      sortOrder: 'ASC'
    };

    this.service
      .getPayeeCustomers(100, 0, query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.payees.set(response.data);
          this.totalRecords.set(response.total);
          this.emitActiveCount(response.data);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.hasError.set(true);
          const body = error?.error;
          const code = body?.errorResponse?.errorCode || body?.errorCode;
          const msg = body?.errorResponse?.error || body?.error || body?.message || 'Failed to load payee customers. Please try again.';
          const message = code ? `Error ${code}: ${msg}` : msg;
          this.errorMessage.set(message);
          this.loggingService.error('Failed to load payee customers', error);
          this.snackbarService.showError(message);
        }
      });
  }

  private emitActiveCount(payees: PayeeCustomerDto[]): void {
    const chapterOffset = this.headerService.chapterTimeZone ? this.headerService.chapterTimeZone() : '';
    const chapterToday = DateFieldValidationUtility.getMinDate(chapterOffset);
    const activeCount = payees.filter(p => {
      if (!p.termDate) return true;
      return moment(p.termDate).startOf('day').isAfter(chapterToday);
    }).length;
    this.activePayeeCount.emit(activeCount);
  }

  onAddNew(): void {
    this.lastFocusedElement = document.activeElement as HTMLElement;
    this.sidePanelMode = 'add';
    this.sidePanelData = {
      customerId: '',
      chapterId: '',
      customerType: 'PA',
      name: '',
      shortName: '',
      alphaKey: '',
      address1: '',
      city: '',
      zip: '',
      intFlag: 'N',
      codFlag: 'N',
      effDate: '',
      termDate: null
    } as PayeeCustomerDto;
    this.sidePanelOpen = true;
  }

  onEditPayee(payee: PayeeCustomerDto): void {
    this.lastFocusedElement = document.activeElement as HTMLElement;
    this.sidePanelMode = 'edit';
    this.sidePanelData = payee;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    const target = this.lastFocusedElement || this.addBtnRef?.nativeElement;
    this.lastFocusedElement = null;
    setTimeout(() => target?.focus(), 50);
  }

  onSaveSuccess(newPayeeId: string): void {
    if (newPayeeId && this.customerProfile) {
      this.linkPayeeToCustomer(newPayeeId);
    } else {
      this.loadPayees();
    }
  }

  private linkPayeeToCustomer(newPayeeId: string): void {
    const profile = this.customerProfile!;
    const payload: UpdateCustomerProfileRequestDto = {
      name: profile.name,
      customerType: profile.customerType,
      shortName: profile.shortName,
      alphaKey: profile.alphaKey || null,
      intFlag: profile.intFlag || 'N',
      address1: profile.address1,
      address2: profile.address2 || null,
      address3: profile.address3 || null,
      city: profile.city,
      state: profile.state || null,
      zip: profile.zip,
      country: profile.country,
      phoneNo: profile.phoneNo || null,
      phoneExt: profile.phoneExt || null,
      faxNo: profile.faxNo || null,
      intPhone: profile.intPhone || null,
      telexNo: profile.telexNo || null,
      codFlag: profile.codFlag,
      returnAcceptedFlag: profile.returnAcceptedFlag,
      arAccount: profile.arAccount,
      fiPriceSchNo: profile.fiPriceSchNo || null,
      priceChangeFlag: profile.priceChangeFlag || null,
      ednGenFlag: profile.ednGenFlag || null,
      plasmaFileType: profile.plasmaFileType || null,
      phApprFlag: profile.phApprFlag || null,
      insApprFlag: profile.insApprFlag || null,
      effDate: profile.effDate ? moment(profile.effDate).format('YYYY-MM-DD') : '',
      termDate: profile.termDate ? moment(profile.termDate).format('YYYY-MM-DD') : null,
      payeeId: newPayeeId
    };

    this.customerProfileApi.updateCustomerProfile(this.customerId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.customerProfile!.payeeId = newPayeeId;
          this.payeeLinked.emit(newPayeeId);
          this.loadPayees();
        },
        error: (error) => {
          this.loggingService.error('Failed to link payee to customer', error);
          const body = error?.error;
          const msg = body?.errorResponse?.error || body?.error || body?.message || 'Failed to link payee to customer.';
          this.snackbarService.showError(msg);
        }
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadPayees();
      });
  }
}
