import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';

import { ProductServiceCodeDto, UpdateProductServiceCodeDto } from '../models/enter-product-service-codes.model';
import { EnterProductServiceCodesApiService } from '../services/enter-product-service-codes-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { TIMEZONE_OFFSET_MAP, TIMEZONE_OFFSET_REGEX } from 'src/app/core/constants/timezone.constants';
import moment from 'moment';

@Component({
  selector: 'app-edit-product-service-code-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './edit-product-service-code-dialog.html',
  styleUrls: ['./edit-product-service-code-dialog.scss']
})
export class EditProductServiceCodeDialog implements OnChanges, AfterViewInit {
  @Input() data: ProductServiceCodeDto | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();
  @ViewChild('closePanelBtn', { read: ElementRef }) closePanelBtn!: ElementRef<HTMLElement>;

  editForm!: FormGroup;
  isSaving = false;
  lastUpdated = '';

  editModeValues = {
    productCode: '',
    productDesc: '',
    productType: '',
    invProductType: '',
    outOfState: '',
    returnable: ''
  };

  private originalValues = { stdPrice: null as number | null, serviceCode: '' };

  private dialog = inject(MatDialog);

  constructor(
    private fb: FormBuilder,
    private service: EnterProductServiceCodesApiService,
    private snackbarService: SnackbarService,
    private headerService: HeaderService
  ) {
    this.initForm();
  }

  ngAfterViewInit(): void {
    this.focusCloseButton();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.populateForm();
    }
  }

  private focusCloseButton(): void {
    setTimeout(() => {
      this.closePanelBtn?.nativeElement?.focus();
    });
  }

  private initForm(): void {
    this.editForm = this.fb.group({
      stdPrice: [null, [Validators.min(0)]],
      serviceCode: ['', [Validators.maxLength(8)]]
    });
  }

  private populateForm(): void {
    if (!this.data) return;

    this.editModeValues = {
      productCode: this.data.productCode,
      productDesc: this.data.productDesc,
      productType: this.data.productType,
      invProductType: this.data.invProductType,
      outOfState: this.data.outOfStateFlag === 'Y' ? 'Yes' : 'No',
      returnable: this.data.returnable === 'Y' ? 'Yes' : 'No'
    };

    this.lastUpdated = this.data.lastModifiedDate
      ? `Last Modified: ${this.formatDate(this.data.lastModifiedDate)}`
      : '';

    this.originalValues = {
      stdPrice: this.data.stdPrice,
      serviceCode: this.data.serviceCode || ''
    };

    this.editForm.patchValue({
      stdPrice: this.data.stdPrice,
      serviceCode: this.data.serviceCode || ''
    });

    this.editForm.markAsPristine();
    this.editForm.markAsUntouched();
  }

  private formatDate(date: Date | string): string {
    if (!date) return '';
    const pst = moment.utc(date).utcOffset(-8);
    if (!pst.isValid()) return '';
    const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(pst.date()).padStart(2, '0');
    const month = MONTHS[pst.month()];
    const year = pst.year();
    const hours = String(pst.hours()).padStart(2, '0');
    const minutes = String(pst.minutes()).padStart(2, '0');
    return `${day}-${month}-${year}, ${hours}:${minutes} PST`;
  }

  get isFormValid(): boolean {
    if (!this.editForm.valid) return false;
    const current = this.editForm.value;
    const priceChanged = Number(current.stdPrice) !== Number(this.originalValues.stdPrice);
    const serviceCodeChanged = (current.serviceCode || '') !== this.originalValues.serviceCode;
    return priceChanged || serviceCodeChanged;
  }

  getPriceError(): string {
    const control = this.editForm.get('stdPrice');
    if (!control || !control.touched) return '';
    if (control.hasError('min')) return 'Price must be at least 0';
    return '';
  }

  getServiceCodeError(): string {
    const control = this.editForm.get('serviceCode');
    if (!control || !control.touched) return '';
    if (control.hasError('maxlength')) return 'Service code must not exceed 8 characters';
    return '';
  }

  onServiceCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const upper = input.value.toUpperCase();
    if (input.value !== upper) {
      this.editForm.get('serviceCode')?.setValue(upper, { emitEvent: false });
    }
  }

  onPriceKeypress(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const key = event.key;

    if (key === '-' || key === 'e' || key === 'E' || key === '+') {
      event.preventDefault();
      return;
    }

    if (key === '.' && value.includes('.')) {
      event.preventDefault();
      return;
    }

    if (value.includes('.')) {
      const decimals = value.split('.')[1];
      if (decimals && decimals.length >= 2 && key !== 'Backspace') {
        event.preventDefault();
        return;
      }
    }

    const integerPart = value.split('.')[0] || '';
    if (!value.includes('.') && key !== '.' && integerPart.length >= 7 && key !== 'Backspace') {
      event.preventDefault();
    }
  }

  onPricePaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') || '';
    if (!/^\d*\.?\d{0,2}$/.test(pastedText)) {
      event.preventDefault();
    }
  }

  onSave(): void {
    this.editForm.markAllAsTouched();
    if (!this.isFormValid || !this.data) return;

    this.isSaving = true;
    const formValue = this.editForm.value;
    const updateDto: UpdateProductServiceCodeDto = {
      stdPrice: formValue.stdPrice,
      serviceCode: formValue.serviceCode || ''
    };

    this.service.updateProductServiceCode(this.data.productCode, updateDto)
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.snackbarService.showSuccess(`Product Service Code ${this.data!.productCode} has been saved.`);
          this.saveSuccess.emit();
          this.closePanel.emit();
        },
        error: () => {
          this.isSaving = false;
        }
      });
  }

  onClearAll(): void {
    this.editForm.patchValue({
      stdPrice: null,
      serviceCode: ''
    });
    this.editForm.markAsDirty();
  }

  onCancel(): void {
    if (!this.hasUnsavedChanges()) {
      this.closePanel.emit();
      return;
    }

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      data: {
        title: 'Unsaved Changes',
        message: 'Some changes were not committed. Do you want to erase them?',
        confirmText: 'Yes',
        cancelText: 'No'
      } as ConfirmActionDialogData,
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.closePanel.emit();
      }
    });
  }

  private hasUnsavedChanges(): boolean {
    if (!this.editForm || !this.data) return false;
    const current = this.editForm.value;
    const priceChanged = Number(current.stdPrice) !== Number(this.originalValues.stdPrice);
    const serviceCodeChanged = (current.serviceCode || '') !== this.originalValues.serviceCode;
    return priceChanged || serviceCodeChanged;
  }
}
