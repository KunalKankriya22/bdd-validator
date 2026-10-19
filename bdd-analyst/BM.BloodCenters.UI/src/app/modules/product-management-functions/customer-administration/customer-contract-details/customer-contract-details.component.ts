import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { CustomerContractApiService } from './services/customer-contract-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

import {
  CustomerContractDto,
  CustomerContractQueryDto
} from './models/customer-contract.model';

import { CustomerContractCardComponent } from './customer-contract-card/customer-contract-card.component';
import { AddEditContractComponent } from './add-edit-contract/add-edit-contract.component';

@Component({
  selector: 'app-customer-contract-details',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CustomerContractCardComponent,
    AddEditContractComponent
  ],
  templateUrl: './customer-contract-details.component.html',
  styleUrls: ['./customer-contract-details.component.scss']
})
export class CustomerContractDetailsComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `customer-contract-details-${CustomerContractDetailsComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  @Input() customerId: string = '';
  @Input() customerName: string = '';
  @Input() customerCity: string = '';
  @Output() activeContractCount = new EventEmitter<number>();

  private service = inject(CustomerContractApiService);
  private loggingService = inject(LoggingService);
  private snackbarService = inject(SnackbarService);
  private headerService = inject(HeaderService);

  // Signals for state management
  readonly contracts = signal<CustomerContractDto[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly hasError = signal<boolean>(false);
  readonly errorMessage = signal<string>('');
  readonly totalRecords = signal<number>(0);

  // Side panel state
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: CustomerContractDto | null = null;

  // Pagination
  pageSize = 25;
  pageIndex = 0;

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    if (this.customerId) {
      this.loadContracts();
    }
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isEmpty(): boolean {
    return this.contracts().length === 0 && !this.isLoading() && !this.hasError();
  }

  loadContracts(): void {
    if (!this.customerId) {
      this.hasError.set(true);
      this.errorMessage.set('Customer ID is required');
      return;
    }

    this.isLoading.set(true);
    this.hasError.set(false);

    const query: CustomerContractQueryDto = {
      customerId: this.customerId,
      sortColumn: 'contractCode',
      sortOrder: 'ASC'
    };

    const skip = this.pageIndex * this.pageSize;

    this.service
      .getCustomerContracts(this.customerId, this.pageSize, skip, query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const sorted = [...response.data].sort((a, b) => {
            const aActive = this.isContractActive(a);
            const bActive = this.isContractActive(b);
            if (aActive === bActive) return 0;
            return aActive ? -1 : 1;
          });
          this.contracts.set(sorted);
          this.totalRecords.set(response.total);
          const activeCount = sorted.filter(c => this.isContractActive(c)).length;
          this.activeContractCount.emit(activeCount);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.hasError.set(true);
          const body = error?.error;
          const code = body?.errorResponse?.errorCode || body?.errorCode;
          const msg = body?.errorResponse?.error || body?.error || body?.message || 'Failed to load customer contracts. Please try again.';
          const message = code ? `Error ${code}: ${msg}` : msg;
          this.errorMessage.set(message);
          this.loggingService.error('Failed to load customer contracts', error);
          this.snackbarService.showError(message);
        }
      });
  }

  onAddNew(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = {
      contractId: '',
      customerId: this.customerId,
      effDate: '',
      termDate: null
    } as CustomerContractDto;
    this.sidePanelOpen = true;
  }

  onEditContract(contract: CustomerContractDto): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = contract;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSaveSuccess(): void {
    this.loadContracts();
  }

  private isContractActive(contract: CustomerContractDto): boolean {
    if (!contract.termDate) return true;
    const chapterOffset = this.headerService.chapterTimeZone ? this.headerService.chapterTimeZone() : '';
    const chapterToday = DateFieldValidationUtility.getMinDate(chapterOffset);
    const termDate = moment(contract.termDate).startOf('day');
    return termDate.isAfter(chapterToday);
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadContracts();
      });
  }
}
