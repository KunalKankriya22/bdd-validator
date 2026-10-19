import { Component, OnInit, OnDestroy, Inject, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Subject, takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import moment, { Moment } from 'moment';

import { RegisterSpecialDonationRequestService } from '../register-special-donation-request.service';
import { LookupItem } from '../register-special-donation-request.models';

@Component({
  selector: 'app-edit-patient-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule,
    MatIconModule, MatSnackBarModule, NgxMatSelectSearchModule,
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
  templateUrl: './edit-patient-dialog.html',
  styleUrls: ['../add-request-dialog/add-request-dialog.scss', './edit-patient-dialog.scss'],
})
export class EditPatientDialogComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private service = inject(RegisterSpecialDonationRequestService);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();
  private chapterTimezoneService = inject(ChapterTimezoneService);

  readonly today = computed<Moment>(() => {
    const chapterDate = this.chapterTimezoneService.chapterLocalDate();
    if (chapterDate && chapterDate.isValid()) {
      return chapterDate.clone().startOf('day');
    }
    return moment().startOf('day');
  });

  form!: FormGroup;
  isSaving = false;
  patId = '';
  patientTypes: LookupItem[] = [];

  sexOptions = [
    { code: 'M', description: 'Male' },
    { code: 'F', description: 'Female' },
  ];

  aboOptions: LookupItem[] = [];
  statusOptions: LookupItem[] = [];

  readonly aboSearchControl = new FormControl('');
  private readonly aboSearch = signal('');
  private readonly aboSource = signal<LookupItem[]>([]);
  readonly filteredAbo = computed(() => {
    const search = this.aboSearch().toLowerCase();
    const items = this.aboSource();
    if (!search) return items;
    return items.filter(a => (a.code || '').toLowerCase().includes(search) || (a.description || '').toLowerCase().includes(search));
  });

  constructor(
    private dialogRef: MatDialogRef<EditPatientDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { patId: string },
  ) {
    this.patId = data.patId;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      patLastName: ['', [Validators.required, Validators.maxLength(30)]],
      patFirstName: ['', [Validators.required, Validators.maxLength(25)]],
      patInitials: ['', [Validators.maxLength(3)]],
      dob: [null],
      sex: ['', Validators.required],
      aboType: [''],
      patType: ['', Validators.required],
      contactPhoneNo: ['', [Validators.maxLength(10), Validators.pattern(/^\d*$/)]],
      intlContactPhoneNo: ['', [Validators.maxLength(20), Validators.pattern(/^\d*$/)]],
      status: ['', Validators.required],
      comments: ['', [Validators.maxLength(240)]],
    });

    this.service.getPatientTypes().pipe(takeUntil(this.destroy$)).subscribe((r) => (this.patientTypes = r?.data || []));
    this.service.getAboTypes().pipe(takeUntil(this.destroy$)).subscribe((r) => {
      this.aboOptions = r?.data || [];
      this.aboSource.set(this.aboOptions);
    });
    this.aboSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.aboSearch.set(v || ''));
    this.service.getPatientStatuses().pipe(takeUntil(this.destroy$)).subscribe((r) => (this.statusOptions = r?.data || []));

    // FIX-21: Auto-uppercase for name fields
    this.form.get('patLastName')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => {
      if (v !== v?.toUpperCase()) {
        this.form.get('patLastName')?.setValue(v?.toUpperCase(), { emitEvent: false });
      }
    });
    this.form.get('patFirstName')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => {
      if (v !== v?.toUpperCase()) {
        this.form.get('patFirstName')?.setValue(v?.toUpperCase(), { emitEvent: false });
      }
    });

    // FIX-11: International phone clears domestic phone fields
    this.form.get('intlContactPhoneNo')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => {
      if (v) {
        this.form.patchValue({ contactPhoneNo: null }, { emitEvent: false });
      }
    });

    this.loadPatient();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPatient(): void {
    this.service.getPatientDetail(this.patId).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      const p = res?.item || res?.data?.[0] || null;
      if (p) {
        this.form.patchValue({
          patLastName: p.patLastName,
          patFirstName: p.patFirstName,
          patInitials: p.patInitials,
          dob: p.dob ? new Date(p.dob) : null,
          sex: p.sex,
          aboType: p.aboType,
          patType: p.patType,
          contactPhoneNo: (p.contactAreaCode || '') + (p.contactPhoneNo || '') || null,
          intlContactPhoneNo: p.intlContactPhoneNo,
          status: p.status,
          comments: p.comments,
        });
      }
    });
  }

  onSave(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving = true;
    const data = { ...this.form.value };
    // Map combined phone to 'phone' property for BE SplitPhone logic
    data.phone = data.contactPhoneNo || null;
    delete data.contactPhoneNo;
    if (data.dob) {
      const m = moment.isMoment(data.dob) ? data.dob : moment(data.dob);
      data.dob = m.format('YYYY-MM-DD');
    }

    this.service.updatePatient(this.patId, data).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isSaving = false;
        this.showSnackbar('Patient updated successfully');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isSaving = false;
        this.showSnackbar(HttpErrorHandler.extractErrorMessage(err, 'Failed to update patient'));
      },
    });
  }

  onDateInput(event: Event, controlName: string): void {
    const input = (event.target as HTMLInputElement).value;
    const control = this.form.get(controlName);
    if (!control) return;
    control.markAsTouched();
    control.markAsDirty();
    if (input?.trim() && !control.value) {
      control.setErrors({ ...control.errors, invalidDate: true });
    }
  }

  onDropdownClosed(control: FormControl): void {
    control.setValue('');
  }

  onCancel(): void { this.dialogRef.close(false); }

  private showSnackbar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }
}
