import { Component, OnInit, OnDestroy, ViewChild, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, timer, switchMap } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import moment, { Moment } from 'moment';

import { RegisterSpecialDonationRequestService } from '../register-special-donation-request.service';
import { LookupItem } from '../register-special-donation-request.models';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';

@Component({
  selector: 'app-add-request-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatStepperModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule,
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
  templateUrl: './add-request-dialog.html',
  styleUrls: ['./add-request-dialog.scss'],
})
export class AddRequestDialogComponent implements OnInit, OnDestroy {
  @ViewChild('stepper') stepper!: MatStepper;

  private fb = inject(FormBuilder);
  private service = inject(RegisterSpecialDonationRequestService);
  private dialogRef = inject(MatDialogRef<AddRequestDialogComponent>);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private chapterTimezoneService = inject(ChapterTimezoneService);
  private restoredData: any = inject(MAT_DIALOG_DATA, { optional: true });

  readonly today = computed<Moment>(() => {
    const chapterDate = this.chapterTimezoneService.chapterLocalDate();
    if (chapterDate && chapterDate.isValid()) {
      return chapterDate.clone().startOf('day');
    }
    return moment().startOf('day');
  });

  patientForm!: FormGroup;
  surgeryForm!: FormGroup;
  isSaving = false;
  generatedSurgId = '';
  warningMessage = '';
  patientFormData: any = null;

  patientTypes: LookupItem[] = [];
  surgeryTypes: LookupItem[] = [];
  productTypes: LookupItem[] = [];
  hospitals: LookupItem[] = [];
  consignees: LookupItem[] = [];
  physicians: LookupItem[] = [];
  hospitalConsigneeMismatch = false;

  sexOptions = [
    { code: 'M', description: 'Male' },
    { code: 'F', description: 'Female' },
  ];

  aboOptions: LookupItem[] = [];
  statusOptions: LookupItem[] = [];


  private destroy$ = new Subject<void>();

  readonly aboSearchControl = new FormControl('');
  readonly phySearchControl = new FormControl('');
  readonly hospitalSearchControl = new FormControl('');
  readonly shipSearchControl = new FormControl('');
  readonly surgTypeSearchControl = new FormControl('');

  private readonly aboSearch = signal('');
  private readonly phySearch = signal('');
  private readonly hospitalSearch = signal('');
  private readonly shipSearch = signal('');
  private readonly surgTypeSearch = signal('');

  private readonly aboSource = signal<LookupItem[]>([]);
  private readonly physiciansSource = signal<LookupItem[]>([]);
  private readonly hospitalsSource = signal<LookupItem[]>([]);
  private readonly consigneesSource = signal<LookupItem[]>([]);
  private readonly surgeryTypesSource = signal<LookupItem[]>([]);

  readonly filteredAbo = computed(() => {
    const search = this.aboSearch().toLowerCase();
    const items = this.aboSource();
    if (!search) return items;
    return items.filter(a => (a.code || '').toLowerCase().includes(search) || (a.description || '').toLowerCase().includes(search));
  });

  readonly filteredPhysicians = computed(() => {
    const search = this.phySearch().toLowerCase();
    const items = this.physiciansSource();
    if (!search) return items;
    return items.filter(p => (p.code || '').toLowerCase().includes(search) || (p.description || '').toLowerCase().includes(search));
  });

  readonly filteredHospitals = computed(() => {
    const search = this.hospitalSearch().toLowerCase();
    const items = this.hospitalsSource();
    if (!search) return items;
    return items.filter(h => (h.code || '').toLowerCase().includes(search) || (h.description || '').toLowerCase().includes(search));
  });

  readonly filteredConsignees = computed(() => {
    const search = this.shipSearch().toLowerCase();
    const items = this.consigneesSource();
    if (!search) return items;
    return items.filter(c => (c.code || '').toLowerCase().includes(search) || (c.description || '').toLowerCase().includes(search));
  });

  readonly filteredSurgeryTypes = computed(() => {
    const search = this.surgTypeSearch().toLowerCase();
    const items = this.surgeryTypesSource();
    if (!search) return items;
    return items.filter(s => (s.code || '').toLowerCase().includes(search) || (s.description || '').toLowerCase().includes(search));
  });

