import { Component, OnInit, OnDestroy, signal, effect, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { formatTableDate, formatTableDateTime } from '@shared/utils/date-format.util';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';

import { CloseHospitalTransferApiService } from './services/close-hospital-transfer-api.service';
import { SelectTransferSlipDialogComponent } from './dialogs/select-transfer-slip-dialog/select-transfer-slip-dialog';
import {
  OpenTransferSlipDto,
  SelectTransferSlipDialogData,
  TransferProductDto,
  TransferProductRow,
  CloseTransferRequestDto,
  TransferProductQcDto,
  ActionTakenValue,
  ACTION_TAKEN_OPTIONS,
} from './models/close-hospital-transfer.model';

const EXP_DATE_REGEX = /^\d{2}-(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-\d{4}\s\d{2}:\d{2}$/i;
const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

@Component({
  selector: 'app-close-hospital-transfer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
  ],
  templateUrl: './close-hospital-transfer.html',
  styleUrl: './close-hospital-transfer.scss',
})
export class CloseHospitalTransferComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `close-hospital-transfer-${CloseHospitalTransferComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private readonly apiService = inject(CloseHospitalTransferApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

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
          subtitle: pageData.subtitle || 'Review information about a particular shipment that has been delivered.',
        };
      }
    });
  }

  readonly actionTakenOptions = ACTION_TAKEN_OPTIONS;

  transferSlipCtrl = new FormControl<string>('', { validators: [Validators.required] });

  transferSlipOptions = signal<OpenTransferSlipDto[]>([]);
  selectedSlipDisplay = signal<string>('');
  private slipDialogOpen = false;

  isLoadingSlips = false;
  isLoadingProducts = false;
  isSaving = false;
  hasRetrieved = false;

  creationDate = signal<string>('-');

  sourceHospitalName = signal('');
  sourceHospitalAddress = signal('');
  destinationHospitalName = signal('');
  destinationHospitalAddress = signal('');

  transferType = '';
  sortDirection: 'ASC' | 'DESC' = 'ASC';

  products: TransferProductRow[] = [];
  displayedColumns: string[] = [
    'actionTaken',
    'unitId',
    'productCode',
    'productDescription',
    'aboRh',
    'expirationDate',
  ];

  ngOnInit(): void {
    this.loadOpenTransferSlips();

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadOpenTransferSlips();
      });
  }

  openSelectTransferSlipDialog(): void {
    if (this.slipDialogOpen || this.isLoadingSlips) return;
    this.slipDialogOpen = true;

    const dialogRef = this.dialog.open<SelectTransferSlipDialogComponent, SelectTransferSlipDialogData, OpenTransferSlipDto>(
      SelectTransferSlipDialogComponent,
      {
        width: '720px',
        height: '100%',
        maxHeight: 'calc(100vh - 64px)',
        position: { right: '0', top: '0' },
        panelClass: 'right-panel-dialog',
        autoFocus: false,
        data: {
          slips: this.transferSlipOptions(),
          selectedPickSlipId: this.transferSlipCtrl.value || undefined,
        },
      },
    );

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((selected: OpenTransferSlipDto | null | undefined) => {
        this.slipDialogOpen = false;
        if (selected) {
          this.transferSlipCtrl.setValue(selected.pickSlipId);
          this.selectedSlipDisplay.set(selected.pickSlipId);
          if (selected.insertDate) {
            this.creationDate.set(this.formatDateTime(selected.insertDate));
          } else {
            this.creationDate.set('-');
          }
        }
        this.transferSlipCtrl.markAsTouched();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRetrieve(): void {
    const pickSlipId = this.transferSlipCtrl.value;
    if (!pickSlipId) {
      this.snackbarService.showError('Please select a Transfer Slip ID.');
      return;
    }

    const selected = this.transferSlipOptions().find(s => s.pickSlipId === pickSlipId);
    this.transferType = selected?.pickSlipType || '';

    this.isLoadingProducts = true;
    this.hasRetrieved = true;
    this.products = [];

    this.apiService.getTransferProducts(pickSlipId, this.sortDirection)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingProducts = false;
          if (response.success && response.data) {
            const data = response.data;
            this.products = data.map(p => this.createProductRow(p));

            if (data.length > 0) {
              const first = data[0];
              this.sourceHospitalName.set(first.sourceHospitalName || '');
              const sourceAddr = [first.sourceHospitalAddress, first.sourceCityStateZip]
                .filter(Boolean).join(', ');
              this.sourceHospitalAddress.set(sourceAddr);
              this.destinationHospitalName.set(first.destinationHospitalName || '');
              const destAddr = [first.destinationHospitalAddress, first.destCityStateZip]
                .filter(Boolean).join(', ');
              this.destinationHospitalAddress.set(destAddr);
            }
            this.cdr.markForCheck();
          } else {
            this.products = [];
            this.snackbarService.showError(response.message || 'Failed to retrieve transfer products.');
          }
        },
        error: () => {
          this.isLoadingProducts = false;
          this.products = [];
        },
      });
  }

  onSortToggle(): void {
    this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    if (this.transferSlipCtrl.value && this.hasRetrieved) {
      this.onRetrieve();
    }
  }

  getSortIcon(): string {
    return this.sortDirection === 'ASC' ? 'arrow_upward' : 'arrow_downward';
  }

  onClearAll(): void {
    this.transferSlipCtrl.setValue('');
    this.selectedSlipDisplay.set('');
    this.creationDate.set('-');
    this.hasRetrieved = false;
    this.products = [];
    this.transferType = '';
    this.sortDirection = 'ASC';
    this.sourceHospitalName.set('');
    this.sourceHospitalAddress.set('');
    this.destinationHospitalName.set('');
    this.destinationHospitalAddress.set('');
  }

  onCancel(): void {
    this.products.forEach(p => {
      p.actionTaken = '' as ActionTakenValue;
      this.resetModifyFields(p);
    });
  }

  onSave(): void {
    const pickSlipId = this.transferSlipCtrl.value;
    if (!pickSlipId) return;

    const productsWithAction = this.products.filter(p => p.actionTaken);
    if (productsWithAction.length === 0) {
      this.snackbarService.showError('Please select an action for at least one product.');
      return;
    }

    const qcProducts: TransferProductQcDto[] = productsWithAction.map(p => {
      const dto: TransferProductQcDto = {
        unitId: p.actionTaken === 'M' && p.modifiedUnitId ? p.modifiedUnitId : p.unitId,
        productCode: p.actionTaken === 'M' && p.modifiedProductCode ? p.modifiedProductCode : p.productCode,
        aliquot: p.aliquot,
        collDate: p.collDate,
        qcFlag: p.actionTaken,
      };
      if (p.actionTaken === 'M') {
        dto.bloodType = p.modifiedBloodType || p.bloodType;
        dto.expDate = p.modifiedExpDate || p.expDate;
        dto.originalUnitId = p.unitId;
        dto.originalProductCode = p.productCode;
        dto.originalAliquot = p.aliquot;
      }
      return dto;
    });

    const request: CloseTransferRequestDto = {
      pickSlipId,
      products: qcProducts,
    };

    this.isSaving = true;

    this.apiService.closeTransfer(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSaving = false;
          if (response.success) {
            this.snackbarService.showSuccess(response.item?.message || 'Transfer closed successfully.');
            this.onClearAll();
            this.loadOpenTransferSlips();
          } else {
            this.snackbarService.showError(response.message || 'Failed to close transfer.');
          }
        },
        error: () => {
          this.isSaving = false;
        },
      });
  }

  onActionChange(product: TransferProductRow, value: ActionTakenValue): void {
    product.actionTaken = value;
    if (value === 'M') {
      if (this.transferType === 'XA') {
        product.actionTaken = '' as ActionTakenValue;
        this.snackbarService.showError('Cannot modify products on Auto/Direct transfers.');
        return;
      }
      this.resetModifyFields(product);
    } else {
      this.resetModifyFields(product);
    }
  }

  onUnitValidated(product: TransferProductRow, response: UnitValidationResponse): void {
    product.modifiedUnitId = response.parsedUnitId || '';
    product.codeScheme = response.codeScheme || 'C';
    this.loadProductCodeLov(product);
  }

  onUnitCleared(product: TransferProductRow): void {
    product.modifiedUnitId = '';
    product.modifiedProductCode = '';
    product.modifiedProductDescription = '';
    product.modifiedAliquot = '';
    product.modifiedBloodType = '';
    product.modifiedAboDescription = '';
    product.modifiedExpDate = '';
    product.expDateError = '';
    product.productCodeOptions = [];
    product.aliquotOptions = [];
    product.aboRhOptions = [];
  }

  onProductCodeChange(product: TransferProductRow, value: string): void {
    product.modifiedProductCode = value;
    const selected = product.productCodeOptions.find(o => o.productCode === value);
    product.modifiedProductDescription = selected?.productDescription || '';
    product.modifiedBloodType = '';
    product.modifiedAboDescription = '';
    product.aboRhOptions = [];

    if (value) {
      this.loadAboRhLov(product);
    }
  }

  onAboRhChange(product: TransferProductRow, value: string): void {
    product.modifiedBloodType = value;
    const selected = product.aboRhOptions.find(o => o.bloodType === value);
    product.modifiedAboDescription = selected?.aboDescription || '';
  }

  onExpDateInput(product: TransferProductRow, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    product.modifiedExpDate = value;
    product.expDateError = this.validateExpDate(value);
  }

  hasAnyFieldValue(): boolean {
    return !!this.transferSlipCtrl.value;
  }

  hasAnyAction(): boolean {
    return this.products.some(p => p.actionTaken);
  }

  isReadyToSave(): boolean {
    const withAction = this.products.filter(p => p.actionTaken);
    if (withAction.length === 0) return false;
    return withAction.every(p => {
      if (p.actionTaken !== 'M') return true;
      return !!(
        p.modifiedUnitId &&
        p.modifiedProductCode &&
        p.modifiedBloodType &&
        (p.modifiedExpDate || p.expDate) &&
        !p.expDateError
      );
    });
  }

  formatDate(isoDate: string | null | undefined): string {
    return formatTableDate(isoDate);
  }

  formatExpDate(isoDate: string | null | undefined): string {
    return formatTableDateTime(isoDate);
  }

  trackByUnitId(_index: number, item: TransferProductRow): string {
    return `${item.unitId}-${item.productCode}-${item.aliquot}`;
  }

  private createProductRow(p: TransferProductDto): TransferProductRow {
    return {
      ...p,
      actionTaken: '' as ActionTakenValue,
      modifiedUnitId: '',
      modifiedProductCode: '',
      modifiedProductDescription: '',
      modifiedAliquot: '',
      modifiedBloodType: '',
      modifiedAboDescription: '',
      modifiedExpDate: '',
      productCodeOptions: [],
      aliquotOptions: [],
      aboRhOptions: [],
      isLoadingProductCodes: false,
      isLoadingAliquots: false,
      isLoadingAboRh: false,
      codeScheme: 'C',
      expDateError: '',
    };
  }

  private resetModifyFields(product: TransferProductRow): void {
    product.modifiedUnitId = '';
    product.modifiedProductCode = '';
    product.modifiedProductDescription = '';
    product.modifiedAliquot = '';
    product.modifiedBloodType = '';
    product.modifiedAboDescription = '';
    product.modifiedExpDate = '';
    product.expDateError = '';
    product.productCodeOptions = [];
    product.aliquotOptions = [];
    product.aboRhOptions = [];
  }

  private validateExpDate(value: string): string {
    if (!value) return '';
    if (!EXP_DATE_REGEX.test(value)) {
      return 'Format must be DD-MMM-YYYY HH:MM (e.g., 12-JAN-2026 13:15)';
    }
    const parts = value.split(/[-\s:]/);
    const day = parseInt(parts[0], 10);
    const monthIndex = MONTH_NAMES.indexOf(parts[1].toUpperCase());
    const year = parseInt(parts[2], 10);
    const hours = parseInt(parts[3], 10);
    const minutes = parseInt(parts[4], 10);
    if (hours > 23 || minutes > 59) {
      return 'Invalid time. Hours must be 00-23, minutes 00-59.';
    }
    const date = new Date(year, monthIndex, day);
    if (date.getDate() !== day || date.getMonth() !== monthIndex || date.getFullYear() !== year) {
      return 'Invalid calendar date.';
    }
    return '';
  }

  private loadProductCodeLov(product: TransferProductRow): void {
    const unitId = product.modifiedUnitId || product.unitId;
    product.isLoadingProductCodes = true;

    this.apiService.getProductCodeLov(unitId, product.productType, product.bloodType, product.codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          product.isLoadingProductCodes = false;
          product.productCodeOptions = response.success ? (response.data ?? []) : [];
          if (product.productCodeOptions.length === 1 && !product.modifiedProductCode) {
            product.modifiedProductCode = product.productCodeOptions[0].productCode;
            product.modifiedProductDescription = product.productCodeOptions[0].productDescription || '';
          } else if (product.modifiedProductCode && !product.productCodeOptions.some(o => o.productCode === product.modifiedProductCode)) {
            product.modifiedProductCode = '';
            product.modifiedProductDescription = '';
          }
          if (product.modifiedProductCode) {
            this.loadAboRhLov(product);
          }
          this.cdr.markForCheck();
        },
        error: () => {
          product.isLoadingProductCodes = false;
          product.productCodeOptions = [];
          this.cdr.markForCheck();
        },
      });
  }


  private loadAboRhLov(product: TransferProductRow): void {
    const unitId = product.modifiedUnitId || product.unitId;
    product.isLoadingAboRh = true;

    this.apiService.getAboRhLov(unitId, product.modifiedProductCode, '', product.codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          product.isLoadingAboRh = false;
          product.aboRhOptions = response.success ? (response.data ?? []) : [];
          if (product.aboRhOptions.length === 1) {
            product.modifiedBloodType = product.aboRhOptions[0].bloodType;
            product.modifiedAboDescription = product.aboRhOptions[0].aboDescription;
          } else if (product.modifiedBloodType && !product.aboRhOptions.some(o => o.bloodType === product.modifiedBloodType)) {
            product.modifiedBloodType = '';
            product.modifiedAboDescription = '';
          }
          this.cdr.markForCheck();
        },
        error: () => {
          product.isLoadingAboRh = false;
          product.aboRhOptions = [];
          this.cdr.markForCheck();
        },
      });
  }

  private loadOpenTransferSlips(): void {
    this.isLoadingSlips = true;
    this.apiService.getOpenTransferSlips()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingSlips = false;
          if (response.success) {
            this.transferSlipOptions.set(response.data ?? []);
          }
        },
        error: () => {
          this.isLoadingSlips = false;
        },
      });
  }

  private formatDateTime(isoDate: string): string {
    if (!isoDate) return '-';
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  }
}
