import { Component, inject, signal, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { HeaderService } from '@shared/services/header.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { Moment } from 'moment';
import { RegularOrderApiService } from '../../services/regular-order-api.service';
import { CreateConsigneeDto } from '../../models/regular-order.model';

export interface EnterConsigneeDialogData {
  customerId: string;
}

@Component({
  selector: 'app-enter-consignee-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './enter-consignee-dialog.html',
  styleUrls: ['./enter-consignee-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnterConsigneeDialogComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `enter-consignee-${EnterConsigneeDialogComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  readonly data = inject<EnterConsigneeDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<EnterConsigneeDialogComponent>);
  private readonly fb = inject(FormBuilder);
  private readonly headerService = inject(HeaderService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly apiService = inject(RegularOrderApiService);
  private readonly destroy$ = new Subject<void>();

  consigneeForm!: FormGroup;
  minDate!: Moment;
  saving = signal(false);

  states = signal<{ code: string; description: string }[]>([]);
  filteredStates = signal<{ code: string; description: string }[]>([]);
  stateSearchCtrl = new FormControl('');

  ngOnInit(): void {
    const chapterOffset = this.headerService.chapterTimeZone();
    this.minDate = DateFieldValidationUtility.getMinDate(chapterOffset);

    this.consigneeForm = this.fb.group({
      consigneeId: ['', [Validators.required, Validators.maxLength(10)]],
      name: ['', [Validators.required, Validators.maxLength(50)]],
      shortName: ['', [Validators.maxLength(15)]],
      address1: ['', [Validators.maxLength(60)]],
      address2: ['', [Validators.maxLength(60)]],
      address3: ['', [Validators.maxLength(60)]],
      city: ['', [Validators.maxLength(30)]],
      state: [''],
      zip: ['', [Validators.maxLength(10)]],
      country: ['', [Validators.maxLength(30)]],
      phoneNo: ['', [Validators.maxLength(20)]],
      faxNo: ['', [Validators.maxLength(20)]],
      effDate: [null, [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator(chapterOffset)]],
      termDate: [null]
    }, {
      validators: DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')
    });

    this.stateSearchCtrl.valueChanges.pipe(
      debounceTime(200),
      takeUntil(this.destroy$)
    ).subscribe(search => {
      const s = (search ?? '').toLowerCase();
      this.filteredStates.set(
        this.states().filter(st => st.code.toLowerCase().includes(s) || st.description.toLowerCase().includes(s))
      );
    });
  }

  getEffectiveDateError(): string {
    return DateFieldValidationUtility.getEffectiveDateErrorMessage(
      this.consigneeForm.get('effDate')!,
      this.consigneeForm.errors
    );
  }

  getTerminationDateError(): string {
    return DateFieldValidationUtility.getTerminationDateErrorMessage(
      this.consigneeForm.get('termDate')!,
      this.consigneeForm.errors
    );
  }

  onSave(): void {
    if (this.consigneeForm.invalid) {
      this.consigneeForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formValue = this.consigneeForm.getRawValue();
    const dto: CreateConsigneeDto = {
      consigneeId: formValue.consigneeId?.trim(),
      name: formValue.name?.trim(),
      shortName: formValue.shortName?.trim() || undefined,
      address1: formValue.address1?.trim() || undefined,
      address2: formValue.address2?.trim() || undefined,
      address3: formValue.address3?.trim() || undefined,
      city: formValue.city?.trim() || undefined,
      state: formValue.state || undefined,
      zip: formValue.zip?.trim() || undefined,
      country: formValue.country?.trim() || undefined,
      phoneNo: formValue.phoneNo?.trim() || undefined,
      faxNo: formValue.faxNo?.trim() || undefined,
      effDate: formValue.effDate ? DateFieldValidationUtility.serializeDateForApi(formValue.effDate) ?? undefined : undefined,
      termDate: formValue.termDate ? DateFieldValidationUtility.serializeDateForApi(formValue.termDate) ?? undefined : undefined
    };

    this.apiService.createConsignee(this.data.customerId, dto).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogRef.close({ saved: true, consigneeId: dto.consigneeId });
      },
      error: () => {
        this.saving.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
