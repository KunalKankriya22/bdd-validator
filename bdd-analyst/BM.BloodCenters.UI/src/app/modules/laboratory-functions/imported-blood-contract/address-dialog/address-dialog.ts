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

import { ImportedBloodContractService } from '../imported-blood-contract.service';
import { SnackbarService } from '../../../../shared/services/snackbar.service';
import { AddressModel, CodeDescription, UpdateContractRequest } from '../imported-blood-contract.model';

export interface AddressDialogData {
  address: AddressModel | null;
  contractId: string;
  contractType: string;
  currentContract: any;
}

@Component({
  selector: 'app-address-dialog',
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
  templateUrl: './address-dialog.html',
  styleUrls: ['./address-dialog.scss'],
})
export class AddressDialogComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AddressDialogComponent>);
  readonly data = inject<AddressDialogData>(MAT_DIALOG_DATA);
  private readonly service = inject(ImportedBloodContractService);
  private readonly snackbarService = inject(SnackbarService);
  isSaving = false;

  addressForm!: FormGroup;

  readonly stateCodes = signal<CodeDescription[]>([]);
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

  readonly countries = signal<CodeDescription[]>([]);
  readonly countrySearchControl = new FormControl('');
  private readonly countrySearch = signal('');
  readonly filteredCountries = computed(() => {
    const search = (this.countrySearch() || '').toLowerCase();
    const items = this.countries();
    if (!search) return items;
    return items.filter(c =>
      c.code.toLowerCase().includes(search) ||
      c.description.toLowerCase().includes(search)
    );
  });

  constructor() {
    this.buildForm();
    this.loadStateCodes();
    this.loadCountries();
    if (this.data.address) {
      this.patchForm(this.data.address);
    }
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
      zip: ['', [Validators.required, Validators.maxLength(10)]],
      country: ['', [Validators.required]],
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

  private patchForm(address: AddressModel): void {
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
    this.service.getStateCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: codes => this.stateCodes.set(codes),
        error: () => this.stateCodes.set([]),
      });
  }

  private loadCountries(): void {
    this.service.getCountries()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: countries => this.countries.set(countries),
        error: () => this.countries.set([]),
      });
  }

  onStateSearchChange(value: string): void {
    this.stateSearch.set(value);
  }

  onCountrySearchChange(value: string): void {
    this.countrySearch.set(value);
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
    const address: AddressModel = {
      addressId: this.data.address?.addressId ?? 0,
      addr1: (v.addr1 || '').trim(),
      addr2: (v.addr2 || '').trim() || undefined,
      addr3: (v.addr3 || '').trim() || undefined,
      city: (v.city || '').trim(),
      stateCode: v.stateCode || undefined,
      zip: (v.zip || '').trim(),
      country: (v.country || '').trim(),
      phoneNumber: (v.phoneNumber || '').trim() || undefined,
      intPhoneNumber: (v.intPhoneNumber || '').trim() || undefined,
      telexNumber: (v.telexNumber || '').trim() || undefined,
      faxNumber: (v.faxNumber || '').trim() || undefined,
      intFlag: v.intFlag ? 'Y' : 'N',
    };

    const c = this.data.currentContract;
    const request: UpdateContractRequest = {
      company: c?.company ?? '',
      barCodeProtocol: c?.barCodeProtocol ?? '',
      unitIdPattern: c?.unitIdPattern,
      ediInputInd: c?.ediInputInd,
      resultOutputInd: c?.resultOutputInd,
      confirmTestFlag: c?.confirmTestFlag,
      effDate: c?.effDate,
      termDate: c?.termDate,
      address: address,
    };

    this.isSaving = true;
    this.service.update(this.data.contractId, this.data.contractType, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.isSaving = false;
          if (response.success) {
            this.snackbarService.showSuccess('Address saved successfully');
            this.dialogRef.close(address);
          }
        },
        error: () => { this.isSaving = false; },
      });
  }
}
