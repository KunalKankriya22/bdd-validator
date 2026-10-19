import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

// Angular Material Imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';

// Services and Models
import { AboLabelingApiService } from '../../services/abo-labeling-api.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import {
  AboDisplayData,
  UnitData,
  ScanData,
  InterdictionMessage,
  ProductAttribute,
  ABO_TYPES,
  RH_TYPES,
} from '../../models/abo-labeling.model';
import { ExpiryWarningDialogComponent } from '../../dialogs/expiry-warning-dialog/expiry-warning-dialog';

/**
 * ABO Labeling Form Component
 * Main form for scanning units, validating barcodes, and generating ISBT labels
 * Corresponds to Figma: "ABO Labeling - ISBT-1.png"
 */
@Component({
  selector: 'app-abo-labeling-form',
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
    MatDatepickerModule,
  ],
  templateUrl: './abo-labeling-form.html',
  styleUrl: './abo-labeling-form.scss',
})
export class AboLabelingFormComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  readonly componentId = `abo-labeling-form-${AboLabelingFormComponent.nextId++}`;

  readonly elementId = (name: string) => `${this.componentId}-${name}`;
  readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  readonly labelId = (name: string) => `${this.componentId}-${name}-label`;
  readonly hintId = (name: string) => `${this.componentId}-${name}-hint`;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(AboLabelingApiService);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  // Signal-based state
  protected readonly unitData = signal<UnitData | null>(null);
  protected readonly scanData = signal<ScanData | null>(null);
  protected readonly aboDisplay = signal<AboDisplayData | null>(null);
  protected readonly interdictions = signal<InterdictionMessage[]>([]);
  protected readonly attributes = signal<ProductAttribute[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly submitted = signal<boolean>(false);

  // Computed values
  protected readonly isReady = computed(() => !this.loading() && !this.error());
  protected readonly hasUnitData = computed(() => this.unitData() !== null);
  protected readonly hasAboDisplay = computed(() => this.aboDisplay() !== null);

  // Form
  form!: FormGroup;

  // Dropdown options
  protected readonly aboTypes = ABO_TYPES;
  protected readonly rhTypes = RH_TYPES;

  ngOnInit(): void {
    this.initForm();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      // Row 1 - Unit Information
      unitId: ['', [Validators.required, Validators.maxLength(16)]],
      collectionDate: [{ value: '', disabled: true }],
      productCode: ['', [Validators.required, Validators.maxLength(8)]],
      productDescription: [{ value: '', disabled: true }],

      // Row 2 - Scan Unit/ABO
      scanUnitAbo: [''],
      scannedUnitId: [''],
      aboCode: [''],
      aboDescription: [{ value: '', disabled: true }],

      // Row 3 - Scan Product/Exp
      scanProductExp: [''],
      scannedProductCode: [''],
      expirationDate: [''],

      // Row 4 - Special Testing
      specialTesting: [''],
      testedAbo: [{ value: '', disabled: true }],
      testedAboDescription: [{ value: '', disabled: true }],
    });
  }

  private loadInitialData(): void {
    // Load mock interdictions and attributes
    // TODO: Replace with actual API calls when available
    this.interdictions.set([
      {
        code: '1800',
        message: 'The following interdictions are treated as expectations',
      },
      { code: '', message: 'Following interdictions are overridden' },
      { code: '', message: 'Pre-label frozen product' },
    ]);

    this.attributes.set([
      { code: 'ATTR1', description: 'Attribute Description' },
      { code: 'ATTR2', description: 'Attribute Description' },
      { code: 'ATTR3', description: 'Attribute Description' },
      { code: 'ATTR4', description: 'Attribute Description' },
      { code: 'ATTR5', description: 'Attribute Description' },
    ]);
  }

  get f() {
    return this.form.controls;
  }

  /**
   * Handle Unit ID scan or manual entry
   * Triggers validation and retrieves unit details
   */
  onUnitIdScan(event?: Event): void {
    if (event && (event as KeyboardEvent).key !== 'Enter') {
      return;
    }

    const unitId = this.f['unitId'].value?.trim();
    if (!unitId) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const chapterId = this.headerService.getCurrentChapterId();

    this.apiService
      .validateUnit({
        scannedUnitId: unitId,
        entryMode: event ? null : 'M',
        chapterId: chapterId || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.isValid) {
            this.unitData.set({
              unitId: result.unitId,
              checkDigit: result.checkDigit || undefined,
              collectionDate: result.collectionDate || undefined,
            });

            // Update form with collection date
            if (result.collectionDate) {
              const formattedDate = this.formatDate(result.collectionDate);
              this.f['collectionDate'].setValue(formattedDate);
            }

            this.snackbarService.showSuccess('Unit ID validated successfully');
          } else {
            this.error.set(result.errorMessage || 'Invalid Unit ID');
            this.snackbarService.showError(result.errorMessage || 'Invalid Unit ID');
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to validate Unit ID');
          this.snackbarService.showError('Failed to validate Unit ID');
          this.loading.set(false);
        },
      });
  }

  /**
   * Handle Product Code scan or manual entry
   * Triggers validation and retrieves product details
   */
  onProductCodeScan(event?: Event): void {
    if (event && (event as KeyboardEvent).key !== 'Enter') {
      return;
    }

    const productCode = this.f['productCode'].value?.trim();
    if (!productCode) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const unitId = this.unitData()?.unitId;
    const chapterId = this.headerService.getCurrentChapterId();

    this.apiService
      .validateProduct({
        scannedProductCode: productCode,
        unitId: unitId || undefined,
        entryMode: event ? null : 'M',
        chapterId: chapterId || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.isValid) {
            this.f['productDescription'].setValue(result.productDescription || '');

            // Update unit data with product code
            const currentUnit = this.unitData();
            if (currentUnit) {
              this.unitData.set({
                ...currentUnit,
                productCode: result.productCode,
                productDescription: result.productDescription || undefined,
              });
            }

            this.snackbarService.showSuccess('Product code validated successfully');
          } else {
            this.error.set(result.errorMessage || 'Invalid Product Code');
            this.snackbarService.showError(result.errorMessage || 'Invalid Product Code');
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to validate Product Code');
          this.snackbarService.showError('Failed to validate Product Code');
          this.loading.set(false);
        },
      });
  }

  /**
   * Handle ABO code selection
   * Updates the large ABO display
   */
  onAboCodeChange(): void {
    const aboCode = this.f['aboCode'].value;
    if (!aboCode) {
      return;
    }

    const aboType = this.aboTypes.find((a) => a.code === aboCode);
    if (aboType) {
      this.f['aboDescription'].setValue(aboType.description);

      // Update ABO display with default RH as POSITIVE
      this.updateAboDisplay(aboCode, 'POS');
    }
  }

  /**
   * Handle Expiration Date scan
   * Validates barcode format and checks for expiry
   */
  onExpirationDateScan(event?: Event): void {
    if (event && (event as KeyboardEvent).key !== 'Enter') {
      return;
    }

    const expirationDate = this.f['expirationDate'].value?.trim();
    if (!expirationDate) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // Assume Code 128 format for now (6 digits YYYDDD)
    const barcodeFormat = expirationDate.length === 6 ? '128' : 'CODABAR';

    this.apiService
      .validateBarcode({
        scannedBarcode: expirationDate,
        barcodeFormat: barcodeFormat,
        fieldType: 'EXPIRY_DATE',
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.isValid && result.parsedDate) {
            // Check if product has expired
            const expiryMoment = moment(result.parsedDate);
            const today = moment().startOf('day');

            if (expiryMoment.isBefore(today)) {
              // Show expiry warning dialog
              this.showExpiryWarningDialog().then((shouldContinue) => {
                if (!shouldContinue) {
                  this.f['expirationDate'].setValue('');
                }
                this.loading.set(false);
              });
            } else {
              this.snackbarService.showSuccess('Expiration date validated successfully');
              this.loading.set(false);
            }
          } else {
            this.error.set(result.errorMessage || 'Invalid barcode format');
            this.snackbarService.showError(result.errorMessage || 'Invalid barcode format');
            this.loading.set(false);
          }
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to validate barcode');
          this.snackbarService.showError('Failed to validate barcode');
          this.loading.set(false);
        },
      });
  }

  /**
   * Show expiry warning dialog
   */
  private showExpiryWarningDialog(): Promise<boolean> {
    const dialogRef = this.dialog.open(ExpiryWarningDialogComponent, {
      width: '400px',
      disableClose: true,
    });

    return dialogRef.afterClosed().toPromise();
  }

  /**
   * Update ABO display panel
   */
  private updateAboDisplay(aboType: string, rhType: string): void {
    const rhTypeData = this.rhTypes.find((r) => r.code === rhType);

    this.aboDisplay.set({
      aboType: aboType,
      rhType: rhType,
      displayText: `${aboType} ${rhType}`,
      defaultUseStatus: rhTypeData
        ? `Rh ${rhTypeData.description}\nDEFAULT / INTENDED USE NOT SPECIFIED`
        : 'DEFAULT / INTENDED USE NOT SPECIFIED',
    });
  }

  /**
   * Handle Reprint button click
   * Generates label and sends to printer
   */
  onReprint(): void {
    const unitId = this.unitData()?.unitId;
    const productCode = this.unitData()?.productCode;
    const aboType = this.f['aboCode'].value;
    const expirationDate = this.f['expirationDate'].value;

    if (!unitId || !productCode || !aboType || !expirationDate) {
      this.snackbarService.showError(
        'Please complete all required fields before reprinting'
      );
      return;
    }

    this.loading.set(true);
    const chapterId = this.headerService.getCurrentChapterId();

    this.apiService
      .generateLabel({
        unitId: unitId,
        productCode: productCode,
        expiryDate128: expirationDate.length === 6 ? expirationDate : undefined,
        expiryDateCodabar: expirationDate.length !== 6 ? expirationDate : undefined,
        aboType: aboType,
        rhType: this.aboDisplay()?.rhType || 'POS',
        chapterId: chapterId || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.snackbarService.showSuccess('Label generated successfully');
            // TODO: Implement actual print functionality
            console.log('Label Lines:', result.labelLines);
          } else {
            this.error.set(result.errorMessage || 'Failed to generate label');
            this.snackbarService.showError(
              result.errorMessage || 'Failed to generate label'
            );
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to generate label');
          this.snackbarService.showError('Failed to generate label');
          this.loading.set(false);
        },
      });
  }

  /**
   * Format date for display (DD-MON-YYYY)
   */
  private formatDate(value: string): string {
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }
}
