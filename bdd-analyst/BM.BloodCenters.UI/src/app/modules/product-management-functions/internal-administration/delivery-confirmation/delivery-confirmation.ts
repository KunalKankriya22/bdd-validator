import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE, DateAdapter, MatDateFormats } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

const DD_MON_YYYY_HH_MM_FORMATS: MatDateFormats = {
  parse: {
    dateInput: ['DD-MMM-YYYY HH:mm', 'DD-MMM-YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
  },
  display: {
    dateInput: 'DD-MMM-YYYY HH:mm',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD-MMM-YYYY HH:mm',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { DeliveryConfirmationApiService } from './services/delivery-confirmation-api.service';
import { SnackbarService } from '../../../../shared/services/snackbar.service';
import { HeaderService } from '../../../../shared/services/header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import {
  UndeliveredShipmentDto,
  ShipmentDeliveryDto,
  ConfirmDeliveryRequestDto
} from './models/delivery-confirmation.model';

@Component({
  selector: 'app-delivery-confirmation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PageHeaderWithBreadcrumb,
    NgxMatSelectSearchModule,
    MatDatepickerModule,
  ],
  templateUrl: './delivery-confirmation.html',
  styleUrls: ['./delivery-confirmation.scss'],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_HH_MM_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ]
})
export class DeliveryConfirmation implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `delivery-confirmation-${DeliveryConfirmation.nextId++}`;

  // Generate unique IDs for form elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(DeliveryConfirmationApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);

  // Page header
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
          subtitle: pageData.subtitle || 'Recording and confirming that a shipment has been successfully delivered to the designated consignee.',
        };
      }
    });
  }

  // Cleanup subject
  private destroy$ = new Subject<void>();

  // Signal-based state
  protected readonly undeliveredShipments = signal<UndeliveredShipmentDto[]>([]);
  protected readonly selectedShipment = signal<ShipmentDeliveryDto | null>(null);
  protected readonly filteredShipments = signal<UndeliveredShipmentDto[]>([]);
  shipmentSearchCtrl = new FormControl('');
  protected readonly loading = signal<boolean>(false);
  protected readonly loadingShipments = signal<boolean>(false);
  protected readonly submitting = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly submitted = signal<boolean>(false);

  // Computed values
  protected readonly hasShipments = computed(() => this.undeliveredShipments().length > 0);
  protected readonly hasSelectedShipment = computed(() => this.selectedShipment() !== null);
  protected readonly showEmptyState = computed(
    () => !this.loading() && !this.hasSelectedShipment()
  );


  get today(): Date {
    return this.chapterTimezoneService.getChapterLocalDate().toDate();
  }

  // Form
  form!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadUndeliveredShipments();
    this.subscribeToChapterChanges();

    this.shipmentSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const search = this.shipmentSearchCtrl.value?.toLowerCase() || '';
        if (!search) {
          this.filteredShipments.set(this.undeliveredShipments());
          return;
        }
        this.filteredShipments.set(
          this.undeliveredShipments().filter(s =>
            s.shipmentNo.toLowerCase().includes(search) ||
            s.shortName.toLowerCase().includes(search),
          ),
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      shipmentNo: [null, [Validators.required]],
      receiptDate: [null],
      receivedBy: ['', [Validators.required, Validators.maxLength(50)]],
      comments: ['', [Validators.maxLength(240)]]
    });

    // Subscribe to shipment number changes
    this.form.get('shipmentNo')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(shipmentNo => {
        if (shipmentNo) {
          this.onShipmentSelected(shipmentNo);
        } else {
          this.selectedShipment.set(null);
        }
      });
  }

  /**
   * Load undelivered shipments for dropdown
   */
  private loadUndeliveredShipments(): void {
    this.loadingShipments.set(true);
    this.error.set(null);

    this.apiService.getUndeliveredShipments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (shipments) => {
          this.undeliveredShipments.set(shipments);
          this.filteredShipments.set(shipments);
          this.loadingShipments.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to load undelivered shipments');
          this.loadingShipments.set(false);
          this.snackbarService.showError('Failed to load undelivered shipments. Please try again.');
        }
      });
  }

  /**
   * Handle shipment selection from dropdown
   */
  private onShipmentSelected(shipmentNo: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.getShipmentDetails(shipmentNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          if (details) {
            this.selectedShipment.set(details);
            this.form.patchValue({
              receiptDate: this.chapterTimezoneService.getChapterLocalDate().toDate(),
              receivedBy: '',
              comments: details.comments || ''
            });
          } else {
            this.selectedShipment.set(null);
            this.snackbarService.showError('Shipment details not found.');
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to load shipment details');
          this.selectedShipment.set(null);
          this.loading.set(false);
          this.snackbarService.showError('Failed to load shipment details. Please try again.');
        }
      });
  }

  /**
   * Format date for display (DD-MMM-YYYY HH:mm)
   */
  formatDate(dateStr: string | null): string {
    if (!dateStr) {
      return '-';
    }
    const date = moment(dateStr);
    return date.isValid() ? date.format('DD-MMM-YYYY HH:mm').replace(/([a-z]{3})/i, m => m.toUpperCase()) : '-';
  }

  /**
   * Get form controls for template access
   */
  get f() {
    return this.form.controls;
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      // Focus on first invalid field
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    const formValue = this.form.value;

    this.submitting.set(true);
    this.error.set(null);

    const receiptMoment = formValue.receiptDate ? moment(formValue.receiptDate) : moment();

    const request: ConfirmDeliveryRequestDto = {
      shipmentNo: formValue.shipmentNo,
      receiptDate: receiptMoment.format('YYYY-MM-DD') + 'T00:00:00',
      receiptTime: receiptMoment.format('HH:mm') + ':00',
      receivedBy: formValue.receivedBy?.trim() || '',
      comments: formValue.comments?.trim() || undefined
    };

    this.apiService.confirmDelivery(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            this.snackbarService.showSuccess('Delivery confirmed successfully.');
            this.clearForm();
            this.loadUndeliveredShipments(); // Refresh dropdown
          } else {
            this.snackbarService.showError('Failed to confirm delivery. Please try again.');
          }
          this.submitting.set(false);
        },
        error: (err) => {
          const errorMessage = err.error?.message || 'Failed to confirm delivery. Please try again.';
          this.error.set(errorMessage);
          this.snackbarService.showError(errorMessage);
          this.submitting.set(false);
        }
      });
  }

  /**
   * Handle cancel button - clear form and reset to initial state
   */
  onCancel(): void {
    this.clearForm();
  }

  /**
   * Clear form and reset to initial state
   */
  private clearForm(): void {
    this.form.reset();
    this.selectedShipment.set(null);
    this.submitted.set(false);
    this.error.set(null);
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearForm();
        this.loadUndeliveredShipments();
      });
  }
}
