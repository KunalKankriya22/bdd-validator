import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { A11yModule } from '@angular/cdk/a11y';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { CustomerContactApiService } from './services/customer-contact-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

import { CustomerContactDto } from './models/customer-contact.model';
import { CustomerContactCardComponent } from './customer-contact-card/customer-contact-card.component';
import { AddEditContactComponent } from './add-edit-contact/add-edit-contact.component';

@Component({
  selector: 'app-customer-contact-details',
  standalone: true,
  imports: [
    CommonModule,
    A11yModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CustomerContactCardComponent,
    AddEditContactComponent
  ],
  templateUrl: './customer-contact-details.component.html',
  styleUrls: ['./customer-contact-details.component.scss']
})
export class CustomerContactDetailsComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `customer-contact-details-${CustomerContactDetailsComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  @Input() customerId: string = '';
  @Input() customerName: string = '';
  @Output() activeContactCount = new EventEmitter<number>();

  private service = inject(CustomerContactApiService);
  private loggingService = inject(LoggingService);
  private snackbarService = inject(SnackbarService);
  private headerService = inject(HeaderService);

  readonly contacts = signal<CustomerContactDto[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly hasError = signal<boolean>(false);
  readonly errorMessage = signal<string>('');
  readonly totalRecords = signal<number>(0);

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: CustomerContactDto | null = null;

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    if (this.customerId) {
      this.loadContacts();
    }
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isEmpty(): boolean {
    return this.contacts().length === 0 && !this.isLoading() && !this.hasError();
  }

  loadContacts(): void {
    if (!this.customerId) {
      this.hasError.set(true);
      this.errorMessage.set('Customer ID is required');
      return;
    }

    this.isLoading.set(true);
    this.hasError.set(false);

    this.service
      .getCustomerContacts(this.customerId, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const sorted = [...response.data].sort((a, b) => {
            const aActive = this.isContactActive(a);
            const bActive = this.isContactActive(b);
            if (aActive === bActive) return 0;
            return aActive ? -1 : 1;
          });
          this.contacts.set(sorted);
          this.totalRecords.set(response.total);
          const activeCount = sorted.filter(c => this.isContactActive(c)).length;
          this.activeContactCount.emit(activeCount);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.hasError.set(true);
          const body = error?.error;
          const code = body?.errorResponse?.errorCode || body?.errorCode;
          const msg = body?.errorResponse?.error || body?.error || body?.message || 'Failed to load customer contacts. Please try again.';
          const message = code ? `Error ${code}: ${msg}` : msg;
          this.errorMessage.set(message);
          this.loggingService.error('Failed to load customer contacts', error);
          this.snackbarService.showError(message);
        }
      });
  }

  onAddNew(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = {
      customerId: this.customerId,
      effDate: ''
    } as CustomerContactDto;
    this.sidePanelOpen = true;
  }

  onEditContact(contact: CustomerContactDto): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = contact;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSaveSuccess(): void {
    this.loadContacts();
  }

  private isContactActive(contact: CustomerContactDto): boolean {
    if (!contact.termDate) return true;
    const chapterOffset = this.headerService.chapterTimeZone ? this.headerService.chapterTimeZone() : '';
    const chapterToday = DateFieldValidationUtility.getMinDate(chapterOffset);
    const termDate = moment(contact.termDate).startOf('day');
    return termDate.isAfter(chapterToday);
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadContacts();
      });
  }
}
