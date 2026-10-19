import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';

import {
  AlternateDemographicsDialogData,
  AlternateDemographicsDialogResult,
} from '../../models/donor-registration.model';

@Component({
  selector: 'app-alternate-demographics-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatIconModule,
    MatRadioModule,
  ],
  templateUrl: './alternate-demographics-dialog.html',
  styleUrl: './alternate-demographics-dialog.scss',
})
export class AlternateDemographicsDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AlternateDemographicsDialog>);
  readonly data: AlternateDemographicsDialogData = inject(MAT_DIALOG_DATA);

  activeTab = signal<'local' | 'international'>(this.data.mode ?? 'local');

  localForm!: FormGroup;
  internationalForm!: FormGroup;
  phoneForm!: FormGroup;

  constructor() {
    this.initForms();
  }

  private initForms(): void {
    const local = this.data.localAddress;
    this.localForm = this.fb.group({
      streetName: [local?.streetName ?? ''],
      suiteApt: [local?.suiteApt ?? ''],
      city: [local?.city ?? ''],
      floor: [local?.floor ?? ''],
      zip: [local?.zip ?? ''],
      country: [local?.country ?? ''],
    });

    const intl = this.data.internationalAddress;
    this.internationalForm = this.fb.group({
      address1: [intl?.address1 ?? ''],
      address2: [intl?.address2 ?? ''],
      address3: [intl?.address3 ?? ''],
      address4: [intl?.address4 ?? ''],
      city: [intl?.city ?? ''],
      country: [intl?.country ?? ''],
      postalCode: [intl?.postalCode ?? ''],
    });

    const phone = this.data.phoneInfo;
    this.phoneForm = this.fb.group({
      mobilePhone: [phone?.mobilePhone ?? ''],
      otherContact: [phone?.otherContact ?? ''],
      alternateIntlPhone: [phone?.alternateIntlPhone ?? ''],
      preferredContact: [phone?.preferredContact ?? ''],
    });
  }

  onTabChange(index: number): void {
    this.activeTab.set(index === 0 ? 'local' : 'international');
  }

  onApply(): void {
    this.dialogRef.close({
      action: 'apply',
      data: {
        localAddress: this.localForm.getRawValue(),
        internationalAddress: this.internationalForm.getRawValue(),
        phoneInfo: this.phoneForm.getRawValue(),
        mode: this.activeTab(),
      },
    } as AlternateDemographicsDialogResult);
  }

  onClear(): void {
    this.localForm.reset();
    this.internationalForm.reset();
    this.phoneForm.reset();
  }

  onCancel(): void {
    this.dialogRef.close({ action: 'cancel' } as AlternateDemographicsDialogResult);
  }
}
