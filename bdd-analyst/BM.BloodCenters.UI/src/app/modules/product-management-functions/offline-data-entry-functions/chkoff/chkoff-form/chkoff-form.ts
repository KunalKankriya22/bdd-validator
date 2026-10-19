import { Component, OnInit, OnDestroy, ViewChild, inject, signal, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';
// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';

// Shared
import { SnackbarService } from '@shared/services/snackbar.service';
import { MessageDialog } from '@shared/components/message-dialog/message-dialog';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';
import { UnitIdFieldComponent, UnitIdPostValidateEvent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

// Feature
import { ChkOffService } from '../services/chkoff.service';
import {
  ProductCheckInDto,
  CheckInResultDto,
  InventoryClassDto,
  ProductCodeDto,
  AboTypeDto,
  WarehouseDto,
  StorageDeviceDto,
  RackDto,
  TrayDto,
  ReturnResult,
  UnitValidationDto
} from '../models/chkoff.model';

export interface CheckInSuccessEvent {
  unitId: string;
  displayUnitId: string | null;
  collDate: string | null;
  productCode: string;
  bloodType: string;
  bloodTypeDescription: string | null;
  expirationDate: string;
  inventoryClass: string;
  warehouseId?: string;
  deviceNumber?: string;
  rackNumber?: string;
  trayId?: string;
}

@Component({
  selector: 'app-chkoff-form',
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
    MatTooltipModule,
    MatAutocompleteModule,
    UnitIdFieldComponent
  ],
  templateUrl: './chkoff-form.html',
  styleUrl: './chkoff-form.scss'
})
export class ChkOffForm implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `chkoff-form-${ChkOffForm.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ChkOffService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly labelScanService = inject(DonorLibLabelScanService);
  private readonly headerService = inject(HeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);

  private destroy$ = new Subject<void>();

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  protected readonly inventoryClasses = signal<InventoryClassDto[]>([]);
  protected readonly loadingInventoryClasses = signal<boolean>(false);
  protected readonly submitting = signal<boolean>(false);
  protected readonly submitted = signal<boolean>(false);
  protected readonly collDate = signal<string | null>(null);
  private validatedUnitId = signal<string | null>(null);

  // Product codes LOV (Gap 1)
  protected readonly productCodes = signal<ProductCodeDto[]>([]);
  protected readonly loadingProductCodes = signal<boolean>(false);
  protected filteredProductCodes: ProductCodeDto[] = [];

  // ABO types LOV (Gap 2)
  protected readonly aboTypes = signal<AboTypeDto[]>([]);
  protected readonly loadingAboTypes = signal<boolean>(false);
  protected filteredAboTypes: AboTypeDto[] = [];

  // Selected product metadata (Gaps 5, 6, 7)
  protected readonly selectedProduct = signal<ProductCodeDto | null>(null);

  // Location required flag (Gap 7)
  protected readonly locationRequired = signal<boolean>(true);

  // Storage cascade signals
  protected readonly warehouses = signal<WarehouseDto[]>([]);
  protected readonly devices = signal<StorageDeviceDto[]>([]);
  protected readonly racks = signal<RackDto[]>([]);
  protected readonly trays = signal<TrayDto[]>([]);
  private readonly selectedDeviceType = signal<string>('');

  // Scan processing state
  protected fieldProcessing: Record<string, boolean> = {};
  protected fieldErrors: Record<string, string> = {};
  private productCodeOptionJustSelected = false;
  private aboOptionJustSelected = false;

  // Emergency ABO codes that skip location (from SRVLIB CHECK_NO_LOCATION)
  private static readonly EMERGENCY_ABO_CODES = ['71', '92', '48', '03', '59', '14', '70', '25', '81', 'P3', 'A3', 'B3', 'C3'];
  private static readonly RESTRICTED_ABO_CODES = ['BIO', 'HOLD', 'NFT', '21', '39', '47', '58', 'MB', 'MQ', 'MX', 'MD'];

  protected readonly collectionDate = computed(() => {
    const cd = this.collDate();
    return cd ? moment(cd).format('DD-MMM-YYYY').toUpperCase() : '';
  });

  protected readonly showDetailRows = signal<boolean>(false);

  form!: FormGroup;

  @Output() checkInSuccess = new EventEmitter<CheckInSuccessEvent>();
  @Output() clearAll = new EventEmitter<void>();

  ngOnInit(): void {
    this.initForm();
    this.loadInventoryClasses();
    this.loadWarehouses();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      inventoryClass: ['', [Validators.required]],
      receivedDate: ['', [Validators.required]],
      productCode: ['', [Validators.required]],
      bloodType: ['', [Validators.required]],
      expirationDate: ['', [Validators.required]],
      warehouseId: [''],
      deviceNumber: [''],
      rackNumber: [''],
      trayId: ['']
    });

    this.form.get('receivedDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateShowDetailRows());

    this.form.get('inventoryClass')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateShowDetailRows();
      });

    this.updateShowDetailRows();

    // Storage cascade
    this.form.get('warehouseId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(warehouseId => {
        this.form.patchValue({ deviceNumber: '', rackNumber: '', trayId: '' });
        this.devices.set([]);
        this.racks.set([]);
        this.trays.set([]);
        if (warehouseId) this.loadDevices(warehouseId);
      });

    this.form.get('deviceNumber')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(deviceNumber => {
        this.form.patchValue({ rackNumber: '', trayId: '' });
        this.racks.set([]);
        this.trays.set([]);
        const selectedDevice = this.devices().find(d => d.deviceNumber === deviceNumber);
        if (selectedDevice) {
          this.selectedDeviceType.set(selectedDevice.deviceType);
        }
        const warehouseId = this.form.get('warehouseId')?.value;
        if (warehouseId && deviceNumber) this.loadRacks(warehouseId, deviceNumber);
      });

    this.form.get('rackNumber')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(rackNumber => {
        this.form.patchValue({ trayId: '' });
        this.trays.set([]);
        const warehouseId = this.form.get('warehouseId')?.value;
        const deviceNumber = this.form.get('deviceNumber')?.value;
        if (warehouseId && deviceNumber && rackNumber) this.loadTrays(warehouseId, deviceNumber, rackNumber);
      });

    this.form.get('productCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        if (this.productCodeOptionJustSelected) return;
        const search = (term || '').toLowerCase();
        this.filteredProductCodes = search
          ? this.productCodes().filter(p => p.productCode.toLowerCase().includes(search))
          : this.productCodes();
      });

    this.form.get('bloodType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        if (this.aboOptionJustSelected) return;
        const search = (term || '').toLowerCase();
        this.filteredAboTypes = search
          ? this.aboTypes().filter(a =>
              a.aboCode.toLowerCase().includes(search) ||
              (a.aboDescription?.toLowerCase().includes(search) ?? false))
          : this.aboTypes();
      });
  }

  private getChapterLocalDateTime(): string {
    let now: moment.Moment;
    const timeZone = this.headerService.chapterTimeZone();
    if (timeZone && timeZone !== 'UTC') {
      now = moment().utcOffset(timeZone);
    } else if (this.chapterTimezoneService.isChapterLocalDateAvailable()) {
      const chapterDate = this.chapterTimezoneService.getChapterLocalDate();
      const systemNow = moment();
      now = chapterDate.clone().hour(systemNow.hour()).minute(systemNow.minute());
    } else {
      now = moment();
    }
    return now.format('DD-MMM-YYYY HH:mm').replace(/-([a-z]{3})-/i, (_, m) => `-${m.toUpperCase()}-`);
  }

  private static readonly DATE_FORMATS = [
    'DD-MMM-YYYY HH:mm',
    'D-MMM-YYYY HH:mm',
    'DD-MMM-YYYY H:mm',
    'D-MMM-YYYY H:mm',
    'MM-DD-YYYY HH:mm',
    'M-DD-YYYY HH:mm',
    'MM-DD-YY HH:mm',
    'M-DD-YY HH:mm',
    'YYYY-MM-DD HH:mm',
    'DD/MM/YYYY HH:mm',
    'MM/DD/YYYY HH:mm',
  ];

  private formatDateCanonical(m: moment.Moment): string {
    return m.format('DD-MMM-YYYY HH:mm').replace(/-([a-z]{3})-/i, (_, mon: string) => `-${mon.toUpperCase()}-`);
  }

  onReceivedDateBlur(): void {
    const rawValue = this.form.get('receivedDate')?.value?.trim();
    if (!rawValue) return;

    const parsed = moment(rawValue, ChkOffForm.DATE_FORMATS, true);
    if (!parsed.isValid()) {
      this.form.get('receivedDate')?.setErrors({ invalidFormat: true });
      return;
    }

    this.form.patchValue({ receivedDate: this.formatDateCanonical(parsed) }, { emitEvent: false });
    this.form.get('receivedDate')?.setErrors(null);

    const chapterNow = moment(this.getChapterLocalDateTime(), 'DD-MMM-YYYY HH:mm', true);
    if (chapterNow.isValid() && parsed.isAfter(chapterNow)) {
      this.form.get('receivedDate')?.setErrors({ futureDate: true });
    }
  }

  private updateShowDetailRows(): void {
    const invClass = this.form.get('inventoryClass')?.value;
    const recDate = this.form.get('receivedDate')?.value?.trim();
    this.showDetailRows.set(!!invClass && !!recDate);
  }

  // --- Shared Unit ID field handlers ---

  onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    const unitId = event.data.parsedUnitId || event.data.manualUnitId;
    if (!unitId) {
      event.reject('Invalid unit ID');
      return;
    }

    this.service.validateUnit(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (validation) => {
          if (validation.isValid) {
            this.collDate.set(validation.collDate);
            this.validatedUnitId.set(unitId);
            this.loadProductCodes(unitId);
            event.confirm();
          } else {
            event.reject(validation.message || 'Unit not found in system for this chapter');
          }
        },
        error: () => event.reject('Failed to validate unit ID')
      });
  }

  onUnitValidated(_data: UnitValidationResponse): void {}

  onUnitCleared(): void {
    this.collDate.set(null);
    this.validatedUnitId.set(null);
    this.productCodes.set([]);
    this.filteredProductCodes = [];
    this.aboTypes.set([]);
    this.filteredAboTypes = [];
    this.selectedProduct.set(null);
    this.locationRequired.set(true);
    this.form.get('bloodType')?.enable();
    this.form.get('expirationDate')?.enable();
    this.form.patchValue({ productCode: '', bloodType: '', expirationDate: '' });
  }

  onProductCodeOptionSelected(value: string): void {
    this.productCodeOptionJustSelected = true;
    this.form.patchValue({ productCode: value }, { emitEvent: false });
    this.clearFieldError('productCode');
    this.onProductCodeSelected(value);
  }

  onProductCodeScanBlur(trigger: MatAutocompleteTrigger): void {
    setTimeout(() => {
      if (this.productCodeOptionJustSelected) {
        this.productCodeOptionJustSelected = false;
        return;
      }

      if (trigger.panelOpen) {
        trigger.closePanel();
      }

      const scanValue = this.form.get('productCode')?.value?.trim();
      if (!scanValue) return;

      const exactMatch = this.productCodes().find(
        p => p.productCode.toUpperCase() === scanValue.toUpperCase()
      );
      if (exactMatch) {
        this.form.patchValue({ productCode: exactMatch.productCode }, { emitEvent: false });
        this.onProductCodeSelected(exactMatch.productCode);
        return;
      }

      this.clearFieldError('productCode');
      this.fieldProcessing['productCode'] = true;

      this.labelScanService.validateProductScan(scanValue)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.fieldProcessing['productCode'] = false;
            if (res.success && res.item) {
              const resolvedCode = res.item.productCode || scanValue;
              this.form.patchValue({ productCode: resolvedCode }, { emitEvent: false });
              this.onProductCodeSelected(resolvedCode);
            } else {
              this.setFieldError('productCode', res.errorResponse?.error || res.message || 'Invalid product code scan');
            }
          },
          error: (err) => {
            this.fieldProcessing['productCode'] = false;
            const body = err?.error;
            this.setFieldError('productCode', body?.errorResponse?.error || body?.message || 'Failed to validate product code scan');
          }
        });
    }, 300);
  }

  onProductCodeSelected(productCode: string): void {
    const product = this.productCodes().find(p => p.productCode === productCode);
    this.selectedProduct.set(product ?? null);

    this.form.patchValue({ bloodType: '', expirationDate: '' });
    this.aboTypes.set([]);
    this.filteredAboTypes = [];
    this.form.get('bloodType')?.enable();
    this.form.get('expirationDate')?.enable();
    this.locationRequired.set(true);

    if (!productCode) return;

    const unitId = this.unitIdField?.parsedUnitId || this.validatedUnitId();
    if (unitId) {
      this.loadAboTypes(unitId, productCode, '00');
    }

    if (product && (product.poolProductCode === 'Y' || product.productType?.startsWith('PO'))) {
      this.form.patchValue({ bloodType: 'PO' });
      this.form.get('bloodType')?.disable();
      this.locationRequired.set(false);
    }

    if (product && (product.productType === 'RPL' || product.productType === 'RPFF')) {
      const cd = this.collDate();
      if (cd && product.lifeSpan > 0) {
        let expMoment = moment(cd);
        switch (product.lifeSpanInd?.toUpperCase()) {
          case 'D': expMoment = expMoment.add(product.lifeSpan, 'days'); break;
          case 'Y': expMoment = expMoment.add(product.lifeSpan, 'years'); break;
          case 'H': expMoment = expMoment.add(product.lifeSpan, 'hours'); break;
          default:  expMoment = expMoment.add(product.lifeSpan, 'days'); break;
        }
        this.form.patchValue({
          expirationDate: expMoment.format('DD-MMM-YYYY HH:mm').replace(/-([a-z]{3})-/i, (_, m) => `-${m.toUpperCase()}-`)
        });
        this.form.get('expirationDate')?.disable();
      }
    }
  }

  private loadProductCodes(unitId: string): void {
    this.loadingProductCodes.set(true);
    this.service.getProductCodes(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.productCodes.set(data);
          this.filteredProductCodes = data;
          this.loadingProductCodes.set(false);
          if (data.length === 1) {
            this.form.patchValue({ productCode: data[0].productCode });
            this.onProductCodeSelected(data[0].productCode);
          }
        },
        error: () => {
          this.loadingProductCodes.set(false);
          this.snackbarService.showError('Failed to load product codes');
        }
      });
  }

  onAboOptionSelected(value: string): void {
    this.aboOptionJustSelected = true;
    this.form.patchValue({ bloodType: value }, { emitEvent: false });
    this.clearFieldError('bloodType');
    this.onAboSelected(value);
  }

  onAboScanBlur(trigger: MatAutocompleteTrigger): void {
    setTimeout(() => {
      if (this.aboOptionJustSelected) {
        this.aboOptionJustSelected = false;
        return;
      }

      if (trigger.panelOpen) {
        trigger.closePanel();
      }

      const scanValue = this.form.get('bloodType')?.value?.trim();
      if (!scanValue) return;

      const exactMatch = this.aboTypes().find(
        a => a.aboCode.toUpperCase() === scanValue.toUpperCase()
      );
      if (exactMatch) {
        this.form.patchValue({ bloodType: exactMatch.aboCode }, { emitEvent: false });
        this.onAboSelected(exactMatch.aboCode);
        return;
      }

      this.clearFieldError('bloodType');
      this.fieldProcessing['bloodType'] = true;

      this.labelScanService.validateAboScan(scanValue)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.fieldProcessing['bloodType'] = false;
            if (res.success && res.item) {
              const resolvedCode = res.item.aboCode || scanValue;
              this.form.patchValue({ bloodType: resolvedCode }, { emitEvent: false });
              this.onAboSelected(resolvedCode);
            } else {
              this.setFieldError('bloodType', res.errorResponse?.error || res.message || 'Invalid ABO code scan');
            }
          },
          error: (err) => {
            this.fieldProcessing['bloodType'] = false;
            const body = err?.error;
            this.setFieldError('bloodType', body?.errorResponse?.error || body?.message || 'Failed to validate ABO code scan');
          }
        });
    }, 300);
  }

  onAboSelected(aboCode: string): void {
    if (!aboCode) return;
    this.checkLocationRequired(aboCode);
  }

  private loadAboTypes(unitId: string, productCode: string, aliquot: string): void {
    this.loadingAboTypes.set(true);
    this.service.getAboTypes(unitId, productCode, aliquot)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.aboTypes.set(data);
          this.filteredAboTypes = data;
          this.loadingAboTypes.set(false);
          if (data.length === 1) {
            this.form.patchValue({ bloodType: data[0].aboCode });
            this.checkLocationRequired(data[0].aboCode);
          }
        },
        error: () => {
          this.loadingAboTypes.set(false);
          this.snackbarService.showError('Failed to load ABO types');
        }
      });
  }

  private checkLocationRequired(aboCode: string): void {
    const product = this.selectedProduct();
    const isPool = product?.poolProductCode === 'Y' || product?.productType?.startsWith('PO');
    const isEmergency = ChkOffForm.EMERGENCY_ABO_CODES.includes(aboCode);
    this.locationRequired.set(!isPool && !isEmergency);

    if (!this.locationRequired() && this.canAutoSubmit()) {
      this.performCheckIn();
    } else if (this.locationRequired()) {
      this.autoSelectDefaultWarehouse();
    }
  }

  private autoSelectDefaultWarehouse(): void {
    const sessionWarehouse = this.headerService.getCurrentWarehouseId();
    const available = this.warehouses();
    if (sessionWarehouse && available.some(w => w.warehouseId === sessionWarehouse)) {
      this.form.patchValue({ warehouseId: sessionWarehouse });
    } else if (available.length === 1) {
      this.form.patchValue({ warehouseId: available[0].warehouseId });
    }
  }

  onExpirationDateBlur(): void {
    const rawValue = this.form.get('expirationDate')?.value?.trim();
    if (!rawValue) return;

    const isBarcodePattern = rawValue.startsWith('&>') || rawValue.startsWith('=>') || /^\d{6,}$/.test(rawValue);
    if (isBarcodePattern) {
      this.fieldProcessing['expirationDate'] = true;
      this.labelScanService.validateExpdateScan(rawValue)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.fieldProcessing['expirationDate'] = false;
            if (res.success && res.item?.expiryDate) {
              const expMoment = moment(res.item.expiryDate);
              if (expMoment.isValid()) {
                this.form.patchValue({
                  expirationDate: expMoment.format('DD-MMM-YYYY HH:mm').replace(/-([a-z]{3})-/i, (_, m) => `-${m.toUpperCase()}-`)
                });
              }
            } else {
              this.snackbarService.showError(res.errorResponse?.error || res.message || 'Invalid expiry date scan');
            }
          },
          error: (err) => {
            this.fieldProcessing['expirationDate'] = false;
            const body = err?.error;
            this.snackbarService.showError(body?.errorResponse?.error || body?.message || 'Failed to validate expiry date scan');
          }
        });
      return;
    }

    const parsed = moment(rawValue, ChkOffForm.DATE_FORMATS, true);
    if (parsed.isValid()) {
      this.form.patchValue({
        expirationDate: this.formatDateCanonical(parsed)
      }, { emitEvent: false });
      this.form.get('expirationDate')?.setErrors(null);
    } else {
      this.form.get('expirationDate')?.setErrors({ invalidFormat: true });
      this.form.get('expirationDate')?.markAsTouched();
      return;
    }

    if (!this.locationRequired() && this.canAutoSubmit()) {
      this.performCheckIn();
    }
  }

  private validateBloodType(bloodType: string): void {
    if (!bloodType) return;
    if (ChkOffForm.RESTRICTED_ABO_CODES.includes(bloodType.toUpperCase().trim())) {
      this.snackbarService.showError('Restricted blood type — cannot check in');
    }
  }

  private setFieldError(controlName: string, message: string): void {
    this.fieldErrors[controlName] = message;
    const control = this.form.get(controlName);
    if (control) {
      control.setErrors({ serverError: true });
      control.markAsTouched();
    }
  }

  private clearFieldError(controlName: string): void {
    this.fieldErrors[controlName] = '';
    const control = this.form.get(controlName);
    if (control) {
      control.setErrors(null);
    }
  }

  clearHeaderFields(): void {
    this.clearDetailFields();
    this.form.patchValue({ inventoryClass: '', receivedDate: '' });
    this.form.get('inventoryClass')?.markAsUntouched();
    this.form.get('receivedDate')?.markAsUntouched();
    this.updateShowDetailRows();
    this.clearAll.emit();
  }

  clearDetailFields(): void {
    this.onUnitCleared();
    this.clearStorageFields();
    this.unitIdField?.clear();
    ['productCode', 'bloodType', 'expirationDate'].forEach(key => {
      const ctrl = this.form.get(key);
      ctrl?.markAsUntouched();
      ctrl?.markAsPristine();
      ctrl?.setErrors(null);
    });
    this.fieldErrors = {};
  }

  clearStorageFields(): void {
    this.form.patchValue({ warehouseId: '', deviceNumber: '', rackNumber: '', trayId: '' });
    this.devices.set([]);
    this.racks.set([]);
    this.trays.set([]);
  }

  onSubmit(): void {
    // No-op: check-in is triggered automatically when tray is selected or location is not required
  }

  onTrayChanged(): void {
    const trayId = this.form.get('trayId')?.value;
    if (!trayId) return;

    if (this.canAutoSubmit()) {
      this.performCheckIn();
    }
  }

  private canAutoSubmit(): boolean {
    const formValue = this.form.getRawValue();
    const unitValid = this.unitIdField?.isValid && (this.unitIdField?.parsedUnitId || this.validatedUnitId());
    return !!(
      unitValid &&
      formValue.inventoryClass &&
      formValue.receivedDate?.trim() &&
      formValue.productCode?.trim() &&
      formValue.bloodType?.trim() &&
      formValue.expirationDate?.trim() &&
      (!this.locationRequired() || formValue.trayId) &&
      !this.submitting()
    );
  }

  private performCheckIn(): void {
    this.submitting.set(true);

    const formValue = this.form.getRawValue();
    const unitId = this.unitIdField?.parsedUnitId || this.validatedUnitId() || '';

    const rcvParsed = moment(formValue.receivedDate?.trim(), 'DD-MMM-YYYY HH:mm', true);
    const expParsed = moment(formValue.expirationDate?.trim(), 'DD-MMM-YYYY HH:mm', true);

    if (!rcvParsed.isValid()) {
      this.snackbarService.showError('Invalid Received Date format. Use DD-MMM-YYYY HH:mm');
      this.submitting.set(false);
      return;
    }

    const payload: ProductCheckInDto = {
      inventoryClass: formValue.inventoryClass,
      receivedDate: rcvParsed.format('YYYY-MM-DDTHH:mm:ss'),
      unitId: unitId.trim(),
      productCode: formValue.productCode.trim(),
      aliquot: '00',
      bloodType: formValue.bloodType.trim().toUpperCase(),
      expirationDate: expParsed.isValid() ? expParsed.format('YYYY-MM-DD') : formValue.expirationDate?.trim(),
      expirationTime: expParsed.isValid() ? expParsed.format('HH:mm') : undefined,
      warehouseId: formValue.warehouseId || undefined,
      deviceType: this.selectedDeviceType() || undefined,
      deviceNumber: formValue.deviceNumber || undefined,
      rackNumber: formValue.rackNumber || undefined,
      trayId: formValue.trayId || undefined
    };

    this.service.checkInProduct(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => this.handleCheckInSuccess(response),
        error: (error) => this.handleCheckInError(error)
      });
  }

  private handleCheckInSuccess(response: ReturnResult<CheckInResultDto>): void {
    this.submitting.set(false);

    const result: CheckInResultDto | undefined = response.item ?? (response.data as unknown as CheckInResultDto);
    if (response.success && result) {
      const successFormValue = this.form.getRawValue();
      const expParsed = moment(successFormValue.expirationDate?.trim(), 'DD-MMM-YYYY HH:mm', true);
      const selectedBt = successFormValue.bloodType?.trim()?.toUpperCase();
      const aboMatch = this.aboTypes().find(a => a.aboCode.toUpperCase() === selectedBt);
      this.checkInSuccess.emit({
        unitId: this.unitIdField?.parsedUnitId || this.validatedUnitId() || '',
        displayUnitId: result.displayUnitId ?? null,
        collDate: this.collDate(),
        productCode: successFormValue.productCode?.trim(),
        bloodType: selectedBt,
        bloodTypeDescription: aboMatch?.aboDescription ?? null,
        expirationDate: expParsed.isValid() ? expParsed.toISOString() : successFormValue.expirationDate?.trim(),
        inventoryClass: successFormValue.inventoryClass,
        warehouseId: successFormValue.warehouseId || undefined,
        deviceNumber: successFormValue.deviceNumber || undefined,
        rackNumber: successFormValue.rackNumber || undefined,
        trayId: successFormValue.trayId || undefined
      });
      this.resetProductFields();
    } else {
      this.snackbarService.showError(response.message || 'Check-in failed');
    }
  }

  private resetProductFields(): void {
    this.form.get('bloodType')?.enable();
    this.form.get('expirationDate')?.enable();
    this.form.patchValue({ productCode: '', bloodType: '', expirationDate: '', warehouseId: '', deviceNumber: '', rackNumber: '', trayId: '' });
    this.submitted.set(false);
    this.collDate.set(null);
    this.aboTypes.set([]);
    this.filteredAboTypes = [];
    this.productCodes.set([]);
    this.filteredProductCodes = [];
    this.selectedProduct.set(null);
    this.locationRequired.set(true);
    this.devices.set([]);
    this.racks.set([]);
    this.trays.set([]);
    this.unitIdField?.clear();
    ['productCode', 'bloodType', 'expirationDate', 'warehouseId', 'deviceNumber', 'rackNumber', 'trayId'].forEach(key => {
      const ctrl = this.form.get(key);
      ctrl?.markAsUntouched();
      ctrl?.markAsPristine();
      ctrl?.setErrors(null);
    });
  }

  private handleCheckInError(error: any): void {
    this.submitting.set(false);
    const errorMessage = error.error?.message || error.message || 'Failed to check in product';
    const errorCode = error.error?.errorCode;

    if (errorCode === '5322') {
      this.snackbarService.showError('5322: Product already exists in active products');
    } else if (errorCode === '5327') {
      this.snackbarService.showError('5327: No component with status Lab-ready found');
    } else if (errorCode === '0313') {
      this.snackbarService.showError('0313: Component prefix not found with lab-ready status');
    } else if (errorCode === '5325') {
      this.snackbarService.showError('5325: Restricted blood type — cannot check in');
    } else if (errorCode === '3701') {
      this.snackbarService.showError('3701: Product has expired');
    } else if (errorCode === '0318') {
      this.handleTrayOverflow();
    } else if (errorCode === '0341') {
      this.snackbarService.showError('0341: Tray ID not found');
    } else {
      this.snackbarService.showError(errorCode ? `${errorCode}: ${errorMessage}` : errorMessage);
    }
  }

  private showWarningsDialog(warnings: string[]): void {
    this.dialog.open(MessageDialog, {
      width: '500px',
      data: { title: 'Check-In Warnings', message: 'Product checked in with warnings:', details: warnings, type: 'warning' }
    });
  }

  private handleTrayOverflow(): void {
    const dialogRef = this.dialog.open(MessageDialog, {
      width: '500px',
      data: { title: 'Tray Overflow', message: 'The tray is at capacity. Override and continue?', type: 'confirm', confirmText: 'Yes, Override', cancelText: 'Cancel' }
    });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) this.resubmitWithTrayOverride();
    });
  }

  private resubmitWithTrayOverride(): void {
    const formValue = this.form.getRawValue();
    const unitId = this.unitIdField?.parsedUnitId || this.validatedUnitId() || '';
    const rcvParsed = moment(formValue.receivedDate?.trim(), 'DD-MMM-YYYY HH:mm', true);
    const expParsed = moment(formValue.expirationDate?.trim(), 'DD-MMM-YYYY HH:mm', true);

    const payload: ProductCheckInDto = {
      inventoryClass: formValue.inventoryClass,
      receivedDate: rcvParsed.isValid() ? rcvParsed.format('YYYY-MM-DDTHH:mm:ss') : formValue.receivedDate?.trim(),
      unitId: unitId.trim(),
      productCode: formValue.productCode.trim(),
      aliquot: '00',
      bloodType: formValue.bloodType.trim().toUpperCase(),
      expirationDate: expParsed.isValid() ? expParsed.format('YYYY-MM-DD') : formValue.expirationDate?.trim(),
      expirationTime: expParsed.isValid() ? expParsed.format('HH:mm') : undefined,
      warehouseId: formValue.warehouseId || undefined,
      deviceType: this.selectedDeviceType() || undefined,
      deviceNumber: formValue.deviceNumber || undefined,
      rackNumber: formValue.rackNumber || undefined,
      trayId: formValue.trayId || undefined,
      trayOverflowConfirmation: 'Y'
    };

    this.submitting.set(true);
    this.service.checkInProduct(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => this.handleCheckInSuccess(response),
        error: (error) => this.handleCheckInError(error)
      });
  }

  // --- Data loading ---

  private loadInventoryClasses(): void {
    this.loadingInventoryClasses.set(true);
    this.service.getInventoryClasses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (classes) => { this.inventoryClasses.set(classes); this.loadingInventoryClasses.set(false); },
        error: () => { this.snackbarService.showError('Failed to load inventory classes'); this.loadingInventoryClasses.set(false); }
      });
  }

  private loadWarehouses(): void {
    this.service.getWarehouses().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => this.warehouses.set(data), error: () => {}
    });
  }

  private loadDevices(warehouseId: string): void {
    const productType = this.selectedProduct()?.storageProductType || this.selectedProduct()?.productType || '';
    this.service.getDevices(warehouseId, productType).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.devices.set(data);
        if (data.length === 1) {
          this.form.patchValue({ deviceNumber: data[0].deviceNumber });
        }
      },
      error: () => {}
    });
  }

  private loadRacks(warehouseId: string, deviceNumber: string): void {
    const deviceType = this.selectedDeviceType() || '';
    const productType = this.selectedProduct()?.storageProductType || this.selectedProduct()?.productType || '';
    const bloodType = this.form.getRawValue().bloodType || '';
    this.service.getRacks(warehouseId, deviceNumber, deviceType, productType, bloodType).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.racks.set(data);
        if (data.length === 1) {
          this.form.patchValue({ rackNumber: data[0].rackNumber });
        }
      },
      error: () => {}
    });
  }

  private loadTrays(warehouseId: string, deviceNumber: string, rackNumber: string): void {
    this.service.getTrays(warehouseId, deviceNumber, rackNumber).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => this.trays.set(data), error: () => {}
    });
  }
}
