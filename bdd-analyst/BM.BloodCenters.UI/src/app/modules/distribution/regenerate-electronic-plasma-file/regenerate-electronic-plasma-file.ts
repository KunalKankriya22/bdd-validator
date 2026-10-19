import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import {
  ConfirmActionDialogComponent,
  ConfirmActionDialogData,
} from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

import { RegenerateElectronicPlasmaFileService } from './services/regenerate-electronic-plasma-file.service';
import {
  PendingShipment,
  RegeneratePlasmaFileShipmentDto,
  RegeneratePlasmaFileRequestDto,
} from './models/regenerate-electronic-plasma-file.model';

/**
 * Regenerate Electronic Plasma File Component
 * JIRA: MLT-14005
 * Oracle Forms: REGENXML (Mnemonic: GENXML)
 *
 * Recreates electronic data file for plasma products to ensure accurate,
 * complete, and up-to-date information is available for reporting, transfer,
 * or regulatory obligations.
 */
@Component({
  selector: 'app-regenerate-electronic-plasma-file',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './regenerate-electronic-plasma-file.html',
  styleUrls: ['./regenerate-electronic-plasma-file.scss'],
})
export class RegenerateElectronicPlasmaFileComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  readonly componentId = `regenerate-plasma-file-${RegenerateElectronicPlasmaFileComponent.nextId++}`;

  readonly elementId = (name: string) => `${this.componentId}-${name}`;
  readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Dependency injection
  private readonly service = inject(RegenerateElectronicPlasmaFileService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
  };

  constructor() {
    effect(() => {
      const data = this.pageHeaderService.pageHeaderData();
      if (data) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: data.title, link: null },
          ],
          title: data.title,
          subtitle: data.subtitle || '',
        };
      }
    });
  }

  // Form
  form!: FormGroup;

  // Signals
  readonly pendingShipments = signal<PendingShipment[]>([]);
  readonly selectedShipment = signal<RegeneratePlasmaFileShipmentDto | null>(null);
  readonly loading = signal<boolean>(false);
  readonly loadingShipments = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly submitted = signal<boolean>(false);

  // Computed
  readonly hasShipments = computed(() => this.pendingShipments().length > 0);
  readonly hasSelectedShipment = computed(() => this.selectedShipment() !== null);
  readonly canRegenerate = computed(
    () => this.hasSelectedShipment() && this.form?.valid && !this.loading()
  );
  readonly showEmptyState = computed(
    () => !this.hasSelectedShipment() && !this.loading() && !this.loadingShipments()
  );

  ngOnInit(): void {
    this.initForm();
    this.loadPendingShipments();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the form with validators
   */
  private initForm(): void {
    this.form = this.fb.group({
      shipmentNo: ['', [Validators.required]],
      trackNo: ['', [Validators.required, Validators.maxLength(30)]],
      flightNo: ['', [Validators.maxLength(6)]],
    });

    // Subscribe to shipment number changes
    this.form
      .get('shipmentNo')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((shipmentNo) => {
        if (shipmentNo) {
          this.loadShipmentDetails(shipmentNo);
        } else {
          this.clearShipmentDetails();
        }
      });
  }

  /**
   * Load pending shipments for dropdown
   */
  private loadPendingShipments(): void {
    this.loadingShipments.set(true);
    this.error.set(null);

    this.service
      .getPendingShipments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (shipments) => {
          this.pendingShipments.set(shipments);
          this.loadingShipments.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to load pending shipments');
          this.loadingShipments.set(false);
          this.snackbarService.showError('Failed to load pending shipments');
        },
      });
  }

  /**
   * Load shipment details when shipment is selected
   */
  private loadShipmentDetails(shipmentNo: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.service
      .getShipmentDetails(shipmentNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (shipment) => {
          this.selectedShipment.set(shipment);
          this.populateFormFromShipment(shipment);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to load shipment details');
          this.loading.set(false);
          this.snackbarService.showError('Failed to load shipment details');
        },
      });
  }

  /**
   * Populate form fields from loaded shipment
   */
  private populateFormFromShipment(shipment: RegeneratePlasmaFileShipmentDto): void {
    this.form.patchValue(
      {
        trackNo: shipment.trackNo || '',
        flightNo: shipment.flightNo || '',
      },
      { emitEvent: false }
    );
  }

  /**
   * Clear shipment details and reset form
   */
  private clearShipmentDetails(): void {
    this.selectedShipment.set(null);
    this.form.patchValue(
      {
        trackNo: '',
        flightNo: '',
      },
      { emitEvent: false }
    );
  }

  /**
   * Subscribe to chapter changes to reset form
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.clearAll();
      this.loadPendingShipments();
    });
  }

  /**
   * Form control getter
   */
  get f() {
    return this.form.controls;
  }

  /**
   * Clear all form fields and reset state
   */
  onClearAll(): void {
    this.clearAll();
  }

  private clearAll(): void {
    this.form.reset();
    this.selectedShipment.set(null);
    this.submitted.set(false);
    this.error.set(null);
  }

  /**
   * Handle regenerate button click
   * Shows confirmation dialog if needed, then calls regenerate API
   */
  onRegenerate(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    // Show confirmation dialog
    this.showConfirmationDialog();
  }

  /**
   * Show confirmation dialog before regenerating
   */
  private showConfirmationDialog(): void {
    const dialogData: ConfirmActionDialogData = {
      title: 'Do you want to regenerate the file?',
      message: 'Warning 4103',
      detail: 'Plasma file already regenerated. This action will replace the existing file.',
      confirmText: 'YES, PROCEED',
      cancelText: 'NO, CANCEL',
    };

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '500px',
      data: dialogData,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.performRegeneration();
      }
    });
  }

  /**
   * Perform the actual regeneration API call
   */
  private performRegeneration(): void {
    const shipment = this.selectedShipment();
    if (!shipment) return;

    const request: RegeneratePlasmaFileRequestDto = {
      shipmentNo: this.form.value.shipmentNo,
      trackNo: this.form.value.trackNo,
      flightNo: this.form.value.flightNo || undefined,
      carrier: shipment.carrier || undefined,
    };

    this.loading.set(true);
    this.error.set(null);

    this.service
      .regeneratePlasmaFile(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          if (response.success) {
            this.snackbarService.showSuccess(
              `Electronic Plasma File (${response.fileType}) generated successfully: ${response.fileName}`
            );
            // Clear form and return to empty state
            this.clearAll();
          } else {
            this.snackbarService.showError(response.message || 'File generation failed');
          }
        },
        error: (err) => {
          this.loading.set(false);
          const errorMessage =
            err.error?.message || 'An error occurred during file generation';
          this.error.set(errorMessage);
          this.snackbarService.showError(errorMessage);
        },
      });
  }

  getAddress2Display(): string {
    const shipment = this.selectedShipment();
    if (!shipment) return '-';
    const parts = [shipment.address2, shipment.address3].filter(Boolean);
    return parts.length > 0 ? parts.join(' ').substring(0, 50) : '-';
  }

  getShipmentDisplayText(shipment: PendingShipment): string {
    return `${shipment.shipmentNo} - ${shipment.consigneeName}`;
  }
}
