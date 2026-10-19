import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ViewEncapsulation,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TextFieldModule } from '@angular/cdk/text-field';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { VoidProductLabelApiService } from './services/void-product-label-api.service';
import {
  VoidProductLabelRequestDto,
  VoidProductLabelResponseDto,
  ComponentDetailsDto,
  UnitComponentDto,
  OverrideCodeDto,
  ProductCodeDto,
  LabeledComponentInfo,
  CodeScheme,
  NFT_LABEL,
  FMB_ERRORS,
} from './models/void-product-label.model';
import {
  CommentsDialog,
  CommentsDialogData,
  CommentsDialogResult,
} from './comments-dialog/comments-dialog';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';

@Component({
  selector: 'app-void-product-label',
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
    MatDialogModule,
    MatTooltipModule,
    TextFieldModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
  ],
  templateUrl: './void-product-label.html',
  styleUrls: ['./void-product-label.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class VoidProductLabelComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `void-product-label-${VoidProductLabelComponent.nextId++}`;

  protected readonly elementId = (name: string) =>
    `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) =>
    `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) =>
    `${this.componentId}-${name}-label`;

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(VoidProductLabelApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly labelScanService = inject(DonorLibLabelScanService);

  private readonly destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  // State signals
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly submitted = signal<boolean>(false);

  protected readonly validatedUnitId = signal<string | null>(null);
  protected readonly unitValidationData = signal<UnitValidationResponse | null>(null);
  protected readonly componentDetails = signal<ComponentDetailsDto | null>(null);
  protected readonly voidedResult = signal<VoidProductLabelResponseDto | null>(null);
  protected readonly labeledComponents = signal<LabeledComponentInfo[]>([]);

  // Dropdown data from API
  protected readonly overrideCodeOptions = signal<OverrideCodeDto[]>([]);
  protected readonly productCodeOptions = signal<ProductCodeDto[]>([]);
  protected readonly unitComponents = signal<UnitComponentDto[]>([]);

  // Code scheme derived from unit validation (ISBT='I', Codabar='C')
  protected readonly codeScheme = signal<CodeScheme>('I');
  protected readonly isCodabar = computed(() => this.codeScheme() === 'C');

  // Component prefix options for Codabar LOV
  protected readonly componentPrefixOptions = signal<string[]>([]);

  // Confirmation scan state — tracks whether the user has scanned the confirmation unit+ABO
  protected readonly confirmationScanned = signal<boolean>(false);
  protected readonly confirmationValid = signal<boolean>(false);
  protected readonly combinedScanUsed = signal<boolean>(false);
  private readonly confirmedParsedUnitId = signal<string>('');
  private readonly individualUnitIdAccepted = signal<boolean>(false);
  private readonly individualAboAccepted = signal<boolean>(false);

  // Computed display values
  protected readonly hasComponentDetails = computed(
    () => this.componentDetails() !== null
  );
  protected readonly hasVoidedResult = computed(
    () => this.voidedResult() !== null
  );
  protected readonly collectionDateTime = signal<string>('-');
  protected readonly currentLabel = signal<string>('-');
  protected readonly testedAbo = signal<string>('-');
  protected readonly expirationDate = signal<string>('-');

  // NFT label for the current code scheme
  protected readonly nftLabel = computed(() => NFT_LABEL[this.codeScheme()]);

  // REPRINT allowed only BEFORE confirmation scan (FMB: error 5308)
  protected readonly canReprint = computed(
    () => this.hasComponentDetails() && !this.confirmationScanned()
  );

  protected readonly noteCharCount = computed(() => {
    const note = this.form?.get('note')?.value || '';
    return 240 - note.length;
  });

  form!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadDropdowns();

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onClear());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      // Section 1: Unit Information
      productCode: ['', [Validators.required]],
      componentPrefix: ['', [Validators.required]],

      // Section 2: Label Verification
      scanUnitQuarantineLabel: [''],
      scanUnitId: [''],
      scanQuarantineLabel: [''],
      expiryDateScan: [''],
      holdReasonCode: ['', [Validators.required]],

      // Note (FMB Step 12 — mandatory per error 0010)
      note: ['', [Validators.required, Validators.maxLength(240)]],
    });
  }

  private loadDropdowns(): void {
    this.apiService
      .getOverrideCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => this.overrideCodeOptions.set(codes),
        error: () =>
          this.snackbarService.showError('Failed to load override codes'),
      });

    this.apiService
      .getProductCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => this.productCodeOptions.set(codes),
        error: () =>
          this.snackbarService.showError('Failed to load product codes'),
      });
  }

  get f() {
    return this.form.controls;
  }

  // ─── Step 1–2: Unit ID validated via UnitIdFieldComponent ───

  onUnitValidated(data: UnitValidationResponse): void {
    this.validatedUnitId.set(data.parsedUnitId);
    this.unitValidationData.set(data);
    this.componentDetails.set(null);
    this.confirmationScanned.set(false);
    this.confirmationValid.set(false);
    this.combinedScanUsed.set(false);
    this.individualUnitIdAccepted.set(false);
    this.individualAboAccepted.set(false);
    this.resetDetailsDisplay();

    // Derive code scheme from barcode type
    const scheme: CodeScheme = data.barcodeType === 'CODABAR' ? 'C' : 'I';
    this.codeScheme.set(scheme);

    this.loading.set(true);
    this.apiService
      .getUnitComponents(data.parsedUnitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (components) => {
          this.unitComponents.set(components);
          this.loading.set(false);

          if (components.length === 0) {
            this.snackbarService.showError(
              this.getFmbError('1516')
            );
            return;
          }

        },
        error: (err) => {
          this.loading.set(false);
          this.snackbarService.showError(
            this.extractErrorMessage(err, 'Failed to load unit components')
          );
        },
      });
  }

  onUnitCleared(): void {
    this.validatedUnitId.set(null);
    this.unitValidationData.set(null);
    this.componentDetails.set(null);
    this.unitComponents.set([]);
    this.componentPrefixOptions.set([]);
    this.confirmationScanned.set(false);
    this.confirmationValid.set(false);
    this.combinedScanUsed.set(false);
    this.individualUnitIdAccepted.set(false);
    this.individualAboAccepted.set(false);
    this.confirmedParsedUnitId.set('');
    this.resetDetailsDisplay();
    this.form.patchValue({ productCode: '', componentPrefix: '' });
  }

  // ─── Step 3–4: Product Code selected ───

  onProductCodeSelected(productCode: string): void {
    const unitId = this.validatedUnitId();
    if (!unitId || !productCode) return;

    this.loading.set(true);
    this.apiService
      .getComponentDetails(unitId, productCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          if (!details) {
            this.loading.set(false);
            this.snackbarService.showError('No component details found for this unit/product');
            return;
          }
          this.componentDetails.set(details);
          this.populateDetailsFromComponent(details);
          this.deriveComponentPrefix(details, productCode);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.snackbarService.showError(
            this.extractErrorMessage(err, 'Failed to load component details')
          );
        },
      });
  }

  // ─── Step 5: Component Prefix — ISBT auto-derive / Codabar LOV ───

  private deriveComponentPrefix(details: ComponentDetailsDto, productCode: string): void {
    if (this.codeScheme() === 'I') {
      // ISBT: auto-set from last 2 digits of product_code
      const prefix = productCode.length >= 2
        ? productCode.slice(-2)
        : '00';
      this.form.patchValue({ componentPrefix: prefix });
      this.componentPrefixOptions.set([prefix]);
    } else {
      // Codabar: populate LOV from component details
      const prefixes = details.componentPrefixes || ['00'];
      this.componentPrefixOptions.set(prefixes);
      if (prefixes.length === 1) {
        this.form.patchValue({ componentPrefix: prefixes[0] });
      } else {
        this.form.patchValue({ componentPrefix: '' });
      }
    }
  }

  private populateDetailsFromComponent(details: ComponentDetailsDto): void {
    this.collectionDateTime.set(
      details.collDate
        ? moment(details.collDate).format('DD-MMM-YYYY HH:mm').toUpperCase()
        : '-'
    );
    this.currentLabel.set(details.currentLabel || details.systemLabelDecision || '-');
    this.testedAbo.set(details.testedAboDescription || details.testedAbo || '-');
    this.expirationDate.set(
      details.expiryDate
        ? moment(details.expiryDate).format('DD-MMM-YYYY HH:mm').toUpperCase()
        : '-'
    );
  }

  private resetDetailsDisplay(): void {
    this.collectionDateTime.set('-');
    this.currentLabel.set('-');
    this.testedAbo.set('-');
    this.expirationDate.set('-');
    this.voidedResult.set(null);
    this.labeledComponents.set([]);
  }

  // ─── Step 6–7: Scan Unit+ABO combined barcode ───

  onScanUnitQuarantineLabel(): void {
    if (this.confirmationValid()) return;
    const scanValue = this.form.get('scanUnitQuarantineLabel')?.value?.trim();
    if (!scanValue) return;

    this.loading.set(true);
    this.labelScanService
      .validateUnitAboScan(scanValue, this.codeScheme())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res.success && res.item?.isValid) {
            const parsedUnitId = res.item.parsedUnitId || '';
            const parsedAbo = res.item.aboLabel || res.item.aboCode || '';
            const displayUnitId = res.item.manualUnitId || parsedUnitId;

            this.form.patchValue({
              scanUnitQuarantineLabel: '',
              scanUnitId: displayUnitId,
              scanQuarantineLabel: parsedAbo,
            });

            this.confirmedParsedUnitId.set(parsedUnitId);
            this.confirmationScanned.set(true);

            const expectedUnitId = this.validatedUnitId()?.toUpperCase();
            const scannedUnitId = parsedUnitId.toUpperCase();
            if (scannedUnitId && expectedUnitId && scannedUnitId !== expectedUnitId) {
              this.confirmationValid.set(false);
              this.snackbarService.showError(this.getFmbError('1508'));
              return;
            }

            this.combinedScanUsed.set(true);
            this.confirmationValid.set(true);
          } else {
            this.snackbarService.showError(
              res.errorResponse?.error || res.message || 'Invalid Unit+ABO scan'
            );
          }
        },
        error: () => {
          this.loading.set(false);
          this.snackbarService.showError('Failed to validate scan');
        },
      });
  }

  // ─── Step 6 fallback: Individual Unit ID scan ───

  onIndividualUnitIdBlur(): void {
    if (this.confirmationValid()) return;
    const scanValue = this.form.get('scanUnitId')?.value?.trim();
    if (!scanValue) return;

    this.loading.set(true);
    this.labelScanService
      .validateUnitScan(scanValue)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res.success && res.item?.isValid) {
            const parsedUnitId = res.item.parsedUnitId || scanValue;
            const displayUnitId = res.item.manualUnitId || parsedUnitId;

            this.form.patchValue({ scanUnitId: displayUnitId }, { emitEvent: false });
            this.confirmedParsedUnitId.set(res.item.parsedUnitId || '');

            const expectedUnitId = this.validatedUnitId()?.toUpperCase();
            const scannedUnitId = parsedUnitId.toUpperCase();
            if (scannedUnitId && expectedUnitId && scannedUnitId !== expectedUnitId) {
              this.individualUnitIdAccepted.set(false);
              this.snackbarService.showError(this.getFmbError('1508'));
              return;
            }

            this.individualUnitIdAccepted.set(true);
            this.confirmationScanned.set(true);
            this.checkIndividualFieldsComplete();
          } else {
            this.individualUnitIdAccepted.set(false);
            this.snackbarService.showError(
              res.errorResponse?.error || res.message || 'Invalid Unit ID'
            );
          }
        },
        error: () => {
          this.loading.set(false);
          this.individualUnitIdAccepted.set(false);
          this.snackbarService.showError('Failed to validate Unit ID');
        },
      });
  }

  // ─── Step 6 fallback: Individual Quarantine Label scan ───

  onIndividualQuarantineLabelBlur(): void {
    if (this.confirmationValid()) return;
    const scanValue = this.form.get('scanQuarantineLabel')?.value?.trim();
    if (!scanValue) return;

    this.loading.set(true);
    this.labelScanService
      .validateAboScan(scanValue, this.codeScheme())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res.success && res.item?.isValid) {
            const parsedAbo = res.item.aboCode || scanValue;
            this.form.patchValue({ scanQuarantineLabel: parsedAbo }, { emitEvent: false });

            this.individualAboAccepted.set(true);
            this.confirmationScanned.set(true);
            this.checkIndividualFieldsComplete();
          } else {
            this.individualAboAccepted.set(false);
            this.snackbarService.showError(
              res.errorResponse?.error || res.message || 'Invalid Quarantine Label'
            );
          }
        },
        error: () => {
          this.loading.set(false);
          this.individualAboAccepted.set(false);
          this.snackbarService.showError('Failed to validate Quarantine Label');
        },
      });
  }

  private checkIndividualFieldsComplete(): void {
    if (this.individualUnitIdAccepted() && this.individualAboAccepted()) {
      this.confirmationValid.set(true);
    }
  }

  // ─── Step 10: Expiry Date Verification ───

  onExpiryDateScanBlur(): void {
    const scannedExpiry = this.form.get('expiryDateScan')?.value?.trim();
    if (!scannedExpiry) return;

    const calculatedExpiry = this.componentDetails()?.expiryDate;
    if (!calculatedExpiry) return;

    // Compare scanned expiry with calculated expiry
    const scannedMoment = moment(scannedExpiry, [
      'MM-DD-YYYY HH:mm', 'MM-DD-YYYY', 'DD-MMM-YYYY HH:mm',
      'DD-MMM-YYYY', 'YYYY-MM-DD', 'YYYY-MM-DDTHH:mm',
    ], true);
    const calculatedMoment = moment(calculatedExpiry);

    if (!scannedMoment.isValid()) {
      this.snackbarService.showError('Invalid expiry date format.');
      return;
    }

    // ISBT compares date+time, Codabar compares date only
    const isSame = this.codeScheme() === 'I'
      ? scannedMoment.isSame(calculatedMoment, 'minute')
      : scannedMoment.isSame(calculatedMoment, 'day');

    if (!isSame) {
      this.snackbarService.showError(this.getFmbError('1170'));
    }
  }

  // ─── Comments Dialog ───

  onOpenCommentsDialog(): void {
    const currentNote = this.form.get('note')?.value || '';

    const dialogData: CommentsDialogData = {
      title: 'Comments',
      comment: currentNote,
      maxLength: 240,
      label: 'Comments',
      placeholder: 'Enter reason for voiding product label',
      submitText: 'SUBMIT',
      cancelText: 'CANCEL',
      required: true,
    };

    const dialogRef = this.dialog.open(CommentsDialog, {
      width: '500px',
      data: dialogData,
      disableClose: false,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: CommentsDialogResult) => {
        if (result?.submitted) {
          this.form.patchValue({ note: result.comment || '' });
        }
      });
  }

  // ─── Reprint (FMB: only before confirmation scan, error 5308) ───

  onReprint(): void {
    if (this.confirmationScanned()) {
      this.snackbarService.showError(this.getFmbError('5308'));
      return;
    }

    const details = this.componentDetails();
    const unitId = this.validatedUnitId();
    if (!unitId || !details) return;

    this.loading.set(true);
    this.apiService
      .printLabel({
        unitId,
        productCode: this.form.get('productCode')?.value,
        componentPrefix: this.form.get('componentPrefix')?.value,
        collDate: details.collDate,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res.success) {
            this.snackbarService.showSuccess('Label reprinted successfully.');
          } else {
            this.snackbarService.showError(res.message || 'Failed to print label');
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.snackbarService.showError(
            this.extractErrorMessage(err, 'Failed to print label')
          );
        },
      });
  }

  // ─── Step 13: Save / Commit ───

  onSave(): void {
    this.submitted.set(true);

    // FMB error 0010: all required fields must be present
    if (this.form.invalid) {
      this.snackbarService.showError(
        this.getFmbError('0010')
      );
      return;
    }

    const unitId = this.validatedUnitId();
    if (!unitId) {
      this.snackbarService.showError('Please scan or enter a valid Unit ID');
      return;
    }

    const details = this.componentDetails();
    if (!details) {
      this.snackbarService.showError('Please select a product code first');
      return;
    }

    const confirmUnitId = this.confirmedParsedUnitId();
    if (!confirmUnitId) {
      this.snackbarService.showError('Please scan the confirmation Unit ID');
      return;
    }
    if (confirmUnitId.toUpperCase() !== unitId.toUpperCase()) {
      this.snackbarService.showError(this.getFmbError('1508'));
      return;
    }

    // Step 9: ABO label — derive from code scheme (Mq for ISBT, 39 for Codabar)
    const aboLabel = NFT_LABEL[this.codeScheme()];

    const request: VoidProductLabelRequestDto = {
      unitId,
      productCode: this.form.get('productCode')?.value,
      componentPrefix: this.form.get('componentPrefix')?.value,
      confirmUnitId,
      aboLabel,
      expiryDate: details.expiryDate || '',
      collDate: details.collDate,
      holdReasonCode: this.form.get('holdReasonCode')?.value,
      overrideCode: '',
      note: this.form.get('note')?.value,
    };

    this.loading.set(true);
    this.error.set(null);

    this.apiService
      .voidProductLabel(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.voidedResult.set(result);
          this.loading.set(false);
          this.snackbarService.showSuccess(
            FMB_ERRORS['8010'] || 'Label override completed successfully.'
          );
          this.loadLabeledComponents();
        },
        error: (err) => {
          const msg = this.extractErrorMessage(err, 'Failed to void product label');
          this.error.set(msg);
          this.loading.set(false);
          this.snackbarService.showError(msg);
        },
      });
  }

  // ─── SHOW_ALERTS equivalent: load labeled components for display ───

  private loadLabeledComponents(): void {
    const unitId = this.validatedUnitId();
    if (!unitId) return;

    this.apiService
      .getUnitComponents(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (components) => {
          this.labeledComponents.set(
            components.map((c) => ({
              productCode: c.productCode,
              aboDescription: c.aboDescription || c.testedAboDescription || c.testedAbo || '-',
              expiryDate: c.expiryDate
                ? moment(c.expiryDate).format('DD-MMM-YYYY HH:mm').toUpperCase()
                : '-',
              location: c.componentStatus === 'L' ? 'In Lab Care' : c.componentStatus || '-',
            }))
          );
        },
      });
  }

  // ─── Clear All ───

  protected onClear(): void {
    this.unitIdField?.clear();
    this.form.reset();
    this.submitted.set(false);
    this.validatedUnitId.set(null);
    this.unitValidationData.set(null);
    this.componentDetails.set(null);
    this.unitComponents.set([]);
    this.componentPrefixOptions.set([]);
    this.voidedResult.set(null);
    this.labeledComponents.set([]);
    this.confirmationScanned.set(false);
    this.confirmationValid.set(false);
    this.combinedScanUsed.set(false);
    this.individualUnitIdAccepted.set(false);
    this.individualAboAccepted.set(false);
    this.confirmedParsedUnitId.set('');
    this.error.set(null);
    this.resetDetailsDisplay();
  }

  // ─── Helpers ───

  protected formatDateForDisplay(date: string | Date | null): string {
    if (!date) return '-';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : '-';
  }

  private getFmbError(code: string): string {
    const msg = FMB_ERRORS[code];
    return msg ? `Error ${code}: ${msg}` : `Error ${code}`;
  }

  private extractErrorMessage(error: any, defaultMessage: string): string {
    // Check for FMB error codes from backend
    const errorCode = error?.error?.errorCode || error?.error?.errorResponse?.errorCode;
    if (errorCode && FMB_ERRORS[errorCode]) {
      return `Error ${errorCode}: ${FMB_ERRORS[errorCode]}`;
    }
    if (error?.error?.errorResponse?.error) {
      return error.error.errorResponse.error;
    }
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.message) {
      return error.message;
    }
    return defaultMessage;
  }
}
