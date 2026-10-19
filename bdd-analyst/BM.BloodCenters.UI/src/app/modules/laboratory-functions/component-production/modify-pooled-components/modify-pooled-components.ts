import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

import { ModifyPooledComponentsService } from './services/modify-pooled-components.service';
import {
  ModifyPooledComponentsResponse,
  ModifyPooledComponentsRequest,
  ProcessCode,
  ValidProductConversion,
  ProductCodeOption,
  CatalogNumberOption,
  LotNumberOption,
  ValidAboOption,
  LabelVerification,
} from './models/modify-pooled-components.model';
import {
  LabelVerificationDialogComponent,
  LabelVerificationDialogData,
} from '../prepare-pooled-components/label-verification-dialog/label-verification-dialog.component';
import {
  UnitIdFieldComponent,
  UnitValidationResponse as UnitIdValidationData,
  UnitIdPostValidateEvent,
} from '@shared/components/unit-id-field';

@Component({
  selector: 'app-modify-pooled-components',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
  ],
  templateUrl: './modify-pooled-components.html',
  styleUrls: ['./modify-pooled-components.scss'],
})
export class ModifyPooledComponentsComponent implements OnInit, OnDestroy {
  private readonly service = inject(ModifyPooledComponentsService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('unitIdField') unitIdField!: UnitIdFieldComponent;
  poolCodeScheme = signal<'I' | 'C' | null>(null);

  private readonly defaultTitle = 'Modify Pooled Components';

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: this.defaultTitle, link: null },
    ],
    title: this.defaultTitle,
    subtitle: '',
    actions: [],
  };

  modifyForm!: FormGroup;
  poolDetails = signal<ModifyPooledComponentsResponse | null>(null);
  hasPoolDetails = computed(() => this.poolDetails() !== null);
  processCodes = signal<ProcessCode[]>([]);
  validConversions = signal<ValidProductConversion[]>([]);
  productCodes = signal<ProductCodeOption[]>([]);
  catalogNumbers = signal<CatalogNumberOption[]>([]);
  lotNumbers = signal<LotNumberOption[]>([]);
  filterLotNumbers = signal<LotNumberOption[]>([]);
  aboOptions = signal<ValidAboOption[]>([]);
  loading = signal(false);
  searchPerformed = signal(false);

  readonly productCodeSearchCtrl = new FormControl('');
  readonly processCodeSearchCtrl = new FormControl('');
  readonly catalogNumberSearchCtrl = new FormControl('');
  readonly bagLotNumberSearchCtrl = new FormControl('');
  readonly filterLotNumberSearchCtrl = new FormControl('');
  readonly newProductCodeSearchCtrl = new FormControl('');

  private resettingForm = false;
  private readonly productCodeSearch = signal('');
  private readonly processCodeSearch = signal('');
  private readonly catalogNumberSearch = signal('');
  private readonly bagLotNumberSearch = signal('');
  private readonly filterLotNumberSearch = signal('');
  private readonly newProductCodeSearch = signal('');

  filteredProductCodes = computed(() => {
    const search = this.productCodeSearch().toLowerCase();
    const items = this.productCodes();
    if (!search) return items;
    return items.filter(p => p.productCode?.toLowerCase().includes(search));
  });

  filteredProcessCodes = computed(() => {
    const search = this.processCodeSearch().toLowerCase();
    const items = this.processCodes();
    if (!search) return items;
    return items.filter(c =>
      c.code?.toLowerCase().includes(search) ||
      c.description?.toLowerCase().includes(search)
    );
  });

  filteredCatalogNumbers = computed(() => {
    const search = this.catalogNumberSearch().toLowerCase();
    const items = this.catalogNumbers();
    if (!search) return items;
    return items.filter(c => c.catalogNumber?.toLowerCase().includes(search));
  });

  filteredLotNumbers = computed(() => {
    const search = this.bagLotNumberSearch().toLowerCase();
    const items = this.lotNumbers();
    if (!search) return items;
    return items.filter(l => l.lotNumber?.toLowerCase().includes(search));
  });

  filteredFilterLotNumbers = computed(() => {
    const search = this.filterLotNumberSearch().toLowerCase();
    const items = this.filterLotNumbers();
    if (!search) return items;
    return items.filter(f => f.lotNumber?.toLowerCase().includes(search));
  });

  filteredValidConversions = computed(() => {
    const search = this.newProductCodeSearch().toLowerCase();
    const items = this.validConversions();
    if (!search) return items;
    return items.filter(c =>
      c.targetProductCode?.toLowerCase().includes(search) ||
      c.productDescription?.toLowerCase().includes(search)
    );
  });

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title || this.defaultTitle, link: null },
          ],
          title: pageData.title || this.defaultTitle,
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupSearchSubscriptions();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchSubscriptions(): void {
    this.productCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.productCodeSearch.set(v || ''));
    this.processCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.processCodeSearch.set(v || ''));
    this.catalogNumberSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.catalogNumberSearch.set(v || ''));
    this.bagLotNumberSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.bagLotNumberSearch.set(v || ''));
    this.filterLotNumberSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.filterLotNumberSearch.set(v || ''));
    this.newProductCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.newProductCodeSearch.set(v || ''));
  }

  onSelectOpenedChange(searchCtrl: FormControl, isOpen: boolean): void {
    if (!isOpen) {
      searchCtrl.setValue('');
    }
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetForm();
      });
  }

  private initializeForm(): void {
    this.modifyForm = this.fb.group({
      unitId: [''],
      productCode: [''],
      processCode: ['', [Validators.required]],
      processDescription: [{ value: '', disabled: true }],
      newBag: ['', [Validators.required]],
      catalogNumber: [''],
      bagLotNumber: [''],
      filterLotNumber: [''],
      reagentName: [''],
      manufacturer: [''],
      reagentLotNumber: [''],
      reagentExpirationDate: [null],
      processDate: ['', [Validators.required]],
      newProductCode: [{ value: '', disabled: true }],
      newProductDescription: [{ value: '', disabled: true }],
      poolWeight: [null],
      poolVolume: [{ value: '', disabled: true }],
    });
  }

  onUnitIdPostValidate(event: UnitIdPostValidateEvent): void {
    const unitId = event.data.parsedUnitId;
    this.modifyForm.patchValue({ unitId }, { emitEvent: false });
    this.searchPerformed.set(true);

    this.service
      .getPoolDetails(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          this.poolDetails.set(details);
          this.patchFormWithDetails(details);
          this.loadDropdownsAfterSearch(unitId, details);
          event.confirm();
          if (this.poolCodeScheme() === 'C') {
            this.modifyForm.get('newProductCode')?.enable();
          }
          if (details.isExpired) {
            this.snackBar.open('Warn:9795: Product has already expired.', 'DISMISS', {
              duration: 8000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['warning-snackbar'],
            });
          }
        },
        error: (error) => {
          this.poolDetails.set(null);
          const body = error?.error;
          event.reject(body?.message || body?.errorResponse?.error || 'Pool not found');
        },
      });
  }

  onUnitIdValidated(data: UnitIdValidationData): void {
    this.poolCodeScheme.set(data.codeScheme);
  }

  onUnitIdCleared(): void {
    this.resetForm();
  }

  private patchFormWithDetails(details: ModifyPooledComponentsResponse): void {
    this.modifyForm.patchValue({
      productCode: details.productCode || '',
      processCode: details.processCode || '',
      processDescription: details.processDescription || '',
      newBag: details.newBag || '',
      catalogNumber: details.catalogNumber || '',
      bagLotNumber: details.bagLotNumber || '',
      filterLotNumber: details.filterLotNumber || '',
      reagentName: details.reagentName || '',
      manufacturer: details.manufacturer || '',
      reagentLotNumber: details.reagentLotNumber || '',
      reagentExpirationDate: details.reagentExpirationDate
        ? new Date(details.reagentExpirationDate)
        : null,
      processDate: this.formatDateTimeForInput(details.processDate) || this.getChapterNowFormatted(),
      newProductCode: details.newProductCode || '',
      newProductDescription: details.newProductDescription || '',
      poolWeight: details.poolWeight,
      poolVolume: details.poolVolume ?? '',
    });
    this.onNewBagChange();
  }

  private loadDropdownsAfterSearch(unitId: string, details: ModifyPooledComponentsResponse): void {
    this.loadValidProducts(unitId);
    this.loadCatalogNumbers();
    this.loadAboOptions();
    if (details.productCode) {
      this.loadProcessCodes(details.productCode);
      this.loadValidConversions();
    }
    if (details.catalogNumber) {
      this.loadLotNumbers(details.catalogNumber);
    }
    if (details.oldProductType) {
      this.loadFilterLots(details.oldProductType);
    }
  }

  private loadAboOptions(): void {
    this.service
      .getValidAbo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => this.aboOptions.set(options),
        error: () => this.aboOptions.set([]),
      });
  }

  private loadValidProducts(unitId: string): void {
    this.service
      .getValidProducts(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.productCodes.set(products);
          const details = this.poolDetails();
          if (details?.productCode) {
            this.modifyForm.patchValue({ productCode: details.productCode }, { emitEvent: false });
          }
        },
        error: () => this.productCodes.set([]),
      });
  }

  private loadProcessCodes(productCode: string): void {
    this.service
      .getProcessCodes(productCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.processCodes.set(codes);
          const details = this.poolDetails();
          if (details?.processCode) {
            this.modifyForm.patchValue({ processCode: details.processCode }, { emitEvent: false });
          }
        },
        error: () => this.processCodes.set([]),
      });
  }

  private loadCatalogNumbers(): void {
    this.service
      .getValidCatalogNumbers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (catalogs) => {
          this.catalogNumbers.set(catalogs);
          const details = this.poolDetails();
          if (details?.catalogNumber) {
            this.modifyForm.patchValue({ catalogNumber: details.catalogNumber }, { emitEvent: false });
          }
        },
        error: () => this.catalogNumbers.set([]),
      });
  }

  private loadLotNumbers(catalogNumber: string): void {
    this.service
      .getValidLotNumbers(catalogNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lots) => {
          this.lotNumbers.set(lots);
          const details = this.poolDetails();
          if (details?.bagLotNumber) {
            this.modifyForm.patchValue({ bagLotNumber: details.bagLotNumber }, { emitEvent: false });
          }
        },
        error: () => this.lotNumbers.set([]),
      });
  }

  private loadFilterLots(productType: string): void {
    this.service
      .getValidFilterLots(productType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lots) => {
          this.filterLotNumbers.set(lots);
          const details = this.poolDetails();
          if (details?.filterLotNumber) {
            this.modifyForm.patchValue({ filterLotNumber: details.filterLotNumber }, { emitEvent: false });
          }
        },
        error: () => this.filterLotNumbers.set([]),
      });
  }

  onProductCodeChange(): void {
    const productCode = this.modifyForm.get('productCode')?.value;
    if (productCode) {
      this.processCodes.set([]);
      this.modifyForm.patchValue({ processCode: '', processDescription: '' });
      this.loadProcessCodes(productCode);

      const details = this.poolDetails();
      if (details?.oldProductType) {
        this.loadFilterLots(details.oldProductType);
      }
    }
  }

  onProcessCodeChange(): void {
    const processCode = this.modifyForm.get('processCode')?.value;
    const selected = this.processCodes().find((c) => c.code === processCode);
    if (selected) {
      this.modifyForm.patchValue({ processDescription: selected.description || '' });
    }

    if (processCode && this.poolCodeScheme() === 'I') {
      this.deriveNewProductCode(processCode);
    }
  }

  private deriveNewProductCode(processCode: string): void {
    const details = this.poolDetails();
    if (!details?.productCode) return;

    const productType = details.oldProductType || '';
    const codeScheme = this.poolCodeScheme() || 'I';
    this.service
      .deriveProduct(details.productCode, processCode, productType, codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (derived) => {
          if (derived?.targetProductCode) {
            this.validConversions.set([derived]);
            this.modifyForm.patchValue({
              newProductCode: derived.targetProductCode,
              newProductDescription: derived.productDescription || '',
            });
          }
        },
        error: () => {
          this.loadValidConversions();
        },
      });
  }

  onNewBagChange(): void {
    const newBag = this.modifyForm.get('newBag')?.value;
    const catalogCtrl = this.modifyForm.get('catalogNumber');
    const lotCtrl = this.modifyForm.get('bagLotNumber');
    const filterCtrl = this.modifyForm.get('filterLotNumber');
    if (newBag === 'N') {
      catalogCtrl?.setValue('');
      lotCtrl?.setValue('');
      filterCtrl?.setValue('');
      catalogCtrl?.clearValidators();
      lotCtrl?.clearValidators();
      catalogCtrl?.disable();
      lotCtrl?.disable();
      filterCtrl?.disable();
    } else {
      catalogCtrl?.enable();
      lotCtrl?.enable();
      filterCtrl?.enable();
      catalogCtrl?.setValidators([Validators.required]);
      lotCtrl?.setValidators([Validators.required]);
    }
    catalogCtrl?.updateValueAndValidity();
    lotCtrl?.updateValueAndValidity();
  }

  onCatalogNumberChange(): void {
    const catalogNumber = this.modifyForm.get('catalogNumber')?.value;
    this.lotNumbers.set([]);
    this.modifyForm.patchValue({ bagLotNumber: '' });
    if (catalogNumber) {
      this.loadLotNumbers(catalogNumber);
    }
  }

  loadValidConversions(): void {
    const details = this.poolDetails();
    if (!details?.productCode) {
      return;
    }

    this.service
      .getValidProductConversions(details.productCode, details.codeScheme || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (conversions) => this.validConversions.set(conversions),
        error: () => this.validConversions.set([]),
      });
  }

  onNewProductCodeChange(): void {
    const newProductCode = this.modifyForm.get('newProductCode')?.value;
    const selected = this.validConversions().find(
      (c) => c.targetProductCode === newProductCode,
    );
    if (selected) {
      this.modifyForm.patchValue({
        newProductDescription: selected.productDescription || '',
      });
    }
  }

  onPoolWeightChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const weight = parseFloat(value);
    const specificGravity = this.poolDetails()?.specificGravity;
    if (!isNaN(weight) && specificGravity && specificGravity > 0) {
      const volume = parseFloat((weight / specificGravity).toFixed(2));
      this.modifyForm.patchValue({ poolVolume: volume }, { emitEvent: false });
    } else {
      this.modifyForm.patchValue({ poolVolume: '' }, { emitEvent: false });
    }
  }

  onCancel(): void {
    this.resetForm();
  }

  onReprint(): void {
    const details = this.poolDetails();
    if (!details) return;

    this.printLabelForPool(details.unitId, details.productCode, details.codeScheme || 'I');
  }

  private printLabelForPool(unitId: string, productCode: string, codeScheme: string): void {
    this.service
      .printLabel(unitId, productCode, codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Label print submitted successfully.', 'DISMISS', {
            duration: 4000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar'],
          });
        },
        error: (error) => {
          const message = error?.error?.message || 'Failed to print label.';
          this.snackBar.open(message, 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
        },
      });
  }

  onSave(): void {
    if (!this.unitIdField?.isValid) {
      this.snackBar.open('Please enter and validate a Unit ID first', 'Close', {
        duration: 3000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'],
      });
      return;
    }

    if (this.modifyForm.invalid) {
      this.modifyForm.markAllAsTouched();
      return;
    }

    const details = this.poolDetails();
    if (!details) {
      return;
    }

    const formValues = this.modifyForm.getRawValue();
    const unitId = details.unitId;
    const isIsbt = this.poolCodeScheme() === 'I';
    const productCode = formValues.newProductCode || details.productCode;

    const dialogRef = this.dialog.open(LabelVerificationDialogComponent, {
      width: '50vw',
      height: 'calc(100vh - 64px)',
      maxWidth: '90vw',
      disableClose: true,
      panelClass: 'right-side-dialog',
      position: { right: '0', top: '64px' },
      data: {
        poolId: unitId,
        productCode,
        pooledAboRh: details.pooledAboRh || '',
        expiryDate: details.poolExpiryDate || '',
        isIsbt,
        hasCmvNegative: details.spTestRequired || false,
        aboOptions: this.aboOptions(),
      } as LabelVerificationDialogData,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: LabelVerification | null) => {
        if (result) {
          this.performSaveWithVerification(false, result);
        }
      });
  }

  private lastVerification: LabelVerification | null = null;

  private performSaveWithVerification(confirmExpired: boolean, verification: LabelVerification): void {
    this.lastVerification = verification;
    this.performSave(confirmExpired);
  }

  private performSave(confirmExpired: boolean): void {
    const details = this.poolDetails();
    if (!details) {
      return;
    }

    const formValues = this.modifyForm.getRawValue();

    const request: ModifyPooledComponentsRequest = {
      unitId: details.unitId,
      productCode: formValues.productCode || details.productCode,
      processCode: formValues.processCode,
      newBag: formValues.newBag,
      catalogNumber: formValues.catalogNumber || null,
      lotNumber: formValues.bagLotNumber || null,
      filterLotNumber: formValues.filterLotNumber || null,
      reagentName: formValues.reagentName || null,
      manufacturer: formValues.manufacturer || null,
      reagentLotNumber: formValues.reagentLotNumber || null,
      reagentExpirationDate: formValues.reagentExpirationDate
        ? new Date(formValues.reagentExpirationDate).toISOString()
        : null,
      processDate: formValues.processDate
        ? this.parseDateTimeString(formValues.processDate)?.format('YYYY-MM-DDTHH:mm:ss') ?? null
        : null,
      newProductCode: formValues.newProductCode,
      poolWeight: formValues.poolWeight ? Number(formValues.poolWeight) : null,
      confirmExpired,
      verification: this.lastVerification || undefined,
    };

    this.loading.set(true);

    this.service
      .save(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          this.lastVerification = null;
          this.snackBar.open(
            response.message || 'Pooled component modified successfully.',
            'DISMISS',
            {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar'],
            },
          );

          const savedProductCode = formValues.newProductCode || details.productCode;
          const savedCodeScheme = details.codeScheme || 'I';
          this.printLabelForPool(details.unitId, savedProductCode, savedCodeScheme);

          this.resetForm();
        },
        error: (error) => {
          this.loading.set(false);

          if (error?.status === 409) {
            this.showExpiryWarning();
            return;
          }
        },
      });
  }

  private showExpiryWarning(): void {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '500px',
      data: {
        title: 'Warning',
        message: 'Product has already expired. Do you want to continue?',
        confirmText: 'Yes',
        cancelText: 'No',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.performSave(true);
      }
    });
  }

  private resetForm(): void {
    if (this.resettingForm) return;
    this.resettingForm = true;
    this.unitIdField?.clear();
    this.modifyForm.reset();
    this.modifyForm.get('newProductCode')?.disable();
    this.poolDetails.set(null);
    this.poolCodeScheme.set(null);
    this.searchPerformed.set(false);
    this.processCodes.set([]);
    this.validConversions.set([]);
    this.productCodes.set([]);
    this.catalogNumbers.set([]);
    this.lotNumbers.set([]);
    this.filterLotNumbers.set([]);
    this.aboOptions.set([]);
    this.lastVerification = null;
    this.resettingForm = false;
  }

  get isNewBagY(): boolean {
    return this.modifyForm?.get('newBag')?.value === 'Y';
  }

  private getChapterNow(): moment.Moment {
    const tz = this.headerService.chapterTimeZone();
    if (!tz || tz === 'UTC') return moment();
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
      });
      const parts = formatter.formatToParts(new Date());
      const get = (t: string) => parseInt(parts.find(p => p.type === t)!.value, 10);
      return moment([get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second')]);
    } catch {
      return moment();
    }
  }

  private getChapterNowFormatted(): string {
    const now = this.getChapterNow();
    return now.format('DD-MMM-YYYY HH:mm').replace(/-([a-z]{3})-/i, (_, m) => `-${m.toUpperCase()}-`);
  }

  private formatDateTimeForInput(dateTime: string | null | undefined): string {
    if (!dateTime) return '';
    const m = moment(dateTime);
    if (!m.isValid()) return '';
    const formatted = m.format('DD-MMM-YYYY HH:mm');
    const parts = formatted.split('-');
    if (parts.length === 3) {
      parts[1] = parts[1].toUpperCase();
      return parts.join('-');
    }
    return formatted.toUpperCase();
  }

  private parseDateTimeString(value: string): moment.Moment | null {
    if (!value) return null;
    const parsed = moment(value, 'DD-MMM-YYYY HH:mm', true);
    return parsed.isValid() ? parsed : null;
  }

  validateProcessDate(): void {
    const ctrl = this.modifyForm.get('processDate');
    if (!ctrl?.value) return;

    const parsed = this.parseDateTimeString(ctrl.value);
    if (!parsed) {
      ctrl.setErrors({ invalidFormat: true });
      return;
    }

    const details = this.poolDetails();
    if (details?.poolExpiryDate) {
      const poolExpiry = moment(details.poolExpiryDate);
      if (parsed.isAfter(poolExpiry)) {
        ctrl.setErrors({ afterPoolExpiry: true });
        return;
      }
    }

    if (details?.collDate) {
      const poolDats = moment(details.collDate);
      if (parsed.isBefore(poolDats)) {
        ctrl.setErrors({ beforePoolDate: true });
        return;
      }
    }
  }

  getProcessDateError(): string | null {
    const ctrl = this.modifyForm.get('processDate');
    if (!ctrl?.errors || !ctrl.touched) return null;
    if (ctrl.errors['required']) return 'Process date is required';
    if (ctrl.errors['invalidFormat']) return 'Invalid format. Use DD-MMM-YYYY HH:mm';
    if (ctrl.errors['afterPoolExpiry']) return 'Process date cannot be after pool expiry date';
    if (ctrl.errors['beforePoolDate']) return 'Process date cannot be before pool creation date';
    return null;
  }

  processDateErrorMatcher = {
    isErrorState: (control: { invalid: boolean; touched: boolean; dirty: boolean } | null): boolean => {
      if (!control) return false;
      return control.invalid && (control.touched || control.dirty);
    },
  };
}