  ngOnInit(): void {
    this.initForms();
    this.loadLookups();
    this.restoreFromReturnState();

    this.aboSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.aboSearch.set(v || ''));
    this.phySearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.phySearch.set(v || ''));
    this.hospitalSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.hospitalSearch.set(v || ''));
    this.shipSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.shipSearch.set(v || ''));
    this.surgTypeSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.surgTypeSearch.set(v || ''));

    // FIX-21: Auto-uppercase for name fields
    this.patientForm.get('patLastName')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => {
      if (v !== v?.toUpperCase()) {
        this.patientForm.get('patLastName')?.setValue(v?.toUpperCase(), { emitEvent: false });
      }
    });
    this.patientForm.get('patFirstName')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => {
      if (v !== v?.toUpperCase()) {
        this.patientForm.get('patFirstName')?.setValue(v?.toUpperCase(), { emitEvent: false });
      }
    });

    this.surgeryForm.get('surgDate')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const surgDate = this.surgeryForm.get('surgDate')?.value;
      const dateNeededByCtrl = this.surgeryForm.get('dateNeededBy')!;
      if (surgDate) {
        dateNeededByCtrl.enable({ emitEvent: false });
      } else {
        dateNeededByCtrl.disable({ emitEvent: false });
        dateNeededByCtrl.setValue(null, { emitEvent: false });
      }
      this.validateDateNeededBy();
    });
    this.surgeryForm.get('dateNeededBy')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.validateDateNeededBy();
      this.checkDateNeededByWarning();
    });

    this.surgeryForm.get('dateNeededBy')!.disable({ emitEvent: false });

    if (!this.restoredData?.generatedSurgId) {
      this.service.generateSurgeryId().pipe(takeUntil(this.destroy$)).subscribe((res) => {
        this.generatedSurgId = res?.data?.[0] || '';
      });
    }
  }

  private initForms(): void {
    this.patientForm = this.fb.group({
      patLastName: ['', [Validators.required, Validators.maxLength(30)]],
      patFirstName: ['', [Validators.required, Validators.maxLength(25)]],
      patInitials: ['', [Validators.maxLength(3)]],
      dob: [null],
      sex: ['', Validators.required],
      aboType: [''],
      patType: ['', Validators.required],
      contactPhoneNo: ['', [Validators.maxLength(10), Validators.pattern(/^\d*$/)]],
      intlContactPhoneNo: ['', [Validators.maxLength(20), Validators.pattern(/^\d*$/)]],
      status: ['A', Validators.required],
      comments: ['', [Validators.maxLength(240)]],
    });

    this.surgeryForm = this.fb.group({
      surgDate: [null, Validators.required],
      phyId: ['', Validators.required],
      phyAuthDate: [null],
      hospitalId: [''],
      shipId: ['', Validators.required],
      unitsRequired: ['', [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
      surgType: [''],
      dateNeededBy: [null],
      closedDate: [null],
      comments: ['', [Validators.maxLength(240)]],
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadLookups(): void {
    this.service.getAboTypes().pipe(takeUntil(this.destroy$)).subscribe((r) => {
      this.aboOptions = r?.data || [];
      this.aboSource.set(this.aboOptions);
    });
    this.service.getPatientStatuses().pipe(takeUntil(this.destroy$)).subscribe((r) => (this.statusOptions = r?.data || []));
    this.service.getPatientTypes().pipe(takeUntil(this.destroy$)).subscribe((r) => (this.patientTypes = r?.data || []));
    this.service.getSurgeryTypes().pipe(takeUntil(this.destroy$)).subscribe((r) => {
      this.surgeryTypes = r?.data || [];
      this.surgeryTypesSource.set(this.surgeryTypes);
    });
    this.service.getProductTypes().pipe(takeUntil(this.destroy$)).subscribe((r) => (this.productTypes = r?.data || []));
    this.service.getHospitals().pipe(takeUntil(this.destroy$)).subscribe((r) => {
      this.hospitals = r?.data || [];
      this.hospitalsSource.set(this.hospitals);
    });
    this.service.getShipLocations().pipe(takeUntil(this.destroy$)).subscribe((r) => {
      const items = (r?.data || r || []);
      this.consignees = items.map((item: any) => ({
        code: item.shipId || item.consigneeId || item.code || item.value,
        description: item.shipLocnName || item.name || item.description || item.label,
      }));
      this.consigneesSource.set(this.consignees);
    });
    this.loadPhysicians();
  }

  private loadPhysicians(retryCount = 0): void {
    this.service.getPhysicians().pipe(takeUntil(this.destroy$)).subscribe((r) => {
      const items = r?.data || [];
      this.physicians = items.map((p: any) => ({ code: p.phyId, description: `${p.lastName || ''}${p.firstName ? ', ' + p.firstName : ''}` }));
      this.physiciansSource.set(this.physicians);
      const newId = this.restoredData?.newPhysicianId;
      if (newId) {
        const found = this.physicians.some((p: any) => p.code === newId);
        if (found) {
          this.surgeryForm.get('phyId')?.setValue(newId);
        } else if (retryCount < 2) {
          timer(800).pipe(takeUntil(this.destroy$), switchMap(() => {
            this.loadPhysicians(retryCount + 1);
            return [];
          })).subscribe();
        }
      }
    });
  }

  private restoreFromReturnState(): void {
    if (!this.restoredData) return;
    const { patientFormValues, surgeryFormValues, patientFormData, generatedSurgId, newPhysicianId } = this.restoredData;
    if (patientFormValues) {
      this.deserializeDateFields(patientFormValues, ['dob']);
      this.patientForm.patchValue(patientFormValues, { emitEvent: false });
    }
    if (surgeryFormValues) {
      this.deserializeDateFields(surgeryFormValues, ['surgDate', 'phyAuthDate', 'dateNeededBy', 'closedDate']);
      this.surgeryForm.patchValue(surgeryFormValues, { emitEvent: false });
      if (surgeryFormValues.surgDate) {
        this.surgeryForm.get('dateNeededBy')?.enable({ emitEvent: false });
      }
    }
    if (patientFormData) {
      this.patientFormData = patientFormData;
    }
    if (generatedSurgId) {
      this.generatedSurgId = generatedSurgId;
    }
    setTimeout(() => this.stepper?.next());
  }

  onDropdownClosed(control: FormControl): void {
    control.setValue('');
  }

  onHospitalChange(hospitalId: string): void {
    this.checkConsigneeHospitalMatch();
  }

  private checkConsigneeHospitalMatch(): void {
    const hospitalId = this.surgeryForm.get('hospitalId')?.value;
    const shipId = this.surgeryForm.get('shipId')?.value;
    if (!shipId) {
      this.hospitalConsigneeMismatch = false;
      return;
    }
    if (!hospitalId) {
      this.hospitalConsigneeMismatch = true;
      this.showConsigneeMismatchWarning();
      return;
    }
    this.service.getConsignees(hospitalId).pipe(takeUntil(this.destroy$)).subscribe((r) => {
      const hospitalConsignees = r?.data || [];
      this.hospitalConsigneeMismatch = !hospitalConsignees.some(
        (c: any) => (c.shipId || c.consigneeId || c.code) === shipId
      );
      if (this.hospitalConsigneeMismatch) {
        this.showConsigneeMismatchWarning();
      }
    });
  }

  private showConsigneeMismatchWarning(): void {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      data: {
        title: 'Consignee Mismatch',
        message: 'This consignee does not belong to this hospital. Do you want to proceed?',
        confirmText: 'Yes',
        cancelText: 'No',
      } as ConfirmActionDialogData,
      width: '400px',
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(confirmed => {
      if (!confirmed) {
        this.surgeryForm.get('shipId')?.setValue('', { emitEvent: false });
        this.hospitalConsigneeMismatch = false;
      }
    });
  }

  onShipIdChange(): void {
    this.checkConsigneeHospitalMatch();
  }

  getPhysicianName(): string {
    const phyId = this.surgeryForm.get('phyId')?.value;
    if (!phyId) return '-';
    const physician = this.physicians.find((p) => p.code === phyId);
    return physician?.description || '-';
  }

  getHospitalName(): string {
    const hospitalId = this.surgeryForm.get('hospitalId')?.value;
    if (!hospitalId) return '-';
    const hospital = this.hospitals.find((h) => h.code === hospitalId);
    return hospital?.description || '-';
  }

  getShipLocationName(): string {
    const shipId = this.surgeryForm.get('shipId')?.value;
    if (!shipId) return '-';
    const consignee = this.consignees.find((c) => c.code === shipId);
    return consignee?.description || '-';
  }

  getSurgeryTypeDescription(): string {
    const surgType = this.surgeryForm.get('surgType')?.value;
    if (!surgType) return '-';
    const type = this.surgeryTypes.find((t) => t.code === surgType);
    return type?.description || '-';
  }

  get surgeryDay(): string {
    const date = this.surgeryForm.get('surgDate')?.value;
    if (!date) return '';
    const m = moment.isMoment(date) ? date : moment(date);
    return m.isValid() ? m.format('dddd') : '';
  }

  onSavePatientAndSurgery(): void {
    if (this.surgeryForm.invalid) {
      this.surgeryForm.markAllAsTouched();
      return;
    }

    if (!this.patientFormData) {
      this.warningMessage = 'Patient data is missing. Please go back and complete Step 1.';
      return;
    }

    this.isSaving = true;

    const surgeryData = { ...this.surgeryForm.value };
    if (surgeryData.surgDate) surgeryData.surgDate = this.formatDate(surgeryData.surgDate);
    if (surgeryData.phyAuthDate) surgeryData.phyAuthDate = this.formatDate(surgeryData.phyAuthDate);
    if (surgeryData.dateNeededBy) surgeryData.dateNeededBy = this.formatDate(surgeryData.dateNeededBy);
    if (surgeryData.closedDate) surgeryData.closedDate = this.formatDate(surgeryData.closedDate);

    const dto = {
      patient: this.patientFormData,
      surgery: surgeryData,
    };

    this.service.createPatientWithSurgery(dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isSaving = false;
        this.showSnackbar('Request created successfully');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isSaving = false;
        this.showSnackbar(HttpErrorHandler.extractErrorMessage(err, 'Failed to create special donation request'));
      },
    });
  }

  get isFirstStep(): boolean {
    return !this.stepper || this.stepper.selectedIndex === 0;
  }

  onNext(): void {
    if (this.patientForm.valid) {
      this.patientFormData = { ...this.patientForm.value };
      // Map combined phone to 'phone' property for BE SplitPhone logic
      this.patientFormData.phone = this.patientFormData.contactPhoneNo || null;
      delete this.patientFormData.contactPhoneNo;
      if (this.patientFormData.dob) {
        this.patientFormData.dob = this.formatDate(this.patientFormData.dob);
      }
      this.stepper.next();
    } else {
      this.patientForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  openNewPhysician(): void {
    const returnUrl = '/donor-functions/special-donations/register-special-donation-request';
    const patientFormValues = this.serializeFormValues(this.patientForm.getRawValue());
    const surgeryFormValues = this.serializeFormValues(this.surgeryForm.getRawValue());
    this.router.navigate(['/donor-functions/maintain-physician-list'], {
      state: {
        returnUrl,
        returnAction: 'reopen-add-request-dialog',
        addRequestDialogData: {
          patientFormValues,
          surgeryFormValues,
          patientFormData: this.patientFormData,
          generatedSurgId: this.generatedSurgId,
        }
      }
    });
    this.dialogRef.close(false);
  }

  private serializeFormValues(values: any): any {
    const result: any = {};
    for (const key of Object.keys(values)) {
      const v = values[key];
      result[key] = moment.isMoment(v) ? v.toISOString() : v;
    }
    return result;
  }

  private deserializeDateFields(values: any, fields: string[]): void {
    for (const key of fields) {
      if (values[key] && typeof values[key] === 'string') {
        values[key] = moment(values[key]);
      }
    }
  }

  private validateDateNeededBy(): void {
    const dateNeededByCtrl = this.surgeryForm.get('dateNeededBy');
    const surgDate = this.surgeryForm.get('surgDate')?.value;
    const dateNeededBy = dateNeededByCtrl?.value;
    if (dateNeededBy && surgDate) {
      const surgMoment = moment.isMoment(surgDate) ? surgDate : moment(surgDate);
      const neededMoment = moment.isMoment(dateNeededBy) ? dateNeededBy : moment(dateNeededBy);
      if (neededMoment.clone().startOf('day').isAfter(surgMoment.clone().startOf('day'))) {
        dateNeededByCtrl?.setErrors({ ...dateNeededByCtrl.errors, dateNeededByAfterSurgDate: true });
      } else {
        const errors = { ...dateNeededByCtrl?.errors };
        delete errors['dateNeededByAfterSurgDate'];
        dateNeededByCtrl?.setErrors(Object.keys(errors).length ? errors : null);
      }
    }
  }

  private checkDateNeededByWarning(): void {
    const dateNeededBy = this.surgeryForm.get('dateNeededBy')?.value;
    const surgDate = this.surgeryForm.get('surgDate')?.value;
    if (dateNeededBy && surgDate) {
      const surgMoment = moment.isMoment(surgDate) ? surgDate : moment(surgDate);
      const neededMoment = moment.isMoment(dateNeededBy) ? dateNeededBy : moment(dateNeededBy);
      const diffDays = surgMoment.clone().startOf('day').diff(neededMoment.clone().startOf('day'), 'days');
      if (diffDays > 42) {
        this.dialog.open(ConfirmActionDialogComponent, {
          data: {
            title: 'Warning',
            message: 'Date Needed by is more than 42 days old from Surgery Date.',
            confirmText: 'OK',
          } as ConfirmActionDialogData,
          width: '400px',
        });
      }
    }
  }

  onDateInput(event: Event, controlName: string, form: FormGroup): void {
    const input = (event.target as HTMLInputElement).value;
    const control = form.get(controlName);
    if (!control) return;
    control.markAsTouched();
    control.markAsDirty();
    if (input?.trim() && !control.value) {
      control.setErrors({ ...control.errors, invalidDate: true });
    }
  }

  private formatDate(date: any): string {
    if (!date) return '';
    const m = moment.isMoment(date) ? date : moment(date);
    return m.isValid() ? m.format('YYYY-MM-DD') : '';
  }

  private showSnackbar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }
}
