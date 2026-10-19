import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { signal, computed } from '@angular/core';

import { RegionalTestingContractApiService } from '../../services/regional-testing-contract-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';

export interface RgAddressDialogData {
  address: any | null;
  contractId: string;
}

interface StateCode {
  code: string;
  description: string;
}

@Component({
  selector: 'app-rg-address-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    NgxMatSelectSearchModule,
  ],
  templateUrl: './rg-address-dialog.html',
  styleUrls: ['./rg-address-dialog.scss'],
})
export class RgAddressDialogComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<RgAddressDialogComponent>);
  readonly data = inject<RgAddressDialogData>(MAT_DIALOG_DATA);
  private readonly apiService = inject(RegionalTestingContractApiService);
  private readonly snackbarService = inject(SnackbarService);
  isSaving = false;

  addressForm!: FormGroup;
  readonly stateCodes = signal<StateCode[]>([]);
  readonly stateSearchControl = new FormControl('');
  private readonly stateSearch = signal('');
  readonly filteredStates = computed(() => {
    const search = (this.stateSearch() || '').toLowerCase();
    const items = this.stateCodes();
    if (!search) return items;
    return items.filter(s =>
      s.code.toLowerCase().includes(search) ||
      s.description.toLowerCase().includes(search)
    );
  });

  constructor() {
    this.buildForm();
    this.loadStateCodes();
    if (this.data.address) {
      this.patchForm(this.data.address);
    }

    // Subscribe to state search
    this.stateSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.stateSearch.set(value || ''));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForm(): void {
    this.addressForm = this.fb.group({
      intFlag: [false],
      addr1: ['', [Validators.required, Validators.maxLength(50)]],
      addr2: ['', [Validators.maxLength(50)]],
      addr3: ['', [Validators.maxLength(50)]],
      city: ['', [Validators.required, Validators.maxLength(75)]],
      stateCode: [''],
      zip: ['', [Validators.required, Validators.maxLength(9)]],
      country: ['', [Validators.required, Validators.maxLength(15)]],
      phoneNumber: ['', [Validators.maxLength(10)]],
      intPhoneNumber: ['', [Validators.maxLength(15)]],
      telexNumber: ['', [Validators.maxLength(15)]],
      faxNumber: ['', [Validators.maxLength(10)]],
    });

    this.addressForm.get('intFlag')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(isInternational => {
      const stateCtrl = this.addressForm.get('stateCode');
      if (isInternational) {
        stateCtrl?.clearValidators();
      } else {
        stateCtrl?.setValidators([Validators.required]);
      }
      stateCtrl?.updateValueAndValidity({ emitEvent: false });
    });
  }

  private patchForm(address: any): void {
    this.addressForm.patchValue({
      intFlag: address.intFlag === 'Y',
      addr1: address.addr1 ?? '',
      addr2: address.addr2 ?? '',
      addr3: address.addr3 ?? '',
      city: address.city ?? '',
      stateCode: address.stateCode ?? '',
      zip: address.zip ?? '',
      country: address.country ?? '',
      phoneNumber: address.phoneNumber ?? '',
      intPhoneNumber: address.intPhoneNumber ?? '',
      telexNumber: address.telexNumber ?? '',
      faxNumber: address.faxNumber ?? '',
    });

    if (address.intFlag !== 'Y') {
      this.addressForm.get('stateCode')?.setValidators([Validators.required]);
      this.addressForm.get('stateCode')?.updateValueAndValidity({ emitEvent: false });
    }
  }

  private loadStateCodes(): void {
    this.apiService.getStateCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: codes => this.stateCodes.set(codes),
        error: () => this.stateCodes.set([]),
      });
  }

  onCancel(): void {
    this.dialogRef.close(undefined);
  }

  onReset(): void {
    if (this.data.address) {
      this.patchForm(this.data.address);
    } else {
      this.addressForm.reset({ intFlag: false });
    }
    this.addressForm.markAsPristine();
    this.addressForm.markAsUntouched();
  }

  onApply(): void {
    if (this.addressForm.invalid) return;

    const v = this.addressForm.getRawValue();
    const address: any = {
      addressId: this.data.address?.addressId ?? 0,
      addr1: (v.addr1 || '').trim(),
      addr2: (v.addr2 || '').trim() || null,
      addr3: (v.addr3 || '').trim() || null,
      city: (v.city || '').trim(),
      stateCode: v.stateCode || null,
      zip: (v.zip || '').trim(),
      country: (v.country || '').trim(),
      phoneNumber: (v.phoneNumber || '').trim() || null,
      intPhoneNumber: (v.intPhoneNumber || '').trim() || null,
      telexNumber: (v.telexNumber || '').trim() || null,
      faxNumber: (v.faxNumber || '').trim() || null,
      intFlag: v.intFlag ? 'Y' : 'N',
    };

    // Just return the address data without saving
    // It will be saved as part of the main contract save
    this.snackbarService.showSuccess('Address details updated');
    this.dialogRef.close(address);
  }
}
