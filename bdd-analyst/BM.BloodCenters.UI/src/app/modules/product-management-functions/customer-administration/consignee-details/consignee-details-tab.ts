import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  signal
} from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { ConsigneeApiService } from './services/consignee-api.service';
import { ConsigneeDto, CustomerDataForConsignee, ConsigneeQueryDto } from './models/consignee.model';
import { AddEditConsigneeComponent } from './add-edit-consignee/add-edit-consignee';
import { HeaderService } from '@shared/services/header.service';

@Component({
  selector: 'app-consignee-details-tab',
  standalone: true,
  imports: [
    A11yModule,
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    LoadingSpinnerComponent,
    AddEditConsigneeComponent
  ],
  templateUrl: './consignee-details-tab.html',
  styleUrls: ['./consignee-details-tab.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsigneeDetailsTabComponent implements OnInit, OnDestroy, OnChanges {
  @Input({ required: true }) customerId!: string;
  @Input() customerData: CustomerDataForConsignee | null = null;
  @Output() saveSuccess = new EventEmitter<void>();
  @Output() activeConsigneeCount = new EventEmitter<number>();

  private readonly consigneeApiService = inject(ConsigneeApiService);
  private readonly headerService = inject(HeaderService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  consignees = signal<ConsigneeDto[]>([]);
  isLoading = signal<boolean>(false);
  hasError = signal<boolean>(false);
  errorMessage = signal<string>('');

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  selectedConsignee: ConsigneeDto | null = null;
  private panelTriggerEl: HTMLElement | null = null;

  ngOnInit(): void {
    if (this.customerId) {
      this.loadConsignees();
    }
    this.subscribeToChapterChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['customerId'] && !changes['customerId'].firstChange) {
      this.loadConsignees();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadConsignees();
      });
  }

  loadConsignees(): void {
    if (!this.customerId) {
      this.consignees.set([]);
      return;
    }

    this.isLoading.set(true);
    this.hasError.set(false);

    const query: ConsigneeQueryDto = {
      includeTerminated: 'Y',
      sortColumn: 'Name',
      sortOrder: 'ASC'
    };

    this.consigneeApiService.getConsigneesByCustomer(this.customerId, query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const sorted = [...response.data].sort((a, b) => {
            const aActive = this.isActive(a);
            const bActive = this.isActive(b);
            if (aActive === bActive) return 0;
            return aActive ? -1 : 1;
          });
          this.consignees.set(sorted);
          this.activeConsigneeCount.emit(this.getActiveConsigneeCount());
          this.isLoading.set(false);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading consignees:', error);
          this.hasError.set(true);
          this.errorMessage.set(error?.error?.message || 'Failed to load consignees');
          this.isLoading.set(false);
          this.cdr.markForCheck();
        }
      });
  }

  openAddPanel(): void {
    this.panelTriggerEl = document.activeElement as HTMLElement;
    this.sidePanelMode = 'add';
    this.selectedConsignee = null;
    this.sidePanelOpen = true;
    this.cdr.markForCheck();
  }

  openEditPanel(consignee: ConsigneeDto): void {
    this.panelTriggerEl = document.activeElement as HTMLElement;
    this.sidePanelMode = 'edit';
    this.selectedConsignee = consignee;
    this.sidePanelOpen = true;
    this.cdr.markForCheck();
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.selectedConsignee = null;
    this.cdr.markForCheck();
    setTimeout(() => this.panelTriggerEl?.focus());
  }

  onSaveSuccess(): void {
    this.loadConsignees();
    this.saveSuccess.emit();
  }

  isActive(consignee: ConsigneeDto): boolean {
    if (!consignee.termDate) {
      return true;
    }
    // Use chapter local date instead of system date
    const chapterOffset = this.headerService.chapterTimeZone ? this.headerService.chapterTimeZone() : '';
    const chapterToday = DateFieldValidationUtility.getMinDate(chapterOffset);
    const termDate = moment(consignee.termDate).startOf('day');
    return termDate.isAfter(chapterToday);
  }

  getActiveConsigneeCount(): number {
    return this.consignees().filter(c => this.isActive(c)).length;
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '-';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '-';
  }

  formatAddress(consignee: ConsigneeDto): string {
    const parts = [
      consignee.address1,
      consignee.address2,
      consignee.address3,
      consignee.city,
      consignee.state,
      consignee.zip,
      consignee.country
    ].filter(Boolean);
    return parts.join(', ') || '-';
  }
}
